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
   * 移动提醒模板到指定分组
   */
  async moveTemplateToGroup(templateUuid: string, targetGroupUuid: string): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${templateUuid}/move`, {
      targetGroupUuid,
    });
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
    const response = await apiClient.get(this.baseUrl, { params });
    console.log('📋 getReminderTemplates 响应:', response);

    // 处理新的响应格式：{ reminders: [...], total, page, limit, hasMore }
    if (response && typeof response === 'object' && 'reminders' in response) {
      return Array.isArray(response.reminders) ? response.reminders : [];
    }
    // 兼容旧格式直接返回数组的情况
    return Array.isArray(response) ? response : [];
  }

  /**
   * 获取活跃的提醒模板
   */
  async getActiveTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderContracts.IReminderTemplate[]> {
    const response = await apiClient.get(`${this.baseUrl}/active`, { params });
    console.log('📋 getActiveTemplates 响应:', response);

    // 处理新的响应格式：{ reminders: [...], total, page, limit, hasMore }
    if (response && typeof response === 'object' && 'reminders' in response) {
      return Array.isArray(response.reminders) ? response.reminders : [];
    }
    // 兼容旧格式直接返回数组的情况
    return Array.isArray(response) ? response : [];
  }

  // ===== 调度状态管理 =====

  /**
   * 获取模板的调度状态
   */
  async getScheduleStatus(templateUuid: string): Promise<{
    hasSchedule: boolean;
    enabled: boolean;
    nextRunAt: Date | null;
    lastRunAt: Date | null;
    executionCount: number;
    recentExecutions: any[];
    cronExpression: string | null;
    cronDescription: string | null;
  }> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/schedule-status`);
    return data;
  }

  // ===== 聚合根统计信息 =====

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
   * 获取即将到来的提醒任务
   * 使用 Schedule 模块的 upcoming API
   */
  async getActiveReminders(params?: {
    limit?: number;
    priority?: ReminderContracts.ReminderPriority;
  }): Promise<ReminderContracts.ReminderInstanceListResponse> {
    // ✅ 使用新的 Schedule 模块 API
    const withinMinutes = 60 * 24; // 默认获取未来 24 小时的任务
    const data = await apiClient.get('/schedules/upcoming', {
      params: {
        withinMinutes,
        limit: params?.limit || 50,
      },
    });
    console.log('📋 getActiveReminders (Schedule API) 响应:', data);

    // 转换 Schedule 响应格式为 Reminder 格式
    if (!data || !Array.isArray(data.tasks)) {
      return { reminders: [], total: 0, page: 1, limit: params?.limit || 50, hasMore: false };
    }

    // 过滤出提醒类型的任务
    const reminderTasks = data.tasks.filter(
      (task: any) => task.type === 'reminder' || task.sourceType === 'reminder',
    );

    // 转换为 Reminder 格式
    const reminders = reminderTasks.map((task: any) => ({
      uuid: task.uuid,
      templateUuid: task.sourceId,
      title: task.name || task.title,
      message: task.description || task.message,
      scheduledTime: task.nextRunAt || task.scheduledTime,
      priority: task.priority || 'normal',
      status: task.status || 'pending',
      enabled: task.enabled,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return {
      reminders,
      total: reminderTasks.length,
      page: 1,
      limit: params?.limit || 50,
      hasMore: false,
    };
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
  async getReminderTemplateGroups(): Promise<ReminderContracts.ReminderTemplateGroupListResponse> {
    const data = await apiClient.get('/reminders/groups');
    console.log('📋 getReminderTemplateGroups 响应:', data);

    // 确保返回的数据结构完整
    if (!data || typeof data !== 'object') {
      return { groups: [], total: 0, page: 1, limit: 50, hasMore: false };
    }

    // 如果 groups 字段不存在或不是数组，返回空数据
    if (!Array.isArray(data.groups)) {
      return {
        groups: [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 50,
        hasMore: data.hasMore || false,
      };
    }

    return data;
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderTemplateGroupEnabled(groupUuid: string, enabled: boolean): Promise<void> {
    await apiClient.patch(`/reminders/groups/${groupUuid}/toggle`, { enabled });
  }

  // ===== 启用状态控制操作 =====

  /**
   * 切换分组启用模式
   */
  async toggleGroupEnableMode(
    groupUuid: string,
    request: ReminderContracts.ToggleGroupEnableModeRequest,
  ): Promise<ReminderContracts.EnableStatusChangeResponse> {
    const data = await apiClient.put(`/reminders/groups/${groupUuid}/enable-mode`, request);
    return data;
  }

  /**
   * 切换分组启用状态
   */
  async toggleGroupEnabled(
    groupUuid: string,
    request: ReminderContracts.ToggleGroupEnabledRequest,
  ): Promise<ReminderContracts.EnableStatusChangeResponse> {
    const data = await apiClient.put(`/reminders/groups/${groupUuid}/enabled`, request);
    return data;
  }

  /**
   * 切换模板自我启用状态
   */
  async toggleTemplateSelfEnabled(
    templateUuid: string,
    request: ReminderContracts.ToggleTemplateSelfEnabledRequest,
  ): Promise<ReminderContracts.EnableStatusChangeResponse> {
    const data = await apiClient.put(`${this.baseUrl}/${templateUuid}/self-enabled`, request);
    return data;
  }

  /**
   * 批量更新模板启用状态
   */
  async batchUpdateTemplatesEnabled(
    request: ReminderContracts.BatchUpdateTemplatesEnabledRequest,
  ): Promise<ReminderContracts.EnableStatusChangeResponse> {
    const data = await apiClient.put(`${this.baseUrl}/batch-enabled`, request);
    return data;
  }

  /**
   * 获取即将到来的提醒实例
   */
  async getUpcomingReminders(
    request: ReminderContracts.GetUpcomingRemindersRequest,
  ): Promise<ReminderContracts.UpcomingRemindersResponse> {
    const data = await apiClient.get('/reminders/upcoming', { params: request });
    return data;
  }
}

// 导出单例实例
export const reminderApiClient = new ReminderApiClient();
