
import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { ReminderInstance } from "../entities/reminderInstance";
import type { IReminderTemplate, RelativeTimeSchedule, ReminderSchedule } from "@common/modules/reminder";

export class ReminderTemplate 
  extends AggregateRoot
  implements IReminderTemplate
{
  private _groupUuid: string;
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
  private _reminderInstances: ReminderInstance[] = [];

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
    uuid?: string,
    description?: string
  ) {
    super(uuid || ReminderTemplate.generateId());
    this._groupUuid = groupId;
    this._name = name;
    this._description = description;
    this._importanceLevel = importanceLevel;
    this._selfEnabled = selfEnabled;
    this._notificationSettings = notificationSettings;
    this._timeConfig = timeConfig;
    
    // 初始化时，enabled 等于 selfEnabled（后续会根据组模式计算）
    this._enabled = selfEnabled;
  }
  get id(): string {
    return this._uuid;
  }

  get groupId(): string {
    return this._groupUuid;
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
   * 设置模板自身的启用状态
   */
  setSelfEnabled(selfEnabled: boolean) {
    this._selfEnabled = selfEnabled;
  }

  /**
   * 根据组的控制模式计算并设置实际的启用状态
   * @param groupEnabled 组的启用状态
   * @param groupMode 组的控制模式
   */
  calculateAndSetEnabled(groupEnabled: boolean, groupMode: "group" | "individual") {
    if (groupMode === "group") {
      // 组模式：模板的启用状态完全由组决定
      this._enabled = groupEnabled;
    } else {
      // 个体模式：模板的启用状态由自身的 selfEnabled 和组的启用状态共同决定
      this._enabled = groupEnabled && this._selfEnabled;
    }
  }

  /**
   * 获取模板当前应该的启用状态（业务逻辑）
   * @param groupEnabled 组的启用状态
   * @param groupMode 组的控制模式
   */
  getCalculatedEnabled(groupEnabled: boolean, groupMode: "group" | "individual"): boolean {
    if (groupMode === "group") {
      return groupEnabled;
    } else {
      return groupEnabled && this._selfEnabled;
    }
  }

  /**
   * 计算所有提醒时间（递归，支持区间），返回 ReminderSchedule[]
   * @param baseTime 创建任务的时间（ISO8601字符串）
   */
  calculateReminderSchedules(baseTime: string): ReminderSchedule[] {
    const schedules: ReminderSchedule[] = [];
    const baseDate = new Date(baseTime);
    const traverse = (
      times: RelativeTimeSchedule[],
      currentTime: Date,
      parentName?: string
    ) => {
      times.forEach((item) => {
        let duration = 0;
        if (typeof item.duration === "number") {
          duration = item.duration;
        } else {
          // 随机取区间
          duration = item.duration.min + Math.random() * (item.duration.max - item.duration.min);
        }
        const nextTime = new Date(currentTime.getTime() + duration * 1000);
        schedules.push({
          name: parentName ? `${parentName} - ${item.name}` : item.name,
          description: item.description,
          time: nextTime.toISOString(),
        });
        if (item.times && item.times.length > 0) {
          traverse(item.times, nextTime, item.name);
        }
      });
    };
    if (this._timeConfig.type === "absolute") {
      // 绝对时间配置，直接使用 ISO8601 字符串
      const { name, description, schedule } = this._timeConfig;
        schedules.push({
          name: name,
          description: description,
          time: schedule,
        });

    } else if (this._timeConfig.type === "relative") {
      console.log('Calculating relative reminder schedules...');
    }
    return schedules;
  }

  /**
   * 创建任务实例，自动生成提醒计划
   */
  createInstance(baseTime: string): ReminderInstance {
    const reminderSchedules = this.calculateReminderSchedules(baseTime);
    return new ReminderInstance(
      this.uuid,
      this.name,
      this.importanceLevel,
      this.enabled,
      this.notificationSettings,
      reminderSchedules,
      this.description
    );
  }

  toDTO(): IReminderTemplate {
    const reminderTemplateDTO: IReminderTemplate = {
      uuid: this.uuid,
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
      dto.uuid,
      dto.description
    );
    // 设置计算出的 enabled 状态
    template._enabled = dto.enabled;
    return template;
  }
}

