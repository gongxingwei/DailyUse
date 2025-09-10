import { AggregateRoot } from '@dailyuse/utils';

import { type ITaskTemplate, type TaskContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

/**
 * 任务模板核心基类 - 包含共享属性和基础计算
 */
export abstract class TaskTemplateCore extends AggregateRoot implements ITaskTemplate {
  protected _accountUuid: string;
  protected _title: string;
  protected _description?: string;
  protected _timeConfig: {
    time: {
      timeType: TaskContracts.TaskTimeType;
      startTime?: string;
      endTime?: string;
    };
    date: {
      startDate: Date;
      endDate?: Date;
    };
    schedule: {
      mode: TaskContracts.TaskScheduleMode;
      intervalDays?: number;
      weekdays?: number[];
      monthDays?: number[];
    };
    timezone: string;
  };
  protected _reminderConfig: {
    enabled: boolean;
    minutesBefore: number;
    methods: ('notification' | 'sound')[];
  };
  protected _properties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    location?: string;
    tags: string[];
  };
  protected _lifecycle: {
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    createdAt: Date;
    updatedAt: Date;
  };
  protected _stats: {
    totalInstances: number;
    completedInstances: number;
    completionRate: number;
    lastInstanceDate?: Date;
  };
  protected _goalLinks?: TaskContracts.KeyResultLink[];

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string;
    timeConfig: {
      time: {
        timeType: TaskContracts.TaskTimeType;
        startTime?: string;
        endTime?: string;
      };
      date: {
        startDate: Date;
        endDate?: Date;
      };
      schedule: {
        mode: TaskContracts.TaskScheduleMode;
        intervalDays?: number;
        weekdays?: number[];
        monthDays?: number[];
      };
      timezone: string;
    };
    reminderConfig?: {
      enabled: boolean;
      minutesBefore: number;
      methods: ('notification' | 'sound')[];
    };
    properties?: {
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      location?: string;
      tags: string[];
    };
    goalLinks?: TaskContracts.KeyResultLink[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._timeConfig = params.timeConfig;
    this._reminderConfig = params.reminderConfig || {
      enabled: false,
      minutesBefore: 15,
      methods: ['notification'],
    };
    this._properties = params.properties || {
      importance: ImportanceLevel.Moderate,
      urgency: UrgencyLevel.Medium,
      tags: [],
    };
    this._lifecycle = {
      status: 'draft',
      createdAt: params.createdAt || new Date(),
      updatedAt: params.updatedAt || new Date(),
    };
    this._stats = {
      totalInstances: 0,
      completedInstances: 0,
      completionRate: 0,
    };
    this._goalLinks = params.goalLinks;
  }

  // ===== 共享只读属性 =====
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
  get reminderConfig() {
    return { ...this._reminderConfig };
  }
  get properties() {
    return { ...this._properties };
  }
  get lifecycle() {
    return { ...this._lifecycle };
  }
  get stats() {
    return { ...this._stats };
  }
  get goalLinks(): TaskContracts.KeyResultLink[] | undefined {
    return this._goalLinks ? [...this._goalLinks] : undefined;
  }

  // ===== 共享计算属性 =====
  get isDraft(): boolean {
    return this._lifecycle.status === 'draft';
  }

  get isActive(): boolean {
    return this._lifecycle.status === 'active';
  }

  get isPaused(): boolean {
    return this._lifecycle.status === 'paused';
  }

  get isCompleted(): boolean {
    return this._lifecycle.status === 'completed';
  }

  get isArchived(): boolean {
    return this._lifecycle.status === 'archived';
  }

  get hasReminder(): boolean {
    return this._reminderConfig.enabled;
  }

  get isRecurring(): boolean {
    return this._timeConfig.schedule.mode !== 'once';
  }

  get hasEndDate(): boolean {
    return Boolean(this._timeConfig.date.endDate);
  }

  get hasTags(): boolean {
    return this._properties.tags.length > 0;
  }

  get isLinkedToGoal(): boolean {
    return Boolean(this._goalLinks && this._goalLinks.length > 0);
  }

  get hasInstances(): boolean {
    return this._stats.totalInstances > 0;
  }

  get completionRate(): number {
    return this._stats.completionRate;
  }

  // ===== 共享验证方法 =====
  protected validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('任务标题不能为空');
    }
    if (title.length > 200) {
      throw new Error('任务标题不能超过200个字符');
    }
  }

  protected validateTimeConfig(timeConfig: any): void {
    if (!timeConfig.time.timeType) {
      throw new Error('必须指定时间类型');
    }
    if (!timeConfig.schedule.mode) {
      throw new Error('必须指定调度模式');
    }
    if (!timeConfig.timezone) {
      throw new Error('必须指定时区');
    }
  }

  protected validateReminderConfig(reminderConfig: any): void {
    if (reminderConfig.enabled && reminderConfig.minutesBefore < 0) {
      throw new Error('提醒时间不能为负数');
    }
  }

  // ===== 共享辅助方法 =====
  hasTag(tag: string): boolean {
    return this._properties.tags.includes(tag);
  }

  hasAnyTag(tags: string[]): boolean {
    return tags.some((tag) => this._properties.tags.includes(tag));
  }

  hasAllTags(tags: string[]): boolean {
    return tags.every((tag) => this._properties.tags.includes(tag));
  }

  // ===== 共享更新方法 =====
  protected updateVersion(): void {
    this._lifecycle.updatedAt = new Date();
  }

  protected updateStats(totalInstances: number, completedInstances: number): void {
    this._stats.totalInstances = totalInstances;
    this._stats.completedInstances = completedInstances;
    this._stats.completionRate =
      totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;
    this._stats.lastInstanceDate = new Date();
  }

  // ===== 抽象方法（由子类实现）=====
  abstract activate(): void;
  abstract pause(): void;
  abstract complete(): void;
  abstract archive(): void;
  abstract updateTitle(newTitle: string): void;
  abstract updateTimeConfig(newTimeConfig: any): void;
  abstract updateReminderConfig(newReminderConfig: any): void;
  abstract addTag(tag: string): void;
  abstract removeTag(tag: string): void;
}
