import { Entity } from "@/shared/domain/entity";
import type {
  IReminderTemplate,
  RelativeTimeSchedule,
  ReminderSchedule,
} from "@common/modules/reminder";

export class ReminderTemplate extends Entity implements IReminderTemplate {
  private _groupUuid: string;
  private _name: string;
  private _description?: string;
  private _importanceLevel: IReminderTemplate["importanceLevel"];
  private _selfEnabled: boolean = true; // 默认自身启用
  private _notificationSettings: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  private _timeConfig: IReminderTemplate["timeConfig"];

  /**
   * 构造函数（对象参数方式）
   * @param params 参数对象，包含所有属性
   * @example
   * new ReminderTemplate({
   *   groupUuid: 'xxx',
   *   name: '模板名',
   *   importanceLevel: 1,
   *   selfEnabled: true,
   *   notificationSettings: { sound: true, vibration: false, popup: true },
   *   timeConfig: {...},
   *   uuid: 'xxx', // 可选
   *   description: '描述' // 可选
   * })
   */
  constructor(params: {
    groupUuid: string;
    name: string;
    importanceLevel: IReminderTemplate["importanceLevel"];
    selfEnabled: boolean;
    notificationSettings: {
      sound: boolean;
      vibration: boolean;
      popup: boolean;
    };
    timeConfig: IReminderTemplate["timeConfig"];
    uuid?: string;
    description?: string;
  }) {
    super(params.uuid || ReminderTemplate.generateId());
    this._groupUuid = params.groupUuid;
    this._name = params.name;
    this._description = params.description;
    this._importanceLevel = params.importanceLevel;
    this._selfEnabled = params.selfEnabled;
    this._notificationSettings = params.notificationSettings;
    this._timeConfig = params.timeConfig;
  }

  get uuid(): string {
    return this._uuid;
  }

  get groupUuid(): string {
    return this._groupUuid;
  }
  set groupUuid(val: string) {
    this._groupUuid = val;
  }

  get name(): string {
    return this._name;
  }
  set name(val: string) {
    this._name = val;
  }

  get description(): string | undefined {
    return this._description;
  }
  set description(val: string | undefined) {
    this._description = val;
  }

  get importanceLevel(): IReminderTemplate["importanceLevel"] {
    return this._importanceLevel;
  }
  set importanceLevel(val: IReminderTemplate["importanceLevel"]) {
    this._importanceLevel = val;
  }

  get selfEnabled(): boolean {
    return this._selfEnabled;
  }
  set selfEnabled(val: boolean) {
    this._selfEnabled = val;
  }

  get notificationSettings() {
    return this._notificationSettings;
  }
  set notificationSettings(val: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  }) {
    this._notificationSettings = val;
  }

  get timeConfig() {
    return this._timeConfig;
  }
  set timeConfig(val: IReminderTemplate["timeConfig"]) {
    this._timeConfig = val;
  }

  addToGroup(groupUuid: string) {
    this._groupUuid = groupUuid;
    // 这里可以添加逻辑来将模板添加到指定的组中
  }

  isEnabled(groupEnabled: boolean, groupMode: "group" | "individual"): boolean {
    if (groupMode === "group") {
      return groupEnabled;
    } else {
      return groupEnabled && this._selfEnabled;
    }
  }

  /**
   * 获取模板当前应该的启用状态（业务逻辑）
   * @param groupEnabled 组的启用状态
   * @param groupMode 组的控制模式
   */
  getCalculatedEnabled(
    groupEnabled: boolean,
    groupMode: "group" | "individual"
  ): boolean {
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
          duration =
            item.duration.min +
            Math.random() * (item.duration.max - item.duration.min);
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
      console.log("Calculating relative reminder schedules...");
    }
    return schedules;
  }

  toDTO(): IReminderTemplate {
    const reminderTemplateDTO: IReminderTemplate = {
      uuid: this.uuid,
      groupUuid: this.groupUuid,
      name: this.name,
      description: this.description,
      importanceLevel: this.importanceLevel,
      selfEnabled: this.selfEnabled,
      notificationSettings: this.notificationSettings,
      timeConfig: this.timeConfig,
    };
    return reminderTemplateDTO;
  }

  static fromDTO(dto: IReminderTemplate): ReminderTemplate {
    const reminderTemplate = new ReminderTemplate({
      groupUuid: dto.groupUuid,
      name: dto.name,
      importanceLevel: dto.importanceLevel,
      selfEnabled: dto.selfEnabled,
      notificationSettings: dto.notificationSettings,
      timeConfig: dto.timeConfig,
      uuid: dto.uuid,
      description: dto.description
    });
    return reminderTemplate;
  }
}