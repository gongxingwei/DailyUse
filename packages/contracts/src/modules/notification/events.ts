import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  DeliveryStatus,
} from './enums';

// ============ 通知领域事件 ============

/**
 * 通知创建事件
 */
export interface NotificationCreatedEvent {
  eventType: 'NotificationCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    notificationId: string;
    accountUuid: string;
    type: NotificationType;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    scheduledAt?: Date;
  };
}

/**
 * 通知发送事件
 */
export interface NotificationSentEvent {
  eventType: 'NotificationSent';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    notificationId: string;
    accountUuid: string;
    type: NotificationType;
    channels: NotificationChannel[];
    sentAt: Date;
  };
}

/**
 * 通知已读事件
 */
export interface NotificationReadEvent {
  eventType: 'NotificationRead';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    notificationId: string;
    accountUuid: string;
    readAt: Date;
  };
}

/**
 * 通知忽略事件
 */
export interface NotificationDismissedEvent {
  eventType: 'NotificationDismissed';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    notificationId: string;
    accountUuid: string;
    dismissedAt: Date;
  };
}

/**
 * 通知过期事件
 */
export interface NotificationExpiredEvent {
  eventType: 'NotificationExpired';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    notificationId: string;
    accountUuid: string;
    expiresAt: Date;
  };
}

/**
 * 通知发送失败事件
 */
export interface NotificationFailedEvent {
  eventType: 'NotificationFailed';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    notificationId: string;
    accountUuid: string;
    channels: NotificationChannel[];
    failureReason: string;
    failedAt: Date;
  };
}

// ============ 通知模板事件 ============

/**
 * 通知模板创建事件
 */
export interface NotificationTemplateCreatedEvent {
  eventType: 'NotificationTemplateCreated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    templateId: string;
    name: string;
    type: NotificationType;
  };
}

/**
 * 通知模板更新事件
 */
export interface NotificationTemplateUpdatedEvent {
  eventType: 'NotificationTemplateUpdated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    templateId: string;
    changes: {
      name?: string;
      titleTemplate?: string;
      contentTemplate?: string;
      defaultPriority?: NotificationPriority;
      defaultChannels?: NotificationChannel[];
      enabled?: boolean;
    };
  };
}

/**
 * 通知模板删除事件
 */
export interface NotificationTemplateDeletedEvent {
  eventType: 'NotificationTemplateDeleted';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    templateId: string;
    name: string;
  };
}

/**
 * 通知模板使用事件
 */
export interface NotificationTemplateUsedEvent {
  eventType: 'NotificationTemplateUsed';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    templateId: string;
    notificationId: string;
    accountUuid: string;
    usedAt: Date;
  };
}

// ============ 通知偏好事件 ============

/**
 * 通知偏好更新事件
 */
export interface NotificationPreferenceUpdatedEvent {
  eventType: 'NotificationPreferenceUpdated';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    accountUuid: string;
    changes: {
      enabledTypes?: NotificationType[];
      channelPreferences?: any;
      maxNotifications?: number;
      autoArchiveDays?: number;
    };
  };
}

// ============ 发送回执事件 ============

/**
 * 渠道发送成功事件
 */
export interface ChannelDeliverySucceededEvent {
  eventType: 'ChannelDeliverySucceeded';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    notificationId: string;
    receiptId: string;
    channel: NotificationChannel;
    deliveredAt: Date;
  };
}

/**
 * 渠道发送失败事件
 */
export interface ChannelDeliveryFailedEvent {
  eventType: 'ChannelDeliveryFailed';
  aggregateId: string;
  occurredOn: Date;
  payload: {
    notificationId: string;
    receiptId: string;
    channel: NotificationChannel;
    failureReason: string;
    retryCount: number;
    willRetry: boolean;
  };
}

// ============ 联合类型 ============

/**
 * 所有通知相关事件的联合类型
 */
export type NotificationDomainEvent =
  | NotificationCreatedEvent
  | NotificationSentEvent
  | NotificationReadEvent
  | NotificationDismissedEvent
  | NotificationExpiredEvent
  | NotificationFailedEvent
  | NotificationTemplateCreatedEvent
  | NotificationTemplateUpdatedEvent
  | NotificationTemplateDeletedEvent
  | NotificationTemplateUsedEvent
  | NotificationPreferenceUpdatedEvent
  | ChannelDeliverySucceededEvent
  | ChannelDeliveryFailedEvent;
