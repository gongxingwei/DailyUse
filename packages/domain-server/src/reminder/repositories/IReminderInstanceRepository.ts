/**
 * Reminder Instance Repository Interface
 * 提醒实例仓储接口
 */

import { ReminderContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type ReminderInstanceResponse = ReminderContracts.ReminderInstanceResponse;
type CreateReminderInstanceRequest = ReminderContracts.CreateReminderInstanceRequest;
type UpdateReminderInstanceRequest = ReminderContracts.UpdateReminderInstanceRequest;
type SnoozeReminderRequest = ReminderContracts.SnoozeReminderRequest;
type ReminderStatus = ReminderContracts.ReminderStatus;
type ReminderPriority = ReminderContracts.ReminderPriority;

export interface IReminderInstanceRepository {
  // 基本 CRUD 操作
  findById(uuid: string): Promise<ReminderInstanceResponse | null>;
  findByAccountUuid(accountUuid: string): Promise<ReminderInstanceResponse[]>;
  findByTemplateUuid(templateUuid: string): Promise<ReminderInstanceResponse[]>;
  save(accountUuid: string, instance: CreateReminderInstanceRequest): Promise<void>;
  update(uuid: string, instance: UpdateReminderInstanceRequest): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 状态查询
  findByStatus(accountUuid: string, status: ReminderStatus): Promise<ReminderInstanceResponse[]>;
  findPending(accountUuid: string): Promise<ReminderInstanceResponse[]>;
  findTriggered(accountUuid: string): Promise<ReminderInstanceResponse[]>;
  findSnoozed(accountUuid: string): Promise<ReminderInstanceResponse[]>;
  findOverdue(accountUuid: string): Promise<ReminderInstanceResponse[]>;

  // 时间查询
  findByDateRange(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReminderInstanceResponse[]>;
  findDue(beforeTime?: Date): Promise<ReminderInstanceResponse[]>;
  findUpcoming(accountUuid: string, hours?: number): Promise<ReminderInstanceResponse[]>;

  // 状态操作
  updateStatus(uuid: string, status: ReminderStatus): Promise<void>;
  acknowledge(uuid: string): Promise<void>;
  dismiss(uuid: string): Promise<void>;
  snooze(uuid: string, request: SnoozeReminderRequest): Promise<void>;
  trigger(uuid: string): Promise<void>;
  expire(uuid: string): Promise<void>;

  // 统计操作
  getCountByStatus(accountUuid: string): Promise<Record<string, number>>;
  getCountByPriority(accountUuid: string): Promise<Record<string, number>>;
  getCountByTemplate(accountUuid: string): Promise<Record<string, number>>;
  getTotalCount(accountUuid: string): Promise<number>;
  getAcknowledgmentRate(accountUuid: string): Promise<number>;
  getAverageResponseTime(accountUuid: string): Promise<number>;

  // 批量操作
  batchDelete(uuids: string[]): Promise<void>;
  batchUpdateStatus(uuids: string[], status: ReminderStatus): Promise<void>;
  batchAcknowledge(uuids: string[]): Promise<void>;
  batchDismiss(uuids: string[]): Promise<void>;
  batchSnooze(uuids: string[], snoozeUntil: Date): Promise<void>;

  // 清理操作
  cleanupExpired(accountUuid: string, daysOld?: number): Promise<number>;
  cleanupAcknowledged(accountUuid: string, daysOld?: number): Promise<number>;
}
