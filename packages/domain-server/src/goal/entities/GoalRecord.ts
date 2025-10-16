/**
 * GoalRecord 实体
 * 目标记录实体
 *
 * DDD 实体职责：
 * - 记录关键成果的进度变更
 * - 追踪数值变化和变更原因
 */

import { Entity } from '@dailyuse/utils';
import type { GoalContracts } from '@dailyuse/contracts';

type IGoalRecordServer = GoalContracts.GoalRecordServer;
type GoalRecordServerDTO = GoalContracts.GoalRecordServerDTO;
type GoalRecordClientDTO = GoalContracts.GoalRecordClientDTO;
type GoalRecordPersistenceDTO = GoalContracts.GoalRecordPersistenceDTO;

/**
 * GoalRecord 实体
 */
export class GoalRecord extends Entity implements IGoalRecordServer {
  // ===== 私有字段 =====
  private _keyResultUuid: string; // ⚠️ 所属 KeyResult 的 UUID
  private _goalUuid: string; // ⚠️ 所属 Goal 的 UUID
  private _previousValue: number;
  private _newValue: number;
  private _changeAmount: number;
  private _note: string | null;
  private _recordedAt: number;
  private _createdAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    keyResultUuid: string;
    goalUuid: string;
    previousValue: number;
    newValue: number;
    changeAmount: number;
    note?: string | null;
    recordedAt: number;
    createdAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._keyResultUuid = params.keyResultUuid;
    this._goalUuid = params.goalUuid;
    this._previousValue = params.previousValue;
    this._newValue = params.newValue;
    this._changeAmount = params.changeAmount;
    this._note = params.note ?? null;
    this._recordedAt = params.recordedAt;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get keyResultUuid(): string {
    return this._keyResultUuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get previousValue(): number {
    return this._previousValue;
  }
  public get newValue(): number {
    return this._newValue;
  }
  public get changeAmount(): number {
    return this._changeAmount;
  }
  public get note(): string | null {
    return this._note;
  }
  public get recordedAt(): number {
    return this._recordedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 GoalRecord 实体
   */
  public static create(params: {
    keyResultUuid: string;
    goalUuid: string;
    previousValue: number;
    newValue: number;
    note?: string;
    recordedAt?: number;
  }): GoalRecord {
    // 验证
    if (!params.keyResultUuid) {
      throw new Error('KeyResult UUID is required');
    }
    if (!params.goalUuid) {
      throw new Error('Goal UUID is required');
    }

    const now = Date.now();
    const changeAmount = params.newValue - params.previousValue;

    return new GoalRecord({
      keyResultUuid: params.keyResultUuid,
      goalUuid: params.goalUuid,
      previousValue: params.previousValue,
      newValue: params.newValue,
      changeAmount,
      note: params.note?.trim() || null,
      recordedAt: params.recordedAt ?? now,
      createdAt: now,
    });
  }

  /**
   * 从 Server DTO 重建实体
   */
  public static fromServerDTO(dto: GoalRecordServerDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      keyResultUuid: dto.keyResultUuid,
      goalUuid: dto.goalUuid,
      previousValue: dto.previousValue,
      newValue: dto.newValue,
      changeAmount: dto.changeAmount,
      note: dto.note ?? null,
      recordedAt: dto.recordedAt,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 从持久化 DTO 重建实体
   */
  public static fromPersistenceDTO(dto: GoalRecordPersistenceDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      keyResultUuid: dto.key_result_uuid,
      goalUuid: dto.goal_uuid,
      previousValue: dto.previous_value,
      newValue: dto.new_value,
      changeAmount: dto.change_amount,
      note: dto.note ?? null,
      recordedAt: dto.recorded_at,
      createdAt: dto.created_at,
    });
  }

  // ===== 业务方法 =====

  /**
   * 获取变化百分比
   */
  public getChangePercentage(): number {
    if (this._previousValue === 0) {
      return this._newValue > 0 ? 100 : 0;
    }
    return (this._changeAmount / this._previousValue) * 100;
  }

  /**
   * 是否为正向变化
   */
  public isPositiveChange(): boolean {
    return this._changeAmount > 0;
  }

  /**
   * 更新备注
   */
  public updateNote(note: string): void {
    this._note = note.trim() || null;
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalRecordServerDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      previousValue: this._previousValue,
      newValue: this._newValue,
      changeAmount: this._changeAmount,
      note: this._note,
      recordedAt: this._recordedAt,
      createdAt: this._createdAt,
    };
  }

  public toClientDTO(): GoalRecordClientDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      previousValue: this._previousValue,
      newValue: this._newValue,
      changeAmount: this._changeAmount,
      note: this._note,
      recordedAt: this._recordedAt,
      createdAt: this._createdAt,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): GoalRecordPersistenceDTO {
    return {
      uuid: this.uuid,
      key_result_uuid: this._keyResultUuid,
      goal_uuid: this._goalUuid,
      previous_value: this._previousValue,
      new_value: this._newValue,
      change_amount: this._changeAmount,
      note: this._note,
      recorded_at: this._recordedAt,
      created_at: this._createdAt,
    };
  }
}
