import { DateTime } from "../types/myDateTime";

/**
 * 时间工具类
 * 主进程版本
 */
export class TimeUtils {
  /**
   * 获取当前时间
   */
  static now(): DateTime {
    return new Date();
  }

  /**
   * 格式化时间
   */
  static format(date: DateTime, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    // 简单的时间格式化实现
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 解析时间字符串
   */
  static parse(dateString: string): DateTime {
    return new Date(dateString);
  }

  /**
   * 添加时间
   */
  static add(date: DateTime, amount: number, unit: 'days' | 'hours' | 'minutes' | 'seconds'): DateTime {
    const result = new Date(date.getTime());
    
    switch (unit) {
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'hours':
        result.setHours(result.getHours() + amount);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'seconds':
        result.setSeconds(result.getSeconds() + amount);
        break;
    }
    
    return result;
  }

  /**
   * 将 DateTime 转换为时间戳（毫秒）
   */
  static toTimestamp(date: DateTime): number {
    return date.getTime();
  }

  /**
   * 从时间戳（毫秒）创建 DateTime
   */
  static fromTimestamp(timestamp: number): DateTime {
    return new Date(timestamp);
  }

  /**
   * 将 DateTime 转换为 Unix 时间戳（秒）
   */
  static toUnixTimestamp(date: DateTime): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * 从 Unix 时间戳（秒）创建 DateTime
   */
  static fromUnixTimestamp(timestamp: number): DateTime {
    return new Date(timestamp * 1000);
  }
}
