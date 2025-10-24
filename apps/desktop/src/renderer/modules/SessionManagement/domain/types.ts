export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export interface UserSession {
  uuid: string;
  accountUuid: string;
  username: string;
  accountType: string;
  token?: string;
  refreshToken?: string;
  rememberMe: boolean;
  autoLogin: boolean;
  status: SessionStatus;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionData {
  username: string;
  password?: string;
  token?: string;
  accountType: string;
  rememberMe: 0 | 1;
  lastLoginTime: number;
  autoLogin: 0 | 1;
  isActive: 0 | 1;
}
