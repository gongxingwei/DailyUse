/**
 * Event Publisher Interface
 * 事件发布器接口
 *
 * @description 定义发布领域事件的接口
 */

import type { SettingDomainEvent } from '../../domain/events/SettingDomainEvents';

export interface IEventPublisher {
  /**
   * 发布领域事件
   */
  publish(event: SettingDomainEvent): Promise<void>;
}
