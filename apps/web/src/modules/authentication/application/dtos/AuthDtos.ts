// Authentication DTOs (Data Transfer Objects)
// 认证相关的数据传输对象

import type { AccountDTO } from "@dailyuse/domain-core";

export interface LoginRequestDto {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    userAgent: string;
    ipAddress?: string;
  };
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: string; // "Bearer"
  account: AccountDTO;
}

export interface RegistrationRequestDto {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  acceptTerms: boolean;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    userAgent: string;
    ipAddress?: string;
  };
}

export interface RegistrationResponseDto {
  success: boolean;
  message: string;
  userId?: string;
  requiresVerification: boolean;
  verificationMethod?: 'email' | 'sms' | 'both';
  verificationCodeExpiry?: Date;
}

export interface TokenRefreshRequestDto {
  refreshToken: string;
  deviceId: string;
}

export interface TokenRefreshResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface PasswordResetRequestDto {
  email: string;
  resetMethod: 'email' | 'sms';
  deviceInfo?: {
    deviceId: string;
    userAgent: string;
    ipAddress?: string;
  };
}

export interface PasswordResetResponseDto {
  success: boolean;
  message: string;
  resetToken?: string; // Only for testing, usually sent via email/SMS
  expiresIn: number; // seconds
}

export interface PasswordResetConfirmDto {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerificationCodeRequestDto {
  type: 'email' | 'sms' | 'registration' | 'password_reset' | 'login_2fa';
  identifier: string; // email or phone
  purpose?: string;
}

export interface VerificationCodeResponseDto {
  success: boolean;
  message: string;
  codeLength: number;
  expiresIn: number; // seconds
  attemptsRemaining: number;
}

export interface VerificationCodeConfirmDto {
  code: string;
  identifier: string;
  type: 'email' | 'sms' | 'registration' | 'password_reset' | 'login_2fa';
}

export interface LogoutRequestDto {
  allDevices?: boolean; // logout from all devices
  deviceId?: string; // specific device to logout
}

export interface SessionDto {
  sessionId: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  loginTime: Date;
  lastActivity: Date;
  isActive: boolean;
  securityLevel: number;
  location?: {
    country: string;
    city: string;
    region: string;
  };
}

export interface SessionListDto {
  currentSession: SessionDto;
  otherSessions: SessionDto[];
  totalActiveSessions: number;
}

export interface PasswordChangeRequestDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SecurityCheckDto {
  action: string;
  riskLevel: number; // 1-5 scale
  factors: {
    ipAddressRisk: number;
    deviceRisk: number;
    behaviorRisk: number;
    locationRisk: number;
  };
  requiresVerification: boolean;
  verificationMethods: string[];
  message: string;
}

export interface AuthOperationResultDto {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
  requiresAction?: {
    type: 'verification' | 'password_change' | 'terms_acceptance';
    redirectUrl?: string;
    data?: any;
  };
}

// Authentication State DTOs
export interface AuthStateDto {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatar?: string;
    roles: string[];
  };
  session?: {
    sessionId: string;
    deviceId: string;
    loginTime: Date;
    expiresAt: Date;
    securityLevel: number;
  };
  permissions: string[];
  lastActivity: Date;
}

// Login Attempt Tracking DTOs
export interface LoginAttemptDto {
  attemptId: string;
  username: string;
  ipAddress: string;
  deviceInfo: string;
  attemptTime: Date;
  success: boolean;
  failureReason?: string;
  securityFlags: string[];
}

export interface LoginAttemptSummaryDto {
  recentAttempts: LoginAttemptDto[];
  failedAttemptsCount: number;
  successfulAttemptsCount: number;
  suspiciousPatterns: string[];
  nextAllowedAttempt?: Date;
  accountLockExpiry?: Date;
}
