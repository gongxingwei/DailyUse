import { MFADeviceCore } from '@dailyuse/domain-core';
import { type IMFADeviceServer } from '../types';
import { AuthenticationContracts } from '@dailyuse/contracts';
import { Authentication } from '@dailyuse/contracts';

type MFADeviceType = Authentication.MFADeviceType;
type MFADevicePersistenceDTO = AuthenticationContracts.MFADevicePersistenceDTO;
type MFADeviceDTO = AuthenticationContracts.MFADeviceDTO;
/**
 * 服务端MFA设备实体
 * 继承核心MFA设备实体，添加服务端特定的业务逻辑
 */
export class MFADevice extends MFADeviceCore implements IMFADeviceServer {
  /**
   * 发送验证码（服务端专用）
   */
  async sendVerificationCode(): Promise<boolean> {
    console.log(`发送验证码到MFA设备: ${this.name} (${this.type})`);

    switch (this.type) {
      case Authentication.MFADeviceType.SMS:
        return await this.sendSMSCode();
      case AuthenticationContracts.MFADeviceType.EMAIL:
        return await this.sendEmailCode();
      case Authentication.MFADeviceType.TOTP:
        // TOTP不需要发送代码，返回true
        return true;
      case Authentication.MFADeviceType.HARDWARE_TOKEN:
        return await this.activateHardwareKey();
      case Authentication.MFADeviceType.BACKUP_CODES:
        // 备用码不需要发送
        return true;
      default:
        return false;
    }
  }

  /**
   * 发送SMS验证码
   */
  private async sendSMSCode(): Promise<boolean> {
    if (!this.phoneNumber) {
      throw new Error('SMS device requires phone number');
    }

    // 实现SMS发送逻辑
    const tempCode = this.generateTempCode();
    console.log(`SMS验证码 ${tempCode} 已发送到: ${this.phoneNumber}`);
    return true;
  }

  /**
   * 发送邮箱验证码
   */
  private async sendEmailCode(): Promise<boolean> {
    if (!this.emailAddress) {
      throw new Error('Email device requires email address');
    }

    // 实现邮箱发送逻辑
    const tempCode = this.generateTempCode();
    console.log(`邮箱验证码 ${tempCode} 已发送到: ${this.emailAddress}`);
    return true;
  }

  /**
   * 激活硬件密钥
   */
  private async activateHardwareKey(): Promise<boolean> {
    // 实现硬件密钥激活逻辑
    console.log(`硬件密钥已激活: ${this.name}`);
    return true;
  }

  /**
   * 生成临时验证码
   */
  private generateTempCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 与外部服务验证（服务端专用）
   */
  async validateWithExternalService(): Promise<boolean> {
    console.log(`外部服务验证MFA设备: ${this.uuid}`);

    // 实现外部服务验证逻辑
    // 例如：与Google Authenticator服务验证TOTP
    // 与SMS网关验证手机号状态等

    switch (this.type) {
      case Authentication.MFADeviceType.TOTP:
        return await this.validateTOTPWithService();
      case Authentication.MFADeviceType.SMS:
        return await this.validateSMSWithGateway();
      case Authentication.MFADeviceType.EMAIL:
        return await this.validateEmailWithService();
      default:
        return true;
    }
  }

  /**
   * 与TOTP服务验证
   */
  private async validateTOTPWithService(): Promise<boolean> {
    // 实现TOTP外部验证
    return true;
  }

  /**
   * 与SMS网关验证
   */
  private async validateSMSWithGateway(): Promise<boolean> {
    // 实现SMS网关验证
    return true;
  }

  /**
   * 与邮箱服务验证
   */
  private async validateEmailWithService(): Promise<boolean> {
    // 实现邮箱服务验证
    return true;
  }

  /**
   * 记录安全事件（服务端专用）
   */
  async logSecurityEvent(event: string): Promise<void> {
    console.log(`MFA安全事件记录: ${this.uuid} - ${event}`);

    // 实现安全事件记录
    // await prisma.securityEvent.create({
    //   data: {
    //     deviceUuid: this.uuid,
    //     accountUuid: this.accountUuid,
    //     eventType: 'MFA_EVENT',
    //     event,
    //     timestamp: new Date(),
    //     metadata: {
    //       deviceType: this.type,
    //       deviceName: this.name
    //     }
    //   }
    // });
  }

  /**
   * 验证设备状态（服务端专用）
   */
  async validateDeviceStatus(): Promise<boolean> {
    // 检查设备是否被锁定
    if (this.isLocked) {
      await this.logSecurityEvent('Device access denied - locked due to failed attempts');
      return false;
    }

    // 检查设备是否启用
    if (!this.isEnabled) {
      await this.logSecurityEvent('Device access denied - disabled');
      return false;
    }

    // 检查设备是否验证
    if (!this.isVerified) {
      await this.logSecurityEvent('Device access denied - not verified');
      return false;
    }

    return true;
  }

  /**
   * 重置设备安全状态（服务端专用）
   */
  async resetSecurityState(): Promise<void> {
    this.resetAttempts();
    await this.logSecurityEvent('Device security state reset');

    // 保存到数据库
    // await this.saveToDatabase();
  }

  /**
   * 保存设备到数据库（服务端专用）
   */
  async saveToDatabase(): Promise<void> {
    console.log(`保存MFA设备到数据库: ${this.uuid}`);

    // 实现数据库保存逻辑
    // await prisma.mfaDevice.upsert({
    //   where: { uuid: this.uuid },
    //   update: this.toDatabaseFormat(),
    //   create: this.toDatabaseFormat()
    // });
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

  /**
   * 从持久化 DTO 创建 MFA 设备实体
   * 处理数据库数据到领域对象的转换
   */
  static fromPersistenceDTO(dto: MFADevicePersistenceDTO): MFADevice {
    // 解析备用码
    let backupCodes: string[] | undefined;
    const device = new MFADevice({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      type: dto.type as MFADeviceType,
      name: dto.name,
      maxAttempts: dto.maxAttempts || 5,
    });

    // 设置私有属性
    (device as any)._secretKey = dto.secretKey;
    (device as any)._phoneNumber = dto.phoneNumber;
    (device as any)._emailAddress = dto.emailAddress;
    (device as any)._backupCodes = backupCodes;
    (device as any)._isVerified = dto.isVerified;
    (device as any)._isEnabled = dto.isEnabled;
    (device as any)._verificationAttempts = dto.verificationAttempts || 0;
    (device as any)._createdAt = dto.createdAt;
    (device as any)._lastUsedAt = dto.lastUsedAt;

    return device;
  }

  /**
   * 创建服务端MFA设备（工厂方法）
   */
  static createServerDevice(params: {
    accountUuid: string;
    type: MFADeviceType;
    name: string;
    maxAttempts?: number;
  }): MFADevice {
    const device = new MFADevice({
      accountUuid: params.accountUuid,
      type: params.type,
      name: params.name,
      maxAttempts: params.maxAttempts || 5,
    });

    return device;
  }

  /**
   * 批量清理无效设备（静态方法，服务端专用）
   */
  static async cleanupInvalidDevices(): Promise<number> {
    console.log('清理无效MFA设备');

    // 实现清理无效设备的逻辑
    // const deletedCount = await prisma.mfaDevice.deleteMany({
    //   where: {
    //     OR: [
    //       { isVerified: false, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    //       { isEnabled: false, updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    //     ]
    //   }
    // });

    // return deletedCount.count;
    return 0;
  }

  toDatabase(): MFADevicePersistenceDTO {
    const dto: MFADevicePersistenceDTO = {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      type: this.type,
      name: this.name,
      secretKey: this.secretKey,
      phoneNumber: this.phoneNumber,
      emailAddress: this.emailAddress,
      isVerified: this.isVerified ? 1 : 0,
      isEnabled: this.isEnabled ? 1 : 0,
      createdAt: this.createdAt.getTime(),
      lastUsedAt: this.lastUsedAt ? this.lastUsedAt.getTime() : undefined,
      verificationAttempts: this.verificationAttempts,
      maxAttempts: this.maxAttempts,
    };
    return dto;
  }

  toDTO(): MFADeviceDTO {
    return {
      uuid: this.uuid,
      accountUuid: '', // Note: accountUuid should be provided by the caller/repository layer
      type: this.type,
      name: this.name,
      secretKey: this.secretKey,
      phoneNumber: this.phoneNumber,
      emailAddress: this.emailAddress,
      isVerified: this.isVerified,
      isEnabled: this.isEnabled,
      verificationAttempts: this.verificationAttempts,
      maxAttempts: this.maxAttempts,
      isLocked: this.verificationAttempts >= this.maxAttempts,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.createdAt.getTime(), // Use createdAt if updatedAt not tracked
      lastUsedAt: this.lastUsedAt ? this.lastUsedAt.getTime() : undefined,
    };
  }
}
