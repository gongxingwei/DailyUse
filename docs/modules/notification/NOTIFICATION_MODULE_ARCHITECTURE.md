# Notification 模块架构与职责划分

## 模块职责明确

### 1. Reminder 模块
**职责**: 提醒模板与实例管理
- 提供提醒模板的创建、编辑、删除
- 管理提醒实例（基于模板创建的具体提醒）
- 定义提醒规则（时间、重复模式等）
- **依赖**: Schedule 模块（创建定时任务）、Notification 模块（发送通知）

### 2. Schedule 模块
**职责**: 事件调度与定时执行
- 管理定时任务队列
- 在指定时间触发事件
- 处理重复任务
- **对外**: 发送 `reminder-triggered` 事件
- **不负责**: 通知的具体展示方式

### 3. Notification 模块
**职责**: 通知展示与用户交互
- 接收提醒触发事件
- 决定通知展示方式（桌面通知、声音、应用内通知）
- 管理通知权限
- 处理用户与通知的交互
- **监听**: Schedule 模块的 `reminder-triggered` 事件

## 事件流程

```
Reminder 模块
    ↓ (创建提醒实例)
Schedule 模块
    ↓ (定时触发)
    emit: reminder-triggered { type, sourceId, ... }
    ↓
Notification 模块
    ↓ (根据 type 决定展示方式)
展示通知（桌面/声音/应用内）
```

## 统一事件格式

### 核心原则
**一个事件，类型区分**：所有提醒触发统一使用 `reminder-triggered` 事件，通过 `sourceType` 字段区分不同类型。

### 标准事件载荷

```typescript
interface ReminderTriggeredPayload {
  // === 核心标识 ===
  reminderId: string;              // 提醒ID
  sourceType: 'task' | 'goal' | 'reminder' | 'custom';  // 类型标识
  sourceId: string;                 // 来源实体ID
  
  // === 显示内容 ===
  title: string;                    // 通知标题
  message: string;                  // 通知内容
  
  // === 通知配置 ===
  priority: NotificationPriority;   // 优先级
  methods: NotificationMethod[];    // 通知方式
  
  // === 时间信息 ===
  scheduledTime: Date;              // 预定时间
  actualTime: Date;                 // 实际触发时间
  
  // === 扩展数据 ===
  metadata?: {
    // 任务特定字段
    taskId?: string;
    taskStatus?: string;
    
    // 目标特定字段
    goalId?: string;
    goalProgress?: number;
    
    // 提醒特定字段
    allowSnooze?: boolean;
    snoozeOptions?: number[];
    
    // 音效配置
    soundVolume?: number;
    soundType?: string;
    
    // 显示配置
    popupDuration?: number;
    requireInteraction?: boolean;
    
    // 自定义操作
    customActions?: Array<{
      id: string;
      label: string;
      action: string;
    }>;
    
    // 其他元数据
    [key: string]: any;
  };
}
```

## 优化后的事件监听

### Before（多个监听器，分散处理）

```typescript
// ❌ 问题：为每种类型创建独立监听器
eventBus.on('schedule:task-reminder-triggered', handleTaskReminder);
eventBus.on('schedule:goal-reminder-triggered', handleGoalReminder);
eventBus.on('schedule:custom-reminder-triggered', handleCustomReminder);
eventBus.on('ui:show-popup-reminder', handlePopupReminder);
eventBus.on('ui:play-reminder-sound', handleSoundReminder);
```

### After（统一监听器，类型分发）

```typescript
// ✅ 统一监听 reminder-triggered 事件
eventBus.on('reminder-triggered', (payload: ReminderTriggeredPayload) => {
  // 根据 sourceType 处理不同逻辑
  switch (payload.sourceType) {
    case 'task':
      enhanceForTask(payload);
      break;
    case 'goal':
      enhanceForGoal(payload);
      break;
    case 'reminder':
      enhanceForReminder(payload);
      break;
    case 'custom':
      enhanceForCustom(payload);
      break;
  }
  
  // 统一展示逻辑
  showNotification(payload);
});
```

## 处理策略

### 1. 类型增强（Type Enhancement）

不同类型的提醒可以有默认的增强配置：

```typescript
function enhanceForTask(payload: ReminderTriggeredPayload) {
  // 任务提醒默认配置
  return {
    ...payload,
    priority: payload.priority || NotificationPriority.HIGH,
    methods: payload.methods || [
      NotificationMethod.DESKTOP,
      NotificationMethod.SOUND,
    ],
    metadata: {
      ...payload.metadata,
      icon: '/icons/task-notification.png',
      soundType: SoundType.REMINDER,
      actions: [
        { id: 'mark-done', label: '标记完成', action: 'mark-done' },
        { id: 'view-task', label: '查看任务', action: 'view-task' },
      ],
    },
  };
}

function enhanceForGoal(payload: ReminderTriggeredPayload) {
  // 目标提醒默认配置
  return {
    ...payload,
    priority: payload.priority || NotificationPriority.NORMAL,
    methods: payload.methods || [
      NotificationMethod.DESKTOP,
      NotificationMethod.SOUND,
    ],
    metadata: {
      ...payload.metadata,
      icon: '/icons/goal-notification.png',
      soundType: SoundType.ALERT,
      actions: [
        { id: 'update-progress', label: '更新进度', action: 'update-progress' },
        { id: 'view-goal', label: '查看目标', action: 'view-goal' },
      ],
    },
  };
}
```

### 2. 统一展示逻辑

```typescript
async function showNotification(payload: ReminderTriggeredPayload) {
  const config: NotificationConfig = {
    id: `reminder-${payload.reminderId}-${Date.now()}`,
    title: payload.title,
    message: payload.message,
    type: mapSourceTypeToNotificationType(payload.sourceType),
    priority: payload.priority,
    methods: payload.methods,
    timestamp: payload.actualTime,
    sourceModule: 'schedule',
    sourceId: payload.sourceId,
    sound: createSoundConfig(payload),
    data: {
      reminderId: payload.reminderId,
      sourceType: payload.sourceType,
      metadata: payload.metadata,
    },
    actions: payload.metadata?.customActions || getDefaultActions(payload.sourceType),
    desktop: {
      icon: payload.metadata?.icon || getDefaultIcon(payload.sourceType),
      requireInteraction: payload.metadata?.requireInteraction || false,
      tag: `reminder-${payload.sourceType}-${payload.sourceId}`,
    },
  };
  
  await notificationService.show(config);
}
```

## 优势总结

### 1. 简化维护
- ✅ 只需维护一个事件监听器
- ✅ 添加新类型不需要新建监听器
- ✅ 统一的事件处理逻辑

### 2. 提高可扩展性
- ✅ 新增类型只需添加 switch case
- ✅ 类型配置集中管理
- ✅ 易于测试和调试

### 3. 清晰的职责划分
- ✅ Schedule 只负责触发事件
- ✅ Notification 只负责展示
- ✅ Reminder 只负责模板管理

### 4. 统一的数据格式
- ✅ 所有提醒使用相同的载荷结构
- ✅ 减少数据转换和映射
- ✅ 降低出错概率

## 迁移指南

### 步骤 1: 更新 ReminderTriggeredPayload

确保载荷格式包含 `sourceType` 字段。

### 步骤 2: 统一事件发送

Schedule 模块统一发送 `reminder-triggered` 事件：

```typescript
// Before
eventBus.emit('schedule:task-reminder-triggered', payload);
eventBus.emit('schedule:goal-reminder-triggered', payload);

// After
eventBus.emit('reminder-triggered', {
  ...payload,
  sourceType: 'task',  // 或 'goal', 'reminder', 'custom'
});
```

### 步骤 3: 简化事件监听

Notification 模块使用统一监听器：

```typescript
// 移除
eventBus.on('schedule:task-reminder-triggered', ...);
eventBus.on('schedule:goal-reminder-triggered', ...);
eventBus.on('schedule:custom-reminder-triggered', ...);

// 替换为
eventBus.on('reminder-triggered', handleReminderTriggered);
```

### 步骤 4: 实现类型分发

在处理器中根据 `sourceType` 分发：

```typescript
function handleReminderTriggered(payload: ReminderTriggeredPayload) {
  // 类型增强
  const enhanced = enhanceByType(payload);
  
  // 统一展示
  showNotification(enhanced);
}
```

## 向后兼容

在过渡期间，可以同时支持新旧事件：

```typescript
// 统一处理函数
const handleReminder = (payload: ReminderTriggeredPayload) => {
  // 处理逻辑
};

// 新事件（推荐）
eventBus.on('reminder-triggered', handleReminder);

// 旧事件（兼容）
eventBus.on('schedule:task-reminder-triggered', (payload) => {
  handleReminder({ ...payload, sourceType: 'task' });
});

eventBus.on('schedule:goal-reminder-triggered', (payload) => {
  handleReminder({ ...payload, sourceType: 'goal' });
});
```

待所有模块迁移完成后，再移除旧事件监听器。

## 测试验证

```typescript
// 测试不同类型的提醒
const testPayloads = [
  {
    reminderId: 'test-1',
    sourceType: 'task',
    sourceId: 'task-123',
    title: '任务提醒',
    message: '任务即将到期',
    priority: NotificationPriority.HIGH,
    methods: [NotificationMethod.DESKTOP],
    scheduledTime: new Date(),
    actualTime: new Date(),
  },
  {
    reminderId: 'test-2',
    sourceType: 'goal',
    sourceId: 'goal-456',
    title: '目标检查',
    message: '每周目标检查时间',
    priority: NotificationPriority.NORMAL,
    methods: [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
    scheduledTime: new Date(),
    actualTime: new Date(),
  },
];

// 发送测试事件
testPayloads.forEach(payload => {
  eventBus.emit('reminder-triggered', payload);
});
```

## 最佳实践

1. **始终包含 sourceType**：确保每个提醒事件都有明确的类型标识
2. **使用 metadata 扩展**：类型特定的数据放在 metadata 中
3. **提供默认值**：为每种类型提供合理的默认配置
4. **日志记录**：在类型分发时记录详细日志
5. **错误处理**：对未知类型提供降级处理

## 相关文档

- [通知系统优化总结](NOTIFICATION_SYSTEM_OPTIMIZATION.md)
- [SSE 提醒通知实现指南](SSE_REMINDER_NOTIFICATION_IMPLEMENTATION.md)
- [通知系统快速开始指南](NOTIFICATION_QUICK_START.md)
