import { describe, it, expect } from 'vitest';
import { GoalStatistics } from '../GoalStatistics';
import type { GoalContracts } from '@dailyuse/contracts';

describe('GoalStatistics aggregate event handlers', () => {
  it('increments totalGoals and activeGoals on goal.created', () => {
    const stats = GoalStatistics.createEmpty('account-1');

    const event = {
      type: 'goal.created' as const,
      accountUuid: 'account-1',
      timestamp: Date.now(),
      payload: {
        importance: 'MEDIUM' as GoalContracts.ImportanceLevel,
        urgency: 'NONE' as GoalContracts.UrgencyLevel,
        category: 'health',
        newStatus: 'ACTIVE' as GoalContracts.GoalStatus,
      },
    };

    stats.onGoalCreated(event as any);

    expect(stats.totalGoals).toBe(1);
    expect(stats.activeGoals).toBe(1);
  });

  it('updates completedGoals on goal.completed', () => {
    const stats = GoalStatistics.createEmpty('account-2');

    const event = {
      type: 'goal.completed' as const,
      accountUuid: 'account-2',
      timestamp: Date.now(),
      payload: {
        newStatus: 'COMPLETED' as GoalContracts.GoalStatus,
        completedAt: Date.now(),
      },
    };

    stats.onGoalCompleted(event as any);

    expect(stats.completedGoals).toBe(1);
  });
});
