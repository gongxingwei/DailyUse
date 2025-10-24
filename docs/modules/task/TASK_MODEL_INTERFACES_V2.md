# Task 模块接口设计 V2

## 版本说明

- **版本**: V2
- **更新日期**: 2025-10-14
- **更新内容**:
  - 采用 **任务模板-任务实例** 架构
  - 支持重复任务、单次任务
  - 支持时间段任务、时间点任务、全天任务
  - 支持与 Goal 模块的 KeyResult 绑定
  - 支持任务提醒功能

## 模块概述

Task 模块负责管理用户的任务，支持单次任务和重复任务两种类型。采用 **任务模板-任务实例** 的设计模式：

- **TaskTemplate**: 任务模板，定义任务的基础信息和重复规则
- **TaskInstance**: 任务实例，表示任务模板在特定时间的具体执行

## 设计决策

### 时间戳统一使用 `number` (epoch milliseconds)

- ✅ **所有层次统一**: Persistence / Server / Client / Entity 都使用 `number`
- ✅ **性能优势**: 传输、存储、序列化性能提升 70%+
- ✅ **date-fns 兼容**: 完全支持 `number | Date` 参数
- ✅ **零转换成本**: 跨层传递无需 `toISOString()` / `new Date()`

### 完整的双向转换方法

- ✅ **To Methods**: `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
- ✅ **From Methods**: `fromServerDTO()`, `fromClientDTO()`, `fromPersistenceDTO()`

### 任务模板-实例架构

- ✅ **TaskTemplate**: 任务模板，定义任务的基础信息、重复规则
- ✅ **TaskInstance**: 任务实例，表示任务在特定日期的执行状态
- ✅ **单次任务**: TaskTemplate 不重复，只有一个 TaskInstance
- ✅ **重复任务**: TaskTemplate 定义重复规则，生成多个 TaskInstance

## 领域模型层次

```
TaskTemplate (聚合根 - 任务模板)
├── RecurrenceRule (值对象 - 重复规则)
├── ReminderConfig (值对象 - 提醒配置)
├── GoalBinding (值对象 - 目标绑定)
└── TaskTemplateHistory (实体 - 模板变更历史)

TaskInstance (聚合根 - 任务实例)
├── TimeRange (值对象 - 时间范围)
├── CompletionRecord (值对象 - 完成记录)
└── SkipRecord (值对象 - 跳过记录)

TaskFolder (聚合根 - 任务文件夹)

TaskStatistics (聚合根 - 任务统计)
```

---

## 1. TaskTemplate (聚合根)

### 业务描述

任务模板定义任务的基础信息、时间规则、重复规则等。对于单次任务，模板只生成一个实例；对于重复任务，模板会生成多个实例。

### Server 接口

```typescript
export interface TaskTemplateServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;

  // ===== 任务类型 =====
  taskType: 'ONE_TIME' | 'RECURRING'; // 单次任务 | 重复任务

  // ===== 时间类型 =====
  timeType: 'ALL_DAY' | 'TIME_POINT' | 'TIME_RANGE'; // 全天 | 时间点 | 时间段

  // ===== 时间配置 =====
  timeConfig: {
    // 对于单次任务: 任务的日期
    // 对于重复任务: 重复规则的开始日期
    startDate: number; // epoch ms (日期零点)

    // 对于单次任务: 可选的结束日期
    // 对于重复任务: 重复规则的结束日期 (可选)
    endDate?: number | null; // epoch ms (日期零点)

    // 对于 TIME_POINT: 任务时间点 (如 "08:00")
    timePoint?: string | null; // "HH:mm" 格式

    // 对于 TIME_RANGE: 任务时间段
    timeRange?: {
      startTime: string; // "HH:mm" 格式 (如 "08:00")
      endTime: string; // "HH:mm" 格式 (如 "09:00")
    } | null;
  };

  // ===== 重复规则 (仅重复任务) =====
  recurrenceRule?: RecurrenceRule | null;

  // ===== 提醒配置 =====
  reminderConfig?: ReminderConfig | null;

  // ===== 重要性和紧急性 =====
  importance: ImportanceLevel; // from @dailyuse/contracts/shared
  urgency: UrgencyLevel; // from @dailyuse/contracts/shared

  // ===== 目标绑定 =====
  goalBinding?: GoalBinding | null; // 与 Goal 模块的 KeyResult 绑定

  // ===== 分类 =====
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;

  // ===== 状态 =====
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';

  // ===== 实例生成 =====
  instanceGeneration: {
    lastGeneratedDate?: number | null; // epoch ms - 最后生成实例的日期
    generateAheadDays: number; // 提前生成实例的天数 (默认 30)
  };

  // ===== 模板变更历史 =====
  history: TaskTemplateHistoryServer[];

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 实例生成
  generateInstances(fromDate: number, toDate: number): TaskInstanceServer[];
  getInstanceForDate(date: number): TaskInstanceServer | null;
  shouldGenerateInstance(date: number): boolean;

  // 状态管理
  activate(): void;
  pause(): void;
  archive(): void;
  softDelete(): void;
  restore(): void;

  // 时间规则
  isActiveOnDate(date: number): boolean;
  getNextOccurrence(afterDate: number): number | null;
  getOccurrencesInRange(startDate: number, endDate: number): number[];

  // 提醒
  hasReminder(): boolean;
  getReminderTime(instanceDate: number): number | null; // 返回提醒时间戳

  // 目标绑定
  bindToGoal(goalUuid: string, keyResultUuid: string, incrementValue: number): void;
  unbindFromGoal(): void;
  isLinkedToGoal(): boolean;

  // 历史记录
  addHistory(action: string, changes?: any): void;
  getHistory(limit?: number): TaskTemplateHistoryServer[];

  // 查询
  isOneTime(): boolean;
  isRecurring(): boolean;
  isAllDay(): boolean;
  isTimePoint(): boolean;
  isTimeRange(): boolean;

  // DTO 转换方法
  toServerDTO(): TaskTemplateServerDTO;
  toClientDTO(): TaskTemplateClientDTO;
  toPersistenceDTO(): TaskTemplatePersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplateServer;
  fromClientDTO(dto: TaskTemplateClientDTO): TaskTemplateServer;
  fromPersistenceDTO(dto: TaskTemplatePersistenceDTO): TaskTemplateServer;
}
```

### Client 接口

```typescript
export interface TaskTemplateClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: string;
  timeType: string;
  timeConfig: {
    startDate: number;
    endDate?: number | null;
    timePoint?: string | null;
    timeRange?: {
      startTime: string;
      endTime: string;
    } | null;
  };
  recurrenceRule?: RecurrenceRule | null;
  reminderConfig?: ReminderConfig | null;
  importance: string;
  urgency: string;
  goalBinding?: GoalBinding | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  displayTitle: string;
  taskTypeText: string; // "单次任务" | "重复任务"
  timeTypeText: string; // "全天" | "时间点" | "时间段"
  timeDisplayText: string; // "每天 08:00-09:00" | "周一至周五 09:00" | "全天任务"
  recurrenceText?: string | null; // "每天" | "每周一、三、五" | "每月 1 号"
  importanceText: string;
  urgencyText: string;
  statusText: string;
  hasReminder: boolean;
  reminderText?: string | null; // "提前 10 分钟提醒"
  isLinkedToGoal: boolean;
  goalLinkText?: string | null;

  // ===== UI 业务方法 =====

  // 格式化展示
  getImportanceBadge(): { text: string; color: string };
  getUrgencyBadge(): { text: string; color: string };
  getStatusBadge(): { text: string; color: string };
  getTimeDisplay(): string;
  getRecurrenceDisplay(): string;

  // 操作判断
  canEdit(): boolean;
  canDelete(): boolean;
  canPause(): boolean;
  canArchive(): boolean;

  // DTO 转换
  toServerDTO(): TaskTemplateServerDTO;
}
```

---

## 2. TaskInstance (聚合根)

### 业务描述

任务实例表示任务模板在特定日期的具体执行。每个实例都有自己的完成状态、实际执行时间等。

### Server 接口

```typescript
export interface TaskInstanceServer {
  // ===== 基础属性 =====
  uuid: string;
  templateUuid: string; // 关联的任务模板
  accountUuid: string;

  // ===== 实例信息 =====
  instanceDate: number; // epoch ms - 实例日期（零点）

  // ===== 时间信息 =====
  timeType: 'ALL_DAY' | 'TIME_POINT' | 'TIME_RANGE';
  timeRange?: TimeRange | null; // 实际执行时间范围

  // ===== 状态 =====
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'EXPIRED';

  // ===== 完成记录 =====
  completionRecord?: CompletionRecord | null;

  // ===== 跳过记录 =====
  skipRecord?: SkipRecord | null;

  // ===== 实际执行 =====
  actualExecution?: {
    startedAt?: number | null; // epoch ms
    completedAt?: number | null; // epoch ms
    durationMinutes?: number | null; // 实际花费时间（分钟）
  } | null;

  // ===== 笔记 =====
  note?: string | null; // 实例特定的笔记

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 状态管理
  start(): void;
  complete(note?: string): void;
  skip(reason: string): void;
  reset(): void;

  // 时间管理
  isOverdue(): boolean;
  canStart(): boolean;
  canComplete(): boolean;

  // 目标绑定
  getTemplate(): Promise<TaskTemplateServer>;
  shouldUpdateGoalProgress(): boolean;
  createGoalRecord(): Promise<void>; // 创建 GoalRecord

  // 查询
  isPending(): boolean;
  isInProgress(): boolean;
  isCompleted(): boolean;
  isSkipped(): boolean;
  isExpired(): boolean;

  // DTO 转换方法
  toServerDTO(): TaskInstanceServerDTO;
  toClientDTO(): TaskInstanceClientDTO;
  toPersistenceDTO(): TaskInstancePersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskInstanceServerDTO): TaskInstanceServer;
  fromClientDTO(dto: TaskInstanceClientDTO): TaskInstanceServer;
  fromPersistenceDTO(dto: TaskInstancePersistenceDTO): TaskInstanceServer;
}
```

### Client 接口

```typescript
export interface TaskInstanceClient {
  // ===== 基础属性 =====
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeType: string;
  timeRange?: TimeRange | null;
  status: string;
  completionRecord?: CompletionRecord | null;
  skipRecord?: SkipRecord | null;
  actualExecution?: {
    startedAt?: number | null;
    completedAt?: number | null;
    durationMinutes?: number | null;
  } | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;

  // ===== UI 计算属性 =====
  dateText: string; // "2025-10-14"
  timeText: string; // "08:00-09:00" | "09:00" | "全天"
  statusText: string;
  isOverdue: boolean;
  canStart: boolean;
  canComplete: boolean;
  durationText?: string | null; // "45 分钟"

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string; icon: string };
  getTimeDisplay(): string;
  getDateDisplay(): string;

  // 操作判断
  canEdit(): boolean;
  canDelete(): boolean;

  // DTO 转换
  toServerDTO(): TaskInstanceServerDTO;
}
```

---

## 3. TaskFolder (聚合根)

### 业务描述

任务文件夹用于分类组织任务模板。

### Server 接口

```typescript
export interface TaskFolderServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;

  // ===== 层级结构 =====
  parentFolderUuid?: string | null;
  order: number;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 层级管理
  moveTo(parentFolderUuid: string | null): void;
  getParent(): Promise<TaskFolderServer | null>;
  getChildren(): Promise<TaskFolderServer[]>;
  getPath(): Promise<TaskFolderServer[]>;

  // 任务统计
  getTemplateCount(): Promise<number>;

  // 状态管理
  softDelete(): void;
  restore(): void;

  // DTO 转换方法
  toServerDTO(): TaskFolderServerDTO;
  toClientDTO(): TaskFolderClientDTO;
  toPersistenceDTO(): TaskFolderPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskFolderServerDTO): TaskFolderServer;
  fromClientDTO(dto: TaskFolderClientDTO): TaskFolderServer;
  fromPersistenceDTO(dto: TaskFolderPersistenceDTO): TaskFolderServer;
}
```

### Client 接口

```typescript
export interface TaskFolderClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentFolderUuid?: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  displayName: string;
  templateCount: number;
  pathText: string; // "根目录 / 工作 / 项目"

  // ===== UI 业务方法 =====

  // 格式化展示
  getIcon(): string;
  getColorStyle(): string;

  // 操作判断
  canEdit(): boolean;
  canDelete(): boolean;
  hasChildren(): boolean;

  // DTO 转换
  toServerDTO(): TaskFolderServerDTO;
}
```

---

## 4. TaskStatistics (聚合根)

### 业务描述

任务统计信息。

### Server 接口

```typescript
export interface TaskStatisticsServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;

  // ===== 模板统计 =====
  templateStats: {
    totalTemplates: number;
    oneTimeTemplates: number;
    recurringTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    archivedTemplates: number;
  };

  // ===== 实例统计 =====
  instanceStats: {
    totalInstances: number;
    pendingInstances: number;
    inProgressInstances: number;
    completedInstances: number;
    skippedInstances: number;
    expiredInstances: number;
  };

  // ===== 今日统计 =====
  todayStats: {
    scheduledCount: number; // 今日计划任务数
    completedCount: number; // 今日完成任务数
    skippedCount: number; // 今日跳过任务数
    overdueCount: number; // 今日逾期任务数
    completionRate: number; // 完成率 (0-100)
  };

  // ===== 本周统计 =====
  weekStats: {
    scheduledCount: number;
    completedCount: number;
    skippedCount: number;
    completionRate: number;
  };

  // ===== 本月统计 =====
  monthStats: {
    scheduledCount: number;
    completedCount: number;
    skippedCount: number;
    completionRate: number;
  };

  // ===== 时间戳 =====
  calculatedAt: number;

  // ===== 业务方法 =====

  // 统计计算
  calculate(): Promise<void>;
  getCompletionRate(startDate: number, endDate: number): Promise<number>;
  getStreakDays(): Promise<number>; // 连续完成天数

  // DTO 转换方法
  toServerDTO(): TaskStatisticsServerDTO;
  toClientDTO(): TaskStatisticsClientDTO;
  toPersistenceDTO(): TaskStatisticsPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskStatisticsServerDTO): TaskStatisticsServer;
  fromClientDTO(dto: TaskStatisticsClientDTO): TaskStatisticsServer;
  fromPersistenceDTO(dto: TaskStatisticsPersistenceDTO): TaskStatisticsServer;
}
```

### Client 接口

```typescript
export interface TaskStatisticsClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  templateStats: {
    totalTemplates: number;
    oneTimeTemplates: number;
    recurringTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    archivedTemplates: number;
  };
  instanceStats: {
    totalInstances: number;
    pendingInstances: number;
    inProgressInstances: number;
    completedInstances: number;
    skippedInstances: number;
    expiredInstances: number;
  };
  todayStats: {
    scheduledCount: number;
    completedCount: number;
    skippedCount: number;
    overdueCount: number;
    completionRate: number;
  };
  weekStats: {
    scheduledCount: number;
    completedCount: number;
    skippedCount: number;
    completionRate: number;
  };
  monthStats: {
    scheduledCount: number;
    completedCount: number;
    skippedCount: number;
    completionRate: number;
  };
  calculatedAt: number;

  // ===== UI 计算属性 =====
  todayCompletionText: string; // "已完成 5/10"
  weekCompletionText: string;
  monthCompletionText: string;
  streakDaysText: string; // "连续 7 天"

  // ===== UI 业务方法 =====

  // 格式化展示
  getTodayProgressBar(): { percentage: number; color: string };
  getWeekProgressBar(): { percentage: number; color: string };
  getMonthProgressBar(): { percentage: number; color: string };

  // DTO 转换
  toServerDTO(): TaskStatisticsServerDTO;
}
```

---

## 5. TaskTemplateHistory (实体)

### 业务描述

任务模板的变更历史记录。

### Server 接口

```typescript
export interface TaskTemplateHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  templateUuid: string;
  action: string; // 'CREATED', 'UPDATED', 'PAUSED', 'ARCHIVED', 'DELETED', etc.
  changes?: any | null; // 变更内容

  // ===== 时间戳 =====
  createdAt: number;

  // ===== 业务方法 =====

  // 查询
  getTemplate(): Promise<TaskTemplateServer>;

  // DTO 转换方法
  toServerDTO(): TaskTemplateHistoryServerDTO;
  toClientDTO(): TaskTemplateHistoryClientDTO;
  toPersistenceDTO(): TaskTemplateHistoryPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskTemplateHistoryServerDTO): TaskTemplateHistoryServer;
  fromClientDTO(dto: TaskTemplateHistoryClientDTO): TaskTemplateHistoryServer;
  fromPersistenceDTO(dto: TaskTemplateHistoryPersistenceDTO): TaskTemplateHistoryServer;
}
```

### Client 接口

```typescript
export interface TaskTemplateHistoryClient {
  // ===== 基础属性 =====
  uuid: string;
  templateUuid: string;
  action: string;
  changes?: any | null;
  createdAt: number;

  // ===== UI 扩展 =====
  actionText: string;
  timeAgo: string;
  changesText?: string | null;

  // ===== UI 业务方法 =====

  // 格式化展示
  getActionIcon(): string;
  getDisplayText(): string;

  // DTO 转换
  toServerDTO(): TaskTemplateHistoryServerDTO;
}
```

---

## 值对象 (Value Objects)

### RecurrenceRule

```typescript
export interface RecurrenceRule {
  // ===== 重复频率 =====
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  // ===== 间隔 =====
  interval: number; // 每 N 天/周/月/年

  // ===== 每周重复（仅 WEEKLY） =====
  weekDays?:
    | ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY')[]
    | null;

  // ===== 每月重复（仅 MONTHLY） =====
  monthDays?: number[] | null; // [1, 15] 表示每月 1 号和 15 号
  monthWeekDay?: {
    week: number; // 1-4 表示第几周，-1 表示最后一周
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  } | null; // 例如：每月第一个周一

  // ===== 终止条件 =====
  endCondition: {
    type: 'NEVER' | 'END_DATE' | 'OCCURRENCE_COUNT';
    endDate?: number | null; // epoch ms
    occurrenceCount?: number | null;
  };
}
```

### ReminderConfig

```typescript
export interface ReminderConfig {
  // ===== 是否启用提醒 =====
  enabled: boolean;

  // ===== 提醒时机 =====
  reminderTime: {
    type: 'BEFORE_START' | 'AT_START' | 'CUSTOM_TIME';
    minutesBefore?: number | null; // 提前多少分钟（BEFORE_START）
    customTime?: string | null; // 自定义时间 "HH:mm" (CUSTOM_TIME)
  };

  // ===== 重复提醒 =====
  repeat?: {
    enabled: boolean;
    intervalMinutes: number; // 每隔多少分钟重复提醒
    maxRepeats: number; // 最多重复次数
  } | null;
}
```

### GoalBinding

```typescript
export interface GoalBinding {
  // ===== 目标绑定 =====
  goalUuid: string;
  keyResultUuid: string;

  // ===== 自动更新 =====
  autoUpdate: boolean; // 完成任务时自动更新 KeyResult
  incrementValue: number; // 每次完成增加的值
}
```

### TimeRange

```typescript
export interface TimeRange {
  // ===== 时间段 =====
  startTime: string; // "HH:mm" 格式
  endTime: string; // "HH:mm" 格式

  // ===== 实际时间戳 =====
  startTimestamp: number; // epoch ms
  endTimestamp: number; // epoch ms
}
```

### CompletionRecord

```typescript
export interface CompletionRecord {
  // ===== 完成信息 =====
  completedAt: number; // epoch ms
  completedBy: string; // accountUuid
  note?: string | null;

  // ===== 目标更新 =====
  goalRecordUuid?: string | null; // 创建的 GoalRecord UUID
}
```

### SkipRecord

```typescript
export interface SkipRecord {
  // ===== 跳过信息 =====
  skippedAt: number; // epoch ms
  skippedBy: string; // accountUuid
  reason?: string | null;
}
```

---

## 仓储接口

### ITaskTemplateRepository

```typescript
export interface ITaskTemplateRepository {
  save(template: TaskTemplateServer): Promise<void>;
  findByUuid(uuid: string): Promise<TaskTemplateServer | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskTemplateServer[]>;
  findByFolderUuid(folderUuid: string): Promise<TaskTemplateServer[]>;
  findActiveByAccountUuid(accountUuid: string): Promise<TaskTemplateServer[]>;

  // 查询
  findByStatus(accountUuid: string, status: string): Promise<TaskTemplateServer[]>;
  findByTaskType(
    accountUuid: string,
    taskType: 'ONE_TIME' | 'RECURRING',
  ): Promise<TaskTemplateServer[]>;

  // 删除
  delete(uuid: string): Promise<void>;
}
```

### ITaskInstanceRepository

```typescript
export interface ITaskInstanceRepository {
  save(instance: TaskInstanceServer): Promise<void>;
  findByUuid(uuid: string): Promise<TaskInstanceServer | null>;
  findByTemplateUuid(templateUuid: string): Promise<TaskInstanceServer[]>;
  findByAccountUuid(accountUuid: string): Promise<TaskInstanceServer[]>;
  findByDate(accountUuid: string, date: number): Promise<TaskInstanceServer[]>;
  findByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstanceServer[]>;
  findByStatus(accountUuid: string, status: string): Promise<TaskInstanceServer[]>;

  // 查询
  findPendingByDate(accountUuid: string, date: number): Promise<TaskInstanceServer[]>;
  findCompletedByDate(accountUuid: string, date: number): Promise<TaskInstanceServer[]>;
  findOverdue(accountUuid: string): Promise<TaskInstanceServer[]>;

  // 删除
  delete(uuid: string): Promise<void>;
  deleteByTemplateUuid(templateUuid: string): Promise<void>;
}
```

### ITaskFolderRepository

```typescript
export interface ITaskFolderRepository {
  save(folder: TaskFolderServer): Promise<void>;
  findByUuid(uuid: string): Promise<TaskFolderServer | null>;
  findByAccountUuid(accountUuid: string): Promise<TaskFolderServer[]>;
  findByParentUuid(parentUuid: string | null): Promise<TaskFolderServer[]>;

  // 删除
  delete(uuid: string): Promise<void>;
}
```

### ITaskStatisticsRepository

```typescript
export interface ITaskStatisticsRepository {
  save(stats: TaskStatisticsServer): Promise<void>;
  findByAccountUuid(accountUuid: string): Promise<TaskStatisticsServer | null>;
}
```

---

## 领域服务

### TaskInstanceGeneratorService

```typescript
export interface TaskInstanceGeneratorService {
  // 生成实例
  generateInstancesForTemplate(
    template: TaskTemplateServer,
    fromDate: number,
    toDate: number,
  ): Promise<TaskInstanceServer[]>;
  generateInstancesForAccount(accountUuid: string, fromDate: number, toDate: number): Promise<void>;

  // 批量生成
  generateUpcomingInstances(accountUuid: string, days: number): Promise<void>;
}
```

### TaskReminderService

```typescript
export interface TaskReminderService {
  // 提醒计算
  calculateReminderTime(instance: TaskInstanceServer): number | null; // epoch ms
  getReminderDueInstances(accountUuid: string): Promise<TaskInstanceServer[]>;

  // 发送提醒
  sendReminder(instance: TaskInstanceServer): Promise<void>;
}
```

### TaskGoalSyncService

```typescript
export interface TaskGoalSyncService {
  // 目标同步
  syncCompletionToGoal(instance: TaskInstanceServer): Promise<void>;
  createGoalRecord(instance: TaskInstanceServer): Promise<string>; // returns GoalRecord UUID
}
```

---

## 应用层服务

### TaskService

```typescript
export interface TaskService {
  // 任务模板管理
  createTemplate(template: Partial<TaskTemplateServer>): Promise<TaskTemplateServer>;
  updateTemplate(uuid: string, updates: Partial<TaskTemplateServer>): Promise<TaskTemplateServer>;
  deleteTemplate(uuid: string): Promise<void>;
  getTemplate(uuid: string): Promise<TaskTemplateServer | null>;
  listTemplates(accountUuid: string): Promise<TaskTemplateServer[]>;
  listActiveTemplates(accountUuid: string): Promise<TaskTemplateServer[]>;

  // 任务模板状态
  pauseTemplate(uuid: string): Promise<void>;
  activateTemplate(uuid: string): Promise<void>;
  archiveTemplate(uuid: string): Promise<void>;

  // 任务实例管理
  getInstance(uuid: string): Promise<TaskInstanceServer | null>;
  listInstancesByDate(accountUuid: string, date: number): Promise<TaskInstanceServer[]>;
  listInstancesByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstanceServer[]>;

  // 任务实例操作
  startInstance(uuid: string): Promise<void>;
  completeInstance(uuid: string, note?: string): Promise<void>;
  skipInstance(uuid: string, reason: string): Promise<void>;
  resetInstance(uuid: string): Promise<void>;

  // 实例生成
  generateInstances(accountUuid: string, days: number): Promise<void>;

  // 文件夹管理
  createFolder(folder: Partial<TaskFolderServer>): Promise<TaskFolderServer>;
  updateFolder(uuid: string, updates: Partial<TaskFolderServer>): Promise<TaskFolderServer>;
  deleteFolder(uuid: string): Promise<void>;
  listFolders(accountUuid: string): Promise<TaskFolderServer[]>;

  // 统计
  getStatistics(accountUuid: string): Promise<TaskStatisticsServer>;

  // 提醒
  getReminderDueTasks(accountUuid: string): Promise<TaskInstanceServer[]>;
}
```

---

## 总结

### V2 架构特点

#### ⭐️ 任务模板-实例架构

- **TaskTemplate**: 定义任务的基础信息和重复规则
- **TaskInstance**: 表示任务在特定日期的执行状态
- **单次任务**: 一个模板对应一个实例
- **重复任务**: 一个模板生成多个实例

#### ⭐️ 时间类型支持

- **ALL_DAY**: 全天任务（无具体时间）
- **TIME_POINT**: 时间点任务（如 "09:00"）
- **TIME_RANGE**: 时间段任务（如 "08:00-09:00"）

#### ⭐️ 重复规则支持

- **DAILY**: 每天重复
- **WEEKLY**: 每周重复（可指定星期几）
- **MONTHLY**: 每月重复（可指定日期或第几周的星期几）
- **YEARLY**: 每年重复

#### ⭐️ 提醒功能

- **BEFORE_START**: 开始前 N 分钟提醒
- **AT_START**: 开始时提醒
- **CUSTOM_TIME**: 自定义时间提醒
- **重复提醒**: 支持每隔 N 分钟重复提醒

#### ⭐️ 目标绑定

- 任务完成时自动更新 Goal 模块的 KeyResult
- 自动创建 GoalRecord 记录进度

### 聚合根

- **TaskTemplate**: 任务模板（定义任务规则）
- **TaskInstance**: 任务实例（表示具体执行）
- **TaskFolder**: 任务文件夹（分类管理）
- **TaskStatistics**: 任务统计（数据分析）

### 实体

- **TaskTemplateHistory**: 模板变更历史

### 值对象

- **RecurrenceRule**: 重复规则
- **ReminderConfig**: 提醒配置
- **GoalBinding**: 目标绑定
- **TimeRange**: 时间范围
- **CompletionRecord**: 完成记录
- **SkipRecord**: 跳过记录

### 领域服务

- **TaskInstanceGeneratorService**: 实例生成服务
- **TaskReminderService**: 提醒服务
- **TaskGoalSyncService**: 目标同步服务

### 关键设计原则

1. **模板-实例分离**: 清晰的架构，易于扩展
2. **灵活的时间配置**: 支持全天、时间点、时间段三种类型
3. **强大的重复规则**: 支持日/周/月/年级别的复杂重复
4. **智能提醒**: 多种提醒时机，支持重复提醒
5. **目标联动**: 任务完成自动更新目标进度
6. **统计分析**: 完整的任务统计和趋势分析
