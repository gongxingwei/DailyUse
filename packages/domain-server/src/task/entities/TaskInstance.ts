import { TaskInstanceCore } from '@dailyuse/domain-core';
import { TaskContracts, sharedContracts } from '@dailyuse/contracts';

type ImportanceLevel = sharedContracts.ImportanceLevel;
type UrgencyLevel = sharedContracts.UrgencyLevel;
const ImportanceLevel = sharedContracts.ImportanceLevel;
const UrgencyLevel = sharedContracts.UrgencyLevel;

/**
 * 任务实例聚合根 - 服务端实现
 */
export class TaskInstance extends TaskInstanceCore {
  /**
   * 从 DTO 创建任务实例
   */
  static fromDTO(dto: TaskContracts.TaskInstanceDTO): TaskInstance {
    const instance = new TaskInstance({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      timeConfig: {
        timeType: dto.timeConfig.timeType,
        scheduledDate: new Date(dto.timeConfig.scheduledDate),
        startTime: dto.timeConfig.startTime,
        endTime: dto.timeConfig.endTime,
        estimatedDuration: dto.timeConfig.estimatedDuration,
        timezone: dto.timeConfig.timezone,
      },
      properties: dto.properties,
      goalLinks: dto.goalLinks,
      createdAt: new Date(dto.lifecycle.createdAt),
    });

    // 恢复状态
    instance._reminderStatus = {
      enabled: dto.reminderStatus.enabled,
      status: dto.reminderStatus.status,
      scheduledTime: dto.reminderStatus.scheduledTime
        ? new Date(dto.reminderStatus.scheduledTime)
        : undefined,
      triggeredAt: dto.reminderStatus.triggeredAt
        ? new Date(dto.reminderStatus.triggeredAt)
        : undefined,
      snoozeCount: dto.reminderStatus.snoozeCount,
      snoozeUntil: dto.reminderStatus.snoozeUntil
        ? new Date(dto.reminderStatus.snoozeUntil)
        : undefined,
    };

    instance._execution = {
      status: dto.execution.status,
      actualStartTime: dto.execution.actualStartTime
        ? new Date(dto.execution.actualStartTime)
        : undefined,
      actualEndTime: dto.execution.actualEndTime
        ? new Date(dto.execution.actualEndTime)
        : undefined,
      actualDuration: dto.execution.actualDuration,
      progressPercentage: dto.execution.progressPercentage,
      notes: dto.execution.notes,
    };

    instance._lifecycle = {
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      events: dto.lifecycle.events.map((event) => ({
        type: event.type,
        timestamp: new Date(event.timestamp),
        note: event.note,
      })),
    };

    return instance;
  }

  /**
   * 创建新的任务实例
   */
  static create(params: {
    templateUuid: string;
    accountUuid: string;
    title: string;
    description?: string;
    timeConfig: {
      timeType: TaskContracts.TaskTimeType;
      scheduledDate: Date;
      startTime?: string;
      endTime?: string;
      estimatedDuration?: number;
      timezone: string;
    };
    properties?: {
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      location?: string;
      tags: string[];
    };
    goalLinks?: TaskContracts.KeyResultLink[];
  }): TaskInstance {
    const taskInstance = new TaskInstance(params);

    return taskInstance;
  }

  /**
   * 开始任务
   */
  start(): void {
    if (this._execution.status !== 'pending') {
      throw new Error('只有待执行状态的任务才能开始');
    }

    this._execution.status = 'inProgress';
    this._execution.actualStartTime = new Date();
    this.addLifecycleEvent('started');
  }

  /**
   * 暂停任务
   */
  pause(): void {
    if (this._execution.status !== 'inProgress') {
      throw new Error('只有进行中的任务才能暂停');
    }

    this._execution.status = 'pending';
    this.addLifecycleEvent('paused');
  }

  /**
   * 恢复任务
   */
  resume(): void {
    if (this._execution.status !== 'pending' || !this._execution.actualStartTime) {
      throw new Error('只有暂停的任务才能恢复');
    }

    this._execution.status = 'inProgress';
    this.addLifecycleEvent('resumed');
  }

  /**
   * 完成任务
   */
  complete(): void {
    if (this._execution.status === 'completed') {
      throw new Error('任务已经完成');
    }

    const now = new Date();
    this._execution.status = 'completed';
    this._execution.actualEndTime = now;
    this._execution.progressPercentage = 100;

    // 计算实际耗时
    if (this._execution.actualStartTime) {
      this._execution.actualDuration = Math.floor(
        (now.getTime() - this._execution.actualStartTime.getTime()) / (1000 * 60),
      );
    }

    this.addLifecycleEvent('completed');
  }

  /**
   * 取消完成状态
   */
  undoComplete(): void {
    if (this._execution.status !== 'completed') {
      throw new Error('只有已完成的任务才能取消完成');
    }

    this._execution.status = 'inProgress';
    this._execution.actualEndTime = undefined;
    this._execution.progressPercentage = 80; // 恢复到接近完成的状态
    this.addLifecycleEvent('resumed', '取消完成状态');
  }

  /**
   * 取消任务
   */
  cancel(): void {
    if (this._execution.status === 'cancelled') {
      throw new Error('任务已经取消');
    }
    if (this._execution.status === 'completed') {
      throw new Error('已完成的任务不能取消');
    }

    this._execution.status = 'cancelled';
    this.addLifecycleEvent('cancelled');
  }

  /**
   * 重新调度任务
   */
  reschedule(newDate: Date, newStartTime?: string, newEndTime?: string): void {
    if (this._execution.status === 'completed' || this._execution.status === 'cancelled') {
      throw new Error('已完成或已取消的任务不能重新调度');
    }

    const oldScheduledDate = this._timeConfig.scheduledDate;
    const oldStartTime = this._timeConfig.startTime;

    this._timeConfig.scheduledDate = newDate;
    if (newStartTime !== undefined) {
      this._timeConfig.startTime = newStartTime;
    }
    if (newEndTime !== undefined) {
      this._timeConfig.endTime = newEndTime;
    }

    // 重置提醒状态
    this._reminderStatus.status = 'pending';
    this._reminderStatus.triggeredAt = undefined;
    this._reminderStatus.snoozeCount = 0;
    this._reminderStatus.snoozeUntil = undefined;

    this.addLifecycleEvent(
      'rescheduled',
      `从 ${oldScheduledDate.toLocaleDateString()} 调整到 ${newDate.toLocaleDateString()}`,
    );
  }

  /**
   * 更新进度
   */
  updateProgress(percentage: number, notes?: string): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('进度百分比必须在 0-100 之间');
    }

    const oldProgress = this._execution.progressPercentage;
    this._execution.progressPercentage = percentage;
    if (notes) {
      this._execution.notes = notes;
    }
    this.updateVersion();
  }

  /**
   * 标记为逾期
   */
  markAsOverdue(): void {
    if (this._execution.status === 'completed' || this._execution.status === 'cancelled') {
      return; // 已完成或已取消的任务不标记逾期
    }

    if (this._execution.status === 'overdue') {
      return; // 已经逾期
    }

    this._execution.status = 'overdue';
    this.updateVersion();
  }

  /**
   * 转换为 DTO
   */
  toDTO(): TaskContracts.TaskInstanceDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      timeConfig: {
        timeType: this._timeConfig.timeType,
        scheduledDate: this._timeConfig.scheduledDate.toISOString(),
        startTime: this._timeConfig.startTime,
        endTime: this._timeConfig.endTime,
        estimatedDuration: this._timeConfig.estimatedDuration,
        timezone: this._timeConfig.timezone,
      },
      reminderStatus: {
        enabled: this._reminderStatus.enabled,
        status: this._reminderStatus.status,
        scheduledTime: this._reminderStatus.scheduledTime?.toISOString(),
        triggeredAt: this._reminderStatus.triggeredAt?.toISOString(),
        snoozeCount: this._reminderStatus.snoozeCount,
        snoozeUntil: this._reminderStatus.snoozeUntil?.toISOString(),
      },
      execution: {
        status: this._execution.status,
        actualStartTime: this._execution.actualStartTime?.toISOString(),
        actualEndTime: this._execution.actualEndTime?.toISOString(),
        actualDuration: this._execution.actualDuration,
        progressPercentage: this._execution.progressPercentage,
        notes: this._execution.notes,
      },
      properties: this._properties,
      lifecycle: {
        createdAt: this._lifecycle.createdAt.toISOString(),
        updatedAt: this._lifecycle.updatedAt.toISOString(),
        events: this._lifecycle.events.map((event) => ({
          type: event.type,
          timestamp: event.timestamp.toISOString(),
          note: event.note,
        })),
      },
      goalLinks: this._goalLinks,
    };
  }

  /**
   * 转换为持久化 DTO（扁平化格式）
   */
  toPersistence(accountUuid: string): TaskContracts.TaskInstancePersistenceDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      accountUuid,

      title: this._title,
      description: this._description,

      timeType: this._timeConfig.timeType,
      scheduledDate: this._timeConfig.scheduledDate,
      startTime: this._timeConfig.startTime,
      endTime: this._timeConfig.endTime,
      estimatedDuration: this._timeConfig.estimatedDuration,
      timezone: this._timeConfig.timezone,

      reminderEnabled: this._reminderStatus.enabled,
      reminderStatus: this._reminderStatus.status as TaskContracts.ReminderStatus,
      reminderScheduledTime: this._reminderStatus.scheduledTime,
      reminderTriggeredAt: this._reminderStatus.triggeredAt,
      reminderSnoozeCount: this._reminderStatus.snoozeCount,
      reminderSnoozeUntil: this._reminderStatus.snoozeUntil,

      executionStatus: this._execution.status as TaskContracts.TaskInstanceStatus,
      actualStartTime: this._execution.actualStartTime,
      actualEndTime: this._execution.actualEndTime,
      actualDuration: this._execution.actualDuration,
      progressPercentage: this._execution.progressPercentage,
      executionNotes: this._execution.notes,

      importance: this._properties.importance,
      urgency: this._properties.urgency,
      location: this._properties.location,
      tags: JSON.stringify(this._properties.tags || []),

      goalLinks: JSON.stringify(this._goalLinks || []),

      lifecycleEvents: JSON.stringify(
        this._lifecycle.events.map((event) => ({
          type: event.type,
          timestamp: event.timestamp.toISOString(),
          note: event.note,
        })),
      ),

      createdAt: this._lifecycle.createdAt,
      updatedAt: this._lifecycle.updatedAt,
    };
  }

  static fromPersistence(data: TaskContracts.TaskInstancePersistenceDTO): TaskInstance {
    const safeJsonParse = <T>(jsonString: string | T | null | undefined, defaultValue: T): T => {
      if (typeof jsonString === 'object' && jsonString !== null) return jsonString as T;
      if (!jsonString || (typeof jsonString === 'string' && jsonString.trim() === ''))
        return defaultValue;
      try {
        const parsed = JSON.parse(jsonString as string);
        return parsed !== null && parsed !== undefined ? parsed : defaultValue;
      } catch (error) {
        console.warn(`Failed to parse JSON: ${jsonString}`);
        return defaultValue;
      }
    };

    const instance = new TaskInstance({
      uuid: data.uuid,
      templateUuid: data.templateUuid,
      accountUuid: data.accountUuid,
      title: data.title,
      description: data.description,
      timeConfig: {
        timeType: data.timeType,
        scheduledDate:
          data.scheduledDate instanceof Date ? data.scheduledDate : new Date(data.scheduledDate),
        startTime: data.startTime,
        endTime: data.endTime,
        estimatedDuration: data.estimatedDuration,
        timezone: data.timezone,
      },
      properties: {
        importance: data.importance,
        urgency: data.urgency,
        location: data.location,
        tags: safeJsonParse(data.tags, []),
      },
      goalLinks: safeJsonParse(data.goalLinks, []),
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
    });

    instance._reminderStatus = {
      enabled: data.reminderEnabled,
      status: data.reminderStatus as 'pending' | 'triggered' | 'dismissed' | 'snoozed',
      scheduledTime: data.reminderScheduledTime
        ? data.reminderScheduledTime instanceof Date
          ? data.reminderScheduledTime
          : new Date(data.reminderScheduledTime)
        : undefined,
      triggeredAt: data.reminderTriggeredAt
        ? data.reminderTriggeredAt instanceof Date
          ? data.reminderTriggeredAt
          : new Date(data.reminderTriggeredAt)
        : undefined,
      snoozeCount: data.reminderSnoozeCount,
      snoozeUntil: data.reminderSnoozeUntil
        ? data.reminderSnoozeUntil instanceof Date
          ? data.reminderSnoozeUntil
          : new Date(data.reminderSnoozeUntil)
        : undefined,
    };

    instance._execution = {
      status: data.executionStatus,
      actualStartTime: data.actualStartTime
        ? data.actualStartTime instanceof Date
          ? data.actualStartTime
          : new Date(data.actualStartTime)
        : undefined,
      actualEndTime: data.actualEndTime
        ? data.actualEndTime instanceof Date
          ? data.actualEndTime
          : new Date(data.actualEndTime)
        : undefined,
      actualDuration: data.actualDuration,
      progressPercentage: data.progressPercentage,
      notes: data.executionNotes,
    };

    const events = safeJsonParse<Array<{ type: string; timestamp: string | Date; note?: string }>>(
      data.lifecycleEvents,
      [],
    );
    instance._lifecycle = {
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      events: events.map((event) => ({
        type: event.type as
          | 'created'
          | 'started'
          | 'paused'
          | 'resumed'
          | 'rescheduled'
          | 'completed'
          | 'cancelled',
        timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp),
        note: event.note,
      })),
    };

    return instance;
  }

  /**
   * 转换为客户端 DTO（包含所有计算属性）
   */
  toClient(): TaskContracts.TaskInstanceClientDTO {
    const baseDTO = this.toDTO();
    const now = new Date();

    // 状态文本和颜色
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待执行', color: '#9E9E9E' },
      inProgress: { text: '进行中', color: '#2196F3' },
      completed: { text: '已完成', color: '#4CAF50' },
      cancelled: { text: '已取消', color: '#F44336' },
    };
    const statusInfo = statusMap[this._execution.status] || { text: '未知', color: '#000000' };

    // 优先级文本和颜色
    const importanceMap: Record<string, { text: string; color: string }> = {
      Low: { text: '低', color: '#4CAF50' },
      Moderate: { text: '中', color: '#FF9800' },
      High: { text: '高', color: '#F44336' },
      Critical: { text: '紧急', color: '#9C27B0' },
    };
    const priorityInfo = importanceMap[this._properties.importance] || {
      text: '中',
      color: '#FF9800',
    };

    // 时间计算
    const scheduledDate = this._timeConfig.scheduledDate;
    const isOverdue = scheduledDate < now && !this.isCompleted && !this.isCancelled;
    const daysUntilDue = Math.ceil(
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      ...baseDTO,
      displayTitle: `${statusInfo.text} - ${this._title}`,
      statusText: statusInfo.text,
      statusColor: statusInfo.color,
      priorityText: priorityInfo.text,
      priorityColor: priorityInfo.color,
      canStart: this._execution.status === 'pending',
      canComplete: this._execution.status === 'inProgress',
      canCancel: !this.isCompleted && !this.isCancelled,
      canReschedule: !this.isCompleted && !this.isCancelled,
      canEdit: !this.isCompleted && !this.isCancelled,
      canDelete: false,
      isOverdue,
      remainingTime: daysUntilDue > 0 ? `还剩${daysUntilDue}天` : isOverdue ? '已逾期' : '今天',
      formattedScheduledTime: scheduledDate.toLocaleString(),
      formattedStartTime: this._execution.actualStartTime?.toLocaleString() || null,
      formattedCompletedTime: this._execution.actualEndTime?.toLocaleString() || null,
      formattedCancelledTime: null,
      executionDurationMinutes: this._execution.actualDuration
        ? Math.round(this._execution.actualDuration / 60)
        : null,
      executionDurationText: this._execution.actualDuration
        ? `用时${Math.round(this._execution.actualDuration / 60)}分钟`
        : null,
      progressPercentageText: `${this._execution.progressPercentage || 0}%`,
      executionSummary: this.isCompleted
        ? '已完成'
        : this.isCancelled
          ? '已取消'
          : this._execution.status === 'inProgress'
            ? '进行中'
            : '待执行',
      isToday: scheduledDate.toDateString() === now.toDateString(),
      isThisWeek: false, // TODO: 实现
      isThisMonth: false, // TODO: 实现
      hasReminder: this._reminderStatus.enabled,
      nextReminderTime: this._reminderStatus.scheduledTime?.toLocaleString() || null,
      needsImmediateReminder: false, // TODO: 实现
    };
  }
}
