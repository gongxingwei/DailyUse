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
  private currentUsername: string | null = null;

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
   * 设置当前用户
   */
  public setCurrentUser(username: string): void {
    this.currentUsername = username;
  }

  /**
   * 获取当前用户名
   */
  private getCurrentUsername(): string {
    if (!this.currentUsername) {
      throw new Error('Current username not set. Call setCurrentUser() first.');
    }
    return this.currentUsername;
  }

  /**
   * 将 TaskMetaTemplate 实体转换为数据库记录
   */
  private toDbRecord(metaTemplate: TaskMetaTemplate): any {
    const json = metaTemplate.toDTO();
    return {
      id: json.id,
      username: this.getCurrentUsername(),
      name: json.name,
      description: json.description,
      category: json.category,
      default_time_config: JSON.stringify(json.defaultTimeConfig),
      default_reminder_config: JSON.stringify(json.defaultReminderConfig),
      default_metadata: JSON.stringify(json.defaultMetadata),
      lifecycle: JSON.stringify(json.lifecycle),
      created_at: new Date(json.lifecycle.createdAt.isoString).getTime(),
      updated_at: new Date(json.lifecycle.updatedAt.isoString).getTime()
    };
  }

  /**
   * 将数据库记录转换为 TaskMetaTemplate 实体
   */
  private fromDbRecord(record: any): TaskMetaTemplate {
    const metaTemplateData = {
      id: record.id,
      name: record.name,
      description: record.description,
      category: record.category,
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
  async save(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
    try {
      const db = await this.getDB();
      const record = this.toDbRecord(metaTemplate);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_meta_templates (
          id, username, name, description, category,
          default_time_config, default_reminder_config, default_metadata,
          lifecycle, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        record.id, record.username, record.name, record.description,
        record.category, record.default_time_config, record.default_reminder_config,
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
  async findById(id: string): Promise<TResponse<TaskMetaTemplate>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_meta_templates 
        WHERE id = ? AND username = ?
      `);
      
      const record = stmt.get(id, this.getCurrentUsername());
      
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
          message: `未找到 ID 为 ${id} 的 TaskMetaTemplate`
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
  async findAll(): Promise<TResponse<TaskMetaTemplate[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_meta_templates 
        WHERE username = ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(this.getCurrentUsername());
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
  async findByCategory(category: string): Promise<TResponse<TaskMetaTemplate[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_meta_templates 
        WHERE username = ? AND category = ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(this.getCurrentUsername(), category);
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
  async update(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
    try {
      const db = await this.getDB();
      const record = this.toDbRecord(metaTemplate);

      const stmt = db.prepare(`
        UPDATE task_meta_templates SET
          name = ?, description = ?, category = ?,
          default_time_config = ?, default_reminder_config = ?, default_metadata = ?,
          lifecycle = ?, updated_at = ?
        WHERE id = ? AND username = ?
      `);

      const result = stmt.run(
        record.name, record.description, record.category,
        record.default_time_config, record.default_reminder_config, record.default_metadata,
        record.lifecycle, record.updated_at,
        record.id, record.username
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
          message: `未找到要更新的 TaskMetaTemplate (ID: ${metaTemplate.id})`
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
  async delete(id: string): Promise<TResponse<boolean>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        DELETE FROM task_meta_templates 
        WHERE id = ? AND username = ?
      `);
      
      const result = stmt.run(id, this.getCurrentUsername());

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
          message: `未找到要删除的 TaskMetaTemplate (ID: ${id})`
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
