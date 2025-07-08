import { DateTime } from "../../../../shared/types/myDateTime";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";

/**
 * MFA设备类型枚举
 */
export enum MFADeviceType {
  TOTP = 'totp',           // Time-based One-Time Password (Google Authenticator等)
  SMS = 'sms',             // 短信验证码
  EMAIL = 'email',         // 邮箱验证码
  HARDWARE_KEY = 'hardware_key', // 硬件密钥（如YubiKey）
  BACKUP_CODES = 'backup_codes'  // 备用验证码
}

/**
 * MFA设备实体
 * 管理多因素认证设备的绑定、验证和管理
 */
export class MFADevice {
  private _id: string;
  private _accountId: string;
  private _type: MFADeviceType;
  private _name: string;
  private _secretKey?: string; // TOTP密钥
  private _phoneNumber?: string; // SMS设备的手机号
  private _emailAddress?: string; // Email设备的邮箱
  private _backupCodes?: string[]; // 备用验证码
  private _isVerified: boolean;
  private _isEnabled: boolean;
  private _createdAt: DateTime;
  private _lastUsedAt?: DateTime;
  private _verificationAttempts: number;
  private _maxAttempts: number;

  constructor(
    id: string,
    accountId: string,
    type: MFADeviceType,
    name: string,
    maxAttempts: number = 3
  ) {
    this._id = id;
    this._accountId = accountId;
    this._type = type;
    this._name = name;
    this._isVerified = false;
    this._isEnabled = false;
    this._createdAt = TimeUtils.now();
    this._verificationAttempts = 0;
    this._maxAttempts = maxAttempts;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get accountId(): string {
    return this._accountId;
  }

  get type(): MFADeviceType {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get secretKey(): string | undefined {
    return this._secretKey;
  }

  get phoneNumber(): string | undefined {
    return this._phoneNumber;
  }

  get emailAddress(): string | undefined {
    return this._emailAddress;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get isEnabled(): boolean {
    return this._isEnabled && this._isVerified;
  }

  get createdAt(): DateTime {
    return this._createdAt;
  }

  get lastUsedAt(): DateTime | undefined {
    return this._lastUsedAt;
  }

  get verificationAttempts(): number {
    return this._verificationAttempts;
  }

  get isLocked(): boolean {
    return this._verificationAttempts >= this._maxAttempts;
  }

  /**
   * 设置TOTP密钥
   */
  setTOTPSecret(secretKey: string): void {
    if (this._type !== MFADeviceType.TOTP) {
      throw new Error('This device is not a TOTP device');
    }
    this._secretKey = secretKey;
  }

  /**
   * 设置SMS设备的手机号
   */
  setSMSPhoneNumber(phoneNumber: string): void {
    if (this._type !== MFADeviceType.SMS) {
      throw new Error('This device is not an SMS device');
    }
    this._phoneNumber = phoneNumber;
  }

  /**
   * 设置Email设备的邮箱
   */
  setEmailAddress(emailAddress: string): void {
    if (this._type !== MFADeviceType.EMAIL) {
      throw new Error('This device is not an Email device');
    }
    this._emailAddress = emailAddress;
  }

  /**
   * 设置备用验证码
   */
  setBackupCodes(codes: string[]): void {
    if (this._type !== MFADeviceType.BACKUP_CODES) {
      throw new Error('This device is not a backup codes device');
    }
    this._backupCodes = [...codes];
  }

  /**
   * 验证MFA代码
   */
  verify(code: string): boolean {
    if (this.isLocked) {
      throw new Error('Device is locked due to too many failed attempts');
    }

    let isValid = false;

    switch (this._type) {
      case MFADeviceType.TOTP:
        isValid = this.verifyTOTPCode(code);
        break;
      case MFADeviceType.SMS:
      case MFADeviceType.EMAIL:
        isValid = this.verifyTemporaryCode(code);
        break;
      case MFADeviceType.BACKUP_CODES:
        isValid = this.verifyBackupCode(code);
        break;
      case MFADeviceType.HARDWARE_KEY:
        isValid = this.verifyHardwareKey(code);
        break;
      default:
        isValid = false;
    }

    if (isValid) {
      this._lastUsedAt = TimeUtils.now();
      this._verificationAttempts = 0; // 重置失败次数
      
      if (!this._isVerified) {
        this._isVerified = true;
        this._isEnabled = true;
      }
    } else {
      this._verificationAttempts++;
    }

    return isValid;
  }

  /**
   * 启用设备
   */
  enable(): void {
    if (!this._isVerified) {
      throw new Error('Device must be verified before enabling');
    }
    this._isEnabled = true;
  }

  /**
   * 禁用设备
   */
  disable(): void {
    this._isEnabled = false;
  }

  /**
   * 重置失败尝试次数
   */
  resetAttempts(): void {
    this._verificationAttempts = 0;
  }

  /**
   * 生成TOTP代码（用于测试或显示）
   */
  generateTOTPCode(): string {
    if (this._type !== MFADeviceType.TOTP || !this._secretKey) {
      throw new Error('Cannot generate TOTP code for this device');
    }

    // 简化的TOTP实现（实际应用中应使用专业的TOTP库）
    const timeStep = Math.floor(Date.now() / 30000); // 30秒时间窗口
    const hash = this.simpleHash(this._secretKey + timeStep.toString());
    return (hash % 1000000).toString().padStart(6, '0');
  }

  /**
   * 生成备用验证码
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateRandomCode(8));
    }
    return codes;
  }

  /**
   * 验证TOTP代码
   */
  private verifyTOTPCode(code: string): boolean {
    if (!this._secretKey) return false;

    // 检查当前时间窗口和前后一个时间窗口
    const currentTimeStep = Math.floor(Date.now() / 30000);
    
    for (let i = -1; i <= 1; i++) {
      const timeStep = currentTimeStep + i;
      const hash = this.simpleHash(this._secretKey + timeStep.toString());
      const expectedCode = (hash % 1000000).toString().padStart(6, '0');
      
      if (code === expectedCode) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 验证临时代码（SMS/Email）
   */
  private verifyTemporaryCode(code: string): boolean {
    // 这里应该从缓存或数据库中获取发送的验证码进行比较
    // 简化实现，实际应用中需要与发送的验证码进行比较
    return code.length === 6 && /^\d{6}$/.test(code);
  }

  /**
   * 验证备用代码
   */
  private verifyBackupCode(code: string): boolean {
    if (!this._backupCodes) return false;

    const index = this._backupCodes.indexOf(code);
    if (index !== -1) {
      // 使用后立即删除备用代码
      this._backupCodes.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * 验证硬件密钥
   */
  private verifyHardwareKey(code: string): boolean {
    // 硬件密钥验证的简化实现
    // 实际应用中需要与硬件设备进行通信
    return code.length > 0;
  }

  /**
   * 简单哈希函数（仅用于演示）
   */
  private simpleHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 生成随机代码
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 转换为DTO对象
   */
  toDTO(): {
    id: string;
    accountId: string;
    type: MFADeviceType;
    name: string;
    isVerified: boolean;
    isEnabled: boolean;
    createdAt: string;
    lastUsedAt?: string;
    verificationAttempts: number;
    isLocked: boolean;
  } {
    return {
      id: this._id,
      accountId: this._accountId,
      type: this._type,
      name: this._name,
      isVerified: this._isVerified,
      isEnabled: this._isEnabled,
      createdAt: this._createdAt.toISOString(),
      lastUsedAt: this._lastUsedAt?.toISOString(),
      verificationAttempts: this._verificationAttempts,
      isLocked: this.isLocked
    };
  }

  /**
   * 从数据库行创建 MFADevice 对象
   */
  static fromDatabase(row: {
    id: string;
    account_id: string;
    type: string;
    name: string;
    secret_key?: string;
    phone_number?: string;
    email_address?: string;
    backup_codes?: string;
    is_verified: number;
    is_enabled: number;
    verification_attempts: number;
    max_attempts: number;
    created_at: number;
    last_used_at?: number;
  }): MFADevice {
    const device = new MFADevice(
      row.id,
      row.account_id,
      row.type as MFADeviceType,
      row.name,
      row.max_attempts
    );

    // 设置从数据库读取的属性
    (device as any)._secretKey = row.secret_key;
    (device as any)._phoneNumber = row.phone_number;
    (device as any)._emailAddress = row.email_address;
    (device as any)._backupCodes = row.backup_codes ? JSON.parse(row.backup_codes) : undefined;
    (device as any)._isVerified = Boolean(row.is_verified);
    (device as any)._isEnabled = Boolean(row.is_enabled);
    (device as any)._verificationAttempts = row.verification_attempts;
    (device as any)._createdAt = new Date(row.created_at);
    (device as any)._lastUsedAt = row.last_used_at ? new Date(row.last_used_at) : undefined;

    return device;
  }

  /**
   * 转换为数据库格式
   */
  toDatabaseFormat(): {
    id: string;
    account_id: string;
    type: string;
    name: string;
    secret_key?: string;
    phone_number?: string;
    email_address?: string;
    backup_codes?: string;
    is_verified: number;
    is_enabled: number;
    verification_attempts: number;
    max_attempts: number;
    created_at: number;
    last_used_at?: number;
  } {
    return {
      id: this._id,
      account_id: this._accountId,
      type: this._type,
      name: this._name,
      secret_key: this._secretKey,
      phone_number: this._phoneNumber,
      email_address: this._emailAddress,
      backup_codes: this._backupCodes ? JSON.stringify(this._backupCodes) : undefined,
      is_verified: this._isVerified ? 1 : 0,
      is_enabled: this._isEnabled ? 1 : 0,
      verification_attempts: this._verificationAttempts,
      max_attempts: this._maxAttempts,
      created_at: this._createdAt.getTime(),
      last_used_at: this._lastUsedAt?.getTime()
    };
  }
}
