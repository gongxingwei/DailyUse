import { defineStore } from 'pinia';
import { Goal, GoalDir } from '@dailyuse/domain-client';
import { type GoalContracts } from '@dailyuse/contracts';

/**
 * Goal 模块的 Pinia Store - 纯缓存存储
 * 职责：缓存目标和目录数据，提供响应式查询接口
 */
export const useGoalStore = defineStore('goal', {
  state: () => ({
    // ===== 缓存数据 =====
    goals: [] as any[], // 暂时使用 any 避免类型冲突
    goalDirs: [] as any[], // 暂时使用 any 避免类型冲突

    // ===== 状态管理 =====
    isLoading: false,
    isInitialized: false,
    error: null as string | null,
    lastSyncTime: null as Date | null,

    // ===== UI状态 =====
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },

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
    getAllGoals(): any[] {
      return this.goals;
    },

    /**
     * 根据UUID获取目标
     */
    getGoalByUuid:
      (state) =>
      (uuid: string): any | undefined => {
        return state.goals.find((g) => g.uuid === uuid);
      },

    /**
     * 根据目录UUID获取目标
     */
    getGoalsByDir(): (dirUuid?: string) => any[] {
      return (dirUuid?: string) => {
        if (!dirUuid) {
          return this.goals.filter((g) => !g.dirUuid);
        }
        return this.goals.filter((g) => g.dirUuid === dirUuid);
      };
    },

    /**
     * 根据状态获取目标
     */
    getGoalsByStatus(): (status: 'active' | 'completed' | 'paused' | 'archived') => any[] {
      return (status) => this.goals.filter((g) => g.lifecycle?.status === status);
    },

    /**
     * 获取活跃目标
     */
    getActiveGoals(): any[] {
      return this.goals.filter((g) => g.lifecycle?.status === 'active');
    },

    /**
     * 获取需要关注的目标
     */
    getGoalsNeedingAttention(): any[] {
      const now = new Date();
      return this.goals.filter((goal) => {
        // 逾期的目标
        if (goal.endTime && goal.endTime < now && goal.lifecycle?.status === 'active') {
          return true;
        }
        return false;
      });
    },

    /**
     * 获取即将截止的目标
     */
    getGoalsDueSoon(): any[] {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      return this.goals.filter(
        (goal) =>
          goal.endTime &&
          goal.endTime >= now &&
          goal.endTime <= threeDaysLater &&
          goal.lifecycle?.status === 'active',
      );
    },

    /**
     * 获取已逾期的目标
     */
    getOverdueGoals(): any[] {
      const now = new Date();
      return this.goals.filter(
        (goal) => goal.endTime && goal.endTime < now && goal.lifecycle?.status === 'active',
      );
    },

    /**
     * 获取已暂停的目标
     */
    getPausedGoals(): any[] {
      return this.goals.filter((g) => g.lifecycle?.status === 'paused');
    },

    /**
     * 获取当前选中的目标
     */
    getSelectedGoal(state): any | undefined {
      return state.selectedGoalUuid
        ? state.goals.find((g) => g.uuid === state.selectedGoalUuid)
        : undefined;
    },

    // ===== 目录查询 =====

    /**
     * 获取所有目录
     */
    getAllGoalDirs(): any[] {
      return this.goalDirs;
    },

    /**
     * 根据UUID获取目录
     */
    getGoalDirByUuid:
      (state) =>
      (uuid: string): any | undefined => {
        return state.goalDirs.find((d) => d.uuid === uuid);
      },

    /**
     * 根据父目录获取子目录
     */
    getGoalDirsByParent(): (parentUuid?: string) => any[] {
      return (parentUuid?: string) => {
        if (!parentUuid) {
          return this.goalDirs.filter((d) => !d.parentUuid);
        }
        return this.goalDirs.filter((d) => d.parentUuid === parentUuid);
      };
    },

    /**
     * 获取根目录
     */
    getRootGoalDirs(): any[] {
      return this.goalDirs.filter((d) => !d.parentUuid);
    },

    /**
     * 获取当前选中的目录
     */
    getSelectedGoalDir(state): any | undefined {
      return state.selectedDirUuid
        ? state.goalDirs.find((d) => d.uuid === state.selectedDirUuid)
        : undefined;
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
      return {
        total: this.goals.length,
        active: this.getActiveGoals.length,
        completed: this.getGoalsByStatus('completed').length,
        paused: this.getGoalsByStatus('paused').length,
        archived: this.getGoalsByStatus('archived').length,
        overdue: this.getOverdueGoals.length,
        dueSoon: this.getGoalsDueSoon.length,
        needingAttention: this.getGoalsNeedingAttention.length,
      };
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
      const activeDirs = this.goalDirs.filter((d) => d.lifecycle?.status === 'active');
      const archivedDirs = this.goalDirs.filter((d) => d.lifecycle?.status === 'archived');
      const systemDirs = this.goalDirs.filter((d) => d.isSystemDir);
      const userDirs = this.goalDirs.filter((d) => !d.isSystemDir);

      return {
        total: this.goalDirs.length,
        active: activeDirs.length,
        archived: archivedDirs.length,
        system: systemDirs.length,
        user: userDirs.length,
      };
    },

    // ===== 过滤后的数据 =====

    /**
     * 获取过滤后的目标列表
     */
    getFilteredGoals(state): any[] {
      let goals = this.goals;

      // 按状态过滤
      if (state.filters.status !== 'all') {
        goals = goals.filter((goal) => goal.lifecycle?.status === state.filters.status);
      }

      // 按目录过滤
      if (state.filters.dirUuid) {
        goals = goals.filter((goal) => goal.dirUuid === state.filters.dirUuid);
      }

      // 按搜索关键词过滤
      if (state.filters.searchQuery) {
        const query = state.filters.searchQuery.toLowerCase();
        goals = goals.filter(
          (goal) =>
            goal.name.toLowerCase().includes(query) ||
            (goal.description && goal.description.toLowerCase().includes(query)),
        );
      }

      return goals;
    },

    // ===== 检查方法 =====

    /**
     * 检查是否为系统目录
     */
    isSystemGoalDir(): (dirUuid: string) => boolean {
      return (dirUuid: string) => {
        const dir = this.goalDirs.find((d) => d.uuid === dirUuid);
        return dir?.isSystemDir || false;
      };
    },
  },

  actions: {
    // ===== 数据管理 - 纯缓存操作 =====

    /**
     * 设置所有目标
     */
    setGoals(goals: any[]): void {
      this.goals = goals;
      this.lastSyncTime = new Date();
    },

    /**
     * 添加或更新单个目标
     */
    addOrUpdateGoal(goal: any): void {
      const index = this.goals.findIndex((g) => g.uuid === goal.uuid);
      if (index >= 0) {
        this.goals[index] = goal;
      } else {
        this.goals.push(goal);
      }
      this.lastSyncTime = new Date();
    },

    /**
     * 批量添加或更新目标
     */
    addOrUpdateGoals(goals: any[]): void {
      goals.forEach((goal) => this.addOrUpdateGoal(goal));
    },

    /**
     * 移除目标
     */
    removeGoal(uuid: string): void {
      const index = this.goals.findIndex((g) => g.uuid === uuid);
      if (index >= 0) {
        this.goals.splice(index, 1);
      }

      // 清除选中状态
      if (this.selectedGoalUuid === uuid) {
        this.selectedGoalUuid = null;
      }
    },

    /**
     * 清空所有目标
     */
    clearGoals(): void {
      this.goals = [];
      this.selectedGoalUuid = null;
    },

    /**
     * 设置所有目录
     */
    setGoalDirs(goalDirs: any[]): void {
      this.goalDirs = goalDirs;
      this.lastSyncTime = new Date();
    },

    /**
     * 添加或更新单个目录
     */
    addOrUpdateGoalDir(goalDir: any): void {
      const index = this.goalDirs.findIndex((d) => d.uuid === goalDir.uuid);
      if (index >= 0) {
        this.goalDirs[index] = goalDir;
      } else {
        this.goalDirs.push(goalDir);
      }
      this.lastSyncTime = new Date();
    },

    /**
     * 批量添加或更新目录
     */
    addOrUpdateGoalDirs(goalDirs: any[]): void {
      goalDirs.forEach((dir) => this.addOrUpdateGoalDir(dir));
    },

    /**
     * 移除目录
     */
    removeGoalDir(uuid: string): void {
      const index = this.goalDirs.findIndex((d) => d.uuid === uuid);
      if (index >= 0) {
        this.goalDirs.splice(index, 1);
      }

      // 清除选中状态
      if (this.selectedDirUuid === uuid) {
        this.selectedDirUuid = null;
      }
    },

    /**
     * 清空所有目录
     */
    clearGoalDirs(): void {
      this.goalDirs = [];
      this.selectedDirUuid = null;
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
     * 设置初始化状态
     */
    setInitialized(initialized: boolean): void {
      this.isInitialized = initialized;
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
     * 清空所有数据和状态
     */
    clearAll(): void {
      this.clearGoals();
      this.clearGoalDirs();
      this.selectedGoalUuid = null;
      this.selectedDirUuid = null;
      this.error = null;
      this.isInitialized = false;
      this.lastSyncTime = null;
      this.resetFilters();
    },

    // ===== 初始化 =====

    /**
     * 初始化 Store（加载本地存储的缓存数据）
     */
    initialize(): void {
      try {
        // 从 localStorage 加载缓存数据
        const cachedGoals = localStorage.getItem('goal-cache-goals');
        const cachedGoalDirs = localStorage.getItem('goal-cache-goalDirs');
        const cachedSyncTime = localStorage.getItem('goal-cache-syncTime');

        if (cachedGoals) {
          const goalsData = JSON.parse(cachedGoals);
          this.goals = goalsData.map((data: any) => Goal.fromDTO(data));
        }

        if (cachedGoalDirs) {
          const goalDirsData = JSON.parse(cachedGoalDirs);
          this.goalDirs = goalDirsData.map((data: any) => GoalDir.fromDTO(data));
        }

        if (cachedSyncTime) {
          this.lastSyncTime = new Date(cachedSyncTime);
        }

        this.isInitialized = true;
        console.log(
          `Goal Store 初始化完成：${this.goals.length} 个目标，${this.goalDirs.length} 个目录`,
        );
      } catch (error) {
        console.error('Goal Store 初始化失败:', error);
        this.error = '加载缓存数据失败';
        this.isInitialized = true; // 即使失败也设为已初始化
      }
    },

    // ===== 缓存管理 =====

    /**
     * 保存到本地存储
     */
    saveToLocalStorage(): void {
      try {
        localStorage.setItem('goal-cache-goals', JSON.stringify(this.goals.map((g) => g.toDTO())));
        localStorage.setItem(
          'goal-cache-goalDirs',
          JSON.stringify(this.goalDirs.map((d) => d.toDTO())),
        );
        localStorage.setItem('goal-cache-syncTime', this.lastSyncTime?.toISOString() || '');
      } catch (error) {
        console.error('保存 Goal 缓存失败:', error);
      }
    },

    /**
     * 清除本地存储
     */
    clearLocalStorage(): void {
      try {
        localStorage.removeItem('goal-cache-goals');
        localStorage.removeItem('goal-cache-goalDirs');
        localStorage.removeItem('goal-cache-syncTime');
      } catch (error) {
        console.error('清除 Goal 缓存失败:', error);
      }
    },

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(): boolean {
      if (!this.lastSyncTime) return true;

      // 如果超过30分钟未同步，则需要刷新
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return this.lastSyncTime < thirtyMinutesAgo;
    },
  },
});

export type GoalStore = ReturnType<typeof useGoalStore>;
