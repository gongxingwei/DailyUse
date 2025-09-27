/**
 * Schedule 业务逻辑 Composable
 * @description 遵循DDD架构原则：Composable负责UI状态和用户反馈，ApplicationService负责业务逻辑
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { ref, computed, reactive } from 'vue';
import type {
  CreateScheduleTaskRequestApi,
  UpdateScheduleTaskRequestApi,
  ScheduleTaskApi,
  ScheduleExecutionApi,
  ScheduleStatisticsResponse,
  ScheduleTaskActionResponse,
  SSEConnectionInfo,
} from '@dailyuse/contracts/modules/schedule';
import { getScheduleWebService } from '../../application/services/ScheduleWebApplicationService';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';

/**
 * Schedule 业务逻辑 Composable - 新架构
 * 基于DDD架构的Schedule模块逻辑封装
 */
export function useSchedule() {
  const scheduleService = getScheduleWebService();
  const snackbar = useSnackbar();

  // ===== 本地状态 =====
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const editingTask = ref<ScheduleTaskApi | null>(null);
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const searchQuery = ref('');
  const filters = reactive({
    status: '',
    taskType: '',
    priority: '',
    search: '',
  });

  // ===== 数据状态 =====
  const tasks = ref<ScheduleTaskApi[]>([]);
  const executions = ref<ScheduleExecutionApi[]>([]);
  const statistics = ref<ScheduleStatisticsResponse | null>(null);
  const currentTask = ref<ScheduleTaskApi | null>(null);

  // ===== 工具函数 =====
  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  const setError = (err: string | null) => {
    error.value = err;
  };

  // ===== Schedule Task CRUD 操作 =====

  /**
   * 创建调度任务
   */
  const createScheduleTask = async (
    request: CreateScheduleTaskRequestApi,
  ): Promise<ScheduleTaskApi> => {
    try {
      setLoading(true);
      setError(null);

      const task = await scheduleService.createScheduleTask(request);

      // 更新本地状态
      tasks.value.push(task);
      showCreateDialog.value = false;

      snackbar.showSuccess('调度任务创建成功');
      return task;
    } catch (error) {
      snackbar.showError('调度任务创建失败');
      setError('创建调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取调度任务列表
   */
  const getScheduleTasks = async (
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      taskType?: string;
      priority?: string;
      search?: string;
    },
    showFeedback = false,
  ): Promise<ScheduleTaskApi[]> => {
    try {
      if (showFeedback) setLoading(true);
      setError(null);

      const taskList = await scheduleService.getScheduleTasks(params);

      // 更新本地状态
      tasks.value = taskList;

      return taskList;
    } catch (error) {
      if (showFeedback) snackbar.showError('获取调度任务列表失败');
      setError('获取调度任务列表失败');
      throw error;
    } finally {
      if (showFeedback) setLoading(false);
    }
  };

  /**
   * 获取单个调度任务
   */
  const getScheduleTask = async (
    taskId: string,
    showFeedback = false,
  ): Promise<ScheduleTaskApi> => {
    try {
      if (showFeedback) setLoading(true);
      setError(null);

      const task = await scheduleService.getScheduleTask(taskId);

      // 更新当前任务
      currentTask.value = task;

      return task;
    } catch (error) {
      if (showFeedback) snackbar.showError('获取调度任务详情失败');
      setError('获取调度任务详情失败');
      throw error;
    } finally {
      if (showFeedback) setLoading(false);
    }
  };

  /**
   * 更新调度任务
   */
  const updateScheduleTask = async (
    taskId: string,
    request: UpdateScheduleTaskRequestApi,
  ): Promise<ScheduleTaskApi> => {
    try {
      setLoading(true);
      setError(null);

      const task = await scheduleService.updateScheduleTask(taskId, request);

      // 更新本地状态
      const index = tasks.value.findIndex((t) => t.id === taskId);
      if (index >= 0) {
        tasks.value[index] = task;
      }

      if (currentTask.value?.id === taskId) {
        currentTask.value = task;
      }

      showEditDialog.value = false;
      editingTask.value = null;

      snackbar.showSuccess('调度任务更新成功');
      return task;
    } catch (error) {
      snackbar.showError('调度任务更新失败');
      setError('更新调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除调度任务
   */
  const deleteScheduleTask = async (taskId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await scheduleService.deleteScheduleTask(taskId);

      // 更新本地状态
      tasks.value = tasks.value.filter((t) => t.id !== taskId);

      if (currentTask.value?.id === taskId) {
        currentTask.value = null;
      }

      snackbar.showSuccess('调度任务删除成功');
    } catch (error) {
      snackbar.showError('调度任务删除失败');
      setError('删除调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===== Schedule Task 操作 =====

  /**
   * 暂停调度任务
   */
  const pauseScheduleTask = async (taskId: string): Promise<ScheduleTaskActionResponse> => {
    try {
      setLoading(true);
      setError(null);

      const result = await scheduleService.pauseScheduleTask(taskId);

      // 刷新任务状态
      await getScheduleTask(taskId);

      snackbar.showSuccess('调度任务已暂停');
      return result;
    } catch (error) {
      snackbar.showError('暂停调度任务失败');
      setError('暂停调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 启用调度任务
   */
  const enableScheduleTask = async (taskId: string): Promise<ScheduleTaskActionResponse> => {
    try {
      setLoading(true);
      setError(null);

      const result = await scheduleService.enableScheduleTask(taskId);

      // 刷新任务状态
      await getScheduleTask(taskId);

      snackbar.showSuccess('调度任务已启用');
      return result;
    } catch (error) {
      snackbar.showError('启用调度任务失败');
      setError('启用调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 手动执行调度任务
   */
  const executeScheduleTask = async (taskId: string): Promise<ScheduleTaskActionResponse> => {
    try {
      setLoading(true);
      setError(null);

      const result = await scheduleService.executeScheduleTask(taskId);

      snackbar.showSuccess('调度任务执行已启动');
      return result;
    } catch (error) {
      snackbar.showError('执行调度任务失败');
      setError('执行调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===== Schedule Execution History =====

  /**
   * 获取调度执行历史
   */
  const getScheduleExecutions = async (
    params?: {
      taskId?: string;
      status?: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    showFeedback = false,
  ): Promise<ScheduleExecutionApi[]> => {
    try {
      if (showFeedback) setLoading(true);
      setError(null);

      const executionList = await scheduleService.getScheduleExecutions(params);

      // 更新本地状态
      executions.value = executionList;

      return executionList;
    } catch (error) {
      if (showFeedback) snackbar.showError('获取执行历史失败');
      setError('获取执行历史失败');
      throw error;
    } finally {
      if (showFeedback) setLoading(false);
    }
  };

  /**
   * 获取单个执行记录
   */
  const getScheduleExecution = async (executionId: string): Promise<ScheduleExecutionApi> => {
    try {
      setLoading(true);
      setError(null);

      const execution = await scheduleService.getScheduleExecution(executionId);

      return execution;
    } catch (error) {
      snackbar.showError('获取执行记录详情失败');
      setError('获取执行记录详情失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===== Schedule Statistics =====

  /**
   * 获取调度统计信息
   */
  const getScheduleStatistics = async (
    showFeedback = false,
  ): Promise<ScheduleStatisticsResponse> => {
    try {
      if (showFeedback) setLoading(true);
      setError(null);

      const stats = await scheduleService.getScheduleStatistics();

      // 更新本地状态
      statistics.value = stats;

      return stats;
    } catch (error) {
      if (showFeedback) snackbar.showError('获取调度统计信息失败');
      setError('获取调度统计信息失败');
      throw error;
    } finally {
      if (showFeedback) setLoading(false);
    }
  };

  // ===== SSE Connection =====

  /**
   * 获取SSE连接信息
   */
  const getSSEConnection = async (): Promise<SSEConnectionInfo> => {
    try {
      setLoading(true);
      setError(null);

      const connection = await scheduleService.getSSEConnection();

      return connection;
    } catch (error) {
      snackbar.showError('获取实时连接信息失败');
      setError('获取实时连接信息失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===== Validation & Preview =====

  /**
   * 验证Cron表达式
   */
  const validateCronExpression = async (
    expression: string,
  ): Promise<{ valid: boolean; nextRuns?: string[]; error?: string }> => {
    try {
      setError(null);

      const result = await scheduleService.validateCronExpression(expression);

      return result;
    } catch (error) {
      snackbar.showError('验证Cron表达式失败');
      setError('验证Cron表达式失败');
      throw error;
    }
  };

  /**
   * 预览调度任务执行时间
   */
  const previewScheduleTask = async (
    request: Partial<CreateScheduleTaskRequestApi>,
  ): Promise<{
    nextExecutions: string[];
    scheduleDescription: string;
  }> => {
    try {
      setError(null);

      const result = await scheduleService.previewScheduleTask(request);

      return result;
    } catch (error) {
      snackbar.showError('预览调度时间失败');
      setError('预览调度任务失败');
      throw error;
    }
  };

  // ===== Batch Operations =====

  /**
   * 批量操作调度任务
   */
  const batchOperateScheduleTasks = async (
    taskIds: string[],
    operation: 'pause' | 'enable' | 'delete',
  ): Promise<{ success: string[]; failed: string[] }> => {
    try {
      setLoading(true);
      setError(null);

      const result = await scheduleService.batchOperateScheduleTasks(taskIds, operation);

      const operationNames = {
        pause: '暂停',
        enable: '启用',
        delete: '删除',
      };

      if (result.success.length > 0) {
        snackbar.showSuccess(`成功${operationNames[operation]} ${result.success.length} 个任务`);
      }

      if (result.failed.length > 0) {
        snackbar.showWarning(`${result.failed.length} 个任务操作失败`);
      }

      // 刷新任务列表
      await getScheduleTasks();

      return result;
    } catch (error) {
      snackbar.showError('批量操作失败');
      setError('批量操作调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===== Health & Monitoring =====

  /**
   * 获取调度器健康状态
   */
  const getSchedulerHealth = async (): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    runningTasks: number;
    queuedTasks: number;
    lastHeartbeat: string;
  }> => {
    try {
      setError(null);

      const health = await scheduleService.getSchedulerHealth();

      return health;
    } catch (error) {
      // 健康检查失败通常不需要用户提示，这是后台操作
      setError('获取调度器健康状态失败');
      throw error;
    }
  };

  // ===== 高级功能 =====

  /**
   * 快速创建简单的调度任务
   */
  const createQuickScheduleTask = async (options: {
    name: string;
    description?: string;
    cronExpression: string;
    taskType: string;
    payload?: any;
  }): Promise<ScheduleTaskApi> => {
    try {
      setLoading(true);
      setError(null);

      const task = await scheduleService.createQuickScheduleTask(options);

      // 更新本地状态
      tasks.value.push(task);

      snackbar.showSuccess('快速调度任务创建成功');
      return task;
    } catch (error) {
      snackbar.showError('快速创建调度任务失败');
      setError('快速创建调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 切换调度任务状态 (启用/暂停)
   */
  const toggleScheduleTaskStatus = async (
    taskId: string,
    currentStatus: string,
  ): Promise<ScheduleTaskActionResponse> => {
    try {
      setLoading(true);
      setError(null);

      const result = await scheduleService.toggleScheduleTaskStatus(taskId, currentStatus);

      // 刷新任务状态
      await getScheduleTask(taskId);

      const action = currentStatus === 'ACTIVE' ? '暂停' : '启用';
      snackbar.showSuccess(`调度任务${action}成功`);

      return result;
    } catch (error) {
      const action = currentStatus === 'ACTIVE' ? '暂停' : '启用';
      snackbar.showError(`${action}调度任务失败`);
      setError(`${action}调度任务失败`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取调度任务概览数据
   */
  const getScheduleOverview = async (
    showFeedback = true,
  ): Promise<{
    tasks: ScheduleTaskApi[];
    statistics: ScheduleStatisticsResponse;
    recentExecutions: ScheduleExecutionApi[];
    health: any;
  }> => {
    try {
      if (showFeedback) setLoading(true);
      setError(null);

      const overview = await scheduleService.getScheduleOverview();

      // 更新本地状态
      tasks.value = overview.tasks;
      statistics.value = overview.statistics;
      executions.value = overview.recentExecutions;

      return overview;
    } catch (error) {
      if (showFeedback) snackbar.showError('获取调度概览数据失败');
      setError('获取调度概览数据失败');
      throw error;
    } finally {
      if (showFeedback) setLoading(false);
    }
  };

  /**
   * 清理已完成的调度任务
   */
  const cleanupCompletedTasks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const completedTasks = await scheduleService.getScheduleTasks({ status: 'COMPLETED' });

      if (completedTasks.length > 0) {
        await scheduleService.cleanupCompletedTasks();
        snackbar.showSuccess(`已清理 ${completedTasks.length} 个已完成的任务`);

        // 刷新任务列表
        await getScheduleTasks();
      } else {
        snackbar.showInfo('没有需要清理的已完成任务');
      }
    } catch (error) {
      snackbar.showError('清理已完成任务失败');
      setError('清理已完成任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===== 搜索和筛选 =====

  /**
   * 搜索调度任务
   */
  const searchScheduleTasks = async (
    query: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      taskType?: string;
      priority?: string;
    },
  ): Promise<ScheduleTaskApi[]> => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: query,
        ...options,
      };

      const searchResults = await scheduleService.getScheduleTasks(params);

      // 更新本地状态
      tasks.value = searchResults;

      return searchResults;
    } catch (error) {
      snackbar.showError('搜索调度任务失败');
      setError('搜索调度任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 应用筛选器
   */
  const applyFilters = async (): Promise<void> => {
    const params = {
      ...filters,
      // 移除空值
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== '')),
    };

    await getScheduleTasks(params, true); // 显示加载状态
  };

  /**
   * 清除筛选器
   */
  const clearFilters = async (): Promise<void> => {
    Object.assign(filters, {
      status: '',
      taskType: '',
      priority: '',
      search: '',
    });

    await getScheduleTasks({}, true); // 强制刷新以清除筛选条件
  };

  // ===== UI 交互方法 =====

  /**
   * 打开创建对话框
   */
  const openCreateDialog = () => {
    editingTask.value = null;
    showCreateDialog.value = true;
  };

  /**
   * 打开编辑对话框
   */
  const openEditDialog = (task: ScheduleTaskApi) => {
    editingTask.value = task;
    showEditDialog.value = true;
  };

  /**
   * 关闭对话框
   */
  const closeDialogs = () => {
    showCreateDialog.value = false;
    showEditDialog.value = false;
    editingTask.value = null;
  };

  /**
   * 选择任务
   */
  const selectTask = (task: ScheduleTaskApi) => {
    currentTask.value = task;
  };

  /**
   * 清除选择
   */
  const clearSelection = () => {
    currentTask.value = null;
  };

  // ===== 工具方法 =====

  /**
   * 手动刷新所有数据
   */
  const refresh = async (): Promise<void> => {
    try {
      await getScheduleOverview(false); // 不显示加载状态，避免UI闪烁
      snackbar.showInfo('数据刷新完成');
    } catch (error) {
      snackbar.showError('数据刷新失败');
      throw error;
    }
  };

  /**
   * 初始化数据
   */
  const initialize = async (): Promise<void> => {
    try {
      await getScheduleOverview(true); // 显示加载状态
      snackbar.showSuccess('Schedule 模块初始化完成');
    } catch (error) {
      snackbar.showError('Schedule 模块初始化失败');
      throw error;
    }
  };

  // ===== 计算属性 =====

  /**
   * 过滤后的任务列表
   */
  const filteredTasks = computed(() => {
    let result = tasks.value;

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (task) =>
          task.name?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query),
      );
    }

    if (filters.status) {
      result = result.filter((task) => task.status === filters.status);
    }

    if (filters.taskType) {
      result = result.filter((task) => task.taskType === filters.taskType);
    }

    if (filters.priority) {
      result = result.filter((task) => task.priority === filters.priority);
    }

    return result;
  });

  /**
   * 任务统计信息
   */
  const taskStats = computed(() => {
    const total = tasks.value.length;
    const active = tasks.value.filter((t) => t.status === 'ACTIVE').length;
    const paused = tasks.value.filter((t) => t.status === 'PAUSED').length;
    const completed = tasks.value.filter((t) => t.status === 'COMPLETED').length;
    const failed = tasks.value.filter((t) => t.status === 'FAILED').length;

    return {
      total,
      active,
      paused,
      completed,
      failed,
    };
  });

  /**
   * 是否有选中的任务
   */
  const hasSelection = computed(() => !!currentTask.value);

  return {
    // 响应式状态
    isLoading,
    error,
    tasks,
    executions,
    statistics,
    currentTask,
    filteredTasks,
    taskStats,
    hasSelection,

    // 本地状态
    editingTask,
    showCreateDialog,
    showEditDialog,
    searchQuery,
    filters,

    // Schedule Task CRUD 操作
    createScheduleTask,
    getScheduleTasks,
    getScheduleTask,
    updateScheduleTask,
    deleteScheduleTask,

    // Schedule Task 操作
    pauseScheduleTask,
    enableScheduleTask,
    executeScheduleTask,

    // Schedule Execution History
    getScheduleExecutions,
    getScheduleExecution,

    // Schedule Statistics
    getScheduleStatistics,

    // SSE Connection
    getSSEConnection,

    // Validation & Preview
    validateCronExpression,
    previewScheduleTask,

    // Batch Operations
    batchOperateScheduleTasks,

    // Health & Monitoring
    getSchedulerHealth,

    // 高级功能
    createQuickScheduleTask,
    toggleScheduleTaskStatus,
    getScheduleOverview,
    cleanupCompletedTasks,

    // 搜索和筛选
    searchScheduleTasks,
    applyFilters,
    clearFilters,

    // UI 交互
    openCreateDialog,
    openEditDialog,
    closeDialogs,
    selectTask,
    clearSelection,

    // 工具方法
    refresh,
    initialize,
  };
}
