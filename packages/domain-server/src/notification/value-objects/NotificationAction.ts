/**
 * NotificationAction 值对象
 * 通知操作 - 不可变值对象
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type INotificationAction = NotificationContracts.NotificationActionServerDTO;
type NotificationActionType = NotificationContracts.NotificationActionType;

/**
 * NotificationAction 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class NotificationAction extends ValueObject implements INotificationAction {
  public readonly id: string;
  public readonly label: string;
  public readonly type: NotificationActionType;
  public readonly payload?: any;

  constructor(params: { id: string; label: string; type: NotificationActionType; payload?: any }) {
    super();

    this.id = params.id;
    this.label = params.label;
    this.type = params.type;
    this.payload = params.payload;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      id: string;
      label: string;
      type: NotificationActionType;
      payload: any;
    }>,
  ): NotificationAction {
    return new NotificationAction({
      id: changes.id ?? this.id,
      label: changes.label ?? this.label,
      type: changes.type ?? this.type,
      payload: changes.payload ?? this.payload,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof NotificationAction)) {
      return false;
    }

    return (
      this.id === other.id &&
      this.label === other.label &&
      this.type === other.type &&
      JSON.stringify(this.payload) === JSON.stringify(other.payload)
    );
  }

  /**
   * 转换为 Contract 接口
   */
  public toContract(): INotificationAction {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      payload: this.payload,
    };
  }

  /**
   * 从 Contract 接口创建值对象
   */
  public static fromContract(action: INotificationAction): NotificationAction {
    return new NotificationAction(action);
  }
}
