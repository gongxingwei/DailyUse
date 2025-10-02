import { EmailCore } from '@dailyuse/domain-core';
import { AccountContracts } from '@dailyuse/contracts';
type IEmail = AccountContracts.IEmailServer;
/**
 * 服务端邮箱值对象
 * 继承核心邮箱对象，添加服务端特定的业务逻辑
 */
export class Email extends EmailCore implements IEmail {
  isClient(): boolean {
    return false;
  }
  isServer(): boolean {
    return true;
  }
  /**
   * 验证邮箱 - 服务端版本
   * 返回新的已验证Email实例
   */
  verify(): Email {
    return new Email(this.value, true, new Date());
  }

  /**
   * 发送验证邮件（服务端专用）
   */
  async sendVerificationEmail(): Promise<boolean> {
    // 服务端特定的邮件发送逻辑
    console.log(`发送验证邮件到: ${this.value}`);

    // 这里可以集成邮件服务，如 SendGrid、Nodemailer 等
    // await emailService.send({
    //   to: this.value,
    //   subject: '邮箱验证',
    //   template: 'verification'
    // });

    return true;
  }

  /**
   * 检查邮箱是否在黑名单中（服务端专用）
   */
  async isBlacklisted(): Promise<boolean> {
    // 服务端特定的黑名单检查逻辑
    const blacklistedDomains = ['tempmail.com', '10minutemail.com'];
    return blacklistedDomains.includes(this.domain);
  }

  /**
   * 生成邮箱验证令牌（服务端专用）
   */
  generateVerificationToken(): string {
    // 服务端特定的令牌生成逻辑
    return `${this.value}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 静态工厂方法
   */
  static fromValue(value: string): Email {
    return new Email(value);
  }
}
