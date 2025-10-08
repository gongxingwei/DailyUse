import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleContracts } from '@dailyuse/contracts';

type RecurringScheduleTaskDTO = ScheduleContracts.RecurringScheduleTaskDTO;
type ScheduleTaskStatus = ScheduleContracts.ScheduleTaskStatus;
type TriggerType = ScheduleContracts.TriggerType;
type ScheduleExecutionHistory = ScheduleContracts.ScheduleExecutionHistory;

const StatusEnum = ScheduleContracts.ScheduleTaskStatus;
const TriggerEnum = ScheduleContracts.TriggerType;

/**
 * RecurringScheduleTask 聚合根
 *
 * 表示一个基于 cron 表达式的循环定时任务
 */
export class RecurringScheduleTask extends AggregateRoot {
  private _name: string;
  private _description?: string;
  private _triggerType: TriggerType;
  private _cronExpression?: string;
  private _scheduledTime?: Date;
  private _status: ScheduleTaskStatus;
  private _enabled: boolean;
  private _sourceModule: string;
  private _sourceEntityId: string;
  private _metadata?: Record<string, any>;
  private _nextRunAt?: Date;
  private _lastRunAt?: Date;
  private _executionCount: number;
  private _executionHistory: ScheduleExecutionHistory[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _version: number;

  private constructor(
    uuid: string,
    name: string,
    description: string | undefined,
    triggerType: TriggerType,
    cronExpression: string | undefined,
    scheduledTime: Date | undefined,
    status: ScheduleTaskStatus,
    enabled: boolean,
    sourceModule: string,
    sourceEntityId: string,
    metadata: Record<string, any> | undefined,
    nextRunAt: Date | undefined,
    lastRunAt: Date | undefined,
    executionCount: number,
    executionHistory: ScheduleExecutionHistory[],
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ) {
    super(uuid);
    this._name = name;
    this._description = description;
    this._triggerType = triggerType;
    this._cronExpression = cronExpression;
    this._scheduledTime = scheduledTime;
    this._status = status;
    this._enabled = enabled;
    this._sourceModule = sourceModule;
    this._sourceEntityId = sourceEntityId;
    this._metadata = metadata;
    this._nextRunAt = nextRunAt;
    this._lastRunAt = lastRunAt;
    this._executionCount = executionCount;
    this._executionHistory = executionHistory;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._version = version;
  }

  // ========== Getters ==========
  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get triggerType(): TriggerType {
    return this._triggerType;
  }

  get cronExpression(): string | undefined {
    return this._cronExpression;
  }

  get scheduledTime(): Date | undefined {
    return this._scheduledTime;
  }

  get status(): ScheduleTaskStatus {
    return this._status;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get sourceModule(): string {
    return this._sourceModule;
  }

  get sourceEntityId(): string {
    return this._sourceEntityId;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get nextRunAt(): Date | undefined {
    return this._nextRunAt;
  }

  get lastRunAt(): Date | undefined {
    return this._lastRunAt;
  }

  get executionCount(): number {
    return this._executionCount;
  }

  get executionHistory(): ScheduleExecutionHistory[] {
    return [...this._executionHistory];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get version(): number {
    return this._version;
  }

  // ========== 工厂方法 ==========
  static create(params: {
    uuid: string;
    name: string;
    description?: string;
    triggerType: TriggerType;
    cronExpression?: string;
    scheduledTime?: Date;
    sourceModule: string;
    sourceEntityId: string;
    metadata?: Record<string, any>;
    enabled?: boolean;
  }): RecurringScheduleTask {
    const now = new Date();

    if (params.triggerType === TriggerEnum.CRON && !params.cronExpression) {
      throw new Error('Cron trigger type requires cronExpression');
    }
    if (params.triggerType === TriggerEnum.ONCE && !params.scheduledTime) {
      throw new Error('Once trigger type requires scheduledTime');
    }

    return new RecurringScheduleTask(
      params.uuid,
      params.name,
      params.description,
      params.triggerType,
      params.cronExpression,
      params.scheduledTime,
      StatusEnum.ACTIVE,
      params.enabled ?? true,
      params.sourceModule,
      params.sourceEntityId,
      params.metadata,
      undefined,
      undefined,
      0,
      [],
      now,
      now,
      1,
    );
  }

  static fromDTO(dto: RecurringScheduleTaskDTO): RecurringScheduleTask {
    return new RecurringScheduleTask(
      dto.uuid,
      dto.name,
      dto.description,
      TriggerEnum.CRON, // 统一使用 CRON
      dto.cronExpression || '', // 确保不为 undefined
      dto.scheduledTime,
      dto.status,
      dto.enabled,
      dto.sourceModule,
      dto.sourceEntityId,
      dto.metadata,
      dto.nextRunAt,
      dto.lastRunAt,
      dto.executionCount,
      dto.executionHistory || [],
      dto.createdAt,
      dto.updatedAt,
      1,
    );
  }

  // ========== 业务方法 ==========
  protected updateVersion(): void {
    this._version++;
    this._updatedAt = new Date();
  }

  updateBasicInfo(params: {
    name?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.description !== undefined) this._description = params.description;
    if (params.metadata !== undefined) this._metadata = params.metadata;
    this.updateVersion();
  }

  updateCronExpression(cronExpression: string): void {
    if (this._triggerType !== TriggerEnum.CRON) {
      throw new Error('Cannot update cron expression for non-cron trigger type');
    }
    this._cronExpression = cronExpression;
    this._nextRunAt = undefined;
    this.updateVersion();
  }

  updateScheduledTime(scheduledTime: Date): void {
    if (this._triggerType !== TriggerEnum.ONCE) {
      throw new Error('Cannot update scheduled time for non-once trigger type');
    }
    this._scheduledTime = scheduledTime;
    this._nextRunAt = scheduledTime;
    this.updateVersion();
  }

  enable(): void {
    this._enabled = true;
    if (this._status === StatusEnum.PAUSED) {
      this._status = StatusEnum.ACTIVE;
    }
    this.updateVersion();
  }

  disable(): void {
    this._enabled = false;
    this._status = StatusEnum.PAUSED;
    this.updateVersion();
  }

  pause(): void {
    this._status = StatusEnum.PAUSED;
    this.updateVersion();
  }

  resume(): void {
    if (this._enabled) {
      this._status = StatusEnum.ACTIVE;
      this.updateVersion();
    }
  }

  cancel(): void {
    this._status = StatusEnum.CANCELLED;
    this._enabled = false;
    this.updateVersion();
  }

  complete(): void {
    if (this._triggerType !== TriggerEnum.ONCE) {
      throw new Error('Only once trigger type can be completed');
    }
    this._status = StatusEnum.COMPLETED;
    this._enabled = false;
    this.updateVersion();
  }

  setNextRunAt(nextRunAt: Date | undefined): void {
    this._nextRunAt = nextRunAt;
    this.updateVersion();
  }

  recordExecution(success: boolean, error?: string, durationMs?: number): void {
    const now = new Date();
    this._lastRunAt = now;
    this._executionCount++;

    const historyEntry: ScheduleExecutionHistory = {
      executedAt: now,
      success,
      error,
      durationMs,
    };

    this._executionHistory = [historyEntry, ...this._executionHistory].slice(0, 10);

    if (this._triggerType === TriggerEnum.ONCE && success) {
      this.complete();
    }

    this.updateVersion();
  }

  toDTO(): RecurringScheduleTaskDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      triggerType: TriggerEnum.CRON, // 始终返回 CRON
      cronExpression: this._cronExpression || '', // 确保不为 undefined
      scheduledTime: this._scheduledTime,
      status: this._status,
      enabled: this._enabled,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      metadata: this._metadata,
      nextRunAt: this._nextRunAt,
      lastRunAt: this._lastRunAt,
      executionCount: this._executionCount,
      executionHistory: this.executionHistory,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  toPersistence(): any {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      triggerType: this._triggerType,
      cronExpression: this._cronExpression,
      scheduledTime: this._scheduledTime,
      status: this._status,
      enabled: this._enabled,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      metadata: this._metadata ? JSON.stringify(this._metadata) : '{}',
      nextRunAt: this._nextRunAt,
      lastRunAt: this._lastRunAt,
      executionCount: this._executionCount,
      executionHistory: JSON.stringify(this._executionHistory),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this._version,
    };
  }

  static fromPersistence(data: any): RecurringScheduleTask {
    return new RecurringScheduleTask(
      data.uuid,
      data.name,
      data.description || undefined,
      data.triggerType as TriggerType,
      data.cronExpression || undefined,
      data.scheduledTime ? new Date(data.scheduledTime) : undefined,
      data.status as ScheduleTaskStatus,
      data.enabled,
      data.sourceModule,
      data.sourceEntityId,
      data.metadata ? JSON.parse(data.metadata) : undefined,
      data.nextRunAt ? new Date(data.nextRunAt) : undefined,
      data.lastRunAt ? new Date(data.lastRunAt) : undefined,
      data.executionCount || 0,
      data.executionHistory ? JSON.parse(data.executionHistory) : [],
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.version || 1,
    );
  }

  clone(): RecurringScheduleTask {
    return new RecurringScheduleTask(
      this.uuid,
      this._name,
      this._description,
      this._triggerType,
      this._cronExpression,
      this._scheduledTime,
      this._status,
      this._enabled,
      this._sourceModule,
      this._sourceEntityId,
      this._metadata ? { ...this._metadata } : undefined,
      this._nextRunAt,
      this._lastRunAt,
      this._executionCount,
      [...this._executionHistory],
      this._createdAt,
      this._updatedAt,
      this._version,
    );
  }
}
