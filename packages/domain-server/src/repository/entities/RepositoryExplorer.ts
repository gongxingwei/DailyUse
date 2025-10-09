/**
 * RepositoryExplorer 实体实现
 * 实现 RepositoryExplorerServer 接口
 *
 * DDD 实体职责：
 * - 管理仓库浏览状态
 * - 管理过滤器和视图配置
 * - 管理固定路径和最近路径
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IRepositoryExplorerServer = RepositoryContracts.RepositoryExplorerServer;
type RepositoryExplorerServerDTO = RepositoryContracts.RepositoryExplorerServerDTO;
type RepositoryExplorerPersistenceDTO = RepositoryContracts.RepositoryExplorerPersistenceDTO;
type ResourceFilters = RepositoryContracts.ResourceFilters;
type ExplorerViewConfig = RepositoryContracts.ExplorerViewConfig;

/**
 * RepositoryExplorer 实体
 */
export class RepositoryExplorerEntity extends Entity implements IRepositoryExplorerServer {
  // ===== 私有字段 =====
  private _repositoryUuid: string;
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _currentPath: string;
  private _filters: ResourceFilters;
  private _viewConfig: ExplorerViewConfig;
  private _pinnedPaths: string[];
  private _recentPaths: string[];
  private _lastScanAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // 导航历史（内存中，不持久化）
  private _navigationHistory: string[] = [];
  private _navigationIndex: number = -1;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    repositoryUuid: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    currentPath: string;
    filters: ResourceFilters;
    viewConfig: ExplorerViewConfig;
    pinnedPaths?: string[];
    recentPaths?: string[];
    lastScanAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._repositoryUuid = params.repositoryUuid;
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description ?? null;
    this._currentPath = params.currentPath;
    this._filters = params.filters;
    this._viewConfig = params.viewConfig;
    this._pinnedPaths = params.pinnedPaths ?? [];
    this._recentPaths = params.recentPaths ?? [];
    this._lastScanAt = params.lastScanAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public get uuid(): string {
    return this._uuid;
  }
  public get repositoryUuid(): string {
    return this._repositoryUuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string | null {
    return this._description;
  }
  public get currentPath(): string {
    return this._currentPath;
  }
  public get filters(): ResourceFilters {
    return { ...this._filters };
  }
  public get viewConfig(): ExplorerViewConfig {
    return { ...this._viewConfig };
  }
  public get pinnedPaths(): string[] {
    return [...this._pinnedPaths];
  }
  public get recentPaths(): string[] {
    return [...this._recentPaths];
  }
  public get lastScanAt(): number | null {
    return this._lastScanAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 RepositoryExplorer 实体
   */
  public static create(params: {
    repositoryUuid: string;
    accountUuid: string;
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorerEntity {
    const uuid = crypto.randomUUID();
    const now = Date.now();

    // 创建默认视图配置
    const defaultViewConfig: ExplorerViewConfig = {
      viewMode: 'list',
      sortBy: 'name',
      sortOrder: 'asc',
      showHidden: false,
    };

    return new RepositoryExplorerEntity({
      uuid,
      repositoryUuid: params.repositoryUuid,
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      currentPath: params.currentPath ?? '/',
      filters: {},
      viewConfig: defaultViewConfig,
      pinnedPaths: [],
      recentPaths: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 业务方法 =====

  // 导航方法
  public navigateTo(path: string): void {
    // 添加到导航历史
    this._navigationHistory = this._navigationHistory.slice(0, this._navigationIndex + 1);
    this._navigationHistory.push(path);
    this._navigationIndex = this._navigationHistory.length - 1;

    this._currentPath = path;
    this.addToRecent(path);
    this._updatedAt = Date.now();
  }

  public navigateUp(): void {
    const parts = this._currentPath.split('/').filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      const parentPath = '/' + parts.join('/');
      this.navigateTo(parentPath);
    }
  }

  public navigateBack(): void {
    if (this._navigationIndex > 0) {
      this._navigationIndex--;
      this._currentPath = this._navigationHistory[this._navigationIndex];
      this._updatedAt = Date.now();
    }
  }

  public navigateForward(): void {
    if (this._navigationIndex < this._navigationHistory.length - 1) {
      this._navigationIndex++;
      this._currentPath = this._navigationHistory[this._navigationIndex];
      this._updatedAt = Date.now();
    }
  }

  // 过滤器管理
  public updateFilters(filters: Partial<ResourceFilters>): void {
    this._filters = {
      ...this._filters,
      ...filters,
    };
    this._updatedAt = Date.now();
  }

  public clearFilters(): void {
    this._filters = {};
    this._updatedAt = Date.now();
  }

  // 视图配置
  public updateViewConfig(config: Partial<ExplorerViewConfig>): void {
    this._viewConfig = {
      ...this._viewConfig,
      ...config,
    };
    this._updatedAt = Date.now();
  }

  public resetViewConfig(): void {
    this._viewConfig = {
      viewMode: 'list',
      sortBy: 'name',
      sortOrder: 'asc',
      showHidden: false,
    };
    this._updatedAt = Date.now();
  }

  // 路径管理
  public pinPath(path: string): void {
    if (!this._pinnedPaths.includes(path)) {
      this._pinnedPaths.push(path);
      this._updatedAt = Date.now();
    }
  }

  public unpinPath(path: string): void {
    const index = this._pinnedPaths.indexOf(path);
    if (index !== -1) {
      this._pinnedPaths.splice(index, 1);
      this._updatedAt = Date.now();
    }
  }

  public addToRecent(path: string): void {
    // 移除已存在的
    const index = this._recentPaths.indexOf(path);
    if (index !== -1) {
      this._recentPaths.splice(index, 1);
    }

    // 添加到开头
    this._recentPaths.unshift(path);

    // 限制数量（保留最近 20 个）
    if (this._recentPaths.length > 20) {
      this._recentPaths = this._recentPaths.slice(0, 20);
    }

    this._updatedAt = Date.now();
  }

  public clearRecent(): void {
    this._recentPaths = [];
    this._updatedAt = Date.now();
  }

  // 扫描
  public async scan(): Promise<void> {
    // TODO: 实际的扫描逻辑由基础设施层处理
    this._lastScanAt = Date.now();
    this._updatedAt = Date.now();
  }

  // ===== 转换方法 =====

  public toServerDTO(): RepositoryExplorerServerDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      currentPath: this._currentPath,
      filters: { ...this._filters },
      viewConfig: { ...this._viewConfig },
      pinnedPaths: [...this._pinnedPaths],
      recentPaths: [...this._recentPaths],
      lastScanAt: this._lastScanAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toPersistenceDTO(): RepositoryExplorerPersistenceDTO {
    return {
      uuid: this._uuid,
      repository_uuid: this._repositoryUuid,
      account_uuid: this._accountUuid,
      name: this._name,
      description: this._description,
      current_path: this._currentPath,
      filters: JSON.stringify(this._filters),
      view_config: JSON.stringify(this._viewConfig),
      pinned_paths: JSON.stringify(this._pinnedPaths),
      recent_paths: JSON.stringify(this._recentPaths),
      last_scan_at: this._lastScanAt,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  public static fromServerDTO(dto: RepositoryExplorerServerDTO): RepositoryExplorerEntity {
    return new RepositoryExplorerEntity({
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      currentPath: dto.currentPath,
      filters: dto.filters,
      viewConfig: dto.viewConfig,
      pinnedPaths: dto.pinnedPaths,
      recentPaths: dto.recentPaths,
      lastScanAt: dto.lastScanAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromPersistenceDTO(
    dto: RepositoryExplorerPersistenceDTO,
  ): RepositoryExplorerEntity {
    return new RepositoryExplorerEntity({
      uuid: dto.uuid,
      repositoryUuid: dto.repository_uuid,
      accountUuid: dto.account_uuid,
      name: dto.name,
      description: dto.description,
      currentPath: dto.current_path,
      filters: JSON.parse(dto.filters),
      viewConfig: JSON.parse(dto.view_config),
      pinnedPaths: JSON.parse(dto.pinned_paths),
      recentPaths: JSON.parse(dto.recent_paths),
      lastScanAt: dto.last_scan_at,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    });
  }

  // 实现接口要求的方法签名（作为实例方法）
  public create(params: {
    repositoryUuid: string;
    accountUuid: string;
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryContracts.RepositoryExplorerServer {
    return RepositoryExplorerEntity.create(params);
  }

  public fromServerDTO(
    dto: RepositoryExplorerServerDTO,
  ): RepositoryContracts.RepositoryExplorerServer {
    return RepositoryExplorerEntity.fromServerDTO(dto);
  }

  public fromPersistenceDTO(
    dto: RepositoryExplorerPersistenceDTO,
  ): RepositoryContracts.RepositoryExplorerServer {
    return RepositoryExplorerEntity.fromPersistenceDTO(dto);
  }
}
