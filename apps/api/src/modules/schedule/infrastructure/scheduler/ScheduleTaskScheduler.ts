/**
 * Schedule Task Scheduler
 * @description 调度任务执行器 - 负责按时触发计划任务
 * @author DailyUse Team
 * @date 2025-01-09
 */

import cron from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import { ScheduleContainer } from '../di/ScheduleContainer';
// 移除 CrossPlatformEventBus 导入，使用 any 类型

/**
 * 调度任务执行器
 *
 * 功能：
 * 1. 定期检查需要执行的 schedule 任务
 * 2. 触发提醒事件
 * 3. 更新任务执行状态
 */
export class ScheduleTaskScheduler {
  private static instance: ScheduleTaskScheduler;
  private isRunning = false;
  private cronJob?: any;

  constructor(
    private prisma: PrismaClient,
    private eventBus: any,
  ) {}

  /**
   * 获取单例实例
   */
  public static getInstance(prisma: PrismaClient, eventBus: any): ScheduleTaskScheduler {
    if (!this.instance) {
      this.instance = new ScheduleTaskScheduler(prisma, eventBus);
    }
    return this.instance;
  }

  /**
   * 启动调度器 - 每分钟检查一次
   */
  public start(): void {
    if (this.isRunning) {
      console.log('📅 [ScheduleTaskScheduler] 调度器已在运行中');
      return;
    }

    // 每分钟执行一次检查
    this.cronJob = cron.schedule(
      '* * * * *',
      async () => {
        await this.checkAndExecuteTasks();
      },
      {
        timezone: 'Asia/Shanghai',
      },
    );

    this.isRunning = true;
    console.log('🚀 [ScheduleTaskScheduler] 调度器启动成功 - 每分钟检查待执行任务');
  }

  /**
   * 停止调度器
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = undefined;
    }
    this.isRunning = false;
    console.log('🛑 [ScheduleTaskScheduler] 调度器已停止');
  }

  /**
   * 检查并执行待执行的任务
   */
  private async checkAndExecuteTasks(): Promise<void> {
    try {
      const now = new Date();
      console.log(`🔍 [ScheduleTaskScheduler] 检查待执行任务 - ${now.toISOString()}`);

      // 查找需要执行的任务 - 简化查询逻辑
      const tasks = await this.prisma.scheduleTask.findMany({
        where: {
          enabled: true,
          status: 'pending',
          OR: [
            // 调度时间已到
            { scheduledTime: { lte: now } },
            // 下次执行时间已到或为空
            { nextScheduledAt: { lte: now } },
            { nextScheduledAt: null },
          ],
        },
        orderBy: {
          scheduledTime: 'asc',
        },
        take: 10, // 每次最多处理10个任务
      });

      console.log(`📊 [ScheduleTaskScheduler] 找到 ${tasks.length} 个待执行任务`);

      for (const task of tasks) {
        try {
          await this.executeTask(task);
        } catch (error) {
          console.error(`❌ [ScheduleTaskScheduler] 执行任务失败 ${task.uuid}:`, error);

          // 更新失败计数
          await this.prisma.scheduleTask.update({
            where: { uuid: task.uuid },
            data: {
              failureCount: { increment: 1 },
              lastExecutedAt: now,
              status: task.failureCount >= 2 ? 'failed' : 'pending', // 失败3次后标记为失败
            },
          });
        }
      }
    } catch (error) {
      console.error('❌ [ScheduleTaskScheduler] 检查任务时发生错误:', error);
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: any): Promise<void> {
    const now = new Date();
    console.log(`⚡ [ScheduleTaskScheduler] 执行任务: ${task.title} (${task.uuid})`);

    // 解析载荷和提醒配置
    const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload;
    const alertConfig =
      typeof task.alertConfig === 'string' ? JSON.parse(task.alertConfig) : task.alertConfig;
    const recurrence = task.recurrence
      ? typeof task.recurrence === 'string'
        ? JSON.parse(task.recurrence)
        : task.recurrence
      : null;

    // 创建执行记录
    await this.prisma.scheduleExecution.create({
      data: {
        taskUuid: task.uuid,
        accountUuid: task.accountUuid,
        status: 'completed',
        startedAt: now,
        completedAt: now,
        duration: 100, // 默认100ms
        result: { success: true, message: '提醒已发送' },
      },
    });

    // 发送提醒事件
    await this.sendReminderEvent(task, payload, alertConfig);

    // 更新任务状态和执行计数
    const updateData: any = {
      executionCount: { increment: 1 },
      lastExecutedAt: now,
    };

    // 计算下次执行时间（如果是重复任务）
    if (recurrence && recurrence.type !== 'NONE') {
      const nextTime = this.calculateNextExecution(task.scheduledTime, recurrence, now);
      if (nextTime) {
        updateData.nextScheduledAt = nextTime;
        console.log(`📅 [ScheduleTaskScheduler] 下次执行时间: ${nextTime.toISOString()}`);
      } else {
        updateData.status = 'completed'; // 没有下次执行时间，标记为完成
      }
    } else {
      updateData.status = 'completed'; // 一次性任务，标记为完成
    }

    await this.prisma.scheduleTask.update({
      where: { uuid: task.uuid },
      data: updateData,
    });

    console.log(`✅ [ScheduleTaskScheduler] 任务执行完成: ${task.title}`);
  }

  /**
   * 发送提醒事件
   */
  private async sendReminderEvent(task: any, payload: any, alertConfig: any): Promise<void> {
    const reminderData = {
      id: task.uuid,
      title: task.title,
      message: payload.data?.message || task.description || '计划提醒',
      type: task.taskType,
      priority: task.priority,
      alertMethods: alertConfig.methods || ['POPUP'],
      soundVolume: alertConfig.soundVolume || 80,
      popupDuration: alertConfig.popupDuration || 10,
      allowSnooze: alertConfig.allowSnooze || false,
      snoozeOptions: alertConfig.snoozeOptions || [5, 10, 15],
      customActions: alertConfig.customActions || [],
      timestamp: new Date().toISOString(),
    };

    // 发送不同类型的提醒事件
    if (alertConfig.methods?.includes('POPUP')) {
      this.eventBus.emit('ui:show-popup-reminder', reminderData);
      console.log('🔔 [ScheduleTaskScheduler] 发送弹窗提醒事件');
    }

    if (alertConfig.methods?.includes('SOUND')) {
      this.eventBus.emit('ui:play-reminder-sound', {
        volume: reminderData.soundVolume,
        soundFile: alertConfig.soundFile,
      });
      console.log('🔊 [ScheduleTaskScheduler] 发送声音提醒事件');
    }

    if (alertConfig.methods?.includes('SYSTEM_NOTIFICATION')) {
      this.eventBus.emit('system:show-notification', {
        title: reminderData.title,
        body: reminderData.message,
        icon: 'schedule',
      });
      console.log('📢 [ScheduleTaskScheduler] 发送系统通知事件');
    }

    // 发送通用的提醒触发事件
    this.eventBus.emit('reminder-triggered', reminderData);
    console.log('📨 [ScheduleTaskScheduler] 发送通用提醒事件');
  }

  /**
   * 计算下次执行时间
   */
  private calculateNextExecution(
    scheduledTime: Date,
    recurrence: any,
    currentTime: Date,
  ): Date | null {
    if (!recurrence || recurrence.type === 'NONE') {
      return null;
    }

    const scheduled = new Date(scheduledTime);
    const interval = recurrence.interval || 1;

    switch (recurrence.type) {
      case 'DAILY':
        const nextDaily = new Date(currentTime);
        nextDaily.setDate(nextDaily.getDate() + interval);
        nextDaily.setHours(scheduled.getHours(), scheduled.getMinutes(), scheduled.getSeconds(), 0);
        return nextDaily;

      case 'WEEKLY':
        const nextWeekly = new Date(currentTime);
        nextWeekly.setDate(nextWeekly.getDate() + interval * 7);
        nextWeekly.setHours(
          scheduled.getHours(),
          scheduled.getMinutes(),
          scheduled.getSeconds(),
          0,
        );
        return nextWeekly;

      case 'MONTHLY':
        const nextMonthly = new Date(currentTime);
        nextMonthly.setMonth(nextMonthly.getMonth() + interval);
        nextMonthly.setHours(
          scheduled.getHours(),
          scheduled.getMinutes(),
          scheduled.getSeconds(),
          0,
        );
        return nextMonthly;

      case 'CUSTOM':
        if (recurrence.cronExpression === '* * * * *') {
          // 每分钟执行
          const nextMinute = new Date(currentTime);
          nextMinute.setMinutes(nextMinute.getMinutes() + 1);
          nextMinute.setSeconds(0, 0);
          return nextMinute;
        }
        break;

      default:
        console.warn(`[ScheduleTaskScheduler] 不支持的重复类型: ${recurrence.type}`);
        return null;
    }

    return null;
  }

  /**
   * 获取调度器状态
   */
  public getStatus(): { isRunning: boolean; uptime?: number } {
    return {
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() : undefined,
    };
  }
}
