/**
 * Resource Entity - 资源实体
 * 仓库中的文件/资源
 */

import { Entity } from '@dailyuse/utils';
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

export class Resource extends Entity {
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

  constructor(params: ResourceDTO) {
    super(params.uuid);
    this.repositoryUuid = params.repositoryUuid;
    this.name = params.name;
    this.type = params.type;
    this.path = params.path;
    this.size = params.size;
    this.metadata = params.metadata;
    this.description = params.description;
    this.author = params.author;
    this.version = params.version;
    this.tags = params.tags;
    this.category = params.category;
    this.status = params.status;
    this.modifiedAt = params.modifiedAt;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  // ============ 工厂方法 ============

  /**
   * 创建新资源
   */
  static async create(data: CreateResourceRequestDTO, repositoryUuid: string): Promise<Resource> {
    const uuid = crypto.randomUUID();
    const now = new Date();

    // 检测文件类型
    const type = this.detectFileType(data.name, data.path);

    // 计算文件大小
    const size = this.calculateSize(data.content);

    // 创建基础元数据
    const metadata: IResourceMetadata = {
      ...data.metadata,
      checksum: data.content ? this.calculateChecksum(data.content) : undefined,
      lastAccessedAt: now,
      accessCount: 0,
      isFavorite: false,
      ...this.generateMetadataByType(type, data.content),
    };

    const resourceData: ResourceDTO = {
      uuid,
      repositoryUuid,
      name: data.name,
      type,
      path: data.path,
      size,
      metadata,
      description: data.description,
      author: data.author,
      version: '1.0.0',
      tags: data.tags || [],
      category: data.category,
      status: ResourceStatusEnum.ACTIVE,
      modifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    return new Resource(resourceData);
  }

  /**
   * 从DTO创建实例
   */
  static fromDTO(dto: ResourceDTO): Resource {
    return new Resource(dto);
  }

  // ============ 业务方法 ============

  /**
   * 更新资源信息
   */
  update(data: UpdateResourceRequestDTO): void {
    if (data.name && data.name !== this.name) {
      this.name = data.name;
    }

    if (data.description !== undefined) {
      this.description = data.description;
    }

    if (data.author !== undefined) {
      this.author = data.author;
    }

    if (data.version && data.version !== this.version) {
      this.version = data.version;
    }

    if (data.tags !== undefined) {
      this.tags = [...data.tags];
    }

    if (data.category !== undefined) {
      this.category = data.category;
    }

    if (data.status && data.status !== this.status) {
      this.status = data.status;
    }

    if (data.metadata) {
      this.metadata = { ...this.metadata, ...data.metadata };
    }

    this.updatedAt = new Date();
  }

  /**
   * 移动资源到新路径
   */
  move(newPath: string): void {
    if (newPath === this.path) {
      return;
    }

    this.path = newPath;
    this.updatedAt = new Date();
  }

  /**
   * 重命名资源
   */
  rename(newName: string): void {
    if (newName === this.name) {
      return;
    }

    const oldType = this.type;
    this.name = newName;

    // 重新检测文件类型
    this.type = Resource.detectFileType(newName, this.path);

    // 如果类型改变，更新元数据
    if (oldType !== this.type) {
      this.metadata = {
        ...this.metadata,
        ...Resource.generateMetadataByType(this.type),
      };
    }

    this.updatedAt = new Date();
  }

  /**
   * 添加标签
   */
  addTags(tags: string[]): void {
    const newTags = tags.filter((tag) => !this.tags.includes(tag));
    if (newTags.length > 0) {
      this.tags.push(...newTags);
      this.updatedAt = new Date();
    }
  }

  /**
   * 移除标签
   */
  removeTags(tags: string[]): void {
    const originalLength = this.tags.length;
    this.tags = this.tags.filter((tag) => !tags.includes(tag));

    if (this.tags.length !== originalLength) {
      this.updatedAt = new Date();
    }
  }

  /**
   * 设置收藏状态
   */
  setFavorite(isFavorite: boolean): void {
    if (this.metadata.isFavorite !== isFavorite) {
      this.metadata.isFavorite = isFavorite;
      this.updatedAt = new Date();
    }
  }

  /**
   * 记录访问
   */
  recordAccess(): void {
    this.metadata.lastAccessedAt = new Date();
    this.metadata.accessCount = (this.metadata.accessCount || 0) + 1;
    this.updatedAt = new Date();
  }

  /**
   * 更新文件内容
   */
  updateContent(content: string | Uint8Array, version?: string): void {
    this.size = Resource.calculateSize(content);
    this.metadata.checksum = Resource.calculateChecksum(content);

    if (version) {
      this.version = version;
    }

    this.modifiedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 归档资源
   */
  archive(): void {
    this.status = ResourceStatusEnum.ARCHIVED;
    this.updatedAt = new Date();
  }

  /**
   * 恢复资源
   */
  restore(): void {
    this.status = ResourceStatusEnum.ACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * 软删除资源
   */
  softDelete(): void {
    this.status = ResourceStatusEnum.DELETED;
    this.updatedAt = new Date();
  }

  // ============ 查询方法 ============

  /**
   * 检查是否为图片资源
   */
  isImage(): boolean {
    return this.type === ResourceTypeEnum.IMAGE;
  }

  /**
   * 检查是否为音频资源
   */
  isAudio(): boolean {
    return this.type === ResourceTypeEnum.AUDIO;
  }

  /**
   * 检查是否为视频资源
   */
  isVideo(): boolean {
    return this.type === ResourceTypeEnum.VIDEO;
  }

  /**
   * 检查是否为文档资源
   */
  isDocument(): boolean {
    return this.type === ResourceTypeEnum.MARKDOWN || this.type === ResourceTypeEnum.PDF;
  }

  /**
   * 检查是否已删除
   */
  isDeleted(): boolean {
    return this.status === ResourceStatusEnum.DELETED;
  }

  /**
   * 检查是否已归档
   */
  isArchived(): boolean {
    return this.status === ResourceStatusEnum.ARCHIVED;
  }

  /**
   * 检查是否为收藏
   */
  isFavorite(): boolean {
    return this.metadata.isFavorite || false;
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string {
    const lastDotIndex = this.name.lastIndexOf('.');
    return lastDotIndex > 0 ? this.name.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  /**
   * 获取不含扩展名的文件名
   */
  getBaseName(): string {
    const lastDotIndex = this.name.lastIndexOf('.');
    return lastDotIndex > 0 ? this.name.substring(0, lastDotIndex) : this.name;
  }

  // ============ 静态工具方法 ============

  /**
   * 检测文件类型
   */
  private static detectFileType(fileName: string, filePath?: string): ResourceType {
    const extension = fileName.toLowerCase().split('.').pop() || '';

    // 图片文件
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return ResourceTypeEnum.IMAGE;
    }

    // 音频文件
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)) {
      return ResourceTypeEnum.AUDIO;
    }

    // 视频文件
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
      return ResourceTypeEnum.VIDEO;
    }

    // Markdown文档
    if (['md', 'markdown'].includes(extension)) {
      return ResourceTypeEnum.MARKDOWN;
    }

    // PDF文档
    if (['pdf'].includes(extension)) {
      return ResourceTypeEnum.PDF;
    }

    // 链接文件
    if (['url', 'webloc'].includes(extension)) {
      return ResourceTypeEnum.LINK;
    }

    // 代码文件
    if (
      ['js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml'].includes(extension)
    ) {
      return ResourceTypeEnum.CODE;
    }

    // 默认为其他类型
    return ResourceTypeEnum.OTHER;
  }

  /**
   * 计算内容大小
   */
  private static calculateSize(content?: string | Uint8Array): number {
    if (!content) return 0;

    if (typeof content === 'string') {
      return new Blob([content]).size;
    }

    return content.length;
  }

  /**
   * 计算内容校验和
   */
  private static calculateChecksum(content: string | Uint8Array): string {
    // 简单的哈希算法，实际项目中应该使用更强的哈希算法
    let hash = 0;
    const str = typeof content === 'string' ? content : new TextDecoder().decode(content);

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * 根据文件类型生成特定元数据
   */
  private static generateMetadataByType(
    type: ResourceType,
    content?: string | Uint8Array,
  ): Partial<IResourceMetadata> {
    const metadata: Partial<IResourceMetadata> = {};

    switch (type) {
      case ResourceTypeEnum.IMAGE:
        // 对于图片，可以添加尺寸、颜色深度等信息
        metadata.imageWidth = 0;
        metadata.imageHeight = 0;
        break;

      case ResourceTypeEnum.AUDIO:
        // 对于音频，可以添加时长、比特率等信息
        metadata.duration = 0;
        metadata.bitRate = 0;
        break;

      case ResourceTypeEnum.VIDEO:
        // 对于视频，可以添加时长、分辨率、编码等信息
        metadata.duration = 0;
        metadata.videoWidth = 0;
        metadata.videoHeight = 0;
        break;

      case ResourceTypeEnum.MARKDOWN:
        // 对于Markdown，可以添加字数、标题等信息
        if (typeof content === 'string') {
          metadata.wordCount = content.split(/\s+/).length;
          metadata.characterCount = content.length;
        }
        break;

      default:
        break;
    }

    return metadata;
  }

  // ============ DTO转换 ============

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

  // ============ Getter方法 ============

  getRepositoryUuid(): string {
    return this.repositoryUuid;
  }
  getName(): string {
    return this.name;
  }
  getType(): ResourceType {
    return this.type;
  }
  getPath(): string {
    return this.path;
  }
  getSize(): number {
    return this.size;
  }
  getDescription(): string | undefined {
    return this.description;
  }
  getAuthor(): string | undefined {
    return this.author;
  }
  getVersion(): string | undefined {
    return this.version;
  }
  getTags(): string[] {
    return [...this.tags];
  }
  getCategory(): string | undefined {
    return this.category;
  }
  getStatus(): ResourceStatus {
    return this.status;
  }
  getMetadata(): IResourceMetadata {
    return { ...this.metadata };
  }
  getModifiedAt(): Date | undefined {
    return this.modifiedAt;
  }
}
