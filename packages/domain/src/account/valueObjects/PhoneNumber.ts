import { ValueObject } from '@dailyuse/utils';

export class PhoneNumber extends ValueObject {
  private readonly _number: string;
  private readonly _countryCode: string;
  private readonly _isVerified: boolean;

  constructor(number: string, countryCode: string = '+86', isVerified: boolean = false) {
    super();
    if (!this.isValidPhoneNumber(number)) {
      throw new Error('Invalid phone number format');
    }
    this._number = number;
    this._countryCode = countryCode;
    this._isVerified = isVerified;
  }

  get number(): string {
    return this._number;
  }

  get countryCode(): string {
    return this._countryCode;
  }

  get fullNumber(): string {
    return `${this._countryCode}${this._number}`;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  verify(): PhoneNumber {
    return new PhoneNumber(this._number, this._countryCode, true);
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof PhoneNumber)) {
      return false;
    }
    return (
      this._number === other._number &&
      this._countryCode === other._countryCode &&
      this._isVerified === other._isVerified
    );
  }

  private isValidPhoneNumber(phone: string): boolean {
    // 简单的手机号验证，可根据实际需求调整
    return /^\d{10,15}$/.test(phone);
  }
}
