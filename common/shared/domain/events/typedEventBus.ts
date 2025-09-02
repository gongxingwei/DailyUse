/**
 * 增强版事件总线 - 支持类型安全的事件处理
 * 基于共享事件契约，提供类型安全的模块间通信
 */

import type { DomainEvent } from '../domainEvent';
import type { EventTypeMap, EventHandler, AllDomainEvents } from './contracts';

/**
 * 事件处理器包装器
 */
interface EventHandlerWrapper {
  handler: (event: DomainEvent) => Promise<void>;
  metadata: {
    module: string;
    registeredAt: Date;
    version?: string;
  };
}

/**
 * 事件统计信息
 */
interface EventStats {
  totalPublished: number;
  totalHandled: number;
  failureCount: number;
  lastEventTime?: Date;
}

/**
 * 增强版事件总线
 * 支持类型安全的事件订阅和发布
 */
export class TypedEventBus {
  private static instance: TypedEventBus;
  private handlers: Map<string, EventHandlerWrapper[]> = new Map();
  private stats: Map<string, EventStats> = new Map();
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  private constructor() {}

  static getInstance(): TypedEventBus {
    if (!TypedEventBus.instance) {
      TypedEventBus.instance = new TypedEventBus();
    }
    return TypedEventBus.instance;
  }

  /**
   * 类型安全的事件订阅
   */
  subscribe<TEventType extends keyof EventTypeMap>(
    eventType: TEventType,
    handler: EventHandler<TEventType>,
    options: {
      module: string;
      version?: string;
    },
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const wrappedHandler: EventHandlerWrapper = {
      handler: handler as (event: DomainEvent) => Promise<void>,
      metadata: {
        module: options.module,
        registeredAt: new Date(),
        version: options.version,
      },
    };

    this.handlers.get(eventType)!.push(wrappedHandler);

    console.log(`📝 [TypedEventBus] ${options.module} 模块订阅事件: ${eventType}`);
  }

  /**
   * 发布事件（类型安全）
   */
  async publish<TEventType extends keyof EventTypeMap>(
    event: EventTypeMap[TEventType],
  ): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];

    if (handlers.length === 0) {
      console.log(`⚠️ [TypedEventBus] 没有找到事件处理器: ${event.eventType}`);
      return;
    }

    console.log(`📢 [TypedEventBus] 发布事件: ${event.eventType}, 处理器数量: ${handlers.length}`);

    // 更新统计信息
    this.updateStats(event.eventType, 'published');

    // 并行执行所有处理器
    const promises = handlers.map((wrapper) => this.executeHandlerWithRetry(event, wrapper));

    await Promise.allSettled(promises);
  }

  /**
   * 发布通用事件（向后兼容）
   */
  async publishGeneric(event: AllDomainEvents): Promise<void> {
    return this.publish(event as any);
  }

  /**
   * 带重试的事件处理器执行
   */
  private async executeHandlerWithRetry(
    event: DomainEvent,
    wrapper: EventHandlerWrapper,
    retryCount = 0,
  ): Promise<void> {
    try {
      await wrapper.handler(event);
      this.updateStats(event.eventType, 'handled');

      console.log(`✅ [TypedEventBus] ${wrapper.metadata.module} 成功处理事件: ${event.eventType}`);
    } catch (error) {
      console.error(
        `❌ [TypedEventBus] ${wrapper.metadata.module} 处理事件失败 (${event.eventType}):`,
        error,
      );

      this.updateStats(event.eventType, 'failed');

      // 重试逻辑
      if (retryCount < this.maxRetries) {
        console.log(
          `🔄 [TypedEventBus] 重试处理事件 (${retryCount + 1}/${this.maxRetries}): ${event.eventType}`,
        );

        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.executeHandlerWithRetry(event, wrapper, retryCount + 1);
      } else {
        console.error(`💀 [TypedEventBus] 事件处理最终失败: ${event.eventType}`);
        // 这里可以发送到死信队列或告警系统
      }
    }
  }

  /**
   * 更新事件统计信息
   */
  private updateStats(eventType: string, action: 'published' | 'handled' | 'failed'): void {
    if (!this.stats.has(eventType)) {
      this.stats.set(eventType, {
        totalPublished: 0,
        totalHandled: 0,
        failureCount: 0,
      });
    }

    const stats = this.stats.get(eventType)!;
    stats.lastEventTime = new Date();

    switch (action) {
      case 'published':
        stats.totalPublished++;
        break;
      case 'handled':
        stats.totalHandled++;
        break;
      case 'failed':
        stats.failureCount++;
        break;
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe<TEventType extends keyof EventTypeMap>(
    eventType: TEventType,
    handler: EventHandler<TEventType>,
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.findIndex((wrapper) => wrapper.handler === handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`🗑️ [TypedEventBus] 取消订阅事件: ${eventType}`);
      }
    }
  }

  /**
   * 获取事件统计信息
   */
  getStats(): Map<string, EventStats> {
    return new Map(this.stats);
  }

  /**
   * 获取已订阅的事件类型
   */
  getSubscribedEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 获取指定事件的订阅者信息
   */
  getEventSubscribers(eventType: string): Array<{
    module: string;
    registeredAt: Date;
    version?: string;
  }> {
    const handlers = this.handlers.get(eventType) || [];
    return handlers.map((wrapper) => wrapper.metadata);
  }

  /**
   * 健康检查
   */
  healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    eventTypes: number;
    totalHandlers: number;
    recentFailures: number;
  } {
    const totalHandlers = Array.from(this.handlers.values()).reduce(
      (sum, handlers) => sum + handlers.length,
      0,
    );

    const recentFailures = Array.from(this.stats.values()).reduce(
      (sum, stats) => sum + stats.failureCount,
      0,
    );

    const failureRate = totalHandlers > 0 ? recentFailures / totalHandlers : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (failureRate > 0.1) status = 'degraded';
    if (failureRate > 0.3) status = 'unhealthy';

    return {
      status,
      eventTypes: this.handlers.size,
      totalHandlers,
      recentFailures,
    };
  }

  /**
   * 清除所有订阅（用于测试和重置）
   */
  clear(): void {
    this.handlers.clear();
    this.stats.clear();
    console.log(`🧹 [TypedEventBus] 清除所有事件订阅和统计信息`);
  }
}

// 导出全局实例
export const typedEventBus = TypedEventBus.getInstance();

// 向后兼容的导出
export { typedEventBus as eventBus };
