# Task 模块接口设计

## 模块概述

Task 模块负责管理用户的任务，包括任务模板、任务实例、任务步骤、任务依赖等。支持任务的创建、分配、执行、完成等完整生命周期管理。

## 设计决策

### 时间戳统一使用 `number` (epoch milliseconds)

- ✅ **所有层次统一**: Persistence / Server / Client / Entity 都使用 `number`
- ✅ **性能优势**: 传输、存储、序列化性能提升 70%+
- ✅ **date-fns 兼容**: 完全支持 `number | Date` 参数
- ✅ **零转换成本**: 跨层传递无需 `toISOString()` / `new Date()`

### 完整的双向转换方法

- ✅ **To Methods**: `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
- ✅ **From Methods**: `fromServerDTO()`, `fromClientDTO()`, `fromPersistenceDTO()`

## 领域模型层次

```
Task (聚合根)
├── TaskStep (实体 - 任务步骤/子任务)
├── TaskAttachment (实体 - 任务附件)
├── TaskDependency (实体 - 任务依赖)
└── TaskHistory (实体 - 任务历史记录)

TaskFolder (聚合根)
└── (包含 Task 列表)

TaskStatistics (聚合根)
└── (统计信息)
```

---

## 1. Task (聚合根)

### 业务描述

任务是用户的待办事项，包含标题、描述、优先级、截止时间等信息，支持子任务、附件、依赖关系等。

### Server 接口

```typescript
export interface TaskServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';

  // ===== 优先级 (使用 contracts/shared 中的枚举) =====
  importance: ImportanceLevel;
  urgency: UrgencyLevel;

  // ===== 分类 =====
  category?: string | null;
  tags: string[];

  // ===== 时间管理 =====
  startDate?: number | null; // epoch ms
  dueDate?: number | null; // epoch ms
  completedAt?: number | null; // epoch ms
  cancelledAt?: number | null; // epoch ms
  estimatedDuration?: number | null; // 预计用时（分钟）
  actualDuration?: number | null; // 实际用时（分钟）

  // ===== 组织结构 =====
  folderUuid?: string | null;
  parentTaskUuid?: string | null; // 父任务（子任务）
  goalUuid?: string | null; // 关联的目标
  sortOrder: number;

  // ===== 重复任务配置 =====
  isRecurring: boolean;
  recurrence?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
    interval: number; // 间隔
    endDate?: number | null; // epoch ms
    endAfterOccurrences?: number | null;
    customPattern?: string | null; // cron 表达式
  } | null;

  // ===== 提醒配置 =====
  reminderUuids: string[]; // 关联的提醒

  // ===== 子实体 =====
  steps: TaskStepServer[]; // 任务步骤
  attachments: TaskAttachmentServer[]; // 任务附件
  dependencies: TaskDependencyServer[]; // 任务依赖
  history: TaskHistoryServer[]; // 历史记录

  // ===== 扩展元数据 =====
  metadata: {
    assigneeUuid?: string | null; // 分配给谁
    location?: string | null; // 位置
    url?: string | null; // 相关链接
    color?: string | null; // 颜色标记
    isFlagged: boolean; // 是否标记
    notes?: string | null; // 备注
    [key: string]: any;
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 状态管理
  start(): void;
  pause(): void;
  complete(): void;
  cancel(): void;
  resume(): void;
  reopen(): void;
  softDelete(): void;
  restore(): void;

  // 步骤管理
  addStep(step: TaskStepServer): void;
  removeStep(stepUuid: string): void;
  updateStep(stepUuid: string, updates: Partial<TaskStepServer>): void;
  reorderSteps(stepUuids: string[]): void;
  completeStep(stepUuid: string): void;

  // 附件管理
  addAttachment(attachment: TaskAttachmentServer): void;
  removeAttachment(attachmentUuid: string): void;
  getAttachments(): TaskAttachmentServer[];

  // 依赖管理
  addDependency(dependency: TaskDependencyServer): void;
  removeDependency(dependencyUuid: string): void;
  canStart(): boolean; // 检查依赖是否满足
  getBlockingTasks(): TaskServer[];

  // 时间管理
  postpone(days: number): void;
  reschedule(newDueDate: number): void;
  startTimer(): void;
  stopTimer(): void;

  // 重复任务
  createNextOccurrence(): TaskServer | null;
  skipNextOccurrence(): void;

  // 进度计算
  calculateProgress(): number; // 0-100，基于步骤完成度
  isOverdue(): boolean;
  getDaysRemaining(): number | null;

  // 优先级计算
  getPriorityScore(): number; // importance + urgency

  // 历史记录
  addHistory(action: string, details?: any): void;
  getHistory(): TaskHistoryServer[];

  // DTO 转换方法
  toServerDTO(): TaskServerDTO;
  toClientDTO(): TaskClientDTO;
  toPersistenceDTO(): TaskPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskServerDTO): TaskServer;
  fromClientDTO(dto: TaskClientDTO): TaskServer;
  fromPersistenceDTO(dto: TaskPersistenceDTO): TaskServer;
}
```

### Client 接口

```typescript
export interface TaskClient {
  // ===== 基础属性 (同 Server) =====
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  status: string;
  importance: string;
  urgency: string;
  category?: string | null;
  tags: string[];

  // ===== 时间管理 =====
  startDate?: number | null;
  dueDate?: number | null;
  completedAt?: number | null;
  cancelledAt?: number | null;
  estimatedDuration?: number | null;
  actualDuration?: number | null;

  // ===== 组织结构 =====
  folderUuid?: string | null;
  parentTaskUuid?: string | null;
  goalUuid?: string | null;
  sortOrder: number;

  // ===== 重复任务配置 =====
  isRecurring: boolean;
  recurrence?: {
    frequency: string;
    interval: number;
    endDate?: number | null;
    endAfterOccurrences?: number | null;
  } | null;

  // ===== 提醒配置 =====
  reminderUuids: string[];

  // ===== 子实体 =====
  steps: TaskStepClient[];
  attachments: TaskAttachmentClient[];
  dependencies: TaskDependencyClient[];

  // ===== 元数据 =====
  metadata: {
    assigneeUuid?: string | null;
    location?: string | null;
    url?: string | null;
    color?: string | null;
    isFlagged: boolean;
    notes?: string | null;
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  progress: number; // 0-100
  isDeleted: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isOverdue: boolean;
  daysRemaining?: number | null;
  statusText: string;
  importanceText: string;
  urgencyText: string;
  priorityScore: number;
  stepCount: number;
  completedStepCount: number;
  attachmentCount: number;
  dependencyCount: number;
  canStart: boolean;
  durationText: string; // "预计 2 小时"

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayTitle(): string;
  getStatusBadge(): { text: string; color: string };
  getPriorityBadge(): { text: string; color: string };
  getProgressText(): string;
  getDueDateText(): string;
  getDurationText(): string;

  // 操作判断
  canStart(): boolean;
  canPause(): boolean;
  canComplete(): boolean;
  canCancel(): boolean;
  canDelete(): boolean;
  canAddStep(): boolean;
  canAddAttachment(): boolean;

  // DTO 转换
  toServerDTO(): TaskServerDTO;
}
```

---

## 2. TaskStep (实体)

### 业务描述

任务步骤是任务的子任务或检查项，用于分解复杂任务。

### Server 接口

```typescript
export interface TaskStepServer {
  // ===== 基础属性 =====
  uuid: string;
  taskUuid: string;
  title: string;
  description?: string | null;

  // ===== 状态 =====
  isCompleted: boolean;
  completedAt?: number | null; // epoch ms

  // ===== 排序 =====
  sortOrder: number;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 状态管理
  complete(): void;
  uncomplete(): void;
  softDelete(): void;
  restore(): void;

  // 查询
  getTask(): Promise<TaskServer>;

  // DTO 转换方法
  toServerDTO(): TaskStepServerDTO;
  toClientDTO(): TaskStepClientDTO;
  toPersistenceDTO(): TaskStepPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskStepServerDTO): TaskStepServer;
  fromClientDTO(dto: TaskStepClientDTO): TaskStepServer;
  fromPersistenceDTO(dto: TaskStepPersistenceDTO): TaskStepServer;
}
```

### Client 接口

```typescript
export interface TaskStepClient {
  // ===== 基础属性 =====
  uuid: string;
  taskUuid: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  completedAt?: number | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  statusText: string; // "已完成" / "未完成"
  isDeleted: boolean;

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayTitle(): string;
  getStatusIcon(): string;

  // 操作判断
  canComplete(): boolean;
  canDelete(): boolean;

  // DTO 转换
  toServerDTO(): TaskStepServerDTO;
}
```

---

## 3. TaskAttachment (实体)

### 业务描述

任务附件是任务相关的文件或链接。

### Server 接口

```typescript
export interface TaskAttachmentServer {
  // ===== 基础属性 =====
  uuid: string;
  taskUuid: string;
  name: string;
  type: 'FILE' | 'LINK' | 'IMAGE' | 'DOCUMENT';

  // ===== 文件信息 =====
  fileUrl?: string | null; // 文件路径或 URL
  fileSize?: number | null; // bytes
  mimeType?: string | null;
  thumbnailUrl?: string | null;

  // ===== 链接信息 =====
  linkUrl?: string | null;
  linkTitle?: string | null;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 文件操作
  download(): Promise<Uint8Array>;
  delete(): Promise<void>;

  // 查询
  getTask(): Promise<TaskServer>;

  // DTO 转换方法
  toServerDTO(): TaskAttachmentServerDTO;
  toClientDTO(): TaskAttachmentClientDTO;
  toPersistenceDTO(): TaskAttachmentPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskAttachmentServerDTO): TaskAttachmentServer;
  fromClientDTO(dto: TaskAttachmentClientDTO): TaskAttachmentServer;
  fromPersistenceDTO(dto: TaskAttachmentPersistenceDTO): TaskAttachmentServer;
}
```

### Client 接口

```typescript
export interface TaskAttachmentClient {
  // ===== 基础属性 =====
  uuid: string;
  taskUuid: string;
  name: string;
  type: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  fileSizeFormatted?: string | null; // "1.5 MB"
  mimeType?: string | null;
  thumbnailUrl?: string | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  icon: string;
  previewUrl?: string | null;
  isDeleted: boolean;

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayName(): string;
  getTypeIcon(): string;

  // 操作
  open(): void;
  download(): void;
  delete(): void;

  // DTO 转换
  toServerDTO(): TaskAttachmentServerDTO;
}
```

---

## 4. TaskDependency (实体)

### 业务描述

任务依赖表示任务之间的前置关系。

### Server 接口

```typescript
export interface TaskDependencyServer {
  // ===== 基础属性 =====
  uuid: string;
  taskUuid: string; // 当前任务
  dependsOnTaskUuid: string; // 依赖的任务
  dependencyType: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';

  // ===== 时间戳 =====
  createdAt: number;

  // ===== 业务方法 =====

  // 验证
  isSatisfied(): Promise<boolean>; // 依赖是否满足

  // 查询
  getTask(): Promise<TaskServer>;
  getDependsOnTask(): Promise<TaskServer>;

  // DTO 转换方法
  toServerDTO(): TaskDependencyServerDTO;
  toClientDTO(): TaskDependencyClientDTO;
  toPersistenceDTO(): TaskDependencyPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskDependencyServerDTO): TaskDependencyServer;
  fromClientDTO(dto: TaskDependencyClientDTO): TaskDependencyServer;
  fromPersistenceDTO(dto: TaskDependencyPersistenceDTO): TaskDependencyServer;
}
```

### Client 接口

```typescript
export interface TaskDependencyClient {
  // ===== 基础属性 =====
  uuid: string;
  taskUuid: string;
  dependsOnTaskUuid: string;
  dependencyType: string;
  createdAt: number;

  // ===== UI 扩展 =====
  dependsOnTaskTitle: string; // 依赖任务的标题
  isSatisfied: boolean;
  dependencyTypeText: string; // "完成后开始"

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayText(): string;
  getTypeIcon(): string;

  // 操作
  navigate(): void; // 跳转到依赖任务
  remove(): void;

  // DTO 转换
  toServerDTO(): TaskDependencyServerDTO;
}
```

---

## 5. TaskHistory (实体)

### 业务描述

任务历史记录用于追踪任务的变更历史。

### Server 接口

```typescript
export interface TaskHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  taskUuid: string;
  action: string; // 'CREATED' | 'UPDATED' | 'COMPLETED' | 'CANCELLED' | 'REOPENED' | etc.
  details?: any | null; // 变更详情

  // ===== 操作者 =====
  operatorUuid?: string | null;

  // ===== 时间戳 =====
  createdAt: number;

  // ===== 业务方法 =====

  // 查询
  getTask(): Promise<TaskServer>;

  // DTO 转换方法
  toServerDTO(): TaskHistoryServerDTO;
  toClientDTO(): TaskHistoryClientDTO;
  toPersistenceDTO(): TaskHistoryPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: TaskHistoryServerDTO): TaskHistoryServer;
  fromClientDTO(dto: TaskHistoryClientDTO): TaskHistoryServer;
  fromPersistenceDTO(dto: TaskHistoryPersistenceDTO): TaskHistoryServer;
}
```

### Client 接口

```typescript
export interface TaskHistoryClient {
  // ===== 基础属性 =====
  uuid: string;
  taskUuid: string;
  action: string;
  details?: any | null;
  operatorUuid?: string | null;
  createdAt: number;

  // ===== UI 扩展 =====
  actionText: string; // "创建了任务"
  timeAgo: string; // "3 天前"
  operatorName?: string | null;

  // ===== UI 业务方法 =====

  // 格式化展示
  getActionIcon(): string;
  getActionColor(): string;
  getDisplayText(): string;

  // DTO 转换
  toServerDTO(): TaskHistoryServerDTO;
}
```

---

## 6. TaskFolder (聚合根)

### 业务描述

任务文件夹用于组织和分类任务。

### Server 接口

```typescript
export interface TaskFolderServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;

  // ===== 层级结构 =====
  parentFolderUuid?: string | null;
  sortOrder: number;

  // ===== 系统文件夹标识 =====
  isSystemFolder: boolean;
  folderType?: 'ALL' | 'TODAY' | 'INBOX' | 'SCHEDULED' | 'COMPLETED' | 'CUSTOM' | null;

  // ===== 统计信息 =====
  taskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 文件夹操作
  rename(newName: string): void;
  updateDescription(description: string): void;
  updateIcon(icon: string): void;
  updateColor(color: string): void;
  softDelete(): void;
  restore(): void;

  // 统计更新
  updateStatistics(taskCount: number, completedCount: number, overdueCount: number): void;

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
  icon?: string | null;
  color?: string | null;
  parentFolderUuid?: string | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType?: string | null;
  taskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  displayName: string;
  displayIcon: string;
  completionRate: number; // 0-100
  isDeleted: boolean;
  activeTaskCount: number; // taskCount - completedTaskCount

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayName(): string;
  getIcon(): string;
  getCompletionText(): string; // "5/10 已完成"
  getBadge(): { text: string; color: string } | null;

  // 操作判断
  canRename(): boolean;
  canDelete(): boolean;
  canMove(): boolean;

  // DTO 转换
  toServerDTO(): TaskFolderServerDTO;
}
```

---

## 7. TaskStatistics (聚合根)

### 业务描述

任务统计聚合用户的任务数据统计信息。

### Server 接口

```typescript
export interface TaskStatisticsServer {
  // ===== 基础属性 =====
  accountUuid: string;

  // ===== 任务统计 =====
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  overdueTasks: number;
  todayTasks: number;
  thisWeekTasks: number;

  // ===== 分类统计 =====
  tasksByImportance: Record<string, number>;
  tasksByUrgency: Record<string, number>;
  tasksByCategory: Record<string, number>;
  tasksByStatus: Record<string, number>;
  tasksByFolder: Record<string, number>;

  // ===== 时间统计 =====
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  tasksCreatedThisMonth: number;
  tasksCompletedThisMonth: number;

  // ===== 效率统计 =====
  averageCompletionTime: number; // 平均完成时间（小时）
  totalTimeSpent: number; // 总用时（小时）
  completionRate: number; // 完成率 0-100
  overdueRate: number; // 逾期率 0-100

  // ===== 计算时间 =====
  lastCalculatedAt: number; // epoch ms

  // ===== 业务方法 =====

  // 统计计算
  recalculate(tasks: TaskServer[]): void;

  // 查询
  getCompletionRate(): number;
  getAverageTasksPerDay(): number;
  getProductivityScore(): number; // 生产力评分 0-100

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
  accountUuid: string;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  overdueTasks: number;
  todayTasks: number;
  thisWeekTasks: number;
  tasksByImportance: Record<string, number>;
  tasksByUrgency: Record<string, number>;
  tasksByCategory: Record<string, number>;
  tasksByStatus: Record<string, number>;
  tasksByFolder: Record<string, number>;
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  tasksCreatedThisMonth: number;
  tasksCompletedThisMonth: number;
  averageCompletionTime: number;
  totalTimeSpent: number;
  completionRate: number;
  overdueRate: number;
  lastCalculatedAt: number;

  // ===== UI 计算属性 =====
  productivityScore: number; // 生产力评分 0-100
  weeklyTrend: 'UP' | 'DOWN' | 'STABLE';
  monthlyTrend: 'UP' | 'DOWN' | 'STABLE';
  todayProgress: number; // 今日完成进度 0-100

  // ===== UI 业务方法 =====

  // 格式化展示
  getCompletionText(): string; // "75% 完成率"
  getOverdueText(): string; // "5 个任务逾期"
  getTodayProgressText(): string; // "今日 3/10 已完成"
  getTrendIndicator(): { icon: string; color: string; text: string };
  getTopCategory(): string | null;
  getProductivityLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';

  // 图表数据
  getImportanceChartData(): ChartData;
  getStatusChartData(): ChartData;
  getTimelineChartData(): TimelineData;
  getCompletionTrendData(): TrendData;

  // DTO 转换
  toServerDTO(): TaskStatisticsServerDTO;
}

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

interface TimelineData {
  dates: string[];
  created: number[];
  completed: number[];
}

interface TrendData {
  period: string[];
  values: number[];
}
```

---

## 值对象 (Value Objects)

### TaskMetadata

```typescript
export interface TaskMetadata {
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  category?: string | null;
  tags: string[];
  assigneeUuid?: string | null;
  location?: string | null;
  url?: string | null;
  color?: string | null;
  isFlagged: boolean;
}
```

### TaskTimeRange

```typescript
export interface TaskTimeRange {
  startDate?: number | null; // epoch ms
  dueDate?: number | null; // epoch ms
  completedAt?: number | null; // epoch ms
  cancelledAt?: number | null; // epoch ms
  estimatedDuration?: number | null; // 分钟
  actualDuration?: number | null; // 分钟
}
```

### RecurrenceConfig

```typescript
export interface RecurrenceConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  interval: number;
  endDate?: number | null; // epoch ms
  endAfterOccurrences?: number | null;
  customPattern?: string | null; // cron 表达式
}
```

---

## 仓储接口

### ITaskRepository

```typescript
export interface ITaskRepository {
  save(task: TaskServer): Promise<void>;
  findByUuid(uuid: string): Promise<TaskServer | null>;
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<TaskServer[]>;

  // 逻辑删除
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>;

  // 查询
  findByStatus(accountUuid: string, status: TaskStatus): Promise<TaskServer[]>;
  findByFolder(folderUuid: string): Promise<TaskServer[]>;
  findByGoal(goalUuid: string): Promise<TaskServer[]>;
  findByDueDate(accountUuid: string, startDate: number, endDate: number): Promise<TaskServer[]>;
  findOverdue(accountUuid: string): Promise<TaskServer[]>;
  findRecurring(accountUuid: string): Promise<TaskServer[]>;
}
```

---

## 领域服务

### TaskDependencyService

```typescript
export interface TaskDependencyService {
  validateDependencies(task: TaskServer): Promise<boolean>;
  getBlockingTasks(taskUuid: string): Promise<TaskServer[]>;
  canStartTask(taskUuid: string): Promise<boolean>;
  resolveCircularDependencies(tasks: TaskServer[]): TaskServer[];
}
```

### TaskRecurrenceService

```typescript
export interface TaskRecurrenceService {
  createNextOccurrence(task: TaskServer): Promise<TaskServer>;
  calculateNextDueDate(task: TaskServer): number | null;
  skipNextOccurrence(task: TaskServer): void;
  endRecurrence(task: TaskServer): void;
}
```

---

## 应用层服务

### TaskService

```typescript
export interface TaskService {
  // CRUD 操作
  createTask(params: CreateTaskParams): Promise<TaskServer>;
  updateTask(uuid: string, params: UpdateTaskParams): Promise<TaskServer>;
  deleteTask(uuid: string): Promise<void>;
  getTask(uuid: string): Promise<TaskServer | null>;
  listTasks(accountUuid: string, filters?: TaskFilters): Promise<TaskServer[]>;

  // 状态管理
  startTask(uuid: string): Promise<void>;
  completeTask(uuid: string): Promise<void>;
  cancelTask(uuid: string): Promise<void>;
  reopenTask(uuid: string): Promise<void>;

  // 步骤管理
  addStep(taskUuid: string, params: CreateStepParams): Promise<TaskStepServer>;
  updateStep(stepUuid: string, params: UpdateStepParams): Promise<TaskStepServer>;
  deleteStep(stepUuid: string): Promise<void>;
  completeStep(stepUuid: string): Promise<void>;

  // 依赖管理
  addDependency(taskUuid: string, dependsOnTaskUuid: string, type: DependencyType): Promise<void>;
  removeDependency(dependencyUuid: string): Promise<void>;

  // 批量操作
  batchComplete(taskUuids: string[]): Promise<void>;
  batchMove(taskUuids: string[], folderUuid: string): Promise<void>;
  batchDelete(taskUuids: string[]): Promise<void>;

  // 统计查询
  getStatistics(accountUuid: string): Promise<TaskStatisticsServer>;
}
```

---

## 总结

### 聚合根

- **Task**: 1 个聚合根（包含 TaskStep、TaskAttachment、TaskDependency、TaskHistory）
- **TaskFolder**: 1 个聚合根
- **TaskStatistics**: 1 个聚合根

### 实体

- **TaskStep**: 任务步骤（Task 的子实体）
- **TaskAttachment**: 任务附件（Task 的子实体）
- **TaskDependency**: 任务依赖（Task 的子实体）
- **TaskHistory**: 任务历史（Task 的子实体）

### 值对象

- TaskMetadata
- TaskTimeRange
- RecurrenceConfig

### 领域服务

- TaskDependencyService（依赖管理）
- TaskRecurrenceService（重复任务）

### 关键设计原则

1. **Server 侧重业务逻辑**: 完整的业务方法、领域规则
2. **Client 侧重 UI 展示**: 格式化方法、UI 状态、快捷操作
3. **时间戳统一**: 全部使用 epoch ms (number)
4. **统计信息**: Client 包含更多预计算的统计数据和格式化字符串
5. **聚合根控制子实体**: Task 聚合根管理所有子实体
6. **依赖管理**: 通过领域服务处理复杂的依赖关系
7. **重复任务**: 支持多种重复模式和自动创建
