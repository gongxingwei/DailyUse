/**
 * Repository - 仓库聚合根具体实现
 * 继承自RepositoryCore，实现具体的仓库业务逻辑
 */

import { RepositoryCore } from '@dailyuse/domain-core';
import { RepositoryContracts } from '@dailyuse/contracts';

type IRepositoryConfig = RepositoryContracts.IRepositoryConfig;

export class Repository extends RepositoryCore {
  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    type: RepositoryContracts.RepositoryType;
    path: string;
    description?: string;
    config: IRepositoryConfig;
    relatedGoals?: string[];
    status?: RepositoryContracts.RepositoryStatus;
    git?: RepositoryContracts.IGitInfo;
    syncStatus?: RepositoryContracts.IRepositorySyncStatus;
    stats: RepositoryContracts.IRepositoryStats;
    lastAccessedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params);
  }

  // ============ 抽象方法实现 ============

  updateName(name: string): void {
    this.validateName(name);
    this._name = name;
    this.updateTimestamp();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this.updateTimestamp();
  }

  updatePath(path: string): void {
    this.validatePath(path);
    this._path = path;
    this.updateTimestamp();
  }

  updateConfig(config: Partial<IRepositoryConfig>): void {
    const updatedConfig = {
      ...this._config,
      ...config,
    };
    this.validateConfig(updatedConfig);
    this._config = updatedConfig;
    this.updateTimestamp();
  }

  // ============ 特定业务方法 ============

  /**
   * 初始化Git仓库
   */
  initializeGit(remoteUrl?: string): void {
    if (!this._config.enableGit) {
      throw new Error('Git功能未启用');
    }

    this._git = {
      isGitRepo: true,
      currentBranch: 'main',
      hasChanges: false,
      remoteUrl,
    };

    this.updateTimestamp();
  }

  /**
   * 添加Git远程地址
   */
  addGitRemote(remoteUrl: string): void {
    if (!this.isGitEnabled) {
      throw new Error('Git仓库未初始化');
    }

    if (this._git) {
      this._git.remoteUrl = remoteUrl;
      this.updateTimestamp();
    }
  }

  /**
   * 更新统计信息
   */
  refreshStats(newStats: Partial<RepositoryContracts.IRepositoryStats>): void {
    this.updateStats({
      ...newStats,
      lastUpdated: new Date(),
    });
  }

  /**
   * 检查是否可以删除
   */
  canDelete(): boolean {
    return this._status !== RepositoryContracts.RepositoryStatus.SYNCING;
  }

  /**
   * 标记为删除状态
   */
  markForDeletion(): void {
    if (!this.canDelete()) {
      throw new Error('仓库正在同步中，无法删除');
    }

    this._status = RepositoryContracts.RepositoryStatus.ARCHIVED;
    this.updateTimestamp();
  }

  /**
   * 获取仓库摘要信息
   */
  getSummary(): {
    name: string;
    type: RepositoryContracts.RepositoryType;
    resourceCount: number;
    totalSize: string;
    lastAccessed: string;
    isActive: boolean;
  } {
    return {
      name: this._name,
      type: this._type,
      resourceCount: this.resourceCount,
      totalSize: this.totalSizeFormatted,
      lastAccessed: this._lastAccessedAt ? this._lastAccessedAt.toLocaleDateString() : '从未访问',
      isActive: this.isActive,
    };
  }

  /**
   * 验证仓库配置是否有效
   */
  validateConfiguration(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      this.validateRepository();
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }

    // 检查路径是否存在（这里只是模拟，实际应该调用文件系统）
    if (!this._path || this._path.trim().length === 0) {
      errors.push('仓库路径无效');
    }

    // 检查Git配置
    if (this._config.enableGit && !this._git?.isGitRepo) {
      errors.push('Git功能已启用但仓库未初始化Git');
    }

    // 检查同步配置
    if (this._config.autoSync && !this._config.syncInterval) {
      errors.push('自动同步已启用但未设置同步间隔');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ============ 静态工厂方法 ============

  /**
   * 创建本地仓库
   */
  static createLocal(params: {
    accountUuid: string;
    name: string;
    path: string;
    description?: string;
    enableGit?: boolean;
  }): Repository {
    return new Repository({
      accountUuid: params.accountUuid,
      name: params.name,
      type: RepositoryContracts.RepositoryType.LOCAL,
      path: params.path,
      description: params.description,
      config: {
        enableGit: params.enableGit || false,
        autoSync: false,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [
          RepositoryContracts.ResourceType.MARKDOWN,
          RepositoryContracts.ResourceType.IMAGE,
          RepositoryContracts.ResourceType.PDF,
        ],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        enableVersionControl: true,
      },
      stats: {
        totalResources: 0,
        resourcesByType: {
          [RepositoryContracts.ResourceType.MARKDOWN]: 0,
          [RepositoryContracts.ResourceType.IMAGE]: 0,
          [RepositoryContracts.ResourceType.VIDEO]: 0,
          [RepositoryContracts.ResourceType.AUDIO]: 0,
          [RepositoryContracts.ResourceType.PDF]: 0,
          [RepositoryContracts.ResourceType.LINK]: 0,
          [RepositoryContracts.ResourceType.CODE]: 0,
          [RepositoryContracts.ResourceType.OTHER]: 0,
        },
        resourcesByStatus: {
          [RepositoryContracts.ResourceStatus.ACTIVE]: 0,
          [RepositoryContracts.ResourceStatus.ARCHIVED]: 0,
          [RepositoryContracts.ResourceStatus.DELETED]: 0,
          [RepositoryContracts.ResourceStatus.DRAFT]: 0,
        },
        totalSize: 0,
        recentActiveResources: 0,
        favoriteResources: 0,
        lastUpdated: new Date(),
      },
    });
  }

  /**
   * 创建远程仓库
   */
  static createRemote(params: {
    accountUuid: string;
    name: string;
    path: string;
    remoteUrl: string;
    description?: string;
  }): Repository {
    const repository = new Repository({
      accountUuid: params.accountUuid,
      name: params.name,
      type: RepositoryContracts.RepositoryType.REMOTE,
      path: params.path,
      description: params.description,
      config: {
        enableGit: true,
        autoSync: true,
        syncInterval: 30, // 30分钟
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [
          RepositoryContracts.ResourceType.MARKDOWN,
          RepositoryContracts.ResourceType.IMAGE,
          RepositoryContracts.ResourceType.PDF,
        ],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        enableVersionControl: true,
      },
      stats: {
        totalResources: 0,
        resourcesByType: {
          [RepositoryContracts.ResourceType.MARKDOWN]: 0,
          [RepositoryContracts.ResourceType.IMAGE]: 0,
          [RepositoryContracts.ResourceType.VIDEO]: 0,
          [RepositoryContracts.ResourceType.AUDIO]: 0,
          [RepositoryContracts.ResourceType.PDF]: 0,
          [RepositoryContracts.ResourceType.LINK]: 0,
          [RepositoryContracts.ResourceType.CODE]: 0,
          [RepositoryContracts.ResourceType.OTHER]: 0,
        },
        resourcesByStatus: {
          [RepositoryContracts.ResourceStatus.ACTIVE]: 0,
          [RepositoryContracts.ResourceStatus.ARCHIVED]: 0,
          [RepositoryContracts.ResourceStatus.DELETED]: 0,
          [RepositoryContracts.ResourceStatus.DRAFT]: 0,
        },
        totalSize: 0,
        recentActiveResources: 0,
        favoriteResources: 0,
        lastUpdated: new Date(),
      },
      git: {
        isGitRepo: true,
        currentBranch: 'main',
        hasChanges: false,
        remoteUrl: params.remoteUrl,
      },
    });

    return repository;
  }

  /**
   * 创建同步仓库
   */
  static createSynchronized(params: {
    accountUuid: string;
    name: string;
    path: string;
    remoteUrl: string;
    description?: string;
    syncInterval?: number;
  }): Repository {
    return new Repository({
      accountUuid: params.accountUuid,
      name: params.name,
      type: RepositoryContracts.RepositoryType.SYNCHRONIZED,
      path: params.path,
      description: params.description,
      config: {
        enableGit: true,
        autoSync: true,
        syncInterval: params.syncInterval || 15, // 15分钟
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [
          RepositoryContracts.ResourceType.MARKDOWN,
          RepositoryContracts.ResourceType.IMAGE,
          RepositoryContracts.ResourceType.PDF,
        ],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        enableVersionControl: true,
      },
      stats: {
        totalResources: 0,
        resourcesByType: {
          [RepositoryContracts.ResourceType.MARKDOWN]: 0,
          [RepositoryContracts.ResourceType.IMAGE]: 0,
          [RepositoryContracts.ResourceType.VIDEO]: 0,
          [RepositoryContracts.ResourceType.AUDIO]: 0,
          [RepositoryContracts.ResourceType.PDF]: 0,
          [RepositoryContracts.ResourceType.LINK]: 0,
          [RepositoryContracts.ResourceType.CODE]: 0,
          [RepositoryContracts.ResourceType.OTHER]: 0,
        },
        resourcesByStatus: {
          [RepositoryContracts.ResourceStatus.ACTIVE]: 0,
          [RepositoryContracts.ResourceStatus.ARCHIVED]: 0,
          [RepositoryContracts.ResourceStatus.DELETED]: 0,
          [RepositoryContracts.ResourceStatus.DRAFT]: 0,
        },
        totalSize: 0,
        recentActiveResources: 0,
        favoriteResources: 0,
        lastUpdated: new Date(),
      },
      git: {
        isGitRepo: true,
        currentBranch: 'main',
        hasChanges: false,
        remoteUrl: params.remoteUrl,
      },
      syncStatus: {
        isSyncing: false,
        pendingSyncCount: 0,
        conflictCount: 0,
      },
    });
  }

  /**
   * 创建新仓库
   */
  static create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryContracts.RepositoryType;
    path: string;
    description?: string;
    config?: Partial<IRepositoryConfig>;
  }): Repository {
    const defaultConfig: IRepositoryConfig = {
      enableGit: false,
      autoSync: false,
      syncInterval: 30,
      defaultLinkedDocName: 'README.md',
      supportedFileTypes: [
        RepositoryContracts.ResourceType.MARKDOWN,
        RepositoryContracts.ResourceType.IMAGE,
      ],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      enableVersionControl: false,
    };

    const defaultStats: RepositoryContracts.IRepositoryStats = {
      totalResources: 0,
      resourcesByType: {
        [RepositoryContracts.ResourceType.MARKDOWN]: 0,
        [RepositoryContracts.ResourceType.IMAGE]: 0,
        [RepositoryContracts.ResourceType.VIDEO]: 0,
        [RepositoryContracts.ResourceType.AUDIO]: 0,
        [RepositoryContracts.ResourceType.PDF]: 0,
        [RepositoryContracts.ResourceType.LINK]: 0,
        [RepositoryContracts.ResourceType.CODE]: 0,
        [RepositoryContracts.ResourceType.OTHER]: 0,
      },
      resourcesByStatus: {
        [RepositoryContracts.ResourceStatus.ACTIVE]: 0,
        [RepositoryContracts.ResourceStatus.ARCHIVED]: 0,
        [RepositoryContracts.ResourceStatus.DELETED]: 0,
        [RepositoryContracts.ResourceStatus.DRAFT]: 0,
      },
      totalSize: 0,
      recentActiveResources: 0,
      favoriteResources: 0,
      lastUpdated: new Date(),
    };

    return new Repository({
      accountUuid: params.accountUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      description: params.description,
      config: { ...defaultConfig, ...params.config },
      stats: defaultStats,
    });
  }

  /**
   * 从DTO创建实例
   */
  static fromDTO(dto: RepositoryContracts.RepositoryDTO): Repository {
    return new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: dto.config,
      relatedGoals: dto.relatedGoals,
      status: dto.status,
      git: dto.git,
      syncStatus: dto.syncStatus,
      stats: dto.stats,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 复制仓库
   */
  clone(): Repository {
    return Repository.fromDTO(this.toDTO());
  }

  /**
   * 获取UUID
   */
  getUuid(): string {
    return this.uuid;
  }

  /**
   * 开始同步
   */
  async startSync(): Promise<void> {
    if (!this._config.enableGit || !this._config.autoSync) {
      throw new Error('仓库未启用自动同步');
    }

    if (this._syncStatus?.isSyncing) {
      throw new Error('仓库正在同步中');
    }

    this.updateSyncStatus({
      isSyncing: true,
      pendingSyncCount: 0,
      conflictCount: 0,
    });

    this.updateTimestamp();
  }

  /**
   * 提交变更
   */
  async commitChanges(message: string): Promise<void> {
    if (!this.isGitEnabled) {
      throw new Error('Git仓库未初始化');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('提交信息不能为空');
    }

    if (this._git) {
      this._git.hasChanges = false;
      this.updateTimestamp();
    }
  }

  /**
   * 推送变更
   */
  async pushChanges(): Promise<void> {
    if (!this.isGitEnabled) {
      throw new Error('Git仓库未初始化');
    }

    if (!this._git?.remoteUrl) {
      throw new Error('未配置远程仓库地址');
    }

    this.updateTimestamp();
  }

  /**
   * 拉取变更
   */
  async pullChanges(): Promise<void> {
    if (!this.isGitEnabled) {
      throw new Error('Git仓库未初始化');
    }

    if (!this._git?.remoteUrl) {
      throw new Error('未配置远程仓库地址');
    }

    this.updateTimestamp();
  }

  /**
   * 检查完整性
   */
  async checkIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    lastChecked: Date;
  }> {
    const issues: string[] = [];

    // 检查基本信息
    if (!this._name || this._name.trim().length === 0) {
      issues.push('仓库名称为空');
    }

    if (!this._path || this._path.trim().length === 0) {
      issues.push('仓库路径为空');
    }

    // 检查配置
    if (!this._config) {
      issues.push('仓库配置缺失');
    }

    // 检查统计信息
    if (!this._stats) {
      issues.push('仓库统计信息缺失');
    }

    return {
      isValid: issues.length === 0,
      issues,
      lastChecked: new Date(),
    };
  }
}
