import { Entity } from "@/shared/domain/entity";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import type { IKeyResult, IKeyResultCreateDTO } from "../../../../../common/modules/goal/types/goal";

/**
 * 关键结果领域实体
 * 作为 Goal 聚合内的实体，负责关键结果的业务逻辑和数据管理
 * 注意：KeyResult 不是聚合根，它的生命周期由 Goal 聚合根管理
 */
export class KeyResult extends Entity implements IKeyResult {
  private _name: string;
  private _startValue: number;
  private _targetValue: number;
  private _currentValue: number;
  private _calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
  private _weight: number;
  private _lifecycle: IKeyResult['lifecycle'];

  constructor(
    uuid: string,
    name: string,
    startValue: number,
    targetValue: number,
    currentValue: number,
    calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom',
    weight: number
  ) {
    super(uuid);
    const now = TimeUtils.now();

    this._name = name;
    this._startValue = startValue;
    this._targetValue = targetValue;
    this._currentValue = currentValue;
    this._calculationMethod = calculationMethod;
    this._weight = weight;

    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
      status: "active",
    };
  }

  // Getters
  get name(): string {
    return this._name;
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

  get calculationMethod(): 'sum' | 'average' | 'max' | 'min' | 'custom' {
    return this._calculationMethod;
  }

  get weight(): number {
    return this._weight;
  }

  get lifecycle(): IKeyResult['lifecycle'] {
    return this._lifecycle;
  }

  /**
   * 计算进度百分比
   */
  get progress(): number {
    if (this._targetValue === this._startValue) return 0;
    const progress = (this._currentValue - this._startValue) / (this._targetValue - this._startValue);
    return Math.max(0, Math.min(100, progress * 100));
  }

  /**
   * 是否已完成
   */
  get isCompleted(): boolean {
    return this._currentValue >= this._targetValue;
  }

  /**
   * 计算加权进度
   * 根据权重和进度计算加权进度
   * @return 加权进度百分比
   */
  get weightedProgress(): number {
    if (this._targetValue === this._startValue) return 0;
    const progress = (this._currentValue - this._startValue) / (this._targetValue - this._startValue);
    return Math.max(0, Math.min(100, progress * 100 * (this._weight / 10)));
  }
  
  /**
   * 更新当前值
   */
  updateCurrentValue(newValue: number): void {
    if (newValue < 0) {
      throw new Error("当前值不能为负数");
    }

    this._currentValue = newValue;
    this._lifecycle.updatedAt = TimeUtils.now();

    // 如果达到目标值，标记为完成
    if (this.isCompleted && this._lifecycle.status === "active") {
      this._lifecycle.status = "completed";
    } else if (!this.isCompleted && this._lifecycle.status === "completed") {
      this._lifecycle.status = "active";
    }
  }

  /**
   * 增加值
   */
  addValue(increment: number): void {
    this.updateCurrentValue(this._currentValue + increment);
  }

  /**
   * 更新基本信息
   */
  updateBasicInfo(updates: {
    name?: string;
    targetValue?: number;
    weight?: number;
    calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
  }): void {
    if (updates.name !== undefined) {
      this._name = updates.name;
    }
    if (updates.targetValue !== undefined) {
      if (updates.targetValue <= this._startValue) {
        throw new Error("目标值必须大于起始值");
      }
      this._targetValue = updates.targetValue;
    }
    if (updates.weight !== undefined) {
      if (updates.weight < 0 || updates.weight > 10) {
        throw new Error("权重必须在 0-10 之间");
      }
      this._weight = updates.weight;
    }
    if (updates.calculationMethod !== undefined) {
      this._calculationMethod = updates.calculationMethod;
    }

    this._lifecycle.updatedAt = TimeUtils.now();
  }

  /**
   * 归档关键结果
   */
  archive(): void {
    this._lifecycle.status = "archived";
    this._lifecycle.updatedAt = TimeUtils.now();
  }



  /**
   * 转换为数据传输对象
   */
  toDTO(): IKeyResult {
    const rawData = {
      uuid: this.uuid,
      name: this._name,
      startValue: this._startValue,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      calculationMethod: this._calculationMethod,
      weight: this._weight,
      lifecycle: this._lifecycle,
    };

    // 使用深度序列化确保返回纯净的 JSON 对象
    try {
      return JSON.parse(JSON.stringify(rawData));
    } catch (error) {
      console.error('❌ [KeyResult.toDTO] 序列化失败:', error);
      // 如果序列化失败，返回基本信息
      return {
        uuid: this.uuid,
        name: this._name,
        startValue: this._startValue,
        targetValue: this._targetValue,
        currentValue: this._currentValue,
        calculationMethod: this._calculationMethod,
        weight: this._weight,
        lifecycle: JSON.parse(JSON.stringify(this._lifecycle)),
      };
    }
  }

  /**
   * 导出完整数据（用于序列化）
   */
  toJSON(): IKeyResult {
    return this.toDTO();
  }

  /**
   * 从数据传输对象创建关键结果
   */
  static fromDTO(data: IKeyResult): KeyResult {
    const keyResult = new KeyResult(
      data.uuid,
      data.name,
      data.startValue,
      data.targetValue,
      data.currentValue,
      data.calculationMethod,
      data.weight
    );

    keyResult._lifecycle = data.lifecycle;
    return keyResult;
  }

  /**
   * 从创建数据传输对象创建关键结果
   */
  static fromCreateDTO(uuid: string, data: IKeyResultCreateDTO): KeyResult {
    return new KeyResult(
      uuid,
      data.name,
      data.startValue,
      data.targetValue,
      data.currentValue,
      data.calculationMethod,
      data.weight
    );
  }

  clone(): KeyResult {
    const clone = new KeyResult(
      this.uuid,
      this._name,
      this._startValue,
      this._targetValue,
      this._currentValue,
      this._calculationMethod,
      this._weight
    );
    clone._lifecycle = { ...this._lifecycle };
    return clone;
  }
  
  /**
   * 验证关键结果数据
   */
  static validate(data: IKeyResultCreateDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push("关键结果名称不能为空");
    }

    if (data.targetValue <= data.startValue) {
      errors.push("目标值必须大于起始值");
    }

    if (data.weight < 0 || data.weight > 10) {
      errors.push("权重必须在 0-10 之间");
    }

    if (data.currentValue < 0) {
      errors.push("当前值不能为负数");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
