export type TimeMode = 'once' | 'daily' | 'interval';
export type ScheduleUnit = 'minutes' | 'hours';
export type TimeUnit = 'seconds' | 'minutes' | 'hours';
export interface AdvanceTime {
    hours?: number;
    minutes?: number;
    seconds?: number;
}
export interface TimeConfig {
    mode: TimeMode;
    // 一次性提醒的具体时间
    timestamp?: string;
    // 每日提醒的时间
    dailyTime?: string; // 格式 "HH:mm"
    // 间隔提醒的设置
    interval?: {
        value: number;
        unit: ScheduleUnit;
    };
}