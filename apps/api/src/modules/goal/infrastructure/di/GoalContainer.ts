import type {
  IGoalRepository,
  IGoalFolderRepository,
  IFocusSessionRepository,
} from '@dailyuse/domain-server';
import { PrismaGoalRepository } from '../repositories/PrismaGoalRepository';
import { PrismaFocusSessionRepository } from '../repositories/PrismaFocusSessionRepository';
// TODO: GoalFolder 表尚未迁移到数据库，需要先创建 Prisma migration
// import { PrismaGoalFolderRepository } from '../repositories/PrismaGoalFolderRepository';
import { prisma } from '@/config/prisma';

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
  private goalFolderRepository?: IGoalFolderRepository;
  private focusSessionRepository?: IFocusSessionRepository;

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
      this.goalRepository = new PrismaGoalRepository(prisma);
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
   * 获取文件夹仓储实例（懒加载）
   * TODO: 需要先创建 GoalFolder 数据库表和迁移
   */
  getGoalFolderRepository(): IGoalFolderRepository {
    if (!this.goalFolderRepository) {
      // TODO: 取消注释以下代码，当数据库迁移完成后
      // this.goalFolderRepository = new PrismaGoalFolderRepository(prisma);
      throw new Error('GoalFolder repository not yet implemented. Database migration required.');
    }
    return this.goalFolderRepository;
  }

  /**
   * 设置文件夹仓储实例（用于测试）
   */
  setGoalFolderRepository(repository: IGoalFolderRepository): void {
    this.goalFolderRepository = repository;
  }

  /**
   * 获取专注周期仓储实例（懒加载）
   */
  getFocusSessionRepository(): IFocusSessionRepository {
    if (!this.focusSessionRepository) {
      this.focusSessionRepository = new PrismaFocusSessionRepository(prisma);
    }
    return this.focusSessionRepository;
  }

  /**
   * 设置专注周期仓储实例（用于测试）
   */
  setFocusSessionRepository(repository: IFocusSessionRepository): void {
    this.focusSessionRepository = repository;
  }

  /**
   * 重置容器（用于测试）
   */
  reset(): void {
    this.goalRepository = undefined;
    this.goalFolderRepository = undefined;
    this.focusSessionRepository = undefined;
  }
}
