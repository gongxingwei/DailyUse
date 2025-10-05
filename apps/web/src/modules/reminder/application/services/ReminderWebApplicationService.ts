import { ReminderContracts } from '@dailyuse/contracts';

import { reminderApiClient } from '../../infrastructure/api/reminderApiClient';
import { getReminderStore } from '../../presentation/stores/reminderStore';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';
import { ReminderTemplate, ReminderInstance, ReminderTemplateGroup } from '@dailyuse/domain-client';

/**
 * Reminder Web 应用服务
 * 负责协调 Web 端的提醒相关操作，整合 API 调用和本地状态管理
 * 集成全局 Snackbar 提示系统
 */
export class ReminderWebApplicationService {
  /**
   * 直接获取 Reminder Store
   * ApplicationService 直接操作 store，不使用 composables
   */
  private get reminderStore() {
    return getReminderStore();
  }

  /**
   * 懒加载获取 Snackbar
   * 避免在 Pinia 初始化之前调用
   */
  private get snackbar() {
    return useSnackbar();
  }

  // ===== 提醒模板 CRUD 操作 =====

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse['data']> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.createReminderTemplate(request);

      // 创建客户端实体并同步到 store
      const template = ReminderTemplate.fromApiResponse(templateData);
      this.reminderStore.addOrUpdateReminderTemplate(template);

      this.snackbar.showSuccess('提醒模板创建成功');
      return templateData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
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
    forceRefresh?: boolean;
  }): Promise<void> {
    try {
      // 缓存优先策略：如果已有数据且不强制刷新，直接返回
      if (!params?.forceRefresh && this.reminderStore.reminderTemplates.length > 0) {
        return;
      }

      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templatesResponse = await reminderApiClient.getReminderTemplates(params);
      console.log(
        '📦 应用服务收到的模板响应:',
        templatesResponse,
        'type:',
        typeof templatesResponse,
        'isArray:',
        Array.isArray(templatesResponse),
      );

      // templatesResponse 已经是模板数组，直接转换为客户端实体
      const templates = (Array.isArray(templatesResponse) ? templatesResponse : []).map(
        (data: any) => ReminderTemplate.fromApiResponse(data),
      );
      this.reminderStore.setReminderTemplates(templates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取活跃的提醒模板
   */
  async getActiveTemplates(params?: {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
  }): Promise<void> {
    try {
      // 缓存优先策略：如果已有数据且不强制刷新，直接返回
      if (!params?.forceRefresh && this.reminderStore.reminderTemplates.length > 0) {
        return;
      }

      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templatesResponse = await reminderApiClient.getActiveTemplates(params);

      // templatesResponse 已经是模板数组，直接转换为客户端实体
      const templates = (Array.isArray(templatesResponse) ? templatesResponse : []).map(
        (data: any) => ReminderTemplate.fromApiResponse(data),
      );
      this.reminderStore.setReminderTemplates(templates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取活跃提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取提醒模板详情
   */
  async getReminderTemplate(uuid: string): Promise<ReminderTemplate | null> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.getReminderTemplate(uuid);

      // 转换为客户端实体并更新 store
      const template = ReminderTemplate.fromApiResponse(templateData);
      this.reminderStore.addOrUpdateReminderTemplate(template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒模板详情失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 更新提醒模板
   */
  async updateReminderTemplate(
    uuid: string,
    request: Partial<ReminderContracts.CreateReminderTemplateRequest>,
  ): Promise<ReminderTemplate> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.updateReminderTemplate(uuid, request);

      // 转换为客户端实体并更新 store
      const template = ReminderTemplate.fromApiResponse(templateData);
      this.reminderStore.addOrUpdateReminderTemplate(template);

      this.snackbar.showSuccess('提醒模板更新成功');
      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(uuid: string): Promise<void> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      await reminderApiClient.deleteReminderTemplate(uuid);

      // 从 store 中移除
      this.reminderStore.removeReminderTemplate(uuid);
      // 清除相关实例
      this.reminderStore.refreshTemplateInstances(uuid);

      this.snackbar.showSuccess('提醒模板删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 移动提醒模板到指定分组
   */
  async moveTemplateToGroup(templateUuid: string, targetGroupUuid: string): Promise<void> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      await reminderApiClient.moveTemplateToGroup(templateUuid, targetGroupUuid);

      // 刷新模板数据
      await this.getReminderTemplates();

      this.snackbar.showSuccess('模板移动成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '移动模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  // ===== 提醒实例管理 =====

  /**
   * 创建提醒实例
   */
  async createReminderInstance(
    templateUuid: string,
    request: ReminderContracts.CreateReminderInstanceRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse['data']> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const instanceData = await reminderApiClient.createReminderInstance(templateUuid, request);

      // 转换为客户端实体并更新 store
      const instance = ReminderInstance.fromResponse(instanceData);
      this.reminderStore.addOrUpdateReminderInstance(instance);

      this.snackbar.showSuccess('提醒实例创建成功');
      return instanceData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建提醒实例失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取提醒实例列表 (返回域实体对象)
   */
  async getReminderInstances(
    templateUuid: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
      forceRefresh?: boolean;
    },
  ): Promise<{
    reminders: ReminderInstance[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      // 缓存优先策略
      if (!params?.forceRefresh) {
        const cachedInstances = this.reminderStore.getReminderInstancesByTemplate(templateUuid);
        if (cachedInstances.length > 0) {
          return {
            reminders: cachedInstances,
            total: cachedInstances.length,
            page: 1,
            limit: cachedInstances.length,
            hasMore: false,
          };
        }
      }

      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const instancesData = await reminderApiClient.getReminderInstances(templateUuid, params);

      // 转换为客户端实体并更新 store
      const instances = (
        Array.isArray(instancesData?.reminders) ? instancesData.reminders : []
      ).map((data: any) => ReminderInstance.fromResponse(data));
      this.reminderStore.addOrUpdateReminderInstances(instances);

      return {
        reminders: instances,
        total: instancesData.total,
        page: instancesData.page,
        limit: instancesData.limit,
        hasMore: instancesData.hasMore,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒实例失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 响应提醒实例
   */
  async respondToReminder(
    templateUuid: string,
    instanceUuid: string,
    response: ReminderContracts.SnoozeReminderRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse['data']> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const instanceData = await reminderApiClient.respondToReminder(
        templateUuid,
        instanceUuid,
        response,
      );

      // 转换为客户端实体并更新 store
      const instance = ReminderInstance.fromResponse(instanceData);
      this.reminderStore.addOrUpdateReminderInstance(instance);

      this.snackbar.showSuccess('提醒响应成功');
      return instanceData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提醒响应失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 批量处理提醒实例
   */
  async batchProcessInstances(
    templateUuid: string,
    request: { instanceUuids: string[]; action: 'snooze' | 'dismiss' | 'complete' },
  ): Promise<{ success: boolean; processedCount: number }> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const result = await reminderApiClient.batchProcessInstances(templateUuid, request);

      // 刷新实例数据
      this.reminderStore.refreshTemplateInstances(templateUuid);
      await this.getReminderInstances(templateUuid, { forceRefresh: true });

      this.snackbar.showSuccess(`批量处理成功，处理了 ${result.processedCount} 个实例`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量处理失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  // ===== 全局操作 =====

  /**
   * 获取活跃的提醒实例
   */
  async getActiveReminders(params?: {
    limit?: number;
    priority?: ReminderContracts.ReminderPriority;
  }): Promise<ReminderContracts.ReminderInstanceListResponse['data']> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const remindersData = await reminderApiClient.getActiveReminders(params);
      console.log('📦 应用服务收到的活跃提醒响应:', remindersData);
      // 转换为客户端实体并更新 store
      const instances = (
        Array.isArray(remindersData?.reminders) ? remindersData.reminders : []
      ).map((data) => ReminderInstance.fromResponse(data));
      this.reminderStore.addOrUpdateReminderInstances(instances);

      return remindersData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取活跃提醒失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取全局统计信息
   */
  async getGlobalStats(): Promise<ReminderContracts.ReminderStatsResponse['data']> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const stats = await reminderApiClient.getGlobalStats();
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取统计信息失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  // ===== 聚合根操作 =====

  /**
   * 获取聚合根统计信息
   */
  async getAggregateStats(
    templateUuid: string,
  ): Promise<ReminderContracts.ReminderStatsResponse['data']> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const stats = await reminderApiClient.getAggregateStats(templateUuid);
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取聚合根统计失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 检查聚合根健康状态
   */
  async checkAggregateHealth(
    templateUuid: string,
  ): Promise<{ isHealthy: boolean; issues: string[] }> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const health = await reminderApiClient.checkAggregateHealth(templateUuid);
      return health;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检查聚合根健康失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  // ===== 启用状态控制方法 =====

  /**
   * 切换分组启用模式
   */
  async toggleGroupEnableMode(
    groupUuid: string,
    enableMode: ReminderContracts.ReminderTemplateEnableMode,
    enabled?: boolean,
  ): Promise<ReminderContracts.EnableStatusChangeResponse> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const response = await reminderApiClient.toggleGroupEnableMode(groupUuid, {
        enableMode,
        enabled,
      });

      // 刷新相关数据
      await this.getReminderTemplateGroups({ forceRefresh: true });
      await this.getReminderTemplates({ forceRefresh: true });

      this.snackbar.showSuccess(
        `分组启用模式已切换为${enableMode === 'group' ? '按组控制' : '单独控制'}，影响了${response.affectedTemplates}个模板`,
      );

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换分组启用模式失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 切换分组启用状态
   */
  async toggleGroupEnabled(
    groupUuid: string,
    enabled: boolean,
  ): Promise<ReminderContracts.EnableStatusChangeResponse> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const response = await reminderApiClient.toggleGroupEnabled(groupUuid, { enabled });

      // 刷新相关数据
      await this.getReminderTemplateGroups({ forceRefresh: true });
      await this.getReminderTemplates({ forceRefresh: true });

      this.snackbar.showSuccess(
        `分组${enabled ? '启用' : '禁用'}成功，影响了${response.affectedTemplates}个模板`,
      );

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换分组启用状态失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 切换模板自我启用状态
   */
  async toggleTemplateSelfEnabled(
    templateUuid: string,
    selfEnabled: boolean,
  ): Promise<ReminderContracts.EnableStatusChangeResponse> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const response = await reminderApiClient.toggleTemplateSelfEnabled(templateUuid, {
        selfEnabled,
      });

      // 刷新相关数据
      await this.getReminderTemplates({ forceRefresh: true });

      this.snackbar.showSuccess(
        `模板自我启用状态${selfEnabled ? '启用' : '禁用'}成功，${response.addedInstances > 0 ? `新增${response.addedInstances}个实例` : ''}${response.removedInstances > 0 ? `移除${response.removedInstances}个实例` : ''}`,
      );

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换模板自我启用状态失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 批量更新模板启用状态
   */
  async batchUpdateTemplatesEnabled(
    templateUuids: string[],
    enabled?: boolean,
    selfEnabled?: boolean,
  ): Promise<ReminderContracts.EnableStatusChangeResponse> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const response = await reminderApiClient.batchUpdateTemplatesEnabled({
        templateUuids,
        enabled,
        selfEnabled,
      });

      // 刷新相关数据
      await this.getReminderTemplates({ forceRefresh: true });

      this.snackbar.showSuccess(`批量更新成功，影响了${response.affectedTemplates}个模板`);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量更新模板启用状态失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取即将到来的提醒实例
   */
  async getUpcomingReminders(params?: {
    limit?: number;
    days?: number;
    priorities?: ReminderContracts.ReminderPriority[];
    categories?: string[];
    tags?: string[];
  }): Promise<ReminderContracts.UpcomingRemindersResponse['data']> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const response = await reminderApiClient.getUpcomingReminders(params || {});
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取即将到来的提醒失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  // ===== 缓存管理 =====

  /**
   * 刷新所有数据
   */
  async refreshAll(): Promise<void> {
    try {
      this.reminderStore.clearAll();
      await this.getReminderTemplates({ forceRefresh: true });
      await this.getReminderTemplateGroups({ forceRefresh: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刷新数据失败';
      this.snackbar.showError(errorMessage);
      throw error;
    }
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.reminderStore.clearAll();
  }

  // ===== 分组管理操作 =====

  /**
   * 创建提醒模板分组
   */
  async createReminderTemplateGroup(
    request: ReminderContracts.CreateReminderTemplateGroupRequest,
  ): Promise<ReminderTemplateGroup> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const groupData = await reminderApiClient.createReminderTemplateGroup(request);

      // 根据axios响应封装系统，groupData 已经是解包后的响应数据
      // 使用 fromResponse 方法处理 API 响应数据
      const group = ReminderTemplateGroup.fromResponse(groupData);
      this.reminderStore.addOrUpdateReminderTemplateGroup(group);

      this.snackbar.showSuccess('提醒分组创建成功');
      return group;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建提醒分组失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取提醒模板分组列表
   */
  async getReminderTemplateGroups(params?: {
    forceRefresh?: boolean;
  }): Promise<ReminderTemplateGroup[]> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const response = await reminderApiClient.getReminderTemplateGroups();

      // 从分页响应中提取分组数组
      const groupsArray = response?.groups || [];

      // 转换为客户端实体并更新 store
      const groups = (Array.isArray(groupsArray) ? groupsArray : []).map((data: any) =>
        ReminderTemplateGroup.fromResponse(data),
      );
      this.reminderStore.setReminderTemplateGroups(groups);

      return groups;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒分组失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取提醒模板分组详情
   */
  async getReminderTemplateGroup(groupUuid: string): Promise<ReminderTemplateGroup | null> {
    try {
      // 优先从 store 获取
      const cachedGroup = this.reminderStore.getReminderTemplateGroupByUuid(groupUuid);
      if (cachedGroup) {
        return cachedGroup;
      }

      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const groupData = await reminderApiClient.getReminderTemplateGroup(groupUuid);

      // 根据axios响应封装系统，groupData 已经是解包后的响应数据
      const group = ReminderTemplateGroup.fromResponse(groupData);
      this.reminderStore.addOrUpdateReminderTemplateGroup(group);

      return group;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒分组详情失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 更新提醒模板分组
   */
  async updateReminderTemplateGroup(
    groupUuid: string,
    request: any,
  ): Promise<ReminderTemplateGroup> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const groupData = await reminderApiClient.updateReminderTemplateGroup(groupUuid, request);

      // 转换为客户端实体并更新 store
      const group = ReminderTemplateGroup.fromResponse(groupData);
      this.reminderStore.addOrUpdateReminderTemplateGroup(group);

      this.snackbar.showSuccess('提醒分组更新成功');
      return group;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新提醒分组失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 删除提醒模板分组
   */
  async deleteReminderTemplateGroup(groupUuid: string): Promise<void> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      await reminderApiClient.deleteReminderTemplateGroup(groupUuid);

      // 从 store 中移除
      this.reminderStore.removeReminderTemplateGroup(groupUuid);

      this.snackbar.showSuccess('提醒分组删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除提醒分组失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderTemplateGroupEnabled(groupUuid: string, enabled: boolean): Promise<void> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      await reminderApiClient.toggleReminderTemplateGroupEnabled(groupUuid, enabled);

      // 更新 store 中的状态
      const group = this.reminderStore.getReminderTemplateGroupByUuid(groupUuid);
      if (group) {
        (group as any).enabled = enabled;
        this.reminderStore.addOrUpdateReminderTemplateGroup(group);
      }

      this.snackbar.showSuccess(`分组${enabled ? '启用' : '禁用'}成功`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换分组状态失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  // ===== 数据同步方法（参考 Goal 模块架构）=====

  /**
   * 同步所有提醒数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllReminderData(): Promise<{
    templatesCount: number;
    groupsCount: number;
  }> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      // 并行获取所有数据
      console.log('📡 开始发起 Reminder API 请求...');
      const [templatesData, groupsData] = await Promise.all([
        reminderApiClient.getReminderTemplates({ limit: 1000 }),
        reminderApiClient.getReminderTemplateGroups(),
      ]);

      console.log('🔍 Reminder API 响应数据:', {
        templatesData,
        groupsData,
      });

      // 转换为客户端实体
      const templates = (Array.isArray(templatesData) ? templatesData : []).map((templateData) =>
        ReminderTemplate.fromApiResponse(templateData),
      );
      // 处理分组数据：可能是数组，也可能是 { groups: [...] } 对象
      const groupsArray = Array.isArray(groupsData) ? groupsData : groupsData?.groups || [];
      const groups = (Array.isArray(groupsArray) ? groupsArray : []).map((groupData) =>
        ReminderTemplateGroup.fromResponse(groupData),
      );

      // 批量同步到 store
      this.reminderStore.setReminderTemplates(templates);
      this.reminderStore.setReminderTemplateGroups(groups);

      console.log(`成功同步提醒数据: ${templates.length} 个模板, ${groups.length} 个分组`);

      return {
        templatesCount: templates.length,
        groupsCount: groups.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有提醒数据失败';
      this.reminderStore.setError(errorMessage);
      console.error('同步所有提醒数据失败:', error);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    return (
      !this.reminderStore.isInitialized ||
      this.reminderStore.getAllTemplates.length === 0 ||
      this.reminderStore.shouldRefreshCache()
    );
  }

  // ===== 工具方法 =====

  /**
   * 获取 Reminder Store 实例
   */
  getStore() {
    return this.reminderStore;
  }

  /**
   * 初始化服务
   * 会自动同步所有提醒数据到 store
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      this.reminderStore.initialize();

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('开始同步所有提醒数据...');
        await this.syncAllReminderData();
      } else {
        console.log('使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('Reminder 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      if (!this.reminderStore.isInitialized) {
        this.reminderStore.initialize();
      }
      throw error;
    }
  }

  /**
   * 仅初始化模块（不进行数据同步）
   * 用于应用启动时的基础模块初始化
   */
  async initializeModule(): Promise<void> {
    try {
      // 只初始化 store（加载本地缓存），不进行网络同步
      this.reminderStore.initialize();
      console.log('Reminder 模块基础初始化完成（仅本地缓存）');
    } catch (error) {
      console.error('Reminder 模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化模块数据
   * 登录时调用，同步所有数据
   */
  async initializeModuleData(): Promise<void> {
    try {
      // 1. 同步 Reminder 数据
      await this.syncAllReminderData();

      // 2. 启动 Schedule 集成服务
      await this.initializeScheduleIntegration();

      console.log('✅ Reminder 模块数据初始化完成（包括 Schedule 集成）');
    } catch (error) {
      console.error('❌ Reminder 模块数据初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化 Reminder-Schedule 集成
   * 确保状态同步服务正常运行
   */
  private async initializeScheduleIntegration(): Promise<void> {
    try {
      console.log('🔄 启动 Reminder-Schedule 集成服务...');

      // 动态导入集成服务，避免循环依赖
      const { reminderScheduleIntegration, reminderScheduleSyncManager } = await import(
        '@dailyuse/domain-core'
      );

      // 检查同步管理器是否已初始化
      if (reminderScheduleSyncManager) {
        console.log('✅ Schedule 同步管理器已就绪');
      }

      // 检查集成服务状态
      if (reminderScheduleIntegration) {
        console.log('✅ Reminder-Schedule 集成服务已就绪');
      }
    } catch (error) {
      console.error('❌ Reminder-Schedule 集成服务启动失败:', error);
      // 集成服务失败不应阻止 Reminder 模块的基本功能
      console.warn('Schedule 集成服务启动失败，但 Reminder 模块将继续正常工作');
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('强制重新同步所有提醒数据...');
    await this.syncAllReminderData();
  }

  /**
   * 清理服务状态
   * 用于用户登出时清理数据
   */
  cleanup(): void {
    this.reminderStore.clearAll();
  }
}

/**
 * 全局单例实例 - 懒加载
 */
let _reminderService: ReminderWebApplicationService | null = null;

export const getReminderService = (): ReminderWebApplicationService => {
  if (!_reminderService) {
    _reminderService = new ReminderWebApplicationService();
  }
  return _reminderService;
};

/**
 * @deprecated 使用 getReminderService() 代替
 * 为了向后兼容暂时保留，但建议迁移到懒加载方式
 */
export const reminderService = new Proxy({} as ReminderWebApplicationService, {
  get(target, prop) {
    const service = getReminderService();
    const value = (service as any)[prop];
    if (typeof value === 'function') {
      return value.bind(service);
    }
    return value;
  },
});
