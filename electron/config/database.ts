import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { app } from 'electron';
import { fileURLToPath } from 'node:url';
// 为 better-sqlite3 提供 __filename 和 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 将这些添加到全局，以防 better-sqlite3 需要
globalThis.__filename = __filename;
globalThis.__dirname = __dirname;
import BetterSqlite3 from 'better-sqlite3';
import type { Database } from 'better-sqlite3';

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
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (db !== null) return db;
  }
  
  isInitializing = true;
  
  try {
    // 确保数据目录存在
    const dbDir = path.join(app.getPath('userData'), 'database');
    
    try {
      await fs.access(dbDir);
    } catch {
      await fs.mkdir(dbDir, { recursive: true });
    }
    
    const dbPath = path.join(dbDir, 'dailyuse.db');
    
    // 创建/打开数据库连接
    db = new BetterSqlite3(dbPath, { 
      verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined 
    });
    
    // 启用 WAL 模式提高性能
    db.pragma('journal_mode = WAL');
    
    // 创建表结构 - 确保包含所有必要字段
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
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
    
    // 创建索引提高查询性能
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_login_sessions_username ON login_sessions(username);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(isActive);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_auto_login ON login_sessions(autoLogin);
    `);

    console.log('数据库初始化成功');
    return db;
  } catch (error) {
    console.error('数据库初始化失败:', error);
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
    const dbDir = path.join(app.getPath('userData'), 'database');
    if (!fsSync.existsSync(dbDir)) {
      fsSync.mkdirSync(dbDir, { recursive: true });
    }
    
    const dbPath = path.join(dbDir, 'dailyuse.db');
    console.log('数据库路径:', dbPath);
    
    // 创建/打开数据库连接
    db = new BetterSqlite3(dbPath, { 
      verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined 
    });
    
    // 启用 WAL 模式提高性能
    db.pragma('journal_mode = WAL');
    
    // 创建表结构
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
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
    
    console.log('数据库同步初始化成功');
    return db;
  } catch (error) {
    console.error('数据库同步初始化失败:', error);
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
      console.log('数据库连接已关闭');
    } catch (error) {
      console.error('关闭数据库失败:', error);
    }
  }
}

// 在应用退出时关闭数据库
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (db) {
      try {
        db.close();
      } catch (error) {
        console.error('退出时关闭数据库失败:', error);
      }
    }
  });
  
  process.on('SIGINT', async () => {
    await closeDatabase();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await closeDatabase();
    process.exit(0);
  });
}