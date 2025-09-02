export interface DomainEvent<T = unknown> {
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
  payload: T;
}

/**
 * 领域事件处理器类型
 */
type EventHandler<T extends DomainEvent = DomainEvent<unknown>> = (event: T) => Promise<void>;

/**
 * 简单的内存事件总线
 * 用于在主进程中实现模块间的事件通信
 */
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 订阅事件
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
    console.log(`📝 [EventBus] 订阅事件: ${eventType}`);
  }

  /**
   * 发布事件
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    
    if (handlers.length === 0) {
      console.log(`⚠️ [EventBus] 没有找到事件处理器: ${event.eventType}`);
      return;
    }

    console.log(`📢 [EventBus] 发布事件: ${event.eventType}, 处理器数量: ${handlers.length}`);

    // 并行执行所有处理器
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`❌ [EventBus] 事件处理器执行失败 (${event.eventType}):`, error);
        // 这里可以添加重试逻辑或死信队列
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 发布多个事件
   */
  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`🗑️ [EventBus] 取消订阅事件: ${eventType}`);
      }
    }
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    this.handlers.clear();
    console.log(`🧹 [EventBus] 清除所有事件订阅`);
  }

  /**
   * 获取已订阅的事件类型
   */
  getSubscribedEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * 便捷的全局事件总线实例
 */
export const eventBus = EventBus.getInstance();
