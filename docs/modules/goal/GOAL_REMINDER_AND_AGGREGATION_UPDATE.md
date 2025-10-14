# Goal Module Contracts - 提醒配置与 KeyResult 计算方式优化

## 更新日期
2025-10-14

## 概述

本次更新为 Goal 模块的 Contracts 层添加了以下重要功能：

1. **提醒配置值对象（GoalReminderConfig）**
2. **KeyResult 多种聚合计算方式（AggregationMethod）**

---

## 1. 新增枚举

### 1.1 AggregationMethod（聚合计算方式）

```typescript
export enum AggregationMethod {
  SUM = 'SUM',           // 求和（默认，适合累计型）
  AVERAGE = 'AVERAGE',   // 求平均（适合平均值型）
  MAX = 'MAX',           // 求最大值（适合峰值型）
  MIN = 'MIN',           // 求最小值（适合低值型）
  LAST = 'LAST',         // 取最后一次（适合绝对值型）
}
```

**使用场景**：

- **SUM（求和）**：适合累计型指标
  - 示例：阅读书籍数量、跑步里程数
  - 计算：所有记录值相加
  
- **AVERAGE（求平均）**：适合平均值型指标
  - 示例：每日睡眠时长、学习效率评分
  - 计算：所有记录值的平均数
  
- **MAX（求最大值）**：适合峰值型指标
  - 示例：单次举重最大重量、最佳考试成绩
  - 计算：所有记录值中的最大值
  
- **MIN（求最小值）**：适合低值型指标
  - 示例：最短完成时间、最低体脂率
  - 计算：所有记录值中的最小值
  
- **LAST（取最后一次）**：适合绝对值型指标
  - 示例：当前体重、账户余额
  - 计算：取最新的记录值

### 1.2 ReminderTriggerType（提醒触发类型）

```typescript
export enum ReminderTriggerType {
  TIME_PROGRESS_PERCENTAGE = 'TIME_PROGRESS_PERCENTAGE', // 时间进度百分比
  REMAINING_DAYS = 'REMAINING_DAYS',                     // 剩余天数
}
```

---

## 2. 提醒配置值对象（GoalReminderConfig）

### 2.1 核心类型

```typescript
// 单个提醒触发器
export interface ReminderTrigger {
  type: ReminderTriggerType;
  value: number;      // 百分比（50 = 50%）或天数（100 = 100天）
  enabled: boolean;   // 是否启用
}
```

### 2.2 Server 接口

```typescript
export interface IGoalReminderConfigServer {
  enabled: boolean;           // 总开关
  triggers: ReminderTrigger[]; // 触发器列表

  // 业务方法
  addTrigger(trigger: ReminderTrigger): IGoalReminderConfigServer;
  removeTrigger(type: ReminderTriggerType, value: number): IGoalReminderConfigServer;
  updateTrigger(type, value, updates): IGoalReminderConfigServer;
  getTriggersByType(type: ReminderTriggerType): ReminderTrigger[];
  hasActiveTriggers(): boolean;
  getActiveTriggers(): ReminderTrigger[];
  enable(): IGoalReminderConfigServer;
  disable(): IGoalReminderConfigServer;
}
```

### 2.3 Client 接口（UI 辅助）

```typescript
export interface IGoalReminderConfigClient {
  enabled: boolean;
  triggers: ReminderTrigger[];

  // UI 辅助属性
  statusText: string;              // "已启用 3 个提醒" / "未启用"
  progressTriggerCount: number;     // 时间进度触发器数量
  remainingDaysTriggerCount: number; // 剩余天数触发器数量
  activeTriggerCount: number;       // 启用的触发器数量
  triggerSummary: string;          // "进度 50%, 20%; 剩余 100天, 50天"

  // UI 辅助方法
  getProgressTriggers(): ReminderTrigger[];
  getRemainingDaysTriggers(): ReminderTrigger[];
  getTriggerDisplayText(trigger: ReminderTrigger): string;
}
```

### 2.4 使用示例

```typescript
// 创建提醒配置
const reminderConfig: GoalReminderConfigServerDTO = {
  enabled: true,
  triggers: [
    { type: 'TIME_PROGRESS_PERCENTAGE', value: 50, enabled: true },  // 时间进度 50%
    { type: 'TIME_PROGRESS_PERCENTAGE', value: 20, enabled: true },  // 时间进度 20%
    { type: 'REMAINING_DAYS', value: 100, enabled: true },          // 剩余 100 天
    { type: 'REMAINING_DAYS', value: 50, enabled: true },           // 剩余 50 天
    { type: 'REMAINING_DAYS', value: 7, enabled: false },           // 剩余 7 天（禁用）
  ]
};

// 添加到目标
goal.updateReminderConfig(reminderConfig);
```

---

## 3. KeyResult 计算方式优化

### 3.1 KeyResultProgress 更新

```typescript
export interface KeyResultProgressServerDTO {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;  // 新增：聚合计算方式
  targetValue: number;
  currentValue: number;
  unit?: string | null;
}
```

### 3.2 新增业务方法

```typescript
export interface IKeyResultProgressServer {
  // 新增方法
  recalculateFromRecords(recordValues: number[]): number;
}

export interface KeyResultServer {
  // 新增方法
  recalculateProgress(): void;        // 根据聚合方式重新计算进度
  getRecordValues(): number[];        // 获取所有记录的值
}
```

### 3.3 UI 增强

```typescript
export interface KeyResultClientDTO {
  // 新增 UI 字段
  aggregationMethodText: string;      // "求和" / "求平均" / "求最大值" / "求最小值" / "取最后一次"
  calculationExplanation: string;     // "当前进度由 5 条记录求和计算得出"
}

export interface KeyResultClient {
  // 新增 UI 方法
  getAggregationMethodBadge(): string; // "SUM" / "AVG" / "MAX" / "MIN" / "LAST"
}
```

### 3.4 使用示例

```typescript
// 示例 1: 累计型指标（跑步里程）
const runningKR: KeyResultServerDTO = {
  uuid: 'kr-1',
  goalUuid: 'goal-1',
  title: '跑步 500 公里',
  progress: {
    valueType: 'INCREMENTAL',
    aggregationMethod: 'SUM',      // 求和
    targetValue: 500,
    currentValue: 150,
    unit: '公里'
  },
  // ... 其他字段
};

// 记录：[10, 5, 8, 12, 15, ...]
// 计算：10 + 5 + 8 + 12 + 15 + ... = 150 公里

// 示例 2: 平均值型指标（每日学习时长）
const studyKR: KeyResultServerDTO = {
  title: '每日平均学习 2 小时',
  progress: {
    valueType: 'ABSOLUTE',
    aggregationMethod: 'AVERAGE',  // 求平均
    targetValue: 2,
    currentValue: 1.8,
    unit: '小时'
  },
};

// 记录：[2.5, 1.5, 2.0, 1.8, 1.5, ...]
// 计算：(2.5 + 1.5 + 2.0 + 1.8 + 1.5 + ...) / 5 = 1.8 小时

// 示例 3: 峰值型指标（举重最大重量）
const liftingKR: KeyResultServerDTO = {
  title: '卧推最大重量 100 公斤',
  progress: {
    valueType: 'ABSOLUTE',
    aggregationMethod: 'MAX',      // 求最大值
    targetValue: 100,
    currentValue: 85,
    unit: '公斤'
  },
};

// 记录：[70, 75, 80, 85, 82, 83, ...]
// 计算：max(70, 75, 80, 85, 82, 83, ...) = 85 公斤

// 示例 4: 绝对值型指标（当前体重）
const weightKR: KeyResultServerDTO = {
  title: '体重降至 70 公斤',
  progress: {
    valueType: 'ABSOLUTE',
    aggregationMethod: 'LAST',     // 取最后一次
    targetValue: 70,
    currentValue: 75,
    unit: '公斤'
  },
};

// 记录：[80, 79, 78, 76, 75, ...]
// 计算：last([80, 79, 78, 76, 75, ...]) = 75 公斤
```

---

## 4. Goal 聚合根集成

### 4.1 GoalServerDTO 更新

```typescript
export interface GoalServerDTO {
  // ... 其他字段
  reminderConfig?: GoalReminderConfigServerDTO | null;  // 新增
}

export interface GoalPersistenceDTO {
  // ... 其他字段
  reminder_config?: string | null;  // JSON string
}
```

### 4.2 新增业务方法

```typescript
export interface GoalServer {
  // 提醒配置管理
  updateReminderConfig(config: GoalReminderConfigServerDTO): void;
  enableReminder(): void;
  disableReminder(): void;
  addReminderTrigger(trigger: { type: string; value: number }): void;
  removeReminderTrigger(type: string, value: number): void;
}
```

### 4.3 Client UI 增强

```typescript
export interface GoalClientDTO {
  // 新增 UI 字段
  hasActiveReminders: boolean;    // 是否有启用的提醒
  reminderSummary?: string | null; // 提醒摘要
}

export interface GoalClient {
  // 新增 UI 方法
  getReminderStatusText(): string;      // "已启用 3 个提醒"
  getReminderIcon(): string;            // 提醒图标
  shouldShowReminderBadge(): boolean;   // 是否显示提醒徽章
}
```

---

## 5. 数据库字段映射

### 5.1 goals 表新增字段

```sql
ALTER TABLE goals ADD COLUMN reminder_config TEXT NULL;  -- JSON string
```

### 5.2 key_results 表更新

```sql
-- progress 字段的 JSON 结构更新，新增 aggregation_method
-- 示例：
-- {
--   "value_type": "INCREMENTAL",
--   "aggregation_method": "SUM",
--   "target_value": 500,
--   "current_value": 150,
--   "unit": "公里"
-- }
```

---

## 6. 与 Schedule 模块集成

提醒配置**只存储配置信息**，实际的提醒调度由 **Schedule 模块** 负责：

1. **Goal 模块**：存储提醒配置（何时提醒、提醒什么）
2. **Schedule 模块**：根据配置创建定时任务
3. **Notification 模块**：实际发送提醒通知

### 集成流程

```typescript
// 1. Goal 更新提醒配置
goal.updateReminderConfig({
  enabled: true,
  triggers: [
    { type: 'TIME_PROGRESS_PERCENTAGE', value: 50, enabled: true },
    { type: 'REMAINING_DAYS', value: 100, enabled: true },
  ]
});

// 2. Schedule 模块监听 Goal 事件，创建/更新定时任务
scheduleService.onGoalReminderConfigUpdated((goalUuid, config) => {
  // 删除旧的定时任务
  scheduleService.cancelGoalReminders(goalUuid);
  
  // 根据新配置创建定时任务
  if (config.enabled) {
    config.triggers
      .filter(t => t.enabled)
      .forEach(trigger => {
        const cronExpression = calculateCronExpression(goal, trigger);
        scheduleService.createTask({
          type: 'GOAL_REMINDER',
          targetId: goalUuid,
          cronExpression,
          metadata: { trigger }
        });
      });
  }
});

// 3. 定时任务触发时，发送通知
scheduleService.onTaskTriggered((task) => {
  if (task.type === 'GOAL_REMINDER') {
    notificationService.send({
      type: 'GOAL_REMINDER',
      targetId: task.targetId,
      message: generateReminderMessage(task.metadata.trigger)
    });
  }
});
```

---

## 7. 前端 UI 展示示例

### 7.1 KeyResult 计算方式徽章

```tsx
<KeyResultCard keyResult={kr}>
  <div className="aggregation-badge">
    {kr.getAggregationMethodBadge()} {/* "SUM" / "AVG" / "MAX" / "MIN" / "LAST" */}
  </div>
  <div className="calculation-explanation">
    {kr.calculationExplanation} {/* "当前进度由 5 条记录求和计算得出" */}
  </div>
</KeyResultCard>
```

### 7.2 提醒配置界面

```tsx
<ReminderConfigPanel goal={goal}>
  <Switch checked={reminderConfig.enabled} onChange={handleToggle} />
  
  <div className="triggers">
    <h4>时间进度提醒</h4>
    {reminderConfig.getProgressTriggers().map(trigger => (
      <TriggerItem key={`${trigger.type}-${trigger.value}`}>
        时间进度达到 {trigger.value}% 时提醒
        <Switch checked={trigger.enabled} />
      </TriggerItem>
    ))}
    
    <h4>剩余天数提醒</h4>
    {reminderConfig.getRemainingDaysTriggers().map(trigger => (
      <TriggerItem key={`${trigger.type}-${trigger.value}`}>
        还剩 {trigger.value} 天时提醒
        <Switch checked={trigger.enabled} />
      </TriggerItem>
    ))}
  </div>
  
  <div className="summary">
    {reminderConfig.triggerSummary} {/* "进度 50%, 20%; 剩余 100天, 50天" */}
  </div>
</ReminderConfigPanel>
```

### 7.3 目标卡片提醒徽章

```tsx
<GoalCard goal={goal}>
  {goal.shouldShowReminderBadge() && (
    <Badge icon={goal.getReminderIcon()}>
      {goal.getReminderStatusText()} {/* "已启用 3 个提醒" */}
    </Badge>
  )}
</GoalCard>
```

---

## 8. 后续实现清单

### 8.1 Domain-Server 层

- [ ] 实现 `GoalReminderConfig` 值对象类
- [ ] 更新 `KeyResultProgress` 值对象，实现 `recalculateFromRecords()` 方法
- [ ] 更新 `KeyResult` 实体，实现 `recalculateProgress()` 方法
- [ ] 更新 `Goal` 聚合根，实现提醒配置管理方法

### 8.2 Repository 层

- [ ] 更新数据库迁移脚本（添加 `reminder_config` 字段）
- [ ] 更新 Repository 实现，处理新增字段

### 8.3 Application 层

- [ ] 实现 `UpdateGoalReminderConfigUseCase`
- [ ] 实现 `RecalculateKeyResultProgressUseCase`

### 8.4 API 层

- [ ] 添加 `PUT /goals/:id/reminder-config` 端点
- [ ] 添加 `POST /goals/:id/key-results/:id/recalculate` 端点

### 8.5 Schedule 集成

- [ ] 实现 Goal 提醒配置变更监听器
- [ ] 实现定时任务创建/更新逻辑
- [ ] 实现提醒触发时的通知发送

---

## 9. 总结

本次更新为 Goal 模块添加了两个重要功能：

1. **提醒配置**：支持多种提醒触发条件（时间进度百分比、剩余天数），提供灵活的提醒机制
2. **多种计算方式**：KeyResult 支持 5 种聚合计算方式（求和、求平均、求最大、求最小、取最后一次），适应不同的业务场景

这些功能的设计遵循以下原则：

- ✅ **DDD 架构**：值对象、实体、聚合根职责清晰
- ✅ **Server/Client 分离**：业务逻辑与 UI 逻辑完全分离
- ✅ **可扩展性**：易于添加新的计算方式或提醒类型
- ✅ **模块解耦**：提醒配置只存储配置，实际调度交给 Schedule 模块
- ✅ **类型安全**：完整的 TypeScript 类型定义

**Contracts 层已经完整定义了所有接口和 DTO，可以开始实现 Domain 层了！** 🎉
