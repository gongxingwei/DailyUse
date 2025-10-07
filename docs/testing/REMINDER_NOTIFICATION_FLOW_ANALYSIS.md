# Reminder + Schedule + Notification 流程分析

## 📋 分析概述

本文档分析当前系统中 Reminder（提醒）、Schedule（调度）、Notification（通知）三个模块的协作流程，评估是否可行以及是否符合最佳实践。

**分析时间**: 2025-01-10
**分析范围**: API 后端 + Web 前端
**核心流程**: 用户创建提醒 → 调度器触发 → 通知系统显示

---

## 🔄 完整流程图

### 1. 创建提醒模板阶段

```
用户操作
    ↓
【前端】ReminderWebApplicationService.createTemplate()
    ↓
【API】POST /api/v1/reminder-templates
    ↓
【API】ReminderApplicationService.createTemplate()
    ↓
【领域】ReminderTemplate.create()
    ↓
【仓储】ReminderTemplateRepository.save()
    ↓
【事件】eventEmitter.emit('ReminderTemplateCreated', {...})
    ↓
【订阅】（当前无订阅者，需要手动集成）
    ↓
【调度】ScheduleDomainService.createScheduleTask()
    ↓
【调度仓储】ScheduleTaskRepository.create()
    ↓
数据库：reminder_templates + schedule_tasks 表
```

**现状问题**：
- ⚠️ **缺少自动化集成**：ReminderTemplateCreated 事件发出后，没有自动创建 ScheduleTask
- ⚠️ **需要手动调用**：当前需要在 Web 端通过 `reminderScheduleIntegrationService` 手动创建调度任务

---

### 2. 调度器触发阶段

```
【调度器】ScheduleTaskScheduler.checkAndExecuteTasks() (定时轮询)
    ↓
【查询】查找 now >= scheduledTime 且 status = 'pending' 的任务
    ↓
【执行】ScheduleTaskScheduler.executeTask(task)
    ↓
【创建记录】scheduleExecution 表插入执行记录
    ↓
【事件发布】eventBus.publish([TaskTriggeredEvent])
    ↓
【订阅处理】TaskTriggeredHandler.handle(event)
    ↓
【SSE 广播】SSEController.broadcastToAccount(reminderData)
    ↓
【前端接收】SSEClient.onMessage('reminder-triggered')
    ↓
【前端事件】eventBus.emit('reminder-triggered', data)
    ↓
【通知处理】ReminderNotificationHandler.handleReminderTriggered()
    ↓
【通知服务】NotificationService.show(config)
    ↓
【并发显示】
    ├─ DesktopNotificationService.show() → 系统桌面通知
    └─ AudioNotificationService.play() → 播放提醒音效
```

**现状评估**：
- ✅ **事件驱动架构良好**：使用 EventBus 解耦模块
- ✅ **职责清晰**：Schedule 负责触发，Notification 负责显示
- ✅ **SSE 实时推送**：前端实时收到提醒
- ⚠️ **轮询机制**：当前使用定时轮询检查任务，非最优方案

---

### 3. 通知显示阶段

```
【前端】ReminderNotificationHandler 收到事件
    ↓
【规范化】normalizeReminderData(data)
    ↓
【转换方法】alertMethods → NotificationMethod[]
    ↓
【构建配置】buildNotificationConfig(reminderData, methods)
    ↓
【显示通知】NotificationService.show(config)
    ↓
【队列管理】NotificationQueue.enqueue(notification)
    ↓
【并发控制】检查当前显示数量 (maxConcurrent = 3)
    ↓
【并发执行】
    ├─ 桌面通知：Notification API → 系统右下角弹窗
    └─ 音效播放：HTMLAudioElement → 播放对应优先级的音效
```

**现状评估**：
- ✅ **通知队列良好**：支持优先级排序和并发控制
- ✅ **多方式通知**：支持桌面通知 + 声音 + 应用内（预留）
- ✅ **权限管理**：自动请求和检查 Notification 权限
- ⚠️ **浏览器限制**：自动播放音效需要用户交互

---

## 🏗️ 架构分析

### 架构优点 ✅

#### 1. **事件驱动解耦**
```typescript
// Reminder 模块只需发布事件
eventEmitter.emit('ReminderTemplateCreated', {...});

// Schedule 模块订阅并处理
eventBus.subscribe(ReminderInstanceCreatedHandler);
```

**优点**：
- 模块间松耦合
- 易于扩展和测试
- 符合领域驱动设计（DDD）

#### 2. **职责清晰分离**
| 模块 | 职责 | 核心功能 |
|------|------|---------|
| Reminder | 提醒数据管理 | 创建/更新/删除提醒模板 |
| Schedule | 调度任务执行 | 定时检查并触发任务 |
| Notification | 通知显示 | 桌面通知 + 声音 + 队列管理 |

**优点**：
- 单一职责原则（SRP）
- 易于维护和测试
- 可独立部署和扩展

#### 3. **DDD 聚合根设计**
```typescript
// Reminder 聚合根
class ReminderTemplate {
  toCronExpression(): string | null
  shouldCreateScheduleTask(): boolean
  getScheduleTaskMetadata(): Record<string, any>
}

// Schedule 聚合根
class ScheduleTask {
  execute(): Promise<void>
  calculateNextExecution(): Date | null
}

// Notification 聚合根
class Notification {
  markAsRead(): void
  markAsDismissed(): void
}
```

**优点**：
- 业务逻辑封装在聚合根内
- 状态转换由聚合根控制
- 数据一致性由聚合根保证

#### 4. **SSE 实时推送**
```typescript
// 后端
SSEController.broadcastToAccount(accountUuid, reminderData);

// 前端
SSEClient.onMessage('reminder-triggered', handleReminder);
```

**优点**：
- 实时性好（< 1秒延迟）
- 自动重连机制
- 支持多设备同步

---

### 架构问题 ⚠️

#### 1. **Reminder → Schedule 集成不自动化**

**问题描述**：
创建 ReminderTemplate 后，不会自动创建 ScheduleTask，需要手动调用集成服务。

**当前实现**：
```typescript
// ❌ 当前：需要手动调用
const template = await reminderService.createTemplate(request);
await reminderScheduleIntegrationService.createReminderSchedule(template);
```

**建议改进**：
```typescript
// ✅ 建议：自动监听事件
class ReminderScheduleSyncHandler implements EventHandler {
  async handle(event: ReminderTemplateCreatedEvent) {
    const template = event.payload.template;
    if (template.shouldCreateScheduleTask()) {
      await this.scheduleService.createTask({
        cronExpression: template.toCronExpression(),
        sourceModule: 'reminder',
        sourceEntityId: template.uuid,
      });
    }
  }
}

// 注册事件处理器
eventBus.subscribe(new ReminderScheduleSyncHandler());
```

**影响**：
- ⚠️ 中等严重性
- 当前可用但不优雅
- 容易遗漏集成步骤

---

#### 2. **调度器使用轮询机制**

**问题描述**：
ScheduleTaskScheduler 每 10 秒轮询一次数据库，效率较低。

**当前实现**：
```typescript
// ❌ 当前：定时轮询
async start() {
  this.interval = setInterval(() => {
    this.checkAndExecuteTasks();
  }, this.checkInterval); // 10秒
}
```

**建议改进**：
```typescript
// ✅ 建议：基于优先队列的调度器
class PriorityQueueScheduler {
  private queue: PriorityQueue<ScheduleTask>;
  private timer: NodeJS.Timeout | null = null;

  scheduleNext() {
    const nextTask = this.queue.peek();
    if (!nextTask) return;

    const delay = nextTask.scheduledTime.getTime() - Date.now();
    this.timer = setTimeout(() => {
      this.executeTask(this.queue.poll()!);
      this.scheduleNext();
    }, delay);
  }

  addTask(task: ScheduleTask) {
    this.queue.enqueue(task, task.scheduledTime.getTime());
    this.reschedule();
  }
}
```

**性能对比**：
| 方案 | 延迟 | CPU 占用 | 数据库查询 |
|------|------|---------|-----------|
| 当前轮询 | 0-10秒 | 低 | 每10秒一次 |
| 优先队列 | < 100ms | 极低 | 按需查询 |

**影响**：
- ⚠️ 中等严重性
- 延迟可接受但不理想
- 数据库压力随任务数增加

---

#### 3. **缺少失败重试机制**

**问题描述**：
如果通知发送失败（网络问题、SSE 断开），没有重试机制。

**当前实现**：
```typescript
// ❌ 当前：发送一次，失败即丢弃
await SSEController.broadcastToAccount(accountUuid, reminderData);
// 如果失败，提醒就丢失了
```

**建议改进**：
```typescript
// ✅ 建议：添加消息队列和重试
class NotificationRetryQueue {
  async send(notification: Notification, options: RetryOptions) {
    const maxRetries = options.maxRetries || 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.sseController.broadcast(notification);
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          await this.saveToDeadLetterQueue(notification);
        }
        await this.delay(Math.pow(2, i) * 1000); // 指数退避
      }
    }
  }
}
```

**影响**：
- ⚠️ 高严重性
- 可能导致重要提醒丢失
- 影响用户体验

---

#### 4. **Notification 模块职责混乱**

**问题描述**：
Notification 模块既负责管理通知数据（CRUD），又负责显示通知（Desktop/Sound），职责过多。

**当前结构**：
```
notification/
├── domain/
│   ├── aggregates/Notification.ts          # 通知数据聚合根
│   └── services/NotificationDomainService.ts
├── application/
│   ├── services/NotificationApplicationService.ts  # 通知 CRUD
│   └── handlers/ReminderNotificationHandler.ts    # 提醒显示逻辑
└── infrastructure/
    ├── services/DesktopNotificationService.ts     # 桌面通知
    └── services/AudioNotificationService.ts       # 音效播放
```

**问题分析**：
1. **Notification 聚合根**：管理通知的持久化数据（标题、内容、状态）
2. **NotificationService**：负责实时显示（桌面通知、声音）
3. **混淆点**：两者都叫 "Notification" 但职责完全不同

**建议改进**：
```
# 方案 1：拆分为两个独立模块
notification/           # 通知数据管理
├── domain/Notification.ts
└── application/NotificationApplicationService.ts

alert/                  # 实时提醒显示
├── AlertService.ts
├── DesktopAlert.ts
└── AudioAlert.ts

# 方案 2：重命名以区分
notification/
├── domain/NotificationRecord.ts          # 通知记录
├── application/NotificationCrudService.ts
└── presentation/
    ├── AlertDisplayService.ts            # 提醒显示
    └── handlers/ReminderAlertHandler.ts
```

**影响**：
- ⚠️ 中等严重性
- 当前可用但容易混淆
- 影响代码可读性和可维护性

---

## 🎯 最佳实践对比

### 1. 事件驱动架构 ✅

**当前实现**：
```typescript
// 发布事件
eventEmitter.emit('ReminderTemplateCreated', {...});

// 订阅事件
eventBus.subscribe(TaskTriggeredHandler);
```

**最佳实践**：
- ✅ 使用事件解耦模块
- ✅ 事件命名清晰（领域事件风格）
- ⚠️ 缺少事件版本管理
- ⚠️ 缺少事件持久化（Event Sourcing）

**评分**: 8/10

---

### 2. 领域驱动设计（DDD） ✅

**当前实现**：
```typescript
// 聚合根封装业务逻辑
class ReminderTemplate {
  toCronExpression(): string | null {
    // 业务规则：将提醒配置转换为 Cron 表达式
  }
}
```

**最佳实践**：
- ✅ 聚合根封装业务逻辑
- ✅ 领域服务协调聚合根
- ✅ 应用服务协调多个聚合根
- ⚠️ 值对象使用不足（可增加 TimeConfig、AlertConfig 等）

**评分**: 9/10

---

### 3. 职责分离（SRP） ⚠️

**当前问题**：
```typescript
// Notification 模块职责过多
class NotificationApplicationService {
  createNotification()        // 通知数据管理
  markAsRead()                // 通知数据管理
  createFromTemplate()        // 通知数据管理
  // ...同时还负责显示逻辑（通过 handlers）
}
```

**最佳实践**：
- ⚠️ 应该拆分为 NotificationRecord（数据）和 AlertDisplay（显示）
- ✅ 其他模块职责清晰

**评分**: 6/10

---

### 4. 异步处理 ⚠️

**当前问题**：
```typescript
// ❌ 缺少失败重试
await SSEController.broadcast(reminderData);

// ❌ 缺少消息队列
// ❌ 缺少死信队列
```

**最佳实践**：
- ⚠️ 应该使用消息队列（Redis/RabbitMQ）
- ⚠️ 应该实现重试机制
- ⚠️ 应该有失败监控和告警

**评分**: 5/10

---

### 5. 实时性 ✅

**当前实现**：
```typescript
// SSE 推送（< 1秒延迟）
SSEController.broadcastToAccount(accountUuid, reminderData);
```

**最佳实践**：
- ✅ SSE 实时推送
- ✅ 自动重连机制
- ⚠️ 调度器轮询导致 0-10秒延迟

**评分**: 7/10

---

## 📊 综合评估

### 可行性评估 ✅

| 评估维度 | 状态 | 说明 |
|---------|------|------|
| **功能完整性** | ✅ 可行 | 基本流程完整，可以正常工作 |
| **架构合理性** | ✅ 良好 | 事件驱动 + DDD，架构清晰 |
| **性能表现** | ⚠️ 可接受 | 轮询机制导致延迟，但可接受 |
| **可维护性** | ✅ 良好 | 模块职责清晰，易于维护 |
| **可扩展性** | ✅ 良好 | 事件驱动易于扩展新功能 |
| **可靠性** | ⚠️ 待改进 | 缺少重试机制，有丢失风险 |

**总体评估**: ✅ **可行，符合 80% 的最佳实践**

---

### 最佳实践符合度

| 实践 | 符合度 | 评分 | 备注 |
|------|-------|------|------|
| 事件驱动架构 | 80% | 8/10 | 缺少事件持久化 |
| 领域驱动设计 | 90% | 9/10 | 聚合根设计优秀 |
| 职责分离原则 | 60% | 6/10 | Notification 模块混乱 |
| 异步处理 | 50% | 5/10 | 缺少重试和队列 |
| 实时性 | 70% | 7/10 | 轮询导致延迟 |
| **平均分** | **70%** | **7/10** | 良好，有改进空间 |

---

## 🚀 优化建议（优先级排序）

### 🔥 高优先级（影响可靠性）

#### 1. 添加通知重试机制
```typescript
class NotificationRetryService {
  async sendWithRetry(notification: Notification, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.sseController.broadcast(notification);
        return { success: true };
      } catch (error) {
        if (i === maxRetries - 1) {
          await this.saveToDeadLetterQueue(notification);
          return { success: false, error };
        }
        await this.exponentialBackoff(i);
      }
    }
  }
}
```

**收益**：
- 提高可靠性，避免提醒丢失
- 用户体验更好

---

#### 2. 自动化 Reminder → Schedule 集成
```typescript
// 注册事件处理器
class ReminderScheduleSyncHandler implements EventHandler {
  async handle(event: ReminderTemplateCreatedEvent) {
    const template = event.payload.template;
    if (template.enabled && template.toCronExpression()) {
      await this.scheduleService.createScheduleTask({
        name: template.name,
        cronExpression: template.toCronExpression(),
        sourceModule: 'reminder',
        sourceEntityId: template.uuid,
        metadata: template.getScheduleTaskMetadata(),
      });
    }
  }
}

// app.ts 中注册
eventBus.subscribe(new ReminderScheduleSyncHandler(scheduleService));
```

**收益**：
- 自动化集成，减少手动步骤
- 避免遗漏创建调度任务

---

### ⚡ 中优先级（提升性能）

#### 3. 优化调度器为优先队列
```typescript
class PriorityQueueScheduler {
  private queue: PriorityQueue<ScheduleTask>;

  async addTask(task: ScheduleTask) {
    this.queue.enqueue(task, task.scheduledTime.getTime());
    this.reschedule();
  }

  private reschedule() {
    if (this.timer) clearTimeout(this.timer);
    
    const next = this.queue.peek();
    if (!next) return;

    const delay = next.scheduledTime.getTime() - Date.now();
    this.timer = setTimeout(() => {
      this.executeTask(this.queue.poll()!);
      this.reschedule();
    }, Math.max(0, delay));
  }
}
```

**收益**：
- 延迟从 0-10秒 降低到 < 100ms
- 减少数据库查询次数

---

#### 4. 拆分 Notification 模块职责
```typescript
// 方案 1：重命名以区分
notification/
├── domain/NotificationRecord.ts          # 持久化的通知记录
├── application/NotificationRecordService.ts
└── presentation/
    ├── AlertDisplayService.ts            # 实时提醒显示
    └── handlers/ReminderAlertHandler.ts

// 或方案 2：拆分为两个模块
notification/     # 通知记录管理
alert/           # 实时提醒显示
```

**收益**：
- 职责清晰，易于理解
- 降低维护成本

---

### 💡 低优先级（优化体验）

#### 5. 添加事件版本管理
```typescript
interface DomainEvent {
  eventType: string;
  eventVersion: string;  // 新增版本号
  aggregateId: string;
  payload: any;
  timestamp: Date;
}

class ReminderTemplateCreatedEvent implements DomainEvent {
  static EVENT_TYPE = 'ReminderTemplateCreated';
  static EVENT_VERSION = 'v1.0';  // 版本管理
}
```

**收益**：
- 支持事件演进
- 向后兼容性

---

#### 6. 添加事件持久化（Event Sourcing）
```typescript
class EventStore {
  async saveEvent(event: DomainEvent) {
    await this.prisma.domainEvent.create({
      data: {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        payload: JSON.stringify(event.payload),
        timestamp: event.timestamp,
      },
    });
  }

  async replayEvents(aggregateId: string) {
    const events = await this.prisma.domainEvent.findMany({
      where: { aggregateId },
      orderBy: { timestamp: 'asc' },
    });
    return events.map(e => this.deserialize(e));
  }
}
```

**收益**：
- 完整的审计日志
- 支持时间旅行调试
- 可重放事件

---

## 📝 总结

### ✅ 优点
1. **事件驱动架构清晰**：模块间松耦合，易于扩展
2. **DDD 设计优秀**：聚合根封装业务逻辑，职责清晰
3. **SSE 实时推送**：用户体验好，延迟低
4. **代码结构清晰**：分层合理，易于维护

### ⚠️ 需要改进
1. **Reminder → Schedule 集成不自动化**：需要手动调用集成服务
2. **调度器轮询效率低**：建议改为优先队列
3. **缺少失败重试机制**：可能导致提醒丢失
4. **Notification 模块职责混乱**：数据管理和显示逻辑混在一起

### 🎯 行动建议
**短期（1-2周）**：
1. ✅ 添加通知重试机制（高优先级）
2. ✅ 自动化 Reminder → Schedule 集成（高优先级）

**中期（1-2月）**：
3. ⚡ 优化调度器为优先队列（中优先级）
4. ⚡ 拆分 Notification 模块职责（中优先级）

**长期（3-6月）**：
5. 💡 添加事件版本管理（低优先级）
6. 💡 实现 Event Sourcing（低优先级）

---

**最终结论**：
✅ **当前实现可行，符合 70% 的最佳实践，建议优先完成高优先级优化后再编写集成测试。**
