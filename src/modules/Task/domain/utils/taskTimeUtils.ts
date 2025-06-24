
import type { TimePoint, DateTime, DateInfo, ReminderRule, RecurrenceRule } from '@/modules/Task/types/timeStructure';
import type { TaskTimeConfig, ReminderAlert } from '../types/task';

export class TaskTimeUtils {
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

  static getMinutesBetween(start: DateTime, end: DateTime): number {
    if (!this.isDateTime(start) || !this.isDateTime(end)) {
      throw new Error('Invalid DateTime objects provided');
    }
    return Math.floor((end.timestamp - start.timestamp) / (60 * 1000));
  }

  /**
   * 格式化显示时间配置
   */
  static formatTimeConfig(timeConfig: TaskTimeConfig): {
    dateRange: string;
    timeRange: string;
    recurrence: string;
    duration: string;
    timezone: string;
    summary: string;
  } {
    const { baseTime, recurrence, timezone } = timeConfig;
    
    return {
      dateRange: this.formatDateRange(baseTime),
      timeRange: this.formatTimeRange(baseTime),
      recurrence: this.formatRecurrence(recurrence),
      duration: this.formatDuration(baseTime),
      timezone: timezone || '系统时区',
      summary: this.formatTimeConfigSummary(timeConfig)
    };
  }

  /**
   * 格式化日期范围
   */
  static formatDateRange(baseTime: TaskTimeConfig['baseTime']): string {
    const startDate = this.formatDisplayDate(baseTime.start);
    
    if (baseTime.end) {
      const endDate = this.formatDisplayDate(baseTime.end);
      return `${startDate} - ${endDate}`;
    }
    
    return startDate;
  }

  /**
   * 格式化时间范围
   */
  static formatTimeRange(baseTime: TaskTimeConfig['baseTime']): string {
    const startTime = this.formatDisplayTime(baseTime.start);
    
    if (baseTime.end) {
      const endTime = this.formatDisplayTime(baseTime.end);
      return `${startTime} - ${endTime}`;
    }
    
    return startTime;
  }

  /**
   * 格式化重复规则
   */
  static formatRecurrence(recurrence: RecurrenceRule): string {
    const { type, interval = 1, config, endCondition } = recurrence;

    if (type === 'none') {
      return '不重复';
    }

    let recurrenceText = '';

    switch (type) {
      case 'daily':
        recurrenceText = interval === 1 ? '每天' : `每${interval}天`;
        break;
      
      case 'weekly':
        if (config?.weekdays?.length) {
          const weekdayNames = config.weekdays.map((d: number) => '日一二三四五六'[d]);
          recurrenceText = `每周${weekdayNames.join('、')}`;
        } else {
          recurrenceText = interval === 1 ? '每周' : `每${interval}周`;
        }
        break;
      
      case 'yearly':
        recurrenceText = interval === 1 ? '每年' : `每${interval}年`;
        break;
      
      default:
        recurrenceText = '自定义重复';
    }

    // 添加结束条件
    if (endCondition.type === 'date' && endCondition.endDate) {
      const endDate = this.formatDisplayDate(endCondition.endDate);
      recurrenceText += `，直到${endDate}`;
    } else if (endCondition.type === 'count' && endCondition.count) {
      recurrenceText += `，共${endCondition.count}次`;
    }

    return recurrenceText;
  }

  /**
   * 格式化持续时间
   */
  static formatDuration(baseTime: TaskTimeConfig['baseTime']): string {
    if (!baseTime.end) {
      return '未设置结束时间';
    }

    const minutes = this.getMinutesBetween(baseTime.start, baseTime.end);
    
    if (minutes < 60) {
      return `${minutes}分钟`;
    } else if (minutes < 1440) { // 24小时
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      const remainingMinutes = minutes % 60;
      
      let result = `${days}天`;
      if (remainingHours > 0) result += `${remainingHours}小时`;
      if (remainingMinutes > 0) result += `${remainingMinutes}分钟`;
      
      return result;
    }
  }

  /**
   * 格式化时间配置摘要
   */
  static formatTimeConfigSummary(timeConfig: TaskTimeConfig): string {
    const { baseTime, recurrence } = timeConfig;
    
    if (recurrence.type === 'none') {
      return `${this.formatDisplayDate(baseTime.start)} ${this.formatDisplayTime(baseTime.start)}`;
    }

    const recurrenceText = this.formatRecurrence(recurrence);
    const timeText = this.formatDisplayTime(baseTime.start);
    
    return `${recurrenceText}，${timeText}`;
  }
 
  static formatTaskInstanceTimeConfig(timeConfig: TaskInstance['timeConfig']): string { 
    let startDate = this.formatDisplayDate(timeConfig.scheduledTime);
    let startTime = this.formatDisplayTime(timeConfig.scheduledTime);
    const { type } = timeConfig;
    if (type === 'allDay') {
      return startDate;
    }
    if (type === 'timed') {
      return `${startDate} ${startTime}`;
    }
    if (type === 'timeRange' && timeConfig.endTime) {
      const endDate = this.formatDisplayDate(timeConfig.endTime);
      const endTime = this.formatDisplayTime(timeConfig.endTime);
      return `${startDate} ${startTime} - ${endDate} ${endTime}`;
    }
    
    return '时间设置可能有问题';
  }

  /**
   * 格式化显示日期
   */
  static formatDisplayDate(dateTime: DateTime): string {
    if (!dateTime?.date) return '';
    
    const { year, month, day } = dateTime.date;
    const now = this.now();
    const today = now.date;
    
    // 判断是否是今天、明天、昨天
    if (year === today.year && month === today.month && day === today.day) {
      return '今天';
    }
    
    const tomorrow = this.addDays(now, 1);
    if (year === tomorrow.date.year && month === tomorrow.date.month && day === tomorrow.date.day) {
      return '明天';
    }
    
    const yesterday = this.addDays(now, -1);
    if (year === yesterday.date.year && month === yesterday.date.month && day === yesterday.date.day) {
      return '昨天';
    }
    
    // 判断是否是今年
    if (year === today.year) {
      return `${month}月${day}日`;
    }
    
    return `${year}年${month}月${day}日`;
  }

  /**
   * 格式化显示时间
   */
  static formatDisplayTime(dateTime: DateTime): string {
    if (!dateTime?.time) return '';
    
    const { hour, minute } = dateTime.time;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * 获取下一次执行时间的友好显示
   */
  static getNextOccurrenceDisplay(timeConfig: TaskTimeConfig, from?: DateTime): string {
    const nextTime = this.getNextOccurrence(timeConfig, from);
    
    if (!nextTime) {
      return '无下次执行';
    }
    
    const now = from || this.now();
    const diffMinutes = Math.floor((nextTime.timestamp - now.timestamp) / (60 * 1000));
    
    if (diffMinutes < 0) {
      return '已过期';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟后`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}小时后`;
    } else if (diffMinutes < 10080) { // 7天
      const days = Math.floor(diffMinutes / 1440);
      return `${days}天后`;
    } else {
      return `${this.formatDisplayDate(nextTime)} ${this.formatDisplayTime(nextTime)}`;
    }
  }
}