import { Entity } from '@dailyuse/utils';
import { type GoalContracts, type IGoalRecord } from '@dailyuse/contracts';

/**
 * GoalRecord 核心基类 - 目标记录实体
 */
export abstract class GoalRecordCore extends Entity implements IGoalRecord {
  protected _accountUuid: string;
  protected _goalUuid: string;
  protected _keyResultUuid: string;
  protected _value: number;
  protected _note?: string;
  protected _createdAt: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    goalUuid: string;
    keyResultUuid: string;
    value: number;
    note?: string;
    createdAt?: Date;
  }) {
    super(params.uuid || Entity.generateUUID());

    this._accountUuid = params.accountUuid;
    this._goalUuid = params.goalUuid;
    this._keyResultUuid = params.keyResultUuid;
    this._value = params.value;
    this._note = params.note;
    this._createdAt = params.createdAt || new Date();
  }

  // ===== 只读属性 =====
  get accountUuid(): string {
    return this._accountUuid;
  }

  get goalUuid(): string {
    return this._goalUuid;
  }

  get keyResultUuid(): string {
    return this._keyResultUuid;
  }

  get value(): number {
    return this._value;
  }

  get note(): string | undefined {
    return this._note;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 验证方法 =====
  protected validateValue(value: number): void {
    if (isNaN(value)) {
      throw new Error('记录值必须是有效数字');
    }
  }

  // ===== 业务方法 =====

  /**
   * 更新备注
   */
  updateNote(note?: string): void {
    this._note = note;
  }

  /**
   * 更新记录值
   */
  updateValue(value: number): void {
    this.validateValue(value);
    this._value = value;
  }

  // ===== 序列化方法 =====
  toDTO(context?: { accountUuid?: string; goalUuid?: string }): GoalContracts.GoalRecordDTO {
    return {
      uuid: this.uuid,
      accountUuid: context?.accountUuid || '', // 从上下文获取
      goalUuid: context?.goalUuid || '', // 从上下文获取
      keyResultUuid: this._keyResultUuid,
      value: this._value,
      note: this._note,
      createdAt: this._createdAt.getTime(),
    };
  }

  static fromDTO(dto: GoalContracts.GoalRecordDTO): GoalRecordCore {
    throw new Error('Method not implemented. Use subclass implementations.');
  }
}
