/**
 * ActiveHoursConfig 值对象实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IActiveHoursConfigClient = ReminderContracts.ActiveHoursConfigClient;
type ActiveHoursConfigClientDTO = ReminderContracts.ActiveHoursConfigClientDTO;
type ActiveHoursConfigServerDTO = ReminderContracts.ActiveHoursConfigServerDTO;

export class ActiveHoursConfigClient extends ValueObject implements IActiveHoursConfigClient {
  private _enabled: boolean;
  private _startHour: number;
  private _endHour: number;

  private constructor(params: { enabled: boolean; startHour: number; endHour: number }) {
    super();
    this._enabled = params.enabled;
    this._startHour = params.startHour;
    this._endHour = params.endHour;
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public get startHour(): number {
    return this._startHour;
  }

  public get endHour(): number {
    return this._endHour;
  }

  public get displayText(): string {
    if (!this._enabled) return '全天';
    return `${this.formatHour(this._startHour)} - ${this.formatHour(this._endHour)}`;
  }

  public equals(other: IActiveHoursConfigClient): boolean {
    return (
      this._enabled === other.enabled &&
      this._startHour === other.startHour &&
      this._endHour === other.endHour
    );
  }

  public toServerDTO(): ActiveHoursConfigServerDTO {
    return {
      enabled: this._enabled,
      startHour: this._startHour,
      endHour: this._endHour,
    };
  }

  public toClientDTO(): ActiveHoursConfigClientDTO {
    return {
      enabled: this._enabled,
      startHour: this._startHour,
      endHour: this._endHour,
      displayText: this.displayText,
    };
  }

  public static fromClientDTO(dto: ActiveHoursConfigClientDTO): ActiveHoursConfigClient {
    return new ActiveHoursConfigClient({
      enabled: dto.enabled,
      startHour: dto.startHour,
      endHour: dto.endHour,
    });
  }

  public static fromServerDTO(dto: ActiveHoursConfigServerDTO): ActiveHoursConfigClient {
    return new ActiveHoursConfigClient({
      enabled: dto.enabled,
      startHour: dto.startHour,
      endHour: dto.endHour,
    });
  }

  private formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}
