/**
 * Repository Core - 仓库聚合根核心基类
 * 包含共享的仓库业务逻辑和验证规则
 */

import { AggregateRoot } from '@dailyuse/utils';
import { RepositoryContracts } from '@dailyuse/contracts';

type IRepository = RepositoryContracts.IRepository;
type RepositoryType = RepositoryContracts.RepositoryType;
type RepositoryStatus = RepositoryContracts.RepositoryStatus;
type IRepositoryConfig = RepositoryContracts.IRepositoryConfig;
type IRepositoryStats = RepositoryContracts.IRepositoryStats;
type IRepositorySyncStatus = RepositoryContracts.IRepositorySyncStatus;
type IGitInfo = RepositoryContracts.IGitInfo;
type RepositoryDTO = RepositoryContracts.RepositoryDTO;

export abstract class RepositoryCore extends AggregateRoot implements IRepository {
  protected _accountUuid: string;
  protected _name: string;
  protected _type: RepositoryType;
  protected _path: string;
  protected _description?: string;
  protected _config: IRepositoryConfig;
  protected _relatedGoals: string[];
  protected _status: RepositoryStatus;
  protected _git?: IGitInfo;
  protected _syncStatus?: IRepositorySyncStatus;
  protected _stats: IRepositoryStats;
  protected _lastAccessedAt?: Date;
  protected _createdAt: Date;
  protected _updatedAt: Date;

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
    super(params.uuid || AggregateRoot.generateUUID());

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

    this.validateRepository();
  }

  // ============ 接口实现 ============
  get uuid(): string {
    return this._uuid;
  }
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
    return { ...this._config };
  }
  get relatedGoals(): string[] {
    return [...this._relatedGoals];
  }
  get status(): RepositoryStatus {
    return this._status;
  }
  get git(): IGitInfo | undefined {
    return this._git ? { ...this._git } : undefined;
  }
  get syncStatus(): IRepositorySyncStatus | undefined {
    return this._syncStatus ? { ...this._syncStatus } : undefined;
  }
  get stats(): IRepositoryStats {
    return { ...this._stats };
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

  // ============ 计算属性 ============
  get isActive(): boolean {
    return this._status === RepositoryContracts.RepositoryStatus.ACTIVE;
  }

  get isGitEnabled(): boolean {
    return this._config.enableGit && this._git?.isGitRepo === true;
  }

  get hasUncommittedChanges(): boolean {
    return this._git?.hasChanges === true;
  }

  get isSyncing(): boolean {
    return this._syncStatus?.isSyncing === true;
  }

  get hasRelatedGoals(): boolean {
    return this._relatedGoals.length > 0;
  }

  get daysSinceLastAccess(): number {
    if (!this._lastAccessedAt) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this._lastAccessedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  get resourceCount(): number {
    return this._stats.totalResources;
  }

  get totalSize(): number {
    return this._stats.totalSize;
  }

  get totalSizeFormatted(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this._stats.totalSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // ============ 验证方法 ============
  protected validateRepository(): void {
    this.validateName(this._name);
    this.validatePath(this._path);
    this.validateConfig(this._config);
  }

  protected validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('仓库名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('仓库名称不能超过100个字符');
    }
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_\-\s]+$/.test(name)) {
      throw new Error('仓库名称只能包含字母、数字、中文、下划线、连字符和空格');
    }
  }

  protected validatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('仓库路径不能为空');
    }
  }

  protected validateConfig(config: IRepositoryConfig): void {
    if (config.maxFileSize <= 0) {
      throw new Error('最大文件大小必须大于0');
    }
    if (config.autoSync && (!config.syncInterval || config.syncInterval < 1)) {
      throw new Error('自动同步时间间隔必须大于等于1分钟');
    }
  }

  // ============ 业务方法 ============
  updateAccess(): void {
    this._lastAccessedAt = new Date();
    this.updateTimestamp();
  }

  addRelatedGoal(goalUuid: string): void {
    if (!goalUuid || goalUuid.trim().length === 0) {
      throw new Error('目标UUID不能为空');
    }
    if (!this._relatedGoals.includes(goalUuid)) {
      this._relatedGoals.push(goalUuid);
      this.updateTimestamp();
    }
  }

  removeRelatedGoal(goalUuid: string): void {
    const index = this._relatedGoals.indexOf(goalUuid);
    if (index > -1) {
      this._relatedGoals.splice(index, 1);
      this.updateTimestamp();
    }
  }

  updateStats(stats: Partial<IRepositoryStats>): void {
    this._stats = {
      ...this._stats,
      ...stats,
      lastUpdated: new Date(),
    };
    this.updateTimestamp();
  }

  updateGitInfo(gitInfo: IGitInfo): void {
    this._git = { ...gitInfo };
    this.updateTimestamp();
  }

  updateSyncStatus(syncStatus: IRepositorySyncStatus): void {
    this._syncStatus = { ...syncStatus };
    this.updateTimestamp();
  }

  startSync(syncType: 'pull' | 'push' | 'both'): void {
    this._syncStatus = {
      isSyncing: true,
      syncError: undefined,
      lastSyncAt: this._syncStatus?.lastSyncAt,
      pendingSyncCount: this._syncStatus?.pendingSyncCount || 0,
      conflictCount: this._syncStatus?.conflictCount || 0,
    };
    this.updateTimestamp();
  }

  completeSync(): void {
    if (this._syncStatus) {
      this._syncStatus = {
        isSyncing: false,
        lastSyncAt: new Date(),
        syncError: undefined,
        pendingSyncCount: this._syncStatus.pendingSyncCount || 0,
        conflictCount: this._syncStatus.conflictCount || 0,
      };
    }
    this.updateTimestamp();
  }

  failSync(error: string): void {
    if (this._syncStatus) {
      this._syncStatus = {
        isSyncing: false,
        syncError: error,
        lastSyncAt: this._syncStatus.lastSyncAt,
        pendingSyncCount: this._syncStatus.pendingSyncCount || 0,
        conflictCount: this._syncStatus.conflictCount || 0,
      };
    }
    this.updateTimestamp();
  }

  // ============ 状态管理 ============
  activate(): void {
    if (this._status !== RepositoryContracts.RepositoryStatus.ACTIVE) {
      this._status = RepositoryContracts.RepositoryStatus.ACTIVE;
      this.updateTimestamp();
    }
  }

  deactivate(): void {
    if (this._status !== RepositoryContracts.RepositoryStatus.INACTIVE) {
      this._status = RepositoryContracts.RepositoryStatus.INACTIVE;
      this.updateTimestamp();
    }
  }

  archive(): void {
    if (this._status !== RepositoryContracts.RepositoryStatus.ARCHIVED) {
      this._status = RepositoryContracts.RepositoryStatus.ARCHIVED;
      this.updateTimestamp();
    }
  }

  // ============ 辅助方法 ============
  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  hasGoal(goalUuid: string): boolean {
    return this._relatedGoals.includes(goalUuid);
  }

  canSync(): boolean {
    return this._config.autoSync && !this.isSyncing && this.isActive;
  }

  shouldSync(): boolean {
    if (!this.canSync() || !this._config.syncInterval) {
      return false;
    }

    if (!this._syncStatus?.lastSyncAt) {
      return true;
    }

    const lastSync = this._syncStatus.lastSyncAt.getTime();
    const now = new Date().getTime();
    const intervalMs = this._config.syncInterval * 60 * 1000; // 转换为毫秒

    return now - lastSync >= intervalMs;
  }

  // ============ DTO转换 ============
  toDTO(): RepositoryDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      type: this.type,
      path: this.path,
      description: this.description,
      config: this.config,
      relatedGoals: this.relatedGoals,
      status: this.status,
      git: this.git,
      syncStatus: this.syncStatus,
      stats: this.stats,
      lastAccessedAt: this.lastAccessedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ============ 抽象方法 ============
  abstract updateName(name: string): void;
  abstract updateDescription(description?: string): void;
  abstract updatePath(path: string): void;
  abstract updateConfig(config: Partial<IRepositoryConfig>): void;
}
