import { useRepositoryStore } from '../../presentation/stores/repositoryStore';

/**
 * Repository Web 应用服务 - 新架构
 * 负责协调数据同步和 Store 之间的数据流
 * 实现缓存优先的数据同步策略
 */
export class RepositoryWebApplicationService {
  private baseUrl = '/api/v1/repositories';

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
  async createRepository(request: {
    name: string;
    path: string;
    type?: string;
    description?: string;
    relatedGoals?: string[];
  }): Promise<any> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create repository: ${response.statusText}`);
      }

      const result = await response.json();
      const repository = result.data;

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
  }): Promise<any> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const url = new URL(`${this.baseUrl}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to get repositories: ${response.statusText}`);
      }

      const result = await response.json();
      const repositories = result.data || [];

      // 批量同步到 store
      this.repositoryStore.setRepositories(repositories);

      // 更新分页信息
      if (result.meta) {
        this.repositoryStore.setPagination({
          page: result.meta.page || 1,
          limit: result.meta.limit || 20,
          total: result.meta.total || repositories.length,
        });
      }

      return {
        repositories,
        ...result.meta,
      };
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
  async getRepositoryById(uuid: string): Promise<any | null> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await fetch(`${this.baseUrl}/${uuid}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get repository: ${response.statusText}`);
      }

      const result = await response.json();
      const repository = result.data;

      // 添加到缓存
      this.repositoryStore.addRepository(repository);

      return repository;
    } catch (error) {
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
    request: {
      name?: string;
      path?: string;
      type?: string;
      description?: string;
      relatedGoals?: string[];
      status?: string;
    },
  ): Promise<any> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await fetch(`${this.baseUrl}/${uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to update repository: ${response.statusText}`);
      }

      const result = await response.json();
      const repository = result.data;

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

      const response = await fetch(`${this.baseUrl}/${uuid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete repository: ${response.statusText}`);
      }

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
  async activateRepository(uuid: string): Promise<any> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await fetch(`${this.baseUrl}/${uuid}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to activate repository: ${response.statusText}`);
      }

      const result = await response.json();
      const repository = result.data;

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
  async archiveRepository(uuid: string): Promise<any> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await fetch(`${this.baseUrl}/${uuid}/archive`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to archive repository: ${response.statusText}`);
      }

      const result = await response.json();
      const repository = result.data;

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
  async linkGoalToRepository(repositoryUuid: string, goalUuid: string): Promise<any> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await fetch(`${this.baseUrl}/${repositoryUuid}/goals/${goalUuid}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to link goal to repository: ${response.statusText}`);
      }

      const result = await response.json();
      const repository = result.data;

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
  async unlinkGoalFromRepository(repositoryUuid: string, goalUuid: string): Promise<any> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await fetch(`${this.baseUrl}/${repositoryUuid}/goals/${goalUuid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to unlink goal from repository: ${response.statusText}`);
      }

      const result = await response.json();
      const repository = result.data;

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
  }): Promise<any> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const url = new URL(`${this.baseUrl}/search`, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to search repositories: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
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
  async getRepositoriesByGoal(goalUuid: string): Promise<any[]> {
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
