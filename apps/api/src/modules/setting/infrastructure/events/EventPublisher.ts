/**
 * Event Publisher Implementation
 * 事件发布器实现
 *
 * @description 将领域事件发布到事件总线
 */

import type { IEventPublisher } from '../../application/interfaces/IEventPublisher';
import type { SettingDomainEvent } from '../../domain/events/SettingDomainEvents';
import { eventBus } from '../../../../shared/events/EventBus';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EventPublisher');

export class EventPublisher implements IEventPublisher {
  async publish(event: SettingDomainEvent): Promise<void> {
    logger.info('Publishing domain event', {
      eventType: event.eventType,
      accountUuid: event.accountUuid,
      timestamp: event.timestamp,
    });

    try {
      // 发布事件到事件总线
      eventBus.emit(event.eventType, event);

      logger.debug('Event published successfully', {
        eventType: event.eventType,
      });
    } catch (error) {
      logger.error('Failed to publish event', error, {
        eventType: event.eventType,
        accountUuid: event.accountUuid,
      });
      throw error;
    }
  }
}
