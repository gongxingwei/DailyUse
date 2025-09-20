import { defineStore } from "pinia";
import { Repository, Resource, RepositoryContracts } from "../../domain";

/**
 * Repository Store - 基于领域实体的存储
 * 存储 Repository 和 Resource 实体，提供强类型约束
 */
export const useRepositoryStore = defineStore("repository", {
  state: () => ({
    // ===== 核心数据 =====
    repositories: [] as Repository[],
    resources: [] as Resource[], // 新增 Resource 存储

    // ===== 状态管理 =====
    isLoading: false,
    error: null as string | null,
    isInitialized: false,

    // ===== UI 状态 =====
    selectedRepository: null as string | null,
    repositoryBeingEdited: null as Repository | null,
    selectedResource: null as string | null,
    resourceBeingEdited: null as Resource | null,

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
    // ===== Repository 获取器 =====

    /**
     * 获取所有仓库
     */
    getAllRepositories(state): Repository[] {
      return state.repositories;
    },

    /**
     * 根据UUID获取仓库
     */
    getRepositoryByUuid:
      (state) =>
      (uuid: string): Repository | null => {
        return state.repositories.find((r) => r.uuid === uuid) || null;
      },

    /**
     * 根据名称获取仓库
     */
    getRepositoryByName:
      (state) =>
      (name: string): Repository | null => {
        return state.repositories.find((r) => r.name === name) || null;
      },

    /**
     * 根据路径获取仓库
     */
    getRepositoryByPath:
      (state) =>
      (path: string): Repository | null => {
        return state.repositories.find((r) => r.path === path) || null;
      },

    /**
     * 根据目标UUID获取关联的仓库
     */
    getRepositoriesByGoalUuid:
      (state) =>
      (goalUuid: string): Repository[] => {
        return state.repositories.filter((r) => {
          const relatedGoals = r.relatedGoals;
          return relatedGoals && relatedGoals.length > 0 && relatedGoals.includes(goalUuid);
        });
      },

    /**
     * 根据类型获取仓库
     */
    getRepositoriesByType:
      (state) =>
      (type: RepositoryContracts.RepositoryType): Repository[] => {
        return state.repositories.filter((r) => r.type === type);
      },

    /**
     * 根据状态获取仓库
     */
    getRepositoriesByStatus:
      (state) =>
      (status: RepositoryContracts.RepositoryStatus): Repository[] => {
        return state.repositories.filter((r) => r.status === status);
      },

    /**
     * 获取活跃仓库
     */
    getActiveRepositories(state): Repository[] {
      return state.repositories.filter((r) => r.isActive());
    },

    /**
     * 获取已归档仓库
     */
    getArchivedRepositories(state): Repository[] {
      return state.repositories.filter((r) => r.isArchived());
    },

    // ===== Resource 获取器 =====

    /**
     * 获取所有资源
     */
    getAllResources(state): Resource[] {
      return state.resources;
    },

    /**
     * 根据UUID获取资源
     */
    getResourceByUuid:
      (state) =>
      (uuid: string): Resource | null => {
        return state.resources.find((r) => r.uuid === uuid) || null;
      },

    /**
     * 根据仓库UUID获取资源
     */
    getResourcesByRepositoryUuid:
      (state) =>
      (repositoryUuid: string): Resource[] => {
        return state.resources.filter((r) => r.repositoryUuid === repositoryUuid);
      },

    /**
     * 根据类型获取资源
     */
    getResourcesByType:
      (state) =>
      (type: RepositoryContracts.ResourceType): Resource[] => {
        return state.resources.filter((r) => r.type === type);
      },

    /**
     * 根据状态获取资源
     */
    getResourcesByStatus:
      (state) =>
      (status: RepositoryContracts.ResourceStatus): Resource[] => {
        return state.resources.filter((r) => r.status === status);
      },

    /**
     * 获取活跃资源
     */
    getActiveResources(state): Resource[] {
      return state.resources.filter((r) => r.isActive());
    },

    // ===== 选中状态 =====

    /**
     * 获取当前选中的仓库
     */
    getSelectedRepository(state): Repository | null {
      if (!state.selectedRepository) return null;
      return state.repositories.find((r) => r.uuid === state.selectedRepository) || null;
    },

    /**
     * 获取正在编辑的仓库
     */
    getRepositoryBeingEdited(state): Repository | null {
      return state.repositoryBeingEdited;
    },

    /**
     * 获取当前选中的资源
     */
    getSelectedResource(state): Resource | null {
      if (!state.selectedResource) return null;
      return state.resources.find((r) => r.uuid === state.selectedResource) || null;
    },

    /**
     * 获取正在编辑的资源
     */
    getResourceBeingEdited(state): Resource | null {
      return state.resourceBeingEdited;
    },

    // ===== 搜索相关 =====

    /**
     * 搜索仓库（按名称和描述）
     */
    searchRepositories:
      (state) =>
      (query: string): Repository[] => {
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

    /**
     * 搜索资源（按名称和描述）
     */
    searchResources:
      (state) =>
      (query: string): Resource[] => {
        if (!query.trim()) return state.resources;

        const lowerQuery = query.toLowerCase();
        return state.resources.filter((r) => {
          return (
            r.name?.toLowerCase().includes(lowerQuery) ||
            r.description?.toLowerCase().includes(lowerQuery) ||
            r.path?.toLowerCase().includes(lowerQuery) ||
            r.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
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
      const active = state.repositories.filter((r) => r.isActive()).length;
      const archived = state.repositories.filter((r) => r.isArchived()).length;

      const byType: Record<string, number> = {};
      state.repositories.forEach((repo) => {
        const type = repo.type;
        byType[type] = (byType[type] || 0) + 1;
      });

      return { total, active, archived, byType };
    },

    /**
     * 资源统计
     */
    getResourceStatistics(state): {
      total: number;
      active: number;
      archived: number;
      byType: Record<string, number>;
    } {
      const total = state.resources.length;
      const active = state.resources.filter((r) => r.isActive()).length;
      const archived = state.resources.filter((r) => r.isArchived()).length;

      const byType: Record<string, number> = {};
      state.resources.forEach((resource) => {
        const type = resource.type;
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
  }),

  actions: {
    async addRepository(repository: Repository) {
      if (this.repositories.some((repo) => repo.name === Repository.name)) {
        throw new Error("Repository name already exists");
      }

      this.repositories.push(repository);
    },

    async removeRepository(name: string) {
      const index = this.repositories.findIndex((repo) => repo.name === name);
      if (index > -1) {
        this.repositories.splice(index, 1);
      }
      return false;
    },

    async removeRepositoryById(repositoryId: string) {
      const index = this.repositories.findIndex(
        (repo) => repo.uuid === repositoryId
      );
      if (index > -1) {
        this.repositories.splice(index, 1);
        return true;
      }
      return false;
    },

    async getRepositoryById(repositoryId: string): Promise<Repository | null> {
      const repository = this.repositories.find(
        (repo) => repo.uuid === repositoryId
      );
      if (repository) {
        return this.ensureRepositoryObject(repository);
      }
      return null;
    },

    async updateRepository(Repository: Repository): Promise<void> {
      const index = this.repositories.findIndex(
        (repo) => repo.name === Repository.name
      );
      if (index > -1) {
        this.repositories[index] = Repository;
      }
    },

    currentRepositoryPath() {
      const currentRepo = this.repositories.find(
        (Repository) =>
          Repository.name === window.location.hash.split("/").pop()
      );
      return currentRepo?.path || "";
    },
    ensureRepositoryObject(repository: IRepository): Repository {
      if (Repository.isRepository(repository)) {
        return repository;
      } else {
        return Repository.fromDTO(repository);
      }
    },
  },
});
