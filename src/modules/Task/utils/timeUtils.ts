// src/modules/Task/utils/timeUtils.ts
import type { TimePoint, DateTime, DateInfo, TaskTimeConfig, ReminderRule, RecurrenceRule } from '../types/timeStructure';

export class TimeUtils {
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

  /**
   * 检查是否为 DateTime 对象
   */
  static isDateTime(obj: any): obj is DateTime {
    return obj && 
           typeof obj === 'object' && 
           obj.timestamp && 
           obj.isoString && 
           obj.date;
  }

  /**
   * 从ISO字符串创建DateTime
   */
  static fromISOString(isoString: string): DateTime {
    const jsDate = new Date(isoString);
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
      isoString
    };
  }

  /**
   * 获取当前时间
   */
  static now(): DateTime {
    return this.fromTimestamp(Date.now());
  }

  /**
   * 从时间戳创建DateTime
   */
  static fromTimestamp(timestamp: number): DateTime {
    const jsDate = new Date(timestamp);
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
      timestamp,
      isoString: jsDate.toISOString()
    };
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
    let newDate: DateInfo;
    
    if (typeof dateInput === 'string') {
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
   * 更新时间（用于结束时间等场景）
   */
  static updateTime(existingDateTime: DateTime, timeInput: string | TimePoint): DateTime {
    let newTime: TimePoint;
    
    if (typeof timeInput === 'string') {
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

  /**
   * 计算下一个重复时间
   */
  static getNextOccurrence(config: TaskTimeConfig, from?: DateTime): DateTime | null {
    const fromTime = from || this.now();
    const { recurrence, baseTime } = config;

    if (recurrence.type === 'none') {
      return baseTime.start.timestamp > fromTime.timestamp ? baseTime.start : null;
    }

    // 根据重复规则计算下一次时间
    return this.calculateNextByRule(baseTime.start, recurrence, fromTime);
  }

  /**
   * 计算所有提醒时间
   */
  static calculateReminderTimes(taskTime: DateTime, reminderRule: ReminderRule): DateTime[] {
    if (!reminderRule.enabled) return [];

    return reminderRule.alerts
      .filter(alert => !alert.triggered)
      .map(alert => {
        if (alert.timing.type === 'absolute' && alert.timing.absoluteTime) {
          return alert.timing.absoluteTime;
        } else if (alert.timing.type === 'relative' && alert.timing.minutesBefore) {
          return this.addMinutes(taskTime, -alert.timing.minutesBefore);
        } else {
          throw new Error('Invalid reminder timing configuration');
        }
      })
      .filter(reminderTime => reminderTime.timestamp > Date.now())
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  

  /**
   * 添加一段时间（以分钟为单位）
   */
  static addMinutes(dateTime: DateTime, minutes: number): DateTime {
    const newTimestamp = dateTime.timestamp + (minutes * 60 * 1000);
    return this.fromTimestamp(newTimestamp);
  }

  static addDays(dateTime: DateTime, days: number): DateTime {
    const newTimestamp = dateTime.timestamp + (days * 24 * 60 * 60 * 1000);
    return this.fromTimestamp(newTimestamp);
  }
  
  static formatDateToInput(dateTime: DateTime): string {
    if (!dateTime?.date) return '';
    const { year, month, day } = dateTime.date;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  static formatTimeToInput(dateTime: DateTime): string {
    if (!dateTime?.time) return '';
    const { hour, minute } = dateTime.time;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * 根据重复规则计算下一次时间
   */
  private static calculateNextByRule(
    baseTime: DateTime, 
    rule: RecurrenceRule, 
    fromTime: DateTime
  ): DateTime | null {
    const { type, interval = 1, endCondition, config } = rule;
    
    // 检查是否已达到结束条件
    if (endCondition.type === 'date' && endCondition.endDate && 
        fromTime.timestamp > endCondition.endDate.timestamp) {
      return null;
    }

    let nextTime: DateTime;
    const baseDate = new Date(baseTime.timestamp);
    const fromDate = new Date(fromTime.timestamp);

    switch (type) {
      case 'daily':
        nextTime = this.getNextDaily(baseDate, fromDate, interval);
        break;
      case 'weekly':
        nextTime = this.getNextWeekly(baseDate, fromDate, interval, config?.weekdays);
        break;
      case 'monthly':
        nextTime = this.getNextMonthly(baseDate, fromDate, interval, config);
        break;
      default:
        return null;
    }

    return nextTime;
  }

  private static getNextDaily(baseDate: Date, fromDate: Date, interval: number): DateTime {
    const nextDate = new Date(Math.max(baseDate.getTime(), fromDate.getTime()));
    if (nextDate.getTime() === fromDate.getTime()) {
      nextDate.setDate(nextDate.getDate() + interval);
    }
    return this.fromTimestamp(nextDate.getTime());
  }

  private static getNextWeekly(
    baseDate: Date, 
    fromDate: Date, 
    interval: number, 
    weekdays?: number[]
  ): DateTime {
    if (!weekdays || weekdays.length === 0) {
      const nextDate = new Date(Math.max(baseDate.getTime(), fromDate.getTime()));
      nextDate.setDate(nextDate.getDate() + (7 * interval));
      return this.fromTimestamp(nextDate.getTime());
    }

    // 找到下一个匹配的星期几
    const currentWeekday = fromDate.getDay();
    const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
    
    for (const weekday of sortedWeekdays) {
      if (weekday > currentWeekday) {
        const daysToAdd = weekday - currentWeekday;
        const nextDate = new Date(fromDate.getTime());
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        nextDate.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
        return this.fromTimestamp(nextDate.getTime());
      }
    }

    // 如果没有找到本周的，找下周的第一个
    const daysToAdd = (7 * interval) + sortedWeekdays[0] - currentWeekday;
    const nextDate = new Date(fromDate.getTime());
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    nextDate.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
    return this.fromTimestamp(nextDate.getTime());
  }

  private static getNextMonthly(
    baseDate: Date, 
    fromDate: Date, 
    interval: number, 
    _config?: any
  ): DateTime {
    const nextDate = new Date(Math.max(baseDate.getTime(), fromDate.getTime()));
    nextDate.setMonth(nextDate.getMonth() + interval);
    
    // 处理月末日期 (如31号在2月不存在)
    if (nextDate.getDate() !== baseDate.getDate()) {
      nextDate.setDate(0); // 设置为上个月的最后一天
    }
    
    return this.fromTimestamp(nextDate.getTime());
  }

}