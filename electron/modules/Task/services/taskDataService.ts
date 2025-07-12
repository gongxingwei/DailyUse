import type { Database } from 'better-sqlite3';
import { getDatabase } from "../../../../shared/database/index";
import type { TResponse } from '@/shared/types/response';

/**
 * 主进程任务数据服务
 * 直接操作数据库，不需要抽象仓库层
 */
export class TaskDataService {
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

  private getCurrentUsername(): string {
    if (!this.currentUsername) {
      throw new Error('Current username not set. Call setCurrentUser() first.');
    }
    return this.currentUsername;
  }

  // ====== TaskTemplate 相关方法 ======

  /**
   * 保存任务模板
   */
  async saveTaskTemplate(templateData: any): Promise<TResponse<any>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_templates 
        (id, username, title, description, time_config, reminder_config, 
         scheduling_policy, metadata, lifecycle, analytics, key_result_links, 
         version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = Date.now();
      const result = stmt.run(
        templateData.id,
        this.getCurrentUsername(),
        templateData.title,
        templateData.description,
        JSON.stringify(templateData.timeConfig),
        JSON.stringify(templateData.reminderConfig),
        JSON.stringify(templateData.schedulingPolicy),
        JSON.stringify(templateData.metadata),
        JSON.stringify(templateData.lifecycle),
        JSON.stringify(templateData.analytics),
        templateData.keyResultLinks ? JSON.stringify(templateData.keyResultLinks) : null,
        templateData.version,
        templateData.lifecycle?.createdAt || now,
        now
      );

      return {
        success: true,
        data: templateData,
        message: 'TaskTemplate 保存成功'
      };
    } catch (error) {
      console.error('保存 TaskTemplate 失败:', error);
      return {
        success: false,
        data: templateData,
        message: `保存失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 查找所有任务模板
   */
  async findAllTaskTemplates(): Promise<TResponse<any[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE username = ?
        ORDER BY created_at DESC
      `);
      
      const rows = stmt.all(this.getCurrentUsername()) as any[];
      const templates = rows.map(row => this.deserializeTaskTemplate(row));

      return {
        success: true,
        data: templates,
        message: `找到 ${templates.length} 个 TaskTemplate`
      };
    } catch (error) {
      console.error('查询 TaskTemplate 失败:', error);
      return {
        success: false,
        data: [],
        message: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据 ID 查找任务模板
   */
  async findTaskTemplateById(id: string): Promise<TResponse<any>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE id = ? AND username = ?
      `);
      
      const row = stmt.get(id, this.getCurrentUsername()) as any;

      if (row) {
        const template = this.deserializeTaskTemplate(row);
        return {
          success: true,
          data: template,
          message: 'TaskTemplate 查询成功'
        };
      }

      return {
        success: false,
        message: `未找到 ID 为 ${id} 的 TaskTemplate`
      };
    } catch (error) {
      console.error('查询 TaskTemplate 失败:', error);
      return {
        success: false,
        message: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(id: string): Promise<TResponse<boolean>> {
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

  // ====== TaskInstance 相关方法 ======

  /**
   * 保存任务实例
   */
  async saveTaskInstance(instanceData: any): Promise<TResponse<any>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_instances 
        (id, username, template_id, title, description, time_config, 
         actual_start_time, actual_end_time, key_result_links, priority, 
         status, completed_at, reminder_status, lifecycle, metadata, 
         version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = Date.now();
      const result = stmt.run(
        instanceData.id,
        this.getCurrentUsername(),
        instanceData.templateId,
        instanceData.title,
        instanceData.description,
        JSON.stringify(instanceData.timeConfig),
        instanceData.actualStartTime,
        instanceData.actualEndTime,
        instanceData.keyResultLinks ? JSON.stringify(instanceData.keyResultLinks) : null,
        instanceData.priority,
        instanceData.status,
        instanceData.completedAt,
        JSON.stringify(instanceData.reminderStatus),
        JSON.stringify(instanceData.lifecycle),
        JSON.stringify(instanceData.metadata),
        instanceData.version,
        instanceData.lifecycle?.createdAt || now,
        now
      );

      return {
        success: true,
        data: instanceData,
        message: 'TaskInstance 保存成功'
      };
    } catch (error) {
      console.error('保存 TaskInstance 失败:', error);
      return {
        success: false,
        data: instanceData,
        message: `保存失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 查找所有任务实例
   */
  async findAllTaskInstances(): Promise<TResponse<any[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE username = ?
        ORDER BY created_at DESC
      `);
      
      const rows = stmt.all(this.getCurrentUsername()) as any[];
      const instances = rows.map(row => this.deserializeTaskInstance(row));

      return {
        success: true,
        data: instances,
        message: `找到 ${instances.length} 个 TaskInstance`
      };
    } catch (error) {
      console.error('查询 TaskInstance 失败:', error);
      return {
        success: false,
        data: [],
        message: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据 ID 查找任务实例
   */
  async findTaskInstanceById(id: string): Promise<TResponse<any>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE id = ? AND username = ?
      `);
      
      const row = stmt.get(id, this.getCurrentUsername()) as any;

      if (row) {
        const instance = this.deserializeTaskInstance(row);
        return {
          success: true,
          data: instance,
          message: 'TaskInstance 查询成功'
        };
      }

      return {
        success: false,
        message: `未找到 ID 为 ${id} 的 TaskInstance`
      };
    } catch (error) {
      console.error('查询 TaskInstance 失败:', error);
      return {
        success: false,
        message: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 查找今日任务实例
   */
  async findTodayTaskInstances(): Promise<TResponse<any[]>> {
    try {
      const db = await this.getDB();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE username = ? 
        AND JSON_EXTRACT(time_config, '$.scheduledTime.timestamp') >= ?
        AND JSON_EXTRACT(time_config, '$.scheduledTime.timestamp') <= ?
        ORDER BY JSON_EXTRACT(time_config, '$.scheduledTime.timestamp')
      `);
      
      const rows = stmt.all(this.getCurrentUsername(), startOfDay, endOfDay) as any[];
      const instances = rows.map(row => this.deserializeTaskInstance(row));

      return {
        success: true,
        data: instances,
        message: `找到今日 ${instances.length} 个 TaskInstance`
      };
    } catch (error) {
      console.error('查询今日 TaskInstance 失败:', error);
      return {
        success: false,
        data: [],
        message: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // ====== 序列化/反序列化方法 ======

  private deserializeTaskTemplate(row: any): any {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      timeConfig: JSON.parse(row.time_config),
      reminderConfig: JSON.parse(row.reminder_config),
      schedulingPolicy: JSON.parse(row.scheduling_policy),
      metadata: JSON.parse(row.metadata),
      lifecycle: JSON.parse(row.lifecycle),
      analytics: JSON.parse(row.analytics),
      keyResultLinks: row.key_result_links ? JSON.parse(row.key_result_links) : undefined,
      version: row.version
    };
  }

  private deserializeTaskInstance(row: any): any {
    return {
      id: row.id,
      templateId: row.template_id,
      title: row.title,
      description: row.description,
      timeConfig: JSON.parse(row.time_config),
      actualStartTime: row.actual_start_time,
      actualEndTime: row.actual_end_time,
      keyResultLinks: row.key_result_links ? JSON.parse(row.key_result_links) : undefined,
      priority: row.priority,
      status: row.status,
      completedAt: row.completed_at,
      reminderStatus: JSON.parse(row.reminder_status),
      lifecycle: JSON.parse(row.lifecycle),
      metadata: JSON.parse(row.metadata),
      version: row.version
    };
  }
}
