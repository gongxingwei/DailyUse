import { Entity } from '@dailyuse/utils';
import type { IGoalRecord } from '@common/modules/goal';
import { isValid } from 'date-fns';

/**
 * 记录领域实体
 * 作为 Goal 聚合内的实体，负责关键结果记录的业务逻辑和数据管理
 * 注意：GoalRecord 不是聚合根，它的生命周期由 Goal 聚合根管理
 */
export class GoalRecord extends Entity implements IGoalRecord {
  private _goalUuid: string;
  private _keyResultUuid: string;
  private _value: number;

  private _note?: string;
  private _lifecycle: IGoalRecord['lifecycle'];

  constructor(params: {
    uuid?: string;
    goalUuid: string;
    keyResultUuid: string;
    value: number;
    note?: string;
  }) {
    super(params.uuid || GoalRecord.generateUUID());
    const now = new Date();

    this._goalUuid = params.goalUuid;
    this._keyResultUuid = params.keyResultUuid;
    this._value = params.value;
    this._note = params.note;
    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
    };
  }

  // Getters & Setters
  get goalUuid(): string {
    return this._goalUuid;
  }
  set goalUuid(value: string) {
    if (!value.trim()) throw new Error('目标ID不能为空');
    this._goalUuid = value;
    this._lifecycle.updatedAt = new Date();
  }

  get keyResultUuid(): string {
    return this._keyResultUuid;
  }
  set keyResultUuid(value: string) {
    if (!value.trim()) throw new Error('关键结果ID不能为空');
    this._keyResultUuid = value;
    this._lifecycle.updatedAt = new Date();
  }

  get value(): number {
    return this._value;
  }
  set value(val: number) {
    if (val < 0) throw new Error('记录值不能为负数');
    this._value = val;
    this._lifecycle.updatedAt = new Date();
  }

  get note(): string | undefined {
    return this._note;
  }
  set note(value: string | undefined) {
    this._note = value;
    this._lifecycle.updatedAt = new Date();
  }

  get lifecycle(): IGoalRecord['lifecycle'] {
    return this._lifecycle;
  }

  /**
   * 更新记录信息
   */
  updateGoalRecord(updates: { value?: number; date?: Date; note?: string }): void {
    if (updates.value !== undefined) {
      this.value = updates.value;
    }
    if (updates.note !== undefined) {
      this.note = updates.note;
    }
  }
  /**
   * 判断对象是否为 GoalRecord 或 IGoalRecord
   */
  static isGoalRecord(obj: any): obj is GoalRecord | IGoalRecord {
    return (
      obj instanceof GoalRecord ||
      (obj &&
        typeof obj === 'object' &&
        'uuid' in obj &&
        'goalUuid' in obj &&
        'keyResultUuid' in obj &&
        'value' in obj)
    );
  }

  /**
   * 保证返回 GoalRecord 实例或 null
   * @param rec 可能为 DTO、实体或 null
   */
  static ensureGoalRecord(rec: IGoalRecord | GoalRecord | null): GoalRecord | null {
    if (GoalRecord.isGoalRecord(rec)) {
      return rec instanceof GoalRecord ? rec : GoalRecord.fromDTO(rec);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 GoalRecord 实例，永不为 null
   * @param rec 可能为 DTO、实体或 null
   */
  static ensureGoalRecordNeverNull(rec: IGoalRecord | GoalRecord | null): GoalRecord {
    if (GoalRecord.isGoalRecord(rec)) {
      return rec instanceof GoalRecord ? rec : GoalRecord.fromDTO(rec);
    } else {
      // 默认创建一个空记录
      return GoalRecord.forCreate('', '');
    }
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): IGoalRecord {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      keyResultUuid: this._keyResultUuid,
      value: this._value,
      note: this._note,
      lifecycle: { ...this._lifecycle },
    };
  }

  /**
   * 从数据传输对象创建记录
   */
  static fromDTO(data: IGoalRecord): GoalRecord {
    const record = new GoalRecord({
      uuid: data.uuid,
      goalUuid: data.goalUuid,
      keyResultUuid: data.keyResultUuid,
      value: data.value,
      note: data.note,
    });
    record._lifecycle = {
      createdAt: isValid(data.lifecycle.createdAt)
        ? new Date(data.lifecycle.createdAt)
        : new Date(),
      updatedAt: isValid(data.lifecycle.updatedAt)
        ? new Date(data.lifecycle.updatedAt)
        : new Date(),
    };
    return record;
  }

  static forCreate(goalUuid: string, keyResultUuid: string): GoalRecord {
    const record = new GoalRecord({
      goalUuid,
      keyResultUuid,
      value: 0,
    });
    return record;
  }

  clone(): GoalRecord {
    const record = new GoalRecord({
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      keyResultUuid: this._keyResultUuid,
      value: this._value,
      note: this._note,
    });
    record._lifecycle = {
      createdAt: new Date(this._lifecycle.createdAt),
      updatedAt: new Date(this._lifecycle.updatedAt),
    };
    return record;
  }
}
