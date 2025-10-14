/**
 * ReminderStats 值对象
 * 提醒统计信息 - 不可变值对象
 */

import type { ReminderStatsServerDTO } from '@dailyuse/contracts/src/modules/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * ReminderStats 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
export class ReminderStats extends ValueObject implements ReminderStatsServerDTO {
  public readonly totalTriggers: number;
  public readonly lastTriggeredAt: number | null;

  constructor(params: { totalTriggers: number; lastTriggeredAt?: number | null }) {
    super();

    this.totalTriggers = params.totalTriggers;
    this.lastTriggeredAt = params.lastTriggeredAt ?? null;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      totalTriggers: number;
      lastTriggeredAt: number | null;
    }>,
  ): ReminderStats {
    return new ReminderStats({
      totalTriggers: changes.totalTriggers ?? this.totalTriggers,
      lastTriggeredAt:
        changes.lastTriggeredAt !== undefined ? changes.lastTriggeredAt : this.lastTriggeredAt,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ReminderStats)) {
      return false;
    }

    return (
      this.totalTriggers === other.totalTriggers && this.lastTriggeredAt === other.lastTriggeredAt
    );
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): ReminderStatsServerDTO {
    return {
      totalTriggers: this.totalTriggers,
      lastTriggeredAt: this.lastTriggeredAt,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: ReminderStatsServerDTO): ReminderStats {
    return new ReminderStats(dto);
  }
}
