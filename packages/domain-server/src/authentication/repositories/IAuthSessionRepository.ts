/**
 * IAuthSessionRepository 接口
 * 会话仓储接口
 */

import { AuthSession } from '../aggregates/AuthSession';

export interface IAuthSessionRepository {
  /**
   * 保存会话
   */
  save(session: AuthSession): Promise<void>;

  /**
   * 根据 UUID 查找会话
   */
  findByUuid(uuid: string): Promise<AuthSession | null>;

  /**
   * 根据账户 UUID 查找所有会话
   */
  findByAccountUuid(accountUuid: string): Promise<AuthSession[]>;

  /**
   * 根据访问令牌查找会话
   */
  findByAccessToken(accessToken: string): Promise<AuthSession | null>;

  /**
   * 根据刷新令牌查找会话
   */
  findByRefreshToken(refreshToken: string): Promise<AuthSession | null>;

  /**
   * 根据设备 ID 查找会话
   */
  findByDeviceId(deviceId: string): Promise<AuthSession[]>;

  /**
   * 查找活跃会话
   */
  findActiveSessions(accountUuid: string): Promise<AuthSession[]>;

  /**
   * 查找所有会话（支持分页）
   */
  findAll(params?: { skip?: number; take?: number }): Promise<AuthSession[]>;

  /**
   * 根据状态查找会话
   */
  findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number },
  ): Promise<AuthSession[]>;

  /**
   * 删除会话
   */
  delete(uuid: string): Promise<void>;

  /**
   * 删除账户的所有会话
   */
  deleteByAccountUuid(accountUuid: string): Promise<number>;

  /**
   * 批量删除过期会话
   */
  deleteExpired(): Promise<number>;
}
