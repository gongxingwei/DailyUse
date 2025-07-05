import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { DateTime } from '@/shared/types/myDateTime';
import type { 
  TaskTimeConfig, 
  TaskReminderConfig,
  KeyResultLink,
  ITaskTemplate
} from "@/modules/Task/domain/types/task";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";

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
      category?: string;
      tags?: string[];
      priority?: 1 | 2 | 3 | 4 | 5;
      difficulty?: 1 | 2 | 3 | 4 | 5;
      estimatedDuration?: number;
      location?: string;
      keyResultLinks?: KeyResultLink[];
      schedulingPolicy?: Partial<ITaskTemplate['schedulingPolicy']>;
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
  // ===== UI 校验和操作预览方法 =====
  // 注意：这些方法仅用于 UI 层面的校验和预览，
  // 实际的业务操作应通过应用层服务调用 IPC 交给主进程处理

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
  toJSON(): any {
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

// === 新架构适配方法 ===

/**
 * 任务模板映射器
 * 处理领域模型(TaskTemplate)和数据传输对象(ITaskTemplate)之间的转换
 * 
 * 设计说明：
 * - TaskTemplate：面向对象的领域模型，包含业务逻辑和行为方法
 * - ITaskTemplate：面向过程的数据传输对象，用于序列化和跨进程传输
 */
export class TaskTemplateMapper {
  /**
   * 将领域模型转换为数据传输对象
   */
  static toDTO(template: TaskTemplate): ITaskTemplate {
    return template.toJSON();
  }

  /**
   * 将数据传输对象转换为领域模型
   */
  static fromDTO(data: ITaskTemplate): TaskTemplate {
    return TaskTemplate.fromCompleteData(data);
  }

  /**
   * 批量转换领域模型数组为 DTO 数组
   */
  static toDTOArray(templates: TaskTemplate[]): ITaskTemplate[] {
    return templates.map(template => this.toDTO(template));
  }

  /**
   * 批量转换 DTO 数组为领域模型数组
   */
  static fromDTOArray(dataArray: ITaskTemplate[]): TaskTemplate[] {
    return dataArray.map(data => this.fromDTO(data));
  }

  /**
   * 创建用于更新的部分 DTO 数据
   */
  static toPartialDTO(template: TaskTemplate): Partial<ITaskTemplate> {
    const data = template.toJSON();
    return {
      id: data.id,
      lifecycle: data.lifecycle,
      analytics: data.analytics,
      version: data.version,
    };
  }
}