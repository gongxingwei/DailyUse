import { Entity } from "@/shared/domain/entity";
import type { IReminderInstance } from "@common/modules/reminder";
import { ImportanceLevel } from "@/shared/types/importance";

/**
 * 渲染进程的 ReminderInstance 实体类
 * 继承自 Entity 类，包含了提醒实例的基本属性和方法
 */
export class ReminderInstance extends Entity implements IReminderInstance {
  private _templateUuid: string;
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
    uuid?: string,
    description?: string
  ) {
    super(uuid || ReminderInstance.generateId());
    this._templateUuid = templateId;
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
    return this._uuid;
  }

  get templateId(): string {
    return this._templateUuid;
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
}
