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

  // 从请求中获取账户 UUID (这应该从认证中间件中获取)
  private getAccountUuid(req: Request): string {
    // 暂时硬编码，实际应该从 JWT token 或 session 中获取
    return req.headers['x-account-uuid'] as string || 'test-account-uuid';
  }
  // ===== Schedule Management =====

  /**
   * 获取所有计划任务
   */
  async getAllSchedules(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = this.getAccountUuid(req);
      const { page = 1, limit = 50, status, taskType, enabled, tags, search } = req.query;
      
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
        query.status = statusArray.map(s => s as ScheduleContracts.ScheduleStatus);
      }
      
      if (taskType) {
        const taskTypeArray = Array.isArray(taskType) ? taskType : [taskType];
        query.taskType = taskTypeArray.map(t => t as ScheduleContracts.ScheduleTaskType);
      }
      
      if (enabled !== undefined) {
        query.enabled = enabled === 'true';
      }
      
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        query.tags = tagsArray.map(tag => tag as string);
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
      const { id } = req.params;
      const mockSchedule = {
        id,
        name: '每日数据备份',
        description: '每天凌晨2点执行数据库备份',
        cron: '0 2 * * *',
        type: 'backup',
        status: 'active',
        enabled: true,
      };

      ok(res, mockSchedule, '获取计划任务成功');
    } catch (error) {
      console.error('获取计划任务失败:', error);
      notFound(res, '计划任务不存在');
    }
  }

  /**
   * 创建计划任务
   */
  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const scheduleData = req.body;
      const newSchedule = {
        id: Date.now().toString(),
        ...scheduleData,
        status: 'inactive',
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      created(res, newSchedule, '创建计划任务成功');
    } catch (error) {
      console.error('创建计划任务失败:', error);
      badRequest(res, '创建计划任务失败');
    }
  }

  /**
   * 更新计划任务
   */
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedSchedule = {
        id,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      ok(res, updatedSchedule, '更新计划任务成功');
    } catch (error) {
      console.error('更新计划任务失败:', error);
      badRequest(res, '更新计划任务失败');
    }
  }

  /**
   * 删除计划任务
   */
  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      ok(res, null, '删除计划任务成功');
    } catch (error) {
      console.error('删除计划任务失败:', error);
      badRequest(res, '删除计划任务失败');
    }
  }

  /**
   * 启动计划任务
   */
  async startSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = {
        id,
        status: 'active',
        startedAt: new Date().toISOString(),
      };

      ok(res, result, '启动计划任务成功');
    } catch (error) {
      console.error('启动计划任务失败:', error);
      badRequest(res, '启动计划任务失败');
    }
  }

  /**
   * 停止计划任务
   */
  async stopSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = {
        id,
        status: 'inactive',
        stoppedAt: new Date().toISOString(),
      };

      ok(res, result, '停止计划任务成功');
    } catch (error) {
      console.error('停止计划任务失败:', error);
      badRequest(res, '停止计划任务失败');
    }
  }

  /**
   * 暂停计划任务
   */
  async pauseSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = {
        id,
        status: 'paused',
        pausedAt: new Date().toISOString(),
      };

      ok(res, result, '暂停计划任务成功');
    } catch (error) {
      console.error('暂停计划任务失败:', error);
      badRequest(res, '暂停计划任务失败');
    }
  }

  /**
   * 恢复计划任务
   */
  async resumeSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = {
        id,
        status: 'active',
        resumedAt: new Date().toISOString(),
      };

      ok(res, result, '恢复计划任务成功');
    } catch (error) {
      console.error('恢复计划任务失败:', error);
      badRequest(res, '恢复计划任务失败');
    }
  }

  /**
   * 手动触发计划任务
   */
  async triggerSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = {
        id,
        executionId: Date.now().toString(),
        triggeredAt: new Date().toISOString(),
      };

      ok(res, result, '手动触发计划任务成功');
    } catch (error) {
      console.error('触发计划任务失败:', error);
      badRequest(res, '触发计划任务失败');
    }
  }

  /**
   * 获取计划任务状态
   */
  async getScheduleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mockStatus = {
        id,
        status: 'active',
        enabled: true,
        isRunning: false,
      };

      ok(res, mockStatus, '获取计划任务状态成功');
    } catch (error) {
      console.error('获取计划任务状态失败:', error);
      badRequest(res, '获取计划任务状态失败');
    }
  }

  /**
   * 获取计划任务执行历史
   */
  async getScheduleHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mockHistory = [
        {
          id: '1',
          scheduleId: id,
          executionId: Date.now().toString(),
          status: 'success',
        },
      ];

      ok(res, mockHistory, '获取计划任务执行历史成功');
    } catch (error) {
      console.error('获取计划任务执行历史失败:', error);
      badRequest(res, '获取计划任务执行历史失败');
    }
  }

  /**
   * 获取所有活跃的计划任务
   */
  async getActiveSchedules(req: Request, res: Response): Promise<void> {
    try {
      const mockActiveSchedules = [
        {
          id: '1',
          name: '每日数据备份',
          status: 'active',
        },
      ];

      ok(res, mockActiveSchedules, '获取活跃计划任务成功');
    } catch (error) {
      console.error('获取活跃计划任务失败:', error);
      apiError(res, '获取活跃计划任务失败');
    }
  }

  /**
   * 获取计划任务统计信息
   */
  async getScheduleStats(req: Request, res: Response): Promise<void> {
    try {
      const mockStats = {
        total: 5,
        active: 3,
        inactive: 1,
        paused: 1,
      };

      ok(res, mockStats, '获取计划任务统计信息成功');
    } catch (error) {
      console.error('获取计划任务统计信息失败:', error);
      apiError(res, '获取计划任务统计信息失败');
    }
  }
}
