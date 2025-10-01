/**
 * Authentication 模块数据传输对象 (DTO)
 *
 * 定义认证授权相关的DTO类型，用于API数据传输
 */

import { AccountType } from '../account/enums';
import { MFADeviceType } from './enums';

// =================== 认证请求类型 ===================

/**
 * 通过密码进行身份验证的表单
 */
export interface AuthByPasswordForm {
  username: string;
  password: string;
  remember: boolean;
}

/**
 * 密码认证请求DTO - 表单数据 + 设备信息
 */
export type AuthByPasswordRequestDTO = AuthByPasswordForm & {
  accountType: AccountType;
};

/**
 * 通过记住我令牌进行身份验证的表单
 */
export interface AuthByRememberMeTokenRequest {
  username: string;
  accountUuid: string;
  rememberMeToken: string;
  accountType: AccountType;
}

/**
 * 认证响应DTO - 业务数据部分
 */
export type AuthResponse = {
  accountUuid: string;
  username: string;
  sessionUuid: string;
  rememberToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
};

/**
 * 用户信息DTO - 用于前端显示
 */
export interface UserInfo {
  id: string;
  uuid: string;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  status: string;
  lastLoginAt?: string;
}

/**
 * 完整登录响应DTO - 包含用户信息的认证响应
 */
export interface LoginResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  rememberToken?: string;
  sessionUuid?: string;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    userAgent: string;
    ipAddress?: string;
  };
  mfaCode?: string;
}

/**
 * 密码更改请求
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * MFA设备注册请求
 */
export interface MFADeviceRegistrationRequest {
  type: MFADeviceType;
  name: string;
  phoneNumber?: string;
  email?: string;
  totpCode?: string; // 用于验证TOTP设备
}