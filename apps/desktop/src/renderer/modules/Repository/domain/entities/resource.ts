import { Entity } from '@dailyuse/utils';
import { RepositoryContracts } from '@dailyuse/contracts';

// 使用 RepositoryContracts 的类型定义
type ResourceDTO = RepositoryContracts.ResourceDTO;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;
type IResourceMetadata = RepositoryContracts.IResourceMetadata;

export class Resource extends Entity {
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
    this._status = params.status || RepositoryContracts.ResourceStatus.ACTIVE;
    this._metadata = params.metadata;
    this._modifiedAt = params.modifiedAt;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
  }

  // ============ Getters ============
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
  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  updateAuthor(author?: string): void {
    this._author = author;
    this._updatedAt = new Date();
  }

  updateVersion(version?: string): void {
    this._version = version;
    this._updatedAt = new Date();
  }

  updateCategory(category?: string): void {
    this._category = category;
    this._updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) return;
    const trimmedTag = tag.trim();
    if (!this._tags.includes(trimmedTag)) {
      this._tags.push(trimmedTag);
      this._updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  clearTags(): void {
    if (this._tags.length > 0) {
      this._tags = [];
      this._updatedAt = new Date();
    }
  }

  updateSize(size: number): void {
    this._size = size;
    this._updatedAt = new Date();
  }

  updatePath(path: string): void {
    this._path = path;
    this._updatedAt = new Date();
  }

  updateMetadata(metadata: Partial<IResourceMetadata>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._updatedAt = new Date();
  }

  activate(): void {
    this._status = RepositoryContracts.ResourceStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  archive(): void {
    this._status = RepositoryContracts.ResourceStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  delete(): void {
    this._status = RepositoryContracts.ResourceStatus.DELETED;
    this._updatedAt = new Date();
  }

  setDraft(): void {
    this._status = RepositoryContracts.ResourceStatus.DRAFT;
    this._updatedAt = new Date();
  }

  markAsModified(): void {
    this._modifiedAt = new Date();
    this._updatedAt = new Date();
  }

  // ============ 查询方法 ============
  isActive(): boolean {
    return this._status === RepositoryContracts.ResourceStatus.ACTIVE;
  }

  isArchived(): boolean {
    return this._status === RepositoryContracts.ResourceStatus.ARCHIVED;
  }

  isDeleted(): boolean {
    return this._status === RepositoryContracts.ResourceStatus.DELETED;
  }

  isDraft(): boolean {
    return this._status === RepositoryContracts.ResourceStatus.DRAFT;
  }

  hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  getFileExtension(): string {
    const lastDotIndex = this._name.lastIndexOf('.');
    return lastDotIndex > 0 ? this._name.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  getBaseName(): string {
    const lastDotIndex = this._name.lastIndexOf('.');
    return lastDotIndex > 0 ? this._name.substring(0, lastDotIndex) : this._name;
  }

  // ============ 静态方法 ============
  static isResource(obj: any): obj is Resource {
    return (
      obj instanceof Resource ||
      (obj &&
        typeof obj.uuid === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.path === 'string' &&
        typeof obj.repositoryUuid === 'string')
    );
  }

  static ensureResource(obj: any): Resource | null {
    if (obj instanceof Resource) {
      return obj;
    }
    if (Resource.isResource(obj)) {
      return Resource.fromDTO(obj);
    }
    return null;
  }

  clone(): Resource {
    return new Resource({
      uuid: this._uuid,
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
      createdAt: new Date(this._createdAt.getTime()),
      updatedAt: new Date(this._updatedAt.getTime()),
    });
  }

  toDTO(): ResourceDTO {
    return {
      uuid: this._uuid,
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
      status: RepositoryContracts.ResourceStatus.ACTIVE,
      metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static forCreate(repositoryUuid: string): Resource {
    const now = new Date();
    return new Resource({
      repositoryUuid,
      name: '',
      type: RepositoryContracts.ResourceType.OTHER,
      path: '',
      size: 0,
      description: '',
      author: '',
      version: '1.0.0',
      tags: [],
      category: '',
      status: RepositoryContracts.ResourceStatus.DRAFT,
      metadata: {
        isFavorite: false,
        accessCount: 0,
        lastAccessedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });
  }
}
