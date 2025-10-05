# SSE 通知测试指南

## 🎯 测试目标

验证完整的 SSE 推送 → 事件总线 → Notification 模块监听 → 自动播放声音的流程。

## 📊 完整流程图

```
┌─────────────┐    HTTP POST    ┌─────────────┐
│   前端按钮   │─────────────────▶│ 后端 API    │
│  (Web UI)   │                  │ Controller  │
└─────────────┘                  └──────┬──────┘
                                        │ eventBus.emit
                                        ▼
                                 ┌─────────────┐
                                 │ 后端 Event  │
                                 │    Bus      │
                                 └──────┬──────┘
                                        │ 监听
                                        ▼
                                 ┌─────────────┐
                                 │     SSE     │
                                 │ Controller  │
                                 └──────┬──────┘
                                        │ SSE Push
                                        ▼
                                 ┌─────────────┐
                                 │  前端 SSE   │
                                 │   Client    │
                                 └──────┬──────┘
                                        │ eventBus.emit
                                        ▼
                                 ┌─────────────┐
                                 │  前端 Event │
                                 │     Bus     │
                                 └──────┬──────┘
                                        │ 监听 'reminder-triggered'
                                        ▼
                         ┌──────────────────────────┐
                         │  Notification Module     │
                         │  ReminderNotification    │
                         │       Handler            │
                         └──────────┬───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌──────────┐    ┌──────────┐    ┌──────────┐
            │  桌面通知 │    │  播放声音 │    │  应用内  │
            │(Desktop) │    │ (Audio)  │    │ (InApp)  │
            └──────────┘    └──────────┘    └──────────┘
```

## 🔧 测试步骤

### 1. 确保 SSE 连接已建立

**前端日志（浏览器控制台）：**
```
[SSE Client] 连接到: http://localhost:3888/api/v1/schedules/events
[SSE Client] EventSource 已创建, readyState: 0
[SSE Client] ✅ onopen 触发 - 连接成功, readyState: 1
[SSE Client] 🔗 连接建立事件触发: {...}
```

**检查点：**
- ✅ SSE 客户端状态为 `readyState: 1` (OPEN)
- ✅ 收到 `connected` 事件
- ✅ 心跳事件正常

### 2. 确认 Notification 模块已初始化

**前端日志：**
```
[ReminderNotificationHandler] 初始化提醒通知处理器
[ReminderNotificationHandler] ✅ 事件监听器已设置（统一 reminder-triggered）
[NotificationService] 通知服务已初始化
```

**检查点：**
- ✅ ReminderNotificationHandler 已监听 `reminder-triggered` 事件
- ✅ NotificationService 已就绪
- ✅ AudioNotificationService 已就绪

### 3. 点击测试按钮

**触发位置：** `AssetsDemo.vue` → "触发测试提醒 (SSE)" 按钮

**前端发送日志：**
```
🧪 发送测试提醒请求...
✅ 测试提醒已通过 SSE 推送
📡 请等待 SSE 事件到达...
🔊 声音将由 Notification 模块自动播放
```

### 4. 后端处理流程

**后端日志：**
```
[DebugController] 🧪 手动触发测试提醒
[DebugController] 🔔 准备通过 SSE 推送测试提醒
[SSE] 转发通用提醒事件: {...}
[SSE] 📢 广播事件到 1 个客户端: schedule:reminder-triggered
[SSE] ✅ 事件已发送到客户端 xxx: schedule:reminder-triggered
```

**检查点：**
- ✅ DebugController 接收到请求
- ✅ eventBus 触发 `reminder-triggered` 事件
- ✅ SSEController 监听到事件并转发
- ✅ SSE 消息成功发送到客户端

### 5. 前端接收 SSE 事件

**前端 SSE 客户端日志：**
```
[SSE Client] 📨 通用提醒事件: {
  "id": "debug-reminder-1234567890",
  "title": "🧪 调试测试提醒",
  "message": "手动触发的测试提醒 - 当前时间: 14:30:25",
  "type": "GENERAL_REMINDER",
  "priority": "HIGH",
  "alertMethods": ["POPUP", "SOUND", "SYSTEM_NOTIFICATION"]
}
```

**检查点：**
- ✅ SSE Client 收到 `schedule:reminder-triggered` 事件
- ✅ 数据格式正确，包含完整的提醒信息

### 6. 事件总线转发

**前端日志：**
```
[SSE Client] 处理调度事件 reminder-triggered: {...}
[EventBus] Emit: reminder-triggered
```

**检查点：**
- ✅ SSE Client 调用 `eventBus.emit('reminder-triggered', data)`
- ✅ 事件成功发送到前端事件总线

### 7. Notification 模块处理

**前端 Notification 日志：**
```
[ReminderNotificationHandler] 📨 收到提醒事件: {
  "id": "debug-reminder-1234567890",
  "sourceType": "GENERAL_REMINDER",
  "title": "🧪 调试测试提醒"
}
[ReminderNotificationHandler] 🔔 准备显示通知，方式: ["desktop", "sound"]
[NotificationService] 显示通知: {
  "id": "debug-reminder-1234567890",
  "type": "reminder",
  "methods": ["desktop", "sound"]
}
[AudioNotificationService] 播放声音: alert (音量: 0.8)
```

**检查点：**
- ✅ ReminderNotificationHandler 接收到 `reminder-triggered` 事件
- ✅ 数据标准化成功
- ✅ 转换为 NotificationConfig
- ✅ 调用 NotificationService.show()
- ✅ **播放声音** 🔊

### 8. 最终效果

- 🔊 **听到提醒声音**（alert.mp3）
- 🖥️ **看到桌面通知**（如果权限已授予）
- 📱 **应用内通知**（可选）

## ❌ 常见问题排查

### 问题 1：没有声音

**可能原因：**
1. SSE 连接未建立
2. Notification 模块未初始化
3. 音频服务被禁用或静音
4. 浏览器阻止自动播放音频

**检查方法：**
```javascript
// 在控制台执行
import { audioService } from '@/services/AudioService';

// 检查音频服务状态
console.log('音频启用:', audioService.isEnabled());
console.log('音频静音:', audioService.isMuted());
console.log('音量:', audioService.getVolume());

// 手动播放测试
audioService.playAlert();
```

### 问题 2：SSE 未收到事件

**可能原因：**
1. SSE 连接已断开
2. 后端未正确推送
3. token 过期

**检查方法：**
```javascript
// 在控制台执行
import { sseClient } from '@/modules/notification/infrastructure/sse/SSEClient';

console.log('SSE 状态:', sseClient.getStatus());
console.log('是否连接:', sseClient.isConnected());
```

### 问题 3：Notification 模块未处理

**可能原因：**
1. ReminderNotificationHandler 未初始化
2. 事件监听器未设置
3. 数据格式不匹配

**检查方法：**
```javascript
// 在控制台手动触发事件
import { eventBus } from '@dailyuse/utils';

eventBus.emit('reminder-triggered', {
  id: 'test-123',
  title: '手动测试',
  message: '这是一个手动触发的测试',
  type: 'GENERAL_REMINDER',
  priority: 'HIGH',
  alertMethods: ['SOUND'],
  timestamp: new Date().toISOString()
});
```

## 🎯 成功标准

测试成功的标志：

1. ✅ 点击按钮后，控制台显示完整的日志链路
2. ✅ 听到提醒声音（约 80% 音量的 alert.mp3）
3. ✅ 看到桌面通知（如果已授权）
4. ✅ 没有任何错误日志

## 📝 修复记录

### 修复前的问题

**原代码（错误）：**
```typescript
// ❌ 直接在前端播放声音，绕过了 SSE 事件流
if (data.success) {
  console.log('✅ 测试提醒已触发');
  audioService.playSuccess(); // 错误！
}
```

**问题：**
- 前端直接播放声音，没有测试 SSE 推送流程
- 无法验证 Notification 模块是否正常工作
- AI 定时提醒也无声音，因为 Notification 模块实际未接收到事件

### 修复后的流程

**后端（DebugController）：**
```typescript
// ✅ 通过 eventBus 触发，由 SSEController 监听并推送
eventBus.emit('reminder-triggered', reminderData);
```

**前端（AssetsDemo.vue）：**
```typescript
// ✅ 只记录日志，等待 SSE 事件和 Notification 模块处理
if (data.success) {
  console.log('✅ 测试提醒已通过 SSE 推送');
  console.log('📡 请等待 SSE 事件到达...');
  console.log('🔊 声音将由 Notification 模块自动播放');
  // ❌ 不要在这里播放声音！
}
```

**SSE 流程：**
```
后端 eventBus → SSEController → SSE 推送 → 
前端 SSE Client → 前端 eventBus → 
ReminderNotificationHandler → NotificationService → 
AudioNotificationService → 🔊 播放声音
```

## 🔗 相关文档

- [SSE 实现指南](../systems/SSE_IMPLEMENTATION_GUIDE.md)
- [Notification 模块架构](../modules/NOTIFICATION_MODULE_ARCHITECTURE.md)
- [Notification 快速开始](../modules/NOTIFICATION_QUICK_START.md)
- [事件系统文档](../systems/EVENT_BUS_GUIDE.md)

## 📞 联系方式

如果测试仍然失败，请：
1. 收集完整的控制台日志
2. 检查 SSE 连接状态
3. 验证 token 是否有效
4. 查看后端日志确认事件推送
