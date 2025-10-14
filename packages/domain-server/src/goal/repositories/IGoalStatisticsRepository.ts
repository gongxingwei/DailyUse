/**
 * GoalStatistics 仓储接口
 */

import type { GoalStatistics } from '../aggregates/GoalStatistics';

export interface IGoalStatisticsRepository {
  save(statistics: GoalStatistics): Promise<void>;
  findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null>;
  delete(accountUuid: string): Promise<void>;
}
