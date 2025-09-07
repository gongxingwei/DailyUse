import type { Request, Response } from 'express';
import { ReminderApplicationService } from '../../../application/services/ReminderApplicationService';
import type { ReminderContracts } from '@dailyuse/contracts';

export class ReminderTemplateController {
  private static reminderService = new ReminderApplicationService();

  /**
   * 创建提醒模板
   */
  static async createTemplate(req: Request, res: Response) {
    try {
      const request: ReminderContracts.CreateReminderTemplateRequest = req.body;
      const template = await ReminderTemplateController.reminderService.createTemplate(request);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Reminder template created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create reminder template',
      });
    }
  }

  /**
   * 获取提醒模板列表
   */
  static async getTemplates(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const templates = await ReminderTemplateController.reminderService.getTemplates(queryParams);

      res.json({
        success: true,
        data: templates,
        message: 'Reminder templates retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve reminder templates',
      });
    }
  }

  /**
   * 根据ID获取提醒模板
   */
  static async getTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await ReminderTemplateController.reminderService.getTemplateById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Reminder template not found',
        });
      }

      res.json({
        success: true,
        data: template,
        message: 'Reminder template retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve reminder template',
      });
    }
  }

  /**
   * 更新提醒模板
   */
  static async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: ReminderContracts.UpdateReminderTemplateRequest = req.body;
      const template = await ReminderTemplateController.reminderService.updateTemplate(id, request);

      res.json({
        success: true,
        data: template,
        message: 'Reminder template updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update reminder template',
      });
    }
  }

  /**
   * 删除提醒模板
   */
  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderTemplateController.reminderService.deleteTemplate(id);

      res.json({
        success: true,
        message: 'Reminder template deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete reminder template',
      });
    }
  }

  /**
   * 激活提醒模板
   */
  static async activateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await ReminderTemplateController.reminderService.activateTemplate(id);

      res.json({
        success: true,
        data: template,
        message: 'Reminder template activated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate reminder template',
      });
    }
  }

  /**
   * 暂停提醒模板
   */
  static async pauseTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await ReminderTemplateController.reminderService.pauseTemplate(id);

      res.json({
        success: true,
        data: template,
        message: 'Reminder template paused successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to pause reminder template',
      });
    }
  }
}

export class ReminderInstanceController {
  private static reminderService = new ReminderApplicationService();

  /**
   * 创建提醒实例
   */
  static async createInstance(req: Request, res: Response) {
    try {
      const request: ReminderContracts.CreateReminderInstanceRequest = req.body;
      const instance = await ReminderInstanceController.reminderService.createInstance(request);

      res.status(201).json({
        success: true,
        data: instance,
        message: 'Reminder instance created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create reminder instance',
      });
    }
  }

  /**
   * 获取提醒实例列表
   */
  static async getInstances(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const instances = await ReminderInstanceController.reminderService.getInstances(queryParams);

      res.json({
        success: true,
        data: instances,
        message: 'Reminder instances retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve reminder instances',
      });
    }
  }

  /**
   * 根据ID获取提醒实例
   */
  static async getInstanceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await ReminderInstanceController.reminderService.getInstanceById(id);

      if (!instance) {
        return res.status(404).json({
          success: false,
          message: 'Reminder instance not found',
        });
      }

      res.json({
        success: true,
        data: instance,
        message: 'Reminder instance retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve reminder instance',
      });
    }
  }

  /**
   * 更新提醒实例
   */
  static async updateInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: ReminderContracts.UpdateReminderInstanceRequest = req.body;
      const instance = await ReminderInstanceController.reminderService.updateInstance(id, request);

      res.json({
        success: true,
        data: instance,
        message: 'Reminder instance updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update reminder instance',
      });
    }
  }

  /**
   * 删除提醒实例
   */
  static async deleteInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ReminderInstanceController.reminderService.deleteInstance(id);

      res.json({
        success: true,
        message: 'Reminder instance deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete reminder instance',
      });
    }
  }

  /**
   * 触发提醒
   */
  static async triggerReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await ReminderInstanceController.reminderService.triggerReminder(id);

      res.json({
        success: true,
        data: instance,
        message: 'Reminder triggered successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to trigger reminder',
      });
    }
  }

  /**
   * 稍后提醒
   */
  static async snoozeReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { snoozeUntil, reason } = req.body;
      const instance = await ReminderInstanceController.reminderService.snoozeReminder(
        id,
        new Date(snoozeUntil),
        reason,
      );

      res.json({
        success: true,
        data: instance,
        message: 'Reminder snoozed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to snooze reminder',
      });
    }
  }

  /**
   * 忽略提醒
   */
  static async dismissReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await ReminderInstanceController.reminderService.dismissReminder(id);

      res.json({
        success: true,
        data: instance,
        message: 'Reminder dismissed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to dismiss reminder',
      });
    }
  }

  /**
   * 确认提醒
   */
  static async acknowledgeReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await ReminderInstanceController.reminderService.acknowledgeReminder(id);

      res.json({
        success: true,
        data: instance,
        message: 'Reminder acknowledged successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to acknowledge reminder',
      });
    }
  }
}

export class ReminderController {
  private static reminderService = new ReminderApplicationService();

  /**
   * 批量忽略提醒
   */
  static async batchDismissReminders(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      await ReminderController.reminderService.batchDismissReminders(ids);

      res.json({
        success: true,
        message: 'Reminders dismissed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to dismiss reminders',
      });
    }
  }

  /**
   * 批量稍后提醒
   */
  static async batchSnoozeReminders(req: Request, res: Response) {
    try {
      const { ids, snoozeUntil } = req.body;
      await ReminderController.reminderService.batchSnoozeReminders(ids, new Date(snoozeUntil));

      res.json({
        success: true,
        message: 'Reminders snoozed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to snooze reminders',
      });
    }
  }

  /**
   * 获取活跃提醒
   */
  static async getActiveReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const reminders = await ReminderController.reminderService.getActiveReminders(accountUuid);

      res.json({
        success: true,
        data: reminders,
        message: 'Active reminders retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve active reminders',
      });
    }
  }

  /**
   * 获取待处理提醒
   */
  static async getPendingReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const reminders = await ReminderController.reminderService.getPendingReminders(accountUuid);

      res.json({
        success: true,
        data: reminders,
        message: 'Pending reminders retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve pending reminders',
      });
    }
  }

  /**
   * 获取过期提醒
   */
  static async getOverdueReminders(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const reminders = await ReminderController.reminderService.getOverdueReminders(accountUuid);

      res.json({
        success: true,
        data: reminders,
        message: 'Overdue reminders retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve overdue reminders',
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
      const reminders = await ReminderController.reminderService.getUpcomingReminders(
        accountUuid,
        hours ? parseInt(hours as string) : undefined,
      );

      res.json({
        success: true,
        data: reminders,
        message: 'Upcoming reminders retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve upcoming reminders',
      });
    }
  }

  /**
   * 获取提醒历史
   */
  static async getReminderHistory(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { from, to } = req.query;
      const reminders = await ReminderController.reminderService.getReminderHistory(
        accountUuid,
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined,
      );

      res.json({
        success: true,
        data: reminders,
        message: 'Reminder history retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve reminder history',
      });
    }
  }

  /**
   * 搜索提醒
   */
  static async searchReminders(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const reminders = await ReminderController.reminderService.searchReminders(queryParams);

      res.json({
        success: true,
        data: reminders,
        message: 'Reminder search completed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search reminders',
      });
    }
  }

  /**
   * 获取提醒统计
   */
  static async getReminderStats(req: Request, res: Response) {
    try {
      const queryParams = req.query;
      const stats = await ReminderController.reminderService.getReminderStats(queryParams);

      res.json({
        success: true,
        data: stats,
        message: 'Reminder stats retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve reminder stats',
      });
    }
  }
}
