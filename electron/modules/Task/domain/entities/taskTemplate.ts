import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { DateTime } from '@/shared/types/myDateTime';
import type { 
  TaskTimeConfig, 
  TaskReminderConfig,
  KeyResultLink,
  ITaskTemplate,
} from "@/modules/Task/domain/types/task";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";

export class TaskTemplate extends AggregateRoot implements ITaskTemplate {
  private _title: string;
  private _description?: string;
  private _timeConfig: TaskTimeConfig;
  private _reminderConfig: TaskReminderConfig;
  private _schedulingPolicy: {
    allowReschedule: boolean;
    maxDelayDays: number;
    skipWeekends: boolean;
    skipHolidays: boolean;
    workingHoursOnly: boolean;
  };
  private _metadata: {
    category: string;
    tags: string[];
    estimatedDuration?: number;
    priority?: 1 | 2 | 3 | 4 | 5;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    location?: string;
  };
  private _lifecycle: {
    status: "draft" | "active" | "paused" | "archived";
    createdAt: DateTime;
    updatedAt: DateTime;
    activatedAt?: DateTime;
    pausedAt?: DateTime;
  };
  private _analytics: {
    totalInstances: number;
    completedInstances: number;
    averageCompletionTime?: number;
    successRate: number;
    lastInstanceDate?: DateTime;
  };
  private _keyResultLinks?: KeyResultLink[];
  private _version: number;

  constructor(
    id: string,
    title: string,
    timeConfig: TaskTimeConfig,
    reminderConfig: TaskReminderConfig,
    options?: {
      description?: string;
      keyResultLinks?: KeyResultLink[];
      category?: string;
      tags?: string[];
      priority?: 1 | 2 | 3 | 4 | 5;
      difficulty?: 1 | 2 | 3 | 4 | 5;
      estimatedDuration?: number;
      location?: string;
      schedulingPolicy?: {
        allowReschedule?: boolean;
        maxDelayDays?: number;
        skipWeekends?: boolean;
        skipHolidays?: boolean;
        workingHoursOnly?: boolean;
      };
    }
  ) {
    super(id);
    const now = TimeUtils.now();

    this._title = title;
    this._description = options?.description;
    this._timeConfig = timeConfig;
    this._reminderConfig = reminderConfig;

    this._schedulingPolicy = {
      allowReschedule: true,
      maxDelayDays: 7,
      skipWeekends: false,
      skipHolidays: false,
      workingHoursOnly: false,
      ...options?.schedulingPolicy,
    };

    this._metadata = {
      category: options?.category || "general",
      tags: options?.tags || [],
      priority: options?.priority || 3,
      difficulty: options?.difficulty || 3,
      estimatedDuration: options?.estimatedDuration,
      location: options?.location,
    };

    this._lifecycle = {
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    this._analytics = {
      totalInstances: 0,
      completedInstances: 0,
      successRate: 0,
    };

    this._keyResultLinks = options?.keyResultLinks;
    this._version = 1;
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

  get schedulingPolicy() {
    return this._schedulingPolicy;
  }

  get metadata() {
    return this._metadata;
  }

  get lifecycle() {
    return this._lifecycle;
  }

  get analytics() {
    return this._analytics;
  }

  get keyResultLinks(): KeyResultLink[] | undefined {
    return this._keyResultLinks;
  }

  get version(): number {
    return this._version;
  }

  // Methods
  updateTitle(title: string): void {
    this._title = title;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateTimeConfig(timeConfig: TaskTimeConfig): void {
    this._timeConfig = timeConfig;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateReminderConfig(reminderConfig: TaskReminderConfig): void {
    this._reminderConfig = reminderConfig;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateSchedulingPolicy(policy: Partial<typeof this._schedulingPolicy>): void {
    this._schedulingPolicy = { ...this._schedulingPolicy, ...policy };
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateMetadata(metadata: Partial<typeof this._metadata>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  setPriority(priority?: 1 | 2 | 3 | 4 | 5): void {
    this._metadata.priority = priority;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  addKeyResultLink(link: KeyResultLink): void {
    if (!this._keyResultLinks) {
      this._keyResultLinks = [];
    }
    this._keyResultLinks.push(link);
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  removeKeyResultLink(goalId: string, keyResultId: string): void {
    if (this._keyResultLinks) {
      this._keyResultLinks = this._keyResultLinks.filter(
        (link) => !(link.goalId === goalId && link.keyResultId === keyResultId)
      );
      this._lifecycle.updatedAt = TimeUtils.now();
    }
  }

  activate(): void {
    this._lifecycle.status = "active";
    this._lifecycle.activatedAt = TimeUtils.now();
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  pause(): void {
    this._lifecycle.status = "paused";
    this._lifecycle.pausedAt = TimeUtils.now();
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  archive(): void {
    this._lifecycle.status = "archived";
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  incrementAnalytics(completed: boolean, completionTime?: number): void {
    this._analytics.totalInstances++;
    if (completed) {
      this._analytics.completedInstances++;
      if (completionTime) {
        const currentAvg = this._analytics.averageCompletionTime || 0;
        const count = this._analytics.completedInstances;
        this._analytics.averageCompletionTime =
          (currentAvg * (count - 1) + completionTime) / count;
      }
    }
    this._analytics.successRate =
      this._analytics.totalInstances > 0
        ? this._analytics.completedInstances / this._analytics.totalInstances
        : 0;
    this._analytics.lastInstanceDate = TimeUtils.now();
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  addTag(tag: string): void {
    if (!this._metadata.tags.includes(tag)) {
      this._metadata.tags.push(tag);
      this._lifecycle.updatedAt = TimeUtils.now();
    }
  }

  removeTag(tag: string): void {
    this._metadata.tags = this._metadata.tags.filter((t) => t !== tag);
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  isActive(): boolean {
    return this._lifecycle.status === "active";
  }

  isDraft(): boolean {
    return this._lifecycle.status === "draft";
  }

  isPaused(): boolean {
    return this._lifecycle.status === "paused";
  }

  isArchived(): boolean {
    return this._lifecycle.status === "archived";
  }

  /**
   * 从完整数据创建 TaskTemplate 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromCompleteData(data: any): TaskTemplate {
    // 创建基础实例
    const instance = new TaskTemplate(
      data.id || data._id,
      data.title || data._title,
      data.timeConfig || data._timeConfig,
      data.reminderConfig || data._reminderConfig,
      {
        description: data.description || data._description,
        keyResultLinks: data.keyResultLinks || data._keyResultLinks,
        category: data.metadata?.category || data._metadata?.category,
        tags: data.metadata?.tags || data._metadata?.tags,
        priority: data.metadata?.priority || data._metadata?.priority,
        difficulty: data.metadata?.difficulty || data._metadata?.difficulty,
        estimatedDuration: data.metadata?.estimatedDuration || data._metadata?.estimatedDuration,
        location: data.metadata?.location || data._metadata?.location,
        schedulingPolicy: data.schedulingPolicy || data._schedulingPolicy,
      }
    );

    // 恢复完整的生命周期状态
    if (data.lifecycle || data._lifecycle) {
      const lifecycle = data.lifecycle || data._lifecycle;
      instance._lifecycle = {
        status: lifecycle.status || "draft",
        createdAt: lifecycle.createdAt || instance._lifecycle.createdAt,
        updatedAt: lifecycle.updatedAt || instance._lifecycle.updatedAt,
        activatedAt: lifecycle.activatedAt || undefined,
        pausedAt: lifecycle.pausedAt || undefined,
      };
    }

    // 恢复分析数据
    if (data.analytics || data._analytics) {
      const analytics = data.analytics || data._analytics;
      instance._analytics = {
        totalInstances: analytics.totalInstances || 0,
        completedInstances: analytics.completedInstances || 0,
        averageCompletionTime: analytics.averageCompletionTime,
        successRate: analytics.successRate || 0,
        lastInstanceDate: analytics.lastInstanceDate || undefined,
      };
    }

    // 恢复版本号
    if (data.version !== undefined || data._version !== undefined) {
      instance._version = data.version || data._version || 1;
    }

    // 恢复完整的元数据（如果有额外信息）
    if (data.metadata || data._metadata) {
      const metadata = data.metadata || data._metadata;
      instance._metadata = {
        ...instance._metadata,
        ...metadata,
      };
    }

    // 恢复调度策略
    if (data.schedulingPolicy || data._schedulingPolicy) {
      const policy = data.schedulingPolicy || data._schedulingPolicy;
      instance._schedulingPolicy = {
        ...instance._schedulingPolicy,
        ...policy,
      };
    }

    return instance;
  }

  /**
   * 从JSON数据创建 TaskTemplate 实例（标准反序列化方法）
   * 用于从序列化数据、持久化数据或IPC传输的数据恢复领域对象
   */
  static fromJSON(data: any): TaskTemplate {
    return TaskTemplate.fromCompleteData(data);
  }

  isTaskTemplate(): this is TaskTemplate {
    return this instanceof TaskTemplate;
  }
  /**
   * 克隆实例（用于创建副本）
   */
  clone(): TaskTemplate {
    return TaskTemplate.fromCompleteData(this.toJSON());
  }

  /**
   * 导出完整数据（用于序列化）
   */
  toJSON(): ITaskTemplate {
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      timeConfig: this._timeConfig,
      reminderConfig: this._reminderConfig,
      schedulingPolicy: this._schedulingPolicy,
      metadata: this._metadata,
      lifecycle: this._lifecycle,
      analytics: this._analytics,
      keyResultLinks: this._keyResultLinks,
      version: this._version,
    };
  }
}