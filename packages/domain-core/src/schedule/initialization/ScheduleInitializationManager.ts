/**
 * Schedule模块初始化管理器
 * @description 处理Schedule模块的启动初始化和服务器重启时的状态恢复
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { eventBus } from '@dailyuse/utils';
import { ScheduleStatus } from '@dailyuse/contracts';
import { ScheduleApplicationService } from '../application/ScheduleApplicationService';
import { ScheduleEventHandlers } from '../events/ScheduleEventHandlers';
import { reminderTriggerHandler } from '../infrastructure/ReminderTriggerHandler';

/**
 * 持久化调度任务接口
 * 用于保存和恢复调度任务状态
 */
export interface PersistedScheduleTask {
  uuid: string;
  taskData: any; // ScheduleTask的完整数据
  scheduledTime: string;
  nextExecutionTime?: string;
  status: ScheduleStatus;
  createdAt: string;
  accountUuid: string;
}

/**
 * Schedule模块初始化管理器
 * 负责模块的启动、关闭和状态恢复
 */
export class ScheduleInitializationManager {
  private scheduleService: ScheduleApplicationService;
  private eventHandlers: ScheduleEventHandlers;
  private initialized = false;
  private persistenceKey = 'dailyuse:schedule:persisted-tasks';

  constructor() {
    this.scheduleService = new ScheduleApplicationService();
    this.eventHandlers = new ScheduleEventHandlers(this.scheduleService);
  }

  // ========== 初始化方法 ==========

  /**
   * 应用启动初始化
   * 在应用启动时调用，注册事件处理器和初始化服务
   */
  async initializeOnAppStartup(): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🚀 [Schedule] 开始应用启动初始化...');

      // 1. 初始化提醒触发处理器
      // reminderTriggerHandler 已经是单例，自动初始化

      // 2. 注册事件处理器
      this.eventHandlers.registerHandlers();

      // 3. 注册Schedule服务的响应处理器
      this.registerScheduleResponseHandlers();

      // 4. 初始化完成
      this.initialized = true;

      console.log('✅ [Schedule] 应用启动初始化完成');
      return { success: true };
    } catch (error) {
      console.error('❌ [Schedule] 应用启动初始化失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '初始化失败',
      };
    }
  }

  /**
   * 用户登录初始化
   * 在用户登录时调用，恢复用户的调度任务
   */
  async initializeOnUserLogin(
    accountUuid: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🔑 [Schedule] 开始用户登录初始化: ${accountUuid}`);

      if (!this.initialized) {
        throw new Error('Schedule模块未完成应用启动初始化');
      }

      // 1. 恢复持久化的调度任务
      const restoreResult = await this.restorePersistedTasks(accountUuid);
      console.log(`📂 [Schedule] 恢复了 ${restoreResult.restoredCount} 个调度任务`);

      // 2. 重新加载活跃的提醒任务（从数据库或其他持久化存储）
      await this.reloadActiveReminders(accountUuid);

      // 3. 发布用户初始化完成事件
      eventBus.emit('schedule:user-initialized', {
        accountUuid,
        restoredTasksCount: restoreResult.restoredCount,
      });

      console.log(`✅ [Schedule] 用户登录初始化完成: ${accountUuid}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [Schedule] 用户登录初始化失败: ${accountUuid}`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '用户初始化失败',
      };
    }
  }

  /**
   * 服务器重启后的状态恢复
   * 用于处理服务器意外重启后的调度任务恢复
   */
  async recoverAfterServerRestart(): Promise<{
    success: boolean;
    recoveredTasks: number;
    message?: string;
  }> {
    try {
      console.log('🔄 [Schedule] 开始服务器重启恢复...');

      let totalRecovered = 0;

      // 1. 从localStorage恢复任务（Web环境）
      const localStorageRecovered = await this.recoverFromLocalStorage();
      totalRecovered += localStorageRecovered;

      // 2. 从数据库恢复任务（如果有数据库集成）
      const databaseRecovered = await this.recoverFromDatabase();
      totalRecovered += databaseRecovered;

      // 3. 重新计算所有任务的执行时间
      await this.recalculateScheduleTimes();

      // 4. 清理过期任务
      const cleanedTasks = this.scheduleService.cleanup();
      console.log(`🧹 [Schedule] 清理了 ${cleanedTasks} 个过期任务`);

      console.log(`✅ [Schedule] 服务器重启恢复完成，共恢复 ${totalRecovered} 个任务`);
      return { success: true, recoveredTasks: totalRecovered };
    } catch (error) {
      console.error('❌ [Schedule] 服务器重启恢复失败:', error);
      return {
        success: false,
        recoveredTasks: 0,
        message: error instanceof Error ? error.message : '恢复失败',
      };
    }
  }

  // ========== 持久化相关方法 ==========

  /**
   * 保存调度任务到持久化存储
   */
  async persistScheduleTask(task: any, accountUuid: string): Promise<void> {
    try {
      const persistedTask: PersistedScheduleTask = {
        uuid: task.uuid,
        taskData: task.toDTO(),
        scheduledTime: task.scheduledTime.toISOString(),
        nextExecutionTime: task.nextExecutionTime?.toISOString(),
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        accountUuid,
      };

      // 保存到localStorage（Web环境）
      const existing = this.getPersistedTasks();
      existing[task.uuid] = persistedTask;
      localStorage.setItem(this.persistenceKey, JSON.stringify(existing));

      // TODO: 保存到数据库（如果有数据库集成）
    } catch (error) {
      console.error('[Schedule] 保存调度任务失败:', error);
    }
  }

  /**
   * 从持久化存储删除调度任务
   */
  async removePersistedScheduleTask(taskUuid: string): Promise<void> {
    try {
      // 从localStorage删除
      const existing = this.getPersistedTasks();
      delete existing[taskUuid];
      localStorage.setItem(this.persistenceKey, JSON.stringify(existing));

      // TODO: 从数据库删除（如果有数据库集成）
    } catch (error) {
      console.error('[Schedule] 删除持久化调度任务失败:', error);
    }
  }

  /**
   * 获取持久化的调度任务
   */
  private getPersistedTasks(): Record<string, PersistedScheduleTask> {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[Schedule] 获取持久化任务失败:', error);
      return {};
    }
  }

  /**
   * 恢复持久化的调度任务
   */
  private async restorePersistedTasks(accountUuid: string): Promise<{ restoredCount: number }> {
    let restoredCount = 0;

    try {
      const persistedTasks = this.getPersistedTasks();
      const userTasks = Object.values(persistedTasks).filter(
        (task) => task.accountUuid === accountUuid,
      );

      for (const persistedTask of userTasks) {
        try {
          // 检查任务是否仍然有效
          const scheduledTime = new Date(persistedTask.scheduledTime);
          const now = new Date();

          // 跳过已经过期很久的任务（超过24小时）
          if (scheduledTime.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
            await this.removePersistedScheduleTask(persistedTask.uuid);
            continue;
          }

          // 恢复任务
          const result = await this.scheduleService.createScheduleTask({
            name: persistedTask.taskData.name,
            taskType: persistedTask.taskData.taskType,
            payload: persistedTask.taskData.payload,
            scheduledTime,
            createdBy: persistedTask.taskData.createdBy,
            description: persistedTask.taskData.description,
            priority: persistedTask.taskData.priority,
            alertConfig: persistedTask.taskData.alertConfig,
            maxRetries: persistedTask.taskData.maxRetries,
            tags: persistedTask.taskData.tags,
          });

          if (result.success) {
            restoredCount++;
            console.log(`✅ 恢复调度任务: ${persistedTask.taskData.name}`);
          } else {
            console.error(`❌ 恢复调度任务失败: ${result.message}`);
          }
        } catch (error) {
          console.error(`恢复任务 ${persistedTask.uuid} 失败:`, error);
        }
      }
    } catch (error) {
      console.error('恢复持久化任务失败:', error);
    }

    return { restoredCount };
  }

  /**
   * 从localStorage恢复任务
   */
  private async recoverFromLocalStorage(): Promise<number> {
    // 在用户登录初始化时已经处理，这里返回0
    return 0;
  }

  /**
   * 从数据库恢复任务
   */
  private async recoverFromDatabase(): Promise<number> {
    // TODO: 实现数据库恢复逻辑
    // 这里需要查询数据库中的活跃调度任务并恢复
    return 0;
  }

  /**
   * 重新加载活跃的提醒任务
   */
  private async reloadActiveReminders(accountUuid: string): Promise<void> {
    // TODO: 从数据库或其他存储加载用户的活跃提醒任务
    // 这可能包括：
    // 1. 未完成的任务提醒
    // 2. 目标截止日期提醒
    // 3. 用户自定义的定期提醒
    console.log(`🔄 重新加载用户 ${accountUuid} 的活跃提醒任务`);
  }

  /**
   * 重新计算调度时间
   */
  private async recalculateScheduleTimes(): Promise<void> {
    const activeTasks = this.scheduleService.getAllActiveTasks();

    for (const task of activeTasks) {
      // 检查任务是否需要重新调度
      if (task.status === ScheduleStatus.PENDING && task.scheduledTime <= new Date()) {
        // 任务时间已过，需要重新处理
        if (task.recurrence) {
          // 有重复规则，计算下次执行时间
          // TODO: 实现重复规则的时间计算
        } else {
          // 无重复规则，标记为过期
          await this.scheduleService.cancelScheduleTask(task.uuid);
        }
      }
    }
  }

  // ========== 事件处理器注册 ==========

  /**
   * 注册Schedule服务的响应处理器
   * 处理其他模块对Schedule服务的请求
   */
  private registerScheduleResponseHandlers(): void {
    // 处理创建任务提醒的请求
    eventBus.handle('schedule:create-task-reminder', async (data: any) => {
      return await this.scheduleService.createTaskReminder(data);
    });

    // 处理创建目标提醒的请求
    eventBus.handle('schedule:create-goal-reminder', async (data: any) => {
      return await this.scheduleService.createGoalReminder(data);
    });

    // 处理延后提醒的请求
    eventBus.handle('schedule:snooze-reminder', async (data: any) => {
      return await this.scheduleService.snoozeTask(data.taskId, data.delayMinutes);
    });

    // 处理确认提醒的请求
    eventBus.handle('schedule:acknowledge-reminder', async (data: any) => {
      return await this.scheduleService.acknowledgeReminder(data.taskId);
    });

    // 处理忽略提醒的请求
    eventBus.handle('schedule:dismiss-reminder', async (data: any) => {
      return await this.scheduleService.dismissReminder(data.taskId);
    });

    // 处理取消任务提醒的请求
    eventBus.handle('schedule:cancel-task-reminders', async (data: any) => {
      const activeTasks = this.scheduleService.getAllActiveTasks();
      const taskReminders = activeTasks.filter(
        (task) =>
          task.payload.type === 'TASK_REMINDER' && task.payload.data.sourceId === data.sourceId,
      );

      let canceledCount = 0;
      for (const reminder of taskReminders) {
        const result = await this.scheduleService.cancelScheduleTask(reminder.uuid);
        if (result.success) {
          canceledCount++;
        }
      }

      return { success: true, canceledCount };
    });

    console.log('📞 [Schedule] 响应处理器注册完成');
  }

  // ========== 清理方法 ==========

  /**
   * 用户登出清理
   */
  async cleanupOnUserLogout(accountUuid: string): Promise<void> {
    try {
      console.log(`🧹 [Schedule] 开始用户登出清理: ${accountUuid}`);

      // 1. 保存当前活跃的调度任务
      const activeTasks = this.scheduleService.getAllActiveTasks();
      for (const task of activeTasks) {
        if (task.createdBy === accountUuid) {
          await this.persistScheduleTask(task, accountUuid);
        }
      }

      // 2. 清除当前用户的内存中的调度任务
      // （实际实现中需要在ScheduleApplicationService中添加按用户过滤的方法）

      // 3. 发布清理完成事件
      eventBus.emit('schedule:user-cleanup-completed', { accountUuid });

      console.log(`✅ [Schedule] 用户登出清理完成: ${accountUuid}`);
    } catch (error) {
      console.error(`❌ [Schedule] 用户登出清理失败: ${accountUuid}`, error);
    }
  }

  /**
   * 应用关闭清理
   */
  async cleanupOnAppShutdown(): Promise<void> {
    try {
      console.log('🛑 [Schedule] 开始应用关闭清理...');

      // 1. 保存所有活跃的调度任务
      const activeTasks = this.scheduleService.getAllActiveTasks();
      for (const task of activeTasks) {
        await this.persistScheduleTask(task, task.createdBy);
      }

      // 2. 注销事件处理器
      this.eventHandlers.unregisterHandlers();

      // 3. 清理Schedule应用服务
      this.scheduleService.cleanup();

      // 4. 清理提醒触发处理器
      reminderTriggerHandler.cleanup();

      // 5. 标记为未初始化
      this.initialized = false;

      console.log('✅ [Schedule] 应用关闭清理完成');
    } catch (error) {
      console.error('❌ [Schedule] 应用关闭清理失败:', error);
    }
  }

  // ========== 状态查询方法 ==========

  /**
   * 获取初始化状态
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取Schedule服务状态
   */
  getStatus(): {
    initialized: boolean;
    serviceStatus: any;
    activePopups: number;
  } {
    return {
      initialized: this.initialized,
      serviceStatus: this.scheduleService.getStatus(),
      activePopups: reminderTriggerHandler.getActivePopups().length,
    };
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(): {
    activeTasks: any[];
    persistedTasks: Record<string, PersistedScheduleTask>;
    upcomingTasks: any[];
  } {
    return {
      activeTasks: this.scheduleService.getAllActiveTasks().map((task) => ({
        uuid: task.uuid,
        name: task.name,
        taskType: task.taskType,
        scheduledTime: task.scheduledTime,
        status: task.status,
      })),
      persistedTasks: this.getPersistedTasks(),
      upcomingTasks: this.scheduleService.getUpcomingTasks(120), // 2小时内
    };
  }
}

// 导出单例实例
let scheduleInitManager: ScheduleInitializationManager | null = null;

export function getScheduleInitializationManager(): ScheduleInitializationManager {
  if (!scheduleInitManager) {
    scheduleInitManager = new ScheduleInitializationManager();
  }
  return scheduleInitManager;
}
