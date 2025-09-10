import {
  TaskTemplateCore,
  TaskInstanceCore,
  TaskMetaTemplateCore,
} from '@dailyuse/domain-core';
import type {
  TaskContracts,
} from '@dailyuse/contracts';

/**
 * 任务实例客户端实现 - 添加客户端特有功能
 */
export class TaskInstanceClient extends TaskInstanceCore {
  /**
   * 从 DTO 创建客户端任务实例
   */
  static fromDTO(dto: TaskContracts.TaskInstanceDTO): TaskInstanceClient {
    const instance = new TaskInstanceClient({
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

    // 恢复状态 - 通过保护字段访问
    (instance as any)._reminderStatus = {
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

    (instance as any)._execution = {
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

    (instance as any)._lifecycle = {
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

  // ===== 客户端特有的计算属性 =====

  /**
   * 获取显示标题（限制长度）
   */
  get displayTitle(): string {
    return this._title.length > 50 ? `${this._title.substring(0, 47)}...` : this._title;
  }

  /**
   * 获取计划执行时间显示
   */
  get scheduledTimeText(): string {
    const date = this._timeConfig.scheduledDate.toLocaleDateString();
    const timeDisplay = this.formatTimeDisplay();
    return `${date} ${timeDisplay}`;
  }

  /**
   * 格式化时间显示
   */
  formatTimeDisplay(): string {
    switch (this._timeConfig.timeType) {
      case 'allDay':
        return '全天';
      case 'specificTime':
        return this._timeConfig.startTime || '未指定时间';
      case 'timeRange':
        return `${this._timeConfig.startTime || '00:00'} - ${this._timeConfig.endTime || '23:59'}`;
      default:
        return '未指定';
    }
  }

  /**
   * 获取进度显示文本
   */
  get progressText(): string {
    return `${(this as any)._execution.progressPercentage}%`;
  }

  /**
   * 获取剩余时间（如果有预估时长）
   */
  get remainingTimeText(): string {
    const execution = (this as any)._execution;
    if (
      !this._timeConfig.estimatedDuration ||
      !execution.actualStartTime ||
      execution.status !== 'inProgress'
    ) {
      return '';
    }

    const elapsed = Math.floor((Date.now() - execution.actualStartTime.getTime()) / (1000 * 60));
    const remaining = this._timeConfig.estimatedDuration - elapsed;

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
    return (this as any)._execution.status === 'pending';
  }

  /**
   * 是否可以暂停
   */
  get canPause(): boolean {
    return (this as any)._execution.status === 'inProgress';
  }

  /**
   * 是否可以恢复
   */
  get canResume(): boolean {
    return (
      (this as any)._execution.status === 'pending' && (this as any)._execution.actualStartTime
    );
  }

  /**
   * 是否可以完成
   */
  get canComplete(): boolean {
    const status = (this as any)._execution.status;
    return status !== 'completed' && status !== 'cancelled';
  }

  /**
   * 是否可以取消
   */
  get canCancel(): boolean {
    const status = (this as any)._execution.status;
    return status !== 'completed' && status !== 'cancelled';
  }

  /**
   * 是否可以重新调度
   */
  get canReschedule(): boolean {
    const status = (this as any)._execution.status;
    return status !== 'completed' && status !== 'cancelled';
  }

  // ===== 实现抽象方法 =====
  start(): void {
    if (!this.canStart) {
      throw new Error('当前状态不能开始');
    }
    (this as any)._execution.status = 'inProgress';
    (this as any)._execution.actualStartTime = new Date();
    this.updateVersion();
  }

  pause(): void {
    if (!this.canPause) {
      throw new Error('当前状态不能暂停');
    }
    (this as any)._execution.status = 'pending';
    this.updateVersion();
  }

  resume(): void {
    if (!this.canResume) {
      throw new Error('当前状态不能恢复');
    }
    (this as any)._execution.status = 'inProgress';
    this.updateVersion();
  }

  complete(): void {
    if (!this.canComplete) {
      throw new Error('当前状态不能完成');
    }
    const now = new Date();
    (this as any)._execution.status = 'completed';
    (this as any)._execution.actualEndTime = now;
    (this as any)._execution.progressPercentage = 100;

    // 计算实际耗时
    if ((this as any)._execution.actualStartTime) {
      (this as any)._execution.actualDuration = Math.floor(
        (now.getTime() - (this as any)._execution.actualStartTime.getTime()) / (1000 * 60),
      );
    }

    this.updateVersion();
  }

  cancel(): void {
    if (!this.canCancel) {
      throw new Error('当前状态不能取消');
    }
    (this as any)._execution.status = 'cancelled';
    this.updateVersion();
  }

  reschedule(newDate: Date, newStartTime?: string, newEndTime?: string): void {
    if (!this.canReschedule) {
      throw new Error('当前状态不能重新调度');
    }

    this._timeConfig.scheduledDate = newDate;
    if (newStartTime !== undefined) {
      this._timeConfig.startTime = newStartTime;
    }
    if (newEndTime !== undefined) {
      this._timeConfig.endTime = newEndTime;
    }

    this.updateVersion();
  }

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
}
