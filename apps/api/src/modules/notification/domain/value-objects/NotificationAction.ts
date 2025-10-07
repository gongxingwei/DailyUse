import { NotificationActionType } from '@dailyuse/contracts';

/**
 * NotificationAction 值对象
 *
 * 封装通知的可执行动作（导航、执行、忽略）
 * 不可变，通过值判断相等性
 */
export class NotificationAction {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly type: NotificationActionType,
    public readonly icon?: string,
    public readonly payload?: Record<string, any>,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Action id cannot be empty');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Action title cannot be empty');
    }

    if (this.type === NotificationActionType.NAVIGATE && (!this.payload || !this.payload.path)) {
      throw new Error('Navigate action requires a path in payload');
    }

    if (this.type === NotificationActionType.EXECUTE && (!this.payload || !this.payload.command)) {
      throw new Error('Execute action requires a command in payload');
    }
  }

  static create(params: {
    id: string;
    title: string;
    type: NotificationActionType;
    icon?: string;
    payload?: Record<string, any>;
  }): NotificationAction {
    return new NotificationAction(
      params.id.trim(),
      params.title.trim(),
      params.type,
      params.icon,
      params.payload,
    );
  }

  /**
   * 创建导航动作
   */
  static createNavigateAction(params: {
    id: string;
    title: string;
    path: string;
    icon?: string;
  }): NotificationAction {
    return new NotificationAction(
      params.id,
      params.title,
      NotificationActionType.NAVIGATE,
      params.icon,
      { path: params.path },
    );
  }

  /**
   * 创建执行动作
   */
  static createExecuteAction(params: {
    id: string;
    title: string;
    command: string;
    args?: any[];
    icon?: string;
  }): NotificationAction {
    return new NotificationAction(
      params.id,
      params.title,
      NotificationActionType.EXECUTE,
      params.icon,
      { command: params.command, args: params.args },
    );
  }

  /**
   * 创建忽略动作
   */
  static createDismissAction(params: {
    id: string;
    title: string;
    icon?: string;
  }): NotificationAction {
    return new NotificationAction(
      params.id,
      params.title,
      NotificationActionType.DISMISS,
      params.icon,
    );
  }

  /**
   * 值对象相等性比较
   */
  equals(other: NotificationAction): boolean {
    return (
      this.id === other.id &&
      this.title === other.title &&
      this.type === other.type &&
      this.icon === other.icon &&
      JSON.stringify(this.payload) === JSON.stringify(other.payload)
    );
  }

  /**
   * 转换为普通对象
   */
  toPlainObject() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      icon: this.icon,
      payload: this.payload,
    };
  }
}
