/**
 * Prisma Repository 实现
 *
 * 实现 IRepositoryRepository 接口，使用 Prisma 进行数据持久化
 *
 * 职责：
 * - 实现所有 CRUD 操作
 * - 处理事务
 * - 级联保存/删除子实体
 * - 将 Prisma 模型转换为领域对象
 */

import type { IRepositoryRepository } from '../../repositories/IRepositoryRepository';
import { Repository } from '../../aggregates/Repository';
import { RepositoryMapper, type PrismaRepository } from './mappers/RepositoryMapper';

/**
 * Prisma Client 接口（临时定义）
 * 实际使用时应该从 @prisma/client 导入
 */
export interface PrismaClient {
  repository: {
    create: (args: any) => Promise<PrismaRepository>;
    update: (args: any) => Promise<PrismaRepository>;
    findUnique: (args: any) => Promise<PrismaRepository | null>;
    findMany: (args: any) => Promise<PrismaRepository[]>;
    delete: (args: any) => Promise<PrismaRepository>;
    count: (args: any) => Promise<number>;
  };
  $transaction: <T>(fn: (tx: PrismaClient) => Promise<T>) => Promise<T>;
}

/**
 * PrismaRepositoryRepository
 */
export class PrismaRepositoryRepository implements IRepositoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 保存聚合根（创建或更新）
   */
  public async save(repository: Repository): Promise<void> {
    const data = RepositoryMapper.toPrisma(repository);

    try {
      // 检查是否已存在
      const exists = await this.exists(repository.uuid);

      if (exists) {
        // 更新
        await this.prisma.repository.update({
          where: { uuid: repository.uuid },
          data: {
            name: data.name,
            type: data.type,
            path: data.path,
            description: data.description,
            config: data.config,
            relatedGoals: data.relatedGoals,
            status: data.status,
            git: data.git,
            syncStatus: data.syncStatus,
            stats: data.stats,
            lastAccessedAt: data.lastAccessedAt,
            updatedAt: data.updatedAt,
          },
        });
      } else {
        // 创建
        await this.prisma.repository.create({
          data: {
            uuid: data.uuid,
            accountUuid: data.accountUuid,
            name: data.name,
            type: data.type,
            path: data.path,
            description: data.description,
            config: data.config,
            relatedGoals: data.relatedGoals,
            status: data.status,
            git: data.git,
            syncStatus: data.syncStatus,
            stats: data.stats,
            lastAccessedAt: data.lastAccessedAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
        });
      }

      // TODO: 保存子实体（resources, explorer）
      // await this.saveResources(repository);
      // await this.saveExplorer(repository);
    } catch (error) {
      // 转换 Prisma 错误为领域错误
      throw new Error(
        `Failed to save repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 通过 UUID 查找聚合根
   */
  public async findById(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Repository | null> {
    try {
      const prismaRepo = await this.prisma.repository.findUnique({
        where: { uuid },
        // TODO: 根据 includeChildren 加载关联数据
        // include: options?.includeChildren ? {
        //   resources: true,
        //   explorer: true,
        // } : undefined,
      });

      if (!prismaRepo) {
        return null;
      }

      return RepositoryMapper.toDomain(prismaRepo);
    } catch (error) {
      throw new Error(
        `Failed to find repository by id: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 通过账户 UUID 查找所有仓库
   */
  public async findByAccountUuid(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Repository[]> {
    try {
      const prismaRepos = await this.prisma.repository.findMany({
        where: { accountUuid },
        // TODO: 根据 includeChildren 加载关联数据
        orderBy: { updatedAt: 'desc' },
      });

      return prismaRepos.map((r) => RepositoryMapper.toDomain(r));
    } catch (error) {
      throw new Error(
        `Failed to find repositories by account: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 通过路径查找仓库
   */
  public async findByPath(path: string): Promise<Repository | null> {
    try {
      const prismaRepo = await this.prisma.repository.findUnique({
        where: { path },
      });

      if (!prismaRepo) {
        return null;
      }

      return RepositoryMapper.toDomain(prismaRepo);
    } catch (error) {
      throw new Error(
        `Failed to find repository by path: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 删除聚合根
   */
  public async delete(uuid: string): Promise<void> {
    try {
      // 使用事务级联删除
      await this.prisma.$transaction(async (tx) => {
        // TODO: 删除子实体
        // await tx.resource.deleteMany({ where: { repositoryUuid: uuid } });
        // await tx.repositoryExplorer.delete({ where: { repositoryUuid: uuid } });

        // 删除聚合根
        await tx.repository.delete({ where: { uuid } });
      });
    } catch (error) {
      throw new Error(
        `Failed to delete repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 检查仓库是否存在
   */
  public async exists(uuid: string): Promise<boolean> {
    try {
      const count = await this.prisma.repository.count({
        where: { uuid },
      });
      return count > 0;
    } catch (error) {
      throw new Error(
        `Failed to check repository existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 检查路径是否已被使用
   */
  public async isPathUsed(path: string, excludeUuid?: string): Promise<boolean> {
    try {
      const count = await this.prisma.repository.count({
        where: {
          path,
          uuid: excludeUuid ? { not: excludeUuid } : undefined,
        },
      });
      return count > 0;
    } catch (error) {
      throw new Error(
        `Failed to check path usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // ===== 私有方法：子实体持久化 =====

  // private async saveResources(repository: Repository): Promise<void> {
  //   // TODO: 实现资源保存逻辑
  // }

  // private async saveExplorer(repository: Repository): Promise<void> {
  //   // TODO: 实现浏览器配置保存逻辑
  // }
}
