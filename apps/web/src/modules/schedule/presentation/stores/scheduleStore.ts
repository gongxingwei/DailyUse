import { defineStore } from 'pinia';
import { type ScheduleContracts } from '@dailyuse/contracts';

// 类型定义
interface ScheduleStoreState {
  tasks: ScheduleContracts.ScheduleTaskResponseDto[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    status: string;
    taskType: string;
    enabled: boolean | undefined;
    searchQuery: string;
  };
  selectedTaskUuid: string | null;
  statistics: ScheduleContracts.IScheduleTaskStatistics | null;
}

/**
 * Schedule 模块的 Pinia Store - 纯缓存存储
 * 职责：缓存调度任务数据，提供响应式查询接口
 */
export const useScheduleStore = defineStore('schedule', {
  state: (): ScheduleStoreState => ({
    // ========== 缓存数据 ==========
    tasks: [] as ScheduleContracts.ScheduleTaskResponseDto[],

    // ========== 状态管理 ==========
    isLoading: false,
    isInitialized: false,
    error: null as string | null,
    lastSyncTime: null as Date | null,

    // ========== UI状态 ==========
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      hasMore: false,
    },

    filters: {
      status: '',
      taskType: '',
      enabled: undefined,
      searchQuery: '',
    },

    // 选中状态
    selectedTaskUuid: null as string | null,

    // 统计信息
    statistics: null as ScheduleContracts.IScheduleTaskStatistics | null,
  }),

  getters: {
    // ========== 任务查询 ==========

    /**
     * 获取所有任务
     */
    getAllTasks(): ScheduleContracts.ScheduleTaskResponseDto[] {
      return this.tasks;
    },

    /**
     * 根据UUID获取任务
     */
    getTaskByUuid:
      (state) =>
      (uuid: string): ScheduleContracts.ScheduleTaskResponseDto | undefined => {
        return state.tasks.find((t) => t.uuid === uuid);
      },

    /**
     * 根据状态获取任务
     */
    getTasksByStatus(): (status: string) => ScheduleContracts.ScheduleTaskResponseDto[] {
      return (status: string) => this.tasks.filter((t) => t.status === status);
    },

    /**
     * 获取待执行任务
     */
    getPendingTasks(): ScheduleContracts.ScheduleTaskResponseDto[] {
      return this.tasks.filter((t) => t.status === 'PENDING');
    },

    /**
     * 获取正在运行的任务
     */
    getRunningTasks(): ScheduleContracts.ScheduleTaskResponseDto[] {
      return this.tasks.filter((t) => t.status === 'RUNNING');
    },

    /**
     * 获取已完成任务
     */
    getCompletedTasks(): ScheduleContracts.ScheduleTaskResponseDto[] {
      return this.tasks.filter((t) => t.status === 'COMPLETED');
    },

    /**
     * 获取已启用的任务
     */
    getEnabledTasks(): ScheduleContracts.ScheduleTaskResponseDto[] {
      return this.tasks.filter((t) => t.enabled === true);
    },

    /**
     * 获取已禁用的任务
     */
    getDisabledTasks(): ScheduleContracts.ScheduleTaskResponseDto[] {
      return this.tasks.filter((t) => t.enabled === false);
    },

    /**
     * 获取选中的任务
     */
    getSelectedTask(): ScheduleContracts.ScheduleTaskResponseDto | null {
      if (!this.selectedTaskUuid) return null;
      return this.getTaskByUuid(this.selectedTaskUuid) || null;
    },

    /**
     * 是否需要刷新缓存
     * 10分钟后数据过期
     */
    shouldRefreshCache(): boolean {
      if (!this.lastSyncTime) return true;
      const now = new Date();
      const diff = now.getTime() - this.lastSyncTime.getTime();
      return diff > 10 * 60 * 1000; // 10分钟
    },
  },

  actions: {
    // ========== 状态管理 ==========

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * 设置初始化状态
     */
    setInitialized(initialized: boolean) {
      this.isInitialized = initialized;
    },

    /**
     * 更新最后同步时间
     */
    updateLastSyncTime() {
      this.lastSyncTime = new Date();
    },

    // ========== 任务管理 ==========

    /**
     * 设置任务列表
     */
    setTasks(tasks: ScheduleContracts.ScheduleTaskResponseDto[]) {
      this.tasks = tasks;
      this.updateLastSyncTime();
    },

    /**
     * 添加任务
     */
    addTask(task: ScheduleContracts.ScheduleTaskResponseDto) {
      this.tasks.unshift(task);
    },

    /**
     * 更新任务
     */
    updateTask(uuid: string, task: Partial<ScheduleContracts.ScheduleTaskResponseDto>) {
      const index = this.tasks.findIndex((t) => t.uuid === uuid);
      if (index >= 0) {
        this.tasks[index] = { ...this.tasks[index], ...task };
      }
    },

    /**
     * 删除任务
     */
    removeTask(uuid: string) {
      this.tasks = this.tasks.filter((t) => t.uuid !== uuid);
    },

    /**
     * 批量更新任务
     */
    batchUpdateTasks(uuids: string[], updates: Partial<ScheduleContracts.ScheduleTaskResponseDto>) {
      uuids.forEach((uuid) => {
        this.updateTask(uuid, updates);
      });
    },

    // ========== 选择管理 ==========

    /**
     * 选择任务
     */
    selectTask(uuid: string | null) {
      this.selectedTaskUuid = uuid;
    },

    /**
     * 清除选择
     */
    clearSelection() {
      this.selectedTaskUuid = null;
    },

    // ========== 分页管理 ==========

    /**
     * 设置分页信息
     */
    setPagination(pagination: Partial<ScheduleStoreState['pagination']>) {
      this.pagination = { ...this.pagination, ...pagination };
    },

    // ========== 过滤器管理 ==========

    /**
     * 设置过滤器
     */
    setFilters(filters: Partial<ScheduleStoreState['filters']>) {
      this.filters = { ...this.filters, ...filters };
    },

    /**
     * 清除过滤器
     */
    clearFilters() {
      this.filters = {
        status: '',
        taskType: '',
        enabled: undefined,
        searchQuery: '',
      };
    },

    // ========== 统计信息 ==========

    /**
     * 设置统计信息
     */
    setStatistics(statistics: ScheduleContracts.IScheduleTaskStatistics) {
      this.statistics = statistics;
    },

    // ========== 重置 ==========

    /**
     * 重置所有状态
     */
    resetStore() {
      this.tasks = [];
      this.isLoading = false;
      this.isInitialized = false;
      this.error = null;
      this.lastSyncTime = null;
      this.pagination = {
        page: 1,
        limit: 50,
        total: 0,
        hasMore: false,
      };
      this.filters = {
        status: '',
        taskType: '',
        enabled: undefined,
        searchQuery: '',
      };
      this.selectedTaskUuid = null;
      this.statistics = null;
    },
  },
});

/**
 * 获取 Schedule Store 实例
 */
export function getScheduleStore() {
  return useScheduleStore();
}
