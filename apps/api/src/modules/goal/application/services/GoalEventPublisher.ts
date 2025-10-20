import { eventBus, type DomainEvent } from '@dailyuse/utils';
import { GoalStatisticsApplicationService } from './GoalStatisticsApplicationService';
import type { GoalContracts } from '@dailyuse/contracts';
import { GoalStatus } from '@dailyuse/contracts';
import type { Goal } from '@dailyuse/domain-server';

/**
 * Goal 领域事件发布器
 * 负责：
 * 1. 发布 Goal 聚合根的领域事件到事件总线
 * 2. 将领域事件转换为统计事件并更新统计
 */
export class GoalEventPublisher {
  private static isInitialized = false;

  /**
   * 初始化事件监听器（在应用启动时调用一次）
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  [GoalEventPublisher] Already initialized, skipping...');
      return;
    }

    console.log('🚀 [GoalEventPublisher] Initializing Goal statistics event listeners...');

    const statisticsService = await GoalStatisticsApplicationService.getInstance();

    // 监听 goal.created 事件
    eventBus.on('goal.created', async (event: DomainEvent) => {
      try {
        const { goal, accountUuid } = event.payload as {
          goal: GoalContracts.GoalServerDTO;
          accountUuid: string;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'goal.created',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            importance: goal.importance,
            urgency: goal.urgency,
            category: goal.category ?? undefined,
            newStatus: goal.status,
          },
        });

        console.log(`✅ [GoalEventPublisher] Handled goal.created for ${goal.uuid}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling goal.created:', error);
      }
    });

    // 监听 goal.deleted 事件
    eventBus.on('goal.deleted', async (event: DomainEvent) => {
      try {
        const { accountUuid, importance, urgency, category, status } = event.payload as {
          accountUuid: string;
          importance: GoalContracts.ImportanceLevel;
          urgency: GoalContracts.UrgencyLevel;
          category?: string;
          status: GoalContracts.GoalStatus;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'goal.deleted',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            importance,
            urgency,
            category,
            previousStatus: status,
          },
        });

        console.log(`✅ [GoalEventPublisher] Handled goal.deleted for ${event.aggregateId}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling goal.deleted:', error);
      }
    });

    // 监听 goal.status_changed 事件
    eventBus.on('goal.status_changed', async (event: DomainEvent) => {
      try {
        const { accountUuid, previousStatus, newStatus } = event.payload as {
          accountUuid: string;
          previousStatus: GoalContracts.GoalStatus;
          newStatus: GoalContracts.GoalStatus;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'goal.status_changed',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            previousStatus,
            newStatus,
          },
        });

        console.log(
          `✅ [GoalEventPublisher] Handled goal.status_changed: ${previousStatus} → ${newStatus}`,
        );
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling goal.status_changed:', error);
      }
    });

    // 监听 goal.completed 事件
    eventBus.on('goal.completed', async (event: DomainEvent) => {
      try {
        if (!event.accountUuid) {
          console.error('❌ [GoalEventPublisher] Missing accountUuid in goal.completed event');
          return;
        }

        const { completedAt } = event.payload as {
          completedAt: number;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'goal.completed',
          accountUuid: event.accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            newStatus: GoalStatus.COMPLETED,
            completedAt,
          },
        });

        console.log(`✅ [GoalEventPublisher] Handled goal.completed for ${event.aggregateId}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling goal.completed:', error);
      }
    });

    // 监听 goal.archived 事件
    eventBus.on('goal.archived', async (event: DomainEvent) => {
      try {
        const { accountUuid } = event.payload as { accountUuid: string };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'goal.archived',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            newStatus: GoalStatus.ARCHIVED,
          },
        });

        console.log(`✅ [GoalEventPublisher] Handled goal.archived for ${event.aggregateId}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling goal.archived:', error);
      }
    });

    // 监听 goal.activated 事件
    eventBus.on('goal.activated', async (event: DomainEvent) => {
      try {
        const { accountUuid, previousStatus } = event.payload as {
          accountUuid: string;
          previousStatus: GoalContracts.GoalStatus;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'goal.activated',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            previousStatus,
            newStatus: GoalStatus.ACTIVE,
          },
        });

        console.log(`✅ [GoalEventPublisher] Handled goal.activated for ${event.aggregateId}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling goal.activated:', error);
      }
    });

    // 监听 key_result.created 事件
    eventBus.on('key_result.created', async (event: DomainEvent) => {
      try {
        const { accountUuid } = event.payload as { accountUuid: string };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'key_result.created',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {},
        });

        console.log(`✅ [GoalEventPublisher] Handled key_result.created for ${event.aggregateId}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling key_result.created:', error);
      }
    });

    // 监听 key_result.deleted 事件
    eventBus.on('key_result.deleted', async (event: DomainEvent) => {
      try {
        const { accountUuid, wasCompleted } = event.payload as {
          accountUuid: string;
          wasCompleted: boolean;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'key_result.deleted',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            wasCompleted,
          },
        });

        console.log(`✅ [GoalEventPublisher] Handled key_result.deleted for ${event.aggregateId}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling key_result.deleted:', error);
      }
    });

    // 监听 key_result.completed 事件
    eventBus.on('key_result.completed', async (event: DomainEvent) => {
      try {
        const { accountUuid } = event.payload as { accountUuid: string };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'key_result.completed',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {},
        });

        console.log(
          `✅ [GoalEventPublisher] Handled key_result.completed for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling key_result.completed:', error);
      }
    });

    // 监听 review.created 事件
    eventBus.on('review.created', async (event: DomainEvent) => {
      try {
        const { accountUuid, rating } = event.payload as {
          accountUuid: string;
          rating?: number;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'review.created',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            rating,
          },
        });

        console.log(`✅ [GoalEventPublisher] Handled review.created for ${event.aggregateId}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling review.created:', error);
      }
    });

    // 监听 review.deleted 事件
    eventBus.on('review.deleted', async (event: DomainEvent) => {
      try {
        const { accountUuid, rating } = event.payload as {
          accountUuid: string;
          rating?: number;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'review.deleted',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            rating,
          },
        });

        console.log(`✅ [GoalEventPublisher] Handled review.deleted for ${event.aggregateId}`);
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling review.deleted:', error);
      }
    });

    // 监听 focus_session.completed 事件
    eventBus.on('focus_session.completed', async (event: DomainEvent) => {
      try {
        const { accountUuid, durationMinutes } = event.payload as {
          accountUuid: string;
          durationMinutes: number;
        };

        await statisticsService.handleStatisticsUpdateEvent({
          type: 'focus_session.completed',
          accountUuid,
          timestamp: event.occurredOn.getTime(),
          payload: {
            durationMinutes,
          },
        });

        console.log(
          `✅ [GoalEventPublisher] Handled focus_session.completed for ${event.aggregateId}`,
        );
      } catch (error) {
        console.error('❌ [GoalEventPublisher] Error handling focus_session.completed:', error);
      }
    });

    this.isInitialized = true;
    console.log('✅ [GoalEventPublisher] All event listeners registered successfully!');
  }

  /**
   * 发布 Goal 聚合根的领域事件
   * @param goal Goal 聚合根实例
   */
  static async publishGoalEvents(goal: Goal): Promise<void> {
    const events = goal.getDomainEvents();
    if (events.length === 0) {
      return;
    }

    console.log(`📤 [GoalEventPublisher] Publishing ${events.length} events for goal ${goal.uuid}`);

    for (const event of events) {
      await eventBus.publish(event);
    }

    // 清除已发布的事件
    goal.clearDomainEvents();
  }

  /**
   * 重置事件监听器（主要用于测试）
   */
  static reset(): void {
    console.log('🔄 [GoalEventPublisher] Resetting event listeners...');
    this.isInitialized = false;
  }
}
