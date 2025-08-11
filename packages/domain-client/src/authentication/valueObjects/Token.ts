import { TokenCore, TokenType } from '@dailyuse/domain-core';
import { type ITokenClient } from '../types';

/**
 * 客户端令牌值对象 - 包含UI相关的令牌管理
 */
export class Token extends TokenCore implements ITokenClient {
  // ===== ITokenClient 方法 =====
  saveToSecureStorage(): void {
    // 保存到安全存储（如加密的localStorage或indexedDB）
    const tokenData = {
      value: this.value,
      type: this.type,
      accountUuid: this.accountUuid,
      issuedAt: this.issuedAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      deviceInfo: this.deviceInfo,
      isRevoked: this.isRevoked,
    };

    // 使用加密存储（简化示例）
    const encryptedData = btoa(JSON.stringify(tokenData));
    localStorage.setItem(`secure_token_${this.type}_${this.accountUuid}`, encryptedData);
  }

  removeFromSecureStorage(): void {
    // 从安全存储中移除令牌
    const storageKey = `secure_token_${this.type}_${this.accountUuid}`;
    localStorage.removeItem(storageKey);
  }

  displayInUI(): string {
    // 生成用于UI显示的令牌格式
    const truncatedValue =
      this.value.length > 20
        ? `${this.value.substring(0, 8)}...${this.value.substring(this.value.length - 8)}`
        : this.value;

    return `${this.getTypeDisplayName()}: ${truncatedValue}`;
  }

  copyToClipboard(): void {
    // 复制令牌值到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(this.value)
        .then(() => {
          console.log('Token copied to clipboard');
          // 这里可以显示成功提示
        })
        .catch(() => {
          console.error('Failed to copy token to clipboard');
          // 这里可以显示错误提示
        });
    } else {
      // 降级处理：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = this.value;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Token copied to clipboard (fallback)');
      } catch (err) {
        console.error('Failed to copy token to clipboard (fallback)');
      }
      document.body.removeChild(textArea);
    }
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  getTypeDisplayName(): string {
    const typeMap = {
      [TokenType.REMEMBER_ME]: '记住我令牌',
      [TokenType.ACCESS_TOKEN]: '访问令牌',
      [TokenType.REFRESH_TOKEN]: '刷新令牌',
      [TokenType.EMAIL_VERIFICATION]: '邮箱验证令牌',
      [TokenType.PASSWORD_RESET]: '密码重置令牌',
    };

    return typeMap[this.type] || '未知令牌类型';
  }

  getExpiryStatus(): 'valid' | 'expiring' | 'expired' {
    if (this.isExpired()) {
      return 'expired';
    }
    if (this.isNearExpiry()) {
      return 'expiring';
    }
    return 'valid';
  }

  getFormattedRemainingTime(): string {
    const remainingMs = this.getRemainingTime();
    if (remainingMs <= 0) {
      return '已过期';
    }

    const minutes = Math.floor(remainingMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天${hours % 24}小时`;
    }
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    }
    return `${minutes}分钟`;
  }

  showExpiryWarning(): void {
    if (this.isNearExpiry()) {
      console.log(`Token will expire in ${this.getFormattedRemainingTime()}`);
      // 这里可以触发UI警告组件
    }
  }

  // ===== 静态工厂方法 =====
  static fromSecureStorage(type: TokenType, accountUuid: string): Token | null {
    try {
      const storageKey = `secure_token_${type}_${accountUuid}`;
      const encryptedData = localStorage.getItem(storageKey);

      if (!encryptedData) return null;

      const tokenData = JSON.parse(atob(encryptedData));

      return new Token({
        value: tokenData.value,
        type: tokenData.type,
        accountUuid: tokenData.accountUuid,
        issuedAt: new Date(tokenData.issuedAt),
        expiresAt: new Date(tokenData.expiresAt),
        deviceInfo: tokenData.deviceInfo,
        isRevoked: tokenData.isRevoked,
      });
    } catch (error) {
      console.error('Failed to load token from secure storage:', error);
      return null;
    }
  }

  static createClientRememberMe(accountUuid: string, deviceInfo?: string): Token {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
    const value = Token.generateClientTokenValue();

    return new Token({
      value,
      type: TokenType.REMEMBER_ME,
      accountUuid,
      expiresAt,
      deviceInfo,
    });
  }

  static createClientAccessToken(accountUuid: string, deviceInfo?: string): Token {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时
    const value = Token.generateClientTokenValue();

    return new Token({
      value,
      type: TokenType.ACCESS_TOKEN,
      accountUuid,
      expiresAt,
      deviceInfo,
    });
  }

  private static generateClientTokenValue(): string {
    // 生成客户端令牌值
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  static generateClientValue(): string {
    return Token.generateClientTokenValue();
  }
}
