import { AggregateRoot } from "@common/shared/domain/aggregateRoot";
import { DateTime } from '@/shared/types/myDateTime';

import type { TaskCompletedEvent, TaskUndoCompletedEvent } from '../events/taskEvents';

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
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";

export class TaskInstance extends AggregateRoot implements ITaskInstance {
  private _templateUuid: string;
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
    uuid: string,
    templateId: string,
    title: string,
    scheduledTime: DateTime,
    priority: 1 | 2 | 3 | 4 | 5,
    options?: {
      description?: string;
      timeConfig?: Partial<TaskInstanceTimeConfig>;
      estimatedDuration?: number;
      keyResultLinks?: KeyResultLink[];
      reminderAlerts?: TaskReminderConfig["alerts"];
      category?: string;
      tags?: string[];
      location?: string;
      difficulty?: 1 | 2 | 3 | 4 | 5;
    }
  ) {
    super(uuid);
    const now = TimeUtils.now();

    this._templateUuid = templateId;
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
          uuid: alert.uuid,
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
          alertId: alert.uuid,
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

  // Business methods

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim() === "") {
      throw new Error("Title cannot be empty");
    }
    if (this._status !== "pending" && this._status !== "inProgress") {
      throw new Error(`Cannot update title in status: ${this._status}`);
    }
    this._title = newTitle;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._lifecycle.events.push({
      type: "task_title_updated",
      timestamp: this._lifecycle.updatedAt,
      details: { newTitle },
    });
  }

  updateDescription(newDescription: string): void {
    if (this._status !== "pending" && this._status !== "inProgress") {
      throw new Error(`Cannot update description in status: ${this._status}`);
    }
    this._description = newDescription;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._lifecycle.events.push({
      type: "reminder_scheduled",
      timestamp: this._lifecycle.updatedAt,
      details: { newDescription },
    });
  }

  updateTimeConfig(
    newTimeConfig: Partial<TaskInstanceTimeConfig>
  ): void {
    if (this._status === "completed" || this._status === "cancelled")
      throw new Error("Cannot update time config for completed or cancelled tasks");
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
    this._lifecycle.updatedAt = TimeUtils.now();
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
    if (this._status === "completed" || this._status === "cancelled") {
      throw new Error("Cannot update reminders for completed or cancelled tasks");
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

    this._lifecycle.updatedAt = TimeUtils.now();
    this._lifecycle.events.push({
      type: "task_rescheduled",
      timestamp: this._lifecycle.updatedAt,
      details: { enabled, alerts },
    });
  }

  start(): void {
    if (this._status !== "pending") {
      throw new Error(`Cannot start task in status: ${this._status}`);
    }

    const now = TimeUtils.now();
    this._status = "inProgress";
    this._actualStartTime = now;
    this._lifecycle.startedAt = now;
    this._lifecycle.updatedAt = now;

    this._lifecycle.events.push({
      type: "task_started",
      timestamp: now,
    });
  }

  pending(): void {
    if (this._status !== "inProgress") {
      throw new Error(`Cannot set task to pending in status: ${this._status}`);
    }
    const now = TimeUtils.now();
    this._status = "pending";
    this._actualStartTime = undefined;
    this._lifecycle.startedAt = undefined;
    this._lifecycle.updatedAt = now;
    this._lifecycle.events.push({
      type: "task_rescheduled",
      timestamp: now,
    });
  }

  complete(accountUuid: string): void {
    if (this._status !== "inProgress" && this._status !== "pending") {
      throw new Error(`Cannot complete task in status: ${this._status}`);
    }

    const now = TimeUtils.now();
    this._status = "completed";
    this._completedAt = now;
    this._actualEndTime = now;
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
    
    

    // Calculate actual duration if start time exists
    if (this._actualStartTime) {
      this._metadata.actualDuration = Math.round(
        (now.timestamp - this._actualStartTime.timestamp) / (1000 * 60)
      );
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
    if (this._status === "completed") {
      throw new Error("Cannot cancel completed task");
    }

    const now = TimeUtils.now();
    this._status = "cancelled";
    this._lifecycle.cancelledAt = now;
    this._lifecycle.updatedAt = now;

    this._lifecycle.events.push({
      type: "task_cancelled",
      timestamp: now,
    });
  }

  markOverdue(): void {
    if (this._status === "pending") {
      this._status = "overdue";
      this._lifecycle.updatedAt = TimeUtils.now();
    }
  }

  reschedule(newScheduledTime: DateTime, newEndTime?: DateTime): void {
    if (this._status === "completed") {
      throw new Error("Cannot reschedule completed task");
    }

    if (!this._timeConfig.allowReschedule) {
      throw new Error("This task instance does not allow rescheduling");
    }

    const oldTime = this._timeConfig.scheduledTime;
    
    // 检查延期限制
    if (this._timeConfig.maxDelayDays) {
      const maxAllowedTime = TimeUtils.addDays(oldTime, this._timeConfig.maxDelayDays);
      if (newScheduledTime.timestamp > maxAllowedTime.timestamp) {
        throw new Error(`Cannot reschedule beyond ${this._timeConfig.maxDelayDays} days`);
      }
    }

    // 更新时间配置
    this._timeConfig = {
      ...this._timeConfig,
      scheduledTime: newScheduledTime,
      endTime: newEndTime || this._timeConfig.endTime
    };
    
    // Reset overdue status if rescheduled
    if (this._status === "overdue") {
      this._status = "pending";
    }

    const now = TimeUtils.now();
    this._lifecycle.updatedAt = now;
    
    this._lifecycle.events.push({
      type: "task_rescheduled",
      timestamp: now,
      details: { 
        oldTime: oldTime.isoString, 
        newTime: newScheduledTime.isoString,
        oldEndTime: this._timeConfig.endTime?.isoString,
        newEndTime: newEndTime?.isoString
      }
    });

    // 重新计算提醒时间
    this._reminderStatus.alerts.forEach(alert => {
      if (alert.status === "pending") {
        alert.scheduledTime = this.calculateReminderTime(alert.alertConfig, newScheduledTime);
      }
    });
  }

  // 提醒相关方法
  triggerReminder(alertId: string): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (alert && alert.status === "pending") {
      const now = TimeUtils.now();
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

  snoozeReminder(
    alertId: string,
    snoozeUntil: DateTime,
    reason?: string
  ): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (alert && (alert.status === "triggered" || alert.status === "snoozed")) {
      const now = TimeUtils.now();

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
        details: { snoozeUntil: snoozeUntil.isoString, reason },
      });

      this._lifecycle.updatedAt = now;
    }
  }

  dismissReminder(alertId: string): void {
    const alert = this._reminderStatus.alerts.find((a) => a.uuid === alertId);
    if (alert && (alert.status === "triggered" || alert.status === "snoozed")) {
      const now = TimeUtils.now();
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
    const now = TimeUtils.now();

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
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  // 获取下一个待触发的提醒
  getNextReminder(): { alertId: string; scheduledTime: DateTime } | null {
    if (!this._reminderStatus.enabled) return null;

    const pendingAlerts = this._reminderStatus.alerts
      .filter(
        (alert) => alert.status === "pending" || alert.status === "snoozed"
      )
      .sort((a, b) => a.scheduledTime.timestamp - b.scheduledTime.timestamp);

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
    if (this._status !== "completed") {
      throw new Error(`Cannot undo completion for task in status: ${this._status}`);
    }

    const now = TimeUtils.now();
    this._status = "inProgress";
    this._completedAt = undefined;
    this._actualEndTime = undefined;
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
        }
      }
      this.addDomainEvent(event);
    }
  }

  // ✅ 添加重置为特定状态的方法
  resetToStatus(status: "pending" | "inProgress", reason?: string): void {
    if (this._status === "completed" || this._status === "cancelled") {
      const now = TimeUtils.now();
      const previousStatus = this._status;
      
      this._status = status;
      this._lifecycle.updatedAt = now;
      
      if (status === "pending") {
        this._completedAt = undefined;
        this._actualEndTime = undefined;
        this._metadata.actualDuration = undefined;
        this._lifecycle.completedAt = undefined;
      }

      this._lifecycle.events.push({
        type: "task_rescheduled",
        timestamp: now,
        details: {
          previousStatus,
          newStatus: status,
          reason
        },
      });
    } else {
      throw new Error(`Cannot reset task from status: ${this._status}`);
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
      template.uuid,
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
      data.uuid || data._id,
      data.templateId || data._templateUuid,
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
          uuid: alert.uuid,
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
   * 从JSON数据创建 TaskInstance 实例（标准反序列化方法）
   * 用于从序列化数据、持久化数据或IPC传输的数据恢复领域对象
   */
  static fromJSON(data: any): TaskInstance {
    return TaskInstance.fromCompleteData(data);
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
      uuid: this.uuid,
      templateId: this._templateUuid,
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
