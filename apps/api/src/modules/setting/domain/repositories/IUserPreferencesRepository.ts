/**
 * IUserPreferencesRepository Interface
 * 用户偏好仓储接口
 */

import type { UserPreferences } from '../aggregates/UserPreferences';

export interface IUserPreferencesRepository {
  /**
   * 根据账户UUID查找偏好
   */
  findByAccountUuid(accountUuid: string): Promise<UserPreferences | null>;

  /**
   * 保存或更新偏好
   */
  save(preferences: UserPreferences): Promise<UserPreferences>;

  /**
   * 删除偏好
   */
  delete(accountUuid: string): Promise<void>;

  /**
   * 批量获取偏好
   */
  findMany(accountUuids: string[]): Promise<UserPreferences[]>;
}
