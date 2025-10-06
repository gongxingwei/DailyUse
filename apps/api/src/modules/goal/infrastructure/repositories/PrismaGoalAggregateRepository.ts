import { PrismaClient } from '@prisma/client';
import type { IGoalAggregateRepository } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel, GoalStatus } from '@dailyuse/contracts';
import { Goal, KeyResult, GoalRecord, GoalReview } from '@dailyuse/domain-server';

/**
 * Goal 聚合根 Prisma 仓储实现
 * 负责 Goal 及其所有子实体（KeyResult, Record, Review）的持久化
 */
export class PrismaGoalAggregateRepository implements IGoalAggregateRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 Goal 聚合根实体
   */
  private mapGoalToEntity(goal: any): Goal {
    // 使用领域实体的 fromPersistence 方法创建实体
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

    // 转换 KeyResult 子实体
    if (goal.keyResults) {
      goalEntity.keyResults = goal.keyResults.map((kr: any) =>
        KeyResult.fromPersistence({
          ...kr,
          accountUuid: goal.accountUuid,
        }),
      );
    }

    // 收集所有 GoalRecord（从 KeyResult.records 中提取）
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

    // 转换 GoalReview 子实体
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

    return goalEntity;
  }

  // ===== Goal 聚合根 CRUD =====

  async saveGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    // 使用实体的 toPersistence 方法转换为持久化数据
    const goalPersistence = goal.toPersistence(accountUuid);

    // 使用事务保存 Goal 及其所有子实体
    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert Goal 主实体
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

      // 2. Upsert KeyResults
      for (const kr of goal.keyResults) {
        const krPersistence = (kr as KeyResult).toPersistence();
        await tx.keyResult.upsert({
          where: { uuid: krPersistence.uuid },
          create: krPersistence,
          update: krPersistence,
        });
      }

      // 3. Upsert GoalRecords
      for (const record of goal.records) {
        const recordPersistence = (record as GoalRecord).toPersistence();
        await tx.goalRecord.upsert({
          where: { uuid: recordPersistence.uuid },
          create: recordPersistence,
          update: recordPersistence,
        });
      }

      // 4. Upsert GoalReviews
      for (const review of goal.reviews) {
        const reviewPersistence = (review as GoalReview).toPersistence();
        await tx.goalReview.upsert({
          where: { uuid: reviewPersistence.uuid },
          create: reviewPersistence,
          update: reviewPersistence,
        });
      }
    });

    // 重新加载完整的 Goal 聚合根
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

    return this.mapGoalToEntity(reloaded);
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

    return {
      goals: goals.map((goal) => this.mapGoalToEntity(goal)),
      total,
    };
  }

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

    return goals.map((goal) => this.mapGoalToEntity(goal));
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

  async deleteGoal(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.goal.deleteMany({
      where: {
        uuid,
        accountUuid,
      },
    });

    return result.count > 0;
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

  // ===== 统计分析 =====

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
            goal: where,
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

  // ===== 聚合根业务规则验证 =====

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

    return {
      isValid: violations.filter((v) => v.severity === 'error').length === 0,
      violations,
    };
  }

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
