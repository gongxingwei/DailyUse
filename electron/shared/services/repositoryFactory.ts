import { Database } from 'better-sqlite3';

// Authentication 模块仓库
import { SqliteAuthCredentialRepository } from '../../modules/Authentication/infrastructure/repositories/sqliteAuthCredentialRepository';
import { SqliteSessionRepository } from '../../modules/Authentication/infrastructure/repositories/sqliteUserSessionRepository';
import { SqliteTokenRepository } from '../../modules/Authentication/infrastructure/repositories/sqliteTokenRepository';
import { SqliteMFADeviceRepository } from '../../modules/Authentication/infrastructure/repositories/sqliteMFADeviceRepository';

// SessionLogging 模块仓库
import { SqliteSessionLoggingRepository } from '../../modules/SessionLogging/infrastructure/repositories/sqliteSessionLoggingRepository';
import { SqliteAuditTrailRepository } from '../../modules/SessionLogging/infrastructure/repositories/sqliteAuditTrailRepository';

// Account 模块仓库
import { SqliteAccountRepository } from '../../modules/Account/infrastructure/repositories/sqliteAccountRepository';
import { SqliteUserRepository } from '../../modules/Account/infrastructure/repositories/sqliteUserRepository';

/**
 * 仓库工厂
 * 统一管理所有仓库的实例化
 */
export class RepositoryFactory {
  private static _authCredentialRepo: SqliteAuthCredentialRepository;
  private static _userSessionRepo: SqliteSessionRepository;
  private static _tokenRepo: SqliteTokenRepository;
  private static _mfaDeviceRepo: SqliteMFADeviceRepository;
  private static _sessionLogRepo: SqliteSessionLoggingRepository;
  private static _auditTrailRepo: SqliteAuditTrailRepository;
  private static _accountRepo: SqliteAccountRepository;
  private static _userRepo: SqliteUserRepository;

  /**
   * 初始化所有仓库
   */
  static initialize(db: Database): void {
    this._authCredentialRepo = new SqliteAuthCredentialRepository(); // 内部获取DB
    this._userSessionRepo = new SqliteSessionRepository();
    this._tokenRepo = new SqliteTokenRepository(db);
    this._mfaDeviceRepo = new SqliteMFADeviceRepository(db);
    this._sessionLogRepo = new SqliteSessionLoggingRepository();
    this._auditTrailRepo = new SqliteAuditTrailRepository(db);
    this._userRepo = new SqliteUserRepository();
    this._accountRepo = new SqliteAccountRepository(); // 注入 UserRepository 依赖
  }

  // Authentication 模块仓库获取器
  static getAuthCredentialRepository(): SqliteAuthCredentialRepository {
    if (!this._authCredentialRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._authCredentialRepo;
  }

  static getUserSessionRepository(): SqliteSessionRepository {
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
  static getSessionLogRepository(): SqliteSessionLoggingRepository {
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

  static getUserRepository(): SqliteUserRepository {
    if (!this._userRepo) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return this._userRepo;
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
    this._userRepo = null as any;
  }
}
