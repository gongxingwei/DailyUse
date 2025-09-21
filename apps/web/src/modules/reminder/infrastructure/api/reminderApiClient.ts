import type { ReminderContracts } from '@dailyuse/contracts';
import { apiClient } from '@/shared/api/instances';

/**
 * Reminder API 客户端
 * 基于聚合根控制模式的 API 接口
 */
class ReminderApiClient {
  private readonly baseUrl = '/reminders/templates';

  // ===== 模板聚合根操作 =====

  /**
   * 创建提醒模板聚合根
   */
  async createReminderTemplate(
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 更新提醒模板聚合根
   */
  async updateReminderTemplate(
    templateUuid: string,
    request: Partial<ReminderContracts.CreateReminderTemplateRequest>,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    const data = await apiClient.put(`${this.baseUrl}/${templateUuid}`, request);
    return data;
  }

  /**
   * 获取提醒模板聚合根详情
   */
  async getReminderTemplate(
    templateUuid: string,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}`);
    return data;
  }

  /**
   * 删除提醒模板聚合根
   */
  async deleteReminderTemplate(templateUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${templateUuid}`);
  }

  /**
   * 获取提醒模板列表
   */
  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
    groupUuid?: string;
    enabled?: boolean;
    priority?: ReminderContracts.ReminderPriority;
  }): Promise<ReminderContracts.IReminderTemplate[]> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  // ===== 实例管理 (通过聚合根) =====

  /**
   * 通过聚合根创建提醒实例
   */
  async createReminderInstance(
    templateUuid: string,
    request: ReminderContracts.CreateReminderInstanceRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${templateUuid}/instances`, request);
    return data;
  }

  /**
   * 通过聚合根获取实例列表
   */
  async getReminderInstances(
    templateUuid: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<ReminderContracts.ReminderListResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/instances`, { params });
    return data;
  }

  /**
   * 用户响应提醒实例 (通过聚合根)
   */
  async respondToReminder(
    templateUuid: string,
    instanceUuid: string,
    response: ReminderContracts.SnoozeReminderRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse> {
    const data = await apiClient.put(
      `${this.baseUrl}/${templateUuid}/instances/${instanceUuid}/respond`,
      response,
    );
    return data;
  }

  /**
   * 更新提醒实例 (通过聚合根)
   */
  async updateReminderInstance(
    templateUuid: string,
    instanceUuid: string,
    request: Partial<ReminderContracts.CreateReminderInstanceRequest>,
  ): Promise<ReminderContracts.ReminderInstanceResponse> {
    const data = await apiClient.put(
      `${this.baseUrl}/${templateUuid}/instances/${instanceUuid}`,
      request,
    );
    return data;
  }

  /**
   * 删除提醒实例 (通过聚合根)
   */
  async deleteReminderInstance(templateUuid: string, instanceUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${templateUuid}/instances/${instanceUuid}`);
  }

  // ===== 聚合根批量操作 =====

  /**
   * 批量处理提醒实例
   */
  async batchProcessInstances(
    templateUuid: string,
    request: { instanceUuids: string[]; action: 'snooze' | 'dismiss' | 'complete' },
  ): Promise<{ success: boolean; processedCount: number }> {
    const data = await apiClient.post(
      `${this.baseUrl}/${templateUuid}/instances/batch-process`,
      request,
    );
    return data;
  }

  /**
   * 聚合根统计信息
   */
  async getAggregateStats(templateUuid: string): Promise<ReminderContracts.ReminderStatsResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/stats`);
    return data;
  }

  /**
   * 聚合根健康检查
   */
  async checkAggregateHealth(
    templateUuid: string,
  ): Promise<{ isHealthy: boolean; issues: string[] }> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/health`);
    return data;
  }

  // ===== 全局操作 =====

  /**
   * 获取当前活跃的提醒实例
   */
  async getActiveReminders(params?: {
    limit?: number;
    priority?: ReminderContracts.ReminderPriority;
  }): Promise<ReminderContracts.ReminderListResponse> {
    const data = await apiClient.get(`${this.baseUrl}/active`, { params });
    return data;
  }

  /**
   * 获取全局提醒统计
   */
  async getGlobalStats(): Promise<ReminderContracts.ReminderStatsResponse> {
    const data = await apiClient.get(`${this.baseUrl}/stats`);
    return data;
  }

  // ===== 分组操作 =====

  /**
   * 创建提醒模板分组
   */
  async createReminderTemplateGroup(
    request: ReminderContracts.CreateReminderTemplateGroupRequest,
  ): Promise<ReminderContracts.ReminderTemplateGroupResponse> {
    const data = await apiClient.post('/reminders/groups', request);
    return data;
  }

  /**
   * 更新提醒模板分组
   */
  async updateReminderTemplateGroup(
    groupUuid: string,
    request: ReminderContracts.UpdateReminderTemplateGroupRequest,
  ): Promise<ReminderContracts.ReminderTemplateGroupResponse> {
    const data = await apiClient.put(`/reminders/groups/${groupUuid}`, request);
    return data;
  }

  /**
   * 获取提醒模板分组详情
   */
  async getReminderTemplateGroup(
    groupUuid: string,
  ): Promise<ReminderContracts.ReminderTemplateGroupResponse> {
    const data = await apiClient.get(`/reminders/groups/${groupUuid}`);
    return data;
  }

  /**
   * 删除提醒模板分组
   */
  async deleteReminderTemplateGroup(groupUuid: string): Promise<void> {
    await apiClient.delete(`/reminders/groups/${groupUuid}`);
  }

  /**
   * 获取提醒模板分组列表
   */
  async getReminderTemplateGroups(): Promise<ReminderContracts.ReminderTemplateGroupResponse[]> {
    const data = await apiClient.get('/reminders/groups');
    return data;
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderTemplateGroupEnabled(groupUuid: string, enabled: boolean): Promise<void> {
    await apiClient.patch(`/reminders/groups/${groupUuid}/toggle`, { enabled });
  }
}

// 导出单例实例
export const reminderApiClient = new ReminderApiClient();
