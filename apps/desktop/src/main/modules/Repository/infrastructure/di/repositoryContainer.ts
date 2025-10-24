import { SqliteRepositoryRepository } from '../repositories/sqliteRepositoryRepository';

export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private sqliteRepositoryRepository = new SqliteRepositoryRepository();

  private constructor() {}

  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 获取 Repository Store 实例
   * Store 仅用于状态管理，不处理持久化
   */
  getSqliteRepositoryRepository() {
    return this.sqliteRepositoryRepository;
  }

  /**
   * 重置容器（主要用于测试）
   */
  static reset(): void {
    RepositoryContainer.instance = undefined as any;
  }
}

export const repositoryContainer = RepositoryContainer.getInstance();
