# Notification 事件系统快速参考

## 🎯 核心概念

**一个事件，类型区分**：所有提醒使用统一的 `reminder-triggered` 事件，通过 `sourceType` 字段区分类型。

## 📋 标准事件格式

```typescript
eventBus.emit('reminder-triggered', {
  // 必需字段
  reminderId: string,           // 提醒ID
  sourceType: string,           // 'task' | 'goal' | 'reminder' | 'custom'
  sourceId: string,             // 来源实体ID
  title: string,                // 通知标题
  message: string,              // 通知内容
  priority: NotificationPriority,
  methods: NotificationMethod[],
  scheduledTime: Date,
  actualTime: Date,
  
  // 可选字段
  metadata?: {
    // 任意扩展数据
  }
});
```

## 🔄 模块职责

| 模块 | 职责 | 不负责 |
|------|------|--------|
| **Reminder** | 提醒模板管理 | 定时执行、通知展示 |
| **Schedule** | 定时任务队列、触发事件 | 通知展示方式 |
| **Notification** | 接收事件、展示通知 | 提醒规则、定时逻辑 |

## 📨 事件流程

```
1. Reminder 创建提醒实例
         ↓
2. Schedule 到时间触发
         ↓
   emit('reminder-triggered', { sourceType: 'task', ... })
         ↓
3. Notification 接收并处理
         ↓
4. 展示通知（桌面/声音/应用内）
```

## 💻 代码示例

### Schedule 模块发送事件

```typescript
// ✅ 正确方式
function triggerTaskReminder(task, reminder) {
  eventBus.emit('reminder-triggered', {
    reminderId: reminder.id,
    sourceType: 'task',          // 类型标识
    sourceId: task.id,
    title: `任务提醒：${task.title}`,
    message: task.description,
    priority: NotificationPriority.HIGH,
    methods: [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
    scheduledTime: reminder.scheduledTime,
    actualTime: new Date(),
    metadata: {
      taskId: task.id,
      taskStatus: task.status,
    },
  });
}

// ❌ 错误方式（已废弃）
eventBus.emit('schedule:task-reminder-triggered', ...);
eventBus.emit('ui:show-popup-reminder', ...);
```

### Notification 模块监听事件

```typescript
// ✅ 正确方式
eventBus.on('reminder-triggered', async (payload) => {
  console.log('收到提醒:', payload.sourceType);
  
  // 根据类型增强配置（可选）
  const enhanced = enhanceByType(payload);
  
  // 显示通知
  await notificationService.show(enhanced);
});

// ❌ 错误方式（已废弃）
eventBus.on('schedule:task-reminder-triggered', handleTask);
eventBus.on('schedule:goal-reminder-triggered', handleGoal);
```

## 🎨 类型配置

### 为不同类型提供默认配置

```typescript
function enhanceBySourceType(payload) {
  const defaults = {
    task: {
      priority: NotificationPriority.HIGH,
      methods: [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
      icon: '/icons/task.png',
      soundType: SoundType.REMINDER,
    },
    goal: {
      priority: NotificationPriority.NORMAL,
      methods: [NotificationMethod.DESKTOP],
      icon: '/icons/goal.png',
      soundType: SoundType.ALERT,
    },
    reminder: {
      priority: NotificationPriority.NORMAL,
      methods: [NotificationMethod.DESKTOP],
      icon: '/icons/reminder.png',
      soundType: SoundType.NOTIFICATION,
    },
    custom: {
      priority: NotificationPriority.NORMAL,
      methods: [NotificationMethod.DESKTOP],
      icon: '/icons/default.png',
      soundType: SoundType.DEFAULT,
    },
  };

  return {
    ...defaults[payload.sourceType] || defaults.custom,
    ...payload,  // 允许覆盖默认值
  };
}
```

## 🔍 调试技巧

### 查看所有提醒事件

```typescript
// 开发环境下添加日志
eventBus.on('reminder-triggered', (payload) => {
  console.log('📨 Reminder Event:', {
    id: payload.reminderId,
    type: payload.sourceType,
    title: payload.title,
    priority: payload.priority,
    methods: payload.methods,
  });
});
```

### 验证事件格式

```typescript
function validateReminderPayload(payload) {
  const required = [
    'reminderId', 'sourceType', 'sourceId',
    'title', 'message', 'priority', 'methods',
    'scheduledTime', 'actualTime'
  ];
  
  const missing = required.filter(key => !payload[key]);
  
  if (missing.length > 0) {
    console.warn('缺少必需字段:', missing);
  }
  
  return missing.length === 0;
}
```

## 🧪 测试示例

```typescript
describe('提醒通知系统', () => {
  it('应该正确处理任务提醒', async () => {
    // 准备测试数据
    const payload = {
      reminderId: 'test-1',
      sourceType: 'task',
      sourceId: 'task-123',
      title: '任务提醒',
      message: '任务即将到期',
      priority: NotificationPriority.HIGH,
      methods: [NotificationMethod.DESKTOP],
      scheduledTime: new Date(),
      actualTime: new Date(),
    };

    // 发送事件
    eventBus.emit('reminder-triggered', payload);
    
    // 验证
    await waitFor(() => {
      expect(notificationService.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '任务提醒',
          type: NotificationType.TASK,
        })
      );
    });
  });
});
```

## 🚀 新增提醒类型

只需 2 步：

### 1. 在 enhanceBySourceType 中添加配置

```typescript
function enhanceBySourceType(payload) {
  const defaults = {
    // ... 现有类型 ...
    
    // 新增类型
    meeting: {
      priority: NotificationPriority.URGENT,
      methods: [
        NotificationMethod.DESKTOP,
        NotificationMethod.SOUND,
        NotificationMethod.VIBRATION,
      ],
      icon: '/icons/meeting.png',
      soundType: SoundType.ALERT,
    },
  };
  
  // ...
}
```

### 2. Schedule 模块发送时使用新类型

```typescript
eventBus.emit('reminder-triggered', {
  sourceType: 'meeting',  // 新类型
  // ... 其他字段 ...
});
```

**就是这么简单！** 无需修改事件监听器或添加新的处理方法。

## 📚 相关资源

- [模块架构详细文档](NOTIFICATION_MODULE_ARCHITECTURE.md)
- [重构总结](NOTIFICATION_REFACTORING_SUMMARY.md)
- [通知系统优化](NOTIFICATION_SYSTEM_OPTIMIZATION.md)
- [快速开始指南](NOTIFICATION_QUICK_START.md)

## ⚠️ 常见错误

### 错误 1: 缺少 sourceType

```typescript
// ❌ 错误
eventBus.emit('reminder-triggered', {
  reminderId: '123',
  title: '提醒',
  // 缺少 sourceType
});

// ✅ 正确
eventBus.emit('reminder-triggered', {
  reminderId: '123',
  sourceType: 'task',  // 必需
  title: '提醒',
});
```

### 错误 2: 使用旧事件名

```typescript
// ❌ 已废弃
eventBus.emit('schedule:task-reminder-triggered', ...);
eventBus.emit('ui:show-popup-reminder', ...);

// ✅ 使用统一事件
eventBus.emit('reminder-triggered', {
  sourceType: 'task',  // 通过这里区分类型
  ...
});
```

### 错误 3: 多个监听器处理同一事件

```typescript
// ❌ 错误：重复监听会导致重复通知
eventBus.on('reminder-triggered', handleInA);
eventBus.on('reminder-triggered', handleInB);

// ✅ 正确：只在一个地方监听
// ReminderNotificationHandler 中统一处理
```

## 💡 最佳实践

1. ✅ **始终包含 sourceType**：这是区分类型的关键字段
2. ✅ **使用 metadata 扩展**：类型特定数据放在 metadata 中
3. ✅ **提供合理默认值**：为每种类型提供默认配置
4. ✅ **记录详细日志**：方便调试和追踪
5. ✅ **错误处理**：确保一个提醒失败不影响其他提醒

---

**记住**：一个事件，类型区分，简单明了！🎉
