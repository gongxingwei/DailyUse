import { PrismaClient } from '@prisma/client';
import type { IGoalDirRepository } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';
import { GoalDir } from '@dailyuse/domain-server';

/**
 * GoalDir 聚合根 Prisma 仓储实现
 * 负责 GoalDir 的持久化
 */
export class PrismaGoalDirRepository implements IGoalDirRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 GoalDir 实体
   */
  private mapGoalDirToEntity(dir: any): GoalDir {
    return GoalDir.fromPersistence(dir);
  }

  // ===== GoalDir CRUD =====

  async saveGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir> {
    // 使用实体的 toPersistence 方法转换为持久化数据
    const dirPersistence = goalDir.toPersistence(accountUuid);

    const savedDir = await this.prisma.goalDir.upsert({
      where: {
        uuid: dirPersistence.uuid,
      },
      create: {
        uuid: dirPersistence.uuid,
        name: dirPersistence.name,
        description: dirPersistence.description,
        color: dirPersistence.color,
        icon: dirPersistence.icon,
        parentUuid: dirPersistence.parentUuid,
        createdAt: dirPersistence.createdAt,
        updatedAt: dirPersistence.updatedAt,
        accountUuid,
      },
      update: {
        name: dirPersistence.name,
        description: dirPersistence.description,
        color: dirPersistence.color,
        icon: dirPersistence.icon,
        parentUuid: dirPersistence.parentUuid,
        updatedAt: dirPersistence.updatedAt,
      },
    });

    return this.mapGoalDirToEntity(savedDir);
  }

  async getGoalDirectoryByUuid(accountUuid: string, uuid: string): Promise<GoalDir | null> {
    const dir = await this.prisma.goalDir.findFirst({
      where: {
        uuid,
        accountUuid,
      },
    });

    return dir ? this.mapGoalDirToEntity(dir) : null;
  }

  async getAllGoalDirectories(
    accountUuid: string,
    params?: { parentUuid?: string },
  ): Promise<{ goalDirs: GoalDir[]; total: number }> {
    const where = {
      accountUuid,
      ...(params?.parentUuid !== undefined && { parentUuid: params.parentUuid }),
    };

    const [directories, total] = await Promise.all([
      this.prisma.goalDir.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.goalDir.count({ where }),
    ]);

    return {
      goalDirs: directories.map((dir) => this.mapGoalDirToEntity(dir)),
      total,
    };
  }

  async getGoalDirectoryTree(accountUuid: string): Promise<GoalDir[]> {
    const dirs = await this.prisma.goalDir.findMany({
      where: {
        accountUuid,
        parentUuid: null, // 只获取根级目录
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return dirs.map((dir) => this.mapGoalDirToEntity(dir));
  }

  async deleteGoalDirectory(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.goalDir.deleteMany({
      where: {
        uuid,
        accountUuid,
      },
    });

    return result.count > 0;
  }
}
