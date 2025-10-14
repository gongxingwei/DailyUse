/**
 * ReminderStats 值对象实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IReminderStatsClient = ReminderContracts.ReminderStatsClient;
type ReminderStatsClientDTO = ReminderContracts.ReminderStatsClientDTO;
type ReminderStatsServerDTO = ReminderContracts.ReminderStatsServerDTO;

export class ReminderStatsClient extends ValueObject implements IReminderStatsClient {
  private _totalTriggers: number;
  private _lastTriggeredAt?: number | null;

  private constructor(params: { totalTriggers: number; lastTriggeredAt?: number | null }) {
    super();
    this._totalTriggers = params.totalTriggers;
    this._lastTriggeredAt = params.lastTriggeredAt;
  }

  public get totalTriggers(): number {
    return this._totalTriggers;
  }

  public get lastTriggeredAt(): number | null | undefined {
    return this._lastTriggeredAt;
  }

  public get totalTriggersText(): string {
    return `已触发 ${this._totalTriggers} 次`;
  }

  public get lastTriggeredText(): string | null | undefined {
    if (!this._lastTriggeredAt) return null;
    return this.formatTimeAgo(this._lastTriggeredAt);
  }

  public equals(other: IReminderStatsClient): boolean {
    return (
      this._totalTriggers === other.totalTriggers && this._lastTriggeredAt === other.lastTriggeredAt
    );
  }

  public toServerDTO(): ReminderStatsServerDTO {
    return {
      totalTriggers: this._totalTriggers,
      lastTriggeredAt: this._lastTriggeredAt,
    };
  }

  public toClientDTO(): ReminderStatsClientDTO {
    return {
      totalTriggers: this._totalTriggers,
      lastTriggeredAt: this._lastTriggeredAt,
      totalTriggersText: this.totalTriggersText,
      lastTriggeredText: this.lastTriggeredText,
    };
  }

  public static fromClientDTO(dto: ReminderStatsClientDTO): ReminderStatsClient {
    return new ReminderStatsClient({
      totalTriggers: dto.totalTriggers,
      lastTriggeredAt: dto.lastTriggeredAt,
    });
  }

  public static fromServerDTO(dto: ReminderStatsServerDTO): ReminderStatsClient {
    return new ReminderStatsClient({
      totalTriggers: dto.totalTriggers,
      lastTriggeredAt: dto.lastTriggeredAt,
    });
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return '刚刚';
  }
}
