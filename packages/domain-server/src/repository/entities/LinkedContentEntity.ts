/**
 * LinkedContent 实体实现
 * 实现 LinkedContentServer 接口
 *
 * DDD 实体职责：
 * - 管理外部链接内容
 * - 跟踪可访问性状态
 * - 管理缓存
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type ILinkedContentServer = RepositoryContracts.LinkedContentServer;
type LinkedContentServerDTO = RepositoryContracts.LinkedContentServerDTO;
type LinkedContentPersistenceDTO = RepositoryContracts.LinkedContentPersistenceDTO;
type ContentType = RepositoryContracts.ContentType;

/**
 * LinkedContent 实体
 */
export class LinkedContent extends Entity implements ILinkedContentServer {
  // ===== 私有字段 =====
  private _resourceUuid: string;
  private _title: string;
  private _url: string;
  private _contentType: ContentType;
  private _description: string | null;
  private _thumbnail: string | null;
  private _author: string | null;
  private _publishedAt: number | null;
  private _isAccessible: boolean;
  private _lastCheckedAt: number | null;
  private _cachedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    resourceUuid: string;
    title: string;
    url: string;
    contentType: ContentType;
    description?: string | null;
    thumbnail?: string | null;
    author?: string | null;
    publishedAt?: number | null;
    isAccessible?: boolean;
    lastCheckedAt?: number | null;
    cachedAt?: number | null;
    createdAt: number;
    updatedAt?: number | null;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._resourceUuid = params.resourceUuid;
    this._title = params.title;
    this._url = params.url;
    this._contentType = params.contentType;
    this._description = params.description ?? null;
    this._thumbnail = params.thumbnail ?? null;
    this._author = params.author ?? null;
    this._publishedAt = params.publishedAt ?? null;
    this._isAccessible = params.isAccessible ?? true;
    this._lastCheckedAt = params.lastCheckedAt ?? null;
    this._cachedAt = params.cachedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt ?? null;
  }

  // ===== Getter 属性 =====
  public get uuid(): string {
    return this._uuid;
  }
  public get resourceUuid(): string {
    return this._resourceUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get url(): string {
    return this._url;
  }
  public get contentType(): ContentType {
    return this._contentType;
  }
  public get description(): string | null {
    return this._description;
  }
  public get thumbnail(): string | null {
    return this._thumbnail;
  }
  public get author(): string | null {
    return this._author;
  }
  public get publishedAt(): number | null {
    return this._publishedAt;
  }
  public get isAccessible(): boolean {
    return this._isAccessible;
  }
  public get lastCheckedAt(): number | null {
    return this._lastCheckedAt;
  }
  public get cachedAt(): number | null {
    return this._cachedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number | null {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 LinkedContent 实体
   */
  public static create(params: {
    resourceUuid: string;
    title: string;
    url: string;
    contentType: ContentType;
    description?: string;
    thumbnail?: string;
    author?: string;
    publishedAt?: number;
  }): LinkedContent {
    const uuid = crypto.randomUUID();
    const now = Date.now();

    return new LinkedContent({
      uuid,
      resourceUuid: params.resourceUuid,
      title: params.title,
      url: params.url,
      contentType: params.contentType,
      description: params.description,
      thumbnail: params.thumbnail,
      author: params.author,
      publishedAt: params.publishedAt,
      isAccessible: true,
      createdAt: now,
    });
  }

  // ===== 业务方法 =====

  public updateMetadata(metadata: {
    title?: string;
    description?: string;
    thumbnail?: string;
    author?: string;
    publishedAt?: number;
  }): void {
    if (metadata.title !== undefined) {
      this._title = metadata.title;
    }
    if (metadata.description !== undefined) {
      this._description = metadata.description;
    }
    if (metadata.thumbnail !== undefined) {
      this._thumbnail = metadata.thumbnail;
    }
    if (metadata.author !== undefined) {
      this._author = metadata.author;
    }
    if (metadata.publishedAt !== undefined) {
      this._publishedAt = metadata.publishedAt;
    }

    this._updatedAt = Date.now();
  }

  public async checkAccessibility(): Promise<boolean> {
    // TODO: 实际的可访问性检查（HTTP 请求）
    // 这里简化处理
    this._lastCheckedAt = Date.now();
    this._updatedAt = Date.now();
    return this._isAccessible;
  }

  public markAsAccessible(): void {
    this._isAccessible = true;
    this._lastCheckedAt = Date.now();
    this._updatedAt = Date.now();
  }

  public markAsInaccessible(): void {
    this._isAccessible = false;
    this._lastCheckedAt = Date.now();
    this._updatedAt = Date.now();
  }

  public async cache(): Promise<void> {
    // TODO: 实际的缓存逻辑
    this._cachedAt = Date.now();
    this._updatedAt = Date.now();
  }

  public clearCache(): void {
    this._cachedAt = null;
    this._updatedAt = Date.now();
  }

  // ===== 转换方法 =====

  public toServerDTO(): LinkedContentServerDTO {
    return {
      uuid: this._uuid,
      resourceUuid: this._resourceUuid,
      title: this._title,
      url: this._url,
      contentType: this._contentType,
      description: this._description,
      thumbnail: this._thumbnail,
      author: this._author,
      publishedAt: this._publishedAt,
      isAccessible: this._isAccessible,
      lastCheckedAt: this._lastCheckedAt,
      cachedAt: this._cachedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toPersistenceDTO(): LinkedContentPersistenceDTO {
    return {
      uuid: this._uuid,
      resource_uuid: this._resourceUuid,
      title: this._title,
      url: this._url,
      content_type: this._contentType,
      description: this._description,
      thumbnail: this._thumbnail,
      author: this._author,
      published_at: this._publishedAt,
      is_accessible: this._isAccessible ? 1 : 0,
      last_checked_at: this._lastCheckedAt,
      cached_at: this._cachedAt,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  public static fromServerDTO(dto: LinkedContentServerDTO): LinkedContent {
    return new LinkedContent({
      uuid: dto.uuid,
      resourceUuid: dto.resourceUuid,
      title: dto.title,
      url: dto.url,
      contentType: dto.contentType,
      description: dto.description,
      thumbnail: dto.thumbnail,
      author: dto.author,
      publishedAt: dto.publishedAt,
      isAccessible: dto.isAccessible,
      lastCheckedAt: dto.lastCheckedAt,
      cachedAt: dto.cachedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromPersistenceDTO(dto: LinkedContentPersistenceDTO): LinkedContent {
    return new LinkedContent({
      uuid: dto.uuid,
      resourceUuid: dto.resource_uuid,
      title: dto.title,
      url: dto.url,
      contentType: dto.content_type,
      description: dto.description,
      thumbnail: dto.thumbnail,
      author: dto.author,
      publishedAt: dto.published_at,
      isAccessible: dto.is_accessible === 1,
      lastCheckedAt: dto.last_checked_at,
      cachedAt: dto.cached_at,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    });
  }

  // 实现接口要求的方法签名（作为实例方法）
  public create(params: {
    resourceUuid: string;
    title: string;
    url: string;
    contentType: ContentType;
    description?: string;
    thumbnail?: string;
    author?: string;
    publishedAt?: number;
  }): RepositoryContracts.LinkedContentServer {
    return LinkedContent.create(params);
  }

  public fromServerDTO(dto: LinkedContentServerDTO): RepositoryContracts.LinkedContentServer {
    return LinkedContent.fromServerDTO(dto);
  }

  public fromPersistenceDTO(
    dto: LinkedContentPersistenceDTO,
  ): RepositoryContracts.LinkedContentServer {
    return LinkedContent.fromPersistenceDTO(dto);
  }
}
