import { ValueObject } from '@dailyuse/utils';
import { ReminderAlert, SnoozeConfig } from '../types';

export class TaskReminderConfig extends ValueObject {
  private readonly _enabled: boolean;
  private readonly _alerts: ReminderAlert[];
  private readonly _snooze: SnoozeConfig;

  get enabled(): boolean {
    return this._enabled;
  }

  get alerts(): ReminderAlert[] {
    return [...this._alerts];
  }

  get snooze(): SnoozeConfig {
    return { ...this._snooze };
  }

  constructor(params: { enabled: boolean; alerts: ReminderAlert[]; snooze: SnoozeConfig }) {
    super();
    this._enabled = params.enabled;
    this._alerts = [...params.alerts];
    this._snooze = { ...params.snooze };
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof TaskReminderConfig)) {
      return false;
    }

    return (
      this._enabled === other._enabled &&
      JSON.stringify(this._alerts) === JSON.stringify(other._alerts) &&
      JSON.stringify(this._snooze) === JSON.stringify(other._snooze)
    );
  }

  static create(params: {
    enabled: boolean;
    alerts: ReminderAlert[];
    snooze: SnoozeConfig;
  }): TaskReminderConfig {
    return new TaskReminderConfig(params);
  }

  static createDefault(): TaskReminderConfig {
    return new TaskReminderConfig({
      enabled: false,
      alerts: [],
      snooze: {
        enabled: false,
        interval: 5,
        maxCount: 3,
      },
    });
  }
}
