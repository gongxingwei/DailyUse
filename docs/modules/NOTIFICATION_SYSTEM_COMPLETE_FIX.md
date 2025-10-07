# Notification 系统完整修复总结

## 🎯 修复的所有问题

### 1. ✅ SSE 401 认证错误
**问题**: 前端 SSE 连接收到 401 Unauthorized  
**原因**: Express 路由顺序错误，`/notifications/sse` 被 `/notifications` 的 authMiddleware 拦截  
**修复**: 
```typescript
// apps/api/src/app.ts
// 将 SSE 路由移到前面
api.use('/notifications/sse', notificationSSERoutes); // ✅ 先挂载
api.use('/notifications', authMiddleware, notificationRoutes); // 后挂载
```

### 2. ✅ NotificationChannel 枚举缺失
**问题**: `No allowed channels for notification type schedule_reminder`  
**原因**: NotificationChannel 枚举缺少 `DESKTOP` 和 `SOUND`  
**修复**:
```typescript
// packages/contracts/src/modules/notification/enums.ts
export enum NotificationChannel {
  IN_APP = 'in_app',
  SSE = 'sse',
  DESKTOP = 'desktop', // ✅ 新增
  SOUND = 'sound',     // ✅ 新增
  SYSTEM = 'system',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}
```

### 3. ✅ TaskTriggeredHandler 硬编码字符串
**问题**: 使用 `'DESKTOP' as NotificationChannel` 导致 Map 查找失败  
**原因**: 字符串 `'DESKTOP'` ≠ 枚举值 `NotificationChannel.DESKTOP` (`'desktop'`)  
**修复**:
```typescript
// apps/api/src/modules/notification/application/eventHandlers/TaskTriggeredHandler.ts
import { NotificationChannel } from '@dailyuse/contracts';

// ✅ 使用枚举值
return [NotificationChannel.DESKTOP]; // 值为 'desktop'

// ✅ 修复 switch-case
switch (channel) {
  case NotificationChannel.DESKTOP:
  case NotificationChannel.EMAIL:
  // ...
}
```

### 4. ✅ Notification content 为空
**问题**: `Notification content cannot be empty`  
**原因**: `reminderData.message || reminderData.content || ''` 可能为空字符串  
**修复**:
```typescript
const title = reminderData.title || '提醒';
const content = reminderData.message || reminderData.content || title; // ✅ 使用 title 作为后备
```

### 5. ✅ Notification UUID 缺失
**问题**: `Notification uuid cannot be empty`  
**原因**: CreateNotificationRequest 需要 uuid 字段  
**修复**:
```typescript
import { v4 as uuidv4 } from 'uuid';

const request: NotificationContracts.CreateNotificationRequest = {
  uuid: uuidv4(), // ✅ 生成 UUID
  accountUuid,    // ✅ 添加 accountUuid
  title,
  content,
  type: this.mapNotificationType(payload.type),
  priority: this.mapPriority(reminderData.priority),
  channels: this.mapChannels(reminderData.notificationSettings),
  // ...
};
```

### 6. ✅ TypeScript 类型错误
**问题**: `Type '{ title: any; ... }' is missing properties 'accountUuid', 'uuid'`  
**原因**: CreateNotificationRequest 定义要求这些字段  
**修复**: 创建完整的类型化请求对象（见上一条）

### 7. ✅ SSE 事件未推送
**问题**: SSE 连接成功但从未收到事件  
**原因**: TaskTriggeredHandler 使用旧的 Schedule SSE Controller，不是新的 Notification SSE  
**修复**:
```typescript
// ❌ 旧代码 - 使用 Schedule SSE Controller
await this.sseController.broadcastToAccount(accountUuid, sseData);

// ✅ 新代码 - 使用 eventBus 发送事件
const { eventBus } = await import('@dailyuse/utils');
eventBus.emit('ui:show-popup-reminder', notificationData);
eventBus.emit('ui:play-reminder-sound', { accountUuid, soundVolume: 70 });
```

### 8. ✅ SSE 缺少 flush
**问题**: 事件可能被缓冲，未立即推送  
**修复**:
```typescript
// apps/api/src/modules/notification/interface/http/routes/notificationSSERoutes.ts
sendToClient(accountUuid: string, event: string, data: any): boolean {
  // ...
  client.write(`event: ${event}\n`);
  client.write(`data: ${JSON.stringify(sseData)}\n\n`);
  
  // ✅ 立即 flush
  if (typeof (client as any).flush === 'function') {
    (client as any).flush();
  }
  
  return true;
}
```

### 9. ✅ 测试用户通知偏好配置
**问题**: 缺少 desktop 和 sound 渠道配置  
**修复**:
```typescript
// apps/api/src/__tests__/manual/update-test-user-prefs.ts
const channelPreferences = {
  in_app: { enabled: true, types: [] },
  sse: { enabled: true, types: [] },
  desktop: { enabled: true, types: [] }, // ✅ 新增
  sound: { enabled: true, types: [] },   // ✅ 新增
};
```

## 📊 事件流程图

### 正确的事件流

```
用户创建 Reminder
    ↓
Schedule 模块创建 ScheduleTask
    ↓ 定时触发
Schedule 模块发出事件: schedule.task.triggered
    ↓
TaskTriggeredHandler 监听事件
    ↓
创建 Notification (带 UUID)
    ↓
调用 sendDesktopNotification()
    ↓
发送事件到 eventBus:
  - ui:show-popup-reminder
  - ui:play-reminder-sound
    ↓
Notification SSE 监听器接收
    ↓
SSEClientManager.sendToClient()
    ↓ flush 立即推送
前端 EventSource 接收事件
    ↓
前端 eventBus 转发
    ↓
UI 显示弹窗和播放声音
```

## 🔧 关键代码片段

### TaskTriggeredHandler 完整修复

```typescript
import { v4 as uuidv4 } from 'uuid';
import { NotificationChannel } from '@dailyuse/contracts';

private async handleReminderNotification(event: TaskTriggeredEvent): Promise<void> {
  const { accountUuid, payload } = event;
  const reminderData = payload.data?.reminderData || payload.reminderData || {};

  // 准备数据
  const title = reminderData.title || '提醒';
  const content = reminderData.message || reminderData.content || title;

  // 创建符合类型的请求
  const request: NotificationContracts.CreateNotificationRequest = {
    uuid: uuidv4(),
    accountUuid,
    title,
    content,
    type: this.mapNotificationType(payload.type),
    priority: this.mapPriority(reminderData.priority),
    channels: this.mapChannels(reminderData.notificationSettings),
    icon: reminderData.icon,
    actions: reminderData.actions,
    metadata: {
      sourceType: event.sourceType || 'reminder',
      sourceId: event.sourceId,
      additionalData: {
        taskUuid: event.aggregateId,
        reminderData,
      },
    },
  };

  // 创建通知
  const notification = await this.notificationService.createNotification(accountUuid, request);

  // 发送到各渠道
  await this.sendToChannels(notification, accountUuid, reminderData);
}

private async sendDesktopNotification(
  notification: NotificationContracts.NotificationClientDTO,
  accountUuid: string,
  reminderData: any,
): Promise<void> {
  const notificationData = {
    accountUuid,
    notificationId: notification.uuid,
    title: notification.title,
    content: notification.content,
    priority: notification.priority,
    type: notification.type,
    soundVolume: reminderData.notificationSettings?.soundVolume || 70,
    popupDuration: reminderData.notificationSettings?.popupDuration || 10,
    allowSnooze: reminderData.notificationSettings?.allowSnooze !== false,
    snoozeOptions: reminderData.notificationSettings?.snoozeOptions || [5, 10, 15],
    actions: notification.actions || [],
    metadata: notification.metadata,
    timestamp: new Date().toISOString(),
  };

  // 通过 eventBus 发送事件
  const { eventBus } = await import('@dailyuse/utils');
  eventBus.emit('ui:show-popup-reminder', notificationData);
  
  if (reminderData.notificationSettings?.soundEnabled !== false) {
    eventBus.emit('ui:play-reminder-sound', {
      accountUuid,
      soundVolume: reminderData.notificationSettings?.soundVolume || 70,
    });
  }

  logger.info('✅ 桌面通知事件已发送到 eventBus', {
    notificationId: notification.uuid,
    accountUuid,
  });
}

private mapChannels(notificationSettings?: any): NotificationContracts.NotificationChannel[] {
  if (!notificationSettings || !notificationSettings.channels) {
    // 使用枚举值，不是字符串
    return [NotificationChannel.DESKTOP];
  }
  return notificationSettings.channels;
}
```

## 📝 验证清单

- [x] SSE 路由顺序正确（在 /notifications 之前）
- [x] NotificationChannel 枚举完整（包含 DESKTOP, SOUND）
- [x] TaskTriggeredHandler 使用枚举值而非硬编码字符串
- [x] CreateNotificationRequest 包含 uuid 和 accountUuid
- [x] content 有默认值（使用 title）
- [x] sendDesktopNotification 使用 eventBus 而非 sseController
- [x] SSE sendToClient 包含 flush
- [x] 测试用户通知偏好包含所有渠道
- [x] TypeScript 编译无错误
- [ ] 前端接收到 SSE 事件（待测试）
- [ ] 弹窗提醒正常显示（待测试）

## 🧪 测试步骤

1. **检查 SSE 连接**:
   - 打开浏览器开发工具
   - 查看 Network 面板，应该看到 `/api/v1/notifications/sse/events` 连接状态为 200
   - 应该收到 `connected` 和 `heartbeat` 事件

2. **等待 Reminder 触发**:
   - 每分钟应该触发一次
   - 检查 API 日志，应该看到：
     ```
     [SSE] 🎯 收到弹窗提醒事件
     [SSE] 弹窗提醒发送结果: ✅ 成功
     ```

3. **验证前端接收**:
   - 浏览器控制台应该看到：
     ```
     [SSE Client] 收到事件: notification:popup-reminder
     ```
   - UI 应该显示弹窗提醒

## 🎉 预期结果

现在整个流程应该完整工作：
- ✅ SSE 连接成功（无 401 错误）
- ✅ Notification 创建成功（有 UUID 和 content）
- ✅ 事件通过 eventBus 正确路由
- ✅ SSE 推送到前端
- ✅ 前端接收并显示提醒

---

**修复完成时间**: 2025-10-07 15:25  
**涉及文件**: 9 个  
**修复问题**: 9 个  
**类型错误**: 全部解决 ✅
