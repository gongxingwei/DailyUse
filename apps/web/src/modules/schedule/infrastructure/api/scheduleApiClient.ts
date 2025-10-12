import { apiClient } from '@/shared/api/instances';
import { type ScheduleContracts } from '@dailyuse/contracts';

/**
 * Schedule API 客户端
 * 严格参考 Repository 模块实现
 */
export class ScheduleApiClient {
  private readonly baseUrl = '/schedules';

  // ===== Schedule Task CRUD =====

  /**
   * 创建调度任务
   */
  async createTask(
    request: ScheduleContracts.CreateScheduleTaskRequestDTO,
  ): Promise<ScheduleContracts.ScheduleTaskServerDTO> {
    const data = await apiClient.post(`${this.baseUrl}/tasks`, request);
    return data;
  }

  /**
   * 批量创建调度任务
   */
  async createTasksBatch(
    tasks: ScheduleContracts.CreateScheduleTaskRequestDTO[],
  ): Promise<ScheduleContracts.ScheduleTaskServerDTO[]> {
    const data = await apiClient.post(`${this.baseUrl}/tasks/batch`, { tasks });
    return data;
  }

  /**
   * 获取调度任务列表
   */
  async getTasks(): Promise<ScheduleContracts.ScheduleTaskServerDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/tasks`);
    return data;
  }

  /**
   * 获取调度任务详情
   */
  async getTaskById(taskUuid: string): Promise<ScheduleContracts.ScheduleTaskServerDTO> {
    const data = await apiClient.get(`${this.baseUrl}/tasks/${taskUuid}`);
    return data;
  }

  /**
   * 查找待执行任务
   */
  async getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<ScheduleContracts.ScheduleTaskServerDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/tasks/due`, { params });
    return data;
  }

  /**
   * 根据来源模块和实体ID获取任务
   */
  async getTaskBySource(
    sourceModule: ScheduleContracts.SourceModule,
    sourceEntityId: string,
  ): Promise<ScheduleContracts.ScheduleTaskServerDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/tasks`, {
      params: { sourceModule, sourceEntityId },
    });
    return data;
  }

  // ===== Schedule Task Status Management =====

  /**
   * 暂停任务
   */
  async pauseTask(taskUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/${taskUuid}/pause`);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/${taskUuid}/resume`);
  }

  /**
   * 完成任务
   */
  async completeTask(taskUuid: string, reason?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/${taskUuid}/complete`, { reason });
  }

  /**
   * 取消任务
   */
  async cancelTask(taskUuid: string, reason?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/${taskUuid}/cancel`, { reason });
  }

  /**
   * 删除任务
   */
  async deleteTask(taskUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/tasks/${taskUuid}`);
  }

  /**
   * 批量删除任务
   */
  async deleteTasksBatch(taskUuids: string[]): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/batch/delete`, { taskUuids });
  }

  /**
   * 更新任务元数据
   */
  async updateTaskMetadata(
    taskUuid: string,
    metadata: {
      payload?: any;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/tasks/${taskUuid}/metadata`, metadata);
  }

  // ===== Schedule Statistics =====

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<ScheduleContracts.ScheduleStatisticsServerDTO> {
    const data = await apiClient.get(`${this.baseUrl}/statistics`);
    return data;
  }

  /**
   * 获取模块级别统计
   */
  async getModuleStatistics(
    module: ScheduleContracts.SourceModule,
  ): Promise<ScheduleContracts.ModuleStatisticsServerDTO> {
    const data = await apiClient.get(`${this.baseUrl}/statistics/module/${module}`);
    return data;
  }

  /**
   * 获取所有模块统计
   */
  async getAllModuleStatistics(): Promise<
    Record<ScheduleContracts.SourceModule, ScheduleContracts.ModuleStatisticsServerDTO>
  > {
    const data = await apiClient.get(`${this.baseUrl}/statistics/modules`);
    return data;
  }

  /**
   * 重新计算统计信息
   */
  async recalculateStatistics(): Promise<ScheduleContracts.ScheduleStatisticsServerDTO> {
    const data = await apiClient.post(`${this.baseUrl}/statistics/recalculate`);
    return data;
  }

  /**
   * 重置统计信息
   */
  async resetStatistics(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/statistics/reset`);
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/statistics`);
  }
}

// 导出单例实例
export const scheduleApiClient = new ScheduleApiClient();
