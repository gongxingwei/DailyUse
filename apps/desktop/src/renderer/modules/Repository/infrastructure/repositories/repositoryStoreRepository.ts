import { IRepositoryRepository } from '../../domain/repositories/iRepositoryRepository';
import { useRepositoryStore } from '../../presentation/stores/repositoryStore';
import { Repository } from '../../domain/aggregates/repository';
export class RepositoryStoreRepository implements IRepositoryRepository {
  private _repositoryStore: ReturnType<typeof useRepositoryStore> | null = null;

  private get repositoryStore() {
    if (!this._repositoryStore) {
      this._repositoryStore = useRepositoryStore();
    }
    return this._repositoryStore;
  }

  async addRepository(repository: Repository): Promise<void> {
    try {
      await this.repositoryStore.addRepository(repository);
      console.log(`✅ [RepoStore] 添加仓库到状态: ${repository.uuid}`);
    } catch (error) {
      console.error(`❌ [RepoStore] 添加仓库失败: ${repository.uuid}`, error);
      throw error;
    }
  }

  async updateRepository(repository: Repository): Promise<void> {
    try {
      await this.repositoryStore.updateRepository(repository);
      console.log(`✅ [RepoStore] 更新仓库状态: ${repository.uuid}`);
    } catch (error) {
      console.error(`❌ [RepoStore] 更新仓库失败: ${repository.uuid}`, error);
      throw error;
    }
  }

  async removeRepository(repositoryId: string): Promise<void> {
    try {
      await this.repositoryStore.removeRepositoryById(repositoryId);
      console.log(`✅ [RepoStore] 从状态删除仓库: ${repositoryId}`);
    } catch (error) {
      console.error(`❌ [RepoStore] 删除仓库失败: ${repositoryId}`, error);
      throw error;
    }
  }

  async getRepositoryById(repositoryId: string): Promise<Repository | null> {
    try {
      const repository = this.repositoryStore.getRepositoryById(repositoryId);
      console.log(`✅ [RepoStore] 获取仓库状态: ${repositoryId}`);
      return repository;
    } catch (error) {
      console.error(`❌ [RepoStore] 获取仓库失败: ${repositoryId}`, error);
      throw error;
    }
  }

  async setRepositories(repositories: Repository[]): Promise<void> {
    try {
      await this.repositoryStore.$patch({ repositories });
      console.log(`✅ [RepoStore] 设置仓库状态`);
    } catch (error) {
      console.error(`❌ [RepoStore] 设置仓库失败`, error);
      throw error;
    }
  }
}
