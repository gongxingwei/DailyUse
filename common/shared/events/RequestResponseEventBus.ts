import type { DomainEvent } from '../domain/domainEvent';
import { eventBus } from './EventBus';

/**
 * 请求事件接口
 * 类似于 Electron 的 invoke 请求
 */
export interface RequestEvent<T = any> extends DomainEvent<T> {
  requestId: string;
}

/**
 * 响应事件接口
 * 类似于 Electron 的 handle 响应
 */
export interface ResponseEvent<T = any> extends DomainEvent<T> {
  requestId: string;
  success: boolean;
  error?: string;
}

/**
 * 请求处理器类型
 * 类似于 Electron 的 handle 处理器
 */
type RequestHandler<TRequest = any, TResponse = any> = (
  request: TRequest,
) => Promise<TResponse> | TResponse;

/**
 * 待处理的请求信息
 */
interface PendingRequest<T = any> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * 请求-响应事件总线
 * 实现类似 Electron invoke/handle 的请求-响应模式
 */
export class RequestResponseEventBus {
  private static instance: RequestResponseEventBus;
  private handlers: Map<string, RequestHandler> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly defaultTimeout = 10000; // 10秒默认超时

  private constructor() {
    // 监听所有响应事件
    this.setupResponseListener();
  }

  static getInstance(): RequestResponseEventBus {
    if (!RequestResponseEventBus.instance) {
      RequestResponseEventBus.instance = new RequestResponseEventBus();
    }
    return RequestResponseEventBus.instance;
  }

  /**
   * 注册请求处理器（类似 Electron 的 ipcMain.handle）
   * @param requestType 请求类型
   * @param handler 处理器函数
   */
  handle<TRequest = any, TResponse = any>(
    requestType: string,
    handler: RequestHandler<TRequest, TResponse>,
  ): void {
    if (this.handlers.has(requestType)) {
      console.warn(`⚠️ [RequestResponseEventBus] 请求处理器已存在，将被覆盖: ${requestType}`);
    }

    this.handlers.set(requestType, handler);
    console.log(`🔧 [RequestResponseEventBus] 注册请求处理器: ${requestType}`);

    // 监听对应的请求事件
    eventBus.subscribe(`${requestType}Request`, async (event: RequestEvent) => {
      await this.handleRequest(requestType, event);
    });
  }

  /**
   * 发送请求并等待响应（类似 Electron 的 ipcRenderer.invoke）
   * @param requestType 请求类型
   * @param payload 请求载荷
   * @param options 选项
   * @returns Promise<响应数据>
   */
  async invoke<TResponse = any>(
    requestType: string,
    payload: any,
    options?: {
      timeout?: number;
      aggregateId?: string;
    },
  ): Promise<TResponse> {
    const requestId = crypto.randomUUID();
    const timeout = options?.timeout || this.defaultTimeout;
    const aggregateId = options?.aggregateId || requestId;

    return new Promise<TResponse>((resolve, reject) => {
      // 设置超时
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`请求超时: ${requestType} (${timeout}ms)`));
      }, timeout);

      // 保存待处理的请求
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // 发送请求事件
      const requestEvent: RequestEvent = {
        eventType: `${requestType}Request`,
        aggregateId,
        occurredOn: new Date(),
        requestId,
        payload,
      };

      console.log(`📤 [RequestResponseEventBus] 发送请求: ${requestType} (${requestId})`);
      eventBus.publish(requestEvent);
    });
  }

  /**
   * 取消请求处理器注册
   * @param requestType 请求类型
   */
  removeHandler(requestType: string): void {
    this.handlers.delete(requestType);
    console.log(`🗑️ [RequestResponseEventBus] 移除请求处理器: ${requestType}`);
  }

  /**
   * 清除所有处理器
   */
  clear(): void {
    this.handlers.clear();
    // 清除所有待处理的请求
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('事件总线已清除'));
    }
    this.pendingRequests.clear();
    console.log(`🧹 [RequestResponseEventBus] 清除所有处理器`);
  }

  /**
   * 获取已注册的请求处理器类型
   */
  getRegisteredRequestTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 处理收到的请求
   * @param requestType 请求类型
   * @param event 请求事件
   */
  private async handleRequest(requestType: string, event: RequestEvent): Promise<void> {
    const handler = this.handlers.get(requestType);
    if (!handler) {
      console.error(`❌ [RequestResponseEventBus] 未找到请求处理器: ${requestType}`);
      return;
    }

    console.log(`📥 [RequestResponseEventBus] 处理请求: ${requestType} (${event.requestId})`);

    try {
      // 执行处理器
      const result = await handler(event.payload);

      // 发送成功响应
      const responseEvent: ResponseEvent = {
        eventType: `${requestType}Response`,
        aggregateId: event.aggregateId,
        occurredOn: new Date(),
        requestId: event.requestId,
        success: true,
        payload: result,
      };

      console.log(`✅ [RequestResponseEventBus] 发送响应: ${requestType} (${event.requestId})`);
      await eventBus.publish(responseEvent);
    } catch (error) {
      // 发送错误响应
      const responseEvent: ResponseEvent = {
        eventType: `${requestType}Response`,
        aggregateId: event.aggregateId,
        occurredOn: new Date(),
        requestId: event.requestId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        payload: null,
      };

      console.error(
        `❌ [RequestResponseEventBus] 处理请求失败: ${requestType} (${event.requestId})`,
        error,
      );
      await eventBus.publish(responseEvent);
    }
  }

  /**
   * 设置响应事件监听器
   */
  private setupResponseListener(): void {
    // 使用通用的响应事件监听器
    const originalPublish = eventBus.publish.bind(eventBus);
    eventBus.publish = async (event: DomainEvent) => {
      // 检查是否是响应事件
      if (event.eventType.endsWith('Response') && 'requestId' in event) {
        const responseEvent = event as ResponseEvent;
        this.handleResponse(responseEvent);
      }

      // 调用原始的 publish 方法
      return originalPublish(event);
    };
  }

  /**
   * 处理收到的响应
   * @param event 响应事件
   */
  private handleResponse(event: ResponseEvent): void {
    const pending = this.pendingRequests.get(event.requestId);
    if (!pending) {
      console.warn(`⚠️ [RequestResponseEventBus] 收到未知请求的响应: ${event.requestId}`);
      return;
    }

    // 清除超时和待处理请求
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(event.requestId);

    console.log(`📨 [RequestResponseEventBus] 处理响应: ${event.eventType} (${event.requestId})`);

    if (event.success) {
      pending.resolve(event.payload);
    } else {
      pending.reject(new Error(event.error || '请求处理失败'));
    }
  }
}

/**
 * 便捷的全局请求-响应事件总线实例
 */
export const requestResponseEventBus = RequestResponseEventBus.getInstance();
