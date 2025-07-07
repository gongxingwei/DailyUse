import type { Database } from "better-sqlite3";
import type { 
  IGoal, 
  IGoalDir, 
  IKeyResult, 
  IRecord,
  IGoalCreateDTO,
  IGoalDirCreateDTO,
  IKeyResultCreateDTO,
  IRecordCreateDTO
} from "../../../../../src/modules/Goal/domain/types/goal";
import type { DateTime } from "@/shared/types/myDateTime";
import type { IGoalRepository } from "../../domain/repositories/iGoalRepository";
import { Goal } from "../../domain/entities/goal";
import { GoalDir } from "../../domain/entities/goalDir";
import { Record } from "../../domain/entities/record";

/**
 * Goal 模块数据库仓库实现
 * 提供目标、关键结果、记录、目录的 CRUD 操作
 */
export class GoalDatabaseRepository implements IGoalRepository {
  private currentUser: string = 'default';

  constructor(private db: Database) {}

  /**
   * 设置当前用户
   */
  setCurrentUser(username: string): void {
    this.currentUser = username;
  }

  // ========== 目标目录 CRUD ==========

  /**
   * 创建目标目录
   */
  async createGoalDirectory(data: IGoalDirCreateDTO): Promise<GoalDir> {
    const stmt = this.db.prepare(`
      INSERT INTO goal_directories (
        id, username, name, icon, parent_id, lifecycle, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = `goaldir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const lifecycle = JSON.stringify({
      createdAt: { timestamp: now },
      updatedAt: { timestamp: now },
      status: "active"
    });

    stmt.run(
      id,
      this.currentUser,
      data.name,
      data.icon,
      data.parentId || null,
      lifecycle,
      now,
      now
    );

    // 返回创建的目录实体
    const createdDir = await this.getGoalDirById(id);
    if (!createdDir) {
      throw new Error('Failed to create goal directory');
    }
    return GoalDir.fromDTO(createdDir);
  }

  /**
   * 获取用户的所有目标目录
   */
  async getAllGoalDirectories(): Promise<GoalDir[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories 
      WHERE username = ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(this.currentUser) as any[];
    const goalDirDTOs = rows.map(this.mapRowToGoalDir);
    return goalDirDTOs.map(dto => GoalDir.fromDTO(dto));
  }

  /**
   * 根据 ID 获取目标目录
   */
  async getGoalDirectoryById(id: string): Promise<GoalDir | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;
    
    const goalDirDTO = this.mapRowToGoalDir(row);
    return GoalDir.fromDTO(goalDirDTO);
  }

  /**
   * 更新目标目录
   */
  async updateGoalDirectory(id: string, updates: Partial<IGoalDirCreateDTO>): Promise<GoalDir> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }
    if (updates.parentId !== undefined) {
      fields.push('parent_id = ?');
      values.push(updates.parentId);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE goal_directories SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    // 返回更新后的实体
    const updatedDir = await this.getGoalDirectoryById(id);
    if (!updatedDir) {
      throw new Error('Failed to update goal directory');
    }
    return updatedDir;
  }

  /**
   * 删除目标目录
   */
  async deleteGoalDirectory(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_directories WHERE id = ?
    `);
    stmt.run(id);
  }

  // 保留原方法名以保持兼容性
  async getGoalDirsByUsername(username: string): Promise<IGoalDir[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories 
      WHERE username = ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(username) as any[];
    return rows.map(this.mapRowToGoalDir);
  }

  async getGoalDirById(id: string): Promise<IGoalDir | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    return row ? this.mapRowToGoalDir(row) : null;
  }

  async deleteGoalDir(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_directories WHERE id = ?
    `);
    stmt.run(id);
  }

  // ========== 目标 CRUD ==========

  /**
   * 创建目标
   */
  async createGoal(data: IGoalCreateDTO): Promise<Goal> {
    const stmt = this.db.prepare(`
      INSERT INTO goals (
        id, username, title, description, color, dir_id, start_time, end_time, 
        note, analysis, lifecycle, analytics, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const lifecycle = JSON.stringify({
      createdAt: { timestamp: now },
      updatedAt: { timestamp: now },
      status: "active"
    });

    const analytics = JSON.stringify({
      overallProgress: 0,
      weightedProgress: 0,
      completedKeyResults: 0,
      totalKeyResults: 0
    });

    stmt.run(
      id,
      this.currentUser,
      data.title,
      data.description || null,
      data.color,
      data.dirId,
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
    for (const krData of data.keyResults) {
      await this.createKeyResult(id, krData);
    }

    // 返回创建的目标实体
    const createdGoal = await this.getGoalById(id);
    if (!createdGoal) {
      throw new Error('Failed to create goal');
    }
    return createdGoal;
  }

  /**
   * 获取用户的所有目标
   */
  async getAllGoals(): Promise<Goal[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals 
      WHERE username = ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(this.currentUser) as any[];
    const goals: Goal[] = [];

    for (const row of rows) {
      const goalDTO = this.mapRowToGoal(row);
      // 加载关键结果
      goalDTO.keyResults = await this.getKeyResultsByGoalId(goalDTO.id);
      // 加载记录
      goalDTO.records = await this.getRecordsByGoalId(goalDTO.id);
      goals.push(Goal.fromDTO(goalDTO));
    }

    return goals;
  }

  /**
   * 根据目录获取目标
   */
  async getGoalsByDirectory(directoryId: string): Promise<Goal[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals 
      WHERE username = ? AND dir_id = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(this.currentUser, directoryId) as any[];
    const goals: Goal[] = [];

    for (const row of rows) {
      const goalDTO = this.mapRowToGoal(row);
      // 加载关键结果
      goalDTO.keyResults = await this.getKeyResultsByGoalId(goalDTO.id);
      // 加载记录
      goalDTO.records = await this.getRecordsByGoalId(goalDTO.id);
      goals.push(Goal.fromDTO(goalDTO));
    }

    return goals;
  }

  /**
   * 根据 ID 获取目标
   */
  async getGoalById(id: string): Promise<Goal | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    const goalDTO = this.mapRowToGoal(row);
    // 加载关键结果
    goalDTO.keyResults = await this.getKeyResultsByGoalId(goalDTO.id);
    // 加载记录
    goalDTO.records = await this.getRecordsByGoalId(goalDTO.id);

    return Goal.fromDTO(goalDTO);
  }

  /**
   * 更新目标
   */
  async updateGoal(id: string, updates: Partial<IGoalCreateDTO>): Promise<Goal> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.note !== undefined) {
      fields.push('note = ?');
      values.push(updates.note);
    }
    if (updates.analysis !== undefined) {
      fields.push('analysis = ?');
      values.push(JSON.stringify(updates.analysis));
    }
    if (updates.startTime !== undefined) {
      fields.push('start_time = ?');
      values.push(updates.startTime.timestamp);
    }
    if (updates.endTime !== undefined) {
      fields.push('end_time = ?');
      values.push(updates.endTime.timestamp);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE goals SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    // 如果有关键结果更新，先删除旧的再创建新的
    if (updates.keyResults !== undefined) {
      // 删除现有关键结果
      const deleteKrStmt = this.db.prepare(`DELETE FROM key_results WHERE goal_id = ?`);
      deleteKrStmt.run(id);
      
      // 创建新的关键结果
      for (const krData of updates.keyResults) {
        await this.createKeyResult(id, krData);
      }
    }

    // 返回更新后的实体
    const updatedGoal = await this.getGoalById(id);
    if (!updatedGoal) {
      throw new Error('Failed to update goal');
    }
    return updatedGoal;
  }

  /**
   * 删除目标
   */
  async deleteGoal(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goals WHERE id = ?
    `);
    stmt.run(id);
  }

  // ========== 关键结果 CRUD ==========

  /**
   * 创建关键结果
   */
  async createKeyResult(goalId: string, keyResultDTO: IKeyResultCreateDTO): Promise<string> {
    const stmt = this.db.prepare(`
      INSERT INTO key_results (
        id, username, goal_id, name, start_value, target_value, current_value,
        calculation_method, weight, lifecycle, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = `kr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const lifecycle = JSON.stringify({
      createdAt: { timestamp: now },
      updatedAt: { timestamp: now },
      status: "active"
    });

    stmt.run(
      id,
      this.currentUser,
      goalId,
      keyResultDTO.name,
      keyResultDTO.startValue,
      keyResultDTO.targetValue,
      keyResultDTO.currentValue,
      keyResultDTO.calculationMethod,
      keyResultDTO.weight,
      lifecycle,
      now,
      now
    );

    return id;
  }

  /**
   * 获取目标的所有关键结果
   */
  async getKeyResultsByGoalId(goalId: string): Promise<IKeyResult[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM key_results 
      WHERE goal_id = ? 
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(goalId) as any[];
    return rows.map(this.mapRowToKeyResult);
  }

  /**
   * 更新关键结果
   */
  async updateKeyResult(id: string, updates: Partial<IKeyResult>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.currentValue !== undefined) {
      fields.push('current_value = ?');
      values.push(updates.currentValue);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE key_results SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
  }

  /**
   * 删除关键结果
   */
  async deleteKeyResult(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM key_results WHERE id = ?
    `);
    stmt.run(id);
  }

  // ========== 记录 CRUD ==========

  /**
   * 创建记录
   */
  async createRecord(data: IRecordCreateDTO): Promise<Record> {
    const stmt = this.db.prepare(`
      INSERT INTO goal_records (
        id, username, goal_id, key_result_id, value, date, note, lifecycle, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const lifecycle = JSON.stringify({
      createdAt: { timestamp: now },
      updatedAt: { timestamp: now }
    });

    stmt.run(
      id,
      this.currentUser,
      data.goalId,
      data.keyResultId,
      data.value,
      data.date.timestamp,
      data.note || null,
      lifecycle,
      now,
      now
    );

    // 返回创建的记录实体
    const createdRecord = await this.getRecordById(id);
    if (!createdRecord) {
      throw new Error('Failed to create record');
    }
    return createdRecord;
  }

  /**
   * 根据ID获取记录
   */
  async getRecordById(id: string): Promise<Record | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_records WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    const recordDTO = this.mapRowToRecord(row);
    return Record.fromDTO(recordDTO);
  }

  /**
   * 获取目标的所有记录
   */
  async getRecordsByGoal(goalId: string): Promise<Record[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_records 
      WHERE goal_id = ? 
      ORDER BY date DESC
    `);

    const rows = stmt.all(goalId) as any[];
    const recordDTOs = rows.map(this.mapRowToRecord);
    return recordDTOs.map(dto => Record.fromDTO(dto));
  }

  /**
   * 更新记录
   */
  async updateRecord(id: string, updates: Partial<IRecordCreateDTO>): Promise<Record> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.value !== undefined) {
      fields.push('value = ?');
      values.push(updates.value);
    }
    if (updates.note !== undefined) {
      fields.push('note = ?');
      values.push(updates.note);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date.timestamp);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE goal_records SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    // 返回更新后的实体
    const updatedRecord = await this.getRecordById(id);
    if (!updatedRecord) {
      throw new Error('Failed to update record');
    }
    return updatedRecord;
  }

  // ========== 批量操作 ==========

  /**
   * 批量删除目标
   */
  async batchDeleteGoals(ids: string[]): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goals WHERE id = ?`);
    for (const id of ids) {
      stmt.run(id);
    }
  }

  /**
   * 批量删除记录
   */
  async batchDeleteRecords(ids: string[]): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goal_records WHERE id = ?`);
    for (const id of ids) {
      stmt.run(id);
    }
  }

  // ========== Key Result 操作 ==========

  /**
   * 更新目标的关键结果
   */
  async updateKeyResults(goalId: string, keyResults: IKeyResult[]): Promise<void> {
    // 删除现有关键结果
    const deleteStmt = this.db.prepare(`DELETE FROM key_results WHERE goal_id = ?`);
    deleteStmt.run(goalId);
    
    // 创建新的关键结果
    for (const kr of keyResults) {
      const krCreateData = {
        name: kr.name,
        startValue: kr.startValue,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        calculationMethod: kr.calculationMethod,
        weight: kr.weight
      };
      await this.createKeyResult(goalId, krCreateData);
    }
  }

  /**
   * 获取目标的关键结果
   */
  async getKeyResults(goalId: string): Promise<IKeyResult[]> {
    return await this.getKeyResultsByGoalId(goalId);
  }

  // ========== 保留原有方法以保持兼容性 ==========

  async getGoalsByUsername(username: string): Promise<IGoal[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals 
      WHERE username = ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(username) as any[];
    const goals: IGoal[] = [];

    for (const row of rows) {
      const goal = this.mapRowToGoal(row);
      // 加载关键结果
      goal.keyResults = await this.getKeyResultsByGoalId(goal.id);
      // 加载记录
      goal.records = await this.getRecordsByGoalId(goal.id);
      goals.push(goal);
    }

    return goals;
  }

  /**
   * 获取目标的所有记录 - 内部方法
   */
  private async getRecordsByGoalId(goalId: string): Promise<IRecord[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_records 
      WHERE goal_id = ? 
      ORDER BY date DESC
    `);

    const rows = stmt.all(goalId) as any[];
    return rows.map(this.mapRowToRecord);
  }

  /**
   * 删除记录
   */
  async deleteRecord(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_records WHERE id = ?
    `);
    stmt.run(id);
  }

  // ========== 私有映射方法 ==========

  private createDateTime(timestamp: number): DateTime {
    const date = new Date(timestamp);
    return {
      date: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      },
      time: {
        hour: date.getHours(),
        minute: date.getMinutes()
      },
      timestamp,
      isoString: date.toISOString()
    };
  }

  private mapRowToGoalDir(row: any): IGoalDir {
    const lifecycle = JSON.parse(row.lifecycle);
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      parentId: row.parent_id,
      lifecycle: {
        createdAt: this.createDateTime(lifecycle.createdAt.timestamp),
        updatedAt: this.createDateTime(lifecycle.updatedAt.timestamp),
        status: lifecycle.status
      }
    };
  }

  private mapRowToGoal(row: any): IGoal {
    const lifecycle = JSON.parse(row.lifecycle);
    const analytics = JSON.parse(row.analytics);
    const analysis = JSON.parse(row.analysis);
    
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      color: row.color,
      dirId: row.dir_id,
      startTime: this.createDateTime(row.start_time),
      endTime: this.createDateTime(row.end_time),
      note: row.note,
      keyResults: [], // 由调用者填充
      records: [], // 由调用者填充
      analysis,
      lifecycle: {
        createdAt: this.createDateTime(lifecycle.createdAt.timestamp),
        updatedAt: this.createDateTime(lifecycle.updatedAt.timestamp),
        status: lifecycle.status
      },
      analytics,
      version: row.version
    };
  }

  private mapRowToKeyResult(row: any): IKeyResult {
    const lifecycle = JSON.parse(row.lifecycle);
    return {
      id: row.id,
      name: row.name,
      startValue: row.start_value,
      targetValue: row.target_value,
      currentValue: row.current_value,
      calculationMethod: row.calculation_method,
      weight: row.weight,
      lifecycle: {
        createdAt: this.createDateTime(lifecycle.createdAt.timestamp),
        updatedAt: this.createDateTime(lifecycle.updatedAt.timestamp),
        status: lifecycle.status
      }
    };
  }

  private mapRowToRecord(row: any): IRecord {
    const lifecycle = JSON.parse(row.lifecycle);
    return {
      id: row.id,
      goalId: row.goal_id,
      keyResultId: row.key_result_id,
      value: row.value,
      date: this.createDateTime(row.date),
      note: row.note,
      lifecycle: {
        createdAt: this.createDateTime(lifecycle.createdAt.timestamp),
        updatedAt: this.createDateTime(lifecycle.updatedAt.timestamp)
      }
    };
  }

  /**
   * 获取目标聚合（优化版本）- 使用 JOIN 减少查询次数
   */
  async getGoalByIdOptimized(id: string): Promise<Goal | null> {
    // 一次查询获取所有相关数据
    const goalStmt = this.db.prepare(`
      SELECT 
        g.*,
        kr.id as kr_id, kr.name as kr_name, kr.start_value, kr.target_value, 
        kr.current_value, kr.calculation_method, kr.weight, kr.lifecycle as kr_lifecycle,
        r.id as r_id, r.key_result_id as r_kr_id, r.value as r_value, 
        r.date as r_date, r.note as r_note, r.lifecycle as r_lifecycle
      FROM goals g
      LEFT JOIN key_results kr ON g.id = kr.goal_id
      LEFT JOIN goal_records r ON g.id = r.goal_id
      WHERE g.id = ?
      ORDER BY kr.created_at ASC, r.date DESC
    `);

    const rows = goalStmt.all(id) as any[];
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
          id: row.kr_id,
          name: row.kr_name,
          start_value: row.start_value,
          target_value: row.target_value,
          current_value: row.current_value,
          calculation_method: row.calculation_method,
          weight: row.weight,
          lifecycle: row.kr_lifecycle
        });
        keyResultsMap.set(row.kr_id, kr);
      }

      // 处理记录
      if (row.r_id && !recordsMap.has(row.r_id)) {
        const record = this.mapRowToRecord({
          id: row.r_id,
          goal_id: id,
          key_result_id: row.r_kr_id,
          value: row.r_value,
          date: row.r_date,
          note: row.r_note,
          lifecycle: row.r_lifecycle
        });
        recordsMap.set(row.r_id, record);
      }
    }

    goalDTO.keyResults = Array.from(keyResultsMap.values());
    goalDTO.records = Array.from(recordsMap.values());

    return Goal.fromDTO(goalDTO);
  }
}
