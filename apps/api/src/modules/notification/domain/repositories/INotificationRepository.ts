import { Notification } from '../aggregates/Notification';
import { NotificationStatus, NotificationType, NotificationChannel } from '@dailyuse/contracts';

/**
 * 通知查询选项
 */
export interface NotificationQueryOptions {
  accountUuid?: string;
  status?: NotificationStatus[];
  type?: NotificationType[];
  channels?: NotificationChannel[];
  scheduledBefore?: Date;
  scheduledAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'sentAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Notification 仓储接口
 *
 * 职责：
 * - 持久化 Notification 聚合根
 * - 查询通知
 * - 管理通知生命周期
 */
export interface INotificationRepository {
  /**
   * 保存通知（创建或更新）
   */
  save(notification: Notification): Promise<Notification>;

  /**
   * 根据 UUID 查找通知
   */
  findByUuid(uuid: string): Promise<Notification | null>;

  /**
   * 根据账户 UUID 查找通知列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: NotificationQueryOptions,
  ): Promise<Notification[]>;

  /**
   * 查询通知（高级查询）
   */
  query(options: NotificationQueryOptions): Promise<{
    notifications: Notification[];
    total: number;
  }>;

  /**
   * 获取待发送的通知
   */
  findPendingNotifications(before?: Date): Promise<Notification[]>;

  /**
   * 获取已过期的通知
   */
  findExpiredNotifications(): Promise<Notification[]>;

  /**
   * 获取未读通知数量
   */
  countUnread(accountUuid: string): Promise<number>;

  /**
   * 批量更新通知状态
   */
  batchUpdateStatus(uuids: string[], status: NotificationStatus, timestamp?: Date): Promise<void>;

  /**
   * 删除通知
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量删除通知
   */
  batchDelete(uuids: string[]): Promise<void>;

  /**
   * 归档旧通知
   */
  archiveOldNotifications(accountUuid: string, olderThanDays: number): Promise<number>;
}
