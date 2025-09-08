import { defineStore } from 'pinia';
import { Goal, GoalDir, goalService, type GoalDirTreeNode } from '@dailyuse/domain-client';
import { type GoalContracts } from '@dailyuse/contracts';

/**
 * Goal 模块的 Pinia Store
 * 使用新的 domain-client 架构
 */
export const useGoalStore = defineStore('goal', {
  state: () => ({
    // 加载状态
    isLoading: false,
    isInitialized: false,

    // 错误状态
    error: null as string | null,

    // 分页状态
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },

    // 过滤和搜索状态
    filters: {
      status: 'all' as 'all' | 'active' | 'completed' | 'paused' | 'archived',
      dirUuid: undefined as string | undefined,
      searchQuery: '',
    },

    // 选中状态
    selectedGoalUuid: null as string | null,
    selectedDirUuid: null as string | null,
  }),

  getters: {
    // ===== 目标查询 =====

    /**
     * 获取所有目标
     */
    getAllGoals(): Goal[] {
      return goalService.getAllGoals();
    },

    /**
     * 根据UUID获取目标
     */
    getGoalByUuid:
      (state) =>
      (uuid: string): Goal | undefined => {
        return goalService.getGoal(uuid);
      },

    /**
     * 根据目录UUID获取目标
     */
    getGoalsByDir(): (dirUuid?: string) => Goal[] {
      return (dirUuid?: string) => goalService.getGoalsByDir(dirUuid);
    },

    /**
     * 根据状态获取目标
     */
    getGoalsByStatus(): (status: 'active' | 'completed' | 'paused' | 'archived') => Goal[] {
      return (status) => goalService.getGoalsByStatus(status);
    },

    /**
     * 获取活跃目标
     */
    getActiveGoals(): Goal[] {
      return goalService.getGoalsByStatus('active');
    },

    /**
     * 获取需要关注的目标
     */
    getGoalsNeedingAttention(): Goal[] {
      return goalService.getGoalsNeedingAttention();
    },

    /**
     * 获取即将截止的目标
     */
    getGoalsDueSoon(): Goal[] {
      return goalService.getGoalsDueSoon();
    },

    /**
     * 获取已逾期的目标
     */
    getOverdueGoals(): Goal[] {
      return goalService.getOverdueGoals();
    },

    /**
     * 获取已暂停的目标
     */
    getPausedGoals(): Goal[] {
      return goalService.getPausedGoals();
    },

    /**
     * 获取当前选中的目标
     */
    getSelectedGoal(state): Goal | undefined {
      return state.selectedGoalUuid ? goalService.getGoal(state.selectedGoalUuid) : undefined;
    },

    // ===== 目录查询 =====

    /**
     * 获取所有目录
     */
    getAllGoalDirs(): GoalDir[] {
      return goalService.getAllGoalDirs();
    },

    /**
     * 根据UUID获取目录
     */
    getGoalDirByUuid:
      (state) =>
      (uuid: string): GoalDir | undefined => {
        return goalService.getGoalDir(uuid);
      },

    /**
     * 根据父目录获取子目录
     */
    getGoalDirsByParent(): (parentUuid?: string) => GoalDir[] {
      return (parentUuid?: string) => goalService.getGoalDirsByParent(parentUuid);
    },

    /**
     * 获取根目录
     */
    getRootGoalDirs(): GoalDir[] {
      return goalService.getRootGoalDirs();
    },

    /**
     * 构建目录树
     */
    getGoalDirTree(): GoalDirTreeNode[] {
      return goalService.buildGoalDirTree();
    },

    /**
     * 获取当前选中的目录
     */
    getSelectedGoalDir(state): GoalDir | undefined {
      return state.selectedDirUuid ? goalService.getGoalDir(state.selectedDirUuid) : undefined;
    },

    // ===== 统计信息 =====

    /**
     * 获取目标统计信息
     */
    getGoalStatistics(): {
      total: number;
      active: number;
      completed: number;
      paused: number;
      archived: number;
      overdue: number;
      dueSoon: number;
      needingAttention: number;
    } {
      return goalService.getGoalStatistics();
    },

    /**
     * 获取目录统计信息
     */
    getGoalDirStatistics(): {
      total: number;
      active: number;
      archived: number;
      system: number;
      user: number;
    } {
      return goalService.getGoalDirStatistics();
    },

    // ===== 过滤后的数据 =====

    /**
     * 获取过滤后的目标列表
     */
    getFilteredGoals(state): Goal[] {
      let goals = goalService.getAllGoals();

      // 按状态过滤
      if (state.filters.status !== 'all') {
        goals = goals.filter((goal) => goal.status === state.filters.status);
      }

      // 按目录过滤
      if (state.filters.dirUuid) {
        goals = goals.filter((goal) => goal.dirUuid === state.filters.dirUuid);
      }

      // 按搜索关键词过滤
      if (state.filters.searchQuery) {
        goals = goalService.searchGoals(state.filters.searchQuery);
      }

      return goals;
    },

    // ===== 检查方法 =====

    /**
     * 检查是否为系统目录
     */
    isSystemGoalDir(): (dirUuid: string) => boolean {
      return (dirUuid: string) => {
        const dir = goalService.getGoalDir(dirUuid);
        return dir?.isSystemDir || false;
      };
    },
  },

  actions: {
    // ===== 初始化 =====

    /**
     * 初始化 Goal Store
     */
    async initialize(): Promise<void> {
      if (this.isInitialized) return;

      try {
        this.isLoading = true;
        this.error = null;

        // 从本地存储加载缓存数据
        goalService.loadFromLocalStorage();

        this.isInitialized = true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : '初始化失败';
        console.error('Goal Store 初始化失败:', error);
      } finally {
        this.isLoading = false;
      }
    },

    // ===== 目标管理 =====

    /**
     * 同步单个目标到本地状态
     */
    syncGoal(goal: Goal): void {
      goalService.addOrUpdateGoal(goal);
      goalService.saveToLocalStorage();
    },

    /**
     * 批量同步目标到本地状态
     */
    syncGoals(goals: Goal[]): void {
      goalService.clearGoals();
      goals.forEach((goal) => goalService.addOrUpdateGoal(goal));
      goalService.saveToLocalStorage();
    },

    /**
     * 从响应数据同步目标
     */
    syncGoalsFromResponses(responses: GoalContracts.GoalResponse[]): void {
      goalService.updateGoalsFromResponses(responses);
      goalService.saveToLocalStorage();
    },

    /**
     * 移除目标
     */
    removeGoal(uuid: string): void {
      goalService.removeGoal(uuid);
      goalService.saveToLocalStorage();

      // 清除选中状态
      if (this.selectedGoalUuid === uuid) {
        this.selectedGoalUuid = null;
      }
    },

    // ===== 目录管理 =====

    /**
     * 同步单个目录到本地状态
     */
    syncGoalDir(goalDir: GoalDir): void {
      goalService.addOrUpdateGoalDir(goalDir);
      goalService.saveToLocalStorage();
    },

    /**
     * 批量同步目录到本地状态
     */
    syncGoalDirs(goalDirs: GoalDir[]): void {
      goalService.clearGoalDirs();
      goalDirs.forEach((dir) => goalService.addOrUpdateGoalDir(dir));
      goalService.saveToLocalStorage();
    },

    /**
     * 从响应数据同步目录
     */
    syncGoalDirsFromResponses(responses: GoalContracts.GoalDirResponse[]): void {
      goalService.updateGoalDirsFromResponses(responses);
      goalService.saveToLocalStorage();
    },

    /**
     * 移除目录
     */
    removeGoalDir(uuid: string): void {
      goalService.removeGoalDir(uuid);
      goalService.saveToLocalStorage();

      // 清除选中状态
      if (this.selectedDirUuid === uuid) {
        this.selectedDirUuid = null;
      }
    },

    // ===== 状态管理 =====

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null): void {
      this.error = error;
    },

    /**
     * 设置分页信息
     */
    setPagination(pagination: Partial<typeof this.pagination>): void {
      this.pagination = { ...this.pagination, ...pagination };
    },

    /**
     * 设置过滤条件
     */
    setFilters(filters: Partial<typeof this.filters>): void {
      this.filters = { ...this.filters, ...filters };
    },

    /**
     * 设置选中的目标
     */
    setSelectedGoal(uuid: string | null): void {
      this.selectedGoalUuid = uuid;
    },

    /**
     * 设置选中的目录
     */
    setSelectedGoalDir(uuid: string | null): void {
      this.selectedDirUuid = uuid;
    },

    /**
     * 重置过滤条件
     */
    resetFilters(): void {
      this.filters = {
        status: 'all',
        dirUuid: undefined,
        searchQuery: '',
      };
    },

    /**
     * 清空所有数据
     */
    clearAll(): void {
      goalService.clearGoals();
      goalService.clearGoalDirs();
      goalService.clearLocalStorage();

      this.selectedGoalUuid = null;
      this.selectedDirUuid = null;
      this.error = null;
      this.resetFilters();
    },

    // ===== 缓存管理 =====

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(): boolean {
      return goalService.shouldRefreshCache();
    },

    /**
     * 保存到本地存储
     */
    saveToLocalStorage(): void {
      goalService.saveToLocalStorage();
    },

    /**
     * 从本地存储加载
     */
    loadFromLocalStorage(): void {
      goalService.loadFromLocalStorage();
    },
  },
});

export type GoalStore = ReturnType<typeof useGoalStore>;
