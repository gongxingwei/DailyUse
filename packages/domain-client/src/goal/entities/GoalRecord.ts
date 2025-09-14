import { GoalRecordCore } from '@dailyuse/domain-core';
import { type GoalContracts, type IGoalRecord } from '@dailyuse/contracts';

/**
 * GoalRecord 核心基类 - 目标记录实体
 */
export class GoalRecord extends GoalRecordCore {
  constructor(params: {
    uuid?: string;
    accountUuid: string;
    goalUuid: string;
    keyResultUuid: string;
    value: number;
    note?: string;
    createdAt?: Date;
  }) {
    super(params);
  }

  /**
   * 更新记录值
   */
  updateValue(value: number): void {
    this.validateValue(value);
    this._value = value;
  }

  // ===== 序列化方法 =====
  toDTO(): GoalContracts.GoalRecordDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      goalUuid: this._goalUuid,
      keyResultUuid: this._keyResultUuid,
      value: this._value,
      note: this._note,
      createdAt: this._createdAt.getTime(),
    };
  }

  static fromDTO(dto: GoalContracts.GoalRecordDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      goalUuid: dto.goalUuid,
      keyResultUuid: dto.keyResultUuid,
      value: dto.value,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): GoalRecord {
    return GoalRecord.fromDTO(this.toDTO()) as GoalRecord;
  }

  static forCreate({
    accountUuid,
    goalUuid,
    keyResultUuid,
    value,
    note,
  }: {
    accountUuid: string;
    goalUuid: string;
    keyResultUuid: string;
    value?: number;
    note?: string;
  }): GoalRecord {
    return new GoalRecord({
      accountUuid: accountUuid,
      goalUuid: goalUuid,
      keyResultUuid: keyResultUuid,
      value: value || 1,
      note: note,
    });
  }
}
