# Notification 聚合根架构增强总结

**日期**: 2025-01-10  
**作者**: DailyUse Team  
**状态**: ✅ 完成

---

## 📋 概述

本次增强将 **Notification** 从简单的实体升级为完整的 **DDD 聚合根**，支持：
- ✅ 多通道发送状态跟踪（Desktop/Email/SMS/In-App）
- ✅ 领域事件发布（10+ 种事件类型）
- ✅ 聚合根生命周期管理
- ✅ 完整的业务不变量保护

---

## 🎯 优化目标

### 问题 1: 缺少领域事件
**之前**: Notification 没有发布任何领域事件，状态变更无法被其他模块感知

**现在**: 
- 每个重要操作都发布对应的领域事件
- 支持事件驱动的审计、统计、通知

### 问题 2: 单通道状态管理不足
**之前**: 只有聚合级别的状态（PENDING/SENT/READ），无法跟踪各通道的发送情况

**现在**:
- 每个通道有独立的 `DeliveryReceipt`
- 支持部分成功（某些通道成功，某些失败）
- 提供 `markChannelSent()` 和 `markChannelFailed()` 方法

### 问题 3: 未继承 AggregateRoot
**之前**: Notification 是普通类，无法利用 DDD 基础设施

**现在**:
- 继承自 `AggregateRoot`
- 自动管理领域事件列表
- 支持事件发布/清除机制

---

## 🏗️ 架构变更

### 1. 新增领域事件 (10 种)

| 事件名称 | 触发时机 | 用途 |
|---------|---------|------|
| `NotificationCreatedEvent` | 创建通知时 | 审计日志、统计分析 |
| `NotificationSendingEvent` | 开始发送时 | 监控发送流程 |
| `NotificationSentEvent` | 所有通道发送完成 | 统计成功率、触发报告 |
| `NotificationChannelSentEvent` | 单个通道成功 | 实时监控各通道状态 |
| `NotificationChannelFailedEvent` | 单个通道失败 | 触发重试、告警 |
| `NotificationReadEvent` | 用户已读 | 更新未读计数 |
| `NotificationDismissedEvent` | 用户忽略 | 统计忽略率 |
| `NotificationExpiredEvent` | 通知过期 | 自动清理 |
| `NotificationFailedEvent` | 所有通道失败 | 告警、记录严重错误 |
| `NotificationRetryingEvent` | 开始重试 | 监控重试效果 |

**代码示例**:
```typescript
// NotificationEvents.ts
export class NotificationChannelSentEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.channel.sent';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      channel: NotificationChannel;
      sentAt: Date;
      deliveredAt?: Date;
      metadata?: Record<string, any>;
    },
  ) {
    super(notificationUuid, NotificationChannelSentEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}
```

---

### 2. 新增多通道管理方法

#### `markChannelSent(channel, sentAt, metadata)`

**用途**: TaskTriggeredHandler 调用此方法记录各通道发送成功

**特性**:
- 更新对应通道的 DeliveryReceipt
- 发布 `NotificationChannelSentEvent`
- 所有通道完成后自动标记通知为 SENT

**代码示例**:
```typescript
// TaskTriggeredHandler.ts 中调用
await this.sendDesktopNotification(notification, accountUuid, reminderData);

// 在 Notification 聚合根内部
notification.markChannelSent('DESKTOP', new Date(), {
  sseEventId: '12345',
  connectionCount: 3
});

// 自动发布事件
this.addDomainEvent(
  new NotificationChannelSentEvent(this._uuid, this._accountUuid, {
    channel: 'DESKTOP',
    sentAt: new Date(),
    deliveredAt: new Date(),
    metadata: { sseEventId: '12345' }
  })
);
```

#### `markChannelFailed(channel, failureReason, retryCount, canRetry)`

**用途**: TaskTriggeredHandler 重试失败后调用

**特性**:
- 更新回执状态为 FAILED 或 RETRYING
- 发布 `NotificationChannelFailedEvent`
- 所有通道失败后自动标记通知为 FAILED

**代码示例**:
```typescript
// 在重试失败后
if (attempt === MAX_RETRIES - 1) {
  notification.markChannelFailed('EMAIL', 'SMTP connection timeout', 3, false);
}

// 自动发布事件
this.addDomainEvent(
  new NotificationChannelFailedEvent(this._uuid, this._accountUuid, {
    channel: 'EMAIL',
    failureReason: 'SMTP connection timeout',
    retryCount: 3,
    canRetry: false,
    failedAt: new Date()
  })
);
```

#### `startSending()`

**用途**: 标记通知开始发送

**特性**:
- 发布 `NotificationSendingEvent`
- 用于监控发送流程

#### `getSentChannels()` / `getFailedChannels()` / `getPendingChannels()`

**用途**: 查询各通道的发送状态

**返回值**: `NotificationChannel[]`

---

### 3. 增强现有方法

#### `markAsRead(readAt)` - 增强版

**新增功能**:
- 计算从发送到阅读的时长
- 发布 `NotificationReadEvent`

**代码对比**:
```typescript
// 之前
markAsRead(readAt: Date = new Date()): void {
  this._status = NotificationStatus.READ;
  this._readAt = readAt;
  this._updatedAt = new Date();
  this._version += 1;
}

// 现在
markAsRead(readAt: Date = new Date()): void {
  const readDuration = this._sentAt
    ? readAt.getTime() - this._sentAt.getTime()
    : undefined;

  this._status = NotificationStatus.READ;
  this._readAt = readAt;
  this._updatedAt = new Date();
  this._version += 1;

  // 发布领域事件
  this.addDomainEvent(
    new NotificationReadEvent(this._uuid, this._accountUuid, {
      readAt,
      readDuration,
    })
  );
}
```

#### `markAsDismissed(dismissedAt)` - 增强版

**新增功能**:
- 发布 `NotificationDismissedEvent`

#### `markAsExpired()` - 增强版

**新增功能**:
- 记录通知是否已读
- 发布 `NotificationExpiredEvent`

---

### 4. 继承 AggregateRoot

**变更点**:
```typescript
// 之前
export class Notification {
  private _uuid: string;
  // ...
}

// 现在
export class Notification extends AggregateRoot {
  private constructor(
    uuid: string,  // 传递给父类
    private _accountUuid: string,
    // ...
  ) {
    super(uuid);  // 调用父类构造函数
    this.validate();
  }

  get uuid(): string {
    return this._uuid;  // 继承自 AggregateRoot
  }
}
```

**好处**:
- 自动管理 `_domainEvents` 数组
- 提供 `addDomainEvent()` 方法
- 提供 `getDomainEvents()` 和 `clearDomainEvents()` 方法
- 符合 DDD 最佳实践

---

## 📊 使用示例

### 完整流程示例

```typescript
// 1. 创建 Notification（自动发布 NotificationCreatedEvent）
const notification = Notification.create({
  uuid: randomUUID(),
  accountUuid: 'user-123',
  content: NotificationContent.create({ title: '提醒', content: '...' }),
  type: 'reminder',
  deliveryChannels: DeliveryChannels.create(['DESKTOP', 'EMAIL']),
  scheduleTime: ScheduleTime.createImmediate(),
});

// 2. 开始发送（发布 NotificationSendingEvent）
notification.startSending();

// 3. 发送到各通道
// 3.1 Desktop 成功（发布 NotificationChannelSentEvent）
notification.markChannelSent('DESKTOP', new Date(), {
  sseEventId: 'evt-123'
});

// 3.2 Email 失败（发布 NotificationChannelFailedEvent）
notification.markChannelFailed('EMAIL', 'SMTP timeout', 3, false);

// 4. 所有通道完成（自动发布 NotificationSentEvent）
// 状态自动变为 SENT

// 5. 用户已读（发布 NotificationReadEvent）
notification.markAsRead();

// 6. 获取领域事件（用于持久化/发布）
const events = notification.getUncommittedDomainEvents();
// [
//   NotificationCreatedEvent,
//   NotificationSendingEvent,
//   NotificationChannelSentEvent (DESKTOP),
//   NotificationChannelFailedEvent (EMAIL),
//   NotificationSentEvent,
//   NotificationReadEvent
// ]
```

---

## 🔄 与 TaskTriggeredHandler 的集成

### 调用时机

```typescript
// TaskTriggeredHandler.ts

async handleReminderNotification(event: TaskTriggeredEvent) {
  // 1. 创建 Notification 聚合根
  const notification = await this.notificationService.createNotification(
    accountUuid,
    createDto
  );

  // 2. 开始发送
  notification.startSending();  // 发布 NotificationSendingEvent

  // 3. 发送到各通道
  await this.sendToChannels(notification, accountUuid, reminderData);
}

private async sendToChannelWithRetry(notification, channel) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await this.sendToChannel(notification, accountUuid, channel, reminderData);
      
      // 成功：标记通道成功
      notification.markChannelSent(channel, new Date());
      
      // 持久化聚合根（包含领域事件）
      await this.notificationService.save(notification);
      return;
      
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) {
        // 最后一次失败：标记通道失败
        notification.markChannelFailed(
          channel,
          error.message,
          MAX_RETRIES,
          false
        );
        
        // 持久化聚合根
        await this.notificationService.save(notification);
      } else {
        await this.sleep(RETRY_DELAY_BASE * Math.pow(2, attempt));
      }
    }
  }
}
```

---

## 🎁 收益

### 1. 完整的审计日志
- 每个状态变更都有对应的领域事件
- 可以重建完整的通知生命周期
- 支持事件溯源

### 2. 实时监控
- 通过订阅领域事件实时监控
- 统计各通道的成功率
- 识别问题渠道

### 3. 灵活的扩展性
- 新增通道只需更新 `NotificationChannel` 枚举
- 事件处理器可以独立扩展
- 符合开闭原则

### 4. 符合 DDD 最佳实践
- 聚合根管理完整的业务逻辑
- 领域事件表达业务意图
- 清晰的职责划分

---

## 📝 文件清单

### 新增文件

| 文件路径 | 说明 | 行数 |
|---------|------|-----|
| `apps/api/src/modules/notification/domain/events/NotificationEvents.ts` | 10+ 种领域事件定义 | 300+ |

### 修改文件

| 文件路径 | 主要变更 | 行数变化 |
|---------|---------|---------|
| `apps/api/src/modules/notification/domain/aggregates/Notification.ts` | 继承 AggregateRoot<br>新增多通道管理方法<br>增强现有方法发布事件 | +300 |

---

## 🚀 下一步

1. **更新 NotificationApplicationService**
   - 在 `save()` 方法中发布领域事件
   - 调用 `eventBus.publish()` 发布事件

2. **创建事件处理器**
   - NotificationAnalyticsHandler（统计分析）
   - NotificationAuditHandler（审计日志）
   - NotificationAlertHandler（告警通知）

3. **优化 TaskTriggeredHandler**
   - 使用新的 `markChannelSent()` 和 `markChannelFailed()` 方法
   - 调用 `startSending()` 开始发送

4. **编写集成测试**
   - 测试完整的事件流
   - 验证多通道状态管理

---

## ✅ 验证清单

完成本次增强后，请验证：

- [ ] ✅ Notification 继承自 AggregateRoot
- [ ] ✅ 所有领域事件正确定义并继承 DomainEvent
- [ ] ✅ `markChannelSent()` 方法正确发布事件
- [ ] ✅ `markChannelFailed()` 方法正确处理失败
- [ ] ✅ `startSending()` 方法发布 NotificationSendingEvent
- [ ] ✅ `markAsRead()` / `markAsDismissed()` / `markAsExpired()` 发布对应事件
- [ ] ✅ 无编译错误
- [ ] ✅ 符合 DDD 最佳实践

---

**状态**: ✅ 全部完成  
**下一任务**: 优化调度器为优先队列+定时器

---

## 📚 相关文档

- [架构优化总结](../testing/ARCHITECTURE_OPTIMIZATION_SUMMARY.md)
- [流程分析](../testing/REMINDER_NOTIFICATION_FLOW_ANALYSIS.md)
- [快速测试指南](../testing/QUICK_TEST_GUIDE.md)
