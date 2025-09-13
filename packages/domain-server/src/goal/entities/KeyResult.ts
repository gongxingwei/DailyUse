import { KeyResultCore } from '@dailyuse/domain-core';
import { type GoalContracts } from '@dailyuse/contracts';

/**
 * 服务端 KeyResult 实体
 * 实现关键结果的服务端业务逻辑
 */
export class KeyResult extends KeyResultCore {
  constructor(params: {
    uuid?: string;
    accountUuid: string;
    goalUuid: string;
    name: string;
    description?: string;
    startValue?: number;
    targetValue: number;
    currentValue?: number;
    unit: string;
    weight?: number;
    calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    status?: 'active' | 'completed' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params);
  }

  // ===== 业务方法 =====

  /**
   * 更新进度
   */
  updateProgress(value: number): void {
    if (this.lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能更新进度');
    }

    const oldValue = this.currentValue;
    super.updateProgress(value, 'set');

    // 触发领域事件
    // this.addDomainEvent({
    //   eventType: 'KeyResultProgressUpdated',
    //   aggregateId: this.goalUuid,
    //   occurredOn: new Date(),
    //   payload: {
    //     accountUuid: this.accountUuid,
    //     goalUuid: this.goalUuid,
    //     keyResultUuid: this.uuid,
    //     oldValue,
    //     newValue: this.currentValue,
    //     isCompleted: this.isCompleted,
    //   },
    // });
  }

  /**
   * 增量更新进度
   */
  incrementProgress(increment: number): void {
    if (this.lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能更新进度');
    }

    const oldValue = this.currentValue;
    super.updateProgress(increment, 'increment');

    // 触发领域事件
    // this.addDomainEvent({
    //   eventType: 'KeyResultProgressUpdated',
    //   aggregateId: this.goalUuid,
    //   occurredOn: new Date(),
    //   payload: {
    //     accountUuid: this.accountUuid,
    //     goalUuid: this.goalUuid,
    //     keyResultUuid: this.uuid,
    //     oldValue,
    //     newValue: this.currentValue,
    //     isCompleted: this.isCompleted,
    //   },
    // });
  }

  /**
   * 更新基本信息
   */
  updateInfo(params: {
    name?: string;
    description?: string;
    targetValue?: number;
    unit?: string;
    weight?: number;
    calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
  }): void {
    if (this.lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能修改');
    }

    super.updateInfo(params);
  }

  /**
   * 完成关键结果
   */
  complete(): void {
    if (this.lifecycle.status === 'completed') {
      throw new Error('关键结果已经完成');
    }
    if (this.lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能完成');
    }

    // 使用父类的更新进度方法将当前值设为目标值
    super.updateProgress(this.targetValue, 'set');
  }

  /**
   * 归档关键结果
   */
  archive(): void {
    this._lifecycle.status = 'archived';
    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 重新激活关键结果
   */
  reactivate(): void {
    if (this.lifecycle.status !== 'archived') {
      throw new Error('只有已归档的关键结果才能重新激活');
    }

    this._lifecycle.status = 'active';
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 验证方法 =====
  validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('关键结果名称不能为空');
    }
    if (name.length > 200) {
      throw new Error('关键结果名称不能超过200个字符');
    }
  }

  validateTargetValue(value: number): void {
    if (value < 0) {
      throw new Error('目标值不能为负数');
    }
    if (value <= this.startValue) {
      throw new Error('目标值必须大于起始值');
    }
  }

  validateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new Error('权重必须在0-100之间');
    }
  }

  // ===== 序列化方法 =====
  static fromDTO(dto: GoalContracts.KeyResultDTO): KeyResult {
    return new KeyResult({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      goalUuid: dto.goalUuid,
      name: dto.name,
      description: dto.description,
      startValue: dto.startValue,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      unit: dto.unit,
      weight: dto.weight,
      calculationMethod: dto.calculationMethod,
      status: dto.lifecycle.status,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
    });
  }

  toResponse(): GoalContracts.KeyResultResponse {
    const dto = this.toDTO();
    return {
      ...dto,
      progress: this.progress,
      isCompleted: this.isCompleted,
      remaining: this.remaining,
    };
  }
}
