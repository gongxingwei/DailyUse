/**
 * ReminderTemplate 聚合根实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderContracts as RC, ImportanceLevel } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import {
  TriggerConfigClient,
  RecurrenceConfigClient,
  ActiveTimeConfigClient,
  ActiveHoursConfigClient,
  NotificationConfigClient,
  ReminderStatsClient,
} from '../value-objects';

type IReminderTemplateClient = ReminderContracts.ReminderTemplateClient;
type ReminderTemplateClientDTO = ReminderContracts.ReminderTemplateClientDTO;
type ReminderTemplateServerDTO = ReminderContracts.ReminderTemplateServerDTO;
type ReminderType = ReminderContracts.ReminderType;
type ReminderStatus = ReminderContracts.ReminderStatus;
type TriggerConfigClientDTO = ReminderContracts.TriggerConfigClientDTO;
type RecurrenceConfigClientDTO = ReminderContracts.RecurrenceConfigClientDTO;
type ActiveTimeConfigClientDTO = ReminderContracts.ActiveTimeConfigClientDTO;
type ActiveHoursConfigClientDTO = ReminderContracts.ActiveHoursConfigClientDTO;
type NotificationConfigClientDTO = ReminderContracts.NotificationConfigClientDTO;
type ReminderStatsClientDTO = ReminderContracts.ReminderStatsClientDTO;

const ReminderType = RC.ReminderType;
const ReminderStatus = RC.ReminderStatus;

/**
 * ReminderTemplate 聚合根 (Client)
 */
export class ReminderTemplateClient extends AggregateRoot implements IReminderTemplateClient {
  private _accountUuid: string;
  private _title: string;
  private _description?: string | null;
  private _type: ReminderType;
  private _trigger: TriggerConfigClient;
  private _recurrence?: RecurrenceConfigClient | null;
  private _activeTime: ActiveTimeConfigClient;
  private _activeHours?: ActiveHoursConfigClient | null;
  private _notificationConfig: NotificationConfigClient;
  private _selfEnabled: boolean;
  private _status: ReminderStatus;
  private _effectiveEnabled: boolean;
  private _groupUuid?: string | null;
  private _importanceLevel: ImportanceLevel;
  private _tags: string[];
  private _color?: string | null;
  private _icon?: string | null;
  private _nextTriggerAt?: number | null;
  private _stats: ReminderStatsClient;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    type: ReminderType;
    trigger: TriggerConfigClient;
    recurrence?: RecurrenceConfigClient | null;
    activeTime: ActiveTimeConfigClient;
    activeHours?: ActiveHoursConfigClient | null;
    notificationConfig: NotificationConfigClient;
    selfEnabled: boolean;
    status: ReminderStatus;
    effectiveEnabled: boolean;
    groupUuid?: string | null;
    importanceLevel: ImportanceLevel;
    tags: string[];
    color?: string | null;
    icon?: string | null;
    nextTriggerAt?: number | null;
    stats: ReminderStatsClient;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._type = params.type;
    this._trigger = params.trigger;
    this._recurrence = params.recurrence;
    this._activeTime = params.activeTime;
    this._activeHours = params.activeHours;
    this._notificationConfig = params.notificationConfig;
    this._selfEnabled = params.selfEnabled;
    this._status = params.status;
    this._effectiveEnabled = params.effectiveEnabled;
    this._groupUuid = params.groupUuid;
    this._importanceLevel = params.importanceLevel;
    this._tags = params.tags;
    this._color = params.color;
    this._icon = params.icon;
    this._nextTriggerAt = params.nextTriggerAt;
    this._stats = params.stats;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null | undefined {
    return this._description;
  }
  public get type(): ReminderType {
    return this._type;
  }
  public get trigger(): TriggerConfigClientDTO {
    return this._trigger.toClientDTO();
  }
  public get recurrence(): RecurrenceConfigClientDTO | null | undefined {
    return this._recurrence?.toClientDTO() || null;
  }
  public get activeTime(): ActiveTimeConfigClientDTO {
    return this._activeTime.toClientDTO();
  }
  public get activeHours(): ActiveHoursConfigClientDTO | null | undefined {
    return this._activeHours?.toClientDTO() || null;
  }
  public get notificationConfig(): NotificationConfigClientDTO {
    return this._notificationConfig.toClientDTO();
  }
  public get selfEnabled(): boolean {
    return this._selfEnabled;
  }
  public get status(): ReminderStatus {
    return this._status;
  }
  public get effectiveEnabled(): boolean {
    return this._effectiveEnabled;
  }
  public get groupUuid(): string | null | undefined {
    return this._groupUuid;
  }
  public get importanceLevel(): ImportanceLevel {
    return this._importanceLevel;
  }
  public get tags(): string[] {
    return [...this._tags];
  }
  public get color(): string | null | undefined {
    return this._color;
  }
  public get icon(): string | null | undefined {
    return this._icon;
  }
  public get nextTriggerAt(): number | null | undefined {
    return this._nextTriggerAt;
  }
  public get stats(): ReminderStatsClientDTO {
    return this._stats.toClientDTO();
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get deletedAt(): number | null | undefined {
    return this._deletedAt;
  }

  // ===== UI 扩展属性 =====

  public get displayTitle(): string {
    return this._title;
  }

  public get typeText(): string {
    return this._type === ReminderType.ONE_TIME ? '一次性' : '循环';
  }

  public get triggerText(): string {
    return this._trigger.displayText;
  }

  public get recurrenceText(): string | null | undefined {
    return this._recurrence?.displayText || null;
  }

  public get statusText(): string {
    return this._status === ReminderStatus.ACTIVE ? '活跃' : '已暂停';
  }

  public get importanceText(): string {
    const importanceMap: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: '极其重要',
      [ImportanceLevel.Important]: '非常重要',
      [ImportanceLevel.Moderate]: '中等重要',
      [ImportanceLevel.Minor]: '不太重要',
      [ImportanceLevel.Trivial]: '无关紧要',
    };
    return importanceMap[this._importanceLevel] || '中等重要';
  }

  public get nextTriggerText(): string | null | undefined {
    if (!this._nextTriggerAt) return null;
    return this.formatNextTrigger(this._nextTriggerAt);
  }

  public get isActive(): boolean {
    return this._status === ReminderStatus.ACTIVE && this._effectiveEnabled;
  }

  public get isPaused(): boolean {
    return this._status === ReminderStatus.PAUSED || !this._effectiveEnabled;
  }

  public get lastTriggeredText(): string | null | undefined {
    return this._stats.lastTriggeredText;
  }

  public get controlledByGroup(): boolean {
    return Boolean(this._groupUuid);
  }

  // ===== UI 业务方法 =====

  public getStatusBadge(): { text: string; color: string; icon: string } {
    if (this.isActive) {
      return { text: '活跃', color: 'green', icon: 'i-carbon-checkmark-filled' };
    }
    return { text: '已暂停', color: 'gray', icon: 'i-carbon-pause' };
  }

  public getImportanceBadge(): { text: string; color: string } {
    const badgeMap: Record<ImportanceLevel, { text: string; color: string }> = {
      [ImportanceLevel.Vital]: { text: '极其重要', color: 'red' },
      [ImportanceLevel.Important]: { text: '非常重要', color: 'orange' },
      [ImportanceLevel.Moderate]: { text: '中等重要', color: 'blue' },
      [ImportanceLevel.Minor]: { text: '不太重要', color: 'gray' },
      [ImportanceLevel.Trivial]: { text: '无关紧要', color: 'gray' },
    };
    return badgeMap[this._importanceLevel] || { text: '中等重要', color: 'blue' };
  }

  public getTriggerDisplay(): string {
    let display = this._trigger.displayText;
    if (this._recurrence) {
      display += ` (${this._recurrence.displayText})`;
    }
    return display;
  }

  public getNextTriggerDisplay(): string {
    return this.nextTriggerText || '暂无';
  }

  public canEnable(): boolean {
    return this._status === ReminderStatus.PAUSED && !this._deletedAt;
  }

  public canPause(): boolean {
    return this._status === ReminderStatus.ACTIVE && !this._deletedAt;
  }

  public canEdit(): boolean {
    return !this._deletedAt;
  }

  public canDelete(): boolean {
    return !this._deletedAt;
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): ReminderTemplateClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      title: this.title,
      description: this.description,
      type: this.type,
      trigger: this.trigger,
      recurrence: this.recurrence,
      activeTime: this.activeTime,
      activeHours: this.activeHours,
      notificationConfig: this.notificationConfig,
      selfEnabled: this.selfEnabled,
      status: this.status,
      effectiveEnabled: this.effectiveEnabled,
      groupUuid: this.groupUuid,
      importanceLevel: this.importanceLevel,
      tags: this.tags,
      color: this.color,
      icon: this.icon,
      nextTriggerAt: this.nextTriggerAt,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      displayTitle: this.displayTitle,
      typeText: this.typeText,
      triggerText: this.triggerText,
      recurrenceText: this.recurrenceText,
      statusText: this.statusText,
      importanceText: this.importanceText,
      nextTriggerText: this.nextTriggerText,
      isActive: this.isActive,
      isPaused: this.isPaused,
      lastTriggeredText: this.lastTriggeredText,
      controlledByGroup: this.controlledByGroup,
    };
  }

  public toServerDTO(): ReminderTemplateServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      title: this.title,
      description: this.description,
      type: this.type,
      trigger: this._trigger.toServerDTO(),
      recurrence: this._recurrence?.toServerDTO() || null,
      activeTime: this._activeTime.toServerDTO(),
      activeHours: this._activeHours?.toServerDTO() || null,
      notificationConfig: this._notificationConfig.toServerDTO(),
      selfEnabled: this.selfEnabled,
      status: this.status,
      groupUuid: this.groupUuid,
      importanceLevel: this.importanceLevel,
      tags: this.tags,
      color: this.color,
      icon: this.icon,
      nextTriggerAt: this.nextTriggerAt,
      stats: this._stats.toServerDTO(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  // ===== 静态工厂方法 =====

  public static fromServerDTO(dto: ReminderTemplateServerDTO): ReminderTemplateClient {
    // effectiveEnabled 由服务端计算并在 ClientDTO 中提供
    // 这里临时设为 selfEnabled，实际应从 ClientDTO 转换
    const effectiveEnabled = dto.selfEnabled; // 简化处理

    return new ReminderTemplateClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      trigger: TriggerConfigClient.fromServerDTO(dto.trigger),
      recurrence: dto.recurrence ? RecurrenceConfigClient.fromServerDTO(dto.recurrence) : null,
      activeTime: ActiveTimeConfigClient.fromServerDTO(dto.activeTime),
      activeHours: dto.activeHours ? ActiveHoursConfigClient.fromServerDTO(dto.activeHours) : null,
      notificationConfig: NotificationConfigClient.fromServerDTO(dto.notificationConfig),
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      effectiveEnabled,
      groupUuid: dto.groupUuid,
      importanceLevel: dto.importanceLevel,
      tags: dto.tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt,
      stats: ReminderStatsClient.fromServerDTO(dto.stats),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }

  // ===== 私有辅助方法 =====

  private formatNextTrigger(timestamp: number): string {
    const now = Date.now();
    const diff = timestamp - now;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff < 0) return '已过期';
    if (days > 0) {
      const date = new Date(timestamp);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `明天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return `${days} 天后`;
      }
    }
    if (hours > 0) return `${hours} 小时后`;
    if (minutes > 0) return `${minutes} 分钟后`;
    return '即将触发';
  }
}
