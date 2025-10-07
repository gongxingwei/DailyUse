/**
 * Notification Application Service
 * @description 通知应用服务层，协调领域服务和仓储，处理业务流程
 * @author DailyUse Team
 * @date 2025-01-07
 */

import type {
  NotificationContracts,
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '@dailyuse/contracts';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type { INotificationTemplateRepository } from '../../domain/repositories/INotificationTemplateRepository';
import type { INotificationPreferenceRepository } from '../../domain/repositories/INotificationPreferenceRepository';
import { NotificationDomainService } from '../../domain/services/NotificationDomainService';
import { TemplateRenderService } from '../../domain/services/TemplateRenderService';
import { ChannelSelectionService } from '../../domain/services/ChannelSelectionService';
import { NotificationMapper } from '../../infrastructure/mappers/NotificationMapper';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationApplicationService');

/**
 * 通知应用服务
 *
 * 职责：
 * - 协调多个领域服务完成业务流程
 * - 将领域对象转换为 DTO
 * - 处理应用层事务
 * - 提供查询接口
 */
export class NotificationApplicationService {
  private notificationDomainService: NotificationDomainService;
  private templateRenderService: TemplateRenderService;
  private channelSelectionService: ChannelSelectionService;

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {
    // 初始化领域服务
    this.notificationDomainService = new NotificationDomainService(
      notificationRepository,
      preferenceRepository,
    );
    this.templateRenderService = new TemplateRenderService();
    this.channelSelectionService = new ChannelSelectionService();
  }

  // ============================================================
  // Notification 聚合根 - CRUD 操作
  // ============================================================

  /**
   * 创建并发送通知
   */
  async createNotification(
    accountUuid: string,
    request: NotificationContracts.CreateNotificationRequest,
  ): Promise<NotificationContracts.NotificationClientDTO> {
    logger.info('Creating notification', { accountUuid, type: request.type });

    // 委托给领域服务创建通知
    const notification = await this.notificationDomainService.createAndSendNotification({
      uuid: request.uuid,
      accountUuid,
      title: request.title,
      content: request.content,
      type: request.type,
      priority: request.priority,
      channels: request.channels,
      icon: request.icon,
      image: request.image,
      actions: request.actions,
      scheduledAt: request.scheduledAt ? new Date(request.scheduledAt) : undefined,
      expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
      metadata: request.metadata,
      templateUuid: request.templateUuid,
    });

    logger.info('Notification created successfully', {
      notificationId: notification.uuid,
      accountUuid,
    });

    // 转换为 ClientDTO
    return NotificationMapper.toClientDTO(notification);
  }

  /**
   * 获取通知列表（分页查询）
   */
  async getNotifications(
    accountUuid: string,
    queryParams: any,
  ): Promise<NotificationContracts.NotificationListResponse> {
    logger.debug('Fetching notifications list', { accountUuid, queryParams });

    // 解析查询参数
    const parsedParams: NotificationContracts.NotificationQueryParams = {
      accountUuid,
      status: queryParams.status as NotificationStatus | undefined,
      type: queryParams.type as NotificationType | undefined,
      channels: queryParams.channels
        ? Array.isArray(queryParams.channels)
          ? queryParams.channels
          : [queryParams.channels]
        : undefined,
      scheduledBefore: queryParams.scheduledBefore
        ? new Date(queryParams.scheduledBefore)
        : undefined,
      scheduledAfter: queryParams.scheduledAfter ? new Date(queryParams.scheduledAfter) : undefined,
      createdBefore: queryParams.createdBefore ? new Date(queryParams.createdBefore) : undefined,
      createdAfter: queryParams.createdAfter ? new Date(queryParams.createdAfter) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 50,
      offset: queryParams.offset ? parseInt(queryParams.offset, 10) : 0,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
    };

    // 查询通知
    const result = await this.notificationRepository.query(parsedParams);

    // 转换为 ClientDTO
    const notifications = result.notifications.map((n) => NotificationMapper.toClientDTO(n));

    logger.info('Notifications retrieved successfully', {
      accountUuid,
      total: result.total,
      count: notifications.length,
    });

    return {
      notifications,
      total: result.total,
      page: Math.floor(parsedParams.offset! / parsedParams.limit!) + 1,
      limit: parsedParams.limit!,
      hasMore: parsedParams.offset! + notifications.length < result.total,
    };
  }

  /**
   * 根据 UUID 获取通知
   */
  async getNotificationById(
    accountUuid: string,
    notificationId: string,
  ): Promise<NotificationContracts.NotificationClientDTO | null> {
    logger.debug('Fetching notification by ID', { accountUuid, notificationId });

    const notification = await this.notificationRepository.findByUuid(notificationId);

    if (!notification) {
      logger.warn('Notification not found', { notificationId });
      return null;
    }

    // 验证所有权
    if (notification.accountUuid !== accountUuid) {
      logger.warn('Notification access denied', { notificationId, accountUuid });
      throw new Error('Access denied: Notification does not belong to this user');
    }

    return NotificationMapper.toClientDTO(notification);
  }

  /**
   * 删除通知
   */
  async deleteNotification(accountUuid: string, notificationId: string): Promise<void> {
    logger.info('Deleting notification', { accountUuid, notificationId });

    const notification = await this.notificationRepository.findByUuid(notificationId);

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    if (notification.accountUuid !== accountUuid) {
      throw new Error('Access denied: Notification does not belong to this user');
    }

    await this.notificationRepository.delete(notificationId);

    logger.info('Notification deleted successfully', { notificationId });
  }

  // ============================================================
  // Notification 聚合根 - 状态转换操作
  // ============================================================

  /**
   * 标记通知为已读
   * POST /api/v1/notifications/:id/read
   */
  async markAsRead(
    accountUuid: string,
    notificationId: string,
  ): Promise<NotificationContracts.NotificationClientDTO> {
    logger.info('Marking notification as read', { accountUuid, notificationId });

    const notification = await this.notificationRepository.findByUuid(notificationId);

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    if (notification.accountUuid !== accountUuid) {
      throw new Error('Access denied');
    }

    // 委托给领域服务处理状态转换
    const updated = await this.notificationDomainService.markAsRead(notificationId);

    logger.info('Notification marked as read', { notificationId });

    return NotificationMapper.toClientDTO(updated);
  }

  /**
   * 标记通知为已忽略
   * POST /api/v1/notifications/:id/dismiss
   */
  async markAsDismissed(
    accountUuid: string,
    notificationId: string,
  ): Promise<NotificationContracts.NotificationClientDTO> {
    logger.info('Marking notification as dismissed', { accountUuid, notificationId });

    const notification = await this.notificationRepository.findByUuid(notificationId);

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    if (notification.accountUuid !== accountUuid) {
      throw new Error('Access denied');
    }

    const updated = await this.notificationDomainService.markAsDismissed(notificationId);

    logger.info('Notification marked as dismissed', { notificationId });

    return NotificationMapper.toClientDTO(updated);
  }

  /**
   * 批量标记为已读
   * POST /api/v1/notifications/batch-read
   */
  async batchMarkAsRead(
    accountUuid: string,
    notificationIds: string[],
  ): Promise<NotificationContracts.NotificationClientDTO[]> {
    logger.info('Batch marking notifications as read', {
      accountUuid,
      count: notificationIds.length,
    });

    // 验证所有通知所有权
    for (const id of notificationIds) {
      const notification = await this.notificationRepository.findByUuid(id);
      if (notification && notification.accountUuid !== accountUuid) {
        throw new Error(`Access denied for notification: ${id}`);
      }
    }

    const updated = await this.notificationDomainService.batchMarkAsRead(notificationIds);

    logger.info('Notifications batch marked as read', { count: updated.length });

    return updated.map((n) => NotificationMapper.toClientDTO(n));
  }

  /**
   * 批量标记为已忽略
   * POST /api/v1/notifications/batch-dismiss
   */
  async batchMarkAsDismissed(
    accountUuid: string,
    notificationIds: string[],
  ): Promise<NotificationContracts.NotificationClientDTO[]> {
    logger.info('Batch marking notifications as dismissed', {
      accountUuid,
      count: notificationIds.length,
    });

    // 验证所有权
    for (const id of notificationIds) {
      const notification = await this.notificationRepository.findByUuid(id);
      if (notification && notification.accountUuid !== accountUuid) {
        throw new Error(`Access denied for notification: ${id}`);
      }
    }

    const updated = await this.notificationDomainService.batchMarkAsDismissed(notificationIds);

    logger.info('Notifications batch marked as dismissed', { count: updated.length });

    return updated.map((n) => NotificationMapper.toClientDTO(n));
  }

  /**
   * 批量删除通知
   * POST /api/v1/notifications/batch-delete
   */
  async batchDeleteNotifications(accountUuid: string, notificationIds: string[]): Promise<void> {
    logger.info('Batch deleting notifications', { accountUuid, count: notificationIds.length });

    // 验证所有权
    for (const id of notificationIds) {
      const notification = await this.notificationRepository.findByUuid(id);
      if (notification && notification.accountUuid !== accountUuid) {
        throw new Error(`Access denied for notification: ${id}`);
      }
    }

    await this.notificationRepository.batchDelete(notificationIds);

    logger.info('Notifications batch deleted', { count: notificationIds.length });
  }

  // ============================================================
  // 查询和统计
  // ============================================================

  /**
   * 获取未读通知数量
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(accountUuid: string): Promise<number> {
    logger.debug('Getting unread count', { accountUuid });

    const count = await this.notificationDomainService.getUnreadCount(accountUuid);

    logger.debug('Unread count retrieved', { accountUuid, count });

    return count;
  }

  /**
   * 获取通知统计信息
   * GET /api/v1/notifications/stats
   */
  async getNotificationStats(
    accountUuid: string,
  ): Promise<NotificationContracts.NotificationStatsResponse> {
    logger.debug('Getting notification stats', { accountUuid });

    const [unreadCount, totalCount, todayCount] = await Promise.all([
      this.notificationRepository.countUnread(accountUuid),
      this.notificationRepository.query({ accountUuid, limit: 0, offset: 0 }).then((r) => r.total),
      this.notificationRepository
        .query({
          accountUuid,
          createdAfter: new Date(new Date().setHours(0, 0, 0, 0)),
          limit: 0,
          offset: 0,
        })
        .then((r) => r.total),
    ]);

    const stats: NotificationContracts.NotificationStatsResponse = {
      unreadCount,
      totalCount,
      todayCount,
      byType: {}, // 可以进一步扩展按类型统计
      byChannel: {},
    };

    logger.debug('Notification stats retrieved', { accountUuid, stats });

    return stats;
  }

  // ============================================================
  // 通知模板管理
  // ============================================================

  /**
   * 使用模板创建通知
   * POST /api/v1/notifications/from-template
   */
  async createNotificationFromTemplate(
    accountUuid: string,
    request: {
      templateUuid: string;
      variables: Record<string, string>;
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
      scheduledAt?: number;
      expiresAt?: number;
    },
  ): Promise<NotificationContracts.NotificationClientDTO> {
    logger.info('Creating notification from template', {
      accountUuid,
      templateUuid: request.templateUuid,
    });

    // 获取模板
    const template = await this.templateRepository.findByUuid(request.templateUuid);

    if (!template) {
      throw new Error(`Template not found: ${request.templateUuid}`);
    }

    if (!template.enabled) {
      throw new Error(`Template is disabled: ${request.templateUuid}`);
    }

    // 渲染模板
    const { title, content } = this.templateRenderService.render(template, request.variables);

    // 创建通知
    const notification = await this.notificationDomainService.createAndSendNotification({
      uuid: crypto.randomUUID(),
      accountUuid,
      title,
      content,
      type: template.type,
      priority: request.priority || template.defaultPriority,
      channels: request.channels || template.defaultChannels,
      icon: template.icon,
      actions: template.defaultActions,
      scheduledAt: request.scheduledAt ? new Date(request.scheduledAt) : undefined,
      expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
      templateUuid: template.uuid,
    });

    logger.info('Notification created from template', {
      notificationId: notification.uuid,
      templateUuid: request.templateUuid,
    });

    return NotificationMapper.toClientDTO(notification);
  }

  // ============================================================
  // 用户偏好管理
  // ============================================================

  /**
   * 获取用户通知偏好
   * GET /api/v1/notification-preferences
   */
  async getUserPreference(
    accountUuid: string,
  ): Promise<NotificationContracts.NotificationPreferenceDTO> {
    logger.debug('Getting user notification preference', { accountUuid });

    const preference = await this.preferenceRepository.getOrCreateDefault(accountUuid);

    return NotificationMapper.preferenceToDTO(preference);
  }

  /**
   * 更新用户通知偏好
   * PUT /api/v1/notification-preferences
   */
  async updateUserPreference(
    accountUuid: string,
    updates: Partial<NotificationContracts.UpsertNotificationPreferenceRequest>,
  ): Promise<NotificationContracts.NotificationPreferenceDTO> {
    logger.info('Updating user notification preference', { accountUuid, updates });

    const preference = await this.preferenceRepository.getOrCreateDefault(accountUuid);

    // 应用更新
    if (updates.enabledTypes !== undefined) {
      updates.enabledTypes.forEach((type) => preference.enableType(type));
    }

    if (updates.channelPreferences) {
      Object.entries(updates.channelPreferences).forEach(([channel, settings]) => {
        preference.setChannelPreference(channel as NotificationChannel, settings);
      });
    }

    if (updates.maxNotifications !== undefined) {
      // @ts-expect-error - 更新最大通知数
      preference._maxNotifications = updates.maxNotifications;
    }

    if (updates.autoArchiveDays !== undefined) {
      // @ts-expect-error - 更新自动归档天数
      preference._autoArchiveDays = updates.autoArchiveDays;
    }

    // 保存
    await this.preferenceRepository.save(preference);

    logger.info('User notification preference updated', { accountUuid });

    return NotificationMapper.preferenceToDTO(preference);
  }
}
