import type { Request, Response } from 'express';
import { TaskApplicationService } from '../../../application/services/TaskApplicationService';
import type { TaskContracts } from '@dailyuse/contracts';

type CreateTaskTemplateRequest = TaskContracts.CreateTaskTemplateRequest;
type UpdateTaskTemplateRequest = TaskContracts.UpdateTaskTemplateRequest;

export class TaskTemplateController {
  private static taskService = new TaskApplicationService();

  /**
   * 创建任务模板
   */
  static async createTemplate(req: Request, res: Response) {
    try {
      const request: CreateTaskTemplateRequest = req.body;
      const template = await TaskTemplateController.taskService.createTemplate(request);

      res.status(201).json({
        success: true,
        data: template,
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
  static async getTemplates(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const templates = await TaskTemplateController.taskService.getTemplates(queryParams);

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
  static async getTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await TaskTemplateController.taskService.getTemplateById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: '任务模板不存在',
        });
      }

      res.json({
        success: true,
        data: template,
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
  static async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: UpdateTaskTemplateRequest = req.body;
      const template = await TaskTemplateController.taskService.updateTemplate(id, request);

      res.json({
        success: true,
        data: template,
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
  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TaskTemplateController.taskService.deleteTemplate(id);

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
  static async activateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await TaskTemplateController.taskService.activateTemplate(id);

      res.json({
        success: true,
        data: template,
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
  static async pauseTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await TaskTemplateController.taskService.pauseTemplate(id);

      res.json({
        success: true,
        data: template,
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
