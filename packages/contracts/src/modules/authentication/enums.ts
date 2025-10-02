// ========== 枚举类型 ==========

/**
 * 登录结果枚举
 */
export enum LoginResult {
  /** 登录成功 */
  SUCCESS = 'success',
  /** 用户名或密码错误 */
  INVALID_CREDENTIALS = 'invalid_credentials',
  /** 账户被锁定 */
  ACCOUNT_LOCKED = 'account_locked',
  /** 账户未激活 */
  ACCOUNT_INACTIVE = 'account_inactive',
  /** 需要双因素认证 */
  MFA_REQUIRED = 'mfa_required',
  /** 双因素认证失败 */
  MFA_FAILED = 'mfa_failed',
  /** 密码已过期 */
  PASSWORD_EXPIRED = 'password_expired',
  /** 系统错误 */
  SYSTEM_ERROR = 'system_error',
}

/**
 * 登出类型枚举
 */
export enum LogoutType {
  /** 主动登出 */
  MANUAL = 'manual',
  /** 会话超时 */
  TIMEOUT = 'timeout',
  /** 强制登出 */
  FORCED = 'forced',
  /** 安全原因 */
  SECURITY = 'security',
}

/**
 * 会话终止类型枚举
 */
export enum SessionTerminationType {
  /** 正常过期 */
  EXPIRED = 'expired',
  /** 手动撤销 */
  REVOKED = 'revoked',
  /** 用户登出 */
  LOGOUT = 'logout',
  /** 安全策略 */
  SECURITY = 'security',
}

/**
 * 所有会话终止类型枚举
 */
export enum AllSessionsTerminationType {
  /** 安全原因 */
  SECURITY = 'security',
  /** 密码更改 */
  PASSWORD_CHANGE = 'password_change',
  /** 手动操作 */
  MANUAL = 'manual',
}


/**
 * 认证方法枚举
 */
export enum AuthMethod {
  /** 密码认证 */
  PASSWORD = 'password',
  /** Token认证 */
  TOKEN = 'token',
  /** 双因素认证 */
  MFA = 'mfa',
}

/**
 * MFA设备类型枚举
 */
export enum MFADeviceType {
    /** 手机短信 */
    SMS = "sms",
    /** 邮箱验证 */
    EMAIL = "email",
    /** 身份验证应用 */
    AUTHENTICATOR = "authenticator",
    /** 硬件令牌 */
    HARDWARE_TOKEN = "hardware_token",
    /** 生物识别 */
    BIOMETRIC = "biometric",
    /** TOTP */
    TOTP = "totp",
    /** 备用码 */
    BACKUP_CODES = "backup_codes"
}

/**
 * Token类型枚举
 */
export enum TokenType {
  /** 访问令牌 */
  ACCESS = 'access',
  /** 刷新令牌 */
  REFRESH = 'refresh',
  /** 记住我令牌 */
  REMEMBER_ME = 'remember_me',
  /** 验证令牌 */
  VERIFICATION = 'verification',
  /** 重置密码令牌 */
  PASSWORD_RESET = 'password_reset',
}
