import { RepositoryContracts } from '@dailyuse/contracts';

// 使用 RepositoryContracts 的类型定义
type ResourceDTO = RepositoryContracts.ResourceDTO;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;
type IResourceMetadata = RepositoryContracts.IResourceMetadata;
type CreateResourceRequestDTO = RepositoryContracts.CreateResourceRequestDTO;
type UpdateResourceRequestDTO = RepositoryContracts.UpdateResourceRequestDTO;

// 导入枚举值
const ResourceTypeEnum = RepositoryContracts.ResourceType;
const ResourceStatusEnum = RepositoryContracts.ResourceStatus;

/**
 * 客户端 Resource 实体
 * 添加客户端特有的展示和交互功能
 */
export class Resource {
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  description?: string;
  author?: string;
  version?: string;
  tags: string[];
  category?: string;
  status: ResourceStatus;
  metadata: IResourceMetadata;
  modifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: ResourceDTO) {
    this.uuid = data.uuid;
    this.repositoryUuid = data.repositoryUuid;
    this.name = data.name;
    this.type = data.type;
    this.path = data.path;
    this.size = data.size;
    this.description = data.description;
    this.author = data.author;
    this.version = data.version;
    this.tags = [...data.tags];
    this.category = data.category;
    this.status = data.status;
    this.metadata = { ...data.metadata };
    this.modifiedAt = data.modifiedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // ===== 客户端特有计算属性 =====

  /**
   * 获取文件类型显示文本
   */
  get typeText(): string {
    const typeMap = {
      [ResourceTypeEnum.MARKDOWN]: 'Markdown文档',
      [ResourceTypeEnum.IMAGE]: '图片',
      [ResourceTypeEnum.VIDEO]: '视频',
      [ResourceTypeEnum.AUDIO]: '音频',
      [ResourceTypeEnum.PDF]: 'PDF文档',
      [ResourceTypeEnum.LINK]: '链接',
      [ResourceTypeEnum.CODE]: '代码',
      [ResourceTypeEnum.OTHER]: '其他',
    };
    return typeMap[this.type] || '未知类型';
  }

  /**
   * 获取文件类型图标
   */
  get typeIcon(): string {
    const iconMap = {
      [ResourceTypeEnum.MARKDOWN]: 'file-text',
      [ResourceTypeEnum.IMAGE]: 'image',
      [ResourceTypeEnum.VIDEO]: 'video',
      [ResourceTypeEnum.AUDIO]: 'music',
      [ResourceTypeEnum.PDF]: 'file-pdf',
      [ResourceTypeEnum.LINK]: 'link',
      [ResourceTypeEnum.CODE]: 'code',
      [ResourceTypeEnum.OTHER]: 'file',
    };
    return iconMap[this.type] || 'file';
  }

  /**
   * 获取状态显示文本
   */
  get statusText(): string {
    const statusMap = {
      [ResourceStatusEnum.ACTIVE]: '正常',
      [ResourceStatusEnum.ARCHIVED]: '已归档',
      [ResourceStatusEnum.DELETED]: '已删除',
      [ResourceStatusEnum.DRAFT]: '草稿',
    };
    return statusMap[this.status] || '未知';
  }

  /**
   * 获取状态颜色
   */
  get statusColor(): string {
    const colorMap = {
      [ResourceStatusEnum.ACTIVE]: '#4CAF50',
      [ResourceStatusEnum.ARCHIVED]: '#FF9800',
      [ResourceStatusEnum.DELETED]: '#F44336',
      [ResourceStatusEnum.DRAFT]: '#9E9E9E',
    };
    return colorMap[this.status] || '#9E9E9E';
  }

  /**
   * 获取格式化的文件大小
   */
  get sizeText(): string {
    return this.formatFileSize(this.size);
  }

  /**
   * 是否为图片
   */
  get isImage(): boolean {
    return this.type === ResourceTypeEnum.IMAGE;
  }

  /**
   * 是否为视频
   */
  get isVideo(): boolean {
    return this.type === ResourceTypeEnum.VIDEO;
  }

  /**
   * 是否为音频
   */
  get isAudio(): boolean {
    return this.type === ResourceTypeEnum.AUDIO;
  }

  /**
   * 是否为文档
   */
  get isDocument(): boolean {
    return this.type === ResourceTypeEnum.MARKDOWN || this.type === ResourceTypeEnum.PDF;
  }

  /**
   * 是否为链接
   */
  get isLink(): boolean {
    return this.type === ResourceTypeEnum.LINK;
  }

  /**
   * 是否为代码文件
   */
  get isCode(): boolean {
    return this.type === ResourceTypeEnum.CODE;
  }

  /**
   * 是否已删除
   */
  get isDeleted(): boolean {
    return this.status === ResourceStatusEnum.DELETED;
  }

  /**
   * 是否已归档
   */
  get isArchived(): boolean {
    return this.status === ResourceStatusEnum.ARCHIVED;
  }

  /**
   * 是否为草稿
   */
  get isDraft(): boolean {
    return this.status === ResourceStatusEnum.DRAFT;
  }

  /**
   * 是否为收藏
   */
  get isFavorite(): boolean {
    return this.metadata.isFavorite || false;
  }

  /**
   * 获取访问次数
   */
  get accessCount(): number {
    return this.metadata.accessCount || 0;
  }

  /**
   * 获取最后访问时间文本
   */
  get lastAccessText(): string {
    if (!this.metadata.lastAccessedAt) return '从未访问';
    return this.getRelativeTimeText(new Date(this.metadata.lastAccessedAt));
  }

  /**
   * 获取文件扩展名
   */
  get extension(): string {
    const lastDotIndex = this.name.lastIndexOf('.');
    return lastDotIndex > 0 ? this.name.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  /**
   * 获取不含扩展名的文件名
   */
  get baseName(): string {
    const lastDotIndex = this.name.lastIndexOf('.');
    return lastDotIndex > 0 ? this.name.substring(0, lastDotIndex) : this.name;
  }

  /**
   * 获取标签列表文本
   */
  get tagsText(): string {
    return this.tags.length > 0 ? this.tags.join(', ') : '无标签';
  }

  /**
   * 获取目录层级
   */
  get pathSegments(): string[] {
    return this.path.split(/[/\\]/).filter((segment) => segment.length > 0);
  }

  /**
   * 获取父目录路径
   */
  get parentPath(): string {
    const segments = this.pathSegments;
    if (segments.length <= 1) return '';
    return segments.slice(0, -1).join('/');
  }

  /**
   * 获取目录名称
   */
  get directoryName(): string {
    const parentPath = this.parentPath;
    return parentPath ? parentPath.split('/').pop() || '' : '';
  }

  // ===== 权限和状态检查 =====

  /**
   * 是否可以编辑
   */
  get canEdit(): boolean {
    return this.status === ResourceStatusEnum.ACTIVE || this.status === ResourceStatusEnum.DRAFT;
  }

  /**
   * 是否可以删除
   */
  get canDelete(): boolean {
    return this.status !== ResourceStatusEnum.DELETED;
  }

  /**
   * 是否可以恢复
   */
  get canRestore(): boolean {
    return (
      this.status === ResourceStatusEnum.DELETED || this.status === ResourceStatusEnum.ARCHIVED
    );
  }

  /**
   * 是否可以归档
   */
  get canArchive(): boolean {
    return this.status === ResourceStatusEnum.ACTIVE;
  }

  /**
   * 是否可以发布（从草稿状态）
   */
  get canPublish(): boolean {
    return this.status === ResourceStatusEnum.DRAFT;
  }

  /**
   * 是否可以预览
   */
  get canPreview(): boolean {
    return this.isImage || this.isVideo || this.isAudio || this.isDocument || this.isLink;
  }

  /**
   * 是否支持在线编辑
   */
  get canEditOnline(): boolean {
    return this.type === ResourceTypeEnum.MARKDOWN || this.type === ResourceTypeEnum.CODE;
  }

  // ===== 客户端方法 =====

  /**
   * 切换收藏状态
   */
  toggleFavorite(): void {
    this.metadata.isFavorite = !this.isFavorite;
    this.updatedAt = new Date();
  }

  /**
   * 添加标签
   */
  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * 设置分类
   */
  setCategory(category?: string): void {
    this.category = category;
    this.updatedAt = new Date();
  }

  /**
   * 记录访问
   */
  recordAccess(): void {
    this.metadata.lastAccessedAt = new Date();
    this.metadata.accessCount = (this.metadata.accessCount || 0) + 1;
    this.updatedAt = new Date();
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
  private getRelativeTimeText(date: Date): string {
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
   * 获取修改时间的相对时间
   */
  getRelativeModifiedTime(): string {
    if (!this.modifiedAt) return '从未修改';
    return this.getRelativeTimeText(this.modifiedAt);
  }

  /**
   * 检查是否可以执行某个操作
   */
  canPerformAction(
    action: 'edit' | 'delete' | 'restore' | 'archive' | 'publish' | 'preview' | 'editOnline',
  ): boolean {
    switch (action) {
      case 'edit':
        return this.canEdit;
      case 'delete':
        return this.canDelete;
      case 'restore':
        return this.canRestore;
      case 'archive':
        return this.canArchive;
      case 'publish':
        return this.canPublish;
      case 'preview':
        return this.canPreview;
      case 'editOnline':
        return this.canEditOnline;
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
        key: 'preview',
        label: '预览',
        icon: 'eye',
        disabled: !this.canPerformAction('preview'),
      },
      {
        key: 'edit',
        label: '编辑',
        icon: 'edit',
        disabled: !this.canPerformAction('edit'),
      },
      {
        key: 'editOnline',
        label: '在线编辑',
        icon: 'edit-2',
        disabled: !this.canPerformAction('editOnline'),
      },
      {
        key: 'favorite',
        label: this.isFavorite ? '取消收藏' : '收藏',
        icon: this.isFavorite ? 'heart-filled' : 'heart',
        disabled: false,
      },
      {
        key: 'publish',
        label: '发布',
        icon: 'send',
        disabled: !this.canPerformAction('publish'),
      },
      {
        key: 'archive',
        label: '归档',
        icon: 'archive',
        disabled: !this.canPerformAction('archive'),
      },
      {
        key: 'restore',
        label: '恢复',
        icon: 'refresh',
        disabled: !this.canPerformAction('restore'),
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

  /**
   * 获取预览URL（如果支持）
   */
  getPreviewUrl(baseUrl?: string): string | null {
    if (!this.canPreview) return null;

    const base = baseUrl || '';

    if (this.isLink) {
      // 如果是链接类型，直接返回链接地址（如果存储在metadata中）
      return this.metadata.url || null;
    }

    // 对于其他类型，构建预览URL
    return `${base}/api/repositories/${this.repositoryUuid}/resources/${this.uuid}/preview`;
  }

  /**
   * 获取下载URL
   */
  getDownloadUrl(baseUrl?: string): string {
    const base = baseUrl || '';
    return `${base}/api/repositories/${this.repositoryUuid}/resources/${this.uuid}/download`;
  }

  /**
   * 获取缩略图URL（如果支持）
   */
  getThumbnailUrl(baseUrl?: string): string | null {
    if (!this.metadata.thumbnailPath) return null;

    const base = baseUrl || '';
    return `${base}/api/repositories/${this.repositoryUuid}/resources/${this.uuid}/thumbnail`;
  }

  // ===== 客户端数据转换方法 =====

  /**
   * 转换为表单数据
   */
  toFormData(): {
    name: string;
    description: string;
    author: string;
    version: string;
    tags: string[];
    category: string;
    status: ResourceStatus;
  } {
    return {
      name: this.name,
      description: this.description || '',
      author: this.author || '',
      version: this.version || '',
      tags: [...this.tags],
      category: this.category || '',
      status: this.status,
    };
  }

  /**
   * 获取展示用的元数据信息
   */
  getMetadataDisplay(): Array<{ label: string; value: string }> {
    const display = [
      { label: '文件大小', value: this.sizeText },
      { label: '创建时间', value: this.createdAt.toLocaleString() },
      { label: '修改时间', value: this.modifiedAt?.toLocaleString() || '从未修改' },
      { label: '访问次数', value: this.accessCount.toString() },
      { label: '最后访问', value: this.lastAccessText },
    ];

    if (this.author) {
      display.push({ label: '作者', value: this.author });
    }

    if (this.version) {
      display.push({ label: '版本', value: this.version });
    }

    if (this.metadata.mimeType) {
      display.push({ label: 'MIME类型', value: this.metadata.mimeType });
    }

    if (this.metadata.encoding) {
      display.push({ label: '编码', value: this.metadata.encoding });
    }

    // 根据文件类型添加特定元数据
    if (this.isImage) {
      if (this.metadata.imageWidth && this.metadata.imageHeight) {
        display.push({
          label: '图片尺寸',
          value: `${this.metadata.imageWidth} × ${this.metadata.imageHeight}`,
        });
      }
    }

    if (this.isVideo || this.isAudio) {
      if (this.metadata.duration) {
        display.push({
          label: '时长',
          value: this.formatDuration(this.metadata.duration),
        });
      }
    }

    if (this.isVideo) {
      if (this.metadata.videoWidth && this.metadata.videoHeight) {
        display.push({
          label: '视频尺寸',
          value: `${this.metadata.videoWidth} × ${this.metadata.videoHeight}`,
        });
      }
    }

    if (this.type === ResourceTypeEnum.MARKDOWN) {
      if (this.metadata.wordCount) {
        display.push({ label: '字数', value: this.metadata.wordCount.toString() });
      }
      if (this.metadata.characterCount) {
        display.push({ label: '字符数', value: this.metadata.characterCount.toString() });
      }
    }

    return display;
  }

  /**
   * 格式化时长（秒）
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // ===== 序列化方法 =====

  static fromDTO(dto: ResourceDTO): Resource {
    return new Resource(dto);
  }

  /**
   * 转换为DTO
   */
  toDTO(): ResourceDTO {
    return {
      uuid: this.uuid,
      repositoryUuid: this.repositoryUuid,
      name: this.name,
      type: this.type,
      path: this.path,
      size: this.size,
      description: this.description,
      author: this.author,
      version: this.version,
      tags: [...this.tags],
      category: this.category,
      status: this.status,
      metadata: { ...this.metadata },
      modifiedAt: this.modifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 创建一个空的资源实例（用于新建表单）
   */
  static forCreate(repositoryUuid: string): Resource {
    const now = new Date();
    return new Resource({
      uuid: '',
      repositoryUuid,
      name: '',
      type: ResourceTypeEnum.MARKDOWN,
      path: '',
      size: 0,
      tags: [],
      status: ResourceStatusEnum.DRAFT,
      metadata: {
        isFavorite: false,
        accessCount: 0,
        lastAccessedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 客户端缓存键
   */
  getCacheKey(): string {
    return `resource_${this.uuid}`;
  }

  /**
   * 检查是否需要刷新
   */
  shouldRefresh(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.updatedAt < fiveMinutesAgo;
  }
}
