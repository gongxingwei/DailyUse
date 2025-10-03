# Schedule模块集成使用指南

## 概述

Schedule模块是一个基础模块，为其他模块提供统一的调度和提醒功能。它基于DDD架构设计，提供了完整的事件驱动架构和生命周期管理。

## 核心特性

1. **事件驱动架构** - 通过EventBus实现模块间解耦通信
2. **生命周期管理** - 自动管理调度任务的整个生命周期
3. **多种提醒方式** - 支持弹窗、声音、系统通知等多种提醒方式
4. **持久化恢复** - 服务器重启后自动恢复调度状态
5. **Task/Goal集成** - 与Task、Goal模块深度集成

## 快速开始

### 1. 应用启动时初始化Schedule模块

```typescript
// 在应用启动时（如 main.ts 或 app initialization）
import { getScheduleInitializationManager } from '@dailyuse/domain-core';

async function initializeApplication() {
  const scheduleManager = getScheduleInitializationManager();
  
  // 应用启动初始化
  const appInitResult = await scheduleManager.initializeOnAppStartup();
  if (!appInitResult.success) {
    console.error('Schedule模块应用启动初始化失败:', appInitResult.message);
  }
  
  // 如果是服务器重启，恢复状态
  const recoverResult = await scheduleManager.recoverAfterServerRestart();
  console.log(`恢复了 ${recoverResult.recoveredTasks} 个调度任务`);
}
```

### 2. 用户登录时初始化

```typescript
// 在用户登录成功后
import { getScheduleInitializationManager } from '@dailyuse/domain-core';

async function onUserLogin(accountUuid: string) {
  const scheduleManager = getScheduleInitializationManager();
  
  // 用户登录初始化
  const userInitResult = await scheduleManager.initializeOnUserLogin(accountUuid);
  if (userInitResult.success) {
    console.log('用户Schedule模块初始化成功');
  }
}
```

## Task模块集成

### 1. 为TaskInstance创建提醒

```typescript
// 在TaskInstance创建时
import { TaskScheduleIntegrationService } from '@dailyuse/domain-core';
import { AlertMethod, SchedulePriority } from '@dailyuse/contracts';

async function createTaskWithReminders() {
  // 1. 生成提醒配置
  const reminderConfig = TaskScheduleIntegrationService.generateReminderConfig({
    taskScheduledTime: new Date('2025-01-10 09:00:00'),
    taskPriority: SchedulePriority.HIGH,
    taskDuration: 60, // 60分钟
  });

  // 2. 创建任务实例
  const taskInstance = {
    uuid: 'task-123',
    title: '重要会议',
    scheduledTime: '2025-01-10T09:00:00Z',
    reminderConfig,
  };

  // 3. 创建任务提醒
  const result = await TaskScheduleIntegrationService.createTaskReminders({
    taskInstance,
    accountUuid: 'user-456',
  });

  console.log(`创建了 ${result.createdReminders} 个提醒`);
}
```

### 2. 更新任务时同步提醒

```typescript
// 在TaskInstance更新时
async function updateTaskWithReminders() {
  const updatedTaskInstance = {
    uuid: 'task-123',
    title: '重要会议（已延期）',
    scheduledTime: '2025-01-10T14:00:00Z', // 延期到下午
    reminderConfig: {
      enabled: true,
      alerts: [
        {
          uuid: 'alert-1',
          alertTime: '2025-01-10T13:45:00Z', // 会议前15分钟提醒
          alertMethods: [AlertMethod.POPUP, AlertMethod.SOUND],
        }
      ],
    },
  };

  // 更新任务提醒
  await TaskScheduleIntegrationService.updateTaskReminders({
    taskInstance: updatedTaskInstance,
    accountUuid: 'user-456',
    changes: ['scheduledTime', 'reminderConfig'], // 指定变更的字段
  });
}
```

### 3. 任务完成时取消提醒

```typescript
// 在TaskInstance完成时
async function completeTaskAndCancelReminders() {
  await TaskScheduleIntegrationService.completeTaskReminders({
    taskInstanceUuid: 'task-123',
    completedAt: new Date(),
    accountUuid: 'user-456',
  });
}
```

### 4. 创建快速任务提醒

```typescript
// 为现有任务创建临时提醒
async function createQuickReminder() {
  const result = await TaskScheduleIntegrationService.createQuickTaskReminder({
    taskId: 'existing-task-789',
    taskTitle: '检查邮件',
    message: '别忘了检查重要邮件',
    reminderTime: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后
    accountUuid: 'user-456',
    priority: SchedulePriority.NORMAL,
    alertMethods: [AlertMethod.POPUP],
  });

  if (result.success) {
    console.log(`快速提醒已创建: ${result.reminderId}`);
  }
}
```

## Goal模块集成

### 1. 目标创建提醒

```typescript
// 在Goal创建时，通过事件触发
import { eventBus } from '@dailyuse/utils';

function createGoalWithReminders() {
  const goal = {
    uuid: 'goal-123',
    title: '学习TypeScript',
    deadline: '2025-03-01T23:59:59Z',
    reminderSettings: {
      enabled: true,
      frequency: 'weekly',
      customReminders: [
        {
          date: '2025-02-15T09:00:00Z',
          message: '目标进度检查',
        }
      ],
    },
  };

  // 发布目标创建事件，Schedule模块会自动处理
  eventBus.emit('goal:created', {
    goal,
    accountUuid: 'user-456',
  });
}
```

## 直接使用Schedule服务

### 1. 创建通用提醒

```typescript
// 直接使用ScheduleApplicationService
import { ScheduleApplicationService } from '@dailyuse/domain-core';
import { ScheduleTaskType, SchedulePriority, AlertMethod } from '@dailyuse/contracts';

async function createGeneralReminder() {
  const scheduleService = new ScheduleApplicationService();
  
  const result = await scheduleService.createQuickReminder({
    title: '喝水提醒',
    message: '记得多喝水保持健康',
    reminderTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后
    createdBy: 'user-456',
    priority: SchedulePriority.LOW,
    alertMethods: [AlertMethod.SYSTEM_NOTIFICATION],
  });

  console.log('通用提醒创建结果:', result);
}
```

### 2. 批量创建提醒

```typescript
async function createBatchReminders() {
  const reminders = [
    {
      reminderTime: new Date('2025-01-10T09:00:00Z'),
      message: '第一次提醒',
      priority: SchedulePriority.NORMAL,
    },
    {
      reminderTime: new Date('2025-01-10T15:00:00Z'),
      message: '第二次提醒',
      priority: SchedulePriority.HIGH,
    },
  ];

  const result = await TaskScheduleIntegrationService.createBatchTaskReminders({
    taskId: 'task-456',
    taskTitle: '重要项目',
    reminders,
    accountUuid: 'user-456',
  });

  console.log(`批量创建结果: 成功${result.createdCount}个，失败${result.failedCount}个`);
}
```

## 提醒交互处理

### 1. 延后提醒

```typescript
// 用户点击"延后5分钟"时
async function snoozeReminder(reminderId: string) {
  const result = await TaskScheduleIntegrationService.snoozeTaskReminder({
    reminderId,
    delayMinutes: 5,
  });

  if (result.success) {
    console.log('提醒已延后5分钟');
  }
}
```

### 2. 确认提醒

```typescript
// 用户点击"确认"时
async function acknowledgeReminder(reminderId: string) {
  const result = await TaskScheduleIntegrationService.acknowledgeTaskReminder({
    reminderId,
  });

  if (result.success) {
    console.log('提醒已确认');
  }
}
```

## UI层集成

### 1. 监听提醒事件

```typescript
// 在UI组件中监听提醒事件
import { eventBus } from '@dailyuse/utils';

// 监听弹窗提醒事件
eventBus.on('ui:show-reminder-dialog', (data) => {
  // 显示提醒弹窗
  showReminderDialog({
    title: data.title,
    message: data.message,
    actions: data.actions,
    onAction: (action) => {
      // 用户操作回调
      eventBus.emit('reminder:user-action', {
        taskId: data.taskId,
        action,
      });
    },
  });
});

// 监听声音提醒事件
eventBus.on('ui:play-reminder-sound', (data) => {
  // 播放提醒声音
  playReminderSound(data.priority);
});
```

### 2. Vue组件示例

```vue
<!-- ReminderDialog.vue -->
<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-card>
      <v-card-title>{{ reminderData?.title }}</v-card-title>
      <v-card-text>{{ reminderData?.message }}</v-card-text>
      <v-card-actions>
        <v-btn
          v-for="action in reminderData?.actions"
          :key="action.action"
          :color="action.style"
          @click="handleAction(action.action)"
        >
          {{ action.label }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { eventBus } from '@dailyuse/utils';

const dialog = ref(false);
const reminderData = ref(null);

onMounted(() => {
  eventBus.on('ui:show-reminder-dialog', (data) => {
    reminderData.value = data;
    dialog.value = true;
  });
});

function handleAction(action: string) {
  eventBus.emit('reminder:user-action', {
    taskId: reminderData.value?.taskId,
    action,
  });
  dialog.value = false;
}
</script>
```

## 生命周期管理

### 1. 用户登出时清理

```typescript
// 用户登出时
async function onUserLogout(accountUuid: string) {
  const scheduleManager = getScheduleInitializationManager();
  await scheduleManager.cleanupOnUserLogout(accountUuid);
}
```

### 2. 应用关闭时清理

```typescript
// 应用关闭时
async function onAppShutdown() {
  const scheduleManager = getScheduleInitializationManager();
  await scheduleManager.cleanupOnAppShutdown();
}
```

## 调试和监控

### 1. 获取Schedule状态

```typescript
function getScheduleStatus() {
  const scheduleManager = getScheduleInitializationManager();
  const status = scheduleManager.getStatus();
  
  console.log('Schedule模块状态:', {
    initialized: status.initialized,
    activeTasks: status.serviceStatus.totalTasks,
    upcomingTasks: status.serviceStatus.upcomingTasks,
    activePopups: status.activePopups,
  });
}
```

### 2. 获取调试信息

```typescript
function getDebugInfo() {
  const scheduleManager = getScheduleInitializationManager();
  const debugInfo = scheduleManager.getDebugInfo();
  
  console.log('调试信息:', {
    activeTasks: debugInfo.activeTasks.length,
    persistedTasks: Object.keys(debugInfo.persistedTasks).length,
    upcomingTasks: debugInfo.upcomingTasks.length,
  });
}
```

## 最佳实践

1. **事件优先** - 优先使用事件驱动的方式进行模块集成，避免直接调用
2. **错误处理** - 始终检查返回结果的success字段，妥善处理错误情况
3. **资源清理** - 在组件卸载时注销事件监听器，避免内存泄漏
4. **用户体验** - 合理设置提醒时间和频率，避免过度打扰用户
5. **持久化** - 重要的调度任务应该考虑持久化，防止数据丢失

## 常见问题

### Q: 如何确保提醒不会重复触发？
A: Schedule模块内置了去重机制，相同taskId的提醒会自动合并或替换。

### Q: 如何处理用户关闭浏览器后的提醒？
A: 使用Service Worker或Electron的后台进程来处理浏览器关闭后的提醒。

### Q: 如何自定义提醒声音？
A: 在AlertConfig中指定soundFile路径，确保音频文件可访问。

### Q: 如何处理时区问题？
A: 所有时间都使用ISO字符串格式，在显示时根据用户时区进行转换。

## 结论

Schedule模块提供了完整的调度和提醒功能，通过事件驱动的架构实现了模块间的解耦。正确使用本模块可以为应用提供可靠的提醒功能，提升用户体验。