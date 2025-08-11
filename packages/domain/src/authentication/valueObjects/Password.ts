import { ValueObject } from '@dailyuse/utils';

export class Password extends ValueObject {
  private readonly _hashedValue: string;

  constructor(hashedValue: string) {
    super();
    this._hashedValue = hashedValue;
  }

  static async fromPlainText(plainTextPassword: string): Promise<Password> {
    // TODO: 实现真正的哈希算法，这里先用简单的方式
    const hashedValue = `hashed_${plainTextPassword}`;
    return new Password(hashedValue);
  }

  static fromHash(hashedValue: string): Password {
    return new Password(hashedValue);
  }

  async verify(plainTextPassword: string): Promise<boolean> {
    // TODO: 实现真正的验证逻辑
    return this._hashedValue === `hashed_${plainTextPassword}`;
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof Password)) {
      return false;
    }
    return this._hashedValue === other._hashedValue;
  }
}
