import { AggregateRoot } from "@common/shared/domain/aggregateRoot";
import type {
  TaskTimeConfig,
  TaskReminderConfig,
  KeyResultLink,
  ITaskTemplate,
  ITaskTemplateDTO,
} from "@common/modules/task/types/task";
import { ImportanceLevel } from "@common/shared/types/importance";
import { UrgencyLevel } from "@common/shared/types/urgency";

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
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    location?: string;
  };
  private _lifecycle: {
    status: "draft" | "active" | "paused" | "archived";
    createdAt: Date;
    updatedAt: Date;
    activatedAt?: Date;
    pausedAt?: Date;
  };
  private _analytics: {
    totalInstances: number;
    completedInstances: number;
    averageCompletionTime?: number;
    successRate: number;
    lastInstanceDate?: Date;
  };
  private _keyResultLinks?: KeyResultLink[];
  private _version: number;

  constructor(params: {
    uuid?: string;
    title: string;
    description?: string;
    timeConfig: TaskTimeConfig;
    reminderConfig: TaskReminderConfig;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    keyResultLinks?: KeyResultLink[];
    category?: string;
    tags?: string[];
    estimatedDuration?: number;
    location?: string;
    schedulingPolicy?: {
      allowReschedule?: boolean;
      maxDelayDays?: number;
      skipWeekends?: boolean;
      skipHolidays?: boolean;
      workingHoursOnly?: boolean;
    };
  }) {
    super(params.uuid || AggregateRoot.generateId());
    const now = new Date();

    this._title = params.title;
    this._description = params.description;
    this._timeConfig = params.timeConfig;
    this._reminderConfig = params.reminderConfig;

    this._schedulingPolicy = {
      allowReschedule: true,
      maxDelayDays: 7,
      skipWeekends: false,
      skipHolidays: false,
      workingHoursOnly: false,
      ...params.schedulingPolicy,
    };

    this._metadata = {
      category: params.category || "general",
      tags: params.tags || [],
      importance: params.importance || ImportanceLevel.Moderate,
      urgency: params.urgency || UrgencyLevel.Medium,
      estimatedDuration: params.estimatedDuration,
      location: params.location,
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

    this._keyResultLinks = params.keyResultLinks;
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
    this._lifecycle.updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._lifecycle.updatedAt = new Date();
  }

  updateTimeConfig(timeConfig: TaskTimeConfig): void {
    this._timeConfig = timeConfig;
    this._lifecycle.updatedAt = new Date();
  }

  updateReminderConfig(reminderConfig: TaskReminderConfig): void {
    this._reminderConfig = reminderConfig;
    this._lifecycle.updatedAt = new Date();
  }

  updateSchedulingPolicy(policy: Partial<typeof this._schedulingPolicy>): void {
    this._schedulingPolicy = { ...this._schedulingPolicy, ...policy };
    this._lifecycle.updatedAt = new Date();
  }

  updateMetadata(metadata: Partial<typeof this._metadata>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._lifecycle.updatedAt = new Date();
  }

  setImportance(importance: ImportanceLevel): void {
    this._metadata.importance = importance;
    this._lifecycle.updatedAt = new Date();
  }

  addKeyResultLink(link: KeyResultLink): void {
    if (!this._keyResultLinks) {
      this._keyResultLinks = [];
    }
    this._keyResultLinks.push(link);
    this._lifecycle.updatedAt = new Date();
  }

  removeKeyResultLink(goalUuid: string, keyResultId: string): void {
    if (this._keyResultLinks) {
      this._keyResultLinks = this._keyResultLinks.filter(
        (link) =>
          !(link.goalUuid === goalUuid && link.keyResultId === keyResultId)
      );
      this._lifecycle.updatedAt = new Date();
    }
  }

  activate(): void {
    this._lifecycle.status = "active";
    this._lifecycle.activatedAt = new Date();
    this._lifecycle.updatedAt = new Date();
  }

  pause(): void {
    this._lifecycle.status = "paused";
    this._lifecycle.pausedAt = new Date();
    this._lifecycle.updatedAt = new Date();
  }

  archive(): void {
    this._lifecycle.status = "archived";
    this._lifecycle.updatedAt = new Date();
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
    this._analytics.lastInstanceDate = new Date();
    this._lifecycle.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this._metadata.tags.includes(tag)) {
      this._metadata.tags.push(tag);
      this._lifecycle.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    this._metadata.tags = this._metadata.tags.filter((t) => t !== tag);
    this._lifecycle.updatedAt = new Date();
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

  // ============= 数据辅助方法 =============

  /**
   * 转换为数据传输对象
   */
  toDTO(): ITaskTemplateDTO {
    return {
      uuid: this.uuid,
      title: this._title,
      description: this._description,
      timeConfig: {
        type: this._timeConfig.type,
        baseTime: {
          start: this._timeConfig.baseTime.start.getTime(),
          end: this._timeConfig.baseTime.end?.getTime(),
          duration: this._timeConfig.baseTime.duration,
        },
        recurrence: {
          type: this._timeConfig.recurrence.type,
          interval: this._timeConfig.recurrence.interval,
          endCondition: this._timeConfig.recurrence.endCondition
            ? {
                type: this._timeConfig.recurrence.endCondition.type,
                endDate:
                  this._timeConfig.recurrence.endCondition.endDate?.getTime(),
                count: this._timeConfig.recurrence.endCondition.count,
              }
            : undefined,
          config: this._timeConfig.recurrence.config,
        },
        timezone: this._timeConfig.timezone,
        dstHandling: this._timeConfig.dstHandling,
      },
      reminderConfig: {
        enabled: this._reminderConfig.enabled ? 1 : 0,
        alerts: this._reminderConfig.alerts.map((alert) => ({
          uuid: alert.uuid,
          timing: {
            type: alert.timing.type,
            minutesBefore: alert.timing.minutesBefore,
            absoluteTime: alert.timing.absoluteTime?.getTime(),
          },
          type: alert.type,
          message: alert.message,
        })),
        snooze: {
          enabled: this._reminderConfig.snooze.enabled ? 1 : 0,
          interval: this._reminderConfig.snooze.interval,
          maxCount: this._reminderConfig.snooze.maxCount,
        },
      },
      schedulingPolicy: {
        allowReschedule: this._schedulingPolicy.allowReschedule ? 1 : 0,
        maxDelayDays: this._schedulingPolicy.maxDelayDays,
        skipWeekends: this._schedulingPolicy.skipWeekends ? 1 : 0,
        skipHolidays: this._schedulingPolicy.skipHolidays ? 1 : 0,
        workingHoursOnly: this._schedulingPolicy.workingHoursOnly ? 1 : 0,
      },
      metadata: {
        category: this._metadata.category,
        tags: this._metadata.tags,
        estimatedDuration: this._metadata.estimatedDuration,
        importance: this._metadata.importance,
        urgency: this._metadata.urgency,
        location: this._metadata.location,
      },
      lifecycle: {
        status: this._lifecycle.status,
        createdAt: this._lifecycle.createdAt.getTime(),
        updatedAt: this._lifecycle.updatedAt.getTime(),
        activatedAt: this._lifecycle.activatedAt?.getTime(),
        pausedAt: this._lifecycle.pausedAt?.getTime(),
      },
      analytics: {
        totalInstances: this._analytics.totalInstances,
        completedInstances: this._analytics.completedInstances,
        averageCompletionTime: this._analytics.averageCompletionTime,
        successRate: this._analytics.successRate,
        lastInstanceDate: this._analytics.lastInstanceDate?.getTime(),
      },
      keyResultLinks: this._keyResultLinks,
      version: this._version,
    };
  }

  /**
   * 从完整数据创建 TaskTemplate 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromDTO(data: ITaskTemplateDTO): TaskTemplate {
    // 反序列化 timeConfig
    const timeConfig = {
      type: data.timeConfig.type,
      baseTime: {
        start: new Date(data.timeConfig.baseTime.start),
        end: data.timeConfig.baseTime.end
          ? new Date(data.timeConfig.baseTime.end)
          : undefined,
        duration: data.timeConfig.baseTime.duration,
      },
      recurrence: {
        type: data.timeConfig.recurrence.type,
        interval: data.timeConfig.recurrence.interval,
        endCondition: data.timeConfig.recurrence.endCondition
          ? {
              type: data.timeConfig.recurrence.endCondition.type,
              endDate: data.timeConfig.recurrence.endCondition.endDate
                ? new Date(data.timeConfig.recurrence.endCondition.endDate)
                : undefined,
              count: data.timeConfig.recurrence.endCondition.count,
            }
          : undefined,
        config: data.timeConfig.recurrence.config,
      },
      timezone: data.timeConfig.timezone,
      dstHandling: data.timeConfig.dstHandling,
    };

    // 反序列化 reminderConfig
    const reminderConfig = {
      enabled: !!data.reminderConfig.enabled,
      alerts: data.reminderConfig.alerts.map((alert) => ({
        uuid: alert.uuid,
        timing: {
          type: alert.timing.type,
          minutesBefore: alert.timing.minutesBefore,
          absoluteTime: alert.timing.absoluteTime
            ? new Date(alert.timing.absoluteTime)
            : undefined,
        },
        type: alert.type,
        message: alert.message,
      })),
      snooze: {
        enabled: !!data.reminderConfig.snooze.enabled,
        interval: data.reminderConfig.snooze.interval,
        maxCount: data.reminderConfig.snooze.maxCount,
      },
    };

    // 反序列化 schedulingPolicy
    const schedulingPolicy = {
      allowReschedule: !!data.schedulingPolicy.allowReschedule,
      maxDelayDays: data.schedulingPolicy.maxDelayDays,
      skipWeekends: !!data.schedulingPolicy.skipWeekends,
      skipHolidays: !!data.schedulingPolicy.skipHolidays,
      workingHoursOnly: !!data.schedulingPolicy.workingHoursOnly,
    };

    // 创建 TaskTemplate 实例
    const taskTemplate = new TaskTemplate({
      uuid: data.uuid,
      title: data.title,
      timeConfig: timeConfig,
      reminderConfig: reminderConfig,
      description: data.description,
      category: data.metadata?.category,
      tags: data.metadata?.tags,
      importance: data.metadata?.importance || ImportanceLevel.Moderate,
      urgency: data.metadata?.urgency || UrgencyLevel.Medium,
      estimatedDuration: data.metadata?.estimatedDuration,
      location: data.metadata?.location,
      schedulingPolicy,
    });

    // 恢复生命周期状态
    if (data.lifecycle) {
      taskTemplate._lifecycle = {
        status: data.lifecycle.status || "draft",
        createdAt: new Date(data.lifecycle.createdAt),
        updatedAt: new Date(data.lifecycle.updatedAt),
        activatedAt: data.lifecycle.activatedAt
          ? new Date(data.lifecycle.activatedAt)
          : undefined,
        pausedAt: data.lifecycle.pausedAt
          ? new Date(data.lifecycle.pausedAt)
          : undefined,
      };
    }

    // 恢复统计数据
    if (data.analytics) {
      taskTemplate._analytics = {
        ...taskTemplate._analytics,
        ...data.analytics,
        lastInstanceDate: data.analytics.lastInstanceDate
          ? new Date(data.analytics.lastInstanceDate)
          : undefined,
      };
    }

    // 恢复版本号
    if (data.version !== undefined) {
      taskTemplate._version = data.version;
    }

    return taskTemplate;
  }

  isTaskTemplate(): this is TaskTemplate {
    return this instanceof TaskTemplate;
  }
  /**
   * 克隆实例（用于创建副本）
   */
  clone(): TaskTemplate {
    return TaskTemplate.fromDTO(this.toDTO());
  }
}
