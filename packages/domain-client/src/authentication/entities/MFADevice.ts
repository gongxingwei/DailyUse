import { MFADeviceCore, MFADeviceType } from '@dailyuse/domain-core';
import { type IMFADeviceClient } from '../types';

/**
 * 客户端MFA设备实体 - 包含UI相关的MFA管理
 */
export class MFADevice extends MFADeviceCore implements IMFADeviceClient {
  // ===== IMFADeviceClient 方法 =====
  async renderQRCode(): Promise<string> {
    if (this.type !== MFADeviceType.TOTP) {
      throw new Error('QR Code is only available for TOTP devices');
    }

    if (!this.secretKey) {
      throw new Error('Secret key is required for QR code generation');
    }

    // 生成 TOTP QR 码 URL
    const issuer = 'DailyUse';
    const label = `${issuer}:${this.name}`;
    const qrUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${this.secretKey}&issuer=${encodeURIComponent(issuer)}`;

    return qrUrl;
  }

  async showActivationDialog(): Promise<boolean> {
    // 显示激活对话框的客户端逻辑
    return new Promise((resolve) => {
      console.log(`Showing activation dialog for MFA device: ${this.name}`);
      // 这里可以触发 UI 组件显示激活对话框
      // 模拟用户确认激活
      setTimeout(() => {
        this.enable();
        resolve(true);
      }, 1000);
    });
  }

  cacheVerificationCode(code: string): void {
    // 临时缓存验证码(用于离线验证等场景)
    const cacheKey = `mfa_code_${this.uuid}`;
    const cacheData = {
      code,
      timestamp: Date.now(),
      expires: Date.now() + 5 * 60 * 1000, // 5分钟过期
    };

    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
  }

  clearLocalCache(): void {
    // 清理本地缓存的验证码和相关数据
    const cacheKey = `mfa_code_${this.uuid}`;
    sessionStorage.removeItem(cacheKey);

    // 清理其他相关缓存
    localStorage.removeItem(`mfa_device_${this.uuid}`);
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  getFormattedType(): string {
    const typeMap = {
      [MFADeviceType.TOTP]: '身份验证器应用',
      [MFADeviceType.SMS]: '短信验证',
      [MFADeviceType.EMAIL]: '邮箱验证',
      [MFADeviceType.HARDWARE_KEY]: '硬件密钥',
      [MFADeviceType.BACKUP_CODES]: '备用验证码',
    };

    return typeMap[this.type] || '未知设备类型';
  }

  canShowQRCode(): boolean {
    return this.type === MFADeviceType.TOTP && !!this.secretKey;
  }

  getStatusText(): string {
    if (!this.isVerified) {
      return '未验证';
    }
    if (!this.isEnabled) {
      return '已禁用';
    }
    if (this.isLocked) {
      return '已锁定';
    }
    return '正常';
  }

  // ===== 静态工厂方法 =====
  static create(params: {
    accountUuid: string;
    type: MFADeviceType;
    name: string;
    secretKey?: string;
    phoneNumber?: string;
    emailAddress?: string;
  }): MFADevice {
    const device = new MFADevice({
      accountUuid: params.accountUuid,
      type: params.type,
      name: params.name,
      maxAttempts: 5, // 默认最大尝试次数
    });

    // 手动设置可选属性
    if (params.secretKey) {
      (device as any)._secretKey = params.secretKey;
    }
    if (params.phoneNumber) {
      (device as any)._phoneNumber = params.phoneNumber;
    }
    if (params.emailAddress) {
      (device as any)._emailAddress = params.emailAddress;
    }

    return device;
  }

  static fromPersistence(params: {
    uuid: string;
    accountUuid: string;
    type: MFADeviceType;
    name: string;
    secretKey?: string;
    phoneNumber?: string;
    emailAddress?: string;
    isVerified: boolean;
    isEnabled: boolean;
    createdAt: Date;
    lastUsedAt?: Date;
    verificationAttempts: number;
    maxAttempts: number;
  }): MFADevice {
    const device = new MFADevice({
      uuid: params.uuid,
      accountUuid: params.accountUuid,
      type: params.type,
      name: params.name,
      maxAttempts: params.maxAttempts,
    });

    // 手动设置所有状态属性
    if (params.secretKey) {
      (device as any)._secretKey = params.secretKey;
    }
    if (params.phoneNumber) {
      (device as any)._phoneNumber = params.phoneNumber;
    }
    if (params.emailAddress) {
      (device as any)._emailAddress = params.emailAddress;
    }
    (device as any)._isVerified = params.isVerified;
    (device as any)._isEnabled = params.isEnabled;
    (device as any)._createdAt = params.createdAt;
    (device as any)._lastUsedAt = params.lastUsedAt;
    (device as any)._verificationAttempts = params.verificationAttempts;

    return device;
  }
}
