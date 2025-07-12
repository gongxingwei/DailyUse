import type { Database } from "better-sqlite3";

/**
 * 兼容性模块数据表管理
 * 负责与旧版本的兼容性，保留旧表结构以便平滑迁移
 */
export class LegacyTables {
  /**
   * 创建兼容性表 - 保留旧版本表结构
   */
  static createTables(db: Database): void {
    // 旧版登录会话表 - 向后兼容
    db.exec(`
      CREATE TABLE IF NOT EXISTS login_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        token TEXT,
        account_type TEXT NOT NULL CHECK(account_type IN ('local', 'online')) DEFAULT 'local',
        remember_me BOOLEAN NOT NULL DEFAULT 0,
        last_login_time INTEGER NOT NULL,
        auto_login BOOLEAN NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(username, account_type)
      )
    `);

    // 旧版 accounts 表字段映射 - 用于数据迁移
    db.exec(`
      CREATE TABLE IF NOT EXISTS legacy_account_mapping (
        old_username TEXT PRIMARY KEY,
        new_account_uuid TEXT NOT NULL,
        migration_date INTEGER NOT NULL,
        migration_status TEXT NOT NULL CHECK(migration_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
        migration_notes TEXT,
        FOREIGN KEY (new_account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
      )
    `);
  }

  /**
   * 创建兼容性索引
   */
  static createIndexes(db: Database): void {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_login_sessions_username ON login_sessions(username);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_auto_login ON login_sessions(auto_login);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(token);
      
      CREATE INDEX IF NOT EXISTS idx_legacy_mapping_old_username ON legacy_account_mapping(old_username);
      CREATE INDEX IF NOT EXISTS idx_legacy_mapping_new_account_uuid ON legacy_account_mapping(new_account_uuid);
      CREATE INDEX IF NOT EXISTS idx_legacy_mapping_migration_status ON legacy_account_mapping(migration_status);
      CREATE INDEX IF NOT EXISTS idx_legacy_mapping_migration_date ON legacy_account_mapping(migration_date);
    `);
  }

  /**
   * 迁移旧数据到新表结构
   */
  static migrateData(_db: Database): void {
    try {
      console.log('🔄 [兼容性模块] 开始处理兼容性数据...');
      
      // 这里处理兼容性数据迁移
      // 主要是维护 username 到 uuid 的映射关系
      
    } catch (error) {
      console.warn('⚠️ [兼容性模块] 数据迁移警告:', error);
    }
  }

  /**
   * 检查是否需要兼容性支持
   */
  static needsCompatibilitySupport(db: Database): boolean {
    try {
      // 检查是否存在旧版本的数据
      const oldAccountCount = db.prepare("SELECT COUNT(*) as count FROM accounts WHERE username IS NOT NULL").get() as { count: number };
      const oldSessionCount = db.prepare("SELECT COUNT(*) as count FROM login_sessions").get() as { count: number };
      
      return oldAccountCount.count > 0 || oldSessionCount.count > 0;
    } catch (error) {
      console.warn('⚠️ [兼容性模块] 检查兼容性支持失败:', error);
      return false;
    }
  }
}
