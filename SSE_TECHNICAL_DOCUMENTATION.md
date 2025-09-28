# Server-Sent Events (SSE) 技术文档

## 概述

本文档详细说明了 DailyUse 项目中 Server-Sent Events (SSE) 的实现、配置和故障排除方法。SSE 用于实现后端调度器与前端的实时通信，推送任务提醒、系统通知等事件。

## 架构概览

```
┌─────────────────┐    SSE连接    ┌─────────────────┐    事件总线    ┌─────────────────┐
│   前端应用      │ ◄─────────── │   API服务器     │ ◄─────────── │   调度器模块    │
│                 │              │                 │              │                 │
│ SSEClient.ts    │              │ SSEController   │              │ ScheduleEngine  │
│ EventBus        │              │ EventSource     │              │ TaskScheduler   │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

## 后端实现

### 1. SSE 控制器 (`SSEController.ts`)

```typescript
export class SSEController {
  private clients = new Map<string, SSEClient>();
  
  // 建立 SSE 连接
  connect = (req: Request, res: Response): void => {
    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // 创建客户端实例并注册事件监听器
    const client = { id: clientId, response: res, lastPing: Date.now() };
    this.clients.set(clientId, client);
    
    // 发送心跳和处理连接关闭
  };
}
```

**关键特性：**
- 自动生成客户端ID
- 30秒心跳机制
- 自动清理过期连接
- CORS支持
- 事件监听器注册

### 2. 路由配置

```typescript
// apps/api/src/modules/schedule/interface/http/routes.ts
router.get('/events', sseController.connect);

// apps/api/src/app.ts 
api.use('/schedules', (req, res, next) => {
  // SSE 事件流端点不需要认证
  if (req.path.startsWith('/events')) {
    return next();
  }
  // 其他端点需要认证
  return authMiddleware(req, res, next);
}, scheduleRoutes);
```

**注意事项：**
- SSE端点不需要JWT认证（避免token过期导致连接断开）
- 路由必须在参数路由之前注册
- 支持CORS预检请求

### 3. 事件类型

支持的SSE事件类型：

| 事件类型 | 说明 | 数据格式 |
|---------|------|----------|
| `connected` | 连接建立确认 | `{clientId, timestamp}` |
| `heartbeat` | 心跳检测 | `{timestamp}` |
| `schedule:popup-reminder` | 弹窗提醒 | `{id, title, message, type, priority, alertMethods, ...}` |
| `schedule:sound-reminder` | 声音提醒 | `{volume}` |
| `schedule:system-notification` | 系统通知 | `{title, body, icon}` |
| `schedule:reminder-triggered` | 通用提醒触发 | `{id, title, message, timestamp, ...}` |
| `schedule:task-executed` | 任务执行完成 | `{taskId, result, timestamp}` |

### 4. 事件流格式

```
event: schedule:popup-reminder
data: {"type":"schedule:popup-reminder","data":{"id":"uuid","title":"提醒标题","message":"提醒内容","timestamp":"2025-09-28T07:00:00.000Z"},"timestamp":"2025-09-28T07:00:00.000Z"}

event: heartbeat
data: {"timestamp":"2025-09-28T07:00:30.000Z"}
```

## 前端实现

### 1. SSE 客户端 (`SSEClient.ts`)

```typescript
export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  async connect(): Promise<void> {
    const url = `${this.baseUrl}/api/v1/schedules/events`;
    this.eventSource = new EventSource(url);
    
    // 连接成功处理
    this.eventSource.onopen = () => {
      console.log('[SSE Client] ✅ 连接成功');
      this.reconnectAttempts = 0;
    };
    
    // 错误处理和重连逻辑
    this.eventSource.onerror = (error) => {
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.attemptReconnect();
      }
    };
  }
}
```

**关键特性：**
- 自动重连机制（指数退避）
- 连接状态管理
- 事件路由到前端事件总线
- 优雅的错误处理

### 2. 事件处理映射

```typescript
private handleScheduleEvent(eventType: string, data: string): void {
  const parsedData = JSON.parse(data);
  
  switch (eventType) {
    case 'popup-reminder':
      eventBus.emit('ui:show-popup-reminder', parsedData.data);
      break;
    case 'sound-reminder':
      eventBus.emit('ui:play-reminder-sound', parsedData.data);
      break;
    case 'system-notification':
      eventBus.emit('system:show-notification', parsedData.data);
      break;
  }
}
```

### 3. 初始化管理

```typescript
// NotificationInitializationManager.ts
private async initializeSSEConnection(): Promise<void> {
  try {
    await sseClient.connect();
    const status = sseClient.getStatus();
    
    if (status.connected) {
      console.log('[NotificationInit] ✅ SSE 连接建立成功');
    } else {
      // 后台重试逻辑
      this.retrySSEConnectionInBackground();
    }
  } catch (error) {
    // 非阻塞错误处理
    console.warn('[NotificationInit] SSE 初始化失败，但继续执行');
  }
}
```

## 配置说明

### 1. 环境变量

```bash
# API服务器配置
PORT=3888
CORS_ORIGIN=http://localhost:5173

# SSE相关配置
SSE_HEARTBEAT_INTERVAL=30000  # 心跳间隔（毫秒）
SSE_CLIENT_TIMEOUT=60000      # 客户端超时（毫秒）
SSE_MAX_CLIENTS=100           # 最大客户端连接数
```

### 2. 前端配置

```typescript
// SSEClient.ts 配置参数
private maxReconnectAttempts = 5;     // 最大重连次数
private reconnectDelay = 1000;        // 初始重连延迟
private connectionTimeout = 5000;     // 连接超时时间
```

### 3. CORS 配置

```typescript
// app.ts
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## 故障排除

### 1. 常见问题

#### 问题：前端显示 "SSE 连接超时"
**原因：** 
- API服务器未启动
- 端口冲突
- CORS配置错误

**解决方案：**
```bash
# 检查API服务器状态
curl -v http://localhost:3888/api/v1/schedules/events

# 检查端口占用
netstat -an | findstr 3888

# 验证CORS配置
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS http://localhost:3888/api/v1/schedules/events
```

#### 问题：连接建立但无法接收事件
**原因：**
- 事件监听器未正确注册
- 事件名称不匹配
- JSON解析错误

**解决方案：**
```typescript
// 检查事件监听器
this.eventSource.addEventListener('schedule:popup-reminder', (event) => {
  console.log('收到事件:', event.type, event.data);
});

// 验证事件名称
const expectedEvents = [
  'connected', 'heartbeat', 
  'schedule:popup-reminder', 'schedule:sound-reminder'
];
```

#### 问题：频繁重连
**原因：**
- 网络不稳定
- 服务器端连接清理过于频繁
- 客户端重连逻辑问题

**解决方案：**
```typescript
// 调整重连参数
private maxReconnectAttempts = 10;     // 增加重连次数
private reconnectDelay = 2000;         // 增加重连延迟
```

### 2. 调试工具

#### 服务器端调试
```typescript
// 添加详细日志
console.log(`[SSE] 客户端连接: ${clientId}, 当前连接数: ${this.clients.size}`);
console.log(`[SSE] 广播事件: ${eventType}, 数据:`, data);

// 监控连接状态
router.get('/events/status', (req, res) => {
  res.json({
    connectedClients: sseController.getStatus().connectedClients,
    uptime: process.uptime()
  });
});
```

#### 客户端调试
```typescript
// 连接状态检查
setInterval(() => {
  const status = sseClient.getStatus();
  console.log('SSE状态:', status);
}, 10000);

// 事件计数
let eventCount = 0;
eventBus.on('sse:*', () => {
  eventCount++;
  console.log('收到SSE事件总数:', eventCount);
});
```

#### 浏览器工具
1. **Network 面板**：检查SSE连接状态和数据流
2. **Console**：查看连接日志和错误信息
3. **Application > EventSource**：监控事件流

### 3. 性能优化

#### 减少重连频率
```typescript
// 使用指数退避算法
private attemptReconnect(): void {
  const delay = Math.min(
    this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 
    30000 // 最大30秒
  );
  
  setTimeout(() => this.connect(), delay);
}
```

#### 事件过滤
```typescript
// 只订阅必要的事件类型
const interestedEvents = ['schedule:popup-reminder', 'schedule:sound-reminder'];

this.eventSource.addEventListener(eventType, (event) => {
  if (interestedEvents.includes(eventType)) {
    this.handleScheduleEvent(eventType, event.data);
  }
});
```

#### 连接池管理
```typescript
// 限制最大连接数
if (this.clients.size >= maxClients) {
  res.status(503).json({ error: '服务器连接已满' });
  return;
}
```

## 最佳实践

### 1. 错误处理
- 使用非阻塞的连接策略
- 实现优雅降级（SSE失败时使用轮询）
- 记录详细的错误日志

### 2. 安全考虑
- SSE端点不需要认证（避免token过期）
- 实现连接数限制
- 防止事件数据注入攻击

### 3. 监控和告警
- 监控连接数和事件流量
- 设置连接异常告警
- 记录重连频率和成功率

### 4. 测试策略
```typescript
// 单元测试示例
describe('SSEClient', () => {
  it('应该能够建立连接', async () => {
    const client = new SSEClient();
    await client.connect();
    expect(client.isConnected()).toBe(true);
  });

  it('应该能够处理重连', () => {
    // 模拟连接断开
    // 验证重连逻辑
  });
});
```

## 结论

SSE实现已经完成修复，主要解决了：

1. **连接超时问题**：优化了前端连接逻辑，避免阻塞应用启动
2. **错误处理**：改善了错误处理机制，提供更好的用户体验
3. **重连机制**：实现了指数退避的重连策略
4. **状态管理**：提供了详细的连接状态监控

当前SSE系统能够稳定地在前后端之间传输实时事件，支持调度器的各种提醒类型，并具有良好的容错能力。