import { GoalRecordCore } from '@dailyuse/domain-core';
import { type GoalContracts } from '@dailyuse/contracts';

/**
 * 服务端 GoalRecord 实体
 * 实现目标记录的服务端业务逻辑
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

  // ===== 业务方法 =====

  /**
   * 更新记录备注
   */
  updateNote(note?: string): void {
    super.updateNote(note);

    // 触发领域事件
    // this.addDomainEvent({
    //   eventType: 'GoalRecordUpdated',
    //   aggregateId: this.goalUuid,
    //   occurredOn: new Date(),
    //   payload: {
    //     accountUuid: this.accountUuid,
    //     goalUuid: this.goalUuid,
    //     keyResultUuid: this.keyResultUuid,
    //     recordUuid: this.uuid,
    //     changes: { note },
    //   },
    // });
  }

  /**
   * 删除记录
   */
  delete(): void {
    // 触发领域事件
    // this.addDomainEvent({
    //   eventType: 'GoalRecordDeleted',
    //   aggregateId: this.goalUuid,
    //   occurredOn: new Date(),
    //   payload: {
    //     accountUuid: this.accountUuid,
    //     goalUuid: this.goalUuid,
    //     keyResultUuid: this.keyResultUuid,
    //     recordUuid: this.uuid,
    //     value: this.value,
    //   },
    // });
  }

  // ===== 序列化方法 =====
  static fromDTO(dto: GoalContracts.GoalRecordDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      keyResultUuid: dto.keyResultUuid,
      value: dto.value,
      note: dto.note,
      createdAt: new Date(dto.createdAt),
    });
  }

  toResponse(): GoalContracts.GoalRecordResponse {
    const dto = this.toDTO();
    return {
      ...dto,
      xxxx: '', // 预留字段默认值
    };
  }

  // ===== 数据库转换方法 =====

  /**
   * 转换为数据库 DTO（扁平化存储）
   */
  toDatabase(): any {
    return {
      uuid: this.uuid,
      keyResultUuid: this.keyResultUuid,
      // 记录信息
      value: this._value,
      note: this._note,
      createdAt: this._createdAt,
    };
  }

  /**
   * 从数据库 DTO 创建实例
   */
  static fromDatabase(dbData: any): GoalRecord {
    return new GoalRecord({
      uuid: dbData.uuid,
      goalUuid: dbData.goalUuid || '', // 这个需要从上层传递
      keyResultUuid: dbData.keyResultUuid,
      value: dbData.value,
      note: dbData.note,
      createdAt: dbData.createdAt,
    });
  }
}
