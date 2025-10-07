import { RecurringScheduleTask, ScheduleTask } from '@dailyuse/domain-core';

/**
 * ScheduleTask 仓储接口（统一设计）
 */
export interface IScheduleTaskRepository {
  /**
   * 保存任务
   */
  save(task: ScheduleTask): Promise<ScheduleTask>;

  /**
   * 根据 UUID 查找任务
   */
  findByUuid(uuid: string): Promise<ScheduleTask | null>;

  /**
   * 根据源模块和源实体 ID 查找任务
   */
  findBySource(sourceModule: string, sourceEntityId: string): Promise<ScheduleTask[]>;

  /**
   * 查找所有启用的任务
   */
  findAllEnabled(): Promise<ScheduleTask[]>;

  /**
   * 查找所有任务
   */
  findAll(): Promise<ScheduleTask[]>;

  /**
   * 删除任务
   */
  delete(uuid: string): Promise<void>;

  /**
   * 更新任务
   */
  update(task: ScheduleTask): Promise<ScheduleTask>;

  /**
   * 查找到期需要执行的任务
   */
  findDueTasks(): Promise<ScheduleTask[]>;

  /**
   * 根据源模块查找任务
   */
  findBySourceModule(sourceModule: string): Promise<ScheduleTask[]>;
}

/**
 * RecurringScheduleTask 仓储接口
 * @deprecated Use IScheduleTaskRepository instead
 */
export interface IRecurringScheduleTaskRepository {
  /**
   * 保存任务
   */
  save(task: RecurringScheduleTask): Promise<RecurringScheduleTask>;

  /**
   * 根据 UUID 查找任务
   */
  findByUuid(uuid: string): Promise<RecurringScheduleTask | null>;

  /**
   * 根据源模块和源实体 ID 查找任务
   */
  findBySource(sourceModule: string, sourceEntityId: string): Promise<RecurringScheduleTask[]>;

  /**
   * 查找所有启用的任务
   */
  findAllEnabled(): Promise<RecurringScheduleTask[]>;

  /**
   * 查找所有任务
   */
  findAll(): Promise<RecurringScheduleTask[]>;

  /**
   * 删除任务
   */
  delete(uuid: string): Promise<void>;

  /**
   * 更新任务
   */
  update(task: RecurringScheduleTask): Promise<RecurringScheduleTask>;
}
