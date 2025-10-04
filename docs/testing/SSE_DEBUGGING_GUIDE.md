# SSE 调试指南

## 快速检查清单

当 SSE 连接出现问题时，按照以下步骤逐一检查：

### ✅ 1. 检查连接是否建立

**浏览器开发者工具 → Network 标签**

查找 `/api/v1/schedules/events` 请求：

- ✅ **状态码**: 应该是 `200`
- ✅ **Type**: 应该显示 `eventsource` 或 `text/event-stream`
- ✅ **状态**: 应该是 `pending`（持久连接）

**浏览器控制台**

应该看到：
```
[SSE Client] EventSource 已创建, readyState: 0
[SSE Client] ✅ onopen 触发 - 连接成功, readyState: 1
[SSE Client] 🔗 连接建立事件触发: {...}
```

**后端控制台**

应该看到：
```
[SSE] 新客户端连接: <accountUuid>
[SSE] 连接确认已发送给客户端: <accountUuid>
```

### ✅ 2. 检查是否收到数据

**浏览器开发者工具 → Network → EventStream 标签**

点击 `/api/v1/schedules/events` 请求，切换到 **EventStream** 标签（某些浏览器可能叫 **Messages** 或 **Events**）

应该能看到：
```
Event: connected
Data: {"clientId":"...","accountUuid":"...","timestamp":"..."}

Event: heartbeat
Data: {"timestamp":"..."}

Event: schedule:reminder-triggered
Data: {"type":"...","data":{...},"timestamp":"..."}
```

**如果看不到 EventStream 标签**，查看 **Response** 标签：
- 应该能看到原始的 SSE 数据
- 格式：`event: eventName\ndata: {...}\n\n`

**浏览器控制台**

每次收到事件应该看到：
```
[SSE Client] 💓 心跳: {"timestamp":"..."}
[SSE Client] 📨 通用提醒事件: {...}
```

**后端控制台**

每次发送事件应该看到：
```
[SSE] 💓 发送心跳到客户端: <clientId>
[SSE] 📢 广播事件到 1 个客户端: schedule:reminder-triggered
[SSE] ✅ 事件已发送到客户端 <clientId>: schedule:reminder-triggered
```

### ✅ 3. 检查响应头

**浏览器开发者工具 → Network → Headers 标签**

**Response Headers** 应该包含：
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

**Request Headers** 应该包含：
```
Accept: text/event-stream
Cache-Control: no-cache
```

## 常见问题诊断

### 问题 1：onopen 不触发，连接一直 pending

**症状**：
- Network 显示 `200` 状态
- 但 EventStream 标签为空
- 控制台没有 "onopen 触发" 日志

**原因**：
1. 响应头没有被 flush
2. CORS 配置错误

**解决方法**：
```typescript
// 后端确保调用了 flushHeaders
res.writeHead(200, headers);
res.flushHeaders(); // ← 必须有这行

// 检查 CORS 配置
const origin = req.headers.origin;
headers['Access-Control-Allow-Origin'] = origin; // 不能用 '*'
headers['Access-Control-Allow-Credentials'] = 'true';
```

### 问题 2：连接成功但收不到后续数据

**症状**：
- onopen 触发了
- 收到了 `connected` 事件
- 但看不到心跳或广播事件

**原因**：
- `sendEvent` 没有 flush 数据
- 数据在缓冲区中没有发送

**解决方法**：
```typescript
private sendEvent(res: Response, eventType: string, data: any): void {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  
  // ← 必须 flush
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }
}
```

### 问题 3：前端接收到数据但事件监听器没触发

**症状**：
- EventStream 标签能看到数据
- 但控制台没有 "收到事件" 的日志

**原因**：
- 事件名称不匹配
- 事件监听器没有正确注册

**检查方法**：
```typescript
// 后端发送的事件名
this.sendEvent(res, 'schedule:reminder-triggered', data);

// 前端必须用相同的名称监听
this.eventSource.addEventListener('schedule:reminder-triggered', (event) => {
  console.log('收到事件:', event.data);
});
```

### 问题 4：数据格式错误

**症状**：
- 能收到数据，但解析失败
- 控制台显示 JSON 解析错误

**原因**：
- SSE 数据格式不正确
- 缺少换行符

**正确格式**：
```
event: eventName
data: {"key":"value"}

```

注意：
- `event:` 和 `data:` 后面有一个空格
- `data:` 行后面有**两个换行符** `\n\n`

**错误示例**：
```typescript
// ❌ 错误：缺少换行符
res.write(`event: ${eventType}\n`);
res.write(`data: ${JSON.stringify(data)}\n`); // 只有一个 \n

// ✅ 正确：两个换行符
res.write(`event: ${eventType}\n`);
res.write(`data: ${JSON.stringify(data)}\n\n`); // 两个 \n
```

## 使用浏览器调试 SSE

### Chrome/Edge DevTools

1. **打开 DevTools** → Network 标签
2. **筛选器** 输入 `eventsource` 或 `events`
3. **点击请求** → 查看详情
4. **EventStream 标签** 显示实时接收的事件

### Firefox Developer Tools

1. **打开开发者工具** → 网络标签
2. **点击 SSE 请求**
3. **响应标签** → 选择 "Event Stream"
4. 实时显示接收到的事件

### 使用 curl 测试

```bash
# 测试 SSE 连接（需要有效 token）
curl -N \
  -H "Accept: text/event-stream" \
  "http://localhost:3888/api/v1/schedules/events?token=YOUR_TOKEN"
```

应该看到：
```
event: connected
data: {"clientId":"...","accountUuid":"...","timestamp":"..."}

event: heartbeat
data: {"timestamp":"..."}
```

## 日志级别说明

### 后端日志

| 日志 | 含义 | 应该出现的时机 |
|------|------|--------------|
| `[SSE] 新客户端连接` | 客户端连接 | 每次登录/刷新页面 |
| `[SSE] 连接确认已发送` | 发送 connected 事件 | 连接建立后立即 |
| `[SSE] 💓 发送心跳` | 发送心跳 | 每 30 秒 |
| `[SSE] 📢 广播事件` | 开始广播 | 每次触发调度任务 |
| `[SSE] ✅ 事件已发送` | 事件发送成功 | 每次发送后 |
| `[SSE] ❌ 发送事件失败` | 发送失败 | 连接断开时 |
| `[SSE] 客户端断开连接` | 客户端关闭 | 页面关闭/刷新 |

### 前端日志

| 日志 | 含义 | 应该出现的时机 |
|------|------|--------------|
| `[SSE Client] EventSource 已创建` | 开始连接 | 登录后 |
| `[SSE Client] ✅ onopen 触发` | 连接成功 | 连接建立后 |
| `[SSE Client] 🔗 连接建立事件触发` | 收到 connected | 连接后立即 |
| `[SSE Client] 💓 心跳` | 收到心跳 | 每 30 秒 |
| `[SSE Client] 📨 通用提醒事件` | 收到提醒 | 任务触发时 |
| `[SSE Client] ❌ onerror 触发` | 连接错误 | 网络问题 |

## 性能监控

### 检查连接数

**后端**：
```typescript
const status = sseController.getStatus();
console.log('当前连接数:', status.connectedClients);
console.log('客户端列表:', status.clients);
```

**预期结果**：
- 每个登录用户应该有一个连接
- 多标签页共享同一个连接（基于 accountUuid）

### 检查内存泄漏

如果连接数持续增长：
1. 检查是否正确清理断开的连接
2. 检查 `req.on('close')` 是否被调用
3. 检查 `setInterval` 是否被 `clearInterval`

```typescript
// 正确的清理逻辑
req.on('close', () => {
  console.log(`[SSE] 客户端断开: ${clientId}`);
  this.clients.delete(clientId); // ← 必须删除
  clearInterval(heartbeat);      // ← 必须清理定时器
});
```

## 测试场景

### 场景 1：正常连接测试

1. 启动后端和前端
2. 登录应用
3. ✅ 应该立即建立 SSE 连接
4. ✅ 30 秒后应该收到第一次心跳

### 场景 2：断线重连测试

1. 建立连接后
2. 停止后端服务
3. ✅ 前端应该显示连接错误
4. ✅ 前端应该自动重试
5. 重启后端
6. ✅ 前端应该自动重新连接

### 场景 3：事件广播测试

1. 建立连接
2. 创建一个即将触发的调度任务（如 1 分钟后）
3. 等待任务触发
4. ✅ 前端应该收到 `schedule:reminder-triggered` 事件
5. ✅ Network EventStream 标签应该显示事件数据

### 场景 4：多标签页测试

1. 打开两个标签页，同一账户登录
2. ✅ 后端应该只有**一个**连接（基于 accountUuid）
3. 关闭一个标签页
4. ✅ 另一个标签页的连接应该保持

### 场景 5：Token 过期测试

1. 建立连接
2. 等待 token 过期（默认 24 小时）
3. ✅ 前端应该重新获取 token
4. ✅ SSE 应该用新 token 重新连接

## 常用调试命令

### 查看当前连接

```typescript
// 在浏览器控制台执行
const status = await fetch('http://localhost:3888/api/v1/schedules/status').then(r => r.json());
console.table(status.clients);
```

### 手动触发事件

```typescript
// 在后端代码中临时添加
eventBus.emit('reminder-triggered', {
  scheduleTaskUuid: 'test-uuid',
  title: '测试提醒',
  message: '这是一条测试消息',
  timestamp: new Date().toISOString()
});
```

### 模拟网络延迟

在 Chrome DevTools:
1. Network 标签
2. No throttling → Slow 3G
3. 测试 SSE 在慢速网络下的表现

## 总结

SSE 调试的关键点：
1. ✅ 响应头必须 `flush`
2. ✅ 每条消息必须 `flush`
3. ✅ 事件名称必须匹配
4. ✅ 数据格式必须正确（两个换行符）
5. ✅ CORS 配置必须正确
6. ✅ 连接必须正确清理

**记住**：如果 EventStream 标签能看到数据，说明后端是正确的；如果前端收不到，检查事件监听器！
