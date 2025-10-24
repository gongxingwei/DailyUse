# Feature Spec: 目标复盘

> **功能编号**: GOAL-004  
> **RICE 评分**: 336 (Reach: 7, Impact: 8, Confidence: 6, Effort: 1)  
> **优先级**: P1  
> **预估时间**: 0.5-1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

在目标管理实践中，定期复盘是保障目标达成的关键环节，但现状存在以下问题：

- ❌ 复盘时间不固定，依赖人工记忆，容易遗忘
- ❌ 没有结构化的复盘记录，历史复盘内容无法追溯
- ❌ 缺少专注周期概念，目标执行缺乏节奏感
- ❌ 复盘质量参差不齐，没有标准化的复盘框架

### 目标用户

- **主要用户**: OKR 管理者、团队 Leader、个人效能追求者
- **次要用户**: 团队成员（参与复盘、查看复盘记录）
- **典型画像**: 希望建立定期复盘习惯，持续优化目标执行策略的用户

### 价值主张

**一句话价值**: 提供结构化的专注周期与复盘机制，通过定期回顾提升目标达成率

**核心收益**:

- ✅ 自动复盘提醒，避免遗忘，养成定期回顾习惯
- ✅ 结构化复盘模板（4D回顾：Data, Discover, Dream, Design）
- ✅ 复盘历史可追溯，便于分析目标执行趋势
- ✅ 支持多种专注周期（周/双周/月/季），适应不同目标类型

---

## 2. 用户价值与场景

### 核心场景 1: 配置专注周期

**场景描述**:  
用户为目标配置专注周期（如每周复盘），系统自动生成复盘提醒。

**用户故事**:

```gherkin
As a 目标负责人
I want 为目标配置专注周期（如"每周一 10:00 复盘"）
So that 系统可以自动提醒我定期回顾目标进展
```

**操作流程**:

1. 用户打开目标详情页
2. 点击"专注周期"配置入口
3. 选择周期类型：每周 / 每两周 / 每月 / 自定义
4. 设置复盘时间（如"每周一 10:00"）
5. 可选：设置复盘提前提醒（如提前 1 天）
6. 保存配置
7. 系统创建定时任务，到期时发送复盘提醒

**预期结果**:

- Goal 表新增 `focusCycle` 字段：
  ```typescript
  focusCycle: {
    type: 'weekly' | 'biweekly' | 'monthly' | 'custom',
    dayOfWeek?: number,        // 周几（1-7）
    dayOfMonth?: number,       // 几号（1-31）
    time: string,              // HH:mm
    advanceNoticeHours: number // 提前通知（小时）
  }
  ```
- Reminder 模块自动创建循环提醒

---

### 核心场景 2: 执行复盘并记录

**场景描述**:  
用户收到复盘提醒后，进入结构化复盘流程，记录回顾内容。

**用户故事**:

```gherkin
As a 目标负责人
I want 使用 4D 复盘模板（Data, Discover, Dream, Design）记录回顾
So that 复盘内容结构化，便于后续追溯和分析
```

**操作流程**:

1. 用户点击复盘提醒通知
2. 系统打开复盘界面，展示：
   - **Data（数据回顾）**: 自动填充本周期 KR 进展数据
   - **Discover（发现洞察）**: 用户填写"做得好的" + "需改进的"
   - **Dream（期望目标）**: 用户填写下周期目标
   - **Design（行动计划）**: 用户填写具体行动项
3. 用户填写完成后点击"保存复盘"
4. 系统创建 `GoalReview` 记录
5. 显示"复盘已保存，下次复盘时间：2025-10-28 10:00"

**预期结果**:

- 新增 `GoalReview` 实体：
  ```typescript
  {
    uuid: string,
    goalUuid: string,
    reviewTime: number,        // 复盘时间
    cycleStartTime: number,    // 周期开始时间
    cycleEndTime: number,      // 周期结束时间

    // 4D 复盘内容
    data: {                    // 数据回顾
      krProgress: KeyResultProgressSnapshot[],
      completedTasks: number,
      totalTasks: number
    },
    discover: {                // 发现洞察
      wentWell: string[],      // 做得好的
      needsImprovement: string[] // 需改进的
    },
    dream: {                   // 期望目标
      nextCycleGoals: string
    },
    design: {                  // 行动计划
      actionItems: ActionItem[]
    },

    reviewerUuid: string,
    createdAt: number
  }
  ```

---

### 核心场景 3: 查看复盘历史

**场景描述**:  
用户查看目标的历史复盘记录，分析目标执行趋势。

**用户故事**:

```gherkin
As a 目标负责人
I want 查看目标的历史复盘记录（按时间轴展示）
So that 我可以分析目标执行的改进趋势
```

**操作流程**:

1. 用户打开目标详情页
2. 点击"复盘历史"标签
3. 系统展示时间轴式复盘列表：
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📅 2025-10-21 周复盘
   Data: KR1 进展 +15%, KR2 进展 +10%
   Discover: ✅ 时间管理改善 ⚠️ 沟通不足
   Dream: 下周完成 KR1 至 60%
   Design: 3 个行动项
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📅 2025-10-14 周复盘
   ...
   ```
4. 用户可点击某次复盘查看详情
5. 可导出复盘报告（PDF/Markdown）

**预期结果**:

- 复盘历史按时间倒序展示
- 每次复盘显示关键摘要（KR 进展、洞察数量、行动项数量）
- 支持筛选（按时间范围、复盘类型）

---

### 核心场景 4: 跳过或延迟复盘

**场景描述**:  
用户因特殊情况无法按时复盘，选择跳过或延迟。

**用户故事**:

```gherkin
As a 目标负责人
I want 跳过或延迟某次复盘
So that 复盘安排更灵活，不会因一次遗漏而中断节奏
```

**操作流程**:

1. 用户收到复盘提醒
2. 点击"延迟复盘"或"跳过本次"
3. 如选择延迟：
   - 选择延迟时长（1 小时 / 3 小时 / 明天）
   - 系统重新调度提醒
4. 如选择跳过：
   - 系统记录跳过原因（可选）
   - 标记本次复盘为 `skipped`
   - 不影响下次复盘时间

**预期结果**:

- `GoalReview` 新增状态字段：`pending`, `completed`, `skipped`, `delayed`
- 跳过/延迟操作被记录，便于分析复盘完成率

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 更新聚合根：Goal

**位置**: `packages/contracts/src/modules/goal/aggregates/GoalServer.ts`

```typescript
export interface GoalServerDTO {
  // ...existing fields...

  // 新增字段
  readonly focusCycle?: FocusCycle; // 专注周期配置
  readonly reviews?: GoalReviewServerDTO[]; // 复盘历史
  readonly nextReviewTime?: number; // 下次复盘时间
}

export interface FocusCycle {
  readonly type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  readonly dayOfWeek?: number; // 1-7 (周一到周日)
  readonly dayOfMonth?: number; // 1-31
  readonly time: string; // HH:mm
  readonly advanceNoticeHours: number; // 提前通知时间
  readonly enabled: boolean; // 是否启用
}
```

#### 新增实体：GoalReview

**位置**: `packages/contracts/src/modules/goal/entities/GoalReviewServer.ts`

```typescript
export interface GoalReviewServerDTO {
  readonly uuid: string;
  readonly goalUuid: string;
  readonly reviewTime: number;
  readonly cycleStartTime: number;
  readonly cycleEndTime: number;
  readonly status: 'pending' | 'completed' | 'skipped' | 'delayed';

  // 4D 复盘内容
  readonly data: ReviewDataSection;
  readonly discover: ReviewDiscoverSection;
  readonly dream: ReviewDreamSection;
  readonly design: ReviewDesignSection;

  readonly reviewerUuid: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ReviewDataSection {
  readonly krProgress: Array<{
    keyResultUuid: string;
    oldProgress: number;
    newProgress: number;
    delta: number;
  }>;
  readonly completedTasks: number;
  readonly totalTasks: number;
}

export interface ReviewDiscoverSection {
  readonly wentWell: string[];
  readonly needsImprovement: string[];
}

export interface ReviewDreamSection {
  readonly nextCycleGoals: string;
}

export interface ReviewDesignSection {
  readonly actionItems: Array<{
    description: string;
    dueDate?: number;
    assignee?: string;
    completed: boolean;
  }>;
}
```

---

### 交互设计

#### 1. 复盘提醒触发时机

- ✅ 定时任务：根据 `focusCycle` 配置定期触发
- ✅ 提前提醒：在复盘时间前 N 小时发送预告通知
- ✅ 逾期提醒：如复盘未完成，24 小时后再次提醒

#### 2. 复盘完成率追踪

- 计算公式：`完成率 = 已完成复盘数 / 应完成复盘数`
- 在目标详情页显示"复盘完成率"徽章
- 低于 50% 时显示警告提示

#### 3. 复盘与 Reminder 模块集成

- 复盘提醒由 Reminder 模块统一管理
- 复盘提醒类型：`'goal-review'`
- 支持 Web 推送、桌面通知、邮件提醒（可配置）

---

## 4. MVP/MMP/Full 路径

### MVP: 基础复盘功能（0.5-1 周）

**范围**:

- ✅ 配置专注周期（每周/每月）
- ✅ 定时复盘提醒（基于 Reminder 模块）
- ✅ 简化版复盘记录（只包含文本回顾，暂无 4D 结构）
- ✅ 复盘历史列表查看

**技术要点**:

- Contracts: 定义 `FocusCycle` 和 `GoalReviewServerDTO`
- Domain: Goal 聚合根添加 `configureFocusCycle()`, `createReview()` 方法
- Application: `CreateGoalReviewService` 应用服务
- Prisma: 添加 `GoalReview` 表
- API: `POST /api/v1/goals/:id/reviews`, `GET /api/v1/goals/:id/reviews`
- UI: 专注周期配置面板 + 简单复盘表单

**验收标准**:

```gherkin
Given 用户为目标配置"每周一 10:00 复盘"
When 到达 2025-10-27 10:00
Then 系统应发送复盘提醒通知
And 用户点击通知后可进入复盘界面
And 用户填写复盘内容并保存
And 复盘记录出现在"复盘历史"列表中
```

---

### MMP: 4D 复盘模板（+1-2 周）

**在 MVP 基础上新增**:

- ✅ 结构化 4D 复盘模板（Data, Discover, Dream, Design）
- ✅ 自动填充 Data 部分（KR 进展数据）
- ✅ 行动项管理（Design 部分）
- ✅ 复盘延迟/跳过功能
- ✅ 复盘完成率统计

**技术要点**:

- 复盘表单组件化（4 个独立步骤）
- 数据自动填充逻辑（查询周期内 KR 变化）
- 行动项与 Task 模块集成（可选）

**验收标准**:

```gherkin
Given 用户进入复盘界面
When 系统展示 4D 复盘模板
Then Data 部分应自动显示本周 KR 进展（如 KR1: 50%→65%）
And 用户可在 Discover 部分添加"做得好的"和"需改进的"
And 用户可在 Design 部分创建行动项（如"明天联系客户 A"）
And 保存后复盘记录包含完整 4D 内容
```

---

### Full Release: 智能复盘分析（+2-4 周）

**在 MMP 基础上新增**:

- ✅ 复盘趋势分析（识别持续出现的问题）
- ✅ 复盘质量评分（基于内容丰富度）
- ✅ 复盘报告导出（PDF/Markdown）
- ✅ 团队复盘（多人协作填写）
- ✅ 复盘模板自定义（除 4D 外支持自定义问题）

**技术要点**:

- NLP 分析"需改进的"内容，识别重复问题
- 复盘质量算法（如：有行动项 +10 分，有具体数据 +10 分）
- PDF 生成服务（使用 Puppeteer）

**验收标准**:

```gherkin
Given 用户完成了 5 次复盘
When 系统分析复盘内容
Then 系统应识别出"沟通不足"问题在 3 次复盘中出现
And 显示提示"'沟通不足'问题持续出现，建议优先解决"
And 用户可点击"生成复盘报告"导出 PDF
```

---

## 5. 验收标准（Gherkin）

### Feature: 专注周期追踪

#### Scenario 1: 配置专注周期

```gherkin
Feature: 专注周期追踪
  作为目标负责人，我希望为目标配置专注周期，自动收到复盘提醒

  Background:
    Given 用户"李四"已登录
    And 存在目标"2025 Q4 产品创新"
    And 当前时间为 2025-10-21 09:00

  Scenario: 配置每周复盘
    When 用户打开目标"2025 Q4 产品创新"
    And 点击"专注周期"配置
    And 选择周期类型 = "每周"
    And 选择复盘日 = "周一"
    And 设置复盘时间 = "10:00"
    And 设置提前通知 = "1 天"
    And 点击"保存"
    Then 目标的 focusCycle 应为：
      | type    | dayOfWeek | time  | advanceNoticeHours |
      | weekly  | 1         | 10:00 | 24                 |
    And 系统应显示"专注周期已配置，下次复盘：2025-10-27 10:00"
    And Reminder 模块应创建循环提醒

  Scenario: 配置双周复盘
    When 用户配置专注周期：
      | type     | dayOfWeek | time  |
      | biweekly | 5         | 14:00 |
    Then 下次复盘时间应为"2025-10-24 14:00"（本周五）
    And 下下次复盘时间应为"2025-11-07 14:00"（两周后）
```

---

#### Scenario 2: 执行复盘并记录

```gherkin
  Background:
    Given 目标已配置"每周一 10:00 复盘"
    And 当前时间为 2025-10-27 10:00
    And 系统发送了复盘提醒通知

  Scenario: 完成 4D 复盘
    When 用户点击复盘提醒通知
    Then 系统应打开复盘界面
    And Data 部分应自动显示：
      | keyResult        | oldProgress | newProgress | delta |
      | 用户增长 20%     | 50%         | 65%         | +15%  |
      | NPS 提升至 40    | 35          | 38          | +3    |
    When 用户在 Discover 部分填写：
      | wentWell                | needsImprovement     |
      | 新功能上线顺利           | 用户反馈响应慢        |
    And 用户在 Dream 部分填写"下周完成用户增长至 70%"
    And 用户在 Design 部分添加行动项"每天处理 5 条用户反馈"
    And 点击"保存复盘"
    Then 系统应创建 GoalReview 记录
    And 记录包含完整 4D 内容
    And 显示"复盘已保存，下次复盘：2025-11-03 10:00"

  Scenario: 跳过复盘
    When 用户收到复盘提醒
    And 点击"跳过本次复盘"
    And 选择原因 = "出差无法复盘"
    Then 系统应标记本次复盘为 skipped
    And 不影响下次复盘时间（仍为 2025-11-03 10:00）
    And 复盘完成率统计中计入"跳过次数"
```

---

#### Scenario 3: 查看复盘历史

```gherkin
  Background:
    Given 目标有以下复盘历史：
      | reviewTime        | status    | krDelta | actionItems |
      | 2025-10-27 10:00 | completed | +15%    | 3           |
      | 2025-10-20 10:00 | completed | +10%    | 2           |
      | 2025-10-13 10:00 | skipped   | -       | -           |
      | 2025-10-06 10:00 | completed | +8%     | 4           |

  Scenario: 查看复盘历史列表
    When 用户打开目标的"复盘历史"标签
    Then 系统应显示复盘列表（按时间倒序）
    And 列表应包含 4 条记录
    And 第一条记录应显示：
      | 时间              | 状态 | KR 进展 | 行动项 |
      | 2025-10-27 10:00 | ✅   | +15%    | 3      |
    And 跳过的复盘应显示"⏭️ 已跳过"标识

  Scenario: 查看单次复盘详情
    When 用户点击"2025-10-27 10:00"的复盘记录
    Then 系统应显示复盘详情对话框
    And 详情应包含完整 4D 内容：
      | 部分     | 内容摘要                          |
      | Data     | KR1: +15%, KR2: +3, 任务完成 5/8  |
      | Discover | ✅ 新功能上线 ⚠️ 用户反馈慢        |
      | Dream    | 下周完成用户增长至 70%            |
      | Design   | 3 个行动项（1 个已完成）          |
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 配置专注周期
{
  event: 'focus_cycle_configured',
  properties: {
    goalUuid: string,
    cycleType: string,
    dayOfWeek?: number,
    time: string
  }
}

// 复盘开始
{
  event: 'goal_review_started',
  properties: {
    goalUuid: string,
    reviewUuid: string,
    trigger: 'notification' | 'manual'
  }
}

// 复盘完成
{
  event: 'goal_review_completed',
  properties: {
    goalUuid: string,
    reviewUuid: string,
    duration: number,          // 复盘耗时（秒）
    actionItemsCount: number,  // 行动项数量
    qualityScore: number       // 复盘质量分（MMP 功能）
  }
}

// 复盘跳过
{
  event: 'goal_review_skipped',
  properties: {
    goalUuid: string,
    reason: string
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 复盘配置率 | >40% | 配置专注周期的目标数 / 总目标数 |
| 复盘完成率 | >70% | 已完成复盘数 / 应完成复盘数 |
| 复盘平均耗时 | <10 分钟 | 从开始到保存的平均时间 |
| 行动项创建率 | >60% | 包含行动项的复盘数 / 总复盘数 |

**定性指标**:

- 用户反馈"复盘习惯养成"
- 目标达成率提升（有定期复盘 vs 无复盘对比）
- 复盘内容质量（是否有具体数据和行动计划）

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model Goal {
  // ...existing fields...

  focusCycleType           String?  @map("focus_cycle_type")
  focusCycleDayOfWeek      Int?     @map("focus_cycle_day_of_week")
  focusCycleDayOfMonth     Int?     @map("focus_cycle_day_of_month")
  focusCycleTime           String?  @map("focus_cycle_time")
  focusCycleAdvanceNotice  Int?     @map("focus_cycle_advance_notice")
  focusCycleEnabled        Boolean  @default(false) @map("focus_cycle_enabled")
  nextReviewTime           BigInt?  @map("next_review_time")

  reviews  GoalReview[]
}

model GoalReview {
  uuid               String   @id @default(uuid())
  goalUuid           String   @map("goal_uuid")
  reviewTime         BigInt   @map("review_time")
  cycleStartTime     BigInt   @map("cycle_start_time")
  cycleEndTime       BigInt   @map("cycle_end_time")
  status             String   // pending, completed, skipped, delayed

  // 4D 复盘内容（JSON 存储）
  data               Json     // ReviewDataSection
  discover           Json     // ReviewDiscoverSection
  dream              Json     // ReviewDreamSection
  design             Json     // ReviewDesignSection

  reviewerUuid       String   @map("reviewer_uuid")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  goal      Goal    @relation(fields: [goalUuid], references: [uuid])
  reviewer  Account @relation(fields: [reviewerUuid], references: [uuid])

  @@index([goalUuid, reviewTime(sort: Desc)])
  @@map("goal_reviews")
}
```

### API 端点

```typescript
// 配置专注周期
PUT /api/v1/goals/:id/focus-cycle
Body: FocusCycle
Response: GoalClientDTO

// 创建复盘
POST /api/v1/goals/:id/reviews
Body: Omit<GoalReviewServerDTO, 'uuid' | 'createdAt'>
Response: GoalReviewClientDTO

// 查询复盘列表
GET /api/v1/goals/:id/reviews
Query: status?, startTime?, endTime?, limit?, offset?
Response: { reviews: GoalReviewClientDTO[], total: number }

// 更新复盘
PATCH /api/v1/reviews/:reviewId
Body: Partial<GoalReviewServerDTO>
Response: GoalReviewClientDTO
```

---

## 8. 风险与缓解

| 风险                 | 可能性 | 影响 | 缓解措施                               |
| -------------------- | ------ | ---- | -------------------------------------- |
| 用户觉得复盘太麻烦   | 高     | 高   | 简化 MVP 版本 + 快速复盘模式（1 分钟） |
| 提醒疲劳（太多通知） | 中     | 中   | 支持关闭提醒 + 合并通知                |
| 复盘内容太空洞       | 中     | 中   | 提供复盘模板示例 + 智能建议            |
| 时区问题             | 低     | 中   | 存储 UTC 时间 + 前端本地化             |

---

## 9. 参考资料

- [Goal Contracts](../../../../packages/contracts/src/modules/goal/)
- [Reminder Module](../../../../packages/contracts/src/modules/reminder/)
- [4D 复盘法](https://en.wikipedia.org/wiki/Appreciative_inquiry#4D_Cycle)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow
