/**
 * 用户设置事件类型定义
 */
export enum UserSettingEventType {
  // 主题相关事件
  THEME_CHANGED = 'theme:changed',
  // 语言相关事件
  LANGUAGE_CHANGED = 'language:changed',
  // 通知相关事件
  NOTIFICATIONS_CHANGED = 'notifications:changed',
  // 快捷键相关事件
  SHORTCUTS_CHANGED = 'shortcuts:changed',
  // 隐私设置相关事件
  PRIVACY_CHANGED = 'privacy:changed',
  // 工作流相关事件
  WORKFLOW_CHANGED = 'workflow:changed',
  // 实验性功能相关事件
  EXPERIMENTAL_CHANGED = 'experimental:changed',
  // 完整设置更新事件
  SETTING_UPDATED = 'setting:updated',
  // 设置创建事件
  SETTING_CREATED = 'setting:created',
  // 设置删除事件
  SETTING_DELETED = 'setting:deleted',
  // 错误事件
  ERROR = 'error',
}

/**
 * 用户设置事件数据
 */
export interface UserSettingEventData {
  [UserSettingEventType.THEME_CHANGED]: { theme: string };
  [UserSettingEventType.LANGUAGE_CHANGED]: { language: string };
  [UserSettingEventType.NOTIFICATIONS_CHANGED]: { enabled: boolean };
  [UserSettingEventType.SHORTCUTS_CHANGED]: { action: string; shortcut: string | null };
  [UserSettingEventType.PRIVACY_CHANGED]: any;
  [UserSettingEventType.WORKFLOW_CHANGED]: any;
  [UserSettingEventType.EXPERIMENTAL_CHANGED]: { feature: string; enabled: boolean };
  [UserSettingEventType.SETTING_UPDATED]: { uuid: string };
  [UserSettingEventType.SETTING_CREATED]: { uuid: string };
  [UserSettingEventType.SETTING_DELETED]: { uuid: string };
  [UserSettingEventType.ERROR]: { error: Error; context?: string };
}

/**
 * 事件处理器类型
 */
export type UserSettingEventHandler<T extends UserSettingEventType> = (
  data: UserSettingEventData[T],
) => void | Promise<void>;

/**
 * 简单的事件发射器
 * 用于用户设置变更通知
 */
export class UserSettingEventEmitter {
  private listeners: Map<UserSettingEventType, Set<UserSettingEventHandler<any>>> = new Map();

  /**
   * 注册事件监听器
   */
  public on<T extends UserSettingEventType>(
    event: T,
    handler: UserSettingEventHandler<T>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // 返回取消监听的函数
    return () => this.off(event, handler);
  }

  /**
   * 注册一次性事件监听器
   */
  public once<T extends UserSettingEventType>(
    event: T,
    handler: UserSettingEventHandler<T>,
  ): void {
    const onceHandler = (data: UserSettingEventData[T]) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * 移除事件监听器
   */
  public off<T extends UserSettingEventType>(
    event: T,
    handler: UserSettingEventHandler<T>,
  ): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 触发事件
   */
  public emit<T extends UserSettingEventType>(event: T, data: UserSettingEventData[T]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          const result = handler(data);
          // 支持异步处理器
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error(`[UserSettingEventEmitter] Handler error for ${event}:`, error);
            });
          }
        } catch (error) {
          console.error(`[UserSettingEventEmitter] Handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 移除所有监听器
   */
  public clear(): void {
    this.listeners.clear();
  }

  /**
   * 移除特定事件的所有监听器
   */
  public clearEvent(event: UserSettingEventType): void {
    this.listeners.delete(event);
  }

  /**
   * 获取事件的监听器数量
   */
  public listenerCount(event: UserSettingEventType): number {
    return this.listeners.get(event)?.size || 0;
  }
}
