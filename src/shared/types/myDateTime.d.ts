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
export type Date = {
  /** 日期信息 */
  date: DateInfo;
  /** 时间信息 */
  time?: TimePoint;
  /** UTC 时间戳 (毫秒) - 用于比较和排序 */
  timestamp: number;
  /** ISO 字符串 - 用于存储和传输 */
  isoString: string;
};


