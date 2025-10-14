/**
 * IAuthCredentialRepository 接口
 * 认证凭证仓储接口
 */

import { AuthCredential } from '../aggregates/AuthCredential';

export interface IAuthCredentialRepository {
  /**
   * 保存凭证
   */
  save(credential: AuthCredential): Promise<void>;

  /**
   * 根据 UUID 查找凭证
   */
  findByUuid(uuid: string): Promise<AuthCredential | null>;

  /**
   * 根据账户 UUID 查找凭证
   */
  findByAccountUuid(accountUuid: string): Promise<AuthCredential | null>;

  /**
   * 查找所有凭证（支持分页）
   */
  findAll(params?: { skip?: number; take?: number }): Promise<AuthCredential[]>;

  /**
   * 根据状态查找凭证
   */
  findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number },
  ): Promise<AuthCredential[]>;

  /**
   * 根据类型查找凭证
   */
  findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number },
  ): Promise<AuthCredential[]>;

  /**
   * 检查账户是否存在凭证
   */
  existsByAccountUuid(accountUuid: string): Promise<boolean>;

  /**
   * 删除凭证
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量删除过期凭证
   */
  deleteExpired(): Promise<number>;
}
