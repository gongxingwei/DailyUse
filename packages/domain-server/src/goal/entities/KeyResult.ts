import { AggregateRoot } from '@dailyuse/utils';
import { type GoalContracts, type IKeyResult } from '@dailyuse/contracts';

/**
 * 服务端 KeyResult 实体
 * 实现关键结果的服务端业务逻辑
 */
export class KeyResult extends AggregateRoot implements IKeyResult {
  private _accountUuid: string;
  private _goalUuid: string;
  private _name: string;
  private _description?: string;
  private _startValue: number;
  private _targetValue: number;
  private _currentValue: number;
  private _unit: string;
  private _weight: number;
  private _calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
  private _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'completed' | 'archived';
  };

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
    super(params.uuid || AggregateRoot.generateUUID());
    const now = new Date();

    this._accountUuid = params.accountUuid;
    this._goalUuid = params.goalUuid;
    this._name = params.name;
    this._description = params.description;
    this._startValue = params.startValue || 0;
    this._targetValue = params.targetValue;
    this._currentValue = params.currentValue || params.startValue || 0;
    this._unit = params.unit;
    this._weight = params.weight || 1.0;
    this._calculationMethod = params.calculationMethod || 'sum';
    this._lifecycle = {
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      status: params.status || 'active',
    };
  }

  // ===== 实现接口属性 =====
  get accountUuid(): string {
    return this._accountUuid;
  }

  get goalUuid(): string {
    return this._goalUuid;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get startValue(): number {
    return this._startValue;
  }

  get targetValue(): number {
    return this._targetValue;
  }

  get currentValue(): number {
    return this._currentValue;
  }

  get unit(): string {
    return this._unit;
  }

  get weight(): number {
    return this._weight;
  }

  get calculationMethod(): 'sum' | 'average' | 'max' | 'min' | 'custom' {
    return this._calculationMethod;
  }

  get lifecycle(): {
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'completed' | 'archived';
  } {
    return this._lifecycle;
  }

  // ===== 计算属性 =====
  get progress(): number {
    if (this._targetValue === 0) return 0;
    return Math.min((this._currentValue / this._targetValue) * 100, 100);
  }

  get isCompleted(): boolean {
    return this._currentValue >= this._targetValue;
  }

  get remaining(): number {
    return Math.max(0, this._targetValue - this._currentValue);
  }

  // ===== 业务方法 =====

  /**
   * 更新进度
   */
  updateProgress(value: number): void {
    if (this._lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能更新进度');
    }

    const oldValue = this._currentValue;
    this._currentValue = Math.max(0, value);
    this._lifecycle.updatedAt = new Date();

    // 检查是否完成
    if (this._currentValue >= this._targetValue && this._lifecycle.status === 'active') {
      this._lifecycle.status = 'completed';
    }

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'KeyResultProgressUpdated',
      aggregateId: this._goalUuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuid,
        goalUuid: this._goalUuid,
        keyResultUuid: this.uuid,
        oldValue,
        newValue: this._currentValue,
        isCompleted: this.isCompleted,
      },
    });
  }

  /**
   * 增量更新进度
   */
  incrementProgress(increment: number): void {
    this.updateProgress(this._currentValue + increment);
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
    if (this._lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能修改');
    }

    if (params.name !== undefined) {
      this.validateName(params.name);
      this._name = params.name;
    }

    if (params.description !== undefined) {
      this._description = params.description;
    }

    if (params.targetValue !== undefined) {
      this.validateTargetValue(params.targetValue);
      this._targetValue = params.targetValue;
    }

    if (params.unit !== undefined) {
      this._unit = params.unit;
    }

    if (params.weight !== undefined) {
      this.validateWeight(params.weight);
      this._weight = params.weight;
    }

    if (params.calculationMethod !== undefined) {
      this._calculationMethod = params.calculationMethod;
    }

    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 完成关键结果
   */
  complete(): void {
    if (this._lifecycle.status === 'completed') {
      throw new Error('关键结果已经完成');
    }
    if (this._lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能完成');
    }

    this._currentValue = this._targetValue;
    this._lifecycle.status = 'completed';
    this._lifecycle.updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'KeyResultCompleted',
      aggregateId: this._goalUuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuid,
        goalUuid: this._goalUuid,
        keyResultUuid: this.uuid,
        completedAt: new Date(),
      },
    });
  }

  /**
   * 归档关键结果
   */
  archive(): void {
    this._lifecycle.status = 'archived';
    this._lifecycle.updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'KeyResultArchived',
      aggregateId: this._goalUuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuid,
        goalUuid: this._goalUuid,
        keyResultUuid: this.uuid,
      },
    });
  }

  // ===== 验证方法 =====
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('关键结果名称不能为空');
    }
    if (name.length > 200) {
      throw new Error('关键结果名称不能超过200个字符');
    }
  }

  private validateTargetValue(value: number): void {
    if (value < 0) {
      throw new Error('目标值不能为负数');
    }
    if (value <= this._startValue) {
      throw new Error('目标值必须大于起始值');
    }
  }

  private validateWeight(weight: number): void {
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
