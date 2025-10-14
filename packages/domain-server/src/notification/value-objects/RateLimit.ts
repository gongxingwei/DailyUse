/**
 * RateLimit 值对象
 * 频率限制 - 不可变值对象
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRateLimit = NotificationContracts.RateLimitServerDTO;

/**
 * RateLimit 值对象
 */
export class RateLimit extends ValueObject implements IRateLimit {
  public readonly enabled: boolean;
  public readonly maxPerHour: number;
  public readonly maxPerDay: number;

  constructor(params: { enabled: boolean; maxPerHour: number; maxPerDay: number }) {
    super();

    this.enabled = params.enabled;
    this.maxPerHour = params.maxPerHour;
    this.maxPerDay = params.maxPerDay;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      enabled: boolean;
      maxPerHour: number;
      maxPerDay: number;
    }>,
  ): RateLimit {
    return new RateLimit({
      enabled: changes.enabled ?? this.enabled,
      maxPerHour: changes.maxPerHour ?? this.maxPerHour,
      maxPerDay: changes.maxPerDay ?? this.maxPerDay,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RateLimit)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      this.maxPerHour === other.maxPerHour &&
      this.maxPerDay === other.maxPerDay
    );
  }

  /**
   * 转换为 Contract 接口
   */
  public toContract(): IRateLimit {
    return {
      enabled: this.enabled,
      maxPerHour: this.maxPerHour,
      maxPerDay: this.maxPerDay,
    };
  }

  /**
   * 从 Contract 接口创建值对象
   */
  public static fromContract(rateLimit: IRateLimit): RateLimit {
    return new RateLimit(rateLimit);
  }

  /**
   * 创建默认配置
   */
  public static createDefault(): RateLimit {
    return new RateLimit({
      enabled: false,
      maxPerHour: 10,
      maxPerDay: 100,
    });
  }
}
