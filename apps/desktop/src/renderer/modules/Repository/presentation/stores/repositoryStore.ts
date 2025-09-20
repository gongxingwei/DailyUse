import { defineStore } from 'pinia';
import { Repository } from '../../domain/aggregates/repository';
import { Resource } from '../../domain/entities/resource';

export const useRepositoryStore = defineStore('repository', {
  state: () => ({
    repositories: [] as Repository[],
    resources: [] as Resource[],
    selectedRepositoryUuid: null as string | null,
    selectedResourceUuid: null as string | null,
    isLoading: false,
    error: null as string | null,
    isInitialized: false,
    lastSyncTime: null as Date | null,
    cacheExpiry: 5 * 60 * 1000, // 5分钟过期
  }),

  getters: {
    // Repository getters
    getAllRepositories(state): Repository[] {
      return state.repositories as Repository[];
    },

    getRepositoryByUuid:
      (state) =>
      (uuid: string): Repository | null => {
        const found = state.repositories.find((r) => r.uuid === uuid);
        if (!found) return null;

        // 如果反序列化正常工作，这里应该已经是 Repository 实例
        // 但为了安全起见，如果不是实例则转换
        if (found instanceof Repository) {
          return found;
        } else {
          console.warn('[RepositoryStore] 发现非实体对象，正在转换为 Repository 实例');
          return Repository.fromDTO(found as any);
        }
      },

    getRepositoryByName:
      (state) =>
      (name: string): Repository | null => {
        const found = state.repositories.find((r) => r.name === name);
        if (!found) return null;

        if (found instanceof Repository) {
          return found;
        } else {
          return Repository.fromDTO(found as any);
        }
      },

    getRepositoriesByGoalUuid:
      (state) =>
      (goalUuid: string): Repository[] => {
        return (state.repositories as Repository[]).filter((r) => {
          const relatedGoals = r.relatedGoals;
          return relatedGoals && relatedGoals.length > 0 && relatedGoals.includes(goalUuid);
        });
      },

    getActiveRepositories(state): Repository[] {
      return (state.repositories as Repository[]).filter((r) => r.isActive() && !r.isArchived());
    },

    getArchivedRepositories(state): Repository[] {
      return (state.repositories as Repository[]).filter((r) => r.isArchived());
    },

    // Resource getters
    getAllResources(state): Resource[] {
      return state.resources as Resource[];
    },

    getResourceByUuid:
      (state) =>
      (uuid: string): Resource | null => {
        const found = state.resources.find((r) => r.uuid === uuid);
        if (!found) return null;

        // 如果反序列化正常工作，这里应该已经是 Resource 实例
        // 但为了安全起见，如果不是实例则转换
        if (found instanceof Resource) {
          return found;
        } else {
          console.warn('[RepositoryStore] 发现非实体对象，正在转换为 Resource 实例');
          return Resource.fromDTO(found as any);
        }
      },

    getResourcesByRepositoryUuid:
      (state) =>
      (repositoryUuid: string): Resource[] => {
        return (state.resources as Resource[]).filter((r) => r.repositoryUuid === repositoryUuid);
      },

    getActiveResources(state): Resource[] {
      return (state.resources as Resource[]).filter((r) => r.status === 'active');
    },

    getResourcesByType:
      (state) =>
      (type: string): Resource[] => {
        return (state.resources as Resource[]).filter((r) => r.type === type);
      },

    // Selection getters
    getSelectedRepository(): Repository | null {
      if (!this.selectedRepositoryUuid) return null;
      return this.getRepositoryByUuid(this.selectedRepositoryUuid);
    },

    getSelectedResource(): Resource | null {
      if (!this.selectedResourceUuid) return null;
      return this.getResourceByUuid(this.selectedResourceUuid);
    },

    // Cache and sync getters
    shouldRefreshCache(): boolean {
      if (!this.lastSyncTime) return true;
      return Date.now() - this.lastSyncTime.getTime() > this.cacheExpiry;
    },

    // Statistics
    getRepositoryStatistics(state) {
      return {
        totalRepositories: state.repositories.length,
        activeRepositories: (state.repositories as Repository[]).filter(
          (r) => r.isActive() && !r.isArchived(),
        ).length,
        archivedRepositories: (state.repositories as Repository[]).filter((r) => r.isArchived())
          .length,
        totalResources: state.resources.length,
        activeResources: (state.resources as Resource[]).filter((r) => r.status === 'active')
          .length,
      };
    },
  },

  actions: {
    // Loading and error management
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    updateLastSyncTime() {
      this.lastSyncTime = new Date();
    },

    setInitialized(initialized: boolean) {
      this.isInitialized = initialized;
    },

    // Repository CRUD operations
    setRepositories(repositories: Repository[]) {
      this.repositories = repositories;
      this.updateLastSyncTime();
    },

    addRepository(repository: Repository) {
      const existingIndex = this.repositories.findIndex((r) => r.uuid === repository.uuid);
      if (existingIndex !== -1) {
        // Update existing repository
        this.repositories[existingIndex] = repository;
      } else {
        // Check for name conflicts
        if (this.repositories.some((repo) => repo.name === repository.name)) {
          throw new Error(`Repository name "${repository.name}" already exists`);
        }
        this.repositories.push(repository);
      }
      this.updateLastSyncTime();
    },

    updateRepository(repository: Repository) {
      const index = this.repositories.findIndex((r) => r.uuid === repository.uuid);
      if (index !== -1) {
        this.repositories[index] = repository;
        this.updateLastSyncTime();
      } else {
        throw new Error(`Repository with UUID ${repository.uuid} not found`);
      }
    },

    removeRepository(uuid: string): boolean {
      const index = this.repositories.findIndex((r) => r.uuid === uuid);
      if (index !== -1) {
        this.repositories.splice(index, 1);
        // 删除关联的资源
        this.resources = this.resources.filter((r) => r.repositoryUuid !== uuid);
        // 清理选中状态
        if (this.selectedRepositoryUuid === uuid) {
          this.selectedRepositoryUuid = null;
        }
        this.updateLastSyncTime();
        return true;
      }
      return false;
    },

    // Resource CRUD operations
    setResources(resources: Resource[]) {
      this.resources = resources;
      this.updateLastSyncTime();
    },

    addResource(resource: Resource) {
      const existingIndex = this.resources.findIndex((r) => r.uuid === resource.uuid);
      if (existingIndex !== -1) {
        // Update existing resource
        this.resources[existingIndex] = resource;
      } else {
        this.resources.push(resource);
      }
      this.updateLastSyncTime();
    },

    updateResource(resource: Resource) {
      const index = this.resources.findIndex((r) => r.uuid === resource.uuid);
      if (index !== -1) {
        this.resources[index] = resource;
        this.updateLastSyncTime();
      } else {
        throw new Error(`Resource with UUID ${resource.uuid} not found`);
      }
    },

    removeResource(uuid: string): boolean {
      const index = this.resources.findIndex((r) => r.uuid === uuid);
      if (index !== -1) {
        this.resources.splice(index, 1);
        // 清理选中状态
        if (this.selectedResourceUuid === uuid) {
          this.selectedResourceUuid = null;
        }
        this.updateLastSyncTime();
        return true;
      }
      return false;
    },

    // Selection management
    setSelectedRepository(uuid: string | null) {
      this.selectedRepositoryUuid = uuid;
    },

    setSelectedResource(uuid: string | null) {
      this.selectedResourceUuid = uuid;
    },

    // Batch operations
    clearAll() {
      this.repositories = [];
      this.resources = [];
      this.selectedRepositoryUuid = null;
      this.selectedResourceUuid = null;
      this.error = null;
      this.lastSyncTime = null;
      this.isInitialized = false;
      console.log('✅ [RepositoryStore] 清空所有数据');
    },

    syncAllData(repositories: Repository[], resources: Resource[]) {
      this.setRepositories(repositories);
      this.setResources(resources);
      this.updateLastSyncTime();
      console.log('🔄 [RepositoryStore] 批量同步完成');
    },

    // Compatibility methods
    async getRepositoryById(repositoryId: string): Promise<Repository | null> {
      return this.getRepositoryByUuid(repositoryId);
    },

    removeRepositoryById(repositoryId: string): boolean {
      return this.removeRepository(repositoryId);
    },

    currentRepositoryPath(): string {
      const currentRepo = this.repositories.find(
        (repository) => repository.name === window.location.hash.split('/').pop(),
      );
      return currentRepo?.path || '';
    },

    // Serialization support for persistence
    getSerializableSnapshot(): {
      repositories: any[];
      resources: any[];
      timestamp: number;
    } {
      return {
        repositories: (this.repositories as Repository[]).map((repo) => repo.toDTO()),
        resources: (this.resources as Resource[]).map((resource) => resource.toDTO()),
        timestamp: Date.now(),
      };
    },

    restoreFromSnapshot(snapshot: {
      repositories: any[];
      resources: any[];
      timestamp?: number;
    }): void {
      this.repositories = snapshot.repositories.map((data) => Repository.fromDTO(data));
      this.resources = snapshot.resources.map((data) => Resource.fromDTO(data));
      console.log(
        `✓ 从快照恢复数据成功 (${snapshot.repositories.length} 仓库, ${snapshot.resources.length} 资源)`,
      );
      if (snapshot.timestamp) {
        console.log(`✓ 快照时间: ${new Date(snapshot.timestamp).toLocaleString()}`);
      }
    },
  },

  // Persistence configuration following task module pattern
  persist: {
    key: 'repository-store',
    storage: localStorage,
    // 选择性持久化关键数据，避免持久化加载状态
    pick: [
      'repositories',
      'resources',
      'selectedRepositoryUuid',
      'selectedResourceUuid',
      'lastSyncTime',
      'isInitialized',
    ],

    // 自定义序列化器，处理Date对象和Domain实体
    serializer: {
      serialize: (value: any) => {
        try {
          // 处理需要序列化的数据
          const serializedValue = {
            ...value,
            // 将Date转换为ISO字符串
            lastSyncTime: value.lastSyncTime ? value.lastSyncTime.toISOString() : null,

            // 将Domain实体转换为DTO
            repositories:
              value.repositories?.map((repository: any) =>
                repository && typeof repository.toDTO === 'function'
                  ? repository.toDTO()
                  : repository,
              ) || [],

            resources:
              value.resources?.map((resource: any) =>
                resource && typeof resource.toDTO === 'function' ? resource.toDTO() : resource,
              ) || [],
          };

          return JSON.stringify(serializedValue);
        } catch (error) {
          console.error('RepositoryStore 序列化失败:', error);
          return JSON.stringify({});
        }
      },

      deserialize: (value: string) => {
        try {
          const parsed = JSON.parse(value);

          return {
            ...parsed,
            // 恢复Date对象
            lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null,

            // 将DTO转换回Domain实体（当实体类可用时）
            repositories:
              parsed.repositories?.map((repositoryDTO: any) => {
                if (repositoryDTO && Repository && typeof Repository.fromDTO === 'function') {
                  return Repository.fromDTO(repositoryDTO);
                }
                return repositoryDTO;
              }) || [],

            resources:
              parsed.resources?.map((resourceDTO: any) => {
                if (resourceDTO && Resource && typeof Resource.fromDTO === 'function') {
                  return Resource.fromDTO(resourceDTO);
                }
                return resourceDTO;
              }) || [],
          };
        } catch (error) {
          console.error('RepositoryStore 反序列化失败:', error);
          return {};
        }
      },
    },
  },
});
