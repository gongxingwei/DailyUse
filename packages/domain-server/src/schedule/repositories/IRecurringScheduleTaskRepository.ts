import { RecurringScheduleTask } from '@dailyuse/domain-core';

/**
 * RecurringScheduleTask 仓储接口
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
