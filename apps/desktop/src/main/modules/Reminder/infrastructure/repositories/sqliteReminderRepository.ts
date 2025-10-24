import type { Database } from 'better-sqlite3';
import type { IReminderTemplateRepository } from '../../domain/repositories/iReminderTemplateRepository';
import type { IReminderTemplate } from '@common/modules/reminder/types/reminder';
import { ReminderTemplate } from '../../domain/entities/reminderTemplate';
import { getDatabase } from '../../../../shared/database/index';

/**
 * SqliteReminderRepository
 *
 * 提供 ReminderTemplate 的数据库持久化实现（CRUD 操作）。
 * 负责与 SQLite 数据库交互，将领域实体与数据库行进行映射。
 *
 * 主要职责：
 * - 创建、更新、删除、查询提醒模板
 * - 将数据库行映射为 ReminderTemplate 实体
 *
 * 使用方式：
 * ```ts
 * const repo = new SqliteReminderRepository();
 * await repo.create(accountUuid, template);
 * const all = await repo.getAll(accountUuid);
 * ```
 */
export class SqliteReminderRepository implements IReminderTemplateRepository {
  private db: Database | null = null;

  constructor() {}

  /**
   * 获取数据库连接（单例）
   * @returns Promise<Database> 数据库连接实例
   */
  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 创建提醒模板
   * @param accountUuid 用户账号ID
   * @param data ReminderTemplate 实体
   * @returns Promise<boolean> 是否创建成功
   * @example
   * ```ts
   * const ok = await repo.create(accountUuid, template);
   * ```
   */
  async create(accountUuid: string, data: ReminderTemplate): Promise<boolean> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        INSERT INTO reminders (
          account_uuid, uuid, group_uuid, name, description, importance_level, self_enabled, enabled, notification_sound, notification_vibration, notification_popup,
          time_config, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        accountUuid,
        data.uuid,
        data.groupUuid || null,
        data.name,
        data.description || null,
        data.importanceLevel,
        data.selfEnabled ? 1 : 0,
        undefined,
        data.notificationSettings.sound ? 1 : 0,
        data.notificationSettings.vibration ? 1 : 0,
        data.notificationSettings.popup ? 1 : 0,
        JSON.stringify(data.timeConfig),
        Date.now(),
        Date.now(),
      );
      return true;
    } catch (error) {
      console.error('Error creating reminder template:', error);
      return false;
    }
  }

  /**
   * 更新提醒模板
   * @param accountUuid 用户账号ID
   * @param template ReminderTemplate 实体
   * @returns Promise<boolean> 是否更新成功
   * @example
   * ```ts
   * const ok = await repo.update(accountUuid, template);
   * ```
   */
  async update(accountUuid: string, template: ReminderTemplate): Promise<boolean> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        UPDATE reminders SET
          group_uuid = ?,
          name = ?,
          description = ?,
          importance_level = ?,
          self_enabled = ?,
          enabled = ?,
          notification_sound = ?,
          notification_vibration = ?,
          notification_popup = ?,
          time_config = ?,
          updated_at = ?
        WHERE account_uuid = ? AND uuid = ?
      `);
      stmt.run(
        template.groupUuid || null,
        template.name,
        template.description || null,
        template.importanceLevel,
        template.selfEnabled ? 1 : 0,
        undefined,
        template.notificationSettings.sound ? 1 : 0,
        template.notificationSettings.vibration ? 1 : 0,
        template.notificationSettings.popup ? 1 : 0,
        JSON.stringify(template.timeConfig),
        Date.now(),
        accountUuid,
        template.uuid,
      );
      return true;
    } catch (error) {
      console.error('Error updating reminder template:', error);
      throw error;
    }
  }

  /**
   * 删除提醒模板
   * @param accountUuid 用户账号ID
   * @param uuid 模板唯一ID
   * @returns Promise<void>
   * @example
   * ```ts
   * await repo.delete(accountUuid, uuid);
   * ```
   */
  async delete(accountUuid: string, uuid: string): Promise<void> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        DELETE FROM reminders WHERE account_uuid = ? AND uuid = ?
      `);
      stmt.run(accountUuid, uuid);
    } catch (error) {
      console.error('Error deleting reminder template:', error);
      throw error;
    }
  }

  /**
   * 获取所有提醒模板
   * @param accountUuid 用户账号ID
   * @returns Promise<ReminderTemplate[]> 模板实体数组
   * @example
   * ```ts
   * const list = await repo.getAll(accountUuid);
   * ```
   */
  async getAll(accountUuid: string): Promise<ReminderTemplate[]> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminders WHERE account_uuid = ?
      `);
      const rows = stmt.all(accountUuid);
      return rows.map((row: any) => this.mapRowToReminderTemplate(row));
    } catch (error) {
      console.error('Error getting all reminder templates:', error);
      throw error;
    }
  }

  /**
   * 根据 uuid 获取提醒模板
   * @param accountUuid 用户账号ID
   * @param uuid 模板唯一ID
   * @returns Promise<ReminderTemplate | null> 查询到的模板实体或 null
   * @example
   * ```ts
   * const template = await repo.getById(accountUuid, uuid);
   * ```
   */
  async getById(accountUuid: string, uuid: string): Promise<ReminderTemplate | null> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminders WHERE account_uuid = ? AND uuid = ?
      `);
      const row = stmt.get(accountUuid, uuid);
      return row ? this.mapRowToReminderTemplate(row) : null;
    } catch (error) {
      console.error('Error getting reminder template by uuid:', error);
      throw error;
    }
  }

  /**
   * 根据分组 groupUuid 获取该分组下所有提醒模板
   * @param accountUuid 用户账号ID
   * @param groupUuid 分组唯一ID
   * @returns Promise<ReminderTemplate[]> 模板实体数组
   * @example
   * ```ts
   * const templates = await repo.getByGroupUuid(accountUuid, groupUuid);
   * ```
   * 返回示例:
   * [
   *   {
   *     uuid: 'xxx',
   *     groupUuid: 'group-uuid',
   *     name: '模板名',
   *     description: '描述',
   *     importanceLevel: 1,
   *     selfEnabled: true,
   *     notificationSettings: { sound: true, vibration: false, popup: true },
   *     timeConfig: {...}
   *   }
   * ]
   */
  async getByGroupUuid(accountUuid: string, groupUuid: string): Promise<ReminderTemplate[]> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminders WHERE account_uuid = ? AND group_uuid = ?
      `);
      const rows = stmt.all(accountUuid, groupUuid);
      return rows.map((row: any) => this.mapRowToReminderTemplate(row));
    } catch (error) {
      console.error('Error getting reminder templates by groupUuid:', error);
      throw error;
    }
  }

  /**
   * 将数据库行映射为 ReminderTemplate 实体
   * @param row 数据库查询结果行
   * @returns ReminderTemplate 实体
   * @example
   * ```ts
   * const entity = repo['mapRowToReminderTemplate'](row);
   * ```
   */
  private mapRowToReminderTemplate(row: any): ReminderTemplate {
    const reminderTemplateDTO: IReminderTemplate = {
      uuid: row.uuid,
      groupUuid: row.group_uuid,
      name: row.name,
      description: row.description,
      importanceLevel: row.importance_level,
      selfEnabled: !!row.self_enabled,
      notificationSettings: {
        sound: !!row.notification_sound,
        vibration: !!row.notification_vibration,
        popup: !!row.notification_popup,
      },
      timeConfig: JSON.parse(row.time_config),
    };
    // 创建 ReminderTemplate 实体
    const reminderTemplate = ReminderTemplate.fromDTO(reminderTemplateDTO);
    return reminderTemplate;
  }
}
