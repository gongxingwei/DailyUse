import { Entity } from "@/shared/domain/entity";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import type { DateTime } from "@/shared/types/myDateTime";
import type { IRecord, IRecordCreateDTO } from "../../../../../common/modules/goal/types/goal";

/**
 * 记录领域实体
 * 作为 Goal 聚合内的实体，负责关键结果记录的业务逻辑和数据管理
 * 注意：Record 不是聚合根，它的生命周期由 Goal 聚合根管理
 */
export class Record extends Entity implements IRecord {
  private _goalUuid: string;
  private _keyResultUuid: string;
  private _value: number;
  private _date: DateTime;
  private _note?: string;
  private _lifecycle: IRecord['lifecycle'];

  constructor(
    
    goalUuid: string,
    keyResultId: string,
    value: number,
    date: DateTime,
    uuid?: string,
    note?: string
  ) {
    super(uuid || Record.generateId());
    const now = TimeUtils.now();

    this._goalUuid = goalUuid;
    this._keyResultUuid = keyResultId;
    this._value = value;
    this._date = date;
    this._note = note;

    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
    };
  }

  // Getters
  get goalUuid(): string {
    return this._goalUuid;
  }

  get keyResultId(): string {
    return this._keyResultUuid;
  }

  get value(): number {
    return this._value;
  }

  get date(): DateTime {
    return this._date;
  }

  get note(): string | undefined {
    return this._note;
  }

  get lifecycle(): IRecord['lifecycle'] {
    return this._lifecycle;
  }

  /**
   * 更新记录信息
   */
  updateRecord(updates: {
    value?: number;
    date?: DateTime;
    note?: string;
  }): void {
    if (updates.value !== undefined) {
      if (updates.value < 0) {
        throw new Error("记录值不能为负数");
      }
      this._value = updates.value;
    }

    if (updates.date !== undefined) {
      this._date = updates.date;
    }

    if (updates.note !== undefined) {
      this._note = updates.note;
    }

    this._lifecycle.updatedAt = TimeUtils.now();
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): IRecord {
    const rawData = {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      keyResultId: this._keyResultUuid,
      value: this._value,
      date: this._date,
      note: this._note,
      lifecycle: this._lifecycle,
    };

    // 使用深度序列化确保返回纯净的 JSON 对象
    try {
      return JSON.parse(JSON.stringify(rawData));
    } catch (error) {
      console.error('❌ [Record.toDTO] 序列化失败:', error);
      // 如果序列化失败，返回基本信息
      return {
        uuid: this.uuid,
        goalUuid: this._goalUuid,
        keyResultId: this._keyResultUuid,
        value: this._value,
        date: JSON.parse(JSON.stringify(this._date)),
        note: this._note,
        lifecycle: JSON.parse(JSON.stringify(this._lifecycle)),
      };
    }
  }

  /**
   * 导出完整数据（用于序列化）
   */
  toJSON(): IRecord {
    return this.toDTO();
  }

  /**
   * 从数据传输对象创建记录
   */
  static fromDTO(data: IRecord): Record {
    const record = new Record(
      
      data.goalUuid,
      data.keyResultId,
      data.value,
      data.date,
      data.uuid,
      data.note
    );

    record._lifecycle = data.lifecycle;
    return record;
  }

  /**
   * 从创建数据传输对象创建记录
   */
  static fromCreateDTO(data: IRecordCreateDTO): Record {
    return new Record(
      data.goalUuid,
      data.keyResultId,
      data.value,
      data.date,
      undefined, // uuid will be generated
      data.note
    );
  }

  clone(): Record {
    const clone = new Record(
      
      this._goalUuid,
      this._keyResultUuid,
      this._value,
      this._date,
      this.uuid, // 保留原有 UUID
      this._note
    );
    clone._lifecycle = { ...this._lifecycle };
    return clone;
  }

  /**
   * 验证记录数据
   */
  static validate(data: IRecordCreateDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.goalUuid?.trim()) {
      errors.push("目标ID不能为空");
    }

    if (!data.keyResultId?.trim()) {
      errors.push("关键结果ID不能为空");
    }

    if (data.value < 0) {
      errors.push("记录值不能为负数");
    }

    if (!data.date) {
      errors.push("记录日期不能为空");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
