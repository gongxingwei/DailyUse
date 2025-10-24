/**
 * PhoneNumber 值对象
 * 不可变，修改时需要创建新实例
 */
export class PhoneNumber {
  private readonly _number: string;
  private readonly _countryCode: string;
  private readonly _isVerified: boolean;

  constructor(number: string, countryCode: string = '+86', isVerified: boolean = false) {
    if (!this.isValidPhoneNumber(number)) {
      throw new Error('Invalid phone number format');
    }
    this._number = this.normalizePhoneNumber(number);
    this._countryCode = countryCode;
    this._isVerified = isVerified;
  }

  get number(): string {
    return this._number;
  }

  get countryCode(): string {
    return this._countryCode;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get fullNumber(): string {
    return `${this._countryCode}${this._number}`;
  }

  /**
   * 创建已验证的手机号实例
   */
  verify(): PhoneNumber {
    return new PhoneNumber(this._number, this._countryCode, true);
  }

  /**
   * 手机号格式验证
   */
  private isValidPhoneNumber(number: string): boolean {
    // 中国手机号验证规则
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(this.normalizePhoneNumber(number));
  }

  /**
   * 标准化手机号格式
   */
  private normalizePhoneNumber(number: string): string {
    return number.replace(/\D/g, ''); // 移除所有非数字字符
  }

  /**
   * 值对象相等性比较
   */
  equals(other: PhoneNumber): boolean {
    return (
      this._number === other._number &&
      this._countryCode === other._countryCode &&
      this._isVerified === other._isVerified
    );
  }

  toString(): string {
    return this.fullNumber;
  }
}
