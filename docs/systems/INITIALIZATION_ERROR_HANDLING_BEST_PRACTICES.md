# 初始化错误处理最佳实践

## 问题背景

在应用初始化过程中，如果某个模块的初始化失败（如 SSE 连接失败、数据库连接失败等），可能会导致整个应用阻塞、白屏或黑屏，严重影响用户体验。

**之前的问题**：

- SSE 连接失败时，`connect()` 方法会 `reject` Promise
- InitializationManager 等待这个 Promise 完成
- 整个应用初始化被阻塞，页面无法加载

## 核心原则

### 1. **关键路径 vs 非关键路径**

**关键路径（Critical Path）**：应用启动必须完成的初始化

- 加载配置文件
- 初始化路由
- 加载核心 UI 组件
- 用户认证状态检查

**非关键路径（Non-Critical Path）**：可以在后台异步完成的初始化

- SSE 连接
- WebSocket 连接
- 后台数据同步
- 分析统计初始化
- 通知权限请求

### 2. **失败隔离原则**

每个模块的失败不应该影响其他模块，更不应该影响应用的核心功能。

### 3. **渐进式增强原则**

应用应该先提供基础功能，然后逐步启用高级功能。

## 最佳实践

### 实践 1：异步初始化 + 立即返回

对于非关键功能，初始化方法应该立即返回，实际工作在后台进行。

**❌ 错误示例**（会阻塞应用）：

```typescript
async connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      resolve(); // 等待连接成功才 resolve
    };

    this.eventSource.onerror = (error) => {
      reject(error); // 连接失败会 reject，阻塞整个应用
    };
  });
}
```

**✅ 正确示例**（不阻塞应用）：

```typescript
async connect(): Promise<void> {
  // 立即返回，不等待实际连接完成
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
    // 连接成功，更新状态
    this.isConnecting = false;
  };

  this.eventSource.onerror = (error) => {
    // 连接失败，自动重试，不抛出错误
    console.error('连接失败，将自动重试');
    this.attemptReconnect();
  };
}
```

### 实践 2：自动重试机制

对于网络连接类的初始化，应该实现指数退避的自动重试机制。

```typescript
private attemptReconnect(): void {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('[SSE] 达到最大重连次数，停止重连');
    return;
  }

  this.reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

  console.log(`[SSE] ${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连`);

  setTimeout(() => {
    this.connectInBackground();
  }, delay);
}
```

### 实践 3：状态追踪

提供状态查询接口，让应用的其他部分知道模块是否已就绪。

```typescript
class SSEClient {
  getStatus() {
    return {
      connected: this.eventSource?.readyState === EventSource.OPEN,
      readyState: this.eventSource?.readyState ?? null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  isReady(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
```

### 实践 4：优雅降级

应用应该能在某些功能不可用时继续运行。

```typescript
// UI 组件检查功能是否可用
const sseStatus = sseClient.getStatus();

if (!sseStatus.connected) {
  // 显示降级 UI：轮询代替实时推送
  this.startPolling();
} else {
  // 使用实时推送
  this.setupRealtimeUpdates();
}
```

### 实践 5：错误边界

在 Vue/React 等框架中，使用错误边界捕获组件级别的错误。

**Vue 3 示例**：

```typescript
app.config.errorHandler = (err, instance, info) => {
  console.error('组件错误:', err);
  console.error('错误信息:', info);

  // 上报错误，但不阻塞应用
  reportError(err);

  // 可以显示友好的错误提示
  showErrorToast('某些功能暂时不可用，我们正在修复中');
};
```

### 实践 6：超时保护

即使是关键路径的初始化，也应该有超时保护。

```typescript
async initializeApp() {
  const timeout = 5000; // 5秒超时

  try {
    await Promise.race([
      this.criticalInitialization(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('初始化超时')), timeout)
      )
    ]);
  } catch (error) {
    console.error('关键初始化失败:', error);
    // 加载降级 UI 或重试
    this.loadFallbackUI();
  }
}
```

## InitializationManager 集成

在我们的 InitializationManager 中，应该明确区分任务类型：

```typescript
export enum TaskPriority {
  CRITICAL = 0, // 必须成功，失败则应用无法使用
  IMPORTANT = 5, // 重要但不致命，失败后降级使用
  OPTIONAL = 10, // 可选功能，失败后静默重试
}

interface InitializationTask {
  id: string;
  phase: InitializationPhase;
  priority: TaskPriority;
  initialize: (context: InitializationContext) => Promise<void>;
  onError?: 'fail' | 'retry' | 'ignore'; // 错误处理策略
}

// 注册任务时指定策略
register({
  id: 'sse-connection',
  phase: InitializationPhase.USER_LOGIN,
  priority: TaskPriority.OPTIONAL,
  initialize: async (context) => {
    await sseClient.connect(); // 内部已经是非阻塞的
  },
  onError: 'ignore', // SSE 失败不影响应用
});

register({
  id: 'user-data',
  phase: InitializationPhase.USER_LOGIN,
  priority: TaskPriority.CRITICAL,
  initialize: async (context) => {
    await loadUserData(context.accountUuid);
  },
  onError: 'fail', // 用户数据加载失败必须处理
});
```

## SSE 特定问题

### 问题 1：响应为空

**原因**：

- `res.writeHead()` 后没有立即 flush headers
- 在发送数据前有其他操作（如 `console.log`）

**解决方案**：

```typescript
// ✅ 正确做法
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
});

// 立即 flush headers
res.flushHeaders();

// 发送数据
this.sendEvent(res, 'connected', { ... });
```

### 问题 2：EventSource.onopen 不触发

**原因**：

- CORS 头部配置错误
- 数据未正确 flush 到客户端
- EventSource 在 CONNECTING 状态时触发了 error

**解决方案**：

```typescript
// 后端：正确的 CORS 配置
const origin = req.headers.origin || 'http://localhost:5173';
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Credentials': 'true',
  // ...
});

// 前端：正确处理 error 事件
this.eventSource.onerror = (error) => {
  // EventSource 在连接过程中会触发 error，这是正常的
  if (this.eventSource?.readyState === EventSource.CONNECTING) {
    // 正在连接，等待...
    return;
  }

  if (this.eventSource?.readyState === EventSource.CLOSED) {
    // 真正失败了，重试
    this.attemptReconnect();
  }
};
```

## 监控和调试

### 1. 添加详细日志

```typescript
console.log('[SSE Client] EventSource 已创建, readyState:', this.eventSource.readyState);
console.log('[SSE Client] readyState 值: CONNECTING=0, OPEN=1, CLOSED=2');
```

### 2. 状态仪表板

在开发环境中，提供一个状态仪表板显示各个模块的初始化状态：

```typescript
const initStatus = {
  sse: sseClient.getStatus(),
  database: dbClient.getStatus(),
  auth: authManager.getStatus(),
};

console.table(initStatus);
```

### 3. 性能监控

```typescript
const startTime = performance.now();

await initializationManager.run(InitializationPhase.APP_STARTUP);

const duration = performance.now() - startTime;
console.log(`APP_STARTUP 阶段耗时: ${duration}ms`);
```

## 总结

| 原则         | 说明                         | 示例                       |
| ------------ | ---------------------------- | -------------------------- |
| **立即返回** | 非关键功能不阻塞主流程       | SSE 连接在后台进行         |
| **自动重试** | 网络错误自动重试，不抛出异常 | 指数退避重连               |
| **状态追踪** | 提供状态查询接口             | `getStatus()`, `isReady()` |
| **优雅降级** | 功能不可用时提供替代方案     | 轮询代替实时推送           |
| **错误边界** | 捕获并隔离错误               | Vue errorHandler           |
| **超时保护** | 防止无限等待                 | Promise.race()             |

**记住**：一个好的应用应该像坦克一样坚固，即使某些部件损坏，核心功能依然可用！
