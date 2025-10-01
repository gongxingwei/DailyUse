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
  SYSTEM = 'system',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationActionType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
}

export enum NotificationSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRIORITY = 'priority',
  STATUS = 'status',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
