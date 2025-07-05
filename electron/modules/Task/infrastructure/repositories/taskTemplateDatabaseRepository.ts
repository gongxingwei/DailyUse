import type { Database } from 'better-sqlite3';
import { getDatabase } from '@electron/config/database';
import type { ITaskTemplateRepository } from '../../domain/repositories/iTaskTemplateRepository';
import { TaskTemplate } from '../../domain/entities/taskTemplate';
import type { TResponse } from '@/shared/types/response';

/**
 * TaskTemplate 数据库仓库实现
 * 直接使用数据库进行数据持久化
 */
export class TaskTemplateDatabaseRepository implements ITaskTemplateRepository {
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
   * 将 TaskTemplate 实体转换为数据库记录
   */
  private toDbRecord(template: TaskTemplate): any {
    const json = template.toJSON();
    return {
      id: json.id,
      username: this.getCurrentUsername(),
      title: json.title,
      description: json.description,
      time_config: JSON.stringify(json.timeConfig),
      reminder_config: JSON.stringify(json.reminderConfig),
      scheduling_policy: JSON.stringify(json.schedulingPolicy),
      metadata: JSON.stringify(json.metadata),
      lifecycle: JSON.stringify(json.lifecycle),
      analytics: JSON.stringify(json.analytics),
      key_result_links: json.keyResultLinks ? JSON.stringify(json.keyResultLinks) : null,
      version: json.version,
      created_at: new Date(json.lifecycle.createdAt.isoString).getTime(),
      updated_at: new Date(json.lifecycle.updatedAt.isoString).getTime()
    };
  }

  /**
   * 将数据库记录转换为 TaskTemplate 实体
   */
  private fromDbRecord(record: any): TaskTemplate {
    const templateData = {
      id: record.id,
      title: record.title,
      description: record.description,
      timeConfig: JSON.parse(record.time_config),
      reminderConfig: JSON.parse(record.reminder_config),
      schedulingPolicy: JSON.parse(record.scheduling_policy),
      metadata: JSON.parse(record.metadata),
      lifecycle: JSON.parse(record.lifecycle),
      analytics: JSON.parse(record.analytics),
      keyResultLinks: record.key_result_links ? JSON.parse(record.key_result_links) : undefined,
      version: record.version
    };

    return TaskTemplate.fromCompleteData(templateData);
  }

  /**
   * 保存 TaskTemplate
   */
  async save(template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    try {
      const db = await this.getDB();
      const record = this.toDbRecord(template);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_templates (
          id, username, title, description, time_config, reminder_config,
          scheduling_policy, metadata, lifecycle, analytics, key_result_links,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        record.id, record.username, record.title, record.description,
        record.time_config, record.reminder_config, record.scheduling_policy,
        record.metadata, record.lifecycle, record.analytics,
        record.key_result_links, record.version, record.created_at, record.updated_at
      );

      return {
        success: true,
        data: template,
        message: 'TaskTemplate 保存成功'
      };
    } catch (error) {
      console.error('保存 TaskTemplate 失败:', error);
      return {
        success: false,
        data: template,
        message: `保存失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 批量保存 TaskTemplate
   */
  async saveAll(templates: TaskTemplate[]): Promise<TResponse<TaskTemplate[]>> {
    try {
      const db = await this.getDB();
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_templates (
          id, username, title, description, time_config, reminder_config,
          scheduling_policy, metadata, lifecycle, analytics, key_result_links,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        for (const template of templates) {
          const record = this.toDbRecord(template);
          stmt.run(
            record.id, record.username, record.title, record.description,
            record.time_config, record.reminder_config, record.scheduling_policy,
            record.metadata, record.lifecycle, record.analytics,
            record.key_result_links, record.version, record.created_at, record.updated_at
          );
        }
      });

      transaction();

      return {
        success: true,
        data: templates,
        message: `成功保存 ${templates.length} 个 TaskTemplate`
      };
    } catch (error) {
      console.error('批量保存 TaskTemplate 失败:', error);
      return {
        success: false,
        data: templates,
        message: `批量保存失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据 ID 查找 TaskTemplate
   */
  async findById(id: string): Promise<TResponse<TaskTemplate>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE id = ? AND username = ?
      `);
      
      const record = stmt.get(id, this.getCurrentUsername());
      
      if (record) {
        const template = this.fromDbRecord(record);
        return {
          success: true,
          data: template,
          message: 'TaskTemplate 查找成功'
        };
      } else {
        return {
          success: false,
          data: null as any,
          message: `未找到 ID 为 ${id} 的 TaskTemplate`
        };
      }
    } catch (error) {
      console.error('查找 TaskTemplate 失败:', error);
      return {
        success: false,
        data: null as any,
        message: `查找失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取所有 TaskTemplate
   */
  async findAll(): Promise<TResponse<TaskTemplate[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE username = ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(this.getCurrentUsername());
      const templates = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: templates,
        message: `找到 ${templates.length} 个 TaskTemplate`
      };
    } catch (error) {
      console.error('获取所有 TaskTemplate 失败:', error);
      return {
        success: false,
        data: [],
        message: `获取失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 更新 TaskTemplate
   */
  async update(template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    try {
      const db = await this.getDB();
      const record = this.toDbRecord(template);

      const stmt = db.prepare(`
        UPDATE task_templates SET
          title = ?, description = ?, time_config = ?, reminder_config = ?,
          scheduling_policy = ?, metadata = ?, lifecycle = ?, analytics = ?,
          key_result_links = ?, version = ?, updated_at = ?
        WHERE id = ? AND username = ?
      `);

      const result = stmt.run(
        record.title, record.description, record.time_config, record.reminder_config,
        record.scheduling_policy, record.metadata, record.lifecycle, record.analytics,
        record.key_result_links, record.version, record.updated_at,
        record.id, record.username
      );

      if (result.changes > 0) {
        return {
          success: true,
          data: template,
          message: 'TaskTemplate 更新成功'
        };
      } else {
        return {
          success: false,
          data: template,
          message: `未找到要更新的 TaskTemplate (ID: ${template.id})`
        };
      }
    } catch (error) {
      console.error('更新 TaskTemplate 失败:', error);
      return {
        success: false,
        data: template,
        message: `更新失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除 TaskTemplate
   */
  async delete(id: string): Promise<TResponse<boolean>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        DELETE FROM task_templates 
        WHERE id = ? AND username = ?
      `);
      
      const result = stmt.run(id, this.getCurrentUsername());

      return {
        success: result.changes > 0,
        data: result.changes > 0,
        message: result.changes > 0 ? 'TaskTemplate 删除成功' : `未找到要删除的 TaskTemplate (ID: ${id})`
      };
    } catch (error) {
      console.error('删除 TaskTemplate 失败:', error);
      return {
        success: false,
        data: false,
        message: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据关键结果查找 TaskTemplate
   */
  async findByKeyResult(goalId: string, keyResultId: string): Promise<TResponse<TaskTemplate[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE username = ? AND key_result_links LIKE ? AND key_result_links LIKE ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(
        this.getCurrentUsername(),
        `%"goalId":"${goalId}"%`,
        `%"keyResultId":"${keyResultId}"%`
      );
      
      const templates = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: templates,
        message: `找到 ${templates.length} 个相关 TaskTemplate`
      };
    } catch (error) {
      console.error('根据关键结果查找 TaskTemplate 失败:', error);
      return {
        success: false,
        data: [],
        message: `查找失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}
