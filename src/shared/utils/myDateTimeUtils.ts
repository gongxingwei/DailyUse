import type { TimePoint, DateTime, DateInfo } from '@/shared/types/myDateTime';

export class TimeUtils {
  // ===============================
  // 核心创建方法
  // ===============================

  /**
   * 创建时间点
   */
  static createTimePoint(hour: number, minute: number, timezone?: string): TimePoint {
    return {
      hour: Math.max(0, Math.min(23, hour)),
      minute: Math.max(0, Math.min(59, minute)),
      timezone
    };
  }

  /**
   * 创建日期时间
   */
  static createDateTime(year: number, month: number, day: number, time?: TimePoint): DateTime {
    const date: DateInfo = { year, month, day };
    const jsDate = new Date(year, month - 1, day, time?.hour || 0, time?.minute || 0);
    
    return {
      date,
      time,
      timestamp: jsDate.getTime(),
      isoString: jsDate.toISOString()
    };
  }

  // ===============================
  // 类型检查和转换
  // ===============================

  /**
   * 检查是否为有效的 DateTime 对象
   */
  static isDateTime(obj: any): obj is DateTime {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.timestamp === 'number' &&
           typeof obj.isoString === 'string' &&
           obj.date && 
           typeof obj.date === 'object' &&
           typeof obj.date.year === 'number' &&
           typeof obj.date.month === 'number' &&
           typeof obj.date.day === 'number';
  }

  /**
   * 从ISO字符串创建DateTime
   */
  static fromISOString(isoString: string): DateTime {
    const jsDate = new Date(isoString);
    
    if (isNaN(jsDate.getTime())) {
      throw new Error(`Invalid ISO string: ${isoString}`);
    }
    
    return {
      date: {
        year: jsDate.getFullYear(),
        month: jsDate.getMonth() + 1,
        day: jsDate.getDate()
      },
      time: {
        hour: jsDate.getHours(),
        minute: jsDate.getMinutes()
      },
      timestamp: jsDate.getTime(),
      isoString: isoString // 使用原始字符串，避免重新生成
    };
  }

  /**
   * 从时间戳创建DateTime
   */
  static fromTimestamp(timestamp: number): DateTime {
    const jsDate = new Date(timestamp);
    
    if (isNaN(jsDate.getTime())) {
      throw new Error(`Invalid timestamp: ${timestamp}`);
    }
    
    return {
      date: {
        year: jsDate.getFullYear(),
        month: jsDate.getMonth() + 1,
        day: jsDate.getDate()
      },
      time: {
        hour: jsDate.getHours(),
        minute: jsDate.getMinutes()
      },
      timestamp: timestamp,
      isoString: jsDate.toISOString()
    };
  }

  /**
   * 获取当前时间
   */
  static now(): DateTime {
    return this.fromTimestamp(Date.now());
  }

  /**
   * 从各种格式创建 DateTime
   */
  static toDateTime(input: Date | string | number | DateTime): DateTime {
    if (this.isDateTime(input)) {
      return input as DateTime;
    }
    
    if (typeof input === 'number') {
      return this.fromTimestamp(input);
    }
    
    if (typeof input === 'string') {
      return this.fromISOString(input);
    }
    
    if (input instanceof Date) {
      return this.fromTimestamp(input.getTime());
    }
    
    throw new Error('Invalid input type for DateTime conversion');
  }

  /**
   * 安全地从任意输入创建 DateTime
   */
  static safeToDateTime(input: any): DateTime | null {
    if (!input) return null;
    
    try {
      // 如果是字符串，直接解析
      if (typeof input === 'string') {
        return this.fromISOString(input);
      }
      
      // 如果是数字（时间戳）
      if (typeof input === 'number') {
        return this.fromTimestamp(input);
      }
      
      // 如果是 Date 对象
      if (input instanceof Date) {
        return this.fromTimestamp(input.getTime());
      }
      
      // 如果是对象，需要仔细检查
      if (typeof input === 'object') {
        // 检查是否是有效的 DateTime 结构并且没有循环引用
        if (this.isDateTime(input)) {
          // 重新从基础数据创建，避免潜在的循环引用
          return this.fromTimestamp(input.timestamp);
        }
        
        // 处理可能的循环引用情况
        if (typeof input.timestamp === 'number') {
          return this.fromTimestamp(input.timestamp);
        }
        
        // 尝试提取嵌套的有效数据（处理循环引用）
        let current = input;
        let depth = 0;
        const maxDepth = 10;
        
        while (current && depth < maxDepth) {
          if (typeof current.timestamp === 'number') {
            return this.fromTimestamp(current.timestamp);
          }
          
          if (typeof current.isoString === 'string') {
            return this.fromISOString(current.isoString);
          }
          
          if (current.isoString && typeof current.isoString === 'object') {
            current = current.isoString;
            depth++;
          } else {
            break;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to convert to DateTime:', input, error);
    }
    
    return null;
  }

  /**
   * 确保返回有效的 DateTime 对象
   */
  static ensureDateTime(input: any): DateTime {
    const result = this.safeToDateTime(input);
    return result || this.now();
  }

  // ===============================
  // 时间操作方法
  // ===============================

  /**
   * 更新日期但保持时间不变
   */
  static updateDateKeepTime(existingDateTime: DateTime, dateInput: string | DateInfo): DateTime {
    let newDate: DateInfo;
    
    if (typeof dateInput === 'string') {
      // 解析 YYYY-MM-DD 格式的字符串
      const [year, month, day] = dateInput.split('-').map(Number);
      newDate = { year, month, day };
    } else {
      newDate = dateInput;
    }
    
    return {
      ...existingDateTime,
      date: newDate,
      timestamp: new Date(
        newDate.year,
        newDate.month - 1,
        newDate.day,
        existingDateTime.time?.hour || 0,
        existingDateTime.time?.minute || 0
      ).getTime(),
      isoString: new Date(
        newDate.year,
        newDate.month - 1,
        newDate.day,
        existingDateTime.time?.hour || 0,
        existingDateTime.time?.minute || 0
      ).toISOString()
    };
  }

  /**
   * 更新时间但保持日期不变
   */
  static updateTimeKeepDate(existingDateTime: DateTime, timeInput: string | TimePoint): DateTime {
    let newTime: TimePoint;
    
    if (typeof timeInput === 'string') {
      // 解析 HH:mm 格式的字符串
      const [hour, minute] = timeInput.split(':').map(Number);
      newTime = { hour, minute };
    } else {
      newTime = timeInput;
    }
    
    return {
      ...existingDateTime,
      time: newTime,
      timestamp: new Date(
        existingDateTime.date.year,
        existingDateTime.date.month - 1,
        existingDateTime.date.day,
        newTime.hour,
        newTime.minute
      ).getTime(),
      isoString: new Date(
        existingDateTime.date.year,
        existingDateTime.date.month - 1,
        existingDateTime.date.day,
        newTime.hour,
        newTime.minute
      ).toISOString()
    };
  }

  /**
   * 更新日期（用于结束时间等场景）
   */
  static updateDate(existingDateTime: DateTime, dateInput: string | DateInfo): DateTime {
    return this.updateDateKeepTime(existingDateTime, dateInput);
  }

  /**
   * 更新时间（用于结束时间等场景）
   */
  static updateTime(existingDateTime: DateTime, timeInput: string | TimePoint): DateTime {
    return this.updateTimeKeepDate(existingDateTime, timeInput);
  }

  /**
   * 获取一天的开始时间
   */
  static startOfDay(dateTime: DateTime): DateTime {
    const { year, month, day } = dateTime.date;
    const jsDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    return {
      date: { year, month, day },
      time: { hour: 0, minute: 0 },
      timestamp: jsDate.getTime(),
      isoString: jsDate.toISOString()
    };
  }

  /**
   * 获取一天的结束时间
   */
  static endOfDay(dateTime: DateTime): DateTime {
    const { year, month, day } = dateTime.date;
    const jsDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    return {
      date: { year, month, day },
      time: { hour: 23, minute: 59 },
      timestamp: jsDate.getTime(),
      isoString: jsDate.toISOString()
    };
  }

  /**
   * 添加分钟
   */
  static addMinutes(dateTime: DateTime, minutes: number): DateTime {
    const newTimestamp = dateTime.timestamp + (minutes * 60 * 1000);
    return this.fromTimestamp(newTimestamp);
  }

  /**
   * 添加天数
   */
  static addDays(dateTime: DateTime, days: number): DateTime {
    const newTimestamp = dateTime.timestamp + (days * 24 * 60 * 60 * 1000);
    return this.fromTimestamp(newTimestamp);
  }

  // ===============================
  // 比较方法
  // ===============================

  /**
   * 比较两个DateTime
   */
  static compare(dt1: DateTime, dt2: DateTime): number {
    return dt1.timestamp - dt2.timestamp;
  }

  /**
   * 批量比较多个时间
   */
  static compareMultiple(times: DateTime[]): DateTime[] {
    return [...times].sort((a, b) => this.compare(a, b));
  }

  /**
   * 时间比较的便捷方法
   */
  static isAfter(dt1: DateTime, dt2: DateTime): boolean {
    return this.compare(dt1, dt2) > 0;
  }

  static isBefore(dt1: DateTime, dt2: DateTime): boolean {
    return this.compare(dt1, dt2) < 0;
  }

  static isEqual(dt1: DateTime, dt2: DateTime): boolean {
    return this.compare(dt1, dt2) === 0;
  }

  /**
   * 检查时间是否在指定范围内
   */
  static isInRange(target: DateTime, start: DateTime, end: DateTime): boolean {
    return target.timestamp >= start.timestamp && target.timestamp <= end.timestamp;
  }

  // ===============================
  // 格式化方法
  // ===============================

  /**
   * 格式化为表单输入的日期格式 (YYYY-MM-DD)
   */
  static formatDateToInput(dateTime: DateTime): string {
    if (!dateTime?.date) return '';
    const { year, month, day } = dateTime.date;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  /**
   * 格式化为表单输入的时间格式 (HH:mm)
   */
  static formatTimeToInput(dateTime: DateTime): string {
    if (!dateTime?.time) return '';
    const { hour, minute } = dateTime.time;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * 格式化显示日期（通用版本）
   */
  static formatDisplayDate(dateTime: DateTime): string {
    if (!dateTime?.date) return "";

    const { year, month, day } = dateTime.date;
    const now = this.now();
    const today = now.date;

    // 判断是否是今天、明天、昨天
    if (year === today.year && month === today.month && day === today.day) {
      return "今天";
    }

    const tomorrow = this.addDays(now, 1);
    if (
      year === tomorrow.date.year &&
      month === tomorrow.date.month &&
      day === tomorrow.date.day
    ) {
      return "明天";
    }

    const yesterday = this.addDays(now, -1);
    if (
      year === yesterday.date.year &&
      month === yesterday.date.month &&
      day === yesterday.date.day
    ) {
      return "昨天";
    }

    // 判断是否是今年
    if (year === today.year) {
      return `${month}月${day}日`;
    }

    return `${year}年${month}月${day}日`;
  }

  /**
   * 格式化显示时间（通用版本）
   */
  static formatDisplayTime(dateTime: DateTime): string {
    if (!dateTime?.time) return "";

    const { hour, minute } = dateTime.time;
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * 计算两个时间之间的分钟数
   */
  static getMinutesBetween(start: DateTime, end: DateTime): number {
    if (!this.isDateTime(start) || !this.isDateTime(end)) {
      throw new Error("Invalid DateTime objects provided");
    }
    return Math.floor((end.timestamp - start.timestamp) / (60 * 1000));
  }
}