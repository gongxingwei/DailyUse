import { DomainEvent } from './DomainEvent';

/**
 * 事件处理器接口
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * 处理事件
   */
  handle(event: T): Promise<void>;

  /**
   * 获取此处理器关注的事件类型
   */
  subscribedTo(): string;
}

/**
 * 事件总线接口
 */
export interface EventBus {
  /**
   * 发布事件
   */
  publish(events: DomainEvent[]): Promise<void>;

  /**
   * 订阅事件
   */
  subscribe(handler: EventHandler): void;
}

/**
 * 内存事件总线实现
 * 适用于单体应用，生产环境可替换为消息队列
 */
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventHistory: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      // 记录事件历史（可选，用于调试）
      this.eventHistory.push(event);

      // 获取订阅此事件类型的所有处理器
      const handlers = this.handlers.get(event.eventType) || [];

      console.log(
        `📢 [EventBus] Publishing event: ${event.eventType} (${handlers.length} handlers)`,
        {
          eventId: event.eventId,
          aggregateId: event.aggregateId,
          occurredOn: event.occurredOn,
          data: event.toPrimitives(),
        },
      );

      // 并行执行所有处理器
      await Promise.all(
        handlers.map(async (handler) => {
          try {
            console.log(
              `🔄 [EventBus] Handling event ${event.eventType} with ${handler.constructor.name}`,
            );
            await handler.handle(event);
            console.log(
              `✅ [EventBus] Successfully handled event ${event.eventType} with ${handler.constructor.name}`,
            );
          } catch (error) {
            console.error(
              `❌ [EventBus] Error handling event ${event.eventType} with ${handler.constructor.name}:`,
              error,
            );
            // 在生产环境中，这里应该发送到错误监控系统
            // 不抛出错误，避免影响其他处理器
          }
        }),
      );
    }
  }

  subscribe(handler: EventHandler): void {
    const eventType = handler.subscribedTo();
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);

    console.log(`📝 [EventBus] Subscribed ${handler.constructor.name} to ${eventType}`);
  }

  /**
   * 获取事件历史（用于调试）
   */
  getEventHistory(): DomainEvent[] {
    return [...this.eventHistory];
  }

  /**
   * 清除事件历史（用于测试）
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

/**
 * 全局事件总线实例
 */
let globalEventBus: EventBus | null = null;

/**
 * 获取全局事件总线
 */
export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new InMemoryEventBus();
    console.log('🚀 [EventBus] Initialized global event bus');
  }
  return globalEventBus;
}

/**
 * 设置全局事件总线（用于测试或替换实现）
 */
export function setEventBus(eventBus: EventBus): void {
  globalEventBus = eventBus;
}
