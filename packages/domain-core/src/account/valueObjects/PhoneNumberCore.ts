import { ValueObject } from '@dailyuse/utils';
import { type AccountContracts } from '@dailyuse/contracts';
type IPhoneNumberCore = AccountContracts.IPhoneNumberCore;
/**
 * 手机号值对象核心类
 */
export class PhoneNumberCore extends ValueObject implements IPhoneNumberCore {
  private readonly _value: string; // 核心值：完整的手机号
  private readonly _number: string;
  private readonly _countryCode: string;
  private readonly _isVerified: boolean;
  private readonly _verifiedAt?: Date;

  constructor(
    number: string,
    countryCode: string = '+86',
    isVerified: boolean = false,
    verifiedAt?: Date,
  ) {
    super();
    this.validate(number, countryCode);
    this._number = number.trim();
    this._countryCode = countryCode;
    this._value = `${countryCode}${number.trim()}`; // 核心值
    this._isVerified = isVerified;
    this._verifiedAt = verifiedAt;
  }

  protected validate(number: string, countryCode: string): void {
    if (!number || number.trim().length === 0) {
      throw new Error('手机号不能为空');
    }

    if (!countryCode || countryCode.trim().length === 0) {
      throw new Error('国家代码不能为空');
    }

    // 简单的中国手机号验证
    if (countryCode === '+86') {
      const phoneRegex = /^\d{11}$/;
      if (!phoneRegex.test(number)) {
        throw new Error('手机号格式不正确');
      }
    }
  }

  // ===== 核心值属性 =====
  get value(): string {
    return this._value;
  }

  // ===== 共享只读属性 =====
  get number(): string {
    return this._number;
  }
  get countryCode(): string {
    return this._countryCode;
  }
  get isVerified(): boolean {
    return this._isVerified;
  }
  get verifiedAt(): Date | undefined {
    return this._verifiedAt;
  }

  // ===== 共享计算属性 =====
  get fullNumber(): string {
    return `${this._countryCode}${this._number}`;
  }

  get formattedNumber(): string {
    if (this._countryCode === '+86' && this._number.length === 11) {
      return `${this._number.substring(0, 3)} ${this._number.substring(3, 7)} ${this._number.substring(7)}`;
    }
    return this._number;
  }

  get displayNumber(): string {
    return `${this._countryCode} ${this.formattedNumber}`;
  }

  // ===== 值对象相等性比较 =====
  equals(other: ValueObject): boolean {
    if (!(other instanceof PhoneNumberCore)) {
      return false;
    }
    return this._value === other._value;
  }

  // ===== 便利方法（保留向后兼容性） =====
  equalsPhoneNumber(other: PhoneNumberCore): boolean {
    return this.equals(other);
  }

  verify(): PhoneNumberCore {
    return new PhoneNumberCore(this._number, this._countryCode, true, new Date());
  }

  override toString(): string {
    return this.fullNumber;
  }
}
