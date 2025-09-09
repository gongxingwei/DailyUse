import { AggregateRoot } from '@dailyuse/utils';
import { type GoalContracts, type IGoalRecord } from '@dailyuse/contracts';

/**
 * 服务端 GoalRecord 实体
 * 实现目标记录的服务端业务逻辑
 */
export class GoalRecord extends AggregateRoot implements IGoalRecord {
  private _accountUuid: string;
  private _goalUuid: string;
  private _keyResultUuid: string;
  private _value: number;
  private _note?: string;
  private _createdAt: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    goalUuid: string;
    keyResultUuid: string;
    value: number;
    note?: string;
    createdAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    this._accountUuid = params.accountUuid;
    this._goalUuid = params.goalUuid;
    this._keyResultUuid = params.keyResultUuid;
    this._value = params.value;
    this._note = params.note;
    this._createdAt = params.createdAt || new Date();
  }

  // ===== 实现接口属性 =====
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

  // ===== 业务方法 =====

  /**
   * 更新记录备注
   */
  updateNote(note?: string): void {
    this._note = note;

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalRecordUpdated',
      aggregateId: this._goalUuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuid,
        goalUuid: this._goalUuid,
        keyResultUuid: this._keyResultUuid,
        recordUuid: this.uuid,
        changes: { note },
      },
    });
  }

  /**
   * 验证记录数据
   */
  validate(): void {
    if (this._value === null || this._value === undefined) {
      throw new Error('记录值不能为空');
    }

    if (this._note && this._note.length > 500) {
      throw new Error('记录备注不能超过500个字符');
    }
  }

  // ===== 序列化方法 =====
  static fromDTO(dto: GoalContracts.GoalRecordDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      goalUuid: dto.goalUuid,
      keyResultUuid: dto.keyResultUuid,
      value: dto.value,
      note: dto.note,
      createdAt: new Date(dto.createdAt),
    });
  }

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

  toResponse(): GoalContracts.GoalRecordResponse {
    return {
      ...this.toDTO(),
      xxxx: '', // 预留字段默认值
    };
  }
}
