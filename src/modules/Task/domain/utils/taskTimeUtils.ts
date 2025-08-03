import type { RecurrenceRule } from "@/modules/Task/domain/types/task";
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';
import { TaskTemplate } from '../aggregates/taskTemplate';
import { TaskInstance } from '../aggregates/taskInstance';
import { DateTime } from '@/shared/types/myDateTime';
export class TaskTimeUtils {
  // ===============================
  // 重新导出通用功能 - 让 TaskTimeUtils 也能使用所有通用方法
  // ===============================

  // 核心创建方法
  static createTimePoint = TimeUtils.createTimePoint;
  static createDateTime = TimeUtils.createDateTime;
  static isDateTime = TimeUtils.isDateTime;
  static fromISOString = TimeUtils.fromISOString;
  static fromTimestamp = TimeUtils.fromTimestamp;
  static now = TimeUtils.now;
  static toDateTime = TimeUtils.toDateTime;
  static safeToDateTime = TimeUtils.safeToDateTime;
  static ensureDateTime = TimeUtils.ensureDateTime;

  // 时间操作方法
  static updateDateKeepTime = TimeUtils.updateDateKeepTime;
  static updateTimeKeepDate = TimeUtils.updateTimeKeepDate;
  static updateDate = TimeUtils.updateDate;
  static updateTime = TimeUtils.updateTime;
  static startOfDay = TimeUtils.startOfDay;
  static endOfDay = TimeUtils.endOfDay;
  static addMinutes = TimeUtils.addMinutes;
  static addDays = TimeUtils.addDays;

  // 比较方法
  static compare = TimeUtils.compare;
  static compareMultiple = TimeUtils.compareMultiple;
  static isAfter = TimeUtils.isAfter;
  static isBefore = TimeUtils.isBefore;
  static isEqual = TimeUtils.isEqual;
  static isInRange = TimeUtils.isInRange;

  // 格式化方法
  static formatDateToInput = TimeUtils.formatDateToInput;
  static formatTimeToInput = TimeUtils.formatTimeToInput;
  static getMinutesBetween = TimeUtils.getMinutesBetween;

  // 重新导出通用显示格式化方法
  static formatDisplayDate = TimeUtils.formatDisplayDate;
  static formatDisplayTime = TimeUtils.formatDisplayTime;

  // ===============================
  // Task 模块特有功能
  // ===============================

  /**
   * 计算下一个重复时间
   */
  static getNextOccurrence(
    config: TaskTemplate["timeConfig"],
    from?: DateTime
  ): DateTime | null {
    const fromTime = from || this.now();
    const { recurrence, baseTime } = config;

    if (recurrence.type === "none") {
      return baseTime.start.timestamp > fromTime.timestamp
        ? baseTime.start
        : null;
    }

    // 根据重复规则计算下一次时间
    return this.calculateNextByRule(baseTime.start, recurrence, fromTime);
  }

  /**
   * 计算所有提醒时间
   */
  static calculateReminderTimes(
    taskTime: DateTime,
    reminderConfig: TaskTemplate["reminderConfig"]
  ): DateTime[] {
    if (!reminderConfig.enabled) return [];

    return reminderConfig.alerts
      .map((alert) => {
        if (alert.timing.type === "absolute" && alert.timing.absoluteTime) {
          return alert.timing.absoluteTime;
        } else if (
          alert.timing.type === "relative" &&
          alert.timing.minutesBefore
        ) {
          return this.addMinutes(taskTime, -alert.timing.minutesBefore);
        } else {
          throw new Error("Invalid reminder timing configuration");
        }
      })
      .filter((reminderTime) => reminderTime.timestamp > Date.now())
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 格式化显示时间配置
   */
  static formatTimeConfig(timeConfig: TaskTemplate["timeConfig"]): {
    dateRange: string;
    timeRange: string;
    recurrence: string;
    timezone: string;
    summary: string;
  } {
    const { type, baseTime, recurrence, timezone } = timeConfig;
    let dateRange, timeRange;
    
    const startDate = this.formatDisplayDate(baseTime.start);
    const startTime = this.formatDisplayTime(baseTime.start);
    
    if (type === "timeRange" && baseTime.end) {
      const endDate = this.formatDisplayDate(baseTime.end);
      const endTime = this.formatDisplayTime(baseTime.end);
      dateRange = `${startDate} - ${endDate}`;
      timeRange = `${startTime} - ${endTime}`;
    } else {
      dateRange = `开始于 ${startDate}`;
      timeRange = startTime;
    }

    if (type === "allDay") {
      timeRange = "全天";
    }

    return {
      dateRange: dateRange,
      timeRange: timeRange,
      recurrence: this.formatRecurrence(recurrence),
      timezone: timezone || "系统时区",
      summary: this.formatTimeConfigSummary(timeConfig),
    };
  }

  /**
   * 格式化重复规则
   */
  static formatRecurrence(recurrence: RecurrenceRule): string {
    const { type, interval = 1, config, endCondition } = recurrence;

    if (type === "none") {
      return "不重复";
    }

    let recurrenceText = "";

    switch (type) {
      case "daily":
        recurrenceText = interval === 1 ? "每天" : `每${interval}天`;
        break;

      case "weekly":
        if (config?.weekdays?.length) {
          const weekdayNames = config.weekdays.map(
            (d: number) => "日一二三四五六"[d]
          );
          recurrenceText = `每周${weekdayNames.join("、")}`;
        } else {
          recurrenceText = interval === 1 ? "每周" : `每${interval}周`;
        }
        break;

      case "monthly":
        recurrenceText = interval === 1 ? "每月" : `每${interval}月`;
        break;

      case "yearly":
        recurrenceText = interval === 1 ? "每年" : `每${interval}年`;
        break;

      default:
        recurrenceText = "自定义重复";
    }

    // 添加结束条件
    if (!endCondition) {
      recurrenceText += "，结束条件未设置";
      return recurrenceText;
    }
    
    if (endCondition.type === "date" && endCondition.endDate) {
      const endDate = this.formatDisplayDate(endCondition.endDate);
      recurrenceText += `，直到${endDate}`;
    } else if (endCondition.type === "count" && endCondition.count) {
      recurrenceText += `，共${endCondition.count}次`;
    }

    return recurrenceText;
  }

  /**
   * 格式化时间配置摘要
   */
  static formatTimeConfigSummary(timeConfig: TaskTemplate["timeConfig"]): string {
    const { baseTime, recurrence } = timeConfig;

    if (recurrence.type === "none") {
      return `${this.formatDisplayDate(baseTime.start)} ${this.formatDisplayTime(baseTime.start)}`;
    }

    const recurrenceText = this.formatRecurrence(recurrence);
    const timeText = this.formatDisplayTime(baseTime.start);

    return `${recurrenceText}，${timeText}`;
  }

  /**
   * 格式化任务实例时间配置
   */
  static formatTaskInstanceTimeConfig(timeConfig: TaskInstance["timeConfig"]): string {
    const startDate = this.formatDisplayDate(timeConfig.scheduledTime);
    const startTime = this.formatDisplayTime(timeConfig.scheduledTime);
    const { type } = timeConfig;
    
    if (type === "allDay") {
      return startDate;
    }
    
    if (type === "timed") {
      return `${startDate} ${startTime}`;
    }
    
    if (type === "timeRange" && timeConfig.endTime) {
      const endDate = this.formatDisplayDate(timeConfig.endTime);
      const endTime = this.formatDisplayTime(timeConfig.endTime);
      return `${startDate} ${startTime} - ${endDate} ${endTime}`;
    }

    return "时间设置可能有问题";
  }

  /**
   * 获取下一次执行时间的友好显示
   */
  static getNextOccurrenceDisplay(
    timeConfig: TaskTemplate["timeConfig"],
    from?: DateTime
  ): string {
    const nextTime = this.getNextOccurrence(timeConfig, from);

    if (!nextTime) {
      return "无下次执行";
    }

    const now = from || this.now();
    const diffMinutes = Math.floor(
      (nextTime.timestamp - now.timestamp) / (60 * 1000)
    );

    if (diffMinutes < 0) {
      return "已过期";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟后`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}小时后`;
    } else if (diffMinutes < 10080) {
      // 7天
      const days = Math.floor(diffMinutes / 1440);
      return `${days}天后`;
    } else {
      return `${this.formatDisplayDate(nextTime)} ${this.formatDisplayTime(nextTime)}`;
    }
  }

  // ===============================
  // 私有辅助方法 - 重复规则计算
  // ===============================

  /**
   * 根据重复规则计算下一次时间
   */
  private static calculateNextByRule(
    baseTime: DateTime,
    rule: RecurrenceRule,
    fromTime: DateTime
  ): DateTime | null {
    const { type, interval = 1, endCondition, config } = rule;
    
    if (!interval || !endCondition) {
      return null; // 无效的规则
    }
    
    // 检查是否已达到结束条件
    if (
      endCondition.type === "date" &&
      endCondition.endDate &&
      fromTime.timestamp > endCondition.endDate.timestamp
    ) {
      return null;
    }

    let nextTime: DateTime;
    const baseDate = new Date(baseTime.timestamp);
    const fromDate = new Date(fromTime.timestamp);

    switch (type) {
      case "daily":
        nextTime = this.getNextDaily(baseDate, fromDate, interval);
        break;
      case "weekly":
        nextTime = this.getNextWeekly(baseDate, fromDate, interval, config?.weekdays);
        break;
      case "monthly":
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
      nextDate.setDate(nextDate.getDate() + 7 * interval);
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
    const daysToAdd = 7 * interval + sortedWeekdays[0] - currentWeekday;
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