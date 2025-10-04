# SSE 提醒通知测试指南

## 快速测试步骤

### 前置条件

1. ✅ 后端服务运行中 (`pnpm --filter @dailyuse/api dev`)
2. ✅ 前端服务运行中 (`pnpm --filter @dailyuse/web dev`)
3. ✅ 已登录应用
4. ✅ SSE 连接已建立（控制台显示 "✅ onopen 触发"）

### 测试 1：手动触发提醒事件

在**后端控制台**或代码中执行：

```typescript
// apps/api/src/app.ts 或任何后端文件

import { eventBus } from '@dailyuse/utils';

// 发送测试提醒
eventBus.emit('reminder-triggered', {
  id: `test-${Date.now()}`,
  title: '🧪 测试提醒',
  message: '这是一条测试提醒消息！',
  type: 'GENERAL_REMINDER',
  priority: 'HIGH',
  alertMethods: ['POPUP', 'SOUND', 'SYSTEM_NOTIFICATION'],
  soundVolume: 80,
  popupDuration: 30,
  allowSnooze: true,
  snoozeOptions: [1, 5, 10],
  timestamp: new Date().toISOString(),
});
```

### 测试 2：使用实际调度任务

1. 在前端创建一个调度任务
2. 设置为 1 分钟后触发
3. 等待任务触发

### 测试 3：通过 SSE 直接发送

在**后端控制台**执行：

```typescript
import { sseController } from './modules/schedule/interface/http/SSEController';

// 模拟调度器事件
const testEvent = {
  id: `test-reminder-${Date.now()}`,
  title: '测试系统提醒',
  message: '这是通过 SSE 直接发送的测试消息',
  type: 'GENERAL_REMINDER',
  priority: 'NORMAL',
  alertMethods: ['POPUP', 'SOUND'],
  soundVolume: 70,
  popupDuration: 20,
  timestamp: new Date().toISOString(),
};

// 广播到所有客户端
sseController['broadcastToAll']('schedule:reminder-triggered', testEvent);
```

## 预期结果

### 1. 浏览器控制台日志

你应该看到以下日志序列：

```
[SSE Client] 📨 通用提醒事件: {...}
[ReminderNotificationHandler] 处理通用提醒: {...}
[NotificationService] 创建通知: reminder-xxx 测试提醒
[NotificationService] 处理通知: reminder-xxx
[DesktopNotification] 通知已显示: reminder-xxx
[AudioNotification] 音频播放开始: reminder-xxx
```

### 2. 系统桌面通知

**Windows**：
- 右下角任务栏弹出通知
- 显示标题和消息
- 可能有操作按钮（取决于浏览器）

**macOS**：
- 右上角通知中心弹出
- 显示应用图标、标题和消息

**Linux**：
- 取决于桌面环境（GNOME/KDE等）
- 通常在右上角或右下角

### 3. 声音播放

根据优先级播放不同音效：
- HIGH/URGENT: `alert.wav` （警告音）
- NORMAL: `reminder.wav` （提醒音）
- LOW: `notification.mp3` （通知音）

### 4. 网络请求

**DevTools → Network → EventStream**：

应该能看到：
```
event: schedule:reminder-triggered
data: {"type":"schedule:reminder-triggered","data":{...},"timestamp":"..."}
```

## 检查清单

### ✅ 权限已授予

```typescript
// 浏览器控制台执行
Notification.permission
// 应该返回: "granted"
```

如果是 `"default"` 或 `"denied"`：

```typescript
// 请求权限
const service = await import('@/modules/notification/application/services/NotificationService');
const permission = await service.NotificationService.getInstance().requestPermission();
console.log('权限状态:', permission);
```

### ✅ 音效已启用

```typescript
// 浏览器控制台执行
const service = await import('@/modules/notification/application/services/NotificationService');
const config = service.NotificationService.getInstance().getConfig();
console.log('音效启用:', config.soundEnabled);
console.log('全局音量:', config.globalVolume);
```

### ✅ SSE 连接正常

```typescript
// 浏览器控制台执行
const sseClient = await import('@/modules/notification/infrastructure/sse/SSEClient');
const status = sseClient.sseClient.getStatus();
console.log('SSE 状态:', status);
// 应该显示: { connected: true, readyState: 1, reconnectAttempts: 0 }
```

### ✅ 事件处理器已初始化

```typescript
// 浏览器控制台执行
const handler = await import('@/modules/notification/application/handlers/ReminderNotificationHandler');
// 如果没有错误，说明已加载
```

## 常见问题排查

### 问题 1：没有桌面通知

**检查步骤**：

1. 检查权限：
```typescript
console.log('权限:', Notification.permission);
```

2. 检查浏览器设置：
   - Chrome: `chrome://settings/content/notifications`
   - Edge: `edge://settings/content/notifications`
   - Firefox: `about:preferences#privacy` → 通知

3. 检查系统设置：
   - Windows: 设置 → 系统 → 通知和操作
   - macOS: 系统偏好设置 → 通知
   - Linux: 系统设置 → 通知

### 问题 2：没有声音

**检查步骤**：

1. 检查音效配置：
```typescript
const service = await import('@/modules/notification/application/services/NotificationService');
const config = service.NotificationService.getInstance().getConfig();
console.log('配置:', config);
```

2. 检查音频文件：
   - 确保 `/public/sounds/` 目录下有音频文件
   - 检查浏览器 Network 标签是否成功加载音频

3. 测试播放：
```typescript
const audio = new Audio('/sounds/reminder.wav');
audio.volume = 0.7;
await audio.play();
```

### 问题 3：收不到 SSE 事件

**检查步骤**：

1. 查看后端日志是否显示 "广播事件"
2. 查看前端 Network → EventStream 是否有数据
3. 重新建立连接：
```typescript
const sseClient = await import('@/modules/notification/infrastructure/sse/SSEClient');
await sseClient.sseClient.destroy();
await sseClient.sseClient.connect();
```

### 问题 4：事件收到但没有通知

**检查步骤**：

1. 查看控制台是否有错误
2. 检查事件格式是否正确：
```typescript
// 监听所有 eventBus 事件
import { eventBus } from '@dailyuse/utils';
eventBus.on('*', (data) => {
  console.log('EventBus 事件:', data);
});
```

3. 手动触发通知服务：
```typescript
const service = await import('@/modules/notification/application/services/NotificationService');
await service.NotificationService.getInstance().showInfo('测试通知');
```

## 调试技巧

### 1. 启用详细日志

在 `ReminderNotificationHandler.ts` 中添加更多日志：

```typescript
private async handleReminderTriggered(data: ReminderEventData): Promise<void> {
  console.log('[调试] 收到提醒事件:', JSON.stringify(data, null, 2));
  console.log('[调试] alertMethods:', data.alertMethods);
  
  // ... 原有代码
  
  console.log('[调试] 构建的通知配置:', JSON.stringify(config, null, 2));
  await this.notificationService.show(config);
  console.log('[调试] 通知已发送');
}
```

### 2. 监听通知事件

```typescript
import { eventBus } from '@dailyuse/utils';

// 监听通知创建
eventBus.on('notification:created', (data) => {
  console.log('📢 通知创建:', data);
});

// 监听通知显示
eventBus.on('notification:shown', (data) => {
  console.log('👁️ 通知显示:', data);
});

// 监听通知失败
eventBus.on('notification:failed', (data) => {
  console.error('❌ 通知失败:', data);
});
```

### 3. 性能监控

```typescript
const service = await import('@/modules/notification/application/services/NotificationService');

// 获取统计信息
const stats = service.NotificationService.getInstance().getStats();
console.table(stats);

// 获取历史记录
const history = await service.NotificationService.getInstance().getHistory();
console.log('历史记录:', history);
```

## 测试脚本

创建一个测试脚本文件 `test-notification.ts`：

```typescript
import { eventBus } from '@dailyuse/utils';

/**
 * 测试不同优先级的提醒
 */
export async function testAllPriorities() {
  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  
  for (const priority of priorities) {
    console.log(`\n🧪 测试 ${priority} 优先级...`);
    
    eventBus.emit('reminder-triggered', {
      id: `test-${priority}-${Date.now()}`,
      title: `${priority} 优先级测试`,
      message: `这是 ${priority} 优先级的测试提醒`,
      type: 'GENERAL_REMINDER',
      priority,
      alertMethods: ['POPUP', 'SOUND'],
      soundVolume: 70,
      popupDuration: 10,
      timestamp: new Date().toISOString(),
    });
    
    // 等待 3 秒
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n✅ 所有优先级测试完成');
}

/**
 * 测试不同提醒方式
 */
export async function testAllMethods() {
  const methodCombinations = [
    ['POPUP'],
    ['SOUND'],
    ['SYSTEM_NOTIFICATION'],
    ['POPUP', 'SOUND'],
    ['POPUP', 'SOUND', 'SYSTEM_NOTIFICATION'],
  ];
  
  for (const methods of methodCombinations) {
    console.log(`\n🧪 测试方式: ${methods.join(' + ')}...`);
    
    eventBus.emit('reminder-triggered', {
      id: `test-methods-${Date.now()}`,
      title: '提醒方式测试',
      message: `测试: ${methods.join(', ')}`,
      type: 'GENERAL_REMINDER',
      priority: 'NORMAL',
      alertMethods: methods,
      soundVolume: 70,
      popupDuration: 10,
      timestamp: new Date().toISOString(),
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n✅ 所有提醒方式测试完成');
}

/**
 * 压力测试：连续发送多个提醒
 */
export async function stressTest(count: number = 10) {
  console.log(`\n🔥 开始压力测试：发送 ${count} 个提醒...`);
  
  for (let i = 0; i < count; i++) {
    eventBus.emit('reminder-triggered', {
      id: `stress-test-${i}`,
      title: `压力测试 #${i + 1}`,
      message: `这是第 ${i + 1} 个测试提醒`,
      type: 'GENERAL_REMINDER',
      priority: 'NORMAL',
      alertMethods: ['POPUP', 'SOUND'],
      soundVolume: 50,
      popupDuration: 5,
      timestamp: new Date().toISOString(),
    });
  }
  
  console.log('\n✅ 压力测试完成');
}
```

**使用方法**：

```typescript
// 在浏览器控制台
const test = await import('./test-notification');

// 测试所有优先级
await test.testAllPriorities();

// 测试所有提醒方式
await test.testAllMethods();

// 压力测试
await test.stressTest(10);
```

## 成功标准

测试通过的标准：

- ✅ 系统桌面通知正常显示
- ✅ 声音提醒正常播放
- ✅ 不同优先级使用不同音效
- ✅ 通知自动关闭（非 URGENT 优先级）
- ✅ URGENT 优先级需要手动关闭
- ✅ 通知按钮可以点击（Chrome/Edge）
- ✅ 点击通知可以聚焦到应用
- ✅ SSE 连接稳定，不丢失事件
- ✅ 高并发下通知队列正常工作
- ✅ 音量控制正常
- ✅ 配置持久化正常

恭喜！如果所有测试都通过，说明 SSE 提醒通知功能已经完整实现！🎉
