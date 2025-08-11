import { Goal } from '../aggregates/Goal';
import { KeyResult } from '../entities/KeyResult';
import { GoalRecord } from '../entities/GoalRecord';
import { GoalReview } from '../entities/GoalReview';
import { IGoalRepository } from '../repositories/IGoalRepository';
import { GoalStatus, KeyResultCalculationMethod, GoalReviewType } from '../types';

export class GoalService {
  constructor(private goalRepository: IGoalRepository) {}

  async createGoal(params: {
    name: string;
    description?: string;
    color: string;
    dirUuid?: string;
    startTime: Date;
    endTime: Date;
    motive: string;
    feasibility: string;
  }): Promise<Goal> {
    const goal = Goal.create(params);
    await this.goalRepository.save(goal);
    return goal;
  }

  async addKeyResult(
    goalId: string,
    params: {
      name: string;
      startValue: number;
      targetValue: number;
      calculationMethod: KeyResultCalculationMethod;
      weight: number;
    },
  ): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    const keyResult = new KeyResult({
      name: params.name,
      startValue: params.startValue,
      targetValue: params.targetValue,
      calculationMethod: params.calculationMethod,
      weight: params.weight,
    });

    goal.addKeyResult(keyResult);
    await this.goalRepository.save(goal);
  }

  async updateKeyResultProgress(goalId: string, keyResultId: string, value: number): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    goal.updateKeyResultValue(keyResultId, value);
    await this.goalRepository.save(goal);
  }

  async recordProgress(
    goalId: string,
    keyResultId: string,
    value: number,
    note?: string,
  ): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    const record = new GoalRecord({
      goalUuid: goalId,
      keyResultUuid: keyResultId,
      value,
      note,
    });

    goal.addRecord(record);
    await this.goalRepository.save(goal);
  }

  async addReview(
    goalId: string,
    params: {
      title: string;
      type: GoalReviewType;
      reviewDate: Date;
      achievements: string;
      challenges: string;
      learnings: string;
      nextSteps: string;
      adjustments?: string;
      progressSatisfaction: number;
      executionEfficiency: number;
      goalReasonableness: number;
    },
  ): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Create snapshot
    const keyResults = goal.keyResults;
    const snapshot = {
      snapshotDate: new Date(),
      overallProgress: goal.overallProgress,
      weightedProgress: goal.weightedProgress,
      completedKeyResults: keyResults.filter((kr) => kr.isCompleted).length,
      totalKeyResults: keyResults.length,
      keyResultsSnapshot: keyResults.map((kr) => ({
        uuid: kr.uuid,
        name: kr.name,
        progress: kr.progress,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
      })),
    };

    const review = new GoalReview({
      goalUuid: goalId,
      title: params.title,
      type: params.type,
      reviewDate: params.reviewDate,
      content: {
        achievements: params.achievements,
        challenges: params.challenges,
        learnings: params.learnings,
        nextSteps: params.nextSteps,
        adjustments: params.adjustments,
      },
      snapshot,
      rating: {
        progressSatisfaction: params.progressSatisfaction,
        executionEfficiency: params.executionEfficiency,
        goalReasonableness: params.goalReasonableness,
      },
    });

    goal.addReview(review);
    await this.goalRepository.save(goal);
  }

  async pauseGoal(goalId: string): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    goal.pause();
    await this.goalRepository.save(goal);
  }

  async resumeGoal(goalId: string): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    goal.resume();
    await this.goalRepository.save(goal);
  }

  async completeGoal(goalId: string): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    goal.complete();
    await this.goalRepository.save(goal);
  }

  async archiveGoal(goalId: string): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    goal.archive();
    await this.goalRepository.save(goal);
  }

  async getGoalsByStatus(status: GoalStatus): Promise<Goal[]> {
    return this.goalRepository.findByStatus(status);
  }

  async getActiveGoals(): Promise<Goal[]> {
    return this.goalRepository.findActiveGoals();
  }

  async getOverdueGoals(): Promise<Goal[]> {
    return this.goalRepository.findOverdueGoals();
  }

  async getGoalProgress(goalId: string): Promise<{
    overallProgress: number;
    weightedProgress: number;
    keyResults: Array<{
      uuid: string;
      name: string;
      progress: number;
      currentValue: number;
      targetValue: number;
      isCompleted: boolean;
    }>;
  }> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    return {
      overallProgress: goal.overallProgress,
      weightedProgress: goal.weightedProgress,
      keyResults: goal.keyResults.map((kr) => ({
        uuid: kr.uuid,
        name: kr.name,
        progress: kr.progress,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
        isCompleted: kr.isCompleted,
      })),
    };
  }
}
