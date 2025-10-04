# SSE (Server-Sent Events) 实现完整指南

## 📚 目录
1. [什么是 SSE](#什么是-sse)
2. [SSE vs WebSocket vs 轮询](#sse-vs-websocket-vs-轮询)
3. [DailyUse 项目中的 SSE 架构](#dailyuse-项目中的-sse-架构)
4. [后端实现详解](#后端实现详解)
5. [前端实现详解](#前端实现详解)
6. [完整实现流程](#完整实现流程)
7. [故障排查](#故障排查)
8. [性能优化](#性能优化)

---

## 什么是 SSE

### 基本概念

**Server-Sent Events (SSE)** 是一种服务器向客户端推送数据的单向通信技术。

```
客户端 ────────> 服务器   (建立HTTP连接)
客户端 <──────── 服务器   (服务器持续推送数据)
客户端 <──────── 服务器   (服务器持续推送数据)
客户端 <──────── 服务器   (服务器持续推送数据)
```

### 核心特点

1. **单向通信**：只能服务器→客户端推送数据
2. **基于HTTP**：使用标准HTTP协议，无需特殊协议
3. **自动重连**：浏览器原生支持断线重连
4. **文本格式**：只能传输文本数据（通常是JSON字符串）
5. **轻量级**：比WebSocket更简单，开销更小

### 数据格式

SSE使用特定的文本格式：

```
event: messageName
data: {"key": "value"}
id: 123

event: anotherEvent
data: some text data
```

**格式规则：**
- `event:` 事件名称（可选，默认为 `message`）
- `data:` 事件数据（必需）
- `id:` 事件ID（可选，用于重连时续传）
- 每个字段以 `\n` 结尾
- 事件之间用空行 `\n\n` 分隔

---

## SSE vs WebSocket vs 轮询

### 对比表格

| 特性 | SSE | WebSocket | 轮询 |
|-----|-----|-----------|-----|
| **通信方向** | 单向（服务器→客户端） | 双向 | 请求-响应 |
| **协议** | HTTP | WebSocket (ws://) | HTTP |
| **复杂度** | 简单 | 中等 | 简单 |
| **浏览器支持** | 原生支持 | 原生支持 | 全部支持 |
| **自动重连** | ✅ 浏览器原生支持 | ❌ 需要自己实现 | ❌ 需要自己实现 |
| **实时性** | 高 | 最高 | 低 |
| **服务器压力** | 低 | 中 | 高（频繁请求） |
| **适用场景** | 通知、状态更新、实时数据流 | 聊天、游戏、协作编辑 | 简单的定时更新 |

### 何时使用 SSE

✅ **适合使用 SSE 的场景：**
- 服务器向客户端推送通知
- 实时状态更新（股票价格、任务进度）
- 日志流式传输
- 系统监控数据推送
- **我们的场景：调度任务提醒和事件通知**

❌ **不适合使用 SSE 的场景：**
- 需要客户端频繁向服务器发送数据
- 需要双向实时通信（聊天应用）
- 需要传输二进制数据（文件、图片）

---

## DailyUse 项目中的 SSE 架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端应用层 (Vue)                          │
├─────────────────────────────────────────────────────────────┤
│  Vue组件监听事件总线                                         │
│  - ScheduleManagementView.vue                               │
│  - ReminderDesktopView.vue                                  │
│  - NotificationPanel.vue                                    │
└────────────────┬────────────────────────────────────────────┘
                 │ 监听 eventBus.on('schedule:task-executed')
                 ↓
┌─────────────────────────────────────────────────────────────┐
│            前端事件总线 (EventBus)                           │
│  - 'schedule:task-executed'                                 │
│  - 'ui:show-popup-reminder'                                 │
│  - 'system:show-notification'                               │
│  - 'sse:connected'                                          │
└────────────────┬────────────────────────────────────────────┘
                 │ eventBus.emit()
                 ↑
┌─────────────────────────────────────────────────────────────┐
│              SSE 客户端 (SSEClient.ts)                       │
│  - 建立 EventSource 连接                                    │
│  - 监听服务器事件                                           │
│  - 自动重连机制                                             │
│  - 事件路由和分发                                           │
└────────────────┬────────────────────────────────────────────┘
                 │ EventSource 连接
                 │ GET /api/v1/schedules/events
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              后端 SSE 控制器 (SSEController.ts)              │
│  - 管理客户端连接 Map<clientId, Response>                   │
│  - 发送心跳 (30秒一次)                                      │
│  - 广播事件给所有客户端                                     │
│  - 清理过期连接                                             │
└────────────────┬────────────────────────────────────────────┘
                 │ 监听后端事件总线
                 ↑
┌─────────────────────────────────────────────────────────────┐
│            后端事件总线 (EventBusService)                    │
│  - 'schedule:popup-reminder'                                │
│  - 'schedule:sound-reminder'                                │
│  - 'schedule:task-executed'                                 │
└────────────────┬────────────────────────────────────────────┘
                 │ emit 事件
                 ↑
┌─────────────────────────────────────────────────────────────┐
│              调度引擎 (ScheduleEngine)                       │
│  - 任务执行器                                               │
│  - 提醒触发器                                               │
│  - 定时任务管理                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据流向示例

**场景：用户设置的提醒时间到了**

```
1. ScheduleEngine 触发提醒
   ↓
2. ScheduleEngine 发出事件: eventBus.emit('schedule:popup-reminder', {...})
   ↓
3. SSEController 监听到事件
   ↓
4. SSEController.broadcast() 向所有客户端发送:
   event: schedule:popup-reminder
   data: {"type":"schedule:popup-reminder","data":{...},"timestamp":"..."}
   ↓
5. 前端 SSEClient 收到事件
   ↓
6. SSEClient.handleScheduleEvent() 解析数据
   ↓
7. 前端 eventBus.emit('ui:show-popup-reminder', {...})
   ↓
8. Vue 组件监听到 'ui:show-popup-reminder'
   ↓
9. 显示弹窗提醒 ✅
```

---

## 后端实现详解

### 1. SSE 控制器核心代码

**文件位置：** `apps/api/src/modules/schedule/interface/http/controllers/SSEController.ts`

```typescript
import { Request, Response } from 'express';
import { EventBusService } from '@dailyuse/domain-server';

interface SSEClient {
  id: string;
  response: Response;
  lastPing: Date;
}

export class SSEController {
  // 存储所有连接的客户端
  private clients = new Map<string, SSEClient>();
  
  // 心跳间隔（30秒）
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private eventBus: EventBusService) {
    this.initializeEventListeners();
    this.startHeartbeat();
  }

  /**
   * 建立 SSE 连接端点
   * GET /api/v1/schedules/events
   */
  connect = (req: Request, res: Response): void => {
    // 生成唯一客户端ID
    const clientId = `client_${Date.now()}_${Math.random()}`;

    // 设置 SSE 必需的响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',        // SSE MIME类型
      'Cache-Control': 'no-cache',                // 禁止缓存
      'Connection': 'keep-alive',                 // 保持连接
      'Access-Control-Allow-Origin': '*',         // CORS支持
      'X-Accel-Buffering': 'no',                  // Nginx配置：禁用缓冲
    });

    // 保存客户端连接
    const client: SSEClient = {
      id: clientId,
      response: res,
      lastPing: new Date(),
    };
    this.clients.set(clientId, client);

    console.log(`[SSE] 新客户端连接: ${clientId}, 当前连接数: ${this.clients.size}`);

    // 发送连接成功事件
    this.sendEvent(res, 'connected', {
      clientId,
      timestamp: new Date().toISOString(),
      message: 'SSE connection established',
    });

    // 监听客户端断开
    req.on('close', () => {
      this.clients.delete(clientId);
      console.log(`[SSE] 客户端断开: ${clientId}, 剩余连接: ${this.clients.size}`);
    });
  };

  /**
   * 发送单个事件给指定客户端
   */
  private sendEvent(res: Response, eventType: string, data: any): void {
    try {
      // SSE 格式：event: xxx\ndata: xxx\n\n
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('[SSE] 发送事件失败:', error);
    }
  }

  /**
   * 广播事件给所有客户端
   */
  private broadcast(eventType: string, data: any): void {
    const deadClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      try {
        this.sendEvent(client.response, eventType, data);
      } catch (error) {
        console.error(`[SSE] 发送失败，标记移除: ${clientId}`, error);
        deadClients.push(clientId);
      }
    });

    // 清理死连接
    deadClients.forEach(id => this.clients.delete(id));
  }

  /**
   * 初始化事件监听器
   * 监听后端事件总线，转发给前端
   */
  private initializeEventListeners(): void {
    // 弹窗提醒
    this.eventBus.on('schedule:popup-reminder', (data) => {
      this.broadcast('schedule:popup-reminder', {
        type: 'schedule:popup-reminder',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    // 声音提醒
    this.eventBus.on('schedule:sound-reminder', (data) => {
      this.broadcast('schedule:sound-reminder', {
        type: 'schedule:sound-reminder',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    // 系统通知
    this.eventBus.on('schedule:system-notification', (data) => {
      this.broadcast('schedule:system-notification', {
        type: 'schedule:system-notification',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    // 任务执行完成
    this.eventBus.on('schedule:task-executed', (data) => {
      this.broadcast('schedule:task-executed', {
        type: 'schedule:task-executed',
        data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * 启动心跳机制
   * 每30秒向所有客户端发送心跳，保持连接活跃
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      
      this.broadcast('heartbeat', {
        timestamp: now.toISOString(),
        clients: this.clients.size,
      });

      // 清理超过60秒未响应的客户端
      const deadClients: string[] = [];
      this.clients.forEach((client, clientId) => {
        const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
        if (timeSinceLastPing > 60000) {
          deadClients.push(clientId);
        } else {
          client.lastPing = now; // 更新心跳时间
        }
      });

      deadClients.forEach(id => {
        console.log(`[SSE] 清理超时客户端: ${id}`);
        this.clients.delete(id);
      });
    }, 30000); // 30秒
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.clients.clear();
  }
}
```

### 2. 路由配置

**文件位置：** `apps/api/src/modules/schedule/interface/http/routes.ts`

```typescript
import { Router } from 'express';
import { SSEController } from './controllers/SSEController';
import { eventBusService } from '@dailyuse/domain-server';

const router = Router();
const sseController = new SSEController(eventBusService);

// ⚠️ 重要：SSE 路由必须放在其他参数路由之前
router.get('/events', sseController.connect);

// 其他路由...
router.get('/', scheduleController.getTasks);
router.post('/', scheduleController.createTask);
router.get('/:uuid', scheduleController.getTask);

export default router;
```

### 3. 主应用配置

**文件位置：** `apps/api/src/app.ts`

```typescript
import express from 'express';
import cors from 'cors';
import scheduleRoutes from './modules/schedule/interface/http/routes';

const app = express();

// CORS 配置（SSE 必需）
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
}));

// 挂载 Schedule 路由
// ⚠️ SSE 端点不需要认证，避免 token 过期导致连接断开
app.use('/api/v1/schedules', (req, res, next) => {
  // SSE 端点跳过认证
  if (req.path.startsWith('/events')) {
    return next();
  }
  // 其他端点需要认证
  return authMiddleware(req, res, next);
}, scheduleRoutes);

export default app;
```

---

## 前端实现详解

### 1. SSE 客户端核心代码

**文件位置：** `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`

```typescript
import { eventBus } from '@dailyuse/utils';

export class SSEClient {
  // EventSource 对象（浏览器原生API）
  private eventSource: EventSource | null = null;
  
  // 重连参数
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 初始延迟 1秒
  
  // 连接状态
  private isConnecting = false;
  private isDestroyed = false;

  constructor(private baseUrl: string = 'http://localhost:3888') {}

  /**
   * 建立 SSE 连接
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 防止重复连接
      if (this.isConnecting || this.eventSource) {
        console.log('[SSE Client] 连接已存在');
        resolve();
        return;
      }

      this.isConnecting = true;
      const url = `${this.baseUrl}/api/v1/schedules/events`;

      console.log('[SSE Client] 连接到:', url);

      try {
        // 创建 EventSource 连接
        this.eventSource = new EventSource(url);

        // ========== 连接成功 ==========
        this.eventSource.onopen = () => {
          console.log('[SSE Client] ✅ 连接成功');
          this.reconnectAttempts = 0; // 重置重连计数
          this.isConnecting = false;
          
          // 通知前端连接成功
          eventBus.emit('sse:connected', {
            timestamp: new Date().toISOString(),
          });
          
          resolve();
        };

        // ========== 接收默认消息 ==========
        this.eventSource.onmessage = (event) => {
          console.log('[SSE Client] 收到消息:', event.data);
          this.handleMessage('message', event.data);
        };

        // ========== 监听自定义事件 ==========
        
        // 连接建立事件
        this.eventSource.addEventListener('connected', (event) => {
          console.log('[SSE Client] 🔗 连接建立:', event.data);
          this.handleMessage('connected', event.data);
        });

        // 心跳事件
        this.eventSource.addEventListener('heartbeat', (event) => {
          console.log('[SSE Client] 💓 心跳');
          // 不需要特殊处理，只是保持连接活跃
        });

        // 调度事件 - 弹窗提醒
        this.eventSource.addEventListener('schedule:popup-reminder', (event) => {
          console.log('[SSE Client] 🔔 弹窗提醒:', event.data);
          this.handleScheduleEvent('popup-reminder', event.data);
        });

        // 调度事件 - 声音提醒
        this.eventSource.addEventListener('schedule:sound-reminder', (event) => {
          console.log('[SSE Client] 🔊 声音提醒:', event.data);
          this.handleScheduleEvent('sound-reminder', event.data);
        });

        // 调度事件 - 系统通知
        this.eventSource.addEventListener('schedule:system-notification', (event) => {
          console.log('[SSE Client] 📢 系统通知:', event.data);
          this.handleScheduleEvent('system-notification', event.data);
        });

        // 调度事件 - 任务执行完成
        this.eventSource.addEventListener('schedule:task-executed', (event) => {
          console.log('[SSE Client] ⚡ 任务执行:', event.data);
          this.handleScheduleEvent('task-executed', event.data);
        });

        // ========== 连接错误处理 ==========
        this.eventSource.onerror = (error) => {
          console.error('[SSE Client] ❌ 连接错误:', error);
          this.isConnecting = false;

          // 检查 EventSource 状态
          if (this.eventSource?.readyState === EventSource.CONNECTING) {
            console.log('[SSE Client] 正在连接中...');
            // 继续等待
          } else if (this.eventSource?.readyState === EventSource.CLOSED) {
            console.log('[SSE Client] 连接已关闭，准备重连');
            this.attemptReconnect();
          }

          // 不 reject，避免阻塞应用启动
          resolve();
        };

      } catch (error) {
        console.error('[SSE Client] 创建连接失败:', error);
        this.isConnecting = false;
        resolve(); // 不 reject，优雅降级
      }
    });
  }

  /**
   * 处理通用消息
   */
  private handleMessage(type: string, data: string): void {
    try {
      const parsedData = JSON.parse(data);
      
      // 转发到事件总线
      eventBus.emit(`sse:${type}`, parsedData);
    } catch (error) {
      console.error('[SSE Client] 解析消息失败:', error, data);
    }
  }

  /**
   * 处理调度事件
   */
  private handleScheduleEvent(eventType: string, data: string): void {
    try {
      const parsedData = JSON.parse(data);
      console.log(`[SSE Client] 处理调度事件 ${eventType}:`, parsedData);

      // 根据事件类型路由到不同的前端事件
      switch (eventType) {
        case 'popup-reminder':
          // UI 层弹窗
          eventBus.emit('ui:show-popup-reminder', parsedData.data);
          break;

        case 'sound-reminder':
          // 播放提醒音
          eventBus.emit('ui:play-reminder-sound', parsedData.data);
          break;

        case 'system-notification':
          // 系统级通知
          eventBus.emit('system:show-notification', parsedData.data);
          break;

        case 'task-executed':
          // 任务执行完成
          eventBus.emit('schedule:task-executed', parsedData.data);
          break;

        default:
          console.warn('[SSE Client] 未知事件类型:', eventType);
      }

      // 同时发送原始 SSE 事件
      eventBus.emit(`sse:schedule:${eventType}`, parsedData);
      
    } catch (error) {
      console.error('[SSE Client] 处理调度事件失败:', error, data);
    }
  }

  /**
   * 尝试重新连接（指数退避算法）
   */
  private attemptReconnect(): void {
    // 检查是否应该停止重连
    if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[SSE Client] 停止重连');
      eventBus.emit('sse:reconnect-failed');
      return;
    }

    this.reconnectAttempts++;
    
    // 指数退避：1s, 2s, 4s, 8s, 16s, ... 最大30s
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(`[SSE Client] 第 ${this.reconnectAttempts} 次重连，延迟 ${delay}ms`);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.disconnect(); // 清理旧连接
        this.connect()
          .then(() => {
            console.log('[SSE Client] 重连成功');
            eventBus.emit('sse:reconnected');
          })
          .catch((error) => {
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
  getStatus(): {
    connected: boolean;
    readyState: number | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.eventSource?.readyState === EventSource.OPEN,
      readyState: this.eventSource?.readyState || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// 导出全局单例
export const sseClient = new SSEClient();
```

### 2. 在 Vue 组件中使用

**文件位置：** `apps/web/src/modules/schedule/presentation/views/ScheduleManagementView.vue`

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { sseClient } from '@/modules/notification/infrastructure/sse/SSEClient';
import { eventBus } from '@dailyuse/utils';

// 连接状态
const connectionStatus = ref({
  connected: false,
  reconnectAttempts: 0,
});

// 更新连接状态
const updateConnectionStatus = () => {
  const status = sseClient.getStatus();
  connectionStatus.value.connected = status.connected;
  connectionStatus.value.reconnectAttempts = status.reconnectAttempts;
};

// 手动重连
const reconnectSSE = async () => {
  reconnecting.value = true;
  try {
    await sseClient.connect();
    updateConnectionStatus();
  } catch (error) {
    console.error('重连失败:', error);
  } finally {
    reconnecting.value = false;
  }
};

// 监听 SSE 事件
let unsubscribeConnected: (() => void) | null = null;
let unsubscribeTaskExecuted: (() => void) | null = null;

onMounted(async () => {
  // 监听连接成功事件
  unsubscribeConnected = eventBus.on('sse:connected', () => {
    console.log('✅ SSE 连接成功');
    updateConnectionStatus();
  });

  // 监听任务执行事件
  unsubscribeTaskExecuted = eventBus.on('schedule:task-executed', (data) => {
    console.log('⚡ 任务执行完成:', data);
    // 刷新任务列表
    refreshTasks();
  });

  // 初始化连接
  if (!sseClient.isConnected()) {
    await sseClient.connect();
  }
  updateConnectionStatus();
});

onUnmounted(() => {
  // 清理事件监听
  if (unsubscribeConnected) unsubscribeConnected();
  if (unsubscribeTaskExecuted) unsubscribeTaskExecuted();
});
</script>

<template>
  <div>
    <!-- 连接状态指示器 -->
    <v-chip 
      :color="connectionStatus.connected ? 'success' : 'error'"
      variant="outlined"
      size="small"
    >
      <v-icon start>
        {{ connectionStatus.connected ? 'mdi-wifi' : 'mdi-wifi-off' }}
      </v-icon>
      {{ connectionStatus.connected ? '实时连接' : '连接中断' }}
    </v-chip>

    <!-- 重连按钮 -->
    <v-btn 
      v-if="!connectionStatus.connected"
      @click="reconnectSSE"
      :loading="reconnecting"
    >
      重新连接
    </v-btn>
  </div>
</template>
```

---

## 完整实现流程

### 从零开始实现 SSE（步骤清单）

#### 第一步：后端实现

1. **创建 SSE 控制器**
```bash
# 创建文件
apps/api/src/modules/schedule/interface/http/controllers/SSEController.ts
```

2. **实现核心功能**
   - [ ] 客户端管理（Map存储）
   - [ ] connect() 方法处理连接
   - [ ] sendEvent() 发送单个事件
   - [ ] broadcast() 广播给所有客户端
   - [ ] 心跳机制（30秒interval）
   - [ ] 事件监听器注册

3. **配置路由**
```typescript
// routes.ts
router.get('/events', sseController.connect);
```

4. **配置 CORS**
```typescript
// app.ts
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));
```

5. **跳过认证**
```typescript
// app.ts
app.use('/api/v1/schedules', (req, res, next) => {
  if (req.path.startsWith('/events')) {
    return next(); // SSE 端点不需要认证
  }
  return authMiddleware(req, res, next);
}, scheduleRoutes);
```

#### 第二步：前端实现

1. **创建 SSE 客户端**
```bash
# 创建文件
apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts
```

2. **实现核心功能**
   - [ ] EventSource 连接管理
   - [ ] connect() 方法
   - [ ] 事件监听器（connected, heartbeat, schedule:xxx）
   - [ ] handleMessage() 处理消息
   - [ ] handleScheduleEvent() 路由调度事件
   - [ ] attemptReconnect() 重连逻辑
   - [ ] getStatus() 状态查询

3. **创建全局实例**
```typescript
export const sseClient = new SSEClient();
```

4. **在组件中使用**
```typescript
// Vue 组件
onMounted(async () => {
  await sseClient.connect();
  
  eventBus.on('schedule:task-executed', (data) => {
    // 处理事件
  });
});
```

#### 第三步：测试

1. **测试连接**
```bash
# 启动后端
cd apps/api
npm run dev

# 浏览器访问
curl -N http://localhost:3888/api/v1/schedules/events
```

2. **测试事件发送**
```typescript
// 在后端代码中手动触发事件
eventBusService.emit('schedule:popup-reminder', {
  id: 'test-123',
  title: '测试提醒',
  message: '这是一条测试消息',
});
```

3. **检查浏览器控制台**
   - 查看 Network 面板的 EventStream
   - 查看 Console 的连接日志

---

## 故障排查

### 问题1：连接超时

**症状：**
```
[SSE Client] 连接超时，但继续尝试...
```

**原因：**
- 后端服务未启动
- 端口不正确
- CORS 配置错误
- 防火墙阻止

**解决方案：**
```bash
# 1. 检查后端服务
curl http://localhost:3888/api/v1/schedules/events

# 2. 检查端口
netstat -an | findstr 3888

# 3. 检查 CORS
# 在 app.ts 中确认 origin 包含前端地址
```

### 问题2：连接建立但无法接收事件

**症状：**
```
[SSE Client] ✅ 连接成功
但没有收到任何事件
```

**原因：**
- 事件名称不匹配
- 后端未正确发送事件
- JSON 解析错误

**解决方案：**
```typescript
// 检查事件名称是否一致
// 后端
this.broadcast('schedule:popup-reminder', data);

// 前端
this.eventSource.addEventListener('schedule:popup-reminder', (event) => {
  // ...
});

// 检查后端是否正确发送
// 在 SSEController.sendEvent() 中添加日志
console.log(`[SSE] 发送事件: ${eventType}`, data);
```

### 问题3：频繁重连

**症状：**
```
[SSE Client] 第 1 次重连，延迟 1000ms
[SSE Client] 第 2 次重连，延迟 2000ms
[SSE Client] 第 3 次重连，延迟 4000ms
```

**原因：**
- 网络不稳定
- 服务器频繁重启
- 心跳超时参数太小

**解决方案：**
```typescript
// 调整重连参数
private maxReconnectAttempts = 10;     // 增加重连次数
private reconnectDelay = 2000;         // 增加初始延迟

// 调整心跳超时
// SSEController.ts
const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
if (timeSinceLastPing > 120000) { // 改为 120 秒
  deadClients.push(clientId);
}
```

### 问题4：浏览器显示 "net::ERR_INCOMPLETE_CHUNKED_ENCODING"

**原因：**
- Nginx 或代理服务器缓冲了响应
- 响应头配置不正确

**解决方案：**
```typescript
// 1. 添加响应头
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',  // 禁用 Nginx 缓冲
});

// 2. Nginx 配置
location /api/v1/schedules/events {
  proxy_buffering off;
  proxy_cache off;
  proxy_set_header Connection '';
  proxy_http_version 1.1;
  chunked_transfer_encoding off;
}
```

---

## 性能优化

### 1. 减少不必要的事件

```typescript
// 只在需要时广播事件
private broadcast(eventType: string, data: any): void {
  // 检查是否有客户端连接
  if (this.clients.size === 0) {
    return; // 没有客户端，不发送
  }

  // 发送事件...
}
```

### 2. 事件压缩

```typescript
// 对于大数据量，使用压缩
import zlib from 'zlib';

private sendEvent(res: Response, eventType: string, data: any): void {
  const dataString = JSON.stringify(data);
  
  // 如果数据大于 1KB，压缩
  if (dataString.length > 1024) {
    const compressed = zlib.gzipSync(dataString);
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${compressed.toString('base64')}\n\n`);
  } else {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${dataString}\n\n`);
  }
}
```

### 3. 连接池限制

```typescript
// SSEController.ts
connect = (req: Request, res: Response): void => {
  const maxClients = 100;
  
  if (this.clients.size >= maxClients) {
    res.status(503).json({ error: '服务器连接已满' });
    return;
  }

  // 正常连接逻辑...
};
```

### 4. 事件批处理

```typescript
// 批量发送事件，减少网络开销
private eventQueue: Array<{ type: string; data: any }> = [];
private flushInterval: NodeJS.Timeout | null = null;

constructor() {
  // 每 100ms 批量发送一次
  this.flushInterval = setInterval(() => {
    this.flushEvents();
  }, 100);
}

private broadcast(eventType: string, data: any): void {
  this.eventQueue.push({ type: eventType, data });
}

private flushEvents(): void {
  if (this.eventQueue.length === 0) return;

  const events = this.eventQueue.splice(0, this.eventQueue.length);
  
  this.clients.forEach((client) => {
    events.forEach(({ type, data }) => {
      this.sendEvent(client.response, type, data);
    });
  });
}
```

---

## 总结

### SSE 实现的关键点

✅ **后端：**
1. 正确设置响应头（Content-Type: text/event-stream）
2. 保持连接（Connection: keep-alive）
3. 定期发送心跳
4. 管理客户端连接池
5. 优雅清理断开的连接

✅ **前端：**
1. 使用 EventSource API
2. 监听自定义事件
3. 实现自动重连机制
4. 路由事件到事件总线
5. 提供连接状态监控

✅ **注意事项：**
1. SSE 端点不需要认证（避免 token 过期）
2. 使用指数退避算法重连
3. CORS 配置必须正确
4. 监控连接数和内存占用
5. 提供优雅降级方案

---

## 参考资源

- **MDN EventSource**: https://developer.mozilla.org/en-US/docs/Web/API/EventSource
- **SSE 规范**: https://html.spec.whatwg.org/multipage/server-sent-events.html
- **Node.js SSE 实践**: https://nodejs.org/api/http.html#http_class_http_serverresponse

---

**更新日期：** 2025-10-04  
**作者：** DailyUse Team  
**版本：** 1.0.0
