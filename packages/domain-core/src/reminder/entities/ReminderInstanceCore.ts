import { AggregateRoot } from '@dailyuse/utils';
import { ReminderContracts } from '@dailyuse/contracts';

/**
 * ReminderInstance核心基类 - 包含共享属性和基础计算
 */
export abstract class ReminderInstanceCore extends AggregateRoot {
  protected _templateUuid: string;
  protected _title?: string;
  protected _message: string;
  protected _scheduledTime: Date;
  protected _triggeredTime?: Date;
  protected _acknowledgedTime?: Date;
  protected _dismissedTime?: Date;
  protected _snoozedUntil?: Date;
  protected _status: ReminderContracts.ReminderStatus;
  protected _priority: ReminderContracts.ReminderPriority;
  protected _metadata: {
    category: string;
    tags: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  };
  protected _snoozeHistory: Array<{
    snoozedAt: Date;
    snoozeUntil: Date;
    snoozeType?: ReminderContracts.SnoozeType;
    customMinutes?: number;
    reason?: string;
  }>;
  protected _currentSnoozeCount: number;
  protected _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
  };
  protected _version: number;

  constructor(params: {
    uuid?: string;
    templateUuid: string;
    title?: string;
    message: string;
    scheduledTime: Date;
    triggeredTime?: Date;
    acknowledgedTime?: Date;
    dismissedTime?: Date;
    snoozedUntil?: Date;
    status?: ReminderContracts.ReminderStatus;
    priority?: ReminderContracts.ReminderPriority;
    metadata?: {
      category?: string;
      tags?: string[];
      sourceType?: 'template' | 'task' | 'goal' | 'manual';
      sourceId?: string;
    };
    snoozeHistory?: Array<{
      snoozedAt: Date;
      snoozeUntil: Date;
      snoozeType?: ReminderContracts.SnoozeType;
      customMinutes?: number;
      reason?: string;
    }>;
    currentSnoozeCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    const now = new Date();

    this._templateUuid = params.templateUuid;
    this._title = params.title;
    this._message = params.message;
    this._scheduledTime = params.scheduledTime;
    this._triggeredTime = params.triggeredTime;
    this._acknowledgedTime = params.acknowledgedTime;
    this._dismissedTime = params.dismissedTime;
    this._snoozedUntil = params.snoozedUntil;
    this._status = params.status || ReminderContracts.ReminderStatus.PENDING;
    this._priority = params.priority || ReminderContracts.ReminderPriority.NORMAL;
    this._metadata = {
      category: params.metadata?.category || '',
      tags: params.metadata?.tags || [],
      sourceType: params.metadata?.sourceType,
      sourceId: params.metadata?.sourceId,
    };
    this._snoozeHistory = params.snoozeHistory || [];
    this._currentSnoozeCount = params.currentSnoozeCount || 0;
    this._lifecycle = {
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
    };
    this._version = params.version || 0;
  }

  // ===== 共享只读属性 =====
  get templateUuid(): string {
    return this._templateUuid;
  }

  get title(): string | undefined {
    return this._title;
  }

  get message(): string {
    return this._message;
  }

  get scheduledTime(): Date {
    return this._scheduledTime;
  }

  get triggeredTime(): Date | undefined {
    return this._triggeredTime;
  }

  get acknowledgedTime(): Date | undefined {
    return this._acknowledgedTime;
  }

  get dismissedTime(): Date | undefined {
    return this._dismissedTime;
  }

  get snoozedUntil(): Date | undefined {
    return this._snoozedUntil;
  }

  get status(): ReminderContracts.ReminderStatus {
    return this._status;
  }

  get priority(): ReminderContracts.ReminderPriority {
    return this._priority;
  }

  get metadata(): {
    category: string;
    tags: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  } {
    return this._metadata;
  }

  get snoozeHistory(): Array<{
    snoozedAt: Date;
    snoozeUntil: Date;
    snoozeType?: ReminderContracts.SnoozeType;
    customMinutes?: number;
    reason?: string;
  }> {
    return this._snoozeHistory;
  }

  get currentSnoozeCount(): number {
    return this._currentSnoozeCount;
  }

  get triggerTime(): Date {
    return this._scheduledTime;
  }

  get createdAt(): Date {
    return this._lifecycle.createdAt;
  }

  get updatedAt(): Date {
    return this._lifecycle.updatedAt;
  }

  get version(): number {
    return this._version;
  }

  // ===== 共享计算属性 =====

  /**
   * 检查是否为活跃状态
   */
  get isActive(): boolean {
    return (
      this._status === ReminderContracts.ReminderStatus.PENDING ||
      this._status === ReminderContracts.ReminderStatus.TRIGGERED ||
      this._status === ReminderContracts.ReminderStatus.SNOOZED
    );
  }

  /**
   * 检查是否已完成
   */
  get isCompleted(): boolean {
    return (
      this._status === ReminderContracts.ReminderStatus.ACKNOWLEDGED ||
      this._status === ReminderContracts.ReminderStatus.DISMISSED
    );
  }

  /**
   * 检查是否已确认
   */
  get isAcknowledged(): boolean {
    return this._status === ReminderContracts.ReminderStatus.ACKNOWLEDGED;
  }

  /**
   * 检查是否已忽略
   */
  get isDismissed(): boolean {
    return this._status === ReminderContracts.ReminderStatus.DISMISSED;
  }

  /**
   * 检查是否已延迟
   */
  get isSnoozed(): boolean {
    return this._status === ReminderContracts.ReminderStatus.SNOOZED;
  }

  /**
   * 检查是否已过期
   */
  get isExpired(): boolean {
    return this._status === ReminderContracts.ReminderStatus.EXPIRED;
  }

  /**
   * 检查是否已取消
   */
  get isCancelled(): boolean {
    return this._status === ReminderContracts.ReminderStatus.CANCELLED;
  }

  /**
   * 检查是否应该触发
   */
  get shouldTrigger(): boolean {
    if (this._status !== ReminderContracts.ReminderStatus.PENDING) {
      return false;
    }

    const now = new Date();
    return now >= this._scheduledTime;
  }

  /**
   * 检查是否已过期（但未处理）
   */
  get shouldExpire(): boolean {
    if (this.isCompleted || this.isExpired || this.isCancelled) {
      return false;
    }

    const now = new Date();
    const expirationTime = new Date(this._scheduledTime.getTime() + 24 * 60 * 60 * 1000); // 24小时后过期
    return now >= expirationTime;
  }

  /**
   * 获取响应时间（毫秒）
   */
  get responseTime(): number | undefined {
    if (!this._triggeredTime) return undefined;

    if (this._acknowledgedTime) {
      return this._acknowledgedTime.getTime() - this._triggeredTime.getTime();
    }

    if (this._dismissedTime) {
      return this._dismissedTime.getTime() - this._triggeredTime.getTime();
    }

    return undefined;
  }

  /**
   * 获取延迟剩余时间（毫秒）
   */
  get snoozeRemainingTime(): number {
    if (!this.isSnoozed || !this._snoozedUntil) {
      return 0;
    }

    const now = new Date();
    return Math.max(0, this._snoozedUntil.getTime() - now.getTime());
  }

  /**
   * 检查延迟是否已到期
   */
  get isSnoozeExpired(): boolean {
    if (!this.isSnoozed || !this._snoozedUntil) {
      return false;
    }

    return new Date() >= this._snoozedUntil;
  }

  // ===== 共享验证方法 =====

  protected validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error('提醒消息不能为空');
    }
    if (message.length > 500) {
      throw new Error('提醒消息不能超过500个字符');
    }
  }

  protected validateScheduledTime(scheduledTime: Date): void {
    if (scheduledTime <= new Date()) {
      throw new Error('计划触发时间必须在未来');
    }
  }

  protected validateSnoozeTime(snoozeUntil: Date): void {
    if (snoozeUntil <= new Date()) {
      throw new Error('延迟时间必须在未来');
    }
  }

  // ===== 共享业务方法 =====

  /**
   * 触发提醒
   */
  trigger(): void {
    if (this._status !== ReminderContracts.ReminderStatus.PENDING) {
      throw new Error('只有待处理状态的提醒可以被触发');
    }

    this._status = ReminderContracts.ReminderStatus.TRIGGERED;
    this._triggeredTime = new Date();
    this.updateVersion();
  }

  /**
   * 确认提醒
   */
  acknowledge(): void {
    if (
      this._status !== ReminderContracts.ReminderStatus.TRIGGERED &&
      this._status !== ReminderContracts.ReminderStatus.SNOOZED
    ) {
      throw new Error('只有已触发或延迟状态的提醒可以被确认');
    }

    this._status = ReminderContracts.ReminderStatus.ACKNOWLEDGED;
    this._acknowledgedTime = new Date();
    this._snoozedUntil = undefined;
    this.updateVersion();
  }

  /**
   * 忽略提醒
   */
  dismiss(): void {
    if (
      this._status !== ReminderContracts.ReminderStatus.TRIGGERED &&
      this._status !== ReminderContracts.ReminderStatus.SNOOZED
    ) {
      throw new Error('只有已触发或延迟状态的提醒可以被忽略');
    }

    this._status = ReminderContracts.ReminderStatus.DISMISSED;
    this._dismissedTime = new Date();
    this._snoozedUntil = undefined;
    this.updateVersion();
  }

  /**
   * 延迟提醒
   */
  snooze(minutes: number, snoozeType?: ReminderContracts.SnoozeType, reason?: string): void {
    if (
      this._status !== ReminderContracts.ReminderStatus.TRIGGERED &&
      this._status !== ReminderContracts.ReminderStatus.SNOOZED
    ) {
      throw new Error('只有已触发或延迟状态的提醒可以被延迟');
    }

    if (minutes <= 0) {
      throw new Error('延迟时间必须大于0');
    }

    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    this.validateSnoozeTime(snoozeUntil);

    this._status = ReminderContracts.ReminderStatus.SNOOZED;
    this._snoozedUntil = snoozeUntil;
    this._currentSnoozeCount++;

    // 记录延迟历史
    this._snoozeHistory.push({
      snoozedAt: new Date(),
      snoozeUntil,
      snoozeType,
      customMinutes: snoozeType === ReminderContracts.SnoozeType.CUSTOM ? minutes : undefined,
      reason,
    });

    this.updateVersion();
  }

  /**
   * 取消提醒
   */
  cancel(): void {
    if (this.isCompleted) {
      throw new Error('已完成的提醒不能被取消');
    }

    this._status = ReminderContracts.ReminderStatus.CANCELLED;
    this._snoozedUntil = undefined;
    this.updateVersion();
  }

  /**
   * 标记为过期
   */
  expire(): void {
    if (this.isCompleted || this.isCancelled) {
      throw new Error('已完成或已取消的提醒不能被标记为过期');
    }

    this._status = ReminderContracts.ReminderStatus.EXPIRED;
    this._snoozedUntil = undefined;
    this.updateVersion();
  }

  /**
   * 重新调度（用于延迟到期后重新触发）
   */
  reschedule(newScheduledTime: Date): void {
    if (!this.isSnoozed) {
      throw new Error('只有延迟状态的提醒可以被重新调度');
    }

    this.validateScheduledTime(newScheduledTime);

    this._scheduledTime = newScheduledTime;
    this._status = ReminderContracts.ReminderStatus.PENDING;
    this._snoozedUntil = undefined;
    this.updateVersion();
  }

  /**
   * 更新消息
   */
  updateMessage(message: string): void {
    this.validateMessage(message);
    this._message = message;
    this.updateVersion();
  }

  /**
   * 更新标题
   */
  updateTitle(title?: string): void {
    this._title = title;
    this.updateVersion();
  }

  /**
   * 更新优先级
   */
  updatePriority(priority: ReminderContracts.ReminderPriority): void {
    this._priority = priority;
    this.updateVersion();
  }

  /**
   * 更新元数据
   */
  updateMetadata(
    metadata: Partial<{
      category: string;
      tags: string[];
      sourceType: 'template' | 'task' | 'goal' | 'manual';
      sourceId: string;
    }>,
  ): void {
    this._metadata = {
      ...this._metadata,
      ...metadata,
    };
    this.updateVersion();
  }

  // ===== 抽象方法（由子类实现）=====

  /**
   * 克隆实例（抽象方法）
   */
  abstract clone(): ReminderInstanceCore;

  // ===== 共享辅助方法 =====

  protected updateVersion(): void {
    this._version++;
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 序列化方法 =====

  toDTO(): ReminderContracts.IReminderInstance {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      title: this._title,
      message: this._message,
      scheduledTime: this._scheduledTime,
      triggeredTime: this._triggeredTime,
      acknowledgedTime: this._acknowledgedTime,
      dismissedTime: this._dismissedTime,
      snoozedUntil: this._snoozedUntil,
      status: this._status,
      priority: this._priority,
      metadata: this._metadata,
      snoozeHistory: this._snoozeHistory,
      currentSnoozeCount: this._currentSnoozeCount,
      createdAt: this._lifecycle.createdAt,
      updatedAt: this._lifecycle.updatedAt,
      version: this._version,
    };
  }

  static fromDTO(dto: ReminderContracts.IReminderInstance): ReminderInstanceCore {
    throw new Error('Method not implemented. Use subclass implementations.');
  }
}
