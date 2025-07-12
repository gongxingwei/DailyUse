import type { IGoalRepository } from '../../domain/repositories/iGoalRepository';
import { GoalDatabaseRepository } from '../repositories/goalDatabaseRepository';
import { getDatabase } from "../../../../shared/database/index";
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
   * 获取 Goal 仓库实例
   */
  async getGoalRepository(): Promise<IGoalRepository> {
    if (!this.goalRepository) {
      const db = await getDatabase();
      this.goalRepository = new GoalDatabaseRepository(db);
    }
    return this.goalRepository;
  }

  /**
   * 设置当前用户到所有仓库
   */
  async setCurrentUser(username: string): Promise<void> {
    const goalRepo = await this.getGoalRepository();
    goalRepo.setCurrentUser(username);
  }

  // 用于测试时替换实现
  setGoalRepository(repository: IGoalRepository): void {
    this.goalRepository = repository;
  }
}
