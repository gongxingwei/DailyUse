import type { TaskContracts } from '@dailyuse/contracts';
import { useTaskStore } from '../../presentation/stores/taskStore';
import {
  taskTemplateApiClient,
  taskInstanceApiClient,
  taskMetaTemplateApiClient,
  taskStatisticsApiClient,
} from '../../infrastructure/api/taskApiClient';
import {
  TaskDomainService,
  TaskTemplate,
  TaskInstance,
  TaskMetaTemplate,
} from '@dailyuse/domain-client';

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
  private get taskStore(): ReturnType<typeof useTaskStore> {
    return useTaskStore();
  }

  // ===== 任务模板 CRUD 操作 =====

  /**
   * 获取任务元模板列表（META）
   */
  async getTaskMetaTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<TaskContracts.TaskMetaTemplateListResponse> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await taskMetaTemplateApiClient.getMetaTemplates(params);

      // 将DTO转换为实体对象
      const entityMetaTemplates =
        response.metaTemplates?.map((dto) => TaskMetaTemplate.fromDTO(dto)) || [];

      // 批量同步到 store（如果 store 支持）
      console.log('✅ [TaskService] 成功获取元模板:', entityMetaTemplates.length);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务元模板列表失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 创建任务模板
   */
  async createTaskTemplate(
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const templateDTO = await taskTemplateApiClient.createTemplate(request);

      // 将DTO转换为实体对象
      const entityTemplate = TaskTemplate.fromDTO(templateDTO);

      // 添加到缓存
      this.taskStore.addTaskTemplate(entityTemplate);

      // 更新同步时间
      this.taskStore.updateLastSyncTime();

      return templateDTO; // 返回DTO保持API兼容性
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 通过元模板创建任务模板
   * 类似本地工具函数
   */
  async createTaskTemplateByMetaTemplate(metaTemplateUuid: string): Promise<TaskTemplate> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);
      let metaTemplate = this.taskStore.getMetaTemplateByUuid(metaTemplateUuid);
      if (!metaTemplate) {
        // 如果本地没有，从服务器获取
        const dto = await taskMetaTemplateApiClient.getMetaTemplateById(metaTemplateUuid);
        if (!dto) {
          throw new Error('找不到对应的元模板');
        }
        // 转换为实体对象
        const entity = TaskMetaTemplate.fromDTO(dto);
        // 添加到缓存
        this.taskStore.addMetaTemplate(entity);
        // 使用这个实体
        metaTemplate = entity;
      }
      const TaskDomainServiceInstance = new TaskDomainService();
      const template =
        await TaskDomainServiceInstance.createTaskTemplateByTaskMetaTemplate(metaTemplate);
      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '通过元模板创建任务模板失败';
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

      // 将DTO转换为实体对象
      const entityTemplates = response.templates?.map((dto) => TaskTemplate.fromDTO(dto)) || [];
      console.log(
        'Fetched templates:==================================================',
        entityTemplates,
      );
      // 批量同步到 store
      this.taskStore.setTaskTemplates(entityTemplates);

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

      const templateDTO = await taskTemplateApiClient.getTemplateById(uuid);

      // 将DTO转换为实体对象
      const entityTemplate = TaskTemplate.fromDTO(templateDTO);

      // 添加到缓存
      this.taskStore.addTaskTemplate(entityTemplate);

      return templateDTO; // 返回DTO保持API兼容性
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

      const templateDTO = await taskTemplateApiClient.updateTemplate(uuid, request);

      // 将DTO转换为实体对象
      const entityTemplate = TaskTemplate.fromDTO(templateDTO);

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, entityTemplate);

      // 更新同步时间
      this.taskStore.updateLastSyncTime();

      return templateDTO; // 返回DTO保持API兼容性
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

      const templateDTO = await taskTemplateApiClient.activateTemplate(uuid);

      // 将DTO转换为实体对象
      const entityTemplate = TaskTemplate.fromDTO(templateDTO);

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, entityTemplate);

      // 激活后可能生成了新的任务实例，刷新全部实例列表
      try {
        const instancesResponse = await this.getTaskInstances({ templateUuid: uuid });
        // getTaskInstances 已经会将实例同步到 store
      } catch (instanceError) {
        console.warn('激活模板后刷新实例列表失败:', instanceError);
        // 不阻断主流程，只记录警告
      }

      // 更新同步时间，确保数据被持久化
      this.taskStore.updateLastSyncTime();

      return templateDTO; // 返回DTO保持API兼容性
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

      const templateDTO = await taskTemplateApiClient.pauseTemplate(uuid);

      // 将DTO转换为实体对象
      const entityTemplate = TaskTemplate.fromDTO(templateDTO);

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, entityTemplate);

      return templateDTO; // 返回DTO保持API兼容性
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

      const instanceDTO = await taskInstanceApiClient.createInstance(request);

      // 将DTO转换为实体对象
      const entityInstance = TaskInstance.fromDTO(instanceDTO);

      // 添加到缓存
      this.taskStore.addTaskInstance(entityInstance);

      return instanceDTO; // 返回DTO保持API兼容性
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

      // 将DTO转换为实体对象
      const entityInstances = response.instances?.map((dto) => TaskInstance.fromDTO(dto)) || [];

      // 批量同步到 store
      this.taskStore.setTaskInstances(entityInstances);

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

      const instanceDTO = await taskInstanceApiClient.getInstanceById(uuid);

      // 将DTO转换为实体对象
      const entityInstance = TaskInstance.fromDTO(instanceDTO);

      // 添加到缓存
      this.taskStore.addTaskInstance(entityInstance);

      return instanceDTO; // 返回DTO保持API兼容性
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

      const instanceDTO = await taskInstanceApiClient.updateInstance(uuid, request);

      // 将DTO转换为实体对象
      const entityInstance = TaskInstance.fromDTO(instanceDTO);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, entityInstance);

      return instanceDTO; // 返回DTO保持API兼容性
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

      const instanceDTO = await taskInstanceApiClient.completeInstance(uuid, result);

      // 将DTO转换为实体对象
      const entityInstance = TaskInstance.fromDTO(instanceDTO);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, entityInstance);

      return instanceDTO; // 返回DTO保持API兼容性
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

      const instanceDTO = await taskInstanceApiClient.undoCompleteInstance(uuid);

      // 将DTO转换为实体对象
      const entityInstance = TaskInstance.fromDTO(instanceDTO);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, entityInstance);

      return instanceDTO; // 返回DTO保持API兼容性
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

      const instanceDTO = await taskInstanceApiClient.rescheduleInstance(uuid, request);

      // 将DTO转换为实体对象
      const entityInstance = TaskInstance.fromDTO(instanceDTO);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, entityInstance);

      return instanceDTO; // 返回DTO保持API兼容性
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

      const instanceDTO = await taskInstanceApiClient.cancelInstance(uuid, reason);

      // 将DTO转换为实体对象
      const entityInstance = TaskInstance.fromDTO(instanceDTO);

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, entityInstance);

      return instanceDTO; // 返回DTO保持API兼容性
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
   * 使用聚合根模式：从 TaskTemplate 中提取 TaskInstance，避免额外的 API 调用
   */
  async syncAllTaskData(): Promise<{
    templatesCount: number;
    instancesCount: number;
  }> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      // 获取任务模板（包含实例数据）
      const templatesResponse = await this.getTaskTemplates({ limit: 1000 });

      // 转换模板为领域实体
      const templates =
        templatesResponse.templates.map((templateDTO) => TaskTemplate.fromDTO(templateDTO)) || [];

      // 从模板的实例数组中提取所有实例
      const instances: TaskInstance[] = [];
      templatesResponse.templates.forEach((templateDTO) => {
        if (templateDTO.instances && templateDTO.instances.length > 0) {
          const templateInstances = templateDTO.instances.map((instanceDTO) =>
            TaskInstance.fromDTO(instanceDTO),
          );
          instances.push(...templateInstances);
        }
      });

      // 批量设置到 store
      this.taskStore.setTaskTemplates(templates);
      this.taskStore.setTaskInstances(instances);

      console.log(`✅ 成功同步数据: ${templates.length} 个模板, ${instances.length} 个实例`);

      return {
        templatesCount: templates.length,
        instancesCount: instances.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有任务数据失败';
      this.taskStore.setError(errorMessage);
      console.error('❌ 同步所有任务数据失败:', error);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    try {
      const store = this.taskStore;

      // 1. 如果store没有初始化，肯定需要同步
      if (!store.isInitialized) {
        console.log('🔄 [缓存检查] Store未初始化，需要同步');
        return true;
      }

      // 2. 如果没有任何数据，需要同步
      if (store.getAllTaskTemplates.length === 0 && store.getAllTaskInstances.length === 0) {
        console.log('🔄 [缓存检查] 本地无数据，需要同步');
        return true;
      }

      // 3. 检查缓存是否过期
      if (store.shouldRefreshCache()) {
        console.log('🔄 [缓存检查] 缓存已过期，需要同步');
        return true;
      }

      // 4. 如果有数据且缓存未过期，使用本地数据
      console.log('✅ [缓存检查] 使用本地缓存数据，跳过同步');
      return false;
    } catch (error) {
      console.warn('检查同步状态时出错，默认需要同步:', error);
      return true; // 默认需要同步
    }
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
      try {
        const store = this.taskStore;
        if (store && store.initialize && typeof store.initialize === 'function') {
          store.initialize();
        }
      } catch (storeError) {
        console.warn('Store 初始化出错:', storeError);
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
      try {
        const store = this.taskStore;
        if (
          store &&
          store.initialize &&
          typeof store.initialize === 'function' &&
          !store.isInitialized
        ) {
          store.initialize();
        }
      } catch (fallbackError) {
        console.warn('Store 回退初始化也失败:', fallbackError);
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
      // 确保在 nextTick 后访问 store，避免 Pinia 初始化时机问题
      await new Promise((resolve) => setTimeout(resolve, 0));

      // 获取 store 实例并检查是否可用
      let store;
      try {
        store = this.taskStore;
      } catch (error) {
        console.warn('Store 暂时不可用，跳过初始化:', error);
        return;
      }

      // 只初始化 store（加载本地缓存），不进行网络同步
      if (store && store.initialize && typeof store.initialize === 'function') {
        store.initialize();
      }
      console.log('Task 模块基础初始化完成（仅本地缓存）');
    } catch (error) {
      console.error('Task 模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('🔄 [强制同步] 开始重新同步所有数据...');
    try {
      const result = await this.syncAllTaskData();
      console.log(
        `✅ [强制同步] 完成: ${result.templatesCount} 个模板，${result.instancesCount} 个实例`,
      );
    } catch (error) {
      console.error('❌ [强制同步] 失败:', error);
      throw error;
    }
  }

  /**
   * 智能同步数据 - 只在需要时同步
   */
  async smartSync(): Promise<{ synced: boolean; reason?: string }> {
    if (!this.shouldSyncData()) {
      return { synced: false, reason: '缓存有效，无需同步' };
    }

    try {
      const result = await this.syncAllTaskData();
      console.log(
        `✅ [智能同步] 完成: ${result.templatesCount} 个模板，${result.instancesCount} 个实例`,
      );
      return { synced: true, reason: '同步完成' };
    } catch (error) {
      console.error('❌ [智能同步] 失败:', error);
      throw error;
    }
  }

  /**
   * 检查并刷新过期数据
   */
  async refreshIfNeeded(): Promise<boolean> {
    try {
      const store = this.taskStore;

      // 检查是否需要刷新
      if (store.shouldRefreshCache()) {
        console.log('🔄 [刷新检查] 缓存已过期，开始刷新...');
        await this.forceSync();
        return true;
      } else {
        console.log('✅ [刷新检查] 缓存仍然有效');
        return false;
      }
    } catch (error) {
      console.error('❌ [刷新检查] 失败:', error);
      return false;
    }
  }
}

/**
 * 导出单例实例
 */
export const taskWebApplicationService = new TaskWebApplicationService();
