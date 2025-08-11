import { Goal } from '../aggregates/Goal';
import { GoalStatus } from '../types';

export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>;
  findByDirectoryId(dirId: string): Promise<Goal[]>;
  findByStatus(status: GoalStatus): Promise<Goal[]>;
  findActiveGoals(): Promise<Goal[]>;
  findOverdueGoals(): Promise<Goal[]>;
  findGoalsByTimeRange(startTime: Date, endTime: Date): Promise<Goal[]>;
  save(goal: Goal): Promise<void>;
  delete(goalId: string): Promise<void>;
  findAll(): Promise<Goal[]>;
  countByStatus(status: GoalStatus): Promise<number>;
}
