import { PrismaClient } from '@prisma/client';
import type { IRepositoryStatisticsRepository } from '@dailyuse/domain-server';
import { RepositoryStatisticsAggregate as RepositoryStatistics } from '@dailyuse/domain-server';

/**
 * RepositoryStatistics Prisma 仓储实现
 * 负责统计数据的持久化
 *
 * 注意：
 * - RepositoryStatistics 使用 UPSERT 语义（accountUuid 唯一）
 * - 每个账户只有一条统计记录
 */
export class PrismaRepositoryStatisticsRepository implements IRepositoryStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 保存统计信息（UPSERT 语义）
   */
  async upsert(statistics: RepositoryStatistics): Promise<void> {
    const persistence = statistics.toPersistenceDTO();

    await this.prisma.repositoryStatistics.upsert({
      where: { accountUuid: persistence.account_uuid },
      create: {
        accountUuid: persistence.account_uuid,
        totalRepositories: persistence.total_repositories,
        activeRepositories: persistence.active_repositories,
        archivedRepositories: persistence.archived_repositories,
        totalResources: persistence.total_resources,
        totalFiles: persistence.total_files,
        totalFolders: persistence.total_folders,
        gitEnabledRepos: persistence.git_enabled_repos,
        totalCommits: persistence.total_commits,
        totalReferences: persistence.total_references,
        totalLinkedContents: persistence.total_linked_contents,
        totalSizeBytes: persistence.total_size_bytes,
        lastUpdatedAt: persistence.last_updated_at,
        createdAt: persistence.created_at,
      },
      update: {
        totalRepositories: persistence.total_repositories,
        activeRepositories: persistence.active_repositories,
        archivedRepositories: persistence.archived_repositories,
        totalResources: persistence.total_resources,
        totalFiles: persistence.total_files,
        totalFolders: persistence.total_folders,
        gitEnabledRepos: persistence.git_enabled_repos,
        totalCommits: persistence.total_commits,
        totalReferences: persistence.total_references,
        totalLinkedContents: persistence.total_linked_contents,
        totalSizeBytes: persistence.total_size_bytes,
        lastUpdatedAt: persistence.last_updated_at,
        // createdAt 不更新
      },
    });
  }

  /**
   * 通过账户 UUID 查找统计
   */
  async findByAccountUuid(accountUuid: string): Promise<RepositoryStatistics | null> {
    const record = await this.prisma.repositoryStatistics.findUnique({
      where: { accountUuid },
    });

    if (!record) {
      return null;
    }

    return RepositoryStatistics.fromPersistenceDTO({
      id: record.id,
      account_uuid: record.accountUuid,
      total_repositories: record.totalRepositories,
      active_repositories: record.activeRepositories,
      archived_repositories: record.archivedRepositories,
      total_resources: record.totalResources,
      total_files: record.totalFiles,
      total_folders: record.totalFolders,
      git_enabled_repos: record.gitEnabledRepos,
      total_commits: record.totalCommits,
      total_references: record.totalReferences,
      total_linked_contents: record.totalLinkedContents,
      total_size_bytes: record.totalSizeBytes,
      last_updated_at: record.lastUpdatedAt,
      created_at: record.createdAt,
    });
  }

  /**
   * 删除统计
   */
  async delete(accountUuid: string): Promise<void> {
    await this.prisma.repositoryStatistics.delete({
      where: { accountUuid },
    });
  }

  /**
   * 检查统计是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.repositoryStatistics.count({
      where: { accountUuid },
    });
    return count > 0;
  }

  /**
   * 批量获取多个账户的统计
   */
  async findByAccountUuids(accountUuids: string[]): Promise<RepositoryStatistics[]> {
    const records = await this.prisma.repositoryStatistics.findMany({
      where: {
        accountUuid: {
          in: accountUuids,
        },
      },
    });

    return records.map((record) =>
      RepositoryStatistics.fromPersistenceDTO({
        id: record.id,
        account_uuid: record.accountUuid,
        total_repositories: record.totalRepositories,
        active_repositories: record.activeRepositories,
        archived_repositories: record.archivedRepositories,
        total_resources: record.totalResources,
        total_files: record.totalFiles,
        total_folders: record.totalFolders,
        git_enabled_repos: record.gitEnabledRepos,
        total_commits: record.totalCommits,
        total_references: record.totalReferences,
        total_linked_contents: record.totalLinkedContents,
        total_size_bytes: record.totalSizeBytes,
        last_updated_at: record.lastUpdatedAt,
        created_at: record.createdAt,
      }),
    );
  }

  /**
   * 获取所有统计（分页）
   */
  async findAll(options?: { skip?: number; take?: number }): Promise<RepositoryStatistics[]> {
    const records = await this.prisma.repositoryStatistics.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) =>
      RepositoryStatistics.fromPersistenceDTO({
        id: record.id,
        account_uuid: record.accountUuid,
        total_repositories: record.totalRepositories,
        active_repositories: record.activeRepositories,
        archived_repositories: record.archivedRepositories,
        total_resources: record.totalResources,
        total_files: record.totalFiles,
        total_folders: record.totalFolders,
        git_enabled_repos: record.gitEnabledRepos,
        total_commits: record.totalCommits,
        total_references: record.totalReferences,
        total_linked_contents: record.totalLinkedContents,
        total_size_bytes: record.totalSizeBytes,
        last_updated_at: record.lastUpdatedAt,
        created_at: record.createdAt,
      }),
    );
  }

  /**
   * 统计总数
   */
  async count(): Promise<number> {
    return await this.prisma.repositoryStatistics.count();
  }
}
