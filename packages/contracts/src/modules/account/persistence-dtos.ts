/**
 * Account 模块持久化 DTO 定义
 */

import { AccountStatus, AccountType } from './enums';

/**
 * 账户持久化 DTO（数据库存储结构）
 */
export interface AccountPersistenceDTO {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  lastLoginAt?: number; // timestamp
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified: number; // 0 or 1
  phone?: string;
  phoneVerificationCode?: string;
  isPhoneVerified: number; // 0 or 1
  userUuid: string;
}

/**
 * 用户资料持久化 DTO
 */
export interface UserProfilePersistenceDTO {
  uuid: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  sex?: number;
  avatar?: string;
  bio?: string;
  socialAccounts?: string; // JSON string
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}
