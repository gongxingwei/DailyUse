import { Entity } from "@/shared/domain/entity";
import type { IReminderInstance } from "../types/index.d.ts";

import { CronUtils } from "@electron/shared/utils/cronUtils";
import { ImportanceLevel } from "@/shared/types/importance";
import { reminderScheduleService } from "../../application/services/reminderScheduleService.ts";
import { s } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
export class ReminderInstance extends Entity implements IReminderInstance {
  private _templateId: string;
  private _templateName: string;
  private _description?: string;
  private _importanceLevel: ImportanceLevel;
  private _enabled: boolean;
  private _notificationSettings: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  private _reminderSchedules: IReminderInstance["reminderSchedules"];

  lifecycle: {
    status: "pending" | "triggered" | "completed" | "cancelled";
    createdAt: string;
    updatedAt: string;
  };

  constructor(
    templateId: string,
    templateName: string,
    importantanceLevel: ImportanceLevel,
    enabled: boolean,
    notificationSettings: {
      sound: boolean;
      vibration: boolean;
      popup: boolean;
    },
    reminderSchedules: IReminderInstance["reminderSchedules"],
    id?: string,
    description?: string
  ) {
    super(id || ReminderInstance.generateId());
    this._templateId = templateId;
    this._templateName = templateName;
    this._description = description;
    this._importanceLevel = importantanceLevel;
    this._enabled = enabled;
    this._notificationSettings = notificationSettings;
    this._reminderSchedules = reminderSchedules;

    this.lifecycle = {
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  get id(): string {
    return this._id;
  }

  get templateId(): string {
    return this._templateId;
  }

  get templateName(): string {
    return this._templateName;
  }

  get description(): string | undefined {
    return this._description;
  }

  get importanceLevel(): ImportanceLevel {
    return this._importanceLevel;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get notificationSettings(): IReminderInstance["notificationSettings"] {
    return this._notificationSettings;
  }

  get reminderSchedules(): IReminderInstance["reminderSchedules"] {
    return this._reminderSchedules;
  }

  get status(): "pending" | "triggered" | "completed" | "cancelled" {
    return this.lifecycle.status;
  }

  /**
   * 根据模板和基准时间初始化提醒实例
   */
  async activate(): Promise<void> {
    // 自动将每个提醒计划添加到任务队列
    for (const schedule of this._reminderSchedules) {
      if (typeof schedule.time === "string") {
        const date = new Date(schedule.time);
        const cron = CronUtils.dateToCron(date);
        await reminderScheduleService.createReminderScheduleByCron(
          cron,
          {
            id: this.id,
            title: this._templateName,
            body: this._description || "无说明",
            importanceLevel: this._importanceLevel,
          },
        );
        continue;
      }
      await reminderScheduleService.createReminderScheduleByRule(
        schedule.time,
        {
          id: this.id,
          title: this._templateName,
          body: this._description || "无说明",
          importanceLevel: this._importanceLevel,
        },
      );
    }
  }
}
