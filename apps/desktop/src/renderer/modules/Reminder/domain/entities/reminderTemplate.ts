import { Entity } from '@dailyuse/utils';
import type { IReminderTemplate } from '../../../../../common/modules/reminder/types/reminder';
import { ImportanceLevel } from '@dailyuse/contracts';
import { SYSTEM_GROUP_ID } from '@common/modules/reminder/types/reminder';

/**
 * ReminderTemplate 实体类
 * 表示一个提醒模板，包含提醒的所有配置信息
 */
export class ReminderTemplate extends Entity implements IReminderTemplate {
  // 分组UUID
  private _groupUuid: string;
  // 模板名称
  private _name: string;
  // 模板描述
  private _description?: string;
  // 重要级别
  private _importanceLevel: IReminderTemplate['importanceLevel'];
  // 自身启用状态
  private _selfEnabled: boolean = true;
  // 通知设置
  private _notificationSettings: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  // 时间配置
  private _timeConfig: IReminderTemplate['timeConfig'];

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
    importanceLevel: IReminderTemplate['importanceLevel'];
    selfEnabled: boolean;
    notificationSettings: {
      sound: boolean;
      vibration: boolean;
      popup: boolean;
    };
    timeConfig: IReminderTemplate['timeConfig'];
    uuid?: string;
    description?: string;
    enabled?: boolean;
  }) {
    super(params.uuid || ReminderTemplate.generateUUID());
    this._groupUuid = params.groupUuid;
    this._name = params.name;
    this._description = params.description;
    this._importanceLevel = params.importanceLevel;
    this._selfEnabled = params.selfEnabled;
    this._notificationSettings = params.notificationSettings;
    this._timeConfig = params.timeConfig;
  }

  // 分组UUID getter/setter
  get groupUuid(): string {
    return this._groupUuid;
  }
  set groupUuid(val: string) {
    this._groupUuid = val;
  }

  // 名称 getter/setter
  get name(): string {
    return this._name;
  }
  set name(val: string) {
    this._name = val;
  }

  // 描述 getter/setter
  get description(): string | undefined {
    return this._description;
  }
  set description(val: string | undefined) {
    this._description = val;
  }

  // 重要级别 getter/setter
  get importanceLevel(): IReminderTemplate['importanceLevel'] {
    return this._importanceLevel;
  }
  set importanceLevel(val: IReminderTemplate['importanceLevel']) {
    this._importanceLevel = val;
  }

  // 自身启用 getter/setter
  get selfEnabled(): boolean {
    return this._selfEnabled;
  }
  set selfEnabled(val: boolean) {
    this._selfEnabled = val;
  }

  // 通知设置 getter/setter
  get notificationSettings() {
    return this._notificationSettings;
  }
  set notificationSettings(val: { sound: boolean; vibration: boolean; popup: boolean }) {
    this._notificationSettings = val;
  }

  // 时间配置 getter/setter
  get timeConfig() {
    return this._timeConfig;
  }
  set timeConfig(val: IReminderTemplate['timeConfig']) {
    this._timeConfig = val;
  }

  /**
   * 判断对象是否为 ReminderTemplate 实例
   */
  static isReminderTemplate(obj: any): obj is ReminderTemplate {
    return (
      obj instanceof ReminderTemplate ||
      (obj &&
        typeof obj === 'object' &&
        'id' in obj &&
        'groupUuid' in obj &&
        'name' in obj &&
        'importanceLevel' in obj &&
        'selfEnabled' in obj &&
        'enabled' in obj &&
        'notificationSettings' in obj &&
        'timeConfig' in obj)
    );
  }

  /**
   * 转换为 DTO（用于持久化或传输）
   */
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

  /**
   * 从 DTO 创建 ReminderTemplate 实例
   */
  static fromDTO(dto: IReminderTemplate): ReminderTemplate {
    return new ReminderTemplate({
      groupUuid: dto.groupUuid,
      name: dto.name,
      importanceLevel: dto.importanceLevel,
      selfEnabled: dto.selfEnabled,
      notificationSettings: dto.notificationSettings,
      timeConfig: dto.timeConfig,
      uuid: dto.uuid,
      description: dto.description,
    });
  }

  /**
   * 保证返回 ReminderTemplate 实例或 null
   * @param template 可能为 DTO、实体或 null
   */
  static ensureReminderTemplate(
    template: IReminderTemplate | ReminderTemplate | null,
  ): ReminderTemplate | null {
    if (ReminderTemplate.isReminderTemplate(template)) {
      return template instanceof ReminderTemplate ? template : ReminderTemplate.fromDTO(template);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 ReminderTemplate 实例，永不为 null
   * @param template 可能为 DTO、实体或 null
   */
  static ensureReminderTemplateNeverNull(
    template: IReminderTemplate | ReminderTemplate | null,
  ): ReminderTemplate {
    if (ReminderTemplate.isReminderTemplate(template)) {
      return template instanceof ReminderTemplate ? template : ReminderTemplate.fromDTO(template);
    } else {
      return ReminderTemplate.forCreate();
    }
  }

  /**
   * 克隆当前实例
   */
  clone(): ReminderTemplate {
    return new ReminderTemplate({
      groupUuid: this._groupUuid,
      name: this._name,
      importanceLevel: this._importanceLevel,
      selfEnabled: this._selfEnabled,
      notificationSettings: { ...this._notificationSettings },
      timeConfig: { ...this._timeConfig },
      uuid: this.uuid, // 保持相同的 uuid
      description: this._description,
    });
  }

  /**
   * 创建一个用于新建的默认实例
   */
  static forCreate(): ReminderTemplate {
    return new ReminderTemplate({
      groupUuid: SYSTEM_GROUP_ID,
      name: '',
      importanceLevel: ImportanceLevel.Important,
      selfEnabled: true,
      notificationSettings: { sound: true, vibration: true, popup: true },
      timeConfig: { name: '', type: 'absolute', schedule: {} } as IReminderTemplate['timeConfig'],
    });
  }
}
