import type { Database } from 'better-sqlite3';
import { getDatabase } from "../../../../shared/database/index";
import type { ITaskMetaTemplateRepository } from '../../domain/repositories/iTaskMetaTemplateRepository';
import { TaskMetaTemplate } from '../../domain/aggregates/taskMetaTemplate';
import type { TResponse } from '@/shared/types/response';

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
  private toDbRecord(metaTemplate: TaskMetaTemplate, accountUuid: string): any {
    const json = metaTemplate.toDTO();
    return {
      uuid: json.uuid,
      account_uuid: accountUuid,
      name: json.name,
      description: json.description,
      category_uuid: json.category,
      default_time_config: JSON.stringify(json.defaultTimeConfig),
      default_reminder_config: JSON.stringify(json.defaultReminderConfig),
      default_metadata: JSON.stringify(json.defaultMetadata),
      lifecycle: JSON.stringify(json.lifecycle),
      created_at: json.lifecycle.createdAt,
      updated_at: json.lifecycle.updatedAt
    };
  }

  /**
   * 将数据库记录转换为 TaskMetaTemplate 实体
   */
  private fromDbRecord(record: any): TaskMetaTemplate {
    const metaTemplateData = {
      uuid: record.uuid,
      name: record.name,
      description: record.description,
      category: record.category_uuid,
      defaultTimeConfig: JSON.parse(record.default_time_config),
      defaultReminderConfig: JSON.parse(record.default_reminder_config),
      defaultMetadata: JSON.parse(record.default_metadata),
      lifecycle: JSON.parse(record.lifecycle)
    };

    return TaskMetaTemplate.fromCompleteData(metaTemplateData);
  }

  /**
   * 保存 TaskMetaTemplate
   */
  async save(accountUuid: string, metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
    try {
      const db = await this.getDB();
      const record = this.toDbRecord(metaTemplate, accountUuid);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_meta_templates (
          uuid, account_uuid, name, description, category_uuid,
          default_time_config, default_reminder_config, default_metadata,
          lifecycle, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        record.uuid, record.account_uuid, record.name, record.description,
        record.category_uuid, record.default_time_config, record.default_reminder_config,
        record.default_metadata, record.lifecycle, record.created_at, record.updated_at
      );

      return {
        success: true,
        data: metaTemplate,
        message: 'TaskMetaTemplate 保存成功'
      };
    } catch (error) {
      console.error('保存 TaskMetaTemplate 失败:', error);
      return {
        success: false,
        data: metaTemplate,
        message: `保存失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据 ID 查找 TaskMetaTemplate
   */
  async findById(accountUuid: string, uuid: string): Promise<TResponse<TaskMetaTemplate>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_meta_templates 
        WHERE uuid = ? AND account_uuid = ?
      `);
      
      const record = stmt.get(uuid, accountUuid);
      
      if (record) {
        const metaTemplate = this.fromDbRecord(record);
        return {
          success: true,
          data: metaTemplate,
          message: 'TaskMetaTemplate 查找成功'
        };
      } else {
        return {
          success: false,
          data: null as any,
          message: `未找到 ID 为 ${uuid} 的 TaskMetaTemplate`
        };
      }
    } catch (error) {
      console.error('查找 TaskMetaTemplate 失败:', error);
      return {
        success: false,
        data: null as any,
        message: `查找失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取所有 TaskMetaTemplate
   */
  async findAll(accountUuid: string): Promise<TResponse<TaskMetaTemplate[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_meta_templates 
        WHERE account_uuid = ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(accountUuid);
      const metaTemplates = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: metaTemplates,
        message: `找到 ${metaTemplates.length} 个 TaskMetaTemplate`
      };
    } catch (error) {
      console.error('获取所有 TaskMetaTemplate 失败:', error);
      return {
        success: false,
        data: [],
        message: `获取失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据分类查找 TaskMetaTemplate
   */
  async findByCategory(accountUuid: string, category: string): Promise<TResponse<TaskMetaTemplate[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_meta_templates 
        WHERE account_uuid = ? AND category_uuid = ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(accountUuid, category);
      const metaTemplates = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: metaTemplates,
        message: `找到 ${metaTemplates.length} 个 ${category} 分类的 TaskMetaTemplate`
      };
    } catch (error) {
      console.error('根据分类查找 TaskMetaTemplate 失败:', error);
      return {
        success: false,
        data: [],
        message: `查找失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 更新 TaskMetaTemplate
   */
  async update(accountUuid: string, metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
    try {
      const db = await this.getDB();
      const record = this.toDbRecord(metaTemplate, accountUuid);

      const stmt = db.prepare(`
        UPDATE task_meta_templates SET
          name = ?, description = ?, category_uuid = ?,
          default_time_config = ?, default_reminder_config = ?, default_metadata = ?,
          lifecycle = ?, updated_at = ?
        WHERE uuid = ? AND account_uuid = ?
      `);

      const result = stmt.run(
        record.name, record.description, record.category_uuid,
        record.default_time_config, record.default_reminder_config, record.default_metadata,
        record.lifecycle, record.updated_at,
        record.uuid, record.account_uuid
      );

      if (result.changes > 0) {
        return {
          success: true,
          data: metaTemplate,
          message: 'TaskMetaTemplate 更新成功'
        };
      } else {
        return {
          success: false,
          data: metaTemplate,
          message: `未找到要更新的 TaskMetaTemplate (ID: ${metaTemplate.uuid})`
        };
      }
    } catch (error) {
      console.error('更新 TaskMetaTemplate 失败:', error);
      return {
        success: false,
        data: metaTemplate,
        message: `更新失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除 TaskMetaTemplate
   */
  async delete(accountUuid: string, uuid: string): Promise<TResponse<boolean>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        DELETE FROM task_meta_templates 
        WHERE uuid = ? AND account_uuid = ?
      `);
      
      const result = stmt.run(uuid, accountUuid);

      if (result.changes > 0) {
        return {
          success: true,
          data: true,
          message: 'TaskMetaTemplate 删除成功'
        };
      } else {
        return {
          success: false,
          data: false,
          message: `未找到要删除的 TaskMetaTemplate (ID: ${uuid})`
        };
      }
    } catch (error) {
      console.error('删除 TaskMetaTemplate 失败:', error);
      return {
        success: false,
        data: false,
        message: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}