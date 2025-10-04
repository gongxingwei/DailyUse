# SSE 连接问题修复总结

## 问题概述

### 问题 1：前端无法收到 SSE 响应（响应为空）

**现象**：
- 后端日志显示连接成功并发送了数据
- 前端 Network 标签显示请求处于 pending 状态
- EventSource.onopen 从未触发
- 浏览器收到的响应体为空

**根本原因**：
1. `res.writeHead()` 后没有立即调用 `res.flushHeaders()`
2. 在发送数据前有 `console.log()` 等操作

**解决方案**：
```typescript
// ❌ 之前的代码
res.writeHead(200, headers);
console.log('[SSE] 响应头已设置:', headers); // 这行会导致问题
this.sendEvent(res, 'connected', { ... });

// ✅ 修复后的代码
res.writeHead(200, headers);
res.flushHeaders(); // 立即 flush
this.sendEvent(res, 'connected', { ... });
console.log('[SSE] 连接确认已发送'); // console.log 移到后面
```

### 问题 2：SSE 连接失败导致整个应用阻塞、黑屏

**现象**：
- SSE 连接失败时，页面完全无法加载
- 白屏或黑屏，没有任何 UI 显示
- 控制台显示初始化被阻塞

**根本原因**：
1. `connect()` 方法返回的 Promise 在连接成功前不会 resolve
2. 连接失败时会 reject Promise
3. InitializationManager 等待这个 Promise，导致整个应用初始化被阻塞

**解决方案**：
```typescript
// ❌ 之前的代码（阻塞式）
async connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.eventSource = new EventSource(url);
    
    this.eventSource.onopen = () => {
      resolve(); // 等待连接成功
    };
    
    this.eventSource.onerror = () => {
      reject(new Error('连接失败')); // 阻塞应用
    };
  });
}

// ✅ 修复后的代码（非阻塞式）
async connect(): Promise<void> {
  // 立即返回，不等待连接完成
  if (this.eventSource || this.isConnecting) {
    return Promise.resolve();
  }
  
  // 在后台异步建立连接
  this.connectInBackground();
  return Promise.resolve();
}

private connectInBackground(): void {
  // 实际连接逻辑
  this.eventSource = new EventSource(url);
  
  this.eventSource.onopen = () => {
    // 连接成功，不调用 resolve
    this.isConnecting = false;
  };
  
  this.eventSource.onerror = () => {
    // 连接失败，自动重试，不 reject
    this.attemptReconnect();
  };
}
```

## 关键修改点

### 1. 后端 SSEController.ts

#### 修改 1：添加 flushHeaders()
```diff
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'X-Accel-Buffering': 'no',
  });
+ res.flushHeaders();

  this.sendEvent(res, 'connected', { ... });
```

#### 修改 2：sendEvent 中添加 flush
```diff
  private sendEvent(res: Response, eventType: string, data: any): void {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
+   
+   // 立即 flush，确保数据发送到客户端
+   if (typeof (res as any).flush === 'function') {
+     (res as any).flush();
+   }
  }
```

#### 修改 3：移除 writeHead 后的 console.log
```diff
  res.writeHead(200, headers);
- console.log('[SSE] 响应头已设置:', headers);
+ res.flushHeaders();
  this.sendEvent(res, 'connected', { ... });
+ console.log('[SSE] 连接确认已发送');
```

### 2. 前端 SSEClient.ts

#### 修改 1：connect() 改为非阻塞
```diff
- async connect(): Promise<void> {
-   return new Promise((resolve, reject) => {
-     // ...连接逻辑
-   });
- }

+ async connect(): Promise<void> {
+   if (this.eventSource || this.isConnecting) {
+     return Promise.resolve();
+   }
+   this.connectInBackground();
+   return Promise.resolve();
+ }
+
+ private connectInBackground(): void {
+   // ...连接逻辑
+ }
```

#### 修改 2：移除 resolve/reject 调用
```diff
  this.eventSource.onopen = () => {
    console.log('[SSE Client] 连接成功');
    this.isConnecting = false;
-   resolve();
  };

  this.eventSource.onerror = () => {
    console.error('[SSE Client] 连接错误');
    if (this.eventSource?.readyState === EventSource.CLOSED) {
-     reject(new Error('连接失败'));
+     this.attemptReconnect();
    }
  };
```

#### 修改 3：错误时不抛出异常
```diff
  const token = AuthManager.getAccessToken();
  if (!token) {
    console.error('[SSE Client] 缺少 token');
-   reject(new Error('需要认证 token'));
-   return;
+   setTimeout(() => this.connectInBackground(), 1000);
+   return;
  }

  try {
    // ...
  } catch (error) {
    console.error('[SSE Client] 创建连接失败:', error);
-   reject(error);
+   setTimeout(() => this.connectInBackground(), 2000);
  }
```

## 技术要点

### SSE 响应必须立即 flush

Server-Sent Events 是一个持久化的 HTTP 连接，浏览器在收到响应头后就会触发 `onopen` 事件。如果响应头或数据没有被立即发送到客户端，浏览器会一直等待。

**关键代码**：
```typescript
// 1. 发送响应头后立即 flush
res.writeHead(200, headers);
res.flushHeaders(); // 必须立即 flush headers

// 2. 每次发送数据后也要 flush
private sendEvent(res: Response, eventType: string, data: any): void {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  
  // 立即 flush，确保数据发送到客户端
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }
}
```

**为什么需要 flush？**
- Node.js 的响应流默认是**缓冲的**
- 数据会积累在缓冲区中，不会立即发送
- SSE 需要**实时推送**，必须立即发送每条消息
- `flush()` 强制将缓冲区的数据发送到客户端

### EventSource 的三种状态

```typescript
EventSource.CONNECTING = 0  // 正在连接
EventSource.OPEN = 1        // 连接成功
EventSource.CLOSED = 2      // 连接关闭
```

**重要**：EventSource 在 CONNECTING 状态时也会触发 `onerror` 事件，这是正常的！只有当 `readyState === EventSource.CLOSED` 时才是真正失败。

### 非关键功能应该非阻塞

对于 SSE、WebSocket 等非关键功能：
- ✅ 应该：立即返回，后台建立连接
- ❌ 不应该：等待连接成功才返回
- ✅ 应该：连接失败时自动重试
- ❌ 不应该：抛出异常阻塞应用

## 测试验证

### 测试场景 1：正常连接
1. 启动后端和前端
2. 登录应用
3. 检查控制台：应该看到 `[SSE Client] ✅ onopen 触发 - 连接成功`
4. 检查 Network 标签：`/api/v1/schedules/events` 应该显示 `EventStream` 类型

### 测试场景 2：后端未启动
1. 停止后端
2. 登录应用
3. **预期结果**：
   - 应用正常加载，不阻塞
   - 控制台显示连接失败并尝试重连
   - UI 完全可用

### 测试场景 3：网络中断
1. 建立 SSE 连接后
2. 停止后端服务
3. **预期结果**：
   - EventSource 自动尝试重连
   - 应用继续正常运行
   - 重启后端后自动恢复连接

## 相关文档

- [初始化错误处理最佳实践](../systems/INITIALIZATION_ERROR_HANDLING_BEST_PRACTICES.md)
- [SSE Token 认证实现](./SSE_TOKEN_AUTH_IMPLEMENTATION.md)
- [SSE 用户级连接升级](./SSE_USER_LEVEL_CONNECTION_UPGRADE.md)

## 总结

| 修改类别 | 具体内容 | 影响 |
|---------|---------|------|
| **后端** | 添加 `res.flushHeaders()` | 确保响应头立即发送 |
| **后端** | 移除 writeHead 后的 console.log | 避免干扰数据流 |
| **前端** | connect() 改为非阻塞 | 不影响应用启动 |
| **前端** | 移除 Promise reject | 错误不阻塞应用 |
| **前端** | 添加自动重试 | 提高连接可靠性 |

**核心原则**：关键功能可以阻塞，非关键功能必须非阻塞！
