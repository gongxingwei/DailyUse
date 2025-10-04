/**
 * IUserThemePreferenceRepository Interface
 * 用户主题偏好仓储接口
 */

import type { UserThemePreference } from '../entities/UserThemePreference';

export interface IUserThemePreferenceRepository {
  /**
   * 根据用户UUID查找主题偏好
   */
  findByAccountUuid(accountUuid: string): Promise<UserThemePreference | null>;

  /**
   * 创建或更新主题偏好
   */
  save(preference: UserThemePreference): Promise<UserThemePreference>;

  /**
   * 删除主题偏好
   */
  delete(accountUuid: string): Promise<void>;
}
