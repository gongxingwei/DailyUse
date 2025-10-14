/**
 * ActiveHoursConfig 值对象
 * 活跃时间段配置 - 不可变值对象
 */

import type { ActiveHoursConfigServerDTO } from '@dailyuse/contracts/src/modules/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * ActiveHoursConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
export class ActiveHoursConfig extends ValueObject implements ActiveHoursConfigServerDTO {
  public readonly enabled: boolean;
  public readonly startHour: number;
  public readonly endHour: number;

  constructor(params: { enabled: boolean; startHour: number; endHour: number }) {
    super();

    this.enabled = params.enabled;
    this.startHour = params.startHour;
    this.endHour = params.endHour;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      enabled: boolean;
      startHour: number;
      endHour: number;
    }>,
  ): ActiveHoursConfig {
    return new ActiveHoursConfig({
      enabled: changes.enabled ?? this.enabled,
      startHour: changes.startHour ?? this.startHour,
      endHour: changes.endHour ?? this.endHour,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ActiveHoursConfig)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      this.startHour === other.startHour &&
      this.endHour === other.endHour
    );
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): ActiveHoursConfigServerDTO {
    return {
      enabled: this.enabled,
      startHour: this.startHour,
      endHour: this.endHour,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: ActiveHoursConfigServerDTO): ActiveHoursConfig {
    return new ActiveHoursConfig(dto);
  }
}
