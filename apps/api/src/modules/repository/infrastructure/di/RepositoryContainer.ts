import type { IRepositoryRepository, IResourceRepository } from '@dailyuse/domain-server';
import { PrismaRepositoryRepository } from '../repositories/PrismaRepositoryRepository';
import { PrismaResourceRepository } from '../repositories/PrismaResourceRepository';
import { prisma } from '@/config/prisma';

export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositoryRepository: IRepositoryRepository | null = null;
  private resourceRepository: IResourceRepository | null = null;

  private constructor() {}

  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 获取 Repository Prisma 仓库实例
   */
  async getPrismaRepositoryRepository(): Promise<IRepositoryRepository> {
    if (!this.repositoryRepository) {
      this.repositoryRepository = new PrismaRepositoryRepository(prisma);
    }
    return this.repositoryRepository;
  }

  /**
   * 获取 Resource Prisma 仓库实例
   */
  async getPrismaResourceRepository(): Promise<IResourceRepository> {
    if (!this.resourceRepository) {
      this.resourceRepository = new PrismaResourceRepository(prisma);
    }
    return this.resourceRepository;
  }

  // 用于测试时替换实现
  setRepositoryRepository(repository: IRepositoryRepository): void {
    this.repositoryRepository = repository;
  }

  setResourceRepository(repository: IResourceRepository): void {
    this.resourceRepository = repository;
  }
}
