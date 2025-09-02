/**
 * 领域实体类型定义
 * 这些类型定义了系统中核心实体的数据结构，用于事件传输和模块间通信
 */

import { AccountType, AccountStatus } from '../domain';

// =================== 账户相关实体 ===================

/**
 * 账户实体接口 - 用于事件传输
 * 包含账户的完整信息
 */
export interface AccountEntity {
  /** 账户UUID */
  uuid: string;
  /** 用户名 */
  username: string;
  /** 邮箱地址 */
  email?: string;
  /** 手机号码 */
  phone?: string;
  /** 账户状态 */
  status: AccountStatus;
  /** 账户类型 */
  accountType: AccountType;
  /** 邮箱是否已验证 */
  isEmailVerified: boolean;
  /** 手机号是否已验证 */
  isPhoneVerified: boolean;
  /** 角色ID列表 */
  roleIds?: string[];
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 最后登录时间 */
  lastLoginAt?: Date;
  /** 关联的用户信息 */
  user: UserEntity;
}

/**
 * 用户实体接口 - 用于事件传输
 * 包含用户的个人信息
 */
export interface UserEntity {
  /** 用户UUID */
  uuid: string;
  /** 名字 */
  firstName?: string;
  /** 姓氏 */
  lastName?: string;
  /** 性别 (0: 未设置, 1: 男, 2: 女, 3: 其他) */
  sex: number;
  /** 头像URL */
  avatar?: string;
  /** 个人简介 */
  bio?: string;
  /** 社交账号映射 */
  socialAccounts: { [platform: string]: string };
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 会话实体接口 - 用于事件传输
 */
export interface SessionEntity {
  /** 会话ID */
  sessionId: string;
  /** 账户UUID */
  accountUuid: string;
  /** 记住我令牌 */
  rememberToken?: string;
  /** 会话创建时间 */
  createdAt: Date;
  /** 会话过期时间 */
  expiresAt: Date;
  /** 最后活动时间 */
  lastActivityAt: Date;
  /** 是否活跃 */
  isActive: boolean;
}

/**
 * 认证会话信息 - 用于登录相关事件
 */
export interface AuthSession {
  sessionId: string;
  accountUuid: string;
  username: string;
  rememberToken?: string;
  loginTime: Date;
  expiresAt: Date;
}

// =================== 简化的账户信息类型 ===================

/**
 * 简化的账户信息 - 用于轻量级事件传输
 * 只包含最核心的账户信息
 */
export interface AccountBasicInfo {
  uuid: string;
  username: string;
  email?: string;
  status: AccountStatus;
  accountType: AccountType;
}

/**
 * 账户摘要信息 - 用于列表展示等场景
 */
export interface AccountSummary {
  uuid: string;
  username: string;
  email?: string;
  status: AccountStatus;
  accountType: AccountType;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  userProfile: Pick<UserEntity, 'firstName' | 'lastName' | 'avatar'>;
}

// =================== 类型守卫和工具函数 ===================

/**
 * 检查是否为完整的AccountEntity
 */
export function isFullAccountEntity(account: any): account is AccountEntity {
  return (
    account &&
    typeof account.uuid === 'string' &&
    typeof account.username === 'string' &&
    typeof account.status === 'string' &&
    typeof account.accountType === 'string' &&
    account.user &&
    typeof account.user.uuid === 'string'
  );
}

/**
 * 将AccountEntity转换为AccountBasicInfo
 */
export function toAccountBasicInfo(account: AccountEntity): AccountBasicInfo {
  return {
    uuid: account.uuid,
    username: account.username,
    email: account.email,
    status: account.status,
    accountType: account.accountType,
  };
}

/**
 * 将AccountEntity转换为AccountSummary
 */
export function toAccountSummary(account: AccountEntity): AccountSummary {
  return {
    uuid: account.uuid,
    username: account.username,
    email: account.email,
    status: account.status,
    accountType: account.accountType,
    isEmailVerified: account.isEmailVerified,
    lastLoginAt: account.lastLoginAt,
    userProfile: {
      firstName: account.user.firstName,
      lastName: account.user.lastName,
      avatar: account.user.avatar,
    },
  };
}
