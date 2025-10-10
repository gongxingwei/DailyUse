/**
 * ResourceClient 实体实现
 * 兼容 ResourceClient 接口
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryContracts as RC } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';
import { LinkedContent } from './LinkedContent';
import { ResourceReference } from './ResourceReference';

type IResourceClient = RepositoryContracts.ResourceClient;
type ResourceClientDTO = RepositoryContracts.ResourceClientDTO;
type ResourceServerDTO = RepositoryContracts.ResourceServerDTO;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;
type ResourceMetadata = RepositoryContracts.ResourceMetadata;

/**
 * ResourceClient 实体
 */
export class Resource extends Entity implements IResourceClient {
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

  // UI 属性
  public get formattedSize(): string {
    return this.formatBytes(this._size);
  }

  public get formattedCreatedAt(): string {
    return this.formatDate(this._createdAt);
  }

  public get formattedUpdatedAt(): string {
    return this.formatDate(this._updatedAt);
  }

  public get formattedModifiedAt(): string | undefined {
    return this._modifiedAt ? this.formatDate(this._modifiedAt) : undefined;
  }

  public get fileExtension(): string {
    const parts = this._name.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }

  public get typeLabel(): string {
    const labels: Partial<Record<ResourceType, string>> = {
      [RC.ResourceType.MARKDOWN]: 'Markdown',
      [RC.ResourceType.CODE]: '代码',
      [RC.ResourceType.IMAGE]: '图片',
      [RC.ResourceType.VIDEO]: '视频',
      [RC.ResourceType.AUDIO]: '音频',
      [RC.ResourceType.PDF]: 'PDF',
      [RC.ResourceType.LINK]: '链接',
      [RC.ResourceType.OTHER]: '其他',
    };
    return labels[this._type] || '未知';
  }

  public get statusLabel(): string {
    const labels: Record<ResourceStatus, string> = {
      [RC.ResourceStatus.ACTIVE]: '活跃',
      [RC.ResourceStatus.ARCHIVED]: '归档',
      [RC.ResourceStatus.DELETED]: '已删除',
      [RC.ResourceStatus.DRAFT]: '草稿',
    };
    return labels[this._status] || '未知';
  }

  public get isFavorite(): boolean {
    return this._metadata.isFavorite ?? false;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  // ===== 工厂方法 =====

  /**
   * 创建一个空的 Resource 实例（用于新建表单）
   */
  public static forCreate(repositoryUuid: string): Resource {
    const uuid = Entity.generateUUID();
    const now = Date.now();
    return new Resource({
      uuid,
      repositoryUuid,
      name: '',
      type: RC.ResourceType.MARKDOWN,
      path: '',
      size: 0,
      status: RC.ResourceStatus.DRAFT,
      metadata: {
        isFavorite: false,
        isPinned: false,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  public clone(): Resource {
    return Resource.fromClientDTO(this.toClientDTO(true));
  }

  /**
   * 创建新的 ResourceClient 实体
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
    const uuid = Entity.generateUUID();
    const now = Date.now();
    const size = params.content
      ? typeof params.content === 'string'
        ? new Blob([params.content]).size
        : params.content.length
      : 0;

    return new Resource({
      uuid,
      repositoryUuid: params.repositoryUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      size,
      description: params.description,
      tags: params.tags,
      status: RC.ResourceStatus.ACTIVE,
      metadata: {
        isFavorite: false,
        isPinned: false,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 创建子实体：ResourceReference（通过实体创建）
   */
  public createReference(params: {
    targetResourceUuid: string;
    referenceType: RepositoryContracts.ReferenceType;
    description?: string;
  }): ResourceReference {
    return ResourceReference.create({
      sourceResourceUuid: this._uuid,
      targetResourceUuid: params.targetResourceUuid,
      referenceType: params.referenceType,
      description: params.description,
    });
  }

  /**
   * 创建子实体：LinkedContent（通过实体创建）
   */
  public createLinkedContent(params: {
    title: string;
    url: string;
    contentType: RepositoryContracts.ContentType;
    description?: string;
  }): LinkedContent {
    return LinkedContent.create({
      resourceUuid: this._uuid,
      title: params.title,
      url: params.url,
      contentType: params.contentType,
      description: params.description,
    });
  }

  // ===== 子实体管理方法 =====

  public addReference(reference: ResourceReference): void {
    if (!(reference instanceof ResourceReference)) {
      throw new Error('Reference must be an instance of ResourceReferenceClient');
    }
    this._references.push(reference);
    this._updatedAt = Date.now();
  }

  public removeReference(referenceUuid: string): ResourceReference | null {
    const index = this._references.findIndex((r) => r.uuid === referenceUuid);
    if (index === -1) return null;
    const removed = this._references.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public getAllReferences(): ResourceReference[] {
    return [...this._references];
  }

  public addLinkedContent(content: LinkedContent): void {
    if (!(content instanceof LinkedContent)) {
      throw new Error('Content must be an instance of LinkedContentClient');
    }
    this._linkedContents.push(content);
    this._updatedAt = Date.now();
  }

  public removeLinkedContent(contentUuid: string): LinkedContent | null {
    const index = this._linkedContents.findIndex((c) => c.uuid === contentUuid);
    if (index === -1) return null;
    const removed = this._linkedContents.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public getAllLinkedContents(): LinkedContent[] {
    return [...this._linkedContents];
  }

  // ===== 转换方法 =====

  public toServerDTO(includeChildren: boolean = false): ResourceServerDTO {
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
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      modifiedAt: this._modifiedAt,
      references: includeChildren ? this._references.map((r) => r.toServerDTO()) : undefined,
      linkedContents: includeChildren
        ? this._linkedContents.map((c) => c.toServerDTO())
        : undefined,
    };
  }

  public toClientDTO(includeChildren: boolean = false): ResourceClientDTO {
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
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      modifiedAt: this._modifiedAt,
      formattedSize: this.formattedSize,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
      formattedModifiedAt: this.formattedModifiedAt,
      fileExtension: this.fileExtension,
      typeLabel: this.typeLabel,
      statusLabel: this.statusLabel,
      isFavorite: this.isFavorite,
      references: includeChildren ? this._references.map((r) => r.toClientDTO()) : undefined,
      linkedContents: includeChildren
        ? this._linkedContents.map((c) => c.toClientDTO())
        : undefined,
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
      resource._references = dto.references.map((r) => ResourceReference.fromServerDTO(r));
    }
    if (dto.linkedContents) {
      resource._linkedContents = dto.linkedContents.map((c) => LinkedContent.fromServerDTO(c));
    }

    return resource;
  }

  public static fromClientDTO(dto: ResourceClientDTO): Resource {
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
      resource._references = dto.references.map((r) => ResourceReference.fromClientDTO(r));
    }
    if (dto.linkedContents) {
      resource._linkedContents = dto.linkedContents.map((c) => LinkedContent.fromClientDTO(c));
    }

    return resource;
  }
}
