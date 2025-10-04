# 通知系统优化总结

## 概述

本次优化解决了 SSE 提醒通知系统中的以下关键问题：
1. **重复通知**：NotificationEventHandlers 和 ReminderNotificationHandler 同时处理相同事件
2. **数据格式不匹配**：sound-reminder 和 system-notification 事件数据不完整
3. **权限检测缺失**：无法检测浏览器和系统级通知权限状态
4. **缺少降级方案**：系统通知被禁用时没有备用提示方式

## 主要改进

### 1. 权限检测服务

**文件**: `apps/web/src/modules/notification/infrastructure/browser/NotificationPermissionService.ts`

**功能**:
- 检测浏览器是否支持 Notification API
- 获取当前权限状态（granted/denied/default）
- 测试系统级通知是否真正可用（有时浏览器授权但系统禁用）
- 提供用户友好的状态描述

**核心方法**:
```typescript
// 获取详细状态
const status = await permissionService.getDetailedStatus();
// 返回: { supported, permission, granted, denied, systemAvailable, needsFallback }

// 获取友好描述
const description = await permissionService.getStatusDescription();
// 返回: "通知权限已授予，但系统级通知可能被禁用，将使用应用内通知"
```

### 2. 应用内通知服务

**文件**: `apps/web/src/modules/notification/application/services/InAppNotificationService.ts`

**功能**:
- 提供不受系统设置影响的应用内弹窗通知
- 通过事件总线与 Vue 组件通信
- 支持优先级、类型分类

**使用示例**:
```typescript
const inAppService = InAppNotificationService.getInstance();
inAppService.show({
  id: 'notification-1',
  title: '任务提醒',
  message: '您有一个待办任务即将到期',
  type: 'TASK_REMINDER',
  priority: 'HIGH',
  duration: 5000, // 5秒后自动关闭
});
```

### 3. 应用内通知 UI 组件

**文件**: `apps/web/src/modules/notification/presentation/components/InAppNotification.vue`

**功能**:
- 右上角显示通知卡片
- 支持优先级视觉区分（颜色、动画）
- 点击通知可关闭或触发回调
- 自动关闭或手动关闭
- 最多同时显示 5 条通知

**样式特点**:
- `priority-LOW`: 灰色边框
- `priority-NORMAL`: 蓝色边框
- `priority-HIGH`: 橙色边框
- `priority-URGENT`: 红色边框 + 脉冲动画

### 4. 权限警告组件

**文件**: `apps/web/src/modules/notification/presentation/components/NotificationPermissionWarning.vue`

**功能**:
- 页面加载时自动检测权限状态
- 如果通知不可用，显示警告横幅
- 提供"开启通知"按钮直接请求权限
- 支持"知道了"关闭，并记住用户选择

**显示条件**:
- 浏览器不支持通知
- 用户拒绝了权限
- 浏览器授权但系统禁用

### 5. NotificationService 集成

**文件**: `apps/web/src/modules/notification/application/services/NotificationService.ts`

**改进**:
```typescript
// 智能降级：系统通知失败时自动使用应用内通知
private async showDesktopNotification(config: NotificationConfig): Promise<void> {
  const permissionStatus = await this.permissionService.getDetailedStatus();
  
  if (!permissionStatus.systemAvailable) {
    console.warn('系统通知不可用，使用应用内通知代替');
    this.inAppService.showFromConfig(config);
    return;
  }

  try {
    await this.desktopService.show(config);
  } catch (error) {
    // 失败降级到应用内通知
    this.inAppService.showFromConfig(config);
  }
}

// 新增公共方法
async checkPermissionStatus() // 检查权限状态
async getPermissionDescription() // 获取友好描述
```

### 6. 事件处理优化

**文件**: `apps/web/src/modules/notification/application/events/NotificationEventHandlers.ts`

**改进**:
- 禁用了所有提醒事件的实际处理逻辑
- 保留日志记录用于调试
- 避免与 ReminderNotificationHandler 重复处理

**变更**:
```typescript
// 之前：会创建通知
eventBus.on('ui:show-popup-reminder', async (payload) => {
  await this.handleReminderTriggered(payload);
});

// 现在：仅记录日志
eventBus.on('ui:show-popup-reminder', async (payload) => {
  console.log('收到事件（由 ReminderNotificationHandler 处理）');
  // await this.handleReminderTriggered(payload); // 已注释
});
```

### 7. ReminderNotificationHandler 增强

**文件**: `apps/web/src/modules/notification/application/handlers/ReminderNotificationHandler.ts`

**改进**:
```typescript
// 新增数据标准化方法
private normalizeReminderData(data: any): ReminderEventData | null {
  // 如果已经是完整格式
  if (data.id && data.title && data.message) {
    return data as ReminderEventData;
  }

  // 如果是系统通知格式 {title, body, icon}
  if (data.title && data.body) {
    return {
      id: `notification-${Date.now()}`,
      title: data.title,
      message: data.body,
      type: 'GENERAL_REMINDER',
      priority: 'NORMAL',
      alertMethods: ['SYSTEM_NOTIFICATION'],
      timestamp: new Date().toISOString(),
    };
  }

  // 无效数据
  return null;
}

// sound-reminder 和 system-notification 不再单独处理
// 只处理完整的 reminder-triggered 事件
```

## 使用指南

### 在应用中集成

#### 1. 添加应用内通知组件

在主布局或 App.vue 中添加：

```vue
<template>
  <div id="app">
    <!-- 其他内容 -->
    
    <!-- 应用内通知 -->
    <InAppNotification />
    
    <!-- 权限警告 -->
    <NotificationPermissionWarning />
  </div>
</template>

<script setup>
import InAppNotification from '@/modules/notification/presentation/components/InAppNotification.vue';
import NotificationPermissionWarning from '@/modules/notification/presentation/components/NotificationPermissionWarning.vue';
</script>
```

#### 2. 检查权限状态

```typescript
import { NotificationService } from '@/modules/notification/application/services/NotificationService';

const notificationService = NotificationService.getInstance();

// 检查权限
const status = await notificationService.checkPermissionStatus();
console.log('权限状态:', status);
// {
//   supported: true,
//   permission: 'granted',
//   granted: true,
//   denied: false,
//   systemAvailable: true,
//   needsFallback: false
// }

// 获取友好描述
const description = await notificationService.getPermissionDescription();
console.log(description); // "通知功能正常"
```

#### 3. 手动发送应用内通知

```typescript
import { InAppNotificationService } from '@/modules/notification/application/services/InAppNotificationService';

const inAppService = InAppNotificationService.getInstance();

inAppService.show({
  id: 'custom-notification',
  title: '自定义通知',
  message: '这是一条应用内通知，不受系统设置影响',
  type: 'GENERAL_REMINDER',
  priority: 'NORMAL',
  duration: 5000,
  onClick: () => {
    console.log('通知被点击');
    // 执行自定义操作
  },
});
```

## 测试验证

### 1. 测试权限检测

```typescript
const service = NotificationService.getInstance();

// 测试各种权限状态
await service.checkPermissionStatus();
await service.requestPermission();
await service.getPermissionDescription();
```

### 2. 测试降级机制

1. 在浏览器中拒绝通知权限
2. 创建一个提醒任务
3. 观察是否显示应用内通知而不是系统通知

### 3. 测试警告组件

1. 清除 localStorage: `localStorage.removeItem('notification-permission-warning-dismissed')`
2. 刷新页面
3. 观察是否显示权限警告横幅

## 已解决的问题

### ✅ 重复通知问题

**原因**: NotificationEventHandlers 和 ReminderNotificationHandler 都监听相同事件

**解决**: 禁用 NotificationEventHandlers 中的提醒处理逻辑，仅保留日志

**验证**: 每个提醒只创建一次通知

### ✅ 数据格式不匹配

**原因**: sound-reminder 只有 `{volume: 80}`，system-notification 只有 `{title, body}`

**解决**: 
- 在 normalizeReminderData 中兼容不同格式
- sound-reminder 和 system-notification 不再单独处理
- 只处理完整的 reminder-triggered 事件

**验证**: 不再出现"通知标题不能为空"错误

### ✅ 权限检测缺失

**原因**: 之前没有统一的权限检测机制

**解决**: 
- 新增 NotificationPermissionService
- NotificationService 集成权限检测
- 添加 NotificationPermissionWarning 组件

**验证**: 可以检测并提示用户权限状态

### ✅ 缺少降级方案

**原因**: 系统通知被禁用时没有任何提示

**解决**:
- 新增 InAppNotificationService
- 新增 InAppNotification.vue 组件
- NotificationService 自动降级

**验证**: 系统通知不可用时自动显示应用内通知

## API 参考

### NotificationPermissionService

```typescript
class NotificationPermissionService {
  // 检测是否支持
  isNotificationSupported(): boolean
  
  // 获取权限状态
  getPermissionStatus(): NotificationPermission
  
  // 检查是否已授权
  isPermissionGranted(): boolean
  
  // 检查是否被拒绝
  isPermissionDenied(): boolean
  
  // 请求权限
  async requestPermission(): Promise<NotificationPermission>
  
  // 测试系统通知是否可用
  async testSystemNotification(): Promise<boolean>
  
  // 获取详细状态
  async getDetailedStatus(): Promise<{
    supported: boolean
    permission: NotificationPermission
    granted: boolean
    denied: boolean
    systemAvailable: boolean
    needsFallback: boolean
  }>
  
  // 获取友好描述
  async getStatusDescription(): Promise<string>
}
```

### InAppNotificationService

```typescript
interface InAppNotificationData {
  id: string
  title: string
  message: string
  type: 'GENERAL_REMINDER' | 'TASK_REMINDER' | 'GOAL_REMINDER'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  duration?: number // 毫秒，0 表示不自动关闭
  onClick?: () => void
}

class InAppNotificationService {
  // 显示应用内通知
  show(data: InAppNotificationData): void
  
  // 从通知配置创建
  showFromConfig(config: {
    id: string
    title: string
    message: string
    type?: string
    priority?: string
    duration?: number
    onClick?: () => void
  }): void
}
```

### NotificationService 新增方法

```typescript
class NotificationService {
  // 检查权限状态
  async checkPermissionStatus(): Promise<PermissionStatus>
  
  // 获取权限描述
  async getPermissionDescription(): Promise<string>
  
  // 请求权限（已更新，使用统一的权限服务）
  async requestPermission(): Promise<NotificationPermission>
}
```

## 下一步优化建议

1. **优化测试数据**: 简化测试用的 schedule 对象，只保留一个
2. **增强权限提示**: 提供更详细的设置引导（如何在浏览器/系统中开启通知）
3. **通知历史**: 应用内通知也记录到历史记录
4. **通知分组**: 相同类型的通知可以合并显示
5. **自定义样式**: 允许为不同模块定制通知样式

## 相关文件

### 新增文件
- `apps/web/src/modules/notification/infrastructure/browser/NotificationPermissionService.ts`
- `apps/web/src/modules/notification/application/services/InAppNotificationService.ts`
- `apps/web/src/modules/notification/presentation/components/InAppNotification.vue`
- `apps/web/src/modules/notification/presentation/components/NotificationPermissionWarning.vue`

### 修改文件
- `apps/web/src/modules/notification/application/services/NotificationService.ts`
- `apps/web/src/modules/notification/application/handlers/ReminderNotificationHandler.ts`
- `apps/web/src/modules/notification/application/events/NotificationEventHandlers.ts`

## 总结

本次优化构建了一个完整的通知降级体系：

1. **第一优先级**: 系统桌面通知（用户体验最好）
2. **降级方案**: 应用内弹窗通知（不受系统设置影响）
3. **主动检测**: 自动检测权限并提示用户
4. **智能选择**: 根据权限状态自动选择最佳通知方式

这样即使用户禁用了系统通知，也能通过应用内通知接收到重要提醒，大大提升了系统的可用性和用户体验。
