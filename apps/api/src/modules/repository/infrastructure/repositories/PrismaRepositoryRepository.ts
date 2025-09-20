/**
 * Prisma Repository Implementation
 * Prisma仓储实现 - 数据库访问层
 *
 * 实现IRepositoryRepository接口，遵循DDD架构原则:
 * - 查询方法返回DTO对象
 * - 保存方法接受领域实体
 * - 仓储层负责数据库实体和DTO之间的转换
 */

import { PrismaClient } from '@prisma/client';
import { RepositoryContracts } from '@dailyuse/contracts';
import { type IRepositoryRepository, Repository } from '@dailyuse/domain-server';

// 使用类型别名来简化类型引用
type RepositoryDTO = RepositoryContracts.RepositoryDTO;
type RepositoryStatus = RepositoryContracts.RepositoryStatus;
type RepositoryType = RepositoryContracts.RepositoryType;

export class PrismaRepositoryRepository implements IRepositoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ============ 基础CRUD操作 ============

  /**
   * 根据UUID查找仓库
   */
  async findByUuid(uuid: string): Promise<RepositoryDTO | null> {
    try {
      // 防御式编程：避免向 Prisma 传入 undefined，直接返回 null
      if (!uuid || typeof uuid !== 'string') {
        return null;
      }
      const repository = await this.prisma.repository.findUnique({
        where: { uuid },
        include: {
          resources: true,
        },
      });

      return repository ? this.toDTOFromPrisma(repository) : null;
    } catch (error) {
      throw new Error(`Failed to find repository by UUID: ${(error as Error).message}`);
    }
  }

  /**
   * 根据账户UUID查找所有仓库
   */
  async findByAccountUuid(accountUuid: string): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: { accountUuid },
        include: {
          resources: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find repositories by account UUID: ${(error as Error).message}`);
    }
  }

  /**
   * 根据路径查找仓库
   */
  async findByPath(accountUuid: string, path: string): Promise<RepositoryDTO | null> {
    try {
      const repository = await this.prisma.repository.findFirst({
        where: {
          accountUuid,
          path,
        },
        include: {
          resources: true,
        },
      });

      return repository ? this.toDTOFromPrisma(repository) : null;
    } catch (error) {
      throw new Error(`Failed to find repository by path: ${(error as Error).message}`);
    }
  }

  /**
   * 保存仓库 (接受领域实体，存储为DTO格式)
   */
  async save(repository: Repository): Promise<void> {
    try {
      const repositoryDTO = repository.toDTO();

      await this.prisma.repository.upsert({
        where: { uuid: repositoryDTO.uuid },
        update: {
          name: repositoryDTO.name,
          type: repositoryDTO.type,
          path: repositoryDTO.path,
          description: repositoryDTO.description,
          config: JSON.stringify(repositoryDTO.config),
          relatedGoals: repositoryDTO.relatedGoals
            ? JSON.stringify(repositoryDTO.relatedGoals)
            : null,
          status: repositoryDTO.status,
          git: repositoryDTO.git ? JSON.stringify(repositoryDTO.git) : null,
          syncStatus: repositoryDTO.syncStatus ? JSON.stringify(repositoryDTO.syncStatus) : null,
          stats: JSON.stringify(repositoryDTO.stats),
          lastAccessedAt: repositoryDTO.lastAccessedAt,
          updatedAt: repositoryDTO.updatedAt,
        },
        create: {
          uuid: repositoryDTO.uuid,
          accountUuid: repositoryDTO.accountUuid,
          name: repositoryDTO.name,
          type: repositoryDTO.type,
          path: repositoryDTO.path,
          description: repositoryDTO.description,
          config: JSON.stringify(repositoryDTO.config),
          relatedGoals: repositoryDTO.relatedGoals
            ? JSON.stringify(repositoryDTO.relatedGoals)
            : null,
          status: repositoryDTO.status,
          git: repositoryDTO.git ? JSON.stringify(repositoryDTO.git) : null,
          syncStatus: repositoryDTO.syncStatus ? JSON.stringify(repositoryDTO.syncStatus) : null,
          stats: JSON.stringify(repositoryDTO.stats),
          lastAccessedAt: repositoryDTO.lastAccessedAt,
          createdAt: repositoryDTO.createdAt,
          updatedAt: repositoryDTO.updatedAt,
        },
      });
    } catch (error) {
      throw new Error(`Failed to save repository: ${(error as Error).message}`);
    }
  }

  /**
   * 删除仓库
   */
  async delete(uuid: string): Promise<void> {
    try {
      await this.prisma.repository.delete({
        where: { uuid },
      });
    } catch (error) {
      throw new Error(`Failed to delete repository: ${(error as Error).message}`);
    }
  }

  /**
   * 检查仓库是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    try {
      const count = await this.prisma.repository.count({
        where: { uuid },
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to check repository existence: ${(error as Error).message}`);
    }
  }

  // ============ 查询操作 ============

  /**
   * 分页查询仓库
   */
  async findWithPagination(params: {
    accountUuid: string;
    page: number;
    limit: number;
    status?: RepositoryStatus;
    type?: RepositoryType;
    searchTerm?: string;
  }): Promise<{
    repositories: RepositoryDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const where: any = {
        accountUuid: params.accountUuid,
      };

      if (params.status) {
        where.status = params.status;
      }

      if (params.type) {
        where.type = params.type;
      }

      if (params.searchTerm) {
        where.OR = [
          { name: { contains: params.searchTerm, mode: 'insensitive' } },
          { description: { contains: params.searchTerm, mode: 'insensitive' } },
          { path: { contains: params.searchTerm, mode: 'insensitive' } },
        ];
      }

      const [repositories, total] = await Promise.all([
        this.prisma.repository.findMany({
          where,
          include: {
            resources: true,
          },
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

  /**
   * 根据名称模糊查询
   */
  async findByNamePattern(accountUuid: string, namePattern: string): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: {
          accountUuid,
          name: {
            contains: namePattern,
            mode: 'insensitive',
          },
        },
        include: {
          resources: true,
        },
        orderBy: { name: 'asc' },
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find repositories by name pattern: ${(error as Error).message}`);
    }
  }

  /**
   * 查找关联特定目标的仓库
   */
  async findByRelatedGoal(goalUuid: string): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: {
          relatedGoals: {
            contains: `"${goalUuid}"`,
          },
        },
        include: {
          resources: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find repositories by related goal: ${(error as Error).message}`);
    }
  }

  /**
   * 查找需要同步的仓库
   */
  async findPendingSync(): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: {
          OR: [
            { status: RepositoryContracts.RepositoryStatus.SYNCING },
            {
              AND: [
                {
                  type: {
                    in: [
                      RepositoryContracts.RepositoryType.REMOTE,
                      RepositoryContracts.RepositoryType.SYNCHRONIZED,
                    ],
                  },
                },
                { status: RepositoryContracts.RepositoryStatus.ACTIVE },
              ],
            },
          ],
        },
        include: {
          resources: true,
        },
        orderBy: { updatedAt: 'asc' },
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find pending sync repositories: ${(error as Error).message}`);
    }
  }

  /**
   * 查找最近访问的仓库
   */
  async findRecentlyAccessed(accountUuid: string, limit: number): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: {
          accountUuid,
          lastAccessedAt: { not: null },
        },
        include: {
          resources: true,
        },
        orderBy: { lastAccessedAt: 'desc' },
        take: limit,
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find recently accessed repositories: ${(error as Error).message}`);
    }
  }

  /**
   * 根据状态查找仓库
   */
  async findByStatus(accountUuid: string, status: RepositoryStatus): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: {
          accountUuid,
          status,
        },
        include: {
          resources: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find repositories by status: ${(error as Error).message}`);
    }
  }

  /**
   * 根据类型查找仓库
   */
  async findByType(accountUuid: string, type: RepositoryType): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: {
          accountUuid,
          type,
        },
        include: {
          resources: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find repositories by type: ${(error as Error).message}`);
    }
  }

  // ============ 统计操作 ============

  /**
   * 获取账户的仓库统计信息
   */
  async getAccountStats(accountUuid: string): Promise<{
    totalRepositories: number;
    repositoriesByType: Record<RepositoryType, number>;
    repositoriesByStatus: Record<RepositoryStatus, number>;
    totalResources: number;
    totalSize: number;
    lastAccessedAt?: Date;
  }> {
    try {
      const [
        totalRepositories,
        repositoriesByType,
        repositoriesByStatus,
        resourceStats,
        lastAccessed,
      ] = await Promise.all([
        this.prisma.repository.count({ where: { accountUuid } }),
        this.prisma.repository.groupBy({
          by: ['type'],
          where: { accountUuid },
          _count: { type: true },
        }),
        this.prisma.repository.groupBy({
          by: ['status'],
          where: { accountUuid },
          _count: { status: true },
        }),
        this.prisma.resource.aggregate({
          where: { repository: { accountUuid } },
          _count: { uuid: true },
          _sum: { size: true },
        }),
        this.prisma.repository.aggregate({
          where: { accountUuid, lastAccessedAt: { not: null } },
          _max: { lastAccessedAt: true },
        }),
      ]);

      const typeStats = repositoriesByType.reduce(
        (acc, item) => {
          acc[item.type as RepositoryType] = item._count.type;
          return acc;
        },
        {} as Record<RepositoryType, number>,
      );

      const statusStats = repositoriesByStatus.reduce(
        (acc, item) => {
          acc[item.status as RepositoryStatus] = item._count.status;
          return acc;
        },
        {} as Record<RepositoryStatus, number>,
      );

      // 填充缺失的类型和状态统计
      Object.values(RepositoryContracts.RepositoryType).forEach((type) => {
        if (!(type in typeStats)) typeStats[type] = 0;
      });

      Object.values(RepositoryContracts.RepositoryStatus).forEach((status) => {
        if (!(status in statusStats)) statusStats[status] = 0;
      });

      return {
        totalRepositories,
        repositoriesByType: typeStats,
        repositoriesByStatus: statusStats,
        totalResources: resourceStats._count.uuid || 0,
        totalSize: resourceStats._sum.size || 0,
        lastAccessedAt: lastAccessed._max.lastAccessedAt || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to get account stats: ${(error as Error).message}`);
    }
  }

  /**
   * 获取仓库大小统计
   */
  async getSizeStats(accountUuid: string): Promise<{
    totalSize: number;
    averageSize: number;
    largestRepository: {
      uuid: string;
      name: string;
      size: number;
    } | null;
  }> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: { accountUuid },
        include: {
          resources: {
            select: { size: true },
          },
        },
      });

      const repoSizes = repositories.map((repo) => ({
        uuid: repo.uuid,
        name: repo.name,
        size: repo.resources.reduce((sum, resource) => sum + resource.size, 0),
      }));

      const totalSize = repoSizes.reduce((sum, repo) => sum + repo.size, 0);
      const averageSize = repositories.length > 0 ? totalSize / repositories.length : 0;
      const largestRepository =
        repoSizes.length > 0
          ? repoSizes.reduce((largest, current) =>
              current.size > largest.size ? current : largest,
            )
          : null;

      return {
        totalSize,
        averageSize,
        largestRepository,
      };
    } catch (error) {
      throw new Error(`Failed to get size stats: ${(error as Error).message}`);
    }
  }

  // ============ 批量操作 ============

  /**
   * 批量保存仓库 (接受领域实体，存储为DTO格式)
   */
  async saveMany(repositories: Repository[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const repository of repositories) {
          const repositoryDTO = repository.toDTO();
          await tx.repository.upsert({
            where: { uuid: repositoryDTO.uuid },
            update: {
              name: repositoryDTO.name,
              type: repositoryDTO.type,
              path: repositoryDTO.path,
              description: repositoryDTO.description,
              config: JSON.stringify(repositoryDTO.config),
              relatedGoals: repositoryDTO.relatedGoals
                ? JSON.stringify(repositoryDTO.relatedGoals)
                : null,
              status: repositoryDTO.status,
              git: repositoryDTO.git ? JSON.stringify(repositoryDTO.git) : null,
              syncStatus: repositoryDTO.syncStatus
                ? JSON.stringify(repositoryDTO.syncStatus)
                : null,
              stats: JSON.stringify(repositoryDTO.stats),
              lastAccessedAt: repositoryDTO.lastAccessedAt,
              updatedAt: repositoryDTO.updatedAt,
            },
            create: {
              uuid: repositoryDTO.uuid,
              accountUuid: repositoryDTO.accountUuid,
              name: repositoryDTO.name,
              type: repositoryDTO.type,
              path: repositoryDTO.path,
              description: repositoryDTO.description,
              config: JSON.stringify(repositoryDTO.config),
              relatedGoals: repositoryDTO.relatedGoals
                ? JSON.stringify(repositoryDTO.relatedGoals)
                : null,
              status: repositoryDTO.status,
              git: repositoryDTO.git ? JSON.stringify(repositoryDTO.git) : null,
              syncStatus: repositoryDTO.syncStatus
                ? JSON.stringify(repositoryDTO.syncStatus)
                : null,
              stats: JSON.stringify(repositoryDTO.stats),
              lastAccessedAt: repositoryDTO.lastAccessedAt,
              createdAt: repositoryDTO.createdAt,
              updatedAt: repositoryDTO.updatedAt,
            },
          });
        }
      });
    } catch (error) {
      throw new Error(`Failed to save many repositories: ${(error as Error).message}`);
    }
  }

  /**
   * 批量删除仓库
   */
  async deleteMany(uuids: string[]): Promise<void> {
    try {
      await this.prisma.repository.deleteMany({
        where: {
          uuid: { in: uuids },
        },
      });
    } catch (error) {
      throw new Error(`Failed to delete many repositories: ${(error as Error).message}`);
    }
  }

  /**
   * 批量更新仓库状态
   */
  async updateStatusBatch(uuids: string[], status: RepositoryStatus): Promise<void> {
    try {
      await this.prisma.repository.updateMany({
        where: {
          uuid: { in: uuids },
        },
        data: {
          status,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to update status batch: ${(error as Error).message}`);
    }
  }

  // ============ 高级查询 ============

  /**
   * 查找具有特定配置的仓库
   */
  async findWithConfig(
    accountUuid: string,
    configFilter: {
      enableGit?: boolean;
      autoSync?: boolean;
      enableVersionControl?: boolean;
    },
  ): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: { accountUuid },
        include: { resources: true },
      });

      // 在内存中过滤配置（因为 Prisma 不直接支持复杂的 JSON 查询）
      const filtered = repositories.filter((repo) => {
        try {
          const config = JSON.parse(repo.config);
          return Object.entries(configFilter).every(([key, value]) => config[key] === value);
        } catch {
          return false;
        }
      });

      return filtered.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find repositories with config: ${(error as Error).message}`);
    }
  }

  /**
   * 查找具有Git配置的仓库
   */
  async findGitRepositories(accountUuid: string): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: {
          accountUuid,
          git: { not: null },
        },
        include: { resources: true },
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find Git repositories: ${(error as Error).message}`);
    }
  }

  /**
   * 查找有变更的Git仓库
   */
  async findRepositoriesWithChanges(accountUuid: string): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: { accountUuid },
        include: { resources: true },
      });

      // 在内存中过滤有变更的仓库
      const withChanges = repositories.filter((repo) => {
        if (!repo.git) return false;
        try {
          const gitInfo = JSON.parse(repo.git);
          return gitInfo.hasChanges === true;
        } catch {
          return false;
        }
      });

      return withChanges.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find repositories with changes: ${(error as Error).message}`);
    }
  }

  /**
   * 根据资源数量范围查找仓库
   */
  async findByResourceCount(
    accountUuid: string,
    minCount: number,
    maxCount?: number,
  ): Promise<RepositoryDTO[]> {
    try {
      const repositories = await this.prisma.repository.findMany({
        where: { accountUuid },
        include: {
          resources: true,
          _count: {
            select: { resources: true },
          },
        },
      });

      const filtered = repositories.filter((repo) => {
        const count = repo._count.resources;
        return count >= minCount && (maxCount === undefined || count <= maxCount);
      });

      return filtered.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(`Failed to find repositories by resource count: ${(error as Error).message}`);
    }
  }

  /**
   * 根据最后访问时间查找仓库
   */
  async findByLastAccessedRange(
    accountUuid: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<RepositoryDTO[]> {
    try {
      const where: any = {
        accountUuid,
        lastAccessedAt: {
          gte: startDate,
        },
      };

      if (endDate) {
        where.lastAccessedAt.lte = endDate;
      }

      const repositories = await this.prisma.repository.findMany({
        where,
        include: { resources: true },
        orderBy: { lastAccessedAt: 'desc' },
      });

      return repositories.map((repo) => this.toDTOFromPrisma(repo));
    } catch (error) {
      throw new Error(
        `Failed to find repositories by last accessed range: ${(error as Error).message}`,
      );
    }
  }

  // ============ 维护操作 ============

  /**
   * 清理已删除的仓库
   */
  async cleanupDeleted(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.prisma.repository.deleteMany({
        where: {
          status: RepositoryContracts.RepositoryStatus.ARCHIVED,
          updatedAt: { lt: cutoffDate },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(`Failed to cleanup deleted repositories: ${(error as Error).message}`);
    }
  }

  /**
   * 更新仓库统计信息
   */
  async updateRepositoryStats(
    uuid: string,
    stats: RepositoryContracts.IRepositoryStats,
  ): Promise<void> {
    try {
      await this.prisma.repository.update({
        where: { uuid },
        data: {
          stats: JSON.stringify(stats),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to update repository stats: ${(error as Error).message}`);
    }
  }

  /**
   * 同步仓库Git信息
   */
  async syncGitInfo(uuid: string, gitInfo: RepositoryContracts.IGitInfo): Promise<void> {
    try {
      await this.prisma.repository.update({
        where: { uuid },
        data: {
          git: JSON.stringify(gitInfo),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to sync Git info: ${(error as Error).message}`);
    }
  }

  /**
   * 更新仓库同步状态
   */
  async updateSyncStatus(
    uuid: string,
    syncStatus: RepositoryContracts.IRepositorySyncStatus,
  ): Promise<void> {
    try {
      await this.prisma.repository.update({
        where: { uuid },
        data: {
          syncStatus: JSON.stringify(syncStatus),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to update sync status: ${(error as Error).message}`);
    }
  }

  // ============ 数据转换方法 ============

  /**
   * 将 Prisma 实体转换为 DTO
   */
  private toDTOFromPrisma(prismaRepo: any): RepositoryDTO {
    try {
      return {
        uuid: prismaRepo.uuid,
        accountUuid: prismaRepo.accountUuid,
        name: prismaRepo.name,
        type: prismaRepo.type as RepositoryType,
        path: prismaRepo.path,
        description: prismaRepo.description || undefined,
        config: JSON.parse(prismaRepo.config),
        relatedGoals: prismaRepo.relatedGoals ? JSON.parse(prismaRepo.relatedGoals) : undefined,
        status: prismaRepo.status as RepositoryStatus,
        git: prismaRepo.git ? JSON.parse(prismaRepo.git) : undefined,
        syncStatus: prismaRepo.syncStatus ? JSON.parse(prismaRepo.syncStatus) : undefined,
        stats: JSON.parse(prismaRepo.stats),
        lastAccessedAt: prismaRepo.lastAccessedAt || undefined,
        createdAt: prismaRepo.createdAt,
        updatedAt: prismaRepo.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to convert Prisma entity to DTO: ${(error as Error).message}`);
    }
  }
}
