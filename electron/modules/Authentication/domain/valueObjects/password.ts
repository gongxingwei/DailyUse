import { IPassword, IPasswordDTO } from "@common/modules/authentication/types/authentication";


/**
 * 密码值对象
 * 封装密码相关的业务逻辑和验证
 */
export class Password implements IPassword {
  private readonly _hashedValue: string;
  private readonly _salt: string;
  private readonly _algorithm: string;
  private readonly _createdAt: Date;
  private readonly _expiresAt: Date | undefined;

  constructor(plainPassword: string) {
    if (!Password.validateStrength(plainPassword)) {
      throw new Error('密码强度不足');
    }

    this._salt = this.generateSalt();
    this._algorithm = 'bcrypt'; // 实际应用中应使用真正的加密算法
    this._hashedValue = this.hashPassword(plainPassword, this._salt);
    this._createdAt = new Date();
    this._expiresAt = undefined;
  }

  /**
   * 从已有的哈希值创建密码对象（用于从数据库恢复）
   */
  static fromHash(hashedValue: string, salt: string, algorithm: string = 'bcrypt'): Password {
    const password = Object.create(Password.prototype);
    password._hashedValue = hashedValue;
    password._salt = salt;
    password._algorithm = algorithm;
    password._createdAt = new Date();
    password._expiresAt = undefined;
    return password;
  }

  /**
   * 从已有的哈希值和时间戳创建密码对象（用于从数据库恢复）
   */
  static fromHashWithTimestamp(
    hashedValue: string, 
    salt: string, 
    algorithm: string, 
    createdAt: Date,
    expiresAt?: Date | undefined
  ): Password {
    const password = Object.create(Password.prototype);
    password._hashedValue = hashedValue;
    password._salt = salt;
    password._algorithm = algorithm;
    password._createdAt = createdAt;
    password._expiresAt = expiresAt;
    return password;
  }

  /**
   * 验证密码
   */
  verify(plainPassword: string): boolean {
    const hashedInput = this.hashPassword(plainPassword, this._salt);
    return hashedInput === this._hashedValue;
  }

  /**
 * 验证密码强度（至少满足3个条件）
 */
static validateStrength(password: string): boolean {
  if (password.length < 8) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const criteriaMet = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  return criteriaMet >= 3;
}

  /**
   * 获取密码强度等级
   */
  static getStrengthLevel(password: string): 'weak' | 'medium' | 'strong' | 'very-strong' {
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (criteriaCount >= 4 && password.length >= 12) return 'very-strong';
    if (criteriaCount >= 3) return 'strong';
    if (criteriaCount >= 2) return 'medium';
    return 'weak';
  }

  /**
   * 检查密码是否需要更新（例如：创建时间超过一定期限）
   */
  needsUpdate(maxAgeInDays: number = 90): boolean {
    const now = new Date();
    const ageInMilliseconds = now.getTime() - this._createdAt.getTime();
    const ageInDays = ageInMilliseconds / (1000 * 60 * 60 * 24);
    return ageInDays > maxAgeInDays;
  }

  // Getters
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
    return this._expiresAt;
  }

  /**
   * 生成盐值
   */
  private generateSalt(): string {
    // 实际应用中应使用加密库生成随机盐值
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 哈希密码
   */
  private hashPassword(password: string, salt: string): string {
    // 这里是简化实现，实际应用中应使用 bcrypt、scrypt 或 Argon2 等安全哈希算法
    // 仅用于演示目的
    const combined = password + salt;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }
}
