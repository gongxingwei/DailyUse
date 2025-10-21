# Feature Spec: 专注周期聚焦模式

> **功能编号**: GOAL-003  
> **RICE 评分**: 432 (Reach: 8, Impact: 9, Confidence: 8, Effort: 1.33)  
> **优先级**: P0  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

在目标管理中，用户常常面临"目标太多，无法聚焦"的困扰：
- ❌ 同时追踪 10+ 个目标，注意力分散
- ❌ 紧急目标被常规目标干扰，无法聚焦
- ❌ 在冲刺阶段（如季度末、项目关键期）需要临时聚焦少数关键目标
- ❌ 其他非关键目标在 UI 中占据视觉空间，造成干扰

### 目标用户

- **主要用户**: 目标管理者、需要阶段性聚焦的知识工作者
- **次要用户**: 团队 Leader（为团队开启聚焦模式）
- **典型画像**: 管理多个并行目标，需要在特定时期"屏蔽噪音"专注少数关键目标的用户

### 价值主张

**一句话价值**: 临时开启聚焦模式，隐藏非关键目标，专注于 1-3 个紧急关注的目标

**核心收益**:
- ✅ 一键开启聚焦模式，UI 中只显示选中的关键目标
- ✅ 支持设置聚焦周期（本周、本月、自定义时间段）
- ✅ 聚焦期间其他目标自动归档/隐藏，减少视觉干扰
- ✅ 聚焦结束后自动恢复，无需手动调整

---

## 2. 用户价值与场景

### 核心场景 1: 开启聚焦模式

**场景描述**:  
用户进入关键冲刺期，需要临时聚焦 1-3 个紧急目标。

**用户故事**:
```gherkin
As a 目标负责人
I want 开启聚焦模式，只显示少数关键目标
So that 我可以屏蔽其他干扰，全力推进关键目标
```

**操作流程**:
1. 用户打开目标列表页面
2. 点击"聚焦模式"按钮（顶部操作栏）
3. 系统弹出聚焦配置面板：
   ```
   🎯 开启聚焦模式
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   选择聚焦目标（1-3 个）：
   ☑️ Q4 收入增长目标
   ☐ 团队效能提升
   ☑️ 新产品上线
   ☐ 技术债清理
   ☐ 知识库建设
   
   聚焦周期：
   ⚪ 本周（2025-10-21 ~ 2025-10-27）
   🔘 本月（2025-10-01 ~ 2025-10-31）
   ⚪ 自定义时间段
   
   聚焦期间其他目标：
   🔘 临时隐藏（推荐）
   ⚪ 折叠显示
   ⚪ 降低优先级标记
   
   [取消]  [开启聚焦]
   ```
4. 用户选择 2 个目标，设置聚焦周期为"本月"
5. 点击"开启聚焦"
6. 系统进入聚焦模式，UI 变化：
   - 目标列表只显示 2 个聚焦目标
   - 顶部显示聚焦状态栏："🎯 聚焦模式已开启（剩余 10 天）"
   - 其他 3 个目标被隐藏（可通过"查看全部"按钮临时查看）

**预期结果**:
- 用户表新增 `activeFocusMode` 字段：
  ```typescript
  readonly activeFocusMode?: FocusMode;
  ```
- FocusMode 结构：
  ```typescript
  {
    uuid: string,
    focusedGoalUuids: string[],       // 聚焦的目标 UUID 列表（1-3 个）
    startTime: number,                // 聚焦开始时间
    endTime: number,                  // 聚焦结束时间
    hiddenGoalsMode: 'hide' | 'collapse' | 'deprioritize', // 其他目标处理方式
    isActive: boolean,                // 是否激活
    createdAt: number
  }
  ```

---

### 核心场景 2: 聚焦模式下的 UI 体验

**场景描述**:  
聚焦模式开启后，用户专注于关键目标，UI 高度简洁。

**用户故事**:
```gherkin
As a 目标负责人
I want 聚焦模式下 UI 只显示关键信息
So that 我可以全神贯注，不被其他内容分散注意力
```

**UI 变化**:

#### 目标列表页
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 聚焦模式（剩余 10 天） [退出聚焦] [查看全部]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 聚焦目标（2 个）

┌─────────────────────────────────┐
│ 🎯 Q4 收入增长目标               │
│ 进度：65% ████████▒▒            │
│ KR1: 新客户增长 20% (70%)       │
│ KR2: 客单价提升 15% (60%)       │
│ 📅 截止：2025-12-31              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🚀 新产品上线                    │
│ 进度：45% ██████▒▒▒▒            │
│ KR1: 功能开发完成 (80%)          │
│ KR2: 用户测试通过 (30%)          │
│ 📅 截止：2025-11-15              │
└─────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 提示：聚焦模式下，其他 3 个目标已临时隐藏
    点击"查看全部"可临时查看，但建议保持专注
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 仪表盘页面
- **目标进度卡片**: 只显示聚焦目标的进度
- **任务列表**: 只显示与聚焦目标关联的任务
- **提醒**: 优先显示聚焦目标的提醒
- **侧边栏**: 隐藏非聚焦目标的快捷入口

**预期结果**:
- 聚焦模式作为全局状态，影响所有目标相关页面
- 用户可通过"查看全部"临时查看隐藏目标，但操作后仍回到聚焦状态
- 导航栏显示聚焦状态指示器

---

### 核心场景 3: 查看隐藏的目标（临时解除聚焦）

**场景描述**:  
聚焦模式下，用户需要临时查看或更新其他目标。

**用户故事**:
```gherkin
As a 目标负责人
I want 临时查看聚焦模式下隐藏的目标
So that 我可以在必要时更新其他目标，而不完全退出聚焦模式
```

**操作流程**:
1. 用户在聚焦模式下
2. 点击"查看全部"按钮
3. 系统展示所有目标，但聚焦目标高亮标记：
   ```
   🎯 所有目标（聚焦模式临时暂停）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📌 聚焦中（2 个）
   ⭐ Q4 收入增长目标 (65%)
   ⭐ 新产品上线 (45%)
   
   🔇 已隐藏（3 个）
   ▸ 团队效能提升 (30%)
   ▸ 技术债清理 (20%)
   ▸ 知识库建设 (10%)
   
   [返回聚焦模式]
   ```
4. 用户可正常操作任何目标
5. 点击"返回聚焦模式"恢复聚焦视图

**预期结果**:
- "查看全部"为临时操作，不退出聚焦模式
- 隐藏目标用灰色或半透明显示，视觉弱化
- 操作隐藏目标后自动返回聚焦模式（可配置）

---

### 核心场景 4: 延长或提前结束聚焦周期

**场景描述**:  
用户需要调整聚焦周期的持续时间。

**用户故事**:
```gherkin
As a 目标负责人
I want 延长或缩短聚焦周期
So that 我可以根据实际情况灵活调整
```

**操作流程**:

#### 延长聚焦
1. 用户在聚焦模式下，点击聚焦状态栏
2. 系统显示聚焦详情：
   ```
   🎯 聚焦模式详情
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   聚焦目标：2 个
   - Q4 收入增长目标
   - 新产品上线
   
   聚焦周期：
   开始时间：2025-10-01
   结束时间：2025-10-31（剩余 10 天）
   
   [延长聚焦] [提前结束] [调整目标]
   ```
3. 用户点击"延长聚焦"
4. 选择新的结束时间："2025-11-15"
5. 系统更新聚焦周期

#### 提前结束聚焦
1. 用户点击"提前结束"
2. 系统确认："确定要退出聚焦模式吗？所有目标将恢复正常显示。"
3. 用户确认
4. 系统退出聚焦模式，恢复所有目标显示
5. 聚焦历史被记录

**预期结果**:
- 支持灵活调整聚焦周期
- 提前结束时记录实际聚焦时长
- 聚焦历史可追溯（用于分析效果）

---

### 核心场景 5: 聚焦周期自动结束

**场景描述**:  
聚焦周期到期后，系统自动退出聚焦模式并发送通知。

**用户故事**:
```gherkin
As a 目标负责人
I want 聚焦周期结束时自动恢复正常显示
So that 我无需手动操作，系统自动切换状态
```

**操作流程**:
1. 聚焦周期设置为 2025-10-01 ~ 2025-10-31
2. 2025-10-31 23:59:59 聚焦周期到期
3. 系统自动执行：
   - 设置 `activeFocusMode.isActive = false`
   - 记录聚焦历史到 `focusModeHistory`
   - 恢复所有目标显示
4. 2025-11-01 00:00:00 用户登录时看到通知：
   ```
   🎯 聚焦模式已结束
   
   您的 10 月聚焦周期已完成！
   
   聚焦成果：
   - Q4 收入增长目标：65% → 80% (+15%)
   - 新产品上线：45% → 95% (+50%)
   
   总聚焦时长：31 天
   平均每日进展：+2.1%
   
   [查看详细报告] [开启新聚焦]
   ```
5. 用户可查看聚焦效果报告

**预期结果**:
- 定时任务每天检查聚焦到期
- 自动生成聚焦成果报告
- 支持一键开启新的聚焦周期

---

### 核心场景 6: 聚焦历史与效果分析

**场景描述**:  
用户查看历史聚焦记录，分析聚焦模式的效果。

**用户故事**:
```gherkin
As a 目标负责人
I want 查看历史聚焦记录和效果分析
So that 我可以了解聚焦模式对目标达成的帮助
```

**操作流程**:
1. 用户打开"聚焦历史"页面
2. 系统展示历史聚焦记录：
   ```
   聚焦历史
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📅 2025-10 月聚焦（已完成）
   聚焦目标：Q4 收入增长、新产品上线
   聚焦时长：31 天
   进展：平均 +2.1%/天
   成效评分：⭐⭐⭐⭐⭐（优秀）
   
   📅 2025-09 月聚焦（已完成）
   聚焦目标：技术债清理
   聚焦时长：15 天（提前结束）
   进展：+18%
   成效评分：⭐⭐⭐（良好）
   ```
3. 用户点击某条记录查看详情
4. 系统展示聚焦效果分析：
   ```
   2025-10 月聚焦详情
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   聚焦目标进展对比
   
   Q4 收入增长目标
   ├─ 聚焦前：65%
   ├─ 聚焦后：80%
   └─ 进展：+15% ✅
   
   新产品上线
   ├─ 聚焦前：45%
   ├─ 聚焦后：95%
   └─ 进展：+50% 🚀
   
   非聚焦目标进展
   ├─ 团队效能提升：+3%（维持）
   ├─ 技术债清理：+2%（缓慢）
   └─ 知识库建设：+1%（几乎停滞）
   
   结论：聚焦模式显著提升关键目标进展
   建议：继续使用聚焦模式处理紧急目标
   ```

**预期结果**:
- 聚焦历史永久保存
- 提供数据对比分析（聚焦前 vs 聚焦后）
- 识别聚焦模式的有效性

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：FocusMode

**位置**: `packages/contracts/src/modules/goal/entities/FocusModeServer.ts`

```typescript
/**
 * 聚焦模式配置
 */
export interface FocusModeServerDTO {
  readonly uuid: string;
  readonly userUuid: string;
  readonly focusedGoalUuids: string[];              // 聚焦的目标 UUID（1-3 个）
  readonly startTime: number;                       // 聚焦开始时间
  readonly endTime: number;                         // 聚焦结束时间
  readonly hiddenGoalsMode: HiddenGoalsMode;        // 其他目标处理方式
  readonly isActive: boolean;                       // 是否激活
  readonly actualEndTime?: number;                  // 实际结束时间（提前结束时）
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 隐藏目标处理方式
 */
export enum HiddenGoalsMode {
  HIDE = 'hide',               // 完全隐藏（推荐）
  COLLAPSE = 'collapse',       // 折叠显示
  DEPRIORITIZE = 'deprioritize' // 降低优先级标记
}

/**
 * 聚焦历史记录
 */
export interface FocusModeHistoryServerDTO {
  readonly uuid: string;
  readonly userUuid: string;
  readonly focusModeUuid: string;
  readonly focusedGoals: Array<{
    goalUuid: string;
    goalName: string;
    progressBefore: number;      // 聚焦前进度
    progressAfter: number;       // 聚焦后进度
    progressDelta: number;       // 进度变化
  }>;
  readonly focusDuration: number;          // 聚焦时长（天）
  readonly avgDailyProgress: number;       // 平均每日进展
  readonly effectivenessScore: number;     // 成效评分 (0-100)
  readonly completedAt: number;
}
```

#### 更新用户实体：User

**位置**: `packages/contracts/src/modules/account/entities/UserServer.ts`

```typescript
export interface UserServerDTO {
  // ...existing fields...
  
  // 聚焦模式相关
  readonly activeFocusMode?: FocusModeServerDTO;    // 当前激活的聚焦模式
  readonly focusModeHistory?: FocusModeHistoryServerDTO[]; // 聚焦历史
}
```

---

### 交互设计

#### 1. 聚焦目标数量限制

- ✅ 最少 1 个目标
- ✅ 最多 3 个目标（推荐 1-2 个）
- ⚠️ 超过 3 个时显示警告："聚焦目标过多可能降低聚焦效果"

#### 2. UI 聚焦状态指示

| 位置 | 指示方式 |
|------|---------|
| 顶部导航栏 | 🎯 图标 + "聚焦中" |
| 目标列表 | 聚焦目标带 ⭐ 标记 |
| 侧边栏 | 只显示聚焦目标快捷入口 |
| 仪表盘 | 聚焦状态卡片（剩余天数） |

#### 3. 聚焦模式与其他功能的交互

| 功能 | 聚焦模式行为 |
|------|------------|
| 创建新目标 | 询问是否加入聚焦（如未满 3 个） |
| 删除聚焦目标 | 警告并询问是否退出聚焦 |
| 任务列表 | 只显示关联聚焦目标的任务 |
| 提醒 | 优先级提升聚焦目标相关提醒 |
| 搜索 | 默认只搜索聚焦目标（可切换全局搜索） |

---

## 4. MVP/MMP/Full 路径

### MVP: 基础聚焦模式（1-1.5 周）

**范围**:
- ✅ 开启/退出聚焦模式（选择 1-3 个目标）
- ✅ 设置聚焦周期（本周/本月/自定义）
- ✅ 隐藏非聚焦目标（完全隐藏模式）
- ✅ "查看全部"临时查看功能
- ✅ 聚焦状态栏显示（剩余天数）
- ✅ 聚焦到期自动退出

**技术要点**:
- Contracts: 定义 `FocusModeServerDTO`
- Domain: User 聚合根添加 `activateFocusMode()` 方法
- Application: `ActivateFocusModeService` 应用服务
- Infrastructure: 定时任务检查聚焦到期
- API: `POST /api/v1/focus-mode/activate`, `DELETE /api/v1/focus-mode/deactivate`
- UI: 聚焦配置面板 + 聚焦状态栏

**验收标准**:
```gherkin
Given 用户有 5 个目标
When 用户开启聚焦模式，选择 2 个目标，周期为本月
Then 目标列表应只显示 2 个聚焦目标
And 其他 3 个目标应被隐藏
And 顶部应显示"🎯 聚焦模式（剩余 10 天）"
And 用户可通过"查看全部"临时查看隐藏目标
```

---

### MMP: 聚焦效果分析（+1-2 周）

**在 MVP 基础上新增**:
- ✅ 聚焦历史记录
- ✅ 聚焦效果分析（进度对比）
- ✅ 成效评分算法
- ✅ 延长/缩短聚焦周期
- ✅ 调整聚焦目标（中途添加/移除）
- ✅ 多种隐藏模式（隐藏/折叠/降优先级）

**技术要点**:
- 进度快照对比（聚焦前 vs 聚焦后）
- 成效评分算法（基于进度增长率）
- 聚焦历史可视化

**验收标准**:
```gherkin
Given 用户完成了 1 个月的聚焦
When 聚焦周期结束
Then 系统应自动生成聚焦成果报告
And 报告应包含：聚焦目标进展、非聚焦目标进展、成效评分
And 用户可在聚焦历史中查看完整报告
```

---

### Full Release: 智能聚焦推荐（+2-3 周）

**在 MMP 基础上新增**:
- ✅ 智能推荐聚焦目标（基于截止日期、优先级、进度）
- ✅ 聚焦模板（如"季度冲刺"、"紧急攻坚"）
- ✅ 团队聚焦模式（团队成员同步聚焦同一目标）
- ✅ 聚焦提醒增强（每日聚焦进展推送）
- ✅ 聚焦成就系统（连续聚焦徽章）

**技术要点**:
- 推荐算法（多维度评分）
- 团队聚焦同步机制
- 成就系统设计

**验收标准**:
```gherkin
Given 用户有 3 个目标即将到期
When 系统检测到用户未开启聚焦
Then 系统应推荐："建议开启聚焦模式，聚焦即将到期的 3 个目标"
And 提供一键开启聚焦功能
```

---

## 5. 验收标准（Gherkin）

### Feature: 专注周期聚焦模式

#### Scenario 1: 开启聚焦模式

```gherkin
Feature: 专注周期聚焦模式
  作为目标负责人，我希望开启聚焦模式专注少数关键目标

  Background:
    Given 用户"郑十"已登录
    And 用户有以下目标：
      | uuid    | name           | progress |
      | goal-1  | Q4 收入增长    | 65%      |
      | goal-2  | 新产品上线     | 45%      |
      | goal-3  | 团队效能提升   | 30%      |
      | goal-4  | 技术债清理     | 20%      |
      | goal-5  | 知识库建设     | 10%      |

  Scenario: 开启聚焦模式并选择目标
    When 用户点击"聚焦模式"
    And 选择聚焦目标：goal-1, goal-2
    And 设置聚焦周期："本月"（2025-10-01 ~ 2025-10-31）
    And 选择隐藏模式："完全隐藏"
    And 点击"开启聚焦"
    Then 系统应创建 FocusMode 记录：
      | 字段              | 值                     |
      | focusedGoalUuids  | [goal-1, goal-2]      |
      | startTime         | 2025-10-01 00:00:00   |
      | endTime           | 2025-10-31 23:59:59   |
      | hiddenGoalsMode   | hide                  |
      | isActive          | true                  |
    And 用户的 activeFocusMode 应设置为此 FocusMode
    And 目标列表应只显示 goal-1 和 goal-2
    And 顶部应显示"🎯 聚焦模式（剩余 10 天）"

  Scenario: 聚焦目标数量限制
    When 用户尝试选择 4 个聚焦目标
    Then 系统应显示警告："建议聚焦 1-3 个目标，过多目标会降低聚焦效果"
    And "开启聚焦"按钮应禁用
```

---

#### Scenario 2: 聚焦模式下的 UI 行为

```gherkin
  Background:
    Given 用户已开启聚焦模式
    And 聚焦目标为：goal-1, goal-2
    And 隐藏目标为：goal-3, goal-4, goal-5

  Scenario: 目标列表只显示聚焦目标
    When 用户打开目标列表页
    Then 列表应只显示 2 个目标：
      | uuid   | name         | 标记 |
      | goal-1 | Q4 收入增长  | ⭐   |
      | goal-2 | 新产品上线   | ⭐   |
    And 列表顶部应显示："📌 聚焦目标（2 个）"
    And 底部应提示："💡 聚焦模式下，其他 3 个目标已临时隐藏"
    And 应显示"查看全部"按钮

  Scenario: 仪表盘只显示聚焦目标数据
    When 用户打开仪表盘
    Then 目标进度卡片应只显示 goal-1 和 goal-2
    And 任务列表应只显示与 goal-1, goal-2 关联的任务
    And 侧边栏应只显示聚焦目标快捷入口
```

---

#### Scenario 3: 临时查看隐藏目标

```gherkin
  Background:
    Given 用户在聚焦模式下

  Scenario: 点击"查看全部"
    When 用户点击"查看全部"按钮
    Then 系统应显示所有 5 个目标
    And 聚焦目标（goal-1, goal-2）应高亮显示或置顶
    And 隐藏目标（goal-3, goal-4, goal-5）应灰色显示
    And 顶部应显示："🎯 所有目标（聚焦模式临时暂停）"
    And 应显示"返回聚焦模式"按钮

  Scenario: 操作隐藏目标后自动返回聚焦
    Given 用户已点击"查看全部"
    When 用户更新 goal-3 的进度
    And 保存更改
    Then 系统应自动返回聚焦视图
    And 只显示 goal-1 和 goal-2
```

---

#### Scenario 4: 调整聚焦周期

```gherkin
  Background:
    Given 用户在聚焦模式下
    And 聚焦结束时间为 2025-10-31

  Scenario: 延长聚焦周期
    When 用户点击聚焦状态栏
    And 点击"延长聚焦"
    And 选择新结束时间："2025-11-15"
    And 确认
    Then FocusMode 的 endTime 应更新为 2025-11-15 23:59:59
    And 聚焦状态栏应显示"🎯 聚焦模式（剩余 25 天）"

  Scenario: 提前结束聚焦
    When 用户点击"提前结束"
    And 确认退出聚焦模式
    Then FocusMode 的 isActive 应变为 false
    And actualEndTime 应记录当前时间
    And 所有 5 个目标应恢复显示
    And 聚焦历史应创建一条记录
```

---

#### Scenario 5: 聚焦周期自动结束

```gherkin
  Background:
    Given 用户在聚焦模式下
    And 聚焦结束时间为 2025-10-31 23:59:59
    And 当前时间为 2025-10-31 22:00:00

  Scenario: 聚焦到期自动退出
    When 时间到达 2025-11-01 00:00:00
    And 系统执行定时任务
    Then FocusMode 的 isActive 应变为 false
    And 聚焦历史应创建一条记录：
      | 字段                | 值                   |
      | focusDuration       | 31（天）             |
      | avgDailyProgress    | 根据实际进展计算      |
      | effectivenessScore  | 根据算法计算         |
    And 用户登录时应收到通知："🎯 聚焦模式已结束"
    And 通知应包含聚焦成果摘要
```

---

#### Scenario 6: 查看聚焦历史

```gherkin
  Background:
    Given 用户有以下聚焦历史：
      | startTime  | endTime    | focusedGoals         | duration | effectivenessScore |
      | 2025-10-01 | 2025-10-31 | Q4收入,新产品        | 31       | 85                 |
      | 2025-09-01 | 2025-09-15 | 技术债清理           | 15       | 70                 |

  Scenario: 查看聚焦历史列表
    When 用户打开"聚焦历史"页面
    Then 系统应显示 2 条历史记录
    And 第一条应显示：
      | 字段       | 值                          |
      | 标题       | 2025-10 月聚焦（已完成）    |
      | 聚焦目标   | Q4 收入增长、新产品上线     |
      | 聚焦时长   | 31 天                       |
      | 成效评分   | ⭐⭐⭐⭐⭐（优秀）          |

  Scenario: 查看聚焦效果详情
    When 用户点击"2025-10 月聚焦"
    Then 系统应显示聚焦效果分析
    And 分析应包含：
      | 部分           | 内容                                |
      | 聚焦目标进展   | Q4收入 65%→80%, 新产品 45%→95%     |
      | 非聚焦目标进展 | 团队效能 +3%, 技术债 +2%            |
      | 结论           | 聚焦模式显著提升关键目标进展        |
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 开启聚焦模式
{
  event: 'focus_mode_activated',
  properties: {
    focusedGoalCount: number,
    focusDuration: number,  // 天数
    hiddenGoalsMode: string,
    totalGoalsCount: number
  }
}

// 退出聚焦模式
{
  event: 'focus_mode_deactivated',
  properties: {
    isAutoExit: boolean,     // 是否自动到期退出
    actualDuration: number,  // 实际聚焦天数
    plannedDuration: number, // 计划聚焦天数
    exitReason: 'completed' | 'early_exit' | 'user_cancel'
  }
}

// 查看全部目标
{
  event: 'focus_mode_view_all_goals',
  properties: {
    currentFocusedGoals: number,
    hiddenGoalsCount: number
  }
}

// 聚焦历史查看
{
  event: 'focus_mode_history_viewed',
  properties: {
    historyCount: number,
    avgEffectivenessScore: number
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 聚焦模式使用率 | >30% | 开启聚焦的用户数 / 总用户数 |
| 聚焦目标平均进展提升 | +50% | 聚焦期间进展 vs 非聚焦期间 |
| 聚焦周期完成率 | >70% | 完整完成周期数 / 开启次数 |
| 提前退出率 | <20% | 提前退出次数 / 总开启次数 |

**定性指标**:
- 用户反馈"聚焦模式帮助我更专注"
- 关键目标按时达成率提升
- 多目标并行导致的焦虑感下降

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model FocusMode {
  uuid                String   @id @default(uuid())
  userUuid            String   @map("user_uuid")
  focusedGoalUuids    Json     @map("focused_goal_uuids")  // string[]
  startTime           BigInt   @map("start_time")
  endTime             BigInt   @map("end_time")
  hiddenGoalsMode     String   @map("hidden_goals_mode")
  isActive            Boolean  @default(true) @map("is_active")
  actualEndTime       BigInt?  @map("actual_end_time")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  user                Account  @relation(fields: [userUuid], references: [uuid])
  
  @@index([userUuid, isActive])
  @@map("focus_modes")
}

model FocusModeHistory {
  uuid                String   @id @default(uuid())
  userUuid            String   @map("user_uuid")
  focusModeUuid       String   @map("focus_mode_uuid")
  focusedGoals        Json     @map("focused_goals")  // Array<{goalUuid, goalName, progressBefore, progressAfter, progressDelta}>
  focusDuration       Int      @map("focus_duration")
  avgDailyProgress    Float    @map("avg_daily_progress")
  effectivenessScore  Int      @map("effectiveness_score")
  completedAt         BigInt   @map("completed_at")
  
  user                Account  @relation(fields: [userUuid], references: [uuid])
  
  @@index([userUuid, completedAt(sort: Desc)])
  @@map("focus_mode_histories")
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/goal/application/ActivateFocusModeService.ts

export class ActivateFocusModeService {
  async execute(
    userUuid: string,
    focusedGoalUuids: string[],
    endTime: number,
    hiddenGoalsMode: HiddenGoalsMode
  ): Promise<FocusMode> {
    // 校验聚焦目标数量（1-3 个）
    if (focusedGoalUuids.length < 1 || focusedGoalUuids.length > 3) {
      throw new Error('聚焦目标数量应为 1-3 个');
    }
    
    // 检查是否已有激活的聚焦模式
    const existingFocusMode = await this.focusModeRepository.findActiveByUser(userUuid);
    if (existingFocusMode) {
      throw new Error('已有激活的聚焦模式，请先退出');
    }
    
    // 创建聚焦模式
    const focusMode = new FocusMode({
      userUuid,
      focusedGoalUuids,
      startTime: Date.now(),
      endTime,
      hiddenGoalsMode,
      isActive: true
    });
    
    // 保存
    await this.focusModeRepository.save(focusMode);
    
    // 发布事件
    await this.eventBus.publish(
      new FocusModeActivatedEvent({
        userUuid,
        focusModeUuid: focusMode.uuid,
        focusedGoalCount: focusedGoalUuids.length
      })
    );
    
    return focusMode;
  }
}
```

### API 端点

```typescript
// 开启聚焦模式
POST /api/v1/focus-mode/activate
Body: {
  focusedGoalUuids: string[],
  endTime: number,
  hiddenGoalsMode: 'hide' | 'collapse' | 'deprioritize'
}
Response: FocusModeClientDTO

// 退出聚焦模式
DELETE /api/v1/focus-mode/deactivate
Response: { success: boolean }

// 延长聚焦周期
PATCH /api/v1/focus-mode/extend
Body: { newEndTime: number }
Response: FocusModeClientDTO

// 获取聚焦历史
GET /api/v1/focus-mode/history
Response: { history: FocusModeHistoryClientDTO[] }

// 获取当前聚焦状态
GET /api/v1/focus-mode/current
Response: FocusModeClientDTO | null
```

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 用户忘记退出聚焦模式 | 中 | 中 | 自动到期 + 延期提醒 |
| 隐藏目标被遗忘 | 中 | 中 | 每周发送隐藏目标提醒 + "查看全部"按钮 |
| 聚焦目标选择不当 | 中 | 中 | 智能推荐 + 允许中途调整 |
| 团队协作时目标被隐藏 | 低 | 高 | 团队视图不受聚焦影响 |

---

## 9. 后续增强方向

### Phase 2 功能
- 🔄 智能推荐聚焦目标（基于截止日期、进度、优先级）
- 👥 团队聚焦模式（团队同步聚焦）
- 📊 聚焦效果对比分析（聚焦 vs 非聚焦）
- 🏆 聚焦成就系统（连续聚焦徽章）

### Phase 3 功能
- 🤖 AI 聚焦助手（分析工作模式，推荐最佳聚焦策略）
- 📱 聚焦模式移动端优化
- 🔔 聚焦进展每日推送
- 📈 聚焦效果趋势预测

---

## 10. 参考资料

- [Goal Contracts](../../../../packages/contracts/src/modules/goal/)
- [番茄工作法](https://en.wikipedia.org/wiki/Pomodoro_Technique)
- [深度工作理论（Deep Work）](https://www.calnewport.com/books/deep-work/)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:
- 创建: 2025-10-21
- 创建者: PO Agent  
- 版本: 1.0
- 下次更新: Sprint Planning 前
