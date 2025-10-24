# Feature Spec: 智能提醒频率调整

> **功能编号**: REMINDER-001  
> **RICE 评分**: 392 (Reach: 7, Impact: 7, Confidence: 8, Effort: 1)  
> **优先级**: P0  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

提醒功能是效能工具的核心，但当前存在以下问题：

- ❌ 提醒频率固定，无法适应用户的实际需求变化
- ❌ 用户频繁忽略提醒时，系统仍按原频率发送（造成打扰）
- ❌ 重要提醒淹没在大量无关提醒中，用户错过关键信息
- ❌ 没有学习用户的响应模式，无法自动优化提醒策略

### 目标用户

- **主要用户**: 高频提醒使用者（每天 10+ 提醒）
- **次要用户**: 对提醒打扰敏感的用户
- **典型画像**: 希望提醒"恰到好处"——既不遗漏重要事项，也不过度打扰

### 价值主张

**一句话价值**: 根据用户行为自适应调整提醒频率，实现"恰到好处"的提醒体验

**核心收益**:

- ✅ 自动识别用户对提醒的响应模式（点击率、忽略率、延迟时间）
- ✅ 智能降低频繁被忽略提醒的发送频率
- ✅ 提升重要提醒的触达率和响应率
- ✅ 减少提醒疲劳，改善用户体验

---

## 2. 用户价值与场景

### 核心场景 1: 自动检测提醒响应模式

**场景描述**:  
系统自动分析用户对某类提醒的响应行为，识别提醒效果。

**用户故事**:

```gherkin
As a 提醒使用者
I want 系统自动分析我对提醒的响应情况
So that 系统可以了解哪些提醒对我有效，哪些无效
```

**操作流程**:

1. 系统每天凌晨执行提醒效果分析任务
2. 统计过去 7 天每个提醒的：
   - **点击率**: 点击次数 / 发送次数
   - **忽略率**: 忽略次数 / 发送次数
   - **平均响应时间**: 从发送到点击的平均时长
   - **延迟次数**: 点击"稍后提醒"的次数
3. 根据响应模式分类提醒：
   - 🟢 **高效提醒**: 点击率 > 70%
   - 🟡 **中效提醒**: 点击率 30%-70%
   - 🔴 **低效提醒**: 点击率 < 30%
4. 生成提醒效果报告

**预期结果**:

- Reminder 表新增字段：
  ```typescript
  readonly responseMetrics?: {
    clickRate: number;         // 点击率 (0-100)
    ignoreRate: number;        // 忽略率 (0-100)
    avgResponseTime: number;   // 平均响应时间（秒）
    snoozeCount: number;       // 延迟次数
    effectivenessScore: number; // 效果评分 (0-100)
    lastAnalysisTime: number;  // 最后分析时间
  }
  ```
- 效果评分算法：

  ```typescript
  effectivenessScore = (clickRate × 0.5) +
                       ((100 - ignoreRate) × 0.3) +
                       (responsiveness × 0.2)

  where responsiveness = min(100, (60 / avgResponseTime) × 100)
  ```

---

### 核心场景 2: 自动调整提醒频率

**场景描述**:  
系统根据提醒效果自动调整发送频率。

**用户故事**:

```gherkin
As a 提醒使用者
I want 系统自动降低我频繁忽略的提醒的发送频率
So that 我不会被无效提醒打扰
```

**操作流程**:

1. 系统检测到某个提醒（如"每天 10:00 喝水提醒"）的效果评分 < 30
2. 用户在过去 7 天内忽略了该提醒 5 次
3. 系统自动触发频率调整：
   - **当前频率**: 每天 1 次
   - **调整建议**: 每 2 天 1 次
4. 发送通知给用户："检测到您经常忽略'喝水提醒'，已自动调整为每 2 天提醒一次。如不需要，可关闭或自定义频率。"
5. 用户可选择：
   - ✅ 接受调整
   - ❌ 保持原频率
   - 🗑️ 直接关闭提醒

**预期结果**:

- Reminder 表新增 `frequencyAdjustment` 字段：
  ```typescript
  readonly frequencyAdjustment?: {
    originalInterval: number;     // 原始间隔（秒）
    adjustedInterval: number;     // 调整后间隔（秒）
    adjustmentReason: string;     // 调整原因
    adjustmentTime: number;       // 调整时间
    isAutoAdjusted: boolean;      // 是否自动调整
    userConfirmed: boolean;       // 用户是否确认
  }
  ```
- 频率调整规则：
  | 效果评分 | 忽略率 | 频率调整策略 |
  |---------|-------|-------------|
  | < 20 | > 80% | 间隔 ×3（或建议关闭） |
  | 20-40 | 60-80% | 间隔 ×2 |
  | 40-60 | 30-60% | 保持不变 |
  | > 60 | < 30% | 保持或略微增加频率 |

---

### 核心场景 3: 用户查看提醒效果仪表盘

**场景描述**:  
用户查看所有提醒的效果分析，了解哪些提醒有效、哪些无效。

**用户故事**:

```gherkin
As a 提醒使用者
I want 查看提醒效果仪表盘
So that 我可以了解哪些提醒对我有帮助，手动调整策略
```

**操作流程**:

1. 用户打开"提醒设置"页面
2. 点击"提醒效果分析"标签
3. 系统展示仪表盘：

   ```
   提醒效果分析（过去 30 天）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 整体统计
   - 总提醒数: 150 次
   - 平均点击率: 65%
   - 平均响应时间: 2 分钟

   🟢 高效提醒 (3 个)
   ├─ 会议提醒 (点击率 90%, 响应 1 分钟)
   ├─ 目标复盘 (点击率 85%, 响应 3 分钟)
   └─ 重要任务 (点击率 80%, 响应 2 分钟)

   🔴 低效提醒 (2 个)
   ├─ 喝水提醒 (点击率 15%, 忽略率 85%) ⚠️ 建议调整
   └─ 运动提醒 (点击率 20%, 忽略率 80%) ⚠️ 建议调整
   ```

4. 用户可点击某个提醒查看详细趋势图
5. 用户可对低效提醒执行操作：调整频率 / 关闭 / 保持

**预期结果**:

- 仪表盘展示提醒效果排行榜
- 提供操作建议（调整/关闭）
- 支持导出提醒效果报告（CSV/PDF）

---

### 核心场景 4: 智能推荐最佳提醒时间

**场景描述**:  
系统分析用户的响应时间模式，推荐最佳提醒时间。

**用户故事**:

```gherkin
As a 提醒使用者
I want 系统推荐最适合我的提醒时间
So that 提醒发送时我更可能及时响应
```

**操作流程**:

1. 系统分析用户过去 30 天的响应时间分布：

   ```
   响应率最高的时间段：
   - 09:00-10:00: 响应率 85%
   - 14:00-15:00: 响应率 78%
   - 20:00-21:00: 响应率 70%

   响应率最低的时间段：
   - 12:00-13:00: 响应率 30%（午餐时间）
   - 22:00-23:00: 响应率 25%（准备睡觉）
   ```

2. 用户创建新提醒时，系统推荐："根据您的历史数据，建议将提醒时间设为 09:30（此时段响应率最高）"
3. 用户可接受推荐或自定义
4. 系统记录推荐接受率，持续优化推荐算法

**预期结果**:

- 新增 `UserReminderPreferences` 表：
  ```typescript
  {
    userUuid: string,
    bestTimeSlots: Array<{
      hourStart: number,
      hourEnd: number,
      avgResponseRate: number
    }>,
    worstTimeSlots: Array<{
      hourStart: number,
      hourEnd: number,
      avgResponseRate: number
    }>,
    updatedAt: number
  }
  ```
- 推荐算法考虑：
  - 历史响应率
  - 工作日 vs 周末
  - 节假日调整

---

### 核心场景 5: 用户手动调整频率并保留智能推荐

**场景描述**:  
用户手动调整某个提醒的频率后，系统仍持续监控效果并提供优化建议。

**用户故事**:

```gherkin
As a 提醒使用者
I want 手动调整频率后仍能收到智能优化建议
So that 我可以在必要时参考系统建议进一步优化
```

**操作流程**:

1. 用户将"喝水提醒"从"每天 1 次"手动改为"每 3 小时 1 次"
2. 系统记录为"用户手动调整"
3. 系统继续监控该提醒的效果
4. 2 周后，系统发现该提醒的点击率提升至 60%
5. 系统发送正面反馈："您调整后的'喝水提醒'效果提升了 40%！保持当前设置。"
6. 或者，如果效果仍差，系统建议："调整后效果仍不理想，建议改为每 4 小时 1 次或关闭。"

**预期结果**:

- 区分"自动调整"和"手动调整"
- 手动调整后持续监控，提供反馈
- 尊重用户意愿，仅提供建议，不强制调整

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 更新聚合根：Reminder

**位置**: `packages/contracts/src/modules/reminder/aggregates/ReminderServer.ts`

```typescript
export interface ReminderServerDTO {
  // ...existing fields...

  // 智能频率相关字段
  readonly responseMetrics?: ResponseMetrics; // 响应指标
  readonly frequencyAdjustment?: FrequencyAdjustment; // 频率调整
  readonly smartFrequencyEnabled: boolean; // 是否启用智能频率
}

/**
 * 响应指标
 */
export interface ResponseMetrics {
  readonly clickRate: number; // 点击率 (0-100)
  readonly ignoreRate: number; // 忽略率 (0-100)
  readonly avgResponseTime: number; // 平均响应时间（秒）
  readonly snoozeCount: number; // 延迟次数
  readonly effectivenessScore: number; // 效果评分 (0-100)
  readonly sampleSize: number; // 样本数量（最近 N 次）
  readonly lastAnalysisTime: number; // 最后分析时间
}

/**
 * 频率调整
 */
export interface FrequencyAdjustment {
  readonly originalInterval: number; // 原始间隔（秒）
  readonly adjustedInterval: number; // 调整后间隔（秒）
  readonly adjustmentReason: string; // 调整原因
  readonly adjustmentTime: number; // 调整时间
  readonly isAutoAdjusted: boolean; // 是否自动调整
  readonly userConfirmed: boolean; // 用户是否确认
}

/**
 * 用户提醒偏好
 */
export interface UserReminderPreferences {
  readonly userUuid: string;
  readonly bestTimeSlots: TimeSlot[]; // 最佳时间段
  readonly worstTimeSlots: TimeSlot[]; // 最差时间段
  readonly globalSmartFrequency: boolean; // 全局启用智能频率
  readonly updatedAt: number;
}

export interface TimeSlot {
  readonly hourStart: number; // 开始小时 (0-23)
  readonly hourEnd: number; // 结束小时 (0-23)
  readonly avgResponseRate: number; // 平均响应率 (0-100)
  readonly sampleCount: number; // 样本数量
}
```

---

### 交互设计

#### 1. 响应行为追踪

用户对提醒的每次交互都被记录：

| 交互行为 | 记录字段    | 权重 |
| -------- | ----------- | ---- |
| 点击提醒 | `clicked`   | +1.0 |
| 忽略提醒 | `ignored`   | -0.5 |
| 延迟提醒 | `snoozed`   | -0.2 |
| 关闭提醒 | `dismissed` | -0.3 |
| 标记完成 | `completed` | +1.5 |

#### 2. 效果评分算法

```typescript
/**
 * 计算提醒效果评分
 */
function calculateEffectivenessScore(metrics: ResponseMetrics): number {
  const clickWeight = 0.5;
  const ignoreWeight = 0.3;
  const responsivenessWeight = 0.2;

  // 响应速度得分（越快越好）
  const responsiveness = Math.min(100, (60 / metrics.avgResponseTime) * 100);

  return (
    metrics.clickRate * clickWeight +
    (100 - metrics.ignoreRate) * ignoreWeight +
    responsiveness * responsivenessWeight
  );
}
```

#### 3. 频率调整策略

```typescript
/**
 * 决定是否调整频率
 */
function shouldAdjustFrequency(
  effectivenessScore: number,
  ignoreRate: number,
  sampleSize: number,
): 'decrease' | 'increase' | 'no_change' {
  if (sampleSize < 10) return 'no_change'; // 样本不足

  if (effectivenessScore < 20 && ignoreRate > 80) {
    return 'decrease'; // 大幅降低频率（×3）
  } else if (effectivenessScore < 40 && ignoreRate > 60) {
    return 'decrease'; // 降低频率（×2）
  } else if (effectivenessScore > 80 && ignoreRate < 20) {
    return 'increase'; // 可考虑增加频率
  }

  return 'no_change';
}
```

---

## 4. MVP/MMP/Full 路径

### MVP: 基础效果追踪（1-1.5 周）

**范围**:

- ✅ 提醒响应行为追踪（点击、忽略、延迟）
- ✅ 计算基础响应指标（点击率、忽略率）
- ✅ 简单效果评分（0-100）
- ✅ 效果仪表盘（列表视图）
- ✅ 手动调整频率功能

**技术要点**:

- Contracts: 定义 `ResponseMetrics`, `FrequencyAdjustment`
- Domain: Reminder 聚合根添加 `recordResponse()` 方法
- Application: `AnalyzeReminderEffectivenessService` 应用服务
- Infrastructure: 定时任务（每日凌晨执行分析）
- API: `GET /api/v1/reminders/effectiveness-report`
- UI: 效果仪表盘组件

**验收标准**:

```gherkin
Given 用户在过去 7 天内收到"喝水提醒" 10 次
And 点击了 2 次，忽略了 8 次
When 系统执行效果分析
Then 该提醒的点击率应为 20%
And 忽略率应为 80%
And 效果评分应 < 30（低效提醒）
And 用户可在仪表盘查看此数据
```

---

### MMP: 智能频率调整（+1-2 周）

**在 MVP 基础上新增**:

- ✅ 自动频率调整算法
- ✅ 调整建议通知
- ✅ 用户确认/拒绝机制
- ✅ 最佳时间段推荐
- ✅ 调整效果追踪（调整前后对比）

**技术要点**:

- 频率调整决策引擎
- 时间段响应率分析
- 通知服务集成

**验收标准**:

```gherkin
Given "喝水提醒"的效果评分 < 20
When 系统执行智能频率调整
Then 系统应发送调整建议通知
And 建议将频率从"每天 1 次"改为"每 2 天 1 次"
And 用户可选择接受或拒绝
And 接受后频率自动更新
```

---

### Full Release: 智能学习优化（+2-3 周）

**在 MMP 基础上新增**:

- ✅ 机器学习模型预测最佳频率
- ✅ 多维度分析（时间、地点、情境）
- ✅ A/B 测试功能（测试不同频率效果）
- ✅ 群体智能推荐（参考相似用户数据）
- ✅ 提醒疲劳度预警

**技术要点**:

- 机器学习模型（如决策树、随机森林）
- 情境感知（基于日历、位置）
- A/B 测试框架

**验收标准**:

```gherkin
Given 系统积累了 30 天的用户响应数据
When 用户创建新提醒"锻炼提醒"
Then 系统应基于历史数据推荐：
  - 最佳时间：周一/三/五 18:00
  - 推荐频率：每周 3 次
  - 预期点击率：70%
```

---

## 5. 验收标准（Gherkin）

### Feature: 智能提醒频率调整

#### Scenario 1: 追踪提醒响应行为

```gherkin
Feature: 智能提醒频率调整
  作为提醒使用者，我希望系统自动调整提醒频率，减少无效打扰

  Background:
    Given 用户"周八"已登录
    And 存在提醒"每日站会"，频率为每天 09:30

  Scenario: 记录点击行为
    When 用户在 2025-10-21 09:30 收到提醒
    And 用户点击提醒
    And 响应时间为 30 秒
    Then 系统应记录响应行为：
      | 字段         | 值         |
      | action       | clicked    |
      | responseTime | 30         |
      | timestamp    | 1729569030 |
    And 提醒的 responseMetrics 应更新

  Scenario: 记录忽略行为
    When 用户收到提醒但未交互
    And 5 分钟后提醒自动消失
    Then 系统应记录响应行为：
      | 字段   | 值      |
      | action | ignored |
    And 提醒的 ignoreRate 应增加
```

---

#### Scenario 2: 计算效果评分

```gherkin
  Background:
    Given "喝水提醒"在过去 7 天有以下响应记录：
      | 日期       | 行为    |
      | 2025-10-21 | ignored |
      | 2025-10-20 | ignored |
      | 2025-10-19 | clicked |
      | 2025-10-18 | ignored |
      | 2025-10-17 | ignored |
      | 2025-10-16 | ignored |
      | 2025-10-15 | clicked |

  Scenario: 计算基础指标
    When 系统执行效果分析
    Then 提醒的响应指标应为：
      | 指标         | 值              |
      | clickRate    | 28.6%（2/7）    |
      | ignoreRate   | 71.4%（5/7）    |
      | sampleSize   | 7               |
    And effectivenessScore 应 < 40

  Scenario: 生成效果报告
    When 用户打开"提醒效果分析"
    Then 系统应显示效果报告
    And "喝水提醒"应被标记为"低效提醒"
    And 显示建议："考虑调整频率或关闭"
```

---

#### Scenario 3: 自动调整提醒频率

```gherkin
  Background:
    Given "喝水提醒"的 effectivenessScore = 25
    And ignoreRate = 75%
    And 当前频率为每天 1 次

  Scenario: 触发自动调整
    When 系统检测到提醒效果低于阈值
    Then 系统应计算调整建议：
      | 原频率      | 建议频率     | 调整原因             |
      | 每天 1 次   | 每 2 天 1 次 | 忽略率过高（75%）    |
    And 系统应发送通知给用户
    And 通知包含"接受"和"拒绝"按钮

  Scenario: 用户接受调整
    Given 系统已发送调整建议通知
    When 用户点击"接受"
    Then 提醒的 interval 应从 86400 秒更新为 172800 秒
    And frequencyAdjustment 应记录：
      | 字段              | 值                    |
      | originalInterval  | 86400                 |
      | adjustedInterval  | 172800                |
      | isAutoAdjusted    | true                  |
      | userConfirmed     | true                  |
    And 显示"频率已调整为每 2 天 1 次"

  Scenario: 用户拒绝调整
    Given 系统已发送调整建议通知
    When 用户点击"拒绝"
    Then 提醒频率应保持不变
    And 系统应记录"用户拒绝自动调整"
    And 30 天内不再建议调整此提醒
```

---

#### Scenario 4: 推荐最佳提醒时间

```gherkin
  Background:
    Given 用户过去 30 天的响应时间分布为：
      | 时间段       | 响应率 |
      | 09:00-10:00 | 85%    |
      | 12:00-13:00 | 30%    |
      | 18:00-19:00 | 70%    |

  Scenario: 创建新提醒时获得推荐
    When 用户创建新提醒"团队会议"
    And 用户未指定时间
    Then 系统应推荐：
      """
      根据您的历史数据，建议将提醒时间设为：
      1. 09:30（响应率最高 85%）
      2. 18:30（响应率次高 70%）

      避免时间段：12:00-13:00（响应率仅 30%）
      """
    And 用户可一键应用推荐时间

  Scenario: 查看个人最佳时间段
    When 用户打开"提醒偏好设置"
    Then 系统应显示：
      | 类别           | 时间段       | 响应率 |
      | 最佳时间段     | 09:00-10:00 | 85%    |
      | 最佳时间段     | 18:00-19:00 | 70%    |
      | 需避免时间段   | 12:00-13:00 | 30%    |
```

---

#### Scenario 5: 调整效果追踪

```gherkin
  Background:
    Given "喝水提醒"在 2025-10-01 被自动调整为每 2 天 1 次
    And 调整前 7 天的 clickRate = 20%

  Scenario: 追踪调整后效果
    Given 调整后已过去 14 天
    When 系统分析调整后的效果
    Then 系统应对比：
      | 时期       | clickRate | ignoreRate |
      | 调整前 7 天 | 20%       | 80%        |
      | 调整后 14 天| 60%       | 40%        |
    And 系统应发送正面反馈："频率调整后效果提升 40%！"
    And 在仪表盘显示改进趋势图
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 提醒响应行为
{
  event: 'reminder_response_recorded',
  properties: {
    reminderUuid: string,
    action: 'clicked' | 'ignored' | 'snoozed' | 'dismissed',
    responseTime: number,  // 响应时间（秒）
    timestamp: number
  }
}

// 效果分析执行
{
  event: 'reminder_effectiveness_analyzed',
  properties: {
    reminderUuid: string,
    clickRate: number,
    ignoreRate: number,
    effectivenessScore: number,
    sampleSize: number
  }
}

// 频率自动调整
{
  event: 'reminder_frequency_auto_adjusted',
  properties: {
    reminderUuid: string,
    originalInterval: number,
    adjustedInterval: number,
    adjustmentReason: string,
    userConfirmed: boolean
  }
}

// 查看效果仪表盘
{
  event: 'reminder_effectiveness_dashboard_viewed',
  properties: {
    totalReminders: number,
    lowEffectiveCount: number,  // 低效提醒数量
    highEffectiveCount: number  // 高效提醒数量
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 整体提醒点击率提升 | +20% | 启用智能频率后 vs 启用前 |
| 低效提醒识别率 | >90% | 正确识别的低效提醒数 / 总低效提醒数 |
| 用户接受调整建议率 | >60% | 接受次数 / 建议次数 |
| 提醒疲劳投诉率下降 | -50% | 用户投诉"提醒太多"的次数 |

**定性指标**:

- 用户反馈"提醒更精准了"
- 重要提醒的及时响应率提升
- 用户主动开启智能频率功能

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model Reminder {
  // ...existing fields...

  // 响应指标
  clickRate              Float?   @map("click_rate")
  ignoreRate             Float?   @map("ignore_rate")
  avgResponseTime        Int?     @map("avg_response_time")
  snoozeCount            Int      @default(0) @map("snooze_count")
  effectivenessScore     Float?   @map("effectiveness_score")
  sampleSize             Int      @default(0) @map("sample_size")
  lastAnalysisTime       BigInt?  @map("last_analysis_time")

  // 频率调整
  originalInterval       Int?     @map("original_interval")
  adjustedInterval       Int?     @map("adjusted_interval")
  adjustmentReason       String?  @map("adjustment_reason")
  adjustmentTime         BigInt?  @map("adjustment_time")
  isAutoAdjusted         Boolean  @default(false) @map("is_auto_adjusted")
  userConfirmed          Boolean  @default(false) @map("user_confirmed")

  smartFrequencyEnabled  Boolean  @default(true) @map("smart_frequency_enabled")

  responses              ReminderResponse[]
}

model ReminderResponse {
  uuid          String   @id @default(uuid())
  reminderUuid  String   @map("reminder_uuid")
  action        String   // clicked, ignored, snoozed, dismissed
  responseTime  Int?     @map("response_time")  // 秒
  timestamp     BigInt

  reminder      Reminder @relation(fields: [reminderUuid], references: [uuid])

  @@index([reminderUuid, timestamp(sort: Desc)])
  @@map("reminder_responses")
}

model UserReminderPreferences {
  uuid                    String   @id @default(uuid())
  userUuid                String   @unique @map("user_uuid")
  bestTimeSlots           Json     @map("best_time_slots")      // TimeSlot[]
  worstTimeSlots          Json     @map("worst_time_slots")     // TimeSlot[]
  globalSmartFrequency    Boolean  @default(true) @map("global_smart_frequency")
  updatedAt               DateTime @updatedAt @map("updated_at")

  @@map("user_reminder_preferences")
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/reminder/application/AnalyzeReminderEffectivenessService.ts

export class AnalyzeReminderEffectivenessService {
  async execute(reminderUuid: string): Promise<void> {
    const reminder = await this.reminderRepository.findByUuid(reminderUuid);
    if (!reminder) throw new Error('Reminder not found');

    // 获取最近 N 天的响应记录
    const responses = await this.getReminderResponses(reminderUuid, 7);

    // 计算指标
    const clickRate = this.calculateClickRate(responses);
    const ignoreRate = this.calculateIgnoreRate(responses);
    const avgResponseTime = this.calculateAvgResponseTime(responses);
    const effectivenessScore = this.calculateEffectivenessScore({
      clickRate,
      ignoreRate,
      avgResponseTime,
    });

    // 更新提醒指标
    reminder.updateResponseMetrics({
      clickRate,
      ignoreRate,
      avgResponseTime,
      effectivenessScore,
      sampleSize: responses.length,
      lastAnalysisTime: Date.now(),
    });

    // 决定是否需要调整频率
    if (this.shouldAdjustFrequency(effectivenessScore, ignoreRate)) {
      await this.suggestFrequencyAdjustment(reminder);
    }

    await this.reminderRepository.save(reminder);
  }
}
```

### API 端点

```typescript
// 获取效果报告
GET /api/v1/reminders/effectiveness-report
Response: {
  overall: { avgClickRate: number, avgEffectivenessScore: number },
  highEffective: ReminderClientDTO[],
  lowEffective: ReminderClientDTO[]
}

// 接受频率调整
POST /api/v1/reminders/:id/accept-adjustment
Response: ReminderClientDTO

// 拒绝频率调整
POST /api/v1/reminders/:id/reject-adjustment
Response: ReminderClientDTO

// 获取最佳时间段推荐
GET /api/v1/reminders/recommended-time-slots
Response: { bestSlots: TimeSlot[], worstSlots: TimeSlot[] }
```

---

## 8. 风险与缓解

| 风险                 | 可能性 | 影响 | 缓解措施                          |
| -------------------- | ------ | ---- | --------------------------------- |
| 错误降低重要提醒频率 | 中     | 高   | 用户确认机制 + 重要提醒白名单     |
| 数据不足导致误判     | 中     | 中   | 最小样本量要求（≥10 次）          |
| 用户不理解调整原因   | 中     | 中   | 清晰的调整原因说明 + 可视化趋势图 |
| 隐私问题（行为追踪） | 低     | 高   | 数据本地化 + 明确隐私政策         |

---

## 9. 参考资料

- [Reminder Contracts](../../../../packages/contracts/src/modules/reminder/)
- [Notification Fatigue Research](https://www.nngroup.com/articles/notification-overload/)
- [Smart Notification Best Practices](https://developer.android.com/design/patterns/notifications)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow
