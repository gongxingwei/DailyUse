# Goal 模块 - 领域模型规划文档

> **创建时间**: 2025-01-20  
> **更新时间**: 2025-01-13  
> **文档版本**: v1.1  
> **参考模式**: Repository 模块的 DDD 架构  
> **修正内容**: DTO 命名规范、完整 DTO 转换方法、PersistenceDTO 定义、逻辑删除

---

## 📋 目录

1. [领域范围](#1-领域范围)
2. [核心业务需求](#2-核心业务需求)
3. [聚合根设计](#3-聚合根设计)
4. [实体设计](#4-实体设计)
5. [值对象设计](#5-值对象设计)
6. [仓储接口设计](#6-仓储接口设计)
7. [领域服务设计](#7-领域服务设计)
8. [应用层业务](#8-应用层业务)
9. [TypeScript 类型定义](#9-typescript-类型定义)

---

## 1. 领域范围

### 领域边界

**Goal 模块** 负责目标管理的完整生命周期，采用 **OKR (Objectives and Key Results)** 模式进行目标管理。

**核心概念**:

- **Objective (目标)**: 明确的、可衡量的目标陈述
- **Key Result (关键结果)**: 用于衡量目标达成度的具体指标
- **Goal Folder (目标文件夹)**: 层级化的目标组织结构
- **Goal Statistics (目标统计)**: 目标数据的聚合统计

**领域边界**:

- ✅ 目标的创建、更新、归档、删除
- ✅ 关键结果的定义、进度追踪、完成判定
- ✅ 目标文件夹的层级管理
- ✅ 目标的元数据（标签、重要性、紧急性）
- ✅ 目标的生命周期管理（草稿、进行中、已完成、已归档、已删除）
- ✅ 目标提醒（剩余天数提醒）
- ✅ 目标统计和数据聚合
- ❌ 任务的具体执行（属于 Task 模块）
- ❌ 提醒的调度执行（属于 Schedule 模块）

---

## 2. 核心业务需求

### 2.1 OKR 式目标管理

- 每个目标包含 1-5 个关键结果
- 关键结果有明确的目标值和当前进度
- 关键结果有结束时间（可选）
- 支持自动计算目标完成度（基于关键结果）

### 2.2 文件夹层级管理

**系统文件夹**（不可删除）:

- 📂 全部目标
- 📁 已归档
- 🗑️ 已删除

**用户文件夹**:

- 支持多层级嵌套（建议 3 层以内）
- 支持拖拽排序
- 支持重命名、删除（会移动目标到"全部目标"）

### 2.3 可扩展元数据

- **标签系统**: 多标签分类
- **重要性等级**: Vital > Important > Moderate > Minor > Trivial
- **紧急性等级**: Critical > High > Medium > Low > None
- **自定义字段**: 预留扩展接口

### 2.4 完整生命周期

```
draft → active → completed → archived
   ↓       ↓         ↓          ↓
   └───────┴─────────┴──────────→ deleted
```

**状态转换规则**:

- `draft` → `active`: 开始执行目标
- `active` → `completed`: 所有关键结果达成
- `active` → `archived`: 手动归档（未完成但不再追踪）
- `completed` → `archived`: 完成后归档
- 任何状态 → `deleted`: 软删除（可恢复）

### 2.5 提醒设置

- 支持剩余天数提醒（例如：距离结束 7 天、3 天、1 天）
- 支持自定义提醒时间点
- 提醒触发后调用 Reminder 模块

### 2.6 数据统计

**个人统计**:

- 进行中的目标数量
- 已完成目标数量
- 总体完成率
- 各重要性等级的目标分布

**目标维度统计**:

- 关键结果完成进度
- 预计剩余时间
- 相关任务数量（跨模块查询）

---

## 3. 聚合根设计

### 3.1 Goal 聚合根

**职责**:

- 管理目标的基本信息
- 管理关键结果的集合
- 执行目标的业务逻辑
- 确保关键结果的一致性
- 作为目标的事务边界

**核心属性**:

```typescript
export class Goal extends AggregateRoot implements IGoalServer {
  // ===== 基本信息 =====
  private _accountUuid: string; // 所属账户
  private _title: string; // 目标标题（Objective）
  private _description: string | null; // 详细描述

  // ===== 时间管理 =====
  private _startDate: Date | null; // 开始日期
  private _endDate: Date | null; // 结束日期（可选）
  private _reminderDays: number[]; // 提醒天数（例如 [7, 3, 1]）

  // ===== 关键结果 =====
  private _keyResults: KeyResult[]; // 关键结果集合（实体）

  // ===== 元数据 =====
  private _importance: ImportanceLevel; // 重要性等级
  private _urgency: UrgencyLevel; // 紧急性等级
  private _tags: string[]; // 标签
  private _customFields: Map<string, any>; // 自定义字段

  // ===== 组织结构 =====
  private _folderUuid: string | null; // 所属文件夹

  // ===== 生命周期 =====
  private _status: GoalStatus; // 状态
  private _createdAt: Date;
  private _updatedAt: Date;
  private _completedAt: Date | null;
  private _archivedAt: Date | null;
  private _deletedAt: Date | null;
}
```

**核心业务方法**:

```typescript
export class Goal extends AggregateRoot {
  // ===== 工厂方法 =====
  public static create(params: CreateGoalParams): Goal;

  // ===== 关键结果管理 =====
  public addKeyResult(params: CreateKeyResultParams): KeyResult;
  public updateKeyResult(keyResultId: string, params: UpdateKeyResultParams): void;
  public removeKeyResult(keyResultId: string): void;
  public updateKeyResultProgress(keyResultId: string, currentValue: number): void;

  // ===== 状态转换 =====
  public activate(): void; // 开始执行
  public complete(): void; // 完成目标
  public archive(): void; // 归档
  public softDelete(): void; // 软删除
  public restore(): void; // 从已删除恢复

  // ===== 元数据更新 =====
  public updateTitle(title: string): void;
  public updateDescription(description: string | null): void;
  public updateImportance(importance: ImportanceLevel): void;
  public updateUrgency(urgency: UrgencyLevel): void;
  public updateTags(tags: string[]): void;
  public moveToFolder(folderUuid: string | null): void;

  // ===== 时间管理 =====
  public updateDates(startDate: Date | null, endDate: Date | null): void;
  public updateReminderDays(reminderDays: number[]): void;

  // ===== 计算属性 =====
  public getOverallProgress(): number; // 基于关键结果计算总进度
  public isOverdue(): boolean; // 是否已过期
  public getRemainingDays(): number | null; // 剩余天数
  public isCompleted(): boolean; // 是否所有关键结果都完成

  // ===== DTO 转换方法（Domain-Server 层）=====
  public toServerDTO(includeChildren = false): GoalServerDTO;
  public toPersistenceDTO(): GoalPersistenceDTO;
  public static fromServerDTO(dto: GoalServerDTO): Goal;
  public static fromPersistenceDTO(dto: GoalPersistenceDTO): Goal;
}
```

**Domain-Client 层额外方法**:

```typescript
export class GoalClient extends AggregateRoot {
  // ... 同 Domain-Server 层的业务方法

  // ===== DTO 转换方法（Domain-Client 层）=====
  public toServerDTO(includeChildren = false): GoalServerDTO;
  public toClientDTO(includeChildren = false): GoalClientDTO;
  public static fromServerDTO(dto: GoalServerDTO): GoalClient;
  public static fromClientDTO(dto: GoalClientDTO): GoalClient;
}
```

---

### 3.2 GoalFolder 聚合根

**职责**:

- 管理文件夹的层级结构
- 控制文件夹的排序
- 管理文件夹内的目标集合

**核心属性**:

```typescript
export class GoalFolder extends AggregateRoot implements IGoalFolderServer {
  private _accountUuid: string;
  private _name: string;
  private _parentUuid: string | null; // 父文件夹UUID
  private _sortOrder: number; // 排序顺序
  private _isSystem: boolean; // 是否系统文件夹
  private _icon: string | null; // 图标
  private _color: string | null; // 颜色
  private _createdAt: Date;
  private _updatedAt: Date;
}
```

**核心业务方法**:

```typescript
export class GoalFolder extends AggregateRoot {
  // ===== 工厂方法 =====
  public static create(params: CreateFolderParams): GoalFolder;
  public static createSystemFolder(name: string, accountUuid: string): GoalFolder;

  // ===== 业务方法 =====
  public updateName(name: string): void;
  public updateIcon(icon: string | null): void;
  public updateColor(color: string | null): void;
  public moveTo(parentUuid: string | null): void;
  public updateSortOrder(sortOrder: number): void;

  public canDelete(): boolean; // 系统文件夹不可删除

  // ===== DTO 转换方法（Domain-Server 层）=====
  public toServerDTO(): GoalFolderServerDTO;
  public toPersistenceDTO(): GoalFolderPersistenceDTO;
  public static fromServerDTO(dto: GoalFolderServerDTO): GoalFolder;
  public static fromPersistenceDTO(dto: GoalFolderPersistenceDTO): GoalFolder;
}
```

**Domain-Client 层额外方法**:

```typescript
export class GoalFolderClient extends AggregateRoot {
  // ... 同 Domain-Server 层的业务方法

  // ===== DTO 转换方法（Domain-Client 层）=====
  public toServerDTO(): GoalFolderServerDTO;
  public toClientDTO(): GoalFolderClientDTO;
  public static fromServerDTO(dto: GoalFolderServerDTO): GoalFolderClient;
  public static fromClientDTO(dto: GoalFolderClientDTO): GoalFolderClient;
}
```

---

### 3.3 GoalStatistics 聚合根

**职责**:

- 聚合用户的目标统计数据
- 提供统计查询接口

**核心属性**:

```typescript
export class GoalStatistics extends AggregateRoot implements IGoalStatisticsServer {
  private _accountUuid: string;
  private _totalGoals: number;
  private _activeGoals: number;
  private _completedGoals: number;
  private _archivedGoals: number;
  private _overallCompletionRate: number;

  // 按重要性统计
  private _goalsByImportance: Map<ImportanceLevel, number>;

  // 按紧急性统计
  private _goalsByUrgency: Map<UrgencyLevel, number>;

  // 时间维度
  private _completedThisWeek: number;
  private _completedThisMonth: number;
  private _completedThisYear: number;

  private _lastCalculatedAt: Date;
}
```

**核心业务方法**:

```typescript
export class GoalStatistics extends AggregateRoot {
  // ===== 工厂方法 =====
  public static create(accountUuid: string): GoalStatistics;

  // ===== 业务方法 =====
  public recalculate(goals: Goal[]): void;

  // 查询方法
  public getActiveGoalsCount(): number;
  public getCompletionRate(): number;
  public getGoalsByImportance(importance: ImportanceLevel): number;

  // ===== DTO 转换方法（Domain-Server 层）=====
  public toServerDTO(): GoalStatisticsServerDTO;
  public toPersistenceDTO(): GoalStatisticsPersistenceDTO;
  public static fromServerDTO(dto: GoalStatisticsServerDTO): GoalStatistics;
  public static fromPersistenceDTO(dto: GoalStatisticsPersistenceDTO): GoalStatistics;
}
```

**Domain-Client 层额外方法**:

```typescript
export class GoalStatisticsClient extends AggregateRoot {
  // ... 同 Domain-Server 层的业务方法

  // ===== DTO 转换方法（Domain-Client 层）=====
  public toServerDTO(): GoalStatisticsServerDTO;
  public toClientDTO(): GoalStatisticsClientDTO;
  public static fromServerDTO(dto: GoalStatisticsServerDTO): GoalStatisticsClient;
  public static fromClientDTO(dto: GoalStatisticsClientDTO): GoalStatisticsClient;
}
```

---

## 4. 实体设计

### 4.1 KeyResult 实体

**职责**:

- 表示目标的一个关键结果
- 跟踪关键结果的进度
- 判断关键结果是否完成

**核心属性**:

```typescript
export class KeyResult extends Entity implements IKeyResultServer {
  private _id: string; // 关键结果ID（非UUID）
  private _goalUuid: string; // 所属目标UUID

  private _title: string; // 关键结果标题
  private _description: string | null; // 描述

  // 进度跟踪
  private _targetValue: number; // 目标值
  private _currentValue: number; // 当前值
  private _unit: string; // 单位（例如：次、个、%）
  private _valueType: 'incremental' | 'absolute'; // 累积值 or 绝对值

  // 时间
  private _startDate: Date | null;
  private _targetDate: Date | null;

  // 状态
  private _isCompleted: boolean;
  private _completedAt: Date | null;

  private _createdAt: Date;
  private _updatedAt: Date;
}
```

**核心业务方法**:

```typescript
export class KeyResult extends Entity {
  // ===== 工厂方法 =====
  public static create(params: CreateKeyResultParams): KeyResult;

  // ===== 业务方法 =====
  public updateProgress(currentValue: number): void;
  public incrementProgress(incrementValue: number): void;
  public complete(): void;

  // 计算属性
  public getProgressPercentage(): number; // 计算完成百分比
  public isOverdue(): boolean;
  public getRemainingDays(): number | null;

  // 更新方法
  public updateTitle(title: string): void;
  public updateDescription(description: string | null): void;
  public updateTargetValue(targetValue: number): void;
  public updateTargetDate(targetDate: Date | null): void;

  // ===== DTO 转换方法（Domain-Server 层）=====
  public toServerDTO(): KeyResultServerDTO;
  public toPersistenceDTO(): KeyResultPersistenceDTO;
  public static fromServerDTO(dto: KeyResultServerDTO): KeyResult;
  public static fromPersistenceDTO(dto: KeyResultPersistenceDTO): KeyResult;
}
```

**Domain-Client 层额外方法**:

```typescript
export class KeyResultClient extends Entity {
  // ... 同 Domain-Server 层的业务方法

  // ===== DTO 转换方法（Domain-Client 层）=====
  public toServerDTO(): KeyResultServerDTO;
  public toClientDTO(): KeyResultClientDTO;
  public static fromServerDTO(dto: KeyResultServerDTO): KeyResultClient;
  public static fromClientDTO(dto: KeyResultClientDTO): KeyResultClient;
}
```

---

## 5. 值对象设计

### 5.1 GoalStatus 枚举（值对象）

```typescript
export enum GoalStatus {
  Draft = 'draft', // 草稿
  Active = 'active', // 进行中
  Completed = 'completed', // 已完成
  Archived = 'archived', // 已归档
  Deleted = 'deleted', // 已删除（逻辑删除）
}
```

---

### 5.2 GoalMetadata 值对象

```typescript
export class GoalMetadata extends ValueObject {
  constructor(
    public readonly importance: ImportanceLevel,
    public readonly urgency: UrgencyLevel,
    public readonly tags: readonly string[],
    public readonly customFields: ReadonlyMap<string, any>,
  ) {
    super();
    this.validate();
  }

  protected validate(): void {
    if (!Object.values(ImportanceLevel).includes(this.importance)) {
      throw new Error('Invalid importance level');
    }
    if (!Object.values(UrgencyLevel).includes(this.urgency)) {
      throw new Error('Invalid urgency level');
    }
  }

  public equals(other: GoalMetadata): boolean {
    return (
      this.importance === other.importance &&
      this.urgency === other.urgency &&
      this.arrayEquals(this.tags, other.tags) &&
      this.mapEquals(this.customFields, other.customFields)
    );
  }
}
```

---

### 5.3 GoalTimeRange 值对象

```typescript
export class GoalTimeRange extends ValueObject {
  constructor(
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
  ) {
    super();
    this.validate();
  }

  protected validate(): void {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  public isOverdue(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
  }

  public getRemainingDays(): number | null {
    if (!this.endDate) return null;
    const now = new Date();
    const diff = this.endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  public equals(other: GoalTimeRange): boolean {
    return (
      this.startDate?.getTime() === other.startDate?.getTime() &&
      this.endDate?.getTime() === other.endDate?.getTime()
    );
  }
}
```

---

### 5.4 KeyResultProgress 值对象

```typescript
export class KeyResultProgress extends ValueObject {
  constructor(
    public readonly currentValue: number,
    public readonly targetValue: number,
    public readonly unit: string,
    public readonly valueType: 'incremental' | 'absolute',
  ) {
    super();
    this.validate();
  }

  protected validate(): void {
    if (this.targetValue <= 0) {
      throw new Error('Target value must be positive');
    }
    if (this.currentValue < 0) {
      throw new Error('Current value cannot be negative');
    }
  }

  public getPercentage(): number {
    return Math.min(100, (this.currentValue / this.targetValue) * 100);
  }

  public isCompleted(): boolean {
    return this.currentValue >= this.targetValue;
  }

  public increment(value: number): KeyResultProgress {
    if (this.valueType !== 'incremental') {
      throw new Error('Can only increment for incremental value type');
    }
    return new KeyResultProgress(
      this.currentValue + value,
      this.targetValue,
      this.unit,
      this.valueType,
    );
  }

  public equals(other: KeyResultProgress): boolean {
    return (
      this.currentValue === other.currentValue &&
      this.targetValue === other.targetValue &&
      this.unit === other.unit &&
      this.valueType === other.valueType
    );
  }
}
```

---

## 6. 仓储接口设计

### 6.1 IGoalRepository

```typescript
export interface IGoalRepository {
  // ===== 基本 CRUD =====
  save(goal: Goal): Promise<void>;
  findByUuid(uuid: string): Promise<Goal | null>;
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<Goal[]>;
  delete(uuid: string): Promise<void>;

  // ===== 查询方法 =====
  findByStatus(accountUuid: string, status: GoalStatus): Promise<Goal[]>;
  findByFolder(folderUuid: string): Promise<Goal[]>;
  findByTag(accountUuid: string, tag: string): Promise<Goal[]>;
  findOverdue(accountUuid: string): Promise<Goal[]>;

  // ===== 软删除 =====
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>; // 物理删除（谨慎使用）

  // ===== 批量操作 =====
  moveToFolder(goalUuids: string[], folderUuid: string | null): Promise<void>;
  batchUpdateStatus(goalUuids: string[], status: GoalStatus): Promise<void>;
}
```

---

### 6.2 IGoalFolderRepository

```typescript
export interface IGoalFolderRepository {
  save(folder: GoalFolder): Promise<void>;
  findByUuid(uuid: string): Promise<GoalFolder | null>;
  findByAccountUuid(accountUuid: string): Promise<GoalFolder[]>;
  findByParentUuid(parentUuid: string | null): Promise<GoalFolder[]>;
  findSystemFolders(accountUuid: string): Promise<GoalFolder[]>;
  delete(uuid: string): Promise<void>;

  // 检查是否存在子文件夹
  hasChildren(uuid: string): Promise<boolean>;
}
```

---

### 6.3 IGoalStatisticsRepository

```typescript
export interface IGoalStatisticsRepository {
  save(statistics: GoalStatistics): Promise<void>;
  findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null>;
}
```

---

## 7. 领域服务设计

### 7.1 GoalDomainService

**职责**:

- 跨聚合根的业务逻辑
- 复杂的目标管理操作
- 统计数据的计算

```typescript
export class GoalDomainService {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly folderRepository: IGoalFolderRepository,
    private readonly statisticsRepository: IGoalStatisticsRepository,
  ) {}

  // ===== 目标管理 =====
  async createGoal(params: CreateGoalParams): Promise<Goal>;
  async updateGoal(uuid: string, params: UpdateGoalParams): Promise<Goal>;
  async deleteGoal(uuid: string): Promise<void>;
  async restoreGoal(uuid: string): Promise<void>;

  // ===== 批量操作 =====
  async moveGoalsToFolder(goalUuids: string[], folderUuid: string | null): Promise<void>;
  async batchArchiveGoals(goalUuids: string[]): Promise<void>;

  // ===== 统计计算 =====
  async recalculateStatistics(accountUuid: string): Promise<GoalStatistics>;

  // ===== 查询服务 =====
  async getGoalsByStatus(accountUuid: string, status: GoalStatus): Promise<Goal[]>;
  async getOverdueGoals(accountUuid: string): Promise<Goal[]>;
  async getGoalsByFolder(folderUuid: string): Promise<Goal[]>;

  // ===== 文件夹管理 =====
  async createFolder(params: CreateFolderParams): Promise<GoalFolder>;
  async deleteFolder(uuid: string): Promise<void>; // 会将目标移到"全部目标"
  async ensureSystemFolders(accountUuid: string): Promise<void>; // 确保系统文件夹存在
}
```

---

## 8. 应用层业务

### 8.1 Goal 应用服务

```typescript
export class GoalApplicationService {
  constructor(private readonly domainService: GoalDomainService) {}

  // ===== CRUD =====
  async createGoal(request: CreateGoalRequestDTO): Promise<GoalServerDTO>;
  async updateGoal(uuid: string, request: UpdateGoalRequestDTO): Promise<GoalServerDTO>;
  async getGoalByUuid(uuid: string): Promise<GoalServerDTO>;
  async getGoalsByAccountUuid(accountUuid: string): Promise<GoalServerDTO[]>;
  async deleteGoal(uuid: string): Promise<void>;
  async restoreGoal(uuid: string): Promise<void>;

  // ===== 关键结果管理 =====
  async addKeyResult(goalUuid: string, request: CreateKeyResultRequestDTO): Promise<GoalServerDTO>;
  async updateKeyResult(
    goalUuid: string,
    keyResultId: string,
    request: UpdateKeyResultRequestDTO,
  ): Promise<GoalServerDTO>;
  async updateKeyResultProgress(
    goalUuid: string,
    keyResultId: string,
    currentValue: number,
  ): Promise<GoalServerDTO>;
  async removeKeyResult(goalUuid: string, keyResultId: string): Promise<GoalServerDTO>;

  // ===== 状态转换 =====
  async activateGoal(uuid: string): Promise<GoalServerDTO>;
  async completeGoal(uuid: string): Promise<GoalServerDTO>;
  async archiveGoal(uuid: string): Promise<GoalServerDTO>;

  // ===== 批量操作 =====
  async moveGoalsToFolder(goalUuids: string[], folderUuid: string | null): Promise<void>;
  async batchArchiveGoals(goalUuids: string[]): Promise<void>;

  // ===== 查询 =====
  async getGoalsByStatus(accountUuid: string, status: GoalStatus): Promise<GoalServerDTO[]>;
  async getOverdueGoals(accountUuid: string): Promise<GoalServerDTO[]>;
  async getGoalsByFolder(folderUuid: string): Promise<GoalServerDTO[]>;
  async getGoalStatistics(accountUuid: string): Promise<GoalStatisticsServerDTO>;
}
```

---

### 8.2 GoalFolder 应用服务

```typescript
export class GoalFolderApplicationService {
  constructor(private readonly domainService: GoalDomainService) {}

  async createFolder(request: CreateFolderRequestDTO): Promise<GoalFolderServerDTO>;
  async updateFolder(uuid: string, request: UpdateFolderRequestDTO): Promise<GoalFolderServerDTO>;
  async deleteFolder(uuid: string): Promise<void>;
  async getFolderTree(accountUuid: string): Promise<GoalFolderServerDTO[]>;
  async ensureSystemFolders(accountUuid: string): Promise<void>;
}
```

---

## 9. TypeScript 类型定义

### 9.1 枚举

```typescript
// ===== GoalStatus =====
export enum GoalStatus {
  Draft = 'draft',
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
  Deleted = 'deleted',
}

// ===== ImportanceLevel =====
export enum ImportanceLevel {
  Vital = 'vital',
  Important = 'important',
  Moderate = 'moderate',
  Minor = 'minor',
  Trivial = 'trivial',
}

// ===== UrgencyLevel =====
export enum UrgencyLevel {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
  None = 'none',
}
```

---

### 9.2 Server DTO

```typescript
// ===== Goal Server DTO =====
export interface GoalServerDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description: string | null;

  startDate: string | null; // ISO 8601
  endDate: string | null; // ISO 8601
  reminderDays: number[];

  keyResults: KeyResultServerDTO[];

  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  tags: string[];
  customFields: Record<string, any>;

  folderUuid: string | null;

  status: GoalStatus;
  createdAt: string; // ISO 8601
  updatedAt: string;
  completedAt: string | null;
  archivedAt: string | null;
  deletedAt: string | null;

  // 计算属性
  overallProgress: number;
  isOverdue: boolean;
  remainingDays: number | null;
}

// ===== KeyResult Server DTO =====
export interface KeyResultServerDTO {
  id: string;
  goalUuid: string;
  title: string;
  description: string | null;

  targetValue: number;
  currentValue: number;
  unit: string;
  valueType: 'incremental' | 'absolute';

  startDate: string | null;
  targetDate: string | null;

  isCompleted: boolean;
  completedAt: string | null;

  createdAt: string;
  updatedAt: string;

  // 计算属性
  progressPercentage: number;
}

// ===== GoalFolder Server DTO =====
export interface GoalFolderServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  parentUuid: string | null;
  sortOrder: number;
  isSystem: boolean;
  icon: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== GoalStatistics Server DTO =====
export interface GoalStatisticsServerDTO {
  uuid: string;
  accountUuid: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overallCompletionRate: number;

  goalsByImportance: Record<ImportanceLevel, number>;
  goalsByUrgency: Record<UrgencyLevel, number>;

  completedThisWeek: number;
  completedThisMonth: number;
  completedThisYear: number;

  lastCalculatedAt: string;
}
```

---

### 9.3 Client DTO

```typescript
// ===== Goal Client DTO =====
export interface GoalClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description: string | null;

  startDate: Date | null;
  endDate: Date | null;
  reminderDays: number[];

  keyResults: KeyResultClientDTO[];

  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  tags: string[];
  customFields: Record<string, any>;

  folderUuid: string | null;

  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  archivedAt: Date | null;
  deletedAt: Date | null;

  overallProgress: number;
  isOverdue: boolean;
  remainingDays: number | null;

  // UI 辅助字段
  formattedCreatedAt: string;
  formattedEndDate: string;
  progressLabel: string;
}

// ===== KeyResult Client DTO =====
export interface KeyResultClientDTO {
  id: string;
  goalUuid: string;
  title: string;
  description: string | null;

  targetValue: number;
  currentValue: number;
  unit: string;
  valueType: 'incremental' | 'absolute';

  startDate: Date | null;
  targetDate: Date | null;

  isCompleted: boolean;
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  progressPercentage: number;

  // UI 辅助字段
  progressLabel: string;
  formattedTargetDate: string;
}

// ===== GoalFolder Client DTO =====
export interface GoalFolderClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  parentUuid: string | null;
  sortOrder: number;
  isSystem: boolean;
  icon: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;

  // UI 辅助字段
  displayName: string;
  displayIcon: string;
}

// ===== GoalStatistics Client DTO =====
export interface GoalStatisticsClientDTO {
  uuid: string;
  accountUuid: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overallCompletionRate: number;

  goalsByImportance: Record<ImportanceLevel, number>;
  goalsByUrgency: Record<UrgencyLevel, number>;

  completedThisWeek: number;
  completedThisMonth: number;
  completedThisYear: number;

  lastCalculatedAt: Date;

  // UI 辅助字段
  completionRateLabel: string;
  formattedLastCalculatedAt: string;
}
```

---

### 9.4 Persistence DTO

```typescript
// ===== Goal Persistence DTO =====
export interface GoalPersistenceDTO {
  uuid: string;
  account_uuid: string;
  title: string;
  description: string | null;

  start_date: number | null; // timestamp
  end_date: number | null; // timestamp
  reminder_days: string; // JSON.stringify(number[])

  importance: string;
  urgency: string;
  tags: string; // JSON.stringify(string[])
  custom_fields: string; // JSON.stringify(Record<string, any>)

  folder_uuid: string | null;

  status: string;
  created_at: number; // timestamp
  updated_at: number; // timestamp
  completed_at: number | null;
  archived_at: number | null;
  deleted_at: number | null;
}

// ===== KeyResult Persistence DTO =====
export interface KeyResultPersistenceDTO {
  id: string;
  goal_uuid: string;
  title: string;
  description: string | null;

  target_value: number;
  current_value: number;
  unit: string;
  value_type: string;

  start_date: number | null;
  target_date: number | null;

  is_completed: boolean;
  completed_at: number | null;

  created_at: number;
  updated_at: number;
}

// ===== GoalFolder Persistence DTO =====
export interface GoalFolderPersistenceDTO {
  uuid: string;
  account_uuid: string;
  name: string;
  parent_uuid: string | null;
  sort_order: number;
  is_system: boolean;
  icon: string | null;
  color: string | null;
  created_at: number;
  updated_at: number;
}

// ===== GoalStatistics Persistence DTO =====
export interface GoalStatisticsPersistenceDTO {
  uuid: string;
  account_uuid: string;
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  archived_goals: number;
  overall_completion_rate: number;

  goals_by_importance: string; // JSON.stringify
  goals_by_urgency: string; // JSON.stringify

  completed_this_week: number;
  completed_this_month: number;
  completed_this_year: number;

  last_calculated_at: number;
}
```

---

### 9.5 API Request/Response DTO

```typescript
// ===== Create Goal Request =====
export interface CreateGoalRequestDTO {
  title: string;
  description?: string;
  startDate?: string; // ISO 8601
  endDate?: string;
  reminderDays?: number[];

  keyResults: CreateKeyResultRequestDTO[];

  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  tags?: string[];
  customFields?: Record<string, any>;

  folderUuid?: string;
}

export interface CreateKeyResultRequestDTO {
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  valueType: 'incremental' | 'absolute';
  startDate?: string;
  targetDate?: string;
}

// ===== Update Goal Request =====
export interface UpdateGoalRequestDTO {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  reminderDays?: number[];
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  tags?: string[];
  folderUuid?: string;
}

export interface UpdateKeyResultRequestDTO {
  title?: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  targetDate?: string;
}

// ===== API Response =====
export interface GoalListResponseDTO {
  success: boolean;
  data: GoalServerDTO[];
  total: number;
  message?: string;
  timestamp: string;
}

export interface GoalResponseDTO {
  success: boolean;
  data: GoalServerDTO;
  message?: string;
  timestamp: string;
}
```

---

### 9.6 创建参数类型

```typescript
// ===== 聚合根创建参数 =====
export interface CreateGoalParams {
  accountUuid: string;
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  reminderDays?: number[];
  keyResults: CreateKeyResultParams[];
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  tags?: string[];
  customFields?: Map<string, any>;
  folderUuid?: string;
}

export interface CreateKeyResultParams {
  title: string;
  description?: string;
  targetValue: number;
  currentValue?: number;
  unit: string;
  valueType: 'incremental' | 'absolute';
  startDate?: Date;
  targetDate?: Date;
}

export interface CreateFolderParams {
  accountUuid: string;
  name: string;
  parentUuid?: string;
  icon?: string;
  color?: string;
}
```

---

## 📊 模块依赖关系

```
Goal Module
    ├── Contracts (ImportanceLevel, UrgencyLevel)
    ├── Utils (AggregateRoot, Entity, ValueObject)
    └── 被依赖：
        ├── Task Module (Task 可以绑定 KeyResult)
        ├── Reminder Module (Goal 提醒)
        └── Notification Module (状态变更通知)
```

---

## ✅ 实现检查清单

### Contracts 层

- [ ] 定义 GoalStatus 枚举
- [ ] 定义 ImportanceLevel、UrgencyLevel 枚举
- [ ] 定义 GoalServerDTO
- [ ] 定义 GoalClientDTO
- [ ] 定义 GoalPersistenceDTO
- [ ] 定义 KeyResultServerDTO / KeyResultClientDTO / KeyResultPersistenceDTO
- [ ] 定义 GoalFolderServerDTO / GoalFolderClientDTO / GoalFolderPersistenceDTO
- [ ] 定义 GoalStatisticsServerDTO / GoalStatisticsClientDTO / GoalStatisticsPersistenceDTO
- [ ] 定义 API Request/Response DTO

### Domain-Server 层

- [ ] 实现 Goal 聚合根（包含 4 个 DTO 转换方法）
- [ ] 实现 GoalFolder 聚合根（包含 4 个 DTO 转换方法）
- [ ] 实现 GoalStatistics 聚合根（包含 4 个 DTO 转换方法）
- [ ] 实现 KeyResult 实体（包含 4 个 DTO 转换方法）
- [ ] 实现 GoalMetadata 值对象
- [ ] 实现 GoalTimeRange 值对象
- [ ] 实现 KeyResultProgress 值对象
- [ ] 定义 IGoalRepository 接口
- [ ] 定义 IGoalFolderRepository 接口
- [ ] 定义 IGoalStatisticsRepository 接口
- [ ] 实现 GoalDomainService

### Domain-Client 层

- [ ] 实现 GoalClient 聚合根（包含 4 个 DTO 转换方法）
- [ ] 实现 KeyResultClient 实体（包含 4 个 DTO 转换方法）
- [ ] 实现 GoalFolderClient（包含 4 个 DTO 转换方法）
- [ ] 实现 GoalStatisticsClient（包含 4 个 DTO 转换方法）
- [ ] 实现 DTO 转换工具

### API 层

- [ ] 创建 TypeORM Goal Entity
- [ ] 创建 TypeORM KeyResult Entity
- [ ] 创建 TypeORM GoalFolder Entity
- [ ] 实现 GoalRepositoryImpl
- [ ] 实现 GoalFolderRepositoryImpl
- [ ] 实现 GoalApplicationService
- [ ] 实现 GoalController
- [ ] 实现 GoalFolderController
- [ ] 注册 GoalModule

### Web 层

- [ ] 创建 GoalStore (Pinia)
- [ ] 创建 GoalApplicationService (前端)
- [ ] 创建 GoalApiClient
- [ ] 创建 useGoal Composable
- [ ] 创建 Goal 相关组件
- [ ] 创建 Goal 页面视图

---

## 📖 相关文档

- [MODULE_PLAN_CORRECTIONS.md](../MODULE_PLAN_CORRECTIONS.md) - 模块规划修正说明
- [Repository 模块实现总结]
- [Schedule 模块设计]
- [Task 模块规划] _(待修正)_
- [Reminder 模块规划] _(待修正)_

---

**文档版本**: v1.1  
**最后更新**: 2025-01-13  
**修正人**: GitHub Copilot
