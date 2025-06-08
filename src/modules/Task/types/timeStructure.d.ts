/**
 * 时间点类型 - 更精确的时间表示
 */
export type TimePoint = {
  /** 小时 (0-23) */
  hour: number;
  /** 分钟 (0-59) */
  minute: number;
  /** 时区 (可选，默认本地时区) */
  timezone?: string;
};

/**
 * 时间段类型
 */
export type TimeRange = {
  /** 开始时间 */
  start: TimePoint;
  /** 结束时间 */
  end: TimePoint;
  /** 是否跨天 */
  crossDay?: boolean;
};

/**
 * 日期类型 - 使用更标准的格式
 */
export type DateInfo = {
  /** 年份 */
  year: number;
  /** 月份 (1-12) */
  month: number;
  /** 日期 (1-31) */
  day: number;
};

/**
 * 完整的日期时间类型
 */
export type DateTime = {
  /** 日期信息 */
  date: DateInfo;
  /** 时间信息 */
  time?: TimePoint;
  /** UTC 时间戳 (毫秒) - 用于比较和排序 */
  timestamp: number;
  /** ISO 字符串 - 用于存储和传输 */
  isoString: string;
};

/**
 * 重复规则 - 更灵活的重复模式
 */
export type RecurrenceRule = {
  /** 重复类型 */
  type: "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
  /** 重复间隔 (例如：每2天、每3周) */
  interval?: number;
  /** 结束条件 */
  endCondition: {
    /** 结束类型 */
    type: "never" | "date" | "count";
    /** 结束日期 (当 type 为 'date') */
    endDate?: DateTime;
    /** 重复次数 (当 type 为 'count') */
    count?: number;
  };
  /** 重复的具体配置 */
  config?: {
    /** 周重复：星期几 (0=周日, 1=周一, ..., 6=周六) */
    weekdays?: number[];
    /** 月重复：每月的第几天 */
    monthDays?: number[];
    /** 月重复：每月的第几个星期几 (如第二个周一) */
    monthWeekdays?: Array<{
      week: number; // 第几周 (1-5, -1表示最后一周)
      weekday: number; // 星期几 (0-6)
    }>;
    /** 年重复：月份 */
    months?: number[];
  };
};

/**
 * 提醒规则 - 更灵活的提醒设置
 */
export type ReminderRule = {
  /** 是否启用提醒 */
  enabled: boolean;
  /** 多个提醒时间点 */
  alerts: Array<{
    /** 提醒ID */
    id: string;
    /** 提醒时间设置 - 支持相对时间和绝对时间 */
    timing: {
      /** 提醒时间类型 */
      type: "relative" | "absolute";
      /** 相对时间：提前时间 (分钟) */
      minutesBefore?: number;
      /** 绝对时间：具体时间点 */
      absoluteTime?: DateTime;
    };
    /** 提醒类型 */
    type: "notification" | "email" | "sound";
    /** 自定义消息 */
    message?: string;
    /** 是否已触发 */
    triggered?: boolean;
  }>;
  /** 提醒重复设置 */
  snooze: {
    /** 是否允许稍后提醒 */
    enabled: boolean;
    /** 稍后提醒间隔 (分钟) */
    interval: number;
    /** 最大重复次数 */
    maxCount: number;
  };
};

/**
 * 任务时间配置 - 整合所有时间相关信息
 */
export type TaskTimeConfig = {
  /** 任务类型 */
  type: "allDay" | "timed" | "timeRange";
  /** 基础时间信息 */
  baseTime: {
    /** 开始时间 */
    start: DateTime;
    /** 结束时间 (可选) */
    end?: DateTime;
    /** 持续时间 (分钟，用于验证) */
    duration?: number;
  };
  /** 重复规则 */
  recurrence: RecurrenceRule;
  /** 提醒规则 */
  reminder: ReminderRule;
  /** 时区信息 */
  timezone: string;
  /** 夏令时处理 */
  dstHandling?: "auto" | "ignore";
};
