import { ValueObject } from '@dailyuse/utils';
import { type AccountContracts } from '@dailyuse/contracts';
type ISexCore = AccountContracts.ISexCore;
/**
 * 性别值对象核心类
 */
export class SexCore extends ValueObject implements ISexCore {
  private readonly _value: number; // 核心值：性别
  private readonly _updatedAt?: Date;

  constructor(value?: number, updatedAt?: Date) {
    super();
    this._value = value || SexCore.generateDefaultSexValue();
    this._updatedAt = updatedAt || new Date();
  }

  // ===== 核心值属性 =====
  get value(): number {
    return this._value;
  }

  // ===== 共享只读属性 =====
  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  static generateDefaultSexValue(): number {
    return 2;
  }

  // ===== 值对象相等性比较 =====
  equals(other: ValueObject): boolean {
    if (!(other instanceof SexCore)) {
      return false;
    }
    return this._value === other._value;
  }

  // ===== 便利方法（保留向后兼容性） =====
  equalsSex(other: SexCore): boolean {
    return this.equals(other);
  }
  override toString(): string {
    if (this._value === 1) {
      return '男';
    } else if (this._value === 0) {
      return '女';
    }
    return '未知';
  }
}
