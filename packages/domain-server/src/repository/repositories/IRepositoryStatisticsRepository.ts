/**
 * RepositoryStatistics 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { RepositoryStatistics } from '../aggregates/RepositoryStatistics';

/**
 * IRepositoryStatisticsRepository 仓储接口
 *
 * 职责：
 * - 定义统计数据的持久化操作契约
 * - RepositoryStatistics 聚合根是操作的基本单位
 * - 每个账户只有一条统计记录（accountUuid 唯一）
 */
export interface IRepositoryStatisticsRepository {
  /**
   * 保存统计信息（创建或更新）
   *
   * 注意：
   * - 使用 UPSERT 语义（存在则更新，不存在则插入）
   * - accountUuid 是唯一标识
   * - 这是事务操作
   *
   * @param statistics 统计聚合根
   */
  upsert(statistics: RepositoryStatistics): Promise<void>;

  /**
   * 通过账户 UUID 查找统计信息
   *
   * @param accountUuid 账户 UUID
   * @returns 统计聚合根实例，不存在则返回 null
   */
  findByAccountUuid(accountUuid: string): Promise<RepositoryStatistics | null>;

  /**
   * 删除统计信息
   *
   * 注意：
   * - 通常在删除账户时使用
   * - 可以通过数据库的 CASCADE 自动触发
   *
   * @param accountUuid 账户 UUID
   */
  delete(accountUuid: string): Promise<void>;

  /**
   * 检查统计信息是否存在
   *
   * @param accountUuid 账户 UUID
   */
  exists(accountUuid: string): Promise<boolean>;

  /**
   * 批量获取多个账户的统计信息
   *
   * 用于管理员查看或批量导出
   *
   * @param accountUuids 账户 UUID 列表
   * @returns 统计聚合根列表
   */
  findByAccountUuids(accountUuids: string[]): Promise<RepositoryStatistics[]>;

  /**
   * 获取所有账户的统计信息（分页）
   *
   * 用于管理员查看系统整体统计
   *
   * @param options.skip 跳过数量
   * @param options.take 获取数量
   * @returns 统计聚合根列表
   */
  findAll(options?: { skip?: number; take?: number }): Promise<RepositoryStatistics[]>;

  /**
   * 统计所有账户的统计记录总数
   *
   * 用于分页计算
   */
  count(): Promise<number>;
}
