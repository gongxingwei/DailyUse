import { Entity } from '@dailyuse/utils';
import { type GoalContracts, type IKeyResult } from '@dailyuse/contracts';

/**
 * KeyResult 核心基类 - 关键结果实体
 */
export abstract class KeyResultCore extends Entity implements IKeyResult {
  protected _accountUuid: string;
  protected _goalUuid: string;
  protected _name: string;
  protected _description?: string;
  protected _startValue: number;
  protected _targetValue: number;
  protected _currentValue: number;
  protected _unit: string;
  protected _weight: number;
  protected _calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
  protected _lifecycle: {
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
    super(params.uuid || Entity.generateUUID());
    const now = new Date();

    this._accountUuid = params.accountUuid;
    this._goalUuid = params.goalUuid;
    this._name = params.name;
    this._description = params.description;
    this._startValue = params.startValue || 0;
    this._targetValue = params.targetValue;
    this._currentValue = params.currentValue || params.startValue || 0;
    this._unit = params.unit;
    this._weight = params.weight || 10;
    this._calculationMethod = params.calculationMethod || 'sum';
    this._lifecycle = {
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      status: params.status || 'active',
    };
  }

  // ===== 只读属性 =====
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

  get status(): 'active' | 'completed' | 'archived' {
    return this._lifecycle.status;
  }

  get createdAt(): Date {
    return this._lifecycle.createdAt;
  }

  get updatedAt(): Date {
    return this._lifecycle.updatedAt;
  }

  // ===== 计算属性 =====
  get progress(): number {
    if (this._targetValue === 0) return 0;
    const progress =
      (this._currentValue - this._startValue) / (this._targetValue - this._startValue);
    return Math.max(0, Math.min(100, progress * 100));
  }

  get isCompleted(): boolean {
    return this._currentValue >= this._targetValue;
  }

  get remaining(): number {
    return Math.max(0, this._targetValue - this._currentValue);
  }

  get percentageToTarget(): number {
    if (this._targetValue === 0) return 0;
    return Math.min(100, (this._currentValue / this._targetValue) * 100);
  }

  // ===== 验证方法 =====
  protected validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('关键结果名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('关键结果名称不能超过100个字符');
    }
  }

  protected validateValue(value: number): void {
    if (value < 0) {
      throw new Error('数值不能为负数');
    }
  }

  protected validateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new Error('权重必须在0-100之间');
    }
  }

  // ===== 业务方法 =====

  /**
   * 更新关键结果信息
   */
  updateInfo(params: {
    name?: string;
    description?: string;
    targetValue?: number;
    unit?: string;
    weight?: number;
    calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
  }): void {
    if (params.name !== undefined) {
      this.validateName(params.name);
      this._name = params.name;
    }

    if (params.description !== undefined) {
      this._description = params.description;
    }

    if (params.targetValue !== undefined) {
      this.validateValue(params.targetValue);
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
   * 更新进度值
   */
  updateProgress(value: number, method: 'set' | 'increment' = 'set'): void {
    this.validateValue(value);

    if (method === 'set') {
      this._currentValue = value;
    } else {
      this._currentValue = Math.max(0, this._currentValue + value);
    }

    // 如果达到目标值，自动标记为完成
    if (this._currentValue >= this._targetValue && this._lifecycle.status === 'active') {
      this._lifecycle.status = 'completed';
    }

    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 重置进度
   */
  resetProgress(): void {
    this._currentValue = this._startValue;
    if (this._lifecycle.status === 'completed') {
      this._lifecycle.status = 'active';
    }
    this._lifecycle.updatedAt = new Date();
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

  static fromDTO(dto: GoalContracts.KeyResultDTO): KeyResultCore {
    throw new Error('Method not implemented. Use subclass implementations.');
  }

  // ===== 抽象方法（由子类实现）=====
  abstract complete(): void;
  abstract archive(): void;
  abstract reactivate(): void;
}
