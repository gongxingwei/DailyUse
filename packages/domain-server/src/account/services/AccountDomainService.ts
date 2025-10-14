/**
 * Account 领域服务
 *
 * DDD 领域服务职责：
 * - 跨聚合根的业务逻辑
 * - 协调多个聚合根
 * - 使用仓储接口进行持久化
 */

import type { IAccountRepository } from '../repositories/IAccountRepository';
import { Account } from '../aggregates/Account';

export class AccountDomainService {
  constructor(private readonly accountRepo: IAccountRepository) {}

  /**
   * 创建新账户
   */
  public async createAccount(params: {
    username: string;
    email: string;
    displayName: string;
    timezone?: string;
    language?: string;
  }): Promise<Account> {
    // 验证用户名和邮箱唯一性
    const usernameExists = await this.accountRepo.existsByUsername(params.username);
    if (usernameExists) {
      throw new Error(`Username "${params.username}" is already taken`);
    }

    const emailExists = await this.accountRepo.existsByEmail(params.email);
    if (emailExists) {
      throw new Error(`Email "${params.email}" is already registered`);
    }

    // 创建聚合根
    const account = Account.create(params);

    // 持久化
    await this.accountRepo.save(account);

    return account;
  }

  /**
   * 获取账户
   */
  public async getAccount(uuid: string): Promise<Account> {
    const account = await this.accountRepo.findById(uuid);
    if (!account) {
      throw new Error(`Account not found: ${uuid}`);
    }
    return account;
  }

  /**
   * 通过用户名获取账户
   */
  public async getAccountByUsername(username: string): Promise<Account> {
    const account = await this.accountRepo.findByUsername(username);
    if (!account) {
      throw new Error(`Account not found with username: ${username}`);
    }
    return account;
  }

  /**
   * 通过邮箱获取账户
   */
  public async getAccountByEmail(email: string): Promise<Account> {
    const account = await this.accountRepo.findByEmail(email);
    if (!account) {
      throw new Error(`Account not found with email: ${email}`);
    }
    return account;
  }

  /**
   * 更新账户资料
   */
  public async updateAccountProfile(
    uuid: string,
    profile: Parameters<Account['updateProfile']>[0],
  ): Promise<Account> {
    const account = await this.getAccount(uuid);
    account.updateProfile(profile);
    await this.accountRepo.save(account);
    return account;
  }

  /**
   * 更新邮箱
   */
  public async updateEmail(uuid: string, newEmail: string): Promise<Account> {
    // 检查新邮箱是否已被使用
    const emailExists = await this.accountRepo.existsByEmail(newEmail);
    if (emailExists) {
      throw new Error(`Email "${newEmail}" is already registered`);
    }

    const account = await this.getAccount(uuid);
    account.updateEmail(newEmail);
    await this.accountRepo.save(account);
    return account;
  }

  /**
   * 验证邮箱
   */
  public async verifyEmail(uuid: string): Promise<Account> {
    const account = await this.getAccount(uuid);
    account.verifyEmail();
    await this.accountRepo.save(account);
    return account;
  }

  /**
   * 记录登录
   */
  public async recordLogin(uuid: string): Promise<Account> {
    const account = await this.getAccount(uuid);
    account.recordLogin();
    await this.accountRepo.save(account);
    return account;
  }

  /**
   * 停用账户
   */
  public async deactivateAccount(uuid: string): Promise<Account> {
    const account = await this.getAccount(uuid);
    account.deactivate();
    await this.accountRepo.save(account);
    return account;
  }

  /**
   * 删除账户
   */
  public async deleteAccount(uuid: string): Promise<void> {
    const account = await this.getAccount(uuid);
    account.softDelete();
    await this.accountRepo.save(account);
  }

  /**
   * 列出所有账户
   */
  public async listAccounts(options?: {
    page?: number;
    pageSize?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  }): Promise<{ accounts: Account[]; total: number }> {
    return await this.accountRepo.findAll(options);
  }
}
