import type { Account } from '../aggregates/Account';
import type { User } from '../entities/User';

/**
 * 账户存储库接口
 */
export interface IAccountRepository {
  // 账户基本操作
  save(account: Account): Promise<Account>;
  findById(uuid: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  findByUsername(username: string): Promise<Account | null>;

  // 查询操作
  findAll(page?: number, limit?: number): Promise<{ accounts: Account[]; total: number }>;
}

/**
 * 用户存储库接口
 */
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(uuid: string): Promise<User | null>;
  findByAccountUuid(accountUuid: string): Promise<User | null>;

  // 查询操作
  findAll(): Promise<User[]>;
}
