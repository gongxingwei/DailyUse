# 架构优化快速测试指南

## 🚀 快速开始

本指南帮助你快速测试刚刚实施的架构优化。

---

## ✅ 前置条件

1. **数据库**: 确保 PostgreSQL 运行且 Prisma 迁移已完成
2. **依赖**: 确保 `pnpm install` 已执行
3. **编译**: 无编译错误

---

## 📝 测试步骤

### 测试 1: Reminder → Schedule 自动集成

**目标**: 验证创建提醒模板时，调度任务自动创建

**步骤**:

1. **启动 API 服务器**
```bash
cd apps/api
pnpm dev
```

2. **登录获取 Token**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

保存返回的 `token`。

3. **创建 Reminder Template**
```bash
curl -X POST http://localhost:3000/api/v1/reminder-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "每日站会提醒",
    "message": "记得参加每日站会",
    "timeConfig": {
      "type": "CRON",
      "cronExpression": "*/2 * * * *"
    },
    "notificationSettings": {
      "channels": ["DESKTOP"],
      "soundVolume": 70,
      "popupDuration": 10
    },
    "enabled": true
  }'
```

4. **验证 ScheduleTask 自动创建**

查看服务器日志，应该看到：
```
[ReminderTemplateCreatedHandler] 处理 ReminderTemplateCreated 事件
[ReminderTemplateCreatedHandler] ✅ 调度任务创建成功
```

查询调度任务列表：
```bash
curl -X GET http://localhost:3000/api/v1/schedule-tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

应该能看到一个名为 "Reminder: 每日站会提醒" 的调度任务。

---

### 测试 2: Schedule → Notification 多通道发送

**目标**: 验证调度任务触发时，通知自动创建并发送

**步骤**:

1. **等待任务触发** (使用 `*/2 * * * *` 最多等待2分钟)

或者手动触发：
```bash
curl -X POST http://localhost:3000/api/v1/schedule-tasks/{taskId}/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **查看服务器日志**

应该看到完整的事件流：
```
[ScheduleTaskScheduler] 开始执行任务
[EventBus] Publishing event: schedule.task.triggered
[TaskTriggeredHandler] 📨 收到 TaskTriggered 事件
[TaskTriggeredHandler] 处理提醒通知
[NotificationApplicationService] Creating notification
[TaskTriggeredHandler] ✅ Notification 聚合根已创建
[TaskTriggeredHandler] 准备发送通知到多个通道
[TaskTriggeredHandler] ✅ 通道发送成功: DESKTOP
[TaskTriggeredHandler] 📊 通知发送完成
```

3. **验证 Notification 创建**

查询通知列表：
```bash
curl -X GET http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

应该能看到新创建的通知记录。

4. **验证 SSE 推送**

如果前端连接了 SSE，应该收到桌面通知。

---

### 测试 3: 重试机制

**目标**: 验证发送失败时的自动重试

**步骤**:

1. **模拟 SSE 故障**

临时修改代码（测试用）：
```typescript
// apps/api/src/modules/notification/application/eventHandlers/TaskTriggeredHandler.ts

private async sendDesktopNotification(...): Promise<void> {
  // 临时抛出错误模拟失败
  throw new Error('Simulated SSE failure');
  
  // ... 原有代码
}
```

2. **触发任务**

3. **查看日志**

应该看到重试日志：
```
[TaskTriggeredHandler] ❌ 通道发送失败 (尝试 1/3)
[TaskTriggeredHandler] ⏳ 等待 1000ms 后重试
[TaskTriggeredHandler] ❌ 通道发送失败 (尝试 2/3)
[TaskTriggeredHandler] ⏳ 等待 2000ms 后重试
[TaskTriggeredHandler] ❌ 通道发送失败 (尝试 3/3)
[TaskTriggeredHandler] 💀 保存到死信队列
```

4. **恢复代码** (删除测试代码)

---

## 🔍 调试技巧

### 查看事件总线日志

在 `EventBus.publish()` 方法中有详细日志：
```
📢 [EventBus] Publishing event: ReminderTemplateCreated (1 handlers)
📢 [EventBus] Publishing event: schedule.task.triggered (1 handlers)
```

### 查看数据库记录

```sql
-- 查看通知记录
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- 查看调度任务
SELECT * FROM schedule_tasks WHERE source_module = 'reminder';

-- 查看提醒模板
SELECT * FROM reminder_templates WHERE enabled = true;
```

### 使用 Prisma Studio

```bash
cd apps/api
npx prisma studio
```

在浏览器中查看数据。

---

## 🐛 常见问题

### Q1: 事件没有触发？

**检查**:
1. 事件处理器是否已注册？查看启动日志：
   ```
   ✅ 已注册: ReminderTemplateCreatedHandler
   ✅ 已注册: TaskTriggeredHandler
   ```

2. EventBus 是否正常？查看日志是否有 "Publishing event"

**解决**:
- 确保 `eventHandlerRegistry.ts` 在 `app.ts` 中被调用
- 检查依赖注入是否正确

### Q2: 调度任务不执行？

**检查**:
1. ScheduleTaskScheduler 是否启动？
2. 任务的 `scheduledTime` 是否已过？
3. 任务的 `enabled` 是否为 true？

**解决**:
```sql
-- 更新任务时间为立即执行
UPDATE schedule_tasks 
SET scheduled_time = NOW() - INTERVAL '1 minute'
WHERE uuid = 'your-task-uuid';
```

### Q3: SSE 推送没收到？

**检查**:
1. 前端是否连接 SSE？
2. Token 是否有效？
3. `broadcastToAll` 方法是否被调用？

**解决**:
- 使用 `test-sse-notification.html` 测试 SSE 连接
- 检查 CORS 配置

---

## 📊 预期结果

### 完整流程日志示例

```
[API 启动]
🎯 开始注册事件处理器...
✅ 已注册: ReminderTemplateCreatedHandler (Reminder → Schedule)
✅ 已注册: TaskTriggeredHandler (Schedule → Notification)
🎉 所有事件处理器注册完成

[创建 ReminderTemplate]
POST /api/v1/reminder-templates
→ ReminderApplicationService.createTemplate()
→ eventEmitter.emit('ReminderTemplateCreated')
📢 [EventBus] Publishing event: ReminderTemplateCreated (1 handlers)
→ ReminderTemplateCreatedHandler.handle()
→ ScheduleDomainService.createScheduleTask()
✅ 调度任务创建成功

[调度任务触发]
ScheduleTaskScheduler 检测到任务到期
→ executeTask()
→ eventBus.publish(TaskTriggeredEvent)
📢 [EventBus] Publishing event: schedule.task.triggered (1 handlers)
→ TaskTriggeredHandler.handle()
→ NotificationApplicationService.createNotification()
✅ Notification 聚合根已创建
→ sendToChannels()
→ sendDesktopNotification()
→ SSEController.broadcastToAll()
✅ 通道发送成功: DESKTOP
📊 通知发送完成: 1/1 成功

[前端接收]
SSE Event: notification:desktop
→ ReminderNotificationHandler
→ NotificationService.show()
→ 桌面通知显示 ✓
```

---

## ✅ 验证清单

测试完成后，确认以下内容：

- [ ] ✅ 创建 ReminderTemplate 时，ScheduleTask 自动创建
- [ ] ✅ 事件总线日志显示 "ReminderTemplateCreated" 事件发布
- [ ] ✅ 调度任务触发时，Notification 记录创建
- [ ] ✅ 事件总线日志显示 "schedule.task.triggered" 事件发布
- [ ] ✅ SSE 推送成功（查看网络面板）
- [ ] ✅ 前端显示桌面通知
- [ ] ✅ 重试机制工作（模拟失败时）
- [ ] ✅ 数据库中有完整的审计记录

---

## 🎯 下一步

测试通过后，可以：

1. **移除测试代码** (如果添加了模拟失败的代码)
2. **完善 Notification 聚合根** (多通道状态跟踪)
3. **实现死信队列持久化**
4. **编写自动化集成测试**
5. **实施优先队列调度器**

---

## 📚 相关文档

- [架构优化实施总结](./ARCHITECTURE_OPTIMIZATION_SUMMARY.md)
- [流程分析](./REMINDER_NOTIFICATION_FLOW_ANALYSIS.md)
- [SSE 提醒通知实现](../modules/SSE_REMINDER_NOTIFICATION_IMPLEMENTATION.md)

---

**祝测试顺利！** 🚀

如有问题，请参考日志进行调试，或查看相关文档。
