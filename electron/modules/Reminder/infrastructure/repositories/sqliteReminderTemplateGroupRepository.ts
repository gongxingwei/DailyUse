


import type { Database } from "better-sqlite3";
import { getDatabase } from "../../../../shared/database/index";
import type { IReminderTemplateGroupRepository } from "../../domain/repositories/iReminderTemplateGroupRepository";
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";

export class SqliteReminderTemplateGroupRepository implements IReminderTemplateGroupRepository {
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

  async create(accountUuid: string, group: ReminderTemplateGroup): Promise<boolean> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        INSERT INTO reminder_groups (
          account_uuid, uuid, name, enabled, enable_mode
        ) VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        accountUuid,
        group.uuid,
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

  async update(accountUuid: string, group: ReminderTemplateGroup): Promise<boolean> {
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
        accountUuid,
        group.uuid
      );
      return true;
    } catch (error) {
      console.error("Error updating reminder group:", error);
      throw error;
    }
  }

  async delete(accountUuid: string, uuid: string): Promise<void> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        DELETE FROM reminder_groups WHERE account_uuid = ? AND uuid = ?
      `);
      stmt.run(accountUuid, uuid);
    } catch (error) {
      console.error("Error deleting reminder group:", error);
      throw error;
    }
  }

  async getAll(accountUuid: string,): Promise<ReminderTemplateGroup[]> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminder_groups WHERE account_uuid = ?
      `);
      const rows = stmt.all(accountUuid);
      return await Promise.all(rows.map(async (row: any) => await this.mapRowToReminderTemplateGroup(row)));
    } catch (error) {
      console.error("Error getting all reminder groups:", error);
      throw error;
    }
  }

  async getById(accountUuid: string, uuid: string): Promise<ReminderTemplateGroup | null> {
    try {
      const db = await this.getDb();
      const stmt = db.prepare(`
        SELECT * FROM reminder_groups WHERE account_uuid = ? AND uuid = ?
      `);
      const row = stmt.get(accountUuid, uuid);
      return row ? await this.mapRowToReminderTemplateGroup(row) : null;
    } catch (error) {
      console.error("Error getting reminder group by uuid:", error);
      throw error;
    }
  }

  /**
   * 将数据库行映射为 ReminderTemplateGroup 实体，并查询组内模板
   */
  private async mapRowToReminderTemplateGroup(row: any): Promise<ReminderTemplateGroup> {
    const templateGroup = ReminderTemplateGroup.fromDTO({
      uuid: row.uuid,
      name: row.name,
      enabled: !!row.enabled,
      enableMode: row.enable_mode,
    });
    return templateGroup;
  }
}