import type { IGoalAggregateRepository, IGoalDirRepository } from '@dailyuse/domain-server';
import { PrismaGoalAggregateRepository } from '../repositories/PrismaGoalAggregateRepository';
import { PrismaGoalDirRepository } from '../repositories/PrismaGoalDirRepository';
import { prisma } from '@/config/prisma';

/**
 * Goal 模块 DI 容器
 * 按聚合根提供独立的仓储实例
 */
export class GoalContainer {
  private static instance: GoalContainer;
  private goalAggregateRepository: IGoalAggregateRepository | null = null;
  private goalDirRepository: IGoalDirRepository | null = null;

  private constructor() {}

  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * 获取 Goal 聚合根仓储
   */
  getGoalAggregateRepository(): IGoalAggregateRepository {
    if (!this.goalAggregateRepository) {
      this.goalAggregateRepository = new PrismaGoalAggregateRepository(prisma);
    }
    return this.goalAggregateRepository;
  }

  /**
   * 获取 GoalDir 仓储
   */
  getGoalDirRepository(): IGoalDirRepository {
    if (!this.goalDirRepository) {
      this.goalDirRepository = new PrismaGoalDirRepository(prisma);
    }
    return this.goalDirRepository;
  }

  // 用于测试时替换实现
  setGoalAggregateRepository(repository: IGoalAggregateRepository): void {
    this.goalAggregateRepository = repository;
  }

  setGoalDirRepository(repository: IGoalDirRepository): void {
    this.goalDirRepository = repository;
  }
}
