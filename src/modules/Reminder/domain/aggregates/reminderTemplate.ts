import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import type { IReminderTemplate, TemplateFormData } from "../types";
import type { RelativeTimeSchedule, ReminderSchedule, DurationRange } from "@electron/modules/Reminder";


/**
 * 渲染进程的 ReminderTemplate 聚合根类
 * 继承自 AggregateRoot 类，包含了提醒模板的基本属性和方法
 * 
 */
export class ReminderTemplate 
  extends AggregateRoot
  implements IReminderTemplate
{
  private _groupId: string;
  private _name: string;
  private _description?: string;
  private _importanceLevel: IReminderTemplate["importanceLevel"];
  private _selfEnabled: boolean = true; // 默认自身启用
  private _enabled: boolean;
  private _notificationSettings: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  private _timeConfig: IReminderTemplate["timeConfig"];

  constructor(
    groupId: string,
    name: string,
    importanceLevel: IReminderTemplate["importanceLevel"],
    selfEnabled: boolean,
    notificationSettings: {
      sound: boolean;
      vibration: boolean;
      popup: boolean;
    },
    timeConfig: IReminderTemplate["timeConfig"],
    id?: string,
    description?: string
  ) {
    super(id || ReminderTemplate.generateId());
    this._groupId = groupId;
    this._name = name;
    this._description = description;
    this._importanceLevel = importanceLevel;
    this._selfEnabled = selfEnabled;
    this._enabled = selfEnabled; // 初始化时等于 selfEnabled
    this._notificationSettings = notificationSettings;
    this._timeConfig = timeConfig;
  }

  get id(): string {
    return this._id;
  }

  get groupId(): string {
    return this._groupId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get importanceLevel(): IReminderTemplate["importanceLevel"] {
    return this._importanceLevel;
  }

  get selfEnabled(): boolean {
    return this._selfEnabled;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get notificationSettings() {
    return this._notificationSettings;
  }

  get timeConfig() {
    return this._timeConfig;
  }

  /**
 * 从 TemplateFormData 创建 ReminderTemplate 实例
 */
static fromFormData(formData: TemplateFormData): ReminderTemplate {
  // 转换 timeConfig 格式
  const timeConfig: IReminderTemplate["timeConfig"] = 
    formData.timeConfig.type === 'absolute' 
      ? {
          name: formData.timeConfig.name,
          type: 'absolute',
          description: undefined,
          schedule: formData.timeConfig.schedule
        }
      : {
          name: formData.timeConfig.name,
          type: 'relative',
          description: undefined,
          duration: formData.timeConfig.duration || 0,
          schedule: formData.timeConfig.schedule // RelativeTimeConfig 需要 times 数组
        };

  return new ReminderTemplate(
    formData.groupId || '',
    formData.name,
    formData.importanceLevel,
    formData.selfEnabled,
    formData.notificationSettings,
    timeConfig,
    undefined, // 新创建的不指定 id，让构造函数生成
    formData.description || undefined
  );
}

/**
 * 使用 TemplateFormData 更新当前 ReminderTemplate 实例
 */
updateFromFormData(formData: TemplateFormData): void {
  this._groupId = formData.groupId || this._groupId;
  this._name = formData.name;
  this._description = formData.description || undefined;
  this._importanceLevel = formData.importanceLevel;
  this._selfEnabled = formData.selfEnabled;
  this._enabled = formData.enabled;
  this._notificationSettings = { ...formData.notificationSettings };

  // 转换并更新 timeConfig
  this._timeConfig = 
    formData.timeConfig.type === 'absolute' 
      ? {
          name: formData.timeConfig.name,
          type: 'absolute',
          description: undefined,
          schedule: formData.timeConfig.schedule
        }
      : {
          name: formData.timeConfig.name,
          type: 'relative',
          description: undefined,
          duration: formData.timeConfig.duration || 0,
          schedule: formData.timeConfig.schedule // RelativeTimeConfig 需要 times 数组
        };
}

/**
 * 转换为 TemplateFormData 格式（用于编辑时回填表单）
 */
toFormData(): TemplateFormData {
  // 从 timeConfig 中提取 schedule
  let schedule: RecurrenceRule;
  let duration: number | undefined;

  if (this._timeConfig.type === 'absolute' && this._timeConfig.schedule) {
    schedule = this._timeConfig.schedule;
  } else {
    // 默认 schedule
    schedule = {
      second: 0,
      minute: 0,
      hour: 9,
      dayOfWeek: undefined,
      month: undefined,
      year: undefined
    };
  }

  if (this._timeConfig.type === 'relative') {
    duration = typeof this._timeConfig.duration === 'number' 
      ? this._timeConfig.duration 
      : undefined;
  }

  return {
    name: this._name,
    groupId: this._groupId,
    description: this._description || '',
    importanceLevel: this._importanceLevel,
    selfEnabled: this._selfEnabled,
    enabled: this._enabled,
    notificationSettings: { ...this._notificationSettings },
    timeConfig: {
      name: this._timeConfig.name || '',
      type: this._timeConfig.type,
      duration,
      schedule
    }
  };
}
  /**
   * 验证 TemplateFormData 是否有效
   */
  static validateFormData(formData: TemplateFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.name || formData.name.trim().length < 2) {
      errors.push('Template name must be at least 2 characters long');
    }

    if (!formData.groupId) {
      errors.push('Group ID is required');
    }

    if (formData.timeConfig.type === 'relative') {
      if (formData.timeConfig.duration === undefined || formData.timeConfig.duration <= 0) {
        errors.push('Duration must be greater than 0 for relative time config');
      }
    }

    if (formData.timeConfig.type === 'absolute') {
      if (!formData.timeConfig.schedule) {
        errors.push('Schedule is required for absolute time config');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }


  static isReminderTemplate(obj: any): obj is ReminderTemplate {
    return (
      obj instanceof ReminderTemplate ||
      (obj &&
        typeof obj === "object" &&
        "id" in obj &&
        "groupId" in obj &&
        "name" in obj &&
        "importanceLevel" in obj &&
        "selfEnabled" in obj &&
        "enabled" in obj &&
        "notificationSettings" in obj &&
        "timeConfig" in obj)
    );
  }

  toDTO(): IReminderTemplate {
    const reminderTemplateDTO: IReminderTemplate = {
      id: this.id,
      groupId: this.groupId,
      name: this.name,
      description: this.description,
      importanceLevel: this.importanceLevel,
      selfEnabled: this.selfEnabled,
      enabled: this.enabled,
      notificationSettings: this.notificationSettings,
      timeConfig: this.timeConfig,
    };
    return reminderTemplateDTO;
  }

  static fromDTO(dto: IReminderTemplate): ReminderTemplate {
    const template = new ReminderTemplate(
      dto.groupId,
      dto.name,
      dto.importanceLevel,
      dto.selfEnabled,
      dto.notificationSettings,
      dto.timeConfig,
      dto.id,
      dto.description
    );
    // 设置计算出的 enabled 状态
    template._enabled = dto.enabled;
    return template;
  }

  static ensureReminderTemplate(
    template: IReminderTemplate | ReminderTemplate | null
  ): ReminderTemplate | null {
    if (ReminderTemplate.isReminderTemplate(template)) {
      return template instanceof ReminderTemplate ? template : ReminderTemplate.fromDTO(template);
    } else {
      return null;
    }
  }
}