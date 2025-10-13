# Schedule Domain-Client 模块重构计划

## 严格参考 Repository 模块规范

### 📁 完整目录结构（参考 Repository）

```
packages/domain-client/src/schedule/
├── aggregates/                    # 聚合根目录
│   ├── index.ts                   # 导出所有聚合根
│   └── ScheduleTask.ts            # ScheduleTask 聚合根 ⭐ 核心
│
├── entities/                      # 实体目录
│   ├── index.ts                   # 导出所有实体
│   ├── TaskExecution.ts           # 任务执行记录实体
│   └── TaskHistory.ts             # 任务历史实体
│
├── value-objects/                 # 值对象目录
│   ├── index.ts                   # 导出所有值对象
│   ├── ScheduleConfig.ts          # ✅ 已完成
│   ├── RetryPolicy.ts             # ✅ 已完成
│   ├── ExecutionInfo.ts           # ✅ 已完成
│   └── TaskMetadata.ts            # ⏳ 待创建
│
└── index.ts                       # 模块总导出

```

---

## ⭐ 核心文件对比参考

### 1. Repository.ts vs ScheduleTask.ts

**Repository.ts 的完整结构**：
- ✅ 私有字段（14 个基础字段 + 2 个子实体集合）
- ✅ 构造函数（私有，通过工厂方法创建）
- ✅ Getter 属性（基础属性 + UI 辅助属性）
- ✅ 工厂方法（forCreate, clone, create）
- ✅ 创建子实体方法（createResource, createExplorer）
- ✅ 子实体管理方法（add, remove, get, getAll）
- ✅ DTO 转换方法（toServerDTO, toClientDTO, fromServerDTO, fromClientDTO）
- ✅ UI 辅助方法（formatDate, formatRelativeTime）

**ScheduleTask.ts 必须包含**：
- ✅ 私有字段（18 个基础字段 + 子实体集合）
- ✅ 构造函数（私有）
- ✅ Getter 属性（所有基础属性）
- ✅ UI 辅助属性（statusLabel, sourceModuleLabel, etc.）
- ✅ 工厂方法（forCreate, clone, create）
- ✅ 创建子实体方法（createExecution, createHistory）
- ✅ 子实体管理方法（addExecution, removeExecution, getAllExecutions）
- ✅ DTO 转换方法（完整的 4 个方法）
- ✅ 业务方法（pause, resume, cancel, complete）

---

## 📝 ScheduleTask 聚合根完整实现清单

### 私有字段（参考 Repository）
```typescript
// 基础标识
private _uuid: string;
private _accountUuid: string;

// 基本信息
private _name: string;
private _description: string | null;
private _sourceModule: SourceModule;
private _sourceEntityId: string;

// 状态信息
private _status: ScheduleTaskStatus;
private _enabled: boolean;

// 配置（值对象）
private _schedule: ScheduleConfig;
private _retryPolicy: RetryPolicy;
private _metadata: TaskMetadata;
private _executionInfo: ExecutionInfo;

// 时间戳
private _nextRunAt: number | null;
private _lastRunAt: number | null;
private _createdAt: number;
private _updatedAt: number;

// 子实体集合
private _executions: TaskExecution[];
private _history: TaskHistory[];
```

### Getter 属性（18+ 个基础 + 10+ UI 辅助）
```typescript
// 基础属性
get uuid(): string
get accountUuid(): string
get name(): string
get description(): string | null
get sourceModule(): SourceModule
get sourceEntityId(): string
get status(): ScheduleTaskStatus
get enabled(): boolean
get schedule(): ScheduleConfigClientDTO
get retryPolicy(): RetryPolicyClientDTO
get metadata(): TaskMetadataClientDTO
get executionInfo(): ExecutionInfoClientDTO
get nextRunAt(): number | null
get lastRunAt(): number | null
get createdAt(): number
get updatedAt(): number

// 子实体访问
get executions(): TaskExecution[] | null
get history(): TaskHistory[] | null

// UI 辅助属性（参考 Repository 的 displayPath, statusLabel等）
get statusLabel(): string            // "活跃" | "已暂停" | ...
get sourceModuleLabel(): string       // "提醒" | "任务" | ...
get nextRunAtFormatted(): string | null
get lastRunAtFormatted(): string | null
get formattedCreatedAt(): string
get formattedUpdatedAt(): string
get isActive(): boolean
get isPaused(): boolean
get canExecute(): boolean
get needsRetry(): boolean
get successRate(): number
```

### 工厂方法（3 个）
```typescript
// 1. 创建空实例（新建表单用）
public static forCreate(accountUuid: string, sourceModule: SourceModule): ScheduleTask

// 2. 克隆实例（编辑表单用）
public clone(): ScheduleTask

// 3. 创建新实例
public static create(params: {
  accountUuid: string;
  name: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  cronExpression: string;
  // ... 其他参数
}): ScheduleTask
```

### 创建子实体方法（2 个）
```typescript
public createExecution(params: {
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
}): TaskExecution

public createHistory(params: {
  action: string;
  changes: Record<string, any>;
  performedBy?: string;
}): TaskHistory
```

### 子实体管理方法（6+ 个）
```typescript
// TaskExecution 管理
public addExecution(execution: TaskExecution): void
public removeExecution(executionUuid: string): TaskExecution | null
public getExecution(uuid: string): TaskExecution | null
public getAllExecutions(): TaskExecution[]
public getRecentExecutions(limit: number): TaskExecution[]

// TaskHistory 管理
public addHistory(history: TaskHistory): void
public getAllHistory(): TaskHistory[]
```

### DTO 转换方法（4 个）
```typescript
// To 方法
public toServerDTO(includeChildren: boolean = false): ScheduleTaskServerDTO
public toClientDTO(includeChildren: boolean = false): ScheduleTaskClientDTO

// From 方法（静态）
public static fromServerDTO(dto: ScheduleTaskServerDTO): ScheduleTask
public static fromClientDTO(dto: ScheduleTaskClientDTO): ScheduleTask
```

### 业务方法（4 个核心 + 其他）
```typescript
// 核心状态转换
public pause(): void        // 暂停任务
public resume(): void       // 恢复任务
public cancel(): void       // 取消任务
public complete(): void     // 完成任务

// 辅助方法
public updateMetadata(updates: Partial<TaskMetadata>): void
public updateNextRunTime(nextRunAt: Date): void
public recordExecution(execution: TaskExecution): void
public incrementFailureCount(): void
public resetFailureCount(): void
```

---

## 📋 剩余待创建文件清单

### 1. TaskMetadata.ts（值对象）⏳
**参考**: RepositoryConfig.ts  
**字段**: payload, tags, priority, timeout  
**UI 属性**: priorityDisplay, priorityColor, tagsDisplay, timeoutFormatted, payloadSummary

### 2. value-objects/index.ts ⏳
```typescript
export * from './ScheduleConfig';
export * from './RetryPolicy';
export * from './ExecutionInfo';
export * from './TaskMetadata';
```

### 3. TaskExecution.ts（实体）⏳
**参考**: Resource.ts  
**字段**: taskUuid, status, startTime, endTime, duration, error, createdAt

### 4. TaskHistory.ts（实体）⏳
**参考**: LinkedContent.ts  
**字段**: taskUuid, action, changes, performedBy, createdAt

### 5. entities/index.ts ⏳
```typescript
export * from './TaskExecution';
export * from './TaskHistory';
```

### 6. ScheduleTask.ts（聚合根）⏳ **最核心**
**参考**: Repository.ts（完整复制结构）  
**代码行数**: 约 500-600 行（与 Repository.ts 相当）

### 7. aggregates/index.ts ⏳
```typescript
export * from './ScheduleTask';
```

### 8. schedule/index.ts（重构）⏳
```typescript
// 导出聚合根
export * from './aggregates';

// 导出实体
export * from './entities';

// 导出值对象
export * from './value-objects';
```

---

## 🎯 关键差异点修正

### 当前 ScheduleTaskClient.ts 的问题

1. ❌ **不是聚合根，只是简单包装类**
   - 当前：`private _data: ScheduleTaskClientDTO`
   - 应该：完整的私有字段（18+ 个）

2. ❌ **没有子实体管理**
   - 当前：无子实体
   - 应该：管理 TaskExecution 和 TaskHistory 实体

3. ❌ **缺少工厂方法**
   - 当前：只有 `fromDTO`
   - 应该：forCreate, clone, create

4. ❌ **缺少业务方法**
   - 当前：只有查询属性
   - 应该：pause, resume, cancel, complete 等状态转换方法

5. ❌ **值对象未正确使用**
   - 当前：直接使用 DTO 类型
   - 应该：使用 ScheduleConfig, RetryPolicy 等值对象实例

6. ❌ **没有子实体创建方法**
   - 当前：无
   - 应该：createExecution, createHistory

---

##人际 标准代码模板（参考 Repository.ts）

### 构造函数模板
```typescript
private constructor(params: {
  uuid?: string;
  accountUuid: string;
  name: string;
  // ... 所有字段
}) {
  super(params.uuid || AggregateRoot.generateUUID());
  this._accountUuid = params.accountUuid;
  this._name = params.name;
  // ... 初始化所有字段
  this._executions = [];
  this._history = [];
}
```

### Getter 模板
```typescript
public override get uuid(): string {
  return this._uuid;
}

public get config(): ScheduleConfigClientDTO {
  return this._schedule.toClientDTO();
}
```

### 工厂方法模板
```typescript
public static forCreate(accountUuid: string, sourceModule: SourceModule): ScheduleTask {
  const now = Date.now();
  return new ScheduleTask({
    accountUuid,
    name: '',
    sourceModule,
    sourceEntityId: '',
    status: 'active',
    enabled: true,
    schedule: ScheduleConfig.createDefault(),
    retryPolicy: RetryPolicy.createDefault(),
    metadata: TaskMetadata.createDefault(),
    executionInfo: ExecutionInfo.createDefault(),
    createdAt: now,
    updatedAt: now,
  });
}

public clone(): ScheduleTask {
  return ScheduleTask.fromClientDTO(this.toClientDTO(true));
}
```

### 子实体管理模板
```typescript
public addExecution(execution: TaskExecution): void {
  if (!(execution instanceof TaskExecution)) {
    throw new Error('Execution must be an instance of TaskExecution');
  }
  this._executions.push(execution);
  this._updatedAt = Date.now();
}

public removeExecution(executionUuid: string): TaskExecution | null {
  const index = this._executions.findIndex((e) => e.uuid === executionUuid);
  if (index === -1) return null;
  const removed = this._executions.splice(index, 1)[0];
  this._updatedAt = Date.now();
  return removed;
}
```

### DTO 转换模板
```typescript
public toClientDTO(includeChildren: boolean = false): ScheduleTaskClientDTO {
  return {
    uuid: this._uuid,
    accountUuid: this._accountUuid,
    name: this._name,
    // ... 所有基础字段
    schedule: this._schedule.toClientDTO(),
    retryPolicy: this._retryPolicy.toClientDTO(),
    metadata: this._metadata.toClientDTO(),
    executionInfo: this._executionInfo.toClientDTO(),
    // UI 辅助属性
    statusLabel: this.statusLabel,
    formattedCreatedAt: this.formattedCreatedAt,
    // ... 其他 UI 属性
    // 子实体（可选）
    executions: includeChildren 
      ? this._executions.map((e) => e.toClientDTO()) 
      : undefined,
    history: includeChildren 
      ? this._history.map((h) => h.toClientDTO()) 
      : undefined,
  };
}

public static fromServerDTO(dto: ScheduleTaskServerDTO): ScheduleTask {
  const task = new ScheduleTask({
    uuid: dto.uuid,
    accountUuid: dto.accountUuid,
    name: dto.name,
    // ... 所有字段
    schedule: ScheduleConfig.fromServerDTO(dto.schedule),
    retryPolicy: RetryPolicy.fromServerDTO(dto.retryPolicy),
    metadata: TaskMetadata.fromServerDTO(dto.metadata),
    executionInfo: ExecutionInfo.fromServerDTO(dto.executionInfo),
  });

  // 递归创建子实体
  if (dto.executions) {
    task._executions = dto.executions.map((e) => TaskExecution.fromServerDTO(e));
  }
  if (dto.history) {
    task._history = dto.history.map((h) => TaskHistory.fromServerDTO(h));
  }

  return task;
}
```

---

## ✅ 验收标准

### 1. 目录结构完全一致
- ✅ aggregates/ 目录存在
- ✅ entities/ 目录存在  
- ✅ value-objects/ 目录存在
- ✅ 每个目录都有 index.ts

### 2. ScheduleTask 聚合根完整性
- ✅ 继承 AggregateRoot
- ✅ 18+ 个私有字段
- ✅ 构造函数私有
- ✅ 所有字段都有 getter
- ✅ 10+ 个 UI 辅助属性
- ✅ 3 个工厂方法（forCreate, clone, create）
- ✅ 2 个子实体创建方法
- ✅ 6+ 个子实体管理方法
- ✅ 4 个 DTO 转换方法
- ✅ 4+ 个业务方法

### 3. 值对象完整性
- ✅ 继承 ValueObject
- ✅ 所有字段 readonly
- ✅ 构造函数中 Object.freeze(this)
- ✅ equals 方法实现
- ✅ toServerDTO/toClientDTO/fromServerDTO/fromClientDTO
- ✅ createDefault 静态方法
- ✅ UI 辅助属性

### 4. 实体完整性
- ✅ 继承 Entity
- ✅ 私有字段 + getter
- ✅ 构造函数私有
- ✅ DTO 转换方法（4 个）
- ✅ forCreate, clone, create 工厂方法

### 5. 代码质量
- ✅ TypeScript 类型完全正确
- ✅ 所有方法都有注释
- ✅ 遵循 DDD 原则
- ✅ 遵循 Repository 模块的代码风格
- ✅ 没有简化或省略

---

## 🚀 下一步行动

1. ⏳ 完成 TaskMetadata 值对象
2. ⏳ 创建 value-objects/index.ts
3. ⏳ 完成 TaskExecution 实体
4. ⏳ 完成 TaskHistory 实体  
5. ⏳ 创建 entities/index.ts
6. ⏳ **完成 ScheduleTask 聚合根**（最核心，500+ 行）
7. ⏳ 创建 aggregates/index.ts
8. ⏳ 重构 schedule/index.ts

**预计总代码量**: 约 2000-2500 行（与 Repository 模块相当）

---

**关键原则**: 
- ✅ **严格参考 Repository 模块**
- ✅ **不简化，不省略**
- ✅ **完全遵循 DDD 原则**
- ✅ **聚合根是事务边界**
- ✅ **值对象不可变**
- ✅ **实体有标识符**
