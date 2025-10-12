import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
} from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { NotificationContent } from '../value-objects/NotificationContent';
import { NotificationAction } from '../value-objects/NotificationAction';
import { DeliveryChannels } from '../value-objects/DeliveryChannels';
import { ScheduleTime } from '../value-objects/ScheduleTime';
import { NotificationMetadata } from '../value-objects/NotificationMetadata';
import { DeliveryReceipt } from '../entities/DeliveryReceipt';
import {
  NotificationCreatedEvent,
  NotificationSendingEvent,
  NotificationSentEvent,
  NotificationChannelSentEvent,
  NotificationChannelFailedEvent,
  NotificationReadEvent,
  NotificationDismissedEvent,
  NotificationExpiredEvent,
  NotificationFailedEvent,
} from '../events/NotificationEvents';

/**
 * Notification 聚合根
 *
 * 职责：
 * - 管理通知的完整生命周期
 * - 控制通知状态转换
 * - 管理多渠道发送回执
 * - 发布领域事件
 * - 保证业务不变量
 *
 * 生命周期：
 * PENDING → SENT → READ/DISMISSED (正常流程)
 * PENDING → EXPIRED (过期)
 * PENDING → SENT → FAILED (发送失败)
 *
 * 多通道发送管理：
 * - 为每个通道创建 DeliveryReceipt
 * - 跟踪各通道的发送状态
 * - 支持部分成功（某些通道成功，某些失败）
 * - 自动发布通道级别的领域事件
 */
export class Notification extends AggregateRoot {
  private _deliveryReceipts: Map<NotificationChannel, DeliveryReceipt> = new Map();

  private constructor(
    uuid: string,
    private _accountUuid: string,
    private _content: NotificationContent,
    private _type: NotificationType,
    private _deliveryChannels: DeliveryChannels,
    private _scheduleTime: ScheduleTime,
    private _metadata?: NotificationMetadata,
    private _templateUuid?: string,
    private _actions?: NotificationAction[],
    private _status: NotificationStatus = NotificationStatus.PENDING,
    private _sentAt?: Date,
    private _readAt?: Date,
    private _dismissedAt?: Date,
    private _version: number = 1,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {
    super(uuid);
    this.validate();
  }

  private validate(): void {
    if (!this._uuid || this._uuid.trim().length === 0) {
      throw new Error('Notification uuid cannot be empty');
    }

    if (!this._accountUuid || this._accountUuid.trim().length === 0) {
      throw new Error('Notification accountUuid cannot be empty');
    }

    // 检查状态一致性
    if (this._status === NotificationStatus.SENT && !this._sentAt) {
      throw new Error('SENT status requires sentAt timestamp');
    }

    if (this._status === NotificationStatus.READ && !this._readAt) {
      throw new Error('READ status requires readAt timestamp');
    }

    if (this._status === NotificationStatus.DISMISSED && !this._dismissedAt) {
      throw new Error('DISMISSED status requires dismissedAt timestamp');
    }

    // 检查时间逻辑
    if (this._readAt && this._sentAt && this._readAt < this._sentAt) {
      throw new Error('ReadAt cannot be before sentAt');
    }
  }

  // ========== Getters ==========

  override get uuid(): string {
    return this._uuid; // 继承自 AggregateRoot
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get content(): NotificationContent {
    return this._content;
  }

  get type(): NotificationType {
    return this._type;
  }

  get deliveryChannels(): DeliveryChannels {
    return this._deliveryChannels;
  }

  get scheduleTime(): ScheduleTime {
    return this._scheduleTime;
  }

  get metadata(): NotificationMetadata | undefined {
    return this._metadata;
  }

  get templateUuid(): string | undefined {
    return this._templateUuid;
  }

  get actions(): NotificationAction[] | undefined {
    return this._actions;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get readAt(): Date | undefined {
    return this._readAt;
  }

  get dismissedAt(): Date | undefined {
    return this._dismissedAt;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deliveryReceipts(): DeliveryReceipt[] {
    return Array.from(this._deliveryReceipts.values());
  }

  // ========== 静态工厂方法 ==========

  /**
   * 创建新通知
   */
  static create(params: {
    uuid: string;
    accountUuid: string;
    content: NotificationContent;
    type: NotificationType;
    deliveryChannels: DeliveryChannels;
    scheduleTime: ScheduleTime;
    metadata?: NotificationMetadata;
    templateUuid?: string;
    actions?: NotificationAction[];
  }): Notification {
    const notification = new Notification(
      params.uuid,
      params.accountUuid,
      params.content,
      params.type,
      params.deliveryChannels,
      params.scheduleTime,
      params.metadata,
      params.templateUuid,
      params.actions,
    );

    // 为每个渠道创建初始回执
    params.deliveryChannels.channels.forEach((channel) => {
      const receipt = DeliveryReceipt.createPending({
        uuid: `${params.uuid}-${channel}`,
        notificationUuid: params.uuid,
        channel,
      });
      notification._deliveryReceipts.set(channel, receipt);
    });

    // 发布领域事件：通知已创建
    notification.addDomainEvent(
      new NotificationCreatedEvent(params.uuid, params.accountUuid, {
        title: params.content.title,
        content: params.content.content,
        type: params.type,
        priority: 'normal', // TODO: 从 metadata 或参数获取
        channels: params.deliveryChannels.channels,
        scheduledTime: params.scheduleTime.scheduledAt,
        metadata: params.metadata?.toPlainObject(),
      }),
    );

    return notification;
  }

  /**
   * 从持久化数据重建聚合
   */
  static fromPersistence(data: {
    uuid: string;
    accountUuid: string;
    content: NotificationContent;
    type: NotificationType;
    deliveryChannels: DeliveryChannels;
    scheduleTime: ScheduleTime;
    metadata?: NotificationMetadata;
    templateUuid?: string;
    actions?: NotificationAction[];
    status: NotificationStatus;
    sentAt?: Date;
    readAt?: Date;
    dismissedAt?: Date;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deliveryReceipts?: DeliveryReceipt[];
  }): Notification {
    const notification = new Notification(
      data.uuid,
      data.accountUuid,
      data.content,
      data.type,
      data.deliveryChannels,
      data.scheduleTime,
      data.metadata,
      data.templateUuid,
      data.actions,
      data.status,
      data.sentAt,
      data.readAt,
      data.dismissedAt,
      data.version,
      data.createdAt,
      data.updatedAt,
    );

    // 恢复发送回执
    data.deliveryReceipts?.forEach((receipt) => {
      notification._deliveryReceipts.set(receipt.channel, receipt);
    });

    return notification;
  }

  // ========== 业务方法 ==========

  /**
   * 检查是否应该发送
   */
  shouldSend(): boolean {
    if (this._status !== NotificationStatus.PENDING) {
      return false;
    }

    if (this._scheduleTime.isExpired()) {
      return false;
    }

    return this._scheduleTime.shouldSendNow();
  }

  /**
   * 标记为已发送
   */
  markAsSent(sentAt: Date = new Date()): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error(`Cannot mark as SENT from status ${this._status}. Must be PENDING.`);
    }

    if (this._scheduleTime.isExpired()) {
      throw new Error('Cannot send expired notification');
    }

    this._status = NotificationStatus.SENT;
    this._sentAt = sentAt;
    this._updatedAt = new Date();
    this._version += 1;
  }

  /**
   * 标记为发送失败
   */
  markAsFailed(): void {
    if (this._status !== NotificationStatus.PENDING && this._status !== NotificationStatus.SENT) {
      throw new Error(`Cannot mark as FAILED from status ${this._status}.`);
    }

    this._status = NotificationStatus.FAILED;
    this._updatedAt = new Date();
    this._version += 1;
  }

  /**
   * 添加或更新发送回执
   */
  addOrUpdateDeliveryReceipt(receipt: DeliveryReceipt): void {
    if (receipt.notificationUuid !== this._uuid) {
      throw new Error('DeliveryReceipt does not belong to this notification');
    }

    this._deliveryReceipts.set(receipt.channel, receipt);
    this._updatedAt = new Date();
  }

  /**
   * 获取指定渠道的发送回执
   */
  getDeliveryReceipt(channel: NotificationChannel): DeliveryReceipt | undefined {
    return this._deliveryReceipts.get(channel);
  }

  /**
   * 检查所有渠道是否都已交付
   */
  isAllChannelsDelivered(): boolean {
    return Array.from(this._deliveryReceipts.values()).every((receipt) => receipt.isDelivered());
  }

  /**
   * 获取已交付的渠道数
   */
  getDeliveredChannelCount(): number {
    return Array.from(this._deliveryReceipts.values()).filter((receipt) => receipt.isDelivered())
      .length;
  }

  /**
   * 获取发送成功率
   */
  getDeliverySuccessRate(): number {
    const total = this._deliveryReceipts.size;
    if (total === 0) return 0;

    const delivered = this.getDeliveredChannelCount();
    return (delivered / total) * 100;
  }

  /**
   * 检查是否已读
   */
  isRead(): boolean {
    return this._status === NotificationStatus.READ;
  }

  /**
   * 检查是否已忽略
   */
  isDismissed(): boolean {
    return this._status === NotificationStatus.DISMISSED;
  }

  /**
   * 检查是否已过期
   */
  isExpired(): boolean {
    return this._status === NotificationStatus.EXPIRED || this._scheduleTime.isExpired();
  }

  // ========== 多通道状态管理方法（新增） ==========

  /**
   * 标记单个通道发送成功
   *
   * 用途：
   * - TaskTriggeredHandler 调用此方法记录各通道发送状态
   * - 自动发布 NotificationChannelSentEvent 事件
   * - 当所有通道都成功后，自动标记通知为 SENT
   *
   * @param channel 通道类型
   * @param sentAt 发送时间
   * @param metadata 通道特定元数据（如邮件ID、短信ID等）
   */
  markChannelSent(
    channel: NotificationChannel,
    sentAt: Date = new Date(),
    metadata?: Record<string, any>,
  ): void {
    const receipt = this._deliveryReceipts.get(channel);

    if (!receipt) {
      throw new Error(`No delivery receipt found for channel: ${channel}`);
    }

    // 更新回执状态
    receipt.markAsSent(sentAt);
    if (metadata) {
      receipt.updateMetadata(metadata);
    }

    // 发布领域事件：通道发送成功
    this.addDomainEvent(
      new NotificationChannelSentEvent(this._uuid, this._accountUuid, {
        channel,
        sentAt,
        deliveredAt: sentAt, // 对于某些通道（如SSE），发送即交付
        metadata,
      }),
    );

    // 检查是否所有通道都已发送
    const allSent = Array.from(this._deliveryReceipts.values()).every(
      (r) => r.status !== 'pending',
    );

    if (allSent && this._status === NotificationStatus.PENDING) {
      // 自动标记为已发送
      const sentChannels = this.getSentChannels();
      const failedChannels = this.getFailedChannels();

      this._status = NotificationStatus.SENT;
      this._sentAt = sentAt;
      this._updatedAt = new Date();

      // 发布领域事件：通知已发送（所有通道完成）
      this.addDomainEvent(
        new NotificationSentEvent(this._uuid, this._accountUuid, {
          sentChannels,
          failedChannels,
          totalChannels: this._deliveryChannels.channels.length,
          successRate: this.getDeliverySuccessRate(),
          sentAt,
        }),
      );
    }
  }

  /**
   * 标记单个通道发送失败
   *
   * 用途：
   * - TaskTriggeredHandler 在重试失败后调用此方法
   * - 自动发布 NotificationChannelFailedEvent 事件
   * - 如果所有通道都失败，自动标记通知为 FAILED
   *
   * @param channel 通道类型
   * @param failureReason 失败原因
   * @param retryCount 当前重试次数
   * @param canRetry 是否还能重试
   */
  markChannelFailed(
    channel: NotificationChannel,
    failureReason: string,
    retryCount: number = 0,
    canRetry: boolean = false,
  ): void {
    const receipt = this._deliveryReceipts.get(channel);

    if (!receipt) {
      throw new Error(`No delivery receipt found for channel: ${channel}`);
    }

    // 更新回执状态
    receipt.markAsFailed(failureReason, canRetry);

    // 发布领域事件：通道发送失败
    this.addDomainEvent(
      new NotificationChannelFailedEvent(this._uuid, this._accountUuid, {
        channel,
        failureReason,
        retryCount,
        canRetry,
        failedAt: new Date(),
      }),
    );

    // 检查是否所有通道都失败了
    const allFailed = Array.from(this._deliveryReceipts.values()).every(
      (r) => r.status === 'failed',
    );

    if (allFailed && this._status !== NotificationStatus.FAILED) {
      // 所有通道都失败：标记通知为失败
      this._status = NotificationStatus.FAILED;
      this._updatedAt = new Date();

      // 发布领域事件：通知失败（所有通道）
      const failureReasons: Record<string, string> = {};
      this._deliveryReceipts.forEach((receipt, ch) => {
        if (receipt.failureReason) {
          failureReasons[ch] = receipt.failureReason;
        }
      });

      this.addDomainEvent(
        new NotificationFailedEvent(this._uuid, this._accountUuid, {
          failedChannels: this.getFailedChannels(),
          failureReasons,
          failedAt: new Date(),
        }),
      );
    }
  }

  /**
   * 开始发送通知（准备发送）
   *
   * 用途：
   * - TaskTriggeredHandler 在开始发送前调用
   * - 发布 NotificationSendingEvent 事件
   */
  startSending(): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error(`Cannot start sending from status ${this._status}. Must be PENDING.`);
    }

    // 发布领域事件：通知发送中
    this.addDomainEvent(
      new NotificationSendingEvent(this._uuid, this._accountUuid, {
        channels: this._deliveryChannels.channels,
        sentAt: new Date(),
      }),
    );
  }

  /**
   * 获取已成功发送的通道列表
   */
  getSentChannels(): NotificationChannel[] {
    return Array.from(this._deliveryReceipts.entries())
      .filter(([_, receipt]) => receipt.isDelivered())
      .map(([channel, _]) => channel);
  }

  /**
   * 获取发送失败的通道列表
   */
  getFailedChannels(): NotificationChannel[] {
    return Array.from(this._deliveryReceipts.entries())
      .filter(([_, receipt]) => receipt.isFailed())
      .map(([channel, _]) => channel);
  }

  /**
   * 获取待发送的通道列表
   */
  getPendingChannels(): NotificationChannel[] {
    return Array.from(this._deliveryReceipts.entries())
      .filter(([_, receipt]) => receipt.status === 'pending')
      .map(([channel, _]) => channel);
  }

  // ========== 增强现有方法，添加领域事件发布 ==========

  /**
   * 标记为已读（增强版）
   */
  markAsRead(readAt: Date = new Date()): void {
    if (this._status !== NotificationStatus.SENT) {
      throw new Error(`Cannot mark as READ from status ${this._status}. Must be SENT.`);
    }

    const readDuration = this._sentAt ? readAt.getTime() - this._sentAt.getTime() : undefined;

    this._status = NotificationStatus.READ;
    this._readAt = readAt;
    this._updatedAt = new Date();
    this._version += 1;

    // 发布领域事件：通知已读
    this.addDomainEvent(
      new NotificationReadEvent(this._uuid, this._accountUuid, {
        readAt,
        readDuration,
      }),
    );
  }

  /**
   * 标记为已忽略（增强版）
   */
  markAsDismissed(dismissedAt: Date = new Date()): void {
    if (this._status !== NotificationStatus.SENT && this._status !== NotificationStatus.READ) {
      throw new Error(
        `Cannot mark as DISMISSED from status ${this._status}. Must be SENT or READ.`,
      );
    }

    this._status = NotificationStatus.DISMISSED;
    this._dismissedAt = dismissedAt;
    this._updatedAt = new Date();
    this._version += 1;

    // 发布领域事件：通知已忽略
    this.addDomainEvent(
      new NotificationDismissedEvent(this._uuid, this._accountUuid, {
        dismissedAt,
      }),
    );
  }

  /**
   * 标记为过期（增强版）
   */
  markAsExpired(): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error(`Cannot mark as EXPIRED from status ${this._status}. Must be PENDING.`);
    }

    if (!this._scheduleTime.isExpired()) {
      throw new Error('Cannot mark as EXPIRED before expiration time');
    }

    // 记录当前状态是否为已读
    const wasRead = this._readAt !== undefined;

    this._status = NotificationStatus.EXPIRED;
    this._updatedAt = new Date();
    this._version += 1;

    // 发布领域事件：通知已过期
    this.addDomainEvent(
      new NotificationExpiredEvent(this._uuid, this._accountUuid, {
        expiredAt: new Date(),
        wasRead,
      }),
    );
  }

  /**
   * 转换为普通对象（用于持久化）
   */
  toPlainObject() {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      content: this._content.toPlainObject(),
      type: this._type,
      deliveryChannels: this._deliveryChannels.toPlainObject(),
      scheduleTime: this._scheduleTime.toPlainObject(),
      metadata: this._metadata?.toPlainObject(),
      templateUuid: this._templateUuid,
      actions: this._actions?.map((a) => a.toPlainObject()),
      status: this._status,
      sentAt: this._sentAt,
      readAt: this._readAt,
      dismissedAt: this._dismissedAt,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deliveryReceipts: Array.from(this._deliveryReceipts.values()).map((r) => r.toPlainObject()),
    };
  }
}
