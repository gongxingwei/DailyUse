import type { INotification, INotificationTemplate, INotificationPreference } from './types';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  NotificationActionType,
  DeliveryStatus,
} from './enums';

/**
 * ==========================================
 * Notification Module DTOs - RESTful API Design
 * ==========================================
 *
 * 设计原则：
 * 1. RESTful 风格：所有请求数据在 JSON body 中
 * 2. DTO vs ClientDTO：
 *    - DTO: 服务端内部传输对象（纯数据）
 *    - ClientDTO: 客户端渲染对象（包含计算属性）
 * 3. Request DTO: 直接映射实体属性，不过度拆分
 */

// ==================== 通知动作 (NotificationAction) ====================

/**
 * 通知动作 DTO - 值对象
 */
export interface NotificationActionDTO {
  id: string;
  title: string;
  icon?: string;
  type: NotificationActionType;
  payload?: Record<string, any>; // 动作参数（如导航路径、执行参数等）
}

// ==================== 发送回执 (DeliveryReceipt) ====================

/**
 * 发送回执 DTO - 实体
 */
export interface DeliveryReceiptDTO {
  uuid: string;
  notificationUuid: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt?: number; // timestamp
  deliveredAt?: number; // timestamp
  failureReason?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

/**
 * 发送回执客户端 DTO
 */
export type DeliveryReceiptClientDTO = DeliveryReceiptDTO;

// ==================== 通知 (Notification) ====================

/**
 * 通知 DTO - 服务端数据传输对象
 */
export interface NotificationDTO {
  uuid: string;
  accountUuid: string;
  templateUuid?: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel[];
  icon?: string;
  image?: string;
  actions?: NotificationActionDTO[];
  scheduledAt?: number; // timestamp
  sentAt?: number; // timestamp
  readAt?: number; // timestamp
  dismissedAt?: number; // timestamp
  expiresAt?: number; // timestamp
  metadata?: {
    sourceType?: string; // 'goal', 'task', 'reminder', 'schedule', 'system'
    sourceId?: string;
    additionalData?: Record<string, any>;
  };
  lifecycle: {
    createdAt: number;
    updatedAt: number;
  };
  version: number;

  // 关联的发送回执
  deliveryReceipts?: DeliveryReceiptDTO[];
}

/**
 * 通知客户端 DTO - 前端渲染对象
 */
export interface NotificationClientDTO extends Omit<NotificationDTO, 'deliveryReceipts'> {
  // 子实体使用 ClientDTO
  deliveryReceipts?: DeliveryReceiptClientDTO[];

  // ===== 计算属性 - 状态相关 =====
  isRead: boolean; // 是否已读
  isDismissed: boolean; // 是否已忽略
  isExpired: boolean; // 是否已过期
  isPending: boolean; // 是否待发送
  isSent: boolean; // 是否已发送
  isFailed: boolean; // 是否发送失败

  // ===== 计算属性 - 时间相关 =====
  remainingTime?: number; // 剩余有效时间（毫秒）
  timeSinceSent?: number; // 发送后经过的时间（毫秒）

  // ===== 计算属性 - 发送状态 =====
  deliveryStatus: {
    totalChannels: number;
    sentChannels: number;
    deliveredChannels: number;
    failedChannels: number;
    successRate: number; // 0-100
  };
}

/**
 * 创建通知请求 - POST /api/v1/notifications
 */
export type CreateNotificationRequest = Pick<
  NotificationDTO,
  'uuid' | 'accountUuid' | 'title' | 'content' | 'type' | 'priority' | 'channels'
> & {
  templateUuid?: string;
  icon?: string;
  image?: string;
  actions?: NotificationActionDTO[];
  scheduledAt?: number;
  expiresAt?: number;
  metadata?: NotificationDTO['metadata'];
};

/**
 * 从模板创建通知请求 - POST /api/v1/notifications/from-template
 */
export interface CreateNotificationFromTemplateRequest {
  uuid: string;
  accountUuid: string;
  templateUuid: string;
  variables: Record<string, any>; // 模板变量替换
  channels?: NotificationChannel[]; // 覆盖模板默认渠道
  priority?: NotificationPriority; // 覆盖模板默认优先级
  scheduledAt?: number;
  expiresAt?: number;
  metadata?: NotificationDTO['metadata'];
}

/**
 * 更新通知请求 - PUT /api/v1/notifications/:notificationId
 */
export type UpdateNotificationRequest = Partial<
  Pick<NotificationDTO, 'title' | 'content' | 'icon' | 'image' | 'scheduledAt' | 'expiresAt'>
>;

/**
 * 标记通知为已读请求 - POST /api/v1/notifications/:notificationId/read
 */
export interface MarkNotificationAsReadRequest {
  readAt?: number; // 默认为当前时间
}

/**
 * 标记通知为已忽略请求 - POST /api/v1/notifications/:notificationId/dismiss
 */
export interface DismissNotificationRequest {
  dismissedAt?: number; // 默认为当前时间
}

/**
 * 批量标记已读请求 - POST /api/v1/notifications/batch-read
 */
export interface BatchMarkAsReadRequest {
  notificationUuids: string[];
  readAt?: number;
}

/**
 * 批量忽略请求 - POST /api/v1/notifications/batch-dismiss
 */
export interface BatchDismissRequest {
  notificationUuids: string[];
  dismissedAt?: number;
}

// ==================== 通知模板 (NotificationTemplate) ====================

/**
 * 通知模板 DTO - 服务端数据传输对象
 */
export interface NotificationTemplateDTO {
  uuid: string;
  name: string;
  type: NotificationType;
  titleTemplate: string;
  contentTemplate: string;
  icon?: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  defaultActions?: NotificationActionDTO[];
  variables: string[]; // 模板变量名称列表，如 ['userName', 'goalName', 'progress']
  enabled: boolean;
  lifecycle: {
    createdAt: number;
    updatedAt: number;
  };
}

/**
 * 通知模板客户端 DTO
 */
export interface NotificationTemplateClientDTO extends NotificationTemplateDTO {
  // ===== 计算属性 =====
  usageCount: number; // 使用次数
  lastUsedAt?: number; // 最后使用时间
}

/**
 * 创建通知模板请求 - POST /api/v1/notification-templates
 */
export type CreateNotificationTemplateRequest = Pick<
  NotificationTemplateDTO,
  | 'uuid'
  | 'name'
  | 'type'
  | 'titleTemplate'
  | 'contentTemplate'
  | 'defaultPriority'
  | 'defaultChannels'
  | 'variables'
> & {
  icon?: string;
  defaultActions?: NotificationActionDTO[];
  enabled?: boolean; // 默认为 true
};

/**
 * 更新通知模板请求 - PUT /api/v1/notification-templates/:templateId
 */
export type UpdateNotificationTemplateRequest = Partial<
  Omit<NotificationTemplateDTO, 'uuid' | 'lifecycle'>
>;

// ==================== 通知偏好 (NotificationPreference) ====================

/**
 * 通知偏好 DTO - 服务端数据传输对象
 */
export interface NotificationPreferenceDTO {
  uuid: string;
  accountUuid: string;
  enabledTypes: NotificationType[]; // 启用的通知类型
  channelPreferences: {
    [key in NotificationChannel]?: {
      enabled: boolean;
      types?: NotificationType[]; // 该渠道启用的通知类型（为空表示全部）
      quietHours?: {
        // 免打扰时段
        enabled: boolean;
        startTime: string; // HH:mm 格式，如 "22:00"
        endTime: string; // HH:mm 格式，如 "08:00"
      };
      settings?: {
        // 渠道特定设置
        showPreview?: boolean;
        playSound?: boolean;
        soundFile?: string;
        vibrate?: boolean;
        displayDuration?: number; // 毫秒
      };
    };
  };
  maxNotifications: number; // 最大通知数量（IN_APP）
  autoArchiveDays: number; // 自动归档天数
  lifecycle: {
    createdAt: number;
    updatedAt: number;
  };
}

/**
 * 通知偏好客户端 DTO
 */
export type NotificationPreferenceClientDTO = NotificationPreferenceDTO;

/**
 * 创建/更新通知偏好请求 - PUT /api/v1/notification-preferences
 */
export type UpsertNotificationPreferenceRequest = Partial<
  Omit<NotificationPreferenceDTO, 'uuid' | 'accountUuid' | 'lifecycle'>
>;

// ==================== 列表响应 DTOs ====================

/**
 * 通知列表响应
 */
export interface NotificationListResponse {
  data: NotificationClientDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 通知模板列表响应
 */
export interface NotificationTemplateListResponse {
  data: NotificationTemplateClientDTO[];
  total: number;
}

/**
 * 发送回执列表响应
 */
export interface DeliveryReceiptListResponse {
  data: DeliveryReceiptClientDTO[];
  total: number;
}

// ==================== 其他响应 DTOs ====================

/**
 * 通知统计响应 DTO
 */
export interface NotificationStatsResponse {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  dismissedNotifications: number;
  failedNotifications: number;
  readRate: number; // 阅读率 0-100
  dismissalRate: number; // 忽略率 0-100
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byChannel: Record<NotificationChannel, number>;
  byStatus: Record<NotificationStatus, number>;
  recentTrend: Array<{
    date: number;
    sent: number;
    read: number;
    dismissed: number;
  }>;
}

/**
 * 未读通知数量响应
 */
export interface UnreadCountResponse {
  count: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

/**
 * 发送通知响应
 */
export interface SendNotificationResponse {
  notificationUuid: string;
  status: NotificationStatus;
  deliveryReceipts: DeliveryReceiptClientDTO[];
  sentChannels: NotificationChannel[];
  failedChannels: NotificationChannel[];
  message: string;
}

// ==================== 兼容性别名（逐步废弃）====================

/**
 * @deprecated 使用 NotificationClientDTO 替代
 */
export type NotificationResponse = NotificationClientDTO;

/**
 * @deprecated 使用 NotificationTemplateClientDTO 替代
 */
export type NotificationTemplateResponse = NotificationTemplateClientDTO;

/**
 * @deprecated 使用 NotificationPreferenceClientDTO 替代
 */
export type NotificationPreferenceResponse = NotificationPreferenceClientDTO;
