/**
 * Schedule Web Application Service
 * @description 调度模块的Web应用服务，负责协调API调用和本地状态管理
 * @author DailyUse Team
 * @date 2025-01-09
 */

import type {
  CreateScheduleTaskRequestApi,
  UpdateScheduleTaskRequestApi,
  ScheduleTaskApi,
  ScheduleExecutionApi,
  ScheduleStatisticsResponse,
  ScheduleTaskActionResponse,
  SSEConnectionInfo,
} from '@dailyuse/contracts/modules/schedule';
import { scheduleApiClient } from '../../infrastructure/api/scheduleApiClient';

/**
 * Schedule Web 应用服务
 * 负责协调 Web 端的调度相关操作，整合 API 调用和本地状态管理
 * 遵循DDD架构原则：ApplicationService 不直接使用 composables
 */
export class ScheduleWebApplicationService {
  // ===== Schedule Task CRUD 操作 =====

  /**
   * 创建调度任务
   */
  async createScheduleTask(request: CreateScheduleTaskRequestApi): Promise<ScheduleTaskApi> {
    try {
      const task = await scheduleApiClient.createScheduleTask(request);
      return task;
    } catch (error) {
      console.error('创建调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取调度任务列表
   */
  async getScheduleTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    taskType?: string;
    priority?: string;
    search?: string;
  }): Promise<ScheduleTaskApi[]> {
    try {
      return await scheduleApiClient.getScheduleTasks(params);
    } catch (error) {
      console.error('获取调度任务列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个调度任务
   */
  async getScheduleTask(taskId: string): Promise<ScheduleTaskApi> {
    try {
      return await scheduleApiClient.getScheduleTask(taskId);
    } catch (error) {
      console.error('获取调度任务详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新调度任务
   */
  async updateScheduleTask(
    taskId: string,
    request: UpdateScheduleTaskRequestApi,
  ): Promise<ScheduleTaskApi> {
    try {
      const task = await scheduleApiClient.updateScheduleTask(taskId, request);
      return task;
    } catch (error) {
      console.error('更新调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 删除调度任务
   */
  async deleteScheduleTask(taskId: string): Promise<void> {
    try {
      await scheduleApiClient.deleteScheduleTask(taskId);
    } catch (error) {
      console.error('删除调度任务失败:', error);
      throw error;
    }
  }

  // ===== Schedule Task 操作 =====

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(taskId: string): Promise<ScheduleTaskActionResponse> {
    try {
      const result = await scheduleApiClient.pauseScheduleTask(taskId);
      return result;
    } catch (error) {
      console.error('暂停调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 启用调度任务
   */
  async enableScheduleTask(taskId: string): Promise<ScheduleTaskActionResponse> {
    try {
      const result = await scheduleApiClient.enableScheduleTask(taskId);
      return result;
    } catch (error) {
      console.error('启用调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 手动执行调度任务
   */
  async executeScheduleTask(taskId: string): Promise<ScheduleTaskActionResponse> {
    try {
      const result = await scheduleApiClient.executeScheduleTask(taskId);
      return result;
    } catch (error) {
      console.error('执行调度任务失败:', error);
      throw error;
    }
  }

  // ===== Schedule Execution History =====

  /**
   * 获取调度执行历史
   */
  async getScheduleExecutions(params?: {
    taskId?: string;
    status?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ScheduleExecutionApi[]> {
    try {
      return await scheduleApiClient.getScheduleExecutions(params);
    } catch (error) {
      console.error('获取执行历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个执行记录
   */
  async getScheduleExecution(executionId: string): Promise<ScheduleExecutionApi> {
    try {
      return await scheduleApiClient.getScheduleExecution(executionId);
    } catch (error) {
      console.error('获取执行记录详情失败:', error);
      throw error;
    }
  }

  // ===== Schedule Statistics =====

  /**
   * 获取调度统计信息
   */
  async getScheduleStatistics(): Promise<ScheduleStatisticsResponse> {
    try {
      return await scheduleApiClient.getScheduleStatistics();
    } catch (error) {
      console.error('获取调度统计信息失败:', error);
      throw error;
    }
  }

  // ===== SSE Connection =====

  /**
   * 获取SSE连接信息
   */
  async getSSEConnection(): Promise<SSEConnectionInfo> {
    try {
      return await scheduleApiClient.getSSEConnection();
    } catch (error) {
      console.error('获取SSE连接信息失败:', error);
      throw error;
    }
  }

  // ===== Validation & Preview =====

  /**
   * 验证Cron表达式
   */
  async validateCronExpression(
    expression: string,
  ): Promise<{ valid: boolean; nextRuns?: string[]; error?: string }> {
    try {
      return await scheduleApiClient.validateCronExpression(expression);
    } catch (error) {
      console.error('验证Cron表达式失败:', error);
      throw error;
    }
  }

  /**
   * 预览调度任务执行时间
   */
  async previewScheduleTask(request: Partial<CreateScheduleTaskRequestApi>): Promise<{
    nextExecutions: string[];
    scheduleDescription: string;
  }> {
    try {
      return await scheduleApiClient.previewScheduleTask(request);
    } catch (error) {
      console.error('预览调度任务失败:', error);
      throw error;
    }
  }

  // ===== Batch Operations =====

  /**
   * 批量操作调度任务
   */
  async batchOperateScheduleTasks(
    taskIds: string[],
    operation: 'pause' | 'enable' | 'delete',
  ): Promise<{ success: string[]; failed: string[] }> {
    try {
      const result = await scheduleApiClient.batchOperateScheduleTasks(taskIds, operation);
      return result;
    } catch (error) {
      console.error('批量操作调度任务失败:', error);
      throw error;
    }
  }

  // ===== Health & Monitoring =====

  /**
   * 获取调度器健康状态
   */
  async getSchedulerHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    runningTasks: number;
    queuedTasks: number;
    lastHeartbeat: string;
  }> {
    try {
      return await scheduleApiClient.getSchedulerHealth();
    } catch (error) {
      console.error('获取调度器健康状态失败:', error);
      throw error;
    }
  }

  // ===== 高级功能 =====

  /**
   * 快速创建简单的调度任务
   */
  async createQuickScheduleTask(options: {
    name: string;
    description?: string;
    cronExpression: string;
    taskType: string;
    payload?: any;
  }): Promise<ScheduleTaskApi> {
    const request: CreateScheduleTaskRequestApi = {
      name: options.name,
      description: options.description,
      taskType: options.taskType,
      cronExpression: options.cronExpression,
      payload: options.payload,
      priority: 'MEDIUM',
      status: 'ACTIVE',
    };

    return this.createScheduleTask(request);
  }

  /**
   * 切换调度任务状态 (启用/暂停)
   */
  async toggleScheduleTaskStatus(
    taskId: string,
    currentStatus: string,
  ): Promise<ScheduleTaskActionResponse> {
    if (currentStatus === 'ACTIVE') {
      return this.pauseScheduleTask(taskId);
    } else {
      return this.enableScheduleTask(taskId);
    }
  }

  /**
   * 获取调度任务概览数据
   */
  async getScheduleOverview(): Promise<{
    tasks: ScheduleTaskApi[];
    statistics: ScheduleStatisticsResponse;
    recentExecutions: ScheduleExecutionApi[];
    health: any;
  }> {
    try {
      const [tasks, statistics, executions, health] = await Promise.all([
        this.getScheduleTasks({ limit: 10 }),
        this.getScheduleStatistics(),
        this.getScheduleExecutions({ limit: 10 }),
        this.getSchedulerHealth().catch(() => null), // 健康检查可能失败，不影响其他数据
      ]);

      return {
        tasks,
        statistics,
        recentExecutions: executions,
        health,
      };
    } catch (error) {
      console.error('获取调度概览数据失败:', error);
      throw error;
    }
  }

  /**
   * 清理已完成的调度任务
   */
  async cleanupCompletedTasks(): Promise<void> {
    try {
      const completedTasks = await this.getScheduleTasks({ status: 'COMPLETED' });
      const taskIds = completedTasks.map((task) => task.id);

      if (taskIds.length > 0) {
        await this.batchOperateScheduleTasks(taskIds, 'delete');
      }
    } catch (error) {
      console.error('清理已完成任务失败:', error);
      throw error;
    }
  }
}

/**
 * 全局单例服务实例 - 懒加载
 */
let _scheduleService: ScheduleWebApplicationService | null = null;

/**
 * 获取 Schedule Web 应用服务实例
 */
export const getScheduleWebService = (): ScheduleWebApplicationService => {
  if (!_scheduleService) {
    _scheduleService = new ScheduleWebApplicationService();
  }
  return _scheduleService;
};

// 保持向后兼容性
export const scheduleWebApplicationService = getScheduleWebService();
