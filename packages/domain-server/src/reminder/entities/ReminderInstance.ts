import type { ReminderContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';

/**
 * 提醒实例实体 - 服务端实现
 * 包含服务端特有的调度和通知逻辑
 */
export class ReminderInstance extends AggregateRoot {
  protected _uuid: string;
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
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _version: number;

  // 服务端特有的属性
  private _scheduleJobId?: string;
  private _notificationAttempts: number;
  private _lastNotificationAttempt?: Date;

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
    status: ReminderContracts.ReminderStatus;
    priority: ReminderContracts.ReminderPriority;
    metadata: {
      category: string;
      tags: string[];
      sourceType?: 'template' | 'task' | 'goal' | 'manual';
      sourceId?: string;
    };
    snoozeHistory: Array<{
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
    // 服务端特有参数
    scheduleJobId?: string;
    notificationAttempts?: number;
    lastNotificationAttempt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    this._uuid = params.uuid || AggregateRoot.generateUUID();
    this._templateUuid = params.templateUuid;
    this._title = params.title;
    this._message = params.message;
    this._scheduledTime = params.scheduledTime;
    this._triggeredTime = params.triggeredTime;
    this._acknowledgedTime = params.acknowledgedTime;
    this._dismissedTime = params.dismissedTime;
    this._snoozedUntil = params.snoozedUntil;
    this._status = params.status;
    this._priority = params.priority;
    this._metadata = params.metadata;
    this._snoozeHistory = params.snoozeHistory || [];
    this._currentSnoozeCount = params.currentSnoozeCount || 0;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
    this._version = params.version || 1;

    // 服务端特有属性
    this._scheduleJobId = params.scheduleJobId;
    this._notificationAttempts = params.notificationAttempts || 0;
    this._lastNotificationAttempt = params.lastNotificationAttempt;

    // 服务端验证
    this.validateBusinessRules();
  }

  // ===== 服务端特有的业务方法 =====

  /**
   * 调度通知任务
   */
  async scheduleNotification(): Promise<void> {
    if (this._status !== 'pending') {
      throw new Error('只能为待处理状态的提醒调度通知');
    }

    if (this._scheduledTime <= new Date()) {
      throw new Error('不能为过去的时间调度通知');
    }

    // 生成调度作业ID
    this._scheduleJobId = `reminder_instance_${this._uuid}_${Date.now()}`;
    this._updatedAt = new Date();
    this._version++;

    // 发布调度事件
    this.addDomainEvent({
      eventType: 'NotificationScheduled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        scheduledTime: this._scheduledTime,
        scheduleJobId: this._scheduleJobId,
      },
    });
  }

  /**
   * 取消调度的通知任务
   */
  async cancelScheduledNotification(): Promise<void> {
    if (!this._scheduleJobId) {
      return; // 没有调度任务需要取消
    }

    const jobId = this._scheduleJobId;
    this._scheduleJobId = undefined;
    this._updatedAt = new Date();
    this._version++;

    // 发布取消调度事件
    this.addDomainEvent({
      eventType: 'NotificationScheduleCancelled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        cancelledJobId: jobId,
      },
    });
  }

  /**
   * 尝试发送通知
   */
  async attemptNotification(): Promise<{ success: boolean; shouldRetry: boolean }> {
    if (!this.shouldTrigger) {
      return { success: false, shouldRetry: false };
    }

    this._notificationAttempts++;
    this._lastNotificationAttempt = new Date();

    try {
      // 更新状态为已触发
      this.updateStatus('triggered' as ReminderContracts.ReminderStatus, new Date());

      // 发布通知发送事件
      this.addDomainEvent({
        eventType: 'NotificationSent',
        aggregateId: this._uuid,
        occurredOn: new Date(),
        payload: {
          instanceUuid: this._uuid,
          templateUuid: this._templateUuid,
          title: this._title,
          message: this._message,
          priority: this._priority,
          attempt: this._notificationAttempts,
        },
      });

      return { success: true, shouldRetry: false };
    } catch (error) {
      this._updatedAt = new Date();
      this._version++;

      // 发布通知失败事件
      this.addDomainEvent({
        eventType: 'NotificationFailed',
        aggregateId: this._uuid,
        occurredOn: new Date(),
        payload: {
          instanceUuid: this._uuid,
          templateUuid: this._templateUuid,
          attempt: this._notificationAttempts,
          error: (error as Error).message,
        },
      });

      // 最多重试3次
      return {
        success: false,
        shouldRetry: this._notificationAttempts < 3,
      };
    }
  }

  /**
   * 重新调度（用于稍后提醒或重试）
   */
  async reschedule(newScheduledTime: Date): Promise<void> {
    if (newScheduledTime <= new Date()) {
      throw new Error('重新调度的时间必须是未来时间');
    }

    // 取消当前调度
    await this.cancelScheduledNotification();

    // 更新时间和状态
    this._scheduledTime = newScheduledTime;
    this._status = 'pending' as ReminderContracts.ReminderStatus;
    this._triggeredTime = undefined;
    this._updatedAt = new Date();
    this._version++;

    // 重新调度
    await this.scheduleNotification();

    // 发布重新调度事件
    this.addDomainEvent({
      eventType: 'NotificationRescheduled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        newScheduledTime,
      },
    });
  }

  // ===== 继承的业务方法增强 =====

  /**
   * 更新提醒状态（服务端增强版本）
   */
  updateStatus(status: ReminderContracts.ReminderStatus, timestamp?: Date): void {
    const now = timestamp || new Date();
    const oldStatus = this._status;
    this._status = status;
    this._updatedAt = now;

    switch (status) {
      case 'triggered':
        this._triggeredTime = now;
        break;
      case 'acknowledged':
        this._acknowledgedTime = now;
        // 取消调度任务
        this.cancelScheduledNotification();
        break;
      case 'dismissed':
        this._dismissedTime = now;
        // 取消调度任务
        this.cancelScheduledNotification();
        break;
      case 'cancelled':
        // 取消调度任务
        this.cancelScheduledNotification();
        break;
    }

    this._version++;

    // 发布状态变更事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceStatusChanged',
      aggregateId: this._uuid,
      occurredOn: now,
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        oldStatus,
        newStatus: status,
        timestamp: now,
      },
    });
  }

  /**
   * 稍后提醒（服务端增强版本）
   */
  snooze(snoozeUntil: Date, reason?: string): void {
    this._snoozedUntil = snoozeUntil;
    this._status = 'snoozed' as ReminderContracts.ReminderStatus;
    this._currentSnoozeCount++;

    this._snoozeHistory.push({
      snoozedAt: new Date(),
      snoozeUntil,
      reason,
    });

    this._updatedAt = new Date();
    this._version++;

    // 重新调度到稍后提醒时间
    this.reschedule(snoozeUntil);

    // 发布稍后提醒事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceSnoozed',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        snoozeUntil,
        reason,
        snoozeCount: this._currentSnoozeCount,
      },
    });
  }

  // ===== 计算属性（服务端增强） =====

  get isOverdue(): boolean {
    if (this._status !== 'pending') {
      return false;
    }
    return new Date() > this._scheduledTime;
  }

  get isSnoozed(): boolean {
    return this._snoozedUntil ? new Date() < this._snoozedUntil : false;
  }

  get shouldTrigger(): boolean {
    if (this._status !== 'pending') {
      return false;
    }
    if (this.isSnoozed) {
      return false;
    }
    return new Date() >= this._scheduledTime;
  }

  get timeUntilScheduled(): number {
    return this._scheduledTime.getTime() - Date.now();
  }

  get hasScheduledJob(): boolean {
    return !!this._scheduleJobId;
  }

  get canRetryNotification(): boolean {
    return this._notificationAttempts < 3;
  }

  // ===== 业务规则验证 =====

  private validateBusinessRules(): void {
    if (!this._templateUuid) {
      throw new Error('提醒实例必须关联一个模板');
    }

    if (!this._message.trim()) {
      throw new Error('提醒消息不能为空');
    }

    if (this._scheduledTime <= new Date() && this._status === 'pending') {
      throw new Error('待处理的提醒不能设置为过去的时间');
    }
  }

  // ===== 序列化方法 =====

  toDTO(): ReminderContracts.IReminderInstance {
    return {
      uuid: this._uuid,
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
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this._version,
    };
  }

  static fromDTO(dto: ReminderContracts.IReminderInstance): ReminderInstance {
    return new ReminderInstance({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      title: dto.title,
      message: dto.message,
      scheduledTime: dto.scheduledTime,
      triggeredTime: dto.triggeredTime,
      acknowledgedTime: dto.acknowledgedTime,
      dismissedTime: dto.dismissedTime,
      snoozedUntil: dto.snoozedUntil,
      status: dto.status,
      priority: dto.priority,
      metadata: dto.metadata,
      snoozeHistory: dto.snoozeHistory || [],
      currentSnoozeCount: dto.currentSnoozeCount,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      version: dto.version,
    });
  }

  // ===== Getters =====

  get uuid(): string {
    return this._uuid;
  }

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

  get metadata(): typeof this._metadata {
    return this._metadata;
  }

  get snoozeHistory(): typeof this._snoozeHistory {
    return this._snoozeHistory;
  }

  get currentSnoozeCount(): number {
    return this._currentSnoozeCount;
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

  // 服务端特有的getters
  get scheduleJobId(): string | undefined {
    return this._scheduleJobId;
  }

  get notificationAttempts(): number {
    return this._notificationAttempts;
  }

  get lastNotificationAttempt(): Date | undefined {
    return this._lastNotificationAttempt;
  }
}
