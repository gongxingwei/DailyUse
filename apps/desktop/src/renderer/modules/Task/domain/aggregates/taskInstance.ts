import { AggregateRoot } from "@dailyuse/utils";
import type {
  KeyResultLink,
  ITaskInstance,
  ITaskTemplate,
  TaskTimeConfig,
  TaskInstanceReminderStatus,
  TaskInstanceLifecycleEvent,
  TaskReminderConfig,
  TaskInstanceTimeConfig,
  ITaskInstanceDTO,
} from '@common/modules/task/types/task';
import { ImportanceLevel } from "@dailyuse/contracts";
import { UrgencyLevel } from "@dailyuse/contracts";
import { addDays } from "date-fns/addDays";

export class TaskInstance extends AggregateRoot implements ITaskInstance {
  private _templateUuid: string;
  private _title: string;
  private _description?: string;
  private _timeConfig: TaskInstanceTimeConfig;
  private _reminderStatus: TaskInstanceReminderStatus;
  private _lifecycle: {
    status: "pending" | "inProgress" | "completed" | "cancelled" | "overdue";
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    events: TaskInstanceLifecycleEvent[];
  };
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
    scheduledTime: Date;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    description?: string;
    timeConfig?: Partial<TaskInstanceTimeConfig>;
    estimatedDuration?: number;
    keyResultLinks?: KeyResultLink[];
    reminderAlerts?: TaskReminderConfig["alerts"];
    category?: string;
    tags?: string[];
    location?: string;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    const now = new Date();

    this._templateUuid = params.templateUuid;
    this._title = params.title;
    this._description = params.description;

    this._timeConfig = {
      type: params.timeConfig?.type || "timed",
      scheduledTime: params.scheduledTime,
      endTime: params.timeConfig?.endTime,
      estimatedDuration:
        params.estimatedDuration || params.timeConfig?.estimatedDuration,
      timezone: params.timeConfig?.timezone || "Asia/Shanghai",
      allowReschedule: params.timeConfig?.allowReschedule ?? true,
      maxDelayDays: params.timeConfig?.maxDelayDays || 3,
    };

    this._keyResultLinks = params.keyResultLinks;

    // 初始化提醒状态
    this._reminderStatus = {
      enabled: true,
      alerts:
        params.reminderAlerts?.map((alert) => ({
          uuid: alert.uuid,
          alertConfig: alert,
          status: "pending" as const,
          scheduledTime: this.calculateReminderTime(alert, params.scheduledTime),
          snoozeHistory: [],
        })) || [],
      globalSnoozeCount: 0,
    };

    this._lifecycle = {
      status: "pending",
      createdAt: now,
      updatedAt: now,
      events: [],
    };

    this._metadata = {
      category: params.category || "general",
      tags: params.tags || [],
      estimatedDuration: params.estimatedDuration,
      location: params.location,
      urgency: params.urgency,
      importance: params.importance,
    };

    this._version = 1;

    // 记录提醒调度事件
    if (params.reminderAlerts?.length) {
      params.reminderAlerts.forEach((alert) => {
        this._lifecycle.events.push({
          type: "reminder_scheduled",
          timestamp: now,
          alertId: alert.uuid,
          details: {
            scheduledFor: this.calculateReminderTime(
              alert,
              params.scheduledTime
            ).toISOString(),
          },
        });
      });
    }
  }

  // 计算提醒时间
  private calculateReminderTime(
    alert: TaskReminderConfig["alerts"][number],
    scheduledTime: Date
  ): Date {
    if (alert.timing.type === "absolute" && alert.timing.absoluteTime) {
      return alert.timing.absoluteTime;
    } else if (alert.timing.type === "relative" && alert.timing.minutesBefore) {
      const reminderTimestamp =
        scheduledTime.getTime() - alert.timing.minutesBefore * 60 * 1000;
      return new Date(reminderTimestamp);
    }
    return scheduledTime;
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
    return this._timeConfig;
  }

  get scheduledTime(): Date {
    return this._timeConfig.scheduledTime;
  }

  get keyResultLinks(): KeyResultLink[] | undefined {
    return this._keyResultLinks;
  }

  get priority(): ImportanceLevel {
    return this._metadata.importance;
  }

  get status():
    | "pending"
    | "inProgress"
    | "completed"
    | "cancelled"
    | "overdue" {
    return this._lifecycle.status;
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
    return this._lifecycle.status === "pending";
  }

  isInProgress(): boolean {
    return this._lifecycle.status === "inProgress";
  }

  isCompleted(): boolean {
    return this._lifecycle.status === "completed";
  }

  isCancelled(): boolean {
    return this._lifecycle.status === "cancelled";
  }

  isOverdue(): boolean {
    return this._lifecycle.status === "overdue";
  }

  // ===== UI 校验和操作预览方法 =====
  // 注意：这些方法仅用于 UI 层面的校验和预览，
  // 实际的业务操作应通过应用层服务调用 IPC 交给主进程处理

  /**
   * 检查是否可以完成任务（UI 校验）
   */
  canComplete(): { canComplete: boolean; reason?: string } {
    if (this._lifecycle.status === "completed") {
      return { canComplete: false, reason: "任务已完成" };
    }
    if (this._lifecycle.status === "cancelled") {
      return { canComplete: false, reason: "任务已取消" };
    }
    return { canComplete: true };
  }

  /**
   * 检查是否可以开始任务（UI 校验）
   */
  canStart(): { canStart: boolean; reason?: string } {
    if (this._lifecycle.status !== "pending") {
      return { canStart: false, reason: `任务状态为 ${this._lifecycle.status}，无法开始` };
    }
    return { canStart: true };
  }

  /**
   * 检查是否可以取消任务（UI 校验）
   */
  canCancel(): { canCancel: boolean; reason?: string } {
    if (this._lifecycle.status === "completed") {
      return { canCancel: false, reason: "已完成的任务无法取消" };
    }
    if (this._lifecycle.status === "cancelled") {
      return { canCancel: false, reason: "任务已取消" };
    }
    return { canCancel: true };
  }

  /**
   * 检查是否可以重新安排任务（UI 校验）
   */
  canReschedule(): { canReschedule: boolean; reason?: string } {
    if (this._lifecycle.status === "completed") {
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
    if (this._lifecycle.status !== "completed") {
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
            actualDuration: this._lifecycle.startedAt ? "根据开始时间计算" : undefined
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
  validateRescheduleTime(newScheduledTime: Date): {
    valid: boolean;
    reason?: string;
  } {
    if (!this.canReschedule().canReschedule) {
      return { valid: false, reason: this.canReschedule().reason };
    }

    if (this._timeConfig.maxDelayDays) {
      const maxAllowedTime = addDays(
        this._timeConfig.scheduledTime,
        this._timeConfig.maxDelayDays
      );
      if (newScheduledTime.getTime() > maxAllowedTime.getTime()) {
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
  getNextReminder(): { alertId: string; scheduledTime: Date } | null {
    if (!this._reminderStatus.enabled) return null;

    const pendingAlerts = this._reminderStatus.alerts
      .filter(
        (alert) => alert.status === "pending" || alert.status === "snoozed"
      )
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    if (pendingAlerts.length > 0) {
      return {
        alertId: pendingAlerts[0].uuid,
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
      uuid: string;
      title: string;
      description?: string;
      timeConfig: TaskTimeConfig;
      metadata: {
        category: string;
        tags: string[];
        estimatedDuration?: number;
        importance?: ImportanceLevel;
        urgency?: UrgencyLevel;
        location?: string;
      };
      keyResultLinks?: KeyResultLink[];
      reminderConfig: TaskReminderConfig;
      schedulingPolicy?: ITaskTemplate['schedulingPolicy'];
    },
    scheduledTime: Date,
    endTime?: Date
  ): TaskInstance {
    return new TaskInstance({
      uuid: instanceId,
      templateUuid: template.uuid,
      title: template.title,
      scheduledTime,
      importance: template.metadata.importance || ImportanceLevel.Moderate,
      urgency: template.metadata.urgency || UrgencyLevel.Medium,
      description: template.description,
      keyResultLinks: template.keyResultLinks,
      category: template.metadata.category,
      tags: template.metadata.tags,
      estimatedDuration: template.metadata.estimatedDuration,
      location: template.metadata.location,
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
    });
  }

  /**
   * 从 DTO 创建 TaskInstance 实例（用于反序列化）
   * 从序列化数据、持久化数据或IPC传输的数据恢复领域对象
   */
  static fromDTO(data: ITaskInstanceDTO): TaskInstance {
    const instance = new TaskInstance({
      uuid: data.uuid,
      templateUuid: data.templateId,
      title: data.title,
      scheduledTime: new Date(data.timeConfig.scheduledTime),
      importance: data.metadata.importance,
      urgency: data.metadata.urgency,
      description: data.description,
      keyResultLinks: data.keyResultLinks,
      category: data.metadata.category,
      tags: data.metadata.tags,
      estimatedDuration: data.metadata.estimatedDuration,
      location: data.metadata.location,
      timeConfig: {
        type: data.timeConfig.type,
        scheduledTime: new Date(data.timeConfig.scheduledTime),
        endTime: data.timeConfig.endTime ? new Date(data.timeConfig.endTime) : undefined,
        estimatedDuration: data.timeConfig.estimatedDuration,
        timezone: data.timeConfig.timezone,
        allowReschedule: data.timeConfig.allowReschedule === 1,
        maxDelayDays: data.timeConfig.maxDelayDays,
      },
      reminderAlerts: data.reminderStatus.alerts.map(alert => ({
        uuid: alert.alertConfig.uuid,
        timing: {
          type: alert.alertConfig.timing.type,
          minutesBefore: alert.alertConfig.timing.minutesBefore,
          absoluteTime: alert.alertConfig.timing.absoluteTime ? new Date(alert.alertConfig.timing.absoluteTime) : undefined,
        },
        type: alert.alertConfig.type,
        message: alert.alertConfig.message,
      })),
    });

    // 恢复生命周期状态
    instance._lifecycle = {
      status: data.lifecycle.status,
      createdAt: new Date(data.lifecycle.createdAt),
      updatedAt: new Date(data.lifecycle.updatedAt),
      startedAt: data.lifecycle.startedAt ? new Date(data.lifecycle.startedAt) : undefined,
      completedAt: data.lifecycle.completedAt ? new Date(data.lifecycle.completedAt) : undefined,
      cancelledAt: data.lifecycle.cancelledAt ? new Date(data.lifecycle.cancelledAt) : undefined,
      events: data.lifecycle.events.map(event => ({
        type: event.type,
        timestamp: new Date(event.timestamp),
        alertId: event.alertId,
        details: event.details,
      })),
    };

    // 恢复提醒状态
    instance._reminderStatus = {
      enabled: data.reminderStatus.enabled === 1,
      alerts: data.reminderStatus.alerts.map(alert => ({
        uuid: alert.uuid,
        alertConfig: {
          uuid: alert.alertConfig.uuid,
          timing: {
            type: alert.alertConfig.timing.type,
            minutesBefore: alert.alertConfig.timing.minutesBefore,
            absoluteTime: alert.alertConfig.timing.absoluteTime ? new Date(alert.alertConfig.timing.absoluteTime) : undefined,
          },
          type: alert.alertConfig.type,
          message: alert.alertConfig.message,
        },
        status: alert.status,
        scheduledTime: new Date(alert.scheduledTime),
        triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : undefined,
        dismissedAt: alert.dismissedAt ? new Date(alert.dismissedAt) : undefined,
        snoozeHistory: alert.snoozeHistory.map(snooze => ({
          snoozedAt: new Date(snooze.snoozedAt),
          snoozeUntil: new Date(snooze.snoozeUntil),
          reason: snooze.reason,
        })),
      })),
      globalSnoozeCount: data.reminderStatus.globalSnoozeCount,
      lastTriggeredAt: data.reminderStatus.lastTriggeredAt ? new Date(data.reminderStatus.lastTriggeredAt) : undefined,
    };

    // 恢复元数据
    instance._metadata = data.metadata;

    // 恢复版本号
    instance._version = data.version;

    return instance;
  }

  /**
   * 克隆实例（用于创建副本）
   */
  clone(): TaskInstance {
    return TaskInstance.fromDTO(this.toDTO());
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): ITaskInstanceDTO {
    return {
      uuid: this.uuid,
      templateId: this._templateUuid,
      title: this._title,
      description: this._description,
      timeConfig: {
        type: this._timeConfig.type,
        scheduledTime: this._timeConfig.scheduledTime.getTime(),
        endTime: this._timeConfig.endTime?.getTime(),
        estimatedDuration: this._timeConfig.estimatedDuration,
        timezone: this._timeConfig.timezone,
        allowReschedule: this._timeConfig.allowReschedule ? 1 : 0,
        maxDelayDays: this._timeConfig.maxDelayDays,
      },
      reminderStatus: {
        enabled: this._reminderStatus.enabled ? 1 : 0,
        alerts: this._reminderStatus.alerts.map((alert) => ({
          uuid: alert.uuid,
          alertConfig: {
            uuid: alert.alertConfig.uuid,
            timing: {
              type: alert.alertConfig.timing.type,
              minutesBefore: alert.alertConfig.timing.minutesBefore,
              absoluteTime: alert.alertConfig.timing.absoluteTime?.getTime(),
            },
            type: alert.alertConfig.type,
            message: alert.alertConfig.message,
          },
          status: alert.status,
          scheduledTime: alert.scheduledTime.getTime(),
          triggeredAt: alert.triggeredAt?.getTime(),
          dismissedAt: alert.dismissedAt?.getTime(),
          snoozeHistory: alert.snoozeHistory.map((snooze) => ({
            snoozedAt: snooze.snoozedAt.getTime(),
            snoozeUntil: snooze.snoozeUntil.getTime(),
            reason: snooze.reason,
          })),
        })),
        globalSnoozeCount: this._reminderStatus.globalSnoozeCount,
        lastTriggeredAt: this._reminderStatus.lastTriggeredAt?.getTime(),
      },
      lifecycle: {
        status: this._lifecycle.status,
        createdAt: this._lifecycle.createdAt.getTime(),
        updatedAt: this._lifecycle.updatedAt.getTime(),
        startedAt: this._lifecycle.startedAt?.getTime(),
        completedAt: this._lifecycle.completedAt?.getTime(),
        cancelledAt: this._lifecycle.cancelledAt?.getTime(),
        events: this._lifecycle.events.map((event) => ({
          type: event.type,
          timestamp: event.timestamp.getTime(),
          alertId: event.alertId,
          details: event.details,
        })),
      },
      metadata: this._metadata,
      version: this._version,
    };
  }


  static isTaskInstance(obj: any): obj is TaskInstance {
    return obj instanceof TaskInstance;
  }
}
