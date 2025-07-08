import { Database } from 'better-sqlite3';
import { MFADevice } from '../../domain/entities/mfaDevice';
import { IMFADeviceRepository } from '../../domain/repositories/authenticationRepository';

/**
 * SQLite MFA设备 仓库实现
 */
export class SqliteMFADeviceRepository implements IMFADeviceRepository {
  constructor(private readonly db: Database) {}

  /**
   * 保存MFA设备
   */
  async save(device: MFADevice): Promise<void> {
    const data = device.toDatabaseFormat();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO mfa_devices (
        id, account_id, type, name, secret_key, phone_number, email_address,
        backup_codes, is_verified, is_enabled, verification_attempts, max_attempts,
        created_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.id,
      data.account_id,
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
      data.last_used_at
    );
  }

  /**
   * 根据ID查找MFA设备
   */
  async findById(deviceId: string): Promise<MFADevice | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM mfa_devices WHERE id = ?
    `);

    const row = stmt.get(deviceId) as any;
    if (!row) return null;

    return MFADevice.fromDatabase(row);
  }

  /**
   * 根据账户ID查找所有MFA设备
   */
  async findByAccountId(accountId: string): Promise<MFADevice[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM mfa_devices 
      WHERE account_id = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountId) as any[];
    return rows.map(row => MFADevice.fromDatabase(row));
  }

  /**
   * 根据账户ID查找启用的MFA设备
   */
  async findEnabledByAccountId(accountId: string): Promise<MFADevice[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM mfa_devices 
      WHERE account_id = ? AND is_enabled = 1
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountId) as any[];
    return rows.map(row => MFADevice.fromDatabase(row));
  }

  /**
   * 根据账户ID和类型查找MFA设备
   */
  async findByAccountIdAndType(accountId: string, type: string): Promise<MFADevice[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM mfa_devices 
      WHERE account_id = ? AND type = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountId, type) as any[];
    return rows.map(row => MFADevice.fromDatabase(row));
  }

  /**
   * 删除MFA设备
   */
  async delete(deviceId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM mfa_devices WHERE id = ?
    `);

    stmt.run(deviceId);
  }

  /**
   * 删除账户的所有MFA设备
   */
  async deleteByAccountId(accountId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM mfa_devices WHERE account_id = ?
    `);

    stmt.run(accountId);
  }

  /**
   * 检查账户是否有启用的MFA设备
   */
  async existsEnabledByAccountId(accountId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM mfa_devices 
      WHERE account_id = ? AND is_enabled = 1
    `);

    const result = stmt.get(accountId) as any;
    return result.count > 0;
  }

  /**
   * 获取账户已验证的MFA设备
   */
  async findVerifiedByAccountId(accountId: string): Promise<MFADevice[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM mfa_devices 
      WHERE account_id = ? AND is_verified = 1
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountId) as any[];
    return rows.map(row => MFADevice.fromDatabase(row));
  }

  /**
   * 更新MFA设备的最后使用时间
   */
  async updateLastUsedAt(deviceId: string, lastUsedAt: Date): Promise<void> {
    const stmt = this.db.prepare(`
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
    const stmt = this.db.prepare(`
      UPDATE mfa_devices 
      SET verification_attempts = 0 
      WHERE id = ?
    `);

    stmt.run(deviceId);
  }
}
