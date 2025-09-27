/**
 * Server-Sent Events (SSE) 控制器
 * @description 提供实时事件推送，让前端接收调度器事件
 */

import type { Request, Response } from 'express';
import { eventBus } from '@dailyuse/utils';

interface SSEClient {
  id: string;
  response: Response;
  lastPing: number;
}

/**
 * SSE 事件推送管理器
 */
export class SSEController {
  private clients = new Map<string, SSEClient>();
  private isInitialized = false;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * 建立 SSE 连接
   */
  connect = (req: Request, res: Response): void => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[SSE] 新客户端连接: ${clientId}`);

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // 发送初始连接消息
    this.sendEvent(res, 'connected', { clientId, timestamp: new Date().toISOString() });

    // 注册客户端
    const client: SSEClient = {
      id: clientId,
      response: res,
      lastPing: Date.now(),
    };
    this.clients.set(clientId, client);

    // 发送心跳
    const heartbeat = setInterval(() => {
      if (this.clients.has(clientId)) {
        this.sendEvent(res, 'heartbeat', { timestamp: new Date().toISOString() });
        this.clients.get(clientId)!.lastPing = Date.now();
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // 30秒心跳

    // 处理连接关闭
    req.on('close', () => {
      console.log(`[SSE] 客户端断开连接: ${clientId}`);
      this.clients.delete(clientId);
      clearInterval(heartbeat);
    });

    req.on('error', (error) => {
      console.error(`[SSE] 客户端连接错误 ${clientId}:`, error);
      this.clients.delete(clientId);
      clearInterval(heartbeat);
    });
  };

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (this.isInitialized) return;

    console.log('[SSE] 设置调度器事件监听器');

    // 监听调度器的弹窗提醒事件
    eventBus.on('ui:show-popup-reminder', (payload) => {
      console.log('[SSE] 转发弹窗提醒事件:', payload);
      this.broadcastToAll('schedule:popup-reminder', payload);
    });

    // 监听声音提醒事件
    eventBus.on('ui:play-reminder-sound', (payload) => {
      console.log('[SSE] 转发声音提醒事件:', payload);
      this.broadcastToAll('schedule:sound-reminder', payload);
    });

    // 监听系统通知事件
    eventBus.on('system:show-notification', (payload) => {
      console.log('[SSE] 转发系统通知事件:', payload);
      this.broadcastToAll('schedule:system-notification', payload);
    });

    // 监听通用提醒事件
    eventBus.on('reminder-triggered', (payload) => {
      console.log('[SSE] 转发通用提醒事件:', payload);
      this.broadcastToAll('schedule:reminder-triggered', payload);
    });

    // 监听调度器状态事件
    eventBus.on('scheduler:task-executed', (payload) => {
      console.log('[SSE] 转发任务执行事件:', payload);
      this.broadcastToAll('schedule:task-executed', payload);
    });

    this.isInitialized = true;
    console.log('[SSE] ✅ 事件监听器设置完成');
  }

  /**
   * 向所有客户端广播事件
   */
  private broadcastToAll(eventType: string, data: any): void {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    console.log(`[SSE] 广播事件到 ${this.clients.size} 个客户端: ${eventType}`);

    this.clients.forEach((client, clientId) => {
      try {
        this.sendEvent(client.response, eventType, event);
      } catch (error) {
        console.error(`[SSE] 发送事件到客户端 ${clientId} 失败:`, error);
        this.clients.delete(clientId);
      }
    });
  }

  /**
   * 向特定客户端发送事件
   */
  private sendEvent(res: Response, eventType: string, data: any): void {
    try {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('[SSE] 发送事件失败:', error);
      throw error;
    }
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      connectedClients: this.clients.size,
      clients: Array.from(this.clients.values()).map((client) => ({
        id: client.id,
        lastPing: client.lastPing,
        connectedFor: Date.now() - client.lastPing,
      })),
    };
  }

  /**
   * 清理过期连接
   */
  cleanup(): void {
    const now = Date.now();
    const timeout = 60000; // 60秒超时

    this.clients.forEach((client, clientId) => {
      if (now - client.lastPing > timeout) {
        console.log(`[SSE] 清理超时客户端: ${clientId}`);
        try {
          client.response.end();
        } catch (error) {
          // 忽略关闭错误
        }
        this.clients.delete(clientId);
      }
    });
  }
}

// 创建全局实例
export const sseController = new SSEController();

// 定期清理过期连接
setInterval(() => {
  sseController.cleanup();
}, 60000); // 每分钟清理一次
