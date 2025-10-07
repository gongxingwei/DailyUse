/**
 * Notification 模块持久化 DTO 定义
 */

import {
  NotificationActionType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  DeliveryStatus,
} from './enums';

export interface NotificationTemplatePersistenceDTO {
  uuid: string;
  name: string;
  type: NotificationType;
  titleTemplate: string;
  contentTemplate: string;
  icon?: string;
  defaultPriority: NotificationPriority;
  defaultChannels: string; // JSON string of NotificationChannel[]
  defaultActions?: string; // JSON string of NotificationActionPersistenceDTO[]
  variables: string; // JSON string of string[]
  enabled: number; // 0 or 1
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface NotificationPersistenceDTO {
  uuid: string;
  accountUuid: string;
  templateUuid?: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: string; // JSON string of NotificationChannel[]
  icon?: string;
  image?: string;
  actions?: string; // JSON string of NotificationActionPersistenceDTO[]
  scheduledAt?: number; // timestamp
  sentAt?: number; // timestamp
  readAt?: number; // timestamp
  dismissedAt?: number; // timestamp
  expiresAt?: number; // timestamp
  metadata?: string; // JSON string
  version: number;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface NotificationActionPersistenceDTO {
  id: string;
  title: string;
  icon?: string;
  type: NotificationActionType;
  payload?: string; // JSON string
}

export interface DeliveryReceiptPersistenceDTO {
  uuid: string;
  notificationUuid: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt?: number; // timestamp
  deliveredAt?: number; // timestamp
  failureReason?: string;
  retryCount: number;
  metadata?: string; // JSON string
}

export interface NotificationPreferencePersistenceDTO {
  uuid: string;
  accountUuid: string;
  enabledTypes: string; // JSON string of NotificationType[]
  channelPreferences: string; // JSON string
  maxNotifications: number;
  autoArchiveDays: number;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

/**
 * @deprecated 使用 NotificationPreferencePersistenceDTO 替代
 */
export interface NotificationSubscriptionPersistenceDTO {
  uuid: string;
  userId: string;
  notificationType: NotificationType[];
  channels: NotificationChannel[];
  settings: NotificationSettingsPersistenceDTO;
  enabled: number; // 0 or 1
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

/**
 * @deprecated
 */
export interface NotificationSettingsPersistenceDTO {
  enabled: number; // 0 or 1
  channels: NotificationChannel[];
  showPreview: number; // 0 or 1
  playSound: number; // 0 or 1
  soundFile?: string;
  vibrate: number; // 0 or 1
  displayDuration: number;
  autoClose: number; // 0 or 1
  maxNotifications: number;
}

/**
 * @deprecated
 */
export interface NotificationQueuePersistenceDTO {
  uuid: string;
  name: string;
  maxLength: number;
  processingInterval: number;
  maxRetries: number;
  enabled: number; // 0 or 1
  currentLength: number;
  isProcessing: number; // 0 or 1
  lastProcessedAt?: number; // timestamp
}
