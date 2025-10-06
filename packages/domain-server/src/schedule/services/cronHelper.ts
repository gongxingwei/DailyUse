import { ReminderContracts } from '@dailyuse/contracts';

/**
 * 将 ReminderTemplate 的 timeConfig 转换为 cron 表达式
 * 
 * Cron 表达式格式: 秒 分 时 日 月 星期
 * 
 * 示例:
 * - 每天 9:00: "0 0 9 * * *"
 * - 每周一 9:00: "0 0 9 * * 1"
 * - 每月 1 日 9:00: "0 0 9 1 * *"
 */
export function timeConfigToCronExpression(
  timeConfig: ReminderContracts.ReminderTimeConfig,
): string | null {
  switch (timeConfig.type) {
    case 'daily':
      return convertDailyToCron(timeConfig);
    case 'weekly':
      return convertWeeklyToCron(timeConfig);
    case 'monthly':
      return convertMonthlyToCron(timeConfig);
    case 'custom':
      return convertCustomToCron(timeConfig);
    default:
      return null;
  }
}

/**
 * 转换每天提醒为 cron 表达式
 */
function convertDailyToCron(
  timeConfig: ReminderContracts.ReminderTimeConfig,
): string | null {
  const times = timeConfig.times || ['09:00'];
  const time = times[0]; // 目前只支持一个时间点

  const [hour, minute] = time.split(':').map(Number);
  
  // 秒 分 时 日 月 星期
  return `0 ${minute} ${hour} * * *`;
}

/**
 * 转换每周提醒为 cron 表达式
 */
function convertWeeklyToCron(
  timeConfig: ReminderContracts.ReminderTimeConfig,
): string | null {
  const times = timeConfig.times || ['09:00'];
  const time = times[0];
  const weekdays = timeConfig.weekdays || [1]; // 默认周一

  const [hour, minute] = time.split(':').map(Number);
  
  // cron 的星期: 0-6 (0 = 周日)
  // timeConfig 的 weekdays: 0-6 (0 = 周日)
  const cronWeekdays = weekdays.join(',');
  
  // 秒 分 时 日 月 星期
  return `0 ${minute} ${hour} * * ${cronWeekdays}`;
}

/**
 * 转换每月提醒为 cron 表达式
 */
function convertMonthlyToCron(
  timeConfig: ReminderContracts.ReminderTimeConfig,
): string | null {
  const times = timeConfig.times || ['09:00'];
  const time = times[0];
  const monthDays = timeConfig.monthDays || [1]; // 默认每月 1 日

  const [hour, minute] = time.split(':').map(Number);
  const cronDays = monthDays.join(',');
  
  // 秒 分 时 日 月 星期
  return `0 ${minute} ${hour} ${cronDays} * *`;
}

/**
 * 转换自定义间隔为 cron 表达式
 */
function convertCustomToCron(
  timeConfig: ReminderContracts.ReminderTimeConfig,
): string | null {
  const customPattern = timeConfig.customPattern;
  if (!customPattern) {
    return null;
  }

  const interval = customPattern.interval || 1;
  const unit = customPattern.unit || 'hours';

  // 自定义间隔提醒不适合用 cron 表达式
  // 应该使用不同的调度策略（如 setInterval）
  // 这里暂时返回 null，需要在调度器中特殊处理
  switch (unit) {
    case 'minutes':
      // 每 N 分钟: "0 */N * * * *"
      if (interval === 1) {
        return '0 * * * * *'; // 每分钟
      } else if (60 % interval === 0) {
        return `0 */${interval} * * * *`;
      }
      break;
    case 'hours':
      // 每 N 小时: "0 0 */N * * *"
      if (interval === 1) {
        return '0 0 * * * *'; // 每小时
      } else if (24 % interval === 0) {
        return `0 0 */${interval} * * *`;
      }
      break;
    case 'days':
      // 每 N 天: "0 0 9 */N * *"
      return `0 0 9 */${interval} * *`;
  }

  // 对于不能用 cron 表达式表示的间隔，返回 null
  // 需要使用其他调度策略
  return null;
}

/**
 * 生成人类可读的 cron 描述
 */
export function describeCron(cronExpression: string): string {
  const cronstrue = require('cronstrue');
  try {
    return cronstrue.toString(cronExpression, { locale: 'zh_CN' });
  } catch (error) {
    return cronExpression;
  }
}
