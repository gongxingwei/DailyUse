import path from "node:path";
import fs from "node:fs/promises";
import { app } from "electron";
import { fileURLToPath } from "node:url";
import BetterSqlite3 from "better-sqlite3";
import type { Database } from "better-sqlite3";
import { DatabaseManager } from "./databaseManager";
import { RepositoryFactory } from "../services/repositoryFactory";

// 为 better-sqlite3 提供 __filename 和 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 将这些添加到全局，以防 better-sqlite3 需要
globalThis.__filename = __filename;
globalThis.__dirname = __dirname;

// 数据库单例
let db: Database | null = null;
let isInitializing = false;

/**
 * 数据库版本常量
 */
const DATABASE_VERSION = 1;

/**
 * 异步初始化数据库
 */
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
    console.log('🔄 [数据库初始化] 开始初始化数据库...');

    // 确保数据目录存在
    const dbDir = path.join(app.getPath("userData"), "database");
    try {
      await fs.access(dbDir);
    } catch {
      await fs.mkdir(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, "dailyuse.db");
    console.log(`📂 [数据库初始化] 数据库路径: ${dbPath}`);

    // 创建/打开数据库连接
    db = new BetterSqlite3(dbPath, {
      verbose: process.env.NODE_ENV !== "production" ? console.log : undefined,
    });

    // 启用 WAL 模式提高性能
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("cache_size = 1000");
    db.pragma("temp_store = memory");
    db.pragma("mmap_size = 268435456"); // 256MB

    // 启用外键约束
    db.pragma("foreign_keys = ON");

    console.log('⚙️ [数据库初始化] 数据库性能参数设置完成');

    // 设置数据库版本
    db.pragma(`user_version = ${DATABASE_VERSION}`);

    // 使用新的模块化表管理器
    DatabaseManager.createAllTables(db);
    DatabaseManager.createAllIndexes(db);

    // 验证数据库完整性
    if (!DatabaseManager.validateDatabaseIntegrity(db)) {
      throw new Error('数据库完整性验证失败');
    }

    // 创建默认用户（如果不存在）
    await ensureDefaultUser(db);

    // 初始化仓库工厂
    RepositoryFactory.initialize(db);

    // 获取数据库统计信息
    const stats = DatabaseManager.getDatabaseStats(db);
    console.log('📊 [数据库初始化] 数据库统计信息:', stats);

    console.log('✅ [数据库初始化] 数据库初始化完成');

    return db;
  } catch (error) {
    console.error("❌ [数据库初始化] 数据库初始化失败:", error);
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
    const existingUser = database.prepare("SELECT uuid FROM accounts WHERE username = ?").get('default');
    
    if (!existingUser) {
      console.log('🔄 [数据库初始化] 创建默认用户...');
      
      const now = Date.now();
      const defaultUserUuid = `default_user_${now}`;
      
      // 创建默认用户账户
      database.prepare(`
        INSERT INTO accounts (uuid, username, account_type, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        defaultUserUuid,
        'default',
        'local',
        'active',
        now,
        now
      );

      // 为默认用户创建用户档案
      database.prepare(`
        INSERT INTO user_profiles (uuid, account_uuid, first_name, last_name, display_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `profile_${defaultUserUuid}`,
        defaultUserUuid,
        'Default',
        'User',
        'Default User',
        now,
        now
      );

      // 为默认用户创建认证凭证
      const credentialUuid = `cred_${defaultUserUuid}`;
      const defaultPasswordHash = '$2b$10$defaulthash'; // 实际应用中应该使用真实的加密密码
      
      database.prepare(`
        INSERT INTO auth_credentials (
          uuid, account_uuid, password_hash, password_salt, password_algorithm,
          password_created_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        credentialUuid,
        defaultUserUuid,
        defaultPasswordHash,
        'default_salt',
        'bcrypt',
        now,
        now,
        now
      );

      console.log('✅ [数据库初始化] 默认用户创建完成');
    }
  } catch (error) {
    console.error('❌ [数据库初始化] 创建默认用户失败:', error);
  }
}

/**
 * 获取数据库实例
 */
export async function getDatabase(): Promise<Database> {
  if (db === null) {
    return await initializeDatabase();
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      console.log('🔄 [数据库关闭] 正在关闭数据库连接...');
      
      // 优化数据库（可选）
      try {
        DatabaseManager.optimizeDatabase(db);
      } catch (error) {
        console.warn('⚠️ [数据库关闭] 数据库优化失败:', error);
      }
      
      db.close();
      db = null;
      
      console.log('✅ [数据库关闭] 数据库连接已关闭');
    } catch (error) {
      console.error("❌ [数据库关闭] 关闭数据库失败:", error);
    }
  }
}

/**
 * 获取数据库统计信息
 */
export function getDatabaseStats(): Record<string, any> {
  if (db) {
    return DatabaseManager.getDatabaseStats(db);
  }
  return {};
}

/**
 * 验证数据库完整性
 */
export function validateDatabase(): boolean {
  if (db) {
    return DatabaseManager.validateDatabaseIntegrity(db);
  }
  return false;
}

// 在应用退出时关闭数据库
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (db) {
      try {
        db.close();
      } catch (error) {
        console.error("❌ [数据库关闭] 退出时关闭数据库失败:", error);
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
