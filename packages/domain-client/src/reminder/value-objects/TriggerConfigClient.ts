/**
 * TriggerConfig 值对象实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderContracts as RC } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ITriggerConfigClient = ReminderContracts.TriggerConfigClient;
type TriggerConfigClientDTO = ReminderContracts.TriggerConfigClientDTO;
type TriggerConfigServerDTO = ReminderContracts.TriggerConfigServerDTO;
type TriggerType = ReminderContracts.TriggerType;
type FixedTimeTrigger = ReminderContracts.FixedTimeTrigger;
type IntervalTrigger = ReminderContracts.IntervalTrigger;

const TriggerType = RC.TriggerType;

export class TriggerConfigClient extends ValueObject implements ITriggerConfigClient {
  private _type: TriggerType;
  private _fixedTime?: FixedTimeTrigger | null;
  private _interval?: IntervalTrigger | null;

  private constructor(params: {
    type: TriggerType;
    fixedTime?: FixedTimeTrigger | null;
    interval?: IntervalTrigger | null;
  }) {
    super();
    this._type = params.type;
    this._fixedTime = params.fixedTime;
    this._interval = params.interval;
  }

  public get type(): TriggerType {
    return this._type;
  }

  public get fixedTime(): FixedTimeTrigger | null | undefined {
    return this._fixedTime;
  }

  public get interval(): IntervalTrigger | null | undefined {
    return this._interval;
  }

  public get displayText(): string {
    if (this._type === TriggerType.FIXED_TIME && this._fixedTime) {
      return `每天 ${this._fixedTime.time}`;
    }

    if (this._type === TriggerType.INTERVAL && this._interval) {
      const hours = Math.floor(this._interval.minutes / 60);
      const mins = this._interval.minutes % 60;

      if (hours > 0 && mins > 0) {
        return `每隔 ${hours} 小时 ${mins} 分钟`;
      } else if (hours > 0) {
        return `每隔 ${hours} 小时`;
      } else {
        return `每隔 ${mins} 分钟`;
      }
    }

    return '未设置';
  }

  public equals(other: ITriggerConfigClient): boolean {
    if (this._type !== other.type) return false;

    if (this._type === TriggerType.FIXED_TIME) {
      return this._fixedTime?.time === other.fixedTime?.time;
    }

    if (this._type === TriggerType.INTERVAL) {
      return this._interval?.minutes === other.interval?.minutes;
    }

    return true;
  }

  public toServerDTO(): TriggerConfigServerDTO {
    return {
      type: this._type,
      fixedTime: this._fixedTime,
      interval: this._interval,
    };
  }

  public toClientDTO(): TriggerConfigClientDTO {
    return {
      type: this._type,
      fixedTime: this._fixedTime,
      interval: this._interval,
      displayText: this.displayText,
    };
  }

  public static fromClientDTO(dto: TriggerConfigClientDTO): TriggerConfigClient {
    return new TriggerConfigClient({
      type: dto.type,
      fixedTime: dto.fixedTime,
      interval: dto.interval,
    });
  }

  public static fromServerDTO(dto: TriggerConfigServerDTO): TriggerConfigClient {
    return new TriggerConfigClient({
      type: dto.type,
      fixedTime: dto.fixedTime,
      interval: dto.interval,
    });
  }
}
