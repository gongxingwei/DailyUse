import type { TaskContracts } from '@dailyuse/contracts';

// 仓储基础接口
export interface ITaskTemplateRepository {
  // 基础CRUD操作
  create(template: TaskContracts.ITaskTemplate): Promise<TaskContracts.ITaskTemplate>;
  findById(id: string): Promise<TaskContracts.ITaskTemplate | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskContracts.ITaskTemplate[]>;
  update(
    id: string,
    template: Partial<TaskContracts.ITaskTemplate>,
  ): Promise<TaskContracts.ITaskTemplate>;
  delete(id: string): Promise<void>;

  // 查询操作
  findByName(accountUuid: string, name: string): Promise<TaskContracts.ITaskTemplate | null>;
  findByCategory(accountUuid: string, category: string): Promise<TaskContracts.ITaskTemplate[]>;
  findByTags(accountUuid: string, tags: string[]): Promise<TaskContracts.ITaskTemplate[]>;
  findActive(accountUuid: string): Promise<TaskContracts.ITaskTemplate[]>;
  findPaused(accountUuid: string): Promise<TaskContracts.ITaskTemplate[]>;

  // 统计操作
  count(accountUuid: string): Promise<number>;
  countByStatus(accountUuid: string, status: string): Promise<number>;
}

export interface ITaskInstanceRepository {
  // 基础CRUD操作
  create(instance: TaskContracts.ITaskInstance): Promise<TaskContracts.ITaskInstance>;
  findById(id: string): Promise<TaskContracts.ITaskInstance | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskContracts.ITaskInstance[]>;
  update(
    id: string,
    instance: Partial<TaskContracts.ITaskInstance>,
  ): Promise<TaskContracts.ITaskInstance>;
  delete(id: string): Promise<void>;

  // 关联查询
  findByTemplateId(templateId: string): Promise<TaskContracts.ITaskInstance[]>;
  findByGoalId(goalId: string): Promise<TaskContracts.ITaskInstance[]>;

  // 状态查询
  findByStatus(accountUuid: string, status: string): Promise<TaskContracts.ITaskInstance[]>;
  findCompleted(
    accountUuid: string,
    from?: Date,
    to?: Date,
  ): Promise<TaskContracts.ITaskInstance[]>;
  findPending(accountUuid: string): Promise<TaskContracts.ITaskInstance[]>;
  findOverdue(accountUuid: string): Promise<TaskContracts.ITaskInstance[]>;
  findUpcoming(accountUuid: string, hours?: number): Promise<TaskContracts.ITaskInstance[]>;

  // 时间范围查询
  findByDateRange(
    accountUuid: string,
    from: Date,
    to: Date,
  ): Promise<TaskContracts.ITaskInstance[]>;
  findByScheduleDate(accountUuid: string, date: Date): Promise<TaskContracts.ITaskInstance[]>;
  findByDueDate(accountUuid: string, date: Date): Promise<TaskContracts.ITaskInstance[]>;

  // 搜索操作
  search(accountUuid: string, query: string): Promise<TaskContracts.ITaskInstance[]>;
  findByTags(accountUuid: string, tags: string[]): Promise<TaskContracts.ITaskInstance[]>;
  findByCategory(accountUuid: string, category: string): Promise<TaskContracts.ITaskInstance[]>;
  findByPriority(
    accountUuid: string,
    importance: number,
    urgency: number,
  ): Promise<TaskContracts.ITaskInstance[]>;

  // 统计操作
  count(accountUuid: string): Promise<number>;
  countByStatus(accountUuid: string, status: string): Promise<number>;
  countCompleted(accountUuid: string, from?: Date, to?: Date): Promise<number>;
  getCompletionRate(accountUuid: string, from?: Date, to?: Date): Promise<number>;

  // 提醒相关
  findWithActiveReminders(accountUuid: string): Promise<TaskContracts.ITaskInstance[]>;
  findByReminderTime(from: Date, to: Date): Promise<TaskContracts.ITaskInstance[]>;
}
