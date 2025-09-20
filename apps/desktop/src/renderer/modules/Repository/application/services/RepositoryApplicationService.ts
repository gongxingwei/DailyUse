import { Repository } from '../../domain/aggregates/repository';
import { Resource } from '../../domain/entities/resource';
import { useRepositoryStore } from '../../presentation/stores/repositoryStore';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository 应用服务 - Desktop 版本
 * 负责协调 IPC 客户端和 Store 之间的数据流
 * 实现缓存优先的数据同步策略
 */
export class RepositoryApplicationService {
  /**
   * 懒加载获取 Repository Store
   * 避免在 Pinia 初始化之前调用
   */
  private get repositoryStore(): ReturnType<typeof useRepositoryStore> {
    return useRepositoryStore();
  }

  // ===== Repository CRUD 操作 =====

  /**
   * 创建新仓库
   */
  async createRepository(
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<Repository> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // TODO: 这里应该调用 IPC 或 API 创建仓库
      // const repositoryDTO = await repositoryIpcClient.createRepository(request);

      // 暂时创建本地仓库实例用于演示
      const repository = Repository.forCreate();

      // 手动设置属性
      repository.updateName(request.name);
      repository.updatePath(request.path);
      if (request.description) {
        repository.updateDescription(request.description);
      }

      // 添加到缓存
      this.repositoryStore.addRepository(repository);

      // 更新同步时间
      this.repositoryStore.updateLastSyncTime();

      return repository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取仓库列表
   */
  async getRepositories(params?: {
    includeArchived?: boolean;
    goalUuid?: string;
    forceRefresh?: boolean;
  }): Promise<Repository[]> {
    try {
      // 如果需要强制刷新或缓存过期，从服务器获取
      if (params?.forceRefresh || this.repositoryStore.shouldRefreshCache) {
        this.repositoryStore.setLoading(true);
        this.repositoryStore.setError(null);

        // TODO: 这里应该调用 IPC 或 API 获取仓库列表
        // const repositoryDTOs = await repositoryIpcClient.getRepositories(params);

        // 暂时返回本地缓存数据
        const repositories = this.repositoryStore.getAllRepositories;

        // 将DTO转换为实体对象并更新缓存
        // const entities = repositoryDTOs.map(dto => Repository.fromDTO(dto));
        // this.repositoryStore.setRepositories(entities);

        this.repositoryStore.updateLastSyncTime();
        this.repositoryStore.setLoading(false);

        return repositories;
      } else {
        // 使用缓存数据
        let repositories = this.repositoryStore.getAllRepositories;

        // 根据参数过滤
        if (!params?.includeArchived) {
          repositories = repositories.filter((r) => !r.isArchived());
        }

        if (params?.goalUuid) {
          repositories = this.repositoryStore.getRepositoriesByGoalUuid(params.goalUuid);
        }

        return repositories;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库列表失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    }
  }

  /**
   * 根据UUID获取仓库
   */
  async getRepositoryByUuid(uuid: string, forceRefresh?: boolean): Promise<Repository | null> {
    try {
      // 先尝试从缓存获取
      const repository = this.repositoryStore.getRepositoryByUuid(uuid);

      // 如果缓存中没有或需要强制刷新，从服务器获取
      if (!repository || forceRefresh) {
        this.repositoryStore.setLoading(true);
        this.repositoryStore.setError(null);

        // TODO: 这里应该调用 IPC 或 API 获取仓库详情
        // const repositoryDTO = await repositoryIpcClient.getRepositoryById(uuid);
        // if (repositoryDTO) {
        //   repository = Repository.fromDTO(repositoryDTO);
        //   this.repositoryStore.addRepository(repository);
        // }

        this.repositoryStore.setLoading(false);
      }

      return repository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库详情失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    }
  }

  /**
   * 更新仓库
   */
  async updateRepository(uuid: string, updates: Partial<Repository>): Promise<Repository> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // 从缓存获取现有仓库
      const existingRepo = this.repositoryStore.getRepositoryByUuid(uuid);
      if (!existingRepo) {
        throw new Error(`仓库 ${uuid} 不存在`);
      }

      // 应用更新
      const updatedRepo = { ...existingRepo, ...updates };

      // TODO: 这里应该调用 IPC 或 API 更新仓库
      // const repositoryDTO = await repositoryIpcClient.updateRepository(uuid, updatedRepo.toDTO());
      // const repository = Repository.fromDTO(repositoryDTO);

      // 暂时直接更新缓存
      this.repositoryStore.updateRepository(updatedRepo as Repository);

      this.repositoryStore.updateLastSyncTime();

      return updatedRepo as Repository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 删除仓库
   */
  async deleteRepository(uuid: string): Promise<void> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // TODO: 这里应该调用 IPC 或 API 删除仓库
      // await repositoryIpcClient.deleteRepository(uuid);

      // 从缓存中移除
      this.repositoryStore.removeRepository(uuid);

      this.repositoryStore.updateLastSyncTime();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== Resource CRUD 操作 =====

  /**
   * 创建新资源
   */
  async createResource(request: RepositoryContracts.CreateResourceRequestDTO): Promise<Resource> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // TODO: 这里应该调用 IPC 或 API 创建资源
      // const resourceDTO = await resourceIpcClient.createResource(request);

      // 暂时创建本地资源实例用于演示
      const resource = Resource.forCreate(request.name);

      // 手动设置属性
      resource.updateName(request.name);
      if (request.path) {
        resource.updatePath(request.path);
      }

      // 添加到缓存
      this.repositoryStore.addResource(resource);

      // 更新同步时间
      this.repositoryStore.updateLastSyncTime();

      return resource;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取仓库的资源列表
   */
  async getResourcesByRepository(
    repositoryUuid: string,
    params?: {
      type?: string;
      tags?: string[];
      forceRefresh?: boolean;
    },
  ): Promise<Resource[]> {
    try {
      // 如果需要强制刷新或缓存过期，从服务器获取
      if (params?.forceRefresh || this.repositoryStore.shouldRefreshCache) {
        this.repositoryStore.setLoading(true);
        this.repositoryStore.setError(null);

        // TODO: 这里应该调用 IPC 或 API 获取资源列表
        // const resourceDTOs = await resourceIpcClient.getResourcesByRepository(repositoryUuid, params);

        // 暂时返回本地缓存数据
        let resources = this.repositoryStore.getResourcesByRepositoryUuid(repositoryUuid);

        // 将DTO转换为实体对象并更新缓存
        // const entities = resourceDTOs.map(dto => Resource.fromDTO(dto));
        // this.repositoryStore.setResources([
        //   ...this.repositoryStore.getAllResources.filter(r => r.repositoryUuid !== repositoryUuid),
        //   ...entities
        // ]);

        // 根据参数过滤
        if (params?.type) {
          resources = resources.filter((r) => r.type === params.type);
        }

        if (params?.tags?.length) {
          resources = resources.filter((r) => params.tags!.some((tag) => r.tags.includes(tag)));
        }

        this.repositoryStore.updateLastSyncTime();
        this.repositoryStore.setLoading(false);

        return resources;
      } else {
        // 使用缓存数据
        let resources = this.repositoryStore.getResourcesByRepositoryUuid(repositoryUuid);

        // 根据参数过滤
        if (params?.type) {
          resources = resources.filter((r) => r.type === params.type);
        }

        if (params?.tags?.length) {
          resources = resources.filter((r) => params.tags!.some((tag) => r.tags.includes(tag)));
        }

        return resources;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取资源列表失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    }
  }

  /**
   * 更新资源
   */
  async updateResource(uuid: string, updates: Partial<Resource>): Promise<Resource> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // 从缓存获取现有资源
      const existingResource = this.repositoryStore.getResourceByUuid(uuid);
      if (!existingResource) {
        throw new Error(`资源 ${uuid} 不存在`);
      }

      // 应用更新
      const updatedResource = { ...existingResource, ...updates };

      // TODO: 这里应该调用 IPC 或 API 更新资源
      // const resourceDTO = await resourceIpcClient.updateResource(uuid, updatedResource.toDTO());
      // const resource = Resource.fromDTO(resourceDTO);

      // 暂时直接更新缓存
      this.repositoryStore.updateResource(updatedResource as Resource);

      this.repositoryStore.updateLastSyncTime();

      return updatedResource as Resource;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 删除资源
   */
  async deleteResource(uuid: string): Promise<void> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // TODO: 这里应该调用 IPC 或 API 删除资源
      // await resourceIpcClient.deleteResource(uuid);

      // 从缓存中移除
      this.repositoryStore.removeResource(uuid);

      this.repositoryStore.updateLastSyncTime();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 批量操作和缓存管理 =====

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.repositoryStore.clearAll();
  }

  /**
   * 强制刷新所有数据
   */
  async refreshAllData(): Promise<void> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // TODO: 并行获取所有数据
      // const [repositoryDTOs, resourceDTOs] = await Promise.all([
      //   repositoryIpcClient.getRepositories(),
      //   resourceIpcClient.getAllResources(),
      // ]);

      // 转换为实体对象并更新缓存
      // const repositories = repositoryDTOs.map(dto => Repository.fromDTO(dto));
      // const resources = resourceDTOs.map(dto => Resource.fromDTO(dto));

      // this.repositoryStore.syncAllData(repositories, resources);

      this.repositoryStore.updateLastSyncTime();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刷新数据失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStatistics() {
    return this.repositoryStore.getRepositoryStatistics;
  }

  // ===== 选择管理 =====

  /**
   * 设置选中的仓库
   */
  setSelectedRepository(uuid: string | null): void {
    this.repositoryStore.setSelectedRepository(uuid);
  }

  /**
   * 设置选中的资源
   */
  setSelectedResource(uuid: string | null): void {
    this.repositoryStore.setSelectedResource(uuid);
  }

  /**
   * 获取选中的仓库
   */
  getSelectedRepository(): Repository | null {
    return this.repositoryStore.getSelectedRepository;
  }

  /**
   * 获取选中的资源
   */
  getSelectedResource(): Resource | null {
    return this.repositoryStore.getSelectedResource;
  }

  // ===== 兼容性方法 =====

  /**
   * 同步所有仓库状态到本地 store (兼容性方法)
   */
  async syncAllState(): Promise<void> {
    try {
      await this.refreshAllData();
    } catch (error) {
      console.error('Error syncing repository state:', error);
      throw error;
    }
  }

  /**
   * 添加仓库 (兼容性方法)
   */
  async addRepository(repository: Repository): Promise<void> {
    await this.repositoryStore.addRepository(repository);
    await this.syncAllState();
  }

  /**
   * 移除仓库 (兼容性方法)
   */
  async removeRepository(repositoryId: string): Promise<void> {
    await this.deleteRepository(repositoryId);
  }

  /**
   * 根据ID获取仓库 (兼容性方法)
   */
  async getRepositoryById(repositoryId: string): Promise<Repository | null> {
    return await this.getRepositoryByUuid(repositoryId);
  }

  /**
   * 获取所有仓库 (兼容性方法)
   */
  async getAllRepositories(): Promise<Repository[]> {
    return await this.getRepositories();
  }

  /**
   * 获取活跃仓库 (兼容性方法)
   */
  async getActiveRepositories(): Promise<Repository[]> {
    return await this.getRepositories({ includeArchived: false });
  }
}

/**
 * 导出单例实例
 */
export const repositoryApplicationService = new RepositoryApplicationService();

/**
 * 工厂方法：创建仓库应用服务实例 (兼容性方法)
 */
export function createRepositoryApplicationService(): RepositoryApplicationService {
  return new RepositoryApplicationService();
}

/**
 * 单例获取仓库应用服务实例 (兼容性方法)
 */
export function getRepositoryApplicationService(): RepositoryApplicationService {
  return repositoryApplicationService;
}
