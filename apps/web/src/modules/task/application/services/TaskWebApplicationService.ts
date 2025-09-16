import type { TaskContracts } from '@dailyuse/contracts';
import { useTaskStore } from '../../presentation/stores/taskStore';
import {
  taskTemplateApiClient,
  taskInstanceApiClient,
  taskMetaTemplateApiClient,
  taskStatisticsApiClient,
} from '../../infrastructure/api/taskApiClient';

/**
 * Task Web 应用服务 - 新架构
 * 负责协调 API 客户端和 Store 之间的数据流
 * 实现缓存优先的数据同步策略
 */
export class TaskWebApplicationService {
  /**
   * 懒加载获取 Task Store
   * 避免在 Pinia 初始化之前调用
   */
  private get taskStore() {
    return useTaskStore();
  }

  // ===== 任务模板 CRUD 操作 =====

  /**
   * 创建任务模板
   */
  async createTaskTemplate(
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const template = await taskTemplateApiClient.createTemplate(request);

      // 添加到缓存
      this.taskStore.addTaskTemplate(template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务模板列表
   */
  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
  }): Promise<TaskContracts.TaskTemplateListResponse> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await taskTemplateApiClient.getTemplates(params);

      // 批量同步到 store
      this.taskStore.setTaskTemplates(response.templates || []);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板列表失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务模板详情
   */
  async getTaskTemplateById(uuid: string): Promise<TaskContracts.TaskTemplateDTO | null> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const template = await taskTemplateApiClient.getTemplateById(uuid);

      // 添加到缓存
      this.taskStore.addTaskTemplate(template);

      return template;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : '获取任务模板详情失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(
    uuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const template = await taskTemplateApiClient.updateTemplate(uuid, request);

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      await taskTemplateApiClient.deleteTemplate(uuid);

      // 从缓存中移除
      this.taskStore.removeTaskTemplate(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const template = await taskTemplateApiClient.activateTemplate(uuid);

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const template = await taskTemplateApiClient.pauseTemplate(uuid);

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  // ===== 任务实例 CRUD 操作 =====

  /**
   * 创建任务实例
   */
  async createTaskInstance(
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instance = await taskInstanceApiClient.createInstance(request);

      // 添加到缓存
      this.taskStore.addTaskInstance(instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务实例列表
   */
  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    status?: string;
    templateUuid?: string;
    goalUuid?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TaskContracts.TaskInstanceListResponse> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await taskInstanceApiClient.getInstances(params);

      // 批量同步到 store
      this.taskStore.setTaskInstances(response.instances || []);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务实例列表失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务实例详情
   */
  async getTaskInstanceById(uuid: string): Promise<TaskContracts.TaskInstanceDTO | null> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instance = await taskInstanceApiClient.getInstanceById(uuid);

      // 添加到缓存
      this.taskStore.addTaskInstance(instance);

      return instance;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : '获取任务实例详情失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 更新任务实例
   */
  async updateTaskInstance(
    uuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instance = await taskInstanceApiClient.updateInstance(uuid, request);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      await taskInstanceApiClient.deleteInstance(uuid);

      // 从缓存中移除
      this.taskStore.removeTaskInstance(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(
    uuid: string,
    result?: string,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instance = await taskInstanceApiClient.completeInstance(uuid, result);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 撤销任务完成
   */
  async undoCompleteTaskInstance(uuid: string): Promise<TaskContracts.TaskInstanceDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instance = await taskInstanceApiClient.undoCompleteInstance(uuid);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '撤销任务完成失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 重新安排任务实例
   */
  async rescheduleTaskInstance(
    uuid: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<TaskContracts.TaskInstanceDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instance = await taskInstanceApiClient.rescheduleInstance(uuid, request);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重新安排任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 取消任务实例
   */
  async cancelTaskInstance(uuid: string, reason?: string): Promise<TaskContracts.TaskInstanceDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instance = await taskInstanceApiClient.cancelInstance(uuid, reason);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  // ===== 搜索方法 =====

  /**
   * 搜索任务模板
   */
  async searchTaskTemplates(params: {
    query: string;
    page?: number;
    limit?: number;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<TaskContracts.TaskTemplateListResponse> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await taskTemplateApiClient.searchTemplates(params);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 搜索任务实例
   */
  async searchTaskInstances(params: {
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
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await taskInstanceApiClient.searchInstances(params);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(): Promise<TaskContracts.TaskInstanceDTO[]> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instances = await taskInstanceApiClient.getTodayTasks();
      return instances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取今日任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取即将到期的任务
   */
  async getUpcomingTasks(days?: number): Promise<TaskContracts.TaskInstanceDTO[]> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instances = await taskInstanceApiClient.getUpcomingTasks(days);
      return instances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取即将到期任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取逾期任务
   */
  async getOverdueTasks(): Promise<TaskContracts.TaskInstanceDTO[]> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instances = await taskInstanceApiClient.getOverdueTasks();
      return instances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取逾期任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  // ===== 统计方法 =====

  /**
   * 获取任务统计概览
   */
  async getTaskStatistics(params?: {
    startDate?: string;
    endDate?: string;
    goalUuid?: string;
  }): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const statistics = await taskStatisticsApiClient.getOverview(params);
      return statistics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务统计失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务完成趋势
   */
  async getTaskCompletionTrend(params?: {
    period?: 'day' | 'week' | 'month';
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const trend = await taskStatisticsApiClient.getCompletionTrend(params);
      return trend;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务完成趋势失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有任务数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllTaskData(): Promise<{
    templatesCount: number;
    instancesCount: number;
  }> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const [templatesResponse, instancesResponse] = await Promise.all([
        this.getTaskTemplates({ limit: 1000 }),
        this.getTaskInstances({ limit: 1000 }),
      ]);

      const templates = templatesResponse.templates || [];
      const instances = instancesResponse.instances || [];

      // 批量设置到 store
      this.taskStore.setTaskTemplates(templates);
      this.taskStore.setTaskInstances(instances);

      console.log(`成功同步数据: ${templates.length} 个模板, ${instances.length} 个实例`);

      return {
        templatesCount: templates.length,
        instancesCount: instances.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有任务数据失败';
      this.taskStore.setError(errorMessage);
      console.error('同步所有任务数据失败:', error);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    return (
      !this.taskStore.isInitialized ||
      this.taskStore.getAllTaskTemplates.length === 0 ||
      this.taskStore.shouldRefreshCache
    );
  }

  // ===== 工具方法 =====

  /**
   * 获取 Task Store 实例
   */
  getStore() {
    return this.taskStore;
  }

  /**
   * 初始化服务
   * 会自动同步所有任务数据到 store
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      if (this.taskStore.initialize && typeof this.taskStore.initialize === 'function') {
        this.taskStore.initialize();
      }

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('开始同步所有任务数据...');
        await this.syncAllTaskData();
      } else {
        console.log('使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('Task 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      if (
        this.taskStore.initialize &&
        typeof this.taskStore.initialize === 'function' &&
        !this.taskStore.isInitialized
      ) {
        this.taskStore.initialize();
      }
      throw error;
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('强制重新同步所有数据...');
    await this.syncAllTaskData();
  }
}

/**
 * 导出单例实例
 */
export const taskWebApplicationService = new TaskWebApplicationService();
