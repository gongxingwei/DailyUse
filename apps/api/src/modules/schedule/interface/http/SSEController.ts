/**
 * Server-Sent Events (SSE) 控制器
 * @description 提供实时事件推送，让前端接收调度器事件
 */

import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';
import { eventBus } from '@dailyuse/utils';
import jwt from 'jsonwebtoken';

interface SSEClient {
  id: string;
  accountUuid: string;
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
   * @description 从 URL 参数中的 token 提取用户信息，建立用户级别的 SSE 连接
   * @note 由于原生 EventSource 不支持自定义请求头，token 通过 URL 参数传递
   */
  connect = async (req: Request, res: Response): Promise<void> => {
    try {
      // 从 URL 参数获取 token
      const token = req.query.token as string;

      if (!token) {
        console.error('[SSE] 连接失败: 缺少 token 参数');
        res.status(401).json({
          success: false,
          message: 'Unauthorized: Authentication token is required',
        });
        return;
      }

      // 验证 token 并提取 accountUuid
      const secret = process.env.JWT_SECRET || 'default-secret';

      let accountUuid: string;
      try {
        const decoded = jwt.verify(token, secret) as any;

        if (!decoded.accountUuid) {
          console.error('[SSE] Token 中缺少 accountUuid');
          res.status(401).json({
            success: false,
            message: 'Invalid token: missing user information',
          });
          return;
        }

        accountUuid = decoded.accountUuid;
      } catch (jwtError) {
        console.error('[SSE] Token 验证失败:', jwtError);
        res.status(401).json({
          success: false,
          message: 'Invalid or expired authentication token',
        });
        return;
      }

      // 使用 accountUuid 作为客户端 ID
      const clientId = accountUuid;

      console.log(`[SSE] 新客户端连接: ${clientId}`);

      // 获取请求来源
      const origin = req.headers.origin || 'http://localhost:5173';

      // 设置 SSE 响应头
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'X-Accel-Buffering': 'no',
      });

      // 立即 flush headers，确保客户端收到响应头
      res.flushHeaders();

      // 发送初始连接消息
      this.sendEvent(res, 'connected', {
        clientId,
        accountUuid,
        timestamp: new Date().toISOString(),
      });

      console.log(`[SSE] 连接确认已发送给客户端: ${clientId}`);

      // 注册客户端
      const client: SSEClient = {
        id: clientId,
        accountUuid,
        response: res,
        lastPing: Date.now(),
      };
      this.clients.set(clientId, client);

      // 发送心跳
      const heartbeat = setInterval(() => {
        if (this.clients.has(clientId)) {
          const heartbeatData = { timestamp: new Date().toISOString() };
          this.sendEvent(res, 'heartbeat', heartbeatData);
          this.clients.get(clientId)!.lastPing = Date.now();
          console.log(`[SSE] 💓 发送心跳到客户端: ${clientId}`);
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
    } catch (error) {
      console.error('[SSE] 连接处理失败:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error while establishing SSE connection',
        });
      }
    }
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

    console.log(`[SSE] 📢 广播事件到 ${this.clients.size} 个客户端: ${eventType}`);

    this.clients.forEach((client, clientId) => {
      try {
        this.sendEvent(client.response, eventType, event);
        console.log(`[SSE] ✅ 事件已发送到客户端 ${clientId}: ${eventType}`);
      } catch (error) {
        console.error(`[SSE] ❌ 发送事件到客户端 ${clientId} 失败:`, error);
        this.clients.delete(clientId);
      }
    });
  }

  /**
   * 向特定用户发送事件
   */
  private sendToUser(accountUuid: string, eventType: string, data: any): void {
    const client = this.clients.get(accountUuid);

    if (!client) {
      console.warn(`[SSE] 用户 ${accountUuid} 未连接，无法发送事件: ${eventType}`);
      return;
    }

    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    console.log(`[SSE] 发送事件到用户 ${accountUuid}: ${eventType}`);

    try {
      this.sendEvent(client.response, eventType, event);
    } catch (error) {
      console.error(`[SSE] 发送事件到用户 ${accountUuid} 失败:`, error);
      this.clients.delete(accountUuid);
    }
  }

  /**
   * 向特定客户端发送事件
   */
  private sendEvent(res: Response, eventType: string, data: any): void {
    try {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      // 立即 flush，确保数据发送到客户端
      // Node.js 的响应流默认是缓冲的，需要手动 flush
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
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
        accountUuid: client.accountUuid,
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
