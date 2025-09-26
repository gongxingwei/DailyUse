import type { IGoalRepository } from '@dailyuse/domain-server';
import { PrismaGoalRepository } from '../repositories/prismaGoalRepository';
import { prisma } from '@/config/prisma';

export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository: IGoalRepository | null = null;

  private constructor() {}

  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * 获取 Goal Prisma 仓库实例
   */
  async getPrismaGoalRepository(): Promise<IGoalRepository> {
    if (!this.goalRepository) {
      this.goalRepository = new PrismaGoalRepository(prisma);
    }
    return this.goalRepository;
  }

  // 用于测试时替换实现
  setGoalRepository(repository: IGoalRepository): void {
    this.goalRepository = repository;
  }
}
