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
}
