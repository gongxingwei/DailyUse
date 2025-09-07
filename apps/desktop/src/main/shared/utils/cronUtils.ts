/**
 * Cron 工具类
 * 支持将 JS Date 对象转换为标准 cron 表达式（秒 分 时 日 月 周）
 */
export class CronUtils {
  /**
   * 将 Date 对象转换为 cron 表达式
   * @param date JS Date 对象
   * @returns cron 字符串，如 "0 30 14 15 7 *"
   */
  static dateToCron(date: Date): string {
    const second = date.getSeconds();
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1; // JS 月份从 0 开始
    // 周字段用 *，如需支持可扩展
    return `${second} ${minute} ${hour} ${day} ${month} *`;
  }
}
