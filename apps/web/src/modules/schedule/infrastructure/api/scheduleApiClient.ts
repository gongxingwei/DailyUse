/**
 * Schedule API Client
 * @description 调度模块的API客户端，负责与后端API通信
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { apiClient } from '@/shared/api/instances';
import type {
  CreateScheduleTaskRequestApi,
  UpdateScheduleTaskRequestApi,
  ScheduleTaskApi,
  ScheduleExecutionApi,
  ScheduleTaskListResponseApi,
  ScheduleExecutionListResponse,
  ScheduleStatisticsResponse,
  ScheduleTaskActionResponse,
  SSEConnectionInfo,
} from '@dailyuse/contracts/modules/schedule';

/**
 * Schedule API 客户端
 */
export class ScheduleApiClient {
  private readonly baseUrl = '/schedules';

  // ===== Schedule Task CRUD =====

  /**
   * 创建调度任务
   */
  async createScheduleTask(request: CreateScheduleTaskRequestApi): Promise<ScheduleTaskApi> {
    const response = await apiClient.post<{ data: ScheduleTaskApi }>(this.baseUrl, request);
    return response.data;
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
    const response = await apiClient.get<{ data: ScheduleTaskListResponseApi }>(this.baseUrl, {
      params,
    });
    return response.data.tasks || [];
  }

  /**
   * 获取单个调度任务
   */
  async getScheduleTask(taskId: string): Promise<ScheduleTaskApi> {
    const response = await apiClient.get<{ data: ScheduleTaskApi }>(`${this.baseUrl}/${taskId}`);
    return response.data;
  }

  /**
   * 更新调度任务
   */
  async updateScheduleTask(
    taskId: string,
    request: UpdateScheduleTaskRequestApi,
  ): Promise<ScheduleTaskApi> {
    const response = await apiClient.put<{ data: ScheduleTaskApi }>(
      `${this.baseUrl}/${taskId}`,
      request,
    );
    return response.data;
  }

  /**
   * 删除调度任务
   */
  async deleteScheduleTask(taskId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${taskId}`);
  }

  // ===== Schedule Task Operations =====

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(taskId: string): Promise<ScheduleTaskActionResponse> {
    const response = await apiClient.post<{ data: ScheduleTaskActionResponse }>(
      `${this.baseUrl}/${taskId}/pause`,
    );
    return response.data;
  }

  /**
   * 启用调度任务
   */
  async enableScheduleTask(taskId: string): Promise<ScheduleTaskActionResponse> {
    const response = await apiClient.post<{ data: ScheduleTaskActionResponse }>(
      `${this.baseUrl}/${taskId}/enable`,
    );
    return response.data;
  }

  /**
   * 手动执行调度任务
   */
  async executeScheduleTask(taskId: string): Promise<ScheduleTaskActionResponse> {
    const response = await apiClient.post<{ data: ScheduleTaskActionResponse }>(
      `${this.baseUrl}/${taskId}/execute`,
    );
    return response.data;
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
    const response = await apiClient.get<{ data: ScheduleExecutionListResponse }>(
      `${this.baseUrl}/executions`,
      { params },
    );
    return response.data.executions || [];
  }

  /**
   * 获取单个执行记录
   */
  async getScheduleExecution(executionId: string): Promise<ScheduleExecutionApi> {
    const response = await apiClient.get<{ data: ScheduleExecutionApi }>(
      `${this.baseUrl}/executions/${executionId}`,
    );
    return response.data;
  }

  // ===== Schedule Statistics =====

  /**
   * 获取调度统计信息
   */
  async getScheduleStatistics(): Promise<ScheduleStatisticsResponse> {
    const response = await apiClient.get<{ data: ScheduleStatisticsResponse }>(
      `${this.baseUrl}/statistics`,
    );
    return response.data;
  }

  // ===== SSE Connection =====

  /**
   * 获取SSE连接信息
   */
  async getSSEConnection(): Promise<SSEConnectionInfo> {
    const response = await apiClient.get<{ data: SSEConnectionInfo }>(`${this.baseUrl}/sse`);
    return response.data;
  }

  // ===== Validation & Preview =====

  /**
   * 验证Cron表达式
   */
  async validateCronExpression(
    expression: string,
  ): Promise<{ valid: boolean; nextRuns?: string[]; error?: string }> {
    const response = await apiClient.post<{
      data: { valid: boolean; nextRuns?: string[]; error?: string };
    }>(`${this.baseUrl}/validate-cron`, { expression });
    return response.data;
  }

  /**
   * 预览调度任务执行时间
   */
  async previewScheduleTask(request: Partial<CreateScheduleTaskRequestApi>): Promise<{
    nextExecutions: string[];
    scheduleDescription: string;
  }> {
    const response = await apiClient.post<{
      data: { nextExecutions: string[]; scheduleDescription: string };
    }>(`${this.baseUrl}/preview`, request);
    return response.data;
  }

  // ===== Batch Operations =====

  /**
   * 批量操作调度任务
   */
  async batchOperateScheduleTasks(
    taskIds: string[],
    operation: 'pause' | 'enable' | 'delete',
  ): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<{
      data: { success: string[]; failed: string[] };
    }>(`${this.baseUrl}/batch`, {
      taskIds,
      operation,
    });
    return response.data;
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
    const response = await apiClient.get<{
      data: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        runningTasks: number;
        queuedTasks: number;
        lastHeartbeat: string;
      };
    }>(`${this.baseUrl}/health`);
    return response.data;
  }
}

// 导出单例实例
export const scheduleApiClient = new ScheduleApiClient();
