import type { Database } from "better-sqlite3";

/**
 * 账户模块数据表管理
 * 负责用户基本信息、档案管理等
 */
export class AccountTables {
  /**
   * 创建账户相关表
   */
  static createTables(db: Database): void {
    // 用户账户表 - 核心身份信息
    db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        uuid TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        account_type TEXT DEFAULT 'local' CHECK(account_type IN ('local', 'online')),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'deleted')),
        role_ids TEXT, -- JSON 数组，存储角色ID
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_login_at INTEGER,
        email_verification_token TEXT,
        phone_verification_code TEXT,
        -- 验证状态
        email_verified BOOLEAN NOT NULL DEFAULT 0,
        phone_verified BOOLEAN NOT NULL DEFAULT 0
      )
    `);

    // 用户档案表 - 个人资料信息
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        display_name TEXT,
        sex TEXT CHECK(sex IN ('0', '1', '2')), --  '0' 为 female ，'1' 为 male，'2' 为 other
        date_of_birth INTEGER,
        avatar_url TEXT,
        bio TEXT,
        location TEXT,
        website TEXT,
        social_accounts TEXT, -- JSON 对象，存储社交账号映射
        preferences TEXT, -- JSON 对象，存储用户偏好设置
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
      )
    `);

    // 用户数据存储表 - 模块化数据存储
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_store_data (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        store_name TEXT NOT NULL,
        data_key TEXT NOT NULL,
        data_value TEXT NOT NULL,
        data_type TEXT NOT NULL DEFAULT 'string' CHECK(data_type IN ('string', 'number', 'boolean', 'json', 'binary')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(account_uuid, store_name, data_key),
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
      )
    `);
  }

  /**
   * 创建账户相关索引
   */
  static createIndexes(db: Database): void {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
      CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
      CREATE INDEX IF NOT EXISTS idx_accounts_phone ON accounts(phone);
      CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
      CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
      CREATE INDEX IF NOT EXISTS idx_accounts_last_login_at ON accounts(last_login_at);
      
      CREATE INDEX IF NOT EXISTS idx_user_profiles_account_uuid ON user_profiles(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_sex ON user_profiles(sex);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_user_store_account_uuid ON user_store_data(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_user_store_name ON user_store_data(store_name);
      CREATE INDEX IF NOT EXISTS idx_user_store_key ON user_store_data(data_key);
      CREATE INDEX IF NOT EXISTS idx_user_store_type ON user_store_data(data_type);
      CREATE INDEX IF NOT EXISTS idx_user_store_created_at ON user_store_data(created_at);
    `);
  }
}