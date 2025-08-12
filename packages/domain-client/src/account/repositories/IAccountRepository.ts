import { Account } from "../aggregates/Account";
import { User } from "../entities/User";
import { Role } from "../entities/Role";

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
  save(user: User): Promise<void>;
  delete(uuid: string): Promise<void>;
  findAll(): Promise<User[]>;
   /**
   * 根据ID获取用户
   */
  findById(uuid: string): Promise<User | null>;

  /**
   * 根据用户名获取用户
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * 根据邮箱获取用户
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 获取当前登录用户
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * 更新用户信息
   */
  update(user: User): Promise<void>;

  /**
   * 更新用户头像
   */
  updateAvatar(userId: string, avatar: string): Promise<void>;

  /**
   * 停用用户账号
   */
  deactivate(userId: string): Promise<void>;

  /**
   * 激活用户账号
   */
  activate(userId: string): Promise<void>;

  /**
   * 检查用户名是否可用
   */
  isUsernameAvailable(username: string): Promise<boolean>;

  /**
   * 检查邮箱是否已被使用
   */
  isEmailTaken(email: string): Promise<boolean>;

  /**
   * 缓存用户数据到本地存储
   */
  cacheUser(user: User): Promise<void>;

  /**
   * 从本地缓存获取用户数据
   */
  getUserFromCache(uuid: string): Promise<User | null>;

  /**
   * 清除用户缓存
   */
  clearUserCache(uuid?: string): Promise<void>;

  /**
   * 获取用户的显示信息（轻量级）
   */
  getUserDisplayInfo(uuid: string): Promise<{
    uuid: string;
    displayName: string;
    avatar?: string;
  } | null>;

  /**
   * 批量获取用户基本信息
   */
  getUsersDisplayInfo(uuids: string[]): Promise<
    Array<{
      uuid: string;
      displayName: string;
      avatar?: string;
    }>
  >;

  /**
   * 更新用户最后活动时间
   */
  updateLastActivity(uuid: string): Promise<void>;

  /**
   * 获取用户权限列表
   */
  getUserPermissions(uuid: string): Promise<string[]>;

  /**
   * 获取用户角色列表
   */
  getUserRoles(uuid: string): Promise<string[]>;
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
