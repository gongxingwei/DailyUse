import { DateTime } from "@/shared/types/myDateTime";

// 账号状态枚举
export enum AccountStatus {
  ACTIVE = "active",
  DISABLED = "disabled",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification"
}

// 账号类型枚举
export enum AccountType {
  LOCAL = "local",
  ONLINE = "online",
  GUEST = "guest"
}

// 账号接口
export interface IAccount {
  id: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: DateTime;
  updatedAt: DateTime;
  lastLoginAt?: DateTime;
  
  // 聚合根方法 - 仅包含账号身份信息管理，不包含密码认证
  updateEmail(email: string): void;
  updatePhone(phone: string): void;
  disable(): void;
  enable(): void;
  suspend(): void;
  verifyEmail(): void;
  addRole(roleId: string): void;
  removeRole(roleId: string): void;
}

// 注册数据类型
export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
}

// 账号更新数据类型
export interface AccountUpdateData {
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}
