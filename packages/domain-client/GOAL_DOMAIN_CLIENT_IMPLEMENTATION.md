# Goal 模块 Domain-Client 实现总结

## 实现概览

Goal 模块的客户端领域层（domain-client）已完全实现，遵循 DDD（领域驱动设计）架构模式和 Repository 模块的实现规范。

## 文件结构

```
packages/domain-client/src/goal/
├── value-objects/          # 值对象层
│   ├── GoalMetadataClient.ts
│   ├── GoalTimeRangeClient.ts
│   ├── KeyResultProgressClient.ts
│   ├── KeyResultSnapshotClient.ts
│   ├── GoalReminderConfigClient.ts
│   └── index.ts
├── entities/               # 实体层
│   ├── GoalRecordClient.ts
│   ├── GoalReviewClient.ts
│   ├── KeyResultClient.ts
│   └── index.ts
├── aggregates/             # 聚合根层
│   ├── GoalClient.ts
│   └── index.ts
└── index.ts                # 模块导出
```

## 实现详情

### 1. 值对象 (Value Objects) - 5个

#### GoalMetadataClient (155行)

- **功能**: 管理目标的元数据（重要性、紧急性、分类、标签）
- **UI属性**:
  - `importanceText`: "不重要" / "一般" / "重要" / "非常重要"
  - `urgencyText`: 类似的文本映射
  - `priorityLevel`: HIGH / MEDIUM / LOW (根据重要性+紧急性计算)
  - `priorityBadgeColor`: 优先级对应的颜色代码
  - `categoryDisplay`: 带默认值"未分类"
  - `tagsDisplay`: 标签的显示文本或"无标签"
- **方法**: `hasTag()`, `equals()`, `toServerDTO()`, `toClientDTO()`

#### GoalTimeRangeClient (188行)

- **功能**: 管理目标的时间范围和进度
- **UI属性**:
  - `dateRangeText`: "2025-01-01 至 2025-12-31" 或 "未设置时间"
  - `durationText`: "持续 X 天"
  - `remainingText`: "剩余 X 天" / "已逾期 X 天"
  - `isOverdue`: 是否逾期
  - `progressPercentage`: 0-100 的时间进度
- **辅助方法**: `getDurationDays()`, `getRemainingDays()`, `formatDate()`

#### KeyResultProgressClient (178行)

- **功能**: 跟踪关键结果的进度，支持多种聚合方法
- **新特性**: 支持 5 种聚合方法
  - `SUM`: 求和（累计型，默认）
  - `AVERAGE`: 求平均（平均值型）
  - `MAX`: 求最大值（峰值型）
  - `MIN`: 求最小值（低值型）
  - `LAST`: 取最后一次（绝对值型）
- **UI属性**:
  - `progressPercentage`: 计算的进度百分比
  - `progressText`: 格式化的进度文本（根据值类型）
  - `progressBarColor`: 进度条颜色（绿/蓝/琥珀/红）
  - `aggregationMethodText`: "求和" / "求平均" / "求最大值" / "求最小值" / "取最后一次"

#### KeyResultSnapshotClient (143行)

- **功能**: 关键结果快照（用于复盘记录）
- **UI属性**:
  - `progressText`: "50/100 (50%)"
  - `progressBarColor`: 颜色代码
  - `displayTitle`: 截断的标题（最多30字符）

#### GoalReminderConfigClient (144行)

- **功能**: 管理目标提醒配置
- **特性**: 支持两种触发器类型
  - `TIME_PROGRESS_PERCENTAGE`: 时间进度百分比（如 50%、20%）
  - `REMAINING_DAYS`: 剩余天数（如 100天、50天）
- **UI属性**:
  - `statusText`: "未启用" / "已启用 X 个提醒"
  - `triggerSummary`: "进度 50%, 20%; 剩余 100天, 50天"
  - `progressTriggerCount`: 进度触发器数量
  - `remainingDaysTriggerCount`: 天数触发器数量
  - `activeTriggerCount`: 启用的触发器总数
- **方法**: `hasActiveTriggers()`, `getProgressTriggers()`, `getRemainingDaysTriggers()`

### 2. 实体 (Entities) - 3个

#### KeyResultClient (258行)

- **功能**: 关键结果实体，包含进度追踪
- **关联**: 包含 `KeyResultProgressClient` 值对象
- **UI属性**:
  - `progressPercentage`, `progressText`, `progressColor`, `isCompleted`
  - `formattedCreatedAt`, `formattedUpdatedAt`
  - `displayTitle`: 截断的标题
  - `aggregationMethodText`: 聚合方法文本
  - `calculationExplanation`: "当前进度由 5 条记录求和计算得出"
- **方法**:
  - `getProgressBadge()`: "✓ 已完成" / "→ 进行中" / "⚡ 需努力" / "! 待启动"
  - `getProgressIcon()`: 对应的图标
  - `getAggregationMethodBadge()`: "SUM" / "AVG" / "MAX" / "MIN" / "LAST"
  - `hasDescription()`, `getRecordCount()`, `hasRecords()`
- **工厂方法**: `fromClientDTO()`, `fromServerDTO()`, `forCreate()`, `clone()`

#### GoalRecordClient (209行)

- **功能**: 目标记录实体，追踪数值变化
- **UI属性**:
  - `changePercentage`: 变化百分比
  - `isPositiveChange`: 是否正向变化
  - `changeText`: "+5" / "-3" / "0"
  - `changeIcon`: "↑" / "↓" / "→"
  - `changeColor`: "green" / "red" / "gray"
  - `formattedRecordedAt`, `formattedCreatedAt`
- **方法**:
  - `getDisplayText()`: "50 → 55 (+5)"
  - `getSummary()`: 包含备注预览的摘要
  - `hasNote()`: 是否有备注

#### GoalReviewClient (262行)

- **功能**: 目标复盘实体
- **关联**: 包含 `KeyResultSnapshotClient[]` 快照列表
- **UI属性**:
  - `typeText`: "周复盘" / "月复盘" / "季度复盘" / "年度复盘" / "临时复盘"
  - `ratingText`: "优秀" / "良好" / "一般" / "待改进" / "不满意"
  - `ratingStars`: "★★★★★☆☆☆☆☆" (10分制星星显示)
  - `displaySummary`: 截断的摘要（最多100字符）
- **方法**:
  - `getRatingColor()`: 评分对应的颜色
  - `getRatingIcon()`: 评分对应的表情 😊 / 🙂 / 😐 / 😢
  - `hasAchievements()`, `hasChallenges()`, `hasImprovements()`
  - `getSnapshotCount()`: 快照数量

### 3. 聚合根 (Aggregates) - 1个

#### GoalClient (632行)

- **功能**: 目标聚合根，统一管理目标及其子实体
- **值对象**: 使用 `GoalMetadataClient`, `GoalTimeRangeClient`, `GoalReminderConfigClient`
- **子实体集合**:
  - `keyResults: KeyResultClient[]`
  - `reviews: GoalReviewClient[]`

##### UI计算属性

- `overallProgress`: 所有关键结果的平均进度
- `isDeleted`, `isCompleted`, `isArchived`, `isOverdue`
- `daysRemaining`: 剩余天数（null 如果已完成或无截止日期）
- `statusText`: 状态文本
- `importanceText`, `urgencyText`: 重要性和紧急性文本
- `priorityScore`: 优先级分数（重要性+紧急性）
- `keyResultCount`, `completedKeyResultCount`: 关键结果统计
- `reviewCount`: 复盘数量
- `hasActiveReminders`: 是否有启用的提醒
- `reminderSummary`: 提醒摘要文本

##### 子实体工厂方法

- `createKeyResult()`: 创建关键结果
- `createReview()`: 创建复盘记录

##### 子实体管理方法

- `addKeyResult()`, `removeKeyResult()`, `updateKeyResult()`
- `reorderKeyResults()`: 重新排序
- `getKeyResult()`, `getAllKeyResults()`
- `addReview()`, `removeReview()`
- `getReviews()`, `getLatestReview()`

##### UI业务方法

- `getDisplayTitle()`: 显示标题
- `getStatusBadge()`: { text, color }
- `getPriorityBadge()`: { text, color }
- `getProgressText()`: "3/5 (60%)"
- `getDateRangeText()`: 日期范围文本
- `getReminderStatusText()`: 提醒状态
- `getReminderIcon()`: 🔔 / 🔕
- `shouldShowReminderBadge()`: 是否显示提醒徽章

##### 操作判断方法

- `canActivate()`: 是否可以激活（从草稿状态）
- `canComplete()`: 是否可以完成（进行中状态）
- `canArchive()`: 是否可以归档（已完成状态）
- `canDelete()`: 是否可以删除
- `canAddKeyResult()`: 是否可以添加关键结果
- `canAddReview()`: 是否可以添加复盘

##### 静态工厂方法

- `create()`: 创建新目标
- `forCreate()`: 创建用于表单的空目标
- `fromServerDTO()`: 从服务端 DTO 创建
- `fromClientDTO()`: 从客户端 DTO 创建
- `clone()`: 克隆实例（用于编辑表单）

## 架构特点

### 1. DDD 分层架构

- **值对象 (Value Objects)**: 不可变的业务概念，通过值相等性判断
- **实体 (Entities)**: 有唯一标识的业务对象
- **聚合根 (Aggregate Root)**: 管理子实体的根实体

### 2. 实现模式

- 所有类都继承自 `@dailyuse/utils` 的基类 (`ValueObject`, `Entity`, `AggregateRoot`)
- 私有字段 + 公共 getter 实现封装
- 私有构造函数 + 静态工厂方法的创建模式
- 完整的 DTO 转换方法 (`toServerDTO()`, `toClientDTO()`)
- 双向工厂方法 (`fromServerDTO()`, `fromClientDTO()`)

### 3. UI 导向设计

- 每个类都提供丰富的 UI 辅助属性
- 格式化的日期、时间、进度文本
- 颜色代码和图标建议
- 徽章和状态文本
- 计算属性（进度、统计、判断）

### 4. 类型安全

- 使用 `@dailyuse/contracts` 的接口定义确保类型一致性
- 导入 contracts 的枚举类型 (通过 `GoalContracts as GC`)
- 完整的 TypeScript 类型支持

## 新特性亮点

### 1. 聚合方法支持

关键结果支持 5 种不同的聚合计算方式，适应不同的业务场景：

- **累计型**（求和）: 如跑步里程数累加
- **平均型**（求平均）: 如每日锻炼时长平均
- **峰值型**（求最大）: 如最高销售额记录
- **低值型**（求最小）: 如最短响应时间
- **绝对值型**（取最后）: 如当前体重、账户余额

### 2. 智能提醒系统

支持两种提醒触发器，可以组合使用：

- **时间进度提醒**: 在时间过去 50%、20% 时提醒
- **剩余天数提醒**: 在剩余 100天、50天 时提醒
- 每个触发器可以单独启用/禁用
- 生成友好的提醒摘要文本

### 3. 完整的复盘功能

- 支持多种复盘类型（周/月/季/年/临时）
- 10分制评分系统（带星星显示）
- 记录成就、挑战、改进点
- 快照关键结果当前状态

## 使用示例

```typescript
import { GoalClient, KeyResultClient, GoalReviewClient } from '@dailyuse/domain-client';

// 创建新目标
const goal = GoalClient.create({
  accountUuid: 'user-123',
  title: '2025年健康目标',
  importance: GC.ImportanceLevel.HIGH,
  urgency: GC.UrgencyLevel.MEDIUM,
  startDate: Date.now(),
  targetDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
});

// 添加关键结果
const keyResult = KeyResultClient.forCreate(goal.uuid);
goal.addKeyResult(keyResult);

// 添加复盘
const review = GoalReviewClient.forCreate(goal.uuid);
goal.addReview(review);

// 获取 UI 数据
console.log(goal.getProgressText()); // "0/1 (0%)"
console.log(goal.getPriorityBadge()); // { text: '中优先级', color: 'amber' }
console.log(goal.getReminderIcon()); // 🔕

// 转换为 DTO
const dto = goal.toClientDTO(true); // 包含子实体
```

## 测试建议

1. **值对象测试**
   - 验证 equals() 方法
   - 验证 UI 属性计算正确性
   - 验证 DTO 转换的双向一致性

2. **实体测试**
   - 验证工厂方法创建
   - 验证业务方法逻辑
   - 验证子实体关联

3. **聚合根测试**
   - 验证子实体管理方法
   - 验证计算属性的准确性
   - 验证操作判断方法
   - 验证递归的 DTO 转换

## 总结

Goal 模块的 domain-client 实现完全遵循了 DDD 设计模式和项目架构规范，提供了：

- ✅ 5个值对象（元数据、时间范围、进度、快照、提醒配置）
- ✅ 3个实体（关键结果、目标记录、复盘）
- ✅ 1个聚合根（目标）
- ✅ 完整的类型安全
- ✅ 丰富的 UI 辅助功能
- ✅ 新特性支持（聚合方法、智能提醒）
- ✅ 清晰的模块导出结构

实现代码量: **约 2,000+ 行**
编译状态: **✅ 无错误**
架构一致性: **✅ 完全符合 Repository 模块规范**
