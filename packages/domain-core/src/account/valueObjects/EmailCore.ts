import { ValueObject } from '@dailyuse/utils';
import { type AccountContracts } from "@dailyuse/contracts";
type IEmailCore = AccountContracts.IEmailCore;
/**
 * 邮箱值对象核心类
 */
export class EmailCore extends ValueObject implements IEmailCore {
  private readonly _value: string;
  private readonly _isVerified: boolean;
  private readonly _verifiedAt?: Date;

  constructor(value: string, isVerified: boolean = false, verifiedAt?: Date) {
    super();
    this.validate(value);
    this._value = value.toLowerCase().trim();
    this._isVerified = isVerified;
    this._verifiedAt = verifiedAt;
  }

  protected validate(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('邮箱地址不能为空');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('邮箱格式不正确');
    }
  }

  // ===== 共享只读属性 =====
  get value(): string {
    return this._value;
  }
  get isVerified(): boolean {
    return this._isVerified;
  }
  get verifiedAt(): Date | undefined {
    return this._verifiedAt;
  }

  // ===== 共享计算属性 =====
  get domain(): string {
    return this._value.split('@')[1];
  }

  get localPart(): string {
    return this._value.split('@')[0];
  }

  get isGmail(): boolean {
    return this.domain === 'gmail.com';
  }

  get isOutlook(): boolean {
    return ['outlook.com', 'hotmail.com', 'live.com'].includes(this.domain);
  }

  // ===== 值对象相等性比较 =====
  equals(other: ValueObject): boolean {
    if (!(other instanceof EmailCore)) {
      return false;
    }
    return this._value === other._value;
  }

  // ===== 便利方法（保留向后兼容性） =====
  equalsEmail(other: EmailCore): boolean {
    return this.equals(other);
  }

  verify(): EmailCore {
    return new EmailCore(this._value, true, new Date());
  }

  toString(): string {
    return this._value;
  }
}
