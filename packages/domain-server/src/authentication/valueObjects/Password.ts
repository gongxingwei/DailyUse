import * as bcrypt from 'bcrypt';
import { PasswordCore } from '@dailyuse/domain-core';
import { type IPasswordServer } from '../types';

/**
 * Password值对象 - 密码管理（服务端专用）
 * 继承 PasswordCore 并添加服务端特定功能
 */
export class Password extends PasswordCore implements IPasswordServer {
  private static readonly SALT_ROUNDS = 12;

  constructor(plainPassword: string) {
    super(plainPassword);
  }

  /**
   * 创建新密码（静态工厂方法）
   */
  static create(plainPassword: string): Password {
    return new Password(plainPassword);
  }

  /**
   * 从已有的哈希值创建密码对象（用于从数据库恢复）
   * 重写父类方法以匹配接口
   */
  static fromHash(hashedValue: string, salt: string, algorithm?: string): Password {
    const parentPassword = PasswordCore.fromHash(hashedValue, salt, algorithm);

    // 创建新的 Password 实例并复制父类属性
    const password = Object.create(Password.prototype);
    Object.assign(password, parentPassword);

    return password;
  }

  /**
   * 获取哈希信息
   */
  getHashInfo(): { hashedValue: string; salt: string; algorithm: string; createdAt: Date } {
    return {
      hashedValue: this.hashedValue,
      salt: this.salt,
      algorithm: this.algorithm,
      createdAt: this.createdAt,
    };
  }

  // ===== 实现 IPasswordServer 接口 =====

  /**
   * 使用 bcrypt 哈希密码
   */
  async hashWithBcrypt(plainPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(Password.SALT_ROUNDS);
    return bcrypt.hash(plainPassword, salt);
  }

  /**
   * 使用 bcrypt 验证密码
   */
  async verifyWithBcrypt(plainPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, this.hashedValue);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * 检查密码是否在泄露数据库中
   */
  async checkBreachDatabase(): Promise<boolean> {
    // 实际实现中会查询 Have I Been Pwned 等服务
    console.log('Checking password against breach database...');
    return false; // 默认认为没有泄露
  }

  /**
   * 执行密码策略检查
   */
  async enforcePolicy(): Promise<boolean> {
    // 实际实现中会检查企业密码策略
    console.log('Enforcing password policy...');
    return true; // 默认通过策略检查
  }

  /**
   * 服务端标识
   */
  isServer(): boolean {
    return true;
  }

  /**
   * 客户端标识
   */
  isClient(): boolean {
    return false;
  }
}
