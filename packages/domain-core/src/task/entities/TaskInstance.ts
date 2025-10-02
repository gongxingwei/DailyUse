import { Entity } from '@dailyuse/utils';
import { TaskContracts, sharedContracts } from '@dailyuse/contracts';

type ITaskInstance = TaskContracts.ITaskInstance;
type ImportanceLevel = sharedContracts.ImportanceLevel;
type UrgencyLevel = sharedContracts.UrgencyLevel;
const ImportanceLevelEnum = sharedContracts.ImportanceLevel;
const UrgencyLevelEnum = sharedContracts.UrgencyLevel;

/**
 * 任务实例核心基类
 */
export abstract class TaskInstanceCore extends Entity implements ITaskInstance {
  protected _templateUuid: string;
  protected _accountUuid: string;
  protected _title: string;
  protected _description?: string;
  protected _timeConfig: {
    timeType: TaskContracts.TaskTimeType;
    scheduledDate: Date;
    startTime?: string;
    endTime?: string;
    estimatedDuration?: number;
    timezone: string;
  };
  protected _reminderStatus: {
    enabled: boolean;
    status: 'pending' | 'triggered' | 'dismissed' | 'snoozed';
    scheduledTime?: Date;
    triggeredAt?: Date;
    snoozeCount: number;
    snoozeUntil?: Date;
  };
  protected _execution: {
    status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue';
    actualStartTime?: Date;
    actualEndTime?: Date;
    actualDuration?: number;
    progressPercentage: number;
    notes?: string;
  };
  protected _properties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    location?: string;
    tags: string[];
  };
  protected _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    events: Array<{
      type:
        | 'created'
        | 'started'
        | 'paused'
        | 'resumed'
        | 'completed'
        | 'cancelled'
        | 'rescheduled';
      timestamp: Date;
      note?: string;
    }>;
  };
  protected _goalLinks?: TaskContracts.KeyResultLink[];

  constructor(params: {
    uuid?: string;
    templateUuid: string;
    accountUuid: string;
    title: string;
    description?: string;
    timeConfig: {
      timeType: TaskContracts.TaskTimeType;
      scheduledDate: Date;
      startTime?: string;
      endTime?: string;
      estimatedDuration?: number;
      timezone: string;
    };
    properties?: {
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      location?: string;
      tags: string[];
    };
    goalLinks?: TaskContracts.KeyResultLink[];
    createdAt?: Date;
  }) {
    super(params.uuid || Entity.generateUUID());

    this._templateUuid = params.templateUuid;
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._timeConfig = params.timeConfig;
    this._reminderStatus = {
      enabled: false,
      status: 'pending',
      snoozeCount: 0,
    };
    this._execution = {
      status: 'pending',
      progressPercentage: 0,
    };
    this._properties = params.properties || {
      importance: ImportanceLevelEnum.Moderate,
      urgency: UrgencyLevelEnum.Medium,
      tags: [],
    };
    this._lifecycle = {
      createdAt: params.createdAt || new Date(),
      updatedAt: new Date(),
      events: [
        {
          type: 'created',
          timestamp: new Date(),
        },
      ],
    };
    this._goalLinks = params.goalLinks;
  }

  // ===== 共享只读属性 =====
  get templateUuid(): string {
    return this._templateUuid;
  }
  get accountUuid(): string {
    return this._accountUuid;
  }
  get title(): string {
    return this._title;
  }
  get description(): string | undefined {
    return this._description;
  }
  get timeConfig() {
    return { ...this._timeConfig };
  }
  get reminderStatus() {
    return { ...this._reminderStatus };
  }
  get execution() {
    return { ...this._execution };
  }
  get properties() {
    return { ...this._properties };
  }
  get lifecycle() {
    return { ...this._lifecycle };
  }
  get goalLinks(): TaskContracts.KeyResultLink[] | undefined {
    return this._goalLinks ? [...this._goalLinks] : undefined;
  }

  // ===== 共享计算属性 =====
  get isPending(): boolean {
    return this._execution.status === 'pending';
  }

  get isInProgress(): boolean {
    return this._execution.status === 'inProgress';
  }

  get isCompleted(): boolean {
    return this._execution.status === 'completed';
  }

  get isCancelled(): boolean {
    return this._execution.status === 'cancelled';
  }

  get isOverdue(): boolean {
    if (this.isCompleted || this.isCancelled) {
      return false;
    }
    const now = new Date();
    const scheduledDateTime = new Date(this._timeConfig.scheduledDate);

    if (this._timeConfig.startTime) {
      const [hours, minutes] = this._timeConfig.startTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
    }

    return now > scheduledDateTime;
  }

  get hasActualTime(): boolean {
    return Boolean(this._execution.actualStartTime && this._execution.actualEndTime);
  }

  get actualDurationMinutes(): number {
    if (!this.hasActualTime) return 0;
    return Math.floor(
      (this._execution.actualEndTime!.getTime() - this._execution.actualStartTime!.getTime()) /
        (1000 * 60),
    );
  }

  get isOnTime(): boolean {
    if (!this._timeConfig.estimatedDuration || !this._execution.actualDuration) {
      return true;
    }
    return this._execution.actualDuration <= this._timeConfig.estimatedDuration;
  }

  get hasReminder(): boolean {
    return this._reminderStatus.enabled;
  }

  get progressPercentage(): number {
    return this._execution.progressPercentage;
  }

  // ===== 共享辅助方法 =====
  protected addLifecycleEvent(
    type: 'created' | 'started' | 'paused' | 'resumed' | 'completed' | 'cancelled' | 'rescheduled',
    note?: string,
  ): void {
    this._lifecycle.events.push({
      type,
      timestamp: new Date(),
      note,
    });
    this.updateVersion();
  }

  protected updateVersion(): void {
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 抽象方法（由子类实现）=====
  abstract start(): void;
  abstract pause(): void;
  abstract resume(): void;
  abstract complete(): void;
  abstract cancel(): void;
  abstract reschedule(newDate: Date, newStartTime?: string, newEndTime?: string): void;
  abstract updateProgress(percentage: number, notes?: string): void;
}
