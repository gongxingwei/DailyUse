import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleContracts } from '@dailyuse/contracts';

type ScheduleTaskDTO = ScheduleContracts.ScheduleTaskDTO;
type ScheduleTaskStatus = ScheduleContracts.ScheduleTaskStatus;
type ScheduleExecutionHistory = ScheduleContracts.ScheduleExecutionHistory;

const StatusEnum = ScheduleContracts.ScheduleTaskStatus;

/**
 * ScheduleTask 聚合根
 *
 * 统一的调度任务模型，使用 Cron 表达式支持单次和重复任务
 * - 单次任务: 使用特定日期时间的 Cron 表达式（如 "0 10 15 1 * 2025" 表示 2025年1月15日10:00）
 * - 重复任务: 使用标准 Cron 表达式（如 "0 9 * * 1-5" 表示工作日每天9:00）
 */
export class ScheduleTask extends AggregateRoot {
  private _name: string;
  private _description?: string;
  private _cronExpression: string;
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
    cronExpression: string,
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
    this._cronExpression = cronExpression;
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

  get cronExpression(): string {
    return this._cronExpression;
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
  /**
   * 创建新的调度任务
   *
   * @example
   * // 单次任务 - 2025年1月15日10:00执行
   * ScheduleTask.create({
   *   cronExpression: '0 10 15 1 * 2025',
   *   sourceModule: 'reminder',
   *   sourceEntityId: 'template-uuid-123'
   * })
   *
   * @example
   * // 重复任务 - 工作日每天9:00执行
   * ScheduleTask.create({
   *   cronExpression: '0 9 * * 1-5',
   *   sourceModule: 'reminder',
   *   sourceEntityId: 'template-uuid-456'
   * })
   */
  static create(params: {
    uuid: string;
    name: string;
    description?: string;
    cronExpression: string;
    sourceModule: string;
    sourceEntityId: string;
    metadata?: Record<string, any>;
    enabled?: boolean;
  }): ScheduleTask {
    const now = new Date();

    if (!params.cronExpression || params.cronExpression.trim() === '') {
      throw new Error('Cron expression is required');
    }

    return new ScheduleTask(
      params.uuid,
      params.name,
      params.description,
      params.cronExpression,
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

  static fromDTO(dto: ScheduleTaskDTO): ScheduleTask {
    return new ScheduleTask(
      dto.uuid,
      dto.name,
      dto.description,
      dto.cronExpression,
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

  /**
   * 更新 Cron 表达式
   * 适用于单次和重复任务
   */
  updateCronExpression(cronExpression: string): void {
    if (!cronExpression || cronExpression.trim() === '') {
      throw new Error('Cron expression cannot be empty');
    }
    this._cronExpression = cronExpression;
    this._nextRunAt = undefined; // 重新计算下次运行时间
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

  /**
   * 标记任务为已完成
   * 通常用于单次任务执行成功后
   */
  complete(): void {
    this._status = StatusEnum.COMPLETED;
    this._enabled = false;
    this.updateVersion();
  }

  setNextRunAt(nextRunAt: Date | undefined): void {
    this._nextRunAt = nextRunAt;
    this.updateVersion();
  }

  /**
   * 记录任务执行
   *
   * @param success 是否执行成功
   * @param error 错误信息（如果失败）
   * @param durationMs 执行耗时（毫秒）
   * @param isOneTime 是否为单次任务（如果成功且为单次任务，自动标记为完成）
   */
  recordExecution(
    success: boolean,
    error?: string,
    durationMs?: number,
    isOneTime?: boolean,
  ): void {
    const now = new Date();
    this._lastRunAt = now;
    this._executionCount++;

    const historyEntry: ScheduleExecutionHistory = {
      executedAt: now,
      success,
      error,
      durationMs,
    };

    // 保留最近 10 次执行记录
    this._executionHistory = [historyEntry, ...this._executionHistory].slice(0, 10);

    // 单次任务执行成功后自动完成
    if (isOneTime && success) {
      this.complete();
    }

    this.updateVersion();
  }

  toDTO(): ScheduleTaskDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      cronExpression: this._cronExpression,
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
      cronExpression: this._cronExpression,
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

  static fromPersistence(data: any): ScheduleTask {
    return new ScheduleTask(
      data.uuid,
      data.name,
      data.description || undefined,
      data.cronExpression,
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

  clone(): ScheduleTask {
    return new ScheduleTask(
      this.uuid,
      this._name,
      this._description,
      this._cronExpression,
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
