import type { DomainEvent } from '../domain/domainEvent';

type EventHandler<T = any> = (event: T) => Promise<void> | void;

/**
 * 事件总线，用于发布和订阅领域事件
 * 单例模式实现，确保全局只有一个事件总线实例
 */
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler[]> = new Map();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 订阅事件
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * 取消订阅事件
   * @param eventType - 事件类型
   * @param handler - 要取消的事件处理器
   */
  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 发布事件
   * @param event - 要发布的事件
   */
  async publish<T extends DomainEvent>(event: T) {
    const handlers = this.handlers.get(event.eventType) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`事件处理失败 ${event.eventType}:`, error);
      }
    }
  }

  /**
   * 清除所有事件处理器
   */
  clearHandlers() {
    this.handlers.clear();
  }
}