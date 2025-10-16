import type { IGoalRepository } from '@dailyuse/domain-server';
import { PrismaGoalRepository } from '../persistence/prisma/PrismaGoalRepository';

/**
 * Goal 模块依赖注入容器
 * 负责管理领域服务和仓储的实例创建和生命周期
 *
 * 采用懒加载模式：
 * - 只在首次调用时创建实例
 * - 后续调用返回已有实例（单例）
 *
 * 支持测试替换：
 * - 允许注入 Mock 仓储用于单元测试
 */
export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository?: IGoalRepository;

  private constructor() {}

  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * 获取目标仓储实例（懒加载）
   */
  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      this.goalRepository = new PrismaGoalRepository();
    }
    return this.goalRepository;
  }

  /**
   * 设置目标仓储实例（用于测试）
   */
  setGoalRepository(repository: IGoalRepository): void {
    this.goalRepository = repository;
  }

  /**
   * 重置容器（用于测试）
   */
  reset(): void {
    this.goalRepository = undefined;
  }
}
