import type { ReminderContracts } from '@dailyuse/contracts';
// 暂时使用临时类型定义，等待domain-client中的实现
interface ReminderTemplate {
  uuid: string;
  enabled: boolean;
  groupUuid?: string;
  priority: string;
  toDTO(): any;
}

interface ReminderTemplateGroup {
  uuid: string;
}

interface ReminderInstance {
  uuid: string;
  templateUuid: string;
  status: string;
  toDTO(): any;
}

// 临时从响应构建实体的方法
const ReminderTemplate = {
  fromResponse: (data: any): ReminderTemplate => data as ReminderTemplate,
};

const ReminderTemplateGroup = {
  fromResponse: (data: any): ReminderTemplateGroup => data as ReminderTemplateGroup,
};

const ReminderInstance = {
  fromResponse: (data: any): ReminderInstance => data as ReminderInstance,
};

import { reminderApiClient } from '../../infrastructure/api/reminderApiClient';
import { useReminderStore } from '../../presentation/stores/reminderStore';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';

/**
 * Reminder Web 应用服务
 * 负责协调 Web 端的提醒相关操作，整合 API 调用和本地状态管理
 * 集成全局 Snackbar 提示系统
 */
export class ReminderWebApplicationService {
  private snackbar = useSnackbar();

  /**
   * 懒加载获取 Reminder Store
   * 避免在 Pinia 初始化之前调用
   */
  private get reminderStore() {
    return useReminderStore();
  }

  // ===== 提醒模板 CRUD 操作 =====

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.createReminderTemplate(request);

      // 创建客户端实体并同步到 store
      const template = ReminderTemplate.fromResponse(templateData);
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
  }): Promise<ReminderContracts.ReminderListResponse> {
    try {
      // 缓存优先策略：如果已有数据且不强制刷新，直接返回缓存
      if (!params?.forceRefresh && this.reminderStore.reminderTemplates.length > 0) {
        return {
          reminders: this.reminderStore.reminderTemplates.map((t) => t.toDTO()),
          total: this.reminderStore.reminderTemplates.length,
          page: 1,
          limit: this.reminderStore.reminderTemplates.length,
        };
      }

      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templatesData = await reminderApiClient.getReminderTemplates(params);

      // 转换为客户端实体并更新 store
      const templates = templatesData.reminders.map((data) => ReminderTemplate.fromResponse(data));
      this.reminderStore.setReminderTemplates(templates);

      return templatesData;
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
   * 获取提醒模板详情
   */
  async getReminderTemplate(
    uuid: string,
  ): Promise<ReminderContracts.ReminderTemplateResponse | null> {
    try {
      // 优先从 store 获取
      const cachedTemplate = this.reminderStore.getReminderTemplateByUuid(uuid);
      if (cachedTemplate) {
        return cachedTemplate.toDTO();
      }

      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.getReminderTemplate(uuid);

      // 转换为客户端实体并更新 store
      const template = ReminderTemplate.fromResponse(templateData);
      this.reminderStore.addOrUpdateReminderTemplate(template);

      return templateData;
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
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.updateReminderTemplate(uuid, request);

      // 转换为客户端实体并更新 store
      const template = ReminderTemplate.fromResponse(templateData);
      this.reminderStore.addOrUpdateReminderTemplate(template);

      this.snackbar.showSuccess('提醒模板更新成功');
      return templateData;
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

  // ===== 提醒实例管理 =====

  /**
   * 创建提醒实例
   */
  async createReminderInstance(
    templateUuid: string,
    request: ReminderContracts.CreateReminderInstanceRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse> {
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
   * 获取提醒实例列表
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
  ): Promise<ReminderContracts.ReminderListResponse> {
    try {
      // 缓存优先策略
      if (!params?.forceRefresh) {
        const cachedInstances = this.reminderStore.getReminderInstancesByTemplate(templateUuid);
        if (cachedInstances.length > 0) {
          return {
            reminders: cachedInstances.map((i) => i.toDTO()),
            total: cachedInstances.length,
            page: 1,
            limit: cachedInstances.length,
          };
        }
      }

      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const instancesData = await reminderApiClient.getReminderInstances(templateUuid, params);

      // 转换为客户端实体并更新 store
      const instances = instancesData.reminders.map((data) => ReminderInstance.fromResponse(data));
      this.reminderStore.addOrUpdateReminderInstances(instances);

      return instancesData;
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
  ): Promise<ReminderContracts.ReminderInstanceResponse> {
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
  }): Promise<ReminderContracts.ReminderListResponse> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const remindersData = await reminderApiClient.getActiveReminders(params);

      // 转换为客户端实体并更新 store
      const instances = remindersData.reminders.map((data) => ReminderInstance.fromResponse(data));
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
  async getGlobalStats(): Promise<ReminderContracts.ReminderStatsResponse> {
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
  async getAggregateStats(templateUuid: string): Promise<ReminderContracts.ReminderStatsResponse> {
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

  // ===== 缓存管理 =====

  /**
   * 刷新所有数据
   */
  async refreshAll(): Promise<void> {
    try {
      this.reminderStore.clearAll();
      await this.getReminderTemplates({ forceRefresh: true });
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
}
