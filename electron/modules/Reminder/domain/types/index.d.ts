import { ImportanceLevel } from "@/shared/types/importance";
import { RecurrenceRule } from "node-schedule";

interface RelativeTimeSchedule {
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

interface RelativeTimeConfig {
  name: string;
  description?: string;
  duration: number | DurationRange; // 时间长度，以秒为单位
  type: "relative";
  times: RelativeTimeSchedule[];
}

interface AbsoluteTimeConfig {
  name: string;
  type: "absolute";
  description?: string;
  /** 具体时间点 */
  times: RecurrenceRule[]; 
}

export interface IReminderTemplate {
  groupId: string;
  id: string;
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

export type ReminderTemplateEnableMode = "group" | "individual";

export interface IReminderTemplateGroup {
  id: string;
  name: string;

  enabled: boolean;
  enableMode: ReminderTemplateEnableMode;
  templates: IReminderTemplate[];
}

export interface IReminderInstance {
  id: string;
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

interface ReminderSchedule {
  name: string;
  description?: string;
  /** 计划执行时间 */
  time: string | RecurrenceRule; // ISO 8601 格式的时间字符串
}
