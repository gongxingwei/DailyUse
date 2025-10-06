import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { parseExpression } from 'cron-parser';
import { RecurringScheduleTask } from '@dailyuse/domain-core';
import { ScheduleContracts } from '@dailyuse/contracts';

/**
 * SchedulerService 核心调度服务
 * 
 * 职责：
 * 1. 注册和管理 cron 定时任务
 * 2. 解析 cron 表达式并计算下次执行时间
 * 3. 触发任务执行并发出事件
 * 4. 管理任务生命周期
 */
@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private tasks: Map<string, RecurringScheduleTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  async onModuleInit() {
    console.log('📅 SchedulerService 初始化...');
    this.isRunning = true;
  }

  async onModuleDestroy() {
    console.log('📅 SchedulerService 正在关闭...');
    this.isRunning = false;
    this.stopAllTasks();
  }

  /**
   * 注册新任务
   */
  async registerTask(task: RecurringScheduleTask): Promise<void> {
    if (this.tasks.has(task.uuid)) {
      throw new Error(`Task ${task.uuid} already registered`);
    }

    this.tasks.set(task.uuid, task);

    if (task.enabled && task.status === ScheduleContracts.ScheduleTaskStatus.ACTIVE) {
      await this.scheduleTask(task);
    }

    console.log(`✅ 任务已注册: ${task.name} (${task.uuid})`);
  }

  /**
   * 注销任务
   */
  async unregisterTask(taskUuid: string): Promise<void> {
    const timer = this.timers.get(taskUuid);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskUuid);
    }

    this.tasks.delete(taskUuid);
    console.log(`🗑️ 任务已注销: ${taskUuid}`);
  }

  /**
   * 更新任务
   */
  async updateTask(task: RecurringScheduleTask): Promise<void> {
    const existingTimer = this.timers.get(task.uuid);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(task.uuid);
    }

    this.tasks.set(task.uuid, task);

    if (task.enabled && task.status === ScheduleContracts.ScheduleTaskStatus.ACTIVE) {
      await this.scheduleTask(task);
    }

    console.log(`🔄 任务已更新: ${task.name} (${task.uuid})`);
  }

  /**
   * 启用任务
   */
  async enableTask(taskUuid: string): Promise<void> {
    const task = this.tasks.get(taskUuid);
    if (!task) {
      throw new Error(`Task ${taskUuid} not found`);
    }

    task.enable();
    await this.scheduleTask(task);
    console.log(`▶️ 任务已启用: ${task.name}`);
  }

  /**
   * 禁用任务
   */
  async disableTask(taskUuid: string): Promise<void> {
    const task = this.tasks.get(taskUuid);
    if (!task) {
      throw new Error(`Task ${taskUuid} not found`);
    }

    const timer = this.timers.get(taskUuid);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskUuid);
    }

    task.disable();
    console.log(`⏸️ 任务已禁用: ${task.name}`);
  }

  /**
   * 调度任务（计算下次执行时间并设置定时器）
   */
  private async scheduleTask(task: RecurringScheduleTask): Promise<void> {
    const nextRunTime = this.calculateNextRunTime(task);
    
    if (!nextRunTime) {
      console.log(`⚠️ 无法计算下次执行时间: ${task.name}`);
      return;
    }

    task.setNextRunAt(nextRunTime);

    const delay = nextRunTime.getTime() - Date.now();
    if (delay <= 0) {
      // 立即执行
      await this.executeTask(task);
    } else {
      // 设置定时器
      const timer = setTimeout(async () => {
        await this.executeTask(task);
      }, delay);

      this.timers.set(task.uuid, timer);
      console.log(`⏰ 任务已调度: ${task.name}, 下次执行: ${nextRunTime.toLocaleString()}`);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: RecurringScheduleTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 执行任务: ${task.name} (${task.uuid})`);

      // TODO: 发出任务触发事件
      const event: ScheduleContracts.ScheduleTaskTriggeredEvent = {
        taskUuid: task.uuid,
        taskName: task.name,
        triggeredAt: new Date(),
        sourceModule: task.sourceModule,
        sourceEntityId: task.sourceEntityId,
        metadata: task.metadata,
      };

      // 这里应该通过事件总线发布事件
      console.log('📢 发出任务触发事件:', event);

      // 记录执行成功
      const durationMs = Date.now() - startTime;
      task.recordExecution(true, undefined, durationMs);

      console.log(`✅ 任务执行成功: ${task.name}, 耗时: ${durationMs}ms`);

      // 如果是循环任务，重新调度下次执行
      if (task.triggerType === ScheduleContracts.TriggerType.CRON) {
        await this.scheduleTask(task);
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      task.recordExecution(false, errorMessage, durationMs);
      console.error(`❌ 任务执行失败: ${task.name}, 错误: ${errorMessage}`);

      // 即使失败，cron 任务也应该继续调度
      if (task.triggerType === ScheduleContracts.TriggerType.CRON) {
        await this.scheduleTask(task);
      }
    }
  }

  /**
   * 计算下次执行时间
   */
  private calculateNextRunTime(task: RecurringScheduleTask): Date | null {
    if (task.triggerType === ScheduleContracts.TriggerType.CRON) {
      if (!task.cronExpression) {
        return null;
      }

      try {
        const interval = parseExpression(task.cronExpression);
        return interval.next().toDate();
      } catch (error) {
        console.error(`❌ 解析 cron 表达式失败: ${task.cronExpression}`, error);
        return null;
      }
    }

    if (task.triggerType === ScheduleContracts.TriggerType.ONCE) {
      if (!task.scheduledTime) {
        return null;
      }

      // 如果已经执行过，返回 null
      if (task.executionCount > 0) {
        return null;
      }

      return task.scheduledTime;
    }

    return null;
  }

  /**
   * 停止所有任务
   */
  private stopAllTasks(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    console.log('🛑 所有任务已停止');
  }

  /**
   * 获取所有任务状态
   */
  getTasksStatus(): Array<{
    uuid: string;
    name: string;
    enabled: boolean;
    nextRunAt?: Date;
    lastRunAt?: Date;
    executionCount: number;
  }> {
    return Array.from(this.tasks.values()).map(task => ({
      uuid: task.uuid,
      name: task.name,
      enabled: task.enabled,
      nextRunAt: task.nextRunAt,
      lastRunAt: task.lastRunAt,
      executionCount: task.executionCount,
    }));
  }
}
