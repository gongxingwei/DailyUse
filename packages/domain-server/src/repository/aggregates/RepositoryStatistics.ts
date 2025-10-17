/**
 * RepositoryStatistics 聚合根实现
 * 实现 RepositoryStatisticsServer 接口
 *
 * 用于统计账户级别的仓储数据，避免每次都遍历计算
 * 采用事件驱动方式实时更新统计信息
 */

import { RepositoryContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';

type IRepositoryStatisticsServer = RepositoryContracts.RepositoryStatisticsServer;
type RepositoryStatisticsServerDTO = RepositoryContracts.RepositoryStatisticsServerDTO;
type RepositoryStatisticsClientDTO = RepositoryContracts.RepositoryStatisticsClientDTO;
type RepositoryStatisticsPersistenceDTO = RepositoryContracts.RepositoryStatisticsPersistenceDTO;
type StatisticsUpdateEvent = RepositoryContracts.StatisticsUpdateEvent;

/**
 * RepositoryStatistics 聚合根
 *
 * DDD 聚合根职责：
 * - 管理账户级别的仓储统计数据
 * - 响应仓储相关事件，实时更新统计
 * - 提供统计查询接口
 * - 确保统计数据的一致性
 */
export class RepositoryStatistics extends AggregateRoot implements IRepositoryStatisticsServer {
  // ===== 私有字段 =====
  private _accountUuid: string;

  // 仓库统计
  private _totalRepositories: number;
  private _activeRepositories: number;
  private _archivedRepositories: number;

  // 资源统计
  private _totalResources: number;
  private _totalFiles: number;
  private _totalFolders: number;

  // Git 统计
  private _gitEnabledRepos: number;
  private _totalCommits: number;

  // 引用统计
  private _totalReferences: number;
  private _totalLinkedContents: number;

  // 存储统计
  private _totalSizeBytes: bigint;

  // 时间戳
  private _lastUpdatedAt: number;
  private _createdAt: number;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    accountUuid: string;
    totalRepositories: number;
    activeRepositories: number;
    archivedRepositories: number;
    totalResources: number;
    totalFiles: number;
    totalFolders: number;
    gitEnabledRepos: number;
    totalCommits: number;
    totalReferences: number;
    totalLinkedContents: number;
    totalSizeBytes: bigint;
    lastUpdatedAt: number;
    createdAt: number;
  }) {
    // RepositoryStatistics 使用 accountUuid 作为唯一标识
    super(params.accountUuid);

    this._accountUuid = params.accountUuid;
    this._totalRepositories = params.totalRepositories;
    this._activeRepositories = params.activeRepositories;
    this._archivedRepositories = params.archivedRepositories;
    this._totalResources = params.totalResources;
    this._totalFiles = params.totalFiles;
    this._totalFolders = params.totalFolders;
    this._gitEnabledRepos = params.gitEnabledRepos;
    this._totalCommits = params.totalCommits;
    this._totalReferences = params.totalReferences;
    this._totalLinkedContents = params.totalLinkedContents;
    this._totalSizeBytes = params.totalSizeBytes;
    this._lastUpdatedAt = params.lastUpdatedAt;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get totalRepositories(): number {
    return this._totalRepositories;
  }

  public get activeRepositories(): number {
    return this._activeRepositories;
  }

  public get archivedRepositories(): number {
    return this._archivedRepositories;
  }

  public get totalResources(): number {
    return this._totalResources;
  }

  public get totalFiles(): number {
    return this._totalFiles;
  }

  public get totalFolders(): number {
    return this._totalFolders;
  }

  public get gitEnabledRepos(): number {
    return this._gitEnabledRepos;
  }

  public get totalCommits(): number {
    return this._totalCommits;
  }

  public get totalReferences(): number {
    return this._totalReferences;
  }

  public get totalLinkedContents(): number {
    return this._totalLinkedContents;
  }

  public get totalSizeBytes(): bigint {
    return this._totalSizeBytes;
  }

  public get lastUpdatedAt(): number {
    return this._lastUpdatedAt;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建空统计（新账户）
   */
  public static createEmpty(accountUuid: string): RepositoryStatistics {
    const now = Date.now();

    return new RepositoryStatistics({
      accountUuid,
      totalRepositories: 0,
      activeRepositories: 0,
      archivedRepositories: 0,
      totalResources: 0,
      totalFiles: 0,
      totalFolders: 0,
      gitEnabledRepos: 0,
      totalCommits: 0,
      totalReferences: 0,
      totalLinkedContents: 0,
      totalSizeBytes: BigInt(0),
      lastUpdatedAt: now,
      createdAt: now,
    });
  }

  /**
   * 从服务端 DTO 重建
   */
  public static fromServerDTO(dto: RepositoryStatisticsServerDTO): RepositoryStatistics {
    return new RepositoryStatistics({
      accountUuid: dto.accountUuid,
      totalRepositories: dto.totalRepositories,
      activeRepositories: dto.activeRepositories,
      archivedRepositories: dto.archivedRepositories,
      totalResources: dto.totalResources,
      totalFiles: dto.totalFiles,
      totalFolders: dto.totalFolders,
      gitEnabledRepos: dto.gitEnabledRepos,
      totalCommits: dto.totalCommits,
      totalReferences: dto.totalReferences,
      totalLinkedContents: dto.totalLinkedContents,
      totalSizeBytes: BigInt(dto.totalSizeBytes),
      lastUpdatedAt: dto.lastUpdatedAt,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 从持久化 DTO 重建
   */
  public static fromPersistenceDTO(dto: RepositoryStatisticsPersistenceDTO): RepositoryStatistics {
    return new RepositoryStatistics({
      accountUuid: dto.accountUuid,
      totalRepositories: dto.total_repositories,
      activeRepositories: dto.active_repositories,
      archivedRepositories: dto.archived_repositories,
      totalResources: dto.total_resources,
      totalFiles: dto.total_files,
      totalFolders: dto.total_folders,
      gitEnabledRepos: dto.git_enabled_repos,
      totalCommits: dto.total_commits,
      totalReferences: dto.total_references,
      totalLinkedContents: dto.total_linked_contents,
      totalSizeBytes: dto.total_size_bytes,
      lastUpdatedAt: dto.lastUpdatedAt.getTime(),
      createdAt: dto.createdAt.getTime(),
    });
  }

  // ===== 事件处理方法 =====

  /**
   * 处理仓库创建事件
   */
  public onRepositoryCreated(event: StatisticsUpdateEvent): void {
    this._totalRepositories++;
    this._activeRepositories++;

    // 如果新仓库启用了 Git
    if (event.payload.hasGit) {
      this._gitEnabledRepos++;
    }

    // 如果新仓库有初始大小
    if (event.payload.sizeBytes) {
      this._totalSizeBytes += BigInt(event.payload.sizeBytes);
    }

    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'repository.created',
        changes: {
          totalRepositories: this._totalRepositories,
          activeRepositories: this._activeRepositories,
          gitEnabledRepos: this._gitEnabledRepos,
        },
      },
    });
  }

  /**
   * 处理仓库删除事件
   */
  public onRepositoryDeleted(event: StatisticsUpdateEvent): void {
    this._totalRepositories = Math.max(0, this._totalRepositories - 1);

    // 根据仓库状态减少对应计数
    if (event.payload.wasArchived) {
      this._archivedRepositories = Math.max(0, this._archivedRepositories - 1);
    } else {
      this._activeRepositories = Math.max(0, this._activeRepositories - 1);
    }

    // 如果仓库启用了 Git
    if (event.payload.hasGit) {
      this._gitEnabledRepos = Math.max(0, this._gitEnabledRepos - 1);

      // 减少提交数
      if (event.payload.commitCount) {
        this._totalCommits = Math.max(0, this._totalCommits - event.payload.commitCount);
      }
    }

    // 减少资源数
    if (event.payload.resourceCount) {
      this._totalResources = Math.max(0, this._totalResources - event.payload.resourceCount);
    }
    if (event.payload.fileCount) {
      this._totalFiles = Math.max(0, this._totalFiles - event.payload.fileCount);
    }
    if (event.payload.folderCount) {
      this._totalFolders = Math.max(0, this._totalFolders - event.payload.folderCount);
    }

    // 减少大小
    if (event.payload.sizeBytes) {
      const sizeDiff = BigInt(event.payload.sizeBytes);
      this._totalSizeBytes =
        this._totalSizeBytes > sizeDiff ? this._totalSizeBytes - sizeDiff : BigInt(0);
    }

    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'repository.deleted',
        changes: {
          totalRepositories: this._totalRepositories,
          activeRepositories: this._activeRepositories,
          archivedRepositories: this._archivedRepositories,
        },
      },
    });
  }

  /**
   * 处理仓库归档事件
   */
  public onRepositoryArchived(event: StatisticsUpdateEvent): void {
    this._activeRepositories = Math.max(0, this._activeRepositories - 1);
    this._archivedRepositories++;
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'repository.archived',
        changes: {
          activeRepositories: this._activeRepositories,
          archivedRepositories: this._archivedRepositories,
        },
      },
    });
  }

  /**
   * 处理仓库激活事件
   */
  public onRepositoryActivated(event: StatisticsUpdateEvent): void {
    this._archivedRepositories = Math.max(0, this._archivedRepositories - 1);
    this._activeRepositories++;
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'repository.activated',
        changes: {
          activeRepositories: this._activeRepositories,
          archivedRepositories: this._archivedRepositories,
        },
      },
    });
  }

  /**
   * 处理资源创建事件
   */
  public onResourceCreated(event: StatisticsUpdateEvent): void {
    this._totalResources++;

    // 根据资源类型增加对应计数
    if (event.payload.resourceType === 'FILE') {
      this._totalFiles++;
    } else if (event.payload.resourceType === 'FOLDER') {
      this._totalFolders++;
    }

    // 增加大小
    if (event.payload.sizeBytes) {
      this._totalSizeBytes += BigInt(event.payload.sizeBytes);
    }

    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'resource.created',
        changes: {
          totalResources: this._totalResources,
          totalFiles: this._totalFiles,
          totalFolders: this._totalFolders,
        },
      },
    });
  }

  /**
   * 处理资源删除事件
   */
  public onResourceDeleted(event: StatisticsUpdateEvent): void {
    this._totalResources = Math.max(0, this._totalResources - 1);

    // 根据资源类型减少对应计数
    if (event.payload.resourceType === 'FILE') {
      this._totalFiles = Math.max(0, this._totalFiles - 1);
    } else if (event.payload.resourceType === 'FOLDER') {
      this._totalFolders = Math.max(0, this._totalFolders - 1);
    }

    // 减少大小
    if (event.payload.sizeBytes) {
      const sizeDiff = BigInt(event.payload.sizeBytes);
      this._totalSizeBytes =
        this._totalSizeBytes > sizeDiff ? this._totalSizeBytes - sizeDiff : BigInt(0);
    }

    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'resource.deleted',
        changes: {
          totalResources: this._totalResources,
          totalFiles: this._totalFiles,
          totalFolders: this._totalFolders,
        },
      },
    });
  }

  // ===== 增量更新方法 =====

  /**
   * 增加引用数
   */
  public incrementReferences(count = 1): void {
    this._totalReferences += count;
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'reference.created',
        changes: {
          totalReferences: this._totalReferences,
        },
      },
    });
  }

  /**
   * 减少引用数
   */
  public decrementReferences(count = 1): void {
    this._totalReferences = Math.max(0, this._totalReferences - count);
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'reference.deleted',
        changes: {
          totalReferences: this._totalReferences,
        },
      },
    });
  }

  /**
   * 增加链接内容数
   */
  public incrementLinkedContents(count = 1): void {
    this._totalLinkedContents += count;
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'linked_content.created',
        changes: {
          totalLinkedContents: this._totalLinkedContents,
        },
      },
    });
  }

  /**
   * 减少链接内容数
   */
  public decrementLinkedContents(count = 1): void {
    this._totalLinkedContents = Math.max(0, this._totalLinkedContents - count);
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'linked_content.deleted',
        changes: {
          totalLinkedContents: this._totalLinkedContents,
        },
      },
    });
  }

  /**
   * 启用Git时更新统计
   */
  public onGitEnabled(): void {
    this._gitEnabledRepos++;
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'git.enabled',
        changes: {
          gitEnabledRepos: this._gitEnabledRepos,
        },
      },
    });
  }

  /**
   * 禁用Git时更新统计
   */
  public onGitDisabled(): void {
    this._gitEnabledRepos = Math.max(0, this._gitEnabledRepos - 1);
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'git.disabled',
        changes: {
          gitEnabledRepos: this._gitEnabledRepos,
        },
      },
    });
  }

  /**
   * 新增提交时更新统计
   */
  public onCommitCreated(count = 1): void {
    this._totalCommits += count;
    this._lastUpdatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryStatisticsUpdated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        eventType: 'commit.created',
        changes: {
          totalCommits: this._totalCommits,
        },
      },
    });
  }

  // ===== 转换方法 =====

  /**
   * 转换为服务端 DTO
   */
  public toServerDTO(): RepositoryStatisticsServerDTO {
    return {
      accountUuid: this._accountUuid,
      totalRepositories: this._totalRepositories,
      activeRepositories: this._activeRepositories,
      archivedRepositories: this._archivedRepositories,
      totalResources: this._totalResources,
      totalFiles: this._totalFiles,
      totalFolders: this._totalFolders,
      gitEnabledRepos: this._gitEnabledRepos,
      totalCommits: this._totalCommits,
      totalReferences: this._totalReferences,
      totalLinkedContents: this._totalLinkedContents,
      totalSizeBytes: this._totalSizeBytes.toString(),
      lastUpdatedAt: this._lastUpdatedAt,
      createdAt: this._createdAt,
    };
  }

  public toClientDTO(): RepositoryStatisticsClientDTO {
    const formatBytes = (bytes: bigint): string => {
      if (bytes === BigInt(0)) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = Number(bytes);
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const formatTimestamp = (timestamp: number): string => {
      return new Date(timestamp).toLocaleString();
    };

    const totalRepos = this._totalRepositories || 1;
    const sizeBytes = this._totalSizeBytes;
    const activePercentage = Math.round((this._activeRepositories / totalRepos) * 100);
    const archivedPercentage = Math.round((this._archivedRepositories / totalRepos) * 100);
    const averageRepositorySize = (sizeBytes / BigInt(totalRepos)).toString();
    const averageResourcesPerRepository = Math.round(this._totalResources / totalRepos);

    return {
      accountUuid: this._accountUuid,
      totalRepositories: this._totalRepositories,
      activeRepositories: this._activeRepositories,
      archivedRepositories: this._archivedRepositories,
      totalResources: this._totalResources,
      totalFiles: this._totalFiles,
      totalFolders: this._totalFolders,
      gitEnabledRepos: this._gitEnabledRepos,
      totalCommits: this._totalCommits,
      totalReferences: this._totalReferences,
      totalLinkedContents: this._totalLinkedContents,
      totalSizeBytes: this._totalSizeBytes.toString(),
      lastUpdatedAt: this._lastUpdatedAt,
      createdAt: this._createdAt,

      // UI-specific fields
      formattedSize: formatBytes(this._totalSizeBytes),
      formattedLastUpdated: formatTimestamp(this._lastUpdatedAt),
      formattedCreatedAt: formatTimestamp(this._createdAt),
      activePercentage,
      archivedPercentage,
      averageRepositorySize,
      formattedAverageSize: formatBytes(BigInt(averageRepositorySize)),
      averageResourcesPerRepository,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): RepositoryStatisticsPersistenceDTO {
    return {
      accountUuid: this._accountUuid,
      total_repositories: this._totalRepositories,
      active_repositories: this._activeRepositories,
      archived_repositories: this._archivedRepositories,
      total_resources: this._totalResources,
      total_files: this._totalFiles,
      total_folders: this._totalFolders,
      git_enabled_repos: this._gitEnabledRepos,
      total_commits: this._totalCommits,
      total_references: this._totalReferences,
      total_linked_contents: this._totalLinkedContents,
      total_size_bytes: this._totalSizeBytes,
      lastUpdatedAt: new Date(this._lastUpdatedAt),
      createdAt: new Date(this._createdAt),
    };
  }
}
