import { PasswordCore } from '@dailyuse/domain-core';
import { type IPasswordClient } from '../types';

/**
 * 客户端密码值对象 - 包含UI相关的密码管理
 */
export class Password extends PasswordCore implements IPasswordClient {
  // ===== IPasswordClient 方法 =====
  validateStrength(): { score: number; feedback: string[] } {
    const password = ''; // 注意：客户端不应存储明文密码
    const feedback: string[] = [];
    let score = 0;

    // 这里使用基本的强度检查规则
    const checks = [
      { test: () => password.length >= 8, message: '至少8个字符', points: 1 },
      { test: () => /[A-Z]/.test(password), message: '包含大写字母', points: 1 },
      { test: () => /[a-z]/.test(password), message: '包含小写字母', points: 1 },
      { test: () => /\d/.test(password), message: '包含数字', points: 1 },
      {
        test: () => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password),
        message: '包含特殊字符',
        points: 2,
      },
      { test: () => password.length >= 12, message: '至少12个字符', points: 1 },
    ];

    for (const check of checks) {
      if (check.test()) {
        score += check.points;
      } else {
        feedback.push(check.message);
      }
    }

    return { score: Math.min(score, 5), feedback };
  }

  showStrengthIndicator(): void {
    // 显示密码强度指示器的客户端逻辑
    console.log('Showing password strength indicator');
    // 这里可以触发 UI 组件显示强度指示器
  }

  checkCommonPasswords(): boolean {
    // 检查是否为常见密码（客户端本地检查）
    const commonPasswords = [
      'password',
      '123456',
      'password123',
      'admin',
      'qwerty',
      'letmein',
      'welcome',
      'monkey',
    ];

    // 注意：这里无法获取实际密码，只能做示例
    // 实际实现中可能需要在输入时进行检查
    return false;
  }

  generateSecurePassword(): string {
    // 生成安全密码的客户端逻辑
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // 确保至少包含每种类型的字符
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // 填充到16位
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // 随机打乱字符顺序
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  async hashForStorage(plainPassword: string): Promise<string> {
    // 客户端密码哈希（用于本地存储等场景）
    // 注意：这不应用于安全认证，只用于本地验证
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  copyToClipboard(): void {
    // 将生成的密码复制到剪贴板
    const password = this.generateSecurePassword();
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(password)
        .then(() => {
          console.log('Password copied to clipboard');
        })
        .catch(() => {
          console.error('Failed to copy password to clipboard');
        });
    }
  }

  // ===== 静态工厂方法 =====
  static override fromHash(
    hashedValue: string,
    salt: string,
    algorithm: string = 'SHA-256',
  ): Password {
    // 使用 PasswordCore 的 fromHash 方法创建基础对象
    const basePassword = PasswordCore.fromHash(hashedValue, salt, algorithm);

    // 创建 Password 客户端实例
    const password = Object.create(Password.prototype);
    password._value = (basePassword as any)._value;
    password._hashedValue = (basePassword as any)._hashedValue;
    password._salt = (basePassword as any)._salt;
    password._algorithm = (basePassword as any)._algorithm;
    password._createdAt = (basePassword as any)._createdAt;
    password._expiresAt = (basePassword as any)._expiresAt;

    return password;
  }

  static createFromParams(params: {
    hashedValue: string;
    salt: string;
    algorithm?: string;
    createdAt?: Date;
  }): Password {
    return Password.fromHash(params.hashedValue, params.salt, params.algorithm);
  }
}
