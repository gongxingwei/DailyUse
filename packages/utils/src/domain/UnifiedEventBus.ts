import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

/**
 * 统一事件系统
 * 基于 EventEmitter 实现，支持单向通信（send/on）和双向通信（invoke/handle）
 * 类似 Electron IPC 的接口设计
 */
export class UnifiedEventBus extends EventEmitter {
  private debugEnabled = false;
  private defaultTimeout = 30000; // 30秒默认超时
  private pendingRequests = new Map<string, NodeJS.Timeout>();
  private handlers = new Map<string, (payload: any) => Promise<any> | any>();

  constructor() {
    super();
    this.setMaxListeners(0); // 移除监听器数量限制
  }

  // ===================== 单向通信 (send/on) =====================

  /**
   * 发送单向事件（类似 Electron 的 ipcRenderer.send）
   * @param eventType 事件类型
   * @param payload 事件负载
   */
  send(eventType: string, payload?: any): void {
    console.log(`📤 [UnifiedEventBus] 发送事件: ${eventType}`);
    this.emit(eventType, payload);
  }

  /**
   * 监听单向事件（类似 Electron 的 ipcRenderer.on）
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  on(eventType: string, listener: (payload?: any) => void): this {
    console.log(`👂 [UnifiedEventBus] 订阅事件: ${eventType}`);
    return super.on(eventType, listener);
  }

  /**
   * 只监听一次事件
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  once(eventType: string, listener: (payload?: any) => void): this {
    console.log(`👂 [UnifiedEventBus] 订阅一次性事件: ${eventType}`);
    return super.once(eventType, listener);
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  off(eventType: string, listener: (payload?: any) => void): this {
    console.log(`🔇 [UnifiedEventBus] 取消订阅事件: ${eventType}`);
    return super.off(eventType, listener);
  }

  // ===================== 双向通信 (invoke/handle) =====================

  /**
   * 注册请求处理器（类似 Electron 的 ipcMain.handle）
   * @param requestType 请求类型
   * @param handler 处理函数
   */
  handle<TRequest = any, TResponse = any>(
    requestType: string,
    handler: (payload: TRequest) => Promise<TResponse> | TResponse,
  ): void {
    console.log(`🔧 [UnifiedEventBus] 注册请求处理器: ${requestType}`);

    // 存储处理器
    this.handlers.set(requestType, handler);

    // 监听请求事件
    this.on(`${requestType}:request`, async (data: { requestId: string; payload: TRequest }) => {
      try {
        console.log(`📥 [UnifiedEventBus] 处理请求: ${requestType} (${data.requestId})`);
        const result = await handler(data.payload);

        // 发送成功响应
        this.emit(`${requestType}:response:${data.requestId}`, {
          success: true,
          data: result,
          error: null,
        });
        console.log(`✅ [UnifiedEventBus] 发送响应: ${requestType} (${data.requestId})`);
      } catch (error) {
        // 发送错误响应
        this.emit(`${requestType}:response:${data.requestId}`, {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(
          `❌ [UnifiedEventBus] 处理请求失败: ${requestType} (${data.requestId})`,
          error,
        );
      }
    });
  }

  /**
   * 发送请求并等待响应（类似 Electron 的 ipcRenderer.invoke）
   * @param requestType 请求类型
   * @param payload 请求载荷
   * @param options 选项
   */
  async invoke<TResponse = any>(
    requestType: string,
    payload?: any,
    options?: { timeout?: number },
  ): Promise<TResponse> {
    const requestId = randomUUID();
    const timeout = options?.timeout || this.defaultTimeout;

    console.log(`📨 [UnifiedEventBus] 发送请求: ${requestType} (${requestId})`);

    return new Promise<TResponse>((resolve, reject) => {
      // 设置超时
      const timeoutHandle = setTimeout(() => {
        this.removeAllListeners(`${requestType}:response:${requestId}`);
        this.pendingRequests.delete(requestId);
        reject(new Error(`请求超时: ${requestType} (${timeout}ms)`));
      }, timeout);

      // 存储超时句柄
      this.pendingRequests.set(requestId, timeoutHandle);

      // 监听响应
      this.once(
        `${requestType}:response:${requestId}`,
        (response: { success: boolean; data: TResponse; error: string | null }) => {
          // 清理
          clearTimeout(timeoutHandle);
          this.pendingRequests.delete(requestId);

          if (response.success) {
            console.log(`📨 [UnifiedEventBus] 收到成功响应: ${requestType} (${requestId})`);
            resolve(response.data);
          } else {
            console.error(
              `📨 [UnifiedEventBus] 收到错误响应: ${requestType} (${requestId})`,
              response.error,
            );
            reject(new Error(response.error || '请求处理失败'));
          }
        },
      );

      // 发送请求
      this.emit(`${requestType}:request`, { requestId, payload });
    });
  }

  /**
   * 移除请求处理器
   * @param requestType 请求类型
   */
  removeHandler(requestType: string): void {
    console.log(`🗑️ [UnifiedEventBus] 移除请求处理器: ${requestType}`);

    this.handlers.delete(requestType);
    this.removeAllListeners(`${requestType}:request`);
  }

  // ===================== 高级功能 =====================

  /**
   * 获取已注册的处理器列表
   */
  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 获取当前监听的事件列表
   */
  getRegisteredEvents(): string[] {
    return this.eventNames().map((name) => String(name));
  }

  /**
   * 清理所有pending请求
   */
  clearPendingRequests(): void {
    console.log(`🧹 [UnifiedEventBus] 清理所有pending请求 (${this.pendingRequests.size}个)`);

    for (const [requestId, timeout] of Array.from(this.pendingRequests.entries())) {
      clearTimeout(timeout);
      // 发送取消响应
      this.emit(`request:cancelled:${requestId}`, new Error('请求被取消'));
    }

    this.pendingRequests.clear();
  }

  /**
   * 销毁事件总线，清理所有资源
   */
  destroy(): void {
    console.log(`💥 [UnifiedEventBus] 销毁事件总线`);

    this.clearPendingRequests();
    this.handlers.clear();
    this.removeAllListeners();
  }

  // ===================== 调试和监控 =====================

  /**
   * 获取统计信息
   */
  getStats(): {
    handlersCount: number;
    listenersCount: number;
    pendingRequestsCount: number;
    registeredHandlers: string[];
    registeredEvents: string[];
  } {
    return {
      handlersCount: this.handlers.size,
      listenersCount: this.eventNames().length,
      pendingRequestsCount: this.pendingRequests.size,
      registeredHandlers: this.getRegisteredHandlers(),
      registeredEvents: this.getRegisteredEvents(),
    };
  }

  /**
   * 设置调试模式
   * @param enabled 是否启用
   */
  setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
    if (enabled) {
      console.log(`🐛 [UnifiedEventBus] 启用调试模式`);
    } else {
      console.log(`🐛 [UnifiedEventBus] 禁用调试模式`);
    }
  }

  // ===================== 兼容性方法 =====================

  /**
   * 兼容旧的 publish 方法
   * @param event 事件对象
   */
  async publish(event: { eventType: string; payload?: any; [key: string]: any }): Promise<void> {
    console.log(`📢 [UnifiedEventBus] 发布领域事件: ${event.eventType}`);
    this.send(event.eventType, event);
  }

  /**
   * 兼容旧的 subscribe 方法
   * @param eventType 事件类型
   * @param handler 处理函数
   */
  subscribe(eventType: string, handler: (event: any) => Promise<void>): void {
    console.log(`📝 [UnifiedEventBus] 订阅事件: ${eventType}`);
    this.on(eventType, handler);
  }

  /**
   * 兼容旧的 unsubscribe 方法
   * @param eventType 事件类型
   * @param handler 处理函数
   */
  unsubscribe(eventType: string, handler: (event: any) => Promise<void>): void {
    console.log(`📝 [UnifiedEventBus] 取消订阅事件: ${eventType}`);
    this.off(eventType, handler);
  }
}

// ===================== 内部接口类型定义 =====================

/**
 * 统一事件接口
 */
export interface IUnifiedEvent {
  eventType: string;
  aggregateId?: string;
  occurredOn?: Date;
  payload?: any;
  [key: string]: any;
}

/**
 * 请求响应接口
 */
export interface IRequestResponse<TRequest = any, TResponse = any> {
  requestId: string;
  success: boolean;
  data?: TResponse;
  error?: string;
  request?: TRequest;
}

/**
 * 事件处理器接口
 */
export interface IEventHandler<TEvent = any> {
  (event: TEvent): Promise<void> | void;
}

/**
 * 请求处理器接口
 */
export interface IRequestHandler<TRequest = any, TResponse = any> {
  (payload: TRequest): Promise<TResponse> | TResponse;
}

// ===================== 工具函数 =====================

/**
 * 创建标准化事件对象
 */
export function createEvent<TPayload = any>(
  eventType: string,
  payload: TPayload,
  aggregateId?: string,
): IUnifiedEvent {
  return {
    eventType,
    aggregateId: aggregateId || randomUUID(),
    occurredOn: new Date(),
    payload,
  };
}

/**
 * 类型安全的事件发送
 */
export function sendTypedEvent<TPayload>(
  eventBus: UnifiedEventBus,
  eventType: string,
  payload: TPayload,
): void {
  eventBus.send(eventType, payload);
}

/**
 * 类型安全的请求调用
 */
export function invokeTypedRequest<TRequest, TResponse>(
  eventBus: UnifiedEventBus,
  requestType: string,
  payload: TRequest,
  options?: { timeout?: number },
): Promise<TResponse> {
  return eventBus.invoke<TResponse>(requestType, payload, options);
}
