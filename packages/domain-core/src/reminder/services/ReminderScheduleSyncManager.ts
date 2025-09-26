import { eventBus } from '@dailyuse/utils';
import { ReminderScheduleIntegrationService } from './ReminderScheduleIntegrationService';
import type { ReminderContracts } from '@dailyuse/contracts';

/**
 * Reminder-Schedule 同步管理器
 *
 * 职责：
 * 1. 管理 ReminderTemplate 状态变化的优雅同步
 * 2. 提供错误处理和状态恢复策略
 * 3. 监控同步状态和性能指标
 * 4. 处理批量同步和增量同步
 */
export class ReminderScheduleSyncManager {
  private static instance: ReminderScheduleSyncManager;
  private integrationService: ReminderScheduleIntegrationService;

  // 同步状态管理
  private syncQueue: Map<string, PendingSyncTask> = new Map();
  private syncInProgress: Set<string> = new Set();
  private syncHistory: Map<string, SyncResult[]> = new Map();
  private retryTimeouts: Map<string, any> = new Map();

  // 配置
  private readonly config = {
    maxRetries: 3,
    retryDelayMs: 2000,
    batchSize: 10,
    healthCheckIntervalMs: 60000, // 1分钟
    syncTimeoutMs: 30000, // 30秒
  };

  private constructor() {
    this.integrationService = ReminderScheduleIntegrationService.getInstance();
    this.startHealthCheck();
  }

  static getInstance(): ReminderScheduleSyncManager {
    if (!ReminderScheduleSyncManager.instance) {
      ReminderScheduleSyncManager.instance = new ReminderScheduleSyncManager();
    }
    return ReminderScheduleSyncManager.instance;
  }

  // ===== 同步队列管理 =====

  /**
   * 添加同步任务到队列
   */
  async enqueueSync(params: {
    templateUuid: string;
    operation: 'create' | 'update' | 'delete';
    template?: ReminderContracts.IReminderTemplate;
    accountUuid: string;
    priority?: 'high' | 'normal' | 'low';
    reason?: string;
  }): Promise<string> {
    const taskId = `${params.templateUuid}-${Date.now()}`;

    const syncTask: PendingSyncTask = {
      taskId,
      templateUuid: params.templateUuid,
      operation: params.operation,
      template: params.template,
      accountUuid: params.accountUuid,
      priority: params.priority || 'normal',
      reason: params.reason,
      createdAt: new Date(),
      retryCount: 0,
      status: 'pending',
    };

    this.syncQueue.set(taskId, syncTask);

    console.log(`📝 [SyncManager] 同步任务已入队: ${taskId} (${params.operation})`);

    // 立即尝试执行（如果不是高负载状态）
    if (!this.isHighLoad()) {
      setTimeout(() => this.processSyncQueue(), 0);
    }

    return taskId;
  }

  /**
   * 处理同步队列
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress.size >= this.config.batchSize) {
      return; // 达到并发限制
    }

    // 按优先级和创建时间排序
    const pendingTasks = Array.from(this.syncQueue.values())
      .filter((task) => task.status === 'pending')
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    const tasksToProcess = pendingTasks.slice(0, this.config.batchSize - this.syncInProgress.size);

    for (const task of tasksToProcess) {
      this.executeSync(task);
    }
  }

  /**
   * 执行单个同步任务
   */
  private async executeSync(task: PendingSyncTask): Promise<void> {
    this.syncInProgress.add(task.taskId);
    task.status = 'processing';
    task.startedAt = new Date();

    console.log(`🔄 [SyncManager] 开始执行同步任务: ${task.taskId}`);

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('同步超时')), this.config.syncTimeoutMs);
      });

      const syncPromise = this.performSync(task);
      const result = await Promise.race([syncPromise, timeoutPromise]);

      // 成功处理
      task.status = 'completed';
      task.completedAt = new Date();

      this.recordSyncResult(task, { success: true, result });
      this.syncQueue.delete(task.taskId);

      console.log(`✅ [SyncManager] 同步任务完成: ${task.taskId}`);

      // 发布成功事件
      eventBus.emit('reminder-schedule:sync-success', {
        taskId: task.taskId,
        templateUuid: task.templateUuid,
        operation: task.operation,
        duration: task.completedAt!.getTime() - task.startedAt!.getTime(),
      });
    } catch (error) {
      await this.handleSyncError(task, error);
    } finally {
      this.syncInProgress.delete(task.taskId);

      // 继续处理队列中的其他任务
      setTimeout(() => this.processSyncQueue(), 0);
    }
  }

  /**
   * 执行实际的同步操作
   */
  private async performSync(task: PendingSyncTask): Promise<any> {
    switch (task.operation) {
      case 'create':
        if (!task.template) {
          throw new Error('创建操作需要模板数据');
        }
        return await this.integrationService.createScheduleForTemplate({
          template: task.template,
          accountUuid: task.accountUuid,
        });

      case 'update':
        if (!task.template) {
          throw new Error('更新操作需要模板数据');
        }
        // 先取消再重新创建
        await this.integrationService.cancelScheduleForTemplate({
          templateUuid: task.templateUuid,
          accountUuid: task.accountUuid,
        });

        if (task.template.enabled) {
          return await this.integrationService.createScheduleForTemplate({
            template: task.template,
            accountUuid: task.accountUuid,
          });
        }
        return { success: true, message: '模板已禁用，无需创建调度' };

      case 'delete':
        return await this.integrationService.cancelScheduleForTemplate({
          templateUuid: task.templateUuid,
          accountUuid: task.accountUuid,
        });

      default:
        throw new Error(`不支持的操作类型: ${task.operation}`);
    }
  }

  /**
   * 处理同步错误
   */
  private async handleSyncError(task: PendingSyncTask, error: any): Promise<void> {
    task.retryCount++;
    task.lastError = error.message || '未知错误';

    console.error(`❌ [SyncManager] 同步任务失败: ${task.taskId}, 错误: ${task.lastError}`);

    if (task.retryCount < this.config.maxRetries) {
      // 重试
      task.status = 'retrying';
      const delay = this.calculateRetryDelay(task.retryCount);

      console.log(
        `🔄 [SyncManager] 将在 ${delay}ms 后重试: ${task.taskId} (第${task.retryCount}次重试)`,
      );

      const timeout = setTimeout(() => {
        this.retryTimeouts.delete(task.taskId);
        task.status = 'pending';
        setTimeout(() => this.processSyncQueue(), 0);
      }, delay);

      this.retryTimeouts.set(task.taskId, timeout);
    } else {
      // 重试次数已用尽，标记为失败
      task.status = 'failed';
      task.failedAt = new Date();

      this.recordSyncResult(task, {
        success: false,
        error: task.lastError,
        retryCount: task.retryCount,
      });

      console.error(`💥 [SyncManager] 同步任务最终失败: ${task.taskId}`);

      // 发布失败事件
      eventBus.emit('reminder-schedule:sync-failed', {
        taskId: task.taskId,
        templateUuid: task.templateUuid,
        operation: task.operation,
        error: task.lastError,
        retryCount: task.retryCount,
      });

      // 将失败任务移到死信队列
      this.moveToDeadLetterQueue(task);
    }
  }

  /**
   * 计算重试延迟（指数退避）
   */
  private calculateRetryDelay(retryCount: number): number {
    return Math.min(this.config.retryDelayMs * Math.pow(2, retryCount - 1), 30000);
  }

  // ===== 状态恢复和健康检查 =====

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5分钟

    // 检查超时的处理中任务
    for (const [taskId, task] of this.syncQueue.entries()) {
      if (task.status === 'processing' && task.startedAt) {
        const processingTime = now.getTime() - task.startedAt.getTime();
        if (processingTime > this.config.syncTimeoutMs * 2) {
          console.warn(`⚠️ [SyncManager] 发现僵尸任务: ${taskId}`);

          // 重置任务状态
          task.status = 'pending';
          task.startedAt = undefined;
          this.syncInProgress.delete(taskId);
        }
      }
    }

    // 清理长时间等待的重试任务
    for (const [taskId, task] of this.syncQueue.entries()) {
      if (task.status === 'retrying' && task.createdAt) {
        const waitingTime = now.getTime() - task.createdAt.getTime();
        if (waitingTime > staleThreshold) {
          console.warn(`⚠️ [SyncManager] 清理过期重试任务: ${taskId}`);

          const timeout = this.retryTimeouts.get(taskId);
          if (timeout) {
            clearTimeout(timeout);
            this.retryTimeouts.delete(taskId);
          }

          this.syncQueue.delete(taskId);
        }
      }
    }

    // 重新启动队列处理
    if (this.syncQueue.size > 0 && this.syncInProgress.size === 0) {
      console.log('🚀 [SyncManager] 健康检查：重新启动队列处理');
      setTimeout(() => this.processSyncQueue(), 0);
    }
  }

  /**
   * 全量状态恢复
   */
  async performFullStateRecovery(params: {
    accountUuid: string;
    templates: ReminderContracts.IReminderTemplate[];
    forceSync?: boolean;
  }): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
    errors: Array<{ templateUuid: string; error: string }>;
  }> {
    console.log(`🔄 [SyncManager] 开始全量状态恢复: ${params.templates.length} 个模板`);

    const result = await this.integrationService.batchSyncTemplates({
      templates: params.templates.filter((template) => template.enabled || params.forceSync),
      accountUuid: params.accountUuid,
    });

    // 记录恢复结果
    eventBus.emit('reminder-schedule:full-recovery-completed', {
      accountUuid: params.accountUuid,
      totalTemplates: params.templates.length,
      syncedCount: result.successCount,
      failedCount: result.failedCount,
      success: result.success,
    });

    console.log(
      `✅ [SyncManager] 全量状态恢复完成: 成功${result.successCount}, 失败${result.failedCount}`,
    );

    return {
      success: result.success,
      syncedCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors,
    };
  }

  /**
   * 增量状态同步
   */
  async performIncrementalSync(params: {
    accountUuid: string;
    templateUuids: string[];
    since?: Date;
  }): Promise<void> {
    console.log(`🔄 [SyncManager] 开始增量同步: ${params.templateUuids.length} 个模板`);

    // 批量入队同步任务
    const taskIds = await Promise.all(
      params.templateUuids.map((templateUuid) =>
        this.enqueueSync({
          templateUuid,
          operation: 'update',
          accountUuid: params.accountUuid,
          priority: 'normal',
          reason: 'incremental_sync',
        }),
      ),
    );

    console.log(`📝 [SyncManager] 增量同步任务已入队: ${taskIds.length} 个任务`);
  }

  // ===== 监控和统计 =====

  /**
   * 获取同步状态统计
   */
  getSyncStats(): {
    queueSize: number;
    processingCount: number;
    retryingCount: number;
    completedToday: number;
    failedToday: number;
    avgProcessingTime: number;
    errorRate: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let completedToday = 0;
    let failedToday = 0;
    let totalProcessingTime = 0;
    let processedTasks = 0;

    for (const results of this.syncHistory.values()) {
      for (const result of results) {
        if (result.timestamp >= today) {
          if (result.success) {
            completedToday++;
            if (result.processingTime) {
              totalProcessingTime += result.processingTime;
              processedTasks++;
            }
          } else {
            failedToday++;
          }
        }
      }
    }

    const queuedTasks = Array.from(this.syncQueue.values());
    const processingCount = queuedTasks.filter((task) => task.status === 'processing').length;
    const retryingCount = queuedTasks.filter((task) => task.status === 'retrying').length;

    return {
      queueSize: this.syncQueue.size,
      processingCount,
      retryingCount,
      completedToday,
      failedToday,
      avgProcessingTime: processedTasks > 0 ? totalProcessingTime / processedTasks : 0,
      errorRate:
        completedToday + failedToday > 0 ? failedToday / (completedToday + failedToday) : 0,
    };
  }

  /**
   * 获取模板同步状态
   */
  getTemplateSyncStatus(templateUuid: string): {
    inQueue: boolean;
    status?: string;
    lastSync?: Date;
    lastError?: string;
    retryCount?: number;
  } {
    const queuedTask = Array.from(this.syncQueue.values()).find(
      (task) => task.templateUuid === templateUuid,
    );

    const history = this.syncHistory.get(templateUuid);
    const lastResult = history?.[history.length - 1];

    return {
      inQueue: !!queuedTask,
      status: queuedTask?.status,
      lastSync: lastResult?.timestamp,
      lastError: lastResult?.error,
      retryCount: queuedTask?.retryCount,
    };
  }

  // ===== 私有辅助方法 =====

  private isHighLoad(): boolean {
    return this.syncQueue.size > this.config.batchSize * 2;
  }

  private recordSyncResult(task: PendingSyncTask, result: any): void {
    if (!this.syncHistory.has(task.templateUuid)) {
      this.syncHistory.set(task.templateUuid, []);
    }

    const history = this.syncHistory.get(task.templateUuid)!;
    const syncResult: SyncResult = {
      timestamp: new Date(),
      success: result.success,
      operation: task.operation,
      processingTime:
        task.startedAt && task.completedAt
          ? task.completedAt.getTime() - task.startedAt.getTime()
          : undefined,
      error: result.error,
      retryCount: task.retryCount,
    };

    history.push(syncResult);

    // 只保留最近50条记录
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  private moveToDeadLetterQueue(task: PendingSyncTask): void {
    // TODO: 实现死信队列逻辑
    // 可以将失败任务存储到数据库或日志文件中
    console.log(`💀 [SyncManager] 任务移入死信队列: ${task.taskId}`);
    this.syncQueue.delete(task.taskId);
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    console.log('🧹 [SyncManager] 清理同步管理器资源');

    // 清除所有重试定时器
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();

    // 清空队列
    this.syncQueue.clear();
    this.syncInProgress.clear();
  }
}

// ===== 类型定义 =====

interface PendingSyncTask {
  taskId: string;
  templateUuid: string;
  operation: 'create' | 'update' | 'delete';
  template?: ReminderContracts.IReminderTemplate;
  accountUuid: string;
  priority: 'high' | 'normal' | 'low';
  reason?: string;
  status: 'pending' | 'processing' | 'retrying' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  retryCount: number;
  lastError?: string;
}

interface SyncResult {
  timestamp: Date;
  success: boolean;
  operation: string;
  processingTime?: number;
  error?: string;
  retryCount?: number;
}

// 导出单例实例
export const reminderScheduleSyncManager = ReminderScheduleSyncManager.getInstance();
