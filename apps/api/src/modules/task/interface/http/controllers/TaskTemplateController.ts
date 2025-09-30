import type { Request, Response } from 'express';
import { TaskTemplateApplicationService } from '../../../application/services/TaskTemplateApplicationService';
import { prisma } from '../../../../../config/prisma';
import type { TaskContracts } from '@dailyuse/contracts';
import type { AuthenticatedRequest } from '../../../../../shared/middlewares/authMiddleware';

type CreateTaskTemplateRequest = TaskContracts.CreateTaskTemplateRequest;
type UpdateTaskTemplateRequest = TaskContracts.UpdateTaskTemplateRequest;

export class TaskTemplateController {
  private static taskService = new TaskTemplateApplicationService(prisma);

  /**
   * 创建任务模板
   */
  static async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const request: CreateTaskTemplateRequest = req.body;
      const accountUuid = req.accountUuid!;
      const templateUuid = await TaskTemplateController.taskService.create(accountUuid, request);

      // 获取创建后的完整模板数据
      const template = await TaskTemplateController.taskService.getById(templateUuid);

      res.status(201).json({
        success: true,
        data: { template },
        message: '任务模板创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建任务模板失败',
      });
    }
  }

  /**
   * 获取任务模板列表
   */
  static async getTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const accountUuid = req.accountUuid!;
      const { limit, offset, sortBy, sortOrder } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as 'createdAt' | 'updatedAt' | 'title' | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const templates = await TaskTemplateController.taskService.getAllByAccount(
        accountUuid,
        options,
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取任务模板列表失败',
      });
    }
  }

  /**
   * 根据ID获取任务模板
   */
  static async getTemplateById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const template = await TaskTemplateController.taskService.getById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: '任务模板不存在',
        });
      }

      res.json({
        success: true,
        data: { template },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取任务模板失败',
      });
    }
  }

  /**
   * 更新任务模板
   */
  static async updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const request: UpdateTaskTemplateRequest = req.body;
      await TaskTemplateController.taskService.update(id, request);

      // 获取更新后的模板
      const template = await TaskTemplateController.taskService.getById(id);

      res.json({
        success: true,
        data: { template },
        message: '任务模板更新成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新任务模板失败',
      });
    }
  }

  /**
   * 删除任务模板
   */
  static async deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await TaskTemplateController.taskService.delete(id);

      res.json({
        success: true,
        message: '任务模板删除成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除任务模板失败',
      });
    }
  }

  /**
   * 激活任务模板
   */
  static async activateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await TaskTemplateController.taskService.activate(id);

      // 获取更新后的模板
      const template = await TaskTemplateController.taskService.getById(id);

      res.json({
        success: true,
        data: { template },
        message: '任务模板已激活',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '激活任务模板失败',
      });
    }
  }

  /**
   * 暂停任务模板
   */
  static async pauseTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await TaskTemplateController.taskService.pause(id);

      // 获取更新后的模板
      const template = await TaskTemplateController.taskService.getById(id);

      res.json({
        success: true,
        data: { template },
        message: '任务模板已暂停',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '暂停任务模板失败',
      });
    }
  }
}
