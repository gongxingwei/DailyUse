import { Entity } from '@dailyuse/utils';
import { KeyResultCalculationMethod, KeyResultStatus } from '../types';

export class KeyResult extends Entity {
  private _name: string;
  private _startValue: number;
  private _targetValue: number;
  private _currentValue: number;
  private _calculationMethod: KeyResultCalculationMethod;
  private _weight: number;
  private _status: KeyResultStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    name: string;
    startValue: number;
    targetValue: number;
    currentValue?: number;
    calculationMethod: KeyResultCalculationMethod;
    weight: number;
    status?: KeyResultStatus;
  }) {
    super(params.uuid);
    this._name = params.name;
    this._startValue = params.startValue;
    this._targetValue = params.targetValue;
    this._currentValue = params.currentValue ?? params.startValue;
    this._calculationMethod = params.calculationMethod;
    this._weight = params.weight;
    this._status = params.status ?? KeyResultStatus.ACTIVE;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

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

  get calculationMethod(): KeyResultCalculationMethod {
    return this._calculationMethod;
  }

  get weight(): number {
    return this._weight;
  }

  get status(): KeyResultStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lifecycle() {
    return {
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      status: this._status,
    };
  }

  get progress(): number {
    const range = this._targetValue - this._startValue;
    if (range === 0) return 100;

    const current = this._currentValue - this._startValue;
    return Math.max(0, Math.min(100, (current / range) * 100));
  }

  get isCompleted(): boolean {
    return this.progress >= 100;
  }

  updateValue(value: number, method?: KeyResultCalculationMethod): void {
    const calculationMethod = method || this._calculationMethod;

    switch (calculationMethod) {
      case KeyResultCalculationMethod.SUM:
        this._currentValue += value;
        break;
      case KeyResultCalculationMethod.AVERAGE:
        // For average, we need to track count separately in a real implementation
        this._currentValue = value;
        break;
      case KeyResultCalculationMethod.MAX:
        this._currentValue = Math.max(this._currentValue, value);
        break;
      case KeyResultCalculationMethod.MIN:
        this._currentValue = Math.min(this._currentValue, value);
        break;
      case KeyResultCalculationMethod.CUSTOM:
        this._currentValue = value;
        break;
      default:
        this._currentValue = value;
    }

    this._updatedAt = new Date();

    if (this.isCompleted && this._status === KeyResultStatus.ACTIVE) {
      this._status = KeyResultStatus.COMPLETED;
    }
  }

  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  updateTargetValue(targetValue: number): void {
    this._targetValue = targetValue;
    this._updatedAt = new Date();
  }

  updateWeight(weight: number): void {
    if (weight < 0 || weight > 1) {
      throw new Error('Weight must be between 0 and 1');
    }
    this._weight = weight;
    this._updatedAt = new Date();
  }

  archive(): void {
    this._status = KeyResultStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._status = KeyResultStatus.ACTIVE;
    this._updatedAt = new Date();
  }
}
