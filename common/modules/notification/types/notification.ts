import { ImportanceLevel } from "@common/shared/types/importance";

/**
 * 通知窗口选项基础接口
 */
export interface INotificationWindowOptions {
  uuid: string;
  title: string;
  body: string;
  importance: ImportanceLevel;
  actions?: Array<{ text: string; type: 'confirm' | 'cancel' | 'action' }>;
  createdAt: Date;
  expiresAt?: Date;
  isRead: boolean;
  isInteractive: boolean;
}

/**
 * 主进程通知窗口选项接口
 */
export interface IMainProcessNotificationWindowOptions extends INotificationWindowOptions {}

/**
 * 渲染进程通知窗口选项接口
 */
export interface IRenderProcessNotificationWindowOptions extends INotificationWindowOptions {}

/**
 * 通知窗口选项 DTO
 */
export interface INotificationWindowOptionsDTO {
  uuid: string;
  title: string;
  body: string;
  importance: ImportanceLevel;
  actions?: Array<{ text: string; type: 'confirm' | 'cancel' | 'action' }>;
  createdAt: number;
  expiresAt?: number;
  isRead: number; // 0 或 1
  isInteractive: number; // 0 或 1
}

/**
 * 通知窗口选项类型（向后兼容）
 */
export type NotificationWindowOptions = Pick<INotificationWindowOptions, 'uuid' | 'title' | 'body' | 'importance' | 'actions'>;

/**
 * 通知状态枚举
 */
export enum NotificationStatus {
  PENDING = "pending",
  SHOWN = "shown",
  DISMISSED = "dismissed",
  EXPIRED = "expired",
  INTERACTED = "interacted"
}

/**
 * 通知配置接口
 */
export interface INotificationConfig {
  /** 是否启用通知 */
  enabled: boolean;
  /** 是否启用声音 */
  soundEnabled: boolean;
  /** 是否在忙碌时静音 */
  muteWhenBusy: boolean;
  /** 通知显示持续时间（毫秒） */
  displayDuration: number;
  /** 最大同时显示通知数量 */
  maxConcurrentNotifications: number;
  /** 免打扰时间段 */
  doNotDisturbPeriods: Array<{
    startTime: string; // "HH:mm" 格式
    endTime: string;   // "HH:mm" 格式
    days: number[];    // 0-6，周日到周六
  }>;
}

/**
 * 通知配置 DTO
 */
export interface INotificationConfigDTO {
  /** 是否启用通知 */
  enabled: number; // 0 或 1
  /** 是否启用声音 */
  soundEnabled: number; // 0 或 1
  /** 是否在忙碌时静音 */
  muteWhenBusy: number; // 0 或 1
  /** 通知显示持续时间（毫秒） */
  displayDuration: number;
  /** 最大同时显示通知数量 */
  maxConcurrentNotifications: number;
  /** 免打扰时间段 */
  doNotDisturbPeriods: Array<{
    startTime: string; // "HH:mm" 格式
    endTime: string;   // "HH:mm" 格式
    days: number[];    // 0-6，周日到周六
  }>;
}

/**
 * 通知历史记录接口
 */
export interface INotificationHistory {
  uuid: string;
  notificationId: string;
  status: NotificationStatus;
  shownAt?: Date;
  dismissedAt?: Date;
  interactedAt?: Date;
  actionTaken?: string;
  deviceInfo: string;
}

/**
 * 通知历史记录 DTO
 */
export interface INotificationHistoryDTO {
  uuid: string;
  notificationId: string;
  status: NotificationStatus;
  shownAt?: number;
  dismissedAt?: number;
  interactedAt?: number;
  actionTaken?: string;
  deviceInfo: string;
}
