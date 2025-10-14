/**
 * Account 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { Account } from '../aggregates/Account';

export interface IAccountRepository {
  /**
   * 保存聚合根（创建或更新）
   */
  save(account: Account): Promise<void>;

  /**
   * 通过 UUID 查找账户
   */
  findById(uuid: string): Promise<Account | null>;

  /**
   * 通过用户名查找账户
   */
  findByUsername(username: string): Promise<Account | null>;

  /**
   * 通过邮箱查找账户
   */
  findByEmail(email: string): Promise<Account | null>;

  /**
   * 通过手机号查找账户
   */
  findByPhone(phoneNumber: string): Promise<Account | null>;

  /**
   * 检查用户名是否已存在
   */
  existsByUsername(username: string): Promise<boolean>;

  /**
   * 检查邮箱是否已存在
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * 删除账户
   */
  delete(uuid: string): Promise<void>;

  /**
   * 查找所有账户（分页）
   */
  findAll(options?: {
    page?: number;
    pageSize?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  }): Promise<{ accounts: Account[]; total: number }>;
}
