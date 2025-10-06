/**
 * IUserPreferencesRepository Interface
 * @description 用户偏好仓储接口
 * @author DailyUse Team
 * @date 2024
 */

import type { UserPreferences } from '../aggregates/UserPreferences';

/**
 * 用户偏好仓储接口
 *
 * 职责：
 * - 定义用户偏好的持久化操作
 * - 提供查询、保存、删除等基础操作
 * - 支持批量操作
 */
export interface IUserPreferencesRepository {
  /**
   * 根据账户UUID查找偏好
   * @param accountUuid 账户UUID
   * @returns 用户偏好实例，如果不存在则返回null
   */
  findByAccountUuid(accountUuid: string): Promise<UserPreferences | null>;

  /**
   * 根据UUID查找偏好
   * @param uuid 用户偏好UUID
   * @returns 用户偏好实例，如果不存在则返回null
   */
  findByUuid(uuid: string): Promise<UserPreferences | null>;

  /**
   * 保存或更新偏好
   * @param preferences 用户偏好实例
   * @returns 保存后的用户偏好实例
   */
  save(preferences: UserPreferences): Promise<UserPreferences>;

  /**
   * 删除偏好（根据账户UUID）
   * @param accountUuid 账户UUID
   */
  deleteByAccountUuid(accountUuid: string): Promise<void>;

  /**
   * 删除偏好（根据UUID）
   * @param uuid 用户偏好UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量获取偏好
   * @param accountUuids 账户UUID数组
   * @returns 用户偏好实例数组
   */
  findMany(accountUuids: string[]): Promise<UserPreferences[]>;

  /**
   * 批量保存偏好
   * @param preferencesList 用户偏好实例数组
   * @returns 保存后的用户偏好实例数组
   */
  saveMany(preferencesList: UserPreferences[]): Promise<UserPreferences[]>;

  /**
   * 检查账户是否已有偏好设置
   * @param accountUuid 账户UUID
   * @returns 是否存在
   */
  exists(accountUuid: string): Promise<boolean>;

  /**
   * 获取所有偏好（分页）
   * @param offset 偏移量
   * @param limit 限制数量
   * @returns 用户偏好实例数组
   */
  findAll(offset: number, limit: number): Promise<UserPreferences[]>;

  /**
   * 统计偏好总数
   * @returns 总数
   */
  count(): Promise<number>;
}
