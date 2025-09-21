import type { Request, Response } from 'express';
import { ReminderDomainService } from '../../../domain/services/ReminderDomainService';
import { ReminderApplicationService } from '../../../application/services/ReminderApplicationService';
import type { ReminderContracts } from '@dailyuse/contracts';

type CreateReminderTemplateRequest = ReminderContracts.CreateReminderTemplateRequest;
type UpdateReminderTemplateRequest = ReminderContracts.UpdateReminderTemplateRequest;

// 扩展Request接口以包含accountUuid
interface AuthenticatedRequest extends Request {
  accountUuid: string;
}

/**
 * ReminderTemplateController - 提醒模板控制器
 * 专门处理 ReminderTemplate 聚合根的HTTP请求
 * 使用正确的DDD架构：应用服务协调领域服务
 */
export class ReminderTemplateController {
  private static applicationService = new ReminderApplicationService();
  private static domainService = new ReminderDomainService();

  /**
   * 创建提醒模板聚合根
   * POST /reminders/templates
   */
  static async createTemplate(req: Request, res: Response) {
    try {
      const request: CreateReminderTemplateRequest = req.body;
      const accountUuid = (req as any).accountUuid; // 从认证中间件获取

      const template = await ReminderTemplateController.domainService.createReminderTemplate(
        accountUuid,
        request,
      );

      res.status(201).json({
        success: true,
        data: template,
        message: '提醒模板创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建提醒模板失败',
      });
    }
  }

  /**
   * 获取账户的所有提醒模板
   * GET /reminders/templates
   */
  static async getTemplatesByAccount(req: Request, res: Response) {
    try {
      const accountUuid = (req as any).accountUuid; // 从认证中间件获取

      const templates =
        await ReminderTemplateController.domainService.getReminderTemplatesByAccount(accountUuid);

      res.json({
        success: true,
        data: templates,
        total: templates.length,
        message: '获取提醒模板列表成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒模板列表失败',
      });
    }
  }

  /**
   * 获取单个提醒模板
   * GET /reminders/templates/:templateUuid
   */
  static async getTemplate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      const template =
        await ReminderTemplateController.domainService.getReminderTemplate(templateUuid);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: '提醒模板不存在',
        });
      }

      res.json({
        success: true,
        data: template,
        message: '获取提醒模板成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒模板失败',
      });
    }
  }

  /**
   * 更新提醒模板
   * PUT /reminders/templates/:templateUuid
   */
  static async updateTemplate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;
      const request: UpdateReminderTemplateRequest = req.body;

      const template = await ReminderTemplateController.domainService.updateReminderTemplate(
        templateUuid,
        request,
      );

      res.json({
        success: true,
        data: template,
        message: '提醒模板更新成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新提醒模板失败',
      });
    }
  }

  /**
   * 删除提醒模板
   * DELETE /reminders/templates/:templateUuid
   */
  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      await ReminderTemplateController.domainService.deleteReminderTemplate(templateUuid);

      res.json({
        success: true,
        message: '提醒模板删除成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除提醒模板失败',
      });
    }
  }

  /**
   * 切换模板启用状态
   * PATCH /reminders/templates/:templateUuid/toggle
   */
  static async toggleTemplateEnabled(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;
      const { enabled } = req.body;

      await ReminderTemplateController.domainService.toggleReminderTemplateEnabled(
        templateUuid,
        enabled,
      );

      res.json({
        success: true,
        message: enabled ? '模板已启用' : '模板已禁用',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '切换模板状态失败',
      });
    }
  }

  /**
   * 搜索提醒模板
   * GET /reminders/templates/search
   */
  static async searchTemplates(req: Request, res: Response) {
    try {
      const accountUuid = (req as any).accountUuid; // 从认证中间件获取
      const { q: searchTerm } = req.query;

      if (!searchTerm || typeof searchTerm !== 'string') {
        return res.status(400).json({
          success: false,
          error: '搜索关键词不能为空',
        });
      }

      const templates = await ReminderTemplateController.domainService.searchReminderTemplates(
        accountUuid,
        searchTerm,
      );

      res.json({
        success: true,
        data: templates,
        total: templates.length,
        query: searchTerm,
        message: '搜索提醒模板成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '搜索提醒模板失败',
      });
    }
  }

  /**
   * 获取模板统计信息
   * GET /reminders/templates/:templateUuid/stats
   */
  static async getTemplateStats(req: Request, res: Response) {
    try {
      const { templateUuid } = req.params;

      const stats =
        await ReminderTemplateController.domainService.getReminderTemplateStats(templateUuid);

      res.json({
        success: true,
        data: stats,
        message: '获取模板统计信息成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取模板统计信息失败',
      });
    }
  }

  /**
   * 获取账户统计信息
   * GET /reminders/templates/account-stats
   */
  static async getAccountStats(req: Request, res: Response) {
    try {
      const accountUuid = (req as any).accountUuid; // 从认证中间件获取

      const stats = await ReminderTemplateController.domainService.getAccountStats(accountUuid);

      res.json({
        success: true,
        data: stats,
        message: '获取账户统计信息成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取账户统计信息失败',
      });
    }
  }
}
