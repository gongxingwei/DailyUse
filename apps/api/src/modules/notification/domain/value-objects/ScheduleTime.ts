/**
 * ScheduleTime 值对象
 *
 * 封装通知的调度时间配置
 * 不可变，通过值判断相等性
 */
export class ScheduleTime {
  private constructor(
    public readonly scheduledAt?: Date,
    public readonly expiresAt?: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    const now = new Date();

    if (this.scheduledAt && this.scheduledAt < now) {
      // 允许立即发送（scheduledAt 为当前或过去时间）
      // 但警告过去时间可能导致错误
      if (this.scheduledAt.getTime() < now.getTime() - 60000) {
        // 超过1分钟前
        console.warn(`ScheduledAt is in the past: ${this.scheduledAt.toISOString()}`);
      }
    }

    if (this.expiresAt && this.expiresAt <= now) {
      throw new Error('ExpiresAt must be in the future');
    }

    if (this.scheduledAt && this.expiresAt && this.scheduledAt >= this.expiresAt) {
      throw new Error('ScheduledAt must be before expiresAt');
    }
  }

  static create(params: { scheduledAt?: Date; expiresAt?: Date }): ScheduleTime {
    return new ScheduleTime(params.scheduledAt, params.expiresAt);
  }

  /**
   * 创建立即发送的调度时间
   */
  static createImmediate(expiresAt?: Date): ScheduleTime {
    return new ScheduleTime(undefined, expiresAt);
  }

  /**
   * 创建延迟发送的调度时间
   */
  static createDelayed(params: { delayMinutes: number; expiresAt?: Date }): ScheduleTime {
    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + params.delayMinutes);
    return new ScheduleTime(scheduledAt, params.expiresAt);
  }

  /**
   * 是否已过期
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() >= this.expiresAt;
  }

  /**
   * 是否应该立即发送
   */
  shouldSendNow(): boolean {
    if (!this.scheduledAt) return true;
    return new Date() >= this.scheduledAt;
  }

  /**
   * 剩余有效时间（毫秒）
   */
  getRemainingTime(): number | undefined {
    if (!this.expiresAt) return undefined;
    const remaining = this.expiresAt.getTime() - new Date().getTime();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * 距离发送时间（毫秒）
   */
  getTimeUntilScheduled(): number | undefined {
    if (!this.scheduledAt) return undefined;
    const until = this.scheduledAt.getTime() - new Date().getTime();
    return until > 0 ? until : 0;
  }

  /**
   * 值对象相等性比较
   */
  equals(other: ScheduleTime): boolean {
    return (
      this.scheduledAt?.getTime() === other.scheduledAt?.getTime() &&
      this.expiresAt?.getTime() === other.expiresAt?.getTime()
    );
  }

  /**
   * 转换为普通对象
   */
  toPlainObject() {
    return {
      scheduledAt: this.scheduledAt,
      expiresAt: this.expiresAt,
    };
  }
}
