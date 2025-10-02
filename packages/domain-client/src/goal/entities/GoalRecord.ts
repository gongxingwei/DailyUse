import { GoalRecordCore } from '@dailyuse/domain-core';
import { GoalContracts } from '@dailyuse/contracts';

/**
 * GoalRecord 客户端实体 - 目标记录实体
 * 符合 IGoalRecordClient 接口定义
 */
export class GoalRecord extends GoalRecordCore {
  constructor(params: {
    uuid?: string;
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
    goalUuid,
    keyResultUuid,
    value,
    note,
  }: {
    goalUuid: string;
    keyResultUuid: string;
    value?: number;
    note?: string;
  }): GoalRecord {
    return new GoalRecord({
      goalUuid: goalUuid,
      keyResultUuid: keyResultUuid,
      value: value || 1,
      note: note,
    });
  }
}
