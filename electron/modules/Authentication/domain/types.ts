export interface PasswordAuthenticationRequest {
  username: string;
  password: string;
  remember?: boolean;
  clientInfo?: {
    ip: string;
    userAgent: string;
    deviceId: string;
    location: string;
    country: string;
    city: string;
  };
}
export interface PasswordAuthenticationResponse {
  token: string | null;
  username: string;
  accountUuid: string;
  sessionUuid: string;
}

export interface AuthInfo {
  username: string;
  token: string;
  accountUuid: string;
  sessionUuid: string;
}

/**
 * 注销请求数据
 */
export interface LogoutRequest {
  username: string;
  accountUuid: string;
  token: string;
  sessionUuid: string;
  logoutType: 'manual' | 'forced' | 'expired' | 'system';
  reason?: string;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

/**
 * 注销结果
 */
export interface LogoutResult {
  success: boolean;
  sessionUuid?: string;
  accountUuid?: string;
  username?: string;
  message: string;
  terminatedSessionsCount?: number;
  errorCode?: 'SESSION_NOT_FOUND' | 'ALREADY_LOGGED_OUT' | 'INVALID_REQUEST';
}