import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import { app } from "electron";
import { fileURLToPath } from "node:url";
// 为 better-sqlite3 提供 __filename 和 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 将这些添加到全局，以防 better-sqlite3 需要
globalThis.__filename = __filename;
globalThis.__dirname = __dirname;
import BetterSqlite3 from "better-sqlite3";
import type { Database } from "better-sqlite3";
import { RepositoryFactory } from "../shared/services/repositoryFactory";

// 数据库单例
let db: Database | null = null;
let isInitializing = false;

// 异步初始化数据库
export async function initializeDatabase(): Promise<Database> {
  if (db !== null) return db;

  // 防止重复初始化
  if (isInitializing) {
    // 等待初始化完成
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (db !== null) return db;
  }

  isInitializing = true;

  try {
    // 确保数据目录存在
    const dbDir = path.join(app.getPath("userData"), "database");

    try {
      await fs.access(dbDir);
    } catch {
      await fs.mkdir(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, "dailyuse.db");

    // 创建/打开数据库连接
    db = new BetterSqlite3(dbPath, {
      verbose: process.env.NODE_ENV !== "production" ? console.log : undefined,
    });

    // 启用 WAL 模式提高性能
    db.pragma("journal_mode = WAL");

    // 数据库版本管理
    await migrateDatabase(db);

    // 创建表结构 - Account 模块：用户身份信息表（不包含密码）
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT NOT NULL,
        username TEXT PRIMARY KEY,
        avatar TEXT,
        email TEXT,
        phone TEXT,
        accountType TEXT DEFAULT 'local',
        onlineId TEXT,
        createdAt INTEGER NOT NULL
      )
    `);

    // 注意：登录会话相关功能已迁移到 Authentication 模块的 auth_sessions 表
    // 此表保留用于向后兼容，但不再包含密码字段
    db.exec(`
      CREATE TABLE IF NOT EXISTS login_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        token TEXT, -- 存储会话令牌
        accountType TEXT NOT NULL CHECK(accountType IN ('local', 'online')) DEFAULT 'local',
        rememberMe BOOLEAN NOT NULL DEFAULT 0,
        lastLoginTime INTEGER NOT NULL,
        autoLogin BOOLEAN NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        UNIQUE(username, accountType) -- 同一用户名和账户类型组合唯一
      )
    `);

    // 创建用户数据存储表
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_store_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        store_name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(username, store_name),
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      )
    `);

    // 创建 Task 相关表
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        time_config TEXT NOT NULL,
        reminder_config TEXT NOT NULL,
        scheduling_policy TEXT NOT NULL,
        metadata TEXT NOT NULL,
        lifecycle TEXT NOT NULL,
        analytics TEXT NOT NULL,
        key_result_links TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS task_instances (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        template_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        time_config TEXT NOT NULL,
        actual_start_time INTEGER,
        actual_end_time INTEGER,
        key_result_links TEXT,
        priority INTEGER CHECK(priority BETWEEN 1 AND 5),
        status TEXT CHECK(status IN ('pending', 'inProgress', 'completed', 'cancelled', 'overdue')) NOT NULL,
        completed_at INTEGER,
        reminder_status TEXT NOT NULL,
        lifecycle TEXT NOT NULL,
        metadata TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (template_id) REFERENCES task_templates(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS task_meta_templates (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        default_time_config TEXT NOT NULL,
        default_reminder_config TEXT NOT NULL,
        default_metadata TEXT NOT NULL,
        lifecycle TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      )
    `);

    // 创建 Goal 相关表
    db.exec(`
      CREATE TABLE IF NOT EXISTS goal_directories (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        parent_id TEXT,
        lifecycle TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES goal_directories(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        dir_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        note TEXT,
        analysis TEXT NOT NULL,
        lifecycle TEXT NOT NULL,
        analytics TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (dir_id) REFERENCES goal_directories(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS key_results (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        goal_id TEXT NOT NULL,
        name TEXT NOT NULL,
        start_value REAL NOT NULL,
        target_value REAL NOT NULL,
        current_value REAL NOT NULL DEFAULT 0,
        calculation_method TEXT CHECK(calculation_method IN ('sum', 'average', 'max', 'min', 'custom')) NOT NULL,
        weight INTEGER CHECK(weight BETWEEN 0 AND 10) NOT NULL,
        lifecycle TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS goal_records (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        goal_id TEXT NOT NULL,
        key_result_id TEXT NOT NULL,
        value REAL NOT NULL,
        date INTEGER NOT NULL,
        note TEXT,
        lifecycle TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
        FOREIGN KEY (key_result_id) REFERENCES key_results(id) ON DELETE CASCADE
      )
    `);

    // 添加新字段（如果不存在）
    try {
      db.exec(`ALTER TABLE login_sessions ADD COLUMN token TEXT`);
    } catch (error) {
      // 如果字段已存在，会抛出错误，这是正常的
      if (
        error instanceof Error &&
        error.message.includes("duplicate column name")
      ) {
      } else {
        console.error("添加 token 字段失败:", error);
      }
    }

    // 为 users 表添加 uid 字段（如果不存在）
    try {
      db.exec(`ALTER TABLE users ADD COLUMN uid TEXT`);
    } catch (error) {
      // 如果字段已存在，会抛出错误，这是正常的
      if (
        error instanceof Error &&
        error.message.includes("duplicate column name")
      ) {
      } else {
        console.error("添加 uid 字段失败:", error);
      }
    }
    // 创建索引提高查询性能
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_username ON login_sessions(username);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(isActive);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_auto_login ON login_sessions(autoLogin);
      CREATE INDEX IF NOT EXISTS idx_user_store_username ON user_store_data(username);
      CREATE INDEX IF NOT EXISTS idx_user_store_name ON user_store_data(store_name);
      CREATE INDEX IF NOT EXISTS idx_task_templates_username ON task_templates(username);
      CREATE INDEX IF NOT EXISTS idx_task_templates_created_at ON task_templates(created_at);
      CREATE INDEX IF NOT EXISTS idx_task_instances_username ON task_instances(username);
      CREATE INDEX IF NOT EXISTS idx_task_instances_template_id ON task_instances(template_id);
      CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
      CREATE INDEX IF NOT EXISTS idx_task_instances_created_at ON task_instances(created_at);
      CREATE INDEX IF NOT EXISTS idx_task_meta_templates_username ON task_meta_templates(username);
      CREATE INDEX IF NOT EXISTS idx_task_meta_templates_category ON task_meta_templates(category);
      CREATE INDEX IF NOT EXISTS idx_goal_directories_username ON goal_directories(username);
      CREATE INDEX IF NOT EXISTS idx_goal_directories_parent_id ON goal_directories(parent_id);
      CREATE INDEX IF NOT EXISTS idx_goals_username ON goals(username);
      CREATE INDEX IF NOT EXISTS idx_goals_dir_id ON goals(dir_id);
      CREATE INDEX IF NOT EXISTS idx_goals_start_time ON goals(start_time);
      CREATE INDEX IF NOT EXISTS idx_goals_end_time ON goals(end_time);
      CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at);
      CREATE INDEX IF NOT EXISTS idx_key_results_username ON key_results(username);
      CREATE INDEX IF NOT EXISTS idx_key_results_goal_id ON key_results(goal_id);
      CREATE INDEX IF NOT EXISTS idx_key_results_created_at ON key_results(created_at);
      CREATE INDEX IF NOT EXISTS idx_goal_records_username ON goal_records(username);
      CREATE INDEX IF NOT EXISTS idx_goal_records_goal_id ON goal_records(goal_id);
      CREATE INDEX IF NOT EXISTS idx_goal_records_key_result_id ON goal_records(key_result_id);
      CREATE INDEX IF NOT EXISTS idx_goal_records_date ON goal_records(date);
      CREATE INDEX IF NOT EXISTS idx_goal_records_created_at ON goal_records(created_at);
      
      -- === 认证模块索引 ===
      CREATE INDEX IF NOT EXISTS idx_auth_credentials_account_id ON auth_credentials(account_id);
      CREATE INDEX IF NOT EXISTS idx_auth_credentials_last_auth_at ON auth_credentials(last_auth_at);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_id ON auth_sessions(account_id);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_is_active ON auth_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_active_at ON auth_sessions(last_active_at);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_account_id ON auth_tokens(account_id);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_type ON auth_tokens(type);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_is_revoked ON auth_tokens(is_revoked);
      CREATE INDEX IF NOT EXISTS idx_mfa_devices_account_id ON mfa_devices(account_id);
      CREATE INDEX IF NOT EXISTS idx_mfa_devices_type ON mfa_devices(type);
      CREATE INDEX IF NOT EXISTS idx_mfa_devices_is_enabled ON mfa_devices(is_enabled);
      
      -- === 会话记录模块索引 ===
      CREATE INDEX IF NOT EXISTS idx_session_logs_account_id ON session_logs(account_id);
      CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_session_logs_operation_type ON session_logs(operation_type);
      CREATE INDEX IF NOT EXISTS idx_session_logs_risk_level ON session_logs(risk_level);
      CREATE INDEX IF NOT EXISTS idx_session_logs_is_anomalous ON session_logs(is_anomalous);
      CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_session_logs_login_time ON session_logs(login_time);
      CREATE INDEX IF NOT EXISTS idx_session_logs_ip_address ON session_logs(ip_address);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_account_id ON audit_trails(account_id);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_session_log_id ON audit_trails(session_log_id);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_operation_type ON audit_trails(operation_type);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_risk_level ON audit_trails(risk_level);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_is_alert_triggered ON audit_trails(is_alert_triggered);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_timestamp ON audit_trails(timestamp);
    `);

    // === 认证模块相关表 (Authentication Context) ===

    // 认证凭证表
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_credentials (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_algorithm TEXT NOT NULL DEFAULT 'bcrypt',
        password_created_at INTEGER NOT NULL,
        last_auth_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
      )
    `);

    // 会话表
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        device_info TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        created_at INTEGER NOT NULL,
        last_active_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
      )
    `);

    // 令牌表
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        value TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('remember_me', 'access_token', 'refresh_token', 'email_verification', 'password_reset')),
        account_id TEXT NOT NULL,
        issued_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        device_info TEXT,
        is_revoked BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
      )
    `);

    // MFA设备表
    db.exec(`
      CREATE TABLE IF NOT EXISTS mfa_devices (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('totp', 'sms', 'email', 'hardware_key', 'backup_codes')),
        name TEXT NOT NULL,
        secret_key TEXT,
        phone_number TEXT,
        email_address TEXT,
        backup_codes TEXT, -- JSON格式存储备用码
        is_verified BOOLEAN NOT NULL DEFAULT 0,
        is_enabled BOOLEAN NOT NULL DEFAULT 0,
        verification_attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        created_at INTEGER NOT NULL,
        last_used_at INTEGER,
        FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
      )
    `);

    // === 会话记录模块相关表 (Session Logging Context) ===

    // 会话日志表
    db.exec(`
      CREATE TABLE IF NOT EXISTS session_logs (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        session_id TEXT,
        operation_type TEXT NOT NULL CHECK(operation_type IN ('login', 'logout', 'expired', 'forced_logout', 'session_refresh', 'mfa_verification', 'password_change', 'suspicious_activity')),
        device_info TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        ip_country TEXT,
        ip_region TEXT,
        ip_city TEXT,
        ip_latitude REAL,
        ip_longitude REAL,
        ip_timezone TEXT,
        ip_isp TEXT,
        user_agent TEXT,
        login_time INTEGER,
        logout_time INTEGER,
        duration INTEGER, -- 会话持续时间（分钟）
        risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
        risk_factors TEXT, -- JSON格式存储风险因素数组
        is_anomalous BOOLEAN NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
      )
    `);

    // 审计轨迹表
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_trails (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        session_log_id TEXT,
        operation_type TEXT NOT NULL,
        description TEXT NOT NULL,
        risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
        ip_address TEXT NOT NULL,
        ip_country TEXT,
        ip_region TEXT,
        ip_city TEXT,
        ip_latitude REAL,
        ip_longitude REAL,
        ip_timezone TEXT,
        ip_isp TEXT,
        user_agent TEXT,
        metadata TEXT, -- JSON格式存储元数据
        is_alert_triggered BOOLEAN NOT NULL DEFAULT 0,
        alert_level TEXT CHECK(alert_level IN ('info', 'warning', 'error', 'critical')),
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE,
        FOREIGN KEY (session_log_id) REFERENCES session_logs(id) ON DELETE CASCADE
      )
    `);

    // 创建默认用户（如果不存在）
    await ensureDefaultUser(db);

    // 初始化仓库工厂
    RepositoryFactory.initialize(db);

    return db;
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * 确保默认用户存在
 */
async function ensureDefaultUser(database: Database): Promise<void> {
  try {
    // 检查是否已存在默认用户
    const existingUser = database.prepare("SELECT username FROM users WHERE username = ?").get('default');
    
    if (!existingUser) {
      console.log('🔄 [数据库] 创建默认用户...');
      
      // 创建默认用户（仅包含身份信息）
      const insertUserStmt = database.prepare(`
        INSERT INTO users (uid, username, accountType, createdAt)
        VALUES (?, ?, ?, ?)
      `);
      
      const now = Date.now();
      const defaultUserId = 'default_uid_' + now;
      insertUserStmt.run(
        defaultUserId,
        'default',
        'local',
        now
      );

      // 为默认用户创建认证凭证（在 Authentication 模块中）
      const credentialId = `cred_${defaultUserId}`;
      const defaultPasswordHash = 'default_hash'; // 实际应用中应该使用加密密码
      
      database.prepare(`
        INSERT INTO auth_credentials (
          id, account_id, password_hash, password_salt, password_algorithm,
          password_created_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        credentialId,
        defaultUserId,
        defaultPasswordHash,
        'default_salt',
        'bcrypt',
        now,
        now,
        now
      );

      console.log('✅ [数据库] 默认用户和认证凭证创建成功');
    }
  } catch (error) {
    console.error('❌ [数据库] 创建默认用户失败:', error);
  }
}

// 同步版本的初始化（用于必须同步的场景）
export function initializeDatabaseSync(): Database {
  if (db !== null) return db;

  try {
    // 确保数据目录存在
    const dbDir = path.join(app.getPath("userData"), "database");
    if (!fsSync.existsSync(dbDir)) {
      fsSync.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, "dailyuse.db");

    // 创建/打开数据库连接
    db = new BetterSqlite3(dbPath, {
      verbose: process.env.NODE_ENV !== "production" ? console.log : undefined,
    });

    // 启用 WAL 模式提高性能
    db.pragma("journal_mode = WAL");

    // 创建表结构
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT NOT NULL,
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        avatar TEXT,
        email TEXT,
        phone TEXT,
        accountType TEXT DEFAULT 'local',
        onlineId TEXT,
        createdAt INTEGER NOT NULL
      )
    `);

    return db;
  } catch (error) {
    console.error("数据库同步初始化失败:", error);
    throw error;
  }
}

// 获取数据库实例
export async function getDatabase(): Promise<Database> {
  if (db === null) {
    return await initializeDatabase();
  }
  return db;
}

// 关闭数据库连接
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      db.close();
      db = null;
    } catch (error) {
      console.error("关闭数据库失败:", error);
    }
  }
}

// 在应用退出时关闭数据库
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (db) {
      try {
        db.close();
      } catch (error) {
        console.error("退出时关闭数据库失败:", error);
      }
    }
  });

  process.on("SIGINT", async () => {
    await closeDatabase();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closeDatabase();
    process.exit(0);
  });
}

/**
 * 数据库迁移管理
 */
async function migrateDatabase(db: Database): Promise<void> {
  try {
    // 获取当前数据库版本
    const versionQuery = db.prepare("PRAGMA user_version");
    const versionResult = versionQuery.get() as any;
    const currentVersion = versionResult.user_version || 0;

    console.log(`🔄 [数据库] 当前版本: ${currentVersion}`);

    // 版本 0 -> 版本 1: 创建基础表结构
    if (currentVersion < 1) {
      await migrateToVersion1(db);
    }

    // 版本 1 -> 版本 2: 重构认证架构，分离密码到 auth_credentials 表
    if (currentVersion < 2) {
      await migrateToVersion2(db);
    }

    console.log(`✅ [数据库] 迁移完成，当前版本: 2`);
  } catch (error) {
    console.error('❌ [数据库] 迁移失败:', error);
    throw error;
  }
}

/**
 * 迁移到版本 1: 创建基础表结构
 */
async function migrateToVersion1(db: Database): Promise<void> {
  console.log('🔄 [数据库] 迁移到版本 1...');

  // 创建 Account 模块：用户身份信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT NOT NULL,
      username TEXT PRIMARY KEY,
      password TEXT, -- 临时保留，将在版本2中迁移
      avatar TEXT,
      email TEXT,
      phone TEXT,
      accountType TEXT DEFAULT 'local',
      onlineId TEXT,
      createdAt INTEGER NOT NULL
    )
  `);

  // 创建旧版登录会话表（兼容性）
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT,
      token TEXT,
      accountType TEXT NOT NULL CHECK(accountType IN ('local', 'online')) DEFAULT 'local',
      rememberMe BOOLEAN NOT NULL DEFAULT 0,
      lastLoginTime INTEGER NOT NULL,
      autoLogin BOOLEAN NOT NULL DEFAULT 0,
      isActive BOOLEAN NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(username, accountType)
    )
  `);

  // 其他现有表...
  // (保留所有现有的表创建代码)

  // 更新版本
  db.pragma("user_version = 1");
  console.log('✅ [数据库] 版本 1 迁移完成');
}

/**
 * 迁移到版本 2: 重构认证架构
 */
async function migrateToVersion2(db: Database): Promise<void> {
  console.log('🔄 [数据库] 迁移到版本 2: 重构认证架构...');

  // 1. 创建新的认证模块表
  console.log('🔄 [数据库] 创建认证模块表...');
  
  // 认证凭证表
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_credentials (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_algorithm TEXT NOT NULL DEFAULT 'bcrypt',
      password_created_at INTEGER NOT NULL,
      last_auth_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
    )
  `);

  // 会话表
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      device_info TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      created_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
    )
  `);

  // 令牌表
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      value TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('remember_me', 'access_token', 'refresh_token', 'email_verification', 'password_reset')),
      account_id TEXT NOT NULL,
      issued_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      device_info TEXT,
      is_revoked BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
    )
  `);

  // MFA设备表
  db.exec(`
    CREATE TABLE IF NOT EXISTS mfa_devices (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('totp', 'sms', 'email', 'hardware_key', 'backup_codes')),
      name TEXT NOT NULL,
      secret_key TEXT,
      phone_number TEXT,
      email_address TEXT,
      backup_codes TEXT,
      is_verified BOOLEAN NOT NULL DEFAULT 0,
      is_enabled BOOLEAN NOT NULL DEFAULT 0,
      verification_attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
    )
  `);

  // 2. 创建会话记录模块表
  console.log('🔄 [数据库] 创建会话记录模块表...');
  
  // 会话日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS session_logs (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      session_id TEXT,
      operation_type TEXT NOT NULL CHECK(operation_type IN ('login', 'logout', 'expired', 'forced_logout', 'session_refresh', 'mfa_verification', 'password_change', 'suspicious_activity')),
      device_info TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      ip_country TEXT,
      ip_region TEXT,
      ip_city TEXT,
      ip_latitude REAL,
      ip_longitude REAL,
      ip_timezone TEXT,
      ip_isp TEXT,
      user_agent TEXT,
      login_time INTEGER,
      logout_time INTEGER,
      duration INTEGER,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
      risk_factors TEXT,
      is_anomalous BOOLEAN NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE
    )
  `);

  // 审计轨迹表
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_trails (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      session_log_id TEXT,
      operation_type TEXT NOT NULL,
      description TEXT NOT NULL,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
      ip_address TEXT NOT NULL,
      ip_country TEXT,
      ip_region TEXT,
      ip_city TEXT,
      ip_latitude REAL,
      ip_longitude REAL,
      ip_timezone TEXT,
      ip_isp TEXT,
      user_agent TEXT,
      metadata TEXT,
      is_alert_triggered BOOLEAN NOT NULL DEFAULT 0,
      alert_level TEXT CHECK(alert_level IN ('info', 'warning', 'error', 'critical')),
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES users(uid) ON DELETE CASCADE,
      FOREIGN KEY (session_log_id) REFERENCES session_logs(id) ON DELETE CASCADE
    )
  `);

  // 3. 迁移现有数据
  console.log('🔄 [数据库] 迁移现有用户数据...');
  
  try {
    // 查询所有现有用户
    const existingUsers = db.prepare("SELECT * FROM users WHERE password IS NOT NULL").all() as any[];
    
    for (const user of existingUsers) {
      // 为每个用户创建认证凭证
      const credentialId = `cred_${user.uid}`;
      const now = Date.now();
      
      // 假设现有密码已经是加密的，直接迁移
      db.prepare(`
        INSERT OR IGNORE INTO auth_credentials (
          id, account_id, password_hash, password_salt, password_algorithm,
          password_created_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        credentialId,
        user.uid,
        user.password, // 现有的密码hash
        '', // 空salt，因为旧系统可能没有单独的salt
        'legacy', // 标记为旧系统格式
        now,
        now,
        now
      );
      
      console.log(`✅ [数据库] 用户 ${user.username} 的认证凭证已迁移`);
    }
  } catch (error) {
    console.warn('⚠️ [数据库] 迁移用户数据时出现警告:', error);
  }

  // 4. 移除 users 表的 password 字段
  console.log('🔄 [数据库] 重构 users 表结构...');
  
  // SQLite 不支持 DROP COLUMN，所以需要重建表
  db.exec(`
    -- 创建新的 users 表（不含密码字段）
    CREATE TABLE users_new (
      uid TEXT NOT NULL,
      username TEXT PRIMARY KEY,
      avatar TEXT,
      email TEXT,
      phone TEXT,
      accountType TEXT DEFAULT 'local',
      onlineId TEXT,
      createdAt INTEGER NOT NULL
    );
    
    -- 复制数据（排除密码字段）
    INSERT INTO users_new (uid, username, avatar, email, phone, accountType, onlineId, createdAt)
    SELECT uid, username, avatar, email, phone, accountType, onlineId, createdAt FROM users;
    
    -- 删除旧表并重命名新表
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
  `);

  // 5. 创建所有索引
  console.log('🔄 [数据库] 创建索引...');
  
  db.exec(`
    -- Account 模块索引
    CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    
    -- Authentication 模块索引
    CREATE INDEX IF NOT EXISTS idx_auth_credentials_account_id ON auth_credentials(account_id);
    CREATE INDEX IF NOT EXISTS idx_auth_credentials_last_auth_at ON auth_credentials(last_auth_at);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_id ON auth_sessions(account_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_is_active ON auth_sessions(is_active);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_active_at ON auth_sessions(last_active_at);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_account_id ON auth_tokens(account_id);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_type ON auth_tokens(type);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_is_revoked ON auth_tokens(is_revoked);
    CREATE INDEX IF NOT EXISTS idx_mfa_devices_account_id ON mfa_devices(account_id);
    CREATE INDEX IF NOT EXISTS idx_mfa_devices_type ON mfa_devices(type);
    CREATE INDEX IF NOT EXISTS idx_mfa_devices_is_enabled ON mfa_devices(is_enabled);
    
    -- SessionLogging 模块索引
    CREATE INDEX IF NOT EXISTS idx_session_logs_account_id ON session_logs(account_id);
    CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_session_logs_operation_type ON session_logs(operation_type);
    CREATE INDEX IF NOT EXISTS idx_session_logs_risk_level ON session_logs(risk_level);
    CREATE INDEX IF NOT EXISTS idx_session_logs_is_anomalous ON session_logs(is_anomalous);
    CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_session_logs_login_time ON session_logs(login_time);
    CREATE INDEX IF NOT EXISTS idx_session_logs_ip_address ON session_logs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_audit_trails_account_id ON audit_trails(account_id);
    CREATE INDEX IF NOT EXISTS idx_audit_trails_session_log_id ON audit_trails(session_log_id);
    CREATE INDEX IF NOT EXISTS idx_audit_trails_operation_type ON audit_trails(operation_type);
    CREATE INDEX IF NOT EXISTS idx_audit_trails_risk_level ON audit_trails(risk_level);
    CREATE INDEX IF NOT EXISTS idx_audit_trails_is_alert_triggered ON audit_trails(is_alert_triggered);
    CREATE INDEX IF NOT EXISTS idx_audit_trails_timestamp ON audit_trails(timestamp);
  `);

  // 更新版本
  db.pragma("user_version = 2");
  console.log('✅ [数据库] 版本 2 迁移完成 - 认证架构重构完成');
}
