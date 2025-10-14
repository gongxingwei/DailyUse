/**
 * ReminderStatistics 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { ReminderStatistics } from '../aggregates/ReminderStatistics';

/**
 * IReminderStatisticsRepository 仓储接口
 *
 * 职责：
 * - 定义 ReminderStatistics 聚合根的持久化操作契约
 * - 每个账户只有一个统计记录（1:1 关系）
 * - 聚合根是操作的基本单位
 */
export interface IReminderStatisticsRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 如果账户已有统计记录则更新，否则插入
   */
  save(statistics: ReminderStatistics): Promise<void>;

  /**
   * 通过账户 UUID 查找统计记录
   * （每个账户只有一个统计记录）
   *
   * @param accountUuid 账户 UUID
   * @returns 统计聚合根实例，不存在则返回 null
   */
  findByAccountUuid(accountUuid: string): Promise<ReminderStatistics | null>;

  /**
   * 通过账户 UUID 查找或创建统计记录
   * （确保账户始终有统计记录）
   *
   * @param accountUuid 账户 UUID
   * @returns 统计聚合根实例
   */
  findOrCreate(accountUuid: string): Promise<ReminderStatistics>;

  /**
   * 删除统计记录
   *
   * 注意：
   * - 这是事务操作
   * - 通常在删除账户时调用
   *
   * @param accountUuid 账户 UUID
   */
  delete(accountUuid: string): Promise<void>;

  /**
   * 检查统计记录是否存在
   *
   * @param accountUuid 账户 UUID
   */
  exists(accountUuid: string): Promise<boolean>;
}
