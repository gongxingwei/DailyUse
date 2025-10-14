/**
 * ActiveTimeConfig 值对象实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IActiveTimeConfigClient = ReminderContracts.ActiveTimeConfigClient;
type ActiveTimeConfigClientDTO = ReminderContracts.ActiveTimeConfigClientDTO;
type ActiveTimeConfigServerDTO = ReminderContracts.ActiveTimeConfigServerDTO;

export class ActiveTimeConfigClient extends ValueObject implements IActiveTimeConfigClient {
  private _startDate: number;
  private _endDate?: number | null;

  private constructor(params: { startDate: number; endDate?: number | null }) {
    super();
    this._startDate = params.startDate;
    this._endDate = params.endDate;
  }

  public get startDate(): number {
    return this._startDate;
  }

  public get endDate(): number | null | undefined {
    return this._endDate;
  }

  public get displayText(): string {
    const startText = this.formatDate(this._startDate);
    if (this._endDate) {
      const endText = this.formatDate(this._endDate);
      return `${startText} 至 ${endText}`;
    }
    return `从 ${startText} 开始`;
  }

  public get isActive(): boolean {
    const now = Date.now();
    if (now < this._startDate) return false;
    if (this._endDate && now > this._endDate) return false;
    return true;
  }

  public equals(other: IActiveTimeConfigClient): boolean {
    return this._startDate === other.startDate && this._endDate === other.endDate;
  }

  public toServerDTO(): ActiveTimeConfigServerDTO {
    return {
      startDate: this._startDate,
      endDate: this._endDate,
    };
  }

  public toClientDTO(): ActiveTimeConfigClientDTO {
    return {
      startDate: this._startDate,
      endDate: this._endDate,
      displayText: this.displayText,
      isActive: this.isActive,
    };
  }

  public static fromClientDTO(dto: ActiveTimeConfigClientDTO): ActiveTimeConfigClient {
    return new ActiveTimeConfigClient({
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  public static fromServerDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfigClient {
    return new ActiveTimeConfigClient({
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}
