import type { Database } from "better-sqlite3";

/**
 * 认证模块数据表管理
 * 负责用户认证、会话管理、令牌管理等
 */
export class AuthenticationTables {
  /**
   * 创建认证相关表
   */
  static createTables(db: Database): void {
    db.exec(`
      DROP TABLE IF EXISTS auth_sessions;
    `);
    // 认证凭证表
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_credentials (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_algorithm TEXT NOT NULL DEFAULT 'bcrypt',
        password_created_at INTEGER NOT NULL,
        password_expires_at INTEGER, -- 密码过期时间
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        locked_until INTEGER, -- 账户锁定时间
        last_auth_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
      )
    `);

    // 会话表
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        device_info TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        location_info TEXT, -- JSON 格式存储位置信息
        created_at INTEGER NOT NULL,
        last_active_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1, -- 是否为活跃会话
        terminated_at INTEGER, -- 会话终止时间
        termination_reason TEXT, -- 会话终止原因
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
      )
    `);

    // 令牌表 - 统一管理各种令牌
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        uuid TEXT PRIMARY KEY,
        token_value TEXT NOT NULL UNIQUE,
        token_type TEXT NOT NULL CHECK(token_type IN ('remember_me', 'access_token', 'refresh_token', 'email_verification', 'phone_verification', 'password_reset', 'two_factor_auth')),
        account_uuid TEXT NOT NULL,
        issued_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        used_at INTEGER, -- 使用时间
        device_info TEXT,
        ip_address TEXT,
        is_revoked BOOLEAN NOT NULL DEFAULT 0,
        revoke_reason TEXT,
        metadata TEXT, -- JSON 格式存储额外信息
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
      )
    `);

    // 多因素认证设备表
    db.exec(`
      CREATE TABLE IF NOT EXISTS mfa_devices (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        device_type TEXT NOT NULL CHECK(device_type IN ('totp', 'sms', 'email', 'hardware_key', 'backup_codes', 'biometric')),
        device_name TEXT NOT NULL,
        secret_key TEXT, -- TOTP 密钥
        phone_number TEXT, -- SMS 设备
        email_address TEXT, -- 邮箱设备
        backup_codes TEXT, -- JSON 格式存储备用码
        is_verified BOOLEAN NOT NULL DEFAULT 0,
        is_enabled BOOLEAN NOT NULL DEFAULT 0,
        is_primary BOOLEAN NOT NULL DEFAULT 0, -- 是否为主要设备
        verification_attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_used_at INTEGER,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
      )
    `);

    // 认证日志表
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_logs (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        session_uuid TEXT,
        auth_type TEXT NOT NULL CHECK(auth_type IN ('password', 'token', 'mfa', 'social', 'biometric')),
        auth_method TEXT NOT NULL, -- 具体的认证方法
        auth_result TEXT NOT NULL CHECK(auth_result IN ('success', 'failure', 'locked', 'expired')),
        failure_reason TEXT,
        device_info TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        risk_score INTEGER CHECK(risk_score BETWEEN 0 AND 100),
        created_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (session_uuid) REFERENCES auth_sessions(uuid) ON DELETE SET NULL
      )
    `);
  }

  /**
   * 创建认证相关索引
   */
  static createIndexes(db: Database): void {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_auth_credentials_account_uuid ON auth_credentials(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_auth_credentials_last_auth_at ON auth_credentials(last_auth_at);
      CREATE INDEX IF NOT EXISTS idx_auth_credentials_locked_until ON auth_credentials(locked_until);
      CREATE INDEX IF NOT EXISTS idx_auth_credentials_failed_attempts ON auth_credentials(failed_attempts);
      
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_uuid ON auth_sessions(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_is_active ON auth_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_active_at ON auth_sessions(last_active_at);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_ip_address ON auth_sessions(ip_address);
      
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_account_uuid ON auth_tokens(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_value ON auth_tokens(token_value);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_type ON auth_tokens(token_type);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_is_revoked ON auth_tokens(is_revoked);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_issued_at ON auth_tokens(issued_at);
      
      CREATE INDEX IF NOT EXISTS idx_mfa_devices_account_uuid ON mfa_devices(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_mfa_devices_type ON mfa_devices(device_type);
      CREATE INDEX IF NOT EXISTS idx_mfa_devices_is_enabled ON mfa_devices(is_enabled);
      CREATE INDEX IF NOT EXISTS idx_mfa_devices_is_primary ON mfa_devices(is_primary);
      CREATE INDEX IF NOT EXISTS idx_mfa_devices_last_used_at ON mfa_devices(last_used_at);
      
      CREATE INDEX IF NOT EXISTS idx_auth_logs_account_uuid ON auth_logs(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_session_uuid ON auth_logs(session_uuid);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_auth_type ON auth_logs(auth_type);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_auth_result ON auth_logs(auth_result);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_address ON auth_logs(ip_address);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_risk_score ON auth_logs(risk_score);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
    `);
  }
}
