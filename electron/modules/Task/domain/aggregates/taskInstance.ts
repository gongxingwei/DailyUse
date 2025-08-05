import { AggregateRoot } from "@common/shared/domain/aggregateRoot";

import {
  TaskCompletedEvent,
  TaskUndoCompletedEvent,
} from "../events/taskEvents";

import {
  KeyResultLink,
  ITaskInstance,
  ITaskTemplate,
  TaskTimeConfig,
  TaskInstanceReminderStatus,
  TaskInstanceLifecycleEvent,
  TaskReminderConfig,
  TaskInstanceTimeConfig,
  ITaskInstanceDTO,
} from "@common/modules/task/types/task";
import { ImportanceLevel } from "@common/shared/types/importance";
import { UrgencyLevel } from "@common/shared/types/urgency";
import { addDays } from "date-fns/addDays";
import { ensureDate } from "@common/shared/utils/dateUtils";

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
    super(params.uuid || AggregateRoot.generateId());
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

  set timeConfig(value: TaskInstanceTimeConfig) {
    this._timeConfig = value;
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

  // Business methods

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim() === "") {
      throw new Error("Title cannot be empty");
    }
    if (this._lifecycle.status !== "pending" && this._lifecycle.status !== "inProgress") {
      throw new Error(`Cannot update title in status: ${this._lifecycle.status}`);
    }
    this._title = newTitle;
    this._lifecycle.updatedAt = new Date();
    this._lifecycle.events.push({
      type: "task_title_updated",
      timestamp: this._lifecycle.updatedAt,
      details: { newTitle },
    });
  }

  updateDescription(newDescription: string): void {
    if (this._lifecycle.status !== "pending" && this._lifecycle.status !== "inProgress") {
      throw new Error(`Cannot update description in status: ${this._lifecycle.status}`);
    }
    this._description = newDescription;
    this._lifecycle.updatedAt = new Date();
    this._lifecycle.events.push({
      type: "reminder_scheduled",
      timestamp: this._lifecycle.updatedAt,
      details: { newDescription },
    });
  }

  updateConfig(newTimeConfig: Partial<TaskInstanceTimeConfig>): void {
    if (this._lifecycle.status === "completed" || this._lifecycle.status === "cancelled")
      throw new Error(
        "Cannot update time config for completed or cancelled tasks"
      );
    if (!this._timeConfig.allowReschedule) {
      throw new Error("This task instance does not allow rescheduling");
    }
    if (newTimeConfig.scheduledTime) {
      this._timeConfig.scheduledTime = newTimeConfig.scheduledTime;
    }
    if (newTimeConfig.endTime) {
      this._timeConfig.endTime = newTimeConfig.endTime;
    }
    if (newTimeConfig.estimatedDuration !== undefined) {
      this._timeConfig.estimatedDuration = newTimeConfig.estimatedDuration;
    }
    if (newTimeConfig.type) {
      this._timeConfig.type = newTimeConfig.type;
    }
    if (newTimeConfig.timezone) {
      this._timeConfig.timezone = newTimeConfig.timezone;
    }
    if (newTimeConfig.allowReschedule !== undefined) {
      this._timeConfig.allowReschedule = newTimeConfig.allowReschedule;
    }
    if (newTimeConfig.maxDelayDays !== undefined) {
      this._timeConfig.maxDelayDays = newTimeConfig.maxDelayDays;
    }
    this._lifecycle.updatedAt = new Date();
    this._lifecycle.events.push({
      type: "reminder_scheduled",
      timestamp: this._lifecycle.updatedAt,
      details: { newTimeConfig },
    });
  }

  updateReminderStatus(
    enabled: boolean,
    alerts?: TaskReminderConfig["alerts"]
  ): void {
    if (this._lifecycle.status === "completed" || this._lifecycle.status === "cancelled") {
      throw new Error(
        "Cannot update reminders for completed or cancelled tasks"
      );
    }

    this._reminderStatus.enabled = enabled;

    if (alerts) {
      this._reminderStatus.alerts = alerts.map((alert) => ({
        uuid: alert.uuid,
        alertConfig: alert,
        status: "pending",
        scheduledTime: this.calculateReminderTime(alert, this.scheduledTime),
        snoozeHistory: [],
      }));
    }

    this._lifecycle.updatedAt = new Date();
    this._lifecycle.events.push({
      type: "task_rescheduled",
      timestamp: this._lifecycle.updatedAt,
      details: { enabled, alerts },
    });
  }


  complete(accountUuid: string): void {
    if (this._lifecycle.status !== "inProgress" && this._lifecycle.status !== "pending") {
      throw new Error(`Cannot complete task in status: ${this._lifecycle.status}`);
    }

    const now = new Date();
    this._lifecycle.status = "completed";
    this._lifecycle.completedAt = now;
    this._lifecycle.updatedAt = now;

    if (this._keyResultLinks?.length) {
      const event: TaskCompletedEvent = {
        eventType: "TaskCompleted",
        aggregateId: this._uuid,
        occurredOn: new Date(),
        payload: {
          accountUuid,
          taskId: this._uuid,
          keyResultLinks: this._keyResultLinks,
          completedAt: new Date(),
        },
      };
      this.addDomainEvent(event);
      console.log(`发布事件: ${event.eventType}`);
    }

    this._lifecycle.events.push({
      type: "task_completed",
      timestamp: now,
      details: {
        actualDuration: this._metadata.actualDuration,
      },
    });
  }

  cancel(): void {
    if (this._lifecycle.status === "completed") {
      throw new Error("Cannot cancel completed task");
    }

    const now = new Date();
    this._lifecycle.status = "cancelled";
    this._lifecycle.cancelledAt = now;
    this._lifecycle.updatedAt = now;

    this._lifecycle.events.push({
      type: "task_cancelled",
      timestamp: now,
    });
  }

  markOverdue(): void {
    if (this._lifecycle.status === "pending") {
      this._lifecycle.status = "overdue";
      this._lifecycle.updatedAt = new Date();
    }
  }

  reschedule(newScheduledTime: Date, newEndTime?: Date): void {
    if (this._lifecycle.status === "completed") {
      throw new Error("Cannot reschedule completed task");
    }

    if (!this._timeConfig.allowReschedule) {
      throw new Error("This task instance does not allow rescheduling");
    }

    const oldTime = this._timeConfig.scheduledTime;

    // 检查延期限制
    if (this._timeConfig.maxDelayDays) {
      const maxAllowedTime = addDays(oldTime, this._timeConfig.maxDelayDays);
      if (newScheduledTime.getTime() > maxAllowedTime.getTime()) {
        throw new Error(
          `Cannot reschedule beyond ${this._timeConfig.maxDelayDays} days`
        );
      }
    }

    // 更新时间配置
    this._timeConfig = {
      ...this._timeConfig,
      scheduledTime: newScheduledTime,
      endTime: newEndTime || this._timeConfig.endTime,
    };

    // Reset overdue status if rescheduled
    if (this._lifecycle.status === "overdue") {
      this._lifecycle.status = "pending";
    }

    const now = new Date();
    this._lifecycle.updatedAt = now;

    this._lifecycle.events.push({
      type: "task_rescheduled",
      timestamp: now,
      details: {
        oldTime: oldTime.toISOString(),
        newTime: newScheduledTime.toISOString(),
        oldEndTime: this._timeConfig.endTime?.toISOString(),
        newEndTime: newEndTime?.toISOString(),
      },
    });

    // 重新计算提醒时间
    this._reminderStatus.alerts.forEach((alert) => {
      if (alert.status === "pending") {
        alert.scheduledTime = this.calculateReminderTime(
          alert.alertConfig,
          newScheduledTime
        );
      }
    });
  }

  // 提醒相关方法
  triggerReminder(alertId: string): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (alert && alert.status === "pending") {
      const now = new Date();
      alert.status = "triggered";
      alert.triggeredAt = now;
      this._reminderStatus.lastTriggeredAt = now;

      this._lifecycle.events.push({
        type: "reminder_triggered",
        timestamp: now,
        alertId,
        details: { alertType: alert.alertConfig.type },
      });

      this._lifecycle.updatedAt = now;
    }
  }

  snoozeReminder(alertId: string, snoozeUntil: Date, reason?: string): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (alert && (alert.status === "triggered" || alert.status === "snoozed")) {
      const now = new Date();

      alert.status = "snoozed";
      alert.scheduledTime = snoozeUntil;
      alert.snoozeHistory.push({
        snoozedAt: now,
        snoozeUntil,
        reason,
      });

      this._reminderStatus.globalSnoozeCount++;

      this._lifecycle.events.push({
        type: "reminder_snoozed",
        timestamp: now,
        alertId,
        details: { snoozeUntil: snoozeUntil.toISOString(), reason },
      });

      this._lifecycle.updatedAt = now;
    }
  }

  dismissReminder(alertId: string): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (alert && (alert.status === "triggered" || alert.status === "snoozed")) {
      const now = new Date();
      alert.status = "dismissed";
      alert.dismissedAt = now;

      this._lifecycle.events.push({
        type: "reminder_dismissed",
        timestamp: now,
        alertId,
      });

      this._lifecycle.updatedAt = now;
    }
  }

  disableReminders(): void {
    this._reminderStatus.enabled = false;
    const now = new Date();

    // 取消所有待定的提醒
    this._reminderStatus.alerts.forEach((alert) => {
      if (alert.status === "pending" || alert.status === "snoozed") {
        this._lifecycle.events.push({
          type: "reminder_cancelled",
          timestamp: now,
          alertId: alert.uuid,
        });
      }
    });

    this._lifecycle.updatedAt = now;
  }

  enableReminders(): void {
    this._reminderStatus.enabled = true;
    this._lifecycle.updatedAt = new Date();
  }

  // 获取下一个待触发的提醒
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

  // 获取提醒统计
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

  undoComplete(accountUuid: string): void {
    if (this._lifecycle.status !== "completed") {
      throw new Error(
        `Cannot undo completion for task in status: ${this._lifecycle.status}`
      );
    }

    const now = new Date();
    this._lifecycle.status = "inProgress";
    this._metadata.actualDuration = undefined;
    this._lifecycle.completedAt = undefined;
    this._lifecycle.updatedAt = now;
    this._lifecycle.events.push({
      type: "task_undo",
      timestamp: now,
      details: {
        previousStatus: "completed",
        newStatus: "inProgress",
      },
    });

    if (this._keyResultLinks?.length) {
      const event: TaskUndoCompletedEvent = {
        eventType: "TaskUndoCompleted",
        aggregateId: this._uuid,
        occurredOn: new Date(),
        payload: {
          accountUuid,
          taskId: this._uuid,
          keyResultLinks: this._keyResultLinks,
          undoAt: new Date(),
        },
      };
      this.addDomainEvent(event);
    }
  }

  // ✅ 添加重置为特定状态的方法
  resetToStatus(status: "pending" | "inProgress", reason?: string): void {
    if (this._lifecycle.status === "completed" || this._lifecycle.status === "cancelled") {
      const now = new Date();
      const previousStatus = this._lifecycle.status;

      this._lifecycle.status = status;
      this._lifecycle.updatedAt = now;

      if (status === "pending") {
        this._metadata.actualDuration = undefined;
        this._lifecycle.completedAt = undefined;
      }

      this._lifecycle.events.push({
        type: "task_rescheduled",
        timestamp: now,
        details: {
          previousStatus,
          newStatus: status,
          reason,
        },
      });
    } else {
      throw new Error(`Cannot reset task from status: ${this._lifecycle.status}`);
    }
  }
  // Factory method for creating from template
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
        importance: ImportanceLevel;
        urgency: UrgencyLevel;
        location?: string;
      };
      keyResultLinks?: KeyResultLink[];
      reminderConfig: TaskReminderConfig;
      schedulingPolicy?: ITaskTemplate["schedulingPolicy"];
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
        maxDelayDays: template.schedulingPolicy?.maxDelayDays || 3,
      },
    });
  }



  // ============= 数据辅助方法 =============

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

  static isTaskInstance(obj: any): obj is TaskInstance {
    return obj instanceof TaskInstance;
  }
}
