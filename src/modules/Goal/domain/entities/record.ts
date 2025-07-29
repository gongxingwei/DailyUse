import { Entity } from "@/shared/domain/entity";
import type { IRecord } from "@common/modules/goal";
import { isValid } from "date-fns";

/**
 * 记录领域实体
 * 作为 Goal 聚合内的实体，负责关键结果记录的业务逻辑和数据管理
 * 注意：Record 不是聚合根，它的生命周期由 Goal 聚合根管理
 */
export class Record extends Entity implements IRecord {
  private _goalUuid: string;
  private _keyResultUuid: string;
  private _value: number;

  private _note?: string;
  private _lifecycle: IRecord["lifecycle"];

  constructor(params: {
    uuid?: string;
    goalUuid: string;
    keyResultUuid: string;
    value: number;
    note?: string;
  }) {
    super(params.uuid || Record.generateId());
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
  
  get keyResultUuid(): string {
    return this._keyResultUuid;
  }
  set keyResultUuid(value: string) {
    if (!value.trim()) throw new Error("关键结果ID不能为空");
    this._keyResultUuid = value;
    this._lifecycle.updatedAt = new Date();
  }

  get value(): number {
    return this._value;
  }
  set value(val: number) {
    if (val < 0) throw new Error("记录值不能为负数");
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

  get lifecycle(): IRecord["lifecycle"] {
    return this._lifecycle;
  }

  /**
   * 更新记录信息
   */
  updateRecord(updates: { value?: number; date?: Date; note?: string }): void {
    if (updates.value !== undefined) {
      this.value = updates.value;
    }
    if (updates.note !== undefined) {
      this.note = updates.note;
    }
  }
  /**
   * 判断对象是否为 Record 或 IRecord
   */
  static isRecord(obj: any): obj is Record | IRecord {
    return (
      obj instanceof Record ||
      (obj &&
        typeof obj === "object" &&
        "uuid" in obj &&
        "goalUuid" in obj &&
        "keyResultUuid" in obj &&
        "value" in obj)
    );
  }

  /**
   * 保证返回 Record 实例或 null
   * @param rec 可能为 DTO、实体或 null
   */
  static ensureRecord(rec: IRecord | Record | null): Record | null {
    if (Record.isRecord(rec)) {
      return rec instanceof Record ? rec : Record.fromDTO(rec);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 Record 实例，永不为 null
   * @param rec 可能为 DTO、实体或 null
   */
  static ensureRecordNeverNull(rec: IRecord | Record | null): Record {
    if (Record.isRecord(rec)) {
      return rec instanceof Record ? rec : Record.fromDTO(rec);
    } else {
      // 默认创建一个空记录
      return Record.forCreate("", "");
    }
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): IRecord {
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
  static fromDTO(data: IRecord): Record {
    const record = new Record({
      uuid: data.uuid,
      goalUuid: data.goalUuid,
      keyResultUuid: data.keyResultUuid,
      value: data.value,
      note: data.note,
    });
    record._lifecycle = {
            createdAt: isValid(data.lifecycle.createdAt) ? new Date(data.lifecycle.createdAt) : new Date(),
            updatedAt: isValid(data.lifecycle.updatedAt) ? new Date(data.lifecycle.updatedAt) : new Date(),
    };
    return record;
  }

  static forCreate(goalUuid: string, keyResultUuid: string): Record {
    const record = new Record({
      goalUuid,
      keyResultUuid,
      value: 0,
    });
    return record;
  }

  clone(): Record {
    const record = new Record({
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
