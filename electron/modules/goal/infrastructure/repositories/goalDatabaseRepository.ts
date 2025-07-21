import type { Database } from "better-sqlite3";
import type {
  IGoal,
  IGoalDir,
  IKeyResult,
  IRecord,
  IGoalCreateDTO,
  IKeyResultCreateDTO,
  IRecordCreateDTO,
} from "../../../../../common/modules/goal/types/goal";
import type { DateTime } from "@/shared/types/myDateTime";
import type { IGoalRepository } from "../../domain/repositories/iGoalRepository";
import { Goal } from "../../domain/aggregates/goal";
import { GoalDir } from "../../domain/aggregates/goalDir";
import { Record } from "../../domain/entities/record";
import { KeyResult } from "../../domain/entities/keyResult";

/**
 * Goal 模块数据库仓库实现
 * 提供目标、关键结果、记录、目录的 CRUD 操作
 */
export class GoalDatabaseRepository implements IGoalRepository {
  constructor(private db: Database) {}

  // ========== 目标目录 CRUD ==========

  /**
   * 创建目标目录
   */
  async createGoalDirectory(
    accountUuid: string,
    data: GoalDir
  ): Promise<GoalDir> {
    const stmt = this.db.prepare(`
      INSERT INTO goal_directories (
        uuid, account_uuid, name, icon, parent_uuid, lifecycle, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    console.log("🔍 [数据库仓库] 创建目录 - 使用账户ID:", accountUuid);

    const rowData = data.toDTO();
    const now = Date.now();
    const lifecycleStr =
      typeof rowData.lifecycle === "string"
        ? rowData.lifecycle
        : JSON.stringify(rowData.lifecycle);

    stmt.run(
      rowData.uuid, // uuid
      accountUuid, // account_uuid
      rowData.name, // name
      rowData.icon, // icon
      rowData.parentId || null, // parent_uuid
      lifecycleStr, // lifecycle
      now, // created_at
      now // updated_at
    );

    // 返回创建的目录实体
    const createdDir = await this.getGoalDirById(data.uuid);
    if (!createdDir) {
      throw new Error("Failed to create goal directory");
    }
    return GoalDir.fromDTO(createdDir);
  }

  /**
   * 获取用户的所有目标目录
   */
  async getAllGoalDirectories(accountUuid: string): Promise<GoalDir[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories 
      WHERE account_uuid = ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountUuid) as any[];
    const goalDirDTOs = rows.map(this.mapRowToGoalDir);
    return goalDirDTOs.map((dto) => GoalDir.fromDTO(dto));
  }

  /**
   * 根据 ID 获取目标目录
   */
  async getGoalDirectoryById(uuid: string): Promise<GoalDir | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories WHERE uuid = ?
    `);

    const row = stmt.get(uuid) as any;
    if (!row) return null;

    const goalDirDTO = this.mapRowToGoalDir(row);
    return GoalDir.fromDTO(goalDirDTO);
  }

  /**
   * 更新目标目录
   */
  async updateGoalDirectory(data: IGoalDir): Promise<GoalDir> {
    const fields: string[] = [];
    const values: any[] = [];

    // 构建动态更新字段
    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }

    if (data.icon !== undefined) {
      fields.push("icon = ?");
      values.push(data.icon);
    }

    if (data.parentId !== undefined) {
      fields.push("parent_uuid = ?");
      values.push(data.parentId);
    }

    // 更新生命周期
    if (data.lifecycle) {
      const updatedLifecycle = {
        ...data.lifecycle,
        updatedAt: {
          ...data.lifecycle.updatedAt,
          timestamp: Date.now(),
        },
      };
      fields.push("lifecycle = ?");
      values.push(JSON.stringify(updatedLifecycle));
    }

    // 添加更新时间
    fields.push("updated_at = ?");
    values.push(Date.now());

    // 添加 WHERE 条件的参数
    values.push(data.uuid);

    // 执行更新
    const stmt = this.db.prepare(`
      UPDATE goal_directories 
      SET ${fields.join(", ")} 
      WHERE uuid = ?
    `);

    const result = stmt.run(...values);

    // 检查是否更新成功
    if (result.changes === 0) {
      throw new Error(`Goal directory with id ${data.uuid} not found`);
    }

    console.log(`✅ [数据库仓库] 更新目录成功: ${data.uuid}`);

    // 返回更新后的实体
    const updatedDir = await this.getGoalDirectoryById(data.uuid);
    if (!updatedDir) {
      throw new Error("Failed to update goal directory");
    }
    return updatedDir;
  }

  /**
   * 删除目标目录
   */
  async deleteGoalDirectory(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_directories WHERE uuid = ?
    `);
    stmt.run(uuid);
  }

  // 保留原方法名以保持兼容性
  async getGoalDirsByUsername(username: string): Promise<IGoalDir[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories 
      WHERE account_uuid = ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(username) as any[];
    return rows.map(this.mapRowToGoalDir);
  }

  async getGoalDirById(uuid: string): Promise<IGoalDir | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories WHERE uuid = ?
    `);

    const row = stmt.get(uuid) as any;
    return row ? this.mapRowToGoalDir(row) : null;
  }

  async deleteGoalDir(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_directories WHERE uuid = ?
    `);
    stmt.run(uuid);
  }

  // ========== 目标 CRUD ==========

  /**
   * 创建目标
   */
  async createGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    const stmt = this.db.prepare(`
      INSERT INTO goals (
        uuid, account_uuid, directory_uuid, name, description, color, start_time, end_time, 
        notes, analysis, lifecycle, analytics, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const data = goal.toDTO();
    const now = Date.now();
    const lifecycle = JSON.stringify({
      createdAt: { timestamp: now },
      updatedAt: { timestamp: now },
      status: "active",
    });

    const analytics = JSON.stringify({
      overallProgress: 0,
      weightedProgress: 0,
      completedKeyResults: 0,
      totalKeyResults: 0,
    });

    stmt.run(
      data.uuid,
      accountUuid,
      data.dirId,
      data.name,
      data.description || null,
      data.color,
      data.startTime.timestamp,
      data.endTime.timestamp,
      data.note || null,
      JSON.stringify(data.analysis),
      lifecycle,
      analytics,
      1,
      now,
      now
    );

    // 创建关键结果
    for (const krData of goal.keyResults) {
      await this.createKeyResult(accountUuid, accountUuid, krData);
    }

    // 返回创建的目标实体
    const createdGoal = await this.getGoalById(accountUuid);
    if (!createdGoal) {
      throw new Error("Failed to create goal");
    }
    return createdGoal;
  }

  /**
   * 获取用户的所有目标
   */
  async getAllGoals(accountUuid: string): Promise<Goal[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals 
      WHERE account_uuid = ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountUuid) as any[];
    const goals: Goal[] = [];

    for (const row of rows) {
      const goalDTO = this.mapRowToGoal(row);
      // 加载关键结果
      goalDTO.keyResults = await this.getKeyResultsBygoalUuid(goalDTO.uuid);
      // 加载记录
      goalDTO.records = await this.getRecordsByGoal(goalDTO.uuid);
      goals.push(Goal.fromDTO(goalDTO));
    }

    return goals;
  }

  /**
   * 根据目录获取目标
   */
  async getGoalsByDirectory(
    accountUuid: string,
    directoryId: string
  ): Promise<Goal[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals 
      WHERE account_uuid = ? AND directory_uuid = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(accountUuid, directoryId) as any[];
    const goals: Goal[] = [];

    for (const row of rows) {
      const goalDTO = this.mapRowToGoal(row);
      // 加载关键结果
      goalDTO.keyResults = await this.getKeyResultsBygoalUuid(goalDTO.uuid);
      // 加载记录
      goalDTO.records = await this.getRecordsByGoal(goalDTO.uuid);
      goals.push(Goal.fromDTO(goalDTO));
    }

    return goals;
  }

  /**
   * 根据 ID 获取目标
   */
  async getGoalById(uuid: string): Promise<Goal | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals WHERE uuid = ?
    `);

    const row = stmt.get(uuid) as any;
    if (!row) return null;

    const goalDTO = this.mapRowToGoal(row);
    // 加载关键结果
    goalDTO.keyResults = await this.getKeyResultsBygoalUuid(goalDTO.uuid);
    // 加载记录
    goalDTO.records = await this.getRecordsByGoal(goalDTO.uuid);

    return Goal.fromDTO(goalDTO);
  }

  /**
   * 更新目标
   */
  async updateGoal(
    uuid: string,
    updates: Goal
  ): Promise<Goal> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.color !== undefined) {
      fields.push("color = ?");
      values.push(updates.color);
    }
    if (updates.note !== undefined) {
      fields.push("notes = ?");
      values.push(updates.note);
    }
    if (updates.analysis !== undefined) {
      fields.push("analysis = ?");
      values.push(JSON.stringify(updates.analysis));
    }
    if (updates.startTime !== undefined) {
      fields.push("start_time = ?");
      values.push(updates.startTime.timestamp);
    }
    if (updates.endTime !== undefined) {
      fields.push("end_time = ?");
      values.push(updates.endTime.timestamp);
    }

    fields.push("updated_at = ?");
    values.push(Date.now());
    values.push(uuid);

    const stmt = this.db.prepare(`
      UPDATE goals SET ${fields.join(", ")} WHERE uuid = ?
    `);
    stmt.run(...values);

    // 如果有关键结果更新，先删除旧的再创建新的
    if (updates.keyResults !== undefined) {
      // 获取目标的 accountUuid
      const goalStmt = this.db.prepare(
        `SELECT account_uuid FROM goals WHERE uuid = ?`
      );
      const goalRow = goalStmt.get(uuid) as any;
      if (!goalRow) {
        throw new Error(`Goal with id ${uuid} not found`);
      }
      const accountUuid = goalRow.account_uuid;

      // 删除现有关键结果
      const deleteKrStmt = this.db.prepare(
        `DELETE FROM key_results WHERE goal_uuid = ?`
      );
      deleteKrStmt.run(uuid);

      // 创建新的关键结果
      for (const krData of updates.keyResults) {
        await this.createKeyResult(accountUuid, uuid, krData);
      }
    }

    // 返回更新后的实体
    const updatedGoal = await this.getGoalById(uuid);
    if (!updatedGoal) {
      throw new Error("Failed to update goal");
    }
    return updatedGoal;
  }

  /**
   * 删除目标
   */
  async deleteGoal(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goals WHERE uuid = ?
    `);
    stmt.run(uuid);
  }

  // ========== 关键结果 CRUD ==========

  /**
   * 创建关键结果
   */
  async createKeyResult(
    accountUuid: string,
    goalUuid: string,
    keyResult: KeyResult
  ): Promise<string> {
    const stmt = this.db.prepare(`
      INSERT INTO key_results (
        uuid, account_uuid, goal_uuid, name, start_value, target_value, current_value,
        calculation_method, weight, lifecycle, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const data = keyResult.toDTO();
    const now = Date.now();

    const lifecycle = JSON.stringify({
      createdAt: { timestamp: now },
      updatedAt: { timestamp: now },
      status: "active",
    });

    stmt.run(
      data.uuid,
      accountUuid,
      goalUuid,
      data.name,
      data.startValue,
      data.targetValue,
      data.currentValue,
      data.calculationMethod,
      data.weight,
      lifecycle,
      now,
      now
    );

    return data.uuid;
  }

  /**
   * 获取目标的所有关键结果
   */
  async getKeyResultsBygoalUuid(goalUuid: string): Promise<IKeyResult[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM key_results 
      WHERE goal_uuid = ? 
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(goalUuid) as any[];
    return rows.map(this.mapRowToKeyResult);
  }

  /**
   * 更新关键结果
   */
  async updateKeyResult(
    uuid: string,
    updates: Partial<IKeyResult>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.currentValue !== undefined) {
      fields.push("current_value = ?");
      values.push(updates.currentValue);
    }

    fields.push("updated_at = ?");
    values.push(Date.now());
    values.push(uuid);

    const stmt = this.db.prepare(`
      UPDATE key_results SET ${fields.join(", ")} WHERE uuid = ?
    `);
    stmt.run(...values);
  }

  /**
   * 删除关键结果
   */
  async deleteKeyResult(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM key_results WHERE uuid = ?
    `);
    stmt.run(uuid);
  }

  // ========== 记录 CRUD ==========

  /**
   * 创建记录
   */
  async createRecord(
    accountUuid: string,
    record: Record
  ): Promise<Record> {
    const stmt = this.db.prepare(`
      INSERT INTO goal_records (
        uuid, account_uuid, goal_uuid, key_result_uuid, value, record_date, notes, lifecycle, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const data = record.toDTO();

    const now = Date.now();

    const lifecycle = JSON.stringify({
      createdAt: { timestamp: now },
      updatedAt: { timestamp: now },
    });

    stmt.run(
      data.uuid,
      accountUuid,
      data.uuid,
      data.keyResultId,
      data.value,
      data.date.timestamp,
      data.note || null,
      lifecycle,
      now,
      now
    );

    // 返回创建的记录实体
    const createdRecord = await this.getRecordById(data.uuid);
    if (!createdRecord) {
      throw new Error("Failed to create record");
    }
    return createdRecord;
  }

  /**
   * 删除记录
   */
  async deleteRecord(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_records WHERE uuid = ?
    `);
    stmt.run(uuid);
  }

  /**
   * 根据ID获取记录
   */
  async getRecordById(uuid: string): Promise<Record | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_records WHERE uuid = ?
    `);

    const row = stmt.get(uuid) as any;
    if (!row) return null;

    const recordDTO = this.mapRowToRecord(row);
    return Record.fromDTO(recordDTO);
  }

  /**
   * 获取目标的所有记录
   */
  async getRecordsByGoal(goalUuid: string): Promise<Record[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_records 
      WHERE goal_uuid = ? 
      ORDER BY record_date DESC
    `);

    const rows = stmt.all(goalUuid) as any[];
    const recordDTOs = rows.map(this.mapRowToRecord);
    return recordDTOs.map((dto) => Record.fromDTO(dto));
  }

  /**
   * 更新记录
   */
  async updateRecord(
    uuid: string,
    updates: Partial<IRecordCreateDTO>
  ): Promise<Record> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.value !== undefined) {
      fields.push("value = ?");
      values.push(updates.value);
    }
    if (updates.note !== undefined) {
      fields.push("notes = ?");
      values.push(updates.note);
    }
    if (updates.date !== undefined) {
      fields.push("record_date = ?");
      values.push(updates.date.timestamp);
    }

    fields.push("updated_at = ?");
    values.push(Date.now());
    values.push(uuid);

    const stmt = this.db.prepare(`
      UPDATE goal_records SET ${fields.join(", ")} WHERE uuid = ?
    `);
    stmt.run(...values);

    // 返回更新后的实体
    const updatedRecord = await this.getRecordById(uuid);
    if (!updatedRecord) {
      throw new Error("Failed to update record");
    }
    return updatedRecord;
  }

  // ========== 批量操作 ==========

  /**
   * 批量删除目标
   */
  async batchDeleteGoals(uuids: string[]): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goals WHERE uuid = ?`);
    for (const uuid of uuids) {
      stmt.run(uuid);
    }
  }

  /**
   * 批量删除记录
   */
  async batchDeleteRecords(uuids: string[]): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goal_records WHERE uuid = ?`);
    for (const uuid of uuids) {
      stmt.run(uuid);
    }
  }

  // ========== 私有映射方法 ==========

  private createDateTime(timestamp: number): DateTime {
    const date = new Date(timestamp);
    return {
      date: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      },
      time: {
        hour: date.getHours(),
        minute: date.getMinutes(),
      },
      timestamp,
      isoString: date.toISOString(),
    };
  }

  private mapRowToGoalDir = (row: any): IGoalDir => {
    console.log("🔍 [数据库仓库] 映射目录行数据:", JSON.stringify(row, null, 2));
    const lifecycle = JSON.parse(row.lifecycle);
    if (
      !lifecycle.createdAt ||
      typeof lifecycle.createdAt.timestamp !== "number"
    ) {
      console.error("❌ [数据库仓库] 目录生命周期数据格式错误:", lifecycle);
      throw new Error(
        `目录 ${row.uuid} 的生命周期数据格式错误: createdAt.timestamp 不存在或格式不正确`
      );
    }

    if (
      !lifecycle.updatedAt ||
      typeof lifecycle.updatedAt.timestamp !== "number"
    ) {
      console.error("❌ [数据库仓库] 目录生命周期数据格式错误:", lifecycle);
      throw new Error(
        `目录 ${row.uuid} 的生命周期数据格式错误: updatedAt.timestamp 不存在或格式不正确`
      );
    }

    const goalDirFromMapRow = {
      uuid: row.uuid,
      name: row.name,
      icon: row.icon,
      parentId: row.parent_uuid,
      lifecycle: {
        createdAt: this.createDateTime(lifecycle.createdAt.timestamp),
        updatedAt: this.createDateTime(lifecycle.updatedAt.timestamp),
        status: lifecycle.status,
      },
    };

    console.log("✅ [数据库仓库] 目录映射成功:", JSON.stringify(goalDirFromMapRow, null, 2));

    const goalDir: GoalDir = GoalDir.fromDTO(goalDirFromMapRow);

    return goalDir;
  };

  private mapRowToGoal = (row: any): IGoal => {
    const lifecycle = JSON.parse(row.lifecycle);
    const analytics = JSON.parse(row.analytics);
    const analysis = JSON.parse(row.analysis);

    return {
      uuid: row.uuid,
      name: row.name,
      description: row.description,
      color: row.color,
      dirId: row.directory_uuid,
      startTime: this.createDateTime(row.start_time),
      endTime: this.createDateTime(row.end_time),
      note: row.notes,
      keyResults: [], // 由调用者填充
      records: [], // 由调用者填充
      reviews: [],
      analysis,
      lifecycle: {
        createdAt: this.createDateTime(lifecycle.createdAt.timestamp),
        updatedAt: this.createDateTime(lifecycle.updatedAt.timestamp),
        status: lifecycle.status,
      },
      analytics,
      version: row.version,
    };
  };

  private mapRowToKeyResult = (row: any): IKeyResult => {
    const lifecycle = JSON.parse(row.lifecycle);
    return {
      uuid: row.uuid,
      name: row.name,
      startValue: row.start_value,
      targetValue: row.target_value,
      currentValue: row.current_value,
      calculationMethod: row.calculation_method,
      weight: row.weight,
      lifecycle: {
        createdAt: this.createDateTime(lifecycle.createdAt.timestamp),
        updatedAt: this.createDateTime(lifecycle.updatedAt.timestamp),
        status: lifecycle.status,
      },
    };
  };

  private mapRowToRecord = (row: any): Record => {
    const lifecycle = JSON.parse(row.lifecycle);
    const record = Record.fromDTO({
      uuid: row.uuid,
      goalUuid: row.goal_uuid,
      keyResultId: row.key_result_uuid,
      value: row.value,
      date: this.createDateTime(row.record_date),
      note: row.notes,
      lifecycle: {
        createdAt: this.createDateTime(lifecycle.createdAt.timestamp),
        updatedAt: this.createDateTime(lifecycle.updatedAt.timestamp),
      },
    });
    return record;
  }


  /**
   * 获取目标聚合（优化版本）- 使用 JOIN 减少查询次数
   */
  async getGoalByIdOptimized(uuid: string): Promise<Goal | null> {
    const goalStmt = this.db.prepare(`
      SELECT 
        g.*,
        kr.uuid as kr_id, kr.name as kr_name, kr.start_value, kr.target_value, 
        kr.current_value, kr.calculation_method, kr.weight, kr.lifecycle as kr_lifecycle,
        r.uuid as r_id, r.key_result_uuid as r_kr_Uuid, r.value as r_value, 
        r.record_date as r_date, r.notes as r_note, r.lifecycle as r_lifecycle
      FROM goals g
      LEFT JOIN key_results kr ON g.uuid = kr.goal_uuid
      LEFT JOIN goal_records r ON g.uuid = r.goal_uuid
      WHERE g.uuid = ?
      ORDER BY kr.created_at ASC, r.record_date DESC
    `);

    const rows = goalStmt.all(uuid) as any[];
    if (rows.length === 0) return null;

    const goalRow = rows[0];
    const goalDTO = this.mapRowToGoal(goalRow);

    // 组装关键结果和记录
    const keyResultsMap = new Map<string, IKeyResult>();
    const recordsMap = new Map<string, IRecord>();

    for (const row of rows) {
      // 处理关键结果
      if (row.kr_id && !keyResultsMap.has(row.kr_id)) {
        const kr = this.mapRowToKeyResult({
          uuid: row.kr_id,
          name: row.kr_name,
          start_value: row.start_value,
          target_value: row.target_value,
          current_value: row.current_value,
          calculation_method: row.calculation_method,
          weight: row.weight,
          lifecycle: row.kr_lifecycle,
        });
        keyResultsMap.set(row.kr_id, kr);
      }

      // 处理记录
      if (row.r_id && !recordsMap.has(row.r_id)) {
        const record = this.mapRowToRecord({
          uuid: row.r_id,
          goal_uuid: uuid,
          key_result_uuid: row.r_kr_Uuid,
          value: row.r_value,
          record_date: row.r_date,
          notes: row.r_note,
          lifecycle: row.r_lifecycle,
        });
        recordsMap.set(row.r_id, record);
      }
    }

    goalDTO.keyResults = Array.from(keyResultsMap.values());
    goalDTO.records = Array.from(recordsMap.values());

    return Goal.fromDTO(goalDTO);
  }
}