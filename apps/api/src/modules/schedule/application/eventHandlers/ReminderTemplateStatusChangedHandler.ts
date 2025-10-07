/**
 * ReminderTemplateStatusChanged Event Handler
 *
 * 监听 Reminder 模块的模板启用状态变更事件
 * 自动启用/禁用对应的 RecurringScheduleTask
 */

import type { EventHandler, DomainEvent } from '@dailyuse/domain-core';
import type { RecurringScheduleTaskDomainService } from '@dailyuse/domain-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderTemplateStatusChangedHandler');

/**
 * 提醒模板状态变更事件
 * 当模板的 enabled 或 selfEnabled 改变时触发
 */
interface ReminderTemplateStatusChangedEvent extends DomainEvent {
  eventType: 'ReminderTemplateStatusChanged';
  aggregateId: string; // templateUuid
  payload: {
    templateUuid: string;
    templateName?: string;
    groupUuid?: string;
    oldEnabled: boolean;
    newEnabled: boolean;
    template: any;
    accountUuid?: string;
  };
}

/**
 * ReminderTemplate 启用状态变更事件处理器
 *
 * 职责：
 * 1. 监听 ReminderTemplateStatusChanged 事件
 * 2. 查找对应的 RecurringScheduleTask
 * 3. 根据 newEnabled 启用/禁用调度任务
 * 4. 更新 nextRunAt 时间
 */
export class ReminderTemplateStatusChangedHandler implements EventHandler {
  constructor(private recurringScheduleTaskDomainService: RecurringScheduleTaskDomainService) {}

  /**
   * 获取此处理器关注的事件类型
   */
  subscribedTo(): string {
    return 'ReminderTemplateStatusChanged';
  }

  /**
   * 处理事件
   */
  async handle(event: DomainEvent): Promise<void> {
    const reminderEvent = event as ReminderTemplateStatusChangedEvent;
    const { templateUuid, templateName, oldEnabled, newEnabled, accountUuid } =
      reminderEvent.payload;

    try {
      logger.info('🔔 收到 ReminderTemplateStatusChanged 事件', {
        templateUuid,
        templateName,
        oldEnabled,
        newEnabled,
        accountUuid,
      });

      // 状态未变化，跳过处理
      if (oldEnabled === newEnabled) {
        logger.debug('⏭️ 状态未变化，跳过处理', { templateUuid });
        return;
      }

      // 查找关联的 RecurringScheduleTask
      const tasks = await this.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        templateUuid,
      );

      if (!tasks || tasks.length === 0) {
        logger.warn('⚠️ 未找到关联的 RecurringScheduleTask', {
          sourceModule: 'reminder',
          sourceEntityId: templateUuid,
          templateName,
        });
        return;
      }

      // 更新所有关联任务的启用状态
      for (const task of tasks) {
        const oldTaskEnabled = task.enabled;

        if (newEnabled) {
          // 启用任务
          await this.recurringScheduleTaskDomainService.updateTask(task.uuid, {
            enabled: true,
          });
          logger.info('✅ RecurringScheduleTask 已启用', {
            taskUuid: task.uuid,
            taskName: task.name,
            templateUuid,
            nextRunAt: task.nextRunAt,
          });
        } else {
          // 禁用任务
          await this.recurringScheduleTaskDomainService.updateTask(task.uuid, {
            enabled: false,
          });
          logger.info('🚫 RecurringScheduleTask 已禁用', {
            taskUuid: task.uuid,
            taskName: task.name,
            templateUuid,
          });
        }

        logger.info('💾 RecurringScheduleTask 状态已更新', {
          taskUuid: task.uuid,
          oldEnabled: oldTaskEnabled,
          newEnabled: task.enabled,
          status: task.status,
        });
      }

      logger.info('🎉 ReminderTemplateStatusChanged 事件处理完成', {
        templateUuid,
        updatedTaskCount: tasks.length,
      });
    } catch (error) {
      logger.error('❌ 处理 ReminderTemplateStatusChanged 事件失败', {
        templateUuid,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // 不抛出错误，避免影响其他事件处理器
      // 业务可以容忍事件处理失败（后续可通过手动同步修复）
    }
  }
}
