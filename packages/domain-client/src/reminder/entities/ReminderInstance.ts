import type { ReminderContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';

/**
 * 提醒实例实体 - 客户端实现
 */
export class ReminderInstance extends AggregateRoot {
  protected _uuid: string;
  protected _templateUuid: string;
  protected _title?: string;
  protected _message: string;
  protected _scheduledTime: Date;
  protected _triggeredTime?: Date;
  protected _acknowledgedTime?: Date;
  protected _dismissedTime?: Date;
  protected _snoozedUntil?: Date;
  protected _status: ReminderContracts.ReminderStatus;
  protected _priority: ReminderContracts.ReminderPriority;
  protected _metadata: {
    category: string;
    tags: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  };
  protected _snoozeHistory: Array<{
    snoozedAt: Date;
    snoozeUntil: Date;
    snoozeType?: ReminderContracts.SnoozeType;
    customMinutes?: number;
    reason?: string;
  }>;
  protected _currentSnoozeCount: number;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _version: number;

  constructor(params: {
    uuid?: string;
    templateUuid: string;
    title?: string;
    message: string;
    scheduledTime: Date;
    triggeredTime?: Date;
    acknowledgedTime?: Date;
    dismissedTime?: Date;
    snoozedUntil?: Date;
    status: ReminderContracts.ReminderStatus;
    priority: ReminderContracts.ReminderPriority;
    metadata: {
      category: string;
      tags: string[];
      sourceType?: 'template' | 'task' | 'goal' | 'manual';
      sourceId?: string;
    };
    snoozeHistory: Array<{
      snoozedAt: Date;
      snoozeUntil: Date;
      snoozeType?: ReminderContracts.SnoozeType;
      customMinutes?: number;
      reason?: string;
    }>;
    currentSnoozeCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    this._uuid = params.uuid || AggregateRoot.generateUUID();
    this._templateUuid = params.templateUuid;
    this._title = params.title;
    this._message = params.message;
    this._scheduledTime = params.scheduledTime;
    this._triggeredTime = params.triggeredTime;
    this._acknowledgedTime = params.acknowledgedTime;
    this._dismissedTime = params.dismissedTime;
    this._snoozedUntil = params.snoozedUntil;
    this._status = params.status;
    this._priority = params.priority;
    this._metadata = params.metadata;
    this._snoozeHistory = params.snoozeHistory || [];
    this._currentSnoozeCount = params.currentSnoozeCount || 0;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
    this._version = params.version || 1;
  }

  // ===== 业务方法 =====

  /**
   * 更新提醒状态
   */
  updateStatus(status: ReminderContracts.ReminderStatus, timestamp?: Date): void {
    const now = timestamp || new Date();
    this._status = status;
    this._updatedAt = now;

    switch (status) {
      case 'triggered':
        this._triggeredTime = now;
        break;
      case 'acknowledged':
        this._acknowledgedTime = now;
        break;
      case 'dismissed':
        this._dismissedTime = now;
        break;
    }

    this._version++;
  }

  /**
   * 稍后提醒
   */
  snooze(snoozeUntil: Date, reason?: string): void {
    this._snoozedUntil = snoozeUntil;
    this._status = 'snoozed' as ReminderContracts.ReminderStatus;
    this._currentSnoozeCount++;

    this._snoozeHistory.push({
      snoozedAt: new Date(),
      snoozeUntil,
      reason,
    });

    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * 取消稍后提醒
   */
  cancelSnooze(): void {
    this._snoozedUntil = undefined;
    this._status = 'pending' as ReminderContracts.ReminderStatus;
    this._updatedAt = new Date();
    this._version++;
  }

  // ===== 计算属性 =====

  get isOverdue(): boolean {
    if (this._status !== 'pending') {
      return false;
    }
    return new Date() > this._scheduledTime;
  }

  get isSnoozed(): boolean {
    return this._snoozedUntil ? new Date() < this._snoozedUntil : false;
  }

  get shouldTrigger(): boolean {
    if (this._status !== 'pending') {
      return false;
    }
    if (this.isSnoozed) {
      return false;
    }
    return new Date() >= this._scheduledTime;
  }

  get timeUntilScheduled(): number {
    return this._scheduledTime.getTime() - Date.now();
  }

  // ===== 序列化方法 =====

  toDTO(): ReminderContracts.IReminderInstance {
    return {
      uuid: this._uuid,
      templateUuid: this._templateUuid,
      title: this._title,
      message: this._message,
      scheduledTime: this._scheduledTime,
      triggeredTime: this._triggeredTime,
      acknowledgedTime: this._acknowledgedTime,
      dismissedTime: this._dismissedTime,
      snoozedUntil: this._snoozedUntil,
      status: this._status,
      priority: this._priority,
      metadata: this._metadata,
      snoozeHistory: this._snoozeHistory,
      currentSnoozeCount: this._currentSnoozeCount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this._version,
    };
  }

  static fromDTO(dto: ReminderContracts.IReminderInstance): ReminderInstance {
    return new ReminderInstance({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      title: dto.title,
      message: dto.message,
      scheduledTime: dto.scheduledTime,
      triggeredTime: dto.triggeredTime,
      acknowledgedTime: dto.acknowledgedTime,
      dismissedTime: dto.dismissedTime,
      snoozedUntil: dto.snoozedUntil,
      status: dto.status,
      priority: dto.priority,
      metadata: dto.metadata,
      snoozeHistory: dto.snoozeHistory || [],
      currentSnoozeCount: dto.currentSnoozeCount,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      version: dto.version,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  clone(): ReminderInstance {
    return ReminderInstance.fromDTO(this.toDTO());
  }

  // ===== Getters =====

  get uuid(): string {
    return this._uuid;
  }

  get templateUuid(): string {
    return this._templateUuid;
  }

  get title(): string | undefined {
    return this._title;
  }

  get message(): string {
    return this._message;
  }

  get scheduledTime(): Date {
    return this._scheduledTime;
  }

  get triggeredTime(): Date | undefined {
    return this._triggeredTime;
  }

  get acknowledgedTime(): Date | undefined {
    return this._acknowledgedTime;
  }

  get dismissedTime(): Date | undefined {
    return this._dismissedTime;
  }

  get snoozedUntil(): Date | undefined {
    return this._snoozedUntil;
  }

  get status(): ReminderContracts.ReminderStatus {
    return this._status;
  }

  get priority(): ReminderContracts.ReminderPriority {
    return this._priority;
  }

  get metadata(): typeof this._metadata {
    return this._metadata;
  }

  get snoozeHistory(): typeof this._snoozeHistory {
    return this._snoozeHistory;
  }

  get currentSnoozeCount(): number {
    return this._currentSnoozeCount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get version(): number {
    return this._version;
  }
}
