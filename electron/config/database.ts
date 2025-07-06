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

    // 创建表结构 - 确保包含所有必要字段
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

    // 创建登录会话表
    db.exec(`
      CREATE TABLE IF NOT EXISTS login_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT, -- 加密存储，只有记住密码时才有值
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
    `);
    return db;
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  } finally {
    isInitializing = false;
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
