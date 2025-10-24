# 通知系统快速开始指南

## 1. 在应用中添加组件

在你的主布局文件（如 `App.vue` 或 `Layout.vue`）中添加：

```vue
<template>
  <div id="app">
    <!-- 你的主要内容 -->
    <router-view />

    <!-- 添加以下两个组件 -->
    <InAppNotification />
    <NotificationPermissionWarning />
  </div>
</template>

<script setup lang="ts">
import { InAppNotification, NotificationPermissionWarning } from '@/modules/notification';
</script>
```

## 2. 使用示例

### 检查权限状态

```typescript
import { NotificationService } from '@/modules/notification';

const notificationService = NotificationService.getInstance();

// 检查权限
const status = await notificationService.checkPermissionStatus();
console.log('权限状态:', status);

// 获取友好描述
const description = await notificationService.getPermissionDescription();
console.log('状态描述:', description);
```

### 手动发送应用内通知

```typescript
import { InAppNotificationService } from '@/modules/notification';

const inAppService = InAppNotificationService.getInstance();

// 发送通知
inAppService.show({
  id: `notification-${Date.now()}`,
  title: '提醒',
  message: '这是一条测试通知',
  type: 'GENERAL_REMINDER',
  priority: 'NORMAL',
  duration: 5000, // 5秒后自动关闭
  onClick: () => {
    console.log('通知被点击');
  },
});
```

### 请求通知权限

```typescript
import { NotificationService } from '@/modules/notification';

const notificationService = NotificationService.getInstance();

// 请求权限
const permission = await notificationService.requestPermission();

if (permission === 'granted') {
  console.log('通知权限已授予');
} else {
  console.log('通知权限被拒绝');
}
```

## 3. 工作原理

系统会自动处理通知降级：

1. **优先尝试**：系统桌面通知（用户体验最好）
2. **自动降级**：如果系统通知不可用，自动显示应用内通知
3. **主动提示**：如果权限未授予，显示警告横幅引导用户开启

## 4. 测试

### 测试系统通知

```typescript
import { NotificationService } from '@/modules/notification';

const service = NotificationService.getInstance();

// 显示测试通知
await service.show({
  id: 'test-notification',
  title: '测试通知',
  message: '这是一条测试系统通知',
  type: NotificationType.REMINDER,
  priority: NotificationPriority.NORMAL,
  methods: [NotificationMethod.DESKTOP],
  autoClose: 5000,
});
```

### 测试应用内通知

```typescript
import { InAppNotificationService } from '@/modules/notification';

const service = InAppNotificationService.getInstance();

service.show({
  id: 'test-in-app',
  title: '应用内通知测试',
  message: '这是一条应用内通知，不受系统设置影响',
  type: 'GENERAL_REMINDER',
  priority: 'HIGH',
  duration: 5000,
});
```

### 测试权限警告

```typescript
// 清除已关闭标记
localStorage.removeItem('notification-permission-warning-dismissed');

// 刷新页面
location.reload();

// 应该会看到权限警告横幅
```

## 5. 常见问题

### Q: 为什么看不到系统通知？

A: 可能的原因：

1. 浏览器权限未授予 → 点击警告横幅的"开启通知"按钮
2. 系统级通知被禁用 → 会自动降级到应用内通知
3. 勿扰模式开启 → 检查通知服务配置

### Q: 如何自定义应用内通知样式？

A: 修改 `InAppNotification.vue` 的样式部分：

```vue
<style scoped>
.in-app-notification {
  /* 自定义样式 */
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
}
</style>
```

### Q: 如何禁用权限警告？

A: 在组件中设置条件：

```vue
<template>
  <NotificationPermissionWarning v-if="showWarning" />
</template>

<script setup>
import { ref } from 'vue';

const showWarning = ref(false); // 设置为 false 禁用
</script>
```

## 6. 完整示例

```vue
<template>
  <div class="app-container">
    <h1>我的应用</h1>

    <button @click="testNotifications">测试通知系统</button>
    <button @click="checkStatus">检查权限状态</button>
    <button @click="requestPerm">请求权限</button>

    <!-- 通知组件 -->
    <InAppNotification />
    <NotificationPermissionWarning />
  </div>
</template>

<script setup lang="ts">
import {
  InAppNotification,
  NotificationPermissionWarning,
  NotificationService,
  InAppNotificationService,
} from '@/modules/notification';

const notificationService = NotificationService.getInstance();
const inAppService = InAppNotificationService.getInstance();

async function testNotifications() {
  // 测试应用内通知
  inAppService.show({
    id: `test-${Date.now()}`,
    title: '测试通知',
    message: '这是一条测试通知，点击可关闭',
    type: 'GENERAL_REMINDER',
    priority: 'NORMAL',
    duration: 5000,
    onClick: () => {
      console.log('通知被点击');
    },
  });
}

async function checkStatus() {
  const status = await notificationService.checkPermissionStatus();
  const description = await notificationService.getPermissionDescription();

  console.log('权限状态:', status);
  console.log('状态描述:', description);

  alert(description);
}

async function requestPerm() {
  const result = await notificationService.requestPermission();
  console.log('权限请求结果:', result);

  if (result === 'granted') {
    alert('通知权限已授予！');
  } else {
    alert('通知权限被拒绝');
  }
}
</script>
```

## 7. 更多信息

详细文档请参考：

- [通知系统优化总结](NOTIFICATION_SYSTEM_OPTIMIZATION.md)
- [SSE 提醒通知实现指南](SSE_REMINDER_NOTIFICATION_IMPLEMENTATION.md)
