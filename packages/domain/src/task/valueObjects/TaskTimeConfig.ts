import { ValueObject } from '@dailyuse/utils';
import { TaskType, RecurrenceRule } from '../types';

export class TaskTimeConfig extends ValueObject {
  private readonly _type: TaskType;
  private readonly _baseTime: {
    start: Date;
    end?: Date;
    duration?: number;
  };
  private readonly _recurrence: RecurrenceRule;
  private readonly _timezone: string;
  private readonly _dstHandling?: 'auto' | 'ignore';

  get type(): TaskType {
    return this._type;
  }

  get baseTime() {
    return { ...this._baseTime };
  }

  get recurrence(): RecurrenceRule {
    return { ...this._recurrence };
  }

  get timezone(): string {
    return this._timezone;
  }

  get dstHandling(): 'auto' | 'ignore' | undefined {
    return this._dstHandling;
  }

  constructor(params: {
    type: TaskType;
    baseTime: {
      start: Date;
      end?: Date;
      duration?: number;
    };
    recurrence: RecurrenceRule;
    timezone: string;
    dstHandling?: 'auto' | 'ignore';
  }) {
    super();

    if (params.type === TaskType.TIME_RANGE && !params.baseTime.end) {
      throw new Error('Time range tasks must have an end time');
    }

    if (
      params.baseTime.start &&
      params.baseTime.end &&
      params.baseTime.start >= params.baseTime.end
    ) {
      throw new Error('Start time must be before end time');
    }

    this._type = params.type;
    this._baseTime = { ...params.baseTime };
    this._recurrence = { ...params.recurrence };
    this._timezone = params.timezone;
    this._dstHandling = params.dstHandling;
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof TaskTimeConfig)) {
      return false;
    }

    return (
      this._type === other._type &&
      this._baseTime.start.getTime() === other._baseTime.start?.getTime() &&
      this._baseTime.end?.getTime() === other._baseTime.end?.getTime() &&
      this._baseTime.duration === other._baseTime.duration &&
      this._timezone === other._timezone &&
      this._dstHandling === other._dstHandling &&
      JSON.stringify(this._recurrence) === JSON.stringify(other._recurrence)
    );
  }

  static create(params: {
    type: TaskType;
    baseTime: {
      start: Date;
      end?: Date;
      duration?: number;
    };
    recurrence: RecurrenceRule;
    timezone: string;
    dstHandling?: 'auto' | 'ignore';
  }): TaskTimeConfig {
    return new TaskTimeConfig(params);
  }
}
