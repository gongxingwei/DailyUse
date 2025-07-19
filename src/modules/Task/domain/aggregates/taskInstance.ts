import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { DateTime } from '@/shared/types/myDateTime';

import type {
  KeyResultLink,
  ITaskInstance,
  ITaskTemplate,
  TaskTimeConfig,
  TaskInstanceReminderStatus,
  TaskInstanceLifecycleEvent,
  TaskReminderConfig,
  TaskInstanceTimeConfig,
} from "@/modules/Task/domain/types/task";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";

export class TaskInstance extends AggregateRoot implements ITaskInstance {
  private _templateId: string;
  private _title: string;
  private _description?: string;
  private _timeConfig: TaskInstanceTimeConfig; // 新增
  private _actualStartTime?: DateTime;
  private _actualEndTime?: DateTime;
  private _keyResultLinks?: KeyResultLink[];
  private _priority: 1 | 2 | 3 | 4 | 5;
  private _status:
    | "pending"
    | "inProgress"
    | "completed"
    | "cancelled"
    | "overdue";
  private _completedAt?: DateTime;
  private _reminderStatus: TaskInstanceReminderStatus;
  private _lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
    startedAt?: DateTime;
    completedAt?: DateTime;
    cancelledAt?: DateTime;
    events: TaskInstanceLifecycleEvent[];
  };
  private _metadata: {
    estimatedDuration?: number;
    actualDuration?: number;
    category: string;
    tags: string[];
    location?: string;
    difficulty?: 1 | 2 | 3 | 4 | 5;
  };
  private _version: number;

  constructor(
    id: string,
    templateId: string,
    title: string,
    scheduledTime: DateTime,
    priority: 1 | 2 | 3 | 4 | 5,
    options?: {
      description?: string;
      keyResultLinks?: KeyResultLink[];
      category?: string;
      tags?: string[];
      estimatedDuration?: number;
      location?: string;
      difficulty?: 1 | 2 | 3 | 4 | 5;
      reminderAlerts?: TaskReminderConfig["alerts"];
      timeConfig?: {
        type: TaskInstanceTimeConfig["type"];
        scheduledTime: DateTime;
        endTime?: DateTime;
        estimatedDuration?: number;
        timezone?: string;
        allowReschedule?: boolean;
        maxDelayDays?: number;
      };
    }
  ) {
    super(id);
    const now = TimeUtils.now();

    this._templateId = templateId;
    this._title = title;
    this._description = options?.description;

    this._timeConfig = {
      type: options?.timeConfig?.type || "timed",
      scheduledTime,
      endTime: options?.timeConfig?.endTime,
      estimatedDuration: options?.estimatedDuration || options?.timeConfig?.estimatedDuration,
      timezone: options?.timeConfig?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      allowReschedule: options?.timeConfig?.allowReschedule ?? true,
      maxDelayDays: options?.timeConfig?.maxDelayDays || 3
    };

    this._keyResultLinks = options?.keyResultLinks;
    this._priority = priority;
    this._status = "pending";

    // 初始化提醒状态
    this._reminderStatus = {
      enabled: true,
      alerts:
        options?.reminderAlerts?.map((alert) => ({
          id: alert.id,
          alertConfig: alert,
          status: "pending" as const,
          scheduledTime: this.calculateReminderTime(alert, scheduledTime),
          snoozeHistory: [],
        })) || [],
      globalSnoozeCount: 0,
    };

    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
      events: [],
    };

    this._metadata = {
      category: options?.category || "general",
      tags: options?.tags || [],
      estimatedDuration: options?.estimatedDuration,
      location: options?.location,
      difficulty: options?.difficulty,
    };

    this._version = 1;

    // 记录提醒调度事件
    if (options?.reminderAlerts?.length) {
      options.reminderAlerts.forEach((alert) => {
        this._lifecycle.events.push({
          type: "reminder_scheduled",
          timestamp: now,
          alertId: alert.id,
          details: {
            scheduledFor: this.calculateReminderTime(alert, scheduledTime)
              .isoString,
          },
        });
      });
    }
  }

  // 计算提醒时间
  private calculateReminderTime(
    alert: TaskReminderConfig["alerts"][number],
    scheduledTime: DateTime
  ): DateTime {
    if (alert.timing.type === "absolute" && alert.timing.absoluteTime) {
      return alert.timing.absoluteTime;
    } else if (alert.timing.type === "relative" && alert.timing.minutesBefore) {
      const reminderTimestamp =
        scheduledTime.timestamp - alert.timing.minutesBefore * 60 * 1000;
      return TimeUtils.fromTimestamp(reminderTimestamp);
    }
    return scheduledTime;
  }

  // Getters
  get templateId(): string {
    return this._templateId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get timeConfig(): TaskInstanceTimeConfig {
    return this._timeConfig;
  }

  get scheduledTime(): DateTime {
    return this._timeConfig.scheduledTime;
  }


  get actualStartTime(): DateTime | undefined {
    return this._actualStartTime;
  }

  get actualEndTime(): DateTime | undefined {
    return this._actualEndTime;
  }

  get keyResultLinks(): KeyResultLink[] | undefined {
    return this._keyResultLinks;
  }

  get priority(): 1 | 2 | 3 | 4 | 5 {
    return this._priority;
  }

  get status():
    | "pending"
    | "inProgress"
    | "completed"
    | "cancelled"
    | "overdue" {
    return this._status;
  }

  get completedAt(): DateTime | undefined {
    return this._completedAt;
  }

  get reminderStatus(): TaskInstanceReminderStatus {
    return this._reminderStatus;
  }

  get lifecycle() {
    return this._lifecycle;
  }

  get metadata() {
    return this._metadata;
  }

  get version(): number {
    return this._version;
  }

  // Status check methods
  isPending(): boolean {
    return this._status === "pending";
  }

  isInProgress(): boolean {
    return this._status === "inProgress";
  }

  isCompleted(): boolean {
    return this._status === "completed";
  }

  isCancelled(): boolean {
    return this._status === "cancelled";
  }

  isOverdue(): boolean {
    return this._status === "overdue";
  }

  // ===== UI 校验和操作预览方法 =====
  // 注意：这些方法仅用于 UI 层面的校验和预览，
  // 实际的业务操作应通过应用层服务调用 IPC 交给主进程处理

  /**
   * 检查是否可以完成任务（UI 校验）
   */
  canComplete(): { canComplete: boolean; reason?: string } {
    if (this._status === "completed") {
      return { canComplete: false, reason: "任务已完成" };
    }
    if (this._status === "cancelled") {
      return { canComplete: false, reason: "任务已取消" };
    }
    return { canComplete: true };
  }

  /**
   * 检查是否可以开始任务（UI 校验）
   */
  canStart(): { canStart: boolean; reason?: string } {
    if (this._status !== "pending") {
      return { canStart: false, reason: `任务状态为 ${this._status}，无法开始` };
    }
    return { canStart: true };
  }

  /**
   * 检查是否可以取消任务（UI 校验）
   */
  canCancel(): { canCancel: boolean; reason?: string } {
    if (this._status === "completed") {
      return { canCancel: false, reason: "已完成的任务无法取消" };
    }
    if (this._status === "cancelled") {
      return { canCancel: false, reason: "任务已取消" };
    }
    return { canCancel: true };
  }

  /**
   * 检查是否可以重新安排任务（UI 校验）
   */
  canReschedule(): { canReschedule: boolean; reason?: string } {
    if (this._status === "completed") {
      return { canReschedule: false, reason: "已完成的任务无法重新安排" };
    }
    if (!this._timeConfig.allowReschedule) {
      return { canReschedule: false, reason: "此任务实例不允许重新安排" };
    }
    return { canReschedule: true };
  }

  /**
   * 检查是否可以撤销完成（UI 校验）
   */
  canUndoComplete(): { canUndo: boolean; reason?: string } {
    if (this._status !== "completed") {
      return { canUndo: false, reason: "只能撤销已完成的任务" };
    }
    return { canUndo: true };
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
        action: "start",
        label: "开始任务",
        ...this.canStart(),
        available: this.canStart().canStart,
      },
      {
        action: "complete",
        label: "完成任务",
        ...this.canComplete(),
        available: this.canComplete().canComplete,
      },
      {
        action: "cancel",
        label: "取消任务",
        ...this.canCancel(),
        available: this.canCancel().canCancel,
      },
      {
        action: "reschedule",
        label: "重新安排",
        ...this.canReschedule(),
        available: this.canReschedule().canReschedule,
      },
      {
        action: "undoComplete",
        label: "撤销完成",
        ...this.canUndoComplete(),
        available: this.canUndoComplete().canUndo,
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
      case "start":
        if (!this.canStart().canStart) {
          return { success: false, error: this.canStart().reason };
        }
        return {
          success: true,
          newStatus: "inProgress",
          changes: { actualStartTime: "当前时间" },
        };

      case "complete":
        if (!this.canComplete().canComplete) {
          return { success: false, error: this.canComplete().reason };
        }
        return {
          success: true,
          newStatus: "completed",
          changes: { 
            completedAt: "当前时间",
            actualEndTime: "当前时间",
            actualDuration: this._actualStartTime ? "根据开始时间计算" : undefined
          },
        };

      case "cancel":
        if (!this.canCancel().canCancel) {
          return { success: false, error: this.canCancel().reason };
        }
        return {
          success: true,
          newStatus: "cancelled",
          changes: { cancelledAt: "当前时间" },
        };

      case "undoComplete":
        if (!this.canUndoComplete().canUndo) {
          return { success: false, error: this.canUndoComplete().reason };
        }
        return {
          success: true,
          newStatus: "inProgress",
          changes: { 
            completedAt: null,
            actualEndTime: null,
            actualDuration: null
          },
        };

      default:
        return { success: false, error: `未知操作: ${action}` };
    }
  }

  /**
   * 检查重新安排的时间限制（UI 校验）
   */
  validateRescheduleTime(newScheduledTime: DateTime): {
    valid: boolean;
    reason?: string;
  } {
    if (!this.canReschedule().canReschedule) {
      return { valid: false, reason: this.canReschedule().reason };
    }

    if (this._timeConfig.maxDelayDays) {
      const maxAllowedTime = TimeUtils.addDays(
        this._timeConfig.scheduledTime,
        this._timeConfig.maxDelayDays
      );
      if (newScheduledTime.timestamp > maxAllowedTime.timestamp) {
        return {
          valid: false,
          reason: `不能延期超过 ${this._timeConfig.maxDelayDays} 天`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * 获取下一个待触发的提醒（只读查询）
   */
  getNextReminder(): { alertId: string; scheduledTime: DateTime } | null {
    if (!this._reminderStatus.enabled) return null;

    const pendingAlerts = this._reminderStatus.alerts
      .filter(
        (alert) => alert.status === "pending" || alert.status === "snoozed"
      )
      .sort((a, b) => a.scheduledTime.timestamp - b.scheduledTime.timestamp);

    if (pendingAlerts.length > 0) {
      return {
        alertId: pendingAlerts[0].id,
        scheduledTime: pendingAlerts[0].scheduledTime,
      };
    }

    return null;
  }

  /**
   * 获取提醒统计（只读查询）
   */
  getReminderStats() {
    const total = this._reminderStatus.alerts.length;
    const triggered = this._reminderStatus.alerts.filter(
      (a) => a.status === "triggered"
    ).length;
    const dismissed = this._reminderStatus.alerts.filter(
      (a) => a.status === "dismissed"
    ).length;
    const snoozed = this._reminderStatus.alerts.filter(
      (a) => a.status === "snoozed"
    ).length;

    return {
      total,
      triggered,
      dismissed,
      snoozed,
      pending: total - triggered - dismissed - snoozed,
      globalSnoozeCount: this._reminderStatus.globalSnoozeCount,
    };
  }
  // ===== 工厂方法和序列化方法 =====
  // 注意：这些方法仅用于数据创建和转换，不包含业务逻辑

  /**
   * 从模板创建任务实例（数据创建）
   */
  static fromTemplate(
    instanceId: string,
    template: {
      id: string;
      title: string;
      description?: string;
      timeConfig: TaskTimeConfig;
      metadata: {
        category: string;
        tags: string[];
        estimatedDuration?: number;
        priority?: 1 | 2 | 3 | 4 | 5;
        difficulty?: 1 | 2 | 3 | 4 | 5;
        location?: string;
      };
      keyResultLinks?: KeyResultLink[];
      reminderConfig: TaskReminderConfig;
      schedulingPolicy?: ITaskTemplate['schedulingPolicy'];
    },
    scheduledTime: DateTime,
    endTime?: DateTime
  ): TaskInstance {
    return new TaskInstance(
      instanceId,
      template.id,
      template.title,
      scheduledTime,
      (template.metadata.priority || 3) as 1 | 2 | 3 | 4 | 5,
      {
        description: template.description,
        keyResultLinks: template.keyResultLinks,
        category: template.metadata.category,
        tags: template.metadata.tags,
        estimatedDuration: template.metadata.estimatedDuration,
        location: template.metadata.location,
        difficulty: template.metadata.difficulty,
        reminderAlerts: template.reminderConfig.alerts,
        timeConfig: {
          type: template.timeConfig.type,
          scheduledTime,
          endTime: endTime || template.timeConfig.baseTime.end,
          estimatedDuration: template.metadata.estimatedDuration,
          timezone: template.timeConfig.timezone,
          allowReschedule: template.schedulingPolicy?.allowReschedule ?? true,
          maxDelayDays: template.schedulingPolicy?.maxDelayDays || 3
        }
      }
    );
  }

  /**
   * 从完整数据创建 TaskInstance 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromCompleteData(data: any): TaskInstance {
    // 创建基础实例
    const instance = new TaskInstance(
      data.id || data._id,
      data.templateId || data._templateId,
      data.title || data._title,
      data.scheduledTime || data._timeConfig?.scheduledTime || data.timeConfig?.scheduledTime,
      data.priority || data._priority || 3,
      {
        description: data.description || data._description,
        keyResultLinks: data.keyResultLinks || data._keyResultLinks,
        category: data.metadata?.category || data._metadata?.category,
        tags: data.metadata?.tags || data._metadata?.tags,
        estimatedDuration: data.metadata?.estimatedDuration || data._metadata?.estimatedDuration,
        location: data.metadata?.location || data._metadata?.location,
        difficulty: data.metadata?.difficulty || data._metadata?.difficulty,
        timeConfig: data.timeConfig || data._timeConfig,
        reminderAlerts: data.reminderStatus?.alerts?.map((alert: any) => alert.alertConfig) || 
                       data._reminderStatus?.alerts?.map((alert: any) => alert.alertConfig),
      }
    );

    // 恢复状态
    if (data.status !== undefined || data._status !== undefined) {
      instance._status = data.status || data._status || "pending";
    }

    // 恢复时间信息
    if (data.completedAt || data._completedAt) {
      instance._completedAt = TimeUtils.ensureDateTime(data.completedAt || data._completedAt);
    }
    if (data.actualStartTime || data._actualStartTime) {
      instance._actualStartTime = TimeUtils.ensureDateTime(data.actualStartTime || data._actualStartTime);
    }
    if (data.actualEndTime || data._actualEndTime) {
      instance._actualEndTime = TimeUtils.ensureDateTime(data.actualEndTime || data._actualEndTime);
    }

    // 恢复完整的生命周期状态
    if (data.lifecycle || data._lifecycle) {
      const lifecycle = data.lifecycle || data._lifecycle;
      instance._lifecycle = {
        createdAt: lifecycle.createdAt || instance._lifecycle.createdAt,
        updatedAt: lifecycle.updatedAt || instance._lifecycle.updatedAt,
        startedAt: lifecycle.startedAt || undefined,
        completedAt: lifecycle.completedAt || undefined,
        cancelledAt: lifecycle.cancelledAt || undefined,
        events: lifecycle.events || [],
      };
    }

    // 恢复元数据
    if (data.metadata || data._metadata) {
      const metadata = data.metadata || data._metadata;
      instance._metadata = {
        ...instance._metadata,
        ...metadata,
      };
    }

    // 恢复完整的提醒状态
    if (data.reminderStatus || data._reminderStatus) {
      const reminderStatus = data.reminderStatus || data._reminderStatus;
      instance._reminderStatus = {
        enabled: reminderStatus.enabled ?? true,
        alerts: reminderStatus.alerts?.map((alert: any) => ({
          id: alert.id,
          alertConfig: alert.alertConfig,
          status: alert.status || "pending",
          scheduledTime: alert.scheduledTime ? TimeUtils.ensureDateTime(alert.scheduledTime) : TimeUtils.now(),
          triggeredAt: alert.triggeredAt ? TimeUtils.ensureDateTime(alert.triggeredAt) : undefined,
          dismissedAt: alert.dismissedAt ? TimeUtils.ensureDateTime(alert.dismissedAt) : undefined,
          snoozeHistory: alert.snoozeHistory || [],
        })) || [],
        globalSnoozeCount: reminderStatus.globalSnoozeCount || 0,
        lastTriggeredAt: reminderStatus.lastTriggeredAt ? TimeUtils.ensureDateTime(reminderStatus.lastTriggeredAt) : undefined,
      };
    }

    // 恢复版本号
    if (data.version !== undefined || data._version !== undefined) {
      instance._version = data.version || data._version || 1;
    }

    // 恢复时间配置
    if (data.timeConfig || data._timeConfig) {
      const timeConfig = data.timeConfig || data._timeConfig;
      instance._timeConfig = {
        type: timeConfig.type || "timed",
        scheduledTime: timeConfig.scheduledTime ? TimeUtils.ensureDateTime(timeConfig.scheduledTime) : instance._timeConfig.scheduledTime,
        endTime: timeConfig.endTime ? TimeUtils.ensureDateTime(timeConfig.endTime) : undefined,
        estimatedDuration: timeConfig.estimatedDuration,
        timezone: timeConfig.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        allowReschedule: timeConfig.allowReschedule ?? true,
        maxDelayDays: timeConfig.maxDelayDays || 3,
      };
    }

    return instance;
  }

  /**
   * 克隆实例（用于创建副本）
   */
  clone(): TaskInstance {
    return TaskInstance.fromCompleteData(this.toDTO());
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): ITaskInstance {
    return {
      id: this.id,
      templateId: this._templateId,
      title: this._title,
      description: this._description,
      timeConfig: this._timeConfig,
      actualStartTime: this._actualStartTime,
      actualEndTime: this._actualEndTime,
      keyResultLinks: this._keyResultLinks,
      priority: this._priority,
      status: this._status,
      completedAt: this._completedAt,
      reminderStatus: this._reminderStatus,
      lifecycle: this._lifecycle,
      metadata: this._metadata,
      version: this._version,
    };
  }

  /**
   * 导出完整数据（用于序列化）
   * 为了兼容 JSON.stringify()，委托给 toDTO()
   */
  toJSON(): ITaskInstance {
    return this.toDTO();
  }

  static isTaskInstance(obj: any): obj is TaskInstance {
    return obj instanceof TaskInstance;
  }
}

// === 新架构适配方法 ===

/**
 * 任务实例映射器
 * 处理领域模型(TaskInstance)和数据传输对象(ITaskInstance)之间的转换
 * 
 * 设计说明：
 * - TaskInstance：面向对象的领域模型，包含业务逻辑和行为方法
 * - ITaskInstance：面向过程的数据传输对象，用于序列化和跨进程传输
 */
export class TaskInstanceMapper {
  /**
   * 将领域模型转换为数据传输对象
   */
  static toDTO(instance: TaskInstance): ITaskInstance {
    return instance.toDTO();
  }

  /**
   * 将数据传输对象转换为领域模型
   */
  static fromDTO(data: ITaskInstance): TaskInstance {
    return TaskInstance.fromCompleteData(data);
  }

  /**
   * 批量转换领域模型数组为 DTO 数组
   */
  static toDTOArray(instances: TaskInstance[]): ITaskInstance[] {
    return instances.map(instance => this.toDTO(instance));
  }

  /**
   * 批量转换 DTO 数组为领域模型数组
   */
  static fromDTOArray(dataArray: ITaskInstance[]): TaskInstance[] {
    return dataArray.map(data => this.fromDTO(data));
  }

  /**
   * 创建用于更新的部分 DTO 数据
   */
  static toPartialDTO(instance: TaskInstance): Partial<ITaskInstance> {
    const data = instance.toDTO();
    return {
      id: data.id,
      status: data.status,
      completedAt: data.completedAt,
      actualStartTime: data.actualStartTime,
      actualEndTime: data.actualEndTime,
      lifecycle: data.lifecycle,
      metadata: data.metadata,
      version: data.version,
    };
  }
}
