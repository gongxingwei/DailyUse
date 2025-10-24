# Reminder 模块接口设计

## 模块概述

Reminder 模块负责管理用户的提醒事项，包括提醒规则、提醒历史、重复提醒等。支持多种提醒类型和触发方式。

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
Reminder (聚合根)
├── ReminderOccurrence (实体 - 提醒发生记录)
└── ReminderHistory (实体 - 提醒历史)

ReminderGroup (聚合根)
└── (包含 Reminder 列表)

ReminderStatistics (聚合根)
└── (统计信息)
```

---

## 1. Reminder (聚合根)

### 业务描述

提醒是用户设置的定时提醒事项，可以关联任务、目标等，支持多种触发方式和重复规则。

### Server 接口

```typescript
export interface ReminderServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

  // ===== 提醒类型 =====
  reminderType: 'ONE_TIME' | 'RECURRING' | 'LOCATION_BASED' | 'EVENT_BASED';

  // ===== 时间配置 =====
  triggerTime: number; // epoch ms - 下次触发时间
  originalTriggerTime?: number | null; // epoch ms - 原始设置时间（延后前的时间）
  timezone?: string | null; // 时区

  // ===== 重复配置 =====
  isRecurring: boolean;
  recurrence?: {
    frequency: 'MINUTELY' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
    interval: number; // 间隔
    daysOfWeek?: number[] | null; // 星期几 (0-6, 0=周日)
    dayOfMonth?: number | null; // 每月的第几天 (1-31)
    monthOfYear?: number | null; // 每年的第几月 (1-12)
    endDate?: number | null; // epoch ms
    endAfterOccurrences?: number | null;
    customPattern?: string | null; // cron 表达式
  } | null;

  // ===== 提前提醒 =====
  advanceNotifications?: {
    minutes?: number | null; // 提前 X 分钟
    hours?: number | null; // 提前 X 小时
    days?: number | null; // 提前 X 天
  } | null;

  // ===== 位置提醒 (location-based) =====
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // 半径（米）
    address?: string | null;
    triggerOnEnter: boolean; // 进入时触发
    triggerOnExit: boolean; // 离开时触发
  } | null;

  // ===== 关联实体 =====
  taskUuid?: string | null; // 关联的任务
  goalUuid?: string | null; // 关联的目标
  scheduleUuid?: string | null; // 关联的日程

  // ===== 分组 =====
  groupUuid?: string | null;

  // ===== 优先级 (使用 contracts/shared 中的枚举) =====
  importance: ImportanceLevel;
  urgency: UrgencyLevel;

  // ===== 通知配置 =====
  notification: {
    enabled: boolean;
    sound?: string | null; // 声音名称
    vibrate: boolean;
    displayType: 'BANNER' | 'ALERT' | 'SILENT';
    actions?: string[] | null; // 快捷操作按钮
  };

  // ===== 延后配置 =====
  snoozeConfig?: {
    enabled: boolean;
    defaultMinutes: number; // 默认延后时间（分钟）
    maxSnoozeCount?: number | null; // 最大延后次数
  } | null;

  // ===== 标签 =====
  tags: string[];

  // ===== 发生记录 (子实体) =====
  occurrences: ReminderOccurrenceServer[];

  // ===== 历史记录 (子实体) =====
  history: ReminderHistoryServer[];

  // ===== 统计信息 =====
  stats: {
    totalOccurrences: number; // 总触发次数
    acknowledgedCount: number; // 已确认次数
    snoozedCount: number; // 延后次数
    missedCount: number; // 错过次数
    lastTriggeredAt?: number | null; // epoch ms
    nextTriggerAt?: number | null; // epoch ms
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 状态管理
  activate(): void;
  pause(): void;
  complete(): void;
  cancel(): void;
  expire(): void;

  // 触发管理
  trigger(): Promise<ReminderOccurrenceServer>;
  acknowledge(): void;
  snooze(minutes: number): void;
  dismiss(): void;

  // 时间计算
  calculateNextTriggerTime(): number | null;
  isOverdue(): boolean;
  getMinutesUntilTrigger(): number | null;

  // 重复管理
  createNextOccurrence(): ReminderOccurrenceServer | null;
  skipNextOccurrence(): void;

  // 历史管理
  addHistory(action: string, details?: any): void;
  getHistory(): ReminderHistoryServer[];

  // 发生记录管理
  getOccurrences(limit?: number): ReminderOccurrenceServer[];
  getLastOccurrence(): ReminderOccurrenceServer | null;

  // 统计更新
  updateStats(): void;

  // DTO 转换方法
  toServerDTO(): ReminderServerDTO;
  toClientDTO(): ReminderClientDTO;
  toPersistenceDTO(): ReminderPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: ReminderServerDTO): ReminderServer;
  fromClientDTO(dto: ReminderClientDTO): ReminderServer;
  fromPersistenceDTO(dto: ReminderPersistenceDTO): ReminderServer;
}
```

### Client 接口

```typescript
export interface ReminderClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  status: string;
  reminderType: string;

  // ===== 时间配置 =====
  triggerTime: number;
  originalTriggerTime?: number | null;
  timezone?: string | null;

  // ===== 重复配置 =====
  isRecurring: boolean;
  recurrence?: {
    frequency: string;
    interval: number;
    daysOfWeek?: number[] | null;
    dayOfMonth?: number | null;
    monthOfYear?: number | null;
    endDate?: number | null;
    endAfterOccurrences?: number | null;
  } | null;

  // ===== 提前提醒 =====
  advanceNotifications?: {
    minutes?: number | null;
    hours?: number | null;
    days?: number | null;
  } | null;

  // ===== 位置提醒 =====
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
    address?: string | null;
    triggerOnEnter: boolean;
    triggerOnExit: boolean;
  } | null;

  // ===== 关联实体 =====
  taskUuid?: string | null;
  goalUuid?: string | null;
  scheduleUuid?: string | null;
  groupUuid?: string | null;

  // ===== 优先级 =====
  importance: string;
  urgency: string;

  // ===== 通知配置 =====
  notification: {
    enabled: boolean;
    sound?: string | null;
    vibrate: boolean;
    displayType: string;
    actions?: string[] | null;
  };

  // ===== 延后配置 =====
  snoozeConfig?: {
    enabled: boolean;
    defaultMinutes: number;
    maxSnoozeCount?: number | null;
  } | null;

  // ===== 标签 =====
  tags: string[];

  // ===== 发生记录 =====
  occurrences: ReminderOccurrenceClient[];

  // ===== 统计信息 =====
  stats: {
    totalOccurrences: number;
    acknowledgedCount: number;
    snoozedCount: number;
    missedCount: number;
    lastTriggeredAt?: number | null;
    nextTriggerAt?: number | null;
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  isDeleted: boolean;
  isActive: boolean;
  isOverdue: boolean;
  isPaused: boolean;
  statusText: string;
  typeText: string;
  importanceText: string;
  urgencyText: string;
  triggerTimeText: string; // "2024-01-15 14:30"
  timeUntilTrigger: string; // "2 小时后"
  recurrenceText: string; // "每天"
  hasLocation: boolean;
  hasAdvanceNotification: boolean;
  canSnooze: boolean;

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayTitle(): string;
  getStatusBadge(): { text: string; color: string };
  getPriorityBadge(): { text: string; color: string };
  getTriggerTimeText(): string;
  getTimeUntilTriggerText(): string;
  getRecurrenceDescription(): string;
  getLocationDescription(): string;

  // 操作判断
  canActivate(): boolean;
  canPause(): boolean;
  canComplete(): boolean;
  canCancel(): boolean;
  canDelete(): boolean;
  canSnooze(): boolean;
  canAcknowledge(): boolean;

  // DTO 转换
  toServerDTO(): ReminderServerDTO;
}
```

---

## 2. ReminderOccurrence (实体)

### 业务描述

提醒发生记录表示提醒的一次触发事件。

### Server 接口

```typescript
export interface ReminderOccurrenceServer {
  // ===== 基础属性 =====
  uuid: string;
  reminderUuid: string;

  // ===== 触发信息 =====
  scheduledTime: number; // epoch ms - 计划触发时间
  actualTime: number; // epoch ms - 实际触发时间

  // ===== 状态 =====
  status: 'PENDING' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'SNOOZED' | 'MISSED' | 'DISMISSED';

  // ===== 延后信息 =====
  snoozedUntil?: number | null; // epoch ms - 延后到的时间
  snoozeCount: number; // 延后次数

  // ===== 确认信息 =====
  acknowledgedAt?: number | null; // epoch ms
  dismissedAt?: number | null; // epoch ms

  // ===== 位置信息 (位置提醒) =====
  triggeredLocation?: {
    latitude: number;
    longitude: number;
    address?: string | null;
  } | null;

  // ===== 备注 =====
  note?: string | null;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 状态管理
  trigger(): void;
  acknowledge(note?: string): void;
  snooze(minutes: number): void;
  dismiss(): void;
  markAsMissed(): void;

  // 查询
  getReminder(): Promise<ReminderServer>;
  isMissed(): boolean;
  isSnoozed(): boolean;

  // DTO 转换方法
  toServerDTO(): ReminderOccurrenceServerDTO;
  toClientDTO(): ReminderOccurrenceClientDTO;
  toPersistenceDTO(): ReminderOccurrencePersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: ReminderOccurrenceServerDTO): ReminderOccurrenceServer;
  fromClientDTO(dto: ReminderOccurrenceClientDTO): ReminderOccurrenceServer;
  fromPersistenceDTO(dto: ReminderOccurrencePersistenceDTO): ReminderOccurrenceServer;
}
```

### Client 接口

```typescript
export interface ReminderOccurrenceClient {
  // ===== 基础属性 =====
  uuid: string;
  reminderUuid: string;
  scheduledTime: number;
  actualTime: number;
  status: string;
  snoozedUntil?: number | null;
  snoozeCount: number;
  acknowledgedAt?: number | null;
  dismissedAt?: number | null;
  triggeredLocation?: {
    latitude: number;
    longitude: number;
    address?: string | null;
  } | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;

  // ===== UI 计算属性 =====
  statusText: string;
  scheduledTimeText: string; // "2024-01-15 14:30"
  actualTimeText: string;
  timeAgo: string; // "3 小时前"
  isMissed: boolean;
  isSnoozed: boolean;
  isAcknowledged: boolean;
  isDismissed: boolean;
  delayMinutes: number; // 延迟分钟数

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getStatusIcon(): string;
  getTimeText(): string;
  getDelayText(): string; // "延后 15 分钟"

  // 操作判断
  canAcknowledge(): boolean;
  canSnooze(): boolean;
  canDismiss(): boolean;

  // DTO 转换
  toServerDTO(): ReminderOccurrenceServerDTO;
}
```

---

## 3. ReminderHistory (实体)

### 业务描述

提醒历史记录用于追踪提醒的变更历史。

### Server 接口

```typescript
export interface ReminderHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  reminderUuid: string;
  action: string; // 'CREATED' | 'UPDATED' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'SNOOZED' | 'DISMISSED' | etc.
  details?: any | null; // 变更详情

  // ===== 操作者 =====
  operatorUuid?: string | null;

  // ===== 时间戳 =====
  createdAt: number;

  // ===== 业务方法 =====

  // 查询
  getReminder(): Promise<ReminderServer>;

  // DTO 转换方法
  toServerDTO(): ReminderHistoryServerDTO;
  toClientDTO(): ReminderHistoryClientDTO;
  toPersistenceDTO(): ReminderHistoryPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: ReminderHistoryServerDTO): ReminderHistoryServer;
  fromClientDTO(dto: ReminderHistoryClientDTO): ReminderHistoryServer;
  fromPersistenceDTO(dto: ReminderHistoryPersistenceDTO): ReminderHistoryServer;
}
```

### Client 接口

```typescript
export interface ReminderHistoryClient {
  // ===== 基础属性 =====
  uuid: string;
  reminderUuid: string;
  action: string;
  details?: any | null;
  operatorUuid?: string | null;
  createdAt: number;

  // ===== UI 扩展 =====
  actionText: string; // "创建了提醒"
  timeAgo: string; // "3 天前"
  operatorName?: string | null;

  // ===== UI 业务方法 =====

  // 格式化展示
  getActionIcon(): string;
  getActionColor(): string;
  getDisplayText(): string;

  // DTO 转换
  toServerDTO(): ReminderHistoryServerDTO;
}
```

---

## 4. ReminderGroup (聚合根)

### 业务描述

提醒分组用于组织和分类提醒。

### Server 接口

```typescript
export interface ReminderGroupServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;

  // ===== 层级结构 =====
  parentGroupUuid?: string | null;
  sortOrder: number;

  // ===== 系统分组标识 =====
  isSystemGroup: boolean;
  groupType?: 'ALL' | 'TODAY' | 'UPCOMING' | 'RECURRING' | 'LOCATION' | 'CUSTOM' | null;

  // ===== 统计信息 =====
  reminderCount: number;
  activeReminderCount: number;
  overdueReminderCount: number;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 分组操作
  rename(newName: string): void;
  updateDescription(description: string): void;
  updateIcon(icon: string): void;
  updateColor(color: string): void;
  softDelete(): void;
  restore(): void;

  // 统计更新
  updateStatistics(reminderCount: number, activeCount: number, overdueCount: number): void;

  // DTO 转换方法
  toServerDTO(): ReminderGroupServerDTO;
  toClientDTO(): ReminderGroupClientDTO;
  toPersistenceDTO(): ReminderGroupPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: ReminderGroupServerDTO): ReminderGroupServer;
  fromClientDTO(dto: ReminderGroupClientDTO): ReminderGroupServer;
  fromPersistenceDTO(dto: ReminderGroupPersistenceDTO): ReminderGroupServer;
}
```

### Client 接口

```typescript
export interface ReminderGroupClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentGroupUuid?: string | null;
  sortOrder: number;
  isSystemGroup: boolean;
  groupType?: string | null;
  reminderCount: number;
  activeReminderCount: number;
  overdueReminderCount: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  displayName: string;
  displayIcon: string;
  isDeleted: boolean;

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayName(): string;
  getIcon(): string;
  getCountText(): string; // "5 个提醒"
  getBadge(): { text: string; color: string } | null;

  // 操作判断
  canRename(): boolean;
  canDelete(): boolean;
  canMove(): boolean;

  // DTO 转换
  toServerDTO(): ReminderGroupServerDTO;
}
```

---

## 5. ReminderStatistics (聚合根)

### 业务描述

提醒统计聚合用户的提醒数据统计信息。

### Server 接口

```typescript
export interface ReminderStatisticsServer {
  // ===== 基础属性 =====
  accountUuid: string;

  // ===== 提醒统计 =====
  totalReminders: number;
  activeReminders: number;
  pausedReminders: number;
  completedReminders: number;
  expiredReminders: number;
  overdueReminders: number;
  todayReminders: number;
  upcomingReminders: number;
  recurringReminders: number;
  locationBasedReminders: number;

  // ===== 触发统计 =====
  totalOccurrences: number;
  acknowledgedOccurrences: number;
  snoozedOccurrences: number;
  missedOccurrences: number;
  dismissedOccurrences: number;

  // ===== 分类统计 =====
  remindersByImportance: Record<string, number>;
  remindersByUrgency: Record<string, number>;
  remindersByType: Record<string, number>;
  remindersByStatus: Record<string, number>;
  remindersByGroup: Record<string, number>;

  // ===== 时间统计 =====
  remindersCreatedThisWeek: number;
  remindersTriggeredThisWeek: number;
  remindersCreatedThisMonth: number;
  remindersTriggeredThisMonth: number;

  // ===== 效率统计 =====
  averageAcknowledgeTime: number; // 平均确认时间（分钟）
  acknowledgeRate: number; // 确认率 0-100
  missRate: number; // 错过率 0-100
  snoozeRate: number; // 延后率 0-100

  // ===== 计算时间 =====
  lastCalculatedAt: number; // epoch ms

  // ===== 业务方法 =====

  // 统计计算
  recalculate(reminders: ReminderServer[]): void;

  // 查询
  getAcknowledgeRate(): number;
  getReliabilityScore(): number; // 可靠性评分 0-100

  // DTO 转换方法
  toServerDTO(): ReminderStatisticsServerDTO;
  toClientDTO(): ReminderStatisticsClientDTO;
  toPersistenceDTO(): ReminderStatisticsPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: ReminderStatisticsServerDTO): ReminderStatisticsServer;
  fromClientDTO(dto: ReminderStatisticsClientDTO): ReminderStatisticsServer;
  fromPersistenceDTO(dto: ReminderStatisticsPersistenceDTO): ReminderStatisticsServer;
}
```

### Client 接口

```typescript
export interface ReminderStatisticsClient {
  // ===== 基础属性 =====
  accountUuid: string;
  totalReminders: number;
  activeReminders: number;
  pausedReminders: number;
  completedReminders: number;
  expiredReminders: number;
  overdueReminders: number;
  todayReminders: number;
  upcomingReminders: number;
  recurringReminders: number;
  locationBasedReminders: number;
  totalOccurrences: number;
  acknowledgedOccurrences: number;
  snoozedOccurrences: number;
  missedOccurrences: number;
  dismissedOccurrences: number;
  remindersByImportance: Record<string, number>;
  remindersByUrgency: Record<string, number>;
  remindersByType: Record<string, number>;
  remindersByStatus: Record<string, number>;
  remindersByGroup: Record<string, number>;
  remindersCreatedThisWeek: number;
  remindersTriggeredThisWeek: number;
  remindersCreatedThisMonth: number;
  remindersTriggeredThisMonth: number;
  averageAcknowledgeTime: number;
  acknowledgeRate: number;
  missRate: number;
  snoozeRate: number;
  lastCalculatedAt: number;

  // ===== UI 计算属性 =====
  reliabilityScore: number; // 可靠性评分 0-100
  weeklyTrend: 'UP' | 'DOWN' | 'STABLE';
  monthlyTrend: 'UP' | 'DOWN' | 'STABLE';
  todayProgress: number; // 今日完成进度 0-100

  // ===== UI 业务方法 =====

  // 格式化展示
  getAcknowledgeRateText(): string; // "85% 确认率"
  getMissRateText(): string; // "5% 错过率"
  getTodayText(): string; // "今日 5 个提醒"
  getReliabilityLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
  getTrendIndicator(): { icon: string; color: string; text: string };

  // 图表数据
  getTypeChartData(): ChartData;
  getStatusChartData(): ChartData;
  getTimelineChartData(): TimelineData;
  getAcknowledgeTrendData(): TrendData;

  // DTO 转换
  toServerDTO(): ReminderStatisticsServerDTO;
}

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

interface TimelineData {
  dates: string[];
  created: number[];
  triggered: number[];
}

interface TrendData {
  period: string[];
  values: number[];
}
```

---

## 值对象 (Value Objects)

### ReminderTriggerConfig

```typescript
export interface ReminderTriggerConfig {
  triggerTime: number; // epoch ms
  timezone?: string | null;
  advanceNotifications?: {
    minutes?: number | null;
    hours?: number | null;
    days?: number | null;
  } | null;
}
```

### RecurrenceConfig

```typescript
export interface RecurrenceConfig {
  frequency: 'MINUTELY' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  interval: number;
  daysOfWeek?: number[] | null;
  dayOfMonth?: number | null;
  monthOfYear?: number | null;
  endDate?: number | null;
  endAfterOccurrences?: number | null;
  customPattern?: string | null;
}
```

### LocationConfig

```typescript
export interface LocationConfig {
  latitude: number;
  longitude: number;
  radius: number; // 米
  address?: string | null;
  triggerOnEnter: boolean;
  triggerOnExit: boolean;
}
```

### NotificationConfig

```typescript
export interface NotificationConfig {
  enabled: boolean;
  sound?: string | null;
  vibrate: boolean;
  displayType: 'BANNER' | 'ALERT' | 'SILENT';
  actions?: string[] | null;
}
```

### SnoozeConfig

```typescript
export interface SnoozeConfig {
  enabled: boolean;
  defaultMinutes: number;
  maxSnoozeCount?: number | null;
}
```

---

## 仓储接口

### IReminderRepository

```typescript
export interface IReminderRepository {
  save(reminder: ReminderServer): Promise<void>;
  findByUuid(uuid: string): Promise<ReminderServer | null>;
  findByAccountUuid(accountUuid: string, includeDeleted?: boolean): Promise<ReminderServer[]>;

  // 逻辑删除
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>;

  // 查询
  findByStatus(accountUuid: string, status: ReminderStatus): Promise<ReminderServer[]>;
  findByGroup(groupUuid: string): Promise<ReminderServer[]>;
  findByTask(taskUuid: string): Promise<ReminderServer[]>;
  findByGoal(goalUuid: string): Promise<ReminderServer[]>;
  findBySchedule(scheduleUuid: string): Promise<ReminderServer[]>;
  findByTimeRange(
    accountUuid: string,
    startTime: number,
    endTime: number,
  ): Promise<ReminderServer[]>;
  findOverdue(accountUuid: string): Promise<ReminderServer[]>;
  findRecurring(accountUuid: string): Promise<ReminderServer[]>;
  findLocationBased(accountUuid: string): Promise<ReminderServer[]>;
  findNextToTrigger(accountUuid: string, limit: number): Promise<ReminderServer[]>;
}
```

---

## 领域服务

### ReminderTriggerService

```typescript
export interface ReminderTriggerService {
  triggerReminder(reminderUuid: string): Promise<ReminderOccurrenceServer>;
  checkDueReminders(accountUuid: string): Promise<ReminderServer[]>;
  scheduleNextOccurrence(reminder: ReminderServer): Promise<void>;
  cancelScheduledReminder(reminderUuid: string): Promise<void>;
}
```

### ReminderRecurrenceService

```typescript
export interface ReminderRecurrenceService {
  calculateNextTriggerTime(reminder: ReminderServer): number | null;
  createNextOccurrence(reminder: ReminderServer): Promise<ReminderOccurrenceServer>;
  skipNextOccurrence(reminder: ReminderServer): void;
  endRecurrence(reminder: ReminderServer): void;
  validateRecurrenceConfig(config: RecurrenceConfig): boolean;
}
```

### LocationReminderService

```typescript
export interface LocationReminderService {
  checkLocationReminders(
    accountUuid: string,
    currentLocation: { latitude: number; longitude: number },
  ): Promise<ReminderServer[]>;
  isInRadius(
    currentLocation: { latitude: number; longitude: number },
    reminderLocation: LocationConfig,
  ): boolean;
  calculateDistance(
    location1: { latitude: number; longitude: number },
    location2: { latitude: number; longitude: number },
  ): number;
}
```

---

## 应用层服务

### ReminderService

```typescript
export interface ReminderService {
  // CRUD 操作
  createReminder(params: CreateReminderParams): Promise<ReminderServer>;
  updateReminder(uuid: string, params: UpdateReminderParams): Promise<ReminderServer>;
  deleteReminder(uuid: string): Promise<void>;
  getReminder(uuid: string): Promise<ReminderServer | null>;
  listReminders(accountUuid: string, filters?: ReminderFilters): Promise<ReminderServer[]>;

  // 状态管理
  activateReminder(uuid: string): Promise<void>;
  pauseReminder(uuid: string): Promise<void>;
  completeReminder(uuid: string): Promise<void>;
  cancelReminder(uuid: string): Promise<void>;

  // 触发管理
  triggerReminder(uuid: string): Promise<ReminderOccurrenceServer>;
  acknowledgeReminder(uuid: string, note?: string): Promise<void>;
  snoozeReminder(uuid: string, minutes: number): Promise<void>;
  dismissReminder(uuid: string): Promise<void>;

  // 发生记录
  getOccurrences(reminderUuid: string, limit?: number): Promise<ReminderOccurrenceServer[]>;
  getLastOccurrence(reminderUuid: string): Promise<ReminderOccurrenceServer | null>;

  // 批量操作
  batchActivate(reminderUuids: string[]): Promise<void>;
  batchPause(reminderUuids: string[]): Promise<void>;
  batchDelete(reminderUuids: string[]): Promise<void>;

  // 统计查询
  getStatistics(accountUuid: string): Promise<ReminderStatisticsServer>;
}
```

---

## 总结

### 聚合根

- **Reminder**: 1 个聚合根（包含 ReminderOccurrence、ReminderHistory）
- **ReminderGroup**: 1 个聚合根
- **ReminderStatistics**: 1 个聚合根

### 实体

- **ReminderOccurrence**: 提醒发生记录（Reminder 的子实体）
- **ReminderHistory**: 提醒历史（Reminder 的子实体）

### 值对象

- ReminderTriggerConfig
- RecurrenceConfig
- LocationConfig
- NotificationConfig
- SnoozeConfig

### 领域服务

- ReminderTriggerService（触发管理）
- ReminderRecurrenceService（重复提醒）
- LocationReminderService（位置提醒）

### 关键设计原则

1. **Server 侧重业务逻辑**: 完整的业务方法、领域规则
2. **Client 侧重 UI 展示**: 格式化方法、UI 状态、快捷操作
3. **时间戳统一**: 全部使用 epoch ms (number)
4. **统计信息**: Client 包含更多预计算的统计数据和格式化字符串
5. **聚合根控制子实体**: Reminder 聚合根管理所有子实体
6. **多种触发方式**: 支持时间触发、位置触发、事件触发
7. **灵活的重复规则**: 支持多种重复频率和自定义模式
8. **延后机制**: 支持灵活的延后配置和限制
