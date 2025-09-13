import { Goal } from '@dailyuse/domain-client';

/**
 * Goal 领域服务
 *
 * 职责：处理跨聚合根或复杂的业务逻辑，这些逻辑不适合放在单个聚合根内部
 *
 * 注意：领域服务应该是无状态的，只包含业务逻辑，不涉及持久化或应用层协调
 */
export class GoalDomainService {
  /**
   * 计算目标之间的依赖冲突
   * 场景：当多个目标有重叠的关键结果时，检查是否会产生冲突
   */
  checkGoalConflicts(
    primaryGoal: Goal,
    relatedGoals: Goal[],
  ): {
    hasConflicts: boolean;
    conflicts: Array<{
      conflictType: 'weight_overlap' | 'resource_conflict' | 'timeline_conflict';
      message: string;
      affectedGoals: string[];
    }>;
  } {
    const conflicts: any[] = [];

    // 检查权重冲突
    relatedGoals.forEach((relatedGoal) => {
      const weightConflict = this.detectWeightConflicts(primaryGoal, relatedGoal);
      if (weightConflict) {
        conflicts.push(weightConflict);
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * 计算目标完成度的复杂业务逻辑
   * 场景：基于多种因素计算目标的真实完成度（不仅仅是简单的百分比）
   */
  calculateGoalHealthScore(goal: Goal): {
    overallScore: number;
    factors: {
      progressScore: number; // 进度得分
      timelinessScore: number; // 时间性得分
      qualityScore: number; // 质量得分
      consistencyScore: number; // 一致性得分
    };
    recommendation: string;
  } {
    const progressScore = goal.overallProgress / 100;

    // 时间性得分：基于剩余时间和当前进度
    const timelinessScore = this.calculateTimelinessScore(goal);

    // 质量得分：基于关键结果的质量
    const qualityScore = this.calculateQualityScore(goal);

    // 一致性得分：基于记录的频率和规律性
    const consistencyScore = this.calculateConsistencyScore(goal);

    const overallScore =
      progressScore * 0.4 + timelinessScore * 0.3 + qualityScore * 0.2 + consistencyScore * 0.1;

    return {
      overallScore,
      factors: {
        progressScore,
        timelinessScore,
        qualityScore,
        consistencyScore,
      },
      recommendation: this.generateRecommendation(overallScore, {
        progressScore,
        timelinessScore,
        qualityScore,
        consistencyScore,
      }),
    };
  }

  /**
   * 目标克隆的业务逻辑
   * 场景：复制目标时需要特殊的业务规则处理
   */
  cloneGoalWithBusinessRules(
    sourceGoal: Goal,
    cloneOptions: {
      includeRecords: boolean;
      includeReviews: boolean;
      adjustTimeframe: boolean;
      newTimeframe?: { startTime: Date; endTime: Date };
    },
  ): Goal {
    // 创建基础目标副本
    const clonedGoal = sourceGoal.clone();

    // 重置特定字段
    clonedGoal.resetForClone();

    // 应用时间调整逻辑
    if (cloneOptions.adjustTimeframe && cloneOptions.newTimeframe) {
      this.adjustGoalTimeframe(clonedGoal, cloneOptions.newTimeframe);
    }

    // 处理关键结果的克隆逻辑
    if (!cloneOptions.includeRecords) {
      clonedGoal.clearAllRecords();
    }

    if (!cloneOptions.includeReviews) {
      clonedGoal.clearAllReviews();
    }

    return clonedGoal;
  }

  /**
   * 批量目标权重调整的业务逻辑
   * 场景：当用户需要调整多个目标的优先级权重时
   */
  rebalanceGoalWeights(
    goals: Goal[],
    newWeightDistribution: Map<string, number>,
  ): Map<string, Goal> {
    // 验证权重总和
    const totalWeight = Array.from(newWeightDistribution.values()).reduce(
      (sum, weight) => sum + weight,
      0,
    );
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`目标权重总和必须为100%，当前为${totalWeight}%`);
    }

    const adjustedGoals = new Map<string, Goal>();

    goals.forEach((goal) => {
      const newWeight = newWeightDistribution.get(goal.uuid);
      if (newWeight !== undefined) {
        const adjustedGoal = goal.clone();
        adjustedGoal.adjustPriorityWeight(newWeight);
        adjustedGoals.set(goal.uuid, adjustedGoal);
      }
    });

    return adjustedGoals;
  }

  // ===== 私有辅助方法 =====

  private detectWeightConflicts(goal1: Goal, goal2: Goal): any {
    // 检测权重冲突的逻辑
    return null; // 简化实现
  }

  private calculateTimelinessScore(goal: Goal): number {
    const totalDays = goal.totalDuration;
    const remainingDays = goal.daysRemaining;
    const progress = goal.overallProgress;

    if (remainingDays < 0) return 0; // 已逾期
    if (totalDays === 0) return 1; // 没有时间限制

    const expectedProgress = ((totalDays - remainingDays) / totalDays) * 100;
    const progressRatio = progress / expectedProgress;

    return Math.min(progressRatio, 1);
  }

  private calculateQualityScore(goal: Goal): number {
    // 基于关键结果的完成质量计算
    const keyResults = goal.keyResults;
    if (keyResults.length === 0) return 0;

    const qualitySum = keyResults.reduce((sum, kr) => {
      // 假设关键结果有质量评估逻辑
      return sum + kr.currentValue / kr.targetValue;
    }, 0);

    return Math.min(qualitySum / keyResults.length, 1);
  }

  private calculateConsistencyScore(goal: Goal): number {
    // 基于记录频率计算一致性
    const records = goal.records;
    if (records.length < 2) return 0.5;

    // 计算记录间隔的标准差来评估一致性
    const intervals = [];
    for (let i = 1; i < records.length; i++) {
      const interval = records[i].createdAt.getTime() - records[i - 1].createdAt.getTime();
      intervals.push(interval);
    }

    if (intervals.length === 0) return 0.5;

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // 标准差越小，一致性越高
    const consistencyScore = Math.max(0, 1 - stdDev / avgInterval);
    return Math.min(consistencyScore, 1);
  }

  private generateRecommendation(overallScore: number, factors: any): string {
    if (overallScore >= 0.8) {
      return '目标执行状况优秀，继续保持当前节奏';
    } else if (overallScore >= 0.6) {
      return '目标执行正常，建议适度优化时间安排';
    } else if (overallScore >= 0.4) {
      return '目标执行存在问题，建议重新评估计划';
    } else {
      return '目标执行严重滞后，建议暂停并重新制定策略';
    }
  }

  private adjustGoalTimeframe(goal: Goal, newTimeframe: { startTime: Date; endTime: Date }): void {
    // 调整目标时间框架的业务逻辑
    goal.updateTimeframe(newTimeframe.startTime, newTimeframe.endTime);
  }
}
