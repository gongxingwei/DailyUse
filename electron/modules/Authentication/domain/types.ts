export interface AuthenticationResponsePayload {
  username?: string;
  accountUuid?: string;
  sessionUuid?: string;
  token?: string;
}

export interface AuthenticationRequest {
  clientInfo?: {
    ip: string;
    userAgent: string;
    deviceId: string;
    location: string;
    country: string;
    city: string;
  };
}

export interface PasswordAuthenticationRequest extends AuthenticationRequest {
  username: string;
  password: string;
  remember?: boolean;
}
export interface PasswordAuthenticationResponse extends AuthenticationResponsePayload{
  type?: 'passwordAuthentication'
}

export interface RememberMeTokenAuthenticationRequest extends AuthenticationRequest {
  username: string;
  accountUuid: string;
  rememberMeToken: string;
}

export interface RememberMeTokenAuthenticationResponse extends AuthenticationResponsePayload {
  type?: 'rememberMeTokenAuthentication'
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