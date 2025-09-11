/**
 * Resource - 资源实体
 * 知识文档系统中的具体资源，包括MD文件、图片等
 */

import { Entity } from '@dailyuse/utils';
import { RepositoryContracts } from '@dailyuse/contracts';

// 使用 RepositoryContracts 的类型定义
type IResource = RepositoryContracts.IResource;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;
type IResourceMetadata = RepositoryContracts.IResourceMetadata;
type ResourceDTO = RepositoryContracts.ResourceDTO;

// 导入枚举值
const ResourceStatusEnum = RepositoryContracts.ResourceStatus;
const ResourceTypeEnum = RepositoryContracts.ResourceType;

export class Resource extends Entity implements IResource {
  private _repositoryUuid: string;
  private _name: string;
  private _type: ResourceType;
  private _path: string;
  private _size: number;
  private _description?: string;
  private _author?: string;
  private _version?: string;
  private _tags: string[];
  private _category?: string;
  private _status: ResourceStatus;
  private _metadata: IResourceMetadata;
  private _modifiedAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    size: number;
    description?: string;
    author?: string;
    version?: string;
    tags?: string[];
    category?: string;
    status?: ResourceStatus;
    metadata: IResourceMetadata;
    modifiedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || Entity.generateUUID());

    this._repositoryUuid = params.repositoryUuid;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._size = params.size;
    this._description = params.description;
    this._author = params.author;
    this._version = params.version;
    this._tags = params.tags || [];
    this._category = params.category;
    this._status = params.status || ResourceStatusEnum.ACTIVE;
    this._metadata = params.metadata;
    this._modifiedAt = params.modifiedAt;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();

    this.validateResource();
  }

  // ============ IResource 接口实现 ============
  get repositoryUuid(): string {
    return this._repositoryUuid;
  }
  get name(): string {
    return this._name;
  }
  get type(): ResourceType {
    return this._type;
  }
  get path(): string {
    return this._path;
  }
  get size(): number {
    return this._size;
  }
  get description(): string | undefined {
    return this._description;
  }
  get author(): string | undefined {
    return this._author;
  }
  get version(): string | undefined {
    return this._version;
  }
  get tags(): string[] {
    return [...this._tags];
  }
  get category(): string | undefined {
    return this._category;
  }
  get status(): ResourceStatus {
    return this._status;
  }
  get metadata(): IResourceMetadata {
    return { ...this._metadata };
  }
  get modifiedAt(): Date | undefined {
    return this._modifiedAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============ 业务方法 ============

  /**
   * 更新资源名称
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('资源名称不能为空');
    }
    this._name = name.trim();
    this._updatedAt = new Date();
  }

  /**
   * 更新资源描述
   */
  updateDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  /**
   * 更新资源作者
   */
  updateAuthor(author?: string): void {
    this._author = author;
    this._updatedAt = new Date();
  }

  /**
   * 更新资源版本
   */
  updateVersion(version?: string): void {
    this._version = version;
    this._updatedAt = new Date();
  }

  /**
   * 更新资源分类
   */
  updateCategory(category?: string): void {
    this._category = category;
    this._updatedAt = new Date();
  }

  /**
   * 添加标签
   */
  addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) return;

    const trimmedTag = tag.trim();
    if (!this._tags.includes(trimmedTag)) {
      this._tags.push(trimmedTag);
      this._updatedAt = new Date();
    }
  }

  /**
   * 批量添加标签
   */
  addTags(tags: string[]): void {
    let hasChanges = false;
    tags.forEach((tag) => {
      if (tag && tag.trim().length > 0) {
        const trimmedTag = tag.trim();
        if (!this._tags.includes(trimmedTag)) {
          this._tags.push(trimmedTag);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      this._updatedAt = new Date();
    }
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  /**
   * 清空所有标签
   */
  clearTags(): void {
    if (this._tags.length > 0) {
      this._tags = [];
      this._updatedAt = new Date();
    }
  }

  /**
   * 更新资源大小
   */
  updateSize(size: number): void {
    if (size < 0) {
      throw new Error('资源大小不能为负数');
    }
    this._size = size;
    this._updatedAt = new Date();
  }

  /**
   * 更新路径
   */
  updatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('资源路径不能为空');
    }
    this._path = path.trim();
    this._updatedAt = new Date();
  }

  /**
   * 更新元数据
   */
  updateMetadata(metadata: Partial<IResourceMetadata>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._updatedAt = new Date();
  }

  /**
   * 激活资源
   */
  activate(): void {
    if (this._status !== ResourceStatusEnum.ACTIVE) {
      this._status = ResourceStatusEnum.ACTIVE;
      this._updatedAt = new Date();
    }
  }

  /**
   * 归档资源
   */
  archive(): void {
    if (this._status !== ResourceStatusEnum.ARCHIVED) {
      this._status = ResourceStatusEnum.ARCHIVED;
      this._updatedAt = new Date();
    }
  }

  /**
   * 删除资源
   */
  delete(): void {
    if (this._status !== ResourceStatusEnum.DELETED) {
      this._status = ResourceStatusEnum.DELETED;
      this._updatedAt = new Date();
    }
  }

  /**
   * 设为草稿
   */
  setDraft(): void {
    if (this._status !== ResourceStatusEnum.DRAFT) {
      this._status = ResourceStatusEnum.DRAFT;
      this._updatedAt = new Date();
    }
  }

  /**
   * 记录修改时间
   */
  markAsModified(): void {
    this._modifiedAt = new Date();
    this._updatedAt = new Date();
  }

  // ============ 查询方法 ============

  /**
   * 检查是否为活跃状态
   */
  isActive(): boolean {
    return this._status === ResourceStatusEnum.ACTIVE;
  }

  /**
   * 检查是否已归档
   */
  isArchived(): boolean {
    return this._status === ResourceStatusEnum.ARCHIVED;
  }

  /**
   * 检查是否已删除
   */
  isDeleted(): boolean {
    return this._status === ResourceStatusEnum.DELETED;
  }

  /**
   * 检查是否为草稿
   */
  isDraft(): boolean {
    return this._status === ResourceStatusEnum.DRAFT;
  }

  /**
   * 检查是否包含特定标签
   */
  hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  /**
   * 检查是否包含任意标签
   */
  hasAnyTag(tags: string[]): boolean {
    return tags.some((tag) => this._tags.includes(tag));
  }

  /**
   * 检查是否包含所有标签
   */
  hasAllTags(tags: string[]): boolean {
    return tags.every((tag) => this._tags.includes(tag));
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string {
    const lastDotIndex = this._name.lastIndexOf('.');
    return lastDotIndex > 0 ? this._name.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  /**
   * 获取不含扩展名的文件名
   */
  getBaseName(): string {
    const lastDotIndex = this._name.lastIndexOf('.');
    return lastDotIndex > 0 ? this._name.substring(0, lastDotIndex) : this._name;
  }

  // ============ 验证方法 ============

  /**
   * 验证资源数据
   */
  private validateResource(): void {
    this.validateName(this._name);
    this.validatePath(this._path);
    this.validateSize(this._size);
    this.validateType(this._type);
  }

  /**
   * 验证资源名称
   */
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('资源名称不能为空');
    }
    if (name.length > 255) {
      throw new Error('资源名称不能超过255个字符');
    }
  }

  /**
   * 验证资源路径
   */
  private validatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('资源路径不能为空');
    }
    if (path.length > 1000) {
      throw new Error('资源路径不能超过1000个字符');
    }
  }

  /**
   * 验证资源大小
   */
  private validateSize(size: number): void {
    if (size < 0) {
      throw new Error('资源大小不能为负数');
    }
  }

  /**
   * 验证资源类型
   */
  private validateType(type: ResourceType): void {
    const validTypes = Object.values(ResourceTypeEnum);
    if (!validTypes.includes(type)) {
      throw new Error(`无效的资源类型: ${type}`);
    }
  }

  // ============ 转换方法 ============

  /**
   * 转换为DTO
   */
  toDTO(): ResourceDTO {
    return {
      uuid: this.uuid,
      repositoryUuid: this._repositoryUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      size: this._size,
      description: this._description,
      author: this._author,
      version: this._version,
      tags: [...this._tags],
      category: this._category,
      status: this._status,
      metadata: { ...this._metadata },
      modifiedAt: this._modifiedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 从DTO创建实例
   */
  static fromDTO(dto: ResourceDTO): Resource {
    return new Resource({
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      size: dto.size,
      description: dto.description,
      author: dto.author,
      version: dto.version,
      tags: dto.tags,
      category: dto.category,
      status: dto.status,
      metadata: dto.metadata,
      modifiedAt: dto.modifiedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 创建新资源
   */
  static create(params: {
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    size: number;
    description?: string;
    author?: string;
    version?: string;
    tags?: string[];
    category?: string;
    metadata?: Partial<IResourceMetadata>;
  }): Resource {
    const now = new Date();
    const metadata: IResourceMetadata = {
      isFavorite: false,
      accessCount: 0,
      lastAccessedAt: now,
      ...params.metadata,
    };

    return new Resource({
      repositoryUuid: params.repositoryUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      size: params.size,
      description: params.description,
      author: params.author,
      version: params.version || '1.0.0',
      tags: params.tags || [],
      category: params.category,
      status: ResourceStatusEnum.ACTIVE,
      metadata,
      createdAt: now,
      updatedAt: now,
    });
  }
}
