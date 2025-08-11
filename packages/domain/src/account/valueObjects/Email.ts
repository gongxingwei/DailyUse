import { ValueObject } from '@dailyuse/utils';

export class Email extends ValueObject {
  private readonly _value: string;
  private readonly _isVerified: boolean;

  constructor(value: string, isVerified: boolean = false) {
    super();
    if (!this.isValidEmail(value)) {
      throw new Error('Invalid email format');
    }
    this._value = value.toLowerCase();
    this._isVerified = isVerified;
  }

  get value(): string {
    return this._value;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  verify(): Email {
    return new Email(this._value, true);
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof Email)) {
      return false;
    }
    return this._value === other._value && this._isVerified === other._isVerified;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
