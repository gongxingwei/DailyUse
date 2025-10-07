/**
 * ReminderTemplateCreated Event Handler
 * @description Schedule 模块监听 Reminder 模块的模板创建事件，自动创建调度任务
 * @author DailyUse Team
 * @date 2025-01-10
 */

import type { EventHandler, DomainEvent } from '@dailyuse/domain-core';
import { ScheduleContracts } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import type { ScheduleDomainService } from '../../domain/services/ScheduleDomainService';

const logger = createLogger('ReminderTemplateCreatedHandler');

/**
 * ReminderTemplateCreated 事件数据格式
 */
interface ReminderTemplateCreatedEvent extends DomainEvent {
  eventType: 'ReminderTemplateCreated';
  aggregateId: string;
  payload: {
    templateUuid: string;
    accountUuid: string;
    template: {
      uuid: string;
      name: string;
      description?: string;
      message: string;
      enabled: boolean;
      priority?: string;
      timeConfig?: any;
      notificationSettings?: any;
      metadata?: Record<string, any>;
    };
  };
}

/**
 * Reminder Template Created Event Handler
 *
 * 职责：
 * 1. 监听 ReminderTemplateCreated 事件
 * 2. 自动创建对应的 ScheduleTask
 * 3. 根据 timeConfig 生成 cron 表达式或 scheduledTime
 *
 * 事件流：
 * ReminderApplicationService.createTemplate()
 *   → eventEmitter.emit('ReminderTemplateCreated')
 *   → ReminderTemplateCreatedHandler.handle()
 *   → ScheduleDomainService.createScheduleTask()
 */
export class ReminderTemplateCreatedHandler implements EventHandler {
  constructor(private readonly scheduleDomainService: ScheduleDomainService) {}

  /**
   * 获取此处理器关注的事件类型
   */
  subscribedTo(): string {
    return 'ReminderTemplateCreated';
  }

  /**
   * 处理事件
   */
  async handle(event: DomainEvent): Promise<void> {
    const reminderEvent = event as ReminderTemplateCreatedEvent;
    const { template, accountUuid } = reminderEvent.payload;

    logger.info('处理 ReminderTemplateCreated 事件', {
      templateUuid: template.uuid,
      templateName: template.name,
      enabled: template.enabled,
    });

    // 只有启用的模板才创建调度任务
    if (!template.enabled) {
      logger.debug('模板未启用，跳过创建调度任务', {
        templateUuid: template.uuid,
      });
      return;
    }

    try {
      // 解析 timeConfig 生成调度配置
      const scheduleConfig = this.parseTimeConfig(template);

      if (!scheduleConfig) {
        logger.warn('无法解析 timeConfig，跳过创建调度任务', {
          templateUuid: template.uuid,
          timeConfig: template.timeConfig,
        });
        return;
      }

      // 创建调度任务
      const createRequest: ScheduleContracts.CreateScheduleTaskRequestDto = {
        name: `Reminder: ${template.name}`,
        description: template.description || template.message,
        taskType: ScheduleContracts.ScheduleTaskType.GENERAL_REMINDER,

        // 调度时间配置
        ...scheduleConfig,

        // 载荷：包含提醒数据
        payload: {
          type: ScheduleContracts.ScheduleTaskType.TASK_REMINDER,
          data: {
            sourceType: 'reminder',
            sourceId: template.uuid,
            reminderData: {
              title: template.name,
              message: template.message,
              priority: template.priority || 'NORMAL',
              notificationSettings: template.notificationSettings,
            },
          },
        },

        // 优先级
        priority: this.mapPriority(template.priority),

        // 提醒配置
        alertConfig: this.buildAlertConfig(template.notificationSettings) || {
          methods: [ScheduleContracts.AlertMethod.POPUP],
          allowSnooze: true,
        },

        // 元数据
        metadata: {
          sourceModule: 'reminder',
          sourceEntityId: template.uuid,
          templateName: template.name,
          ...template.metadata,
        },

        tags: ['reminder', 'auto-created'],
      };

      const scheduleTask = await this.scheduleDomainService.createScheduleTask(
        accountUuid,
        createRequest,
      );

      logger.info('✅ 调度任务创建成功', {
        templateUuid: template.uuid,
        scheduleTaskUuid: scheduleTask.uuid,
        scheduledTime: scheduleTask.scheduledTime,
      });
    } catch (error) {
      logger.error('❌ 创建调度任务失败', {
        templateUuid: template.uuid,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // 不抛出错误，避免影响 ReminderTemplate 的创建
      // 可以记录到失败队列，稍后重试
    }
  }

  /**
   * 解析 timeConfig 生成调度配置
   */
  private parseTimeConfig(
    template: ReminderTemplateCreatedEvent['payload']['template'],
  ): Partial<ScheduleContracts.CreateScheduleTaskRequestDto> | null {
    const { timeConfig } = template;

    if (!timeConfig) {
      return null;
    }

    // 处理 CRON 类型
    if (timeConfig.type === 'CRON' && timeConfig.cronExpression) {
      return {
        scheduledTime: new Date(), // 立即开始
        recurrence: {
          type: ScheduleContracts.RecurrenceType.CUSTOM,
          interval: 1,
          cronExpression: timeConfig.cronExpression,
        },
      };
    }

    // 处理 RELATIVE 类型（相对时间）
    if (timeConfig.type === 'RELATIVE' && timeConfig.schedule) {
      const { pattern, interval } = timeConfig.schedule;

      // 转换为 cron 表达式
      const cronExpression = this.relativeToCron(pattern, interval);

      if (cronExpression) {
        return {
          scheduledTime: new Date(), // 立即开始
          recurrence: {
            type: this.mapRecurrenceType(pattern),
            interval: interval || 1,
            cronExpression,
          },
        };
      }
    }

    // 处理 ABSOLUTE 类型（绝对时间）
    if (timeConfig.type === 'ABSOLUTE' && timeConfig.schedule) {
      const { pattern, endCondition } = timeConfig.schedule;

      // ONCE 类型：一次性任务
      if (pattern === 'once' && endCondition?.endDate) {
        return {
          scheduledTime: new Date(endCondition.endDate),
          recurrence: {
            type: ScheduleContracts.RecurrenceType.NONE,
            interval: 1,
          },
        };
      }

      // 其他绝对时间类型
      const cronExpression = this.absoluteToCron(pattern, timeConfig.schedule);
      if (cronExpression) {
        return {
          scheduledTime: endCondition?.endDate ? new Date(endCondition.endDate) : new Date(),
          recurrence: {
            type: this.mapRecurrenceType(pattern),
            interval: 1,
            cronExpression,
          },
        };
      }
    }

    return null;
  }

  /**
   * 将相对时间转换为 cron 表达式
   */
  private relativeToCron(pattern: string, interval?: number): string | null {
    const int = interval || 1;

    switch (pattern) {
      case 'daily':
        return '0 9 * * *'; // 每天 9:00
      case 'weekly':
        return `0 9 * * ${int}`; // 每周指定天
      case 'monthly':
        return `0 9 ${int} * *`; // 每月指定日
      case 'hourly':
        return `0 */${int} * * *`; // 每 N 小时
      case 'minutely':
        return `*/${int} * * * *`; // 每 N 分钟
      default:
        return null;
    }
  }

  /**
   * 将绝对时间转换为 cron 表达式
   */
  private absoluteToCron(pattern: string, schedule: any): string | null {
    switch (pattern) {
      case 'daily':
        return '0 9 * * *';
      case 'weekly':
        return '0 9 * * 1'; // 每周一
      case 'monthly':
        return '0 9 1 * *'; // 每月1号
      default:
        return null;
    }
  }

  /**
   * 映射重复类型
   */
  private mapRecurrenceType(pattern: string): ScheduleContracts.RecurrenceType {
    const map: Record<string, ScheduleContracts.RecurrenceType> = {
      once: ScheduleContracts.RecurrenceType.NONE,
      daily: ScheduleContracts.RecurrenceType.DAILY,
      weekly: ScheduleContracts.RecurrenceType.WEEKLY,
      monthly: ScheduleContracts.RecurrenceType.MONTHLY,
      yearly: ScheduleContracts.RecurrenceType.YEARLY,
      hourly: ScheduleContracts.RecurrenceType.CUSTOM,
      minutely: ScheduleContracts.RecurrenceType.CUSTOM,
    };

    return map[pattern] || ScheduleContracts.RecurrenceType.CUSTOM;
  }

  /**
   * 映射优先级
   */
  private mapPriority(priority?: string): ScheduleContracts.SchedulePriority {
    const map: Record<string, ScheduleContracts.SchedulePriority> = {
      LOW: ScheduleContracts.SchedulePriority.LOW,
      NORMAL: ScheduleContracts.SchedulePriority.NORMAL,
      HIGH: ScheduleContracts.SchedulePriority.HIGH,
      URGENT: ScheduleContracts.SchedulePriority.URGENT,
    };

    return map[priority || 'NORMAL'] || ScheduleContracts.SchedulePriority.NORMAL;
  }

  /**
   * 构建提醒配置
   */
  private buildAlertConfig(notificationSettings?: any): ScheduleContracts.IAlertConfig | undefined {
    if (!notificationSettings) {
      return {
        methods: [
          ScheduleContracts.AlertMethod.POPUP,
          ScheduleContracts.AlertMethod.SYSTEM_NOTIFICATION,
        ],
        allowSnooze: true,
        snoozeOptions: [5, 10, 15, 30],
      };
    }

    return {
      methods: this.mapAlertMethods(notificationSettings.channels || []),
      soundVolume: notificationSettings.soundVolume,
      popupDuration: notificationSettings.popupDuration,
      allowSnooze: notificationSettings.allowSnooze !== false,
      snoozeOptions: notificationSettings.snoozeOptions || [5, 10, 15, 30],
      customActions: notificationSettings.customActions,
    };
  }

  /**
   * 映射提醒方法
   */
  private mapAlertMethods(channels: string[]): ScheduleContracts.AlertMethod[] {
    const methodMap: Record<string, ScheduleContracts.AlertMethod> = {
      DESKTOP: ScheduleContracts.AlertMethod.POPUP,
      SOUND: ScheduleContracts.AlertMethod.SOUND,
      EMAIL: ScheduleContracts.AlertMethod.EMAIL,
      SMS: ScheduleContracts.AlertMethod.SMS,
      IN_APP: ScheduleContracts.AlertMethod.POPUP,
    };

    const methods: ScheduleContracts.AlertMethod[] = [];

    channels.forEach((channel) => {
      const method = methodMap[channel];
      if (method && !methods.includes(method)) {
        methods.push(method);
      }
    });

    // 默认至少有一个方法
    if (methods.length === 0) {
      methods.push(
        ScheduleContracts.AlertMethod.POPUP,
        ScheduleContracts.AlertMethod.SYSTEM_NOTIFICATION,
      );
    }

    return methods;
  }
}
