/**
 * Notification Controller
 * @description 通知控制器 - 聚合根式 REST API 设计
 * @author DailyUse Team
 * @date 2025-01-07
 *
 * DDD 聚合根控制模式：
 * - Notification 是聚合根
 * - 状态转换通过聚合根方法进行
 * - 批量操作保证业务规则一致性
 * - 统一的响应格式和错误处理
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { NotificationApplicationService } from '../../../application/services/NotificationApplicationService';
import { NotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { NotificationTemplateRepository } from '../../../infrastructure/repositories/NotificationTemplateRepository';
import { NotificationPreferenceRepository } from '../../../infrastructure/repositories/NotificationPreferenceRepository';
import { prisma } from '../../../../../config/prisma';
import type { NotificationContracts } from '@dailyuse/contracts';
import {
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationController');

export class NotificationController {
  private static instance: NotificationController;
  private notificationService: NotificationApplicationService;
  private responseBuilder: ReturnType<typeof createResponseBuilder>;

  private constructor(notificationService?: NotificationApplicationService) {
    this.notificationService = notificationService ?? NotificationApplicationService.getInstance();
    this.responseBuilder = createResponseBuilder();
  }

  static createInstance(
    notificationService?: NotificationApplicationService,
  ): NotificationController {
    NotificationController.instance = new NotificationController(notificationService);
    return NotificationController.instance;
  }

  static getInstance(): NotificationController {
    if (!NotificationController.instance) {
      throw new Error('NotificationController not initialized. Call createInstance() first.');
    }
    return NotificationController.instance;
  }

  /**
   * 从请求中提取用户账户UUID
   */
  private extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Authentication attempt without Bearer token');
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      logger.warn('Invalid token: missing accountUuid');
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  // ============================================================
  // 基础 CRUD 操作
  // ============================================================

  /**
   * 创建通知
   * POST /api/v1/notifications
   */
  async createNotification(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const request: NotificationContracts.CreateNotificationRequest = req.body;

      logger.info('Creating notification', { accountUuid, type: request.type });

      const notification = await this.notificationService.createNotification(accountUuid, request);

      logger.info('Notification created successfully', {
        notificationId: notification.uuid,
        accountUuid,
      });

      return this.responseBuilder.sendSuccess(
        res,
        notification,
        'Notification created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('User has disabled')) {
          return this.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      logger.error('Failed to create notification', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to create notification',
      });
    }
  }

  /**
   * 获取通知列表
   * GET /api/v1/notifications
   */
  async getNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const queryParams = req.query;

      logger.debug('Fetching notifications list', { accountUuid, queryParams });

      const listResponse = await this.notificationService.getNotifications(
        accountUuid,
        queryParams,
      );

      logger.info('Notifications retrieved successfully', {
        accountUuid,
        total: listResponse.total,
        page: listResponse.page,
      });

      return this.responseBuilder.sendSuccess(
        res,
        listResponse,
        'Notifications retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to retrieve notifications', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve notifications',
      });
    }
  }

  /**
   * 根据ID获取通知
   * GET /api/v1/notifications/:id
   */
  async getNotificationById(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { id } = req.params;

      logger.debug('Fetching notification by ID', { accountUuid, notificationId: id });

      const notification = await this.notificationService.getNotificationById(accountUuid, id);

      if (!notification) {
        logger.warn('Notification not found', { accountUuid, notificationId: id });
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Notification not found',
        });
      }

      logger.info('Notification retrieved successfully', { accountUuid, notificationId: id });

      return this.responseBuilder.sendSuccess(
        res,
        notification,
        'Notification retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Access denied')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: error.message,
        });
      }

      logger.error('Failed to retrieve notification', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve notification',
      });
    }
  }

  /**
   * 删除通知
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { id } = req.params;

      logger.info('Deleting notification', { accountUuid, notificationId: id });

      await this.notificationService.deleteNotification(accountUuid, id);

      logger.info('Notification deleted successfully', { accountUuid, notificationId: id });

      return this.responseBuilder.sendSuccess(res, null, 'Notification deleted successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Access denied')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: error.message,
        });
      }

      logger.error('Failed to delete notification', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to delete notification',
      });
    }
  }

  // ============================================================
  // 聚合根控制 - 状态转换操作
  // ============================================================

  /**
   * 标记通知为已读
   * POST /api/v1/notifications/:id/read
   *
   * 体现聚合根控制：
   * - 只能标记 SENT 状态的通知
   * - 自动设置 readAt 时间戳
   * - 发布 NotificationRead 领域事件
   */
  async markAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { id } = req.params;

      logger.info('Marking notification as read', { accountUuid, notificationId: id });

      const notification = await this.notificationService.markAsRead(accountUuid, id);

      logger.info('Notification marked as read', { accountUuid, notificationId: id });

      return this.responseBuilder.sendSuccess(
        res,
        notification,
        'Notification marked as read successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Cannot mark')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.message,
        });
      }

      logger.error('Failed to mark notification as read', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to mark notification as read',
      });
    }
  }

  /**
   * 标记通知为已忽略
   * POST /api/v1/notifications/:id/dismiss
   *
   * 体现聚合根控制：
   * - 状态转换验证
   * - 自动设置 dismissedAt 时间戳
   * - 发布 NotificationDismissed 领域事件
   */
  async markAsDismissed(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { id } = req.params;

      logger.info('Marking notification as dismissed', { accountUuid, notificationId: id });

      const notification = await this.notificationService.markAsDismissed(accountUuid, id);

      logger.info('Notification marked as dismissed', { accountUuid, notificationId: id });

      return this.responseBuilder.sendSuccess(
        res,
        notification,
        'Notification marked as dismissed successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Cannot mark')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.message,
        });
      }

      logger.error('Failed to mark notification as dismissed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : 'Failed to mark notification as dismissed',
      });
    }
  }

  // ============================================================
  // 批量操作（聚合根控制）
  // ============================================================

  /**
   * 批量标记为已读
   * POST /api/v1/notifications/batch-read
   *
   * 体现聚合根控制：
   * - 验证所有通知所有权
   * - 原子性批量更新
   * - 统一的业务规则验证
   */
  async batchMarkAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { notificationIds } = req.body as { notificationIds: string[] };

      logger.info('Batch marking notifications as read', {
        accountUuid,
        count: notificationIds.length,
      });

      const notifications = await this.notificationService.batchMarkAsRead(
        accountUuid,
        notificationIds,
      );

      logger.info('Notifications batch marked as read', {
        accountUuid,
        count: notifications.length,
      });

      return this.responseBuilder.sendSuccess(
        res,
        notifications,
        'Notifications batch marked as read successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Access denied')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: error.message,
        });
      }

      logger.error('Failed to batch mark notifications as read', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : 'Failed to batch mark notifications as read',
      });
    }
  }

  /**
   * 批量标记为已忽略
   * POST /api/v1/notifications/batch-dismiss
   */
  async batchMarkAsDismissed(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { notificationIds } = req.body as { notificationIds: string[] };

      logger.info('Batch marking notifications as dismissed', {
        accountUuid,
        count: notificationIds.length,
      });

      const notifications = await this.notificationService.batchMarkAsDismissed(
        accountUuid,
        notificationIds,
      );

      logger.info('Notifications batch marked as dismissed', {
        accountUuid,
        count: notifications.length,
      });

      return this.responseBuilder.sendSuccess(
        res,
        notifications,
        'Notifications batch marked as dismissed successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Access denied')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: error.message,
        });
      }

      logger.error('Failed to batch mark notifications as dismissed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to batch mark notifications as dismissed',
      });
    }
  }

  /**
   * 批量删除通知
   * POST /api/v1/notifications/batch-delete
   *
   * 体现聚合根控制：
   * - 级联删除所有 DeliveryReceipt 子实体
   * - 原子性操作
   * - 验证所有权
   */
  async batchDeleteNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const { notificationIds } = req.body as { notificationIds: string[] };

      logger.info('Batch deleting notifications', { accountUuid, count: notificationIds.length });

      await this.notificationService.batchDeleteNotifications(accountUuid, notificationIds);

      logger.info('Notifications batch deleted', { accountUuid, count: notificationIds.length });

      return this.responseBuilder.sendSuccess(
        res,
        null,
        'Notifications batch deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Access denied')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: error.message,
        });
      }

      logger.error('Failed to batch delete notifications', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to batch delete notifications',
      });
    }
  }

  // ============================================================
  // 查询和统计
  // ============================================================

  /**
   * 获取未读通知数量
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);

      logger.debug('Getting unread count', { accountUuid });

      const count = await this.notificationService.getUnreadCount(accountUuid);

      logger.debug('Unread count retrieved', { accountUuid, count });

      return this.responseBuilder.sendSuccess(
        res,
        { count },
        'Unread count retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to get unread count', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to get unread count',
      });
    }
  }

  /**
   * 获取通知统计信息
   * GET /api/v1/notifications/stats
   */
  async getNotificationStats(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);

      logger.debug('Getting notification stats', { accountUuid });

      const stats = await this.notificationService.getNotificationStats(accountUuid);

      logger.debug('Notification stats retrieved', { accountUuid, stats });

      return this.responseBuilder.sendSuccess(
        res,
        stats,
        'Notification stats retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Failed to get notification stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to get notification stats',
      });
    }
  }

  // ============================================================
  // 模板相关操作
  // ============================================================

  /**
   * 使用模板创建通知
   * POST /api/v1/notifications/from-template
   *
   * 体现模板系统：
   * - 验证模板变量
   * - 渲染模板内容
   * - 应用默认配置
   */
  async createFromTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = this.extractAccountUuid(req);
      const request = req.body;

      logger.info('Creating notification from template', {
        accountUuid,
        templateUuid: request.templateUuid,
      });

      const notification = await this.notificationService.createNotificationFromTemplate(
        accountUuid,
        request,
      );

      logger.info('Notification created from template successfully', {
        accountUuid,
        notificationId: notification.uuid,
        templateUuid: request.templateUuid,
      });

      return this.responseBuilder.sendSuccess(
        res,
        notification,
        'Notification created from template successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Template not found')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }
      if (error instanceof Error && error.message.includes('Template is disabled')) {
        return this.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.message,
        });
      }

      logger.error('Failed to create notification from template', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : 'Failed to create notification from template',
      });
    }
  }
}
