import type { Database } from 'better-sqlite3';
import { getDatabase } from "../../../../shared/database/index";
import type { ITaskMetaTemplateRepository } from '../../domain/repositories/iTaskMetaTemplateRepository';
import { TaskMetaTemplate } from '../../domain/aggregates/taskMetaTemplate';

/**
 * TaskMetaTemplate 数据库仓库实现
 * 直接使用数据库进行数据持久化
 */
export class TaskMetaTemplateDatabaseRepository implements ITaskMetaTemplateRepository {
  private db: Database | null = null;

  /**
   * 获取数据库实例
   */
  private async getDB(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 将 TaskMetaTemplate 实体转换为数据库记录
   */
  private mapTaskMetaTemplateToRow(metaTemplate: TaskMetaTemplate, accountUuid: string): any {
    const metaTemplateDTO = metaTemplate.toDTO();
    return {
      uuid: metaTemplateDTO.uuid,
      account_uuid: accountUuid,
      name: metaTemplateDTO.name,
      description: metaTemplateDTO.description,
      category_uuid: metaTemplateDTO.category,
      icon: metaTemplateDTO.icon,
      color: metaTemplateDTO.color,
      default_time_config: JSON.stringify(metaTemplateDTO.defaultTimeConfig),
      default_reminder_config: JSON.stringify(metaTemplateDTO.defaultReminderConfig),
      default_metadata: JSON.stringify(metaTemplateDTO.defaultMetadata),
      created_at: metaTemplateDTO.lifecycle.createdAt,
      updated_at: metaTemplateDTO.lifecycle.updatedAt
    };
  }

  /**
   * 将数据库记录转换为 TaskMetaTemplate 实体
   */
  private mapRowToTaskMetaTemplate(record: any): TaskMetaTemplate {
    const lifecycleDTO = {
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
    const metaTemplateData = {
      uuid: record.uuid,
      name: record.name,
      description: record.description,
      category: record.category_uuid,
      icon: record.icon,
      color: record.color,
      defaultTimeConfig: JSON.parse(record.default_time_config),
      defaultReminderConfig: JSON.parse(record.default_reminder_config),
      defaultMetadata: JSON.parse(record.default_metadata),
      lifecycle: lifecycleDTO,
    };

    return TaskMetaTemplate.fromDTO(metaTemplateData);
  }

 /**
   * 保存 TaskMetaTemplate
   */
  async save(accountUuid: string, metaTemplate: TaskMetaTemplate): Promise<TaskMetaTemplate> {
    const db = await this.getDB();
    const record = this.mapTaskMetaTemplateToRow(metaTemplate, accountUuid);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO task_meta_templates (
        uuid, account_uuid, name, description, category_uuid,
        icon, color, default_time_config, default_reminder_config, default_metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.uuid, record.account_uuid, record.name, record.description, record.category_uuid,
      record.icon, record.color, record.default_time_config, record.default_reminder_config,
      record.default_metadata, record.created_at, record.updated_at
    );

    return metaTemplate;
  }

  /**
   * 根据 ID 查找 TaskMetaTemplate
   */
  async findById(accountUuid: string, uuid: string): Promise<TaskMetaTemplate> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      SELECT * FROM task_meta_templates 
      WHERE uuid = ? AND account_uuid = ?
    `);

    const record = stmt.get(uuid, accountUuid);

    if (record) {
      return this.mapRowToTaskMetaTemplate(record);
    } else {
      return []as any;
    }
  }

  /**
   * 获取所有 TaskMetaTemplate
   */
  async findAll(accountUuid: string): Promise<TaskMetaTemplate[]> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      SELECT * FROM task_meta_templates 
      WHERE account_uuid = ?
      ORDER BY created_at DESC
    `);

    const records = stmt.all(accountUuid);
    return records.map(record => this.mapRowToTaskMetaTemplate(record));
  }

  /**
   * 根据分类查找 TaskMetaTemplate
   */
  async findByCategory(accountUuid: string, category: string): Promise<TaskMetaTemplate[]> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      SELECT * FROM task_meta_templates 
      WHERE account_uuid = ? AND category_uuid = ?
      ORDER BY created_at DESC
    `);

    const records = stmt.all(accountUuid, category);
    return records.map(record => this.mapRowToTaskMetaTemplate(record));
  }

  /**
   * 更新 TaskMetaTemplate
   */
  async update(accountUuid: string, metaTemplate: TaskMetaTemplate): Promise<TaskMetaTemplate> {
    const db = await this.getDB();
    const record = this.mapTaskMetaTemplateToRow(metaTemplate, accountUuid);

    const stmt = db.prepare(`
      UPDATE task_meta_templates SET
        name = ?, description = ?, category_uuid = ?,
        icon = ?, color = ?, default_time_config = ?, default_reminder_config = ?, default_metadata = ?,
        created_at = ?, updated_at = ?
      WHERE uuid = ? AND account_uuid = ?
    `);

    stmt.run(
      record.name, record.description, record.category_uuid,
      record.icon, record.color, record.default_time_config, record.default_reminder_config,
      record.default_metadata, record.created_at, record.updated_at,

      record.uuid, record.account_uuid
    );

    return metaTemplate;
  }

  /**
   * 删除 TaskMetaTemplate
   */
  async delete(accountUuid: string, uuid: string): Promise<boolean> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      DELETE FROM task_meta_templates 
      WHERE uuid = ? AND account_uuid = ?
    `);

    const result = stmt.run(uuid, accountUuid);

    return result.changes > 0;
  }
}