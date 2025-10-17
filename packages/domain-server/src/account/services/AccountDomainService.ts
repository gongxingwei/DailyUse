/**
 * Account 领域服务
 *
 * DDD 领域服务职责（最佳实践）：
 * - 创建聚合根（调用 Account.create()）
 * - 复杂的业务规则验证
 * - 跨聚合根的业务协调（但不持久化）
 * - 只返回聚合根对象，不调用 Repository
 *
 * ⚠️ 重要变更：
 * - 不再注入 Repository
 * - 不再调用 repository.save() 或 repository.find()
 * - 持久化和查询由 ApplicationService 负责
 */

import { Account } from '../aggregates/Account';

export class AccountDomainService {
  // ✅ 不再注入 Repository

  /**
   * 创建新账户（不持久化）
   *
   * @returns 返回 Account 聚合根对象
   */
  public createAccount(params: {
    username: string;
    email: string;
    displayName: string;
    timezone?: string;
    language?: string;
  }): Account {
    // 1. 业务规则验证
    this.validateAccountCreation(params);

    // 2. 创建聚合根
    const account = Account.create({
      username: params.username,
      email: params.email,
      displayName: params.displayName,
      timezone: params.timezone,
      language: params.language,
    });

    // 3. 只返回聚合根，不持久化
    return account;
  }

  /**
   * 业务规则验证：账户创建
   */
  private validateAccountCreation(params: {
    username: string;
    email: string;
    displayName: string;
  }): void {
    // 用户名验证
    if (params.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    if (params.username.length > 20) {
      throw new Error('Username must not exceed 20 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(params.username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    // 邮箱验证
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
      throw new Error('Invalid email format');
    }

    // 显示名称验证
    if (params.displayName.length < 1) {
      throw new Error('Display name cannot be empty');
    }
    if (params.displayName.length > 50) {
      throw new Error('Display name must not exceed 50 characters');
    }
  }

  /**
   * 业务规则验证：邮箱更新
   */
  public validateEmailUpdate(account: Account, newEmail: string): void {
    // 邮箱格式验证
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      throw new Error('Invalid email format');
    }

    // 检查是否与当前邮箱相同
    if (account.email === newEmail) {
      throw new Error('New email is the same as the current email');
    }

    // 检查账户状态
    if (account.status === 'DELETED') {
      throw new Error('Cannot update email for deleted account');
    }
  }

  /**
   * 业务规则验证：资料更新
   */
  public validateProfileUpdate(
    account: Account,
    profile: {
      displayName?: string;
      avatarUrl?: string;
      bio?: string;
      timezone?: string;
      language?: string;
    },
  ): void {
    // 显示名称验证
    if (profile.displayName !== undefined) {
      if (profile.displayName.length < 1) {
        throw new Error('Display name cannot be empty');
      }
      if (profile.displayName.length > 50) {
        throw new Error('Display name must not exceed 50 characters');
      }
    }

    // Bio 验证
    if (profile.bio !== undefined && profile.bio.length > 500) {
      throw new Error('Bio must not exceed 500 characters');
    }

    // 检查账户状态
    if (account.status === 'DELETED') {
      throw new Error('Cannot update profile for deleted account');
    }
  }

  /**
   * 复杂业务规则：检查账户是否可以执行敏感操作
   */
  public canPerformSensitiveOperation(account: Account): boolean {
    // 账户必须是激活状态
    if (account.status !== 'ACTIVE') {
      return false;
    }

    // 邮箱必须已验证
    if (!account.emailVerified) {
      return false;
    }

    return true;
  }

  /**
   * 复杂业务规则：检查账户是否可以被删除
   */
  public canDeleteAccount(account: Account): boolean {
    // 已删除的账户不能再次删除
    if (account.status === 'DELETED') {
      return false;
    }

    return true;
  }
}
