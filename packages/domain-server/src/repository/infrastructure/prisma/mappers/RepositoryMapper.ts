/**
 * Repository 领域对象与 Prisma 模型之间的映射器
 *
 * 职责：
 * - 将 Prisma 模型转换为领域聚合根
 * - 将领域聚合根转换为 Prisma 模型
 * - 处理子实体的映射
 *
 * 注意：
 * - 使用 Repository.fromPersistenceDTO() 创建领域对象
 * - 使用 repository.toPersistenceDTO() 转换为持久化 DTO
 */

import { Repository } from '../../../aggregates/Repository';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * Prisma Repository 类型定义
 * 注意：这是临时定义，实际应该从 @prisma/client 导入
 */
export interface PrismaRepository {
  uuid: string;
  accountUuid: string;
  name: string;
  type: string;
  path: string;
  description: string | null;
  config: string; // JSON
  relatedGoals: string | null; // JSON
  status: string;
  git: string | null; // JSON
  syncStatus: string | null; // JSON
  stats: string; // JSON
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Prisma 扩展类型（包含关联数据）
 */
export type PrismaRepositoryWithRelations = PrismaRepository & {
  resources?: any[]; // 根据实际 Prisma schema 定义
  explorer?: any;
};

/**
 * RepositoryMapper
 */
export class RepositoryMapper {
  /**
   * 从 Prisma 模型转换为领域聚合根
   */
  public static toDomain(prisma: PrismaRepositoryWithRelations): Repository {
    // 将 Prisma 模型转换为 PersistenceDTO
    const dto: RepositoryContracts.RepositoryPersistenceDTO = {
      uuid: prisma.uuid,
      account_uuid: prisma.accountUuid,
      name: prisma.name,
      type: prisma.type as RepositoryContracts.RepositoryType,
      path: prisma.path,
      description: prisma.description ?? undefined,
      config: prisma.config, // JSON string
      related_goals: prisma.relatedGoals ?? undefined, // JSON string
      status: prisma.status as RepositoryContracts.RepositoryStatus,
      git: prisma.git ?? undefined, // JSON string
      sync_status: prisma.syncStatus ?? undefined, // JSON string
      stats: prisma.stats, // JSON string
      last_accessed_at: prisma.lastAccessedAt?.getTime() ?? undefined,
      created_at: prisma.createdAt.getTime(),
      updated_at: prisma.updatedAt.getTime(),
    };

    // 使用静态工厂方法创建领域对象
    const repository = Repository.fromPersistenceDTO(dto);

    // TODO: 加载子实体（resources, explorer）
    // if (prisma.resources) {
    //   prisma.resources.forEach(r => {
    //     const resource = ResourceMapper.toDomain(r);
    //     repository.addResource(resource);
    //   });
    // }

    return repository;
  }

  /**
   * 从领域聚合根转换为 Prisma 模型
   */
  public static toPrisma(domain: Repository): PrismaRepository {
    const dto = domain.toPersistenceDTO();

    return {
      uuid: dto.uuid,
      accountUuid: dto.account_uuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description ?? null,
      config: dto.config, // 已经是 JSON string
      relatedGoals: dto.related_goals ?? null, // JSON string 或 null
      status: dto.status,
      git: dto.git ?? null, // JSON string 或 null
      syncStatus: dto.sync_status ?? null, // JSON string 或 null
      stats: dto.stats, // JSON string
      lastAccessedAt: dto.last_accessed_at ? new Date(dto.last_accessed_at) : null,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    };
  }
}
