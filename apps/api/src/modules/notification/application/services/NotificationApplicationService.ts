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
import { NotificationTemplate } from '../../domain/aggregates/NotificationTemplate';
import { NotificationAction } from '../../domain/value-objects/NotificationAction';
import { NotificationMetadata } from '../../domain/value-objects/NotificationMetadata';
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
      actions: request.actions?.map((a) => NotificationAction.create(a)),
      scheduledAt: request.scheduledAt ? new Date(request.scheduledAt) : undefined,
      expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
      metadata:
        request.metadata?.sourceType && request.metadata?.sourceId
          ? NotificationMetadata.create({
              sourceType: request.metadata.sourceType,
              sourceId: request.metadata.sourceId,
              additionalData: request.metadata.additionalData,
            })
          : undefined,
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
      status: queryParams.status
        ? Array.isArray(queryParams.status)
          ? queryParams.status
          : [queryParams.status]
        : undefined,
      type: queryParams.type
        ? Array.isArray(queryParams.type)
          ? queryParams.type
          : [queryParams.type]
        : undefined,
      channels: queryParams.channels
        ? Array.isArray(queryParams.channels)
          ? queryParams.channels
          : [queryParams.channels]
        : undefined,
      targetUser: accountUuid, // 使用 targetUser 字段传递 accountUuid
      keyword: queryParams.keyword,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 50,
      offset: queryParams.offset ? parseInt(queryParams.offset, 10) : 0,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
    };

    // 查询通知 - 转换 sortBy 到 repository 接受的类型
    const repositoryParams = {
      ...parsedParams,
      sortBy: parsedParams.sortBy as 'createdAt' | 'updatedAt' | 'priority' | 'sentAt' | undefined,
    };
    const result = await this.notificationRepository.query(repositoryParams);

    // 转换为 ClientDTO
    const notifications = result.notifications.map((n) => NotificationMapper.toClientDTO(n));

    logger.info('Notifications retrieved successfully', {
      accountUuid,
      total: result.total,
      count: notifications.length,
    });

    return {
      data: notifications,
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

    await this.notificationDomainService.batchMarkAsRead(notificationIds);

    // 重新查询更新后的通知
    const updated = [];
    for (const id of notificationIds) {
      const notification = await this.notificationRepository.findByUuid(id);
      if (notification) {
        updated.push(NotificationMapper.toClientDTO(notification));
      }
    }

    logger.info('Notifications batch marked as read', { count: updated.length });

    return updated;
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

    await this.notificationDomainService.batchMarkAsDismissed(notificationIds);

    // 重新查询更新后的通知
    const updated = [];
    for (const id of notificationIds) {
      const notification = await this.notificationRepository.findByUuid(id);
      if (notification) {
        updated.push(NotificationMapper.toClientDTO(notification));
      }
    }

    logger.info('Notifications batch marked as dismissed', { count: updated.length });

    return updated;
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
      totalNotifications: totalCount,
      unreadNotifications: unreadCount,
      readNotifications: 0, // TODO: 实现
      dismissedNotifications: 0, // TODO: 实现
      failedNotifications: 0, // TODO: 实现
      readRate: 0, // TODO: 实现
      dismissalRate: 0, // TODO: 实现
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byChannel: {} as Record<NotificationChannel, number>,
      byStatus: {} as Record<NotificationStatus, number>,
      recentTrend: [], // TODO: 实现
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
  // NotificationTemplate - 模板管理
  // ============================================================

  /**
   * 创建通知模板
   * POST /api/v1/notification-templates
   */
  async createTemplate(
    request: NotificationContracts.CreateNotificationTemplateRequest,
  ): Promise<NotificationContracts.NotificationTemplateClientDTO> {
    logger.info('Creating notification template', { name: request.name, type: request.type });

    // Check if name already exists
    const existing = await this.templateRepository.findByName(request.name);
    if (existing) {
      throw new Error(`Template with name "${request.name}" already exists`);
    }

    // Create template aggregate
    const template = NotificationTemplate.create({
      uuid: request.uuid,
      name: request.name,
      type: request.type,
      titleTemplate: request.titleTemplate,
      contentTemplate: request.contentTemplate,
      defaultPriority: request.defaultPriority,
      defaultChannels: request.defaultChannels,
      variables: request.variables,
      icon: request.icon,
      defaultActions: request.defaultActions?.map((a) => NotificationAction.create(a)),
      enabled: request.enabled !== undefined ? request.enabled : true,
    });

    // Save to repository
    await this.templateRepository.save(template);

    logger.info('Notification template created', { templateId: template.uuid });

    return this.templateToDTO(template);
  }

  /**
   * 查询通知模板
   * GET /api/v1/notification-templates
   */
  async getTemplates(
    queryParams: NotificationContracts.QueryNotificationTemplatesRequest,
  ): Promise<NotificationContracts.NotificationTemplateListResponse> {
    logger.debug('Querying notification templates', { queryParams });

    const result = await this.templateRepository.query({
      type: queryParams.type,
      enabled: queryParams.enabled,
      nameContains: queryParams.nameContains,
      limit: queryParams.limit,
      offset: queryParams.offset,
    });

    return {
      data: result.templates.map((t) => this.templateToDTO(t)),
      total: result.total,
    };
  }

  /**
   * 获取单个模板
   * GET /api/v1/notification-templates/:id
   */
  async getTemplateById(
    uuid: string,
  ): Promise<NotificationContracts.NotificationTemplateClientDTO | null> {
    logger.debug('Getting template by id', { uuid });

    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      return null;
    }

    return this.templateToDTO(template);
  }

  /**
   * 更新通知模板
   * PUT /api/v1/notification-templates/:id
   */
  async updateTemplate(
    uuid: string,
    updates: NotificationContracts.UpdateNotificationTemplateRequest,
  ): Promise<NotificationContracts.NotificationTemplateClientDTO | null> {
    logger.info('Updating notification template', { uuid, updates });

    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`Template with UUID "${uuid}" not found`);
    }

    // Check name uniqueness if name is being updated
    if (updates.name && updates.name !== template.name) {
      const nameExists = await this.templateRepository.existsByName(updates.name, uuid);
      if (nameExists) {
        throw new Error(`Template with name "${updates.name}" already exists`);
      }
    }

    // Update template - convert DTOs to value objects
    const updateData: any = { ...updates };
    if (updates.defaultActions) {
      updateData.defaultActions = updates.defaultActions.map((a) => NotificationAction.create(a));
    }

    template.update(updateData);

    // Save
    await this.templateRepository.save(template);

    logger.info('Notification template updated', { uuid });

    return this.templateToDTO(template);
  }

  /**
   * 删除通知模板
   * DELETE /api/v1/notification-templates/:id
   */
  async deleteTemplate(uuid: string): Promise<void> {
    logger.info('Deleting notification template', { uuid });

    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`Template with UUID "${uuid}" not found`);
    }

    await this.templateRepository.delete(uuid);

    logger.info('Notification template deleted', { uuid });
  }

  /**
   * 预览模板渲染结果
   * POST /api/v1/notification-templates/:id/preview
   */
  async previewTemplate(
    uuid: string,
    variables: Record<string, string>,
  ): Promise<NotificationContracts.PreviewNotificationTemplateResponse> {
    logger.debug('Previewing template', { uuid, variables });

    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`Template with UUID "${uuid}" not found`);
    }

    const { title, content } = template.render(variables);

    return {
      title,
      content,
      variables,
    };
  }

  /**
   * 启用模板
   * POST /api/v1/notification-templates/:id/enable
   */
  async enableTemplate(
    uuid: string,
  ): Promise<NotificationContracts.NotificationTemplateClientDTO | null> {
    logger.info('Enabling notification template', { uuid });

    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`Template with UUID "${uuid}" not found`);
    }

    template.enable();
    await this.templateRepository.save(template);

    logger.info('Notification template enabled', { uuid });

    return this.templateToDTO(template);
  }

  /**
   * 禁用模板
   * POST /api/v1/notification-templates/:id/disable
   */
  async disableTemplate(
    uuid: string,
  ): Promise<NotificationContracts.NotificationTemplateClientDTO | null> {
    logger.info('Disabling notification template', { uuid });

    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`Template with UUID "${uuid}" not found`);
    }

    template.disable();
    await this.templateRepository.save(template);

    logger.info('Notification template disabled', { uuid });

    return this.templateToDTO(template);
  }

  /**
   * 模板领域对象转 DTO
   */
  private templateToDTO(
    template: NotificationTemplate,
  ): NotificationContracts.NotificationTemplateClientDTO {
    const plainObj = template.toPlainObject();

    return {
      uuid: plainObj.uuid,
      name: plainObj.name,
      type: plainObj.type,
      titleTemplate: plainObj.titleTemplate,
      contentTemplate: plainObj.contentTemplate,
      defaultPriority: plainObj.defaultPriority,
      defaultChannels: plainObj.defaultChannels,
      variables: plainObj.variables,
      icon: plainObj.icon,
      defaultActions: plainObj.defaultActions,
      enabled: plainObj.enabled,
      lifecycle: {
        createdAt: plainObj.createdAt.getTime(),
        updatedAt: plainObj.updatedAt.getTime(),
      },
      // Computed properties - would need tracking to implement
      usageCount: 0,
      lastUsedAt: undefined,
    };
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
