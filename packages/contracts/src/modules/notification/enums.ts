/**
 * Notification 模块枚举定义
 */

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  REMINDER = 'reminder',
  SYSTEM = 'system',
  ALERT = 'alert',
  MESSAGE = 'message',
  UPDATE = 'update',
  // Schedule 相关通知类型
  SCHEDULE_REMINDER = 'schedule_reminder',
  TASK_REMINDER = 'task_reminder',
  GOAL_MILESTONE = 'goal_milestone',
  // 自定义通知
  CUSTOM = 'custom',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  DISMISSED = 'dismissed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  SSE = 'sse',
  SYSTEM = 'system',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationActionType {
  NAVIGATE = 'navigate',
  EXECUTE = 'execute',
  DISMISS = 'dismiss',
}

export enum NotificationSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRIORITY = 'priority',
  STATUS = 'status',
  SENT_AT = 'sentAt',
  READ_AT = 'readAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
}
