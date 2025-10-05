import type { EventHandler } from '@dailyuse/domain-core';
import { ReminderInstanceCreatedEvent } from '../../../reminder/domain/events/ReminderEvents';
import type { ScheduleApplicationService } from '../../application/services/ScheduleApplicationService';
import { ScheduleContracts } from '@dailyuse/contracts';

/**
 * Reminder 实例创建事件处理器
 * 监听 Reminder 实例创建事件，并创建对应的 Schedule 任务
 */
export class ReminderInstanceCreatedHandler implements EventHandler<ReminderInstanceCreatedEvent> {
  constructor(private scheduleService: ScheduleApplicationService) {}

  subscribedTo(): string {
    return ReminderInstanceCreatedEvent.EVENT_TYPE;
  }

  async handle(event: ReminderInstanceCreatedEvent): Promise<void> {
    console.log('🔔 [Schedule] Handling ReminderInstanceCreatedEvent:', {
      instanceUuid: event.aggregateId,
      scheduledTime: event.scheduledTime,
      message: event.message,
    });

    try {
      // 创建 Schedule 任务
      await this.scheduleService.createScheduleTask(event.accountUuid, {
        name: `Reminder: ${event.title}`,
        description: event.message,
        taskType: 'reminder' as any,
        payload: {
          sourceType: 'reminder',
          sourceId: event.aggregateId,
          data: {
            reminderInstanceUuid: event.aggregateId,
            reminderTemplateUuid: event.templateUuid,
            reminderMessage: event.message,
            reminderCategory: event.category,
            ...event.metadata,
          },
        } as any,
        scheduledTime: event.scheduledTime,
        priority: event.priority as any,
        alertConfig: {
          methods: [ScheduleContracts.AlertMethod.POPUP, ScheduleContracts.AlertMethod.SOUND],
          soundVolume: 80,
          popupDuration: 10,
          allowSnooze: true,
          snoozeOptions: [5, 10, 15, 30], // 延后选项：5、10、15、30 分钟
        } as any,
        enabled: true,
      });

      console.log('✅ [Schedule] Successfully created schedule task for reminder:', {
        instanceUuid: event.aggregateId,
        scheduledTime: event.scheduledTime,
      });
    } catch (error) {
      console.error('❌ [Schedule] Failed to create schedule task for reminder:', error);
      throw error; // 重新抛出错误，让事件总线知道处理失败
    }
  }
}
