# Reminder 模块 Cron 调度架构迁移总结

**日期**: 2025-10-06  
**状态**: 🟡 核心架构完成，等待数据库迁移

---

## 📋 总体目标

将 Reminder 模块从基于 ReminderInstance 的实例管理系统迁移到基于 cron 的 **RecurringScheduleTask** 调度系统。

### 架构变更对比

| 旧架构                               | 新架构                           |
| ------------------------------------ | -------------------------------- |
| ReminderTemplate + ReminderInstance  | ReminderTemplate + RecurringScheduleTask |
| 手动生成实例（未来 N 天）            | Cron 自动调度                    |
| 实例存储在数据库中                  | 调度任务存储在内存 + 数据库      |
| getNextTriggerTime() 计算逻辑       | cron-parser 解析                |
| createInstance() 方法               | Schedule 模块自动触发            |

---

## ✅ 已完成工作

### 1. 依赖安装
- ✅ `cron-parser` ^5.4.0 - Cron 表达式解析
- ✅ `cronstrue` ^3.3.0 - 人类可读的 cron 描述

### 2. Contracts 定义
**文件**: `packages/contracts/src/modules/schedule/`

#### 枚举类型 (`enums.ts`)
```typescript
export enum ScheduleTaskStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TriggerType {
  CRON = 'CRON',
  ONCE = 'ONCE',
}
```

#### DTO 接口 (`dtos.ts`)
- `ScheduleExecutionHistory` - 执行历史记录
- `RecurringScheduleTaskDTO` - 完整任务表示
- `CreateScheduleTaskDTO` - 创建 payload
- `UpdateScheduleTaskDTO` - 更新 payload

#### 事件接口 (`events.ts`)
- `ScheduleTaskTriggeredEvent` - 任务触发事件
- `ScheduleTaskCompletedEvent` - 任务完成事件

### 3. Domain Core 层
**文件**: `packages/domain-core/src/schedule/aggregates/RecurringScheduleTask.ts`

- **聚合根实现** (359 lines)
  - 18 个私有字段
  - 工厂方法: `create()`, `fromDTO()`
  - 业务方法: `enable()`, `disable()`, `pause()`, `resume()`, `cancel()`, `complete()`
  - `recordExecution()` - 执行历史追踪（保留最近 10 次）
  - `setNextRunAt()` - 设置下次执行时间

### 4. Domain Server 层
**文件**: `packages/domain-server/src/schedule/services/`

#### SchedulerService.ts (245 lines)
```typescript
@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private tasks: Map<string, RecurringScheduleTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  registerTask(task: RecurringScheduleTask): void
  unregisterTask(taskId: string): void
  updateTask(task: RecurringScheduleTask): void
  enableTask(taskId: string): void
  disableTask(taskId: string): void
  private scheduleTask(task: RecurringScheduleTask): void
  private executeTask(taskId: string): void
  private calculateNextRunTime(task: RecurringScheduleTask): Date | null
}
```

**核心功能**:
- 使用 `cron-parser` 的 `parseExpression()` 计算下次执行时间
- 使用 `setTimeout()` 进行定时调度
- 自动重新调度 CRON 类型任务
- 发布事件 `ScheduleTaskTriggeredEvent`

#### RecurringScheduleTaskDomainService.ts (165 lines)
```typescript
@Injectable()
export class RecurringScheduleTaskDomainService {
  createTask(dto: CreateScheduleTaskDTO): Promise<RecurringScheduleTaskDTO>
  updateTask(uuid: string, dto: UpdateScheduleTaskDTO): Promise<RecurringScheduleTaskDTO>
  deleteTask(uuid: string): Promise<void>
  findBySource(sourceModule: string, sourceEntityId: string): Promise<RecurringScheduleTask[]>
  deleteBySource(sourceModule: string, sourceEntityId: string): Promise<void>
  loadAndStartEnabledTasks(): Promise<void>
}
```

#### cronHelper.ts (145 lines)
```typescript
export function timeConfigToCronExpression(
  timeConfig: ReminderContracts.ReminderTimeConfig,
): string | null

export function describeCron(cronExpression: string): string
```

**支持的转换**:
- `daily` → `"0 MM HH * * *"`
- `weekly` → `"0 MM HH * * 0,1,2..."`
- `monthly` → `"0 MM HH 1,2,3... * *"`
- `custom` → 限制支持（仅能整除的间隔，如 */15 分钟）

### 5. ReminderTemplate 重构
**文件**: `packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts`

#### 删除的代码 (~200 lines)
- ❌ `instances: ReminderInstance[]` 数组
- ❌ `createInstance()` 方法
- ❌ `getInstance()` 方法
- ❌ `removeInstance()` 方法
- ❌ `getNextTriggerTime()` 计算逻辑
- ❌ 6 个 `calculate*Trigger()` 方法
- ❌ `triggerReminder()` 方法

#### 新增的集成方法
```typescript
class ReminderTemplate {
  toCronExpression(): string | null
  getScheduleTaskMetadata(): Record<string, any>
  shouldCreateScheduleTask(): boolean
  getScheduleTaskName(): string
  handleScheduleTrigger(params: { ... }): void
}
```

#### ReminderTemplateCore 更新
**文件**: `packages/domain-core/src/reminder/aggregates/ReminderTemplateCore.ts`

- ❌ 删除 `abstract instances: ReminderInstanceCore[]`
- ❌ 删除 `abstract createInstance()`
- ❌ 删除 `abstract getInstance()`
- ❌ 删除 `abstract removeInstance()`
- ✅ 更新 `effectivenessScore` 计算逻辑
- ✅ 更新 `calculateConsistencyScore()` 基于 analytics

### 6. 事件监听器
**文件**: `apps/api/src/modules/reminder/listeners/ReminderTemplateScheduleSyncListener.ts`

```typescript
@Injectable()
export class ReminderTemplateScheduleSyncListener {
  @OnEvent('ReminderTemplateCreated')
  async handleTemplateCreated(event): Promise<void>
  
  @OnEvent('ReminderTemplateStatusChanged')
  async handleTemplateStatusChanged(event): Promise<void>
  
  @OnEvent('ReminderTemplateTimeConfigChanged')
  async handleTimeConfigChanged(event): Promise<void>
  
  @OnEvent('ReminderTemplateDeleted')
  async handleTemplateDeleted(event): Promise<void>
  
  @OnEvent('ReminderTemplateBatchUpdated')
  async handleBatchUpdated(event): Promise<void>
}
```

**功能**:
- 自动创建 RecurringScheduleTask（模板创建时）
- 自动更新调度任务（时间配置变化）
- 自动启用/禁用任务（状态变化）
- 自动删除任务（模板删除）

### 7. API 层更新
**文件**: `apps/api/src/modules/reminder/`

#### Controller 更新
- ✅ 简化 `createTemplate()` - 移除自动生成实例参数
- ✅ 删除 `getActiveTemplates()` - 获取活跃实例
- ✅ 删除 `generateInstancesAndSchedules()` - 生成实例
- ✅ 添加 `getScheduleStatus()` - 获取调度状态

#### ApplicationService 更新
```typescript
class ReminderApplicationService {
  async createTemplate(
    accountUuid: string,
    request: CreateReminderTemplateRequest,
  ): Promise<any>  // 移除 options 参数
}
```

#### DomainService 更新
```typescript
class ReminderTemplateDomainService {
  async createReminderTemplate(
    accountUuid: string,
    request: CreateReminderTemplateRequest,
  ): Promise<ReminderTemplateResponse>  // 移除生成实例逻辑
  
  // 删除 generateInstances() 方法
}
```

#### Routes 更新
- ❌ 删除 `GET /reminders/templates/active`
- ❌ 删除 `POST /reminders/templates/:templateUuid/generate-instances`
- ✅ 添加 `GET /reminders/templates/:templateUuid/schedule-status`

---

## ⏳ 待完成工作

### Task 8: 数据库迁移 (IN PROGRESS)

#### Prisma Schema 更改
```prisma
model ReminderTemplate {
  // ... 其他字段保持不变
  - instances  ReminderInstance[]  // ❌ 删除
  - schedules  ReminderSchedule[]  // ❌ 删除
}

- model ReminderInstance { ... }  // ❌ 删除整个模型
- model ReminderSchedule { ... }  // ❌ 删除整个模型

+ model RecurringScheduleTask {  // ✅ 新增
+   uuid             String    @id
+   name             String
+   description      String?
+   triggerType      String    // "CRON" | "ONCE"
+   cronExpression   String?
+   scheduledTime    DateTime?
+   status           String    // "ACTIVE" | "PAUSED" | ...
+   enabled          Boolean
+   sourceModule     String    // "reminder"
+   sourceEntityId   String    // templateUuid
+   metadata         String    // JSON
+   nextRunAt        DateTime?
+   lastRunAt        DateTime?
+   executionCount   Int
+   executionHistory String    // JSON 数组
+   version          Int
+   createdAt        DateTime
+   updatedAt        DateTime
+   
+   @@index([sourceModule, sourceEntityId])
+   @@index([status])
+   @@index([enabled])
+   @@index([nextRunAt])
+   @@map("recurring_schedule_tasks")
+ }
```

#### 迁移步骤
1. 更新 `schema.prisma`
2. 运行 `prisma migrate dev --name remove-instances-add-schedule-tasks`
3. 创建数据迁移脚本（如果需要保留旧数据）
4. 更新 Account 模型，删除 `reminderInstances` 和 `reminderSchedules` 关系

### Task 9: 前端重构

#### 删除的组件
- `ReminderInstanceList.vue` - 实例列表
- `TemplateDesktopCard` 中的"生成实例"按钮

#### 新增的组件
- `ScheduleTaskStatus.vue` - 显示调度状态
  - 下次执行时间
  - 上次执行时间
  - 执行次数
  - Cron 表达式描述
  - 最近执行历史

#### 更新的 API 调用
```typescript
// ❌ 删除
GET /api/reminders/templates/active

// ✅ 新增
GET /api/reminders/templates/:id/schedule-status
```

### Task 10: 集成测试

#### 测试场景
1. **Daily 提醒**
   - 创建每天 9:00 的提醒
   - 验证 cron: `0 0 9 * * *`
   - 验证触发时间准确性

2. **Weekly 提醒**
   - 创建每周一、三、五 14:00 的提醒
   - 验证 cron: `0 0 14 * * 1,3,5`
   - 验证 weekdays 选择

3. **Monthly 提醒**
   - 创建每月 1 号、15 号 10:00 的提醒
   - 验证 cron: `0 0 10 1,15 * *`
   - 验证 monthDays 选择

4. **启用/禁用**
   - 测试模板启用/禁用
   - 验证调度任务同步更新

5. **删除模板**
   - 测试模板删除
   - 验证关联的调度任务被删除

6. **时间配置更新**
   - 测试更新时间配置
   - 验证 cron 表达式更新
   - 验证下次执行时间重新计算

---

## 🔧 开发注意事项

### 事件发布机制

当前实现中，事件监听器 `ReminderTemplateScheduleSyncListener` 需要依赖 NestJS 的 `EventEmitter2` 来接收事件。确保：

1. Reminder 模块正确发布领域事件
2. EventEmitter2 模块已注册
3. 监听器已在模块中注册

### Repository 实现

需要为 `RecurringScheduleTask` 实现 repository：

**接口**: `packages/domain-server/src/schedule/repositories/IRecurringScheduleTaskRepository.ts`

```typescript
export interface IRecurringScheduleTaskRepository {
  save(task: RecurringScheduleTask): Promise<RecurringScheduleTask>;
  findByUuid(uuid: string): Promise<RecurringScheduleTask | null>;
  findBySource(sourceModule: string, sourceEntityId: string): Promise<RecurringScheduleTask[]>;
  findAllEnabled(): Promise<RecurringScheduleTask[]>;
  findAll(): Promise<RecurringScheduleTask[]>;
  delete(uuid: string): Promise<void>;
  update(task: RecurringScheduleTask): Promise<RecurringScheduleTask>;
}
```

**实现**: `apps/api/src/modules/schedule/infrastructure/repositories/RecurringScheduleTaskRepository.ts`（待创建）

### Cron 格式限制

cronHelper 对 custom interval 的支持有限：
- ✅ 支持：能整除的间隔（如 */15 分钟）
- ❌ 不支持：不能整除的间隔（如每 7 分钟）

对于不支持的 custom interval，可能需要：
1. 使用 `setInterval` 而非 cron
2. 在 SchedulerService 中特殊处理
3. 或者限制用户只能选择支持的间隔

---

## 📊 技术决策记录

### 1. 为什么使用 6 字段 cron 格式？
标准 cron 是 5 字段（分 时 日 月 周），但 `cron-parser` 支持 6 字段（秒 分 时 日 月 周）。

**决策**: 使用 6 字段格式
- 原因：更精确的调度（可以到秒级）
- 影响：所有 cron 表达式都以 "0" 开头（秒字段）

### 2. 为什么不使用 @nestjs/schedule？
NestJS 自带 `@nestjs/schedule` 包，也支持 cron。

**决策**: 使用自定义 SchedulerService
- 原因：
  - 需要动态注册/注销任务
  - 需要持久化任务状态
  - 需要自定义元数据和执行历史
  - `@nestjs/schedule` 主要用于静态定时任务

### 3. 为什么执行历史只保留 10 条？
每次执行都会记录到 `executionHistory` 数组。

**决策**: 限制为 10 条
- 原因：
  - 避免 JSON 字段过大
  - 10 条足够分析最近趋势
  - 减少数据库存储压力
- 如需完整历史，可创建单独的 `ScheduleTaskExecutionLog` 表

### 4. 为什么使用 source-based 关联？
调度任务通过 `sourceModule + sourceEntityId` 关联源实体。

**决策**: 使用 source-based 而非外键
- 原因：
  - 支持多个模块使用 Schedule（Goal, Task, Habit...）
  - 避免循环依赖
  - 更灵活的架构

---

## 🚀 下一步行动

1. **数据库迁移** (Priority: HIGH)
   - 更新 Prisma schema
   - 创建迁移文件
   - 测试迁移脚本

2. **Repository 实现** (Priority: HIGH)
   - 实现 RecurringScheduleTaskRepository
   - 集成 Prisma Client
   - 单元测试

3. **事件集成测试** (Priority: MEDIUM)
   - 测试事件监听器
   - 验证调度任务自动创建

4. **前端更新** (Priority: MEDIUM)
   - 删除实例相关 UI
   - 添加调度状态显示

5. **集成测试** (Priority: MEDIUM)
   - E2E 测试
   - 性能测试

---

## 📝 相关文档

- [Cron Parser 文档](https://www.npmjs.com/package/cron-parser)
- [Cronstrue 文档](https://www.npmjs.com/package/cronstrue)
- [Reminder 模块架构](./REMINDER_MODULE_ARCHITECTURE.md)
- [Schedule 模块设计](./SCHEDULE_MODULE_DESIGN.md)

---

**最后更新**: 2025-10-06  
**下次审查**: 数据库迁移完成后
