# Schedule 模块设计文档

## 📋 模块目标

Schedule 模块是一个高性能、高可用性的任务调度基础模块，为 Goal、Task、Reminder 等业务模块提供：

- ✅ 基于 Cron 表达式的灵活调度（支持单次和重复任务）
- ✅ 自定义 Payload 支持（业务数据由发起方和接收方协调）
- ✅ 事件驱动的解耦架构（通过事件总线与其他模块通信）
- ✅ 任务生命周期管理（创建、暂停、恢复、删除）
- ✅ 执行历史和统计追踪
- ✅ 任务重试机制
- ✅ 高可复用性设计

## 🏗️ DDD 架构设计

### 聚合根 (Aggregate Roots)

#### 1. **ScheduleTask** - 调度任务聚合根
- **职责**: 管理单个调度任务的完整生命周期
- **核心属性**:
  - `uuid`: 任务唯一标识
  - `name`: 任务名称
  - `description`: 任务描述
  - `sourceModule`: 来源模块（如 'reminder', 'task', 'goal'）
  - `sourceEntityId`: 来源实体ID（用于关联业务对象）
  - `cronExpression`: Cron 表达式
  - `status`: 任务状态（ACTIVE, PAUSED, COMPLETED, CANCELLED, FAILED）
  - `enabled`: 是否启用
  - `metadata`: JSON 元数据（自定义业务数据）
  - `schedule`: 调度配置（值对象）
  - `execution`: 执行信息（值对象）
- **核心方法**:
  - `create()`: 创建新任务
  - `pause()`: 暂停任务
  - `resume()`: 恢复任务
  - `complete()`: 完成任务
  - `cancel()`: 取消任务
  - `fail()`: 标记失败
  - `recordExecution()`: 记录执行
  - `updateSchedule()`: 更新调度配置
  - `updateMetadata()`: 更新元数据

#### 2. **ScheduleStatistics** - 调度统计聚合根
- **职责**: 管理整个调度系统的统计数据
- **核心属性**:
  - `accountUuid`: 账户UUID
  - `totalTasks`: 总任务数
  - `activeTasks`: 活跃任务数
  - `pausedTasks`: 暂停任务数
  - `completedTasks`: 完成任务数
  - `failedTasks`: 失败任务数
  - `totalExecutions`: 总执行次数
  - `successfulExecutions`: 成功执行次数
  - `failedExecutions`: 失败执行次数
  - `avgExecutionDuration`: 平均执行时长
  - `moduleStatistics`: 按模块统计（Map<模块名, 统计数据>）
- **核心方法**:
  - `incrementTaskCount()`: 增加任务计数
  - `decrementTaskCount()`: 减少任务计数
  - `recordExecution()`: 记录执行统计
  - `updateModuleStats()`: 更新模块统计

### 实体 (Entities)

#### 1. **ScheduleExecution** - 执行记录实体
- **职责**: 记录单次任务执行的详细信息
- **核心属性**:
  - `uuid`: 执行记录ID
  - `taskUuid`: 关联任务ID
  - `executionTime`: 执行时间
  - `status`: 执行状态（SUCCESS, FAILED, SKIPPED, TIMEOUT）
  - `duration`: 执行时长（毫秒）
  - `result`: 执行结果（JSON）
  - `error`: 错误信息
  - `retryCount`: 重试次数
- **核心方法**:
  - `create()`: 创建执行记录
  - `markSuccess()`: 标记成功
  - `markFailed()`: 标记失败
  - `incrementRetry()`: 增加重试次数

### 值对象 (Value Objects)

#### 1. **ScheduleConfig** - 调度配置
- **属性**:
  - `cronExpression`: Cron 表达式
  - `timezone`: 时区（默认 UTC）
  - `startDate`: 开始日期（可选）
  - `endDate`: 结束日期（可选）
  - `maxExecutions`: 最大执行次数（可选，null 表示无限）
- **方法**:
  - `equals()`: 比较相等性
  - `validate()`: 验证有效性
  - `calculateNextRun()`: 计算下次执行时间
  - `isExpired()`: 是否已过期

#### 2. **ExecutionInfo** - 执行信息
- **属性**:
  - `nextRunAt`: 下次执行时间
  - `lastRunAt`: 上次执行时间
  - `executionCount`: 已执行次数
  - `lastExecutionStatus`: 上次执行状态
  - `lastExecutionDuration`: 上次执行时长
  - `consecutiveFailures`: 连续失败次数
- **方法**:
  - `equals()`: 比较相等性
  - `updateAfterExecution()`: 执行后更新
  - `resetFailures()`: 重置失败计数

#### 3. **RetryPolicy** - 重试策略
- **属性**:
  - `enabled`: 是否启用重试
  - `maxRetries`: 最大重试次数
  - `retryDelay`: 重试延迟（毫秒）
  - `backoffMultiplier`: 退避倍数（指数退避）
  - `maxRetryDelay`: 最大重试延迟
- **方法**:
  - `equals()`: 比较相等性
  - `shouldRetry()`: 是否应该重试
  - `calculateNextRetryDelay()`: 计算下次重试延迟

#### 4. **TaskMetadata** - 任务元数据
- **属性**:
  - `payload`: 业务数据（JSON）
  - `tags`: 标签列表
  - `priority`: 优先级（LOW, NORMAL, HIGH, URGENT）
  - `timeout`: 超时时间（毫秒）
- **方法**:
  - `equals()`: 比较相等性
  - `validate()`: 验证有效性

#### 5. **ModuleStatistics** - 模块统计
- **属性**:
  - `moduleName`: 模块名称
  - `totalTasks`: 总任务数
  - `activeTasks`: 活跃任务数
  - `totalExecutions`: 总执行次数
  - `successRate`: 成功率
  - `avgDuration`: 平均执行时长
- **方法**:
  - `equals()`: 比较相等性
  - `update()`: 更新统计

## 📊 枚举类型

### ScheduleTaskStatus
```typescript
enum ScheduleTaskStatus {
  ACTIVE = 'ACTIVE',         // 活跃
  PAUSED = 'PAUSED',         // 暂停
  COMPLETED = 'COMPLETED',   // 完成
  CANCELLED = 'CANCELLED',   // 取消
  FAILED = 'FAILED',         // 失败
}
```

### ExecutionStatus
```typescript
enum ExecutionStatus {
  SUCCESS = 'SUCCESS',       // 成功
  FAILED = 'FAILED',         // 失败
  SKIPPED = 'SKIPPED',       // 跳过
  TIMEOUT = 'TIMEOUT',       // 超时
  RETRYING = 'RETRYING',     // 重试中
}
```

### TaskPriority
```typescript
enum TaskPriority {
  LOW = 'LOW',               // 低
  NORMAL = 'NORMAL',         // 普通
  HIGH = 'HIGH',             // 高
  URGENT = 'URGENT',         // 紧急
}
```

## 🔄 事件定义

### 领域事件

#### 1. **ScheduleTaskCreated** - 任务创建事件
```typescript
{
  taskUuid: string;
  sourceModule: string;
  sourceEntityId: string;
  cronExpression: string;
  timestamp: Date;
}
```

#### 2. **ScheduleTaskPaused** - 任务暂停事件
```typescript
{
  taskUuid: string;
  sourceModule: string;
  sourceEntityId: string;
  timestamp: Date;
}
```

#### 3. **ScheduleTaskResumed** - 任务恢复事件
```typescript
{
  taskUuid: string;
  sourceModule: string;
  sourceEntityId: string;
  timestamp: Date;
}
```

#### 4. **ScheduleTaskCompleted** - 任务完成事件
```typescript
{
  taskUuid: string;
  sourceModule: string;
  sourceEntityId: string;
  totalExecutions: number;
  timestamp: Date;
}
```

#### 5. **ScheduleTaskCancelled** - 任务取消事件
```typescript
{
  taskUuid: string;
  sourceModule: string;
  sourceEntityId: string;
  reason: string;
  timestamp: Date;
}
```

#### 6. **ScheduleTaskExecuted** - 任务执行事件
```typescript
{
  taskUuid: string;
  executionUuid: string;
  sourceModule: string;
  sourceEntityId: string;
  status: ExecutionStatus;
  duration: number;
  timestamp: Date;
  payload: any; // 传递给业务模块的数据
}
```

#### 7. **ScheduleTaskFailed** - 任务失败事件
```typescript
{
  taskUuid: string;
  executionUuid: string;
  sourceModule: string;
  sourceEntityId: string;
  error: string;
  consecutiveFailures: number;
  willRetry: boolean;
  timestamp: Date;
}
```

## 🔗 与其他模块的集成

### Reminder 模块示例

1. **ReminderTemplate 启用时**:
   - Reminder 发布 `ReminderTemplateEnabled` 事件
   - Schedule 监听并创建 `ScheduleTask`
   - 设置 `sourceModule: 'reminder'`, `sourceEntityId: templateUuid`
   - 设置 metadata 包含提醒配置

2. **ReminderTemplate 禁用时**:
   - Reminder 发布 `ReminderTemplateDisabled` 事件
   - Schedule 监听并暂停对应的 `ScheduleTask`

3. **ReminderTemplate 删除时**:
   - Reminder 发布 `ReminderTemplateDeleted` 事件
   - Schedule 监听并删除对应的 `ScheduleTask`

4. **Schedule 触发执行时**:
   - Schedule 发布 `ScheduleTaskExecuted` 事件
   - Reminder 监听并创建 `ReminderInstance`
   - Notification 监听并发送通知

### Goal 模块示例

1. **Goal 设置截止日期提醒**:
   - Goal 发布 `GoalDeadlineSet` 事件
   - Schedule 创建单次任务（特殊的 cron）
   - 在截止日期触发提醒

2. **Goal 定期检查进度**:
   - Goal 发布 `GoalProgressCheckRequested` 事件
   - Schedule 创建重复任务
   - 定期发布 `ScheduleTaskExecuted` 触发进度检查

## 📐 数据库 Schema 设计

### schedule_tasks 表
```prisma
model ScheduleTask {
  uuid             String    @id @default(cuid())
  name             String
  description      String?
  sourceModule     String    @map("source_module")
  sourceEntityId   String    @map("source_entity_id")
  cronExpression   String    @map("cron_expression")
  status           String    @default("ACTIVE")
  enabled          Boolean   @default(true)
  
  // 调度配置（JSON）
  scheduleConfig   Json      @map("schedule_config")
  
  // 执行信息（JSON）
  executionInfo    Json      @map("execution_info")
  
  // 重试策略（JSON）
  retryPolicy      Json      @map("retry_policy")
  
  // 任务元数据（JSON）
  metadata         Json
  
  // 时间戳
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  
  // 关联
  executions       ScheduleExecution[]
  
  @@index([sourceModule, sourceEntityId])
  @@index([status])
  @@index([enabled])
  @@map("schedule_tasks")
}
```

### schedule_executions 表
```prisma
model ScheduleExecution {
  uuid           String    @id @default(cuid())
  taskUuid       String    @map("task_uuid")
  executionTime  DateTime  @map("execution_time")
  status         String
  duration       Int?      @map("duration_ms")
  result         Json?
  error          String?
  retryCount     Int       @default(0) @map("retry_count")
  createdAt      DateTime  @default(now()) @map("created_at")
  
  // 关联
  task           ScheduleTask @relation(fields: [taskUuid], references: [uuid], onDelete: Cascade)
  
  @@index([taskUuid])
  @@index([status])
  @@index([executionTime])
  @@map("schedule_executions")
}
```

### schedule_statistics 表
```prisma
model ScheduleStatistics {
  id                     Int      @id @default(autoincrement())
  accountUuid            String   @unique @map("account_uuid")
  
  // 任务统计
  totalTasks             Int      @default(0) @map("total_tasks")
  activeTasks            Int      @default(0) @map("active_tasks")
  pausedTasks            Int      @default(0) @map("paused_tasks")
  completedTasks         Int      @default(0) @map("completed_tasks")
  failedTasks            Int      @default(0) @map("failed_tasks")
  
  // 执行统计
  totalExecutions        Int      @default(0) @map("total_executions")
  successfulExecutions   Int      @default(0) @map("successful_executions")
  failedExecutions       Int      @default(0) @map("failed_executions")
  avgExecutionDuration   Float    @default(0) @map("avg_execution_duration")
  
  // 模块统计（JSON）
  moduleStatistics       Json     @map("module_statistics")
  
  // 时间戳
  lastUpdatedAt          DateTime @default(now()) @map("last_updated_at")
  createdAt              DateTime @default(now()) @map("created_at")
  
  @@index([accountUuid])
  @@map("schedule_statistics")
}
```

## 🚀 实现顺序

按照 Contract First 原则：

1. **Contracts 层** (`packages/contracts/src/modules/schedule/`)
   - ✅ 枚举类型 (`enums.ts`)
   - ✅ 值对象接口 (`value-objects/`)
   - ✅ 实体接口 (`entities/`)
   - ✅ 聚合根接口 (`aggregates/`)
   - ✅ API 请求/响应 (`api-requests.ts`)

2. **Domain-Server 层** (`packages/domain-server/src/schedule/`)
   - ✅ 值对象实现
   - ✅ 实体实现
   - ✅ 聚合根实现
   - ✅ 领域事件
   - ✅ 领域服务

3. **API 层** (`apps/api/src/modules/schedule/`)
   - ✅ Prisma Repository
   - ✅ Application Services
   - ✅ Controllers
   - ✅ Routes

4. **Domain-Client 层** (`packages/domain-client/src/schedule/`)
   - ✅ 客户端聚合根
   - ✅ 客户端值对象
   - ✅ 状态管理

5. **Web 层** (`apps/web/src/modules/schedule/`)
   - ✅ API Client
   - ✅ 组件
   - ✅ 页面

## 📝 关键设计决策

### 1. Cron vs 精确时间
- **决策**: 使用 Cron 表达式统一处理
- **原因**: 
  - 单次任务可表示为特殊的 cron（如 `0 15 10 25 12 2025`）
  - 重复任务天然支持
  - 工具库成熟（node-cron, cron-parser）

### 2. Payload 存储
- **决策**: 使用 JSON 字段存储在 metadata 中
- **原因**:
  - 灵活性：支持任意业务数据结构
  - 解耦性：Schedule 不关心具体业务数据
  - 可扩展：各模块可定义自己的 schema

### 3. 执行历史
- **决策**: 使用独立的 ScheduleExecution 实体
- **原因**:
  - 分离关注点：任务配置与执行记录分离
  - 查询效率：独立索引和查询
  - 数据量管理：可定期归档历史记录

### 4. 统计信息
- **决策**: 使用独立的 ScheduleStatistics 聚合根
- **原因**:
  - 性能优化：避免实时统计
  - 批量更新：定期批量更新统计
  - 多维度分析：支持按模块、时间等维度统计

### 5. 事件驱动
- **决策**: 通过事件总线与其他模块通信
- **原因**:
  - 解耦：模块间无直接依赖
  - 扩展性：新模块可轻松集成
  - 可靠性：事件持久化和重试

## 🎯 下一步行动

现在开始实现第一步：**创建 Contracts 层的类型定义**

按照顺序：
1. enums.ts
2. value-objects/
3. entities/
4. aggregates/
5. api-requests.ts
6. index.ts
