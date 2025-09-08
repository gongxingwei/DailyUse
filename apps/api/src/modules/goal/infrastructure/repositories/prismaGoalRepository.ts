/**
 * Goal 模块 Prisma 仓储实现
 * 基于 PostgreSQL + Prisma 的数据持久化实现
 */

import { PrismaClient } from '@prisma/client';
import { Goal, GoalDir } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';
import { IGoalRepository } from '../../domain/repositories/iGoalRepository';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  // ========================= Goal 相关 =========================

  async createGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    const goalData = goal.toDTO();

    const created = await this.prisma.goal.create({
      data: {
        uuid: goalData.uuid,
        accountUuid,
        directoryUuid: goalData.dirUuid,
        name: goalData.name,
        description: goalData.description,
        color: goalData.color,
        icon: goalData.icon,
        startTime: new Date(goalData.startTime),
        endTime: new Date(goalData.endTime),
        notes: goalData.note,
        analysis: JSON.stringify(goalData.analysis),
        status: goalData.lifecycle.status,
        version: goalData.lifecycle.version,
      },
      include: {
        directory: true,
        keyResults: true,
      },
    });

    return Goal.fromDTO({
      ...goalData,
      uuid: created.uuid,
      startTime: created.startTime.toISOString(),
      endTime: created.endTime.toISOString(),
      lifecycle: {
        status: created.status as any,
        version: created.version,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  }

  async getGoalByUuid(accountUuid: string, uuid: string): Promise<Goal | null> {
    const goal = await this.prisma.goal.findFirst({
      where: {
        uuid,
        accountUuid,
      },
      include: {
        directory: true,
        keyResults: true,
      },
    });

    if (!goal) return null;

    return Goal.fromDTO({
      uuid: goal.uuid,
      name: goal.name,
      description: goal.description,
      color: goal.color,
      icon: goal.icon,
      dirUuid: goal.directoryUuid,
      startTime: goal.startTime.toISOString(),
      endTime: goal.endTime.toISOString(),
      note: goal.notes,
      analysis: JSON.parse(goal.analysis || '{}'),
      lifecycle: {
        status: goal.status as any,
        version: goal.version,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
      },
    });
  }

  async getAllGoals(
    accountUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Goal[]> {
    const goals = await this.prisma.goal.findMany({
      where: {
        accountUuid,
      },
      include: {
        directory: true,
        keyResults: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params?.limit || 1000,
      skip: params?.offset || 0,
    });

    return goals.map((goal) =>
      Goal.fromDTO({
        uuid: goal.uuid,
        name: goal.name,
        description: goal.description,
        color: goal.color,
        icon: goal.icon,
        dirUuid: goal.directoryUuid,
        startTime: goal.startTime.toISOString(),
        endTime: goal.endTime.toISOString(),
        note: goal.notes,
        analysis: JSON.parse(goal.analysis || '{}'),
        lifecycle: {
          status: goal.status as any,
          version: goal.version,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
        },
      }),
    );
  }

  async updateGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    const goalData = goal.toDTO();

    const updated = await this.prisma.goal.update({
      where: {
        uuid: goalData.uuid,
        accountUuid,
      },
      data: {
        name: goalData.name,
        description: goalData.description,
        color: goalData.color,
        icon: goalData.icon,
        directoryUuid: goalData.dirUuid,
        startTime: new Date(goalData.startTime),
        endTime: new Date(goalData.endTime),
        notes: goalData.note,
        analysis: JSON.stringify(goalData.analysis),
        status: goalData.lifecycle.status,
        version: goalData.lifecycle.version,
      },
      include: {
        directory: true,
        keyResults: true,
      },
    });

    return Goal.fromDTO({
      ...goalData,
      lifecycle: {
        status: updated.status as any,
        version: updated.version,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  }

  async deleteGoal(accountUuid: string, uuid: string): Promise<boolean> {
    try {
      await this.prisma.goal.delete({
        where: {
          uuid,
          accountUuid,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getGoalsByDirectoryUuid(accountUuid: string, directoryUuid: string): Promise<Goal[]> {
    const goals = await this.prisma.goal.findMany({
      where: {
        accountUuid,
        directoryUuid,
      },
      include: {
        directory: true,
        keyResults: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return goals.map((goal) =>
      Goal.fromDTO({
        uuid: goal.uuid,
        name: goal.name,
        description: goal.description,
        color: goal.color,
        icon: goal.icon,
        dirUuid: goal.directoryUuid,
        startTime: goal.startTime.toISOString(),
        endTime: goal.endTime.toISOString(),
        note: goal.notes,
        analysis: JSON.parse(goal.analysis || '{}'),
        lifecycle: {
          status: goal.status as any,
          version: goal.version,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
        },
      }),
    );
  }

  async getGoalsByStatus(accountUuid: string, status: string): Promise<Goal[]> {
    const goals = await this.prisma.goal.findMany({
      where: {
        accountUuid,
        status,
      },
      include: {
        directory: true,
        keyResults: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return goals.map((goal) =>
      Goal.fromDTO({
        uuid: goal.uuid,
        name: goal.name,
        description: goal.description,
        color: goal.color,
        icon: goal.icon,
        dirUuid: goal.directoryUuid,
        startTime: goal.startTime.toISOString(),
        endTime: goal.endTime.toISOString(),
        note: goal.notes,
        analysis: JSON.parse(goal.analysis || '{}'),
        lifecycle: {
          status: goal.status as any,
          version: goal.version,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
        },
      }),
    );
  }

  // ========================= GoalDir 相关 =========================

  async createGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir> {
    const dirData = goalDir.toDTO();

    const created = await this.prisma.goalDir.create({
      data: {
        uuid: dirData.uuid,
        accountUuid,
        parentUuid: dirData.parentUuid,
        name: dirData.name,
        description: dirData.description,
        icon: dirData.icon,
        color: dirData.color,
        sortOrder: dirData.sortConfig?.order || 0,
        status: 'active',
      },
      include: {
        parent: true,
        children: true,
        goals: true,
      },
    });

    return GoalDir.fromDTO({
      ...dirData,
      uuid: created.uuid,
      goalCount: created.goals.length,
    });
  }

  async getGoalDirectoryByUuid(accountUuid: string, uuid: string): Promise<GoalDir | null> {
    const dir = await this.prisma.goalDir.findFirst({
      where: {
        uuid,
        accountUuid,
      },
      include: {
        parent: true,
        children: true,
        goals: true,
      },
    });

    if (!dir) return null;

    return GoalDir.fromDTO({
      uuid: dir.uuid,
      name: dir.name,
      description: dir.description,
      icon: dir.icon,
      color: dir.color,
      parentUuid: dir.parentUuid,
      sortConfig: {
        key: dir.sortKey,
        order: dir.sortOrder,
      },
      goalCount: dir.goals.length,
      isSystemDir: false, // 根据业务需要设置
    });
  }

  async getAllGoalDirectories(
    accountUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<GoalDir[]> {
    const dirs = await this.prisma.goalDir.findMany({
      where: {
        accountUuid,
      },
      include: {
        parent: true,
        children: true,
        goals: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      take: params?.limit || 1000,
      skip: params?.offset || 0,
    });

    return dirs.map((dir) =>
      GoalDir.fromDTO({
        uuid: dir.uuid,
        name: dir.name,
        description: dir.description,
        icon: dir.icon,
        color: dir.color,
        parentUuid: dir.parentUuid,
        sortConfig: {
          key: dir.sortKey,
          order: dir.sortOrder,
        },
        goalCount: dir.goals.length,
        isSystemDir: false,
      }),
    );
  }

  async updateGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir> {
    const dirData = goalDir.toDTO();

    const updated = await this.prisma.goalDir.update({
      where: {
        uuid: dirData.uuid,
        accountUuid,
      },
      data: {
        name: dirData.name,
        description: dirData.description,
        icon: dirData.icon,
        color: dirData.color,
        parentUuid: dirData.parentUuid,
        sortOrder: dirData.sortConfig?.order || 0,
      },
      include: {
        parent: true,
        children: true,
        goals: true,
      },
    });

    return GoalDir.fromDTO({
      ...dirData,
      goalCount: updated.goals.length,
    });
  }

  async deleteGoalDirectory(accountUuid: string, uuid: string): Promise<boolean> {
    try {
      await this.prisma.goalDir.delete({
        where: {
          uuid,
          accountUuid,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // ========================= 其他方法的简单实现 =========================

  async createKeyResult(): Promise<any> {
    throw new Error('KeyResult not implemented yet');
  }

  async getKeyResultsByGoalUuid(): Promise<any[]> {
    return [];
  }

  async updateKeyResult(): Promise<any> {
    throw new Error('KeyResult not implemented yet');
  }

  async deleteKeyResult(): Promise<boolean> {
    return false;
  }

  async createGoalRecord(): Promise<any> {
    throw new Error('GoalRecord not implemented yet');
  }

  async getGoalRecordsByGoalUuid(): Promise<any[]> {
    return [];
  }

  async createGoalReview(): Promise<any> {
    throw new Error('GoalReview not implemented yet');
  }

  async getGoalReviewsByGoalUuid(): Promise<any[]> {
    return [];
  }
}
