import type { Database } from "better-sqlite3";
import type { IGoalRepository } from "../../domain/repositories/iGoalRepository";
import { Goal } from "../../domain/aggregates/goal";
import { GoalDir } from "../../domain/aggregates/goalDir";
import { Record } from "../../domain/entities/record";
import { KeyResult } from "../../domain/entities/keyResult";
import { GoalReview } from "../../domain/entities/goalReview";
import { IGoal } from "@/modules/Goal/presentation/types/goal";

export class GoalDatabaseRepository implements IGoalRepository {
  constructor(private db: Database) {}

  // ========== 目标目录 CRUD ==========

  async createGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir> {
    const row = await this.mapGoalDirToRow(accountUuid, goalDir);
    const stmt = this.db.prepare(`
      INSERT INTO goal_directories (
        uuid, account_uuid, name, description, icon, color, parent_uuid, category_uuid, sort_key, sort_order, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      row.uuid,
      accountUuid,
      row.name,
      row.description,
      row.icon,
      row.color,
      row.parentUuid || null,
      row.categoryUuid || null,
      row.sortKey || 'default',
      row.sortOrder || 0,
      row.status || 'active',
      row.createdAt?.getTime?.() || Date.now(),
      row.updatedAt?.getTime?.() || Date.now()
    );
    const createdGoalDir = await this.getGoalDirectoryByUuid(accountUuid, goalDir.uuid);
    if (!createdGoalDir) {
      throw new Error("Failed to create goal directory");
    }
    return createdGoalDir;

  }

  async getGoalDirectoryByUuid(accountUuid: string, uuid: string): Promise<GoalDir | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories WHERE account_uuid = ? AND uuid = ?
    `);
    const row = stmt.get(accountUuid, uuid);
    if (!row) return null;

    const goalDir = await this.mapRowToGoalDir(row);
    return goalDir;
  }

  async getAllGoalDirectories(accountUuid: string): Promise<GoalDir[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_directories WHERE account_uuid = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(accountUuid);
    const goalDirs: GoalDir[] = [];
    for (const row of rows) {
      const goalDir = await this.mapRowToGoalDir(row);
      goalDirs.push(goalDir);
    }
    return goalDirs;
  }

  async updateGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir> {
    const row = await this.mapGoalDirToRow(accountUuid, goalDir);
    const stmt = this.db.prepare(`
      UPDATE goal_directories 
      SET name = ?, description = ?, icon = ?, color = ?, parent_uuid = ?, 
          category_uuid = ?, sort_key = ?, sort_order = ?, status = ?, updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    
    stmt.run(
      row.name,
      row.description,
      row.icon,
      row.color,
      row.parent_uuid || null,
      row.category_uuid || null,
      row.sort_key || 'default',
      row.sort_order || 0,
      row.status || 'active',
      row.updated_at,
      accountUuid,
      row.uuid
    );
    
    const updatedGoalDir = await this.getGoalDirectoryByUuid(accountUuid, goalDir.uuid);
    if (!updatedGoalDir) {
      throw new Error("Failed to update goal directory");
    }
    return updatedGoalDir;
  }

  async deleteGoalDirectory(accountUuid: string, uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_directories WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(accountUuid, uuid);
  }

  // ========== 目标 CRUD ==========

  async createGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    const row = await this.mapGoalToRow(accountUuid, goal);
    const stmt = this.db.prepare(`
      INSERT INTO goals (
        uuid, account_uuid, directory_uuid, category_uuid, name, description, color, icon,
        feasibility_analysis, motive_analysis, start_time, end_time, priority, goal_type,
        tags, notes, attachments, analysis, status, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      row.uuid,
      accountUuid,
      row.directory_uuid,
      row.category_uuid || null,
      row.name,
      row.description,
      row.color,
      row.icon,
      row.feasibility_analysis,
      row.motive_analysis,
      row.start_time,
      row.end_time,
      row.priority,
      row.goal_type,
      row.tags,
      row.notes,
      row.attachments,
      row.analysis,
      row.status,
      row.version,
      row.created_at,
      row.updated_at
    );

    // 创建关键结果
    for (const kr of goal.keyResults) {
      await this.createKeyResult(accountUuid, goal.uuid, kr);
    }

    const createdGoal = await this.getGoalByUuid(accountUuid, goal.uuid);
    if (!createdGoal) {
      throw new Error("Failed to create goal");
    }

    return createdGoal;
  }

   async getGoalByUuid(accountUuid: string, uuid: string): Promise<Goal | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals WHERE account_uuid = ? AND uuid = ?
    `);
    const row: Partial<IGoal> = stmt.get(accountUuid, uuid);
    if (!row) return null;
    
    // 加载关键结果和记录
    const keyResults = await this.getKeyResultsByGoalUuid(accountUuid, uuid);
    const records = await this.getRecordsByGoal(accountUuid, uuid);
    const reviews = await this.getGoalReviewsByGoal(accountUuid, uuid);
    
    // 构建 DTO 对象
    const goalDTO = {
      uuid: row.uuid,
      name: row.name,
      description: row.description,
      color: row.color,
      dirUuid: row.directory_uuid,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      note: row.notes,
      keyResults,
      records,
      reviews,
      analysis: {
        feasibility: JSON.parse(row.feasibility_analysis || '{}'),
        motive: JSON.parse(row.motive_analysis || '{}')
      },
      lifecycle: {
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      },
      version: row.version
    };
    
    return Goal.fromDTO(goalDTO);
  }

  async getAllGoals(accountUuid: string): Promise<Goal[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals WHERE account_uuid = ? ORDER BY created_at DESC
    `);
    const rows: Partial<IGoal>[] = stmt.all(accountUuid);
    const goals: Goal[] = [];
    for (const row of rows) {
      const keyResults = await this.getKeyResultsByGoalUuid(accountUuid, row.uuid);
      const records = await this.getRecordsByGoal(accountUuid, row.uuid);
      const reviews = await this.getGoalReviewsByGoal(accountUuid, row.uuid);
      
      const goalDTO = {
        uuid: row.uuid,
        name: row.name,
        description: row.description,
        color: row.color,
        dirUuid: row.directory_uuid,
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
        note: row.notes,
        keyResults,
        records,
        reviews,
        analysis: {
          feasibility: JSON.parse(row.feasibility_analysis || '{}'),
          motive: JSON.parse(row.motive_analysis || '{}')
        },
        lifecycle: {
          status: row.status,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        },
        version: row.version
      };
      
      goals.push(Goal.fromDTO(goalDTO));
    }
    return goals;
  }


  async getGoalsByDirectory(accountUuid: string, directoryId: string): Promise<Goal[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goals WHERE account_uuid = ? AND directory_uuid = ? ORDER BY created_at DESC
    `);
    const rows: Partial<IGoal>[] = stmt.all(accountUuid, directoryId);
    const goals: Goal[] = [];
    for (const row of rows) {
      const keyResults = await this.getKeyResultsByGoalUuid(accountUuid, row.uuid);
      const records = await this.getRecordsByGoal(accountUuid, row.uuid);
      const reviews = await this.getGoalReviewsByGoal(accountUuid, row.uuid);
      
      const goalDTO = {
        uuid: row.uuid,
        name: row.name,
        description: row.description,
        color: row.color,
        dirUuid: row.directory_uuid,
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
        note: row.notes,
        keyResults,
        records,
        reviews,
        analysis: {
          feasibility: JSON.parse(row.feasibility_analysis || '{}'),
          motive: JSON.parse(row.motive_analysis || '{}')
        },
        lifecycle: {
          status: row.status,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        },
        version: row.version
      };
      
      goals.push(Goal.fromDTO(goalDTO));
    }
    return goals;
  }

  async updateGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    const row = await this.mapGoalToRow(accountUuid, goal);
    const stmt = this.db.prepare(`
      UPDATE goals 
      SET directory_uuid = ?, category_uuid = ?, name = ?, description = ?, color = ?, icon = ?,
          feasibility_analysis = ?, motive_analysis = ?, start_time = ?, end_time = ?, priority = ?, goal_type = ?,
          tags = ?, notes = ?, attachments = ?, analysis = ?, status = ?, version = ?, updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    
    stmt.run(
      row.directory_uuid,
      row.category_uuid || null,
      row.name,
      row.description,
      row.color,
      row.icon,
      row.feasibility_analysis,
      row.motive_analysis,
      row.start_time,
      row.end_time,
      row.priority,
      row.goal_type,
      row.tags,
      row.notes,
      row.attachments,
      row.analysis,
      row.status,
      row.version,
      row.updated_at,
      accountUuid,
      row.uuid
    );

    // 更新关键结果（简单做法：先删后增）
    const deleteKRStmt = this.db.prepare(`DELETE FROM key_results WHERE goal_uuid = ?`);
    deleteKRStmt.run(goal.uuid);
    for (const kr of goal.keyResults) {
      await this.createKeyResult(accountUuid, goal.uuid, kr);
    }

    const updatedGoal = await this.getGoalByUuid(accountUuid, goal.uuid);
    if (!updatedGoal) {
      throw new Error("Failed to update goal");
    }
    return updatedGoal;
  }

  async deleteGoal(accountUuid: string, uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goals WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(accountUuid, uuid);
  }

  // ========== 关键结果 CRUD ==========

  async createKeyResult(accountUuid: string, goalUuid: string, keyResult: KeyResult): Promise<string> {
    const row = await this.mapKeyResultToRow(accountUuid, goalUuid, keyResult);
    const stmt = this.db.prepare(`
      INSERT INTO key_results (
        uuid, account_uuid, goal_uuid, name, description, 
        start_value, target_value, current_value, unit, calculation_method, 
        weight, priority, status, progress_percentage, deadline, 
        completed_at, tags, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      row.uuid,
      accountUuid,
      goalUuid,
      row.name,
      row.description,

      row.start_value,
      row.target_value,
      row.current_value,
      row.unit,
      row.calculation_method,

      row.weight,
      row.priority,
      row.status,
      row.progress_percentage,
      row.deadline,

      row.completed_at,
      row.tags,
      row.notes,
      row.created_at,
      row.updated_at
    );

    return keyResult.uuid;
  }

  async getKeyResultsByGoalUuid(accountUuid: string, goalUuid: string): Promise<KeyResult[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM key_results WHERE account_uuid = ? AND goal_uuid = ? ORDER BY created_at ASC
    `);
    const rows = stmt.all(accountUuid, goalUuid);
    const keyResults: KeyResult[] = [];
    for (const row of rows) {
      const keyResult = await this.mapRowToKeyResult(row);
      keyResults.push(keyResult);
    }
    return keyResults;
  }

  // ========== 记录 CRUD ==========

  async createRecord(accountUuid: string, record: Record): Promise<Record> {
    const row = await this.mapRecordToRow(accountUuid, record);
    const stmt = this.db.prepare(`
      INSERT INTO goal_records (
        uuid, account_uuid, goal_uuid, key_result_uuid, value, notes, metadata, 
        is_verified, verified_by, verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      row.uuid,
      accountUuid,
      row.goal_uuid,
      row.key_result_uuid,
      row.value,
      row.notes,
      row.metadata,
      row.is_verified,
      row.verified_by,
      row.verified_at,
      row.created_at,
      row.updated_at
    );

    return record;
  }

  async getRecordByUuid(accountUuid: string, uuid: string): Promise<Record | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_records WHERE account_uuid = ? AND uuid = ?
    `);
    const row = stmt.get(accountUuid, uuid);
    if (!row) return null;
    return this.mapRowToRecord(row);
  }

  async getRecordsByGoal(accountUuid: string, goalUuid: string): Promise<Record[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_records WHERE account_uuid = ? AND goal_uuid = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(accountUuid, goalUuid);
    const records: Record[] = [];
    for (const row of rows) {
      const record = await this.mapRowToRecord(row);
      records.push(record);
    }
    return records;
  }

  async updateRecord(accountUuid: string, record: Record): Promise<Record> {
    const row = await this.mapRecordToRow(accountUuid, record);
    const stmt = this.db.prepare(`
      UPDATE goal_records 
      SET value = ?, notes = ?, metadata = ?, is_verified = ?, verified_by = ?, 
          verified_at = ?, updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    
    stmt.run(
      row.value,
      row.notes,
      row.metadata,
      row.is_verified,
      row.verified_by,
      row.verified_at,
      row.updated_at,
      accountUuid,
      row.uuid
    );
    
    return record;
  }

  async deleteRecord(accountUuid: string, uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_records WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(accountUuid, uuid);
  }

  // ========== 目标评审 CRUD ==========

  async createGoalReview(accountUuid: string, review: GoalReview): Promise<GoalReview> {
    const row = await this.mapGoalReviewToRow(accountUuid, review);
    const stmt = this.db.prepare(`
      INSERT INTO goal_reviews (
        uuid, account_uuid, goal_uuid, title, review_type, review_date, 
        executive_rating, progress_rating, goalReasonableness_rating, 
        achievements, challenges, learnings, next_steps, adjustment_recommendations, 
        snapshot, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      row.uuid,
      accountUuid,
      row.goal_uuid,
      row.title,
      row.review_type,
      row.review_date,
      row.executive_rating,
      row.progress_rating,
      row.goalReasonableness_rating,
      row.achievements,
      row.challenges,
      row.learnings,
      row.next_steps,
      row.adjustment_recommendations,
      row.snapshot,
      row.metadata,
      row.created_at,
      row.updated_at
    );

    return review;
  }

  async removeGoalReview(accountUuid: string, uuid: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_reviews WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(accountUuid, uuid);
  }

  async getGoalReviewByUuid(accountUuid: string, uuid: string): Promise<GoalReview | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_reviews WHERE account_uuid = ? AND uuid = ?
    `);
    const row = stmt.get(accountUuid, uuid);
    if (!row) return null;
    return this.mapRowToGoalReview(row);
  }

  async getGoalReviewsByGoal(accountUuid: string, goalUuid: string): Promise<GoalReview[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_reviews WHERE account_uuid = ? AND goal_uuid = ? ORDER BY review_date DESC
    `);
    const rows = stmt.all(accountUuid, goalUuid);
    const reviews: GoalReview[] = [];
    for (const row of rows) {
      const review = await this.mapRowToGoalReview(row);
      reviews.push(review);
    }
    return reviews;
  }

  async updateGoalReview(accountUuid: string, review: GoalReview): Promise<GoalReview> {
    const row = await this.mapGoalReviewToRow(accountUuid, review);
    const stmt = this.db.prepare(`
      UPDATE goal_reviews 
      SET title = ?, review_type = ?, review_date = ?, 
          executive_rating = ?, progress_rating = ?, goalReasonableness_rating = ?, 
          achievements = ?, challenges = ?, learnings = ?, next_steps = ?, 
          adjustment_recommendations = ?, snapshot = ?, metadata = ?, updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    
    stmt.run(
      row.title,
      row.review_type,
      row.review_date,
      row.executive_rating,
      row.progress_rating,
      row.goalReasonableness_rating,
      row.achievements,
      row.challenges,
      row.learnings,
      row.next_steps,
      row.adjustment_recommendations,
      row.snapshot,
      row.metadata,
      row.updated_at,
      accountUuid,
      row.uuid
    );
    
    const updatedReview = await this.getGoalReviewByUuid(accountUuid, review.uuid);
    if (!updatedReview) {
      throw new Error("Failed to update goal review");
    }
    return updatedReview;
  }

  // ========== 批量操作 ==========

  async batchDeleteGoals(accountUuid: string, uuids: string[]): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goals WHERE account_uuid = ? AND uuid = ?`);
    for (const uuid of uuids) {
      stmt.run(accountUuid, uuid);
    }
  }

  async batchDeleteRecords(accountUuid: string, uuids: string[]): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goal_records WHERE account_uuid = ? AND uuid = ?`);
    for (const uuid of uuids) {
      stmt.run(accountUuid, uuid);
    }
  }

  // ========== 辅助方法 ==========

  private async mapGoalToRow(accountUuid: string, goal: Goal): Promise<any> {
    const dto = goal.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      directory_uuid: dto.dirUuid,
      category_uuid: null, // Not in DTO
      name: dto.name,
      description: dto.description || null,
      color: dto.color,
      icon: null, // Not in DTO
      feasibility_analysis: JSON.stringify(dto.analysis.feasibility),
      motive_analysis: JSON.stringify(dto.analysis.motive),
      start_time: dto.startTime.getTime(),
      end_time: dto.endTime.getTime(),
      priority: 3, // Default value
      goal_type: 'personal', // Default value
      tags: null, // Not in DTO
      notes: dto.note || null,
      attachments: null, // Not in DTO
      analysis: JSON.stringify(dto.analysis),
      status: dto.lifecycle.status,
      version: dto.version,
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  private async mapGoalDirToRow(accountUuid: string, goalDir: GoalDir): Promise<any> {
    const dto = goalDir.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      name: dto.name,
      description: dto.description || null,
      icon: dto.icon,
      color: dto.color || 'default-color',
      parent_uuid: dto.parentUuid || null,
      category_uuid: null, // Not in DTO
      sort_key: dto.sortConfig?.sortKey || 'default',
      sort_order: dto.sortConfig?.sortOrder || 0,
      status: dto.lifecycle.status,
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  private async mapRecordToRow(accountUuid: string, record: Record): Promise<any> {
    const dto = record.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      goal_uuid: dto.goalUuid,
      key_result_uuid: dto.keyResultUuid,
      value: dto.value,
      notes: dto.note || null,
      metadata: null, // Not in DTO
      is_verified: 0, // Default value
      verified_by: null, // Default value
      verified_at: null, // Default value
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  private async mapKeyResultToRow(accountUuid: string, goalUuid: string, keyResult: KeyResult): Promise<any> {
    const dto = keyResult.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      goal_uuid: goalUuid,
      name: dto.name,
      description: null, // Not in DTO
      start_value: dto.startValue,
      target_value: dto.targetValue,
      current_value: dto.currentValue,
      unit: null, // Not in DTO
      calculation_method: dto.calculationMethod,
      weight: dto.weight,
      priority: 3, // Default value
      status: dto.lifecycle.status,
      progress_percentage: 0.0, // Default value
      deadline: null, // Not in DTO
      completed_at: null, // Not in DTO
      tags: null, // Not in DTO
      notes: null, // Not in DTO
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  private async mapGoalReviewToRow(accountUuid: string, review: GoalReview): Promise<any> {
    const dto = review.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      goal_uuid: dto.goalUuid,
      title: dto.title,
      review_type: dto.type,
      review_date: dto.reviewDate.getTime(),
      executive_rating: dto.rating.executionEfficiency,
      progress_rating: dto.rating.progressSatisfaction,
      goalReasonableness_rating: dto.rating.goalReasonableness,
      achievements: dto.content.achievements,
      challenges: dto.content.challenges,
      learnings: dto.content.learnings,
      next_steps: dto.content.nextSteps,
      adjustment_recommendations: dto.content.adjustments || null,
      snapshot: JSON.stringify(dto.snapshot),
      metadata: null,
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  private async mapRowToGoalDir(row: any): Promise<GoalDir> {
    const goalDirDTO = {
      uuid: row.uuid,
      name: row.name,
      description: row.description || undefined,
      icon: row.icon,
      color: row.color || 'default-color',
      sortConfig: {
        sortKey: row.sort_key || 'default',
        sortOrder: row.sort_order || 0,
      },
      parentUuid: row.parent_uuid,
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        status: row.status || 'active',
      },
    };
    return GoalDir.fromDTO(goalDirDTO);
  }

  private async mapRowToKeyResult(row: any): Promise<KeyResult> {
    const keyResultDTO = {
      uuid: row.uuid,
      name: row.name,
      startValue: row.start_value,
      targetValue: row.target_value,
      currentValue: row.current_value,
      calculationMethod: row.calculation_method,
      weight: row.weight,
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        status: row.status || 'active',
      },
    };
    return KeyResult.fromDTO(keyResultDTO);
  }

  private async mapRowToRecord(row: any): Promise<Record> {
    const recordDTO = {
      uuid: row.uuid,
      goalUuid: row.goal_uuid,
      keyResultUuid: row.key_result_uuid,
      value: row.value,
      note: row.notes,
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
    };
    return Record.fromDTO(recordDTO);
  }

  private async mapRowToGoalReview(row: any): Promise<GoalReview> {
    const reviewDTO = {
      uuid: row.uuid,
      goalUuid: row.goal_uuid,
      title: row.title,
      type: row.review_type,
      reviewDate: new Date(row.review_date),
      content: {
        achievements: row.achievements,
        challenges: row.challenges,
        learnings: row.learnings,
        nextSteps: row.next_steps,
        adjustments: row.adjustment_recommendations || '',
      },
      snapshot: JSON.parse(row.snapshot),
      metadata: JSON.parse(row.metadata || '{}'),
      rating: {
        progressSatisfaction: row.progress_rating,
        executionEfficiency: row.executive_rating,
        goalReasonableness: row.goalReasonableness_rating,
      },
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
    };
    return GoalReview.fromDTO(reviewDTO);
  }
}