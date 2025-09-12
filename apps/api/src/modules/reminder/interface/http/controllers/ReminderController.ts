/**
 * Reminder Controllers
 * 提醒控制器
 */

import type { Request, Response } from 'express';
import { ReminderTemplateApplicationService } from '../../../application/services/ReminderTemplateApplicationService';
import { ReminderInstanceApplicationService } from '../../../application/services/ReminderInstanceApplicationService';
import { PrismaClient } from '@prisma/client';
import type { Reminder, ReminderContracts } from '@dailyuse/contracts';

type CreateReminderTemplateRequest = ReminderContracts.CreateReminderTemplateRequest;
type UpdateReminderTemplateRequest = ReminderContracts.UpdateReminderTemplateRequest;
type CreateReminderInstanceRequest = ReminderContracts.CreateReminderInstanceRequest;
type UpdateReminderInstanceRequest = ReminderContracts.UpdateReminderInstanceRequest;
type SnoozeReminderRequest = ReminderContracts.SnoozeReminderRequest;

const prisma = new PrismaClient();

export class ReminderTemplateController {
  private static reminderService = new ReminderTemplateApplicationService(prisma);

  /**
   * 创建提醒模板
   */
  static async createTemplate(req: Request, res: Response) {
    try {
      const request: CreateReminderTemplateRequest = req.body;
      const { accountUuid } = req.params;
      const templateUuid = await ReminderTemplateController.reminderService.create(
        accountUuid,
        request,
      );

      res.status(201).json({
        success: true,
        data: { uuid: templateUuid },
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
   * 获取提醒模板列表
   */
  static async getTemplates(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const templates =
        await ReminderTemplateController.reminderService.getAllByAccount(accountUuid);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒模板列表失败',
      });
    }
  }

  /**
   * 根据ID获取提醒模板
   */
  static async getTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await ReminderTemplateController.reminderService.getById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: '提醒模板不存在',
        });
      }

      res.json({
        success: true,
        data: template,
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
   */
  static async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: UpdateReminderTemplateRequest = req.body;
      await ReminderTemplateController.reminderService.update(id, request);

      // 获取更新后的模板
      const template = await ReminderTemplateController.reminderService.getById(id);

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
   */
  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderTemplateController.reminderService.delete(id);

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
   * 启用提醒模板
   */
  static async activateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderTemplateController.reminderService.enable(id);

      // 获取更新后的模板
      const template = await ReminderTemplateController.reminderService.getById(id);

      res.json({
        success: true,
        data: template,
        message: '提醒模板启用成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '启用提醒模板失败',
      });
    }
  }

  /**
   * 暂停提醒模板
   */
  static async pauseTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderTemplateController.reminderService.disable(id);

      // 获取更新后的模板
      const template = await ReminderTemplateController.reminderService.getById(id);

      res.json({
        success: true,
        data: template,
        message: '提醒模板暂停成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '暂停提醒模板失败',
      });
    }
  }

  /**
   * 启用提醒模板
   */
  static async enableTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderTemplateController.reminderService.enable(id);

      // 获取更新后的模板
      const template = await ReminderTemplateController.reminderService.getById(id);

      res.json({
        success: true,
        data: template,
        message: '提醒模板启用成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '启用提醒模板失败',
      });
    }
  }

  /**
   * 禁用提醒模板
   */
  static async disableTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderTemplateController.reminderService.disable(id);

      // 获取更新后的模板
      const template = await ReminderTemplateController.reminderService.getById(id);

      res.json({
        success: true,
        data: template,
        message: '提醒模板禁用成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '禁用提醒模板失败',
      });
    }
  }

  /**
   * 按分类获取模板
   */
  static async getTemplatesByCategory(req: Request, res: Response) {
    try {
      const { accountUuid, category } = req.params;
      const templates = await ReminderTemplateController.reminderService.getByCategory(
        accountUuid,
        category,
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取分类模板失败',
      });
    }
  }

  /**
   * 搜索模板
   */
  static async searchTemplates(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: '搜索关键词不能为空',
        });
      }

      const templates = await ReminderTemplateController.reminderService.search(accountUuid, query);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '搜索模板失败',
      });
    }
  }

  /**
   * 复制模板
   */
  static async duplicateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newName, accountUuid } = req.body;

      const newTemplateUuid = await ReminderTemplateController.reminderService.duplicateTemplate(
        id,
        newName,
        accountUuid,
      );

      res.status(201).json({
        success: true,
        data: { uuid: newTemplateUuid },
        message: '模板复制成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '复制模板失败',
      });
    }
  }

  /**
   * 批量删除模板
   */
  static async batchDeleteTemplates(req: Request, res: Response) {
    try {
      const { uuids } = req.body;
      await ReminderTemplateController.reminderService.batchDelete(uuids);

      res.json({
        success: true,
        message: '批量删除模板成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量删除模板失败',
      });
    }
  }
}

export class ReminderInstanceController {
  private static reminderService = new ReminderInstanceApplicationService(prisma);

  /**
   * 创建提醒实例
   */
  static async createInstance(req: Request, res: Response) {
    try {
      const request: CreateReminderInstanceRequest = req.body;
      const { accountUuid } = req.params;
      const instanceUuid = await ReminderInstanceController.reminderService.create(
        accountUuid,
        request,
      );

      res.status(201).json({
        success: true,
        data: { uuid: instanceUuid },
        message: '提醒实例创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建提醒实例失败',
      });
    }
  }

  /**
   * 获取提醒实例列表
   */
  static async getInstances(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { limit, offset, sortBy, sortOrder } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as 'createdAt' | 'scheduledTime' | 'priority' | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const instances = await ReminderInstanceController.reminderService.getAllByAccount(
        accountUuid,
        options,
      );

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒实例列表失败',
      });
    }
  }

  /**
   * 根据ID获取提醒实例
   */
  static async getInstanceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await ReminderInstanceController.reminderService.getById(id);

      if (!instance) {
        return res.status(404).json({
          success: false,
          error: '提醒实例不存在',
        });
      }

      res.json({
        success: true,
        data: instance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒实例失败',
      });
    }
  }

  /**
   * 更新提醒实例
   */
  static async updateInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: UpdateReminderInstanceRequest = req.body;
      await ReminderInstanceController.reminderService.update(id, request);

      // 获取更新后的实例
      const instance = await ReminderInstanceController.reminderService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '提醒实例更新成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新提醒实例失败',
      });
    }
  }

  /**
   * 删除提醒实例
   */
  static async deleteInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderInstanceController.reminderService.delete(id);

      res.json({
        success: true,
        message: '提醒实例删除成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除提醒实例失败',
      });
    }
  }

  /**
   * 触发提醒
   */
  static async triggerReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderInstanceController.reminderService.trigger(id);

      // 获取更新后的实例
      const instance = await ReminderInstanceController.reminderService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '提醒已触发',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '触发提醒失败',
      });
    }
  }

  /**
   * 确认提醒
   */
  static async acknowledgeReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderInstanceController.reminderService.acknowledge(id);

      // 获取更新后的实例
      const instance = await ReminderInstanceController.reminderService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '提醒已确认',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '确认提醒失败',
      });
    }
  }

  /**
   * 忽略提醒
   */
  static async dismissReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderInstanceController.reminderService.dismiss(id);

      // 获取更新后的实例
      const instance = await ReminderInstanceController.reminderService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '提醒已忽略',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '忽略提醒失败',
      });
    }
  }

  /**
   * 延迟提醒
   */
  static async snoozeReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: SnoozeReminderRequest = req.body;
      await ReminderInstanceController.reminderService.snooze(id, request);

      // 获取更新后的实例
      const instance = await ReminderInstanceController.reminderService.getById(id);

      res.json({
        success: true,
        data: instance,
        message: '提醒已延迟',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '延迟提醒失败',
      });
    }
  }

  /**
   * 获取今天的提醒
   */
  static async getTodayReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const instances = await ReminderInstanceController.reminderService.getToday(accountUuid);

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取今日提醒失败',
      });
    }
  }

  /**
   * 获取即将到来的提醒
   */
  static async getUpcomingReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { hours } = req.query;
      const hoursNum = hours ? parseInt(hours as string) : 24;

      const instances = await ReminderInstanceController.reminderService.getUpcoming(
        accountUuid,
        hoursNum,
      );

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取即将到来的提醒失败',
      });
    }
  }

  /**
   * 获取待处理的提醒
   */
  static async getPendingReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const instances = await ReminderInstanceController.reminderService.getPending(accountUuid);

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取待处理提醒失败',
      });
    }
  }

  /**
   * 获取已触发的提醒
   */
  static async getTriggeredReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const instances = await ReminderInstanceController.reminderService.getTriggered(accountUuid);

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取已触发提醒失败',
      });
    }
  }

  /**
   * 按状态获取提醒
   */
  static async getRemindersByStatus(req: Request, res: Response) {
    try {
      const { accountUuid, status } = req.params;
      const instances = await ReminderInstanceController.reminderService.getByStatus(
        accountUuid,
        status as 'pending' | 'triggered' | 'acknowledged' | 'dismissed' | 'snoozed' | 'expired',
      );

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒列表失败',
      });
    }
  }

  /**
   * 批量确认提醒
   */
  static async batchAcknowledge(req: Request, res: Response) {
    try {
      const { uuids } = req.body;
      await ReminderInstanceController.reminderService.batchAcknowledge(uuids);

      res.json({
        success: true,
        message: '批量确认提醒成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量确认提醒失败',
      });
    }
  }

  /**
   * 批量忽略提醒
   */
  static async batchDismiss(req: Request, res: Response) {
    try {
      const { uuids } = req.body;
      await ReminderInstanceController.reminderService.batchDismiss(uuids);

      res.json({
        success: true,
        message: '批量忽略提醒成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量忽略提醒失败',
      });
    }
  }
}

export class ReminderController {
  private static reminderTemplateService = new ReminderTemplateApplicationService(prisma);
  private static reminderInstanceService = new ReminderInstanceApplicationService(prisma);

  /**
   * 批量忽略提醒
   */
  static async batchDismissReminders(req: Request, res: Response) {
    try {
      const { uuids } = req.body;
      await ReminderController.reminderInstanceService.batchDismiss(uuids);

      res.json({
        success: true,
        message: '批量忽略提醒成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量忽略提醒失败',
      });
    }
  }

  /**
   * 批量延迟提醒
   */
  static async batchSnoozeReminders(req: Request, res: Response) {
    try {
      const { uuids, snoozeMinutes } = req.body;
      // TODO: 实现批量延迟逻辑
      res.json({
        success: true,
        message: `批量延迟提醒 ${snoozeMinutes} 分钟成功`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量延迟提醒失败',
      });
    }
  }

  /**
   * 搜索提醒
   */
  static async searchReminders(req: Request, res: Response) {
    try {
      const { accountUuid, q: query } = req.query;
      if (!accountUuid || !query) {
        return res.status(400).json({
          success: false,
          error: '缺少必需的参数',
        });
      }

      // TODO: 实现搜索逻辑
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '搜索提醒失败',
      });
    }
  }

  /**
   * 获取提醒统计
   */
  static async getReminderStats(req: Request, res: Response) {
    try {
      const { accountUuid } = req.query;
      if (!accountUuid) {
        return res.status(400).json({
          success: false,
          error: '缺少必需的 accountUuid 参数',
        });
      }

      // TODO: 实现统计逻辑
      res.json({
        success: true,
        data: {
          total: 0,
          pending: 0,
          triggered: 0,
          acknowledged: 0,
          dismissed: 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒统计失败',
      });
    }
  }

  /**
   * 获取活跃提醒
   */
  static async getActiveReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const instances = await ReminderController.reminderInstanceService.getTriggered(accountUuid);

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取活跃提醒失败',
      });
    }
  }

  /**
   * 获取待处理提醒
   */
  static async getPendingReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const instances = await ReminderController.reminderInstanceService.getPending(accountUuid);

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取待处理提醒失败',
      });
    }
  }

  /**
   * 获取过期提醒
   */
  static async getOverdueReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      // TODO: 实现过期提醒逻辑
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取过期提醒失败',
      });
    }
  }

  /**
   * 获取即将到来的提醒
   */
  static async getUpcomingReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { hours } = req.query;
      const hoursNum = hours ? parseInt(hours as string) : 24;

      const instances = await ReminderController.reminderInstanceService.getUpcoming(
        accountUuid,
        hoursNum,
      );

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取即将到来的提醒失败',
      });
    }
  }

  /**
   * 获取提醒历史
   */
  static async getReminderHistory(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // TODO: 实现历史记录逻辑
      res.json({
        success: true,
        data: {
          reminders: [],
          total: 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取提醒历史失败',
      });
    }
  }
}
