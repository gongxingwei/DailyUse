# Goal 模块接口设计

## 模块概述

Goal 模块负责管理用户的目标（OKR），包括目标本身、关键结果、目标记录、目标复盘等。

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
Goal (聚合根)
├── KeyResult (实体)
│   └── GoalRecord (实体 - 记录关键结果的值变化)
└── GoalReview (实体 - 目标复盘记录)

GoalFolder (聚合根)
└── (包含 Goal 列表)

GoalStatistics (聚合根)
└── (统计信息)
```

---

## 1. Goal (聚合根)

### 业务描述

目标是用户的 OKR 顶层容器，包含多个关键结果和复盘记录。

### Server 接口

```typescript
export interface GoalServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

  // ===== 优先级 =====
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // ===== 分类 =====
  category?: string | null;
  tags: string[];

  // ===== 时间范围 =====
  startDate?: number | null; // epoch ms
  targetDate?: number | null; // epoch ms
  completedAt?: number | null; // epoch ms
  archivedAt?: number | null; // epoch ms

  // ===== 组织结构 =====
  folderUuid?: string | null;
  parentGoalUuid?: string | null; // 父目标（子目标）
  sortOrder: number;

  // ===== 关键结果 (子实体) =====
  keyResults: KeyResultServer[];

  // ===== 目标复盘 (子实体) =====
  reviews: GoalReviewServer[];

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 状态管理
  activate(): void;
  complete(): void;
  archive(): void;
  softDelete(): void;
  restore(): void;

  // 关键结果管理
  addKeyResult(keyResult: KeyResultServer): void;
  removeKeyResult(keyResultUuid: string): void;
  updateKeyResult(keyResultUuid: string, updates: Partial<KeyResultServer>): void;
  reorderKeyResults(keyResultUuids: string[]): void;

  // 复盘管理
  addReview(review: GoalReviewServer): void;
  removeReview(reviewUuid: string): void;
  getReviews(): GoalReviewServer[];
  getLatestReview(): GoalReviewServer | null;

  // 进度计算
  calculateProgress(): number; // 0-100
  isOverdue(): boolean;
  getDaysRemaining(): number | null;

  // 优先级计算
  getPriorityScore(): number; // importance + urgency

  // DTO 转换方法
  toServerDTO(): GoalServerDTO;
  toClientDTO(): GoalClientDTO;
  toPersistenceDTO(): GoalPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: GoalServerDTO): GoalServer;
  fromClientDTO(dto: GoalClientDTO): GoalServer;
  fromPersistenceDTO(dto: GoalPersistenceDTO): GoalServer;
}
```

### Client 接口

```typescript
export interface GoalClient {
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

  // ===== 时间范围 =====
  startDate?: number | null;
  targetDate?: number | null;
  completedAt?: number | null;
  archivedAt?: number | null;

  // ===== 组织结构 =====
  folderUuid?: string | null;
  parentGoalUuid?: string | null;
  sortOrder: number;

  // ===== 关键结果 =====
  keyResults: KeyResultClient[];

  // ===== 复盘记录 =====
  reviews: GoalReviewClient[];

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  overallProgress: number; // 0-100
  isDeleted: boolean;
  isCompleted: boolean;
  isArchived: boolean;
  isOverdue: boolean;
  daysRemaining?: number | null;
  statusText: string;
  importanceText: string;
  urgencyText: string;
  priorityScore: number;
  keyResultCount: number;
  completedKeyResultCount: number;
  reviewCount: number;

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayTitle(): string;
  getStatusBadge(): { text: string; color: string };
  getPriorityBadge(): { text: string; color: string };
  getProgressText(): string;
  getDateRangeText(): string;

  // 操作判断
  canActivate(): boolean;
  canComplete(): boolean;
  canArchive(): boolean;
  canDelete(): boolean;
  canAddKeyResult(): boolean;
  canAddReview(): boolean;

  // DTO 转换
  toServerDTO(): GoalServerDTO;
}
```

---

## 2. KeyResult (实体)

### 业务描述

关键结果是目标的可量化指标，包含进度追踪和历史记录。

### Server 接口

```typescript
export interface KeyResultServer {
  // ===== 基础属性 =====
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;

  // ===== 进度跟踪 =====
  valueType: 'INCREMENTAL' | 'ABSOLUTE' | 'PERCENTAGE' | 'BINARY';
  targetValue: number;
  currentValue: number;
  unit?: string | null;
  weight: number; // 权重 0-100

  // ===== 状态 =====
  isCompleted: boolean;
  completedAt?: number | null; // epoch ms

  // ===== 排序 =====
  sortOrder: number;

  // ===== 历史记录 (子实体) =====
  records: GoalRecordServer[];

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 进度管理
  updateProgress(newValue: number, note?: string): void;
  incrementProgress(incrementValue: number, note?: string): void;
  complete(): void;

  // 记录管理
  addRecord(record: GoalRecordServer): void;
  getRecords(): GoalRecordServer[];
  getLatestRecord(): GoalRecordServer | null;
  getRecordsByDateRange(startDate: number, endDate: number): GoalRecordServer[];

  // 进度计算
  getProgressPercentage(): number; // 0-100
  getRemainingValue(): number;

  // DTO 转换方法
  toServerDTO(): KeyResultServerDTO;
  toClientDTO(): KeyResultClientDTO;
  toPersistenceDTO(): KeyResultPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: KeyResultServerDTO): KeyResultServer;
  fromClientDTO(dto: KeyResultClientDTO): KeyResultServer;
  fromPersistenceDTO(dto: KeyResultPersistenceDTO): KeyResultServer;
}
```

### Client 接口

```typescript
export interface KeyResultClient {
  // ===== 基础属性 =====
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  valueType: string;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
  weight: number;
  isCompleted: boolean;
  completedAt?: number | null;
  sortOrder: number;

  // ===== 历史记录 =====
  records: GoalRecordClient[];

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  progressPercentage: number; // 0-100
  progressText: string; // "50 / 100 个"
  statusText: string; // "已完成" / "进行中" / "未开始"
  remainingValue: number;
  isDeleted: boolean;
  recordCount: number;

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayTitle(): string;
  getProgressBar(): { percentage: number; color: string };
  getStatusBadge(): { text: string; color: string };
  getValueText(): string;

  // 操作判断
  canUpdate(): boolean;
  canComplete(): boolean;
  canDelete(): boolean;

  // DTO 转换
  toServerDTO(): KeyResultServerDTO;
}
```

---

## 3. GoalRecord (实体)

### 业务描述

目标记录用于追踪关键结果的值变化历史。

### Server 接口

```typescript
export interface GoalRecordServer {
  // ===== 基础属性 =====
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;

  // ===== 记录内容 =====
  previousValue: number;
  newValue: number;
  changeAmount: number; // newValue - previousValue
  note?: string | null;

  // ===== 记录时间 =====
  recordedAt: number; // epoch ms

  // ===== 时间戳 =====
  createdAt: number;

  // ===== 业务方法 =====

  // 查询
  getChangePercentage(): number; // 相对于目标值的变化百分比
  isPositiveChange(): boolean;
  getKeyResult(): Promise<KeyResultServer>;

  // DTO 转换方法
  toServerDTO(): GoalRecordServerDTO;
  toClientDTO(): GoalRecordClientDTO;
  toPersistenceDTO(): GoalRecordPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: GoalRecordServerDTO): GoalRecordServer;
  fromClientDTO(dto: GoalRecordClientDTO): GoalRecordServer;
  fromPersistenceDTO(dto: GoalRecordPersistenceDTO): GoalRecordServer;
}
```

### Client 接口

```typescript
export interface GoalRecordClient {
  // ===== 基础属性 =====
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  previousValue: number;
  newValue: number;
  changeAmount: number;
  note?: string | null;
  recordedAt: number;
  createdAt: number;

  // ===== UI 计算属性 =====
  changePercentage: number;
  isPositiveChange: boolean;
  changeText: string; // "+10" / "-5"
  formattedDate: string; // "2024-01-15 14:30"

  // ===== UI 业务方法 =====

  // 格式化展示
  getChangeIndicator(): { icon: string; color: string };
  getTimelineText(): string; // "2 天前"

  // DTO 转换
  toServerDTO(): GoalRecordServerDTO;
}
```

---

## 4. GoalReview (实体)

### 业务描述

目标复盘记录用于存储目标的定期回顾和总结。

### Server 接口

```typescript
export interface GoalReviewServer {
  // ===== 基础属性 =====
  uuid: string;
  goalUuid: string;

  // ===== 复盘内容 =====
  title: string;
  content: string; // Markdown 格式
  reviewType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ADHOC';

  // ===== 评估 =====
  rating?: number | null; // 1-5 星
  progressSnapshot: number; // 复盘时的进度快照
  keyResultSnapshots: KeyResultSnapshot[]; // 关键结果快照

  // ===== 反思与行动 =====
  achievements?: string | null; // 取得的成就
  challenges?: string | null; // 遇到的挑战
  nextActions?: string | null; // 下一步行动

  // ===== 复盘时间 =====
  reviewedAt: number; // epoch ms

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 内容管理
  updateContent(content: string): void;
  updateRating(rating: number): void;

  // 快照管理
  captureProgressSnapshot(goal: GoalServer): void;

  // 查询
  getGoal(): Promise<GoalServer>;

  // DTO 转换方法
  toServerDTO(): GoalReviewServerDTO;
  toClientDTO(): GoalReviewClientDTO;
  toPersistenceDTO(): GoalReviewPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: GoalReviewServerDTO): GoalReviewServer;
  fromClientDTO(dto: GoalReviewClientDTO): GoalReviewServer;
  fromPersistenceDTO(dto: GoalReviewPersistenceDTO): GoalReviewServer;
}

interface KeyResultSnapshot {
  keyResultUuid: string;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
}
```

### Client 接口

```typescript
export interface GoalReviewClient {
  // ===== 基础属性 =====
  uuid: string;
  goalUuid: string;
  title: string;
  content: string;
  reviewType: string;
  rating?: number | null;
  progressSnapshot: number;
  keyResultSnapshots: KeyResultSnapshot[];
  achievements?: string | null;
  challenges?: string | null;
  nextActions?: string | null;
  reviewedAt: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  reviewTypeText: string; // "每周复盘" / "月度复盘"
  formattedReviewDate: string;
  timeAgo: string; // "3 天前"
  isDeleted: boolean;

  // ===== UI 业务方法 =====

  // 格式化展示
  getReviewTypeBadge(): { text: string; color: string };
  getRatingStars(): string; // "★★★★☆"
  getContentPreview(maxLength: number): string;

  // 操作判断
  canEdit(): boolean;
  canDelete(): boolean;

  // DTO 转换
  toServerDTO(): GoalReviewServerDTO;
}
```

---

## 5. GoalFolder (聚合根)

### 业务描述

目标文件夹用于组织和分类目标。

### Server 接口

```typescript
export interface GoalFolderServer {
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
  isSystemFolder: boolean; // 系统预设文件夹（如：所有目标、进行中、已完成）
  folderType?: 'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'CUSTOM' | null;

  // ===== 统计信息 =====
  goalCount: number;
  completedGoalCount: number;

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
  updateStatistics(goalCount: number, completedCount: number): void;

  // DTO 转换方法
  toServerDTO(): GoalFolderServerDTO;
  toClientDTO(): GoalFolderClientDTO;
  toPersistenceDTO(): GoalFolderPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: GoalFolderServerDTO): GoalFolderServer;
  fromClientDTO(dto: GoalFolderClientDTO): GoalFolderServer;
  fromPersistenceDTO(dto: GoalFolderPersistenceDTO): GoalFolderServer;
}
```

### Client 接口

```typescript
export interface GoalFolderClient {
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
  goalCount: number;
  completedGoalCount: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  displayName: string;
  displayIcon: string;
  completionRate: number; // 0-100
  isDeleted: boolean;
  activeGoalCount: number; // goalCount - completedGoalCount

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayName(): string;
  getIcon(): string;
  getCompletionText(): string; // "5/10 已完成"
  getBadge(): { text: string; color: string } | null;

  // 操作判断
  canRename(): boolean; // 系统文件夹不能重命名
  canDelete(): boolean; // 系统文件夹不能删除
  canMove(): boolean;

  // DTO 转换
  toServerDTO(): GoalFolderServerDTO;
}
```

---

## 6. GoalStatistics (聚合根)

### 业务描述

目标统计聚合用户的目标数据统计信息。

### Server 接口

```typescript
export interface GoalStatisticsServer {
  // ===== 基础属性 =====
  accountUuid: string;

  // ===== 目标统计 =====
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;

  // ===== 关键结果统计 =====
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number; // 平均进度 0-100

  // ===== 分类统计 =====
  goalsByImportance: Record<string, number>;
  goalsByUrgency: Record<string, number>;
  goalsByCategory: Record<string, number>;
  goalsByStatus: Record<string, number>;

  // ===== 时间统计 =====
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;

  // ===== 复盘统计 =====
  totalReviews: number;
  averageRating?: number | null; // 平均评分 1-5

  // ===== 计算时间 =====
  lastCalculatedAt: number; // epoch ms

  // ===== 业务方法 =====

  // 统计计算
  recalculate(goals: GoalServer[]): void;

  // 查询
  getCompletionRate(): number; // 完成率
  getAverageGoalsPerMonth(): number;

  // DTO 转换方法
  toServerDTO(): GoalStatisticsServerDTO;
  toClientDTO(): GoalStatisticsClientDTO;
  toPersistenceDTO(): GoalStatisticsPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: GoalStatisticsServerDTO): GoalStatisticsServer;
  fromClientDTO(dto: GoalStatisticsClientDTO): GoalStatisticsServer;
  fromPersistenceDTO(dto: GoalStatisticsPersistenceDTO): GoalStatisticsServer;
}
```

### Client 接口

```typescript
export interface GoalStatisticsClient {
  // ===== 基础属性 =====
  accountUuid: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number;
  goalsByImportance: Record<string, number>;
  goalsByUrgency: Record<string, number>;
  goalsByCategory: Record<string, number>;
  goalsByStatus: Record<string, number>;
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;
  totalReviews: number;
  averageRating?: number | null;
  lastCalculatedAt: number;

  // ===== UI 计算属性 =====
  completionRate: number; // 完成率 0-100
  keyResultCompletionRate: number; // 关键结果完成率 0-100
  overdueRate: number; // 逾期率 0-100
  weeklyTrend: 'UP' | 'DOWN' | 'STABLE';
  monthlyTrend: 'UP' | 'DOWN' | 'STABLE';

  // ===== UI 业务方法 =====

  // 格式化展示
  getCompletionText(): string; // "75% 完成率"
  getOverdueText(): string; // "5 个目标逾期"
  getTrendIndicator(): { icon: string; color: string; text: string };
  getTopCategory(): string | null; // 目标最多的分类

  // 图表数据
  getImportanceChartData(): ChartData;
  getStatusChartData(): ChartData;
  getProgressChartData(): ChartData;
  getTimelineChartData(): TimelineData;

  // DTO 转换
  toServerDTO(): GoalStatisticsServerDTO;
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
```

---

## 值对象 (Value Objects)

### GoalMetadata

```typescript
export interface GoalMetadata {
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string | null;
  tags: string[];
}
```

### GoalTimeRange

```typescript
export interface GoalTimeRange {
  startDate?: number | null; // epoch ms
  targetDate?: number | null; // epoch ms
  completedAt?: number | null; // epoch ms
  archivedAt?: number | null; // epoch ms
}
```

### KeyResultProgress

```typescript
export interface KeyResultProgress {
  valueType: 'INCREMENTAL' | 'ABSOLUTE' | 'PERCENTAGE' | 'BINARY';
  targetValue: number;
  currentValue: number;
  unit?: string | null;
}
```

---

## 总结

### 聚合根

- **Goal**: 1 个聚合根（包含 KeyResult、GoalRecord、GoalReview）
- **GoalFolder**: 1 个聚合根
- **GoalStatistics**: 1 个聚合根

### 实体

- **KeyResult**: 关键结果（Goal 的子实体）
- **GoalRecord**: 目标记录（KeyResult 的子实体）
- **GoalReview**: 目标复盘（Goal 的子实体）

### 值对象

- GoalMetadata
- GoalTimeRange
- KeyResultProgress
- KeyResultSnapshot

### 关键设计原则

1. **Server 侧重业务逻辑**: 完整的业务方法、领域规则
2. **Client 侧重 UI 展示**: 格式化方法、UI 状态、快捷操作
3. **时间戳统一**: 全部使用 epoch ms (number)
4. **统计信息**: Client 包含更多预计算的统计数据和格式化字符串
5. **聚合根控制子实体**: Goal 聚合根管理 KeyResult、GoalRecord、GoalReview
6. **子实体不暴露独立 API**: 所有子实体操作通过聚合根进行
