import { Account } from '../aggregates/account';
import { User } from '../entities/user';
import { Role } from '../entities/role';
import { Permission } from '../entities/permission';

/**
 * 账号存储库接口
 */
export interface IAccountRepository {
  // 账号基本操作
  save(account: Account): Promise<void>;
  findById(uuid: string): Promise<Account | null>;
  findByUsername(username: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  findByPhone(phone: string): Promise<Account | null>;
  delete(uuid: string): Promise<void>;

  // 查询操作
  findAll(): Promise<Account[]>;
  findByStatus(status: string): Promise<Account[]>;
  findByAccountType(accountType: string): Promise<Account[]>;

  // 验证操作
  existsByUsername(username: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
}

/**
 * 用户存储库接口
 */
export interface IUserRepository {
  save(user: User, account_uuid: string): Promise<void>;
  findById(uuid: string): Promise<User | null>;
  findByAccountUuid(accountUuid: string): Promise<User | null>;
  delete(uuid: string): Promise<void>;
  findAll(): Promise<User[]>;
  update(user: User): Promise<void>;
}

/**
 * 角色存储库接口
 */
export interface IRoleRepository {
  save(role: Role): Promise<void>;
  findById(uuid: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  delete(uuid: string): Promise<void>;
  findAll(): Promise<Role[]>;
  findByPermission(permissionId: string): Promise<Role[]>;
}

/**
 * 权限存储库接口
 */
export interface IPermissionRepository {
  save(permission: Permission): Promise<void>;
  findById(uuid: string): Promise<Permission | null>;
  findByCode(code: string): Promise<Permission | null>;
  delete(uuid: string): Promise<void>;
  findAll(): Promise<Permission[]>;
  findByModule(module: string): Promise<Permission[]>;
}
