import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { IGoalRepository } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapGoalToDTO(goal: any): GoalContracts.GoalDTO {
    return {
      uuid: goal.uuid,
      name: goal.name,
      description: goal.description,
      color: goal.color,
      dirUuid: goal.dirUuid,
      startTime: goal.startTime.getTime(),
      endTime: goal.endTime.getTime(),
      note: goal.note,
      analysis: {
        motive: goal.motive || '',
        feasibility: goal.feasibility || '',
        importanceLevel: goal.importanceLevel || 'moderate',
        urgencyLevel: goal.urgencyLevel || 'medium',
      },
      lifecycle: {
        createdAt: goal.createdAt.getTime(),
        updatedAt: goal.updatedAt.getTime(),
        status: goal.status || 'active',
      },
      metadata: {
        tags: goal.tags ? JSON.parse(goal.tags) : [],
        category: goal.category || '',
      },
      version: goal.version || 1,
    };
  }

  private mapGoalDirToDTO(dir: any): GoalContracts.GoalDirDTO {
    return {
      uuid: dir.uuid,
      accountUuid: dir.accountUuid,
      name: dir.name,
      description: dir.description,
      color: dir.color,
      icon: dir.icon,
      parentUuid: dir.parentUuid,
      sortConfig: {
        sortKey: dir.sortKey || 'createdAt',
        sortOrder: dir.sortOrder || 0,
      },
      lifecycle: {
        createdAt: dir.createdAt.getTime(),
        updatedAt: dir.updatedAt.getTime(),
        status: dir.status || 'active',
      },
    };
  }

  private mapKeyResultToDTO(keyResult: any): GoalContracts.KeyResultDTO {
    return {
      uuid: keyResult.uuid,
      accountUuid: keyResult.accountUuid,
      goalUuid: keyResult.goalUuid,
      name: keyResult.name,
      description: keyResult.description,
      startValue: keyResult.startValue,
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue,
      unit: keyResult.unit,
      weight: keyResult.weight,
      calculationMethod: keyResult.calculationMethod,
      lifecycle: {
        createdAt: keyResult.createdAt.getTime(),
        updatedAt: keyResult.updatedAt.getTime(),
        status: keyResult.status || 'active',
      },
    };
  }

  // ===== Goal CRUD 操作 =====

  async createGoal(
    accountUuid: string,
    goalData: Omit<GoalContracts.GoalDTO, 'uuid' | 'lifecycle'>,
  ): Promise<GoalContracts.GoalDTO> {
    const uuid = randomUUID();
    const now = new Date();

    const created = await this.prisma.goal.create({
      data: {
        uuid,
        accountUuid,
        name: goalData.name,
        description: goalData.description,
        color: goalData.color,
        dirUuid: goalData.dirUuid,
        startTime: new Date(goalData.startTime),
        endTime: new Date(goalData.endTime),
        note: goalData.note,
        // 展开analysis字段
        motive: goalData.analysis?.motive || '',
        feasibility: goalData.analysis?.feasibility || '',
        importanceLevel: goalData.analysis?.importanceLevel || 'moderate',
        urgencyLevel: goalData.analysis?.urgencyLevel || 'medium',
        // 展开metadata字段
        tags: JSON.stringify(goalData.metadata?.tags || []),
        category: goalData.metadata?.category || '',
        // 生命周期状态
        status: 'active',
        version: goalData.version || 1,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.mapGoalToDTO(created);
  }

  async getGoalByUuid(accountUuid: string, uuid: string): Promise<GoalContracts.GoalDTO | null> {
    const goal = await this.prisma.goal.findFirst({
      where: {
        uuid,
        accountUuid,
      },
    });

    return goal ? this.mapGoalToDTO(goal) : null;
  }

  async getAllGoals(
    accountUuid: string,
    params?: GoalContracts.GoalQueryParams,
  ): Promise<{ goals: GoalContracts.GoalDTO[]; total: number }> {
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
        skip: params?.offset || 0,
        take: params?.limit || 10,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.goal.count({ where }),
    ]);

    return {
      goals: goals.map((goal) => this.mapGoalToDTO(goal)),
      total,
    };
  }

  async updateGoal(
    accountUuid: string,
    uuid: string,
    updateData: Partial<Omit<GoalContracts.GoalDTO, 'uuid' | 'lifecycle'>>,
  ): Promise<GoalContracts.GoalDTO> {
    const now = new Date();

    // 获取现有数据以合并更新
    const existing = await this.prisma.goal.findFirst({
      where: {
        uuid,
        accountUuid,
      },
    });

    if (!existing) {
      throw new Error('Goal not found');
    }

    const updated = await this.prisma.goal.update({
      where: {
        uuid,
      },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.color && { color: updateData.color }),
        ...(updateData.dirUuid !== undefined && { dirUuid: updateData.dirUuid }),
        ...(updateData.startTime && { startTime: new Date(updateData.startTime) }),
        ...(updateData.endTime && { endTime: new Date(updateData.endTime) }),
        ...(updateData.note !== undefined && { note: updateData.note }),
        // 更新分解后的字段
        ...(updateData.analysis?.motive !== undefined && { motive: updateData.analysis.motive }),
        ...(updateData.analysis?.feasibility !== undefined && {
          feasibility: updateData.analysis.feasibility,
        }),
        ...(updateData.analysis?.importanceLevel !== undefined && {
          importanceLevel: updateData.analysis.importanceLevel,
        }),
        ...(updateData.analysis?.urgencyLevel !== undefined && {
          urgencyLevel: updateData.analysis.urgencyLevel,
        }),
        ...(updateData.metadata?.category !== undefined && {
          category: updateData.metadata.category,
        }),
        ...(updateData.metadata?.tags !== undefined && {
          tags: JSON.stringify(updateData.metadata.tags),
        }),
        updatedAt: now,
        ...(updateData.version && { version: updateData.version }),
      },
    });

    return this.mapGoalToDTO(updated);
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

  // ===== Goal Directory CRUD 操作 =====

  async createGoalDirectory(
    accountUuid: string,
    dirData: Omit<GoalContracts.GoalDirDTO, 'uuid' | 'lifecycle'>,
  ): Promise<GoalContracts.GoalDirDTO> {
    const uuid = randomUUID();
    const now = new Date();

    const created = await this.prisma.goalDir.create({
      data: {
        uuid,
        name: dirData.name,
        description: dirData.description,
        color: dirData.color,
        icon: dirData.icon,
        parentUuid: dirData.parentUuid,
        sortKey: dirData.sortConfig?.sortKey || 'createdAt',
        sortOrder: dirData.sortConfig?.sortOrder || 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        accountUuid,
      },
    });

    return this.mapGoalDirToDTO(created);
  }

  async getGoalDirectoryByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalDirDTO | null> {
    const dir = await this.prisma.goalDir.findFirst({
      where: {
        uuid,
        accountUuid,
      },
    });

    return dir ? this.mapGoalDirToDTO(dir) : null;
  }

  async getAllGoalDirectories(
    accountUuid: string,
    params?: { parentUuid?: string },
  ): Promise<{ goalDirs: GoalContracts.GoalDirDTO[]; total: number }> {
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
      goalDirs: directories.map((dir) => this.mapGoalDirToDTO(dir)),
      total,
    };
  }

  async updateGoalDirectory(
    accountUuid: string,
    uuid: string,
    updateData: Partial<Omit<GoalContracts.GoalDirDTO, 'uuid' | 'lifecycle'>>,
  ): Promise<GoalContracts.GoalDirDTO> {
    const now = new Date();

    const updated = await this.prisma.goalDir.update({
      where: {
        uuid,
      },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.color && { color: updateData.color }),
        ...(updateData.icon && { icon: updateData.icon }),
        ...(updateData.parentUuid !== undefined && { parentUuid: updateData.parentUuid }),
        ...(updateData.sortConfig?.sortKey && { sortKey: updateData.sortConfig.sortKey }),
        ...(updateData.sortConfig?.sortOrder !== undefined && {
          sortOrder: updateData.sortConfig.sortOrder,
        }),
        updatedAt: now,
      },
    });

    return this.mapGoalDirToDTO(updated);
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

  // ===== KeyResult CRUD 操作 =====

  async createKeyResult(
    accountUuid: string,
    keyResultData: Omit<GoalContracts.KeyResultDTO, 'uuid' | 'lifecycle'>,
  ): Promise<GoalContracts.KeyResultDTO> {
    const uuid = randomUUID();
    const now = new Date();

    const created = await this.prisma.keyResult.create({
      data: {
        uuid,
        accountUuid,
        goalUuid: keyResultData.goalUuid,
        name: keyResultData.name,
        description: keyResultData.description,
        startValue: keyResultData.startValue,
        targetValue: keyResultData.targetValue,
        currentValue: keyResultData.currentValue,
        unit: keyResultData.unit,
        weight: keyResultData.weight,
        calculationMethod: keyResultData.calculationMethod,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.mapKeyResultToDTO(created);
  }

  async getKeyResultByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.KeyResultDTO | null> {
    const keyResult = await this.prisma.keyResult.findFirst({
      where: {
        uuid,
        accountUuid,
      },
    });

    return keyResult ? this.mapKeyResultToDTO(keyResult) : null;
  }

  async getKeyResultsByGoalUuid(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.KeyResultDTO[]> {
    const keyResults = await this.prisma.keyResult.findMany({
      where: {
        accountUuid,
        goalUuid,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return keyResults.map((kr) => this.mapKeyResultToDTO(kr));
  }

  async updateKeyResult(
    accountUuid: string,
    uuid: string,
    keyResultData: Partial<GoalContracts.KeyResultDTO>,
  ): Promise<GoalContracts.KeyResultDTO> {
    const now = new Date();

    const updated = await this.prisma.keyResult.update({
      where: { uuid },
      data: {
        ...(keyResultData.name && { name: keyResultData.name }),
        ...(keyResultData.description !== undefined && { description: keyResultData.description }),
        ...(keyResultData.startValue !== undefined && { startValue: keyResultData.startValue }),
        ...(keyResultData.targetValue !== undefined && { targetValue: keyResultData.targetValue }),
        ...(keyResultData.currentValue !== undefined && {
          currentValue: keyResultData.currentValue,
        }),
        ...(keyResultData.unit && { unit: keyResultData.unit }),
        ...(keyResultData.weight !== undefined && { weight: keyResultData.weight }),
        ...(keyResultData.calculationMethod && {
          calculationMethod: keyResultData.calculationMethod,
        }),
        updatedAt: now,
      },
    });

    return this.mapKeyResultToDTO(updated);
  }

  async deleteKeyResult(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.keyResult.deleteMany({
      where: {
        uuid,
        accountUuid,
      },
    });

    return result.count > 0;
  }

  // ===== 额外的 Goal 方法 =====

  async getGoalsByDirectoryUuid(
    accountUuid: string,
    directoryUuid: string,
  ): Promise<GoalContracts.GoalDTO[]> {
    const goals = await this.prisma.goal.findMany({
      where: {
        accountUuid,
        dirUuid: directoryUuid,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return goals.map((goal) => this.mapGoalToDTO(goal));
  }

  async getGoalsByStatus(
    accountUuid: string,
    status: 'active' | 'completed' | 'paused' | 'archived',
  ): Promise<GoalContracts.GoalDTO[]> {
    const goals = await this.prisma.goal.findMany({
      where: {
        accountUuid,
        status,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return goals.map((goal) => this.mapGoalToDTO(goal));
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

  async updateKeyResultProgress(
    accountUuid: string,
    uuid: string,
    value: number,
  ): Promise<GoalContracts.KeyResultDTO> {
    const now = new Date();

    const updated = await this.prisma.keyResult.update({
      where: { uuid },
      data: {
        currentValue: value,
        updatedAt: now,
      },
    });

    return this.mapKeyResultToDTO(updated);
  }

  // ===== 其他必需方法的基础实现 =====

  async getGoalDirectoryTree(accountUuid: string): Promise<GoalContracts.GoalDirDTO[]> {
    const dirs = await this.prisma.goalDir.findMany({
      where: {
        accountUuid,
        parentUuid: null, // 只获取根级目录
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return dirs.map((dir) => this.mapGoalDirToDTO(dir));
  }

  // 以下方法暂时抛出未实现错误，后续可以根据需要实现
  async createGoalRecord(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getGoalRecordByUuid(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getGoalRecordsByGoalUuid(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async updateGoalRecord(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async deleteGoalRecord(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async createGoalReview(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getGoalReviewByUuid(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getGoalReviewsByGoalUuid(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async updateGoalReview(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async deleteGoalReview(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async createGoalRelationship(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getGoalRelationshipsByGoalUuid(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async deleteGoalRelationship(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async searchGoals(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getGoalStatistics(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getUpcomingGoals(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getOverdueGoals(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getGoalRecordsByKeyResultUuid(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getGoalStats(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getProgressTrend(): Promise<any> {
    throw new Error('Method not implemented');
  }

  async getUpcomingDeadlines(): Promise<any> {
    throw new Error('Method not implemented');
  }
}
