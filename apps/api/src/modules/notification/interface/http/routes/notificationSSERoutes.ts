import { Router } from 'express';
import type { Request, Response } from 'express';
import { createLogger } from '@dailyuse/utils';
import { eventBus } from '@dailyuse/utils';
import jwt from 'jsonwebtoken';

const logger = createLogger('NotificationSSE');

/**
 * SSE 客户端管理器
 * 管理所有活跃的 SSE 连接
 */
class SSEClientManager {
  private clients: Map<string, Response> = new Map();

  /**
   * 添加客户端连接
   */
  addClient(accountUuid: string, res: Response): void {
    // 如果该用户已有连接，先关闭旧连接
    const existingClient = this.clients.get(accountUuid);
    if (existingClient) {
      logger.info(`[SSE] 关闭用户 ${accountUuid} 的旧连接`);
      this.removeClient(accountUuid);
    }

    this.clients.set(accountUuid, res);
    logger.info(`[SSE] 新增客户端: ${accountUuid}, 当前连接数: ${this.clients.size}`);

    // 发送连接成功事件
    this.sendToClient(accountUuid, 'connected', {
      message: 'SSE 连接建立成功',
      timestamp: new Date().toISOString(),
      accountUuid,
    });

    // 启动心跳
    this.startHeartbeat(accountUuid);
  }

  /**
   * 移除客户端连接
   */
  removeClient(accountUuid: string): void {
    const client = this.clients.get(accountUuid);
    if (client) {
      try {
        client.end();
      } catch (error) {
        logger.error(`[SSE] 关闭连接失败:`, error);
      }
      this.clients.delete(accountUuid);
      logger.info(`[SSE] 移除客户端: ${accountUuid}, 剩余连接数: ${this.clients.size}`);
    }
  }

  /**
   * 向指定客户端发送事件
   */
  sendToClient(accountUuid: string, event: string, data: any): boolean {
    const client = this.clients.get(accountUuid);
    if (!client) {
      logger.warn(`[SSE] 客户端不存在: ${accountUuid}`);
      return false;
    }

    try {
      const sseData = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      client.write(`event: ${event}\n`);
      client.write(`data: ${JSON.stringify(sseData)}\n\n`);

      // 立即 flush，确保数据被推送到客户端
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }

      return true;
    } catch (error) {
      logger.error(`[SSE] 发送事件失败:`, error);
      this.removeClient(accountUuid);
      return false;
    }
  }

  /**
   * 广播事件到所有客户端
   */
  broadcast(event: string, data: any): void {
    let successCount = 0;
    const totalClients = this.clients.size;

    this.clients.forEach((_, accountUuid) => {
      if (this.sendToClient(accountUuid, event, data)) {
        successCount++;
      }
    });

    logger.info(`[SSE] 广播事件 ${event} 到 ${successCount}/${totalClients} 个客户端`);
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(accountUuid: string): void {
    const heartbeatInterval = setInterval(() => {
      const client = this.clients.get(accountUuid);
      if (!client) {
        clearInterval(heartbeatInterval);
        return;
      }

      const sent = this.sendToClient(accountUuid, 'heartbeat', {
        timestamp: new Date().toISOString(),
      });

      if (!sent) {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // 30秒心跳
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      totalClients: this.clients.size,
      clients: Array.from(this.clients.keys()),
    };
  }
}

// 全局 SSE 客户端管理器
const sseClientManager = new SSEClientManager();

/**
 * 注册 SSE 事件监听器
 * 监听后端事件总线上的通知事件，并通过 SSE 推送给前端
 */
function setupSSEEventListeners(): void {
  logger.info('[SSE] 设置通知事件监听器...');
  logger.info('[SSE] EventBus 实例:', eventBus.constructor.name);

  // 监听通知创建事件 - 推送实时通知
  eventBus.on('notification:created', (data: any) => {
    logger.info('[SSE] 收到通知创建事件:', data);

    if (data.accountUuid) {
      // 发送给特定用户
      const sent = sseClientManager.sendToClient(data.accountUuid, 'notification:created', data);
      logger.info(`[SSE] 发送结果: ${sent ? '成功' : '失败'}`);
    } else {
      // 广播给所有用户
      sseClientManager.broadcast('notification:created', data);
    }
  });

  // 监听通知发送事件
  eventBus.on('notification:sent', (data: any) => {
    logger.info('[SSE] 收到通知发送事件:', data);

    if (data.accountUuid) {
      sseClientManager.sendToClient(data.accountUuid, 'notification:sent', data);
    }
  });

  // 监听弹窗提醒事件
  eventBus.on('ui:show-popup-reminder', (data: any) => {
    logger.info('[SSE] 🎯 收到弹窗提醒事件:', {
      accountUuid: data.accountUuid,
      title: data.title,
      notificationId: data.notificationId,
    });

    if (data.accountUuid) {
      const sent = sseClientManager.sendToClient(
        data.accountUuid,
        'notification:popup-reminder',
        data,
      );
      logger.info(
        `[SSE] 弹窗提醒发送结果: ${sent ? '✅ 成功' : '❌ 失败（客户端不存在或连接已断开）'}`,
      );
    } else {
      sseClientManager.broadcast('notification:popup-reminder', data);
    }
  });

  // 监听声音提醒事件
  eventBus.on('ui:play-reminder-sound', (data: any) => {
    logger.info('[SSE] 收到声音提醒事件:', data);

    if (data.accountUuid) {
      sseClientManager.sendToClient(data.accountUuid, 'notification:sound-reminder', data);
    } else {
      sseClientManager.broadcast('notification:sound-reminder', data);
    }
  });

  // 监听系统通知事件
  eventBus.on('system:show-notification', (data: any) => {
    logger.info('[SSE] 收到系统通知事件:', data);

    if (data.accountUuid) {
      sseClientManager.sendToClient(data.accountUuid, 'notification:system-notification', data);
    } else {
      sseClientManager.broadcast('notification:system-notification', data);
    }
  });

  // 监听 Reminder 触发事件
  eventBus.on('reminder-triggered', (data: any) => {
    logger.info('[SSE] 收到 Reminder 触发事件:', data);

    if (data.accountUuid) {
      sseClientManager.sendToClient(data.accountUuid, 'notification:reminder-triggered', data);
    } else {
      sseClientManager.broadcast('notification:reminder-triggered', data);
    }
  });

  // 监听任务执行事件
  eventBus.on('schedule:task-executed', (data: any) => {
    logger.info('[SSE] 收到任务执行事件:', data);

    if (data.accountUuid) {
      sseClientManager.sendToClient(data.accountUuid, 'notification:task-executed', data);
    }
  });

  logger.info('[SSE] ✅ 通知事件监听器设置完成');
}

// 初始化事件监听器
setupSSEEventListeners();

/**
 * SSE 路由
 */
const router = Router();

/**
 * @swagger
 * /notifications/sse/events:
 *   get:
 *     tags: [Notifications]
 *     summary: 建立 SSE 连接接收实时通知
 *     description: |
 *       通过 Server-Sent Events (SSE) 接收实时通知推送。
 *
 *       支持的事件类型:
 *       - `connected`: 连接建立成功
 *       - `heartbeat`: 心跳保持连接
 *       - `notification:created`: 通知创建
 *       - `notification:sent`: 通知发送
 *       - `notification:popup-reminder`: 弹窗提醒
 *       - `notification:sound-reminder`: 声音提醒
 *       - `notification:system-notification`: 系统通知
 *       - `notification:reminder-triggered`: Reminder 触发
 *       - `notification:task-executed`: 任务执行完成
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT 访问令牌（因为 EventSource 不支持自定义请求头）
 *     responses:
 *       200:
 *         description: SSE 事件流
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: 未授权 - token 无效或过期
 */
router.get('/events', (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    logger.error('[SSE] 连接失败: 缺少 token 参数');
    res.status(401).json({
      success: false,
      message: '缺少认证令牌，请提供有效的 token 参数',
    });
    return;
  }

  // 验证 token 并提取 accountUuid
  const secret = process.env.JWT_SECRET || 'default-secret';

  let accountUuid: string;
  try {
    const decoded = jwt.verify(token, secret) as any;

    if (!decoded.accountUuid) {
      logger.error('[SSE] Token 中缺少 accountUuid');
      res.status(401).json({
        success: false,
        message: 'Token 无效: 缺少用户信息',
      });
      return;
    }

    accountUuid = decoded.accountUuid;
  } catch (jwtError) {
    logger.error('[SSE] Token 验证失败:', jwtError);
    res.status(401).json({
      success: false,
      message: 'Token 无效或已过期',
    });
    return;
  }

  logger.info(`[SSE] 收到 SSE 连接请求, accountUuid: ${accountUuid}`);

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

  // 添加客户端到管理器
  sseClientManager.addClient(accountUuid, res);

  // 客户端断开连接时清理
  req.on('close', () => {
    logger.info(`[SSE] 客户端断开连接: ${accountUuid}`);
    sseClientManager.removeClient(accountUuid);
  });
});

/**
 * @swagger
 * /notifications/sse/status:
 *   get:
 *     tags: [Notifications]
 *     summary: 获取 SSE 连接状态
 *     description: 查看当前活跃的 SSE 连接数量和客户端列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SSE 连接状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalClients:
 *                       type: number
 *                       description: 当前连接的客户端数量
 *                     clients:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 客户端 accountUuid 列表
 */
router.get('/status', (req: Request, res: Response) => {
  const status = sseClientManager.getStatus();

  res.json({
    success: true,
    data: status,
  });
});

export { router as notificationSSERoutes, sseClientManager };
