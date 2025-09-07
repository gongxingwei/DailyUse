import type { RecurrenceRule, RecurrenceSegment } from '@dailyuse/utils';

export class RecurrenceRuleHelper {
  /**
   * 将UI选择器的值转换为RecurrenceRule
   */
  static fromUISelectors(hour: number, minute: number, daysOfWeek: number[]): RecurrenceRule {
    return {
      second: 0,
      minute: minute,
      hour: hour,
      dayOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
      month: undefined,
      year: undefined,
    };
  }

  /**
   * 从RecurrenceRule解析到UI选择器的值
   */
  static toUISelectors(rule: RecurrenceRule): {
    hour: number;
    minute: number;
    daysOfWeek: number[];
  } {
    const hour = this.extractNumber(rule.hour, 9); // 默认9点
    const minute = this.extractNumber(rule.minute, 0); // 默认0分
    const daysOfWeek = this.extractNumberArray(rule.dayOfWeek);

    return { hour, minute, daysOfWeek };
  }

  /**
   * 从RecurrenceSegment提取单个数字
   */
  private static extractNumber(
    segment: RecurrenceSegment | undefined,
    defaultValue: number,
  ): number {
    if (typeof segment === 'number') {
      return segment;
    }
    if (Array.isArray(segment) && segment.length > 0 && typeof segment[0] === 'number') {
      return segment[0];
    }
    return defaultValue;
  }

  /**
   * 从RecurrenceSegment提取数字数组
   */
  private static extractNumberArray(segment: RecurrenceSegment | undefined): number[] {
    if (typeof segment === 'number') {
      return [segment];
    }
    if (Array.isArray(segment)) {
      return segment.filter((item): item is number => typeof item === 'number');
    }
    return [];
  }

  /**
   * 验证RecurrenceRule是否有效
   */
  static isValid(rule: RecurrenceRule): boolean {
    // 基本验证逻辑
    if (rule.hour !== undefined) {
      const hour = this.extractNumber(rule.hour, -1);
      if (hour < 0 || hour > 23) return false;
    }

    if (rule.minute !== undefined) {
      const minute = this.extractNumber(rule.minute, -1);
      if (minute < 0 || minute > 59) return false;
    }

    return true;
  }

  /**
   * 创建默认的RecurrenceRule
   */
  static createDefault(): RecurrenceRule {
    return {
      second: 0,
      minute: 0,
      hour: 9,
      dayOfWeek: undefined,
      month: undefined,
      year: undefined,
    };
  }
}
