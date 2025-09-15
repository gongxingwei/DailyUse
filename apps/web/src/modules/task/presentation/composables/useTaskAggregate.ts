import { ref, computed, readonly } from 'vue';
import type { TaskContracts } from '@dailyuse/contracts';
import { TaskApplicationService } from '@dailyuse/domain-client';
import { TaskTemplate } from '@dailyuse/domain-client';
import { useTaskStore } from '../stores/taskStore';

/**
 * Task 模块组合式函数 - 完善的分层架构
 * 实现 Composable + ApplicationService + Store 模式
 *
 * 架构职责：
 * - Composable: 提供响应式接口，管理UI状态
 * - ApplicationService: 协调聚合根操作和业务流程
 * - Store: 纯数据存储和缓存管理
 */
export function useTask() {
  // ===== 分层架构组件 =====
  const taskApplicationService = new TaskApplicationService();
  const taskStore = useTaskStore();

  // ===== Composable 层状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);
  const currentOperation = ref<string | null>(null);

  // ===== 聚合根状态管理 =====
  const activeAggregates = ref(new Map<string, TaskTemplate>());

  // ===== 计算属性 - 数据访问层 =====

  /**
   * 任务模板聚合根访问
   */
  const taskTemplateAggregates = computed(() => Array.from(activeAggregates.value.values()));

  const taskTemplates = computed(() => taskStore.getAllTaskTemplates);

  const activeTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.lifecycle?.status === 'active'),
  );

  const taskTemplatesByKeyResult = computed(
    () => (keyResultUuid: string) => taskStore.getTaskTemplatesByKeyResultUuid(keyResultUuid),
  );

  /**
   * 任务实例访问
   */
  const taskInstances = computed(() => taskStore.getAllTaskInstances);

  const pendingTaskInstances = computed(() => taskStore.getInstancesByStatus('pending'));

  const completedTaskInstances = computed(() => taskStore.getInstancesByStatus('completed'));

  const todayTaskInstances = computed(() => taskStore.getTodayTaskInstances);

  const taskInstancesByTemplate = computed(
    () => (templateUuid: string) => taskStore.getInstancesByTemplateUuid(templateUuid),
  );

  /**
   * UI 状态
   */
  const isLoading = computed(() => taskStore.isLoading || isOperating.value);
  const error = computed(() => taskStore.error || operationError.value);
  const isInitialized = computed(() => taskStore.isInitialized);

  // ===== 聚合根操作方法 =====

  /**
   * 加载任务模板聚合根
   */
  async function loadTaskTemplateAggregate(templateUuid: string): Promise<TaskTemplate> {
    try {
      setOperationState('loadAggregate', `正在加载聚合根: ${templateUuid}`);

      // 检查是否已在内存中
      if (activeAggregates.value.has(templateUuid)) {
        return activeAggregates.value.get(templateUuid) as TaskTemplate;
      }

      // 使用ApplicationService获取聚合根
      const aggregate = await taskApplicationService.getTaskTemplateAggregate(templateUuid);
      if (!aggregate) {
        throw new Error(`任务模板聚合根不存在: ${templateUuid}`);
      }

      // 缓存到内存
      activeAggregates.value.set(templateUuid, aggregate);

      return aggregate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载聚合根失败';
      setOperationError(errorMessage);
      throw error;
    } finally {
      clearOperationState();
    }
  }

  /**
   * 创建任务模板聚合根
   */
  async function createTaskTemplateAggregate(
    request: TaskContracts.CreateTaskTemplateRequest,
    accountUuid: string,
  ): Promise<TaskTemplate> {
    try {
      setOperationState('createTemplate', '正在创建任务模板');

      // 使用ApplicationService创建聚合根
      const template = await taskApplicationService.createTaskTemplate(request, accountUuid);

      // 更新Store缓存
      taskStore.addTaskTemplate(template.toDTO());

      // 缓存聚合根到内存
      activeAggregates.value.set(template.uuid, template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务模板失败';
      setOperationError(errorMessage);
      throw error;
    } finally {
      clearOperationState();
    }
  }

  /**
   * 通过聚合根创建任务实例
   */
  async function createTaskInstanceViaAggregate(
    templateUuid: string,
    accountUuid: string,
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<string> {
    try {
      setOperationState('createInstance', '正在通过聚合根创建实例');

      // 获取聚合根
      const aggregate = await loadTaskTemplateAggregate(templateUuid);

      // 使用聚合根创建实例
      const instanceUuid = aggregate.createInstance({
        accountUuid,
        title: request.title,
        scheduledDate: new Date(request.timeConfig.scheduledDate),
        timeType: request.timeConfig.timeType,
        startTime: request.timeConfig.startTime,
        endTime: request.timeConfig.endTime,
        estimatedDuration: request.timeConfig.estimatedDuration,
        properties: request.properties,
      });

      // 获取创建的实例并更新Store缓存
      const instance = aggregate.getInstance(instanceUuid);
      if (instance) {
        taskStore.addTaskInstance(instance.toDTO());
      }

      // 持久化变更（使用API或其他服务）
      await persistAggregateChanges(aggregate);

      return instanceUuid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建实例失败';
      setOperationError(errorMessage);
      throw error;
    } finally {
      clearOperationState();
    }
  }

  /**
   * 通过聚合根完成任务实例
   */
  async function completeTaskInstanceViaAggregate(
    templateUuid: string,
    instanceUuid: string,
    completionData: TaskContracts.CompleteTaskRequest,
  ): Promise<void> {
    try {
      setOperationState('completeInstance', '正在完成任务实例');

      // 获取聚合根
      const aggregate = await loadTaskTemplateAggregate(templateUuid);

      // 使用聚合根完成实例
      aggregate.completeInstance(instanceUuid, {
        notes: completionData.notes,
        actualDuration: completionData.actualDuration,
      });

      // 更新Store缓存
      const updatedInstance = aggregate.getInstance(instanceUuid);
      if (updatedInstance) {
        taskStore.updateTaskInstance(instanceUuid, updatedInstance.toDTO());
      }

      // 持久化变更
      await persistAggregateChanges(aggregate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成实例失败';
      setOperationError(errorMessage);
      throw error;
    } finally {
      clearOperationState();
    }
  }

  /**
   * 更新任务模板聚合根
   */
  async function updateTaskTemplateAggregate(
    templateUuid: string,
    updates: Partial<TaskContracts.UpdateTaskTemplateRequest>,
  ): Promise<void> {
    try {
      setOperationState('updateTemplate', '正在更新任务模板');

      // 获取聚合根
      const aggregate = await loadTaskTemplateAggregate(templateUuid);

      // 由于TaskTemplate没有直接的update方法，我们使用简单的属性更新
      // 在实际项目中，应该为TaskTemplate添加相应的update方法
      if (updates.title !== undefined) {
        // 这里应该有 aggregate.updateTitle(updates.title) 方法
        console.log('需要实现 updateTitle 方法');
      }

      // 更新Store缓存
      taskStore.updateTaskTemplate(templateUuid, aggregate.toDTO());

      // 持久化变更
      await persistAggregateChanges(aggregate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新模板失败';
      setOperationError(errorMessage);
      throw error;
    } finally {
      clearOperationState();
    }
  }

  // ===== 传统CRUD操作（向后兼容） =====

  /**
   * 获取任务模板列表
   */
  async function fetchTaskTemplates(options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<void> {
    try {
      setOperationState('fetchTemplates', '正在获取任务模板列表');

      // 调用ApplicationService获取数据
      const templates = await taskApplicationService.getTaskTemplates(options);

      // 更新Store
      taskStore.setTaskTemplates(templates.map((t) => t.toDTO()));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板失败';
      setOperationError(errorMessage);
      throw error;
    } finally {
      clearOperationState();
    }
  }

  /**
   * 获取任务实例列表
   */
  async function fetchTaskInstances(options?: {
    templateUuid?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<void> {
    try {
      setOperationState('fetchInstances', '正在获取任务实例列表');

      // 使用现有方法或实现简化版本
      const instances = await taskApplicationService.queryTaskInstances({
        templateUuid: options?.templateUuid,
        status: options?.status ? [options.status as any] : undefined,
        limit: options?.limit,
        offset: options?.offset,
      });

      // 更新Store
      taskStore.setTaskInstances(instances.map((i: any) => i.toDTO()));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务实例失败';
      setOperationError(errorMessage);
      throw error;
    } finally {
      clearOperationState();
    }
  }

  // ===== 辅助方法 =====

  /**
   * 持久化聚合根变更
   */
  async function persistAggregateChanges(aggregate: TaskTemplate): Promise<void> {
    // 简化版本 - 在实际项目中应该实现完整的变更跟踪
    try {
      // 这里应该调用API服务保存变更
      // 例如: await apiService.saveTaskTemplateChanges(aggregate.uuid, changes);

      console.log(`[useTaskAggregate] 模拟持久化聚合根变更: ${aggregate.uuid}`);

      // 简单的延迟模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[useTaskAggregate] 持久化变更失败:`, error);
      throw error;
    }
  }

  /**
   * 设置操作状态
   */
  function setOperationState(operation: string, message?: string): void {
    isOperating.value = true;
    currentOperation.value = operation;
    operationError.value = null;

    if (message) {
      console.log(`[useTask] ${message}`);
    }
  }

  /**
   * 设置操作错误
   */
  function setOperationError(error: string): void {
    operationError.value = error;
    console.error(`[useTask] ${error}`);
  }

  /**
   * 清除操作状态
   */
  function clearOperationState(): void {
    isOperating.value = false;
    currentOperation.value = null;
  }

  /**
   * 重置聚合根缓存
   */
  function resetAggregateCache(): void {
    activeAggregates.value.clear();
  }

  /**
   * 释放聚合根资源
   */
  function releaseAggregate(templateUuid: string): void {
    activeAggregates.value.delete(templateUuid);
  }

  // ===== 对外接口 =====
  return {
    // 聚合根相关
    loadTaskTemplateAggregate,
    createTaskTemplateAggregate,
    createTaskInstanceViaAggregate,
    completeTaskInstanceViaAggregate,
    updateTaskTemplateAggregate,
    taskTemplateAggregates: readonly(taskTemplateAggregates),

    // 数据访问
    taskTemplates: readonly(taskTemplates),
    activeTaskTemplates: readonly(activeTaskTemplates),
    taskTemplatesByKeyResult: readonly(taskTemplatesByKeyResult),
    taskInstances: readonly(taskInstances),
    pendingTaskInstances: readonly(pendingTaskInstances),
    completedTaskInstances: readonly(completedTaskInstances),
    todayTaskInstances: readonly(todayTaskInstances),
    taskInstancesByTemplate: readonly(taskInstancesByTemplate),

    // 传统操作
    fetchTaskTemplates,
    fetchTaskInstances,

    // 状态管理
    isLoading: readonly(isLoading),
    error: readonly(error),
    isInitialized: readonly(isInitialized),
    currentOperation: readonly(currentOperation),

    // 工具方法
    resetAggregateCache,
    releaseAggregate,
  };
}
