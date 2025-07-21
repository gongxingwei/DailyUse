import { RecurrenceRule } from "@/shared/types/recurrenceRule";
// import { RecurrenceRule } from "node-schedule";
import { ReminderTemplate } from "../../../../src/modules/Reminder/domain/aggregates/reminderTemplate"
import { ReminderTemplateGroup } from "../../../../src/modules/Reminder/domain/aggregates/reminderTemplateGroup"

export type GridItem = ReminderTemplate | ReminderTemplateGroup;

import { ImportanceLevel } from "@/shared/types/importance";

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

export interface TemplateFormData {
  name: string;
  groupId?: string | null;
  description: string;
  importanceLevel: ImportanceLevel;
  selfEnabled: boolean;
  enabled: boolean;
  notificationSettings: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  timeConfig: {
    name: string;
    type: 'absolute' | 'relative';
    duration?: number | undefined; // For relative time
    schedule: RecurrenceRule; // For absolute time, can be ISO8601 strings
  };
}


export interface IReminderTemplate {
  groupId: string;
  uuid: string;
  name: string;
  description?: string;
  importanceLevel: ImportanceLevel;
  /** 模板自身的启用状态 */
  selfEnabled: boolean;
  /** 模板实际的启用状态（根据组模式和selfEnabled计算得出） */
  enabled: boolean;
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


// ------ Reminder Instance Types ------

export interface IReminderInstance {
  uuid: string;
  templateId: string;
  templateName: string;
  description?: string;
  importanceLevel: ImportanceLevel;
  enabled: boolean;
  notificationSettings: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  reminderSchedules: ReminderSchedule[];

  lifecycle: {
    status: "pending" | "triggered" | "completed" | "cancelled";
    createdAt: string;
    updatedAt: string;
  };
}

