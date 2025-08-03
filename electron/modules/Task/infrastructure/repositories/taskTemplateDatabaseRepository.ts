import type { Database } from 'better-sqlite3';
import { getDatabase } from "../../../../shared/database/index";
import type { ITaskTemplateRepository } from '../../domain/repositories/iTaskTemplateRepository';
import { TaskTemplate } from '../../domain/aggregates/taskTemplate';
import type { TResponse } from '@/shared/types/response';

/**
 * TaskTemplate 数据库仓库实现
 * 直接使用数据库进行数据持久化
 */
export class TaskTemplateDatabaseRepository implements ITaskTemplateRepository {
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
   * 将 TaskTemplate 实体转换为数据库记录
   */
  private mapTemplateToRow(template: TaskTemplate, accountUuid: string): any {

    try {
      const json = template.toDTO();
      console.log('✅ [数据库仓库] template.toDTO()调用成功');
      
      const record = {
        uuid: json.uuid,
        account_uuid: accountUuid,
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
        created_at: json.lifecycle.createdAt,
        updated_at: json.lifecycle.updatedAt
      };
      
      try {
        JSON.stringify(record);
        console.log('✅ [数据库仓库] 数据库记录可序列化');
      } catch (error) {
        console.error('❌ [数据库仓库] 数据库记录不可序列化:', error);
        throw error;
      }
      
      return record;
    } catch (error) {
      console.error('❌ [数据库仓库] toDbRecord过程中发生错误:', error);
      console.error('❌ [数据库仓库] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  /**
   * 将数据库记录转换为 TaskTemplate 实体
   */
  private mapRowToTemplate(record: any): TaskTemplate {
    try {
      const templateData = {
        uuid: record.uuid,
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
      
      console.log('✅ [数据库仓库] 模板数据解析成功');
      console.log('🔍 [数据库仓库] 解析后的数据:', templateData);

      const template = TaskTemplate.fromDTO(templateData);
      console.log('✅ [数据库仓库] TaskTemplate.fromDTO()调用成功');
      console.log('🔍 [数据库仓库] 创建的template类型:', typeof template);
      console.log('🔍 [数据库仓库] 是否为TaskTemplate实例:', template instanceof TaskTemplate);
      
      // 验证创建的实体是否可以转换为DTO
      try {
        const testDto = template.toDTO();
        JSON.stringify(testDto);
        console.log('✅ [数据库仓库] 创建的实体可转换为可序列化的DTO');
      } catch (error) {
        console.error('❌ [数据库仓库] 创建的实体无法转换为可序列化的DTO:', error);
        throw error;
      }
      
      return template;
    } catch (error) {
      console.error('❌ [数据库仓库] fromDbRecord过程中发生错误:', error);
      console.error('❌ [数据库仓库] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  /**
   * 保存 TaskTemplate
   * 流程第4步：数据库仓库 - 将领域实体保存到数据库
   */
  async save(accountUuid: string, template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    console.log('🔄 [主进程-步骤4] 数据库仓库：开始保存TaskTemplate');
    console.log('🔍 [主进程-步骤4] accountUuid:', accountUuid);
    console.log('🔍 [主进程-步骤4] 输入的template类型:', typeof template);
    console.log('🔍 [主进程-步骤4] 是否为TaskTemplate实例:', template instanceof TaskTemplate);
    console.log('🔍 [主进程-步骤4] Template ID:', template.uuid);
    
    try {
      const db = await this.getDB();
      const record = this.mapTemplateToRow(template, accountUuid);
      console.log('✅ [主进程-步骤4] 实体转换为数据库记录成功');

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_templates (
          uuid, account_uuid, title, description, time_config, reminder_config,
          scheduling_policy, metadata, lifecycle, analytics, key_result_links,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      console.log('🔄 [主进程-步骤4] 执行数据库插入操作');
      stmt.run(
        record.uuid, record.account_uuid, record.title, record.description,
        record.time_config, record.reminder_config, record.scheduling_policy,
        record.metadata, record.lifecycle, record.analytics,
        record.key_result_links, record.version, record.created_at, record.updated_at
      );
      console.log('✅ [主进程-步骤4] 数据库插入操作成功');

      // 验证返回的template对象
      console.log('🔄 [主进程-步骤4] 验证返回的template对象');

      const result = {
        success: true,
        data: template,
        message: 'TaskTemplate 保存成功'
      };

      return result;
    } catch (error) {
      console.error('❌ [主进程-步骤4] 保存 TaskTemplate 失败:', error);
      console.error('❌ [主进程-步骤4] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
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
  async saveAll(accountUuid: string, templates: TaskTemplate[]): Promise<TResponse<TaskTemplate[]>> {
    try {
      const db = await this.getDB();
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_templates (
          uuid, account_uuid, title, description, time_config, reminder_config,
          scheduling_policy, metadata, lifecycle, analytics, key_result_links,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        for (const template of templates) {
          const record = this.mapTemplateToRow(template, accountUuid);
          stmt.run(
            record.uuid, record.account_uuid, record.title, record.description,
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
  async findById(accountUuid: string, uuid: string): Promise<TResponse<TaskTemplate>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE uuid = ? AND account_uuid = ?
      `);
      
      const record = stmt.get(uuid, accountUuid);
      
      if (record) {
        const template = this.mapRowToTemplate(record);
        return {
          success: true,
          data: template,
          message: 'TaskTemplate 查找成功'
        };
      } else {
        return {
          success: false,
          data: null as any,
          message: `未找到 ID 为 ${uuid} 的 TaskTemplate`
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
  async findAll(accountUuid: string): Promise<TResponse<TaskTemplate[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE account_uuid = ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(accountUuid);
      const templates = records.map(record => this.mapRowToTemplate(record));

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
  async update(accountUuid: string, template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    try {
      const db = await this.getDB();
      const record = this.mapTemplateToRow(template, accountUuid);

      const stmt = db.prepare(`
        UPDATE task_templates SET
          title = ?, description = ?, time_config = ?, reminder_config = ?,
          scheduling_policy = ?, metadata = ?, lifecycle = ?, analytics = ?,
          key_result_links = ?, version = ?, updated_at = ?
        WHERE uuid = ? AND account_uuid = ?
      `);

      const result = stmt.run(
        record.title, record.description, record.time_config, record.reminder_config,
        record.scheduling_policy, record.metadata, record.lifecycle, record.analytics,
        record.key_result_links, record.version, record.updated_at,
        record.uuid, record.account_uuid
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
          message: `未找到要更新的 TaskTemplate (ID: ${template.uuid})`
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
  async delete(accountUuid: string, uuid: string): Promise<TResponse<boolean>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        DELETE FROM task_templates 
        WHERE uuid = ? AND account_uuid = ?
      `);
      
      const result = stmt.run(uuid, accountUuid);

      return {
        success: result.changes > 0,
        data: result.changes > 0,
        message: result.changes > 0 ? 'TaskTemplate 删除成功' : `未找到要删除的 TaskTemplate (ID: ${uuid})`
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
  async findByKeyResult(accountUuid: string, goalUuid: string, keyResultId: string): Promise<TResponse<TaskTemplate[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE account_uuid = ? AND key_result_links LIKE ? AND key_result_links LIKE ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(
        accountUuid,
        `%"goalUuid":"${goalUuid}"%`,
        `%"keyResultId":"${keyResultId}"%`
      );
      
      const templates = records.map(record => this.mapRowToTemplate(record));

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