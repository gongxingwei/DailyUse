/**
 * GroupStats 值对象实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IGroupStatsClient = ReminderContracts.GroupStatsClient;
type GroupStatsClientDTO = ReminderContracts.GroupStatsClientDTO;
type GroupStatsServerDTO = ReminderContracts.GroupStatsServerDTO;

export class GroupStatsClient extends ValueObject implements IGroupStatsClient {
  private _totalTemplates: number;
  private _activeTemplates: number;
  private _pausedTemplates: number;
  private _selfEnabledTemplates: number;
  private _selfPausedTemplates: number;

  private constructor(params: {
    totalTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    selfEnabledTemplates: number;
    selfPausedTemplates: number;
  }) {
    super();
    this._totalTemplates = params.totalTemplates;
    this._activeTemplates = params.activeTemplates;
    this._pausedTemplates = params.pausedTemplates;
    this._selfEnabledTemplates = params.selfEnabledTemplates;
    this._selfPausedTemplates = params.selfPausedTemplates;
  }

  public get totalTemplates(): number {
    return this._totalTemplates;
  }

  public get activeTemplates(): number {
    return this._activeTemplates;
  }

  public get pausedTemplates(): number {
    return this._pausedTemplates;
  }

  public get selfEnabledTemplates(): number {
    return this._selfEnabledTemplates;
  }

  public get selfPausedTemplates(): number {
    return this._selfPausedTemplates;
  }

  public get templateCountText(): string {
    return `${this._totalTemplates} 个提醒`;
  }

  public get activeStatusText(): string {
    return `${this._activeTemplates} 个活跃`;
  }

  public equals(other: IGroupStatsClient): boolean {
    return (
      this._totalTemplates === other.totalTemplates &&
      this._activeTemplates === other.activeTemplates &&
      this._pausedTemplates === other.pausedTemplates
    );
  }

  public toServerDTO(): GroupStatsServerDTO {
    return {
      totalTemplates: this._totalTemplates,
      activeTemplates: this._activeTemplates,
      pausedTemplates: this._pausedTemplates,
      selfEnabledTemplates: this._selfEnabledTemplates,
      selfPausedTemplates: this._selfPausedTemplates,
    };
  }

  public toClientDTO(): GroupStatsClientDTO {
    return {
      totalTemplates: this._totalTemplates,
      activeTemplates: this._activeTemplates,
      pausedTemplates: this._pausedTemplates,
      selfEnabledTemplates: this._selfEnabledTemplates,
      selfPausedTemplates: this._selfPausedTemplates,
      templateCountText: this.templateCountText,
      activeStatusText: this.activeStatusText,
    };
  }

  public static fromClientDTO(dto: GroupStatsClientDTO): GroupStatsClient {
    return new GroupStatsClient({
      totalTemplates: dto.totalTemplates,
      activeTemplates: dto.activeTemplates,
      pausedTemplates: dto.pausedTemplates,
      selfEnabledTemplates: dto.selfEnabledTemplates,
      selfPausedTemplates: dto.selfPausedTemplates,
    });
  }

  public static fromServerDTO(dto: GroupStatsServerDTO): GroupStatsClient {
    return new GroupStatsClient({
      totalTemplates: dto.totalTemplates,
      activeTemplates: dto.activeTemplates,
      pausedTemplates: dto.pausedTemplates,
      selfEnabledTemplates: dto.selfEnabledTemplates,
      selfPausedTemplates: dto.selfPausedTemplates,
    });
  }
}
