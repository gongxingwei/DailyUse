/**
 * IRepositoryRepository - 仓库聚合根的存储接口
 * 定义仓库相关的数据访问操作
 */

import { Repository } from '../aggregates/Repository';
import { RepositoryContracts } from '@dailyuse/contracts';

export interface IRepositoryRepository {
  // ============ 基础CRUD操作 ============

  /**
   * 根据UUID查找仓库
   */
  findByUuid(uuid: string): Promise<Repository | null>;

  /**
   * 根据账户UUID查找所有仓库
   */
  findByAccountUuid(accountUuid: string): Promise<Repository[]>;

  /**
   * 根据路径查找仓库
   */
  findByPath(path: string): Promise<Repository | null>;

  /**
   * 保存仓库
   */
  save(repository: Repository): Promise<void>;

  /**
   * 删除仓库
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查仓库是否存在
   */
  exists(uuid: string): Promise<boolean>;

  // ============ 查询操作 ============

  /**
   * 分页查询仓库
   */
  findWithPagination(params: {
    accountUuid: string;
    page: number;
    limit: number;
    status?: RepositoryContracts.RepositoryStatus;
    type?: RepositoryContracts.RepositoryType;
    searchTerm?: string;
  }): Promise<{
    repositories: Repository[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * 根据名称模糊查询
   */
  findByNamePattern(accountUuid: string, namePattern: string): Promise<Repository[]>;

  /**
   * 查找关联特定目标的仓库
   */
  findByRelatedGoal(goalUuid: string): Promise<Repository[]>;

  /**
   * 查找需要同步的仓库
   */
  findPendingSync(): Promise<Repository[]>;

  /**
   * 查找最近访问的仓库
   */
  findRecentlyAccessed(accountUuid: string, limit: number): Promise<Repository[]>;

  /**
   * 根据状态查找仓库
   */
  findByStatus(
    accountUuid: string,
    status: RepositoryContracts.RepositoryStatus,
  ): Promise<Repository[]>;

  /**
   * 根据类型查找仓库
   */
  findByType(accountUuid: string, type: RepositoryContracts.RepositoryType): Promise<Repository[]>;

  // ============ 统计操作 ============

  /**
   * 获取账户的仓库统计信息
   */
  getAccountStats(accountUuid: string): Promise<{
    totalRepositories: number;
    repositoriesByType: Record<RepositoryContracts.RepositoryType, number>;
    repositoriesByStatus: Record<RepositoryContracts.RepositoryStatus, number>;
    totalResources: number;
    totalSize: number;
    lastAccessedAt?: Date;
  }>;

  /**
   * 获取仓库大小统计
   */
  getSizeStats(accountUuid: string): Promise<{
    totalSize: number;
    averageSize: number;
    largestRepository: {
      uuid: string;
      name: string;
      size: number;
    } | null;
  }>;

  // ============ 批量操作 ============

  /**
   * 批量保存仓库
   */
  saveMany(repositories: Repository[]): Promise<void>;

  /**
   * 批量删除仓库
   */
  deleteMany(uuids: string[]): Promise<void>;

  /**
   * 批量更新仓库状态
   */
  updateStatusBatch(uuids: string[], status: RepositoryContracts.RepositoryStatus): Promise<void>;

  // ============ 高级查询 ============

  /**
   * 查找具有特定配置的仓库
   */
  findWithConfig(
    accountUuid: string,
    configFilter: {
      enableGit?: boolean;
      autoSync?: boolean;
      enableVersionControl?: boolean;
    },
  ): Promise<Repository[]>;

  /**
   * 查找具有Git配置的仓库
   */
  findGitRepositories(accountUuid: string): Promise<Repository[]>;

  /**
   * 查找有变更的Git仓库
   */
  findRepositoriesWithChanges(accountUuid: string): Promise<Repository[]>;

  /**
   * 根据资源数量范围查找仓库
   */
  findByResourceCount(
    accountUuid: string,
    minCount: number,
    maxCount?: number,
  ): Promise<Repository[]>;

  /**
   * 根据最后访问时间查找仓库
   */
  findByLastAccessedRange(
    accountUuid: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<Repository[]>;

  // ============ 维护操作 ============

  /**
   * 清理已删除的仓库
   */
  cleanupDeleted(olderThanDays: number): Promise<number>;

  /**
   * 更新仓库统计信息
   */
  updateRepositoryStats(uuid: string, stats: RepositoryContracts.IRepositoryStats): Promise<void>;

  /**
   * 同步仓库Git信息
   */
  syncGitInfo(uuid: string, gitInfo: RepositoryContracts.IGitInfo): Promise<void>;

  /**
   * 更新仓库同步状态
   */
  updateSyncStatus(
    uuid: string,
    syncStatus: RepositoryContracts.IRepositorySyncStatus,
  ): Promise<void>;
}
