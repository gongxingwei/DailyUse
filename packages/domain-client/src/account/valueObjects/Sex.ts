import { SexCore } from '@dailyuse/domain-core';
import { type ISexClient } from '../types';

/**
 * 客户端性别值对象 - 包含UI相关的性别操作
 */
export class Sex extends SexCore implements ISexClient {
  constructor(value?: 'male' | 'female' | 'other' | number) {
    if (typeof value === 'string') {
      const numericValue = value === 'male' ? 1 : value === 'female' ? 0 : 2;
      super(numericValue);
    } else {
      super(value);
    }
  }

  // ===== ISexClient 方法 =====
  getDisplayText(): string {
    switch (this.value) {
      case 1:
        return '男性';
      case 0:
        return '女性';
      case 2:
        return '其他';
      default:
        return '未指定';
    }
  }

  formatForDisplay(): string {
    return this.getDisplayText();
  }

  getIcon(): string {
    switch (this.value) {
      case 1:
        return '♂️';
      case 0:
        return '♀️';
      case 2:
        return '⚧️';
      default:
        return '❓';
    }
  }

  getDisplayIcon(): string {
    return this.getIcon();
  }

  showSelectionDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      const options = Sex.getAllOptions();
      console.log('性别选择对话框:', options);

      // 模拟用户选择，实际实现中会显示UI对话框
      setTimeout(() => {
        resolve(true); // 返回选择成功
      }, 100);
    });
  }

  formatForUI(): { text: string; icon: string; value: number } {
    return {
      text: this.getDisplayText(),
      icon: this.getIcon(),
      value: this.value,
    };
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 静态工厂方法 =====
  static fromString(sexString: string): Sex {
    const normalized = sexString.toLowerCase();
    switch (normalized) {
      case 'male':
      case '男':
      case '男性':
        return new Sex('male');
      case 'female':
      case '女':
      case '女性':
        return new Sex('female');
      case 'other':
      case '其他':
        return new Sex('other');
      default:
        throw new Error(`Invalid sex value: ${sexString}`);
    }
  }

  static getAllOptions(): Array<{ text: string; icon: string; value: number }> {
    return [new Sex(1).formatForUI(), new Sex(2).formatForUI(), new Sex(3).formatForUI()];
  }
}
