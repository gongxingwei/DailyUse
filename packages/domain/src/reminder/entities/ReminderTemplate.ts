import { Entity } from '@dailyuse/utils';
import { ReminderTimeConfigVO } from '../valueObjects/ReminderTimeConfig';
import {
  IReminderTemplate,
  ImportanceLevel,
  NotificationSettings,
  ReminderTimeConfig,
} from '../types';

export class ReminderTemplate extends Entity implements IReminderTemplate {
  private _groupUuid: string;
  private _name: string;
  private _description?: string;
  private _importanceLevel: ImportanceLevel;
  private _selfEnabled: boolean;
  private _notificationSettings: NotificationSettings;
  private _timeConfig: ReminderTimeConfigVO;

  constructor(params: {
    uuid?: string;
    groupUuid: string;
    name: string;
    description?: string;
    importanceLevel: ImportanceLevel;
    selfEnabled?: boolean;
    notificationSettings: NotificationSettings;
    timeConfig: ReminderTimeConfig;
  }) {
    super(params.uuid);
    this._groupUuid = params.groupUuid;
    this._name = params.name;
    this._description = params.description;
    this._importanceLevel = params.importanceLevel;
    this._selfEnabled = params.selfEnabled ?? true;
    this._notificationSettings = params.notificationSettings;
    this._timeConfig = ReminderTimeConfigVO.create(params.timeConfig);
  }

  get groupUuid(): string {
    return this._groupUuid;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get importanceLevel(): ImportanceLevel {
    return this._importanceLevel;
  }

  get selfEnabled(): boolean {
    return this._selfEnabled;
  }

  get notificationSettings(): NotificationSettings {
    return { ...this._notificationSettings };
  }

  get timeConfig(): ReminderTimeConfig {
    return {
      name: this._timeConfig.name,
      description: this._timeConfig.description,
      type: this._timeConfig.type,
      schedule: this._timeConfig.schedule,
      ...(this._timeConfig.duration && { duration: this._timeConfig.duration }),
    } as ReminderTimeConfig;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Reminder template name cannot be empty');
    }
    this._name = name.trim();
  }

  updateDescription(description?: string): void {
    this._description = description;
  }

  updateImportanceLevel(level: ImportanceLevel): void {
    this._importanceLevel = level;
  }

  enable(): void {
    this._selfEnabled = true;
  }

  disable(): void {
    this._selfEnabled = false;
  }

  updateNotificationSettings(settings: Partial<NotificationSettings>): void {
    this._notificationSettings = { ...this._notificationSettings, ...settings };
  }

  updateTimeConfig(timeConfig: ReminderTimeConfig): void {
    this._timeConfig = ReminderTimeConfigVO.create(timeConfig);
  }

  moveToGroup(groupUuid: string): void {
    this._groupUuid = groupUuid;
  }
}
