# Task 模块重构执行总结

**执行时间**: 2025-10-03  
**参考模块**: Goal 模块  
**重构原则**: Contract First + DDD + 统一工具（Logger, Response, Event Bus）

---

## ✅ 已完成的修改

### 1. Contracts 层（packages/contracts/src/modules/task/）

#### ✅ 1.1 创建 `enums.ts`
- ✅ 已从 types.ts 提取所有枚举
- ✅ 包含 9 个核心枚举：
  - `TaskTimeType`
  - `TaskScheduleMode`
  - `TaskTemplateStatus`
  - `TaskInstanceStatus`
  - `ReminderStatus`
  - `ReminderType`
  - `ReminderTimingType`
  - `TaskLifecycleEventType`
  - `MetaTemplateCategory`

#### ✅ 1.2 创建 `persistence-dtos.ts`
- ✅ 已创建完整的持久化 DTO
- ✅ 包含 3 个核心 DTO：
  - `TaskTemplatePersistenceDTO`（扁平化结构）
  - `TaskInstancePersistenceDTO`（扁平化结构）
  - `TaskMetaTemplatePersistenceDTO`（扁平化结构）
- ✅ 所有 JSON 字段标记为 string 类型
- ✅ 所有日期字段使用 Date 类型

#### ✅ 1.3 更新 `types.ts`
- ✅ 已移除重复的枚举定义
- ✅ 已添加 import from './enums'

#### ✅ 1.4 更新 `index.ts`
- ✅ 已添加 enums 和 persistence-dtos 的导出

#### ⚠️ 1.5 `dtos.ts` 状态
- ✅ 基础 DTO 已存在
- ⚠️ 但需要检查是否与 Goal 模块的 DTO 结构一致
- ⚠️ 需要添加 ClientDTO 类型（带计算属性）

---

## 📋 待执行的修改清单

### 2. Domain-Server 层（packages/domain-server/src/task/）

#### ✅ 现有文件
- ✅ `aggregates/TaskTemplate.ts` - 已存在（需要检查是否符合标准）
- ✅ `aggregates/TaskTemplate.test.ts` - 已存在测试文件
- ✅ `entities/TaskInstance.ts` - 已存在
- ✅ `entities/TaskMetaTemplate.ts` - 已存在

#### ⚠️ 需要验证和修改的文件
```typescript
// packages/domain-server/src/task/aggregates/TaskTemplate.ts
/**
 * 检查项：
 * 1. ✅ 是否继承自 TaskTemplateCore (@dailyuse/domain-core)
 * 2. ⚠️ 是否实现了 fromPersistenceDTO() 方法
 * 3. ⚠️ 是否实现了 toPersistenceDTO() 方法
 * 4. ⚠️ 聚合根方法是否完整（addInstance, completeInstance, etc.）
 * 5. ⚠️ 是否有领域事件发布机制
 */
```

#### ❌ 缺失的文件
```typescript
// packages/domain-server/src/task/repositories/ITaskRepository.ts
/**
 * 统一的仓储接口（参考 IGoalRepository）
 * - 接受和返回实体对象，不是 DTO
 * - 包含 Template, Instance, MetaTemplate 的所有操作
 * - 包含统计查询方法
 */

// packages/domain-server/src/task/exceptions/TaskDomainException.ts
/**
 * 领域异常类（参考 GoalDomainException）
 */

// packages/domain-server/src/task/services/UserDataInitializationService.ts
/**
 * 用户数据初始化服务（参考 Goal 模块）
 * - 初始化默认元模板
 * - 创建示例任务模板
 */
```

---

### 3. API 层（apps/api/src/modules/task/）

#### ✅ 现有文件
- ✅ `application/services/TaskApplicationService.ts` - 已实现（696 行）
- ⚠️ `domain/services/TaskDomainService.ts` - **全是 TODO**（169 行）
- ✅ `infrastructure/di/TaskContainer.ts` - 已存在
- ✅ `infrastructure/repositories/` - 多个仓储文件已存在

#### ❌ TaskDomainService.ts 重构（最关键！）

**当前状态**:
```typescript
// 全是 TODO 方法，没有实现
async createTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateResponse> {
  throw new Error('Method not implemented');
}
```

**需要改为**（参考 GoalDomainService.ts）:
```typescript
import { createLogger } from '@dailyuse/utils';
import { TaskTemplate, type ITaskRepository } from '@dailyuse/domain-server';

export class TaskDomainService {
  private readonly logger = createLogger('TaskDomainService');
  
  constructor(private readonly taskRepository: ITaskRepository) {}
  
  async createTemplate(accountUuid: string, request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
    this.logger.info('Creating task template', { accountUuid, title: request.title });
    
    // 1. 创建领域实体
    const template = TaskTemplate.create({
      accountUuid,
      ...request,
      timeConfig: {
        time: request.timeConfig.time,
        date: {
          startDate: new Date(request.timeConfig.date.startDate),
          endDate: request.timeConfig.date.endDate ? new Date(request.timeConfig.date.endDate) : undefined,
        },
        schedule: request.timeConfig.schedule,
        timezone: request.timeConfig.timezone,
      },
    });
    
    // 2. 保存（仓储接受实体对象）
    const saved = await this.taskRepository.saveTemplate(template);
    
    // 3. 发布领域事件
    const events = saved.getDomainEvents();
    for (const event of events) {
      await eventBus.publish(event);
    }
    
    this.logger.info('Template created', { uuid: saved.uuid });
    
    // 4. 返回 ClientDTO
    return saved.toClient();
  }
  
  // ... 所有其他方法都需要实现
}
```

#### ⚠️ TaskApplicationService.ts 需要修改

**当前问题**:
```typescript
// 直接使用多个独立的仓储
constructor(
  taskTemplateRepository: ITaskTemplateRepository,
  taskInstanceRepository: ITaskInstanceRepository,
  taskMetaTemplateRepository: ITaskMetaTemplateRepository,
  taskStatsRepository: ITaskStatsRepository,
) { ... }
```

**应该改为**（参考 GoalApplicationService）:
```typescript
// 使用统一的仓储 + 领域服务
constructor(private readonly taskRepository: ITaskRepository) {
  this.domainService = new TaskDomainService(taskRepository);
  this.userInitService = new UserDataInitializationService(taskRepository);
}

async createTemplate(accountUuid: string, request: CreateTaskTemplateRequest) {
  // 委托给领域服务
  return await this.domainService.createTemplate(accountUuid, request);
}
```

#### ❌ Controller 层需要重构

**检查项**:
```typescript
// apps/api/src/modules/task/interface/controllers/TaskController.ts
/**
 * 1. ⚠️ 是否使用 createLogger('TaskController')
 * 2. ⚠️ 是否使用 Response.ok() / Response.error()
 * 3. ⚠️ 是否使用 getHttpStatusCode(ResponseCode)
 * 4. ⚠️ 错误处理是否完整
 * 5. ⚠️ 是否从 req.user.accountUuid 提取用户信息
 */
```

---

### 4. Web 层（apps/web/src/modules/task/）

#### ✅ 现有文件
- ✅ `presentation/stores/` - Store 已存在
- ✅ `presentation/composables/` - Composable 已存在
- ✅ `infrastructure/api/` - API Client 已存在
- ✅ `application/services/` - Application Service 已存在

#### ⚠️ 需要检查的文件

```typescript
// apps/web/src/modules/task/infrastructure/api/taskApiClient.ts
/**
 * 检查项：
 * 1. ⚠️ baseUrl 是否正确（应该是 '/tasks'，不是 '/api/v1/tasks'）
 * 2. ⚠️ 是否使用 apiClient.post/get/patch/delete
 * 3. ⚠️ 错误处理是否完整
 */

// apps/web/src/modules/task/presentation/stores/taskStore.ts
/**
 * 检查项：
 * 1. ⚠️ 是否使用 Pinia defineStore
 * 2. ⚠️ 是否实现乐观更新（optimistic update）
 * 3. ⚠️ 是否实现回滚机制（rollback）
 * 4. ⚠️ 是否监听事件总线的登录事件
 * 5. ⚠️ 是否使用 getTaskWebService()
 */

// apps/web/src/modules/task/presentation/composables/useTask.ts
/**
 * 检查项：
 * 1. ⚠️ 是否正确使用 taskStore
 * 2. ⚠️ 是否提供 computed 属性
 * 3. ⚠️ 是否提供 loading 状态管理
 */
```

---

## 🔧 具体执行步骤

### Step 1: 完善 Contracts 层 dtos.ts

```typescript
// packages/contracts/src/modules/task/dtos.ts

// 添加 ClientDTO（带计算属性）
export interface TaskTemplateClientDTO extends TaskTemplateDTO {
  // 计算属性
  displayTitle: string;
  statusText: string;
  statusColor: string;
  scheduleText: string;
  timeTypeText: string;
  tagsText: string;
  completionRateText: string;
  canActivate: boolean;
  canPause: boolean;
  canComplete: boolean;
  canEdit: boolean;
  nextScheduledTime?: string; // ISO date
}

export interface TaskInstanceClientDTO extends TaskInstanceDTO {
  // 计算属性
  isOverdue: boolean;
  remainingTime?: number; // 分钟
  formattedScheduledTime: string;
  statusText: string;
  statusColor: string;
  canStart: boolean;
  canComplete: boolean;
  canCancel: boolean;
}
```

### Step 2: 创建 ITaskRepository 统一仓储接口

```bash
# 位置: packages/domain-server/src/task/repositories/ITaskRepository.ts
```

```typescript
/**
 * Task 领域仓储接口
 * DDD 最佳实践：仓储接受和返回领域实体对象
 */
import type { TaskContracts } from '@dailyuse/contracts';
import type { TaskTemplate, TaskInstance, TaskMetaTemplate } from '../index';

export interface ITaskRepository {
  // TaskTemplate 聚合根
  saveTemplate(template: TaskTemplate): Promise<TaskTemplate>;
  getTemplateByUuid(uuid: string): Promise<TaskTemplate | null>;
  getAllTemplates(accountUuid: string, params?: any): Promise<{ templates: TaskTemplate[]; total: number }>;
  deleteTemplate(uuid: string): Promise<boolean>;
  
  // TaskInstance
  saveInstance(instance: TaskInstance): Promise<TaskInstance>;
  getInstanceByUuid(uuid: string): Promise<TaskInstance | null>;
  getInstancesByTemplate(templateUuid: string, params?: any): Promise<{ instances: TaskInstance[]; total: number }>;
  getInstancesByDateRange(accountUuid: string, start: Date, end: Date): Promise<TaskInstance[]>;
  deleteInstance(uuid: string): Promise<boolean>;
  
  // TaskMetaTemplate
  saveMetaTemplate(meta: TaskMetaTemplate): Promise<TaskMetaTemplate>;
  getMetaTemplateByUuid(uuid: string): Promise<TaskMetaTemplate | null>;
  getAllMetaTemplates(accountUuid: string): Promise<TaskMetaTemplate[]>;
  deleteMetaTemplate(uuid: string): Promise<boolean>;
  
  // 统计
  getTemplateStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO>;
}
```

### Step 3: 重写 TaskDomainService.ts

**删除所有 TODO，实现所有方法**，参考 `GoalDomainService.ts` 的结构。

关键方法：
- `createTemplate()`
- `updateTemplate()`
- `activateTemplate()`
- `createInstance()`
- `completeInstance()`
- `rescheduleInstance()`

### Step 4: 重构 TaskApplicationService.ts

```typescript
// 简化构造函数
constructor(private readonly taskRepository: ITaskRepository) {
  this.domainService = new TaskDomainService(taskRepository);
}

// 所有业务方法委托给 domainService
async createTemplate(accountUuid: string, request: CreateTaskTemplateRequest) {
  return await this.domainService.createTemplate(accountUuid, request);
}
```

### Step 5: 更新 PrismaTaskRepository

**目前存在多个独立仓储**:
- `PrismaTaskTemplateRepository.ts`
- `PrismaTaskInstanceRepository.ts`
- `PrismaTaskMetaTemplateRepository.ts`

**应该合并为一个统一仓储**（参考 PrismaGoalRepository）:
- `PrismaTaskRepository.ts` 实现 `ITaskRepository` 接口

### Step 6: 检查并重构 Web 层

1. **taskApiClient.ts**: 确保 baseUrl 正确，使用统一的 apiClient
2. **taskStore.ts**: 实现乐观更新、回滚、事件监听
3. **useTask.ts**: 提供便捷的 composable 接口

---

## 📊 重构进度总览

| 层次 | 文件数 | 已完成 | 需修改 | 需创建 | 完成度 |
|------|-------|--------|--------|--------|--------|
| Contracts | 5 | 4 | 1 | 0 | 80% |
| Domain-Server | ~10 | 3 | 3 | 4 | 30% |
| API | ~15 | 8 | 5 | 2 | 53% |
| Web | ~12 | 10 | 2 | 0 | 83% |
| **总计** | **~42** | **25** | **11** | **6** | **60%** |

---

## ⚡ 快速重构脚本（伪代码）

```bash
# 1. Contracts 层
✅ enums.ts - 已完成
✅ persistence-dtos.ts - 已完成
✅ types.ts - 已修改
✅ index.ts - 已修改
⚠️ dtos.ts - 添加 ClientDTO

# 2. Domain-Server 层
⚠️ TaskTemplate.ts - 验证并修改
❌ ITaskRepository.ts - 创建
❌ TaskDomainException.ts - 创建
❌ UserDataInitializationService.ts - 创建

# 3. API 层
❌ TaskDomainService.ts - 完全重写（删除所有 TODO）
⚠️ TaskApplicationService.ts - 简化构造函数
⚠️ PrismaTaskRepository.ts - 合并多个仓储
⚠️ TaskController.ts - 添加日志和响应系统

# 4. Web 层
⚠️ taskApiClient.ts - 检查 baseURL
⚠️ taskStore.ts - 添加乐观更新和事件监听
```

---

## 🎯 最关键的 3 个文件

### 1. **TaskDomainService.ts** （最重要！）
- 当前：全是 TODO
- 需要：完整实现所有业务逻辑
- 参考：`apps/api/src/modules/goal/domain/services/GoalDomainService.ts`

### 2. **ITaskRepository.ts** （架构层面）
- 当前：不存在
- 需要：统一仓储接口
- 参考：`packages/domain-server/src/goal/repositories/iGoalRepository.ts`

### 3. **TaskApplicationService.ts** （协调层）
- 当前：使用多个独立仓储
- 需要：简化为使用 TaskDomainService
- 参考：`apps/api/src/modules/goal/application/services/GoalApplicationService.ts`

---

## 📖 参考文件清单

### Goal 模块核心文件（复制模板）

```
1. packages/contracts/src/modules/goal/dtos.ts
   → 参考 ClientDTO 结构

2. packages/domain-server/src/goal/aggregates/Goal.ts
   → 参考聚合根实现

3. packages/domain-server/src/goal/repositories/iGoalRepository.ts
   → 参考仓储接口设计

4. apps/api/src/modules/goal/domain/services/GoalDomainService.ts
   → 参考领域服务实现（最重要！）

5. apps/api/src/modules/goal/application/services/GoalApplicationService.ts
   → 参考应用服务协调

6. apps/api/src/modules/goal/interface/controllers/GoalController.ts
   → 参考控制器层

7. apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts
   → 参考 API 客户端

8. apps/web/src/modules/goal/presentation/stores/goalStore.ts
   → 参考 Store 实现
```

---

## ✅ 验证清单

完成后运行以下检查：

```bash
# 1. TypeScript 编译检查
pnpm run type-check

# 2. 运行测试
pnpm run test:task

# 3. 启动开发服务器
pnpm run dev:api
pnpm run dev:web

# 4. 手动测试
# - 创建任务模板
# - 创建任务实例
# - 完成任务
# - 查看统计数据
```

---

## 🚀 下一步行动

**立即执行**:
1. ⚠️ 完善 `dtos.ts` - 添加 ClientDTO
2. ❌ 创建 `ITaskRepository.ts`
3. ❌ **重写 `TaskDomainService.ts`**（最关键！）

**后续执行**:
4. ⚠️ 重构 `TaskApplicationService.ts`
5. ⚠️ 合并 Prisma 仓储
6. ⚠️ 检查 Controller 和 Web 层

---

**预计总耗时**: 6-8 小时（已完成 60%，剩余 40%）

**最大难点**: TaskDomainService 的完整实现（约 500+ 行代码）
