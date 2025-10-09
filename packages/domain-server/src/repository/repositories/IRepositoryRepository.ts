/**
 * Repository 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { Repository } from '../aggregates/Repository';

/**
 * IRepositoryRepository 仓储接口
 *
 * 职责：
 * - 定义持久化操作的契约
 * - 聚合根是操作的基本单位
 * - 级联保存/加载子实体
 */
export interface IRepositoryRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 级联保存所有子实体
   * - 如果 UUID 已存在则更新，否则插入
   */
  save(repository: Repository): Promise<void>;

  /**
   * 通过 UUID 查找聚合根
   *
   * @param uuid 仓库 UUID
   * @param options.includeChildren 是否加载子实体（默认 false，懒加载）
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Repository | null>;

  /**
   * 通过账户 UUID 查找所有仓库
   *
   * @param accountUuid 账户 UUID
   * @param options.includeChildren 是否加载子实体
   * @returns 仓库列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Repository[]>;

  /**
   * 通过路径查找仓库
   *
   * @param path 仓库路径
   * @returns 聚合根实例，不存在则返回 null
   */
  findByPath(path: string): Promise<Repository | null>;

  /**
   * 删除聚合根
   *
   * 注意：
   * - 这是事务操作
   * - 级联删除所有子实体
   *
   * @param uuid 仓库 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查仓库是否存在
   *
   * @param uuid 仓库 UUID
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 检查路径是否已被使用
   *
   * @param path 仓库路径
   * @param excludeUuid 排除的 UUID（用于更新时检查）
   */
  isPathUsed(path: string, excludeUuid?: string): Promise<boolean>;
}
