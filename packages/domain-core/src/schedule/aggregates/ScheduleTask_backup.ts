import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleContracts } from '@dailyuse/contracts';
import type {
  IScheduleTask,
  IScheduleTaskBasic,
  IScheduleTaskScheduling,
  IScheduleTaskExecution,
  IScheduleTaskLifecycle,
  IScheduleTaskMetadata,
  IScheduleTaskPayload,
  IAlertConfig,
  IRecurrenceRule,
  IScheduleExecutionResult,
} from '@dailyuse/contracts';
import { ScheduleStatus, ScheduleTaskType, SchedulePriority } from '@dailyuse/contracts';

/**
 * ScheduleTask 核心基类 - 包含共享属性和基础计算
 * @description 抽象调度任务实体，定义调度任务的基础属性和核心方法
 */
export abstract class ScheduleTaskCore extends AggregateRoot implements IScheduleTask {
  protected _basic: IScheduleTaskBasic;
  protected _scheduling: IScheduleTaskScheduling;
  protected _execution: IScheduleTaskExecution;
  protected _alertConfig: IAlertConfig;
  protected _lifecycle: IScheduleTaskLifecycle;
  protected _metadata: IScheduleTaskMetadata;
  protected _executionHistory: IScheduleExecutionResult[] = [];
  protected _domainEvents: any[] = [];

  constructor(data: IScheduleTask) {
    super(data.uuid);

    this._basic = { ...data.basic };
    this._scheduling = { ...data.scheduling };
    this._execution = { ...data.execution };
    this._alertConfig = { ...data.alertConfig };
    this._lifecycle = { ...data.lifecycle };
    this._metadata = { ...data.metadata };
  }

  // ========== Getters ==========
  get uuid(): string {
    return this._uuid;
  }

  // Basic info getters
  get basic(): IScheduleTaskBasic {
    return { ...this._basic };
  }
  get name(): string {
    return this._basic.name;
  }
  get description(): string | undefined {
    return this._basic.description;
  }
  get taskType(): ScheduleTaskType {
    return this._basic.taskType;
  }
  get payload(): IScheduleTaskPayload {
    return this._basic.payload;
  }
  get createdBy(): string {
    return this._basic.createdBy;
  }

  // Scheduling info getters
  get scheduling(): IScheduleTaskScheduling {
    return { ...this._scheduling };
  }
  get scheduledTime(): Date {
    return this._scheduling.scheduledTime;
  }
  get recurrence(): IRecurrenceRule | undefined {
    return this._scheduling.recurrence;
  }
  get priority(): SchedulePriority {
    return this._scheduling.priority;
  }
  get status(): ScheduleStatus {
    return this._scheduling.status;
  }
  get nextExecutionTime(): Date | undefined {
    return this._scheduling.nextExecutionTime;
  }

  // Execution info getters
  get execution(): IScheduleTaskExecution {
    return { ...this._execution };
  }
  get executionCount(): number {
    return this._execution.executionCount;
  }
  get maxRetries(): number {
    return this._execution.maxRetries;
  }
  get currentRetries(): number {
    return this._execution.currentRetries;
  }
  get timeoutSeconds(): number | undefined {
    return this._execution.timeoutSeconds;
  }

  // Alert config getter
  get alertConfig(): IAlertConfig {
    return { ...this._alertConfig };
  }

  // Lifecycle getters
  get lifecycle(): IScheduleTaskLifecycle {
    return { ...this._lifecycle };
  }
  get createdAt(): Date {
    return this._lifecycle.createdAt;
  }
  get updatedAt(): Date {
    return this._lifecycle.updatedAt;
  }

  // Metadata getters
  get metadata(): IScheduleTaskMetadata {
    return { ...this._metadata };
  }
  get tags(): string[] | undefined {
    return this._metadata.tags;
  }
  get enabled(): boolean {
    return this._metadata.enabled;
  }
  get version(): number {
    return this._metadata.version || 1;
  }

  // History and events
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
    if (!this._metadata.enabled) {
      throw new Error('无法启动已禁用的调度任务');
    }

    if (this._scheduling.status !== ScheduleStatus.PENDING) {
      throw new Error(`任务状态 ${this._scheduling.status} 无法启动调度`);
    }

    // 计算下次执行时间
    this.calculateNextExecutionTime();

    // 更新状态
    this.updateStatus(ScheduleStatus.PENDING);

    // 发布任务调度启动事件
    this.addScheduleDomainEvent('ScheduleTaskStarted', {
      taskUuid: this._uuid,
      scheduledTime: this._scheduling.scheduledTime,
      nextExecutionTime: this._scheduling.nextExecutionTime,
      taskType: this._basic.taskType,
    });
  }

  /**
   * 执行任务
   * 触发实际的任务执行逻辑
   */
  execute(): void {
    if (this._scheduling.status !== ScheduleStatus.PENDING) {
      throw new Error(`任务状态 ${this._scheduling.status} 无法执行`);
    }

    // 更新状态为运行中
    this.updateStatus(ScheduleStatus.RUNNING);

    // 记录执行开始
    const executionStartTime = new Date();

    // 发布任务执行开始事件
    this.addDomainEvent({
      aggregateId: this._uuid,
      eventType: 'ScheduleTaskExecutionStarted',
      occurredOn: executionStartTime,
      payload: {
        taskUuid: this._uuid,
        executedAt: executionStartTime,
        taskType: this._basic.taskType,
        priority: this._scheduling.priority,
        taskPayload: this._basic.payload,
      }
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
    const duration = executionEndTime.getTime() - this._lifecycle.updatedAt.getTime();

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
    this._execution.executionCount++;

    if (error) {
      this.handleExecutionFailure(error);
    } else {
      this.handleExecutionSuccess(result);
    }

    // 更新时间戳
    this._lifecycle.updatedAt = executionEndTime;
  }

  /**
   * 处理执行成功
   */
  private handleExecutionSuccess(result?: any): void {
    // 重置重试计数
    this._execution.currentRetries = 0;

    // 检查是否需要重复执行
    if (this._scheduling.recurrence && this.shouldScheduleNext()) {
      this.updateStatus(ScheduleStatus.PENDING);
      this.calculateNextExecutionTime();

      // 发布重复任务调度事件
      this.addDomainEvent('ScheduleTaskRescheduled', {
        taskUuid: this._uuid,
        nextExecutionTime: this._scheduling.nextExecutionTime,
        executionCount: this._execution.executionCount,
      });
    } else {
      this.updateStatus(ScheduleStatus.COMPLETED);

      // 发布任务完成事件
      this.addDomainEvent({
        aggregateId: this._uuid,
        eventType: 'ScheduleTaskCompleted',
        occurredOn: new Date(),
        payload: {
          taskUuid: this._uuid,
          completedAt: new Date(),
          executionCount: this._execution.executionCount,
          result,
        }
      });
    }
  }

  /**
   * 处理执行失败
   */
  private handleExecutionFailure(error: string): void {
    this._execution.currentRetries++;

    if (this._execution.currentRetries < this._execution.maxRetries) {
      // 还可以重试
      this.updateStatus(ScheduleStatus.PENDING);
      this.calculateRetryTime();

      // 发布重试事件
      this.addDomainEvent({
        aggregateId: this._uuid,
        eventType: 'ScheduleTaskRetry',
        occurredOn: new Date(),
        payload: {
        taskUuid: this._uuid,
        retryCount: this._execution.currentRetries,
        maxRetries: this._execution.maxRetries,
        nextRetryTime: this._scheduling.nextExecutionTime,
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
        retryCount: this._execution.currentRetries,
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
      title: this._basic.name,
      message: this._basic.description || '',
      alertMethods: this._alertConfig.methods,
      priority: this._scheduling.priority,
      scheduledTime: this._scheduling.scheduledTime,
      actualTime: new Date(),
      payload: this._basic.payload,
      alertConfig: this._alertConfig,
    };

    // 发布提醒触发事件
    this.addDomainEvent('ReminderTriggered', reminderData);

    // 根据任务类型发布特定事件
    switch (this._basic.taskType) {
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
    if (this._scheduling.status !== ScheduleStatus.RUNNING) {
      throw new Error('只有正在运行的任务可以延后');
    }

    const newExecutionTime = new Date();
    newExecutionTime.setMinutes(newExecutionTime.getMinutes() + delayMinutes);

    this._scheduling.nextExecutionTime = newExecutionTime;
    this.updateStatus(ScheduleStatus.PENDING);

    // 发布延后事件
    this.addDomainEvent('ReminderSnoozed', {
      taskUuid: this._uuid,
      delayMinutes,
      newExecutionTime: this._scheduling.nextExecutionTime,
      snoozedAt: new Date(),
    });
  }

  /**
   * 确认提醒
   * 用户确认收到提醒，完成当次执行
   */
  acknowledgeReminder(): void {
    if (this._scheduling.status !== ScheduleStatus.RUNNING) {
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
    if (this._scheduling.status !== ScheduleStatus.RUNNING) {
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
    if (
      this._scheduling.status === ScheduleStatus.COMPLETED ||
      this._scheduling.status === ScheduleStatus.CANCELLED
    ) {
      throw new Error('已完成或已取消的任务无法再次取消');
    }

    const previousStatus = this._scheduling.status;
    this.updateStatus(ScheduleStatus.CANCELLED);

    // 发布取消事件
    this.addDomainEvent('ScheduleTaskCancelled', {
      taskUuid: this._uuid,
      cancelledAt: new Date(),
      previousStatus,
    });
  }

  /**
   * 暂停任务
   */
  pause(): void {
    if (this._scheduling.status !== ScheduleStatus.PENDING) {
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
    if (this._scheduling.status !== ScheduleStatus.PAUSED) {
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
    if (
      this._scheduling.status === ScheduleStatus.COMPLETED ||
      this._scheduling.status === ScheduleStatus.CANCELLED
    ) {
      throw new Error('已完成或已取消的任务无法重新调度');
    }

    const oldScheduledTime = this._scheduling.scheduledTime;
    this._scheduling.scheduledTime = new Date(newScheduledTime);
    this.calculateNextExecutionTime();
    this._lifecycle.updatedAt = new Date();

    // 发布重新调度事件
    this.addDomainEvent('ScheduleTaskRescheduled', {
      taskUuid: this._uuid,
      oldScheduledTime,
      newScheduledTime: this._scheduling.scheduledTime,
      nextExecutionTime: this._scheduling.nextExecutionTime,
    });
  }

  /**
   * 更新提醒配置
   */
  updateAlertConfig(newAlertConfig: IAlertConfig): void {
    const oldAlertConfig = this._alertConfig;
    this._alertConfig = { ...newAlertConfig };
    this._lifecycle.updatedAt = new Date();

    // 发布配置更新事件
    this.addDomainEvent('ScheduleTaskAlertConfigUpdated', {
      taskUuid: this._uuid,
      oldAlertConfig,
      newAlertConfig: this._alertConfig,
    });
  }

  // ========== 私有辅助方法 ==========

  /**
   * 获取默认告警配置
   */
  protected getDefaultAlertConfig(): IAlertConfig {
    return {
      methods: [],
      allowSnooze: true,
      snoozeOptions: [5, 10, 15, 30],
    };
  }

  /**
   * 更新任务状态
   */
  private updateStatus(newStatus: ScheduleStatus): void {
    const oldStatus = this._scheduling.status;
    this._scheduling.status = newStatus;
    this._lifecycle.updatedAt = new Date();

    // 发布状态变更事件
    this.addDomainEvent('ScheduleTaskStatusChanged', {
      taskUuid: this._uuid,
      oldStatus,
      newStatus,
      changedAt: this._lifecycle.updatedAt,
    });
  }

  /**
   * 计算下次执行时间
   */
  private calculateNextExecutionTime(): Date | undefined {
    if (!this._scheduling.recurrence) {
      this._scheduling.nextExecutionTime = undefined;
      return undefined;
    }

    // 根据重复规则计算下次执行时间
    // 这里简化实现，实际应该根据recurrence规则计算
    const nextTime = new Date(this._scheduling.scheduledTime);

    switch (this._scheduling.recurrence.type) {
      case 'DAILY':
        nextTime.setDate(nextTime.getDate() + (this._scheduling.recurrence.interval || 1));
        break;
      case 'WEEKLY':
        nextTime.setDate(nextTime.getDate() + (this._scheduling.recurrence.interval || 1) * 7);
        break;
      case 'MONTHLY':
        nextTime.setMonth(nextTime.getMonth() + (this._scheduling.recurrence.interval || 1));
        break;
      case 'YEARLY':
        nextTime.setFullYear(nextTime.getFullYear() + (this._scheduling.recurrence.interval || 1));
        break;
      default:
        this._scheduling.nextExecutionTime = undefined;
        return undefined;
    }

    this._scheduling.nextExecutionTime = nextTime;
    return nextTime;
  }

  /**
   * 计算重试时间
   */
  private calculateRetryTime(): void {
    // 指数退避重试策略
    const baseDelay = 60; // 1分钟
    const retryDelay = baseDelay * Math.pow(2, this._execution.currentRetries - 1);

    const retryTime = new Date();
    retryTime.setSeconds(retryTime.getSeconds() + retryDelay);

    this._scheduling.nextExecutionTime = retryTime;
  }

  /**
   * 检查是否应该调度下次执行
   */
  private shouldScheduleNext(): boolean {
    if (!this._scheduling.recurrence) return false;

    // 检查结束日期
    if (this._scheduling.recurrence.endDate && new Date() >= this._scheduling.recurrence.endDate) {
      return false;
    }

    // 检查最大执行次数
    if (
      this._scheduling.recurrence.maxOccurrences &&
      this._execution.executionCount >= this._scheduling.recurrence.maxOccurrences
    ) {
      return false;
    }

    return true;
  }

  /**
   * 添加领域事件
   */
  protected addScheduleDomainEvent(eventType: string, eventData: any): void {
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
      basic: { ...this._basic },
      scheduling: { ...this._scheduling },
      execution: { ...this._execution },
      alertConfig: { ...this._alertConfig },
      lifecycle: { ...this._lifecycle },
      metadata: { ...this._metadata },
    };
  }
}
