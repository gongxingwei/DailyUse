import type { IGoalRepository } from '../repositories/IGoalRepository';

/**
 * Goal Domain Service
 *
 * 核心职责：
 * - 编排和协调 Goal 模块内的多个聚合根和实体。
 * - 处理跨聚合的复杂业务规则和不变量。
 * - 封装核心业务流程，供 Application Service 调用。
 */
export class GoalDomainService {
  constructor(private goalRepository: IGoalRepository) {}

  // 在这里添加处理目标相关业务逻辑的方法
}
