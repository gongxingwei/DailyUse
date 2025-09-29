/**
 * Schedule Task Core - Simplified Version
 * @description 调度任务聚合根抽象类 - 简化版本
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  type IScheduleTask,
  type IScheduleTaskBasic,
  type IScheduleTaskScheduling,
  type IScheduleTaskExecution,
  type IScheduleTaskLifecycle,
  type IScheduleTaskMetadata,
  type IAlertConfig,
  type IScheduleExecutionResult,
  ScheduleStatus,
} from '@dailyuse/contracts';

/**
 * 调度任务抽象基类 - 层级结构设计
 */
export abstract class ScheduleTaskCore extends AggregateRoot implements IScheduleTask {
  // 层级结构的受保护属性
  protected _basic: IScheduleTaskBasic;
  protected _scheduling: IScheduleTaskScheduling;
  protected _execution: IScheduleTaskExecution;
  protected _alertConfig: IAlertConfig;
  protected _lifecycle: IScheduleTaskLifecycle;
  protected _metadata: IScheduleTaskMetadata;

  constructor(data: IScheduleTask) {
    super(data.uuid);

    this._basic = data.basic;
    this._scheduling = data.scheduling;
    this._execution = data.execution;
    this._alertConfig = data.alertConfig;
    this._lifecycle = data.lifecycle;
    this._metadata = data.metadata;
  }

  // 实现 IScheduleTask 接口的 getter
  get uuid(): string {
    return this._uuid;
  }
  get basic(): IScheduleTaskBasic {
    return { ...this._basic };
  }
  get scheduling(): IScheduleTaskScheduling {
    return { ...this._scheduling };
  }
  get execution(): IScheduleTaskExecution {
    return { ...this._execution };
  }
  get alertConfig(): IAlertConfig {
    return { ...this._alertConfig };
  }
  get lifecycle(): IScheduleTaskLifecycle {
    return { ...this._lifecycle };
  }
  get metadata(): IScheduleTaskMetadata {
    return { ...this._metadata };
  }

  // 抽象方法 - 子类必须实现
  abstract execute(): Promise<IScheduleExecutionResult>;
  abstract validate(): { isValid: boolean; errors: string[] };

  // 受保护方法 - 计算下次执行时间
  protected abstract calculateNextExecutionTime(): Date | undefined;

  // 公共业务方法
  public isExpired(): boolean {
    return this._scheduling.scheduledTime < new Date();
  }

  public canExecute(): boolean {
    return this._scheduling.status === ScheduleStatus.PENDING && this._metadata.enabled;
  }

  public isRecurring(): boolean {
    return !!this._scheduling.recurrence;
  }

  public getExecutionProgress(): {
    current: number;
    max: number | undefined;
    percentage: number | undefined;
  } {
    const current = this._execution.executionCount;
    const max = this._scheduling.recurrence?.maxOccurrences;

    return {
      current,
      max,
      percentage: max ? (current / max) * 100 : undefined,
    };
  }

  // 状态管理方法
  public pause(): void {
    this._scheduling.status = ScheduleStatus.PAUSED;
    this._lifecycle.updatedAt = new Date();
  }

  public resume(): void {
    this._scheduling.status = ScheduleStatus.PENDING;
    this._lifecycle.updatedAt = new Date();
  }

  public cancel(): void {
    this._scheduling.status = ScheduleStatus.CANCELLED;
    this._lifecycle.updatedAt = new Date();
  }

  public reschedule(newTime: Date): void {
    this._scheduling.scheduledTime = newTime;
    this._scheduling.nextExecutionTime = newTime;
    this._lifecycle.updatedAt = new Date();
  }

  public updateAlertConfig(alertConfig: IAlertConfig): void {
    this._alertConfig = { ...alertConfig };
    this._lifecycle.updatedAt = new Date();
  }
}
