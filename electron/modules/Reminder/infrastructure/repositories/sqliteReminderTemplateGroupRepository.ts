


import type { Database } from "better-sqlite3";
import { getDatabase } from "../../../../shared/database/index";
import type { IReminderTemplateGroupRepository } from "../../domain/repositories/iReminderTemplateGroupRepository";
import type { IReminderTemplateGroup } from "../../domain/types";
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";

export class SqliteReminderTemplateGroupRepository implements IReminderTemplateGroupRepository {
  private db: Database | null = null;
  private accountUuid = "default_user_1752130481607";
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

  setCurrentAccountUuid(accountUuid: string): void {
    this.accountUuid = accountUuid;
  }

  async create(group: ReminderTemplateGroup): Promise<boolean> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        INSERT INTO reminder_groups (
          account_uuid, uuid, name, enabled, enable_mode
        ) VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        this.accountUuid,
        group.id,
        group.name,
        group.enabled ? 1 : 0,
        group.enableMode
      );
      return true;
    } catch (error) {
      console.error("Error creating reminder group:", error);
      return false;
    }
  }

  async update(group: ReminderTemplateGroup): Promise<boolean> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        UPDATE reminder_groups SET
          name = ?,
          enabled = ?,
          enable_mode = ?
        WHERE account_uuid = ? AND uuid = ?
      `);
      stmt.run(
        group.name,
        group.enabled ? 1 : 0,
        group.enableMode,
        this.accountUuid,
        group.id
      );
      return true;
    } catch (error) {
      console.error("Error updating reminder group:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        DELETE FROM reminder_groups WHERE account_uuid = ? AND uuid = ?
      `);
      stmt.run(this.accountUuid, id);
    } catch (error) {
      console.error("Error deleting reminder group:", error);
      throw error;
    }
  }

  async getAll(): Promise<ReminderTemplateGroup[]> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminder_groups WHERE account_uuid = ?
      `);
      const rows = stmt.all(this.accountUuid);
      return await Promise.all(rows.map(async (row: any) => await this.mapRowToReminderTemplateGroup(row)));
    } catch (error) {
      console.error("Error getting all reminder groups:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<ReminderTemplateGroup | null> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminder_groups WHERE account_uuid = ? AND uuid = ?
      `);
      const row = stmt.get(this.accountUuid, id);
      return row ? await this.mapRowToReminderTemplateGroup(row) : null;
    } catch (error) {
      console.error("Error getting reminder group by id:", error);
      throw error;
    }
  }

  /**
   * 将数据库行映射为 ReminderTemplateGroup 实体，并查询组内模板
   */
  private async mapRowToReminderTemplateGroup(row: any): Promise<ReminderTemplateGroup> {
    const db = await this.getDb();
    // 查询该组下所有模板
    const stmt = db.prepare(`
      SELECT * FROM reminders WHERE account_uuid = ? AND group_uuid = ?
    `);
    const templates = stmt.all(this.accountUuid, row.uuid).map((tplRow: any) => ReminderTemplate.fromDTO({
      id: tplRow.uuid,
      groupId: tplRow.group_uuid,
      name: tplRow.name,
      description: tplRow.description,
      importanceLevel: tplRow.importance_level,
      enabled: !!tplRow.enabled,
      notificationSettings: {
        sound: !!tplRow.notification_sound,
        vibration: !!tplRow.notification_vibration,
        popup: !!tplRow.notification_popup,
      },
      timeConfig: JSON.parse(tplRow.time_config),
    }));
    return new ReminderTemplateGroup(
      row.uuid,
      row.name,
      !!row.enabled,
      templates,
      row.enable_mode
    );
  }
}