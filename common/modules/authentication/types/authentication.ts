
export interface ISession {
    uuid: string;
    accountUuid: string;
    token: string;
    deviceInfo: string;
    ipAddress: string;
    userAgent?: string;
    createdAt: Date;
    lastActiveAt: Date;
    expiresAt: Date;
    isActive: boolean;
    terminatedAt?: Date;
    terminationReason?: string;
    
    isExpired(): boolean;
    refresh(extendMinutes?: number): void;
    terminate(reason?: string): void;
    isNearExpiry(thresholdMinutes?: number): boolean;
    getRemainingMinutes(): number;
    getDurationMinutes(): number;
    updateIPAddress(newIP: string, reason?: string): void;
}

export interface ISessionDTO {
    uuid: string;
    accountUuid: string;
    token: string;
    deviceInfo: string;
    ipAddress: string;
    userAgent?: string;
    createdAt: number;
    lastActiveAt: number;
    expiresAt: number;
    isActive: boolean;
    terminatedAt?: number;
    terminationReason?: string;
}

// ======== Token Interface ========
/**
 * 令牌类型枚举
 */
export enum TokenType {
  REMEMBER_ME = 'remember_me',
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset'
}


export interface IToken {
    value: string;
    type: TokenType;
    accountUuid: string;
    issuedAt: Date;
    expiresAt: Date;
    deviceInfo?: string;
    
    isValid(): boolean;
    isExpired(): boolean;
    revoke(): void;
    isNearExpiry(): boolean;
    getRemainingTime(): number;
}

export interface ITokenDTO {
    value: string;
    type: TokenType;
    accountUuid: string;
    issuedAt: string;
    expiresAt: string;
    deviceInfo?: string;
    isRevoked: boolean;
}

// ======== Password interface ========
export interface IPassword {
    hashedValue: string;
    salt: string;
    algorithm: string;
    createdAt: Date;
    expiresAt?: Date;
    
    verify(password: string): boolean;
}

export interface IPasswordDTO {
    hash: string;
    salt: string;
    algorithm: string;
    createdAt: string;
    expiresAt?: string;
}