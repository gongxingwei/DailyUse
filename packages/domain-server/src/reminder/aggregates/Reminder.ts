import { ReminderCore, ReminderType, RecurrenceType, ReminderStatus } from '@dailyuse/domain-core';

/**
 * 服务端提醒 - 包含完整的业务逻辑
 * 调度管理、通知发送等敏感操作
 */
export class Reminder extends ReminderCore {
  private _nextReminderTime?: Date;
  private _scheduleJobId?: string;
  private _failedAttempts: number;

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
    nextReminderTime?: Date;
    scheduleJobId?: string;
    failedAttempts?: number;
  }) {
    super(params);
    this._nextReminderTime = params.nextReminderTime;
    this._scheduleJobId = params.scheduleJobId;
    this._failedAttempts = params.failedAttempts || 0;

    // 验证业务规则
    this.validateBusinessRules();
  }

  // ===== 服务端专用业务方法 =====
  async scheduleNotification(): Promise<void> {
    if (!this.isActive) {
      throw new Error('Cannot schedule inactive reminder');
    }

    if (this.isSnoozed) {
      throw new Error('Cannot schedule snoozed reminder');
    }

    // 生成调度作业ID
    this._scheduleJobId = this.generateScheduleJobId();
    this._updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'ReminderScheduled',
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuid,
        reminderTime: this._reminderTime,
        scheduleJobId: this._scheduleJobId,
      },
    });
  }

  async sendNotification(): Promise<{
    success: boolean;
    shouldRetry: boolean;
  }> {
    if (!this.shouldTrigger) {
      return { success: false, shouldRetry: false };
    }

    try {
      // 标记通知已发送
      this._notificationSent = true;
      this._updatedAt = new Date();

      // 触发领域事件
      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: 'NotificationSent',
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuid,
          title: this._title,
          type: this._type,
          targetId: this._targetId,
        },
      });

      // 处理循环提醒
      if (this._isRecurring) {
        await this.scheduleNextRecurrence();
      } else {
        this.markAsCompleted();
      }

      return { success: true, shouldRetry: false };
    } catch (error) {
      this._failedAttempts++;
      this._updatedAt = new Date();

      return {
        success: false,
        shouldRetry: this._failedAttempts < 3,
      };
    }
  }

  async scheduleNextRecurrence(): Promise<void> {
    if (!this._isRecurring) {
      throw new Error('Cannot schedule next recurrence for non-recurring reminder');
    }

    const nextTime = this.calculateNextReminderTime();
    if (!nextTime) {
      // 没有下一次循环，标记为完成
      this.markAsCompleted();
      return;
    }

    this._nextReminderTime = nextTime;
    this._reminderTime = nextTime;
    this._notificationSent = false;
    this._failedAttempts = 0;
    this._updatedAt = new Date();

    // 重新调度
    await this.scheduleNotification();
  }

  snooze(minutes: number): void {
    if (!this.isActive) {
      throw new Error('Cannot snooze inactive reminder');
    }

    if (minutes <= 0 || minutes > 1440) {
      // 最多24小时
      throw new Error('Snooze time must be between 1 and 1440 minutes');
    }

    this.snoozeReminder(minutes);
    this.resetNotificationSent();

    // 触发领域事件
    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'ReminderSnoozed',
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuid,
        snoozeUntil: this._snoozeUntil,
        minutes,
      },
    });
  }

  complete(): void {
    if (this._isCompleted) {
      throw new Error('Reminder is already completed');
    }

    this.markAsCompleted();

    // 取消调度作业
    if (this._scheduleJobId) {
      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: 'ReminderCancelled',
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuid,
          scheduleJobId: this._scheduleJobId,
        },
      });
    }

    // 触发完成事件
    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'ReminderCompleted',
      occurredOn: new Date(),
      payload: {
        accountUuid: this._accountUuid,
        completedAt: this._completedAt,
      },
    });
  }

  pause(): void {
    if (this._status === ReminderStatus.PAUSED) {
      throw new Error('Reminder is already paused');
    }

    this._status = ReminderStatus.PAUSED;
    this._updatedAt = new Date();

    // 取消调度作业
    if (this._scheduleJobId) {
      this.addDomainEvent({
        aggregateId: this.uuid,
        eventType: 'ReminderCancelled',
        occurredOn: new Date(),
        payload: {
          accountUuid: this._accountUuid,
          scheduleJobId: this._scheduleJobId,
        },
      });
    }
  }

  resume(): void {
    if (this._status !== ReminderStatus.PAUSED) {
      throw new Error('Can only resume paused reminders');
    }

    this._status = ReminderStatus.ACTIVE;
    this._updatedAt = new Date();

    // 重新调度
    this.scheduleNotification();
  }

  updateReminderTime(newTime: Date): void {
    this.validateReminderTime(newTime);

    this._reminderTime = newTime;
    this._notificationSent = false;
    this._updatedAt = new Date();

    // 重新调度
    if (this.isActive) {
      this.scheduleNotification();
    }
  }

  updateDetails(params: {
    title?: string;
    description?: string;
    recurrenceType?: RecurrenceType;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date;
  }): void {
    if (params.title !== undefined) {
      this._title = params.title;
    }
    if (params.description !== undefined) {
      this._description = params.description;
    }
    if (params.recurrenceType !== undefined) {
      this._recurrenceType = params.recurrenceType;
    }
    if (params.recurrenceInterval !== undefined) {
      this._recurrenceInterval = params.recurrenceInterval;
    }
    if (params.recurrenceEndDate !== undefined) {
      this._recurrenceEndDate = params.recurrenceEndDate;
    }

    this._updatedAt = new Date();
    this.validateBusinessRules();
  }

  // ===== 私有辅助方法 =====
  private generateScheduleJobId(): string {
    return `reminder_${this.uuid}_${Date.now()}`;
  }

  private validateBusinessRules(): void {
    this.validateRecurrence();

    if (this._type === ReminderType.TASK && !this._targetId) {
      throw new Error('Task reminder must have a target task ID');
    }

    if (this._type === ReminderType.GOAL && !this._targetId) {
      throw new Error('Goal reminder must have a target goal ID');
    }
  }

  // ===== Getters =====
  get nextReminderTime(): Date | undefined {
    return this._nextReminderTime;
  }

  get scheduleJobId(): string | undefined {
    return this._scheduleJobId;
  }

  get failedAttempts(): number {
    return this._failedAttempts;
  }

  // ===== 工厂方法 =====
  static create(params: {
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
  }): Reminder {
    return new Reminder(params);
  }

  static fromPersistence(params: {
    uuid: string;
    accountUuid: string;
    title: string;
    description?: string;
    type: ReminderType;
    targetId?: string;
    reminderTime: Date;
    isRecurring: boolean;
    recurrenceType: RecurrenceType;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date;
    status: ReminderStatus;
    isCompleted: boolean;
    completedAt?: Date;
    snoozeUntil?: Date;
    notificationSent: boolean;
    createdAt: Date;
    updatedAt: Date;
    nextReminderTime?: Date;
    scheduleJobId?: string;
    failedAttempts: number;
  }): Reminder {
    return new Reminder(params);
  }
}
