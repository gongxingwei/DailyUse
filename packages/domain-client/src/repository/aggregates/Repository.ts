import { RepositoryCore } from '@dailyuse/domain-core';
import { RepositoryContracts } from '@dailyuse/contracts';

// 使用 RepositoryContracts 的类型定义
type RepositoryDTO = RepositoryContracts.RepositoryDTO;
type CreateRepositoryRequestDTO = RepositoryContracts.CreateRepositoryRequestDTO;
type UpdateRepositoryRequestDTO = RepositoryContracts.UpdateRepositoryRequestDTO;
type RepositoryType = RepositoryContracts.RepositoryType;
type RepositoryStatus = RepositoryContracts.RepositoryStatus;
type IRepositoryConfig = RepositoryContracts.IRepositoryConfig;
type IGitInfo = RepositoryContracts.IGitInfo;
type IRepositorySyncStatus = RepositoryContracts.IRepositorySyncStatus;

// 导入枚举值
const RepositoryTypeEnum = RepositoryContracts.RepositoryType;
const RepositoryStatusEnum = RepositoryContracts.RepositoryStatus;

/**
 * 客户端 Repository 聚合
 * 继承核心 Repository 类，添加客户端特有功能
 */
export class Repository extends RepositoryCore {
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
    stats: RepositoryContracts.IRepositoryStats;
    lastAccessedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params);
  }

  // ===== 抽象方法实现 =====

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

  updateConfig(config: Partial<IRepositoryConfig>): void {
    this._config = { ...this._config, ...config };
    this._updatedAt = new Date();
  }

  // ===== 客户端特有方法 =====

  /**
   * 激活仓库
   */
  activate(): void {
    if (this._status === RepositoryStatusEnum.ACTIVE) {
      throw new Error('仓库已经是激活状态');
    }

    this._status = RepositoryStatusEnum.ACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * 停用仓库
   */
  deactivate(): void {
    if (this._status === RepositoryStatusEnum.INACTIVE) {
      throw new Error('仓库已经是停用状态');
    }

    this._status = RepositoryStatusEnum.INACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * 归档仓库
   */
  archive(): void {
    if (this._status === RepositoryStatusEnum.ARCHIVED) {
      throw new Error('仓库已经是归档状态');
    }

    this._status = RepositoryStatusEnum.ARCHIVED;
    this._updatedAt = new Date();
  }

  /**
   * 开始同步
   */
  startSync(): void {
    if (this._status === RepositoryStatusEnum.SYNCING) {
      throw new Error('仓库正在同步中');
    }

    this._status = RepositoryStatusEnum.SYNCING;
    this._updatedAt = new Date();
  }

  // ===== 客户端特有计算属性 =====

  /**
   * 获取状态显示文本
   */
  get statusText(): string {
    const statusMap = {
      [RepositoryStatusEnum.ACTIVE]: '活跃',
      [RepositoryStatusEnum.INACTIVE]: '停用',
      [RepositoryStatusEnum.ARCHIVED]: '已归档',
      [RepositoryStatusEnum.SYNCING]: '同步中',
    };
    return statusMap[this.status] || '未知';
  }

  /**
   * 获取状态颜色
   */
  get statusColor(): string {
    const colorMap = {
      [RepositoryStatusEnum.ACTIVE]: '#4CAF50',
      [RepositoryStatusEnum.INACTIVE]: '#9E9E9E',
      [RepositoryStatusEnum.ARCHIVED]: '#FF9800',
      [RepositoryStatusEnum.SYNCING]: '#2196F3',
    };
    return colorMap[this.status] || '#9E9E9E';
  }

  /**
   * 获取类型显示文本
   */
  get typeText(): string {
    const typeMap = {
      [RepositoryTypeEnum.LOCAL]: '本地仓库',
      [RepositoryTypeEnum.REMOTE]: '远程仓库',
      [RepositoryTypeEnum.SYNCHRONIZED]: '同步仓库',
    };
    return typeMap[this.type] || '未知类型';
  }

  /**
   * 获取类型图标
   */
  get typeIcon(): string {
    const iconMap = {
      [RepositoryTypeEnum.LOCAL]: 'folder',
      [RepositoryTypeEnum.REMOTE]: 'cloud',
      [RepositoryTypeEnum.SYNCHRONIZED]: 'sync',
    };
    return iconMap[this.type] || 'folder';
  }

  /**
   * 是否为Git仓库
   */
  get isGitRepository(): boolean {
    return this.git?.isGitRepo || false;
  }

  /**
   * 是否有Git变更
   */
  get hasGitChanges(): boolean {
    return this.git?.hasChanges || false;
  }

  /**
   * 是否正在同步
   */
  get isSyncing(): boolean {
    return this.status === RepositoryStatusEnum.SYNCING || this.syncStatus?.isSyncing || false;
  }

  /**
   * 获取同步状态文本
   */
  get syncStatusText(): string {
    if (!this.syncStatus) return '未配置同步';

    if (this.syncStatus.isSyncing) return '同步中...';

    if (this.syncStatus.syncError) return '同步失败';

    if (this.syncStatus.lastSyncAt) {
      const lastSync = new Date(this.syncStatus.lastSyncAt);
      const diffMs = Date.now() - lastSync.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) return '刚刚同步';
      if (diffHours < 24) return `${diffHours}小时前同步`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}天前同步`;
    }

    return '从未同步';
  }

  /**
   * 获取资源统计摘要文本
   */
  get resourcesSummary(): string {
    const stats = this.stats;
    if (stats.totalResources === 0) {
      return '暂无资源';
    }

    const sizeText = this.formatFileSize(stats.totalSize);
    return `${stats.totalResources} 个资源，共 ${sizeText}`;
  }

  /**
   * 获取关联目标数量文本
   */
  get relatedGoalsText(): string {
    const count = this.relatedGoals?.length || 0;
    return count === 0 ? '未关联目标' : `关联 ${count} 个目标`;
  }

  /**
   * 是否需要注意（有错误、冲突等）
   */
  get needsAttention(): boolean {
    // 同步失败
    if (this.syncStatus?.syncError) return true;

    // 有冲突
    if ((this.syncStatus?.conflictCount || 0) > 0) return true;

    // 长时间未同步（超过7天）
    if (this.syncStatus?.lastSyncAt) {
      const lastSync = new Date(this.syncStatus.lastSyncAt);
      const diffDays = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) return true;
    }

    return false;
  }

  /**
   * 获取注意事项文本
   */
  get attentionText(): string {
    if (this.syncStatus?.syncError) {
      return `同步失败: ${this.syncStatus.syncError}`;
    }

    if ((this.syncStatus?.conflictCount || 0) > 0) {
      return `有 ${this.syncStatus!.conflictCount} 个冲突需要解决`;
    }

    if (this.syncStatus?.lastSyncAt) {
      const lastSync = new Date(this.syncStatus.lastSyncAt);
      const diffDays = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        return `${diffDays} 天未同步，建议检查`;
      }
    }

    return '';
  }

  // ===== 权限和状态检查 =====

  /**
   * 是否可以编辑
   */
  get canEdit(): boolean {
    return this.status === RepositoryStatusEnum.ACTIVE;
  }

  /**
   * 是否可以同步 - 覆盖父类方法
   */
  canSync(): boolean {
    return (
      this.status === RepositoryStatusEnum.ACTIVE &&
      (this.type === RepositoryTypeEnum.REMOTE || this.type === RepositoryTypeEnum.SYNCHRONIZED) &&
      !this.isSyncing
    );
  }

  /**
   * 是否可以归档
   */
  get canArchive(): boolean {
    return this.status !== RepositoryStatusEnum.ARCHIVED && !this.isSyncing;
  }

  /**
   * 是否可以激活
   */
  get canActivate(): boolean {
    return this.status !== RepositoryStatusEnum.ACTIVE;
  }

  /**
   * 是否可以删除
   */
  get canDelete(): boolean {
    return this.status !== RepositoryStatusEnum.SYNCING;
  }

  // ===== 工具方法 =====

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取相对时间文本
   */
  getRelativeTimeText(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} 周前`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} 个月前`;
    }
  }

  /**
   * 获取创建时间的相对时间
   */
  getRelativeCreatedTime(): string {
    return this.getRelativeTimeText(this.createdAt);
  }

  /**
   * 获取最后访问时间的相对时间
   */
  getRelativeLastAccessTime(): string {
    if (!this.lastAccessedAt) return '从未访问';
    return this.getRelativeTimeText(this.lastAccessedAt);
  }

  /**
   * 检查是否可以执行某个操作
   */
  canPerformAction(action: 'edit' | 'sync' | 'archive' | 'activate' | 'delete'): boolean {
    switch (action) {
      case 'edit':
        return this.canEdit;
      case 'sync':
        return this.canSync();
      case 'archive':
        return this.canArchive;
      case 'activate':
        return this.canActivate;
      case 'delete':
        return this.canDelete;
      default:
        return false;
    }
  }

  /**
   * 获取可用的操作列表
   */
  getAvailableActions(): Array<{
    key: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    danger?: boolean;
  }> {
    const actions = [
      {
        key: 'edit',
        label: '编辑',
        icon: 'edit',
        disabled: !this.canPerformAction('edit'),
      },
      {
        key: 'sync',
        label: '同步',
        icon: 'sync',
        disabled: !this.canPerformAction('sync'),
      },
      {
        key: 'activate',
        label: this.status === RepositoryStatusEnum.ACTIVE ? '停用' : '激活',
        icon: this.status === RepositoryStatusEnum.ACTIVE ? 'pause' : 'play',
        disabled: false,
      },
      {
        key: 'archive',
        label: '归档',
        icon: 'archive',
        disabled: !this.canPerformAction('archive'),
      },
      {
        key: 'delete',
        label: '删除',
        icon: 'delete',
        disabled: !this.canPerformAction('delete'),
        danger: true,
      },
    ];

    return actions.filter((action) => !action.disabled);
  }

  // ===== 客户端数据转换方法 =====

  /**
   * 转换为表单数据
   */
  toFormData(): {
    name: string;
    description: string;
    path: string;
    type: RepositoryType;
    relatedGoals: string[];
    enableGit: boolean;
    autoSync: boolean;
    syncInterval: number;
    defaultLinkedDocName: string;
    maxFileSize: number;
  } {
    return {
      name: this.name,
      description: this.description || '',
      path: this.path,
      type: this.type,
      relatedGoals: this.relatedGoals || [],
      enableGit: this.config.enableGit,
      autoSync: this.config.autoSync,
      syncInterval: this.config.syncInterval || 60,
      defaultLinkedDocName: this.config.defaultLinkedDocName,
      maxFileSize: this.config.maxFileSize,
    };
  }

  /**
   * 获取展示用的配置信息
   */
  getConfigDisplay(): Array<{ label: string; value: string }> {
    return [
      { label: 'Git启用', value: this.config.enableGit ? '是' : '否' },
      { label: '自动同步', value: this.config.autoSync ? '是' : '否' },
      { label: '同步间隔', value: `${this.config.syncInterval || 60} 分钟` },
      { label: '默认文档名', value: this.config.defaultLinkedDocName },
      { label: '最大文件大小', value: this.formatFileSize(this.config.maxFileSize) },
      { label: '支持文件类型', value: this.config.supportedFileTypes.join(', ') },
    ];
  }

  // ===== 序列化方法 =====

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
      lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 创建一个空的仓库实例（用于新建表单）
   */
  static forCreate(accountUuid: string): Repository {
    return new Repository({
      accountUuid,
      name: '',
      type: RepositoryTypeEnum.LOCAL,
      path: '',
      config: {
        enableGit: false,
        autoSync: false,
        syncInterval: 60,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [
          RepositoryContracts.ResourceType.MARKDOWN,
          RepositoryContracts.ResourceType.IMAGE,
          RepositoryContracts.ResourceType.PDF,
        ],
        maxFileSize: 50 * 1024 * 1024, // 50MB
        enableVersionControl: false,
      },
      status: RepositoryStatusEnum.ACTIVE,
      stats: {
        totalResources: 0,
        resourcesByType: {} as any,
        resourcesByStatus: {} as any,
        totalSize: 0,
        recentActiveResources: 0,
        favoriteResources: 0,
        lastUpdated: new Date(),
      },
    });
  }

  /**
   * 客户端缓存键
   */
  getCacheKey(): string {
    return `repository_${this.uuid}`;
  }

  /**
   * 检查是否需要刷新
   */
  shouldRefresh(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.updatedAt < fiveMinutesAgo;
  }

  /**
   * 获取路径层级
   */
  getPathSegments(): string[] {
    return this.path.split(/[/\\]/).filter((segment) => segment.length > 0);
  }

  /**
   * 获取父目录路径
   */
  getParentPath(): string {
    const segments = this.getPathSegments();
    if (segments.length <= 1) return '';
    return segments.slice(0, -1).join('/');
  }

  /**
   * 获取仓库名称（路径的最后一段）
   */
  getFolderName(): string {
    const segments = this.getPathSegments();
    return segments[segments.length - 1] || 'Repository';
  }
}
