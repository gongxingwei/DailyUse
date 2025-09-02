import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * 请求处理器类型
 */
type RequestHandler<TRequest = any, TResponse = any> = (
  request: TRequest,
) => Promise<TResponse> | TResponse;

/**
 * 基于 Node.js EventEmitter 的请求-响应事件总线
 * 实现类似 Electron invoke/handle 的请求-响应模式
 */
export class RequestResponseEventBus extends EventEmitter {
  private static instance: RequestResponseEventBus;
  private handlers: Map<string, RequestHandler> = new Map();
  private pendingRequests: Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();
  private readonly defaultTimeout = 10000;

  private constructor() {
    super();
    this.setMaxListeners(0); // 无限制监听器数量
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
    handler: (request: TRequest) => Promise<TResponse> | TResponse,
  ): void {
    this.handlers.set(requestType, handler);
    console.log(`🔧 [RequestResponseEventBus] 注册请求处理器: ${requestType}`);

    // 监听请求事件
    this.on(`${requestType}:request`, async (data: { requestId: string; payload: TRequest }) => {
      try {
        console.log(`📥 [RequestResponseEventBus] 处理请求: ${requestType} (${data.requestId})`);
        const result = await handler(data.payload);

        // 发送成功响应
        this.emit(`${requestType}:response`, {
          requestId: data.requestId,
          success: true,
          data: result,
        });
        console.log(`✅ [RequestResponseEventBus] 发送响应: ${requestType} (${data.requestId})`);
      } catch (error) {
        // 发送错误响应
        this.emit(`${requestType}:response`, {
          requestId: data.requestId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(
          `❌ [RequestResponseEventBus] 处理请求失败: ${requestType} (${data.requestId})`,
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
    payload: any,
    options?: { timeout?: number },
  ): Promise<TResponse> {
    const requestId = crypto.randomUUID();
    const timeout = options?.timeout || this.defaultTimeout;

    return new Promise<TResponse>((resolve, reject) => {
      // 设置超时
      const timeoutHandle = setTimeout(() => {
        this.removeAllListeners(`${requestType}:response:${requestId}`);
        this.pendingRequests.delete(requestId);
        reject(new Error(`请求超时: ${requestType} (${timeout}ms)`));
      }, timeout);

      // 保存待处理的请求
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // 监听响应
      this.once(
        `${requestType}:response`,
        (response: { requestId: string; success: boolean; data?: TResponse; error?: string }) => {
          if (response.requestId !== requestId) return;

          const pending = this.pendingRequests.get(requestId);
          if (!pending) return;

          clearTimeout(pending.timeout);
          this.pendingRequests.delete(requestId);

          if (response.success) {
            resolve(response.data as TResponse);
          } else {
            reject(new Error(response.error || '请求处理失败'));
          }
        },
      );

      // 发送请求
      console.log(`📤 [RequestResponseEventBus] 发送请求: ${requestType} (${requestId})`);
      this.emit(`${requestType}:request`, {
        requestId,
        payload,
      });
    });
  }

  /**
   * 移除请求处理器
   */
  removeHandler(requestType: string): void {
    this.handlers.delete(requestType);
    this.removeAllListeners(`${requestType}:request`);
    console.log(`🗑️ [RequestResponseEventBus] 移除请求处理器: ${requestType}`);
  }

  /**
   * 获取已注册的请求处理器类型
   */
  getRegisteredRequestTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * 全局实例
 */
export const requestResponseEventBus = RequestResponseEventBus.getInstance();
