/**
 * Repository 简化实现 - 修复版本
 * 基于当前数据库模式的简化实现
 */

import { PrismaClient } from '@prisma/client';
import {
  type IRepositoryRepository,
  type RepositoryDTO,
  type FindRepositoriesWithPaginationParams,
  type PaginatedRepositoriesResult,
} from '@dailyuse/domain-server';

export class PrismaRepositoryRepositoryFixed implements IRepositoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUuid(uuid: string): Promise<RepositoryDTO | null> {
    const repository = await this.prisma.repository.findUnique({
      where: { uuid },
    });

    return repository ? this.toDTOFromPrisma(repository) : null;
  }

  async findByAccountAndUuid(accountUuid: string, uuid: string): Promise<RepositoryDTO | null> {
    const repository = await this.prisma.repository.findFirst({
      where: { accountUuid, uuid },
    });

    return repository ? this.toDTOFromPrisma(repository) : null;
  }

  async update(repository: RepositoryDTO): Promise<RepositoryDTO> {
    const updated = await this.prisma.repository.update({
      where: { uuid: repository.uuid },
      data: {
        name: repository.name,
        path: repository.path,
        description: repository.description,
        relatedGoals: JSON.stringify(repository.relatedGoals || []),
        updatedAt: new Date(),
      },
    });

    return this.toDTOFromPrisma(updated);
  }

  async save(repository: RepositoryDTO): Promise<RepositoryDTO> {
    const created = await this.prisma.repository.create({
      data: {
        uuid: repository.uuid,
        accountUuid: repository.accountUuid,
        name: repository.name,
        path: repository.path,
        description: repository.description,
        relatedGoals: JSON.stringify(repository.relatedGoals || []),
      },
    });

    return this.toDTOFromPrisma(created);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.repository.delete({
      where: { uuid },
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<RepositoryDTO[]> {
    const repositories = await this.prisma.repository.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return repositories.map((repo) => this.toDTOFromPrisma(repo));
  }

  async findWithPagination(
    params: FindRepositoriesWithPaginationParams,
  ): Promise<PaginatedRepositoriesResult> {
    try {
      const where: any = {
        accountUuid: params.accountUuid,
      };

      // 添加关键词搜索
      if (params.keyword) {
        where.OR = [
          { name: { contains: params.keyword, mode: 'insensitive' } },
          { description: { contains: params.keyword, mode: 'insensitive' } },
        ];
      }

      const [repositories, total] = await Promise.all([
        this.prisma.repository.findMany({
          where,
          skip: (params.page - 1) * params.limit,
          take: params.limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.repository.count({ where }),
      ]);

      return {
        repositories: repositories.map((repo) => this.toDTOFromPrisma(repo)),
        total,
        page: params.page,
        limit: params.limit,
      };
    } catch (error) {
      throw new Error(`Failed to find repositories with pagination: ${(error as Error).message}`);
    }
  }

  async findByNamePattern(accountUuid: string, namePattern: string): Promise<RepositoryDTO[]> {
    const repositories = await this.prisma.repository.findMany({
      where: {
        accountUuid,
        name: { contains: namePattern, mode: 'insensitive' },
      },
    });

    return repositories.map((repo) => this.toDTOFromPrisma(repo));
  }

  // 其他方法的简化实现
  async findSyncingRepositories(accountUuid: string): Promise<RepositoryDTO[]> {
    // 简化实现 - 返回所有仓储
    return this.findByAccountUuid(accountUuid);
  }

  async findRecentlyAccessed(accountUuid: string, limit: number): Promise<RepositoryDTO[]> {
    const repositories = await this.prisma.repository.findMany({
      where: { accountUuid },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return repositories.map((repo) => this.toDTOFromPrisma(repo));
  }

  async findByStatus(accountUuid: string, status: string): Promise<RepositoryDTO[]> {
    // 简化实现 - 返回所有仓储
    return this.findByAccountUuid(accountUuid);
  }

  async findByType(accountUuid: string, type: string): Promise<RepositoryDTO[]> {
    // 简化实现 - 返回所有仓储
    return this.findByAccountUuid(accountUuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.repository.count({
      where: { uuid },
    });
    return count > 0;
  }

  async getStatsByType(accountUuid: string): Promise<any[]> {
    // 简化实现 - 返回基本统计
    const total = await this.prisma.repository.count({
      where: { accountUuid },
    });

    return [{ type: 'local', count: total }];
  }

  async getStatsByStatus(accountUuid: string): Promise<any[]> {
    // 简化实现 - 返回基本统计
    const total = await this.prisma.repository.count({
      where: { accountUuid },
    });

    return [{ status: 'active', count: total }];
  }

  private toDTOFromPrisma(repo: any): RepositoryDTO {
    return {
      uuid: repo.uuid,
      accountUuid: repo.accountUuid,
      name: repo.name,
      type: 'local', // 默认类型
      path: repo.path,
      description: repo.description || '',
      status: 'active', // 默认状态
      config: {
        enableGit: false,
        autoSync: false,
        syncInterval: 30,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: ['markdown'],
        maxFileSize: 52428800,
        enableVersionControl: false,
      },
      relatedGoals: repo.relatedGoals ? JSON.parse(repo.relatedGoals) : [],
      git: {
        isGitRepo: false,
        currentBranch: null,
        hasChanges: false,
        remoteUrl: null,
      },
      syncStatus: {
        isSyncing: false,
        lastSyncAt: null,
        syncError: null,
        pendingSyncCount: 0,
        conflictCount: 0,
      },
      stats: {
        totalResources: 0,
        resourcesByType: {},
        resourcesByStatus: {},
        totalSize: 0,
        recentActiveResources: 0,
        favoriteResources: 0,
        lastUpdated: new Date(),
      },
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
    };
  }
}
