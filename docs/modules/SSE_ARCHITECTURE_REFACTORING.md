# SSE 架构重构总结

## 🔄 架构变更

### 之前的架构（错误）

```
Schedule 模块 (/api/v1/schedules/events)
    ↓ 直接推送 SSE 事件
Web 端 SSEClient
```

**问题**:
- Schedule 模块不应该负责 SSE 推送
- 事件流向混乱
- 违反单一职责原则

### 现在的架构（正确）

```
Reminder 模块
    ↓ 创建 ReminderTemplate
    ↓ 发出事件: ReminderTemplateCreated
    
Schedule 模块
    ↓ 监听: ReminderTemplateCreated
    ↓ 创建 ScheduleTask
    ↓ 定时执行任务
    ↓ 发出事件: TaskTriggered
    
Notification 模块
    ↓ 监听: TaskTriggered
    ↓ 创建 Notification 聚合根
    ↓ 调用发送服务
    ↓ 发出事件: notification:created, ui:show-popup-reminder, etc.
    ↓ SSE 监听这些事件
    ↓ 通过 /api/v1/notifications/sse/events 推送
    
Web 端 SSEClient (/api/v1/notifications/sse/events)
    ↓ 接收 SSE 事件
    ↓ 转发到前端 eventBus
    
UI 层
    ↓ 监听前端事件
    ↓ 显示通知、播放声音等
```

## 📝 主要变更

### 1. 新增 Notification SSE 端点

**文件**: `apps/api/src/modules/notification/interface/http/routes/notificationSSERoutes.ts`

**端点**: `GET /api/v1/notifications/sse/events?token={jwt}`

**功能**:
- 管理 SSE 客户端连接
- 监听后端事件总线（eventBus）
- 推送实时通知给前端

**支持的事件**:
- `connected` - 连接建立
- `heartbeat` - 心跳保持
- `notification:created` - 通知创建
- `notification:sent` - 通知发送
- `notification:popup-reminder` - 弹窗提醒
- `notification:sound-reminder` - 声音提醒
- `notification:system-notification` - 系统通知
- `notification:reminder-triggered` - Reminder 触发
- `notification:task-executed` - 任务执行完成

### 2. SSE 客户端管理器

**类**: `SSEClientManager`

**功能**:
- 维护所有活跃的 SSE 连接（Map<accountUuid, Response>）
- 向指定用户发送事件
- 广播事件到所有用户
- 自动心跳保持连接
- 连接断开自动清理

### 3. 事件流转机制

后端事件流:
```typescript
// Schedule 模块触发任务
eventBus.emit('schedule.task.triggered', {
  accountUuid,
  task,
  reminder,
});

// TaskTriggeredHandler 处理
// 创建 Notification
// 发送通知

// 发出 UI 事件
eventBus.emit('ui:show-popup-reminder', data);
eventBus.emit('ui:play-reminder-sound', data);

// SSE 监听这些事件
eventBus.on('ui:show-popup-reminder', (data) => {
  sseClientManager.sendToClient(
    data.accountUuid,
    'notification:popup-reminder',
    data
  );
});

// 推送给前端
SSE -> 'notification:popup-reminder' event
```

### 4. Web 端更新

**文件**: `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`

**变更**:
```typescript
// 旧端点
const url = `${this.baseUrl}/api/v1/schedules/events?token=${token}`;

// 新端点
const url = `${this.baseUrl}/api/v1/notifications/sse/events?token=${token}`;
```

**事件监听**:
```typescript
// 旧事件名
schedule:popup-reminder
schedule:sound-reminder
schedule:reminder-triggered

// 新事件名
notification:popup-reminder
notification:sound-reminder
notification:reminder-triggered
```

## 🎯 架构优势

### 1. 职责清晰

- **Schedule 模块**: 只负责任务调度
- **Notification 模块**: 统一管理所有通知相关功能（包括 SSE 推送）
- **Reminder 模块**: 只负责提醒模板管理

### 2. 扩展性强

所有类型的通知都可以通过同一个 SSE 端点推送：
- Reminder 提醒
- Goal 里程碑
- Task 任务提醒
- 系统通知
- 自定义通知

### 3. 统一事件体系

所有通知事件使用统一的命名空间：
```
notification:created
notification:sent
notification:popup-reminder
notification:sound-reminder
notification:system-notification
notification:reminder-triggered
notification:task-executed
```

### 4. 用户级别控制

SSE 连接与用户账号绑定：
- 每个用户独立的 SSE 连接
- 支持向特定用户推送
- 支持全局广播

## 🔧 配置说明

### 后端路由配置

**文件**: `apps/api/src/app.ts`

```typescript
// 挂载 Notification SSE 路由（不需要认证中间件）
api.use('/notifications/sse', notificationSSERoutes);
```

**为什么不需要认证中间件？**
- EventSource 不支持自定义请求头
- Token 通过 URL 参数传递
- SSE 端点内部会验证 token

### 前端配置

**初始化**: `apps/web/src/modules/notification/initialization/sseInitialization.ts`

**时机**: 用户登录后（priority: 15）

**连接**: 自动从 AuthManager 获取 token

## 📊 测试验证

### 1. 测试 SSE 连接

```bash
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3888/api/v1/notifications/sse/events?token=YOUR_JWT_TOKEN"
```

预期输出:
```
event: connected
data: {"event":"connected","data":{"message":"SSE 连接建立成功","timestamp":"..."},"timestamp":"..."}

event: heartbeat
data: {"event":"heartbeat","data":{"timestamp":"..."},"timestamp":"..."}
```

### 2. 测试完整流程

1. 创建 Reminder (每 1 分钟)
2. Schedule 自动创建 ScheduleTask
3. 1 分钟后任务触发
4. Notification 创建通知
5. SSE 推送事件给前端
6. 前端显示弹窗和播放声音

### 3. 查看 SSE 连接状态

```bash
curl http://localhost:3888/api/v1/notifications/sse/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

响应:
```json
{
  "success": true,
  "data": {
    "totalClients": 1,
    "clients": ["9897aef0-7fad-4908-a0d1-31e9b22599c1"]
  }
}
```

## 🚨 迁移指南

### 前端代码需要更新的地方

1. **SSEClient 连接URL**: ✅ 已更新
2. **事件名称**: ✅ 已更新
3. **事件处理**: ✅ 已更新

### 后端代码需要更新的地方

1. **Schedule SSE 端点**: ⚠️ **需要废弃**
   - `/api/v1/schedules/events` 应该移除或标记为 deprecated
   
2. **事件发送**: ✅ 通过 eventBus 发送事件即可

### E2E 测试更新

**文件**: `apps/web/e2e/helpers/testHelpers.ts`

需要更新 `captureSSEEvents` 中监听的事件名称：
```typescript
// 旧
['schedule:reminder-triggered', 'schedule:popup-reminder', 'schedule:sound-reminder']

// 新
['notification:reminder-triggered', 'notification:popup-reminder', 'notification:sound-reminder']
```

## 📖 相关文档

- [Notification 模块架构](NOTIFICATION_MODULE_ARCHITECTURE.md)
- [SSE 事件快速参考](NOTIFICATION_EVENT_QUICK_REFERENCE.md)
- [E2E 测试指南](../../apps/web/E2E_TESTING_GUIDE.md)

## ✅ 检查清单

- [x] 创建 Notification SSE 路由
- [x] 实现 SSE 客户端管理器
- [x] 设置事件监听器
- [x] 更新 Web 端 SSEClient
- [x] 更新事件名称
- [ ] 废弃 Schedule SSE 端点
- [ ] 更新 E2E 测试
- [ ] 更新 API 文档

---

**重构完成时间**: 2025-10-07  
**影响范围**: Notification 模块、Schedule 模块、Web 端 SSE
