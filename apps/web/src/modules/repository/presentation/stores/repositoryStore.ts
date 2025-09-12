import { defineStore } from 'pinia';

/**
 * Repository Store - 新架构
 * 负责仓库数据的纯缓存存储
 * 采用缓存优先策略，与外部服务解耦
 */
export const useRepositoryStore = defineStore('repository', {
  state: () => ({
    // ===== 核心数据 =====
    repositories: [] as any[],

    // ===== 状态管理 =====
    isLoading: false,
    error: null as string | null,
    isInitialized: false,

    // ===== UI 状态 =====
    selectedRepository: null as string | null,
    repositoryBeingEdited: null as any,

    // ===== 缓存管理 =====
    lastSyncTime: null as Date | null,
    cacheExpiry: 30 * 60 * 1000, // 30分钟

    // ===== 分页信息 =====
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
  }),

  getters: {
    // ===== 基础获取器 =====

    /**
     * 获取所有仓库
     */
    getAllRepositories(state): any[] {
      return state.repositories;
    },

    /**
     * 根据UUID获取仓库
     */
    getRepositoryByUuid:
      (state) =>
      (uuid: string): any | null => {
        return state.repositories.find((r) => r.uuid === uuid) || null;
      },

    /**
     * 根据名称获取仓库
     */
    getRepositoryByName:
      (state) =>
      (name: string): any | null => {
        return state.repositories.find((r) => r.name === name) || null;
      },

    /**
     * 根据路径获取仓库
     */
    getRepositoryByPath:
      (state) =>
      (path: string): any | null => {
        return state.repositories.find((r) => r.path === path) || null;
      },

    // ===== 选中状态 =====

    /**
     * 获取当前选中的仓库
     */
    getSelectedRepository(state): any | null {
      if (!state.selectedRepository) return null;
      return state.repositories.find((r) => r.uuid === state.selectedRepository) || null;
    },

    /**
     * 获取正在编辑的仓库
     */
    getRepositoryBeingEdited(state): any | null {
      return state.repositoryBeingEdited;
    },

    // ===== 业务逻辑获取器 =====

    /**
     * 根据目标UUID获取关联的仓库
     */
    getRepositoriesByGoalUuid:
      (state) =>
      (goalUuid: string): any[] => {
        return state.repositories.filter((r) => {
          if (!r.relatedGoals || r.relatedGoals.length === 0) return false;
          return r.relatedGoals.includes(goalUuid);
        });
      },

    /**
     * 根据类型获取仓库
     */
    getRepositoriesByType:
      (state) =>
      (type: string): any[] => {
        return state.repositories.filter((r) => r.type === type);
      },

    /**
     * 根据状态获取仓库
     */
    getRepositoriesByStatus:
      (state) =>
      (status: string): any[] => {
        return state.repositories.filter((r) => r.status === status);
      },

    /**
     * 获取活跃仓库
     */
    getActiveRepositories(state): any[] {
      return state.repositories.filter((r) => r.status === 'active');
    },

    /**
     * 获取已归档仓库
     */
    getArchivedRepositories(state): any[] {
      return state.repositories.filter((r) => r.status === 'archived');
    },

    // ===== 搜索相关 =====

    /**
     * 搜索仓库（按名称和描述）
     */
    searchRepositories:
      (state) =>
      (query: string): any[] => {
        if (!query.trim()) return state.repositories;

        const lowerQuery = query.toLowerCase();
        return state.repositories.filter((r) => {
          return (
            r.name?.toLowerCase().includes(lowerQuery) ||
            r.description?.toLowerCase().includes(lowerQuery) ||
            r.path?.toLowerCase().includes(lowerQuery)
          );
        });
      },

    // ===== 统计信息 =====

    /**
     * 仓库统计
     */
    getRepositoryStatistics(state): {
      total: number;
      active: number;
      archived: number;
      byType: Record<string, number>;
    } {
      const total = state.repositories.length;
      const active = state.repositories.filter((r) => r.status === 'active').length;
      const archived = state.repositories.filter((r) => r.status === 'archived').length;

      const byType: Record<string, number> = {};
      state.repositories.forEach((repo) => {
        const type = repo.type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      return { total, active, archived, byType };
    },

    // ===== 缓存管理 =====

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(state): boolean {
      if (!state.lastSyncTime) return true;
      const now = new Date();
      const timeDiff = now.getTime() - state.lastSyncTime.getTime();
      return timeDiff > state.cacheExpiry;
    },
  },

  actions: {
    // ===== 状态管理 =====

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * 标记为已初始化
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

    // ===== 数据操作 =====

    /**
     * 设置仓库列表（批量替换）
     */
    setRepositories(repositories: any[]) {
      this.repositories = repositories;
      this.updateLastSyncTime();
    },

    /**
     * 添加仓库
     */
    addRepository(repository: any) {
      // 检查是否已存在
      const existing = this.repositories.find((r) => r.uuid === repository.uuid);
      if (existing) {
        // 更新现有仓库
        const index = this.repositories.indexOf(existing);
        this.repositories[index] = repository;
      } else {
        // 添加新仓库
        this.repositories.push(repository);
      }
      this.updateLastSyncTime();
    },

    /**
     * 批量添加仓库
     */
    addRepositories(repositories: any[]) {
      repositories.forEach((repository) => {
        this.addRepository(repository);
      });
    },

    /**
     * 更新仓库
     */
    updateRepository(uuid: string, repository: any) {
      const index = this.repositories.findIndex((r) => r.uuid === uuid);
      if (index !== -1) {
        this.repositories[index] = { ...this.repositories[index], ...repository };
        this.updateLastSyncTime();
      }
    },

    /**
     * 删除仓库
     */
    removeRepository(uuid: string) {
      const index = this.repositories.findIndex((r) => r.uuid === uuid);
      if (index !== -1) {
        this.repositories.splice(index, 1);
        this.updateLastSyncTime();

        // 如果删除的是当前选中的仓库，清除选中状态
        if (this.selectedRepository === uuid) {
          this.selectedRepository = null;
        }

        // 如果删除的是正在编辑的仓库，清除编辑状态
        if (this.repositoryBeingEdited?.uuid === uuid) {
          this.repositoryBeingEdited = null;
        }
      }
    },

    /**
     * 批量删除仓库
     */
    removeRepositories(uuids: string[]) {
      uuids.forEach((uuid) => {
        this.removeRepository(uuid);
      });
    },

    // ===== UI 状态管理 =====

    /**
     * 设置选中的仓库
     */
    setSelectedRepository(uuid: string | null) {
      this.selectedRepository = uuid;
    },

    /**
     * 设置正在编辑的仓库
     */
    setRepositoryBeingEdited(repository: any | null) {
      this.repositoryBeingEdited = repository;
    },

    /**
     * 开始编辑仓库
     */
    startEditingRepository(uuid: string) {
      const repository = this.getRepositoryByUuid(uuid);
      if (repository) {
        this.repositoryBeingEdited = { ...repository };
      }
    },

    /**
     * 取消编辑
     */
    cancelEditing() {
      this.repositoryBeingEdited = null;
    },

    // ===== 分页管理 =====

    /**
     * 设置分页信息
     */
    setPagination(pagination: { page?: number; limit?: number; total?: number }) {
      this.pagination = { ...this.pagination, ...pagination };
    },

    // ===== 批量操作 =====

    /**
     * 批量同步数据（替换所有数据）
     */
    syncAllData(repositories: any[]) {
      this.repositories = repositories;
      this.updateLastSyncTime();
      this.setInitialized(true);
    },

    /**
     * 清除所有数据
     */
    clearAllData() {
      this.repositories = [];
      this.selectedRepository = null;
      this.repositoryBeingEdited = null;
      this.error = null;
      this.lastSyncTime = null;
      this.pagination = { page: 1, limit: 20, total: 0 };
    },

    // ===== 缓存管理 =====

    /**
     * 从 localStorage 加载数据
     */
    loadFromCache() {
      try {
        const cached = localStorage.getItem('dailyuse_repository_cache');
        if (cached) {
          const data = JSON.parse(cached);
          if (data.repositories) {
            this.repositories = data.repositories;
          }
          if (data.lastSyncTime) {
            this.lastSyncTime = new Date(data.lastSyncTime);
          }
          this.setInitialized(true);
        }
      } catch (error) {
        console.error('加载仓库缓存失败:', error);
      }
    },

    /**
     * 保存到 localStorage
     */
    saveToCache() {
      try {
        const data = {
          repositories: this.repositories,
          lastSyncTime: this.lastSyncTime?.toISOString(),
        };
        localStorage.setItem('dailyuse_repository_cache', JSON.stringify(data));
      } catch (error) {
        console.error('保存仓库缓存失败:', error);
      }
    },

    /**
     * 清除缓存
     */
    clearCache() {
      try {
        localStorage.removeItem('dailyuse_repository_cache');
      } catch (error) {
        console.error('清除仓库缓存失败:', error);
      }
    },

    /**
     * 初始化 Store
     * 先从本地缓存加载数据
     */
    initialize() {
      if (!this.isInitialized) {
        this.loadFromCache();
      }
    },

    // ===== 监听数据变化，自动保存到缓存 =====

    /**
     * 监听数据变化并自动保存
     */
    $subscribe() {
      // 当仓库数据变化时自动保存到缓存
      this.$subscribe((mutation, state) => {
        this.saveToCache();
      });
    },
  },
});
