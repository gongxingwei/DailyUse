import type { Request, Response } from 'express';
import { ReminderTemplateGroupApplicationService } from '../../../application/services/ReminderTemplateGroupApplicationService';
import type { ReminderContracts } from '@dailyuse/contracts';

type CreateReminderTemplateGroupRequest = ReminderContracts.CreateReminderTemplateGroupRequest;
type UpdateReminderTemplateGroupRequest = ReminderContracts.UpdateReminderTemplateGroupRequest;

// 扩展Request接口以包含accountUuid
interface AuthenticatedRequest extends Request {
  accountUuid: string;
}

/**
 * ReminderTemplateGroupController - 提醒模板分组控制器
 * 专门处理 ReminderTemplateGroup 聚合根的HTTP请求
 * 使用正确的DDD架构：应用服务协调领域逻辑
 */
export class ReminderTemplateGroupController {
  private static applicationService = new ReminderTemplateGroupApplicationService();

  /**
   * 创建提醒模板分组
   * POST /reminders/groups
   */
  static async createTemplateGroup(req: Request, res: Response) {
    try {
      const request: CreateReminderTemplateGroupRequest = req.body;
      const accountUuid = (req as any).accountUuid; // 从认证中间件获取

      const group =
        await ReminderTemplateGroupController.applicationService.createReminderTemplateGroup(
          accountUuid,
          request,
        );

      res.status(201).json({
        success: true,
        data: group,
        message: '提醒模板分组创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建提醒模板分组失败',
      });
    }
  }

  /**
   * 获取账户的所有提醒模板分组
   * GET /reminders/groups
   */
  static async getTemplateGroups(req: Request, res: Response) {
    try {
      const accountUuid = (req as any).accountUuid; // 从认证中间件获取

      const groups =
        await ReminderTemplateGroupController.applicationService.getReminderTemplateGroups(
          accountUuid,
        );

      res.json({
        success: true,
        data: groups,
        message: '获取提醒模板分组列表成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒模板分组列表失败',
      });
    }
  }

  /**
   * 获取特定分组
   * GET /reminders/groups/:groupUuid
   */
  static async getTemplateGroup(req: Request, res: Response) {
    try {
      const { groupUuid } = req.params;

      const group =
        await ReminderTemplateGroupController.applicationService.getReminderTemplateGroupById(
          groupUuid,
        );

      if (!group) {
        return res.status(404).json({
          success: false,
          error: '分组不存在',
        });
      }

      res.json({
        success: true,
        data: group,
        message: '获取提醒模板分组成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒模板分组失败',
      });
    }
  }

  /**
   * 更新提醒模板分组
   * PUT /reminders/groups/:groupUuid
   */
  static async updateTemplateGroup(req: Request, res: Response) {
    try {
      const { groupUuid } = req.params;
      const request: UpdateReminderTemplateGroupRequest = req.body;

      const group =
        await ReminderTemplateGroupController.applicationService.updateReminderTemplateGroupWithValidation(
          groupUuid,
          request,
        );

      res.json({
        success: true,
        data: group,
        message: '提醒模板分组更新成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新提醒模板分组失败',
      });
    }
  }

  /**
   * 删除提醒模板分组
   * DELETE /reminders/groups/:groupUuid
   */
  static async deleteTemplateGroup(req: Request, res: Response) {
    try {
      const { groupUuid } = req.params;

      await ReminderTemplateGroupController.applicationService.deleteReminderTemplateGroupWithCleanup(
        groupUuid,
      );

      res.json({
        success: true,
        message: '提醒模板分组删除成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除提醒模板分组失败',
      });
    }
  }

  /**
   * 切换分组启用状态
   * PATCH /reminders/groups/:groupUuid/toggle
   */
  static async toggleTemplateGroupEnabled(req: Request, res: Response) {
    try {
      const { groupUuid } = req.params;
      const { enabled } = req.body;

      await ReminderTemplateGroupController.applicationService.toggleReminderTemplateGroupEnabled(
        groupUuid,
        enabled,
      );

      res.json({
        success: true,
        message: `分组${enabled ? '启用' : '禁用'}成功`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '切换分组状态失败',
      });
    }
  }
}
