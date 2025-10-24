import { Database } from 'better-sqlite3';
import { MFADevice } from '../../domain/entities/mfaDevice';
import { IMFADeviceRepository } from '../../domain/repositories/authenticationRepository';
import { getDatabase } from '../../../../shared/database/index';

/**
 * SQLite MFA设备 仓库实现
 */
export class SqliteMFADeviceRepository implements IMFADeviceRepository {
  private db: Database | null = null;

  constructor() {}

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 保存MFA设备
   */
  async save(device: MFADevice): Promise<void> {
    const db = await this.getDb();
    const data = device.toDatabaseFormat();

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO mfa_devices (
        uuid, account_uuid, type, name, secret_key, phone_number, email_address,
        backup_codes, is_verified, is_enabled, verification_attempts, max_attempts,
        created_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.uuid,
      data.account_uuid,
      data.type,
      data.name,
      data.secret_key,
      data.phone_number,
      data.email_address,
      data.backup_codes,
      data.is_verified,
      data.is_enabled,
      data.verification_attempts,
      data.max_attempts,
      data.created_at,
      data.last_used_at,
    );
  }

  /**
   * 根据ID查找MFA设备
   */
  async findById(deviceId: string): Promise<MFADevice | null> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM mfa_devices WHERE id = ?
    `);

    const row = stmt.get(deviceId) as any;
    if (!row) return null;

    return MFADevice.fromDatabase(row);
  }

  /**
   * 根据账户ID查找所有MFA设备
   */
  async findByAccountUuid(accountUuid: string): Promise<MFADevice[]> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM mfa_devices 
      WHERE account_uuid = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountUuid) as any[];
    return rows.map((row) => MFADevice.fromDatabase(row));
  }

  /**
   * 根据账户ID查找启用的MFA设备
   */
  async findEnabledByAccountUuid(accountUuid: string): Promise<MFADevice[]> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM mfa_devices 
      WHERE account_uuid = ? AND is_enabled = 1
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountUuid) as any[];
    return rows.map((row) => MFADevice.fromDatabase(row));
  }

  /**
   * 根据账户ID和类型查找MFA设备
   */
  async findByAccountUuidAndType(accountUuid: string, type: string): Promise<MFADevice[]> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM mfa_devices 
      WHERE account_uuid = ? AND type = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountUuid, type) as any[];
    return rows.map((row) => MFADevice.fromDatabase(row));
  }

  /**
   * 删除MFA设备
   */
  async delete(deviceId: string): Promise<void> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      DELETE FROM mfa_devices WHERE id = ?
    `);

    stmt.run(deviceId);
  }

  /**
   * 删除账户的所有MFA设备
   */
  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      DELETE FROM mfa_devices WHERE account_uuid = ?
    `);

    stmt.run(accountUuid);
  }

  /**
   * 检查账户是否有启用的MFA设备
   */
  async existsEnabledByAccountUuid(accountUuid: string): Promise<boolean> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM mfa_devices 
      WHERE account_uuid = ? AND is_enabled = 1
    `);

    const result = stmt.get(accountUuid) as any;
    return result.count > 0;
  }

  /**
   * 获取账户已验证的MFA设备
   */
  async findVerifiedByAccountUuid(accountUuid: string): Promise<MFADevice[]> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM mfa_devices 
      WHERE account_uuid = ? AND is_verified = 1
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountUuid) as any[];
    return rows.map((row) => MFADevice.fromDatabase(row));
  }

  /**
   * 更新MFA设备的最后使用时间
   */
  async updateLastUsedAt(deviceId: string, lastUsedAt: Date): Promise<void> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      UPDATE mfa_devices 
      SET last_used_at = ? 
      WHERE id = ?
    `);

    stmt.run(lastUsedAt.getTime(), deviceId);
  }

  /**
   * 重置MFA设备的验证尝试次数
   */
  async resetVerificationAttempts(deviceId: string): Promise<void> {
    const db = await this.getDb();
    const stmt = db.prepare(`
      UPDATE mfa_devices 
      SET verification_attempts = 0 
      WHERE id = ?
    `);

    stmt.run(deviceId);
  }
}
