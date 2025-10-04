/**
 * Schedule 业务逻辑 Composable - 新架构
 * @description 基于缓存优先的数据获取策略，整合 Store 和 ApplicationService
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { ref, computed, reactive } from 'vue';
import type { ScheduleContracts } from '@dailyuse/contracts';
import { getScheduleWebService } from '../../application/services/ScheduleWebApplicationService';
import { getScheduleStore } from '../stores/scheduleStore';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';

/**
 * Schedule 业务逻辑 Composable
 * 基于缓存优先的数据获取策略
 */
export function useSchedule() {
  const scheduleService = getScheduleWebService();
  const scheduleStore = getScheduleStore();
  const snackbar = useSnackbar();

  // ===== 响应式状态 - 从 Store 获取 =====
  const isLoading = computed(() => scheduleStore.isLoading);
  const tasks = computed(() => scheduleStore.getAllTasks);
  const currentTask = computed(() => scheduleStore.getSelectedTask);
  const statistics = computed(() => scheduleStore.statistics);

  // ===== 本地 UI 状态 =====
  const editingTask = ref<ScheduleContracts.ScheduleTaskResponseDto | null>(null);
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const searchQuery = ref('');
  const filters = reactive({
    status: '',
    taskType: '',
    priority: '',
  });

  // ===== 缓存优先的数据获取方法 =====

  /**
   * 获取调度任务列表 - 缓存优先策略
   * @param forceRefresh 是否强制从API刷新
   * @param params 查询参数
   */
  const fetchTasks = async (
    forceRefresh = false,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      taskType?: string;
      priority?: string;
      search?: string;
    },
  ) => {
    try {
      // 检查是否需要刷新数据
      const needsRefresh =
        forceRefresh ||
        !scheduleStore.isInitialized ||
        scheduleStore.tasks.length === 0 ||
        scheduleStore.shouldRefreshCache;

      if (needsRefresh) {
        // 从 API 获取数据
        await scheduleService.getScheduleTasks(params);
      }

      return scheduleStore.getAllTasks;
    } catch (error) {
      snackbar.showError('获取调度任务列表失败');
      throw error;
    }
  };

  /**
   * 获取调度任务详情 - 缓存优先策略
   * @param uuid 任务UUID
   * @param forceRefresh 是否强制从API刷新
   */
  const fetchTaskById = async (uuid: string, forceRefresh = false) => {
    try {
      // 先从缓存中查找
      const cachedTask = scheduleStore.getTaskByUuid(uuid);

      if (cachedTask && !forceRefresh) {
        scheduleStore.selectedTaskUuid = uuid;
        return cachedTask;
      }

      // 从API获取任务详情
      const response = await scheduleService.getScheduleTask(uuid);

      if (response) {
        scheduleStore.selectedTaskUuid = uuid;
      }

      return response;
    } catch (error) {
      snackbar.showError('获取调度任务详情失败');
      throw error;
    }
  };

  /**
   * 获取调度统计信息
   * @param forceRefresh 是否强制刷新
   */
  const fetchStatistics = async (forceRefresh = false) => {
    try {
      const needsRefresh =
        forceRefresh || !scheduleStore.statistics || scheduleStore.shouldRefreshCache;

      if (needsRefresh) {
        await scheduleService.getStatistics();
      }

      return scheduleStore.statistics;
    } catch (error) {
      snackbar.showError('获取调度统计信息失败');
      throw error;
    }
  };

  /**
   * 初始化调度模块数据
   */
  const initializeData = async () => {
    try {
      await scheduleService.initializeModule();
      snackbar.showSuccess(`Schedule 数据初始化完成: ${scheduleStore.tasks.length} 个调度任务`);
    } catch (error) {
      snackbar.showError('Schedule 数据初始化失败');
      throw error;
    }
  };

  // ===== Schedule Task CRUD 操作 =====

  /**
   * 创建调度任务
   */
  const createScheduleTask = async (data: ScheduleContracts.CreateScheduleTaskRequestDto) => {
    try {
      const response = await scheduleService.createScheduleTask(data);
      showCreateDialog.value = false;

      snackbar.showSuccess('调度任务创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建调度任务失败');
      throw error;
    }
  };

  /**
   * 更新调度任务
   */
  const updateScheduleTask = async (
    uuid: string,
    data: ScheduleContracts.UpdateScheduleTaskRequestDto,
  ) => {
    try {
      const response = await scheduleService.updateScheduleTask(uuid, data);
      showEditDialog.value = false;
      editingTask.value = null;

      snackbar.showSuccess('调度任务更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新调度任务失败');
      throw error;
    }
  };

  /**
   * 删除调度任务
   */
  const deleteScheduleTask = async (uuid: string) => {
    try {
      await scheduleService.deleteScheduleTask(uuid);

      // 如果删除的是当前任务，清除选中状态
      if (currentTask.value?.uuid === uuid) {
        scheduleStore.selectedTaskUuid = null;
      }

      snackbar.showSuccess('调度任务删除成功');
    } catch (error) {
      snackbar.showError('删除调度任务失败');
      throw error;
    }
  };

  // ===== Schedule Task 操作 =====

  /**
   * 启用调度任务
   */
  const enableScheduleTask = async (uuid: string) => {
    try {
      const response = await scheduleService.enableScheduleTask(uuid);

      // 刷新任务状态
      await fetchTaskById(uuid, true);

      snackbar.showSuccess('调度任务已启用');
      return response;
    } catch (error) {
      snackbar.showError('启用调度任务失败');
      throw error;
    }
  };

  /**
   * 禁用调度任务
   */
  const disableScheduleTask = async (uuid: string) => {
    try {
      const response = await scheduleService.disableScheduleTask(uuid);

      // 刷新任务状态
      await fetchTaskById(uuid, true);

      snackbar.showSuccess('调度任务已禁用');
      return response;
    } catch (error) {
      snackbar.showError('禁用调度任务失败');
      throw error;
    }
  };

  /**
   * 暂停调度任务
   */
  const pauseScheduleTask = async (uuid: string) => {
    try {
      const response = await scheduleService.pauseScheduleTask(uuid);

      // 刷新任务状态
      await fetchTaskById(uuid, true);

      snackbar.showSuccess('调度任务已暂停');
      return response;
    } catch (error) {
      snackbar.showError('暂停调度任务失败');
      throw error;
    }
  };

  /**
   * 恢复调度任务
   */
  const resumeScheduleTask = async (uuid: string) => {
    try {
      const response = await scheduleService.resumeScheduleTask(uuid);

      // 刷新任务状态
      await fetchTaskById(uuid, true);

      snackbar.showSuccess('调度任务已恢复');
      return response;
    } catch (error) {
      snackbar.showError('恢复调度任务失败');
      throw error;
    }
  };

  /**
   * 手动执行调度任务
   */
  const executeScheduleTask = async (uuid: string) => {
    try {
      const response = await scheduleService.executeScheduleTask(uuid);

      snackbar.showSuccess('调度任务已手动执行');
      return response;
    } catch (error) {
      snackbar.showError('执行调度任务失败');
      throw error;
    }
  };

  // ===== Reminder 操作 =====

  /**
   * 打盹提醒
   */
  const snoozeReminder = async (uuid: string, snoozeDuration: number) => {
    try {
      const response = await scheduleService.snoozeReminder(uuid, {
        taskUuid: uuid,
        snoozeMinutes: snoozeDuration,
      });

      snackbar.showSuccess(`提醒已推迟 ${snoozeDuration} 分钟`);
      return response;
    } catch (error) {
      snackbar.showError('推迟提醒失败');
      throw error;
    }
  };

  // ===== 批量操作 =====

  // ===== Computed Getters - 从 Store =====

  /**
   * 获取启用的任务
   */
  const enabledTasks = computed(() => scheduleStore.getEnabledTasks);

  /**
   * 获取禁用的任务
   */
  const disabledTasks = computed(() => scheduleStore.getDisabledTasks);

  /**
   * 获取待处理的任务
   */
  const pendingTasks = computed(() => scheduleStore.getPendingTasks);

  /**
   * 获取正在运行的任务
   */
  const runningTasks = computed(() => scheduleStore.getRunningTasks);

  /**
   * 获取已完成的任务
   */
  const completedTasks = computed(() => scheduleStore.getCompletedTasks);

  // ===== 高级功能 =====

  /**
   * 切换调度任务状态 (启用/禁用)
   */
  const toggleTaskStatus = async (uuid: string, currentStatus: string) => {
    if (currentStatus === 'ACTIVE') {
      return disableScheduleTask(uuid);
    } else {
      return enableScheduleTask(uuid);
    }
  };

  /**
   * 获取调度任务概览数据
   */
  const getScheduleOverview = async () => {
    try {
      const [taskList, stats] = await Promise.all([
        fetchTasks(false, { limit: 10 }),
        fetchStatistics(false),
      ]);

      return {
        tasks: taskList,
        statistics: stats,
      };
    } catch (error) {
      snackbar.showError('获取调度概览数据失败');
      throw error;
    }
  };

  // ===== UI Dialog 管理 =====

  /**
   * 打开创建对话框
   */
  const openCreateDialog = () => {
    showCreateDialog.value = true;
  };

  /**
   * 关闭创建对话框
   */
  const closeCreateDialog = () => {
    showCreateDialog.value = false;
  };

  /**
   * 打开编辑对话框
   */
  const openEditDialog = (task: ScheduleContracts.ScheduleTaskResponseDto) => {
    editingTask.value = task;
    showEditDialog.value = true;
  };

  /**
   * 关闭编辑对话框
   */
  const closeEditDialog = () => {
    showEditDialog.value = false;
    editingTask.value = null;
  };

  // ===== 返回值 =====
  return {
    // ===== 响应式状态 =====
    isLoading,
    tasks,
    currentTask,
    statistics,

    // ===== 本地状态 =====
    editingTask,
    showCreateDialog,
    showEditDialog,
    searchQuery,
    filters,

    // ===== 数据获取方法 =====
    fetchTasks,
    fetchTaskById,
    fetchStatistics,
    initializeData,

    // ===== CRUD 操作 =====
    createScheduleTask,
    updateScheduleTask,
    deleteScheduleTask,

    // ===== Task 操作 =====
    enableScheduleTask,
    disableScheduleTask,
    pauseScheduleTask,
    resumeScheduleTask,
    executeScheduleTask,

    // ===== Reminder 操作 =====
    snoozeReminder,

    // ===== Computed Getters =====
    enabledTasks,
    disabledTasks,
    pendingTasks,
    runningTasks,
    completedTasks,

    // ===== UI Dialog 管理 =====
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
  };
}
