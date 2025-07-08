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
}
