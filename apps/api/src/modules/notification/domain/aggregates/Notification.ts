import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
} from '@dailyuse/contracts';
import { NotificationContent } from '../value-objects/NotificationContent';
import { NotificationAction } from '../value-objects/NotificationAction';
import { DeliveryChannels } from '../value-objects/DeliveryChannels';
import { ScheduleTime } from '../value-objects/ScheduleTime';
import { NotificationMetadata } from '../value-objects/NotificationMetadata';
import { DeliveryReceipt } from '../entities/DeliveryReceipt';

/**
 * Notification 聚合根
 *
 * 职责：
 * - 管理通知的完整生命周期
 * - 控制通知状态转换
 * - 管理多渠道发送回执
 * - 保证业务不变量
 *
 * 生命周期：
 * PENDING → SENT → READ/DISMISSED (正常流程)
 * PENDING → EXPIRED (过期)
 * PENDING → SENT → FAILED (发送失败)
 */
export class Notification {
  private _deliveryReceipts: Map<NotificationChannel, DeliveryReceipt> = new Map();

  private constructor(
    private _uuid: string,
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

  get uuid(): string {
    return this._uuid;
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
   * 标记为已读
   */
  markAsRead(readAt: Date = new Date()): void {
    if (this._status !== NotificationStatus.SENT) {
      throw new Error(`Cannot mark as READ from status ${this._status}. Must be SENT.`);
    }

    this._status = NotificationStatus.READ;
    this._readAt = readAt;
    this._updatedAt = new Date();
    this._version += 1;
  }

  /**
   * 标记为已忽略
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
  }

  /**
   * 标记为过期
   */
  markAsExpired(): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error(`Cannot mark as EXPIRED from status ${this._status}. Must be PENDING.`);
    }

    if (!this._scheduleTime.isExpired()) {
      throw new Error('Cannot mark as EXPIRED before expiration time');
    }

    this._status = NotificationStatus.EXPIRED;
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
