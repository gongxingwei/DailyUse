import { AggregateRoot } from '@dailyuse/utils';

export enum ReminderType {
  TASK = 'task',
  GOAL = 'goal',
  CUSTOM = 'custom',
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum ReminderStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * ReminderCore抽象基类
 * 包含共享的属性、计算和验证逻辑
 */
export abstract class ReminderCore extends AggregateRoot {
  protected _accountUuid: string;
  protected _title: string;
  protected _description?: string;
  protected _type: ReminderType;
  protected _targetId?: string; // 关联的任务或目标ID
  protected _reminderTime: Date;
  protected _isRecurring: boolean;
  protected _recurrenceType: RecurrenceType;
  protected _recurrenceInterval?: number;
  protected _recurrenceEndDate?: Date;
  protected _status: ReminderStatus;
  protected _isCompleted: boolean;
  protected _completedAt?: Date;
  protected _snoozeUntil?: Date;
  protected _notificationSent: boolean;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string;
    type: ReminderType;
    targetId?: string;
    reminderTime: Date;
    isRecurring?: boolean;
    recurrenceType?: RecurrenceType;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date;
    status?: ReminderStatus;
    isCompleted?: boolean;
    completedAt?: Date;
    snoozeUntil?: Date;
    notificationSent?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._type = params.type;
    this._targetId = params.targetId;
    this._reminderTime = params.reminderTime;
    this._isRecurring = params.isRecurring || false;
    this._recurrenceType = params.recurrenceType || RecurrenceType.NONE;
    this._recurrenceInterval = params.recurrenceInterval;
    this._recurrenceEndDate = params.recurrenceEndDate;
    this._status = params.status || ReminderStatus.ACTIVE;
    this._isCompleted = params.isCompleted || false;
    this._completedAt = params.completedAt;
    this._snoozeUntil = params.snoozeUntil;
    this._notificationSent = params.notificationSent || false;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
  }

  // ===== 共享计算逻辑 =====
  get isOverdue(): boolean {
    if (this._isCompleted || this._status !== ReminderStatus.ACTIVE) {
      return false;
    }
    return new Date() > this._reminderTime;
  }

  get isSnoozed(): boolean {
    return this._snoozeUntil ? new Date() < this._snoozeUntil : false;
  }

  get shouldTrigger(): boolean {
    if (this._isCompleted || this._status !== ReminderStatus.ACTIVE) {
      return false;
    }
    if (this.isSnoozed) {
      return false;
    }
    return new Date() >= this._reminderTime && !this._notificationSent;
  }

  get timeUntilReminder(): number {
    return this._reminderTime.getTime() - Date.now();
  }

  get isActive(): boolean {
    return this._status === ReminderStatus.ACTIVE && !this._isCompleted;
  }

  protected calculateNextReminderTime(): Date | null {
    if (!this._isRecurring || this._recurrenceType === RecurrenceType.NONE) {
      return null;
    }

    const current = new Date(this._reminderTime);
    const interval = this._recurrenceInterval || 1;

    switch (this._recurrenceType) {
      case RecurrenceType.DAILY:
        current.setDate(current.getDate() + interval);
        break;
      case RecurrenceType.WEEKLY:
        current.setDate(current.getDate() + 7 * interval);
        break;
      case RecurrenceType.MONTHLY:
        current.setMonth(current.getMonth() + interval);
        break;
      case RecurrenceType.YEARLY:
        current.setFullYear(current.getFullYear() + interval);
        break;
      default:
        return null;
    }

    // 检查是否超过结束日期
    if (this._recurrenceEndDate && current > this._recurrenceEndDate) {
      return null;
    }

    return current;
  }

  protected validateReminderTime(reminderTime: Date): void {
    if (reminderTime <= new Date()) {
      throw new Error('Reminder time must be in the future');
    }
  }

  protected validateRecurrence(): void {
    if (this._isRecurring) {
      if (this._recurrenceType === RecurrenceType.NONE) {
        throw new Error('Recurrence type must be specified for recurring reminders');
      }
      if (this._recurrenceType === RecurrenceType.CUSTOM && !this._recurrenceInterval) {
        throw new Error('Recurrence interval must be specified for custom recurrence');
      }
    }
  }

  // ===== 受保护的方法供子类使用 =====
  protected markAsCompleted(): void {
    this._isCompleted = true;
    this._completedAt = new Date();
    this._status = ReminderStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  protected snoozeReminder(minutes: number): void {
    this._snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    this._updatedAt = new Date();
  }

  protected resetNotificationSent(): void {
    this._notificationSent = false;
    this._updatedAt = new Date();
  }

  // ===== Getters =====
  get accountUuid(): string {
    return this._accountUuid;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get type(): ReminderType {
    return this._type;
  }

  get targetId(): string | undefined {
    return this._targetId;
  }

  get reminderTime(): Date {
    return this._reminderTime;
  }

  get isRecurring(): boolean {
    return this._isRecurring;
  }

  get recurrenceType(): RecurrenceType {
    return this._recurrenceType;
  }

  get recurrenceInterval(): number | undefined {
    return this._recurrenceInterval;
  }

  get recurrenceEndDate(): Date | undefined {
    return this._recurrenceEndDate;
  }

  get status(): ReminderStatus {
    return this._status;
  }

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get snoozeUntil(): Date | undefined {
    return this._snoozeUntil;
  }

  get notificationSent(): boolean {
    return this._notificationSent;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
