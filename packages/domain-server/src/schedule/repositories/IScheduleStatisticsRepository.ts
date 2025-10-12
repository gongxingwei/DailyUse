/**
 * IScheduleStatisticsRepository - Repository Interface
 * ScheduleStatistics 仓储接口
 *
 * DDD Repository Pattern:
 * - 抽象统计数据的持久化逻辑
 * - 每个账户一条统计记录
 * - 使用 accountUuid 作为主键
 *
 * @domain-server/schedule
 */

import type { ScheduleStatistics } from '../aggregates/ScheduleStatistics';

/**
 * ScheduleStatistics 仓储接口
 */
export interface IScheduleStatisticsRepository {
  // ============ 基本 CRUD ============

  /**
   * 保存 ScheduleStatistics 聚合根
   * - 新建: INSERT
   * - 更新: UPDATE (UPSERT)
   */
  save(statistics: ScheduleStatistics): Promise<void>;

  /**
   * 根据账户 UUID 查找统计数据
   */
  findByAccountUuid(accountUuid: string): Promise<ScheduleStatistics | null>;

  /**
   * 根据账户 UUID 获取统计数据，不存在则创建
   */
  getOrCreate(accountUuid: string): Promise<ScheduleStatistics>;

  /**
   * 删除统计数据
   */
  deleteByAccountUuid(accountUuid: string): Promise<void>;

  // ============ 批量操作 ============

  /**
   * 查询所有统计数据（管理员用）
   */
  findAll(limit?: number, offset?: number): Promise<ScheduleStatistics[]>;

  /**
   * 批量保存
   */
  saveBatch(statistics: ScheduleStatistics[]): Promise<void>;

  // ============ 事务支持 ============

  /**
   * 在事务中执行操作
   */
  withTransaction<T>(fn: (repo: IScheduleStatisticsRepository) => Promise<T>): Promise<T>;
}
