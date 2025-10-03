import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { IGoalRepository } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel, GoalStatus } from '@dailyuse/contracts';
import { Goal, KeyResult, GoalRecord, GoalReview, GoalDir } from '@dailyuse/domain-server';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapGoalToEntity(goal: any): Goal {
    // 使用领域实体的 fromPersistence 方法创建实体
    // 将 Prisma 的 null 值转换为 undefined
    const goalEntity = Goal.fromPersistence({
      ...goal,
      description: goal.description ?? undefined,
      dirUuid: goal.dirUuid ?? undefined,
      note: goal.note ?? undefined,
      tags: typeof goal.tags === 'string' ? goal.tags : JSON.stringify(goal.tags || []),
      // 确保枚举类型正确
      importanceLevel: goal.importanceLevel as ImportanceLevel,
      urgencyLevel: goal.urgencyLevel as UrgencyLevel,
      status: goal.status as GoalStatus,
    });

    // 转换子实体
    if (goal.keyResults) {
      goalEntity.keyResults = goal.keyResults.map((kr: any) =>
        KeyResult.fromPersistence({
          ...kr,
          accountUuid: goal.accountUuid,
        }),
      );
    }

    // 收集所有 records
    const allRecords: any[] = [];
    if (goal.keyResults) {
      goal.keyResults.forEach((kr: any) => {
        if (kr.records) {
          kr.records.forEach((record: any) => {
            allRecords.push({
              ...record,
              goalUuid: goal.uuid,
              accountUuid: goal.accountUuid,
            });
          });
        }
      });
    }

    goalEntity.records = allRecords.map((record: any) => GoalRecord.fromPersistence(record));

    if (goal.reviews) {
      goalEntity.reviews = goal.reviews.map((review: any) =>
        GoalReview.fromPersistence({
          ...review,
          content: JSON.parse(review.content || '{}'),
          snapshot: JSON.parse(review.snapshot || '{}'),
          rating: JSON.parse(review.rating || '{}'),
        }),
      );
    }

    // 直接返回实体对象
    return goalEntity;
  }

  private mapGoalDirToEntity(dir: any): GoalDir {
    return GoalDir.fromPersistence(dir);
  }

  // ===== Goal CRUD 操作 - 新的实体接口 =====

  async saveGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    // 使用实体的 toPersistence 方法转换为持久化数据
    const goalPersistence = goal.toPersistence(accountUuid);

    // 使用事务保存 Goal 及其所有子实体
    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert goal 主实体
      await tx.goal.upsert({
        where: {
          uuid: goalPersistence.uuid,
        },
        create: {
          uuid: goalPersistence.uuid,
          name: goalPersistence.name,
          description: goalPersistence.description,
          category: goalPersistence.category,
          startTime: goalPersistence.startTime,
          endTime: goalPersistence.endTime,
          tags: goalPersistence.tags,
          status: goalPersistence.status,
          importanceLevel: goalPersistence.importanceLevel,
          urgencyLevel: goalPersistence.urgencyLevel,
          dirUuid: goalPersistence.dirUuid,
          note: goalPersistence.note,
          color: '#1890ff', // 默认颜色
          createdAt: goalPersistence.createdAt,
          updatedAt: goalPersistence.updatedAt,
          version: goalPersistence.version,
          accountUuid,
        },
        update: {
          name: goalPersistence.name,
          description: goalPersistence.description,
          category: goalPersistence.category,
          startTime: goalPersistence.startTime,
          endTime: goalPersistence.endTime,
          tags: goalPersistence.tags,
          status: goalPersistence.status,
          importanceLevel: goalPersistence.importanceLevel,
          urgencyLevel: goalPersistence.urgencyLevel,
          dirUuid: goalPersistence.dirUuid,
          note: goalPersistence.note,
          updatedAt: goalPersistence.updatedAt,
          version: goalPersistence.version,
        },
      });

      // 2. Upsert keyResults
      for (const kr of goal.keyResults) {
        const krPersistence = (kr as KeyResult).toPersistence();
        await tx.keyResult.upsert({
          where: { uuid: krPersistence.uuid },
          create: krPersistence,
          update: krPersistence,
        });
      }

      // 3. Upsert records
      for (const record of goal.records) {
        const recordPersistence = (record as GoalRecord).toPersistence();
        await tx.goalRecord.upsert({
          where: { uuid: recordPersistence.uuid },
          create: recordPersistence,
          update: recordPersistence,
        });
      }

      // 4. Upsert reviews
      for (const review of goal.reviews) {
        const reviewPersistence = (review as GoalReview).toPersistence();
        await tx.goalReview.upsert({
          where: { uuid: reviewPersistence.uuid },
          create: reviewPersistence,
          update: reviewPersistence,
        });
      }
    });

    // 重新加载完整的 Goal 实体
    const reloaded = await this.prisma.goal.findFirst({
      where: {
        uuid: goalPersistence.uuid,
        accountUuid,
      },
      include: {
        keyResults: {
          include: {
            records: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
        },
      },
    });

    if (!reloaded) {
      throw new Error('Failed to reload saved goal');
    }

    // 使用 mapGoalToEntity 将保存后的数据转换回实体
    return this.mapGoalToEntity(reloaded);
  }

  async saveGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir> {
    // 使用实体的 toPersistence 方法转换为持久化数据
    const dirPersistence = goalDir.toPersistence(accountUuid);

    // Upsert goal directory
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

    // 使用 mapGoalDirToEntity 将保存后的数据转换回实体
    return this.mapGoalDirToEntity(savedDir);
  }

  async getGoalByUuid(accountUuid: string, uuid: string): Promise<Goal | null> {
    const goal = await this.prisma.goal.findFirst({
      where: {
        uuid,
        accountUuid,
      },
      include: {
        keyResults: {
          include: {
            records: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
        },
      },
    });

    return goal ? this.mapGoalToEntity(goal) : null;
  }

  async getAllGoals(
    accountUuid: string,
    params?: GoalContracts.GoalQueryParams,
  ): Promise<{ goals: Goal[]; total: number }> {
    const where = {
      accountUuid,
      ...(params?.status && { status: params.status }),
      ...(params?.dirUuid && { dirUuid: params.dirUuid }),
      ...(params?.category && { category: { contains: params.category } }),
      ...(params?.importanceLevel && { importanceLevel: params.importanceLevel }),
      ...(params?.urgencyLevel && { urgencyLevel: params.urgencyLevel }),
      ...(params?.tags && {
        tags: {
          contains: JSON.stringify(params.tags).slice(1, -1), // 移除方括号进行部分匹配
        },
      }),
      ...(params?.startTime && { startTime: { gte: new Date(params.startTime) } }),
      ...(params?.endTime && { endTime: { lte: new Date(params.endTime) } }),
    };

    const [goals, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        include: {
          keyResults: {
            include: {
              records: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          reviews: {
            orderBy: { reviewDate: 'desc' },
          },
        },
        skip: params?.offset || 0,
        take: params?.limit || 10,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.goal.count({ where }),
    ]);

    const goalEntities = goals.map((goal) => this.mapGoalToEntity(goal));
    return {
      goals: goalEntities,
      total,
    };
  }

  async deleteGoal(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.goal.deleteMany({
      where: {
        uuid,
        accountUuid,
      },
    });

    return result.count > 0;
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

  async deleteGoalDirectory(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.goalDir.deleteMany({
      where: {
        uuid,
        accountUuid,
      },
    });

    return result.count > 0;
  }

  async deleteKeyResult(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.keyResult.deleteMany({
      where: {
        uuid,
        goal: {
          accountUuid, // 通过Goal聚合根验证权限
        },
      },
    });

    return result.count > 0;
  }

  // ===== 额外的 Goal 方法 =====

  async getGoalsByDirectoryUuid(accountUuid: string, directoryUuid: string): Promise<Goal[]> {
    const goals = await this.prisma.goal.findMany({
      where: {
        accountUuid,
        dirUuid: directoryUuid,
      },
      include: {
        keyResults: {
          include: {
            records: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const goalEntities = goals.map((goal) => this.mapGoalToEntity(goal));
    return goalEntities; // 返回实体数组
  }

  async getGoalsByStatus(accountUuid: string, status: GoalContracts.GoalStatus): Promise<Goal[]> {
    const goals = await this.prisma.goal.findMany({
      where: {
        accountUuid,
        status,
      },
      include: {
        keyResults: {
          include: {
            records: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return goals.map((goal) => this.mapGoalToEntity(goal));
  }

  async batchUpdateGoalStatus(
    accountUuid: string,
    uuids: string[],
    status: 'active' | 'completed' | 'paused' | 'archived',
  ): Promise<boolean> {
    const now = new Date();

    const result = await this.prisma.goal.updateMany({
      where: {
        uuid: { in: uuids },
        accountUuid,
      },
      data: {
        status,
        updatedAt: now,
      },
    });

    return result.count > 0;
  }

  // ===== 其他必需方法的基础实现 =====

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

  async deleteGoalRecord(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.goalRecord.deleteMany({
      where: {
        uuid,
        keyResult: {
          goal: {
            accountUuid, // 通过Goal聚合根验证权限
          },
        },
      },
    });

    return result.count > 0;
  }

  async deleteGoalReview(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.goalReview.deleteMany({
      where: {
        uuid,
        goal: {
          accountUuid,
        },
      },
    });

    return result.count > 0;
  }

  // ===== 统计方法 =====

  async getGoalStats(
    accountUuid: string,
    dateRange?: { start?: Date; end?: Date },
  ): Promise<{
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    pausedGoals: number;
    archivedGoals: number;
    overallProgress: number;
    avgKeyResultsPerGoal: number;
    completionRate: number;
  }> {
    const where = {
      accountUuid,
      ...(dateRange && {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }),
    };

    const [totalGoals, activeGoals, completedGoals, pausedGoals, archivedGoals, goals, keyResults] =
      await Promise.all([
        this.prisma.goal.count({ where }),
        this.prisma.goal.count({ where: { ...where, status: 'active' } }),
        this.prisma.goal.count({ where: { ...where, status: 'completed' } }),
        this.prisma.goal.count({ where: { ...where, status: 'paused' } }),
        this.prisma.goal.count({ where: { ...where, status: 'archived' } }),
        this.prisma.goal.findMany({ where, include: { _count: { select: { keyResults: true } } } }),
        this.prisma.keyResult.findMany({
          where: {
            goal: where, // 通过Goal关联进行查询
          },
        }),
      ]);

    const overallProgress =
      keyResults.length > 0
        ? keyResults.reduce((sum, kr) => sum + (kr.currentValue / kr.targetValue) * 100, 0) /
          keyResults.length
        : 0;

    const avgKeyResultsPerGoal = totalGoals > 0 ? keyResults.length / totalGoals : 0;
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      pausedGoals,
      archivedGoals,
      overallProgress,
      avgKeyResultsPerGoal,
      completionRate,
    };
  }

  async getProgressTrend(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getUpcomingDeadlines(): Promise<any> {
    throw new Error('Method not implemented');
  }

  /**
   * 验证聚合根业务规则
   */
  async validateGoalAggregateRules(
    accountUuid: string,
    goalUuid: string,
    proposedChanges: {
      keyResults?: GoalContracts.KeyResultDTO[];
      records?: GoalContracts.GoalRecordDTO[];
    },
  ): Promise<{
    isValid: boolean;
    violations: Array<{
      rule: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
  }> {
    const violations: Array<{
      rule: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    // 验证关键结果权重总和不超过100%
    if (proposedChanges.keyResults) {
      const totalWeight = proposedChanges.keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0);
      if (totalWeight > 100) {
        violations.push({
          rule: 'keyResultWeightLimit',
          message: `关键结果权重总和(${totalWeight}%)不能超过100%`,
          severity: 'error',
        });
      }
    }

    // 验证关键结果数量限制
    if (proposedChanges.keyResults && proposedChanges.keyResults.length > 10) {
      violations.push({
        rule: 'keyResultCountLimit',
        message: '关键结果数量不能超过10个',
        severity: 'error',
      });
    }

    // 可以添加更多业务规则验证...

    return {
      isValid: violations.filter((v) => v.severity === 'error').length === 0,
      violations,
    };
  }

  /**
   * 聚合根版本控制
   */
  async updateGoalVersion(
    accountUuid: string,
    goalUuid: string,
    expectedVersion: number,
    newVersion: number,
  ): Promise<boolean> {
    try {
      const result = await this.prisma.goal.updateMany({
        where: {
          uuid: goalUuid,
          accountUuid,
          version: expectedVersion,
        },
        data: {
          version: newVersion,
          updatedAt: new Date(),
        },
      });

      return result.count > 0;
    } catch {
      return false;
    }
  }

  /**
   * 获取聚合根变更历史
   */
  async getGoalAggregateHistory(
    accountUuid: string,
    goalUuid: string,
    limit?: number,
  ): Promise<
    Array<{
      version: number;
      changedAt: number;
      changedBy: string;
      changeType: 'goal' | 'keyResult' | 'record' | 'review';
      entityUuid: string;
      changeData: any;
    }>
  > {
    // 注意：这里需要有审计表才能实现完整的历史记录
    // 目前返回空数组，后续可以根据审计表结构实现
    return [];
  }
}
