import type {
  IRepositoryRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server';
import { PrismaRepositoryAggregateRepository } from '../repositories/PrismaRepositoryAggregateRepository';
import { PrismaRepositoryStatisticsRepository } from '../repositories/PrismaRepositoryStatisticsRepository';
import { prisma } from '@/config/prisma';

/**
 * Repository Module DI Container
 * 管理 Repository 模块的所有仓储实例
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositoryAggregateRepository: IRepositoryRepository | null = null;
  private repositoryStatisticsRepository: IRepositoryStatisticsRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 获取 Repository 聚合根仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getRepositoryAggregateRepository(): IRepositoryRepository {
    if (!this.repositoryAggregateRepository) {
      this.repositoryAggregateRepository = new PrismaRepositoryAggregateRepository(prisma);
    }
    return this.repositoryAggregateRepository;
  }

  /**
   * 设置 Repository 聚合根仓储（用于测试）
   */
  setRepositoryAggregateRepository(repository: IRepositoryRepository): void {
    this.repositoryAggregateRepository = repository;
  }

  /**
   * 获取 RepositoryStatistics 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getRepositoryStatisticsRepository(): IRepositoryStatisticsRepository {
    if (!this.repositoryStatisticsRepository) {
      this.repositoryStatisticsRepository = new PrismaRepositoryStatisticsRepository(prisma);
    }
    return this.repositoryStatisticsRepository;
  }

  /**
   * 设置 RepositoryStatistics 仓储（用于测试）
   */
  setRepositoryStatisticsRepository(repository: IRepositoryStatisticsRepository): void {
    this.repositoryStatisticsRepository = repository;
  }
}
