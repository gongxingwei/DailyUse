# 提醒音效播放修复

**日期**: 2025-01-XX  
**类型**: Bug Fix  
**影响范围**: Web 前端 Notification 模块  
**严重程度**: 中 - 功能缺失

---

## 🐛 问题描述

### 现象
用户报告收到 SSE 提醒事件但未播放声音：

```json
{
  "event": "notification:sound-reminder",
  "data": {
    "accountUuid": "9897aef0-7fad-4908-a0d1-31e9b22599c1",
    "soundVolume": 70
  },
  "timestamp": "2025-10-07T07:38:00.021Z"
}
```

### 根本原因
**事件传递断链**：

```
✅ Backend: eventBus.emit('ui:play-reminder-sound', data)
    ↓
✅ SSE: notification:sound-reminder event
    ↓
✅ Frontend SSEClient: receives event
    ↓
✅ Frontend: eventBus.emit('ui:play-reminder-sound', data)
    ↓
❌ NO LISTENER REGISTERED
```

**技术分析**：
1. `SSEClient` 正确接收 SSE 事件 ✅
2. `SSEClient` 正确 emit `ui:play-reminder-sound` 到前端 eventBus ✅
3. **没有任何模块监听 `ui:play-reminder-sound` 事件** ❌
4. `AudioNotificationService` 已存在但未被调用 ❌

---

## ✅ 解决方案

### 1. **添加事件监听器**

**文件**: `apps/web/src/modules/notification/application/events/NotificationEventHandlers.ts`

在 `setupSystemEventListeners()` 方法中添加：

```typescript
// 🔊 监听 SSE 推送的提醒音效播放事件
eventBus.on('ui:play-reminder-sound', (data: any) => {
  logger.info('收到提醒音效播放事件', {
    accountUuid: data?.accountUuid,
    soundVolume: data?.soundVolume,
  });

  // 播放提醒音效
  const soundConfig: SoundConfig = {
    enabled: true,
    type: SoundType.REMINDER,
    volume: (data?.soundVolume ?? 70) / 100, // 转换为 0-1 范围
  };

  const notificationId = `reminder-sound-${Date.now()}`;

  this.notificationService
    .getAudioService()
    .play(soundConfig, notificationId)
    .then(() => {
      logger.info('提醒音效播放完成', { notificationId });
    })
    .catch((error: unknown) => {
      logger.error('提醒音效播放失败', {
        notificationId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
});
```

**关键实现细节**：
- 监听 `ui:play-reminder-sound` 事件
- 将后端音量值 (0-100) 转换为前端音量 (0-1)
- 使用 `SoundType.REMINDER` 类型
- 生成唯一 `notificationId`
- 调用 `AudioNotificationService.play()`
- 添加完整日志和错误处理

### 2. **暴露音频服务访问器**

**文件**: `apps/web/src/modules/notification/application/services/NotificationService.ts`

添加公开方法：

```typescript
/**
 * 获取音频服务实例
 */
getAudioService(): AudioNotificationService {
  return this.audioService;
}
```

**原因**：
- `audioService` 是 `private` 成员
- `NotificationEventHandlers` 需要访问以播放音效
- 遵循 Getter 模式（与 `getConfig()`, `getStats()` 一致）

---

## 🔄 数据流程

### 完整事件流（修复后）

```
1. Schedule 模块
   ↓
   TaskTriggeredHandler.execute()
   ├─ eventBus.emit('ui:show-popup-reminder', ...)
   └─ eventBus.emit('ui:play-reminder-sound', { accountUuid, soundVolume: 70 })

2. Notification 模块 (Backend)
   ↓
   notificationSSERoutes.ts (SSE 路由)
   ├─ eventBus.on('ui:show-popup-reminder') → sendToClient()
   └─ eventBus.on('ui:play-reminder-sound') → sendToClient()
       ↓
       SSE 传输: event=notification:sound-reminder
       data={ accountUuid, soundVolume: 70 }

3. Frontend SSEClient
   ↓
   eventSource.addEventListener('notification:sound-reminder', ...)
   ↓
   eventBus.emit('ui:play-reminder-sound', data.data)

4. NotificationEventHandlers ✨ NEW
   ↓
   eventBus.on('ui:play-reminder-sound', ...)
   ↓
   NotificationService.getAudioService().play(soundConfig, notificationId)
   ↓
   AudioNotificationService.play()
   ├─ 加载音频资源: reminderSound (from @dailyuse/assets)
   ├─ 设置音量: volume = soundVolume / 100
   └─ 播放: HTMLAudioElement.play()

5. 用户
   ↓
   🔊 听到提醒音效！
```

### 音量转换

| 来源 | 范围 | 值示例 | 转换公式 |
|------|------|--------|----------|
| Backend (SSE) | 0-100 | 70 | N/A |
| Frontend (SoundConfig) | 0-1 | 0.7 | `soundVolume / 100` |
| HTMLAudioElement | 0-1 | 0.7 | 直接使用 |

---

## 📝 技术细节

### AudioNotificationService 功能

**已有能力**（无需修改）：
- ✅ 预加载音效资源 (reminderSound, alertSound 等)
- ✅ 音量控制 (volume: 0-1)
- ✅ 音效类型管理 (SoundType enum)
- ✅ 播放状态追踪 (activeNotifications Map)
- ✅ 错误处理和日志
- ✅ Promise-based API

**使用的音效**：
- **reminderSound**: `@dailyuse/assets/audio/reminder.mp3`
- **类型**: `SoundType.REMINDER`
- **默认音量**: 0.7 (全局设置)

### 初始化时机

```typescript
// apps/web/src/modules/notification/initialization/notificationInitialization.ts
InitializationPhase.APP_STARTUP (priority: 15)
  ↓
NotificationInitializationManager.initializeNotificationModule()
  ↓
initializeEventHandlers()
  ↓
NotificationEventHandlers.initializeEventHandlers()
  ↓
setupSystemEventListeners()
  ↓
eventBus.on('ui:play-reminder-sound', ...) ✨ 监听器已注册
```

**时机保证**：
- 在 APP_STARTUP 阶段注册
- 优先级 15 (在基础设施之后，用户登录之前)
- SSE 连接建立时监听器已就绪

---

## 🧪 测试验证

### 手动测试步骤

1. **启动应用**：
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **登录测试用户**：
   - 用户名: `testuser`
   - 密码: `Test123456!`

3. **创建测试提醒**：
   - 进入 Reminder 页面
   - 创建提醒：间隔 1 分钟
   - 等待触发

4. **观察日志**：
   ```
   [SSE Client] 🔊 声音提醒事件: {"accountUuid":"...","soundVolume":70}
   [NotificationEventHandlers] 收到提醒音效播放事件 { accountUuid: ..., soundVolume: 70 }
   [AudioNotificationService] 播放音效请求: { notificationId: ..., enabled: true, soundType: 'reminder', volume: 0.7 }
   [AudioNotificationService] 使用预加载音频: reminder
   [AudioNotificationService] 开始播放...
   [AudioNotification] 音频播放开始: reminder-sound-1234567890
   [AudioNotificationService] ✅ 播放完成
   [NotificationEventHandlers] 提醒音效播放完成 { notificationId: ... }
   ```

5. **验证结果**：
   - ✅ 收到 SSE 事件
   - ✅ 触发音效播放
   - ✅ 听到提醒声音
   - ✅ 日志显示完整流程

### E2E 测试

**文件**: `apps/web/e2e/reminder.spec.ts`

```typescript
test('应该播放提醒音效', async ({ page }) => {
  // 监听音频播放事件
  const audioPlayedPromise = page.evaluate(() => {
    return new Promise((resolve) => {
      const originalPlay = HTMLAudioElement.prototype.play;
      HTMLAudioElement.prototype.play = function() {
        resolve(true);
        return originalPlay.call(this);
      };
    });
  });

  // 创建提醒...
  // 等待 SSE 事件...

  await audioPlayedPromise;
  // 验证音频已播放
});
```

---

## 🔍 调试技巧

### 检查事件监听器注册

```javascript
// 浏览器控制台
import { eventBus } from '@dailyuse/utils';

// 查看所有监听器
console.log(eventBus.listenerCount('ui:play-reminder-sound'));
// 应该输出: 1

// 查看所有事件
console.log(eventBus.eventNames());
// 应该包含: 'ui:play-reminder-sound'
```

### 手动触发测试

```javascript
// 浏览器控制台
import { eventBus } from '@dailyuse/utils';

// 手动触发音效
eventBus.emit('ui:play-reminder-sound', {
  accountUuid: 'test-uuid',
  soundVolume: 70
});
```

### 检查音频服务状态

```javascript
// 浏览器控制台
import { NotificationService } from '@/modules/notification';

const service = NotificationService.getInstance();
const audioService = service.getAudioService();

// 检查音频状态
console.log(audioService.getPlaybackStats());
// { activeSounds: 0, preloadedSounds: 6, globalVolume: 0.7, enabled: true }

// 检查音频支持
console.log(audioService.getAudioSupportInfo());
```

---

## 📊 影响分析

### 文件变更

| 文件 | 变更类型 | 行数 | 说明 |
|------|----------|------|------|
| `NotificationEventHandlers.ts` | 新增功能 | +31 | 添加 `ui:play-reminder-sound` 监听器 |
| `NotificationService.ts` | 新增方法 | +6 | 添加 `getAudioService()` 访问器 |

### 依赖关系

**新增依赖**：
- NotificationEventHandlers → AudioNotificationService (间接)
- NotificationEventHandlers → SoundType enum

**已有依赖**：
- AudioNotificationService → @dailyuse/assets/audio ✅
- SSEClient → eventBus ✅
- NotificationService → AudioNotificationService ✅

### 向后兼容性

✅ **完全兼容**：
- 仅添加新功能，未修改现有逻辑
- AudioNotificationService API 未变更
- 事件命名保持一致 (`ui:play-reminder-sound`)
- 不影响其他通知功能

---

## 🎯 相关问题

### 已解决
- ✅ #1: SSE 事件接收成功但无声音
- ✅ #2: `ui:play-reminder-sound` 事件无监听器
- ✅ #3: AudioNotificationService 未被调用

### 后续优化
- 🔜 添加用户音效偏好设置
- 🔜 支持自定义提醒音效
- 🔜 音效播放失败时显示视觉反馈
- 🔜 音效播放队列管理（防止重叠）

---

## 📚 相关文档

- [Notification 模块架构](NOTIFICATION_MODULE_ARCHITECTURE.md)
- [SSE 连接修复](./SSE_CONNECTION_FIX_SUMMARY.md)
- [Notification 元数据值对象修复](./NOTIFICATION_METADATA_VALUE_OBJECT_FIX.md)
- [音频服务源码](../../apps/web/src/modules/notification/infrastructure/services/AudioNotificationService.ts)

---

## ✅ 验收标准

- [x] `ui:play-reminder-sound` 事件监听器已注册
- [x] `NotificationService.getAudioService()` 方法可用
- [x] 收到 SSE 事件时触发音效播放
- [x] 音量正确转换 (0-100 → 0-1)
- [x] 完整日志输出（接收、播放、完成/失败）
- [x] 类型错误已修复
- [x] 无编译错误
- [x] 文档已更新

---

**修复者**: GitHub Copilot  
**审核者**: -  
**状态**: ✅ 已完成
