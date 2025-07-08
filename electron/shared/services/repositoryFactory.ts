import { Database } from 'better-sqlite3';

// Authentication 模块仓库
import { SqliteAuthCredentialRepository } from '../../modules/Authentication/infrastructure/repositories/sqliteAuthCredentialRepository';
import { SqliteUserSessionRepository } from '../../modules/Authentication/infrastructure/repositories/sqliteUserSessionRepository';
import { SqliteTokenRepository } from '../../modules/Authentication/infrastructure/repositories/sqliteTokenRepository';
import { SqliteMFADeviceRepository } from '../../modules/Authentication/infrastructure/repositories/sqliteMFADeviceRepository';

// SessionLogging 模块仓库
import { SqliteSessionLogRepository } from '../../modules/SessionLogging/infrastructure/repositories/sqliteSessionLogRepository';
import { SqliteAuditTrailRepository } from '../../modules/SessionLogging/infrastructure/repositories/sqliteAuditTrailRepository';

// Account 模块仓库
import { SqliteAccountRepository } from '../../modules/Account/infrastructure/repositories/sqliteAccountRepository';

/**
 * 仓库工厂
 * 统一管理所有仓库的实例化
 */
export class RepositoryFactory {
  private static _authCredentialRepo: SqliteAuthCredentialRepository;
  private static _userSessionRepo: SqliteUserSessionRepository;
  private static _tokenRepo: SqliteTokenRepository;
  private static _mfaDeviceRepo: SqliteMFADeviceRepository;
  private static _sessionLogRepo: SqliteSessionLogRepository;
  private static _auditTrailRepo: SqliteAuditTrailRepository;
  private static _accountRepo: SqliteAccountRepository;

  /**
   * 初始化所有仓库
   */
  static initialize(db: Database): void {
    this._authCredentialRepo = new SqliteAuthCredentialRepository(); // 内部获取DB
    this._userSessionRepo = new SqliteUserSessionRepository(db);
    this._tokenRepo = new SqliteTokenRepository(db);
    this._mfaDeviceRepo = new SqliteMFADeviceRepository(db);
    this._sessionLogRepo = new SqliteSessionLogRepository(db);
    this._auditTrailRepo = new SqliteAuditTrailRepository(db);
    this._accountRepo = new SqliteAccountRepository(); // Account仓库不需要db参数
  }

  // Authentication 模块仓库获取器
  static getAuthCredentialRepository(): SqliteAuthCredentialRepository {
    if (!this._authCredentialRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._authCredentialRepo;
  }

  static getUserSessionRepository(): SqliteUserSessionRepository {
    if (!this._userSessionRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._userSessionRepo;
  }

  static getTokenRepository(): SqliteTokenRepository {
    if (!this._tokenRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._tokenRepo;
  }

  static getMFADeviceRepository(): SqliteMFADeviceRepository {
    if (!this._mfaDeviceRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._mfaDeviceRepo;
  }

  // SessionLogging 模块仓库获取器
  static getSessionLogRepository(): SqliteSessionLogRepository {
    if (!this._sessionLogRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._sessionLogRepo;
  }

  static getAuditTrailRepository(): SqliteAuditTrailRepository {
    if (!this._auditTrailRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._auditTrailRepo;
  }

  // Account 模块仓库获取器
  static getAccountRepository(): SqliteAccountRepository {
    if (!this._accountRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._accountRepo;
  }

  /**
   * 清理所有仓库引用
   */
  static cleanup(): void {
    this._authCredentialRepo = null as any;
    this._userSessionRepo = null as any;
    this._tokenRepo = null as any;
    this._mfaDeviceRepo = null as any;
    this._sessionLogRepo = null as any;
    this._auditTrailRepo = null as any;
    this._accountRepo = null as any;
  }
}
