/**
 * Cron 表达式转换工具
 *
 * 提供时间和日期到 Cron 表达式的转换功能
 */

/**
 * 将特定日期时间转换为 Cron 表达式（单次任务）
 *
 * @param date - 目标日期时间
 * @returns Cron 表达式字符串
 *
 * @example
 * // 2025年1月15日 10:30
 * dateTimeToCron(new Date(2025, 0, 15, 10, 30))
 * // 返回: '30 10 15 1 * 2025'
 */
export function dateTimeToCron(date: Date): string {
  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1; // JavaScript 月份从 0 开始
  const year = date.getFullYear();

  // Cron 格式: 分 时 日 月 星期 年
  return `${minute} ${hour} ${dayOfMonth} ${month} * ${year}`;
}

/**
 * 将每日固定时间转换为 Cron 表达式
 *
 * @param hour - 小时 (0-23)
 * @param minute - 分钟 (0-59)
 * @returns Cron 表达式字符串
 *
 * @example
 * // 每天 9:00
 * dailyAtTimeToCron(9, 0)
 * // 返回: '0 9 * * *'
 */
export function dailyAtTimeToCron(hour: number, minute: number = 0): string {
  if (hour < 0 || hour > 23) {
    throw new Error('Hour must be between 0 and 23');
  }
  if (minute < 0 || minute > 59) {
    throw new Error('Minute must be between 0 and 59');
  }

  return `${minute} ${hour} * * *`;
}

/**
 * 将工作日固定时间转换为 Cron 表达式
 *
 * @param hour - 小时 (0-23)
 * @param minute - 分钟 (0-59)
 * @returns Cron 表达式字符串
 *
 * @example
 * // 工作日每天 9:00
 * weekdaysAtTimeToCron(9, 0)
 * // 返回: '0 9 * * 1-5'
 */
export function weekdaysAtTimeToCron(hour: number, minute: number = 0): string {
  if (hour < 0 || hour > 23) {
    throw new Error('Hour must be between 0 and 23');
  }
  if (minute < 0 || minute > 59) {
    throw new Error('Minute must be between 0 and 59');
  }

  return `${minute} ${hour} * * 1-5`;
}

/**
 * 将每周特定星期的固定时间转换为 Cron 表达式
 *
 * @param dayOfWeek - 星期几 (0=周日, 1=周一, ..., 6=周六)
 * @param hour - 小时 (0-23)
 * @param minute - 分钟 (0-59)
 * @returns Cron 表达式字符串
 *
 * @example
 * // 每周一 9:00
 * weeklyAtTimeToCron(1, 9, 0)
 * // 返回: '0 9 * * 1'
 *
 * @example
 * // 每周日 12:00
 * weeklyAtTimeToCron(0, 12, 0)
 * // 返回: '0 12 * * 0'
 */
export function weeklyAtTimeToCron(dayOfWeek: number, hour: number, minute: number = 0): string {
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
  }
  if (hour < 0 || hour > 23) {
    throw new Error('Hour must be between 0 and 23');
  }
  if (minute < 0 || minute > 59) {
    throw new Error('Minute must be between 0 and 59');
  }

  return `${minute} ${hour} * * ${dayOfWeek}`;
}

/**
 * 将每月特定日期的固定时间转换为 Cron 表达式
 *
 * @param dayOfMonth - 月份中的第几天 (1-31)
 * @param hour - 小时 (0-23)
 * @param minute - 分钟 (0-59)
 * @returns Cron 表达式字符串
 *
 * @example
 * // 每月1号 00:00
 * monthlyAtTimeToCron(1, 0, 0)
 * // 返回: '0 0 1 * *'
 *
 * @example
 * // 每月15号 14:30
 * monthlyAtTimeToCron(15, 14, 30)
 * // 返回: '30 14 15 * *'
 */
export function monthlyAtTimeToCron(dayOfMonth: number, hour: number, minute: number = 0): string {
  if (dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error('Day of month must be between 1 and 31');
  }
  if (hour < 0 || hour > 23) {
    throw new Error('Hour must be between 0 and 23');
  }
  if (minute < 0 || minute > 59) {
    throw new Error('Minute must be between 0 and 59');
  }

  return `${minute} ${hour} ${dayOfMonth} * *`;
}

/**
 * 将每 N 小时转换为 Cron 表达式
 *
 * @param hours - 间隔小时数
 * @param startMinute - 开始分钟 (0-59)
 * @returns Cron 表达式字符串
 *
 * @example
 * // 每2小时（从整点开始）
 * everyNHoursToCron(2)
 * // 返回: '0 *​/2 * * *'  (注: *​/ 中间无空格)
 *
 * @example
 * // 每3小时，从每小时的第30分钟开始
 * everyNHoursToCron(3, 30)
 * // 返回: '30 *​/3 * * *'  (注: *​/ 中间无空格)
 */
export function everyNHoursToCron(hours: number, startMinute: number = 0): string {
  if (hours < 1 || hours > 23) {
    throw new Error('Hours must be between 1 and 23');
  }
  if (startMinute < 0 || startMinute > 59) {
    throw new Error('Start minute must be between 0 and 59');
  }

  return `${startMinute} */${hours} * * *`;
}

/**
 * 将每 N 分钟转换为 Cron 表达式
 *
 * @param minutes - 间隔分钟数
 * @returns Cron 表达式字符串
 *
 * @example
 * // 每15分钟
 * everyNMinutesToCron(15)
 * // 返回: '*​/15 * * * *'  (注: *​/ 中间无空格)
 */
export function everyNMinutesToCron(minutes: number): string {
  if (minutes < 1 || minutes > 59) {
    throw new Error('Minutes must be between 1 and 59');
  }

  return `*/${minutes} * * * *`;
}

/**
 * 从 Reminder 模块的事件配置转换为 Cron 表达式
 *
 * @param eventTime - 事件时间对象
 * @returns Cron 表达式字符串
 *
 * @example
 * // 每天 9:00
 * eventTimeToCron({
 *   type: 'DAILY',
 *   time: '09:00'
 * })
 * // 返回: '0 9 * * *'
 *
 * @example
 * // 每周一 10:30
 * eventTimeToCron({
 *   type: 'WEEKLY',
 *   dayOfWeek: 1,
 *   time: '10:30'
 * })
 * // 返回: '30 10 * * 1'
 */
export function eventTimeToCron(eventTime: {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  time: string; // 格式: 'HH:mm'
  dayOfWeek?: number; // 0-6, WEEKLY 时使用
  dayOfMonth?: number; // 1-31, MONTHLY 时使用
  intervalMinutes?: number; // CUSTOM 时使用
}): string {
  const [hourStr, minuteStr] = eventTime.time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  switch (eventTime.type) {
    case 'DAILY':
      return dailyAtTimeToCron(hour, minute);

    case 'WEEKLY':
      if (eventTime.dayOfWeek === undefined) {
        throw new Error('dayOfWeek is required for WEEKLY type');
      }
      return weeklyAtTimeToCron(eventTime.dayOfWeek, hour, minute);

    case 'MONTHLY':
      if (eventTime.dayOfMonth === undefined) {
        throw new Error('dayOfMonth is required for MONTHLY type');
      }
      return monthlyAtTimeToCron(eventTime.dayOfMonth, hour, minute);

    case 'CUSTOM':
      if (eventTime.intervalMinutes === undefined) {
        throw new Error('intervalMinutes is required for CUSTOM type');
      }
      if (eventTime.intervalMinutes < 60) {
        return everyNMinutesToCron(eventTime.intervalMinutes);
      } else {
        const hours = Math.floor(eventTime.intervalMinutes / 60);
        return everyNHoursToCron(hours, minute);
      }

    default:
      throw new Error(`Unknown event time type: ${eventTime.type}`);
  }
}

/**
 * 验证 Cron 表达式格式是否正确
 *
 * @param cronExpression - Cron 表达式字符串
 * @returns 是否有效
 *
 * @example
 * isValidCronExpression('0 9 * * *')  // true
 * isValidCronExpression('invalid')     // false
 */
export function isValidCronExpression(cronExpression: string): boolean {
  // 基本格式验证：分 时 日 月 星期 [年]
  const parts = cronExpression.trim().split(/\s+/);

  // Cron 表达式应该有 5 或 6 部分
  if (parts.length < 5 || parts.length > 6) {
    return false;
  }

  // 简单验证每个部分是否包含有效字符
  const validCharsRegex = /^[\d,\-*/]+$/;
  return parts.every((part) => validCharsRegex.test(part));
}
