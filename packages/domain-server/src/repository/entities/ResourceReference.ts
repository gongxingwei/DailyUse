/**
 * ResourceReference 实体实现
 * 实现 ResourceReferenceServer 接口
 *
 * DDD 实体职责：
 * - 管理资源之间的引用关系
 * - 执行引用相关的业务逻辑
 * - 跟踪验证状态
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IResourceReferenceServer = RepositoryContracts.ResourceReferenceServer;
type ResourceReferenceServerDTO = RepositoryContracts.ResourceReferenceServerDTO;
type ResourceReferenceClientDTO = RepositoryContracts.ResourceReferenceClientDTO;
type ResourceReferencePersistenceDTO = RepositoryContracts.ResourceReferencePersistenceDTO;
type ReferenceType = RepositoryContracts.ReferenceType;

/**
 * ResourceReference 实体
 */
export class ResourceReference extends Entity implements IResourceReferenceServer {
  // ===== 私有字段 =====
  private _sourceResourceUuid: string;
  private _targetResourceUuid: string;
  private _referenceType: ReferenceType;
  private _description: string | null;
  private _createdAt: number;
  private _updatedAt: number | null;
  private _lastVerifiedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    sourceResourceUuid: string;
    targetResourceUuid: string;
    referenceType: ReferenceType;
    description?: string | null;
    createdAt: number;
    updatedAt?: number | null;
    lastVerifiedAt?: number | null;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._sourceResourceUuid = params.sourceResourceUuid;
    this._targetResourceUuid = params.targetResourceUuid;
    this._referenceType = params.referenceType;
    this._description = params.description ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt ?? null;
    this._lastVerifiedAt = params.lastVerifiedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get sourceResourceUuid(): string {
    return this._sourceResourceUuid;
  }
  public get targetResourceUuid(): string {
    return this._targetResourceUuid;
  }
  public get referenceType(): ReferenceType {
    return this._referenceType;
  }
  public get description(): string | null {
    return this._description;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number | null {
    return this._updatedAt;
  }
  public get lastVerifiedAt(): number | null {
    return this._lastVerifiedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 ResourceReference 实体
   */
  public static create(params: {
    sourceResourceUuid: string;
    targetResourceUuid: string;
    referenceType: ReferenceType;
    description?: string;
  }): ResourceReference {
    const uuid = crypto.randomUUID();
    const now = Date.now();

    return new ResourceReference({
      uuid,
      sourceResourceUuid: params.sourceResourceUuid,
      targetResourceUuid: params.targetResourceUuid,
      referenceType: params.referenceType,
      description: params.description,
      createdAt: now,
    });
  }

  // ===== 业务方法 =====

  public updateDescription(description: string): void {
    this._description = description;
    this._updatedAt = Date.now();
  }

  public changeReferenceType(type: ReferenceType): void {
    this._referenceType = type;
    this._updatedAt = Date.now();
  }

  public async verify(): Promise<boolean> {
    // TODO: 实际的验证逻辑（检查目标资源是否存在）
    // 这里简化处理
    this.markAsVerified();
    return true;
  }

  public markAsVerified(): void {
    this._lastVerifiedAt = Date.now();
    this._updatedAt = Date.now();
  }

  // ===== 转换方法 =====

  public toServerDTO(): ResourceReferenceServerDTO {
    return {
      uuid: this._uuid,
      sourceResourceUuid: this._sourceResourceUuid,
      targetResourceUuid: this._targetResourceUuid,
      referenceType: this._referenceType,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastVerifiedAt: this._lastVerifiedAt,
    };
  }

  public toClientDTO(): ResourceReferenceClientDTO {
    return {
      uuid: this._uuid,
      sourceResourceUuid: this._sourceResourceUuid,
      targetResourceUuid: this._targetResourceUuid,
      referenceType: this._referenceType,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastVerifiedAt: this._lastVerifiedAt,
    };
  }

  public toPersistenceDTO(): ResourceReferencePersistenceDTO {
    return {
      uuid: this._uuid,
      source_resource_uuid: this._sourceResourceUuid,
      target_resource_uuid: this._targetResourceUuid,
      reference_type: this._referenceType,
      description: this._description,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      last_verified_at: this._lastVerifiedAt,
    };
  }

  public static fromServerDTO(dto: ResourceReferenceServerDTO): ResourceReference {
    return new ResourceReference({
      uuid: dto.uuid,
      sourceResourceUuid: dto.sourceResourceUuid,
      targetResourceUuid: dto.targetResourceUuid,
      referenceType: dto.referenceType,
      description: dto.description,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastVerifiedAt: dto.lastVerifiedAt,
    });
  }

  public static fromPersistenceDTO(dto: ResourceReferencePersistenceDTO): ResourceReference {
    return new ResourceReference({
      uuid: dto.uuid,
      sourceResourceUuid: dto.source_resource_uuid,
      targetResourceUuid: dto.target_resource_uuid,
      referenceType: dto.reference_type,
      description: dto.description,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      lastVerifiedAt: dto.last_verified_at,
    });
  }

  // 实现接口要求的方法签名（作为实例方法）
  public create(params: {
    sourceResourceUuid: string;
    targetResourceUuid: string;
    referenceType: ReferenceType;
    description?: string;
  }): RepositoryContracts.ResourceReferenceServer {
    return ResourceReference.create(params);
  }

  public fromServerDTO(
    dto: ResourceReferenceServerDTO,
  ): RepositoryContracts.ResourceReferenceServer {
    return ResourceReference.fromServerDTO(dto);
  }

  public fromPersistenceDTO(
    dto: ResourceReferencePersistenceDTO,
  ): RepositoryContracts.ResourceReferenceServer {
    return ResourceReference.fromPersistenceDTO(dto);
  }
}
