import { Entity } from "@dailyuse/utils";
import type { IKeyResult } from "@common/modules/goal";
import { isValid } from "date-fns";

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

  constructor(params: {
    uuid?: string;
    name: string;
    startValue: number;
    targetValue: number;
    currentValue: number;
    calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
    weight: number;
    lifecycle?: {
      createdAt?: Date;
      updatedAt?: Date;
      status?: "active" | "completed" | "archived";
    };
  }) {
    super(params.uuid || KeyResult.generateUUID());
    const now = new Date();

    this._name = params.name;
    this._startValue = params.startValue;
    this._targetValue = params.targetValue;
    this._currentValue = params.currentValue;
    this._calculationMethod = params.calculationMethod;
    this._weight = params.weight;

    this._lifecycle = {
      createdAt: params.lifecycle?.createdAt && isValid(params.lifecycle.createdAt)
        ? params.lifecycle.createdAt
        : now,
      updatedAt: params.lifecycle?.updatedAt && isValid(params.lifecycle.updatedAt)
        ? params.lifecycle.updatedAt
        : now,
      status: params.lifecycle?.status || "active",
    };
  }

  // Getters & Setters
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    if (!value.trim()) throw new Error("关键结果名称不能为空");
    this._name = value;
    this._lifecycle.updatedAt = new Date();
  }

  get startValue(): number {
    return this._startValue;
  }
  set startValue(value: number) {
    this._startValue = value;
    this._lifecycle.updatedAt = new Date();
  }

  get targetValue(): number {
    return this._targetValue;
  }
  set targetValue(value: number) {
    if (value <= this._startValue) throw new Error("目标值必须大于起始值");
    this._targetValue = value;
    this._lifecycle.updatedAt = new Date();
  }

  get currentValue(): number {
    return this._currentValue;
  }
  set currentValue(value: number) {
    if (value < 0) throw new Error("当前值不能为负数");
    this._currentValue = value;
    this._lifecycle.updatedAt = new Date();
    // 如果达到目标值，标记为完成
    if (this.isCompleted && this._lifecycle.status === "active") {
      this._lifecycle.status = "completed";
    } else if (!this.isCompleted && this._lifecycle.status === "completed") {
      this._lifecycle.status = "active";
    }
  }

  get calculationMethod(): 'sum' | 'average' | 'max' | 'min' | 'custom' {
    return this._calculationMethod;
  }
  set calculationMethod(value: 'sum' | 'average' | 'max' | 'min' | 'custom') {
    this._calculationMethod = value;
    this._lifecycle.updatedAt = new Date();
  }

  get weight(): number {
    return this._weight;
  }
  set weight(value: number) {
    if (value < 0 || value > 10) throw new Error("权重必须在 0-10 之间");
    this._weight = value;
    this._lifecycle.updatedAt = new Date();
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
   * 判断对象是否为 KeyResult 或 IKeyResult
   */
  static isKeyResult(obj: any): obj is KeyResult | IKeyResult {
    return obj instanceof KeyResult ||
      (obj && typeof obj === 'object' && 'uuid' in obj && 'name' in obj && 'startValue' in obj && 'targetValue' in obj);
  }

  /**
   * 保证返回 KeyResult 实例或 null
   * @param kr 可能为 DTO、实体或 null
   */
  static ensureKeyResult(kr: IKeyResult | KeyResult | null): KeyResult | null {
    if (KeyResult.isKeyResult(kr)) {
      return kr instanceof KeyResult ? kr : KeyResult.fromDTO(kr);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 KeyResult 实例，永不为 null
   * @param kr 可能为 DTO、实体或 null
   */
  static ensureKeyResultNeverNull(kr: IKeyResult | KeyResult | null): KeyResult {
    if (KeyResult.isKeyResult(kr)) {
      return kr instanceof KeyResult ? kr : KeyResult.fromDTO(kr);
    } else {
      // 默认创建一个空的关键结果
      return new KeyResult({
        name: "",
        startValue: 0,
        targetValue: 1,
        currentValue: 0,
        calculationMethod: "sum",
        weight: 1,
      });
    }
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): IKeyResult {
    return {
      uuid: this.uuid,
      name: this._name,
      startValue: this._startValue,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      calculationMethod: this._calculationMethod,
      weight: this._weight,
      lifecycle: { ...this._lifecycle },
    };
  }

  /**
   * 从数据传输对象创建关键结果
   */
  static fromDTO(data: IKeyResult): KeyResult {
    return new KeyResult({
      uuid: data.uuid,
      name: data.name,
      startValue: data.startValue,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      calculationMethod: data.calculationMethod,
      weight: data.weight,
      lifecycle: {
        createdAt: isValid(data.lifecycle.createdAt) ? new Date(data.lifecycle.createdAt) : new Date(),
        updatedAt: isValid(data.lifecycle.updatedAt) ? new Date(data.lifecycle.updatedAt) : new Date(),
        status: data.lifecycle.status || "active",
      },
    });
  }

  clone(): KeyResult {
    return new KeyResult({
      uuid: this.uuid,
      name: this._name,
      startValue: this._startValue,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      calculationMethod: this._calculationMethod,
      weight: this._weight,
      lifecycle: { ...this._lifecycle },
    });
  }

  static forCreate(): KeyResult {
    return new KeyResult({
      name: '',
      startValue: 0,
      targetValue: 10,
      currentValue: 0,
      calculationMethod: 'sum',
      weight: 4,
    });
  }

}
