import { GoalRecordCore } from '@dailyuse/domain-core';
import { type GoalContracts } from '@dailyuse/contracts';

type GoalRecordPersistenceDTO = GoalContracts.GoalRecordPersistenceDTO;

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
   * 更新记录（实体内部方法）
   * 封装自身的更新逻辑和验证
   */
  update(updates: { value?: number; note?: string }): void {
    if (updates.value !== undefined) {
      this.updateValue(updates.value);
    }

    if (updates.note !== undefined) {
      this.updateNote(updates.note);
    }
  }

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

  toClient(): GoalContracts.GoalRecordClientDTO {
    return this.toDTO();
  }

  // ===== 持久化转换方法 =====

  /**
   * 转换为持久化 DTO（扁平化存储）
   */
  toPersistence(): GoalRecordPersistenceDTO {
    return {
      uuid: this.uuid,
      goalUuid: this.goalUuid, // 添加 goalUuid
      keyResultUuid: this.keyResultUuid,
      // 记录信息
      value: this._value,
      note: this._note,
      createdAt: this._createdAt,
    };
  }

  /**
   * 从持久化 DTO 创建实例
   */
  static fromPersistence(data: GoalRecordPersistenceDTO): GoalRecord {
    return new GoalRecord({
      uuid: data.uuid,
      goalUuid: data.goalUuid, // 从 data 中获取
      keyResultUuid: data.keyResultUuid,
      value: data.value,
      note: data.note,
      createdAt: data.createdAt,
    });
  }
}
