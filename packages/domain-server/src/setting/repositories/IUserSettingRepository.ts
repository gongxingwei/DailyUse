/**
 * UserSetting Repository Interface
 * 用户设置仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 */

// import type { UserSettingServer } from '../aggregates/UserSettingServer';

/**
 * IUserSettingRepository 仓储接口
 *
 * 职责：
 * - 定义 UserSetting 聚合根的持久化操作
 */
export interface IUserSettingRepository {
  /**
   * 保存用户设置（创建或更新）
   */
  save(userSetting: any): Promise<void>;

  /**
   * 通过 UUID 查找用户设置
   *
   * @param uuid 设置 UUID
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string): Promise<any | null>;

  /**
   * 通过账户 UUID 查找用户设置
   *
   * @param accountUuid 账户 UUID
   * @returns 聚合根实例，不存在则返回 null
   */
  findByAccountUuid(accountUuid: string): Promise<any | null>;

  /**
   * 查找所有用户设置
   *
   * @returns 用户设置列表
   */
  findAll(): Promise<any[]>;

  /**
   * 删除用户设置
   *
   * @param uuid 设置 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查用户设置是否存在
   *
   * @param uuid 设置 UUID
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 检查账户是否已有用户设置
   *
   * @param accountUuid 账户 UUID
   */
  existsByAccountUuid(accountUuid: string): Promise<boolean>;

  /**
   * 批量保存用户设置
   *
   * @param userSettings 用户设置列表
   */
  saveMany(userSettings: any[]): Promise<void>;
}
