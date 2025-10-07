import { NotificationChannel, DeliveryStatus } from '@dailyuse/contracts';

/**
 * DeliveryReceipt 实体
 *
 * 职责：
 * - 记录单个渠道的发送状态
 * - 跟踪发送时间、交付时间
 * - 记录失败原因和重试次数
 * - 存储渠道特定的元数据
 *
 * 生命周期：
 * PENDING → SENT → DELIVERED (成功)
 * PENDING → FAILED → RETRYING → SENT → DELIVERED (重试成功)
 * PENDING → FAILED (最终失败)
 */
export class DeliveryReceipt {
  private constructor(
    private _uuid: string,
    private _notificationUuid: string,
    private _channel: NotificationChannel,
    private _status: DeliveryStatus,
    private _sentAt?: Date,
    private _deliveredAt?: Date,
    private _failureReason?: string,
    private _retryCount: number = 0,
    private _metadata?: Record<string, any>,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this._uuid || this._uuid.trim().length === 0) {
      throw new Error('DeliveryReceipt uuid cannot be empty');
    }

    if (!this._notificationUuid || this._notificationUuid.trim().length === 0) {
      throw new Error('DeliveryReceipt notificationUuid cannot be empty');
    }

    if (this._retryCount < 0) {
      throw new Error('Retry count cannot be negative');
    }

    // 状态验证
    if (this._status === DeliveryStatus.SENT && !this._sentAt) {
      throw new Error('SENT status requires sentAt timestamp');
    }

    if (this._status === DeliveryStatus.DELIVERED && !this._deliveredAt) {
      throw new Error('DELIVERED status requires deliveredAt timestamp');
    }

    if (
      (this._status === DeliveryStatus.FAILED || this._status === DeliveryStatus.RETRYING) &&
      !this._failureReason
    ) {
      throw new Error('FAILED/RETRYING status requires failureReason');
    }

    // 时间验证
    if (this._sentAt && this._deliveredAt && this._sentAt > this._deliveredAt) {
      throw new Error('SentAt cannot be after deliveredAt');
    }
  }

  // ========== Getters ==========

  get uuid(): string {
    return this._uuid;
  }

  get notificationUuid(): string {
    return this._notificationUuid;
  }

  get channel(): NotificationChannel {
    return this._channel;
  }

  get status(): DeliveryStatus {
    return this._status;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get deliveredAt(): Date | undefined {
    return this._deliveredAt;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  // ========== 静态工厂方法 ==========

  /**
   * 创建待发送的回执
   */
  static createPending(params: {
    uuid: string;
    notificationUuid: string;
    channel: NotificationChannel;
    metadata?: Record<string, any>;
  }): DeliveryReceipt {
    return new DeliveryReceipt(
      params.uuid,
      params.notificationUuid,
      params.channel,
      DeliveryStatus.PENDING,
      undefined,
      undefined,
      undefined,
      0,
      params.metadata,
    );
  }

  /**
   * 从持久化数据重建实体
   */
  static fromPersistence(data: {
    uuid: string;
    notificationUuid: string;
    channel: NotificationChannel;
    status: DeliveryStatus;
    sentAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
    retryCount: number;
    metadata?: Record<string, any>;
  }): DeliveryReceipt {
    return new DeliveryReceipt(
      data.uuid,
      data.notificationUuid,
      data.channel,
      data.status,
      data.sentAt,
      data.deliveredAt,
      data.failureReason,
      data.retryCount,
      data.metadata,
    );
  }

  // ========== 业务方法 ==========

  /**
   * 标记为已发送
   */
  markAsSent(sentAt: Date = new Date()): void {
    if (this._status !== DeliveryStatus.PENDING && this._status !== DeliveryStatus.RETRYING) {
      throw new Error(
        `Cannot mark as SENT from status ${this._status}. Must be PENDING or RETRYING.`,
      );
    }

    this._status = DeliveryStatus.SENT;
    this._sentAt = sentAt;
  }

  /**
   * 标记为已交付
   */
  markAsDelivered(deliveredAt: Date = new Date()): void {
    if (this._status !== DeliveryStatus.SENT) {
      throw new Error(`Cannot mark as DELIVERED from status ${this._status}. Must be SENT.`);
    }

    if (!this._sentAt) {
      throw new Error('Cannot mark as DELIVERED without sentAt timestamp');
    }

    this._status = DeliveryStatus.DELIVERED;
    this._deliveredAt = deliveredAt;
  }

  /**
   * 标记为发送失败
   */
  markAsFailed(failureReason: string, canRetry: boolean = false): void {
    if (
      this._status !== DeliveryStatus.PENDING &&
      this._status !== DeliveryStatus.SENT &&
      this._status !== DeliveryStatus.RETRYING
    ) {
      throw new Error(`Cannot mark as FAILED from status ${this._status}`);
    }

    this._failureReason = failureReason;

    if (canRetry) {
      this._status = DeliveryStatus.RETRYING;
    } else {
      this._status = DeliveryStatus.FAILED;
    }
  }

  /**
   * 增加重试次数并重置为待发送
   */
  incrementRetry(): void {
    if (this._status !== DeliveryStatus.RETRYING) {
      throw new Error(`Cannot increment retry from status ${this._status}. Must be RETRYING.`);
    }

    this._retryCount += 1;
    this._status = DeliveryStatus.PENDING;
    // 清除之前的发送记录，准备重新发送
    this._sentAt = undefined;
  }

  /**
   * 检查是否可以重试
   */
  canRetry(maxRetries: number = 3): boolean {
    return (
      (this._status === DeliveryStatus.FAILED || this._status === DeliveryStatus.RETRYING) &&
      this._retryCount < maxRetries
    );
  }

  /**
   * 检查是否成功交付
   */
  isDelivered(): boolean {
    return this._status === DeliveryStatus.DELIVERED;
  }

  /**
   * 检查是否失败
   */
  isFailed(): boolean {
    return this._status === DeliveryStatus.FAILED;
  }

  /**
   * 检查是否正在重试
   */
  isRetrying(): boolean {
    return this._status === DeliveryStatus.RETRYING;
  }

  /**
   * 获取交付耗时（毫秒）
   */
  getDeliveryDuration(): number | undefined {
    if (!this._sentAt || !this._deliveredAt) return undefined;
    return this._deliveredAt.getTime() - this._sentAt.getTime();
  }

  /**
   * 更新元数据
   */
  updateMetadata(metadata: Record<string, any>): void {
    this._metadata = {
      ...this._metadata,
      ...metadata,
    };
  }

  /**
   * 转换为普通对象（用于持久化）
   */
  toPlainObject() {
    return {
      uuid: this._uuid,
      notificationUuid: this._notificationUuid,
      channel: this._channel,
      status: this._status,
      sentAt: this._sentAt,
      deliveredAt: this._deliveredAt,
      failureReason: this._failureReason,
      retryCount: this._retryCount,
      metadata: this._metadata,
    };
  }
}
