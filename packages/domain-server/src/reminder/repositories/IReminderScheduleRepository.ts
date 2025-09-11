/**
 * Reminder Schedule Repository Interface
 * 提醒计划仓储接口
 */

import { ReminderContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type IReminderSchedule = ReminderContracts.IReminderSchedule;

export interface IReminderScheduleRepository {
  // 基本 CRUD 操作
  findById(uuid: string): Promise<IReminderSchedule | null>;
  findByAccountUuid(accountUuid: string): Promise<IReminderSchedule[]>;
  findByTemplateUuid(templateUuid: string): Promise<IReminderSchedule[]>;
  save(accountUuid: string, schedule: IReminderSchedule): Promise<void>;
  update(uuid: string, schedule: Partial<IReminderSchedule>): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 状态查询
  findEnabled(accountUuid: string): Promise<IReminderSchedule[]>;
  findDisabled(accountUuid: string): Promise<IReminderSchedule[]>;
  findDue(beforeTime?: Date): Promise<IReminderSchedule[]>;

  // 执行管理
  updateNextExecutionTime(uuid: string, nextTime: Date): Promise<void>;
  incrementExecutionCount(uuid: string): Promise<void>;
  recordExecution(uuid: string): Promise<void>;

  // 状态管理
  enable(uuid: string): Promise<void>;
  disable(uuid: string): Promise<void>;

  // 批量操作
  batchEnable(uuids: string[]): Promise<void>;
  batchDisable(uuids: string[]): Promise<void>;
  batchDelete(uuids: string[]): Promise<void>;

  // 统计操作
  getEnabledCount(accountUuid: string): Promise<number>;
  getTotalCount(accountUuid: string): Promise<number>;
  getExecutionStats(accountUuid: string): Promise<{
    totalExecutions: number;
    avgExecutionsPerSchedule: number;
    activeSchedules: number;
    inactiveSchedules: number;
  }>;

  // 清理操作
  cleanupCompleted(accountUuid: string): Promise<number>;
  resetExecutionCounts(accountUuid: string): Promise<number>;
}
