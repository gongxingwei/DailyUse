import {
  NotificationDomainService,
  NotificationPreferenceDomainService,
} from '@dailyuse/domain-server';
import { NotificationContainer } from '../../infrastructure/di/NotificationContainer';
import { createLogger } from '@dailyuse/utils';
import { NotificationContracts } from '@dailyuse/contracts';

// 类型别名导出（统一在顶部）
type NotificationClientDTO = NotificationContracts.NotificationClientDTO;
type NotificationTemplateClientDTO = NotificationContracts.NotificationTemplateClient;
type NotificationPreferenceClientDTO = NotificationContracts.NotificationPreferenceClientDTO;
type NotificationChannelType = NotificationContracts.NotificationChannelType;
type NotificationCategory = NotificationContracts.NotificationCategory;
type NotificationType = NotificationContracts.NotificationType;
type RelatedEntityType = NotificationContracts.RelatedEntityType;

const logger = createLogger('NotificationApplicationService');

/**
 * Notification 应用服务
 * 负责协调领域服务和仓储，处理通知相关业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - 返回 ClientDTO 给接口层
 */
export class NotificationApplicationService {
  private static instance: NotificationApplicationService | null = null;
  private domainService!: NotificationDomainService;
  private preferenceService!: NotificationPreferenceDomainService;

  private constructor() {}

  static async getInstance(): Promise<NotificationApplicationService> {
    if (!NotificationApplicationService.instance) {
      const service = new NotificationApplicationService();
      await service.initialize();
      NotificationApplicationService.instance = service;
    }
    return NotificationApplicationService.instance;
  }

  private async initialize(): Promise<void> {
    const notificationRepo = NotificationContainer.getNotificationRepository();
    const templateRepo = NotificationContainer.getNotificationTemplateRepository();
    const preferenceRepo = NotificationContainer.getNotificationPreferenceRepository();

    this.preferenceService = new NotificationPreferenceDomainService(preferenceRepo);
    this.domainService = new NotificationDomainService(
      notificationRepo,
      this.preferenceService,
      templateRepo,
    );
  }

  /**
   * 创建通知
   */
  async createNotification(params: {
    accountUuid: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    channels?: NotificationChannelType[];
  }): Promise<NotificationClientDTO> {
    const notification = await this.domainService.createNotification(params);
    return notification.toClientDTO();
  }

  /**
   * 从模板创建通知
   */
  async createNotificationFromTemplate(params: {
    accountUuid: string;
    templateUuid: string;
    variables: Record<string, any>;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    channels?: NotificationChannelType[];
  }): Promise<NotificationClientDTO> {
    const notification = await this.domainService.createNotificationFromTemplate(params);
    return notification.toClientDTO();
  }

  /**
   * 批量发送通知
   */
  async sendBulkNotifications(
    notifications: Array<{
      accountUuid: string;
      title: string;
      content: string;
      type: NotificationType;
      category: NotificationCategory;
      relatedEntityType?: RelatedEntityType;
      relatedEntityUuid?: string;
      channels?: NotificationChannelType[];
    }>,
  ): Promise<NotificationClientDTO[]> {
    const created = await this.domainService.sendBulkNotifications(notifications);
    return created.map((n: any) => n.toClientDTO());
  }

  /**
   * 获取通知详情
   */
  async getNotification(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<NotificationClientDTO | null> {
    try {
      const notification = await this.domainService.getNotification(uuid, options);
      return notification ? notification.toClientDTO() : null;
    } catch (error) {
      logger.error('Error getting notification', { error });
      return null;
    }
  }

  /**
   * 获取用户的通知列表
   */
  async getUserNotifications(
    accountUuid: string,
    options?: {
      includeRead?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getUserNotifications(accountUuid, options);
    return notifications.map((n: any) => n.toClientDTO());
  }

  /**
   * 获取未读通知
   */
  async getUnreadNotifications(
    accountUuid: string,
    options?: { limit?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getUnreadNotifications(accountUuid, options);
    return notifications.map((n: any) => n.toClientDTO());
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(accountUuid: string): Promise<number> {
    return this.domainService.getUnreadCount(accountUuid);
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats(accountUuid: string): Promise<Record<NotificationCategory, number>> {
    return this.domainService.getCategoryStats(accountUuid);
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(uuid: string): Promise<void> {
    await this.domainService.markAsRead(uuid);
  }

  /**
   * 批量标记为已读
   */
  async markManyAsRead(uuids: string[]): Promise<void> {
    await this.domainService.markManyAsRead(uuids);
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(accountUuid: string): Promise<void> {
    await this.domainService.markAllAsRead(accountUuid);
  }

  /**
   * 删除通知
   */
  async deleteNotification(uuid: string, soft = true): Promise<void> {
    await this.domainService.deleteNotification(uuid, soft);
  }

  /**
   * 批量删除通知
   */
  async deleteManyNotifications(uuids: string[], soft = true): Promise<void> {
    await this.domainService.deleteManyNotifications(uuids, soft);
  }

  /**
   * 执行通知操作
   */
  async executeNotificationAction(notificationUuid: string, actionId: string): Promise<void> {
    await this.domainService.executeNotificationAction(notificationUuid, actionId);
  }

  /**
   * 获取相关实体的通知
   */
  async getNotificationsByRelatedEntity(
    relatedEntityType: string,
    relatedEntityUuid: string,
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getNotificationsByRelatedEntity(
      relatedEntityType,
      relatedEntityUuid,
    );
    return notifications.map((n: any) => n.toClientDTO());
  }

  /**
   * 清理过期通知
   */
  async cleanupExpiredNotifications(): Promise<number> {
    return this.domainService.cleanupExpiredNotifications();
  }

  /**
   * 清理已删除通知
   */
  async cleanupDeletedNotifications(daysAgo = 30): Promise<number> {
    return this.domainService.cleanupDeletedNotifications(daysAgo);
  }

  /**
   * 获取用户偏好设置
   */
  async getPreference(accountUuid: string): Promise<NotificationPreferenceClientDTO | null> {
    try {
      const preference = await this.preferenceService.getPreference(accountUuid);
      return preference ? preference.toClientDTO() : null;
    } catch (error) {
      logger.error('Error getting preference', { error });
      return null;
    }
  }

  /**
   * 获取或创建用户偏好设置
   */
  async getOrCreatePreference(accountUuid: string): Promise<NotificationPreferenceClientDTO> {
    const preference = await this.preferenceService.getOrCreatePreference(accountUuid);
    return preference.toClientDTO();
  }

  /**
   * 更新用户偏好设置
   */
  async updatePreference(
    accountUuid: string,
    updates: Partial<{
      channelPreferences: any;
      categoryPreferences: any;
      doNotDisturbConfig: any;
    }>,
  ): Promise<NotificationPreferenceClientDTO> {
    const preference = await this.preferenceService.updatePreference(accountUuid, updates);
    return preference.toClientDTO();
  }
}
