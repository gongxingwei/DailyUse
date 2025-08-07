import type { Database } from "better-sqlite3";
import { getDatabase } from "../../../../shared/database/index";
// interfaces
import type { ITaskTemplateRepository } from "../../domain/repositories/iTaskTemplateRepository";
import { ITaskTemplateDTO } from "@common/modules/task/types/task";
// domains
import { TaskTemplate } from "../../domain/aggregates/taskTemplate";


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
      const templateDTO: ITaskTemplateDTO = template.toDTO();
      console.log("✅ [数据库仓库] template.toDTO()调用成功");

      const record = {
        uuid: templateDTO.uuid,
        account_uuid: accountUuid,
        title: templateDTO.title,
        description: templateDTO.description,
        time_config: JSON.stringify(templateDTO.timeConfig),
        reminder_config: JSON.stringify(templateDTO.reminderConfig),
        scheduling_policy: JSON.stringify(templateDTO.schedulingPolicy),
        metadata: JSON.stringify(templateDTO.metadata),
        status: templateDTO.lifecycle.status,
        created_at: templateDTO.lifecycle.createdAt,
        updated_at: templateDTO.lifecycle.updatedAt,
        activated_at: templateDTO.lifecycle.activatedAt,
        paused_at: templateDTO.lifecycle.pausedAt,
        analytics: JSON.stringify(templateDTO.analytics),
        key_result_links: templateDTO.keyResultLinks
          ? JSON.stringify(templateDTO.keyResultLinks)
          : null,
        version: templateDTO.version,
      };
      return record;
    } catch (error) {
      console.error("❌ [数据库仓库] toDbRecord过程中发生错误:", error);
      throw error;
    }
  }

  /**
   * 将数据库记录转换为 TaskTemplate 实体
   */
  private mapRowToTemplate(record: any): TaskTemplate {
    try {
      const lifecycleDTO = {
        status: record.status,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        activatedAt: record.activated_at,
        pausedAt: record.paused_at,
      };
      const templateData = {
        uuid: record.uuid,
        title: record.title,
        description: record.description,
        timeConfig: JSON.parse(record.time_config),
        reminderConfig: JSON.parse(record.reminder_config),
        schedulingPolicy: JSON.parse(record.scheduling_policy),
        metadata: JSON.parse(record.metadata),
        lifecycle: lifecycleDTO,
        analytics: JSON.parse(record.analytics),
        keyResultLinks: record.key_result_links
          ? JSON.parse(record.key_result_links)
          : undefined,
        version: record.version,
      };

      console.log("🔍 [数据库仓库] 解析后的数据:", templateData);

      const template = TaskTemplate.fromDTO(templateData);
      console.log("✅ [数据库仓库] TaskTemplate.fromDTO()调用成功");

      return template;
    } catch (error) {
      console.error("❌ [数据库仓库] fromDbRecord过程中发生错误:", error);
      console.error(
        "❌ [数据库仓库] 错误堆栈:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      throw error;
    }
  }

  /**
   * 保存 TaskTemplate
   * 流程第4步：数据库仓库 - 将领域实体保存到数据库
   */
  async save(
    accountUuid: string,
    template: TaskTemplate
  ): Promise<TaskTemplate> {
    console.log("🔄 [主进程-步骤4] 数据库仓库：开始保存TaskTemplate");

    try {
      const db = await this.getDB();
      const record = this.mapTemplateToRow(template, accountUuid);
      console.log("✅ [主进程-步骤4] 实体转换为数据库记录成功");

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_templates (
          uuid, account_uuid, title, description, time_config, 
          reminder_config, scheduling_policy, metadata, status, created_at, 
          updated_at, activated_at, paused_at, analytics, key_result_links, 
          version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      console.log("🔄 [主进程-步骤4] 执行数据库插入操作");
      stmt.run(
        record.uuid,
        record.account_uuid,
        record.title,
        record.description,
        record.time_config,
        record.reminder_config,
        record.scheduling_policy,
        record.metadata,
        record.status,
        record.created_at,
        record.updated_at,
        record.activated_at,
        record.paused_at,
        record.analytics,
        record.key_result_links,
        record.version
      );

      const savedTemplate = this.mapRowToTemplate(record);

      return savedTemplate;
    } catch (error) {
      console.error("❌ [主进程-步骤4] 保存TaskTemplate过程中发生错误:", error);
      return null as any;
    }
  }

  /**
   * 批量保存 TaskTemplate
   */
  async saveAll(
    accountUuid: string,
    templates: TaskTemplate[]
  ): Promise<boolean> {
    try {
      const db = await this.getDB();

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_templates (
          uuid, account_uuid, title, description, time_config, 
          reminder_config, scheduling_policy, metadata, status, created_at, 
          updated_at, activated_at, paused_at, analytics, key_result_links, 
          version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        for (const template of templates) {
          const record = this.mapTemplateToRow(template, accountUuid);
          stmt.run(
            record.uuid,
            record.account_uuid,
            record.title,
            record.description,
            record.time_config,
            record.reminder_config,
            record.scheduling_policy,
            record.metadata,
            record.status,
            record.created_at,
            record.updated_at,
            record.activated_at,
            record.paused_at,
            record.analytics,
            record.key_result_links,
            record.version
          );
        }
      });

      transaction();

      return true;
    } catch (error) {
      console.error("批量保存 TaskTemplate 失败:", error);
      return false;
    }
  }

  /**
   * 根据 ID 查找 TaskTemplate
   */
  async findById(
    accountUuid: string,
    uuid: string
  ): Promise<TaskTemplate> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE uuid = ? AND account_uuid = ?
      `);

      const record = stmt.get(uuid, accountUuid);

      if (record) {
        const template = this.mapRowToTemplate(record);
          return template;
      } else {
        return null as any;

      }
    } catch (error) {
      console.error("查找 TaskTemplate 失败:", error);
      return null as any;
    }
  }

  /**
   * 获取所有 TaskTemplate
   */
  async findAll(accountUuid: string): Promise<TaskTemplate[]> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_templates 
        WHERE account_uuid = ?
        ORDER BY created_at DESC
      `);

      const records = stmt.all(accountUuid);
      const templates = records.map((record) => this.mapRowToTemplate(record));

      return templates;
    } catch (error) {
      console.error("获取所有 TaskTemplate 失败:", error);
      return [] as any;  
    }
  }

  /**
   * 更新 TaskTemplate
   */
  async update(
    accountUuid: string,
    template: TaskTemplate
  ): Promise<TaskTemplate> {
    try {
      const db = await this.getDB();
      const record = this.mapTemplateToRow(template, accountUuid);

      const stmt = db.prepare(`
        UPDATE task_templates SET
          title = ?, description = ?, time_config = ?, reminder_config = ?,
          scheduling_policy = ?, metadata = ?, status = ?, created_at = ?,
          updated_at = ?, activated_at = ?, paused_at = ?, analytics = ?,
          key_result_links = ?, version = ?
        WHERE uuid = ? AND account_uuid = ?
      `);

      const result = stmt.run(
        record.title,
        record.description,
        record.time_config,
        record.reminder_config,
        record.scheduling_policy,
        record.metadata,
        record.status,
        record.created_at,
        record.updated_at,
        record.activated_at,
        record.paused_at,
        record.analytics,
        record.key_result_links,
        record.version,
        record.uuid,
        record.account_uuid,
      );
      if (result.changes === 0) {
        console.warn("没有更新任何记录，可能是因为数据没有变化");
        return null as any;
      }

      return this.mapRowToTemplate(record);
    } catch (error) {
      console.error("更新 TaskTemplate 失败:", error);
      return null as any;
    }
  }

  /**
   * 删除 TaskTemplate
   */
  async delete(accountUuid: string, uuid: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        DELETE FROM task_templates 
        WHERE uuid = ? AND account_uuid = ?
      `);

      const result = stmt.run(uuid, accountUuid);

      return result.changes > 0;
           
    } catch (error) {
      console.error("删除 TaskTemplate 失败:", error);
      return false;
    }
  }

  /**
   * 根据关键结果查找 TaskTemplate
   */
  async findByKeyResult(
    accountUuid: string,
    goalUuid: string,
    keyResultId: string
  ): Promise<TaskTemplate[]> {
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

      const templates = records.map((record) => this.mapRowToTemplate(record));

      return templates;
    } catch (error) {
      console.error("根据关键结果查找 TaskTemplate 失败:", error);
      return [] as any;
    }
  }
}
