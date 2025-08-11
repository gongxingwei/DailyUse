import { ValueObject } from '@dailyuse/utils';
import { ReminderTimeConfig, TimeConfigType } from '../types';

export class ReminderTimeConfigVO extends ValueObject {
  private readonly _name: string;
  private readonly _description?: string;
  private readonly _type: TimeConfigType;
  private readonly _duration?: number;
  private readonly _schedule: any;

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get type(): TimeConfigType {
    return this._type;
  }

  get duration(): number | undefined {
    return this._duration;
  }

  get schedule(): any {
    return this._schedule;
  }

  constructor(config: ReminderTimeConfig) {
    super();
    this._name = config.name;
    this._description = config.description;
    this._type = config.type;
    this._schedule = config.schedule;

    if (config.type === TimeConfigType.RELATIVE) {
      this._duration = typeof config.duration === 'number' ? config.duration : config.duration.min;
    }
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof ReminderTimeConfigVO)) {
      return false;
    }

    return (
      this._name === other._name &&
      this._type === other._type &&
      this._duration === other._duration &&
      JSON.stringify(this._schedule) === JSON.stringify(other._schedule)
    );
  }

  static create(config: ReminderTimeConfig): ReminderTimeConfigVO {
    return new ReminderTimeConfigVO(config);
  }
}
