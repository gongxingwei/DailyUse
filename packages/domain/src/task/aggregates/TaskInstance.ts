import { AggregateRoot } from '@dailyuse/utils';
import {
  ITaskInstance,
  TaskStatus,
  TaskInstanceTimeConfig,
  TaskInstanceReminderStatus,
  TaskInstanceLifecycleEvent,
  KeyResultLink,
  ImportanceLevel,
  UrgencyLevel,
} from '../types';

/**
 * TaskInstance 聚合根
 * 管理具体任务实例的执行和状态
 */
export class TaskInstance extends AggregateRoot implements ITaskInstance {
  private _templateUuid: string;
  private _title: string;
  private _description?: string;
  private _timeConfig: TaskInstanceTimeConfig;
  private _reminderStatus: TaskInstanceReminderStatus;
  private _status: TaskStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _startedAt?: Date;
  private _completedAt?: Date;
  private _cancelledAt?: Date;
  private _events: TaskInstanceLifecycleEvent[];
  private _metadata: {
    estimatedDuration?: number;
    actualDuration?: number;
    category: string;
    tags: string[];
    location?: string;
    urgency: UrgencyLevel;
    importance: ImportanceLevel;
  };
  private _keyResultLinks?: KeyResultLink[];
  private _version: number;

  constructor(params: {
    uuid?: string;
    templateUuid: string;
    title: string;
    description?: string;
    timeConfig: TaskInstanceTimeConfig;
    reminderStatus: TaskInstanceReminderStatus;
    status?: TaskStatus;
    metadata: {
      estimatedDuration?: number;
      actualDuration?: number;
      category: string;
      tags: string[];
      location?: string;
      urgency: UrgencyLevel;
      importance: ImportanceLevel;
    };
    keyResultLinks?: KeyResultLink[];
    version?: number;
  }) {
    super(params.uuid);
    this._templateUuid = params.templateUuid;
    this._title = params.title;
    this._description = params.description;
    this._timeConfig = params.timeConfig;
    this._reminderStatus = params.reminderStatus;
    this._status = params.status || TaskStatus.PENDING;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._events = [];
    this._metadata = params.metadata;
    this._keyResultLinks = params.keyResultLinks;
    this._version = params.version || 1;
  }

  // Getters
  get templateUuid(): string {
    return this._templateUuid;
  }
  get title(): string {
    return this._title;
  }
  get description(): string | undefined {
    return this._description;
  }
  get timeConfig(): TaskInstanceTimeConfig {
    return { ...this._timeConfig };
  }
  get reminderStatus(): TaskInstanceReminderStatus {
    return { ...this._reminderStatus };
  }
  get lifecycle() {
    return {
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      cancelledAt: this._cancelledAt,
      events: [...this._events],
    };
  }
  get metadata() {
    return { ...this._metadata };
  }
  get keyResultLinks(): KeyResultLink[] | undefined {
    return this._keyResultLinks ? [...this._keyResultLinks] : undefined;
  }
  get version(): number {
    return this._version;
  }

  // Business Methods
  get isPending(): boolean {
    return this._status === TaskStatus.PENDING;
  }

  get isInProgress(): boolean {
    return this._status === TaskStatus.IN_PROGRESS;
  }

  get isCompleted(): boolean {
    return this._status === TaskStatus.COMPLETED;
  }

  get isCancelled(): boolean {
    return this._status === TaskStatus.CANCELLED;
  }

  get isOverdue(): boolean {
    return (
      this._status === TaskStatus.OVERDUE ||
      (this._status === TaskStatus.PENDING && new Date() > this._timeConfig.scheduledTime)
    );
  }

  get actualDuration(): number | undefined {
    if (this._startedAt && this._completedAt) {
      return this._completedAt.getTime() - this._startedAt.getTime();
    }
    return this._metadata.actualDuration;
  }

  start(): void {
    if (this._status !== TaskStatus.PENDING) {
      throw new Error('Only pending tasks can be started');
    }

    this._status = TaskStatus.IN_PROGRESS;
    this._startedAt = new Date();
    this._updatedAt = new Date();
    this._version++;

    this.addLifecycleEvent({
      type: 'task_started',
      timestamp: new Date(),
    });
  }

  complete(): void {
    if (this._status !== TaskStatus.IN_PROGRESS && this._status !== TaskStatus.PENDING) {
      throw new Error('Only pending or in-progress tasks can be completed');
    }

    const now = new Date();
    this._status = TaskStatus.COMPLETED;
    this._completedAt = now;
    this._updatedAt = now;

    // Calculate actual duration
    if (this._startedAt) {
      this._metadata.actualDuration = now.getTime() - this._startedAt.getTime();
    }

    this._version++;

    this.addLifecycleEvent({
      type: 'task_completed',
      timestamp: now,
    });
  }

  cancel(): void {
    if (this._status === TaskStatus.COMPLETED || this._status === TaskStatus.CANCELLED) {
      throw new Error('Cannot cancel completed or already cancelled tasks');
    }

    this._status = TaskStatus.CANCELLED;
    this._cancelledAt = new Date();
    this._updatedAt = new Date();
    this._version++;

    this.addLifecycleEvent({
      type: 'task_cancelled',
      timestamp: new Date(),
    });
  }

  undo(): void {
    if (this._status !== TaskStatus.COMPLETED) {
      throw new Error('Only completed tasks can be undone');
    }

    this._status = TaskStatus.PENDING;
    this._completedAt = undefined;
    this._startedAt = undefined;
    this._metadata.actualDuration = undefined;
    this._updatedAt = new Date();
    this._version++;

    this.addLifecycleEvent({
      type: 'task_undo',
      timestamp: new Date(),
    });
  }

  reschedule(newScheduledTime: Date, reason?: string): void {
    if (!this._timeConfig.allowReschedule) {
      throw new Error('This task cannot be rescheduled');
    }

    if (this._status === TaskStatus.COMPLETED || this._status === TaskStatus.CANCELLED) {
      throw new Error('Cannot reschedule completed or cancelled tasks');
    }

    const maxDelayDate = new Date(this._timeConfig.scheduledTime);
    if (this._timeConfig.maxDelayDays) {
      maxDelayDate.setDate(maxDelayDate.getDate() + this._timeConfig.maxDelayDays);
    }

    if (newScheduledTime > maxDelayDate) {
      throw new Error(
        `Cannot reschedule beyond ${this._timeConfig.maxDelayDays} days from original time`,
      );
    }

    this._timeConfig.scheduledTime = newScheduledTime;
    this._updatedAt = new Date();
    this._version++;

    this.addLifecycleEvent({
      type: 'task_rescheduled',
      timestamp: new Date(),
      details: {
        newScheduledTime: newScheduledTime.toISOString(),
        reason,
      },
    });
  }

  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    this._title = title.trim();
    this._updatedAt = new Date();
    this._version++;

    this.addLifecycleEvent({
      type: 'task_title_updated',
      timestamp: new Date(),
      details: { newTitle: title },
    });
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
    this._version++;
  }

  markAsOverdue(): void {
    if (this._status === TaskStatus.PENDING) {
      this._status = TaskStatus.OVERDUE;
      this._updatedAt = new Date();
      this._version++;

      this.addLifecycleEvent({
        type: 'task_overdue',
        timestamp: new Date(),
      });
    }
  }

  triggerReminder(alertId: string): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (!alert) {
      throw new Error('Reminder alert not found');
    }

    if (alert.status !== 'pending') {
      throw new Error('Only pending reminders can be triggered');
    }

    alert.status = 'triggered';
    alert.triggeredAt = new Date();
    this._reminderStatus.lastTriggeredAt = new Date();
    this._updatedAt = new Date();

    this.addLifecycleEvent({
      type: 'reminder_triggered',
      timestamp: new Date(),
      alertId,
    });
  }

  dismissReminder(alertId: string): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (!alert) {
      throw new Error('Reminder alert not found');
    }

    alert.status = 'dismissed';
    alert.dismissedAt = new Date();
    this._updatedAt = new Date();

    this.addLifecycleEvent({
      type: 'reminder_dismissed',
      timestamp: new Date(),
      alertId,
    });
  }

  snoozeReminder(alertId: string, snoozeUntil: Date, reason?: string): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (!alert) {
      throw new Error('Reminder alert not found');
    }

    if (!this._reminderStatus.enabled) {
      throw new Error('Reminders are disabled for this task');
    }

    const maxSnoozeCount =
      this._reminderStatus.alerts[0]?.alertConfig.type === 'notification' ? 3 : 5;
    if (this._reminderStatus.globalSnoozeCount >= maxSnoozeCount) {
      throw new Error('Maximum snooze count reached');
    }

    alert.status = 'snoozed';
    alert.snoozeHistory.push({
      snoozedAt: new Date(),
      snoozeUntil,
      reason,
    });

    this._reminderStatus.globalSnoozeCount++;
    this._updatedAt = new Date();

    this.addLifecycleEvent({
      type: 'reminder_snoozed',
      timestamp: new Date(),
      alertId,
      details: { snoozeUntil: snoozeUntil.toISOString(), reason },
    });
  }

  private addLifecycleEvent(event: TaskInstanceLifecycleEvent): void {
    this._events.push(event);

    // Keep only last 50 events to prevent excessive memory usage
    if (this._events.length > 50) {
      this._events = this._events.slice(-50);
    }
  }

  static create(params: {
    templateUuid: string;
    title: string;
    description?: string;
    timeConfig: TaskInstanceTimeConfig;
    reminderStatus: TaskInstanceReminderStatus;
    metadata: {
      estimatedDuration?: number;
      category: string;
      tags: string[];
      location?: string;
      urgency: UrgencyLevel;
      importance: ImportanceLevel;
    };
    keyResultLinks?: KeyResultLink[];
  }): TaskInstance {
    return new TaskInstance(params);
  }
}
