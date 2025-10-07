/**
 * ReminderTemplateCreated Event Handler
 * @description Schedule 模块监听 Reminder 模块的模板创建事件，自动创建调度任务
 * @author DailyUse Team
 * @date 2025-01-10
 */

import type { EventHandler, DomainEvent } from '@dailyuse/domain-core';
import { ScheduleContracts } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import {
  dailyAtTimeToCron,
  weeklyAtTimeToCron,
  monthlyAtTimeToCron,
  everyNHoursToCron,
  everyNMinutesToCron,
  dateTimeToCron,
} from '@dailyuse/domain-server';
import type { ScheduleTaskDomainService } from '@dailyuse/domain-server';

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
  constructor(private readonly scheduleTaskDomainService: ScheduleTaskDomainService) {}

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
      // 解析 timeConfig 生成 Cron 表达式
      const cronExpression = this.parseTimeConfig(template);

      if (!cronExpression) {
        logger.warn('无法解析 timeConfig，跳过创建调度任务', {
          templateUuid: template.uuid,
          timeConfig: template.timeConfig,
        });
        return;
      }

      // 创建调度任务（使用新的统一 Cron 设计）
      const createRequest: ScheduleContracts.CreateScheduleTaskDTO = {
        name: `Reminder: ${template.name}`,
        description: template.description || template.message,
        cronExpression,
        sourceModule: 'reminder',
        sourceEntityId: template.uuid,
        metadata: {
          accountUuid,
          templateName: template.name,
          message: template.message,
          priority: template.priority || 'NORMAL',
          notificationSettings: template.notificationSettings,
          ...template.metadata,
        },
        enabled: template.enabled,
      };

      const scheduleTask = await this.scheduleTaskDomainService.createTask(createRequest);

      logger.info('✅ 调度任务创建成功', {
        templateUuid: template.uuid,
        scheduleTaskUuid: scheduleTask.uuid,
        cronExpression: scheduleTask.cronExpression,
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
   * 解析 timeConfig 生成 Cron 表达式
   *
   * @description 使用统一的 Cron 设计，将所有时间配置转换为 Cron 表达式
   */
  private parseTimeConfig(
    template: ReminderTemplateCreatedEvent['payload']['template'],
  ): string | null {
    const { timeConfig } = template;

    if (!timeConfig) {
      logger.warn('模板缺少 timeConfig', { templateUuid: template.uuid });
      return null;
    }

    try {
      // 处理 CRON 类型 - 直接使用提供的 cron 表达式
      if (timeConfig.type === 'CRON' && timeConfig.cronExpression) {
        logger.debug('使用 CRON 表达式', {
          templateUuid: template.uuid,
          cronExpression: timeConfig.cronExpression,
        });
        return timeConfig.cronExpression;
      }

      // 处理 RELATIVE 类型（相对时间）
      if (timeConfig.type === 'RELATIVE' && timeConfig.schedule) {
        const { pattern, interval } = timeConfig.schedule;
        const int = interval || 1;

        let cronExpression: string | null = null;

        switch (pattern) {
          case 'daily':
            cronExpression = dailyAtTimeToCron(9, 0); // 默认每天 9:00
            break;
          case 'weekly':
            cronExpression = weeklyAtTimeToCron(int, 9, 0); // 每周指定天 9:00
            break;
          case 'monthly':
            cronExpression = monthlyAtTimeToCron(int, 9, 0); // 每月指定日 9:00
            break;
          case 'hourly':
            cronExpression = everyNHoursToCron(int, 0); // 每 N 小时
            break;
          case 'minutely':
            cronExpression = everyNMinutesToCron(int); // 每 N 分钟
            break;
          default:
            logger.warn('未知的 RELATIVE pattern', { pattern, templateUuid: template.uuid });
            return null;
        }

        logger.debug('转换 RELATIVE 时间为 Cron', {
          templateUuid: template.uuid,
          pattern,
          interval: int,
          cronExpression,
        });
        return cronExpression;
      }

      // 处理 ABSOLUTE 类型（绝对时间）
      if (timeConfig.type === 'ABSOLUTE' && timeConfig.schedule) {
        const { pattern, endCondition } = timeConfig.schedule;

        // ONCE 类型：一次性任务
        if (pattern === 'once' && endCondition?.endDate) {
          const targetDate = new Date(endCondition.endDate);
          const cronExpression = dateTimeToCron(targetDate);
          logger.debug('转换 ONCE 任务为 Cron', {
            templateUuid: template.uuid,
            targetDate: targetDate.toISOString(),
            cronExpression,
          });
          return cronExpression;
        }

        // 其他重复类型
        let cronExpression: string | null = null;

        switch (pattern) {
          case 'daily':
            cronExpression = dailyAtTimeToCron(9, 0);
            break;
          case 'weekly':
            cronExpression = weeklyAtTimeToCron(1, 9, 0); // 默认周一 9:00
            break;
          case 'monthly':
            cronExpression = monthlyAtTimeToCron(1, 9, 0); // 默认每月1号 9:00
            break;
          default:
            logger.warn('未知的 ABSOLUTE pattern', { pattern, templateUuid: template.uuid });
            return null;
        }

        logger.debug('转换 ABSOLUTE 时间为 Cron', {
          templateUuid: template.uuid,
          pattern,
          cronExpression,
        });
        return cronExpression;
      }

      logger.warn('无法识别的 timeConfig 类型', {
        templateUuid: template.uuid,
        type: timeConfig.type,
      });
      return null;
    } catch (error) {
      logger.error('转换 timeConfig 为 Cron 表达式失败', {
        templateUuid: template.uuid,
        timeConfig,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}
