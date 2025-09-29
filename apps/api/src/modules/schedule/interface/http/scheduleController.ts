import type { Request, Response } from 'express';
import type { ScheduleContracts } from '@dailyuse/contracts';
import {
  ok,
  created,
  badRequest,
  notFound,
  error as apiError,
} from '../../../../shared/utils/apiResponse';
import { ScheduleContainer } from '../../infrastructure/di/ScheduleContainer';
import { PrismaClient } from '@prisma/client';

type CreateScheduleTaskRequestDto = ScheduleContracts.CreateScheduleTaskRequestDto;
type UpdateScheduleTaskRequestDto = ScheduleContracts.UpdateScheduleTaskRequestDto;
type BatchScheduleTaskOperationRequestDto = ScheduleContracts.BatchScheduleTaskOperationRequestDto;
type QuickReminderRequestDto = ScheduleContracts.QuickReminderRequestDto;
type SnoozeReminderRequestDto = ScheduleContracts.SnoozeReminderRequestDto;

/**
 * 任务调度控制器
 */
export class ScheduleController {
  private prisma = new PrismaClient();

  private get scheduleService() {
    return ScheduleContainer.getInstance(this.prisma).scheduleApplicationService;
  }

  // 从请求中获取账户 UUID (从认证中间件中获取)
  private getAccountUuid(req: Request): string {
    const accountUuid = (req as any).accountUuid;
    if (!accountUuid) {
      throw new Error('用户未认证，无法获取账户UUID');
    }
    return accountUuid;
  }

  // ===== Schedule Management =====

  /**
   * 获取所有计划任务
   */
  async getAllSchedules(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = this.getAccountUuid(req);
      const { page = 1, limit = 50, status, taskType, enabled, tags } = req.query;

      // 构建查询参数
      const query: ScheduleContracts.IScheduleTaskQuery = {
        createdBy: accountUuid,
        pagination: {
          offset: (Number(page) - 1) * Number(limit),
          limit: Number(limit),
        },
        sorting: {
          field: 'scheduledTime',
          order: 'asc',
        },
      };

      // 添加过滤条件
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        query.status = statusArray.map((s) => s as ScheduleContracts.ScheduleStatus);
      }

      if (taskType) {
        const taskTypeArray = Array.isArray(taskType) ? taskType : [taskType];
        query.taskType = taskTypeArray.map((t) => t as ScheduleContracts.ScheduleTaskType);
      }

      if (enabled !== undefined) {
        query.enabled = enabled === 'true';
      }

      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        query.tags = tagsArray.map((tag) => tag as string);
      }

      const result = await this.scheduleService.getScheduleTasks(accountUuid, query);

      // 遵循 API 响应结构规范
      const responseData = {
        schedules: result.tasks,
        total: result.total,
        page: Number(page),
        limit: Number(limit),
        hasMore: result.pagination.hasMore,
      };

      ok(res, responseData, '获取计划任务列表成功');
    } catch (error) {
      console.error('获取计划任务列表失败:', error);
      apiError(res, '获取计划任务列表失败');
    }
  }

  /**
   * 获取单个计划任务
   */
  async getScheduleById(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      const schedule = await this.scheduleService.getScheduleTask(accountUuid, uuid);

      if (!schedule) {
        notFound(res, '计划任务不存在');
        return;
      }

      ok(res, { schedule }, '获取计划任务成功');
    } catch (error) {
      console.error('获取计划任务失败:', error);
      apiError(res, '获取计划任务失败');
    }
  }

  /**
   * 创建计划任务
   */
  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = this.getAccountUuid(req);
      const scheduleData: CreateScheduleTaskRequestDto = req.body;

      const newSchedule = await this.scheduleService.createScheduleTaskWithValidation(
        accountUuid,
        scheduleData,
      );

      created(res, { schedule: newSchedule }, '创建计划任务成功');
    } catch (error) {
      console.error('创建计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '创建计划任务失败');
    }
  }

  /**
   * 更新计划任务
   */
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);
      const updateData: UpdateScheduleTaskRequestDto = req.body;

      const updatedSchedule = await this.scheduleService.updateScheduleTask(
        accountUuid,
        uuid,
        updateData,
      );

      ok(res, { schedule: updatedSchedule }, '更新计划任务成功');
    } catch (error) {
      console.error('更新计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '更新计划任务失败');
    }
  }

  /**
   * 删除计划任务
   */
  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      await this.scheduleService.deleteScheduleTask(accountUuid, uuid);

      ok(res, null, '删除计划任务成功');
    } catch (error) {
      console.error('删除计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '删除计划任务失败');
    }
  }

  // ===== Schedule Operations =====

  /**
   * 执行计划任务
   */
  async executeSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);
      const { force } = req.body;

      const result = await this.scheduleService.executeScheduleTask(accountUuid, uuid, force);

      ok(res, { executionResult: result }, '执行计划任务成功');
    } catch (error) {
      console.error('执行计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '执行计划任务失败');
    }
  }

  /**
   * 启用计划任务
   */
  async enableSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      const schedule = await this.scheduleService.enableScheduleTask(accountUuid, uuid);

      ok(res, { schedule }, '启用计划任务成功');
    } catch (error) {
      console.error('启用计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '启用计划任务失败');
    }
  }

  /**
   * 禁用计划任务
   */
  async disableSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      const schedule = await this.scheduleService.disableScheduleTask(accountUuid, uuid);

      ok(res, { schedule }, '禁用计划任务成功');
    } catch (error) {
      console.error('禁用计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '禁用计划任务失败');
    }
  }

  /**
   * 暂停计划任务
   */
  async pauseSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      const schedule = await this.scheduleService.pauseScheduleTask(accountUuid, uuid);

      ok(res, { schedule }, '暂停计划任务成功');
    } catch (error) {
      console.error('暂停计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '暂停计划任务失败');
    }
  }

  /**
   * 恢复计划任务
   */
  async resumeSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);

      const schedule = await this.scheduleService.resumeScheduleTask(accountUuid, uuid);

      ok(res, { schedule }, '恢复计划任务成功');
    } catch (error) {
      console.error('恢复计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '恢复计划任务失败');
    }
  }

  /**
   * 延后提醒
   */
  async snoozeReminder(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const accountUuid = this.getAccountUuid(req);
      const { snoozeMinutes, reason }: SnoozeReminderRequestDto = req.body;

      const schedule = await this.scheduleService.snoozeReminder(accountUuid, {
        taskUuid: uuid,
        snoozeMinutes,
        reason,
      });

      ok(res, { schedule }, '延后提醒成功');
    } catch (error) {
      console.error('延后提醒失败:', error);
      badRequest(res, error instanceof Error ? error.message : '延后提醒失败');
    }
  }

  // ===== Additional Features =====

  /**
   * 获取即将到来的任务
   */
  async getUpcomingSchedules(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = this.getAccountUuid(req);
      const { withinMinutes = 60, limit = 100 } = req.query;

      const result = await this.scheduleService.getUpcomingTasks(
        accountUuid,
        Number(withinMinutes),
        Number(limit),
      );

      ok(res, result, '获取即将到来的任务成功');
    } catch (error) {
      console.error('获取即将到来的任务失败:', error);
      apiError(res, '获取即将到来的任务失败');
    }
  }

  /**
   * 快速创建提醒
   */
  async createQuickReminder(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = this.getAccountUuid(req);
      const reminderData: QuickReminderRequestDto = req.body;

      const schedule = await this.scheduleService.createQuickReminder(accountUuid, reminderData);

      created(res, { schedule }, '快速创建提醒成功');
    } catch (error) {
      console.error('快速创建提醒失败:', error);
      badRequest(res, error instanceof Error ? error.message : '快速创建提醒失败');
    }
  }

  /**
   * 批量操作计划任务
   */
  async batchOperateSchedules(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = this.getAccountUuid(req);
      const batchRequest: BatchScheduleTaskOperationRequestDto = req.body;

      const result = await this.scheduleService.batchOperateScheduleTasks(
        accountUuid,
        batchRequest,
      );

      ok(res, result, '批量操作计划任务成功');
    } catch (error) {
      console.error('批量操作计划任务失败:', error);
      badRequest(res, error instanceof Error ? error.message : '批量操作计划任务失败');
    }
  }

  /**
   * 获取执行历史
   */
  async getExecutionHistory(req: Request, res: Response): Promise<void> {
    try {
      // 这个功能需要通过仓储层实现，暂时返回空
      ok(res, { history: [], total: 0 }, '获取执行历史成功');
    } catch (error) {
      console.error('获取执行历史失败:', error);
      apiError(res, '获取执行历史失败');
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = this.getAccountUuid(req);

      // 直接通过容器获取仓储实例来实现统计
      const container = ScheduleContainer.getInstance(this.prisma);
      const repository = container.scheduleRepository;
      const stats = await repository.getStatistics(accountUuid);

      ok(res, stats, '获取统计信息成功');
    } catch (error) {
      console.error('获取统计信息失败:', error);
      apiError(res, '获取统计信息失败');
    }
  }
}
