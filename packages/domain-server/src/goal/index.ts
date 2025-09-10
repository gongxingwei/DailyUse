// Goal模块实体导出
export { Goal } from './aggregates/Goal';
export { GoalDir } from './aggregates/GoalDir';
export { KeyResult } from './entities/KeyResult';
export { GoalRecord } from './entities/GoalRecord';
export { GoalReview } from './entities/GoalReview';

// Goal模块仓储接口导出
export type {
  IGoalRepository,
} from './repositories/iGoalRepository';
