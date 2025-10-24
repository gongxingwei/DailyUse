# Reminder 模块接口设计 V2

## 版本说明

- **版本**: V2.1
- **更新日期**: 2025-10-14
- **更新内容**:
  - V2.1: 优化启动/暂停控制逻辑，支持组控制和个体控制模式
  - 聚焦于独立的循环重复提醒功能
  - 支持灵活的启动/暂停管理
  - 支持小组式批量管理
  - 简化为专注于时间触发的提醒系统

## 模块概述

Reminder 模块是一个**独立的循环重复提醒**功能模块，主要用于：

- 定期提醒（每隔 XX 分钟、每天 XX:XX）
- 独立于任务和日程的纯提醒功能
- 支持启动/暂停控制
- 支持分组批量管理

**与 Task 模块的区别**:

- Task: 需要完成的具体任务，有开始/结束时间，有完成状态
- Reminder: 纯粹的提醒通知，只是在特定时间提醒用户做某事

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
ReminderTemplate (聚合根 - 提醒模板) ⭐️ 重命名
├── RecurrenceConfig (值对象 - 重复配置)
├── NotificationConfig (值对象 - 通知配置)
└── ReminderHistory (实体 - 提醒历史)

ReminderGroup (聚合根 - 提醒分组)
└── GroupControlConfig (值对象 - 组控制配置) ⭐️ 新增

ReminderStatistics (聚合根 - 提醒统计)
```

---

## 1. ReminderTemplate (聚合根) ⭐️ 重命名

### 业务描述

提醒模板定义了何时、如何提醒用户。支持一次性提醒和循环提醒。

**启用状态控制逻辑**:

- 模板有 `selfEnabled` (自我启用状态)
- 实际是否启用由所属 Group 的 `controlMode` 决定:
  - `controlMode = 'GROUP'`: `enabled = group.enabled`
  - `controlMode = 'INDIVIDUAL'`: `enabled = selfEnabled`

### Server 接口

```typescript
export interface ReminderTemplateServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;

  // ===== 提醒类型 =====
  type: 'ONE_TIME' | 'RECURRING'; // 一次性 | 循环

  // ===== 触发时间 =====
  trigger: {
    type: 'FIXED_TIME' | 'INTERVAL'; // 固定时间 | 间隔时间

    // 固定时间触发（FIXED_TIME）
    fixedTime?: {
      time: string; // "HH:mm" 格式（如 "09:00"）
      timezone?: string | null; // 时区（默认用户时区）
    } | null;

    // 间隔时间触发（INTERVAL）
    interval?: {
      minutes: number; // 每隔 N 分钟
      startTime?: number | null; // epoch ms - 开始时间（可选）
    } | null;
  };

  // ===== 重复配置（仅 RECURRING） =====
  recurrence?: RecurrenceConfig | null;

  // ===== 生效时间 =====
  activeTime: {
    startDate: number; // epoch ms - 生效开始日期
    endDate?: number | null; // epoch ms - 生效结束日期（可选，无期限则为 null）
  };

  // ===== 活跃时间段（可选） =====
  activeHours?: {
    enabled: boolean;
    startHour: number; // 0-23
    endHour: number; // 0-23
  } | null; // 例如：只在 9:00-21:00 之间提醒

  // ===== 通知配置 =====
  notificationConfig: NotificationConfig;

  // ===== 状态 =====
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'ARCHIVED';

  // ===== 分组 =====
  groupUuid?: string | null;

  // ===== 优先级 =====
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  // ===== 标签 =====
  tags: string[];
  color?: string | null;
  icon?: string | null;

  // ===== 下次触发 =====
  nextTriggerAt?: number | null; // epoch ms - 下次触发时间

  // ===== 提醒历史 =====
  history: ReminderHistoryServer[];

  // ===== 统计 =====
  stats: {
    totalTriggers: number; // 总触发次数
    lastTriggeredAt?: number | null; // epoch ms - 最后触发时间
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 状态管理
  activate(): void;
  pause(): void;
  resume(): void;
  expire(): void;
  archive(): void;
  softDelete(): void;
  restore(): void;

  // 触发计算
  calculateNextTrigger(): number | null; // 计算下次触发时间
  shouldTriggerNow(): boolean;
  shouldTriggerAt(timestamp: number): boolean;
  isActiveAtTime(timestamp: number): boolean; // 在指定时间是否活跃

  // 触发记录
  recordTrigger(): void;
  addHistory(triggeredAt: number, result: 'SUCCESS' | 'FAILED', error?: string): void;
  getHistory(limit?: number): ReminderHistoryServer[];

  // 查询
  isActive(): boolean;
  isPaused(): boolean;
  isExpired(): boolean;
  isOneTime(): boolean;
  isRecurring(): boolean;
  getNextTriggerTime(): number | null;
  getGroup(): Promise<ReminderGroupServer | null>;

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
  type: string;
  trigger: {
    type: string;
    fixedTime?: {
      time: string;
      timezone?: string | null;
    } | null;
    interval?: {
      minutes: number;
      startTime?: number | null;
    } | null;
  };
  recurrence?: RecurrenceConfig | null;
  activeTime: {
    startDate: number;
    endDate?: number | null;
  };
  activeHours?: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  } | null;
  notificationConfig: NotificationConfig;
  status: string;
  groupUuid?: string | null;
  priority: string;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: number | null;
  stats: {
    totalTriggers: number;
    lastTriggeredAt?: number | null;
  };
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  displayTitle: string;
  typeText: string; // "一次性" | "循环"
  triggerText: string; // "每天 09:00" | "每隔 30 分钟"
  recurrenceText?: string | null; // "每周一、三、五" | "每天"
  statusText: string;
  priorityText: string;
  nextTriggerText?: string | null; // "明天 09:00" | "10 分钟后"
  isActive: boolean;
  isPaused: boolean;
  lastTriggeredText?: string | null; // "3 小时前"

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string; icon: string };
  getPriorityBadge(): { text: string; color: string };
  getTriggerDisplay(): string;
  getNextTriggerDisplay(): string;

  // 操作判断
  canPause(): boolean;
  canResume(): boolean;
  canEdit(): boolean;
  canDelete(): boolean;

  // DTO 转换
  toServerDTO(): ReminderServerDTO;
}
```

---

## 2. ReminderGroup (聚合根)

### 业务描述

提醒分组用于批量管理相关的提醒，支持批量启动/暂停。

### Server 接口

```typescript
export interface ReminderGroupServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;

  // ===== 批量控制 =====
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

  // ===== 排序 =====
  order: number;

  // ===== 统计 =====
  stats: {
    totalReminders: number;
    activeReminders: number;
    pausedReminders: number;
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 批量操作
  pauseAll(): Promise<void>; // 暂停所有提醒
  resumeAll(): Promise<void>; // 恢复所有提醒
  activateAll(): Promise<void>; // 激活所有提醒

  // 状态管理
  activate(): void;
  pause(): void;
  archive(): void;
  softDelete(): void;
  restore(): void;

  // 统计
  updateStats(): Promise<void>;
  getReminders(): Promise<ReminderServer[]>;
  getRemindersCount(): Promise<number>;

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
  color?: string | null;
  icon?: string | null;
  status: string;
  order: number;
  stats: {
    totalReminders: number;
    activeReminders: number;
    pausedReminders: number;
  };
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  displayName: string;
  statusText: string;
  reminderCountText: string; // "5 个提醒"
  activeStatusText: string; // "3 个活跃"

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getIcon(): string;
  getColorStyle(): string;

  // 操作判断
  canPause(): boolean;
  canResume(): boolean;
  canEdit(): boolean;
  canDelete(): boolean;
  hasReminders(): boolean;

  // DTO 转换
  toServerDTO(): ReminderGroupServerDTO;
}
```

---

## 3. ReminderStatistics (聚合根)

### 业务描述

提醒统计信息。

### Server 接口

```typescript
export interface ReminderStatisticsServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;

  // ===== 提醒统计 =====
  reminderStats: {
    totalReminders: number;
    activeReminders: number;
    pausedReminders: number;
    archivedReminders: number;
    oneTimeReminders: number;
    recurringReminders: number;
  };

  // ===== 分组统计 =====
  groupStats: {
    totalGroups: number;
    activeGroups: number;
    pausedGroups: number;
  };

  // ===== 触发统计 =====
  triggerStats: {
    todayTriggers: number; // 今日触发次数
    weekTriggers: number; // 本周触发次数
    monthTriggers: number; // 本月触发次数
    totalTriggers: number; // 总触发次数
    successfulTriggers: number; // 成功触发次数
    failedTriggers: number; // 失败触发次数
  };

  // ===== 时间戳 =====
  calculatedAt: number;

  // ===== 业务方法 =====

  // 统计计算
  calculate(): Promise<void>;
  getTriggersInRange(startDate: number, endDate: number): Promise<number>;

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
  uuid: string;
  accountUuid: string;
  reminderStats: {
    totalReminders: number;
    activeReminders: number;
    pausedReminders: number;
    archivedReminders: number;
    oneTimeReminders: number;
    recurringReminders: number;
  };
  groupStats: {
    totalGroups: number;
    activeGroups: number;
    pausedGroups: number;
  };
  triggerStats: {
    todayTriggers: number;
    weekTriggers: number;
    monthTriggers: number;
    totalTriggers: number;
    successfulTriggers: number;
    failedTriggers: number;
  };
  calculatedAt: number;

  // ===== UI 计算属性 =====
  todayTriggersText: string; // "今日 15 次"
  weekTriggersText: string; // "本周 87 次"
  successRateText: string; // "成功率 98.5%"

  // ===== UI 业务方法 =====

  // 格式化展示
  getSuccessRate(): number; // 0-100
  getTriggerTrend(): 'UP' | 'DOWN' | 'STABLE';

  // DTO 转换
  toServerDTO(): ReminderStatisticsServerDTO;
}
```

---

## 4. ReminderHistory (实体)

### 业务描述

提醒触发历史记录。

### Server 接口

```typescript
export interface ReminderHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  reminderUuid: string;

  // ===== 触发信息 =====
  triggeredAt: number; // epoch ms
  result: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  error?: string | null;

  // ===== 通知信息 =====
  notificationSent: boolean;
  notificationChannels?: string[] | null; // ['IN_APP', 'PUSH', etc.]

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
  triggeredAt: number;
  result: string;
  error?: string | null;
  notificationSent: boolean;
  notificationChannels?: string[] | null;
  createdAt: number;

  // ===== UI 扩展 =====
  resultText: string;
  timeAgo: string;
  channelsText?: string | null; // "应用内 + 推送"

  // ===== UI 业务方法 =====

  // 格式化展示
  getResultBadge(): { text: string; color: string; icon: string };
  getDisplayText(): string;

  // DTO 转换
  toServerDTO(): ReminderHistoryServerDTO;
}
```

---

## 值对象 (Value Objects)

### RecurrenceConfig

```typescript
export interface RecurrenceConfig {
  // ===== 重复类型 =====
  type: 'DAILY' | 'WEEKLY' | 'CUSTOM_DAYS';

  // ===== 每日重复（DAILY） =====
  daily?: {
    interval: number; // 每 N 天
  } | null;

  // ===== 每周重复（WEEKLY） =====
  weekly?: {
    interval: number; // 每 N 周
    weekDays: (
      | 'MONDAY'
      | 'TUESDAY'
      | 'WEDNESDAY'
      | 'THURSDAY'
      | 'FRIDAY'
      | 'SATURDAY'
      | 'SUNDAY'
    )[];
  } | null;

  // ===== 自定义日期重复（CUSTOM_DAYS） =====
  customDays?: {
    dates: number[]; // epoch ms - 指定的日期列表
  } | null;
}
```

### NotificationConfig

```typescript
export interface NotificationConfig {
  // ===== 通知渠道 =====
  channels: ('IN_APP' | 'PUSH' | 'EMAIL' | 'SMS')[];

  // ===== 通知内容 =====
  title?: string | null; // 自定义标题（不填则用 Reminder title）
  body?: string | null; // 自定义正文（不填则用 Reminder description）

  // ===== 通知设置 =====
  sound?: {
    enabled: boolean;
    soundName?: string | null;
  } | null;

  vibration?: {
    enabled: boolean;
    pattern?: number[] | null; // 震动模式
  } | null;

  // ===== 通知操作 =====
  actions?: Array<{
    id: string;
    label: string;
    action: 'DISMISS' | 'SNOOZE' | 'COMPLETE' | 'CUSTOM';
    customAction?: string | null;
  }> | null;
}
```

---

## 仓储接口

### IReminderRepository

```typescript
export interface IReminderRepository {
  save(reminder: ReminderServer): Promise<void>;
  findByUuid(uuid: string): Promise<ReminderServer | null>;
  findByAccountUuid(accountUuid: string): Promise<ReminderServer[]>;
  findByGroupUuid(groupUuid: string): Promise<ReminderServer[]>;
  findActiveByAccountUuid(accountUuid: string): Promise<ReminderServer[]>;

  // 查询
  findByStatus(accountUuid: string, status: string): Promise<ReminderServer[]>;
  findDueReminders(accountUuid: string, beforeTime: number): Promise<ReminderServer[]>;

  // 删除
  delete(uuid: string): Promise<void>;
}
```

### IReminderGroupRepository

```typescript
export interface IReminderGroupRepository {
  save(group: ReminderGroupServer): Promise<void>;
  findByUuid(uuid: string): Promise<ReminderGroupServer | null>;
  findByAccountUuid(accountUuid: string): Promise<ReminderGroupServer[]>;

  // 删除
  delete(uuid: string): Promise<void>;
}
```

### IReminderStatisticsRepository

```typescript
export interface IReminderStatisticsRepository {
  save(stats: ReminderStatisticsServer): Promise<void>;
  findByAccountUuid(accountUuid: string): Promise<ReminderStatisticsServer | null>;
}
```

---

## 领域服务

### ReminderTriggerService

```typescript
export interface ReminderTriggerService {
  // 触发计算
  calculateNextTrigger(reminder: ReminderServer): number | null;
  getDueReminders(accountUuid: string): Promise<ReminderServer[]>;

  // 触发执行
  triggerReminder(reminder: ReminderServer): Promise<void>;
  batchTriggerReminders(reminders: ReminderServer[]): Promise<void>;
}
```

### ReminderSchedulerService

```typescript
export interface ReminderSchedulerService {
  // 调度管理
  scheduleReminder(reminder: ReminderServer): Promise<void>;
  unscheduleReminder(reminderUuid: string): Promise<void>;
  rescheduleReminder(reminder: ReminderServer): Promise<void>;

  // 批量调度
  scheduleAllForAccount(accountUuid: string): Promise<void>;
}
```

---

## 应用层服务

### ReminderService

```typescript
export interface ReminderService {
  // 提醒管理
  createReminder(reminder: Partial<ReminderServer>): Promise<ReminderServer>;
  updateReminder(uuid: string, updates: Partial<ReminderServer>): Promise<ReminderServer>;
  deleteReminder(uuid: string): Promise<void>;
  getReminder(uuid: string): Promise<ReminderServer | null>;
  listReminders(accountUuid: string): Promise<ReminderServer[]>;
  listActiveReminders(accountUuid: string): Promise<ReminderServer[]>;

  // 提醒状态
  pauseReminder(uuid: string): Promise<void>;
  resumeReminder(uuid: string): Promise<void>;
  activateReminder(uuid: string): Promise<void>;
  archiveReminder(uuid: string): Promise<void>;

  // 分组管理
  createGroup(group: Partial<ReminderGroupServer>): Promise<ReminderGroupServer>;
  updateGroup(uuid: string, updates: Partial<ReminderGroupServer>): Promise<ReminderGroupServer>;
  deleteGroup(uuid: string): Promise<void>;
  getGroup(uuid: string): Promise<ReminderGroupServer | null>;
  listGroups(accountUuid: string): Promise<ReminderGroupServer[]>;

  // 批量操作
  pauseGroup(groupUuid: string): Promise<void>;
  resumeGroup(groupUuid: string): Promise<void>;
  pauseAllInGroup(groupUuid: string): Promise<void>;
  resumeAllInGroup(groupUuid: string): Promise<void>;

  // 触发管理
  triggerReminder(uuid: string): Promise<void>; // 手动触发
  getDueReminders(accountUuid: string): Promise<ReminderServer[]>;

  // 统计
  getStatistics(accountUuid: string): Promise<ReminderStatisticsServer>;
  getHistory(uuid: string, limit?: number): Promise<ReminderHistoryServer[]>;
}
```

---

## 使用场景示例

### 场景 1: 每天早上 9 点提醒喝水

```typescript
const reminder: Partial<ReminderServer> = {
  title: '喝水提醒',
  description: '记得喝一杯水',
  type: 'RECURRING',
  trigger: {
    type: 'FIXED_TIME',
    fixedTime: {
      time: '09:00',
    },
  },
  recurrence: {
    type: 'DAILY',
    daily: {
      interval: 1, // 每天
    },
  },
  activeTime: {
    startDate: Date.now(),
    endDate: null, // 无期限
  },
  notificationConfig: {
    channels: ['IN_APP', 'PUSH'],
    sound: { enabled: true },
  },
  priority: 'MEDIUM',
};
```

### 场景 2: 每隔 30 分钟提醒休息眼睛

```typescript
const reminder: Partial<ReminderServer> = {
  title: '眼睛休息提醒',
  description: '已经 30 分钟了，该休息一下眼睛了',
  type: 'RECURRING',
  trigger: {
    type: 'INTERVAL',
    interval: {
      minutes: 30,
      startTime: Date.now(), // 从现在开始
    },
  },
  activeTime: {
    startDate: Date.now(),
    endDate: null,
  },
  activeHours: {
    enabled: true,
    startHour: 9, // 只在 9:00-21:00 之间提醒
    endHour: 21,
  },
  notificationConfig: {
    channels: ['IN_APP', 'PUSH'],
    sound: { enabled: true },
  },
  priority: 'HIGH',
};
```

### 场景 3: 每周一、三、五早上 8 点提醒跑步

```typescript
const reminder: Partial<ReminderServer> = {
  title: '跑步提醒',
  description: '该去跑步了！',
  type: 'RECURRING',
  trigger: {
    type: 'FIXED_TIME',
    fixedTime: {
      time: '08:00',
    },
  },
  recurrence: {
    type: 'WEEKLY',
    weekly: {
      interval: 1, // 每周
      weekDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    },
  },
  activeTime: {
    startDate: Date.now(),
    endDate: null,
  },
  notificationConfig: {
    channels: ['IN_APP', 'PUSH'],
    sound: { enabled: true },
    vibration: { enabled: true },
  },
  priority: 'HIGH',
};
```

### 场景 4: 分组管理 - 健康提醒组

```typescript
// 创建分组
const group: Partial<ReminderGroupServer> = {
  name: '健康提醒',
  description: '所有与健康相关的提醒',
  color: '#4CAF50',
  icon: 'health',
};

// 将提醒添加到分组
const reminders = [
  { title: '喝水提醒', groupUuid: group.uuid },
  { title: '眼睛休息提醒', groupUuid: group.uuid },
  { title: '跑步提醒', groupUuid: group.uuid },
];

// 批量暂停/恢复
await reminderService.pauseAllInGroup(group.uuid);
await reminderService.resumeAllInGroup(group.uuid);
```

---

## 总结

### V2 架构特点

#### ⭐️ 专注循环提醒

- 独立的提醒系统，不依赖任务或日程
- 支持一次性提醒和循环提醒
- 支持固定时间和间隔时间两种触发方式

#### ⭐️ 灵活的触发配置

- **固定时间**: 每天特定时间（如 09:00）
- **间隔时间**: 每隔 N 分钟
- **活跃时间段**: 可限制提醒时间范围（如 9:00-21:00）

#### ⭐️ 强大的分组管理

- 批量启动/暂停分组内的所有提醒
- 便于管理相关的提醒

#### ⭐️ 多渠道通知

- 应用内通知
- 推送通知
- 邮件通知
- 短信通知

### 聚合根

- **Reminder**: 提醒规则（定义触发时间和通知配置）
- **ReminderGroup**: 提醒分组（批量管理）
- **ReminderStatistics**: 提醒统计（数据分析）

### 实体

- **ReminderHistory**: 提醒触发历史

### 值对象

- **RecurrenceConfig**: 重复配置
- **NotificationConfig**: 通知配置

### 领域服务

- **ReminderTriggerService**: 触发计算和执行
- **ReminderSchedulerService**: 提醒调度管理

### 关键设计原则

1. **简单专注**: 专注于循环提醒功能
2. **灵活触发**: 支持固定时间和间隔时间
3. **批量管理**: 分组批量启动/暂停
4. **活跃控制**: 支持活跃时间段限制
5. **多渠道通知**: 支持多种通知渠道
6. **历史追踪**: 完整的触发历史记录
