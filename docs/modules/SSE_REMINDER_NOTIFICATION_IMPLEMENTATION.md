# SSE 提醒通知功能实现

## 概述

本文档描述了如何通过 SSE（Server-Sent Events）接收调度器提醒事件，并触发系统级桌面通知和声音提醒。

## 功能特性

### 1. 三种通知方式

- **系统桌面通知**：使用浏览器原生 Notification API，显示在系统右下角
- **声音提醒**：播放不同优先级的音效
- **应用内弹窗**：自定义 UI 弹窗（暂未实现，可扩展）

### 2. 智能提醒处理

- 支持多种提醒方法组合（弹窗 + 声音 + 系统通知）
- 根据优先级自动选择音效类型
- 支持自定义弹窗持续时间
- 支持小睡功能（snooze）
- 支持自定义操作按钮

### 3. 优先级管理

| 优先级 | 音效类型 | 是否需要用户交互 | 默认行为 |
|--------|---------|----------------|---------|
| LOW | notification | 否 | 自动关闭 |
| NORMAL | reminder | 否 | 自动关闭 |
| HIGH | alert | 否 | 自动关闭 |
| URGENT | alert | **是** | 需要手动关闭 |

## 架构设计

### 数据流向

```
调度器触发
    ↓
后端 eventBus.emit('reminder-triggered', data)
    ↓
SSEController 监听并广播
    ↓
前端 EventSource 接收
    ↓
SSEClient 解析并 emit
    ↓
ReminderNotificationHandler 处理
    ↓
NotificationService 显示通知
    ↓
DesktopNotificationService + AudioNotificationService
```

### 核心组件

1. **SSEController** (后端)
   - 监听 eventBus 的提醒事件
   - 广播到所有连接的客户端
   - 位置：`apps/api/src/modules/schedule/interface/http/SSEController.ts`

2. **SSEClient** (前端)
   - 接收 SSE 事件流
   - 解析事件数据
   - 转发到前端 eventBus
   - 位置：`apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`

3. **ReminderNotificationHandler** (前端)
   - 监听提醒事件
   - 构建通知配置
   - 调用 NotificationService
   - 位置：`apps/web/src/modules/notification/application/handlers/ReminderNotificationHandler.ts`

4. **NotificationService** (前端)
   - 统一管理所有通知
   - 通知队列和优先级处理
   - 并发控制
   - 位置：`apps/web/src/modules/notification/application/services/NotificationService.ts`

5. **DesktopNotificationService** (前端)
   - 系统桌面通知实现
   - 权限管理
   - 位置：`apps/web/src/modules/notification/infrastructure/services/DesktopNotificationService.ts`

6. **AudioNotificationService** (前端)
   - 音效播放管理
   - 音量控制
   - 位置：`apps/web/src/modules/notification/infrastructure/services/AudioNotificationService.ts`

## SSE 事件格式

### reminder-triggered 事件

```json
{
  "type": "schedule:reminder-triggered",
  "data": {
    "id": "aac00d9a-f64d-4d7c-b04a-aa81b042aea5",
    "title": "每分钟提醒测试",
    "message": "这是每分钟的提醒测试！",
    "type": "GENERAL_REMINDER",
    "priority": "HIGH",
    "alertMethods": ["POPUP", "SOUND", "SYSTEM_NOTIFICATION"],
    "soundVolume": 80,
    "popupDuration": 30,
    "allowSnooze": true,
    "snoozeOptions": [1, 5, 10],
    "customActions": [],
    "timestamp": "2025-10-04T15:26:00.045Z"
  },
  "timestamp": "2025-10-04T15:26:00.046Z"
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 提醒唯一ID |
| title | string | 提醒标题 |
| message | string | 提醒内容 |
| type | string | 提醒类型：GENERAL_REMINDER, TASK_REMINDER, GOAL_REMINDER |
| priority | string | 优先级：LOW, NORMAL, HIGH, URGENT |
| alertMethods | string[] | 提醒方式：POPUP, SOUND, SYSTEM_NOTIFICATION |
| soundVolume | number | 音量 (0-100) |
| popupDuration | number | 弹窗持续时间（秒） |
| allowSnooze | boolean | 是否允许小睡 |
| snoozeOptions | number[] | 小睡选项（分钟） |
| customActions | object[] | 自定义操作 |
| timestamp | string | 触发时间 |

## 使用示例

### 1. 系统桌面通知

当收到 `alertMethods` 包含 `POPUP` 或 `SYSTEM_NOTIFICATION` 的提醒：

```typescript
// 浏览器会显示系统级通知
// Windows: 右下角弹窗
// macOS: 右上角通知中心
// Linux: 取决于桌面环境
```

**效果**：
- 标题：提醒的 title
- 内容：提醒的 message
- 图标：根据 type 显示不同图标
- 操作按钮：查看详情、小睡、关闭

### 2. 声音提醒

当收到 `alertMethods` 包含 `SOUND` 的提醒：

```typescript
// 自动播放对应优先级的音效
// HIGH/URGENT: alert.wav（警告音）
// NORMAL: reminder.wav（提醒音）
// LOW: notification.mp3（通知音）
```

### 3. 组合提醒

```json
{
  "alertMethods": ["POPUP", "SOUND", "SYSTEM_NOTIFICATION"]
}
```

会同时触发：
1. 系统桌面通知
2. 声音提醒
3. （预留）应用内弹窗

## 权限请求

### 桌面通知权限

应用会在以下时机请求权限：

1. **应用启动时**（如果有用户交互）
2. **用户登录后**
3. **第一次显示通知时**

权限状态：
- `default`：未请求，会自动请求
- `granted`：已授权，可以显示通知
- `denied`：已拒绝，无法显示桌面通知

### 手动请求权限

```typescript
import { NotificationService } from '@/modules/notification';

const service = NotificationService.getInstance();
const permission = await service.requestPermission();

if (permission === 'granted') {
  console.log('✅ 权限已授予');
} else {
  console.log('❌ 权限被拒绝');
}
```

## 配置选项

### 全局配置

```typescript
const service = NotificationService.getInstance();

service.updateConfig({
  soundEnabled: true,           // 启用声音
  desktopEnabled: true,         // 启用桌面通知
  globalVolume: 0.7,           // 全局音量 (0-1)
  maxConcurrentNotifications: 3, // 最大并发通知数
  defaultAutoClose: 5000,       // 默认自动关闭时间（毫秒）
  doNotDisturbEnabled: false,   // 勿扰模式
});
```

### 勿扰模式

```typescript
service.updateConfig({
  doNotDisturbEnabled: true,
  doNotDisturbSchedule: {
    start: '22:00',  // 晚上10点
    end: '08:00',    // 早上8点
  },
});
```

## 调试和测试

### 1. 检查通知支持

```typescript
import { DesktopNotificationService } from '@/modules/notification';

const desktop = new DesktopNotificationService();
const support = desktop.getSupportInfo();

console.log('桌面通知支持:', support);
// {
//   supported: true,
//   features: {
//     basicNotification: true,
//     persistentNotification: false,
//     actionButtons: false,
//     customIcons: true,
//     vibration: false
//   },
//   limitations: ['移动设备可能有额外的通知限制']
// }
```

### 2. 测试音效

```typescript
import { AudioNotificationService } from '@/modules/notification';
import { SoundType } from '@/modules/notification/domain/types';

const audio = new AudioNotificationService();

// 测试提醒音
await audio.testSound(SoundType.REMINDER);

// 测试警告音
await audio.testSound(SoundType.ALERT);
```

### 3. 发送测试通知

```typescript
const service = NotificationService.getInstance();

// 测试信息通知
await service.showInfo('这是一条测试消息');

// 测试成功通知
await service.showSuccess('操作成功！');

// 测试警告通知
await service.showWarning('请注意！');

// 测试错误通知
await service.showError('发生错误！');
```

### 4. 模拟 SSE 提醒

```typescript
import { eventBus } from '@dailyuse/utils';

// 模拟提醒事件
eventBus.emit('reminder-triggered', {
  id: 'test-reminder-123',
  title: '测试提醒',
  message: '这是一条测试提醒消息',
  type: 'GENERAL_REMINDER',
  priority: 'HIGH',
  alertMethods: ['POPUP', 'SOUND'],
  soundVolume: 70,
  popupDuration: 10,
  timestamp: new Date().toISOString(),
});
```

## 浏览器兼容性

### 桌面通知 API

| 浏览器 | 支持版本 | 限制 |
|--------|---------|------|
| Chrome | 22+ | ✅ 完整支持 |
| Firefox | 22+ | ✅ 完整支持 |
| Safari | 7+ | ⚠️ 需要用户交互 |
| Edge | 14+ | ✅ 完整支持 |
| Opera | 25+ | ✅ 完整支持 |

### 音频 API

| 浏览器 | 支持版本 | 限制 |
|--------|---------|------|
| Chrome | 所有版本 | ⚠️ 需要用户交互才能自动播放 |
| Firefox | 所有版本 | ⚠️ 需要用户交互才能自动播放 |
| Safari | 所有版本 | ⚠️ 严格的自动播放限制 |
| Edge | 所有版本 | ⚠️ 需要用户交互才能自动播放 |

**注意**：现代浏览器都有自动播放策略，需要用户至少有一次交互后才能自动播放音频。

## 常见问题

### Q1: 为什么看不到桌面通知？

**可能原因**：
1. 权限未授予 - 检查浏览器设置
2. 系统勿扰模式开启 - 检查操作系统设置
3. 浏览器通知被禁用 - 检查浏览器设置
4. 网站不是 HTTPS - 本地开发使用 localhost

**解决方法**：
```typescript
const permission = service.getPermission();
console.log('当前权限:', permission);

if (permission === 'denied') {
  console.log('❌ 权限已被拒绝，请在浏览器设置中允许通知');
}
```

### Q2: 为什么听不到声音？

**可能原因**：
1. 音量设置为 0
2. 浏览器自动播放被阻止
3. 音频文件加载失败
4. 声音被禁用

**解决方法**：
```typescript
// 检查音效状态
const stats = audio.getPlaybackStats();
console.log('音频状态:', stats);

// 调整音量
service.updateConfig({ globalVolume: 0.8 });

// 启用声音
service.updateConfig({ soundEnabled: true });
```

### Q3: 通知显示后立即消失？

**原因**：`autoClose` 时间设置太短

**解决方法**：
```typescript
// 调整提醒的 popupDuration
{
  "popupDuration": 30  // 30秒
}

// 或者设置为紧急优先级（不自动关闭）
{
  "priority": "URGENT"
}
```

### Q4: 通知操作按钮没有显示？

**原因**：部分浏览器不支持操作按钮（Action Buttons）

**当前支持**：
- Chrome/Edge: ✅ 支持
- Firefox: ❌ 不支持
- Safari: ❌ 不支持

## 未来扩展

### 1. 应用内弹窗

在 `alertMethods` 中添加 `IN_APP_POPUP`：
- 自定义 Vue 组件弹窗
- 更丰富的交互
- 不受浏览器限制

### 2. 电子邮件通知

在 `alertMethods` 中添加 `EMAIL`：
- 发送邮件提醒
- 离线也能收到

### 3. 移动推送

集成 Firebase Cloud Messaging：
- 移动端推送通知
- PWA 支持

### 4. 提醒历史

- 查看所有提醒记录
- 重新触发错过的提醒
- 统计分析

## 相关文档

- [SSE 连接实现](./SSE_TOKEN_AUTH_IMPLEMENTATION.md)
- [SSE 调试指南](../testing/SSE_DEBUGGING_GUIDE.md)
- [初始化错误处理](../systems/INITIALIZATION_ERROR_HANDLING_BEST_PRACTICES.md)
