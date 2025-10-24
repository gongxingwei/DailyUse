import type { Database } from 'better-sqlite3';
import { AccountTables } from './accountTables';
import { AuthenticationTables } from './authenticationTables';
import { SessionLoggingTables } from './sessionLoggingTables';
import { TaskTables } from './taskTables';
import { GoalTables } from './goalTables';
import { RepositoryTables } from './repositoryTables';
import { ReminderTables } from './reminderTables';
/**
 * 数据库表管理器
 * 统一管理所有模块的数据表
 */
export class DatabaseManager {
  /**
   * 创建所有数据表
   */
  static createAllTables(db: Database): void {
    console.log('🔄 [数据库管理器] 开始创建所有数据表...');

    // 按照依赖顺序创建表

    AccountTables.createTables(db);

    AuthenticationTables.createTables(db);

    console.log('📊 [数据库管理器] 创建会话记录模块表...');
    SessionLoggingTables.createTables(db);

    console.log('✅ [数据库管理器] 创建任务模块表...');
    TaskTables.createTables(db);

    console.log('🎯 [数据库管理器] 创建目标模块表...');
    GoalTables.createTables(db);

    console.log('📦 [数据库管理器] 创建仓库模块表...');
    RepositoryTables.createTables(db);

    console.log('✅ [数据库管理器] 所有数据表创建完成');

    // 创建提醒相关表
    ReminderTables.createTables(db);
    console.log('⏰ [数据库管理器] 创建提醒模块表...');
  }

  /**
   * 创建所有索引
   */
  static createAllIndexes(db: Database): void {
    console.log('🔄 [数据库管理器] 开始创建所有索引...');

    AccountTables.createIndexes(db);
    AuthenticationTables.createIndexes(db);
    SessionLoggingTables.createIndexes(db);
    TaskTables.createIndexes(db);
    GoalTables.createIndexes(db);

    console.log('✅ [数据库管理器] 所有索引创建完成');
  }

  /**
   * 获取数据库统计信息
   */
  static getDatabaseStats(db: Database): Record<string, any> {
    const stats: Record<string, any> = {};

    try {
      // 获取各个表的记录数
      const tables = [
        'accounts',
        'user_profiles',
        'user_store_data',
        'auth_credentials',
        'auth_sessions',
        'auth_tokens',
        'mfa_devices',
        'auth_logs',
        'session_logs',
        'audit_trails',
        'risk_assessment_rules',
        'anomaly_detections',
        'task_categories',
        'task_meta_templates',
        'task_templates',
        'task_instances',
        'task_execution_logs',
        'task_dependencies',
        'goal_categories',
        'goal_directories',
        'goals',
        'key_results',
        'goal_records',
        'goal_reviews',
        'goal_relationships',
      ];

      for (const table of tables) {
        try {
          const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as {
            count: number;
          };
          stats[table] = result.count;
        } catch (error) {
          stats[table] = 0; // 表不存在或其他错误
        }
      }

      // 获取数据库大小
      const dbSize = db
        .prepare(
          'SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()',
        )
        .get() as { size: number };
      stats.database_size = dbSize.size;

      // 获取数据库版本
      const version = db.prepare('PRAGMA user_version').get() as { user_version: number };
      stats.database_version = version.user_version;

      // 获取 WAL 模式状态
      const walMode = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
      stats.journal_mode = walMode.journal_mode;
    } catch (error) {
      console.error('❌ [数据库管理器] 获取数据库统计信息失败:', error);
    }

    return stats;
  }

  /**
   * 验证数据库完整性
   */
  static validateDatabaseIntegrity(db: Database): boolean {
    try {
      console.log('🔍 [数据库管理器] 开始验证数据库完整性...');

      // 检查外键约束
      const foreignKeyCheck = db.prepare('PRAGMA foreign_key_check').all();
      if (foreignKeyCheck.length > 0) {
        console.error('❌ [数据库管理器] 外键约束检查失败:', foreignKeyCheck);
        return false;
      }

      // 检查数据库完整性
      const integrityCheck = db.prepare('PRAGMA integrity_check').get() as {
        integrity_check: string;
      };
      if (integrityCheck.integrity_check !== 'ok') {
        console.error('❌ [数据库管理器] 数据库完整性检查失败:', integrityCheck);
        return false;
      }

      console.log('✅ [数据库管理器] 数据库完整性验证通过');
      return true;
    } catch (error) {
      console.error('❌ [数据库管理器] 数据库完整性验证失败:', error);
      return false;
    }
  }

  /**
   * 优化数据库性能
   */
  static optimizeDatabase(db: Database): void {
    try {
      console.log('🚀 [数据库管理器] 开始优化数据库性能...');

      // 重建索引
      db.exec('REINDEX');

      // 分析表统计信息
      db.exec('ANALYZE');

      // 清理未使用的页面
      db.exec('VACUUM');

      console.log('✅ [数据库管理器] 数据库性能优化完成');
    } catch (error) {
      console.error('❌ [数据库管理器] 数据库性能优化失败:', error);
    }
  }

  /**
   * 获取表结构信息
   */
  static getTableSchema(db: Database, tableName: string): any[] {
    try {
      return db.prepare(`PRAGMA table_info(${tableName})`).all();
    } catch (error) {
      console.error(`❌ [数据库管理器] 获取表 ${tableName} 结构信息失败:`, error);
      return [];
    }
  }

  /**
   * 获取所有表名
   */
  static getAllTableNames(db: Database): string[] {
    try {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];
      return tables.map((table) => table.name);
    } catch (error) {
      console.error('❌ [数据库管理器] 获取所有表名失败:', error);
      return [];
    }
  }

  /**
   * 检查表是否存在
   */
  static tableExists(db: Database, tableName: string): boolean {
    try {
      const result = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
        .get(tableName);
      return result !== undefined;
    } catch (error) {
      console.error(`❌ [数据库管理器] 检查表 ${tableName} 是否存在失败:`, error);
      return false;
    }
  }
}
