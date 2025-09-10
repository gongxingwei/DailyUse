import { KeyResultCore } from '@dailyuse/domain-core';
import { type GoalContracts, type IKeyResult } from '@dailyuse/contracts';

/**
 * KeyResult 核心基类 - 关键结果实体
 */
export class KeyResult extends KeyResultCore implements IKeyResult {
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

  // ===== 序列化方法 =====
  toDTO(): GoalContracts.KeyResultDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      goalUuid: this._goalUuid,
      name: this._name,
      description: this._description,
      startValue: this._startValue,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      unit: this._unit,
      weight: this._weight,
      calculationMethod: this._calculationMethod,
      lifecycle: {
        createdAt: this._lifecycle.createdAt.getTime(),
        updatedAt: this._lifecycle.updatedAt.getTime(),
        status: this._lifecycle.status,
      },
    };
  }

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

  // ===== 抽象方法实现=====
  complete(): void {
    this._lifecycle.status = 'completed';
  }

  archive(): void {
    this._lifecycle.status = 'archived';
  }

  reactivate(): void {
    this._lifecycle.status = 'active';
  }
}
