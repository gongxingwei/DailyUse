import { apiClient } from '@/shared/api/instances';
import { type TaskContracts } from '@dailyuse/contracts';

/**
 * Task Template API 客户端
 * 负责任务模板相关的API调用
 */
export class TaskTemplateApiClient {
  private readonly baseUrl = '/api/v1/tasks/templates';

  /**
   * 创建任务模板
   */
  async createTemplate(
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取任务模板列表
   */
  async getTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<TaskContracts.TaskTemplateListResponse> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取任务模板详情
   */
  async getTemplateById(uuid: string): Promise<TaskContracts.TaskTemplateDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 更新任务模板
   */
  async updateTemplate(
    uuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除任务模板
   */
  async deleteTemplate(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  /**
   * 激活任务模板
   */
  async activateTemplate(uuid: string): Promise<TaskContracts.TaskTemplateDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/activate`);
    return data;
  }

  /**
   * 暂停任务模板
   */
  async pauseTemplate(uuid: string): Promise<TaskContracts.TaskTemplateDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/pause`);
    return data;
  }

  /**
   * 复制任务模板
   */
  async duplicateTemplate(uuid: string, newTitle?: string): Promise<TaskContracts.TaskTemplateDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/duplicate`, {
      title: newTitle,
    });
    return data;
  }

  /**
   * 批量删除任务模板
   */
  async deleteTemplatesBatch(uuids: string[]): Promise<any> {
    const data = await apiClient.post(`${this.baseUrl}/batch/delete`, {
      uuids,
    });
    return data;
  }

  /**
   * 搜索任务模板
   */
  async searchTemplates(params: {
    query: string;
    page?: number;
    limit?: number;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<TaskContracts.TaskTemplateListResponse> {
    const data = await apiClient.get(`${this.baseUrl}/search`, {
      params,
    });
    return data;
  }
}

/**
 * Task Instance API 客户端
 * 负责任务实例相关的API调用
 */
export class TaskInstanceApiClient {
  private readonly baseUrl = '/api/v1/tasks/instances';

  /**
   * 创建任务实例
   */
  async createInstance(
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取任务实例列表
   */
  async getInstances(params?: {
    page?: number;
    limit?: number;
    status?: string;
    templateUuid?: string;
    goalUuid?: string;
    startDate?: string;
    endDate?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<TaskContracts.TaskInstanceListResponse> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取任务实例详情
   */
  async getInstanceById(uuid: string): Promise<TaskContracts.TaskInstanceDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 更新任务实例
   */
  async updateInstance(
    uuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除任务实例
   */
  async deleteInstance(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  /**
   * 完成任务实例
   */
  async completeInstance(uuid: string, result?: string): Promise<TaskContracts.TaskInstanceDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/complete`, {
      result,
    });
    return data;
  }

  /**
   * 撤销任务完成
   */
  async undoCompleteInstance(uuid: string): Promise<TaskContracts.TaskInstanceDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/undo-complete`);
    return data;
  }

  /**
   * 重新安排任务实例
   */
  async rescheduleInstance(
    uuid: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/reschedule`, request);
    return data;
  }

  /**
   * 取消任务实例
   */
  async cancelInstance(uuid: string, reason?: string): Promise<TaskContracts.TaskInstanceDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/cancel`, {
      reason,
    });
    return data;
  }

  /**
   * 批量操作任务实例
   */
  async batchOperation(
    operation: 'complete' | 'cancel' | 'delete',
    uuids: string[],
    params?: any,
  ): Promise<any> {
    const data = await apiClient.post(`${this.baseUrl}/batch/${operation}`, {
      uuids,
      ...params,
    });
    return data;
  }

  /**
   * 搜索任务实例
   */
  async searchInstances(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<TaskContracts.TaskInstanceListResponse> {
    const data = await apiClient.get(`${this.baseUrl}/search`, {
      params,
    });
    return data;
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(): Promise<TaskContracts.TaskInstanceDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/today`);
    return data;
  }

  /**
   * 获取即将到期的任务
   */
  async getUpcomingTasks(days = 7): Promise<TaskContracts.TaskInstanceDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/upcoming`, {
      params: { days },
    });
    return data;
  }

  /**
   * 获取逾期任务
   */
  async getOverdueTasks(): Promise<TaskContracts.TaskInstanceDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/overdue`);
    return data;
  }
}

/**
 * Task Meta Template API 客户端
 * 负责任务元模板相关的API调用
 */
export class TaskMetaTemplateApiClient {
  private readonly baseUrl = '/api/v1/tasks/meta-templates';

  /**
   * 创建任务元模板
   */
  async createMetaTemplate(
    request: TaskContracts.CreateTaskMetaTemplateRequest,
  ): Promise<TaskContracts.TaskMetaTemplateDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取任务元模板列表
   */
  async getMetaTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取任务元模板详情
   */
  async getMetaTemplateById(uuid: string): Promise<TaskContracts.TaskMetaTemplateDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 更新任务元模板
   */
  async updateMetaTemplate(
    uuid: string,
    request: TaskContracts.UpdateTaskMetaTemplateRequest,
  ): Promise<TaskContracts.TaskMetaTemplateDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除任务元模板
   */
  async deleteMetaTemplate(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }
}

/**
 * Task Statistics API 客户端
 * 负责任务统计相关的API调用
 */
export class TaskStatisticsApiClient {
  private readonly baseUrl = '/api/v1/tasks/statistics';

  /**
   * 获取任务统计概览
   */
  async getOverview(params?: {
    startDate?: string;
    endDate?: string;
    goalUuid?: string;
  }): Promise<any> {
    const data = await apiClient.get(`${this.baseUrl}/overview`, {
      params,
    });
    return data;
  }

  /**
   * 获取完成率趋势
   */
  async getCompletionTrend(params?: {
    startDate?: string;
    endDate?: string;
    interval?: 'day' | 'week' | 'month';
  }): Promise<any[]> {
    const data = await apiClient.get(`${this.baseUrl}/completion-trend`, {
      params,
    });
    return data;
  }

  /**
   * 获取任务分布统计
   */
  async getDistribution(params?: {
    groupBy?: 'importance' | 'urgency' | 'status' | 'tag';
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const data = await apiClient.get(`${this.baseUrl}/distribution`, {
      params,
    });
    return data;
  }
}

// 创建单例实例
export const taskTemplateApiClient = new TaskTemplateApiClient();
export const taskInstanceApiClient = new TaskInstanceApiClient();
export const taskMetaTemplateApiClient = new TaskMetaTemplateApiClient();
export const taskStatisticsApiClient = new TaskStatisticsApiClient();

// 导出所有API客户端
export const taskApiClients = {
  template: taskTemplateApiClient,
  instance: taskInstanceApiClient,
  metaTemplate: taskMetaTemplateApiClient,
  statistics: taskStatisticsApiClient,
};
