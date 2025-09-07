/**
 * Email 值对象
 * 不可变，修改时需要创建新实例
 */
export class Email {
  private readonly _value: string;
  private readonly _isVerified: boolean;

  constructor(email: string, isVerified: boolean = false) {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    this._value = email.toLowerCase();
    this._isVerified = isVerified;
  }

  get value(): string {
    return this._value;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  /**
   * 创建已验证的邮箱实例
   */
  verify(): Email {
    return new Email(this._value, true);
  }

  /**
   * 邮箱格式验证
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 值对象相等性比较
   */
  equals(other: Email): boolean {
    return this._value === other._value && this._isVerified === other._isVerified;
  }

  toString(): string {
    return this._value;
  }
}
