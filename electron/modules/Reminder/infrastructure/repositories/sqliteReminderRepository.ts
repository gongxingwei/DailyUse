import type { Database } from "better-sqlite3";
import type { IReminderTemplateRepository } from "../../domain/repositories/iReminderTemplateRepository";
import type { IReminderTemplate } from "@common/modules/reminder/types/reminder";
import { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";
/**
 * reminder 模块数据库仓库实现
 * 提供目标、关键结果、记录、目录的 CRUD 操作
 */

import { getDatabase } from "../../../../shared/database/index";

export class SqliteReminderRepository implements IReminderTemplateRepository {
  private db: Database | null = null;
  constructor() {}

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   *
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
        data.groupId || null,
        data.name,
        data.description || null,
        data.importanceLevel,
        data.selfEnabled ? 1 : 0,
        data.enabled ? 1 : 0,
        data.notificationSettings.sound ? 1 : 0,
        data.notificationSettings.vibration ? 1 : 0,
        data.notificationSettings.popup ? 1 : 0,
        JSON.stringify(data.timeConfig),
        Date.now(),
        Date.now()
      );
      return true;
    } catch (error) {
      console.error("Error creating reminder template:", error);
      return false;
    }
  }


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
        template.groupId || null,
        template.name,
        template.description || null,
        template.importanceLevel,
        template.selfEnabled ? 1 : 0,
        template.enabled ? 1 : 0,
        template.notificationSettings.sound ? 1 : 0,
        template.notificationSettings.vibration ? 1 : 0,
        template.notificationSettings.popup ? 1 : 0,
        JSON.stringify(template.timeConfig),
        Date.now(),
        accountUuid,
        template.uuid
      );
      return true;
    } catch (error) {
      console.error("Error updating reminder template:", error);
      throw error;
    }
  }


  async delete(accountUuid: string, uuid: string): Promise<void> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        DELETE FROM reminders WHERE account_uuid = ? AND uuid = ?
      `);
      stmt.run(accountUuid, uuid);
    } catch (error) {
      console.error("Error deleting reminder template:", error);
      throw error;
    }
  }


  async getAll(accountUuid: string): Promise<ReminderTemplate[]> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminders WHERE account_uuid = ?
      `);
      const rows = stmt.all(accountUuid);
      return rows.map((row: any) => this.mapRowToReminderTemplate(row));
    } catch (error) {
      console.error("Error getting all reminder templates:", error);
      throw error;
    }
  }


  async getById(accountUuid: string, uuid: string): Promise<ReminderTemplate | null> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminders WHERE account_uuid = ? AND uuid = ?
      `);
      const row = stmt.get(accountUuid, uuid);
      return row ? this.mapRowToReminderTemplate(row) : null;
    } catch (error) {
      console.error("Error getting reminder template by uuid:", error);
      throw error;
    }
  }

  /**
   * 将数据库行映射为 ReminderTemplate 实体
   */
  private mapRowToReminderTemplate(row: any): ReminderTemplate {
    const reminderTemplateDTO: IReminderTemplate = {
      uuid: row.uuid,
      groupId: row.group_uuid,
      name: row.name,
      description: row.description,
      importanceLevel: row.importance_level,
      selfEnabled: !!row.self_enabled,
      enabled: !!row.enabled,
      notificationSettings: {
        sound: !!row.notification_sound,
        vibration: !!row.notification_vibration,
        popup: !!row.notification_popup,
      },
      timeConfig: JSON.parse(row.time_config),
    };
    // 创建 ReminderTemplate 实体
    const reminderTemplate = ReminderTemplate.fromDTO(reminderTemplateDTO);
    // 设置 ID

    return reminderTemplate;
  }
}
