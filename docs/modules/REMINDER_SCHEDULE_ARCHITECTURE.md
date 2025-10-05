# Reminder-Schedule-Notification 架构设计文档

## 当前问题分析

### 1. 数据结构问题 ✅ 已修复

**问题**：后端返回双层 `data` 嵌套
```json
{
  "success": true,
  "data": {
    "data": {  // ❌ 多余的一层
      "reminders": [...]
    }
  }
}
```

**修复**：
```typescript
// 之前 ❌
const listResponse = {
  data: {
    reminders: activeTemplates,
    ...
  },
};

// 之后 ✅
const listResponse = {
  reminders: cleanedTemplates,
  total: cleanedTemplates.length,
  page,
  limit,
  hasMore: cleanedTemplates.length >= limit,
};
```

### 2. Schedule 字段耦合问题 ✅ 已修复

**问题**：Reminder 模板返回了 `schedules` 字段，违反了模块职责分离原则

**修复**：在返回前端之前移除 `schedules` 字段
```typescript
const cleanedTemplates = activeTemplates.map((template: any) => {
  const { schedules, ...templateWithoutSchedules } = template;
  return templateWithoutSchedules;
});
```

---

## 推荐架构设计

### 架构方案对比

#### 方案 A：事件驱动架构（推荐 ⭐⭐⭐⭐⭐）

```
┌─────────────────┐
│ Reminder Module │
│                 │
│ ┌─────────────┐ │
│ │  Template   │ │──┐
│ │  (聚合根)    │ │  │ 1. 创建 ReminderInstance
│ └─────────────┘ │  │
│                 │  │
│ ┌─────────────┐ │  │
│ │  Instance   │ │◄─┘
│ │  (实体)      │ │
│ └─────────────┘ │
│       │         │
│       │ 2. 发布事件
│       ▼         │
└────────┼────────┘
         │
         │ ReminderInstanceCreatedEvent
         │ {
         │   instanceUuid,
         │   scheduledTime,
         │   priority,
         │   message,
         │   ...
         │ }
         │
         ▼
┌────────┴────────┐
│  Event Bus      │
│  (领域事件总线)  │
└────────┬────────┘
         │
         │ 监听事件
         ▼
┌─────────────────┐
│ Schedule Module │
│  (任务队列)      │
│                 │
│ ┌─────────────┐ │
│ │ TaskInstance│ │ ◄─── 3. 根据事件创建 TaskInstance
│ │  (任务实例)  │ │
│ └─────────────┘ │
│       │         │
│       │ 4. 时间到达
│       ▼         │
│ ┌─────────────┐ │
│ │ TaskExecutor│ │ ──┐
│ │  (执行器)    │ │   │ 5. 发布 TaskTriggeredEvent
│ └─────────────┘ │   │
└────────┼────────┘   │
         │            │
         └────────────┘
                 │
                 │ TaskTriggeredEvent / ReminderTriggeredEvent
                 │ {
                 │   taskUuid,
                 │   reminderInstanceUuid,
                 │   message,
                 │   priority,
                 │   ...
                 │ }
                 │
                 ▼
         ┌───────┴────────┐
         │   Event Bus    │
         └───────┬────────┘
                 │
                 │ 监听事件
                 ▼
┌─────────────────────────┐
│  Notification Module    │
│                         │
│  ┌──────────────────┐   │
│  │ EventListener    │   │ ◄─── 6. 监听提醒触发事件
│  └──────────────────┘   │
│           │             │
│           ▼             │
│  ┌──────────────────┐   │
│  │ SSE Broadcaster  │   │ ──┐
│  └──────────────────┘   │   │ 7. 通过 SSE 推送到前端
└─────────────────────────┘   │
                              │
                              │ SSE Stream
                              │
                              ▼
                    ┌─────────────────┐
                    │  Frontend       │
                    │  Notification   │
                    │  Module         │
                    └─────────────────┘
```

**优点**：
- ✅ **完全解耦**：各模块只关心自己的职责
- ✅ **可扩展**：新增提醒类型只需添加事件监听器
- ✅ **可测试**：每个模块可以独立测试
- ✅ **符合 DDD**：领域事件驱动业务流程
- ✅ **灵活性高**：可以轻松添加其他监听器（如日志、统计）

**缺点**：
- ❌ 需要实现事件总线基础设施
- ❌ 事件流调试相对复杂
- ❌ 需要处理事件丢失/重试机制

---

#### 方案 B：Schedule 直接发送 SSE（当前实现 ⭐⭐⭐）

```
┌─────────────────┐
│ Reminder Module │
│                 │
│  ReminderInstance ────┐
└─────────────────┘     │ 直接调用
                        │
                        ▼
                ┌──────────────────┐
                │  Schedule Module │
                │                  │
                │  创建 TaskInstance │
                │        │         │
                │        ▼         │
                │  时间到达后      │
                │  直接发送 SSE    │
                └──────────┬───────┘
                           │
                           │ SSE Stream
                           │
                           ▼
                  ┌─────────────────┐
                  │    Frontend     │
                  └─────────────────┘
```

**优点**：
- ✅ 实现简单
- ✅ 调用链路清晰
- ✅ 适合小型项目

**缺点**：
- ❌ **紧耦合**：Schedule 必须知道如何发送通知
- ❌ **职责混乱**：Schedule 既管理任务队列，又负责通知
- ❌ **扩展困难**：新增通知方式需要修改 Schedule 模块
- ❌ **违反单一职责原则**

---

## 推荐实现方案

### 阶段 1：事件基础设施（优先级：高）

#### 1.1 创建领域事件基类

```typescript
// packages/domain-core/src/events/DomainEvent.ts
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
  ) {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  abstract toPrimitives(): Record<string, any>;
}
```

#### 1.2 创建事件总线

```typescript
// packages/domain-core/src/events/EventBus.ts
export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
}

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

// 简单的内存实现
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const handlers = this.handlers.get(event.eventType) || [];
      await Promise.all(handlers.map(h => h.handle(event)));
    }
  }

  subscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }
}
```

### 阶段 2：Reminder 模块事件（优先级：高）

#### 2.1 定义 Reminder 事件

```typescript
// apps/api/src/modules/reminder/domain/events/ReminderInstanceCreated.ts
export class ReminderInstanceCreatedEvent extends DomainEvent {
  constructor(
    instanceUuid: string,
    public readonly templateUuid: string,
    public readonly accountUuid: string,
    public readonly scheduledTime: Date,
    public readonly message: string,
    public readonly priority: string,
    public readonly metadata: Record<string, any>,
  ) {
    super(instanceUuid, 'ReminderInstanceCreated');
  }

  toPrimitives() {
    return {
      instanceUuid: this.aggregateId,
      templateUuid: this.templateUuid,
      accountUuid: this.accountUuid,
      scheduledTime: this.scheduledTime.toISOString(),
      message: this.message,
      priority: this.priority,
      metadata: this.metadata,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
```

#### 2.2 在聚合根中发布事件

```typescript
// apps/api/src/modules/reminder/domain/aggregates/ReminderTemplateAggregate.ts
export class ReminderTemplateAggregate {
  private domainEvents: DomainEvent[] = [];

  createInstance(params: CreateInstanceParams): ReminderInstance {
    const instance = new ReminderInstance(params);
    
    // 记录领域事件
    this.domainEvents.push(
      new ReminderInstanceCreatedEvent(
        instance.uuid,
        this.uuid,
        this.accountUuid,
        instance.scheduledTime,
        instance.message,
        instance.priority,
        { category: this.category, tags: this.tags }
      )
    );

    return instance;
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
```

### 阶段 3：Schedule 模块事件监听（优先级：高）

```typescript
// apps/api/src/modules/schedule/application/eventHandlers/ReminderInstanceCreatedHandler.ts
export class ReminderInstanceCreatedHandler implements EventHandler<ReminderInstanceCreatedEvent> {
  constructor(
    private scheduleService: ScheduleService,
  ) {}

  async handle(event: ReminderInstanceCreatedEvent): Promise<void> {
    // 根据 Reminder 实例创建 Schedule 任务
    await this.scheduleService.createTaskFromReminder({
      sourceType: 'reminder',
      sourceId: event.aggregateId,
      accountUuid: event.accountUuid,
      scheduledTime: new Date(event.scheduledTime),
      taskType: 'reminder',
      payload: event.toPrimitives(),
      priority: event.priority,
    });

    logger.info('Task created for reminder instance', {
      reminderInstanceUuid: event.aggregateId,
      scheduledTime: event.scheduledTime,
    });
  }
}
```

### 阶段 4：Schedule 触发事件（优先级：中）

```typescript
// apps/api/src/modules/schedule/domain/events/TaskTriggeredEvent.ts
export class TaskTriggeredEvent extends DomainEvent {
  constructor(
    taskUuid: string,
    public readonly sourceType: string,
    public readonly sourceId: string,
    public readonly accountUuid: string,
    public readonly payload: Record<string, any>,
  ) {
    super(taskUuid, 'TaskTriggered');
  }

  toPrimitives() {
    return {
      taskUuid: this.aggregateId,
      sourceType: this.sourceType,
      sourceId: this.sourceId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}
```

### 阶段 5：Notification 模块监听（优先级：中）

```typescript
// apps/api/src/modules/notification/application/eventHandlers/TaskTriggeredHandler.ts
export class TaskTriggeredHandler implements EventHandler<TaskTriggeredEvent> {
  constructor(
    private sseService: SSEService,
  ) {}

  async handle(event: TaskTriggeredEvent): Promise<void> {
    if (event.sourceType !== 'reminder') {
      return; // 只处理 reminder 类型的任务
    }

    // 通过 SSE 向前端发送通知
    await this.sseService.sendToAccount(event.accountUuid, {
      type: 'reminder.triggered',
      data: {
        reminderInstanceUuid: event.sourceId,
        message: event.payload.message,
        priority: event.payload.priority,
        scheduledTime: event.payload.scheduledTime,
      },
    });

    logger.info('Reminder notification sent via SSE', {
      accountUuid: event.accountUuid,
      reminderInstanceUuid: event.sourceId,
    });
  }
}
```

---

## 迁移计划

### 第一步：基础设施（1-2 天）
- [ ] 实现 `DomainEvent` 基类
- [ ] 实现 `InMemoryEventBus`
- [ ] 在应用服务中集成事件发布机制

### 第二步：Reminder 事件（1 天）
- [ ] 定义 `ReminderInstanceCreatedEvent`
- [ ] 在 `ReminderTemplateAggregate` 中发布事件
- [ ] 在应用服务层提取并发布事件

### 第三步：Schedule 监听（1 天）
- [ ] 实现 `ReminderInstanceCreatedHandler`
- [ ] 注册事件监听器
- [ ] 测试事件流

### 第四步：Notification 监听（1 天）
- [ ] 定义 `TaskTriggeredEvent`
- [ ] 实现 `TaskTriggeredHandler`
- [ ] 集成 SSE 推送

### 第五步：清理旧代码（0.5 天）
- [ ] 移除 Reminder 中的 `schedules` 字段
- [ ] 移除直接调用 Schedule 的代码
- [ ] 更新文档

---

## 架构对比结论

### 你的问题：是不是事件驱动架构更好？

**答案：是的！✅**

#### 理由：

1. **符合 DDD 原则**
   - 每个模块都是独立的限界上下文
   - 通过领域事件通信，保持松耦合

2. **符合单一职责原则**
   - Reminder：管理提醒模板和实例
   - Schedule：管理任务队列和调度
   - Notification：管理通知推送

3. **更好的可扩展性**
   - 新增提醒类型：只需添加新的事件和监听器
   - 新增通知方式：只需添加新的 Notification Handler
   - 新增业务逻辑：可以添加多个监听器处理同一事件

4. **更好的可测试性**
   - 每个模块可以独立测试
   - 事件可以模拟和断言
   - 不需要复杂的 Mock

5. **更符合企业级应用架构**
   - 微服务架构的基础
   - 便于后续拆分为独立服务
   - 支持最终一致性

#### 当前方案的问题：

- ❌ Schedule 模块职责过重（调度 + 通知）
- ❌ Reminder 和 Schedule 紧耦合
- ❌ 难以添加新的通知渠道（邮件、短信等）
- ❌ 违反开闭原则

---

## 建议

1. **短期（1 周内）**：
   - ✅ 修复双层 data 嵌套（已完成）
   - ✅ 移除 schedules 字段（已完成）
   - 实现基础的事件总线

2. **中期（2-3 周）**：
   - 迁移到事件驱动架构
   - 实现完整的事件流
   - 添加事件存储（EventSourcing，可选）

3. **长期（1-2 月）**：
   - 考虑引入消息队列（RabbitMQ/Kafka）
   - 实现事件重试和错误处理
   - 监控和追踪事件流

---

## 参考资料

- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [CQRS and Event Sourcing](https://martinfowler.com/bliki/CQRS.html)
