import { AggregateRoot } from '@dailyuse/utils';
import { TaskTimeConfig } from '../valueObjects/TaskTimeConfig';
import { TaskReminderConfig } from '../valueObjects/TaskReminderConfig';
import {
  ITaskTemplate,
  SchedulingPolicy,
  TaskMetadata,
  TaskAnalytics,
  KeyResultLink,
} from '../types';

/**
 * TaskTemplate 聚合根
 * 管理任务模板的完整生命周期和业务规则
 */
export class TaskTemplate extends AggregateRoot implements ITaskTemplate {
  private _title: string;
  private _description?: string;
  private _timeConfig: TaskTimeConfig;
  private _reminderConfig: TaskReminderConfig;
  private _schedulingPolicy: SchedulingPolicy;
  private _metadata: TaskMetadata;
  private _status: 'draft' | 'active' | 'paused' | 'archived';
  private _createdAt: Date;
  private _updatedAt: Date;
  private _activatedAt?: Date;
  private _pausedAt?: Date;
  private _analytics: TaskAnalytics;
  private _keyResultLinks?: KeyResultLink[];
  private _version: number;

  constructor(params: {
    uuid?: string;
    title: string;
    description?: string;
    timeConfig: TaskTimeConfig;
    reminderConfig: TaskReminderConfig;
    schedulingPolicy: SchedulingPolicy;
    metadata: TaskMetadata;
    status?: 'draft' | 'active' | 'paused' | 'archived';
    analytics?: TaskAnalytics;
    keyResultLinks?: KeyResultLink[];
    version?: number;
  }) {
    super(params.uuid);
    this._title = params.title;
    this._description = params.description;
    this._timeConfig = params.timeConfig;
    this._reminderConfig = params.reminderConfig;
    this._schedulingPolicy = params.schedulingPolicy;
    this._metadata = params.metadata;
    this._status = params.status || 'draft';
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._analytics = params.analytics || {
      totalInstances: 0,
      completedInstances: 0,
      successRate: 0,
    };
    this._keyResultLinks = params.keyResultLinks;
    this._version = params.version || 1;
  }

  // Getters
  get title(): string {
    return this._title;
  }
  get description(): string | undefined {
    return this._description;
  }
  get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }
  get reminderConfig(): TaskReminderConfig {
    return this._reminderConfig;
  }
  get schedulingPolicy(): SchedulingPolicy {
    return { ...this._schedulingPolicy };
  }
  get metadata(): TaskMetadata {
    return { ...this._metadata };
  }
  get lifecycle() {
    return {
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      activatedAt: this._activatedAt,
      pausedAt: this._pausedAt,
    };
  }
  get analytics(): TaskAnalytics {
    return { ...this._analytics };
  }
  get keyResultLinks(): KeyResultLink[] | undefined {
    return this._keyResultLinks ? [...this._keyResultLinks] : undefined;
  }
  get version(): number {
    return this._version;
  }

  // Business Methods
  get isActive(): boolean {
    return this._status === 'active';
  }

  get isDraft(): boolean {
    return this._status === 'draft';
  }

  get isPaused(): boolean {
    return this._status === 'paused';
  }

  get isArchived(): boolean {
    return this._status === 'archived';
  }

  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    this._title = title.trim();
    this._updatedAt = new Date();
    this._version++;
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
    this._version++;
  }

  updateTimeConfig(timeConfig: TaskTimeConfig): void {
    this._timeConfig = timeConfig;
    this._updatedAt = new Date();
    this._version++;
  }

  updateReminderConfig(reminderConfig: TaskReminderConfig): void {
    this._reminderConfig = reminderConfig;
    this._updatedAt = new Date();
    this._version++;
  }

  updateSchedulingPolicy(policy: Partial<SchedulingPolicy>): void {
    this._schedulingPolicy = { ...this._schedulingPolicy, ...policy };
    this._updatedAt = new Date();
    this._version++;
  }

  updateMetadata(metadata: Partial<TaskMetadata>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._updatedAt = new Date();
    this._version++;
  }

  addTag(tag: string): void {
    if (!this._metadata.tags.includes(tag)) {
      this._metadata.tags.push(tag);
      this._updatedAt = new Date();
      this._version++;
    }
  }

  removeTag(tag: string): void {
    const index = this._metadata.tags.indexOf(tag);
    if (index > -1) {
      this._metadata.tags.splice(index, 1);
      this._updatedAt = new Date();
      this._version++;
    }
  }

  setKeyResultLinks(links: KeyResultLink[]): void {
    this._keyResultLinks = [...links];
    this._updatedAt = new Date();
    this._version++;
  }

  clearKeyResultLinks(): void {
    this._keyResultLinks = undefined;
    this._updatedAt = new Date();
    this._version++;
  }

  activate(): void {
    if (this._status === 'active') {
      throw new Error('Template is already active');
    }

    this._status = 'active';
    this._activatedAt = new Date();
    this._updatedAt = new Date();
    this._version++;
  }

  pause(): void {
    if (this._status !== 'active') {
      throw new Error('Only active templates can be paused');
    }

    this._status = 'paused';
    this._pausedAt = new Date();
    this._updatedAt = new Date();
    this._version++;
  }

  resume(): void {
    if (this._status !== 'paused') {
      throw new Error('Only paused templates can be resumed');
    }

    this._status = 'active';
    this._pausedAt = undefined;
    this._updatedAt = new Date();
    this._version++;
  }

  archive(): void {
    this._status = 'archived';
    this._updatedAt = new Date();
    this._version++;
  }

  updateAnalytics(analytics: Partial<TaskAnalytics>): void {
    this._analytics = { ...this._analytics, ...analytics };
    this._updatedAt = new Date();
  }

  recordInstanceCreated(): void {
    this._analytics.totalInstances++;
    this._analytics.lastInstanceDate = new Date();
    this.updateSuccessRate();
    this._updatedAt = new Date();
  }

  recordInstanceCompleted(completionTime?: number): void {
    this._analytics.completedInstances++;

    if (completionTime !== undefined) {
      const currentAverage = this._analytics.averageCompletionTime || 0;
      const completedCount = this._analytics.completedInstances;
      this._analytics.averageCompletionTime =
        (currentAverage * (completedCount - 1) + completionTime) / completedCount;
    }

    this.updateSuccessRate();
    this._updatedAt = new Date();
  }

  private updateSuccessRate(): void {
    if (this._analytics.totalInstances === 0) {
      this._analytics.successRate = 0;
    } else {
      this._analytics.successRate =
        this._analytics.completedInstances / this._analytics.totalInstances;
    }
  }

  static create(params: {
    title: string;
    description?: string;
    timeConfig: TaskTimeConfig;
    reminderConfig?: TaskReminderConfig;
    schedulingPolicy?: SchedulingPolicy;
    metadata: TaskMetadata;
    keyResultLinks?: KeyResultLink[];
  }): TaskTemplate {
    const defaultSchedulingPolicy: SchedulingPolicy = {
      allowReschedule: true,
      maxDelayDays: 7,
      skipWeekends: false,
      skipHolidays: false,
      workingHoursOnly: false,
    };

    return new TaskTemplate({
      title: params.title,
      description: params.description,
      timeConfig: params.timeConfig,
      reminderConfig: params.reminderConfig || TaskReminderConfig.createDefault(),
      schedulingPolicy: params.schedulingPolicy || defaultSchedulingPolicy,
      metadata: params.metadata,
      keyResultLinks: params.keyResultLinks,
    });
  }
}
