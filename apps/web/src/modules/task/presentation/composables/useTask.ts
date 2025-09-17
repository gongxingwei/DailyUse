import { ref, computed, onMounted, onBeforeUnmount, readonly } from 'vue';
import type { TaskContracts } from '@dailyuse/contracts';
import { TaskWebApplicationService } from '../../application/services/TaskWebApplicationService';
import { useTaskStore } from '../stores/taskStore';
import { TaskTemplate } from '@dailyuse/domain-client';

/**
 * Task 模块组合式函数 - 新架构
 * 提供统一的任务数据管理接口
 * 实现缓存优先的数据访问策略
 */
export function useTask() {
  // ===== 服务和存储 =====
  const taskService = new TaskWebApplicationService();
  const taskStore = useTaskStore();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);

  // ===== 计算属性 - 数据访问 =====

  /**
   * 任务模板相关
   */
  const taskTemplates = computed(() => taskStore.getAllTaskTemplates);
  const activeTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.lifecycle?.status === 'active'),
  );
  const pausedTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.lifecycle?.status === 'paused'),
  );
  const taskTemplatesByKeyResult = computed(
    () => (keyResultUuid: string) => taskStore.getTaskTemplatesByKeyResultUuid(keyResultUuid),
  );

  /**
   * 任务实例相关
   */
  const taskInstances = computed(() => taskStore.getAllTaskInstances);
  const pendingTaskInstances = computed(() => taskStore.getInstancesByStatus('pending'));
  const completedTaskInstances = computed(() => taskStore.getInstancesByStatus('completed'));
  const cancelledTaskInstances = computed(() => taskStore.getInstancesByStatus('cancelled'));
  const todayTaskInstances = computed(() => taskStore.getTodayTaskInstances);
  const thisWeekTaskInstances = computed(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return taskStore.getAllTaskInstances.filter((task) => {
      if (!task.timeConfig?.scheduledDate) return false;
      const scheduledDate = new Date(task.timeConfig.scheduledDate);
      return scheduledDate >= startOfWeek && scheduledDate < endOfWeek;
    });
  });

  const taskInstancesByTemplate = computed(
    () => (templateUuid: string) => taskStore.getInstancesByTemplateUuid(templateUuid),
  );

  /**
   * 元模板相关
   */
  const metaTemplates = computed(() => taskStore.getAllTaskMetaTemplates);
  const metaTemplatesByCategory = computed(
    () => (category: string) => taskStore.getMetaTemplatesByCategory(category),
  );

  /**
   * UI 状态
   */
  const isLoading = computed(() => taskStore.isLoading || isOperating.value);
  const error = computed(() => taskStore.error || operationError.value);
  const isInitialized = computed(() => taskStore.isInitialized);
  const pagination = computed(() => taskStore.pagination);

  // ===== 任务模板操作 =====

  /**
   * 创建任务模板
   */
  async function createTaskTemplate(request: TaskContracts.CreateTaskTemplateRequest) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.createTaskTemplate(request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 通过元模板创建任务模板
   */
  async function createTaskTemplateByTaskMetaTemplate(metaTemplateUuid: string): Promise<TaskTemplate> {
    try {
      isOperating.value = true;
      operationError.value = null;
      const result = await taskService.createTaskTemplateByMetaTemplate(metaTemplateUuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '通过元模板创建任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }
  /**
   * 获取任务模板列表
   */
  async function fetchTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.getTaskTemplates(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板列表失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取任务模板详情
   */
  async function fetchTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      // 先从缓存获取
      const cached = taskStore.getTaskTemplateByUuid(uuid);
      if (cached) {
        return cached;
      }

      // 缓存中没有，从服务器获取
      const result = await taskService.getTaskTemplateById(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板详情失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 更新任务模板
   */
  async function updateTaskTemplate(
    uuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.updateTaskTemplate(uuid, request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 删除任务模板
   */
  async function deleteTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      await taskService.deleteTaskTemplate(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 激活任务模板
   */
  async function activateTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.activateTaskTemplate(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 暂停任务模板
   */
  async function pauseTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.pauseTaskTemplate(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 任务实例操作 =====

  /**
   * 创建任务实例
   */
  async function createTaskInstance(request: TaskContracts.CreateTaskInstanceRequest) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.createTaskInstance(request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务实例失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取任务实例列表
   */
  async function fetchTaskInstances(params?: {
    page?: number;
    limit?: number;
    status?: string;
    templateUuid?: string;
    scheduledDate?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.getTaskInstances(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务实例列表失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取任务实例详情
   */
  async function fetchTaskInstance(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      // 先从缓存获取
      const cached = taskStore.getTaskInstanceByUuid(uuid);
      if (cached) {
        return cached;
      }

      // 缓存中没有，从服务器获取
      const result = await taskService.getTaskInstanceById(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务实例详情失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 更新任务实例
   */
  async function updateTaskInstance(
    uuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.updateTaskInstance(uuid, request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务实例失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 删除任务实例
   */
  async function deleteTaskInstance(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      await taskService.deleteTaskInstance(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务实例失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 完成任务
   */
  async function completeTaskInstance(uuid: string, request?: TaskContracts.CompleteTaskRequest) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.completeTaskInstance(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 撤销完成任务
   */
  async function undoCompleteTaskInstance(uuid: string, accountUuid?: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.undoCompleteTaskInstance(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '撤销完成任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 重新安排任务
   */
  async function rescheduleTaskInstance(uuid: string, request: TaskContracts.RescheduleTaskRequest) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.rescheduleTaskInstance(uuid, request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重新安排任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 取消任务
   */
  async function cancelTaskInstance(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.cancelTaskInstance(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 数据查询方法 =====

  /**
   * 搜索任务模板
   */
  async function searchTaskTemplates(params: {
    query: string;
    page?: number;
    limit?: number;
    type?: 'template' | 'instance' | 'both';
    status?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.searchTaskTemplates(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 搜索任务实例
   */
  async function searchTaskInstances(params: {
    query: string;
    page?: number;
    limit?: number;
    type?: 'template' | 'instance' | 'both';
    status?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.searchTaskInstances(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取今日任务
   */
  async function getTodayTasks() {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.getTodayTasks();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取今日任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有任务数据
   */
  async function syncAllTaskData() {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskService.syncAllTaskData();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步任务数据失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 强制刷新所有数据
   */
  async function forceRefresh() {
    try {
      isOperating.value = true;
      operationError.value = null;

      await taskService.forceSync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刷新数据失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 初始化模块
   */
  async function initialize() {
    try {
      isOperating.value = true;
      operationError.value = null;

      await taskService.initialize();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '初始化模块失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 工具方法 =====

  /**
   * 清除错误状态
   */
  function clearError() {
    operationError.value = null;
    taskStore.setError(null);
  }

  /**
   * 清除所有本地数据
   */
  function clearLocalData() {
    // 清除每个数组而不是调用不存在的 clearAll 方法
    taskStore.setTaskTemplates([]);
    taskStore.setTaskInstances([]);
    taskStore.setMetaTemplates([]);
    taskStore.setError(null);
    taskStore.setInitialized(false);
  }

  /**
   * 获取任务统计信息
   */
  const statistics = computed(() => ({
    totalTemplates: taskTemplates.value.length,
    activeTemplates: activeTaskTemplates.value.length,
    pausedTemplates: pausedTaskTemplates.value.length,
    totalInstances: taskInstances.value.length,
    pendingInstances: pendingTaskInstances.value.length,
    completedInstances: completedTaskInstances.value.length,
    cancelledInstances: cancelledTaskInstances.value.length,
    todayInstances: todayTaskInstances.value.length,
    thisWeekInstances: thisWeekTaskInstances.value.length,
  }));

  // ===== 生命周期管理 =====

  /**
   * 自动初始化（可选）
   */
  const autoInitialize = ref(false);

  onMounted(async () => {
    if (autoInitialize.value) {
      try {
        await initialize();
      } catch (error) {
        console.error('Task 模块自动初始化失败:', error);
      }
    }
  });

  onBeforeUnmount(() => {
    // 清理资源
    clearError();
  });

  // ===== 返回接口 =====

  return {
    // 服务实例
    taskService: readonly(taskService),

    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    isInitialized: readonly(isInitialized),
    pagination: readonly(pagination),
    statistics: readonly(statistics),

    // 数据
    taskTemplates: readonly(taskTemplates),
    activeTaskTemplates: readonly(activeTaskTemplates),
    pausedTaskTemplates: readonly(pausedTaskTemplates),
    taskTemplatesByKeyResult: readonly(taskTemplatesByKeyResult),

    taskInstances: readonly(taskInstances),
    pendingTaskInstances: readonly(pendingTaskInstances),
    completedTaskInstances: readonly(completedTaskInstances),
    cancelledTaskInstances: readonly(cancelledTaskInstances),
    todayTaskInstances: readonly(todayTaskInstances),
    thisWeekTaskInstances: readonly(thisWeekTaskInstances),
    taskInstancesByTemplate: readonly(taskInstancesByTemplate),

    metaTemplates: readonly(metaTemplates),
    metaTemplatesByCategory: readonly(metaTemplatesByCategory),

    // 任务模板操作
    createTaskTemplate,
    createTaskTemplateByTaskMetaTemplate,
    fetchTaskTemplates,
    fetchTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,
    activateTaskTemplate,
    pauseTaskTemplate,

    // 任务实例操作
    createTaskInstance,
    fetchTaskInstances,
    fetchTaskInstance,
    updateTaskInstance,
    deleteTaskInstance,
    completeTaskInstance,
    undoCompleteTaskInstance,
    rescheduleTaskInstance,
    cancelTaskInstance,

    // 查询方法
    searchTaskTemplates,
    searchTaskInstances,
    getTodayTasks,

    // 数据同步
    syncAllTaskData,
    forceRefresh,
    initialize,

    // 工具方法
    clearError,
    clearLocalData,

    // 配置
    autoInitialize,
  };
}

/**
 * 轻量级 Task 模块访问
 * 只提供数据访问，不执行网络操作
 */
export function useTaskData() {
  const taskStore = useTaskStore();

  return {
    // 状态
    isLoading: computed(() => taskStore.isLoading),
    error: computed(() => taskStore.error),
    isInitialized: computed(() => taskStore.isInitialized),

    // 数据访问
    taskTemplates: computed(() => taskStore.getAllTaskTemplates),
    activeTaskTemplates: computed(() =>
      taskStore.getAllTaskTemplates.filter((t) => t.lifecycle?.status === 'active'),
    ),
    pausedTaskTemplates: computed(() =>
      taskStore.getAllTaskTemplates.filter((t) => t.lifecycle?.status === 'paused'),
    ),

    taskInstances: computed(() => taskStore.getAllTaskInstances),
    pendingTaskInstances: computed(() => taskStore.getInstancesByStatus('pending')),
    completedTaskInstances: computed(() => taskStore.getInstancesByStatus('completed')),
    todayTaskInstances: computed(() => taskStore.getTodayTaskInstances),

    metaTemplates: computed(() => taskStore.getAllTaskMetaTemplates),

    // 查询方法
    getTaskTemplateByUuid: taskStore.getTaskTemplateByUuid,
    getTaskInstanceByUuid: taskStore.getTaskInstanceByUuid,
    getTaskTemplatesByKeyResultUuid: taskStore.getTaskTemplatesByKeyResultUuid,
    getTaskInstancesByTemplateUuid: taskStore.getInstancesByTemplateUuid,
    getTaskMetaTemplatesByCategory: taskStore.getMetaTemplatesByCategory,

    // 统计信息
    statistics: computed(() => ({
      totalTemplates: taskStore.getAllTaskTemplates.length,
      activeTemplates: taskStore.getAllTaskTemplates.filter((t) => t.lifecycle?.status === 'active')
        .length,
      pausedTemplates: taskStore.getAllTaskTemplates.filter((t) => t.lifecycle?.status === 'paused')
        .length,
      totalInstances: taskStore.getAllTaskInstances.length,
      pendingInstances: taskStore.getInstancesByStatus('pending').length,
      completedInstances: taskStore.getInstancesByStatus('completed').length,
      todayInstances: taskStore.getTodayTaskInstances.length,
    })),
  };
}
