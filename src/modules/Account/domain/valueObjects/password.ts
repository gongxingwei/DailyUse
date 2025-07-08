import * as crypto from 'crypto';

/**
 * Password 值对象
 * 不可变，修改时需要创建新实例
 */
export class Password {
  private readonly _hashedPassword: string;
  private readonly _salt: string;

  constructor(password: string, salt?: string) {
    this._salt = salt || this.generateSalt();
    this._hashedPassword = this.hashPassword(password, this._salt);
  }

  /**
   * 从已加密的密码创建实例（用于数据库读取）
   */
  static fromHash(hashedPassword: string, salt: string): Password {
    const instance = Object.create(Password.prototype);
    instance._hashedPassword = hashedPassword;
    instance._salt = salt;
    return instance;
  }

  get hashedPassword(): string {
    return this._hashedPassword;
  }

  get salt(): string {
    return this._salt;
  }

  /**
   * 验证密码是否正确
   */
  verify(plainPassword: string): boolean {
    const hashedInput = this.hashPassword(plainPassword, this._salt);
    return this._hashedPassword === hashedInput;
  }

  /**
   * 验证密码强度
   */
  static validateStrength(password: string): boolean {
    // 至少8位，包含大小写字母、数字
    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strengthRegex.test(password);
  }

  /**
   * 生成盐值
   */
  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 加密密码
   */
  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  /**
   * 值对象相等性比较
   */
  equals(other: Password): boolean {
    return this._hashedPassword === other._hashedPassword && this._salt === other._salt;
  }
}
