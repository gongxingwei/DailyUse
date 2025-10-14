# Reminder 模块接口设计 V2.1

## 版本说明

- **版本**: V2.1
- **更新日期**: 2025-10-14
- **更新内容**: 
  - ⭐️ 优化启动/暂停控制逻辑，支持组控制和个体控制模式
  - 状态简化为 ACTIVE 和 PAUSED
  - 优先级改为 importanceLevel
  - 聚焦于独立的循环重复提醒功能
  - 支持灵活的启动/暂停管理
  - 支持小组式批量管理

## 模块概述

Reminder 模块是一个**独立的循环重复提醒**功能模块，主要用于：
- 定期提醒（每隔 XX 分钟、每天 XX:XX）
- 独立于任务和日程的纯提醒功能
- 支持灵活的启动/暂停控制
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

### 灵活的启用状态控制 ⭐️ 核心设计

**控制逻辑**:
```typescript
// Template 的实际启用状态计算
function isTemplateEnabled(template: ReminderTemplate, group: ReminderGroup): boolean {
  if (group.controlMode === 'GROUP') {
    return group.enabled;
  } else { // 'INDIVIDUAL'
    return template.selfEnabled;
  }
}
```

**使用场景**:
1. **组控制模式**: 一键控制组内所有 Template
   - 设置 `group.controlMode = 'GROUP'` + `group.enabled = true` → 所有 Template 启用
   - 设置 `group.controlMode = 'GROUP'` + `group.enabled = false` → 所有 Template 暂停

2. **个体控制模式**: 恢复每个 Template 的独立状态
   - 设置 `group.controlMode = 'INDIVIDUAL'` → 每个 Template 根据自己的 `selfEnabled` 决定

3. **批量操作**: 一键启用/暂停所有 Template
   - `enableAllTemplates()` → 设置所有 Template 的 `selfEnabled = true`
   - `pauseAllTemplates()` → 设置所有 Template 的 `selfEnabled = false`

## 领域模型层次

```
ReminderTemplate (聚合根 - 提醒模板)
├── RecurrenceConfig (值对象 - 重复配置)
├── NotificationConfig (值对象 - 通知配置)
└── ReminderHistory (实体 - 提醒历史)

ReminderGroup (聚合根 - 提醒分组)
└── GroupControlConfig (值对象 - 组控制配置)

ReminderStatistics (聚合根 - 提醒统计)
```

---

## 1. ReminderTemplate (聚合根)

### 业务描述
提醒模板定义了何时、如何提醒用户。支持一次性提醒和循环提醒。

**启用状态控制**:
- `selfEnabled`: 模板自身的启用状态
- 实际是否启用由所属 Group 的 `controlMode` 决定
- 提供 `getEffectiveEnabled()` 方法计算实际启用状态

### Server 接口

```typescript
import { ImportanceLevel } from '@dailyuse/contracts/shared';

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
  
  // ===== 状态控制 ⭐️ 核心 =====
  selfEnabled: boolean; // 模板自身的启用状态
  status: 'ACTIVE' | 'PAUSED'; // 简化状态
  
  // ===== 分组 =====
  groupUuid?: string | null;
  
  // ===== 重要性 =====
  importanceLevel: ImportanceLevel; // from @dailyuse/contracts/shared
  
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
  
  // 状态管理 ⭐️ 核心
  enable(): void; // 启用（设置 selfEnabled = true）
  pause(): void; // 暂停（设置 selfEnabled = false）
  toggle(): void; // 切换状态
  
  // 实际启用状态计算 ⭐️ 核心
  getEffectiveEnabled(): Promise<boolean>; // 计算实际是否启用
  isEffectivelyEnabled(): Promise<boolean>; // 同上，语义化方法名
  
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
  isOneTime(): boolean;
  isRecurring(): boolean;
  getNextTriggerTime(): number | null;
  getGroup(): Promise<ReminderGroupServer | null>;
  
  // 软删除
  softDelete(): void;
  restore(): void;
  
  // DTO 转换方法
  toServerDTO(): ReminderTemplateServerDTO;
  toClientDTO(): ReminderTemplateClientDTO;
  toPersistenceDTO(): ReminderTemplatePersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: ReminderTemplateServerDTO): ReminderTemplateServer;
  fromClientDTO(dto: ReminderTemplateClientDTO): ReminderTemplateServer;
  fromPersistenceDTO(dto: ReminderTemplatePersistenceDTO): ReminderTemplateServer;
}
```

### Client 接口

```typescript
export interface ReminderTemplateClient {
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
  
  // ===== 状态控制 =====
  selfEnabled: boolean;
  status: string;
  effectiveEnabled: boolean; // 实际启用状态（计算得出）
  
  // ===== 分组 =====
  groupUuid?: string | null;
  
  // ===== 重要性 =====
  importanceLevel: string;
  
  // ===== 标签 =====
  tags: string[];
  color?: string | null;
  icon?: string | null;
  
  // ===== 下次触发 =====
  nextTriggerAt?: number | null;
  
  // ===== 统计 =====
  stats: {
    totalTriggers: number;
    lastTriggeredAt?: number | null;
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  
  // ===== UI 计算属性 =====
  displayTitle: string;
  typeText: string; // "一次性" | "循环"
  triggerText: string; // "每天 09:00" | "每隔 30 分钟"
  recurrenceText?: string | null; // "每周一、三、五" | "每天"
  statusText: string;
  importanceText: string;
  nextTriggerText?: string | null; // "明天 09:00" | "10 分钟后"
  isActive: boolean;
  isPaused: boolean;
  lastTriggeredText?: string | null; // "3 小时前"
  controlledByGroup: boolean; // 是否受组控制
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getStatusBadge(): { text: string; color: string; icon: string };
  getImportanceBadge(): { text: string; color: string };
  getTriggerDisplay(): string;
  getNextTriggerDisplay(): string;
  
  // 操作判断
  canEnable(): boolean;
  canPause(): boolean;
  canEdit(): boolean;
  canDelete(): boolean;
  
  // DTO 转换
  toServerDTO(): ReminderTemplateServerDTO;
}
```

---

## 2. ReminderGroup (聚合根)

### 业务描述
提醒分组用于批量管理相关的提醒，支持灵活的控制模式。

**控制模式 ⭐️ 核心**:
- `GROUP`: 组控制模式 - 所有 Template 的启用状态由 Group 统一控制
- `INDIVIDUAL`: 个体控制模式 - 每个 Template 根据自己的 `selfEnabled` 决定

**使用场景**:
1. 想要统一控制 → 设置为 `GROUP` 模式
2. 想要恢复独立状态 → 设置为 `INDIVIDUAL` 模式
3. 批量启用/暂停 → 调用 `enableAllTemplates()` / `pauseAllTemplates()`

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
  
  // ===== 控制配置 ⭐️ 核心 =====
  controlMode: 'GROUP' | 'INDIVIDUAL'; // 组控制 | 个体控制
  enabled: boolean; // 组的启用状态（GROUP 模式下生效）
  status: 'ACTIVE' | 'PAUSED'; // 简化状态
  
  // ===== 排序 =====
  order: number;
  
  // ===== 统计 =====
  stats: {
    totalTemplates: number;
    activeTemplates: number; // 实际启用的模板数
    pausedTemplates: number; // 实际暂停的模板数
    selfEnabledTemplates: number; // selfEnabled = true 的模板数
    selfPausedTemplates: number; // selfEnabled = false 的模板数
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  
  // ===== 业务方法 =====
  
  // 控制模式管理 ⭐️ 核心
  switchToGroupControl(): void; // 切换到组控制模式
  switchToIndividualControl(): void; // 切换到个体控制模式
  toggleControlMode(): void; // 切换控制模式
  
  // 组状态管理
  enable(): void; // 启用组（设置 enabled = true）
  pause(): void; // 暂停组（设置 enabled = false）
  toggle(): void; // 切换组状态
  
  // 批量操作 ⭐️ 核心
  enableAllTemplates(): Promise<void>; // 启用所有模板（设置所有 template.selfEnabled = true）
  pauseAllTemplates(): Promise<void>; // 暂停所有模板（设置所有 template.selfEnabled = false）
  
  // 快捷组合操作
  enableGroupAndAllTemplates(): Promise<void>; // 启用组 + 切换到组控制
  pauseGroupAndAllTemplates(): Promise<void>; // 暂停组 + 切换到组控制
  
  // 统计
  updateStats(): Promise<void>;
  getTemplates(): Promise<ReminderTemplateServer[]>;
  getTemplatesCount(): Promise<number>;
  getActiveTemplatesCount(): Promise<number>;
  
  // 状态管理
  activate(): void;
  softDelete(): void;
  restore(): void;
  
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
  
  // ===== 控制配置 =====
  controlMode: string; // 'GROUP' | 'INDIVIDUAL'
  enabled: boolean;
  status: string;
  
  // ===== 排序 =====
  order: number;
  
  // ===== 统计 =====
  stats: {
    totalTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    selfEnabledTemplates: number;
    selfPausedTemplates: number;
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  
  // ===== UI 计算属性 =====
  displayName: string;
  controlModeText: string; // "组控制" | "个体控制"
  statusText: string;
  templateCountText: string; // "5 个提醒"
  activeStatusText: string; // "3 个活跃"
  controlDescription: string; // "所有提醒统一启用" | "提醒独立控制"
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getControlModeBadge(): { text: string; color: string; icon: string };
  getIcon(): string;
  getColorStyle(): string;
  
  // 操作判断
  canSwitchMode(): boolean;
  canEnableAll(): boolean;
  canPauseAll(): boolean;
  canEdit(): boolean;
  canDelete(): boolean;
  hasTemplates(): boolean;
  isGroupControlled(): boolean;
  
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
  
  // ===== 模板统计 =====
  templateStats: {
    totalTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    oneTimeTemplates: number;
    recurringTemplates: number;
  };
  
  // ===== 分组统计 =====
  groupStats: {
    totalGroups: number;
    activeGroups: number;
    pausedGroups: number;
    groupControlledGroups: number; // 组控制模式的分组数
    individualControlledGroups: number; // 个体控制模式的分组数
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
  templateStats: {
    totalTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    oneTimeTemplates: number;
    recurringTemplates: number;
  };
  groupStats: {
    totalGroups: number;
    activeGroups: number;
    pausedGroups: number;
    groupControlledGroups: number;
    individualControlledGroups: number;
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
  templateUuid: string;
  
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
  getTemplate(): Promise<ReminderTemplateServer>;
  
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
  templateUuid: string;
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
    weekDays: ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY')[];
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
  title?: string | null; // 自定义标题（不填则用 Template title）
  body?: string | null; // 自定义正文（不填则用 Template description）
  
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

### GroupControlConfig ⭐️ 新增
```typescript
export interface GroupControlConfig {
  mode: 'GROUP' | 'INDIVIDUAL';
  groupEnabled: boolean;
  description: string; // 控制模式的描述
}
```

---

## 仓储接口

### IReminderTemplateRepository
```typescript
export interface IReminderTemplateRepository {
  save(template: ReminderTemplateServer): Promise<void>;
  findByUuid(uuid: string): Promise<ReminderTemplateServer | null>;
  findByAccountUuid(accountUuid: string): Promise<ReminderTemplateServer[]>;
  findByGroupUuid(groupUuid: string): Promise<ReminderTemplateServer[]>;
  findActiveByAccountUuid(accountUuid: string): Promise<ReminderTemplateServer[]>;
  
  // 查询
  findByStatus(accountUuid: string, status: 'ACTIVE' | 'PAUSED'): Promise<ReminderTemplateServer[]>;
  findDueTemplates(accountUuid: string, beforeTime: number): Promise<ReminderTemplateServer[]>;
  findEffectivelyEnabled(accountUuid: string): Promise<ReminderTemplateServer[]>; // 实际启用的模板
  
  // 批量操作
  updateSelfEnabled(uuids: string[], enabled: boolean): Promise<void>;
  
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
  
  // 查询
  findByControlMode(accountUuid: string, mode: 'GROUP' | 'INDIVIDUAL'): Promise<ReminderGroupServer[]>;
  
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

### ReminderTemplateControlService ⭐️ 新增
```typescript
export interface ReminderTemplateControlService {
  // 计算实际启用状态
  calculateEffectiveEnabled(template: ReminderTemplateServer): Promise<boolean>;
  batchCalculateEffectiveEnabled(templates: ReminderTemplateServer[]): Promise<Map<string, boolean>>;
  
  // 批量状态更新
  enableTemplates(templateUuids: string[]): Promise<void>;
  pauseTemplates(templateUuids: string[]): Promise<void>;
}
```

### ReminderTriggerService
```typescript
export interface ReminderTriggerService {
  // 触发计算
  calculateNextTrigger(template: ReminderTemplateServer): number | null;
  getDueTemplates(accountUuid: string): Promise<ReminderTemplateServer[]>;
  
  // 触发执行
  triggerTemplate(template: ReminderTemplateServer): Promise<void>;
  batchTriggerTemplates(templates: ReminderTemplateServer[]): Promise<void>;
}
```

### ReminderSchedulerService
```typescript
export interface ReminderSchedulerService {
  // 调度管理
  scheduleTemplate(template: ReminderTemplateServer): Promise<void>;
  unscheduleTemplate(templateUuid: string): Promise<void>;
  rescheduleTemplate(template: ReminderTemplateServer): Promise<void>;
  
  // 批量调度
  scheduleAllForAccount(accountUuid: string): Promise<void>;
  scheduleAllForGroup(groupUuid: string): Promise<void>;
}
```

---

## 应用层服务

### ReminderService
```typescript
export interface ReminderService {
  // 模板管理
  createTemplate(template: Partial<ReminderTemplateServer>): Promise<ReminderTemplateServer>;
  updateTemplate(uuid: string, updates: Partial<ReminderTemplateServer>): Promise<ReminderTemplateServer>;
  deleteTemplate(uuid: string): Promise<void>;
  getTemplate(uuid: string): Promise<ReminderTemplateServer | null>;
  listTemplates(accountUuid: string): Promise<ReminderTemplateServer[]>;
  listActiveTemplates(accountUuid: string): Promise<ReminderTemplateServer[]>;
  
  // 模板状态 ⭐️ 核心
  enableTemplate(uuid: string): Promise<void>;
  pauseTemplate(uuid: string): Promise<void>;
  toggleTemplate(uuid: string): Promise<void>;
  
  // 分组管理
  createGroup(group: Partial<ReminderGroupServer>): Promise<ReminderGroupServer>;
  updateGroup(uuid: string, updates: Partial<ReminderGroupServer>): Promise<ReminderGroupServer>;
  deleteGroup(uuid: string): Promise<void>;
  getGroup(uuid: string): Promise<ReminderGroupServer | null>;
  listGroups(accountUuid: string): Promise<ReminderGroupServer[]>;
  
  // 组控制 ⭐️ 核心
  switchGroupToGroupControl(groupUuid: string): Promise<void>; // 切换到组控制
  switchGroupToIndividualControl(groupUuid: string): Promise<void>; // 切换到个体控制
  toggleGroupControlMode(groupUuid: string): Promise<void>; // 切换控制模式
  
  // 组状态
  enableGroup(groupUuid: string): Promise<void>; // 启用组
  pauseGroup(groupUuid: string): Promise<void>; // 暂停组
  toggleGroup(groupUuid: string): Promise<void>; // 切换组状态
  
  // 批量操作 ⭐️ 核心
  enableAllTemplatesInGroup(groupUuid: string): Promise<void>; // 启用组内所有模板
  pauseAllTemplatesInGroup(groupUuid: string): Promise<void>; // 暂停组内所有模板
  
  // 快捷操作
  enableGroupAndAllTemplates(groupUuid: string): Promise<void>; // 启用组 + 切换到组控制
  pauseGroupAndAllTemplates(groupUuid: string): Promise<void>; // 暂停组 + 切换到组控制
  
  // 触发管理
  triggerTemplate(uuid: string): Promise<void>; // 手动触发
  getDueTemplates(accountUuid: string): Promise<ReminderTemplateServer[]>;
  
  // 统计
  getStatistics(accountUuid: string): Promise<ReminderStatisticsServer>;
  getHistory(uuid: string, limit?: number): Promise<ReminderHistoryServer[]>;
}
```

---

## 使用场景示例

### 场景 1: 组控制模式 - 统一管理

```typescript
// 创建分组
const group = await reminderService.createGroup({
  name: '健康提醒',
  controlMode: 'GROUP', // 组控制模式
  enabled: true, // 组启用
});

// 添加模板到分组
const template1 = await reminderService.createTemplate({
  title: '喝水提醒',
  groupUuid: group.uuid,
  selfEnabled: false, // 自身状态为暂停
  // ... 其他配置
});

// 此时 template1 实际启用状态 = group.enabled = true（受组控制）

// 暂停整个分组
await reminderService.pauseGroup(group.uuid);
// 现在组内所有模板都被暂停
```

### 场景 2: 个体控制模式 - 独立管理

```typescript
// 切换到个体控制模式
await reminderService.switchGroupToIndividualControl(group.uuid);

// 现在每个模板根据自己的 selfEnabled 决定是否启用
// template1.selfEnabled = false → 暂停
// template2.selfEnabled = true → 启用
```

### 场景 3: 灵活切换控制模式

```typescript
// 初始状态：个体控制，一半启用，一半暂停
const group = await reminderService.getGroup(groupUuid);
// controlMode = 'INDIVIDUAL'
// template1.selfEnabled = true (启用)
// template2.selfEnabled = false (暂停)

// 想要统一控制 → 切换到组控制
await reminderService.switchGroupToGroupControl(groupUuid);
await reminderService.enableGroup(groupUuid);
// 现在所有模板都启用（template1 和 template2 都启用）

// 想要恢复独立状态 → 切换回个体控制
await reminderService.switchGroupToIndividualControl(groupUuid);
// template1 恢复为启用（selfEnabled = true）
// template2 恢复为暂停（selfEnabled = false）
```

### 场景 4: 一键批量操作

```typescript
// 一键启用组内所有模板
await reminderService.enableAllTemplatesInGroup(groupUuid);
// 设置所有 template.selfEnabled = true

// 一键暂停组内所有模板
await reminderService.pauseAllTemplatesInGroup(groupUuid);
// 设置所有 template.selfEnabled = false

// 快捷操作：启用组并切换到组控制
await reminderService.enableGroupAndAllTemplates(groupUuid);
// 1. 设置 group.controlMode = 'GROUP'
// 2. 设置 group.enabled = true
// 结果：所有模板立即启用
```

---

## 总结

### V2.1 核心改进 ⭐️

#### 1. 灵活的启用状态控制
```typescript
// 控制逻辑
effectiveEnabled = group.controlMode === 'GROUP' 
  ? group.enabled 
  : template.selfEnabled;
```

#### 2. 两种控制模式
- **GROUP**: 组统一控制 → 所有模板启用状态相同
- **INDIVIDUAL**: 个体独立控制 → 每个模板独立决定

#### 3. 批量操作支持
- `enableAllTemplatesInGroup()`: 设置所有 `selfEnabled = true`
- `pauseAllTemplatesInGroup()`: 设置所有 `selfEnabled = false`
- `switchGroupToGroupControl()`: 切换到组控制
- `switchGroupToIndividualControl()`: 切换到个体控制

#### 4. 状态简化
- Template: `ACTIVE` | `PAUSED`
- Group: `ACTIVE` | `PAUSED`

#### 5. 优先级改为重要性
- 使用 `ImportanceLevel` from `@dailyuse/contracts/shared`

### 聚合根
- **ReminderTemplate**: 提醒模板（定义触发规则）
- **ReminderGroup**: 提醒分组（批量管理，控制模式）
- **ReminderStatistics**: 提醒统计（数据分析）

### 实体
- **ReminderHistory**: 提醒触发历史

### 值对象
- **RecurrenceConfig**: 重复配置
- **NotificationConfig**: 通知配置
- **GroupControlConfig**: 组控制配置 ⭐️ 新增

### 领域服务
- **ReminderTemplateControlService**: 模板控制服务 ⭐️ 新增
- **ReminderTriggerService**: 触发计算和执行
- **ReminderSchedulerService**: 提醒调度管理

### 关键设计原则
1. **灵活控制**: 支持组控制和个体控制两种模式
2. **状态透明**: `effectiveEnabled` 清晰表达实际启用状态
3. **批量操作**: 支持一键批量启用/暂停
4. **模式切换**: 可在组控制和个体控制间自由切换
5. **状态保留**: 切换模式时保留每个模板的 `selfEnabled` 状态
6. **简化状态**: 只有 ACTIVE 和 PAUSED 两种状态
