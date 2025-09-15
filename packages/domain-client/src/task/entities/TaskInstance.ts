import { TaskInstanceCore } from '@dailyuse/domain-core';
import type { TaskContracts } from '@dailyuse/contracts';
import type { ITaskInstance } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

/**
 * 任务实例实体 - 客户端实现
 * 作为聚合根TaskTemplate的子实体
 */
export class TaskInstance extends TaskInstanceCore {
  constructor(params: {
    uuid?: string;
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
    reminderStatus?: {
      enabled: boolean;
      status: 'pending' | 'triggered' | 'dismissed' | 'snoozed';
      scheduledTime?: Date;
      triggeredAt?: Date;
      snoozeCount: number;
      snoozeUntil?: Date;
    };
    execution?: {
      status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue';
      actualStartTime?: Date;
      actualEndTime?: Date;
      actualDuration?: number;
      progressPercentage: number;
      notes?: string;
    };
    properties?: {
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      location?: string;
      tags: string[];
    };
    lifecycle?: {
      createdAt: Date;
      updatedAt: Date;
      events: Array<{
        type:
          | 'created'
          | 'started'
          | 'paused'
          | 'resumed'
          | 'completed'
          | 'cancelled'
          | 'rescheduled';
        timestamp: Date;
        note?: string;
      }>;
    };
    goalLinks?: TaskContracts.KeyResultLink[];
  }) {
    super(params);

    // 设置额外的状态（如果有）
    if (params.reminderStatus) {
      (this as any)._reminderStatus = params.reminderStatus;
    }
    if (params.execution) {
      (this as any)._execution = params.execution;
    }
    if (params.lifecycle) {
      (this as any)._lifecycle = params.lifecycle;
    }
  }

  /**
   * 从 DTO 创建客户端任务实例
   */
  static fromDTO(dto: TaskContracts.TaskInstanceDTO): TaskInstance {
    return new TaskInstance({
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
      reminderStatus: {
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
      },
      execution: {
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
      },
      properties: dto.properties,
      lifecycle: {
        createdAt: new Date(dto.lifecycle.createdAt),
        updatedAt: new Date(dto.lifecycle.updatedAt),
        events: dto.lifecycle.events.map((event) => ({
          type: event.type,
          timestamp: new Date(event.timestamp),
          note: event.note,
        })),
      },
      goalLinks: dto.goalLinks,
    });
  }

  // ===== 客户端特有的计算属性 =====

  /**
   * 获取显示标题（限制长度）
   */
  get displayTitle(): string {
    return this.title.length > 50 ? `${this.title.substring(0, 47)}...` : this.title;
  }

  /**
   * 获取计划执行时间显示
   */
  get scheduledTimeText(): string {
    const date = this.timeConfig.scheduledDate.toLocaleDateString();
    const timeDisplay = this.formatTimeDisplay();
    return `${date} ${timeDisplay}`;
  }

  /**
   * 格式化时间显示
   */
  formatTimeDisplay(): string {
    switch (this.timeConfig.timeType) {
      case 'allDay':
        return '全天';
      case 'specificTime':
        return this.timeConfig.startTime || '未指定时间';
      case 'timeRange':
        return `${this.timeConfig.startTime || '00:00'} - ${this.timeConfig.endTime || '23:59'}`;
      default:
        return '未指定';
    }
  }

  /**
   * 获取进度显示文本
   */
  get progressText(): string {
    return `${this.execution.progressPercentage}%`;
  }

  /**
   * 获取剩余时间（如果有预估时长）
   */
  get remainingTimeText(): string {
    if (
      !this.timeConfig.estimatedDuration ||
      !this.execution.actualStartTime ||
      this.execution.status !== 'inProgress'
    ) {
      return '';
    }

    const elapsed = Math.floor(
      (Date.now() - this.execution.actualStartTime.getTime()) / (1000 * 60),
    );
    const remaining = this.timeConfig.estimatedDuration - elapsed;

    if (remaining <= 0) {
      return '已超时';
    }

    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;

    if (hours > 0) {
      return `剩余 ${hours}小时${minutes}分钟`;
    } else {
      return `剩余 ${minutes}分钟`;
    }
  }

  /**
   * 是否可以开始
   */
  get canStart(): boolean {
    return this.execution.status === 'pending';
  }

  /**
   * 是否可以暂停
   */
  get canPause(): boolean {
    return this.execution.status === 'inProgress';
  }

  /**
   * 是否可以恢复
   */
  get canResume(): boolean {
    return this.execution.status === 'pending' && Boolean(this.execution.actualStartTime);
  }

  /**
   * 是否可以完成
   */
  get canComplete(): boolean {
    const status = this.execution.status;
    return status !== 'completed' && status !== 'cancelled';
  }

  /**
   * 是否可以取消
   */
  get canCancel(): boolean {
    const status = this.execution.status;
    return status !== 'completed' && status !== 'cancelled';
  }

  /**
   * 是否可以重新调度
   */
  get canReschedule(): boolean {
    const status = this.execution.status;
    return status !== 'completed' && status !== 'cancelled';
  }

  // ===== 实现抽象方法 =====

  /**
   * 开始任务
   */
  start(): void {
    if (!this.canStart) {
      throw new Error('当前状态不能开始');
    }

    (this as any)._execution.status = 'inProgress';
    (this as any)._execution.actualStartTime = new Date();
    this.addLifecycleEvent('started', '任务已开始');
    this.updateVersion();
  }

  /**
   * 暂停任务
   */
  pause(): void {
    if (!this.canPause) {
      throw new Error('当前状态不能暂停');
    }

    (this as any)._execution.status = 'pending';
    this.addLifecycleEvent('paused', '任务已暂停');
    this.updateVersion();
  }

  /**
   * 恢复任务
   */
  resume(): void {
    if (!this.canResume) {
      throw new Error('当前状态不能恢复');
    }

    (this as any)._execution.status = 'inProgress';
    this.addLifecycleEvent('resumed', '任务已恢复');
    this.updateVersion();
  }

  /**
   * 完成任务
   */
  complete(): void {
    if (!this.canComplete) {
      throw new Error('当前状态不能完成');
    }

    const now = new Date();
    (this as any)._execution.status = 'completed';
    (this as any)._execution.actualEndTime = now;
    (this as any)._execution.progressPercentage = 100;

    // 计算实际耗时
    if (this.execution.actualStartTime) {
      (this as any)._execution.actualDuration = Math.floor(
        (now.getTime() - this.execution.actualStartTime.getTime()) / (1000 * 60),
      );
    }

    this.addLifecycleEvent('completed', '任务已完成');
    this.updateVersion();
  }

  /**
   * 取消任务
   */
  cancel(): void {
    if (!this.canCancel) {
      throw new Error('当前状态不能取消');
    }

    (this as any)._execution.status = 'cancelled';
    this.addLifecycleEvent('cancelled', '任务已取消');
    this.updateVersion();
  }

  /**
   * 重新调度任务
   */
  reschedule(newDate: Date, newStartTime?: string, newEndTime?: string): void {
    if (!this.canReschedule) {
      throw new Error('当前状态不能重新调度');
    }

    (this as any)._timeConfig.scheduledDate = newDate;
    if (newStartTime !== undefined) {
      (this as any)._timeConfig.startTime = newStartTime;
    }
    if (newEndTime !== undefined) {
      (this as any)._timeConfig.endTime = newEndTime;
    }

    this.addLifecycleEvent('rescheduled', '任务已重新调度');
    this.updateVersion();
  }

  /**
   * 更新任务进度
   */
  updateProgress(percentage: number, notes?: string): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('进度百分比必须在 0-100 之间');
    }

    (this as any)._execution.progressPercentage = percentage;
    if (notes) {
      (this as any)._execution.notes = notes;
    }

    this.updateVersion();
  }

  /**
   * 转换为 DTO
   */
  toDTO(): TaskContracts.TaskInstanceDTO {
    return {
      uuid: this.uuid,
      templateUuid: this.templateUuid,
      accountUuid: this.accountUuid,
      title: this.title,
      description: this.description,
      timeConfig: {
        timeType: this.timeConfig.timeType,
        scheduledDate: this.timeConfig.scheduledDate.toISOString(),
        startTime: this.timeConfig.startTime,
        endTime: this.timeConfig.endTime,
        estimatedDuration: this.timeConfig.estimatedDuration,
        timezone: this.timeConfig.timezone,
      },
      properties: {
        importance: this.properties.importance,
        urgency: this.properties.urgency,
        location: this.properties.location,
        tags: [...this.properties.tags],
      },
      goalLinks: this.goalLinks ? [...this.goalLinks] : [],
      reminderStatus: {
        enabled: this.reminderStatus.enabled,
        status: this.reminderStatus.status,
        scheduledTime: this.reminderStatus.scheduledTime?.toISOString(),
        triggeredAt: this.reminderStatus.triggeredAt?.toISOString(),
        snoozeCount: this.reminderStatus.snoozeCount,
        snoozeUntil: this.reminderStatus.snoozeUntil?.toISOString(),
      },
      execution: {
        status: this.execution.status,
        actualStartTime: this.execution.actualStartTime?.toISOString(),
        actualEndTime: this.execution.actualEndTime?.toISOString(),
        actualDuration: this.execution.actualDuration,
        progressPercentage: this.execution.progressPercentage,
        notes: this.execution.notes,
      },
      lifecycle: {
        createdAt: this.lifecycle.createdAt.toISOString(),
        updatedAt: this.lifecycle.updatedAt.toISOString(),
        events: this.lifecycle.events.map((event) => ({
          type: event.type,
          timestamp: event.timestamp.toISOString(),
          note: event.note,
        })),
      },
    };
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): TaskInstance {
    return TaskInstance.fromDTO(this.toDTO());
  }

  /**
   * 为创建新实例而创建工厂方法
   */
  static forCreate(params: {
    templateUuid: string;
    accountUuid: string;
    title: string;
    scheduledDate: Date;
    timeType?: TaskContracts.TaskTimeType;
    startTime?: string;
    endTime?: string;
  }): TaskInstance {
    const now = new Date();

    return new TaskInstance({
      uuid: '', // 将由后端生成
      templateUuid: params.templateUuid,
      accountUuid: params.accountUuid,
      title: params.title,
      description: '',
      timeConfig: {
        timeType: params.timeType || ('allDay' as TaskContracts.TaskTimeType),
        scheduledDate: params.scheduledDate,
        startTime: params.startTime,
        endTime: params.endTime,
        estimatedDuration: undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      properties: {
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
        location: undefined,
        tags: [],
      },
    });
  }
}
