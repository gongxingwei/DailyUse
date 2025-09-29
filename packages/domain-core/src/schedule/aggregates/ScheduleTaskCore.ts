/**
 * Schedule Task Core Aggregate
 * @description 调度任务核心聚合根 - 层级结构版本
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { AggregateRoot } from '@dailyuse/utils';
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
 * 调度任务核心业务逻辑抽象基类
 * 采用层级结构组织数据，符合 DDD 设计原则
 */
export abstract class ScheduleTaskCore extends AggregateRoot implements IScheduleTask {
  protected _basic: IScheduleTaskBasic;
  protected _scheduling: IScheduleTaskScheduling;
  protected _execution: IScheduleTaskExecution;
  protected _alertConfig: IAlertConfig;
  protected _lifecycle: IScheduleTaskLifecycle;
  protected _metadata: IScheduleTaskMetadata;

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

  // ========== 核心业务方法（抽象） ==========

  /**
   * 执行任务 - 由子类实现具体逻辑
   */
  public abstract execute(): Promise<IScheduleExecutionResult>;

  /**
   * 验证任务配置 - 由子类实现具体逻辑
   */
  public abstract validate(): { isValid: boolean; errors: string[] };

  // ========== 通用业务方法 ==========

  /**
   * 更新基本信息
   */
  public updateBasicInfo(updates: Partial<IScheduleTaskBasic>): void {
    if (updates.name !== undefined) this._basic.name = updates.name;
    if (updates.description !== undefined) this._basic.description = updates.description;
    if (updates.taskType !== undefined) this._basic.taskType = updates.taskType;
    if (updates.payload !== undefined) this._basic.payload = updates.payload;
    if (updates.createdBy !== undefined) this._basic.createdBy = updates.createdBy;

    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 更新调度信息
   */
  public updateScheduling(updates: Partial<IScheduleTaskScheduling>): void {
    if (updates.scheduledTime !== undefined) this._scheduling.scheduledTime = updates.scheduledTime;
    if (updates.recurrence !== undefined) this._scheduling.recurrence = updates.recurrence;
    if (updates.priority !== undefined) this._scheduling.priority = updates.priority;
    if (updates.status !== undefined) this._scheduling.status = updates.status;
    if (updates.nextExecutionTime !== undefined)
      this._scheduling.nextExecutionTime = updates.nextExecutionTime;

    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 更新执行信息
   */
  public updateExecution(updates: Partial<IScheduleTaskExecution>): void {
    if (updates.executionCount !== undefined)
      this._execution.executionCount = updates.executionCount;
    if (updates.maxRetries !== undefined) this._execution.maxRetries = updates.maxRetries;
    if (updates.currentRetries !== undefined)
      this._execution.currentRetries = updates.currentRetries;
    if (updates.timeoutSeconds !== undefined)
      this._execution.timeoutSeconds = updates.timeoutSeconds;

    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 更新元数据
   */
  public updateMetadata(updates: Partial<IScheduleTaskMetadata>): void {
    if (updates.tags !== undefined) this._metadata.tags = updates.tags;
    if (updates.enabled !== undefined) this._metadata.enabled = updates.enabled;
    if (updates.version !== undefined) this._metadata.version = updates.version;

    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 启用任务
   */
  public enable(): void {
    this._metadata.enabled = true;
    this._scheduling.status = ScheduleStatus.PENDING;
    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 禁用任务
   */
  public disable(): void {
    this._metadata.enabled = false;
    this._scheduling.status = ScheduleStatus.CANCELLED;
    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 检查是否可以执行
   */
  public canExecute(): boolean {
    if (!this._metadata.enabled) return false;
    if (this._scheduling.status !== ScheduleStatus.PENDING) return false;
    if (!this._scheduling.nextExecutionTime) return false;

    const now = new Date();
    return this._scheduling.nextExecutionTime.getTime() <= now.getTime();
  }

  /**
   * 获取剩余时间(分钟)
   */
  public getMinutesUntilExecution(): number {
    if (!this._scheduling.nextExecutionTime) return -1;

    const now = new Date();
    const diff = this._scheduling.nextExecutionTime.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60));
  }

  /**
   * 转换为DTO
   */
  public toDTO(): IScheduleTask {
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

  // ========== 受保护的工具方法 ==========

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
   * 计算下次执行时间 - 抽象方法，由子类实现
   */
  protected abstract calculateNextExecutionTime(): Date | undefined;
}
