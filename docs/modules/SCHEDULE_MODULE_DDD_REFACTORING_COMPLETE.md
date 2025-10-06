# Schedule 模块 DDD 重构完成总结

> **重构完成时间**: 2025-01-XX  
> **重构目标**: 将 Schedule 模块从 DTO-based 架构重构为严格的 DDD 架构  
> **参考模式**: Reminder 模块、Goal 模块  
> **关键原则**: **Repository 层必须返回 Aggregate Root 实体，而非 DTO**

---

## 📋 重构概述

### ❌ 核心问题
Schedule 模块的 Repository 层违反了 DDD 原则 —— **返回 DTO 而非 Aggregate Root 实体**。

### ✅ 解决方案
应用与 Reminder/Goal 模块相同的 DDD 模式：
1. ✅ Repository 返回聚合根实体 (`ScheduleTask`)
2. ✅ Domain Service 使用实体处理业务逻辑
3. ✅ Application Service 负责实体 ↔ DTO 转换
4. ✅ Controller 继续使用 DTO 与客户端通信

---

## 🏗️ 架构层次

```
┌─────────────────────────────────────────────────────────┐
│  Controller (Interface Layer)                           │
│  • 接收/返回 DTO                                        │
│  • HTTP 请求处理                                        │
└────────────────┬────────────────────────────────────────┘
                 │ DTO
┌────────────────▼────────────────────────────────────────┐
│  Application Service                                     │
│  • 协调领域服务                                         │
│  • 实体 → DTO 转换 (toClient())                        │
│  • 应用级业务逻辑（权限、配额检查）                    │
└────────────────┬────────────────────────────────────────┘
                 │ ScheduleTask (Entity)
┌────────────────▼────────────────────────────────────────┐
│  Domain Service                                          │
│  • 使用实体处理核心业务逻辑                            │
│  • 业务规则验证                                         │
│  • 状态管理                                             │
└────────────────┬────────────────────────────────────────┘
                 │ ScheduleTask (Entity)
┌────────────────▼────────────────────────────────────────┐
│  Repository (Infrastructure Layer)                       │
│  • DB → Entity 转换 (fromPersistence())                │
│  • Entity → DB 转换 (toPersistence())                  │
│  • 数据持久化                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 核心修改

### 1. ScheduleTask 聚合根新增方法

**文件**: `packages/domain-server/src/schedule/aggregates/ScheduleTask.ts`

```typescript
// 从数据库数据创建实体
static fromPersistence(data: any): ScheduleTask {
  const payload = parseJson(data.payload) || {};
  const recurrence = parseJson(data.recurrence);
  const alertConfig = parseJson(data.alertConfig);
  
  return new ScheduleTask({
    uuid: data.uuid,
    basic: {
      name: data.title,                    // ✅ 字段映射
      createdBy: data.accountUuid,
      // ... 其他字段
    },
    scheduling: {
      scheduledTime: new Date(data.scheduledTime),
      nextExecutionTime: data.nextScheduledAt ? new Date(data.nextScheduledAt) : undefined,
      // ...
    },
    execution: {
      currentRetries: data.failureCount,   // ✅ 字段映射
      // ...
    },
    // ...
  });
}

// 转换为数据库格式
toPersistence(): any {
  return {
    title: this._basic.name,               // ✅ 反向映射
    accountUuid: this._basic.createdBy,
    nextScheduledAt: this._scheduling.nextExecutionTime,
    failureCount: this._execution.currentRetries,
    payload: JSON.stringify(this._basic.payload),
    // ...
  };
}

// 转换为客户端 DTO
toClient(): ScheduleTaskResponseDto {
  return {
    id: this._uuid,
    name: this._basic.name,
    scheduledTime: this._scheduling.scheduledTime.toISOString(),
    // ...
  };
}
```

**关键字段映射**:
| 数据库 | 实体 | 说明 |
|-------|------|------|
| `title` | `name` | 任务标题 |
| `accountUuid` | `createdBy` | 创建者 |
| `nextScheduledAt` | `nextExecutionTime` | 下次执行时间 |
| `failureCount` | `currentRetries` | 重试次数 |

---

### 2. Repository 接口返回实体

**文件**: `packages/domain-server/src/schedule/repositories/IScheduleTaskRepository.ts`

```typescript
// ❌ 修改前（错误）
interface IScheduleTaskRepository {
  create(): Promise<ScheduleTaskResponseDto>; // DTO
  findByUuid(): Promise<ScheduleTaskResponseDto | null>; // DTO
}

// ✅ 修改后（正确）
interface IScheduleTaskRepository {
  create(): Promise<ScheduleTask>; // Entity
  findByUuid(): Promise<ScheduleTask | null>; // Entity
  save(task: ScheduleTask): Promise<ScheduleTask>; // 新增：直接保存实体
  findMany(): Promise<{ tasks: ScheduleTask[]; total: number }>;
  // 所有30+个方法都返回实体
}
```

---

### 3. Repository 实现使用实体转换

**文件**: `apps/api/src/modules/schedule/infrastructure/repositories/PrismaScheduleTaskRepository.ts`

```typescript
export class PrismaScheduleTaskRepository implements IScheduleTaskRepository {
  
  async create(request: CreateScheduleTaskRequestDto, createdBy: string): Promise<ScheduleTask> {
    const created = await this.prisma.scheduleTask.create({...});
    return ScheduleTask.fromPersistence(created); // ✅ DB → Entity
  }

  async findByUuid(uuid: string): Promise<ScheduleTask | null> {
    const task = await this.prisma.scheduleTask.findUnique({...});
    return task ? ScheduleTask.fromPersistence(task) : null; // ✅ DB → Entity
  }

  async save(task: ScheduleTask): Promise<ScheduleTask> {
    const persistence = task.toPersistence(); // ✅ Entity → DB
    const saved = await this.prisma.scheduleTask.upsert({
      where: { uuid: persistence.uuid },
      create: persistence,
      update: persistence,
    });
    return ScheduleTask.fromPersistence(saved);
  }

  async findMany(query): Promise<{ tasks: ScheduleTask[]; total: number }> {
    const tasks = await this.prisma.scheduleTask.findMany({...});
    return {
      tasks: tasks.map(t => ScheduleTask.fromPersistence(t)), // ✅ 批量转换
      total: await this.prisma.scheduleTask.count({...}),
    };
  }
  
  // ... 其他30+个方法使用相同模式
}
```

**批量替换命令**（PowerShell）:
```powershell
$content -replace 'Promise<ScheduleTaskResponseDto>', 'Promise<ScheduleTask>'
$content -replace 'this\.mapScheduleTaskToDTO\(([^)]+)\)', 'ScheduleTask.fromPersistence($1)'
```

---

### 4. Domain Service 使用实体

**文件**: `apps/api/src/modules/schedule/domain/services/ScheduleDomainService.ts`

```typescript
// ❌ 修改前（错误）
async createScheduleTask(): Promise<ScheduleTaskResponseDto> {
  return await this.scheduleRepository.create(...); // 返回 DTO
}

// ✅ 修改后（正确）
async createScheduleTask(): Promise<ScheduleTask> {
  await this.validateScheduleTaskCreation(...);
  return await this.scheduleRepository.create(...); // 返回实体
}

async getScheduleTaskByUuid(accountUuid: string, uuid: string): Promise<ScheduleTask | null> {
  const task = await this.scheduleRepository.findByUuid(uuid);
  
  // 使用实体的 getter 验证权限
  if (task && task.createdBy !== accountUuid) { // ✅ 直接访问属性
    return null;
  }
  
  return task;
}
```

---

### 5. Application Service 负责 DTO 转换

**文件**: `apps/api/src/modules/schedule/application/services/ScheduleApplicationService.ts`

```typescript
// ❌ 修改前（错误）
async createScheduleTask(): Promise<ScheduleTaskResponseDto> {
  return await this.scheduleDomainService.createScheduleTask(...); // 透传 DTO
}

// ✅ 修改后（正确）
async createScheduleTask(): Promise<ScheduleTaskResponseDto> {
  const task = await this.scheduleDomainService.createScheduleTask(...);
  return task.toClient(); // ✅ Entity → DTO
}

async getScheduleTask(): Promise<ScheduleTaskResponseDto | null> {
  const task = await this.scheduleDomainService.getScheduleTaskByUuid(...);
  return task ? task.toClient() : null; // ✅ 处理 null
}

async getScheduleTasks(): Promise<ScheduleTaskListResponseDto> {
  const result = await this.scheduleDomainService.getScheduleTasks(...);
  return {
    tasks: result.tasks.map(task => task.toClient()), // ✅ 批量转换
    total: result.total,
    pagination: result.pagination || { offset: 0, limit: result.tasks.length, hasMore: false },
  };
}
```

---

## 📊 数据流示例

### 创建任务完整流程

```typescript
// 1️⃣ Controller 接收 DTO
POST /api/schedule/tasks
Body: CreateScheduleTaskRequestDto { name: "测试任务", ... }

// 2️⃣ ApplicationService: 接收 DTO，返回 DTO
const task = await scheduleDomainService.createScheduleTask(accountUuid, request);
return task.toClient(); // Entity → DTO

// 3️⃣ DomainService: 业务验证，返回实体
await this.validateScheduleTaskCreation(accountUuid, request);
const task = await scheduleRepository.create(request, accountUuid);
return task; // ScheduleTask entity

// 4️⃣ Repository: 持久化，返回实体
const created = await prisma.scheduleTask.create({
  data: {
    title: request.name,        // ✅ DTO.name → DB.title
    accountUuid: createdBy,
    payload: JSON.stringify(request.payload),
    // ...
  }
});
return ScheduleTask.fromPersistence(created); // DB → Entity

// 5️⃣ fromPersistence: 数据库 → 实体
new ScheduleTask({
  basic: {
    name: data.title,           // ✅ DB.title → Entity.name
    createdBy: data.accountUuid,
    payload: JSON.parse(data.payload),
  },
  // ...
})

// 6️⃣ toClient: 实体 → DTO
{
  id: this._uuid,
  name: this._basic.name,       // ✅ Entity.name → DTO.name
  createdBy: this._basic.createdBy,
  payload: this._basic.payload,
  scheduledTime: this._scheduling.scheduledTime.toISOString(),
  // ...
}

// 7️⃣ Controller 返回 DTO 给客户端
Response: ScheduleTaskResponseDto { id: "uuid", name: "测试任务", ... }
```

---

## ✅ 验证结果

### 编译测试
```bash
pnpm nx run api:build
```

**结果**: ✅ **0 errors in Schedule module**

```
ESM ⚡️ Build success in 87ms
DTS Build start
DTS ⚡️ Build success in 3868ms

# 其他模块有错误，但 Schedule 模块完全无错误！
```

---

## 🎯 核心原则总结

### 1. Repository 返回聚合根实体
```typescript
// ❌ 错误
async findByUuid(): Promise<ScheduleTaskResponseDto>

// ✅ 正确
async findByUuid(): Promise<ScheduleTask>
```

### 2. 实体负责数据转换
```typescript
ScheduleTask.fromPersistence(dbData) // 数据库 → 实体
task.toPersistence()                 // 实体 → 数据库
task.toClient()                      // 实体 → DTO
```

### 3. 分层职责明确
| 层级 | 职责 | 输入 | 输出 |
|-----|------|------|------|
| **Controller** | 接收/返回 DTO | DTO | DTO |
| **Application Service** | 实体 ↔ DTO 转换 | DTO | DTO |
| **Domain Service** | 业务逻辑 + 使用实体 | Entity/DTO | Entity |
| **Repository** | 数据持久化 + 实体转换 | Entity | Entity |

### 4. 字段映射一致性
数据库字段 ≠ 实体字段 ≠ DTO 字段

必须在 `fromPersistence()` 和 `toPersistence()` 中**显式映射**。

---

## 🔄 与其他模块对比

| 模块 | 状态 | Repository 返回 | 转换方法 | 参考文档 |
|-----|------|---------------|---------|---------|
| **Reminder** | ✅ 已重构 | `ReminderTemplate` | `fromPersistence()`, `toClient()` | [文档](./NOTIFICATION_REFACTORING_SUMMARY.md) |
| **Goal** | ✅ 已重构 | `Goal`, `GoalDir` | `fromPersistence()`, `toClient()` | [文档](./GOAL_INITIALIZATION_QUICK_REFERENCE.md) |
| **Schedule** | ✅ **本次重构** | `ScheduleTask` | `fromPersistence()`, `toPersistence()`, `toClient()` | 本文档 |
| **Setting** | ✅ 已重构 | `SettingDefinition` | `fromPersistence()`, `toClient()` | [文档](./SETTING_MODULE_REFACTORING_COMPLETE.md) |
| Task | ❌ 待重构 | DTO | - | - |
| Account | ❌ 待重构 | DTO | - | - |
| Editor | ❌ 待重构 | DTO | - | - |

---

## 📝 经验教训

### ❌ 常见错误
1. **Repository 直接返回 DTO** - 违反 DDD 分层原则
2. **字段名称不匹配** - 数据库 `title` ≠ 实体 `name`，缺少映射
3. **忘记 JSON 字段解析** - `payload`、`recurrence` 需要 `JSON.parse()`
4. **类型不完整** - `pagination` 字段可选但 DTO 定义为必需

### ✅ 最佳实践
1. **使用 PowerShell 批量替换** - 处理大文件（600+ 行）中的重复模式
2. **先更新接口，再更新实现** - 编译器会提示所有需要修改的地方
3. **使用 getter 访问属性** - `task.createdBy` 而非 `task._basic.createdBy`
4. **完整测试编译** - `pnpm nx run api:build` 验证所有改动

---

## 🚀 后续工作

### 待重构模块
1. **Task 模块** - Repository 仍返回 DTO（优先级：高）
2. **Account 模块** - Repository 仍返回 DTO（优先级：中）
3. **Editor 模块** - 编译错误较多，需要完整重构（优先级：低）

### 优化建议
1. 统一所有模块的实体转换方法签名
2. 创建通用的 JSON 字段处理工具 (`parseJson` 工具类)
3. 建立自动化测试验证 DDD 架构合规性
4. 创建代码生成器自动生成 `fromPersistence()`/`toPersistence()`

---

## 📚 参考文档

- [Reminder 模块重构总结](./NOTIFICATION_REFACTORING_SUMMARY.md)
- [Goal 模块完整流程](./Goal模块完整流程.md)
- [Setting 模块重构](./SETTING_MODULE_REFACTORING_COMPLETE.md)
- [TypeScript 导入修复](../TYPESCRIPT_IMPORT_FIX_SUMMARY.md)
- [DDD 架构原则](../systems/DDD_ARCHITECTURE_PRINCIPLES.md)

---

**重构完成** ✅  
**编译状态**: 0 errors in Schedule module  
**符合规范**: DDD + Clean Architecture  
**重构模式**: Repository → Entity → DomainService → ApplicationService → Controller
