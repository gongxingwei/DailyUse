/**
 * RecurrenceConfig 值对象实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderContracts as RC } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRecurrenceConfigClient = ReminderContracts.RecurrenceConfigClient;
type RecurrenceConfigClientDTO = ReminderContracts.RecurrenceConfigClientDTO;
type RecurrenceConfigServerDTO = ReminderContracts.RecurrenceConfigServerDTO;
type RecurrenceType = ReminderContracts.RecurrenceType;
type WeekDay = ReminderContracts.WeekDay;
type DailyRecurrence = ReminderContracts.DailyRecurrence;
type WeeklyRecurrence = ReminderContracts.WeeklyRecurrence;
type CustomDaysRecurrence = ReminderContracts.CustomDaysRecurrence;

const RecurrenceType = RC.RecurrenceType;
const WeekDay = RC.WeekDay;

/**
 * RecurrenceConfig 值对象 (Client)
 */
export class RecurrenceConfigClient extends ValueObject implements IRecurrenceConfigClient {
  private _type: RecurrenceType;
  private _daily?: DailyRecurrence | null;
  private _weekly?: WeeklyRecurrence | null;
  private _customDays?: CustomDaysRecurrence | null;

  private constructor(params: {
    type: RecurrenceType;
    daily?: DailyRecurrence | null;
    weekly?: WeeklyRecurrence | null;
    customDays?: CustomDaysRecurrence | null;
  }) {
    super();
    this._type = params.type;
    this._daily = params.daily;
    this._weekly = params.weekly;
    this._customDays = params.customDays;
  }

  public get type(): RecurrenceType {
    return this._type;
  }

  public get daily(): DailyRecurrence | null | undefined {
    return this._daily;
  }

  public get weekly(): WeeklyRecurrence | null | undefined {
    return this._weekly;
  }

  public get customDays(): CustomDaysRecurrence | null | undefined {
    return this._customDays;
  }

  public get displayText(): string {
    switch (this._type) {
      case RecurrenceType.DAILY:
        if (this._daily) {
          return this._daily.interval === 1 ? '每天' : `每 ${this._daily.interval} 天`;
        }
        return '每天';

      case RecurrenceType.WEEKLY:
        if (this._weekly) {
          const weekDayTexts = this._weekly.weekDays.map((day) => this.getWeekDayText(day));
          const prefix = this._weekly.interval === 1 ? '每周' : `每 ${this._weekly.interval} 周`;
          return `${prefix}${weekDayTexts.join('、')}`;
        }
        return '每周';

      case RecurrenceType.CUSTOM_DAYS:
        if (this._customDays && this._customDays.dates.length > 0) {
          return `指定 ${this._customDays.dates.length} 个日期`;
        }
        return '指定日期';

      default:
        return '未知';
    }
  }

  public equals(other: IRecurrenceConfigClient): boolean {
    if (this._type !== other.type) return false;

    if (this._type === RecurrenceType.DAILY) {
      return this._daily?.interval === other.daily?.interval;
    }

    if (this._type === RecurrenceType.WEEKLY) {
      if (!this._weekly || !other.weekly) return false;
      if (this._weekly.interval !== other.weekly.interval) return false;
      if (this._weekly.weekDays.length !== other.weekly.weekDays.length) return false;
      return this._weekly.weekDays.every((day) => other.weekly?.weekDays.includes(day));
    }

    if (this._type === RecurrenceType.CUSTOM_DAYS) {
      if (!this._customDays || !other.customDays) return false;
      if (this._customDays.dates.length !== other.customDays.dates.length) return false;
      return this._customDays.dates.every((date) => other.customDays?.dates.includes(date));
    }

    return true;
  }

  public toServerDTO(): RecurrenceConfigServerDTO {
    return {
      type: this._type,
      daily: this._daily,
      weekly: this._weekly,
      customDays: this._customDays,
    };
  }

  public toClientDTO(): RecurrenceConfigClientDTO {
    return {
      type: this._type,
      daily: this._daily,
      weekly: this._weekly,
      customDays: this._customDays,
      displayText: this.displayText,
    };
  }

  public static fromClientDTO(dto: RecurrenceConfigClientDTO): RecurrenceConfigClient {
    return new RecurrenceConfigClient({
      type: dto.type,
      daily: dto.daily,
      weekly: dto.weekly,
      customDays: dto.customDays,
    });
  }

  public static fromServerDTO(dto: RecurrenceConfigServerDTO): RecurrenceConfigClient {
    return new RecurrenceConfigClient({
      type: dto.type,
      daily: dto.daily,
      weekly: dto.weekly,
      customDays: dto.customDays,
    });
  }

  private getWeekDayText(day: WeekDay): string {
    const weekDayMap: Record<WeekDay, string> = {
      [WeekDay.MONDAY]: '一',
      [WeekDay.TUESDAY]: '二',
      [WeekDay.WEDNESDAY]: '三',
      [WeekDay.THURSDAY]: '四',
      [WeekDay.FRIDAY]: '五',
      [WeekDay.SATURDAY]: '六',
      [WeekDay.SUNDAY]: '日',
    };
    return weekDayMap[day] || '';
  }
}
