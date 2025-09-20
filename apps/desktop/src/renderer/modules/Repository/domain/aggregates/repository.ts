import { AggregateRoot } from '@dailyuse/utils';
import { RepositoryContracts } from '@dailyuse/contracts';

// 使用 RepositoryContracts 的类型定义
type RepositoryDTO = RepositoryContracts.RepositoryDTO;
type RepositoryType = RepositoryContracts.RepositoryType;
type RepositoryStatus = RepositoryContracts.RepositoryStatus;
type IRepositoryConfig = RepositoryContracts.IRepositoryConfig;
type IGitInfo = RepositoryContracts.IGitInfo;
type IRepositorySyncStatus = RepositoryContracts.IRepositorySyncStatus;
type IRepositoryStats = RepositoryContracts.IRepositoryStats;

export class Repository extends AggregateRoot {
  private _accountUuid: string;
  private _name: string;
  private _type: RepositoryType;
  private _path: string;
  private _description?: string;
  private _config: IRepositoryConfig;
  private _relatedGoals: string[];
  private _status: RepositoryStatus;
  private _git?: IGitInfo;
  private _syncStatus?: IRepositorySyncStatus;
  private _stats: IRepositoryStats;
  private _lastAccessedAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config: IRepositoryConfig;
    relatedGoals?: string[];
    status?: RepositoryStatus;
    git?: IGitInfo;
    syncStatus?: IRepositorySyncStatus;
    stats: IRepositoryStats;
    lastAccessedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid);

    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._description = params.description;
    this._config = params.config;
    this._relatedGoals = params.relatedGoals || [];
    this._status = params.status || RepositoryContracts.RepositoryStatus.ACTIVE;
    this._git = params.git;
    this._syncStatus = params.syncStatus;
    this._stats = params.stats;
    this._lastAccessedAt = params.lastAccessedAt;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
  }

  // ============ Getters ============
  get accountUuid(): string {
    return this._accountUuid;
  }
  get name(): string {
    return this._name;
  }
  get type(): RepositoryType {
    return this._type;
  }
  get path(): string {
    return this._path;
  }
  get description(): string | undefined {
    return this._description;
  }
  get config(): IRepositoryConfig {
    return this._config;
  }
  get relatedGoals(): string[] {
    return [...this._relatedGoals];
  }
  get status(): RepositoryStatus {
    return this._status;
  }
  get git(): IGitInfo | undefined {
    return this._git;
  }
  get syncStatus(): IRepositorySyncStatus | undefined {
    return this._syncStatus;
  }
  get stats(): IRepositoryStats {
    return this._stats;
  }
  get lastAccessedAt(): Date | undefined {
    return this._lastAccessedAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============ 业务方法 ============
  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  updatePath(path: string): void {
    this._path = path;
    this._updatedAt = new Date();
  }

  updateRelatedGoals(relatedGoals: string[]): void {
    this._relatedGoals = [...relatedGoals];
    this._updatedAt = new Date();
  }

  updateConfig(config: Partial<IRepositoryConfig>): void {
    this._config = { ...this._config, ...config };
    this._updatedAt = new Date();
  }

  updateStats(stats: Partial<IRepositoryStats>): void {
    this._stats = { ...this._stats, ...stats };
    this._updatedAt = new Date();
  }

  markAsAccessed(): void {
    this._lastAccessedAt = new Date();
    this._updatedAt = new Date();
  }

  activate(): void {
    this._status = RepositoryContracts.RepositoryStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  archive(): void {
    this._status = RepositoryContracts.RepositoryStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  // ============ 查询方法 ============
  isActive(): boolean {
    return this._status === RepositoryContracts.RepositoryStatus.ACTIVE;
  }

  isArchived(): boolean {
    return this._status === RepositoryContracts.RepositoryStatus.ARCHIVED;
  }

  isGitEnabled(): boolean {
    return this._config.enableGit && !!this._git?.isGitRepo;
  }

  isSyncing(): boolean {
    return this._syncStatus?.isSyncing || false;
  }

  // ============ 静态方法 ============
  static isRepository(obj: any): obj is Repository {
    return (
      obj instanceof Repository ||
      (obj &&
        typeof obj.uuid === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.path === 'string')
    );
  }

  static ensureRepository(obj: any): Repository | null {
    if (obj instanceof Repository) {
      return obj;
    }
    if (Repository.isRepository(obj)) {
      return Repository.fromDTO(obj);
    }
    return null;
  }

  static ensureRepositoryNeverNull(obj: any): Repository {
    if (obj instanceof Repository) {
      return obj;
    }
    if (Repository.isRepository(obj)) {
      return Repository.fromDTO(obj);
    }
    // 创建默认仓库
    return new Repository({
      accountUuid: '',
      name: '随机仓库',
      type: RepositoryContracts.RepositoryType.LOCAL,
      path: '',
      description: '这是一个随机仓库',
      config: {
        enableGit: false,
        autoSync: false,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [RepositoryContracts.ResourceType.MARKDOWN],
        maxFileSize: 50 * 1024 * 1024,
        enableVersionControl: false,
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

  clone(): Repository {
    return new Repository({
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: { ...this._config },
      relatedGoals: [...this._relatedGoals],
      status: this._status,
      git: this._git ? { ...this._git } : undefined,
      syncStatus: this._syncStatus ? { ...this._syncStatus } : undefined,
      stats: { ...this._stats },
      lastAccessedAt: this._lastAccessedAt,
      createdAt: new Date(this._createdAt.getTime()),
      updatedAt: new Date(this._updatedAt.getTime()),
    });
  }

  toDTO(): RepositoryDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config,
      relatedGoals: this._relatedGoals,
      status: this._status,
      git: this._git,
      syncStatus: this._syncStatus,
      stats: this._stats,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static fromDTO(dto: RepositoryDTO): Repository {
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

  static forCreate(): Repository {
    return new Repository({
      accountUuid: '',
      name: '',
      type: RepositoryContracts.RepositoryType.LOCAL,
      path: '',
      description: '',
      config: {
        enableGit: false,
        autoSync: false,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [RepositoryContracts.ResourceType.MARKDOWN],
        maxFileSize: 50 * 1024 * 1024,
        enableVersionControl: false,
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
}
