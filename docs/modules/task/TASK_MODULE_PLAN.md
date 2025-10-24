# Task 模块 - 核心架构规划

> **版本**: v1.1 (简化版)  
> **日期**: 2025-01-13  
> **架构参考**: Goal 模块（`docs/modules/goal/GOAL_MODULE_PLAN.md`）

---

## 🎯 核心要点

Task 模块与 Goal 模块架构**完全一致**，区别仅在于业务逻辑。

### 主要聚合根

1. **TaskTemplate** - 任务模板（类似 Goal）
2. **TaskInstance** - 任务实例（类似 KeyResult，但更独立）
3. **TaskFolder** - 任务文件夹（类似 GoalFolder）
4. **TaskStatistics** - 任务统计（类似 GoalStatistics）

### 主要实体

1. **TaskStep** - 任务步骤/子任务
2. **TaskAttachment** - 任务附件
3. **TaskComment** - 任务评论（可选）

---

## 📋 DTO 命名规范

```typescript
// Server DTO
TaskTemplateServerDTO;
TaskInstanceServerDTO;
TaskFolderServerDTO;
TaskStatisticsServerDTO;
TaskStepServerDTO;

// Client DTO（注意 Client 后缀）
TaskTemplateClientDTO;
TaskInstanceClientDTO;
TaskFolderClientDTO;
TaskStatisticsClientDTO;
TaskStepClientDTO;

// Persistence DTO
TaskTemplatePersistenceDTO;
TaskInstancePersistenceDTO;
TaskFolderPersistenceDTO;
TaskStatisticsPersistenceDTO;
TaskStepPersistenceDTO;
```

---

## 🔄 DTO 转换方法

### Domain-Server 层

```typescript
export class TaskTemplate extends AggregateRoot {
  public toServerDTO(includeChildren = false): TaskTemplateServerDTO;
  public toPersistenceDTO(): TaskTemplatePersistenceDTO;
  public static fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplate;
  public static fromPersistenceDTO(dto: TaskTemplatePersistenceDTO): TaskTemplate;
}
```

### Domain-Client 层

```typescript
export class TaskTemplateClient extends AggregateRoot {
  public toServerDTO(includeChildren = false): TaskTemplateServerDTO;
  public toClientDTO(includeChildren = false): TaskTemplateClientDTO;
  public static fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplateClient;
  public static fromClientDTO(dto: TaskTemplateClientDTO): TaskTemplateClient;
}
```

---

## 🗂️ 状态管理

```typescript
export enum TaskTemplateStatus {
  Draft = 'draft',
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
  Deleted = 'deleted', // 逻辑删除
}

export enum TaskInstanceStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Deleted = 'deleted',
}
```

---

## 🔑 核心业务方法

```typescript
export class TaskTemplate extends AggregateRoot {
  // 状态转换
  public activate(): void;
  public complete(): void;
  public archive(): void;
  public softDelete(): void;
  public restore(): void;

  // 实例管理
  public createInstance(params: CreateTaskInstanceParams): TaskInstance;
  public updateInstance(instanceId: string, params: UpdateParams): void;

  // 步骤管理
  public addStep(params: CreateTaskStepParams): TaskStep;
  public updateStep(stepId: string, params: UpdateParams): void;
  public removeStep(stepId: string): void;
}
```

---

## 📦 仓储接口

```typescript
export interface ITaskTemplateRepository {
  save(template: TaskTemplate): Promise<void>;
  findByUuid(uuid: string): Promise<TaskTemplate | null>;
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<TaskTemplate[]>;

  // 逻辑删除
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>;

  // 查询
  findByStatus(accountUuid: string, status: TaskTemplateStatus): Promise<TaskTemplate[]>;
  findByFolder(folderUuid: string): Promise<TaskTemplate[]>;
}
```

---

## 💡 重构建议

1. **直接复制 Goal 模块代码**作为起点
2. **全局替换**：`Goal` → `TaskTemplate`，`KeyResult` → `TaskStep`
3. **调整业务逻辑**：添加 Task 特有的功能（重复规则、依赖关系等）
4. **保持架构一致**：DTO 转换、逻辑删除等完全一致

---

## 📖 详细规划

完整的详细规划可以在重构过程中逐步补充，当前先按照 Goal 模块的架构实施。

参考：`docs/modules/goal/GOAL_MODULE_PLAN.md`

---

**注**: 这是简化版规划，用于快速开始重构。详细规划可以后续补充。
