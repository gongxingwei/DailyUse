import { PhoneNumberCore } from '@dailyuse/domain-core';
import { type IPhoneNumber } from '../types';
/**
 * 服务端手机号值对象
 * 继承核心手机号对象，添加服务端特定的业务逻辑
 */
export class PhoneNumber extends PhoneNumberCore implements IPhoneNumber {
  isClient(): boolean {
    return false;
  }
  isServer(): boolean {
    return true;
  }
  /**
   * 验证手机号 - 服务端版本
   */
  verify(): PhoneNumber {
    return new PhoneNumber(this.number, this.countryCode, true, new Date());
  }

  /**
   * 发送SMS验证码（服务端专用）
   */
  async sendSMSVerification(): Promise<boolean> {
    console.log(`发送SMS验证码到: ${this.fullNumber}`);
    return true;
  }

  /**
   * 静态工厂方法
   */
  static fromValue(value: string): PhoneNumber {
    // 解析完整手机号
    if (value.startsWith('+')) {
      const countryCode = value.substring(0, 3);
      const number = value.substring(3);
      return new PhoneNumber(number, countryCode);
    }
    return new PhoneNumber(value);
  }
}
