import type { RecurrenceRule } from "@common/modules/task/types/task";
import { TaskTemplate } from "../../../../electron/modules/Task/domain/aggregates/taskTemplate";
import { TaskInstance } from "../../../../electron/modules/Task/domain/aggregates/taskInstance";
import {
  addMinutes,
  format,
  isAfter,
  isBefore,
  isEqual,
  differenceInMinutes,
} from "date-fns";

export class TaskTimeUtils {
  /**
   * 计算下一个重复时间
   */
  static getNextOccurrence(
    config: TaskTemplate["timeConfig"],
    from?: Date
  ): Date | null {
    const fromTime = from || new Date();
    const { recurrence, baseTime } = config;

    if (recurrence.type === "none") {
      return baseTime.start.getTime() > fromTime.getTime()
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
    taskTime: Date,
    reminderConfig: TaskTemplate["reminderConfig"]
  ): Date[] {
    if (!reminderConfig.enabled) return [];

    return reminderConfig.alerts
      .map((alert) => {
        if (alert.timing.type === "absolute" && alert.timing.absoluteTime) {
          return alert.timing.absoluteTime;
        } else if (
          alert.timing.type === "relative" &&
          alert.timing.minutesBefore
        ) {
          return addMinutes(taskTime, -alert.timing.minutesBefore);
        } else {
          throw new Error("Invalid reminder timing configuration");
        }
      })
      .filter((reminderTime) => reminderTime.getTime() > Date.now())
      .sort((a, b) => a.getTime() - b.getTime());
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
      const endDate = format(endCondition.endDate, "yyyy-MM-dd");
      recurrenceText += `，直到${endDate}`;
    } else if (endCondition.type === "count" && endCondition.count) {
      recurrenceText += `，共${endCondition.count}次`;
    }

    return recurrenceText;
  }

  /**
   * 判断 date 是否在 [start, end] 区间内（包含端点）
   */
  static isInRange(date: Date, start: Date, end: Date): boolean {
    return (
      (isAfter(date, start) || isEqual(date, start)) &&
      (isBefore(date, end) || isEqual(date, end))
    );
  }

  /**
   * 计算两个日期之间的分钟数
   */
  static getMinutesBetween(start: Date, end: Date): number {
    return differenceInMinutes(end, start);
  }

  /**
   * 格式化时间配置摘要
   */
  static formatTimeConfigSummary(
    timeConfig: TaskTemplate["timeConfig"]
  ): string {
    const { baseTime, recurrence } = timeConfig;

    if (recurrence.type === "none") {
      return `${format(baseTime.start, "yyyy-MM-dd")} ${format(
        baseTime.start,
        "HH:mm"
      )}`;
    }

    const recurrenceText = this.formatRecurrence(recurrence);
    const timeText = format(baseTime.start, "HH:mm");

    return `${recurrenceText}，${timeText}`;
  }

  /**
   * 格式化任务实例时间配置
   */
  static formatTaskInstanceTimeConfig(
    timeConfig: TaskInstance["timeConfig"]
  ): string {
    const startDate = format(timeConfig.scheduledTime, "yyyy-MM-dd");
    const startTime = format(timeConfig.scheduledTime, "HH:mm");
    const { type } = timeConfig;

    if (type === "allDay") {
      return startDate;
    }

    if (type === "timed") {
      return `${startDate} ${startTime}`;
    }

    if (type === "timeRange" && timeConfig.endTime) {
      const endDate = format(timeConfig.endTime, "yyyy-MM-dd");
      const endTime = format(timeConfig.endTime, "HH:mm");
      return `${startDate} ${startTime} - ${endDate} ${endTime}`;
    }

    return "时间设置可能有问题";
  }

  /**
   * 获取下一次执行时间的友好显示
   */
  static getNextOccurrenceDisplay(
    timeConfig: TaskTemplate["timeConfig"],
    from?: Date
  ): string {
    const nextTime = this.getNextOccurrence(timeConfig, from);

    if (!nextTime) {
      return "无下次执行";
    }

    const now = from || new Date();
    const diffMinutes = Math.floor(
      (nextTime.getTime() - now.getTime()) / (60 * 1000)
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
      return `${format(nextTime, "yyyy-MM-dd")} ${format(nextTime, "HH:mm")}`;
    }
  }

  // ===============================
  // 私有辅助方法 - 重复规则计算
  // ===============================

  /**
   * 根据重复规则计算下一次时间
   */
  private static calculateNextByRule(
    baseTime: Date,
    rule: RecurrenceRule,
    fromTime: Date
  ): Date | null {
    const { type, interval = 1, endCondition, config } = rule;

    if (!interval || !endCondition) {
      return null; // 无效的规则
    }

    // 检查是否已达到结束条件
    if (
      endCondition.type === "date" &&
      endCondition.endDate &&
      fromTime.getTime() > endCondition.endDate.getTime()
    ) {
      return null;
    }

    let nextTime: Date;
    const baseDate = new Date(baseTime.getTime());
    const fromDate = new Date(fromTime.getTime());

    switch (type) {
      case "daily":
        nextTime = this.getNextDaily(baseDate, fromDate, interval);
        break;
      case "weekly":
        nextTime = this.getNextWeekly(
          baseDate,
          fromDate,
          interval,
          config?.weekdays
        );
        break;
      case "monthly":
        nextTime = this.getNextMonthly(baseDate, fromDate, interval, config);
        break;
      default:
        return null;
    }

    return nextTime;
  }

  private static getNextDaily(
    baseDate: Date,
    fromDate: Date,
    interval: number
  ): Date {
    const nextDate = new Date(Math.max(baseDate.getTime(), fromDate.getTime()));
    if (nextDate.getTime() === fromDate.getTime()) {
      nextDate.setDate(nextDate.getDate() + interval);
    }
    return nextDate;
  }

  private static getNextWeekly(
    baseDate: Date,
    fromDate: Date,
    interval: number,
    weekdays?: number[]
  ): Date {
    if (!weekdays || weekdays.length === 0) {
      const nextDate = new Date(
        Math.max(baseDate.getTime(), fromDate.getTime())
      );
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      return nextDate;
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
        return nextDate;
      }
    }

    // 如果没有找到本周的，找下周的第一个
    const daysToAdd = 7 * interval + sortedWeekdays[0] - currentWeekday;
    const nextDate = new Date(fromDate.getTime());
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    nextDate.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
    return nextDate;
  }

  private static getNextMonthly(
    baseDate: Date,
    fromDate: Date,
    interval: number,
    _config?: any
  ): Date {
    const nextDate = new Date(Math.max(baseDate.getTime(), fromDate.getTime()));
    nextDate.setMonth(nextDate.getMonth() + interval);

    // 处理月末日期 (如31号在2月不存在)
    if (nextDate.getDate() !== baseDate.getDate()) {
      nextDate.setDate(0); // 设置为上个月的最后一天
    }

    return nextDate;
  }

  /**
   * 格式化 TaskTimeConfig，返回摘要信息
   * @param timeConfig
   * @returns { dateRange: string, timeRange: string, recurrence: string }
   */
  static formatTimeConfig(timeConfig: any): {
    dateRange: string;
    timeRange: string;
    recurrence: string;
  } {
    // 日期范围
    let dateRange = "";
    if (timeConfig.baseTime?.start) {
      const start = new Date(timeConfig.baseTime.start);
      if (timeConfig.baseTime?.end) {
        const end = new Date(timeConfig.baseTime.end);
        dateRange =
          `${start.getFullYear()}-${(start.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${start.getDate().toString().padStart(2, "0")}` +
          " ~ " +
          `${end.getFullYear()}-${(end.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${end.getDate().toString().padStart(2, "0")}`;
      } else {
        dateRange = `${start.getFullYear()}-${(start.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${start.getDate().toString().padStart(2, "0")}`;
      }
    }

    // 时间范围
    let timeRange = "";
    if (timeConfig.type === "allDay") {
      timeRange = "全天";
    } else if (timeConfig.baseTime?.start) {
      const start = new Date(timeConfig.baseTime.start);
      const pad = (n: number) => n.toString().padStart(2, "0");
      const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      if (timeConfig.baseTime?.end) {
        const end = new Date(timeConfig.baseTime.end);
        const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
        timeRange = `${startStr} ~ ${endStr}`;
      } else {
        timeRange = startStr;
      }
    }

    // 重复模式
    let recurrence = "";
    if (timeConfig.recurrence?.type && timeConfig.recurrence?.type !== "none") {
      switch (timeConfig.recurrence.type) {
        case "daily":
          recurrence = "每天";
          break;
        case "weekly":
          recurrence = "每周";
          break;
        case "monthly":
          recurrence = "每月";
          break;
        case "yearly":
          recurrence = "每年";
          break;
        default:
          recurrence = "自定义";
      }
      if (
        timeConfig.recurrence?.interval &&
        timeConfig.recurrence.interval > 1
      ) {
        recurrence = `每${timeConfig.recurrence.interval}${recurrence.slice(
          1
        )}`;
      }
      if (timeConfig.recurrence?.endCondition?.type === "count") {
        recurrence += `，共${timeConfig.recurrence.endCondition.count}次`;
      } else if (
        timeConfig.recurrence?.endCondition?.type === "date" &&
        timeConfig.recurrence.endCondition.endDate
      ) {
        const endDate = new Date(timeConfig.recurrence.endCondition.endDate);
        recurrence += `，至${endDate.getFullYear()}-${(endDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${endDate.getDate().toString().padStart(2, "0")}`;
      }
    }

    return { dateRange, timeRange, recurrence };
  }
}
