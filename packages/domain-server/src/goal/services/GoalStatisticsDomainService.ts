/**
 * GoalStatistics 领域服务
 *
 * DDD 领域服务职责：
 * - 统计数据的业务逻辑协调
 * - 初始化和重新计算统计
 * - 响应目标事件更新统计
 * - 使用仓储接口进行持久化
 *
 * 架构说明：
 * - 注入 IGoalStatisticsRepository 和 IGoalRepository
 * - 提供增量更新方法（事件驱动）
 * - 提供完全重算方法（数据修复）
 * - 所有业务逻辑委托给 GoalStatistics 聚合根
 */

import type { IGoalStatisticsRepository } from '../repositories/IGoalStatisticsRepository';
import type { IGoalRepository } from '../repositories/IGoalRepository';
import { GoalStatistics } from '../aggregates/GoalStatistics';
import type { Goal } from '../aggregates/Goal';
import type { GoalContracts } from '@dailyuse/contracts';
import { GoalStatus } from '@dailyuse/contracts';

type GoalStatisticsUpdateEvent = GoalContracts.GoalStatisticsUpdateEvent;
type RecalculateGoalStatisticsRequest = GoalContracts.RecalculateGoalStatisticsRequest;
type RecalculateGoalStatisticsResponse = GoalContracts.RecalculateGoalStatisticsResponse;

/**
 * GoalStatisticsDomainService
 *
 * 负责协调统计聚合根的持久化和事件处理
 */
export class GoalStatisticsDomainService {
  constructor(
    private readonly statisticsRepo: IGoalStatisticsRepository,
    private readonly goalRepo: IGoalRepository,
  ) {}

  /**
   * 获取或创建统计信息
   *
   * 如果账户还没有统计记录，则创建一个空统计
   */
  public async getOrCreateStatistics(accountUuid: string): Promise<GoalStatistics> {
    // 1. 尝试获取现有统计
    let statistics = await this.statisticsRepo.findByAccountUuid(accountUuid);

    // 2. 如果不存在，创建空统计
    if (!statistics) {
      statistics = GoalStatistics.createEmpty(accountUuid);
      await this.statisticsRepo.upsert(statistics);
    }

    return statistics;
  }

  /**
   * 获取统计信息（不自动创建）
   */
  public async getStatistics(accountUuid: string): Promise<GoalStatistics | null> {
    return await this.statisticsRepo.findByAccountUuid(accountUuid);
  }

  /**
   * 初始化统计信息（从现有Goal数据计算）
   *
   * 用于：
   * - 新账户首次创建统计
   * - 数据迁移后初始化统计
   */
  public async initializeStatistics(accountUuid: string): Promise<GoalStatistics> {
    // 1. 检查是否已存在
    const existing = await this.statisticsRepo.findByAccountUuid(accountUuid);
    if (existing) {
      return existing;
    }

    // 2. 从数据库重新计算所有统计
    const statistics = await this.calculateStatisticsFromDatabase(accountUuid);

    // 3. 保存统计
    await this.statisticsRepo.upsert(statistics);

    return statistics;
  }

  /**
   * 重新计算统计信息（修复数据不一致）
   *
   * 用于：
   * - 管理员手动触发重算
   * - 数据不一致时修复
   * - 定期校验统计准确性
   */
  public async recalculateStatistics(
    request: RecalculateGoalStatisticsRequest,
  ): Promise<RecalculateGoalStatisticsResponse> {
    const { accountUuid, force = false } = request;

    try {
      // 1. 检查是否存在现有统计
      const existing = await this.statisticsRepo.findByAccountUuid(accountUuid);

      // 2. 如果不强制且已存在，可以选择跳过或比较差异
      if (existing && !force) {
        return {
          success: true,
          message: 'Statistics already exist. Use force=true to recalculate.',
          statistics: existing.toServerDTO(),
        };
      }

      // 3. 从数据库重新计算所有统计
      const statistics = await this.calculateStatisticsFromDatabase(accountUuid);

      // 4. 保存统计
      await this.statisticsRepo.upsert(statistics);

      return {
        success: true,
        message: 'Statistics recalculated successfully.',
        statistics: statistics.toServerDTO(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to recalculate statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics: GoalStatistics.createEmpty(accountUuid).toServerDTO(),
      };
    }
  }

  /**
   * 处理统计更新事件（增量更新）
   *
   * 用于：
   * - 实时响应目标事件
   * - 增量更新统计数据
   * - 避免全量重算
   */
  public async handleStatisticsUpdateEvent(event: GoalStatisticsUpdateEvent): Promise<void> {
    // 1. 获取或创建统计
    const statistics = await this.getOrCreateStatistics(event.accountUuid);

    // 2. 根据事件类型更新统计
    switch (event.type) {
      case 'goal.created':
        statistics.onGoalCreated(event);
        break;

      case 'goal.deleted':
        statistics.onGoalDeleted(event);
        break;

      case 'goal.status_changed':
        statistics.onGoalStatusChanged(event);
        break;

      case 'goal.completed':
        statistics.onGoalCompleted(event);
        break;

      case 'goal.archived':
        statistics.onGoalArchived(event);
        break;

      case 'goal.activated':
        statistics.onGoalActivated(event);
        break;

      case 'key_result.created':
        statistics.onKeyResultCreated(event);
        break;

      case 'key_result.deleted':
        statistics.onKeyResultDeleted(event);
        break;

      case 'key_result.completed':
        statistics.onKeyResultCompleted(event);
        break;

      case 'review.created':
        statistics.onReviewCreated(event);
        break;

      case 'review.deleted':
        statistics.onReviewDeleted(event);
        break;

      case 'focus_session.completed':
        statistics.onFocusSessionCompleted(event);
        break;

      default:
        // 未知事件类型，记录警告
        console.warn(`Unknown goal statistics update event type: ${(event as any).type}`);
        return;
    }

    // 3. 保存更新后的统计
    await this.statisticsRepo.upsert(statistics);
  }

  /**
   * 删除统计信息
   *
   * 用于：
   * - 删除账户时清理统计
   * - 通常由数据库 CASCADE 自动触发
   */
  public async deleteStatistics(accountUuid: string): Promise<boolean> {
    return await this.statisticsRepo.delete(accountUuid);
  }

  // ===== 私有辅助方法 =====

  /**
   * 从数据库重新计算统计（私有方法）
   *
   * 遍历所有Goal计算统计数据
   */
  private async calculateStatisticsFromDatabase(accountUuid: string): Promise<GoalStatistics> {
    // 1. 获取账户所有目标（包括归档）
    const goals = await this.goalRepo.findByAccountUuid(accountUuid, {
      includeChildren: true, // 包含子目标
    });

    // 2. 使用工厂方法从Goal数组创建统计
    const statistics = this.calculateStatisticsFromGoals(accountUuid, goals);

    return statistics;
  }

  /**
   * 从Goal数组计算统计（纯计算，无副作用）
   */
  private calculateStatisticsFromGoals(accountUuid: string, goals: Goal[]): GoalStatistics {
    // 创建空统计对象
    const statistics = GoalStatistics.createEmpty(accountUuid);

    // 遍历Goal并更新统计
    for (const goal of goals) {
      // 模拟Goal创建事件
      const event: GoalStatisticsUpdateEvent = {
        type: 'goal.created',
        accountUuid,
        timestamp: goal.createdAt || Date.now(),
        payload: {
          importance: goal.importance,
          urgency: goal.urgency,
          category: goal.category || undefined,
          newStatus: goal.status as GoalContracts.GoalStatus,
        },
      };
      statistics.onGoalCreated(event);

      // 如果目标已完成，触发完成事件
      if (goal.status === 'COMPLETED' && goal.completedAt) {
        statistics.onGoalCompleted({
          type: 'goal.completed',
          accountUuid,
          timestamp: goal.completedAt,
          payload: {
            newStatus: GoalStatus.COMPLETED,
          },
        });
      }

      // 如果目标已归档，触发归档事件
      if (goal.status === 'ARCHIVED') {
        statistics.onGoalArchived({
          type: 'goal.archived',
          accountUuid,
          timestamp: Date.now(),
          payload: {
            newStatus: GoalStatus.ARCHIVED,
          },
        });
      }

      // 关键结果统计
      const keyResults = goal.keyResults || [];
      for (const kr of keyResults) {
        statistics.onKeyResultCreated({
          type: 'key_result.created',
          accountUuid,
          timestamp: Date.now(),
          payload: {},
        });

        // 如果关键结果已完成（检查progress字段）
        if (kr.progress && kr.progress.currentValue >= kr.progress.targetValue) {
          statistics.onKeyResultCompleted({
            type: 'key_result.completed',
            accountUuid,
            timestamp: Date.now(),
            payload: {},
          });
        }
      }

      // 回顾统计
      const reviews = goal.reviews || [];
      for (const review of reviews) {
        statistics.onReviewCreated({
          type: 'review.created',
          accountUuid,
          timestamp: Date.now(),
          payload: {
            rating: review.rating ?? undefined,
          },
        });
      }
    }

    return statistics;
  }
}
