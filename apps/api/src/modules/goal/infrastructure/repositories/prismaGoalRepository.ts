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
        dirUuid: goalData.dirUuid || null, // 处理空字符串，转换为 null
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
        ...(updateData.dirUuid !== undefined && { dirUuid: updateData.dirUuid || null }), // 处理空字符串
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
        goal: {
          accountUuid, // 通过Goal聚合根验证权限
        },
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
        goalUuid,
        goal: {
          accountUuid, // 通过Goal聚合根验证权限，而不是直接使用冗余的accountUuid
        },
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

  // ===== GoalRecord CRUD 操作 =====

  async createGoalRecord(
    accountUuid: string,
    recordData: Omit<GoalContracts.GoalRecordDTO, 'uuid' | 'createdAt'>,
  ): Promise<GoalContracts.GoalRecordDTO> {
    const uuid = randomUUID();
    const now = new Date();

    const created = await this.prisma.goalRecord.create({
      data: {
        uuid,
        keyResultUuid: recordData.keyResultUuid,
        value: recordData.value,
        note: recordData.note,
        createdAt: now,
      },
    });

    return this.mapGoalRecordToDTO(created);
  }

  async getGoalRecordByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalRecordDTO | null> {
    const record = await this.prisma.goalRecord.findFirst({
      where: {
        uuid,
        accountUuid,
      },
    });

    return record ? this.mapGoalRecordToDTO(record) : null;
  }

  async getGoalRecordsByGoalUuid(
    accountUuid: string,
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: Date; end?: Date };
    },
  ): Promise<{
    records: GoalContracts.GoalRecordDTO[];
    total: number;
  }> {
    const where = {
      goalUuid,
      goal: {
        accountUuid, // 通过Goal聚合根验证权限
      },
      ...(params?.dateRange && {
        createdAt: {
          gte: params.dateRange.start,
          lte: params.dateRange.end,
        },
      }),
    };

    const [records, total] = await Promise.all([
      this.prisma.goalRecord.findMany({
        where,
        skip: ((params?.page || 1) - 1) * (params?.limit || 10),
        take: params?.limit || 10,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.goalRecord.count({ where }),
    ]);

    return {
      records: records.map((record) => this.mapGoalRecordToDTO(record)),
      total,
    };
  }

  async getGoalRecordsByKeyResultUuid(
    accountUuid: string,
    keyResultUuid: string,
  ): Promise<GoalContracts.GoalRecordDTO[]> {
    const records = await this.prisma.goalRecord.findMany({
      where: {
        accountUuid,
        keyResultUuid,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.mapGoalRecordToDTO(record));
  }

  async updateGoalRecord(
    accountUuid: string,
    uuid: string,
    recordData: Partial<GoalContracts.GoalRecordDTO>,
  ): Promise<GoalContracts.GoalRecordDTO> {
    const updated = await this.prisma.goalRecord.update({
      where: { uuid },
      data: {
        ...(recordData.value !== undefined && { value: recordData.value }),
        ...(recordData.note !== undefined && { note: recordData.note }),
        ...(recordData.keyResultUuid && { keyResultUuid: recordData.keyResultUuid }),
      },
    });

    return this.mapGoalRecordToDTO(updated);
  }

  async deleteGoalRecord(accountUuid: string, uuid: string): Promise<boolean> {
    const result = await this.prisma.goalRecord.deleteMany({
      where: {
        uuid,
        accountUuid,
      },
    });

    return result.count > 0;
  }

  // ===== GoalReview CRUD 操作 =====

  async createGoalReview(
    accountUuid: string,
    reviewData: Omit<GoalContracts.GoalReviewDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<GoalContracts.GoalReviewDTO> {
    const uuid = randomUUID();
    const now = new Date();

    const created = await this.prisma.goalReview.create({
      data: {
        uuid,
        goalUuid: reviewData.goalUuid,
        title: reviewData.title,
        type: reviewData.type,
        reviewDate: new Date(reviewData.reviewDate),
        content: JSON.stringify(reviewData.content),
        snapshot: JSON.stringify(reviewData.snapshot),
        rating: JSON.stringify(reviewData.rating),
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.mapGoalReviewToDTO(created);
  }

  async getGoalReviewByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalReviewDTO | null> {
    const review = await this.prisma.goalReview.findFirst({
      where: {
        uuid,
        goal: {
          accountUuid,
        },
      },
    });

    return review ? this.mapGoalReviewToDTO(review) : null;
  }

  async getGoalReviewsByGoalUuid(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalReviewDTO[]> {
    const reviews = await this.prisma.goalReview.findMany({
      where: {
        goalUuid,
        goal: {
          accountUuid,
        },
      },
      orderBy: {
        reviewDate: 'desc',
      },
    });

    return reviews.map((review) => this.mapGoalReviewToDTO(review));
  }

  async updateGoalReview(
    accountUuid: string,
    uuid: string,
    reviewData: Partial<GoalContracts.GoalReviewDTO>,
  ): Promise<GoalContracts.GoalReviewDTO> {
    const now = new Date();

    const updated = await this.prisma.goalReview.update({
      where: { uuid },
      data: {
        ...(reviewData.title && { title: reviewData.title }),
        ...(reviewData.type && { type: reviewData.type }),
        ...(reviewData.reviewDate && { reviewDate: new Date(reviewData.reviewDate) }),
        ...(reviewData.content !== undefined && { content: JSON.stringify(reviewData.content) }),
        ...(reviewData.snapshot !== undefined && { snapshot: JSON.stringify(reviewData.snapshot) }),
        ...(reviewData.rating !== undefined && { rating: JSON.stringify(reviewData.rating) }),
        updatedAt: now,
      },
    });

    return this.mapGoalReviewToDTO(updated);
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

  // ===== 映射方法 =====

  private mapGoalRecordToDTO(record: any): GoalContracts.GoalRecordDTO {
    return {
      uuid: record.uuid,
      keyResultUuid: record.keyResultUuid,
      value: record.value,
      note: record.note,
      createdAt: record.createdAt.getTime(),
    };
  }

  private mapGoalReviewToDTO(review: any): GoalContracts.GoalReviewDTO {
    // Parse JSON strings from database
    const content =
      typeof review.content === 'string' ? JSON.parse(review.content) : review.content;
    const snapshot =
      typeof review.snapshot === 'string' ? JSON.parse(review.snapshot) : review.snapshot;
    const rating = typeof review.rating === 'string' ? JSON.parse(review.rating) : review.rating;

    return {
      uuid: review.uuid,
      goalUuid: review.goalUuid,
      title: review.title,
      type: review.type,
      reviewDate: review.reviewDate.getTime(),
      content: content,
      snapshot: snapshot,
      rating: rating,
      createdAt: review.createdAt.getTime(),
      updatedAt: review.updatedAt.getTime(),
    };
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
            accountUuid,
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

  // ========================= DDD聚合根控制方法 =========================

  /**
   * 加载完整的Goal聚合根
   * 包含目标、关键结果、记录、复盘等所有子实体
   */
  async loadGoalAggregate(
    accountUuid: string,
    goalUuid: string,
  ): Promise<{
    goal: GoalContracts.GoalDTO;
    keyResults: GoalContracts.KeyResultDTO[];
    records: GoalContracts.GoalRecordDTO[];
    reviews: GoalContracts.GoalReviewDTO[];
  } | null> {
    // 获取目标基本信息
    const goal = await this.getGoalByUuid(accountUuid, goalUuid);
    if (!goal) {
      return null;
    }

    // 并行获取所有子实体
    const [keyResults, recordsResult, reviews] = await Promise.all([
      this.getKeyResultsByGoalUuid(accountUuid, goalUuid),
      this.getGoalRecordsByGoalUuid(accountUuid, goalUuid),
      this.getGoalReviewsByGoalUuid(accountUuid, goalUuid),
    ]);

    return {
      goal,
      keyResults,
      records: recordsResult.records || [],
      reviews,
    };
  }

  /**
   * 原子性更新Goal聚合根
   * 在一个事务中更新目标及其所有子实体
   */
  async updateGoalAggregate(
    accountUuid: string,
    aggregateData: {
      goal: Partial<GoalContracts.GoalDTO>;
      keyResults?: Array<{
        action: 'create' | 'update' | 'delete';
        data: GoalContracts.KeyResultDTO | Partial<GoalContracts.KeyResultDTO>;
        uuid?: string;
      }>;
      records?: Array<{
        action: 'create' | 'update' | 'delete';
        data: GoalContracts.GoalRecordDTO | Partial<GoalContracts.GoalRecordDTO>;
        uuid?: string;
      }>;
      reviews?: Array<{
        action: 'create' | 'update' | 'delete';
        data: GoalContracts.GoalReviewDTO | Partial<GoalContracts.GoalReviewDTO>;
        uuid?: string;
      }>;
    },
  ): Promise<{
    goal: GoalContracts.GoalDTO;
    keyResults: GoalContracts.KeyResultDTO[];
    records: GoalContracts.GoalRecordDTO[];
    reviews: GoalContracts.GoalReviewDTO[];
  }> {
    // 使用事务确保原子性
    return await this.prisma.$transaction(async (tx) => {
      let updatedGoal: GoalContracts.GoalDTO;

      // 更新目标
      if (aggregateData.goal.uuid) {
        updatedGoal = await this.updateGoal(
          accountUuid,
          aggregateData.goal.uuid,
          aggregateData.goal,
        );
      } else {
        throw new Error('Goal UUID is required for aggregate update');
      }

      // 处理关键结果变更
      if (aggregateData.keyResults) {
        for (const kr of aggregateData.keyResults) {
          switch (kr.action) {
            case 'create':
              await this.createKeyResult(accountUuid, kr.data as GoalContracts.KeyResultDTO);
              break;
            case 'update':
              if (kr.uuid) {
                await this.updateKeyResult(accountUuid, kr.uuid, kr.data);
              }
              break;
            case 'delete':
              if (kr.uuid) {
                await this.deleteKeyResult(accountUuid, kr.uuid);
              }
              break;
          }
        }
      }

      // 处理记录变更
      if (aggregateData.records) {
        for (const record of aggregateData.records) {
          switch (record.action) {
            case 'create':
              await this.createGoalRecord(accountUuid, record.data as GoalContracts.GoalRecordDTO);
              break;
            case 'update':
              if (record.uuid) {
                await this.updateGoalRecord(accountUuid, record.uuid, record.data);
              }
              break;
            case 'delete':
              if (record.uuid) {
                await this.deleteGoalRecord(accountUuid, record.uuid);
              }
              break;
          }
        }
      }

      // 处理复盘变更
      if (aggregateData.reviews) {
        for (const review of aggregateData.reviews) {
          switch (review.action) {
            case 'create':
              await this.createGoalReview(accountUuid, review.data as GoalContracts.GoalReviewDTO);
              break;
            case 'update':
              if (review.uuid) {
                await this.updateGoalReview(accountUuid, review.uuid, review.data);
              }
              break;
            case 'delete':
              if (review.uuid) {
                await this.deleteGoalReview(accountUuid, review.uuid);
              }
              break;
          }
        }
      }

      // 返回更新后的完整聚合
      const result = await this.loadGoalAggregate(accountUuid, updatedGoal.uuid);
      if (!result) {
        throw new Error('Failed to load updated aggregate');
      }
      return result;
    });
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
   * 级联删除Goal聚合根
   */
  async cascadeDeleteGoalAggregate(
    accountUuid: string,
    goalUuid: string,
  ): Promise<{
    deletedGoal: GoalContracts.GoalDTO;
    deletedKeyResults: GoalContracts.KeyResultDTO[];
    deletedRecords: GoalContracts.GoalRecordDTO[];
    deletedReviews: GoalContracts.GoalReviewDTO[];
  }> {
    // 先获取完整聚合数据
    const aggregateData = await this.loadGoalAggregate(accountUuid, goalUuid);
    if (!aggregateData) {
      throw new Error('Goal aggregate not found');
    }

    // 在事务中删除所有相关数据
    await this.prisma.$transaction(async (tx) => {
      // 删除复盘
      await tx.goalReview.deleteMany({
        where: {
          goalUuid,
          goal: {
            accountUuid,
          },
        },
      });

      // 删除记录
      await tx.goalRecord.deleteMany({
        where: {
          goalUuid,
          accountUuid,
        },
      });

      // 删除关键结果
      await tx.keyResult.deleteMany({
        where: {
          goalUuid,
          accountUuid,
        },
      });

      // 最后删除目标
      await tx.goal.deleteMany({
        where: {
          uuid: goalUuid,
          accountUuid,
        },
      });
    });

    return {
      deletedGoal: aggregateData.goal,
      deletedKeyResults: aggregateData.keyResults,
      deletedRecords: aggregateData.records,
      deletedReviews: aggregateData.reviews,
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
