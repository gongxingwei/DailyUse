import type { Database } from "better-sqlite3";
import { getDatabase } from "../../../../shared/database/index";
import type { ITaskInstanceRepository } from "../../domain/repositories/iTaskInstanceRepository";
import { TaskInstance } from "../../domain/aggregates/taskInstance";
import { ITaskInstanceDTO } from "@common/modules/task/types/task";
/**
 * TaskInstance 数据库仓库实现
 * 直接使用数据库进行数据持久化
 */
export class TaskInstanceDatabaseRepository implements ITaskInstanceRepository {
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
   * 将 TaskInstance 实体转换为数据库记录
   */
  private mapTaskInstanceToRow(
    instance: TaskInstance,
    accountUuid: string
  ): any {
    const dto: ITaskInstanceDTO = instance.toDTO();
    return {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      template_uuid: dto.templateId,
      title: dto.title,
      description: dto.description,
      time_config: JSON.stringify(dto.timeConfig),
      reminder_status: JSON.stringify(dto.reminderStatus),
      metadata: JSON.stringify(dto.metadata),
      lifecycle: JSON.stringify(dto.lifecycle),
      key_result_links: dto.keyResultLinks
        ? JSON.stringify(dto.keyResultLinks)
        : null,
      version: dto.version,
      created_at: dto.lifecycle.createdAt,
      updated_at: dto.lifecycle.updatedAt,
    };
  }

  /**
   * 将数据库记录转换为 TaskInstance 实体
   */
  private mapRowToTaskInstance(record: any): TaskInstance {
    const dto: ITaskInstanceDTO = {
      uuid: record.uuid,
      templateId: record.template_uuid,
      title: record.title,
      description: record.description,
      timeConfig: JSON.parse(record.time_config),
      keyResultLinks: record.key_result_links
        ? JSON.parse(record.key_result_links)
        : undefined,
      reminderStatus: JSON.parse(record.reminder_status),
      lifecycle: JSON.parse(record.lifecycle),
      metadata: JSON.parse(record.metadata),
      version: record.version,
    };
    return TaskInstance.fromDTO(dto);
  }

  /**
   * 保存 TaskInstance
   */
  async save(
    accountUuid: string,
    instance: TaskInstance
  ): Promise<TaskInstance> {
    const db = await this.getDB();
    const record = this.mapTaskInstanceToRow(instance, accountUuid);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO task_instances (
        uuid, account_uuid, template_uuid, title, description,
        time_config, reminder_status, metadata, lifecycle, key_result_links,
        version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.uuid,
      record.account_uuid,
      record.template_uuid,
      record.title,
      record.description,

      record.time_config,
      record.reminder_status,
      record.metadata,
      record.lifecycle,
      record.key_result_links,

      record.version,
      record.created_at,
      record.updated_at
    );

    return instance;
  }

  /**
   * 批量保存 TaskInstance
   */
  async saveAll(
    accountUuid: string,
    instances: TaskInstance[]
  ): Promise<TaskInstance[]> {
    const db = await this.getDB();

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO task_instances (
        uuid, account_uuid, template_uuid, title, description,
        time_config, reminder_status, metadata, lifecycle, key_result_links,
        version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const instance of instances) {
        const record = this.mapTaskInstanceToRow(instance, accountUuid);
        stmt.run(
          record.uuid,
          record.account_uuid,
          record.template_uuid,
          record.title,
          record.description,

          record.time_config,
          record.reminder_status,
          record.metadata,
          record.lifecycle,
          record.key_result_links,

          record.version,
          record.created_at,
          record.updated_at
        );
      }
    });

    transaction();

    return instances;
  }

  /**
   * 根据 ID 查找 TaskInstance
   */
  async findById(accountUuid: string, uuid: string): Promise<TaskInstance> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      SELECT * FROM task_instances 
      WHERE uuid = ? AND account_uuid = ?
    `);

    const record = stmt.get(uuid, accountUuid);

    if (record) {
      return this.mapRowToTaskInstance(record);
    } else {
      return [] as any as TaskInstance; // 返回空数组而不是 undefined
    }
  }

  /**
   * 获取所有 TaskInstance
   */
  async findAll(accountUuid: string): Promise<TaskInstance[]> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      SELECT * FROM task_instances 
      WHERE account_uuid = ?
      ORDER BY created_at DESC
    `);

    const records = stmt.all(accountUuid);
    return records.map((record) => this.mapRowToTaskInstance(record));
  }

  /**
   * 根据模板 ID 查找 TaskInstance
   */
  async findByTemplateId(
    accountUuid: string,
    templateId: string
  ): Promise<TaskInstance[]> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      SELECT * FROM task_instances 
      WHERE template_uuid = ? AND account_uuid = ?
      ORDER BY created_at DESC
    `);

    const records = stmt.all(templateId, accountUuid);
    return records.map((record) => this.mapRowToTaskInstance(record));
  }

  /**
   * 根据目标查找 TaskInstance
   */
  async findByGoal(
    accountUuid: string,
    goalUuid: string
  ): Promise<TaskInstance[]> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      SELECT * FROM task_instances 
      WHERE account_uuid = ? AND key_result_links LIKE ?
      ORDER BY created_at DESC
    `);

    const records = stmt.all(accountUuid, `%"goalUuid":"${goalUuid}"%`);
    return records.map((record) => this.mapRowToTaskInstance(record));
  }

  /**
   * 根据时间范围查找任务 (接口要求的方法名)
   */
  async findByDateRange(
    accountUuid: string,
    startTime: Date,
    endTime: Date
  ): Promise<TaskInstance[]> {
    return this.findByTimeRange(accountUuid, startTime, endTime);
  }

  /**
   * 根据时间范围查找任务
   */
  async findByTimeRange(
    accountUuid: string,
    startTime: Date,
    endTime: Date
  ): Promise<TaskInstance[]> {
    const db = await this.getDB();
    const start = startTime.getTime();
    const end = endTime.getTime();

    const stmt = db.prepare(`
      SELECT * FROM task_instances 
      WHERE account_uuid = ? 
      AND ((actual_start_time BETWEEN ? AND ?) 
           OR (completed_at BETWEEN ? AND ?)
           OR (created_at BETWEEN ? AND ?))
      ORDER BY created_at DESC
    `);

    const records = stmt.all(accountUuid, start, end, start, end, start, end);

    return records.map((record) => this.mapRowToTaskInstance(record));
  }

  /**
   * 更新 TaskInstance
   */
  async update(
    accountUuid: string,
    instance: TaskInstance
  ): Promise<TaskInstance> {
    const db = await this.getDB();
    const record = this.mapTaskInstanceToRow(instance, accountUuid);

    const stmt = db.prepare(`
      UPDATE task_instances SET
      template_uuid = ?, title = ?, description = ?,
      time_config = ?, reminder_status = ?, metadata = ?, lifecycle = ?, key_result_links = ?,
      version = ?, created_at = ?, updated_at = ?
      WHERE uuid = ? AND account_uuid = ?
    `);

    stmt.run(
      record.template_uuid,
      record.title,
      record.description,

      record.time_config,
      record.reminder_status,
      record.metadata,
      record.lifecycle,
      record.key_result_links,

      record.version,
      record.created_at,
      record.updated_at,

      record.uuid,
      record.account_uuid
    );

    return instance;
  }

  /**
   * 删除 TaskInstance
   */
  async delete(accountUuid: string, uuid: string): Promise<boolean> {
    const db = await this.getDB();
    const stmt = db.prepare(`
      DELETE FROM task_instances 
      WHERE uuid = ? AND account_uuid = ?
    `);

    const result = stmt.run(uuid, accountUuid);

    return result.changes > 0;
  }

  /**
   * 批量更新实例
   */
  async updateInstances(
    accountUuid: string,
    instances: TaskInstance[]
  ): Promise<TaskInstance[]> {
    const db = await this.getDB();

    const stmt = db.prepare(`
      UPDATE task_instances SET
      template_uuid = ?, title = ?, description = ?,
      time_config = ?, reminder_status = ?, metadata = ?, lifecycle = ?, key_result_links = ?,
      version = ?, created_at = ?, updated_at = ?
      WHERE uuid = ? AND account_uuid = ?
    `);

    const transaction = db.transaction(() => {
      for (const instance of instances) {
        const record = this.mapTaskInstanceToRow(instance, accountUuid);
        stmt.run(
          record.template_uuid,
          record.title,
          record.description,

          record.time_config,
          record.reminder_status,
          record.metadata,
          record.lifecycle,
          record.key_result_links,

          record.version,
          record.created_at,
          record.updated_at,

          record.uuid,
          record.account_uuid
        );
      }
    });

    transaction();

    return instances;
  }
}
