import { PhoneNumberCore } from '@dailyuse/domain-core';
import { type IPhoneNumberClient } from '../types';

/**
 * 客户端电话号码值对象 - 包含UI相关的电话号码操作
 */
export class PhoneNumber extends PhoneNumberCore implements IPhoneNumberClient {
  constructor(phoneNumber: string, countryCode?: string) {
    super(phoneNumber, countryCode);
  }

  // ===== IPhoneNumberClient 方法 =====
  formatForDisplay(): string {
    const number = this.number;
    const country = this.countryCode || '+86';

    // 格式化中国大陆手机号
    if (country === '+86' && number.length === 11) {
      return `${country} ${number.substring(0, 3)} ${number.substring(3, 7)} ${number.substring(7)}`;
    }

    // 其他国家或格式
    return `${country} ${number}`;
  }

  showVerificationDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      const displayNumber = this.formatForDisplay();
      console.log(`Showing phone verification dialog for: ${displayNumber}`);

      // 模拟发送验证码
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`Verification code sent: ${verificationCode}`);

      // 模拟用户输入验证码
      setTimeout(() => {
        const mockSuccess = Math.random() > 0.2; // 80% 成功率

        if (mockSuccess) {
          console.log('Phone verification successful');
          resolve(true);
        } else {
          console.log('Phone verification failed');
          resolve(false);
        }
      }, 2000);
    });
  }

  copyToClipboard(): void {
    const numberToCopy = this.formatForDisplay();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(numberToCopy)
        .then(() => {
          console.log('Phone number copied to clipboard:', numberToCopy);
        })
        .catch((err) => {
          console.error('Failed to copy phone number to clipboard:', err);
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = numberToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Phone number copied to clipboard (fallback):', numberToCopy);
    }
  }

  validateInput(): { valid: boolean; message: string } {
    const phone = this.number;
    const country = this.countryCode || '+86';

    // 验证中国大陆手机号
    if (country === '+86') {
      if (!phone || phone.length !== 11) {
        return {
          valid: false,
          message: '中国大陆手机号应为11位数字',
        };
      }

      const mobileRegex = /^1[3-9]\d{9}$/;
      if (!mobileRegex.test(phone)) {
        return {
          valid: false,
          message: '手机号格式不正确，应以1开头且第二位为3-9之间的数字',
        };
      }
    } else {
      // 基本的国际号码验证
      if (!phone || phone.length < 7 || phone.length > 15) {
        return {
          valid: false,
          message: '电话号码长度应在7-15位之间',
        };
      }

      if (!/^\d+$/.test(phone)) {
        return {
          valid: false,
          message: '电话号码只能包含数字',
        };
      }
    }

    return {
      valid: true,
      message: '电话号码格式正确',
    };
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  getCarrier(): string {
    const phone = this.number;
    const country = this.countryCode || '+86';

    if (country === '+86' && phone.length === 11) {
      const prefix = phone.substring(0, 3);

      // 中国大陆运营商判断
      const carriers: { [key: string]: string[] } = {
        中国移动: [
          '134',
          '135',
          '136',
          '137',
          '138',
          '139',
          '147',
          '150',
          '151',
          '152',
          '157',
          '158',
          '159',
          '178',
          '182',
          '183',
          '184',
          '187',
          '188',
          '198',
        ],
        中国联通: ['130', '131', '132', '145', '155', '156', '166', '175', '176', '185', '186'],
        中国电信: ['133', '149', '153', '173', '177', '180', '181', '189', '199'],
      };

      for (const [carrier, prefixes] of Object.entries(carriers)) {
        if (prefixes.includes(prefix)) {
          return carrier;
        }
      }
    }

    return '未知运营商';
  }

  isRoaming(): boolean {
    // 模拟漫游状态检测，实际实现可能需要调用API
    return Math.random() > 0.8; // 20% 概率在漫游
  }

  canReceiveSMS(): boolean {
    // 检查号码是否能接收短信
    const validation = this.validateInput();
    return validation.valid;
  }

  formatForSMS(): string {
    // 返回适合SMS发送的格式
    const country = this.countryCode || '+86';
    return `${country}${this.number}`;
  }

  // ===== 静态工厂方法 =====
  static create(phoneNumber: string, countryCode?: string): PhoneNumber {
    const instance = new PhoneNumber(phoneNumber, countryCode);
    const validation = instance.validateInput();

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return instance;
  }

  static createFromDisplay(displayNumber: string): PhoneNumber {
    // 从显示格式解析电话号码
    // 例如: "+86 138 0013 8000" -> phoneNumber: "13800138000", countryCode: "+86"

    const cleaned = displayNumber.replace(/\s+/g, '');
    const match = cleaned.match(/^(\+\d+)(\d+)$/);

    if (match) {
      return new PhoneNumber(match[2], match[1]);
    }

    // 如果没有国家代码，假设是本地号码
    const numbersOnly = displayNumber.replace(/\D/g, '');
    return new PhoneNumber(numbersOnly);
  }

  static getCountryCodes(): Array<{ code: string; name: string; flag: string }> {
    return [
      { code: '+86', name: '中国', flag: '🇨🇳' },
      { code: '+1', name: '美国/加拿大', flag: '🇺🇸' },
      { code: '+81', name: '日本', flag: '🇯🇵' },
      { code: '+82', name: '韩国', flag: '🇰🇷' },
      { code: '+44', name: '英国', flag: '🇬🇧' },
      { code: '+33', name: '法国', flag: '🇫🇷' },
      { code: '+49', name: '德国', flag: '🇩🇪' },
    ];
  }
}
