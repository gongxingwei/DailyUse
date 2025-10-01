/**
 * Notification 模块持久化 DTO 定义
 */

import {
  NotificationActionType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from './enums';

export interface NotificationTemplatePersistenceDTO {
  uuid: string;
  name: string;
  type: NotificationType;
  titleTemplate: string;
  contentTemplate: string;
  icon?: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  defaultActions?: NotificationActionPersistenceDTO[];
  enabled: number; // 0 or 1
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface NotificationPersistenceDTO {
  uuid: string;
  templateUuid?: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel[];
  icon?: string;
  image?: string;
  actions?: NotificationActionPersistenceDTO[];
  targetUser?: string;
  scheduledAt?: number; // timestamp
  sentAt?: number; // timestamp
  readAt?: number; // timestamp
  expiresAt?: number; // timestamp
  metadata?: string; // JSON string
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface NotificationActionPersistenceDTO {
  id: string;
  title: string;
  icon?: string;
  type: NotificationActionType;
}

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
