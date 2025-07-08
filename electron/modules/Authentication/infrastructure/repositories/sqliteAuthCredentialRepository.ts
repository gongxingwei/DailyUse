import type { Database } from "better-sqlite3";
import { AuthCredential } from "../domain/aggregates/authCredential";
import { Password } from "../domain/valueObjects/password";
import { Token, TokenType } from "../domain/valueObjects/token";
import { Session } from "../domain/entities/session";
import { MFADevice, MFADeviceType } from "../domain/entities/mfaDevice";
import { 
  IAuthCredentialRepository, 
  ISessionRepository, 
  ITokenRepository 
} from "../domain/repositories/authenticationRepository";
import { getDatabase } from "../../../config/database";

/**
 * SQLite 认证凭证存储库实现
 */
export class SqliteAuthCredentialRepository implements IAuthCredentialRepository {
  private database: Promise<Database>;

  constructor() {
    this.database = getDatabase();
  }

  async save(credential: AuthCredential): Promise<void> {
    const db = await this.database;
    
    try {
      // 保存认证凭证
      const credentialData = this.serializeCredential(credential);
      
      const upsertCredentialStmt = db.prepare(`
        INSERT OR REPLACE INTO auth_credentials 
        (id, account_id, password_hash, password_salt, password_algorithm, password_created_at, last_auth_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      upsertCredentialStmt.run(
        credentialData.id,
        credentialData.account_id,
        credentialData.password_hash,
        credentialData.password_salt,
        credentialData.password_algorithm,
        credentialData.password_created_at,
        credentialData.last_auth_at,
        credentialData.created_at,
        credentialData.updated_at
      );

      // 保存活跃会话
      const sessionRepo = new SqliteSessionRepository();
      for (const session of credential.activeSessions) {
        await sessionRepo.save(session);
      }

      // 保存MFA设备
      await this.saveMFADevices(credential.accountId, credential.mfaDevices);

    } catch (error) {
      console.error('Failed to save auth credential:', error);
      throw new Error(`Failed to save auth credential: ${error}`);
    }
  }

  async findById(id: string): Promise<AuthCredential | null> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM auth_credentials WHERE id = ?
      `);
      
      const row = stmt.get(id) as any;
      if (!row) return null;

      return await this.deserializeCredential(row);
    } catch (error) {
      console.error('Failed to find auth credential by id:', error);
      return null;
    }
  }

  async findByAccountId(accountId: string): Promise<AuthCredential | null> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM auth_credentials WHERE account_id = ?
      `);
      
      const row = stmt.get(accountId) as any;
      if (!row) return null;

      return await this.deserializeCredential(row);
    } catch (error) {
      console.error('Failed to find auth credential by account id:', error);
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`DELETE FROM auth_credentials WHERE id = ?`);
      stmt.run(id);
    } catch (error) {
      console.error('Failed to delete auth credential:', error);
      throw new Error(`Failed to delete auth credential: ${error}`);
    }
  }

  async findAll(): Promise<AuthCredential[]> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`SELECT * FROM auth_credentials ORDER BY created_at DESC`);
      const rows = stmt.all() as any[];

      const credentials: AuthCredential[] = [];
      for (const row of rows) {
        const credential = await this.deserializeCredential(row);
        if (credential) {
          credentials.push(credential);
        }
      }

      return credentials;
    } catch (error) {
      console.error('Failed to find all auth credentials:', error);
      return [];
    }
  }

  async existsByAccountId(accountId: string): Promise<boolean> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`SELECT 1 FROM auth_credentials WHERE account_id = ? LIMIT 1`);
      const row = stmt.get(accountId);
      return row !== undefined;
    } catch (error) {
      console.error('Failed to check auth credential existence:', error);
      return false;
    }
  }

  /**
   * 序列化认证凭证为数据库格式
   */
  private serializeCredential(credential: AuthCredential): any {
    return {
      id: credential.id,
      account_id: credential.accountId,
      password_hash: credential['_password'].hashedValue,
      password_salt: credential['_password'].salt,
      password_algorithm: credential['_password'].algorithm,
      password_created_at: credential['_password'].createdAt.getTime(),
      last_auth_at: credential.lastAuthAt?.getTime() || null,
      created_at: credential.createdAt.getTime(),
      updated_at: credential.updatedAt.getTime()
    };
  }

  /**
   * 从数据库数据反序列化认证凭证
   */
  private async deserializeCredential(row: any): Promise<AuthCredential | null> {
    try {
      // 重建密码对象
      const password = Password.fromHash(
        row.password_hash,
        row.password_salt,
        row.password_algorithm
      );

      // 创建认证凭证对象
      const credential = new AuthCredential(
        row.id,
        row.account_id,
        password
      );

      // 设置时间戳
      credential['_createdAt'] = new Date(row.created_at);
      credential['_updatedAt'] = new Date(row.updated_at);
      if (row.last_auth_at) {
        credential['_lastAuthAt'] = new Date(row.last_auth_at);
      }

      // 加载会话
      const sessionRepo = new SqliteSessionRepository();
      const sessions = await sessionRepo.findActiveByAccountId(row.account_id);
      credential['_sessions'] = new Map();
      sessions.forEach(session => {
        credential['_sessions'].set(session.id, session);
      });

      // 加载MFA设备
      const mfaDevices = await this.loadMFADevices(row.account_id);
      credential['_mfaDevices'] = new Map();
      mfaDevices.forEach(device => {
        credential['_mfaDevices'].set(device.id, device);
      });

      return credential;
    } catch (error) {
      console.error('Failed to deserialize auth credential:', error);
      return null;
    }
  }

  /**
   * 保存MFA设备
   */
  private async saveMFADevices(accountId: string, devices: MFADevice[]): Promise<void> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO mfa_devices 
        (id, account_id, type, name, secret_key, phone_number, email_address, backup_codes, 
         is_verified, is_enabled, verification_attempts, max_attempts, created_at, last_used_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const device of devices) {
        const deviceData = device.toDTO();
        stmt.run(
          deviceData.id,
          accountId,
          deviceData.type,
          deviceData.name,
          device.secretKey || null,
          device.phoneNumber || null,
          device.emailAddress || null,
          device['_backupCodes'] ? JSON.stringify(device['_backupCodes']) : null,
          deviceData.isVerified,
          deviceData.isEnabled,
          deviceData.verificationAttempts,
          device['_maxAttempts'],
          new Date(deviceData.createdAt).getTime(),
          deviceData.lastUsedAt ? new Date(deviceData.lastUsedAt).getTime() : null
        );
      }
    } catch (error) {
      console.error('Failed to save MFA devices:', error);
      throw error;
    }
  }

  /**
   * 加载MFA设备
   */
  private async loadMFADevices(accountId: string): Promise<MFADevice[]> {
    const db = await this.database;
    
    try {
      const stmt = db.prepare(`SELECT * FROM mfa_devices WHERE account_id = ?`);
      const rows = stmt.all(accountId) as any[];

      return rows.map(row => {
        const device = new MFADevice(
          row.id,
          row.account_id,
          row.type as MFADeviceType,
          row.name,
          row.max_attempts
        );

        // 设置设备属性
        if (row.secret_key) {
          device['_secretKey'] = row.secret_key;
        }
        if (row.phone_number) {
          device['_phoneNumber'] = row.phone_number;
        }
        if (row.email_address) {
          device['_emailAddress'] = row.email_address;
        }
        if (row.backup_codes) {
          device['_backupCodes'] = JSON.parse(row.backup_codes);
        }

        device['_isVerified'] = row.is_verified;
        device['_isEnabled'] = row.is_enabled;
        device['_verificationAttempts'] = row.verification_attempts;
        device['_createdAt'] = new Date(row.created_at);
        if (row.last_used_at) {
          device['_lastUsedAt'] = new Date(row.last_used_at);
        }

        return device;
      });
    } catch (error) {
      console.error('Failed to load MFA devices:', error);
      return [];
    }
  }
}
