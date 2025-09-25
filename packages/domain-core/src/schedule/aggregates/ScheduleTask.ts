/**
 * ScheduleTask 聚合根
 * @description Schedule模块的核心聚合根，管理调度任务的完整生命周期
 * @author DailyUse Team
 * @date 2025-01-09
 */

import {
  ScheduleStatus,
  ScheduleTaskType,
  SchedulePriority,
  AlertMethod,
} from '@dailyuse/contracts';

import type {
  IScheduleTask,
  IScheduleTaskPayload,
  IAlertConfig,
  IRecurrenceRule,
  IScheduleExecutionResult,
} from '@dailyuse/contracts';

/**
 * ScheduleTask 聚合根
 * 负责管理调度任务的整个生命周期，包括：
 * 1. 任务调度和执行
 * 2. 提醒触发和处理
 * 3. 状态管理和事件发布
 * 4. 重试和错误处理
 */
export class ScheduleTask {
  private _uuid: string;
  private _name: string;
  private _description?: string;
  private _taskType: ScheduleTaskType;
  private _payload: IScheduleTaskPayload;
  private _scheduledTime: Date;
  private _recurrence?: IRecurrenceRule;
  private _priority: SchedulePriority;
  private _status: ScheduleStatus;
  private _alertConfig: IAlertConfig;
  private _createdBy: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _nextExecutionTime?: Date;
  private _executionCount: number;
  private _maxRetries: number;
  private _currentRetries: number;
  private _timeoutSeconds?: number;
  private _tags?: string[];
  private _enabled: boolean;
  private _executionHistory: IScheduleExecutionResult[] = [];

  // 领域事件集合
  private _domainEvents: any[] = [];

  constructor(data: IScheduleTask) {
    this._uuid = data.uuid;
    this._name = data.name;
    this._description = data.description;
    this._taskType = data.taskType;
    this._payload = data.payload;
    this._scheduledTime = new Date(data.scheduledTime);
    this._recurrence = data.recurrence;
    this._priority = data.priority;
    this._status = data.status;
    this._alertConfig = data.alertConfig;
    this._createdBy = data.createdBy;
    this._createdAt = new Date(data.createdAt);
    this._updatedAt = new Date(data.updatedAt);
    this._nextExecutionTime = data.nextExecutionTime ? new Date(data.nextExecutionTime) : undefined;
    this._executionCount = data.executionCount;
    this._maxRetries = data.maxRetries;
    this._currentRetries = data.currentRetries;
    this._timeoutSeconds = data.timeoutSeconds;
    this._tags = data.tags;
    this._enabled = data.enabled;
  }

  // ========== Getters ==========
  get uuid(): string {
    return this._uuid;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }
  get taskType(): ScheduleTaskType {
    return this._taskType;
  }
  get payload(): IScheduleTaskPayload {
    return this._payload;
  }
  get scheduledTime(): Date {
    return this._scheduledTime;
  }
  get recurrence(): IRecurrenceRule | undefined {
    return this._recurrence;
  }
  get priority(): SchedulePriority {
    return this._priority;
  }
  get status(): ScheduleStatus {
    return this._status;
  }
  get alertConfig(): IAlertConfig {
    return this._alertConfig;
  }
  get createdBy(): string {
    return this._createdBy;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get nextExecutionTime(): Date | undefined {
    return this._nextExecutionTime;
  }
  get executionCount(): number {
    return this._executionCount;
  }
  get maxRetries(): number {
    return this._maxRetries;
  }
  get currentRetries(): number {
    return this._currentRetries;
  }
  get timeoutSeconds(): number | undefined {
    return this._timeoutSeconds;
  }
  get tags(): string[] | undefined {
    return this._tags;
  }
  get enabled(): boolean {
    return this._enabled;
  }
  get executionHistory(): IScheduleExecutionResult[] {
    return [...this._executionHistory];
  }
  get domainEvents(): any[] {
    return [...this._domainEvents];
  }

  // ========== 核心业务方法 ==========

  /**
   * 启动任务调度
   * 根据调度时间和重复规则设置任务状态
   */
  startScheduling(): void {
    if (!this._enabled) {
      throw new Error('无法启动已禁用的调度任务');
    }

    if (this._status !== ScheduleStatus.PENDING) {
      throw new Error(`任务状态 ${this._status} 无法启动调度`);
    }

    // 计算下次执行时间
    this.calculateNextExecutionTime();

    // 更新状态
    this.updateStatus(ScheduleStatus.PENDING);

    // 发布任务调度启动事件
    this.addDomainEvent('ScheduleTaskStarted', {
      taskUuid: this._uuid,
      scheduledTime: this._scheduledTime,
      nextExecutionTime: this._nextExecutionTime,
      taskType: this._taskType,
    });
  }

  /**
   * 执行任务
   * 触发实际的任务执行逻辑
   */
  execute(): void {
    if (this._status !== ScheduleStatus.PENDING) {
      throw new Error(`任务状态 ${this._status} 无法执行`);
    }

    // 更新状态为运行中
    this.updateStatus(ScheduleStatus.RUNNING);

    // 记录执行开始
    const executionStartTime = new Date();

    // 发布任务执行开始事件
    this.addDomainEvent('ScheduleTaskExecutionStarted', {
      taskUuid: this._uuid,
      executedAt: executionStartTime,
      taskType: this._taskType,
      priority: this._priority,
      payload: this._payload,
    });

    // 触发提醒处理
    this.triggerReminder();
  }

  /**
   * 完成任务执行
   * 处理任务执行完成后的状态更新和重复调度
   */
  completeExecution(result?: any, error?: string): void {
    const executionEndTime = new Date();
    const duration = executionEndTime.getTime() - this._updatedAt.getTime();

    // 创建执行结果
    const executionResult: IScheduleExecutionResult = {
      taskUuid: this._uuid,
      executedAt: executionEndTime,
      status: error ? ScheduleStatus.FAILED : ScheduleStatus.COMPLETED,
      result,
      error,
      duration,
      nextExecutionTime: this.calculateNextExecutionTime(),
    };

    // 添加到执行历史
    this._executionHistory.push(executionResult);
    this._executionCount++;

    if (error) {
      this.handleExecutionFailure(error);
    } else {
      this.handleExecutionSuccess(result);
    }

    // 更新时间戳
    this._updatedAt = executionEndTime;
  }

  /**
   * 处理执行成功
   */
  private handleExecutionSuccess(result?: any): void {
    // 重置重试计数
    this._currentRetries = 0;

    // 检查是否需要重复执行
    if (this._recurrence && this.shouldScheduleNext()) {
      this.updateStatus(ScheduleStatus.PENDING);
      this.calculateNextExecutionTime();

      // 发布重复任务调度事件
      this.addDomainEvent('ScheduleTaskRescheduled', {
        taskUuid: this._uuid,
        nextExecutionTime: this._nextExecutionTime,
        executionCount: this._executionCount,
      });
    } else {
      this.updateStatus(ScheduleStatus.COMPLETED);

      // 发布任务完成事件
      this.addDomainEvent('ScheduleTaskCompleted', {
        taskUuid: this._uuid,
        completedAt: new Date(),
        executionCount: this._executionCount,
        result,
      });
    }
  }

  /**
   * 处理执行失败
   */
  private handleExecutionFailure(error: string): void {
    this._currentRetries++;

    if (this._currentRetries < this._maxRetries) {
      // 还可以重试
      this.updateStatus(ScheduleStatus.PENDING);
      this.calculateRetryTime();

      // 发布重试事件
      this.addDomainEvent('ScheduleTaskRetry', {
        taskUuid: this._uuid,
        retryCount: this._currentRetries,
        maxRetries: this._maxRetries,
        nextRetryTime: this._nextExecutionTime,
        error,
      });
    } else {
      // 超过最大重试次数，标记为失败
      this.updateStatus(ScheduleStatus.FAILED);

      // 发布失败事件
      this.addDomainEvent('ScheduleTaskFailed', {
        taskUuid: this._uuid,
        failedAt: new Date(),
        error,
        retryCount: this._currentRetries,
      });
    }
  }

  /**
   * 触发提醒
   * 根据AlertConfig配置触发相应的提醒方式
   */
  private triggerReminder(): void {
    const reminderData = {
      taskUuid: this._uuid,
      title: this._name,
      message: this._description || '',
      alertMethods: this._alertConfig.methods,
      priority: this._priority,
      scheduledTime: this._scheduledTime,
      actualTime: new Date(),
      payload: this._payload,
      alertConfig: this._alertConfig,
    };

    // 发布提醒触发事件
    this.addDomainEvent('ReminderTriggered', reminderData);

    // 根据任务类型发布特定事件
    switch (this._taskType) {
      case ScheduleTaskType.TASK_REMINDER:
        this.addDomainEvent('TaskReminderTriggered', reminderData);
        break;
      case ScheduleTaskType.GOAL_REMINDER:
        this.addDomainEvent('GoalReminderTriggered', reminderData);
        break;
      case ScheduleTaskType.GENERAL_REMINDER:
        this.addDomainEvent('GeneralReminderTriggered', reminderData);
        break;
    }
  }

  /**
   * 延后提醒
   * 用户可以选择延后提醒
   */
  snoozeReminder(delayMinutes: number): void {
    if (this._status !== ScheduleStatus.RUNNING) {
      throw new Error('只有正在运行的任务可以延后');
    }

    const newExecutionTime = new Date();
    newExecutionTime.setMinutes(newExecutionTime.getMinutes() + delayMinutes);

    this._nextExecutionTime = newExecutionTime;
    this.updateStatus(ScheduleStatus.PENDING);

    // 发布延后事件
    this.addDomainEvent('ReminderSnoozed', {
      taskUuid: this._uuid,
      delayMinutes,
      newExecutionTime: this._nextExecutionTime,
      snoozedAt: new Date(),
    });
  }

  /**
   * 确认提醒
   * 用户确认收到提醒，完成当次执行
   */
  acknowledgeReminder(): void {
    if (this._status !== ScheduleStatus.RUNNING) {
      throw new Error('只有正在运行的任务可以确认');
    }

    this.completeExecution('acknowledged');

    // 发布确认事件
    this.addDomainEvent('ReminderAcknowledged', {
      taskUuid: this._uuid,
      acknowledgedAt: new Date(),
    });
  }

  /**
   * 忽略提醒
   * 用户选择忽略这次提醒
   */
  dismissReminder(): void {
    if (this._status !== ScheduleStatus.RUNNING) {
      throw new Error('只有正在运行的任务可以忽略');
    }

    this.completeExecution('dismissed');

    // 发布忽略事件
    this.addDomainEvent('ReminderDismissed', {
      taskUuid: this._uuid,
      dismissedAt: new Date(),
    });
  }

  /**
   * 取消任务
   * 取消整个调度任务
   */
  cancel(): void {
    if (this._status === ScheduleStatus.COMPLETED || this._status === ScheduleStatus.CANCELLED) {
      throw new Error('已完成或已取消的任务无法再次取消');
    }

    this.updateStatus(ScheduleStatus.CANCELLED);

    // 发布取消事件
    this.addDomainEvent('ScheduleTaskCancelled', {
      taskUuid: this._uuid,
      cancelledAt: new Date(),
      previousStatus: this._status,
    });
  }

  /**
   * 暂停任务
   */
  pause(): void {
    if (this._status !== ScheduleStatus.PENDING) {
      throw new Error('只有待执行的任务可以暂停');
    }

    this.updateStatus(ScheduleStatus.PAUSED);

    // 发布暂停事件
    this.addDomainEvent('ScheduleTaskPaused', {
      taskUuid: this._uuid,
      pausedAt: new Date(),
    });
  }

  /**
   * 恢复任务
   */
  resume(): void {
    if (this._status !== ScheduleStatus.PAUSED) {
      throw new Error('只有暂停的任务可以恢复');
    }

    this.updateStatus(ScheduleStatus.PENDING);

    // 发布恢复事件
    this.addDomainEvent('ScheduleTaskResumed', {
      taskUuid: this._uuid,
      resumedAt: new Date(),
    });
  }

  /**
   * 更新调度时间
   * 重新设置任务的执行时间
   */
  reschedule(newScheduledTime: Date): void {
    if (this._status === ScheduleStatus.COMPLETED || this._status === ScheduleStatus.CANCELLED) {
      throw new Error('已完成或已取消的任务无法重新调度');
    }

    const oldScheduledTime = this._scheduledTime;
    this._scheduledTime = new Date(newScheduledTime);
    this.calculateNextExecutionTime();
    this._updatedAt = new Date();

    // 发布重新调度事件
    this.addDomainEvent('ScheduleTaskRescheduled', {
      taskUuid: this._uuid,
      oldScheduledTime,
      newScheduledTime: this._scheduledTime,
      nextExecutionTime: this._nextExecutionTime,
    });
  }

  /**
   * 更新提醒配置
   */
  updateAlertConfig(newAlertConfig: IAlertConfig): void {
    const oldAlertConfig = this._alertConfig;
    this._alertConfig = { ...newAlertConfig };
    this._updatedAt = new Date();

    // 发布配置更新事件
    this.addDomainEvent('ScheduleTaskAlertConfigUpdated', {
      taskUuid: this._uuid,
      oldAlertConfig,
      newAlertConfig: this._alertConfig,
    });
  }

  // ========== 私有辅助方法 ==========

  /**
   * 更新任务状态
   */
  private updateStatus(newStatus: ScheduleStatus): void {
    const oldStatus = this._status;
    this._status = newStatus;
    this._updatedAt = new Date();

    // 发布状态变更事件
    this.addDomainEvent('ScheduleTaskStatusChanged', {
      taskUuid: this._uuid,
      oldStatus,
      newStatus,
      changedAt: this._updatedAt,
    });
  }

  /**
   * 计算下次执行时间
   */
  private calculateNextExecutionTime(): Date | undefined {
    if (!this._recurrence) {
      this._nextExecutionTime = undefined;
      return undefined;
    }

    // 根据重复规则计算下次执行时间
    // 这里简化实现，实际应该根据recurrence规则计算
    const nextTime = new Date(this._scheduledTime);

    switch (this._recurrence.type) {
      case 'DAILY':
        nextTime.setDate(nextTime.getDate() + this._recurrence.interval);
        break;
      case 'WEEKLY':
        nextTime.setDate(nextTime.getDate() + this._recurrence.interval * 7);
        break;
      case 'MONTHLY':
        nextTime.setMonth(nextTime.getMonth() + this._recurrence.interval);
        break;
      case 'YEARLY':
        nextTime.setFullYear(nextTime.getFullYear() + this._recurrence.interval);
        break;
      default:
        this._nextExecutionTime = undefined;
        return undefined;
    }

    this._nextExecutionTime = nextTime;
    return nextTime;
  }

  /**
   * 计算重试时间
   */
  private calculateRetryTime(): void {
    // 指数退避重试策略
    const baseDelay = 60; // 1分钟
    const retryDelay = baseDelay * Math.pow(2, this._currentRetries - 1);

    const retryTime = new Date();
    retryTime.setSeconds(retryTime.getSeconds() + retryDelay);

    this._nextExecutionTime = retryTime;
  }

  /**
   * 检查是否应该调度下次执行
   */
  private shouldScheduleNext(): boolean {
    if (!this._recurrence) return false;

    // 检查结束日期
    if (this._recurrence.endDate && new Date() >= this._recurrence.endDate) {
      return false;
    }

    // 检查最大执行次数
    if (
      this._recurrence.maxOccurrences &&
      this._executionCount >= this._recurrence.maxOccurrences
    ) {
      return false;
    }

    return true;
  }

  /**
   * 添加领域事件
   */
  private addDomainEvent(eventType: string, eventData: any): void {
    this._domainEvents.push({
      type: eventType,
      data: eventData,
      timestamp: new Date(),
      aggregateId: this._uuid,
    });
  }

  /**
   * 清空领域事件
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // ========== 静态工厂方法 ==========

  /**
   * 创建新的调度任务
   */
  static create(params: {
    name: string;
    taskType: ScheduleTaskType;
    payload: IScheduleTaskPayload;
    scheduledTime: Date;
    createdBy: string;
    description?: string;
    recurrence?: IRecurrenceRule;
    priority?: SchedulePriority;
    alertConfig?: IAlertConfig;
    maxRetries?: number;
    timeoutSeconds?: number;
    tags?: string[];
  }): ScheduleTask {
    const taskData: IScheduleTask = {
      uuid: crypto.randomUUID(),
      name: params.name,
      description: params.description,
      taskType: params.taskType,
      payload: params.payload,
      scheduledTime: params.scheduledTime,
      recurrence: params.recurrence,
      priority: params.priority || SchedulePriority.NORMAL,
      status: ScheduleStatus.PENDING,
      alertConfig: params.alertConfig || {
        methods: [AlertMethod.POPUP],
        allowSnooze: true,
        snoozeOptions: [5, 10, 15, 30],
      },
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      maxRetries: params.maxRetries || 3,
      currentRetries: 0,
      timeoutSeconds: params.timeoutSeconds,
      tags: params.tags,
      enabled: true,
    };

    const task = new ScheduleTask(taskData);

    // 发布任务创建事件
    task.addDomainEvent('ScheduleTaskCreated', {
      taskUuid: task.uuid,
      taskType: task.taskType,
      scheduledTime: task.scheduledTime,
      createdBy: task.createdBy,
    });

    return task;
  }

  /**
   * 从DTO创建任务实例
   */
  static fromDTO(dto: IScheduleTask): ScheduleTask {
    return new ScheduleTask(dto);
  }

  /**
   * 转换为DTO
   */
  toDTO(): IScheduleTask {
    return {
      uuid: this._uuid,
      name: this._name,
      description: this._description,
      taskType: this._taskType,
      payload: this._payload,
      scheduledTime: this._scheduledTime,
      recurrence: this._recurrence,
      priority: this._priority,
      status: this._status,
      alertConfig: this._alertConfig,
      createdBy: this._createdBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      nextExecutionTime: this._nextExecutionTime,
      executionCount: this._executionCount,
      maxRetries: this._maxRetries,
      currentRetries: this._currentRetries,
      timeoutSeconds: this._timeoutSeconds,
      tags: this._tags,
      enabled: this._enabled,
    };
  }
}
