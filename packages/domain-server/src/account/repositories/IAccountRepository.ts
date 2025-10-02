import type { Account } from '../aggregates/Account';
import type { User } from '../entities/User';
import { AccountContracts } from '@dailyuse/contracts';

type AccountPersistenceDTO = AccountContracts.AccountPersistenceDTO;
type UserProfilePersistenceDTO = AccountContracts.UserProfilePersistenceDTO;

/**
 * 账户存储库接口
 * 仓储层返回数据库 DTO，由应用层负责转换为领域对象
 */
export interface IAccountRepository {
  // 账户基本操作 - 保存时接受领域对象，返回时提供 DTO
  save(account: Account): Promise<void>;
  findById(uuid: string): Promise<AccountPersistenceDTO | null>;
  findByEmail(email: string): Promise<AccountPersistenceDTO | null>;
  findByUsername(username: string): Promise<AccountPersistenceDTO | null>;

  // 查询操作 - 返回 DTO
  findAll(
    page?: number,
    limit?: number,
  ): Promise<{
    accounts: AccountPersistenceDTO[];
    total: number;
  }>;
  findByStatus(status: string): Promise<AccountPersistenceDTO[]>;
  search(query: string): Promise<AccountPersistenceDTO[]>;
}

/**
 * 用户存储库接口
 * 仓储层返回数据库 DTO，由应用层负责转换为领域对象
 */
export interface IUserRepository {
  save(user: User, accountUuid: string): Promise<void>;
  findById(uuid: string): Promise<UserProfilePersistenceDTO | null>;
  findByAccountUuid(accountUuid: string): Promise<UserProfilePersistenceDTO | null>;

  // 查询操作 - 返回 DTO
  findAll(): Promise<UserProfilePersistenceDTO[]>;
}
