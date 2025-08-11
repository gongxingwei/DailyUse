export enum ReminderTemplateEnableMode {
  GROUP = 'group',
  INDIVIDUAL = 'individual',
}

export enum NotificationSettingType {
  SOUND = 'sound',
  VIBRATION = 'vibration',
  POPUP = 'popup',
}

export enum TimeConfigType {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
}

export enum ImportanceLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface DurationRange {
  min: number;
  max: number;
}

export interface NotificationSettings {
  sound: boolean;
  vibration: boolean;
  popup: boolean;
}

export interface RecurrenceRule {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  endCondition?: {
    type: 'never' | 'date' | 'count';
    endDate?: Date;
    count?: number;
  };
  config?: {
    weekdays?: number[];
    monthDays?: number[];
    months?: number[];
  };
}

export interface RelativeTimeConfig {
  name: string;
  description?: string;
  duration: number | DurationRange;
  type: TimeConfigType.RELATIVE;
  schedule: RecurrenceRule;
}

export interface AbsoluteTimeConfig {
  name: string;
  type: TimeConfigType.ABSOLUTE;
  description?: string;
  schedule: RecurrenceRule;
}

export type ReminderTimeConfig = RelativeTimeConfig | AbsoluteTimeConfig;

export interface IReminderTemplate {
  uuid: string;
  groupUuid: string;
  name: string;
  description?: string;
  importanceLevel: ImportanceLevel;
  selfEnabled: boolean;
  notificationSettings: NotificationSettings;
  timeConfig: ReminderTimeConfig;
}

export interface IReminderTemplateGroup {
  uuid: string;
  name: string;
  enabled: boolean;
  enableMode: ReminderTemplateEnableMode;
  templates: IReminderTemplate[];
}

export const SYSTEM_GROUP_ID = 'system-root';
