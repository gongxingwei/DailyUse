/**
 * Schedule Task Repository Interface
 * @description 调度任务仓储接口定义 - 统一 Cron 设计
 * @author DailyUse Team
 * @date 2025-01-09
 * @updated 2025-10-07 - 重构为统一 Cron 设计，移除旧的复杂方法
 */

import type { ScheduleTask } from '@dailyuse/domain-core';

/**
 * 调度任务仓储接口
 * 只包含核心 CRUD 方法，所有业务逻辑在领域服务中
 */
export interface IScheduleTaskRepository {
  /**
   * 保存任务（创建或更新）
   */
  save(task: ScheduleTask): Promise<ScheduleTask>;

  /**
   * 根据 UUID 查找任务
   */
  findByUuid(uuid: string): Promise<ScheduleTask | null>;

  /**
   * 根据来源查找任务
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
   * 根据来源模块查找任务
   */
  findBySourceModule(sourceModule: string): Promise<ScheduleTask[]>;

  /**
   * 查找到期需要执行的任务
   */
  findDueTasks(now: Date): Promise<ScheduleTask[]>;

  /**
   * 批量保存任务
   */
  saveMany(tasks: ScheduleTask[]): Promise<ScheduleTask[]>;
}
