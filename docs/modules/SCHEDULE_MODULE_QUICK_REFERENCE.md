# Schedule 模块快速参考

> **状态**: ✅ DDD 架构完善，无编译错误  
> **最后更新**: 2025-10-06  
> **编译状态**: ✅ 无错误

## 📚 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     Interface Layer (接口层)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ScheduleController                                        │  │
│  │   - getAllSchedules(req, res)                             │  │
│  │   - getScheduleById(req, res)                             │  │
│  │   - createSchedule(req, res)                              │  │
│  │   - updateSchedule(req, res)                              │  │
│  │   - deleteSchedule(req, res)                              │  │
│  │   - ... (更多方法)                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ calls
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer (应用层)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ScheduleApplicationService (单例)                         │  │
│  │   - createScheduleTask(accountUuid, request)              │  │
│  │   - getScheduleTask(accountUuid, uuid)                    │  │
│  │   - getScheduleTasks(accountUuid, query)                  │  │
│  │   - updateScheduleTask(accountUuid, uuid, request)        │  │
│  │   - deleteScheduleTask(accountUuid, uuid)                 │  │
│  │   - enableScheduleTask(accountUuid, uuid)                 │  │
│  │   - disableScheduleTask(accountUuid, uuid)                │  │
│  │   - executeScheduleTask(accountUuid, uuid)                │  │
│  │   - ... (更多方法)                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ uses
┌─────────────────────────────────────────────────────────────────┐
│                     Domain Layer (领域层)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ScheduleDomainService                                     │  │
│  │   - createScheduleTask(accountUuid, request)              │  │
│  │   - getScheduleTaskByUuid(accountUuid, uuid)              │  │
│  │   - updateScheduleTask(accountUuid, uuid, request)        │  │
│  │   - deleteScheduleTask(accountUuid, uuid)                 │  │
│  │   - validateScheduleTaskCreation(...)                     │  │
│  │   - calculateNextExecutionTime(...)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ IScheduleTaskRepository (接口)                            │  │
│  │   - create(request, createdBy)                            │  │
│  │   - findByUuid(uuid)                                      │  │
│  │   - findMany(query)                                       │  │
│  │   - update(uuid, request)                                 │  │
│  │   - delete(uuid)                                          │  │
│  │   - enable(uuid)                                          │  │
│  │   - disable(uuid)                                         │  │
│  │   - ... (更多方法)                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ScheduleTask 聚合根 (@dailyuse/domain-server)            │  │
│  │   - execute(): Promise<ExecutionResult>                   │  │
│  │   - validate(): ValidationResult                          │  │
│  │   - pause(): void                                         │  │
│  │   - resume(): void                                        │  │
│  │   - enable(): void                                        │  │
│  │   - disable(): void                                       │  │
│  │   - calculateNextExecutionTime(): Date                    │  │
│  │   - static fromDTO(dto): ScheduleTask                     │  │
│  │   - static fromCreateRequest(...): ScheduleTask           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ implements
┌─────────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer (基础设施层)                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ PrismaScheduleTaskRepository                              │  │
│  │   - implements IScheduleTaskRepository                    │  │
│  │   - 使用 Prisma Client 进行数据持久化                      │  │
│  │   - 当前返回 DTO（待优化：返回聚合根实例）                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ScheduleContainer (DI 容器)                               │  │
│  │   - 管理所有依赖注入                                       │  │
│  │   - 单例模式                                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 使用指南

### 在 Controller 中调用 ApplicationService

```typescript
import { ScheduleContainer } from '../../infrastructure/di/ScheduleContainer';

export class ScheduleController {
  private prisma = new PrismaClient();

  private get scheduleService() {
    return ScheduleContainer.getInstance(this.prisma).scheduleApplicationService;
  }

  async createSchedule(req: Request, res: Response): Promise<Response> {
    try {
      // 1. 提取 accountUuid
      const accountUuid = this.getAccountUuid(req);
      
      // 2. 获取请求数据
      const request: ScheduleContracts.CreateScheduleTaskRequestDto = req.body;
      
      // 3. 调用应用服务
      const task = await this.scheduleService.createScheduleTask(accountUuid, request);
      
      return ScheduleController.responseBuilder.sendSuccess(res, task);
    } catch (error) {
      return ScheduleController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message,
      });
    }
  }
}
```

### 关键 API

#### ScheduleTask 相关

```typescript
// 创建调度任务
const task = await scheduleService.createScheduleTask(accountUuid, {
  name: '每日站会提醒',
  description: '团队每日同步会议',
  taskType: ScheduleTaskType.GENERAL_REMINDER,
  payload: {
    type: ScheduleTaskType.GENERAL_REMINDER,
    data: { message: '站会开始了！' },
  },
  scheduledTime: new Date('2025-10-07 09:00:00'),
  recurrence: {
    type: RecurrenceType.DAILY,
    interval: 1,
  },
  priority: SchedulePriority.HIGH,
  alertConfig: {
    methods: [AlertMethod.NOTIFICATION],
    advanceTime: 300, // 提前5分钟
  },
  enabled: true,
});

// 获取调度任务列表
const result = await scheduleService.getScheduleTasks(accountUuid, {
  pagination: { offset: 0, limit: 50 },
  status: [ScheduleStatus.PENDING, ScheduleStatus.RUNNING],
  enabled: true,
});

console.log(result.tasks);     // 任务数组
console.log(result.total);     // 总数
console.log(result.pagination.hasMore); // 是否有更多

// 获取单个任务
const task = await scheduleService.getScheduleTask(accountUuid, taskUuid);

// 更新任务
const updated = await scheduleService.updateScheduleTask(accountUuid, taskUuid, {
  name: '新名称',
  enabled: false,
});

// 删除任务
await scheduleService.deleteScheduleTask(accountUuid, taskUuid);

// 启用/禁用任务
await scheduleService.enableScheduleTask(accountUuid, taskUuid);
await scheduleService.disableScheduleTask(accountUuid, taskUuid);

// 暂停/恢复任务
await scheduleService.pauseScheduleTask(accountUuid, taskUuid);
await scheduleService.resumeScheduleTask(accountUuid, taskUuid);

// 执行任务
const result = await scheduleService.executeScheduleTask(accountUuid, taskUuid);
console.log(result.status);   // COMPLETED / FAILED
console.log(result.duration); // 执行时长（毫秒）
```

#### 批量操作

```typescript
// 批量启用/禁用/删除
const result = await scheduleService.batchOperateScheduleTasks(accountUuid, {
  operation: ScheduleBatchOperationType.ENABLE,
  taskUuids: ['uuid-1', 'uuid-2', 'uuid-3'],
});

console.log(result.successCount); // 成功数量
console.log(result.failedCount);  // 失败数量
```

#### 查询任务

```typescript
// 获取即将执行的任务
const upcoming = await scheduleService.getUpcomingTasks(accountUuid, 60); // 未来60分钟

// 获取执行历史
const history = await scheduleService.getExecutionHistory(accountUuid, taskUuid, {
  offset: 0,
  limit: 20,
});

// 获取统计信息
const stats = await scheduleService.getTaskStatistics(accountUuid);
console.log(stats.totalTasks);
console.log(stats.activeTasks);
console.log(stats.completedTasks);
```

## 📋 数据结构

### CreateScheduleTaskRequestDto

```typescript
{
  name: string;                    // 任务名称
  description?: string;            // 任务描述
  taskType: ScheduleTaskType;      // 任务类型
  payload: {                       // 任务载荷
    type: string;
    data: any;
  };
  scheduledTime: Date;             // 计划执行时间
  recurrence?: {                   // 重复规则（可选）
    type: RecurrenceType;          // daily, weekly, monthly, yearly
    interval: number;              // 间隔
    endDate?: Date;                // 结束日期
    maxOccurrences?: number;       // 最大次数
    daysOfWeek?: number[];         // 星期几（周重复）
    dayOfMonth?: number;           // 每月的第几天
    cronExpression?: string;       // Cron 表达式
  };
  priority?: SchedulePriority;     // 优先级
  alertConfig?: {                  // 提醒配置
    methods: AlertMethod[];        // 提醒方式
    advanceTime?: number;          // 提前时间（秒）
  };
  maxRetries?: number;             // 最大重试次数
  timeoutSeconds?: number;         // 超时时间
  tags?: string[];                 // 标签
  enabled?: boolean;               // 是否启用
}
```

### ScheduleTaskResponseDto

```typescript
{
  uuid: string;
  name: string;
  description?: string;
  taskType: ScheduleTaskType;
  payload: any;
  scheduledTime: Date;
  recurrence?: RecurrenceConfig;
  priority: SchedulePriority;
  status: ScheduleStatus;
  alertConfig?: AlertConfig;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  nextExecutionTime?: Date;
  executionCount: number;
  maxRetries: number;
  currentRetries: number;
  timeoutSeconds?: number;
  tags?: string[];
  enabled: boolean;
}
```

## 🎯 枚举类型

### ScheduleTaskType（任务类型）

```typescript
enum ScheduleTaskType {
  TASK_REMINDER = 'task_reminder',           // 任务提醒
  GOAL_REMINDER = 'goal_reminder',           // 目标提醒
  GENERAL_REMINDER = 'general_reminder',     // 通用提醒
  CUSTOM = 'custom',                         // 自定义任务
}
```

### ScheduleStatus（任务状态）

```typescript
enum ScheduleStatus {
  PENDING = 'pending',       // 等待执行
  RUNNING = 'running',       // 执行中
  COMPLETED = 'completed',   // 已完成
  FAILED = 'failed',         // 失败
  PAUSED = 'paused',         // 已暂停
  CANCELED = 'canceled',     // 已取消
  TIMEOUT = 'timeout',       // 超时
}
```

### SchedulePriority（优先级）

```typescript
enum SchedulePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}
```

### RecurrenceType（重复类型）

```typescript
enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}
```

### AlertMethod（提醒方式）

```typescript
enum AlertMethod {
  NOTIFICATION = 'notification',   // 系统通知
  EMAIL = 'email',                 // 邮件
  SMS = 'sms',                     // 短信
  WEBHOOK = 'webhook',             // Webhook
}
```

## ⚠️ 重要注意事项

### 1. accountUuid 参数
所有方法都需要 `accountUuid` 作为第一个参数，确保多租户数据隔离。

```typescript
// ✅ 正确
await scheduleService.createScheduleTask(accountUuid, request);

// ❌ 错误 - 缺少 accountUuid
await scheduleService.createScheduleTask(request);
```

### 2. DI Container 使用
通过 `ScheduleContainer` 获取服务实例，确保依赖注入正确。

```typescript
// ✅ 正确
const container = ScheduleContainer.getInstance(prisma);
const service = container.scheduleApplicationService;

// ❌ 错误 - 直接实例化
const service = new ScheduleApplicationService(...);
```

### 3. 时间处理
所有时间字段都使用 `Date` 对象，确保时区正确。

```typescript
// ✅ 正确
scheduledTime: new Date('2025-10-07 09:00:00')

// ⚠️ 注意时区
scheduledTime: new Date(timestamp) // 确保 timestamp 正确
```

### 4. 重复规则验证
创建带重复规则的任务时，确保参数合理：

```typescript
// ✅ 每天重复
recurrence: {
  type: RecurrenceType.DAILY,
  interval: 1,
  endDate: new Date('2025-12-31'),
}

// ✅ 每周一、三、五
recurrence: {
  type: RecurrenceType.WEEKLY,
  interval: 1,
  daysOfWeek: [1, 3, 5], // 0=周日, 1=周一...
}

// ❌ 错误 - interval 必须 > 0
recurrence: {
  type: RecurrenceType.DAILY,
  interval: 0,
}
```

## 🗂️ 文件位置

```
apps/api/src/modules/schedule/
├── domain/
│   ├── services/
│   │   └── ScheduleDomainService.ts           # 领域服务
│   └── events/
│       └── ScheduleEvents.ts                  # 领域事件
├── infrastructure/
│   ├── repositories/
│   │   └── PrismaScheduleTaskRepository.ts    # Prisma 仓储
│   ├── scheduler/
│   │   └── ScheduleTaskScheduler.ts           # 调度器
│   └── di/
│       └── ScheduleContainer.ts               # DI 容器
├── application/
│   ├── services/
│   │   └── ScheduleApplicationService.ts      # 应用服务
│   └── eventHandlers/
│       └── ReminderInstanceCreatedHandler.ts  # 事件处理器
└── interface/
    └── http/
        ├── controllers/
        │   └── scheduleController.ts          # HTTP 控制器
        └── routes.ts                          # 路由配置

packages/domain-server/src/schedule/
├── aggregates/
│   └── ScheduleTask.ts                        # 聚合根
└── repositories/
    └── IScheduleTaskRepository.ts             # 仓储接口
```

## 📦 依赖包

```
@dailyuse/domain-server   # 领域模型和仓储接口
@dailyuse/domain-core     # 核心领域逻辑
@dailyuse/contracts       # API 契约
@dailyuse/utils          # 工具函数
@prisma/client           # 数据库客户端
```

## 🎓 相关文档

- [Schedule 模块架构状态分析](./SCHEDULE_MODULE_REFACTORING_STATUS.md)
- [DDD 架构文档](../systems/DDD_ARCHITECTURE.md)
- [Reminder 模块参考](./REMINDER_MODULE_QUICK_REFERENCE.md)

## 💡 最佳实践

1. **始终通过 ApplicationService 调用**
   - Controller 不直接调用 DomainService 或 Repository
   - 保持分层清晰

2. **使用事务处理复杂操作**
   ```typescript
   await prisma.$transaction(async (tx) => {
     await createTask(tx);
     await createReminder(tx);
   });
   ```

3. **错误处理**
   ```typescript
   try {
     await scheduleService.createScheduleTask(accountUuid, request);
   } catch (error) {
     if (error.message.includes('已存在')) {
       // 处理重复创建
     }
     logger.error('创建任务失败', error);
   }
   ```

4. **日志记录**
   ```typescript
   logger.debug('Creating schedule task', { accountUuid, request });
   logger.info('Schedule task created', { taskUuid });
   logger.error('Failed to create task', error);
   ```

---

**快速提示**:
- ✅ Schedule 模块架构完善，无编译错误
- ✅ 支持丰富的调度功能（重复、优先级、重试等）
- ✅ 完整的 DDD 分层架构
- ⏳ 仓储层可优化为返回聚合根实例（可选改进）
