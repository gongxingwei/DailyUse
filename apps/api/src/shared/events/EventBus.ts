/**
 * Simple Event Bus
 * 简单事件总线
 *
 * @description 用于模块间通信的事件总线
 */

import { EventEmitter } from 'events';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EventBus');

export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50); // 增加最大监听器数量
  }

  /**
   * 获取事件总线单例
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 发布事件
   */
  emit(eventType: string, data: any): void {
    logger.debug('Emitting event', { eventType, data });
    this.emitter.emit(eventType, data);
  }

  /**
   * 订阅事件
   */
  on(eventType: string, handler: (data: any) => void): void {
    logger.debug('Subscribing to event', { eventType });
    this.emitter.on(eventType, handler);
  }

  /**
   * 订阅事件（仅一次）
   */
  once(eventType: string, handler: (data: any) => void): void {
    logger.debug('Subscribing to event (once)', { eventType });
    this.emitter.once(eventType, handler);
  }

  /**
   * 取消订阅
   */
  off(eventType: string, handler: (data: any) => void): void {
    logger.debug('Unsubscribing from event', { eventType });
    this.emitter.off(eventType, handler);
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      logger.debug('Removing all listeners for event', { eventType });
      this.emitter.removeAllListeners(eventType);
    } else {
      logger.debug('Removing all listeners');
      this.emitter.removeAllListeners();
    }
  }
}

// 导出单例实例
export const eventBus = EventBus.getInstance();
