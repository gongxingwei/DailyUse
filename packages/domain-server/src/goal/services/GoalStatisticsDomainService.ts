/**
 * GoalStatistics 领域服务
 *
 * DDD 领域服务职责：
 * - 纯业务逻辑（不注入 Repository）
 * - 接受 Goal 聚合数组作为参数
 * - 计算统计数据
 * - 不负责查询和持久化
 *
 * 注意：
 * - 所有方法都是同步的（纯计算）
 * - 不依赖外部服务
 * - ApplicationService 负责查询 Goal 数据并传递给这里
 */

import type { Goal } from '../aggregates/Goal';
import { GoalStatus, GoalImportance, GoalUrgency } from '../enums';
import type { GoalContracts } from '@dailyuse/contracts';

type GoalStatisticsServerDTO = GoalContracts.GoalStatisticsServerDTO;

/**
 * GoalStatisticsDomainService
 *
 * 纯业务逻辑服务，负责统计计算
 */
export class GoalStatisticsDomainService {
  /**
   * 构造函数 - 无依赖注入
   */
  constructor() {}

  /**
   * 计算目标统计
   *
   * @param accountUuid - 账户 UUID
   * @param goals - 目标数组（由 ApplicationService 查询）
   * @returns 统计 DTO
   */
  calculateStatistics(accountUuid: string, goals: Goal[]): GoalStatisticsServerDTO {
    // 基础统计
    const totalGoals = goals.length;
    const activeGoals = this.countByStatus(goals, GoalStatus.ACTIVE);
    const completedGoals = this.countByStatus(goals, GoalStatus.COMPLETED);
    const archivedGoals = this.countByStatus(goals, GoalStatus.ARCHIVED);

    // 逾期目标统计
    const overdueGoals = this.countOverdueGoals(goals);

    // 关键结果统计
    const { totalKeyResults, completedKeyResults } = this.calculateKeyResultStats(goals);

    // 平均进度
    const averageProgress = this.calculateAverageProgress(goals);

    // 按重要性分组
    const goalsByImportance = this.groupByImportance(goals);

    // 按紧急度分组
    const goalsByUrgency = this.groupByUrgency(goals);

    // 按分类分组
    const goalsByCategory = this.groupByCategory(goals);

    // 按状态分组
    const goalsByStatus = this.groupByStatus(goals);

    // 本周创建/完成
    const goalsCreatedThisWeek = this.countCreatedInPeriod(goals, 'week');
    const goalsCompletedThisWeek = this.countCompletedInPeriod(goals, 'week');

    // 本月创建/完成
    const goalsCreatedThisMonth = this.countCreatedInPeriod(goals, 'month');
    const goalsCompletedThisMonth = this.countCompletedInPeriod(goals, 'month');

    // 回顾统计
    const { totalReviews, averageRating } = this.calculateReviewStats(goals);

    return {
      accountUuid,
      totalGoals,
      activeGoals,
      completedGoals,
      archivedGoals,
      overdueGoals,
      totalKeyResults,
      completedKeyResults,
      averageProgress,
      goalsByImportance,
      goalsByUrgency,
      goalsByCategory,
      goalsByStatus,
      goalsCreatedThisWeek,
      goalsCompletedThisWeek,
      goalsCreatedThisMonth,
      goalsCompletedThisMonth,
      totalReviews,
      averageRating,
      lastCalculatedAt: Date.now(),
    };
  }

  // ===== 私有辅助方法 =====

  /**
   * 按状态统计目标数量
   */
  private countByStatus(goals: Goal[], status: GoalStatus): number {
    return goals.filter((g) => g.status === status).length;
  }

  /**
   * 统计逾期目标
   *
   * 逾期定义：
   * - 状态为 ACTIVE
   * - 截止日期已过
   */
  private countOverdueGoals(goals: Goal[]): number {
    const now = Date.now();
    return goals.filter((g) => {
      if (g.status !== GoalStatus.ACTIVE) return false;
      if (!g.targetDate) return false;
      return g.targetDate.getTime() < now;
    }).length;
  }

  /**
   * 计算关键结果统计
   */
  private calculateKeyResultStats(goals: Goal[]): {
    totalKeyResults: number;
    completedKeyResults: number;
  } {
    let totalKeyResults = 0;
    let completedKeyResults = 0;

    for (const goal of goals) {
      const keyResults = goal.keyResults || [];
      totalKeyResults += keyResults.length;

      for (const kr of keyResults) {
        // 关键结果完成定义：currentValue >= targetValue
        if (kr.currentValue >= kr.targetValue) {
          completedKeyResults++;
        }
      }
    }

    return { totalKeyResults, completedKeyResults };
  }

  /**
   * 计算平均进度
   *
   * 只统计 ACTIVE 和 COMPLETED 状态的目标
   */
  private calculateAverageProgress(goals: Goal[]): number {
    const relevantGoals = goals.filter(
      (g) => g.status === GoalStatus.ACTIVE || g.status === GoalStatus.COMPLETED,
    );

    if (relevantGoals.length === 0) return 0;

    const totalProgress = relevantGoals.reduce((sum, g) => sum + (g.progress || 0), 0);
    return Math.round((totalProgress / relevantGoals.length) * 100) / 100; // 保留两位小数
  }

  /**
   * 按重要性分组统计
   */
  private groupByImportance(goals: Goal[]): Record<string, number> {
    const result: Record<string, number> = {
      [GoalImportance.LOW]: 0,
      [GoalImportance.MEDIUM]: 0,
      [GoalImportance.HIGH]: 0,
      [GoalImportance.CRITICAL]: 0,
    };

    for (const goal of goals) {
      const importance = goal.importance || GoalImportance.MEDIUM;
      result[importance] = (result[importance] || 0) + 1;
    }

    return result;
  }

  /**
   * 按紧急度分组统计
   */
  private groupByUrgency(goals: Goal[]): Record<string, number> {
    const result: Record<string, number> = {
      [GoalUrgency.LOW]: 0,
      [GoalUrgency.MEDIUM]: 0,
      [GoalUrgency.HIGH]: 0,
      [GoalUrgency.URGENT]: 0,
    };

    for (const goal of goals) {
      const urgency = goal.urgency || GoalUrgency.MEDIUM;
      result[urgency] = (result[urgency] || 0) + 1;
    }

    return result;
  }

  /**
   * 按分类分组统计
   */
  private groupByCategory(goals: Goal[]): Record<string, number> {
    const result: Record<string, number> = {};

    for (const goal of goals) {
      if (goal.category) {
        result[goal.category] = (result[goal.category] || 0) + 1;
      }
    }

    return result;
  }

  /**
   * 按状态分组统计
   */
  private groupByStatus(goals: Goal[]): Record<string, number> {
    const result: Record<string, number> = {
      [GoalStatus.DRAFT]: 0,
      [GoalStatus.ACTIVE]: 0,
      [GoalStatus.PAUSED]: 0,
      [GoalStatus.COMPLETED]: 0,
      [GoalStatus.ARCHIVED]: 0,
    };

    for (const goal of goals) {
      result[goal.status] = (result[goal.status] || 0) + 1;
    }

    return result;
  }

  /**
   * 统计指定时间段内创建的目标
   */
  private countCreatedInPeriod(goals: Goal[], period: 'week' | 'month'): number {
    const now = Date.now();
    const periodStart = this.getPeriodStart(now, period);

    return goals.filter((g) => {
      return g.createdAt.getTime() >= periodStart;
    }).length;
  }

  /**
   * 统计指定时间段内完成的目标
   */
  private countCompletedInPeriod(goals: Goal[], period: 'week' | 'month'): number {
    const now = Date.now();
    const periodStart = this.getPeriodStart(now, period);

    return goals.filter((g) => {
      if (g.status !== GoalStatus.COMPLETED) return false;
      if (!g.completedAt) return false;
      return g.completedAt.getTime() >= periodStart;
    }).length;
  }

  /**
   * 获取时间段起始时间戳
   */
  private getPeriodStart(now: number, period: 'week' | 'month'): number {
    const date = new Date(now);

    if (period === 'week') {
      // 本周一 00:00:00
      const dayOfWeek = date.getDay() || 7; // 周日=7
      date.setDate(date.getDate() - dayOfWeek + 1);
      date.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      // 本月 1 号 00:00:00
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    }

    return date.getTime();
  }

  /**
   * 计算回顾统计
   */
  private calculateReviewStats(goals: Goal[]): {
    totalReviews: number;
    averageRating: number | null;
  } {
    let totalReviews = 0;
    let totalRating = 0;
    let ratedReviews = 0;

    for (const goal of goals) {
      const reviews = goal.reviews || [];
      totalReviews += reviews.length;

      for (const review of reviews) {
        if (review.rating !== undefined && review.rating !== null) {
          totalRating += review.rating;
          ratedReviews++;
        }
      }
    }

    const averageRating =
      ratedReviews > 0 ? Math.round((totalRating / ratedReviews) * 100) / 100 : null;

    return { totalReviews, averageRating };
  }
}
