import { RecurrenceRule } from "@common/shared/types/recurrenceRule";
// import { RecurrenceRule } from "node-schedule";
import { ReminderTemplate } from "../../../../src/modules/Reminder/domain/entities/reminderTemplate"
import { ReminderTemplateGroup } from "../../../../src/modules/Reminder/domain/aggregates/reminderTemplateGroup"

export const SYSTEM_GROUP_ID = "system-root";

export type GridItem = ReminderTemplate | ReminderTemplateGroup;

import { ImportanceLevel } from "@common/shared/types/importance";

export interface RelativeTimeSchedule {
  name: string;
  description?: string;
  /** 时间长度，以秒为单位 */
  duration: number | DurationRange;
  times: RelativeTimeSchedule[];
}

interface DurationRange {
  min: number;
  max: number;
}

export interface IReminderTemplate {
  groupUuid: string;
  uuid: string;
  name: string;
  description?: string;
  importanceLevel: ImportanceLevel;
  /** 模板自身的启用状态 */
  selfEnabled: boolean;
  notificationSettings: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  timeConfig: ReminderTimeConfig;
}

type ReminderTimeConfig = AbsoluteTimeConfig | RelativeTimeConfig;

interface RelativeTimeConfig {
  name: string;
  description?: string;
  duration: number | DurationRange; // 时间长度，以秒为单位
  type: "relative";
  schedule: RecurrenceRule; 
}

interface AbsoluteTimeConfig {
  name: string;
  type: "absolute";
  description?: string;
  /** 具体时间点 */
  schedule: RecurrenceRule; 
}

export type ReminderTemplateEnableMode = "group" | "individual";

export interface IReminderTemplateGroup {
  uuid: string;
  name: string;

  enabled: boolean;
  enableMode: ReminderTemplateEnableMode;
  templates: IReminderTemplate[];
}



export interface ReminderSchedule {
  name: string;
  description?: string;
  /** 计划执行时间 */
  time: string | RecurrenceRule; // ISO 8601 格式的时间字符串
}


// ------ Reminder Group Types ------

export interface IReminderTemplateGroup {
  uuid: string;
  name: string;

  enabled: boolean;
  enableMode: ReminderTemplateEnableMode;
  templates: IReminderTemplate[];
}