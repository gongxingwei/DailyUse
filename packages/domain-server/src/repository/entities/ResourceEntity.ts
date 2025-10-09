/**
 * Resource 实体实现
 * 实现 ResourceServer 接口
 *
 * DDD 实体职责：
 * - 管理资源的生命周期
 * - 管理子实体（Reference、LinkedContent）
 * - 执行资源相关的业务逻辑
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';
import { ResourceReference } from './ResourceReferenceEntity';
import { LinkedContent } from './LinkedContentEntity';

type IResourceServer = RepositoryContracts.ResourceServer;
type ResourceServerDTO = RepositoryContracts.ResourceServerDTO;
type ResourcePersistenceDTO = RepositoryContracts.ResourcePersistenceDTO;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;
type ResourceMetadata = RepositoryContracts.ResourceMetadata;

/**
 * Resource 实体
 */
export class Resource extends Entity implements IResourceServer {
  // ===== 私有字段 =====
  private _repositoryUuid: string;
  private _name: string;
  private _type: ResourceType;
  private _path: string;
  private _size: number;
  private _description: string | null;
  private _author: string | null;
  private _version: string | null;
  private _tags: string[];
  private _category: string | null;
  private _status: ResourceStatus;
  private _metadata: ResourceMetadata;
  private _createdAt: number;
  private _updatedAt: number;
  private _modifiedAt: number | null;

  // ===== 子实体集合 =====
  private _references: ResourceReference[];
  private _linkedContents: LinkedContent[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    size: number;
    description?: string | null;
    author?: string | null;
    version?: string | null;
    tags?: string[];
    category?: string | null;
    status: ResourceStatus;
    metadata: ResourceMetadata;
    createdAt: number;
    updatedAt: number;
    modifiedAt?: number | null;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._repositoryUuid = params.repositoryUuid;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._size = params.size;
    this._description = params.description ?? null;
    this._author = params.author ?? null;
    this._version = params.version ?? null;
    this._tags = params.tags ?? [];
    this._category = params.category ?? null;
    this._status = params.status;
    this._metadata = params.metadata;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._modifiedAt = params.modifiedAt ?? null;
    this._references = [];
    this._linkedContents = [];
  }

  // ===== Getter 属性 =====
  public get uuid(): string {
    return this._uuid;
  }
  public get repositoryUuid(): string {
    return this._repositoryUuid;
  }
  public get name(): string {
    return this._name;
  }
  public get type(): ResourceType {
    return this._type;
  }
  public get path(): string {
    return this._path;
  }
  public get size(): number {
    return this._size;
  }
  public get description(): string | null {
    return this._description;
  }
  public get author(): string | null {
    return this._author;
  }
  public get version(): string | null {
    return this._version;
  }
  public get tags(): string[] {
    return [...this._tags];
  }
  public get category(): string | null {
    return this._category;
  }
  public get status(): ResourceStatus {
    return this._status;
  }
  public get metadata(): ResourceMetadata {
    return { ...this._metadata };
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get modifiedAt(): number | null {
    return this._modifiedAt;
  }

  public get references(): ResourceReference[] | null {
    return this._references.length > 0 ? [...this._references] : null;
  }

  public get linkedContents(): LinkedContent[] | null {
    return this._linkedContents.length > 0 ? [...this._linkedContents] : null;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 Resource 实体
   */
  public static create(params: {
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    content?: string | Uint8Array;
    description?: string;
    tags?: string[];
  }): Resource {
    const uuid = crypto.randomUUID();
    const now = Date.now();

    // 计算内容大小
    let size = 0;
    if (params.content) {
      if (typeof params.content === 'string') {
        size = new Blob([params.content]).size;
      } else {
        size = params.content.length;
      }
    }

    return new Resource({
      uuid,
      repositoryUuid: params.repositoryUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      size,
      description: params.description,
      tags: params.tags ?? [],
      status: 'ACTIVE' as ResourceStatus,
      metadata: {
        accessCount: 0,
        isFavorite: false,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 创建子实体：ResourceReference
   */
  public createReference(params: {
    targetResourceUuid: string;
    referenceType: string;
    description?: string;
  }): ResourceReference {
    const reference = ResourceReference.create({
      sourceResourceUuid: this._uuid,
      targetResourceUuid: params.targetResourceUuid,
      referenceType: params.referenceType as any, // TODO: 修正类型
      description: params.description,
    });
    return reference;
  }

  /**
   * 创建子实体：LinkedContent
   */
  public createLinkedContent(params: {
    title: string;
    url: string;
    contentType: string;
    description?: string;
  }): LinkedContent {
    const linkedContent = LinkedContent.create({
      resourceUuid: this._uuid,
      title: params.title,
      url: params.url,
      contentType: params.contentType as any, // TODO: 修正类型
      description: params.description,
    });
    return linkedContent;
  }

  // ===== 子实体管理方法 =====

  public addReference(reference: ResourceReference): void {
    if (!(reference instanceof ResourceReference)) {
      throw new Error('Reference must be an instance of ResourceReferenceEntity');
    }
    this._references.push(reference);
    this._updatedAt = Date.now();
  }

  public removeReference(referenceUuid: string): ResourceReference | null {
    const index = this._references.findIndex((r) => r.uuid === referenceUuid);
    if (index === -1) {
      return null;
    }
    const removed = this._references.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public getAllReferences(): ResourceReference[] {
    return [...this._references];
  }

  public addLinkedContent(content: LinkedContent): void {
    if (!(content instanceof LinkedContent)) {
      throw new Error('LinkedContent must be an instance of LinkedContentEntity');
    }
    this._linkedContents.push(content);
    this._updatedAt = Date.now();
  }

  public removeLinkedContent(contentUuid: string): LinkedContent | null {
    const index = this._linkedContents.findIndex((c) => c.uuid === contentUuid);
    if (index === -1) {
      return null;
    }
    const removed = this._linkedContents.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public getAllLinkedContents(): LinkedContent[] {
    return [...this._linkedContents];
  }

  // ===== 业务方法 =====

  public async updateContent(content: string | Uint8Array): Promise<void> {
    // 更新大小
    if (typeof content === 'string') {
      this._size = new Blob([content]).size;
    } else {
      this._size = content.length;
    }

    this._modifiedAt = Date.now();
    this._updatedAt = Date.now();

    // TODO: 实际的文件写入由基础设施层处理
  }

  public async move(newPath: string): Promise<void> {
    this._path = newPath;
    this._updatedAt = Date.now();

    // TODO: 实际的文件移动由基础设施层处理
  }

  public rename(newName: string): void {
    this._name = newName;
    this._updatedAt = Date.now();
  }

  public updateMetadata(metadata: Partial<ResourceMetadata>): void {
    this._metadata = {
      ...this._metadata,
      ...metadata,
    };
    this._updatedAt = Date.now();
  }

  public toggleFavorite(): void {
    this._metadata = {
      ...this._metadata,
      isFavorite: !this._metadata.isFavorite,
    };
    this._updatedAt = Date.now();
  }

  public incrementAccessCount(): void {
    this._metadata = {
      ...this._metadata,
      accessCount: (this._metadata.accessCount ?? 0) + 1,
      lastAccessedAt: Date.now(),
    };
    this._updatedAt = Date.now();
  }

  public addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
      this._updatedAt = Date.now();
    }
  }

  public removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index !== -1) {
      this._tags.splice(index, 1);
      this._updatedAt = Date.now();
    }
  }

  public setCategory(category: string): void {
    this._category = category;
    this._updatedAt = Date.now();
  }

  public archive(): void {
    this._status = 'ARCHIVED' as ResourceStatus;
    this._updatedAt = Date.now();
  }

  public activate(): void {
    this._status = 'ACTIVE' as ResourceStatus;
    this._updatedAt = Date.now();
  }

  public markAsDeleted(): void {
    this._status = 'DELETED' as ResourceStatus;
    this._updatedAt = Date.now();
  }

  public updateVersion(version: string): void {
    this._version = version;
    this._updatedAt = Date.now();
  }

  // ===== 转换方法 =====

  public toServerDTO(includeChildren = false): ResourceServerDTO {
    const dto: ResourceServerDTO = {
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
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      modifiedAt: this._modifiedAt,
    };

    if (includeChildren) {
      dto.references =
        this._references.length > 0 ? this._references.map((r) => r.toServerDTO()) : null;
      dto.linkedContents =
        this._linkedContents.length > 0 ? this._linkedContents.map((c) => c.toServerDTO()) : null;
    }

    return dto;
  }

  public toPersistenceDTO(): ResourcePersistenceDTO {
    return {
      uuid: this._uuid,
      repository_uuid: this._repositoryUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      size: this._size,
      description: this._description,
      author: this._author,
      version: this._version,
      tags: JSON.stringify(this._tags),
      category: this._category,
      status: this._status,
      metadata: JSON.stringify(this._metadata),
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      modified_at: this._modifiedAt,
    };
  }

  public static fromServerDTO(dto: ResourceServerDTO): Resource {
    const resource = new Resource({
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
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      modifiedAt: dto.modifiedAt,
    });

    // 递归创建子实体
    if (dto.references) {
      resource._references = dto.references.map((refDto) =>
        ResourceReference.fromServerDTO(refDto),
      );
    }

    if (dto.linkedContents) {
      resource._linkedContents = dto.linkedContents.map((contentDto) =>
        LinkedContent.fromServerDTO(contentDto),
      );
    }

    return resource;
  }

  public static fromPersistenceDTO(dto: ResourcePersistenceDTO): Resource {
    return new Resource({
      uuid: dto.uuid,
      repositoryUuid: dto.repository_uuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      size: dto.size,
      description: dto.description,
      author: dto.author,
      version: dto.version,
      tags: JSON.parse(dto.tags),
      category: dto.category,
      status: dto.status,
      metadata: JSON.parse(dto.metadata),
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      modifiedAt: dto.modified_at,
    });
  }

  // 实现接口要求的方法签名（作为实例方法）
  public create(params: {
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    content?: string | Uint8Array;
    description?: string;
    tags?: string[];
  }): RepositoryContracts.ResourceServer {
    return Resource.create(params);
  }

  public fromServerDTO(dto: ResourceServerDTO): RepositoryContracts.ResourceServer {
    return Resource.fromServerDTO(dto);
  }

  public fromPersistenceDTO(dto: ResourcePersistenceDTO): RepositoryContracts.ResourceServer {
    return Resource.fromPersistenceDTO(dto);
  }
}
