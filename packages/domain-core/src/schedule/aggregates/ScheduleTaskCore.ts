/**
 * Schedule Task Core Aggregate
 * @description 调度任务核心聚合根
 * @author DailyUse Team
 * @date 2025-01-09
 */

import {
  type IScheduleTask,
  type IScheduleTaskPayload,
  type IRecurrenceRule,
  type IAlertConfig,
  ScheduleStatus,
  SchedulePriority,
  ScheduleTaskType,
  type IScheduleExecutionResult,
  type CreateScheduleTaskRequestDto,
  type UpdateScheduleTaskRequestDto,
  type ScheduleTaskResponseDto,
} from '@dailyuse/contracts';

import { ScheduleContracts } from '@dailyuse/contracts';

/**
 * 调度任务核心业务逻辑抽象基类
 */
export abstract class ScheduleTaskCore implements IScheduleTask {
  public readonly uuid: string;
  public name: string;
  public description?: string;
  public readonly taskType: ScheduleTaskType;
  public payload: IScheduleTaskPayload;
  public scheduledTime: Date;
  public recurrence?: IRecurrenceRule;
  public priority: SchedulePriority;
  public status: ScheduleStatus;
  public alertConfig: IAlertConfig;
  public readonly createdBy: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public nextExecutionTime?: Date;
  public executionCount: number = 0;
  public maxRetries: number;
  public currentRetries: number = 0;
  public timeoutSeconds?: number;
  public tags?: string[];
  public enabled: boolean;

  constructor(data: IScheduleTask) {
    this.uuid = data.uuid;
    this.name = data.name;
    this.description = data.description;
    this.taskType = data.taskType;
    this.payload = data.payload;
    this.scheduledTime = data.scheduledTime;
    this.recurrence = data.recurrence;
    this.priority = data.priority;
    this.status = data.status;
    this.alertConfig = data.alertConfig;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.nextExecutionTime = data.nextExecutionTime;
    this.executionCount = data.executionCount;
    this.maxRetries = data.maxRetries;
    this.currentRetries = data.currentRetries;
    this.timeoutSeconds = data.timeoutSeconds;
    this.tags = data.tags;
    this.enabled = data.enabled;

    this.calculateNextExecutionTime();
  }

  /**
   * 更新任务
   */
  public update(updates: UpdateScheduleTaskRequestDto): void {
    if (updates.name !== undefined) this.name = updates.name;
    if (updates.description !== undefined) this.description = updates.description;
    if (updates.scheduledTime !== undefined) this.scheduledTime = updates.scheduledTime;
    if (updates.recurrence !== undefined) this.recurrence = updates.recurrence;
    if (updates.priority !== undefined) this.priority = updates.priority;
    if (updates.status !== undefined) this.status = updates.status;
    if (updates.alertConfig !== undefined) this.alertConfig = updates.alertConfig;
    if (updates.maxRetries !== undefined) this.maxRetries = updates.maxRetries;
    if (updates.timeoutSeconds !== undefined) this.timeoutSeconds = updates.timeoutSeconds;
    if (updates.tags !== undefined) this.tags = updates.tags;
    if (updates.enabled !== undefined) this.enabled = updates.enabled;

    this.updatedAt = new Date();
    this.calculateNextExecutionTime();
  }

  /**
   * 启用任务
   */
  public enable(): void {
    this.enabled = true;
    this.status = ScheduleStatus.PENDING;
    this.updatedAt = new Date();
    this.calculateNextExecutionTime();
  }

  /**
   * 禁用任务
   */
  public disable(): void {
    this.enabled = false;
    this.status = ScheduleStatus.CANCELLED;
    this.updatedAt = new Date();
    this.nextExecutionTime = undefined;
  }

  /**
   * 暂停任务
   */
  public pause(): void {
    this.status = ScheduleStatus.PAUSED;
    this.updatedAt = new Date();
  }

  /**
   * 恢复任务
   */
  public resume(): void {
    if (this.enabled) {
      this.status = ScheduleStatus.PENDING;
      this.updatedAt = new Date();
      this.calculateNextExecutionTime();
    }
  }

  /**
   * 开始执行
   */
  public startExecution(): void {
    this.status = ScheduleStatus.RUNNING;
    this.updatedAt = new Date();
  }

  /**
   * 执行完成
   */
  public completeExecution(result: IScheduleExecutionResult): void {
    this.executionCount++;
    this.currentRetries = 0;

    if (result.status === ScheduleStatus.COMPLETED) {
      if (this.recurrence) {
        this.status = ScheduleStatus.PENDING;
        this.calculateNextExecutionTime();
      } else {
        this.status = ScheduleStatus.COMPLETED;
        this.nextExecutionTime = undefined;
      }
    } else {
      this.status = result.status;
    }

    this.updatedAt = new Date();
  }

  /**
   * 执行失败，处理重试逻辑
   */
  public handleExecutionFailure(error: string): boolean {
    this.currentRetries++;

    if (this.currentRetries >= this.maxRetries) {
      this.status = ScheduleStatus.FAILED;
      this.nextExecutionTime = undefined;
      return false; // 不再重试
    } else {
      this.status = ScheduleStatus.PENDING;
      this.calculateRetryTime();
      return true; // 将重试
    }
  }

  /**
   * 延后执行
   */
  public snooze(minutes: number): void {
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
    this.scheduledTime = snoozeTime;
    this.nextExecutionTime = snoozeTime;
    this.status = ScheduleStatus.PENDING;
    this.updatedAt = new Date();
  }

  /**
   * 检查是否可以执行
   */
  public canExecute(): boolean {
    if (!this.enabled) return false;
    if (this.status !== ScheduleStatus.PENDING) return false;
    if (!this.nextExecutionTime) return false;

    const now = new Date();
    return this.nextExecutionTime.getTime() <= now.getTime();
  }

  /**
   * 检查是否已超时
   */
  public isTimeout(startTime: Date): boolean {
    if (!this.timeoutSeconds) return false;

    const now = new Date();
    const elapsed = (now.getTime() - startTime.getTime()) / 1000;
    return elapsed > this.timeoutSeconds;
  }

  /**
   * 获取剩余时间(分钟)
   */
  public getMinutesUntilExecution(): number {
    if (!this.nextExecutionTime) return -1;

    const now = new Date();
    const diff = this.nextExecutionTime.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60));
  }

  /**
   * 计算下次执行时间
   */
  protected calculateNextExecutionTime(): void {
    if (!this.enabled || !this.recurrence) {
      this.nextExecutionTime = this.scheduledTime;
      return;
    }

    // 基于重复规则计算下次执行时间
    this.nextExecutionTime = this.calculateRecurringTime();
  }

  /**
   * 计算重试时间 (指数退避)
   */
  protected calculateRetryTime(): void {
    const baseDelay = 60; // 1分钟基础延迟
    const exponentialDelay = Math.pow(2, this.currentRetries - 1) * baseDelay;
    const maxDelay = 3600; // 最大1小时延迟
    const actualDelay = Math.min(exponentialDelay, maxDelay);

    const retryTime = new Date();
    retryTime.setSeconds(retryTime.getSeconds() + actualDelay);
    this.nextExecutionTime = retryTime;
  }

  /**
   * 计算重复执行时间 - 抽象方法，由子类实现
   */
  protected abstract calculateRecurringTime(): Date;

  /**
   * 验证任务配置
   */
  public abstract validate(): { isValid: boolean; errors: string[] };

  /**
   * 转换为DTO
   */
  public toDTO(): ScheduleTaskResponseDto {
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      taskType: this.taskType,
      payload: this.payload,
      scheduledTime: this.scheduledTime,
      recurrence: this.recurrence,
      priority: this.priority,
      status: this.status,
      alertConfig: this.alertConfig,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      nextExecutionTime: this.nextExecutionTime,
      executionCount: this.executionCount,
      maxRetries: this.maxRetries,
      currentRetries: this.currentRetries,
      timeoutSeconds: this.timeoutSeconds,
      tags: this.tags,
      enabled: this.enabled,
    };
  }
}
