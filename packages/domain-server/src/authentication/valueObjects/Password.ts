import * as bcrypt from 'bcrypt';
import { ValueObject } from '@dailyuse/utils';
import { type IPasswordServer } from '../types';

/**
 * Password值对象 - 密码管理
 */
export class Password extends ValueObject implements IPasswordServer {
  private static readonly SALT_ROUNDS = 12;
  private static readonly ALGORITHM = 'bcrypt';

  private readonly _hashedValue: string;
  private readonly _salt: string;
  private readonly _algorithm: string;
  private readonly _createdAt: Date;

  constructor(
    plainPasswordOrParams:
      | string
      | {
          hashedValue: string;
          salt: string;
          algorithm?: string;
          createdAt?: Date;
        },
  ) {
    super();

    if (typeof plainPasswordOrParams === 'string') {
      // 同步哈希密码
      const salt = bcrypt.genSaltSync(Password.SALT_ROUNDS);
      const hashedValue = bcrypt.hashSync(plainPasswordOrParams, salt);

      this._hashedValue = hashedValue;
      this._salt = salt;
      this._algorithm = Password.ALGORITHM;
      this._createdAt = new Date();
    } else {
      // 从已有参数构造
      this._hashedValue = plainPasswordOrParams.hashedValue;
      this._salt = plainPasswordOrParams.salt;
      this._algorithm = plainPasswordOrParams.algorithm || Password.ALGORITHM;
      this._createdAt = plainPasswordOrParams.createdAt || new Date();
    }
  }

  // ===== IPasswordCore 属性访问器 =====
  get hashedValue(): string {
    return this._hashedValue;
  }

  get salt(): string {
    return this._salt;
  }

  get algorithm(): string {
    return this._algorithm;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get expiresAt(): Date | undefined {
    return undefined; // 默认密码不过期
  }

  // ===== IPasswordCore 方法 =====
  verify(password: string): boolean {
    return bcrypt.compareSync(password, this._hashedValue);
  }

  // ===== IPasswordServer 方法 =====
  async hashWithBcrypt(plainPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(Password.SALT_ROUNDS);
    return bcrypt.hash(plainPassword, salt);
  }

  async verifyWithBcrypt(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this._hashedValue);
  }

  async checkBreachDatabase(): Promise<boolean> {
    // TODO: 实现密码泄露检查
    return false;
  }

  async enforcePolicy(): Promise<boolean> {
    // TODO: 实现密码策略检查
    return true;
  }

  isServer(): boolean {
    return true;
  }

  isClient(): boolean {
    return false;
  }

  // ===== 业务方法 =====
  async verifyAsync(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this._hashedValue);
  }

  isExpired(maxAgeInDays: number = 90): boolean {
    const ageInMs = Date.now() - this._createdAt.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    return ageInDays > maxAgeInDays;
  }

  getHashInfo(): {
    hashedValue: string;
    salt: string;
    algorithm: string;
    createdAt: Date;
  } {
    return {
      hashedValue: this._hashedValue,
      salt: this._salt,
      algorithm: this._algorithm,
      createdAt: this._createdAt,
    };
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof Password)) {
      return false;
    }
    return this._hashedValue === other._hashedValue && this._salt === other._salt;
  }

  // ===== 静态工厂方法 =====
  static async create(plainPassword: string): Promise<Password> {
    if (!this.isValidPassword(plainPassword)) {
      throw new Error('Password does not meet security requirements');
    }

    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const hashedValue = await bcrypt.hash(plainPassword, salt);

    return new Password({
      hashedValue,
      salt,
      algorithm: this.ALGORITHM,
      createdAt: new Date(),
    });
  }

  static fromHash(params: {
    hashedValue: string;
    salt: string;
    algorithm?: string;
    createdAt?: Date;
  }): Password {
    return new Password(params);
  }

  // ===== 密码验证规则 =====
  private static isValidPassword(password: string): boolean {
    // 至少8位，包含大小写字母、数字和特殊字符
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password);

    return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }
}
