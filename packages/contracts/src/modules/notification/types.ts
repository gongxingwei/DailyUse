/**
 * Notification 模块类型定义
 *
 * 定义通知相关的接口、枚举和类型
 */

import {
  NotificationActionType,
  NotificationChannel,
  NotificationPriority,
  NotificationSortField,
  NotificationStatus,
  NotificationType,
  SortOrder,
} from './enums';

// ========== 接口定义 ==========

/**
 * 通知动作接口
 */
export interface NotificationAction {
  /** 动作ID */
  id: string;
  /** 动作标题 */
  title: string;
  /** 动作图标 */
  icon?: string;
  /** 动作类型 */
  type: NotificationActionType;
  /** 点击回调 */
  callback?: () => void;
}

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  /** 是否启用 */
  enabled: boolean;
  /** 通知渠道 */
  channels: NotificationChannel[];
  /** 是否显示预览 */
  showPreview: boolean;
  /** 是否播放声音 */
  playSound: boolean;
  /** 声音文件路径 */
  soundFile?: string;
  /** 是否震动 */
  vibrate: boolean;
  /** 显示时长（毫秒） */
  displayDuration: number;
  /** 自动关闭 */
  autoClose: boolean;
  /** 最大通知数量 */
  maxNotifications: number;
}

/**
 * 通知模板接口
 */
export interface INotificationTemplate {
  /** 模板UUID */
  uuid: string;
  /** 模板名称 */
  name: string;
  /** 模板类型 */
  type: NotificationType;
  /** 标题模板 */
  titleTemplate: string;
  /** 内容模板 */
  contentTemplate: string;
  /** 图标 */
  icon?: string;
  /** 默认优先级 */
  defaultPriority: NotificationPriority;
  /** 默认渠道 */
  defaultChannels: NotificationChannel[];
  /** 默认动作 */
  defaultActions?: NotificationAction[];
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 通知实例接口
 */
export interface INotification {
  /** 通知UUID */
  uuid: string;
  /** 关联模板UUID */
  templateUuid?: string;
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 通知类型 */
  type: NotificationType;
  /** 优先级 */
  priority: NotificationPriority;
  /** 状态 */
  status: NotificationStatus;
  /** 通知渠道 */
  channels: NotificationChannel[];
  /** 图标 */
  icon?: string;
  /** 图片 */
  image?: string;
  /** 动作列表 */
  actions?: NotificationAction[];
  /** 目标用户 */
  targetUser?: string;
  /** 发送时间 */
  scheduledAt?: Date;
  /** 实际发送时间 */
  sentAt?: Date;
  /** 阅读时间 */
  readAt?: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** 元数据 */
  metadata?: Record<string, any>;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 通知队列接口
 */
export interface INotificationQueue {
  /** 队列UUID */
  uuid: string;
  /** 队列名称 */
  name: string;
  /** 最大队列长度 */
  maxLength: number;
  /** 处理间隔（毫秒） */
  processingInterval: number;
  /** 重试次数 */
  maxRetries: number;
  /** 是否启用 */
  enabled: boolean;
  /** 当前队列长度 */
  currentLength: number;
  /** 处理状态 */
  isProcessing: boolean;
  /** 最后处理时间 */
  lastProcessedAt?: Date;
}

/**
 * 通知订阅接口
 */
export interface INotificationSubscription {
  /** 订阅UUID */
  uuid: string;
  /** 用户ID */
  userId: string;
  /** 订阅类型 */
  notificationType: NotificationType[];
  /** 订阅渠道 */
  channels: NotificationChannel[];
  /** 通知设置 */
  settings: NotificationSettings;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 通知统计信息接口
 */
export interface NotificationStatistics {
  /** 总通知数 */
  totalNotifications: number;
  /** 已发送通知数 */
  sentNotifications: number;
  /** 已读通知数 */
  readNotifications: number;
  /** 未读通知数 */
  unreadNotifications: number;
  /** 已忽略通知数 */
  dismissedNotifications: number;
  /** 发送失败通知数 */
  failedNotifications: number;
  /** 阅读率 */
  readRate: number;
  /** 忽略率 */
  dismissalRate: number;
  /** 按类型统计 */
  byType: Record<NotificationType, number>;
  /** 按优先级统计 */
  byPriority: Record<NotificationPriority, number>;
  /** 按渠道统计 */
  byChannel: Record<NotificationChannel, number>;
  /** 按状态统计 */
  byStatus: Record<NotificationStatus, number>;
}

/**
 * 通知查询参数接口
 */
export interface NotificationQueryParams {
  /** 通知类型 */
  type?: NotificationType[];
  /** 通知状态 */
  status?: NotificationStatus[];
  /** 优先级 */
  priority?: NotificationPriority[];
  /** 通知渠道 */
  channels?: NotificationChannel[];
  /** 目标用户 */
  targetUser?: string;
  /** 时间范围 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 关键字搜索 */
  keyword?: string;
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
  /** 排序字段 */
  sortBy?: NotificationSortField;
  /** 排序方向 */
  sortOrder?: SortOrder;
}
