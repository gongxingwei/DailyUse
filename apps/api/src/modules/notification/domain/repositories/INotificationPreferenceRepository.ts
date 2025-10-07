import { NotificationPreference } from '../aggregates/NotificationPreference';

/**
 * NotificationPreference 仓储接口
 *
 * 职责：
 * - 持久化 NotificationPreference 聚合根
 * - 查询用户偏好
 * - 确保每个用户只有一个偏好设置
 */
export interface INotificationPreferenceRepository {
  /**
   * 保存偏好设置（创建或更新）
   */
  save(preference: NotificationPreference): Promise<NotificationPreference>;

  /**
   * 根据 UUID 查找偏好设置
   */
  findByUuid(uuid: string): Promise<NotificationPreference | null>;

  /**
   * 根据账户 UUID 查找偏好设置
   */
  findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null>;

  /**
   * 获取或创建默认偏好设置
   */
  getOrCreateDefault(accountUuid: string): Promise<NotificationPreference>;

  /**
   * 检查账户是否已有偏好设置
   */
  existsByAccountUuid(accountUuid: string): Promise<boolean>;

  /**
   * 删除偏好设置
   */
  delete(uuid: string): Promise<void>;
}
