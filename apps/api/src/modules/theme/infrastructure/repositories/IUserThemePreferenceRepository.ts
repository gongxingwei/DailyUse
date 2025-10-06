/**
 * IUserThemePreferenceRepository
 * 用户主题偏好仓储接口
 *
 * @description 定义用户主题偏好的持久化操作
 * @author DailyUse Team
 * @date 2025-10-06
 */

import type { UserThemePreference } from '@dailyuse/domain-server';

export interface IUserThemePreferenceRepository {
  /**
   * 根据账户UUID查找用户主题偏好
   */
  findByAccountUuid(accountUuid: string): Promise<UserThemePreference | null>;

  /**
   * 保存用户主题偏好
   */
  save(preference: UserThemePreference): Promise<UserThemePreference>;

  /**
   * 删除用户主题偏好
   */
  delete(uuid: string): Promise<void>;
}
