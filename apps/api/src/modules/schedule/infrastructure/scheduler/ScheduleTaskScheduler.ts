/**
 * Schedule Task Scheduler
 * @description 调度任务执行器 - 负责按时触发计划任务
 * @author DailyUse Team
 * @date 2025-01-09
 */

import cron from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import { ScheduleContainer } from '../di/ScheduleContainer';
import { createLogger } from '@dailyuse/utils';
import { getEventBus } from '@dailyuse/domain-core';
import { TaskTriggeredEvent } from '../../domain/events/ScheduleEvents';

const logger = createLogger('ScheduleTaskScheduler');

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
      logger.warn('调度器已在运行中，忽略启动请求');
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
    logger.info('调度器启动成功', {
      cronPattern: '* * * * *',
      timezone: 'Asia/Shanghai',
      checkInterval: '每分钟',
    });
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
    logger.info('调度器已停止');
  }

  /**
   * 检查并执行待执行的任务
   */
  private async checkAndExecuteTasks(): Promise<void> {
    try {
      const now = new Date();
      logger.debug('开始检查待执行任务', {
        checkTime: now.toISOString(),
        timestamp: Date.now(),
      });

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

      if (tasks.length === 0) {
        logger.debug('未找到待执行任务', { checkTime: now.toISOString() });
        return;
      }

      logger.info('找到待执行任务', {
        taskCount: tasks.length,
        taskIds: tasks.map((t) => t.uuid),
        taskTitles: tasks.map((t) => t.title),
      });

      for (const task of tasks) {
        try {
          logger.debug('开始执行任务', {
            taskId: task.uuid,
            taskTitle: task.title,
            taskType: task.taskType,
            scheduledTime: task.scheduledTime,
            nextScheduledAt: task.nextScheduledAt,
          });

          await this.executeTask(task);

          logger.info('任务执行成功', {
            taskId: task.uuid,
            taskTitle: task.title,
          });
        } catch (error) {
          logger.error('任务执行失败', {
            taskId: task.uuid,
            taskTitle: task.title,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });

          // 更新失败计数
          await this.prisma.scheduleTask.update({
            where: { uuid: task.uuid },
            data: {
              failureCount: { increment: 1 },
              lastExecutedAt: now,
              status: task.failureCount >= 2 ? 'failed' : 'pending', // 失败3次后标记为失败
            },
          });

          logger.warn('更新任务失败计数', {
            taskId: task.uuid,
            newFailureCount: task.failureCount + 1,
            newStatus: task.failureCount >= 2 ? 'failed' : 'pending',
          });
        }
      }
    } catch (error) {
      logger.error('检查任务时发生错误', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: any): Promise<void> {
    const now = new Date();
    logger.debug('开始执行任务详情', {
      taskId: task.uuid,
      taskTitle: task.title,
      taskType: task.taskType,
      priority: task.priority,
      executionCount: task.executionCount,
    });

    // 解析载荷和提醒配置
    const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload;
    const alertConfig =
      typeof task.alertConfig === 'string' ? JSON.parse(task.alertConfig) : task.alertConfig;
    const recurrence = task.recurrence
      ? typeof task.recurrence === 'string'
        ? JSON.parse(task.recurrence)
        : task.recurrence
      : null;

    logger.debug('任务配置解析完成', {
      taskId: task.uuid,
      hasPayload: !!payload,
      hasAlertConfig: !!alertConfig,
      hasRecurrence: !!recurrence,
      recurrenceType: recurrence?.type,
    });

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

    // 🎯 发布任务触发事件 (事件驱动架构)
    const taskTriggeredEvent = new TaskTriggeredEvent(
      task.uuid,
      payload.sourceType || 'unknown',
      payload.sourceId || task.uuid,
      task.accountUuid,
      payload,
    );

    await getEventBus().publish([taskTriggeredEvent]);
    logger.info('任务触发事件已发布', {
      eventType: TaskTriggeredEvent.EVENT_TYPE,
      taskId: task.uuid,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
    });

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
        logger.info('计算下次执行时间', {
          taskId: task.uuid,
          recurrenceType: recurrence.type,
          nextExecutionTime: nextTime.toISOString(),
          interval: recurrence.interval,
        });
      } else {
        updateData.status = 'completed'; // 没有下次执行时间，标记为完成
        logger.debug('无下次执行时间，任务标记为完成', { taskId: task.uuid });
      }
    } else {
      updateData.status = 'completed'; // 一次性任务，标记为完成
      logger.debug('一次性任务执行完成', { taskId: task.uuid });
    }

    await this.prisma.scheduleTask.update({
      where: { uuid: task.uuid },
      data: updateData,
    });

    logger.debug('任务状态已更新', {
      taskId: task.uuid,
      newExecutionCount: task.executionCount + 1,
      newStatus: updateData.status,
      nextScheduledAt: updateData.nextScheduledAt?.toISOString(),
    });
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

    logger.debug('准备发送提醒事件', {
      taskId: task.uuid,
      alertMethods: reminderData.alertMethods,
      soundVolume: reminderData.soundVolume,
      popupDuration: reminderData.popupDuration,
    });

    // 发送不同类型的提醒事件
    if (alertConfig.methods?.includes('POPUP')) {
      this.eventBus.emit('ui:show-popup-reminder', reminderData);
      logger.info('发送弹窗提醒事件', {
        taskId: task.uuid,
        eventType: 'ui:show-popup-reminder',
      });
    }

    if (alertConfig.methods?.includes('SOUND')) {
      const soundData = {
        volume: reminderData.soundVolume,
        soundFile: alertConfig.soundFile,
      };
      this.eventBus.emit('ui:play-reminder-sound', soundData);
      logger.info('发送声音提醒事件', {
        taskId: task.uuid,
        eventType: 'ui:play-reminder-sound',
        volume: soundData.volume,
        soundFile: soundData.soundFile,
      });
    }

    if (alertConfig.methods?.includes('SYSTEM_NOTIFICATION')) {
      const notificationData = {
        title: reminderData.title,
        body: reminderData.message,
        icon: 'schedule',
      };
      this.eventBus.emit('system:show-notification', notificationData);
      logger.info('发送系统通知事件', {
        taskId: task.uuid,
        eventType: 'system:show-notification',
        title: notificationData.title,
      });
    }

    // 发送通用的提醒触发事件
    this.eventBus.emit('reminder-triggered', reminderData);
    logger.info('发送通用提醒事件', {
      taskId: task.uuid,
      eventType: 'reminder-triggered',
      totalEventsEmitted: [
        alertConfig.methods?.includes('POPUP') ? 'POPUP' : null,
        alertConfig.methods?.includes('SOUND') ? 'SOUND' : null,
        alertConfig.methods?.includes('SYSTEM_NOTIFICATION') ? 'SYSTEM_NOTIFICATION' : null,
        'reminder-triggered',
      ].filter(Boolean),
    });
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
        logger.warn('不支持的重复类型', {
          recurrenceType: recurrence.type,
          interval: recurrence.interval,
        });
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
