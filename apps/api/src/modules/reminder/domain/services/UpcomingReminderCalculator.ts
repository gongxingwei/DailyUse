import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderTimeConfigType, ReminderDurationUnit } from '@dailyuse/contracts';

/**
 * 即将到来的提醒项
 */
export interface UpcomingReminderItem {
  templateUuid: string;
  templateName: string;
  message: string;
  nextTriggerTime: Date;
  priority: ReminderContracts.ReminderPriority;
  category: string;
  tags: string[];
  icon?: string;
  color?: string;
}

/**
 * 即将到来的提醒计算器
 *
 * 职责：
 * - 根据提醒模板的 timeConfig 计算下次触发时间
 * - 支持 daily、weekly、monthly 三种时间配置
 * - 过滤禁用的模板
 * - 返回排序后的即将到来的提醒列表
 */
export class UpcomingReminderCalculator {
  /**
   * 计算单个模板的下次触发时间
   */
  private calculateNextTriggerTime(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    now: Date = new Date(),
  ): Date | null {
    switch (timeConfig.type) {
      case ReminderTimeConfigType.DAILY:
        return this.calculateDailyNextTrigger(timeConfig, now);
      case ReminderTimeConfigType.WEEKLY:
        return this.calculateWeeklyNextTrigger(timeConfig, now);
      case ReminderTimeConfigType.MONTHLY:
        return this.calculateMonthlyNextTrigger(timeConfig, now);
      case ReminderTimeConfigType.CUSTOM:
        return this.calculateCustomNextTrigger(timeConfig, now);
      default:
        return null;
    }
  }

  /**
   * 计算 daily 模式的下次触发时间
   */
  private calculateDailyNextTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    now: Date,
  ): Date | null {
    if (!timeConfig.times || timeConfig.times.length === 0) {
      return null;
    }

    const today = new Date(now);
    today.setSeconds(0, 0);

    // 找到今天最近的未来时间点
    for (const timeStr of timeConfig.times.sort()) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const triggerTime = new Date(today);
      triggerTime.setHours(hours, minutes, 0, 0);

      if (triggerTime > now) {
        return triggerTime;
      }
    }

    // 如果今天所有时间都已过，返回明天的第一个时间点
    const [hours, minutes] = timeConfig.times.sort()[0].split(':').map(Number);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }

  /**
   * 计算 weekly 模式的下次触发时间
   */
  private calculateWeeklyNextTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    now: Date,
  ): Date | null {
    if (!timeConfig.weekdays || timeConfig.weekdays.length === 0) {
      return null;
    }
    if (!timeConfig.times || timeConfig.times.length === 0) {
      return null;
    }

    const currentDay = now.getDay(); // 0-6, 0=Sunday
    const sortedWeekdays = [...timeConfig.weekdays].sort();
    const sortedTimes = [...timeConfig.times].sort();

    // 尝试在当前星期找到下一个触发时间
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDay = (currentDay + dayOffset) % 7;

      if (!sortedWeekdays.includes(targetDay)) {
        continue;
      }

      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      targetDate.setSeconds(0, 0);

      // 如果是今天，只考虑未来的时间点
      const timesToCheck = dayOffset === 0 ? sortedTimes : sortedTimes;

      for (const timeStr of timesToCheck) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const triggerTime = new Date(targetDate);
        triggerTime.setHours(hours, minutes, 0, 0);

        if (triggerTime > now) {
          return triggerTime;
        }
      }
    }

    return null;
  }

  /**
   * 计算 monthly 模式的下次触发时间
   */
  private calculateMonthlyNextTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    now: Date,
  ): Date | null {
    if (!timeConfig.monthDays || timeConfig.monthDays.length === 0) {
      return null;
    }
    if (!timeConfig.times || timeConfig.times.length === 0) {
      return null;
    }

    const sortedMonthDays = [...timeConfig.monthDays].sort((a, b) => a - b);
    const sortedTimes = [...timeConfig.times].sort();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 尝试在当前月找到下一个触发时间
    for (const day of sortedMonthDays) {
      if (day < currentDay) {
        continue;
      }

      // 检查这一天在当前月是否有效
      const testDate = new Date(currentYear, currentMonth, day);
      if (testDate.getMonth() !== currentMonth) {
        continue; // 日期无效（如2月30日）
      }

      const isToday = day === currentDay;
      const timesToCheck = isToday ? sortedTimes : sortedTimes;

      for (const timeStr of timesToCheck) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const triggerTime = new Date(currentYear, currentMonth, day, hours, minutes, 0, 0);

        if (triggerTime > now) {
          return triggerTime;
        }
      }
    }

    // 如果当前月没有，找下个月的第一个触发时间
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (const day of sortedMonthDays) {
      const testDate = new Date(nextYear, nextMonth, day);
      if (testDate.getMonth() !== nextMonth) {
        continue; // 日期无效
      }

      const [hours, minutes] = sortedTimes[0].split(':').map(Number);
      return new Date(nextYear, nextMonth, day, hours, minutes, 0, 0);
    }

    return null;
  }

  /**
   * 计算 custom 模式的下次触发时间
   */
  private calculateCustomNextTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    now: Date,
  ): Date | null {
    if (!timeConfig.customPattern) {
      return null;
    }

    const { interval, unit } = timeConfig.customPattern;
    const nextTrigger = new Date(now);

    switch (unit) {
      case ReminderDurationUnit.MINUTES:
        nextTrigger.setMinutes(nextTrigger.getMinutes() + interval);
        break;
      case ReminderDurationUnit.HOURS:
        nextTrigger.setHours(nextTrigger.getHours() + interval);
        break;
      case ReminderDurationUnit.DAYS:
        nextTrigger.setDate(nextTrigger.getDate() + interval);
        break;
      default:
        return null;
    }

    nextTrigger.setSeconds(0, 0);
    return nextTrigger;
  }

  /**
   * 计算即将到来的提醒列表
   *
   * @param templates - 启用的提醒模板列表（DTO 格式）
   * @param limit - 返回的最大数量
   * @param timeWindow - 时间窗口（小时），默认24小时
   * @returns 排序后的即将到来的提醒列表
   */
  calculateUpcomingReminders(
    templates: ReminderContracts.ReminderTemplateClientDTO[],
    limit: number = 10,
    timeWindow: number = 24,
  ): UpcomingReminderItem[] {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + timeWindow * 60 * 60 * 1000);

    const upcomingItems: UpcomingReminderItem[] = [];

    for (const template of templates) {
      // 只处理启用的模板
      if (!template.enabled) {
        continue;
      }

      const nextTriggerTime = this.calculateNextTriggerTime(template.timeConfig, now);

      if (!nextTriggerTime) {
        continue;
      }

      // 只包含时间窗口内的提醒
      if (nextTriggerTime <= windowEnd) {
        upcomingItems.push({
          templateUuid: template.uuid,
          templateName: template.name,
          message: template.message,
          nextTriggerTime,
          priority: template.priority,
          category: template.category,
          tags: template.tags,
          icon: template.icon,
          color: template.color,
        });
      }
    }

    // 按触发时间排序
    upcomingItems.sort((a, b) => a.nextTriggerTime.getTime() - b.nextTriggerTime.getTime());

    // 限制返回数量
    return upcomingItems.slice(0, limit);
  }

  /**
   * 获取模板的下一次触发时间（公开方法）
   */
  getNextTriggerTime(template: ReminderContracts.ReminderTemplateClientDTO): Date | null {
    if (!template.enabled) {
      return null;
    }
    return this.calculateNextTriggerTime(template.timeConfig);
  }
}
