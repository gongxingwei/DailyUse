import { AccountType, type AccountDTO } from '@dailyuse/domain-client';

export enum AuthMethod {
  PASSWORD = 'password',
  OTP = 'otp',
  BIOMETRIC = 'biometric',
}

/**
 * 设备信息类型
 */
export type ClientInfo = {
  deviceId: string;
  deviceName: string;
  userAgent: string;
  ipAddress?: string;
};

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

export type AuthResponseDTO = {
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
 * 用户协议同意信息
 */
export type UserAgreement = {
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  termsVersion: string; // 协议版本号，如 "1.0.0"
  privacyVersion: string; // 隐私政策版本号
  agreedAt: number; // 数字格式
  ipAddress?: string; // 同意时的IP地址
};

/**
 * 注册表单 - 用户名和密码
 */
export interface RegistrationByUsernameAndPasswordForm {
  username: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

export interface RegistrationByUsernameAndPasswordRequestDTO {
  username: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  agreement: UserAgreement; // 详细的同意信息
  clientInfo?: ClientInfo;
}

/**
 * 注册响应DTO
 */
export type RegistrationResponseDTO = {
  account: AccountDTO;
  requiresVerification?: boolean;
};

export type TResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};