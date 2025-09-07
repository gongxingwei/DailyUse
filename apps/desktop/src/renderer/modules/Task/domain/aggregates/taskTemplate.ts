import { AggregateRoot } from "@dailyuse/utils";
import type {
  TaskTimeConfig,
  TaskReminderConfig,
  KeyResultLink,
  ITaskTemplate,
  ITaskTemplateDTO,
} from "@common/modules/task/types/task";
import { ImportanceLevel } from "@dailyuse/contracts";
import { UrgencyLevel } from "@dailyuse/contracts";
import { addMinutes } from "date-fns";

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
    super(params.uuid || AggregateRoot.generateUUID());
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
        (link) => !(link.goalUuid === goalUuid && link.keyResultId === keyResultId)
      );
      this._lifecycle.updatedAt = new Date();
    }
  }
  // ===== UI 校验和操作预览方法 =====
  
  switchTimeConfigType(type: "timeRange" | "timed" | "allDay"): void {
    this._timeConfig.type = type;
    this._lifecycle.updatedAt = new Date();
    if (type === "timeRange") {
      this._timeConfig.baseTime.duration = 0;
      this._timeConfig.baseTime.start = new Date();
      this._timeConfig.baseTime.end = addMinutes(this._timeConfig.baseTime.start, 60);
    } else if (type === "timed") {
      this._timeConfig.baseTime.duration = 0;
      this._timeConfig.baseTime.start = new Date();
    } else if (type === "allDay") {
      this._timeConfig.baseTime.duration = 0;
      const now = new Date();
      const zeroHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      this._timeConfig.baseTime.start = zeroHour;
      this._timeConfig.baseTime.end = addMinutes(zeroHour, 1440); // 默认持续时间为24小时
    }
  }

  /**
   * 检查是否可以激活模板（UI 校验）
   */
  canActivate(): { canActivate: boolean; reason?: string } {
    if (this._lifecycle.status === "active") {
      return { canActivate: false, reason: "模板已激活" };
    }
    return { canActivate: true };
  }

  /**
   * 检查是否可以暂停模板（UI 校验）
   */
  canPause(): { canPause: boolean; reason?: string } {
    if (this._lifecycle.status !== "active") {
      return { canPause: false, reason: "只能暂停已激活的模板" };
    }
    return { canPause: true };
  }

  /**
   * 检查是否可以归档模板（UI 校验）
   */
  canArchive(): { canArchive: boolean; reason?: string } {
    if (this._lifecycle.status === "archived") {
      return { canArchive: false, reason: "模板已归档" };
    }
    return { canArchive: true };
  }

  /**
   * 检查是否可以编辑模板（UI 校验）
   */
  canEdit(): { canEdit: boolean; reason?: string } {
    if (this._lifecycle.status === "archived") {
      return { canEdit: false, reason: "已归档的模板无法编辑" };
    }
    return { canEdit: true };
  }

  /**
   * 检查是否可以删除模板（UI 校验）
   */
  canDelete(): { canDelete: boolean; reason?: string } {
    if (this._analytics.totalInstances > 0) {
      return { 
        canDelete: false, 
        reason: `模板已有 ${this._analytics.totalInstances} 个实例，无法删除` 
      };
    }
    return { canDelete: true };
  }

  /**
   * 获取当前可用的操作列表（UI 预览）
   */
  getAvailableActions(): Array<{
    action: string;
    label: string;
    available: boolean;
    reason?: string;
  }> {
    const actions = [
      {
        action: "activate",
        label: "激活模板",
        ...this.canActivate(),
        available: this.canActivate().canActivate,
      },
      {
        action: "pause",
        label: "暂停模板",
        ...this.canPause(),
        available: this.canPause().canPause,
      },
      {
        action: "archive",
        label: "归档模板",
        ...this.canArchive(),
        available: this.canArchive().canArchive,
      },
      {
        action: "edit",
        label: "编辑模板",
        ...this.canEdit(),
        available: this.canEdit().canEdit,
      },
      {
        action: "delete",
        label: "删除模板",
        ...this.canDelete(),
        available: this.canDelete().canDelete,
      },
    ];

    return actions;
  }

  /**
   * 预览操作的结果（UI 预览）
   */
  previewAction(action: string): {
    success: boolean;
    newStatus?: string;
    changes?: Record<string, any>;
    error?: string;
  } {
    switch (action) {
      case "activate":
        if (!this.canActivate().canActivate) {
          return { success: false, error: this.canActivate().reason };
        }
        return {
          success: true,
          newStatus: "active",
          changes: { activatedAt: "当前时间" },
        };

      case "pause":
        if (!this.canPause().canPause) {
          return { success: false, error: this.canPause().reason };
        }
        return {
          success: true,
          newStatus: "paused",
          changes: { pausedAt: "当前时间" },
        };

      case "archive":
        if (!this.canArchive().canArchive) {
          return { success: false, error: this.canArchive().reason };
        }
        return {
          success: true,
          newStatus: "archived",
          changes: {},
        };

      default:
        return { success: false, error: `未知操作: ${action}` };
    }
  }

  /**
   * 校验模板配置（UI 校验）
   */
  validateConfiguration(): {
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
  } {
    const errors: Array<{ field: string; message: string }> = [];

    // 校验标题
    if (!this._title || this._title.trim() === "") {
      errors.push({ field: "title", message: "标题不能为空" });
    }

    // 校验时间配置
    if (!this._timeConfig.baseTime?.start && !this._timeConfig.baseTime?.end) {
      errors.push({ field: "timeConfig", message: "时间配置不完整" });
    }

    // 校验提醒配置
    if (this._reminderConfig.enabled && (!this._reminderConfig.alerts || this._reminderConfig.alerts.length === 0)) {
      errors.push({ field: "reminderConfig", message: "启用提醒时必须配置至少一个提醒" });
    }

    // 校验预估时长
    if (this._metadata.estimatedDuration !== undefined && this._metadata.estimatedDuration <= 0) {
      errors.push({ field: "estimatedDuration", message: "预估时长必须大于 0" });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
   * 从 DTO 创建 TaskTemplate 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromDTO(data: ITaskTemplateDTO): TaskTemplate {
    // 创建基础实例
    const instance = new TaskTemplate({
      uuid: data.uuid,
      title: data.title,
      description: data.description,
      timeConfig: {
        ...data.timeConfig,
        baseTime: {
          ...data.timeConfig.baseTime,
          start: new Date(data.timeConfig.baseTime.start),
          end: data.timeConfig.baseTime.end ? new Date(data.timeConfig.baseTime.end) : undefined,
        },
        recurrence: {
          ...data.timeConfig.recurrence,
          endCondition: data.timeConfig.recurrence.endCondition ? {
            ...data.timeConfig.recurrence.endCondition,
            endDate: data.timeConfig.recurrence.endCondition.endDate ? new Date(data.timeConfig.recurrence.endCondition.endDate) : undefined,
          } : undefined,
        },
      },
      reminderConfig: {
        ...data.reminderConfig,
        enabled: !!data.reminderConfig.enabled,
        alerts: data.reminderConfig.alerts.map(alert => ({
          ...alert,
          timing: {
            ...alert.timing,
            absoluteTime: alert.timing.absoluteTime ? new Date(alert.timing.absoluteTime) : undefined,
          },
        })),
        snooze: {
          ...data.reminderConfig.snooze,
          enabled: !!data.reminderConfig.snooze.enabled,
        },
      },
      importance: data.metadata.importance,
      urgency: data.metadata.urgency,
      keyResultLinks: data.keyResultLinks,
      category: data.metadata.category,
      tags: data.metadata.tags,
      estimatedDuration: data.metadata.estimatedDuration,
      location: data.metadata.location,
      schedulingPolicy: {
        allowReschedule: !!data.schedulingPolicy.allowReschedule,
        maxDelayDays: data.schedulingPolicy.maxDelayDays,
        skipWeekends: !!data.schedulingPolicy.skipWeekends,
        skipHolidays: !!data.schedulingPolicy.skipHolidays,
        workingHoursOnly: !!data.schedulingPolicy.workingHoursOnly,
      },
    });

    // 恢复完整的生命周期状态
    instance._lifecycle = {
      status: data.lifecycle.status,
      createdAt: new Date(data.lifecycle.createdAt),
      updatedAt: new Date(data.lifecycle.updatedAt),
      activatedAt: data.lifecycle.activatedAt ? new Date(data.lifecycle.activatedAt) : undefined,
      pausedAt: data.lifecycle.pausedAt ? new Date(data.lifecycle.pausedAt) : undefined,
    };

    // 恢复分析数据
    instance._analytics = {
      totalInstances: data.analytics.totalInstances,
      completedInstances: data.analytics.completedInstances,
      averageCompletionTime: data.analytics.averageCompletionTime,
      successRate: data.analytics.successRate,
      lastInstanceDate: data.analytics.lastInstanceDate ? new Date(data.analytics.lastInstanceDate) : undefined,
    };

    // 恢复版本号
    instance._version = data.version;

    return instance;
  }


  isTaskTemplate(): this is TaskTemplate {
    return this instanceof TaskTemplate;
  }

  static ensureTaskTemplate(data: any): TaskTemplate {
    if (data instanceof TaskTemplate) {
      return data;
    }
    return TaskTemplate.fromDTO(data);
  }

  /**
   * 克隆实例（用于创建副本）
   */
  clone(): TaskTemplate {
    return TaskTemplate.fromDTO(this.toDTO());
  }

  /**
   * 转换为数据传输对象
   * 使用 JSON.parse(JSON.stringify()) 确保返回纯净的 JSON 对象，移除所有 Proxy 和不可序列化内容
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
          endCondition: this._timeConfig.recurrence.endCondition ? {
            type: this._timeConfig.recurrence.endCondition.type,
            endDate: this._timeConfig.recurrence.endCondition.endDate?.getTime(),
            count: this._timeConfig.recurrence.endCondition.count,
          } : undefined,
          config: this._timeConfig.recurrence.config,
        },
        timezone: this._timeConfig.timezone,
        dstHandling: this._timeConfig.dstHandling,
      },
      reminderConfig: {
        enabled: this._reminderConfig.enabled ? 1 : 0,
        alerts: this._reminderConfig.alerts.map(alert => ({
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
      metadata: this._metadata,
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
}
