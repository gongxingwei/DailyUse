/**
 * 定时任务工具类 - 纯函数工具
 */
export class ScheduleUtils {
  /**
   * 将时间戳转换为 cron 表达式
   */
  static timestampToCron(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  /**
   * 将 cron 表达式转换为可读格式
   */
  static cronToReadable(cron: string): string {
    const parts = cron.split(' ');
    if (parts.length >= 5) {
      return `每天 ${parts[1]}:${parts[0].padStart(2, '0')}`;
    }
    return cron;
  }

  /**
   * 验证 cron 表达式格式
   */
  static validateCron(cron: string): boolean {
    // 基础验证：5个部分，用空格分隔
    const parts = cron.trim().split(/\s+/);
    return parts.length === 5;
  }

  /**
   * 获取下次执行时间(未实现)
   */
  static getNextRunTime(cron: string): Date | null {
    console.log('获取下次执行时间:', cron);
    return null;
  }
}
