import { apiClient } from '@/shared/api/instances';
import { type ScheduleContracts } from '@dailyuse/contracts';

/**
 * Schedule API 客户端
 */
export class ScheduleApiClient {
  private readonly baseUrl = '/schedules';

  // ==================== Schedule Task CRUD ====================

  /**
   * 创建调度任务
   */
  async createScheduleTask(
    request: ScheduleContracts.CreateScheduleTaskRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.post(this.baseUrl, request);
    return data.schedule;
  }

  /**
   * 获取调度任务列表
   */
  async getScheduleTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    taskType?: string;
    enabled?: boolean;
    tags?: string[];
  }): Promise<ScheduleContracts.ScheduleTaskListResponseDto> {
    const data = await apiClient.get(this.baseUrl, { params });

    // 转换后端响应格式 {schedules, total, page, limit, hasMore}
    // 为契约格式 {tasks, total, pagination}
    return {
      tasks: data.schedules || [],
      total: data.total || 0,
      pagination: {
        offset: ((data.page || 1) - 1) * (data.limit || 50),
        limit: data.limit || 50,
        hasMore: data.hasMore || false,
      },
    };
  }

  /**
   * 获取单个调度任务
   */
  async getScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data.schedule;
  }

  /**
   * 更新调度任务
   */
  async updateScheduleTask(
    uuid: string,
    request: ScheduleContracts.UpdateScheduleTaskRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data.schedule;
  }

  /**
   * 删除调度任务
   */
  async deleteScheduleTask(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ==================== Schedule Task Operations ====================

  /**
   * 启用调度任务
   */
  async enableScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/enable`);
    return data.schedule;
  }

  /**
   * 禁用调度任务
   */
  async disableScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/disable`);
    return data.schedule;
  }

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/pause`);
    return data.schedule;
  }

  /**
   * 恢复调度任务
   */
  async resumeScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/resume`);
    return data.schedule;
  }

  /**
   * 执行调度任务
   */
  async executeScheduleTask(uuid: string, force?: boolean): Promise<any> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/execute`, { force });
    return data.executionResult;
  }

  /**
   * 延后提醒
   */
  async snoozeReminder(
    uuid: string,
    request: ScheduleContracts.SnoozeReminderRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/snooze`, request);
    return data.schedule;
  }

  // ==================== Additional Features ====================

  /**
   * 获取即将到来的任务
   */
  async getUpcomingTasks(params?: {
    withinMinutes?: number;
    limit?: number;
  }): Promise<ScheduleContracts.UpcomingTasksResponseDto> {
    const data = await apiClient.get(`${this.baseUrl}/upcoming`, { params });
    return data;
  }

  /**
   * 快速创建提醒
   */
  async createQuickReminder(
    request: ScheduleContracts.QuickReminderRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const data = await apiClient.post(`${this.baseUrl}/quick-reminder`, request);
    return data.schedule;
  }

  /**
   * 批量操作调度任务
   */
  async batchOperateScheduleTasks(
    request: ScheduleContracts.BatchScheduleTaskOperationRequestDto,
  ): Promise<ScheduleContracts.BatchScheduleTaskOperationResponseDto> {
    const data = await apiClient.post(`${this.baseUrl}/batch`, request);
    return data;
  }

  /**
   * 获取执行历史
   */
  async getExecutionHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ history: any[]; total: number }> {
    const data = await apiClient.get(`${this.baseUrl}/execution-history`, { params });
    return data;
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<ScheduleContracts.IScheduleTaskStatistics> {
    const data = await apiClient.get(`${this.baseUrl}/statistics`);
    return data;
  }
}

// 导出单例实例
export const scheduleApiClient = new ScheduleApiClient();
