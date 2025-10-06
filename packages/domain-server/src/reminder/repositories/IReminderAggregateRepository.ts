/**
 * Reminder 聚合根仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { Reminder } from '../aggregates/Reminder';

export interface IReminderAggregateRepository {
  saveReminder(accountUuid: string, reminder: Reminder): Promise<Reminder>;
  getReminderByUuid(accountUuid: string, uuid: string): Promise<Reminder | null>;
  getAllReminders(
    accountUuid: string,
    params?: {
      status?: 'active' | 'snoozed' | 'completed' | 'cancelled';
      type?: 'oneTime' | 'recurring' | 'task' | 'goal' | 'custom';
      limit?: number;
      offset?: number;
      sortBy?: 'reminderTime' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ reminders: Reminder[]; total: number }>;
  getUpcomingReminders(accountUuid: string, timeRangeMinutes: number): Promise<Reminder[]>;
  getOverdueReminders(accountUuid: string): Promise<Reminder[]>;
  deleteReminder(accountUuid: string, uuid: string): Promise<boolean>;
  countReminders(
    accountUuid: string,
    filters?: { status?: 'active' | 'snoozed' | 'completed' | 'cancelled'; isRecurring?: boolean },
  ): Promise<number>;
}
