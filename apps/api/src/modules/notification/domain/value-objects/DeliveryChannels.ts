import { NotificationChannel, NotificationPriority } from '@dailyuse/contracts';

/**
 * DeliveryChannels 值对象
 *
 * 封装通知的投递渠道配置
 * 不可变，通过值判断相等性
 */
export class DeliveryChannels {
  private constructor(
    public readonly channels: NotificationChannel[],
    public readonly priority: NotificationPriority,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.channels || this.channels.length === 0) {
      throw new Error('At least one delivery channel is required');
    }

    // 检查是否有重复渠道
    const uniqueChannels = new Set(this.channels);
    if (uniqueChannels.size !== this.channels.length) {
      throw new Error('Duplicate channels are not allowed');
    }

    // 验证优先级
    const validPriorities = Object.values(NotificationPriority);
    if (!validPriorities.includes(this.priority)) {
      throw new Error(`Invalid priority: ${this.priority}`);
    }
  }

  static create(params: {
    channels: NotificationChannel[];
    priority: NotificationPriority;
  }): DeliveryChannels {
    return new DeliveryChannels(params.channels, params.priority);
  }

  /**
   * 创建默认渠道配置（仅应用内）
   */
  static createDefault(): DeliveryChannels {
    return new DeliveryChannels([NotificationChannel.IN_APP], NotificationPriority.NORMAL);
  }

  /**
   * 检查是否包含指定渠道
   */
  hasChannel(channel: NotificationChannel): boolean {
    return this.channels.includes(channel);
  }

  /**
   * 检查是否包含任意指定渠道
   */
  hasAnyChannel(channels: NotificationChannel[]): boolean {
    return channels.some((c) => this.channels.includes(c));
  }

  /**
   * 获取渠道数量
   */
  get channelCount(): number {
    return this.channels.length;
  }

  /**
   * 是否是高优先级通知
   */
  get isHighPriority(): boolean {
    return (
      this.priority === NotificationPriority.HIGH || this.priority === NotificationPriority.URGENT
    );
  }

  /**
   * 是否需要立即发送（紧急优先级）
   */
  get isUrgent(): boolean {
    return this.priority === NotificationPriority.URGENT;
  }

  /**
   * 值对象相等性比较
   */
  equals(other: DeliveryChannels): boolean {
    if (this.priority !== other.priority) return false;
    if (this.channels.length !== other.channels.length) return false;

    const sortedThis = [...this.channels].sort();
    const sortedOther = [...other.channels].sort();

    return sortedThis.every((c, i) => c === sortedOther[i]);
  }

  /**
   * 转换为普通对象
   */
  toPlainObject() {
    return {
      channels: this.channels,
      priority: this.priority,
    };
  }
}
