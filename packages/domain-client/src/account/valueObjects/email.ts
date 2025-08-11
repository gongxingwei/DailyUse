import { EmailCore } from '@dailyuse/domain-core';
import { type IEmailClient } from '../types';

/**
 * 客户端邮箱值对象 - 包含UI相关的邮箱操作
 */
export class Email extends EmailCore implements IEmailClient {
  constructor(value: string) {
    super(value);
  }

  // ===== IEmailClient 方法 =====
  showVerificationDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(`Showing email verification dialog for: ${this.value}`);

      // 模拟验证对话框，实际实现中会显示UI
      const mockVerification = Math.random() > 0.3; // 70% 成功率

      setTimeout(() => {
        if (mockVerification) {
          console.log('Email verification successful');
          resolve(true);
        } else {
          console.log('Email verification failed');
          resolve(false);
        }
      }, 1500);
    });
  }

  copyToClipboard(): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(this.value)
        .then(() => {
          console.log('Email copied to clipboard:', this.value);
        })
        .catch((err) => {
          console.error('Failed to copy email to clipboard:', err);
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Email copied to clipboard (fallback):', this.value);
    }
  }

  validateFormat(): { valid: boolean; message: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(this.value);

    if (!isValid) {
      return {
        valid: false,
        message: '邮箱格式不正确，请输入有效的邮箱地址',
      };
    }

    // 检查是否为常见的无效格式
    const commonInvalids = ['.@', '@.', '..', '@@'];

    for (const invalid of commonInvalids) {
      if (this.value.includes(invalid)) {
        return {
          valid: false,
          message: '邮箱包含无效字符组合',
        };
      }
    }

    return {
      valid: true,
      message: '邮箱格式正确',
    };
  }

  suggestCorrection(input: string): string | null {
    const commonDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      '163.com',
      'qq.com',
      '126.com',
    ];

    // 检查是否缺少域名
    if (input.includes('@') && !input.includes('.')) {
      const parts = input.split('@');
      if (parts.length === 2) {
        const domain = parts[1].toLowerCase();

        // 查找相似的域名
        for (const commonDomain of commonDomains) {
          if (
            commonDomain.startsWith(domain) ||
            this.levenshteinDistance(domain, commonDomain) <= 2
          ) {
            return `${parts[0]}@${commonDomain}`;
          }
        }
      }
    }

    // 检查常见的拼写错误
    const corrections: { [key: string]: string } = {
      gmail: 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      yahoo: 'yahoo.com',
      'yaho.com': 'yahoo.com',
    };

    for (const [wrong, correct] of Object.entries(corrections)) {
      if (input.toLowerCase().includes(wrong)) {
        return input.replace(new RegExp(wrong, 'gi'), correct);
      }
    }

    return null;
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 私有辅助方法 =====
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    // 初始化矩阵
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // 填充矩阵
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 替换
            matrix[i][j - 1] + 1, // 插入
            matrix[i - 1][j] + 1, // 删除
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // ===== 客户端特定的业务方法 =====
  getDomain(): string {
    const atIndex = this.value.indexOf('@');
    return atIndex !== -1 ? this.value.substring(atIndex + 1) : '';
  }

  getLocalPart(): string {
    const atIndex = this.value.indexOf('@');
    return atIndex !== -1 ? this.value.substring(0, atIndex) : this.value;
  }

  isCommonDomain(): boolean {
    const domain = this.getDomain().toLowerCase();
    const commonDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      '163.com',
      'qq.com',
      '126.com',
      'sina.com',
    ];
    return commonDomains.includes(domain);
  }

  // ===== 静态工厂方法 =====
  static create(email: string): Email {
    const instance = new Email(email);
    const validation = instance.validateFormat();

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return instance;
  }

  static createWithSuggestion(email: string): { email: Email | null; suggestion: string | null } {
    try {
      const instance = new Email(email);
      const validation = instance.validateFormat();

      if (validation.valid) {
        return { email: instance, suggestion: null };
      } else {
        const suggestion = instance.suggestCorrection(email);
        return { email: null, suggestion };
      }
    } catch (error) {
      return { email: null, suggestion: null };
    }
  }
}
