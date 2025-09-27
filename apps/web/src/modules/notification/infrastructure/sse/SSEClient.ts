/**
 * Server-Sent Events (SSE) 客户端
 * @description 连接后端 SSE 端点，接收实时调度事件
 */

import { eventBus } from '@dailyuse/utils';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

/**
 * SSE 客户端管理器
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒
  private isConnecting = false;
  private isDestroyed = false;

  constructor(private baseUrl: string = 'http://localhost:3888') {}

  /**
   * 连接到 SSE 端点
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.eventSource) {
        resolve();
        return;
      }

      this.isConnecting = true;
      const url = `${this.baseUrl}/api/v1/schedules/events`;

      console.log('[SSE Client] 连接到:', url);

      try {
        this.eventSource = new EventSource(url);

        // 连接成功
        this.eventSource.onopen = () => {
          console.log('[SSE Client] ✅ 连接成功');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        // 接收消息
        this.eventSource.onmessage = (event) => {
          console.log('[SSE Client] 收到默认消息:', event.data);
          this.handleMessage('message', event.data);
        };

        // 连接建立事件
        this.eventSource.addEventListener('connected', (event) => {
          console.log('[SSE Client] 🔗 连接建立:', event.data);
          this.handleMessage('connected', event.data);
        });

        // 心跳事件
        this.eventSource.addEventListener('heartbeat', (event) => {
          console.log('[SSE Client] 💓 心跳:', event.data);
        });

        // 调度器事件
        this.eventSource.addEventListener('schedule:popup-reminder', (event) => {
          console.log('[SSE Client] 🔔 弹窗提醒事件:', event.data);
          this.handleScheduleEvent('popup-reminder', event.data);
        });

        this.eventSource.addEventListener('schedule:sound-reminder', (event) => {
          console.log('[SSE Client] 🔊 声音提醒事件:', event.data);
          this.handleScheduleEvent('sound-reminder', event.data);
        });

        this.eventSource.addEventListener('schedule:system-notification', (event) => {
          console.log('[SSE Client] 📢 系统通知事件:', event.data);
          this.handleScheduleEvent('system-notification', event.data);
        });

        this.eventSource.addEventListener('schedule:reminder-triggered', (event) => {
          console.log('[SSE Client] 📨 通用提醒事件:', event.data);
          this.handleScheduleEvent('reminder-triggered', event.data);
        });

        this.eventSource.addEventListener('schedule:task-executed', (event) => {
          console.log('[SSE Client] ⚡ 任务执行事件:', event.data);
          this.handleScheduleEvent('task-executed', event.data);
        });

        // 连接错误
        this.eventSource.onerror = (error) => {
          console.error('[SSE Client] ❌ 连接错误:', error);
          this.isConnecting = false;

          if (this.eventSource?.readyState === EventSource.CLOSED) {
            console.log('[SSE Client] 连接已关闭，准备重连');
            this.attemptReconnect();
          }

          reject(error);
        };
      } catch (error) {
        console.error('[SSE Client] 创建连接失败:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 处理通用消息
   */
  private handleMessage(type: string, data: string): void {
    try {
      const parsedData = JSON.parse(data);
      eventBus.emit(`sse:${type}`, parsedData);
    } catch (error) {
      console.error('[SSE Client] 解析消息失败:', error);
    }
  }

  /**
   * 处理调度事件
   */
  private handleScheduleEvent(eventType: string, data: string): void {
    try {
      const parsedData = JSON.parse(data);
      console.log(`[SSE Client] 处理调度事件 ${eventType}:`, parsedData);

      // 根据事件类型转发到前端事件总线
      switch (eventType) {
        case 'popup-reminder':
          // 转发为前端通知事件
          eventBus.emit('ui:show-popup-reminder', parsedData.data);
          break;

        case 'sound-reminder':
          eventBus.emit('ui:play-reminder-sound', parsedData.data);
          break;

        case 'system-notification':
          eventBus.emit('system:show-notification', parsedData.data);
          break;

        case 'reminder-triggered':
          eventBus.emit('reminder-triggered', parsedData.data);
          break;

        case 'task-executed':
          eventBus.emit('schedule:task-executed', parsedData.data);
          break;

        default:
          console.warn('[SSE Client] 未知调度事件类型:', eventType);
      }

      // 同时发送通用的 SSE 事件
      eventBus.emit(`sse:schedule:${eventType}`, parsedData);
    } catch (error) {
      console.error('[SSE Client] 处理调度事件失败:', error, data);
    }
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect(): void {
    if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[SSE Client] 停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避

    console.log(`[SSE Client] 第 ${this.reconnectAttempts} 次重连尝试，延迟 ${delay}ms`);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.disconnect();
        this.connect().catch((error) => {
          console.error('[SSE Client] 重连失败:', error);
        });
      }
    }, delay);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.eventSource) {
      console.log('[SSE Client] 断开连接');
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    console.log('[SSE Client] 销毁客户端');
    this.isDestroyed = true;
    this.disconnect();
  }

  /**
   * 获取连接状态
   */
  getStatus(): { connected: boolean; readyState: number | null; reconnectAttempts: number } {
    return {
      connected: this.eventSource?.readyState === EventSource.OPEN,
      readyState: this.eventSource?.readyState || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// 创建全局实例
export const sseClient = new SSEClient();

// 自动连接（在浏览器环境中）
if (typeof window !== 'undefined') {
  // 页面加载后自动连接
  window.addEventListener('load', () => {
    sseClient.connect().catch((error) => {
      console.error('[SSE Client] 自动连接失败:', error);
    });
  });

  // 页面卸载时断开连接
  window.addEventListener('beforeunload', () => {
    sseClient.destroy();
  });
}
