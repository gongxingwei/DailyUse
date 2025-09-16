import { useRepositoryStore } from '../../presentation/stores/repositoryStore';
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import { type RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository Web 应用服务 - 新架构
 * 负责协调数据同步和 Store 之间的数据流
 * 实现缓存优先的数据同步策略
 */
export class RepositoryWebApplicationService {
  /**
   * 懒加载获取 Repository Store
   * 避免在 Pinia 初始化之前调用
   */
  private get repositoryStore() {
    return useRepositoryStore();
  }

  // ===== 仓库 CRUD 操作 =====

  /**
   * 创建仓库
   */
  async createRepository(
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repository = await repositoryApiClient.createRepository(request);

      // 添加到缓存
      this.repositoryStore.addRepository(repository);

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
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    goalUuid?: string;
  }): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.getRepositories(params);

      // 批量同步到 store
      this.repositoryStore.setRepositories(response.repositories);

      // 更新分页信息
      this.repositoryStore.setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库列表失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取仓库详情
   */
  async getRepositoryById(uuid: string): Promise<RepositoryContracts.RepositoryDTO | null> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repository = await repositoryApiClient.getRepositoryById(uuid);

      // 添加到缓存
      this.repositoryStore.addRepository(repository);

      return repository;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : '获取仓库详情失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 更新仓库
   */
  async updateRepository(
    uuid: string,
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repository = await repositoryApiClient.updateRepository(uuid, request);

      // 更新缓存
      this.repositoryStore.updateRepository(uuid, repository);

      return repository;
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

      await repositoryApiClient.deleteRepository(uuid);

      // 从缓存中移除
      this.repositoryStore.removeRepository(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 仓库状态管理 =====

  /**
   * 激活仓库
   */
  async activateRepository(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repository = await repositoryApiClient.activateRepository(uuid);

      // 更新缓存
      this.repositoryStore.updateRepository(uuid, repository);

      return repository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 归档仓库
   */
  async archiveRepository(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repository = await repositoryApiClient.archiveRepository(uuid);

      // 更新缓存
      this.repositoryStore.updateRepository(uuid, repository);

      return repository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '归档仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 仓库关联管理 =====

  /**
   * 关联目标到仓库
   */
  async linkGoalToRepository(
    repositoryUuid: string,
    goalUuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repository = await repositoryApiClient.linkGoalToRepository(repositoryUuid, goalUuid);

      // 更新缓存
      this.repositoryStore.updateRepository(repositoryUuid, repository);

      return repository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '关联目标失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 取消目标与仓库的关联
   */
  async unlinkGoalFromRepository(
    repositoryUuid: string,
    goalUuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repository = await repositoryApiClient.unlinkGoalFromRepository(
        repositoryUuid,
        goalUuid,
      );

      // 更新缓存
      this.repositoryStore.updateRepository(repositoryUuid, repository);

      return repository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消关联失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 搜索和查询 =====

  /**
   * 搜索仓库
   */
  async searchRepositories(params: {
    query: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.searchRepositories(params);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取与指定目标关联的仓库
   */
  async getRepositoriesByGoal(goalUuid: string): Promise<RepositoryContracts.RepositoryDTO[]> {
    // 优先从缓存获取
    const cachedRepositories = this.repositoryStore.getRepositoriesByGoalUuid(goalUuid);

    if (cachedRepositories.length > 0) {
      return cachedRepositories;
    }

    // 如果缓存为空，从API获取
    const response = await this.getRepositories({
      goalUuid,
      limit: 1000,
    });

    return response.repositories || [];
  }

  // ===== 资源管理 =====

  /**
   * 获取仓库资源列表
   */
  async getRepositoryResources(
    repositoryUuid: string,
    params?: RepositoryContracts.ResourceQueryParamsDTO,
  ): Promise<RepositoryContracts.ResourceListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.getRepositoryResources(repositoryUuid, params);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 创建资源
   */
  async createResource(
    request: RepositoryContracts.CreateResourceRequestDTO,
  ): Promise<RepositoryContracts.ResourceDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const resource = await repositoryApiClient.createResource(request);
      return resource;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== Git管理 =====

  /**
   * 获取Git状态
   */
  async getGitStatus(repositoryUuid: string): Promise<RepositoryContracts.GitStatusResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const status = await repositoryApiClient.getGitStatus(repositoryUuid);
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取Git状态失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * Git提交
   */
  async gitCommit(
    repositoryUuid: string,
    message: string,
    addAll = true,
  ): Promise<RepositoryContracts.GitCommitDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const commit = await repositoryApiClient.gitCommit(repositoryUuid, { message, addAll });
      return commit;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Git提交失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有仓库数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllRepositories(): Promise<{
    repositoriesCount: number;
  }> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await this.getRepositories({ limit: 1000 });
      const repositories = response.repositories || [];

      // 批量同步到 store
      this.repositoryStore.syncAllData(repositories);

      console.log(`成功同步数据: ${repositories.length} 个仓库`);

      return {
        repositoriesCount: repositories.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有仓库数据失败';
      this.repositoryStore.setError(errorMessage);
      console.error('同步所有仓库数据失败:', error);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    return (
      !this.repositoryStore.isInitialized ||
      this.repositoryStore.getAllRepositories.length === 0 ||
      this.repositoryStore.shouldRefreshCache
    );
  }

  // ===== 工具方法 =====

  /**
   * 获取 Repository Store 实例
   */
  getStore() {
    return this.repositoryStore;
  }

  /**
   * 初始化服务
   * 会自动同步所有仓库数据到 store
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      this.repositoryStore.initialize();

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('开始同步所有仓库数据...');
        await this.syncAllRepositories();
      } else {
        console.log('使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('Repository 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      if (!this.repositoryStore.isInitialized) {
        this.repositoryStore.initialize();
      }
      throw error;
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('强制重新同步所有数据...');
    await this.syncAllRepositories();
  }
}
