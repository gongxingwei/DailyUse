# Feature Spec: 目标任务关联

> **功能编号**: GOAL-005  
> **RICE 评分**: 224 (Reach: 8, Impact: 7, Confidence: 8, Effort: 2)  
> **优先级**: P1  
> **预估时间**: 1.5-2 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

目标管理的核心在于将宏观目标拆解为可执行的具体任务，但现有工具普遍存在以下问题：

- ❌ 目标和任务分离管理，无法建立清晰的层级关系
- ❌ 任务完成后，目标进度不自动更新
- ❌ 难以追溯任务对目标的贡献度
- ❌ 无法快速查看目标下的所有任务
- ❌ 任务和 KR 之间的关联不明确

### 目标用户

- **主要用户**: 使用 OKR/KPI 进行目标管理的个人和团队
- **次要用户**: 需要项目拆解和任务追踪的项目经理
- **典型画像**: "我设定了季度目标，但不知道每天的任务如何推动目标达成"

### 价值主张

**一句话价值**: 建立目标与任务的双向关联，任务完成自动推动目标进度

**核心收益**:

- ✅ 一键将任务关联到目标/KR
- ✅ 任务完成自动更新 KR 进度
- ✅ 可视化目标任务分解树
- ✅ 任务贡献度分析
- ✅ 未关联任务提醒

---

## 2. 用户价值与场景

### 核心场景 1: 创建任务时关联目标

**场景描述**:  
用户创建新任务时，可选择关联到某个目标或 KR。

**用户故事**:

```gherkin
As a 目标管理者
I want 创建任务时关联到目标
So that 明确任务对目标的贡献
```

**操作流程**:

1. 用户创建新任务："完成用户认证模块开发"
2. 在任务创建表单中看到"关联目标"选项：
   ```
   ┌─────────────────────────────────────┐
   │ 创建任务                            │
   ├─────────────────────────────────────┤
   │ 标题: 完成用户认证模块开发          │
   │ 描述: ...                           │
   │ 优先级: HIGH                        │
   │ 截止日期: 2025-11-01                │
   │                                     │
   │ 🎯 关联目标 (可选)                  │
   │ ┌───────────────────────────────┐   │
   │ │ 搜索目标或 KR...              │   │
   │ └───────────────────────────────┘   │
   │                                     │
   │ 推荐关联：                          │
   │ 📊 Q4 产品上线                      │
   │    └─ KR1: 完成核心功能开发 (60%) │
   │       [关联到此 KR]                │
   │                                     │
   │ 📊 技术债务清理                     │
   │    └─ KR2: 重构 3 个核心模块      │
   │       [关联到此 KR]                │
   │                                     │
   │ [浏览全部目标]                      │
   └─────────────────────────────────────┘
   ```
3. 用户点击"关联到此 KR"（Q4 产品上线 - KR1）
4. 系统创建关联记录：
   ```typescript
   {
     taskUuid: 'task-123',
     goalUuid: 'goal-456',
     keyResultUuid: 'kr-789',
     contributionWeight: 10,  // 默认权重
     linkType: 'contributes_to'
   }
   ```
5. 任务卡片显示关联信息：
   ```
   ┌─────────────────────────────────────┐
   │ ✓ 完成用户认证模块开发              │
   │ 优先级: HIGH  |  截止: 2025-11-01   │
   │                                     │
   │ 🎯 关联目标:                        │
   │    Q4 产品上线 > KR1: 完成核心功能  │
   │    贡献度: 10%                      │
   │                                     │
   │ [查看目标详情]  [调整贡献度]        │
   └─────────────────────────────────────┘
   ```

**预期结果**:

- 任务成功关联到 KR
- 显示关联路径（目标 > KR > 任务）
- 设定默认贡献度权重

---

### 核心场景 2: 任务完成自动更新 KR 进度

**场景描述**:  
当关联任务完成时，自动推动 KR 进度更新。

**用户故事**:

```gherkin
As a 目标管理者
I want 任务完成后 KR 进度自动更新
So that 我不需要手动维护目标进度
```

**操作流程**:

1. KR 当前状态：

   ```
   KR1: 完成核心功能开发
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   当前进度: 60%
   关联任务: 5 个（3 已完成，2 进行中）

   任务列表：
   ✅ 用户注册功能 (贡献度: 15%)
   ✅ 用户登录功能 (贡献度: 15%)
   ✅ 用户认证模块 (贡献度: 10%)
   🔄 权限管理模块 (贡献度: 20%)
   ⏳ 数据导出功能 (贡献度: 10%)

   总贡献度: 70% (已分配)
   剩余可分配: 30%
   ```

2. 用户将"权限管理模块"标记为完成
3. 系统触发 KR 进度更新逻辑：

   ```typescript
   // 计算 KR 进度
   const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
   const totalContribution = completedTasks.reduce((sum, t) => sum + t.contributionWeight, 0);

   // 更新 KR 进度
   kr.currentProgress = totalContribution; // 60% → 80%
   ```

4. 系统发送通知：

   ```
   🎉 目标进度更新
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   您完成了任务"权限管理模块"

   KR 进度已更新：
   📊 KR1: 完成核心功能开发
   60% ━━━━━━━━━━━━━━━━━━━━ 80% (+20%)

   剩余任务: 1 个
   预计完成日期: 2025-11-05

   [查看目标详情]
   ```

5. 目标详情页自动刷新进度

**预期结果**:

- KR 进度自动从 60% 更新到 80%
- 发送进度更新通知
- 触发目标进度重新计算（如果 KR 有权重）

---

### 核心场景 3: 可视化目标任务分解树

**场景描述**:  
用户以树形结构查看目标的完整任务分解。

**用户故事**:

```gherkin
As a 目标管理者
I want 查看目标的任务分解树
So that 我可以全局了解目标执行情况
```

**操作流程**:

1. 用户打开目标详情页
2. 点击"任务分解树"标签
3. 系统展示树形结构：

   ```
   📊 Q4 产品上线 (总进度: 65%)
   ├─ 📈 KR1: 完成核心功能开发 (80%)
   │  ├─ ✅ 用户注册功能 (15%)
   │  ├─ ✅ 用户登录功能 (15%)
   │  ├─ ✅ 用户认证模块 (10%)
   │  ├─ ✅ 权限管理模块 (20%)
   │  └─ ⏳ 数据导出功能 (10%)
   │
   ├─ 📈 KR2: 完成性能优化 (60%)
   │  ├─ ✅ 数据库查询优化 (20%)
   │  ├─ ✅ 前端打包优化 (20%)
   │  ├─ 🔄 CDN 部署 (15%)
   │  └─ ⏳ 缓存策略实施 (15%)
   │
   └─ 📈 KR3: 通过 UAT 测试 (50%)
      ├─ ✅ 编写测试用例 (20%)
      ├─ 🔄 执行功能测试 (20%)
      └─ ⏳ 修复 Bug (30%)

   图例：
   ✅ 已完成  🔄 进行中  ⏳ 未开始  ❌ 已取消

   统计：
   总任务数: 13
   已完成: 6 (46%)
   进行中: 3 (23%)
   未开始: 4 (31%)

   [展开全部]  [收起]  [导出]
   ```

4. 用户点击某个任务节点
5. 系统显示任务详情弹窗
6. 用户点击"导出"
7. 系统生成 Markdown/Excel 格式的分解树

**预期结果**:

- 树形可视化展示
- 支持展开/收起
- 显示各层级进度
- 可导出

---

### 核心场景 4: 调整任务贡献度权重

**场景描述**:  
用户可动态调整任务对 KR 的贡献度权重。

**用户故事**:

```gherkin
As a 目标管理者
I want 调整任务的贡献度权重
So that 准确反映任务对目标的价值
```

**操作流程**:

1. 用户打开 KR 详情页，查看关联任务：

   ```
   KR1: 完成核心功能开发
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   关联任务贡献度分配：

   ✅ 用户注册功能
      贡献度: 15% [━━━━━━━━━━━━━━━░░░░░]
      [调整]

   ✅ 用户登录功能
      贡献度: 15% [━━━━━━━━━━━━━━━░░░░░]
      [调整]

   🔄 权限管理模块
      贡献度: 20% [━━━━━━━━━━━━━━━━━━━━░]
      [调整]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   已分配: 70%
   剩余: 30%

   ⚠️ 建议：还有 30% 未分配，考虑添加更多任务

   [批量调整]  [自动分配]
   ```

2. 用户发现"权限管理模块"实际更重要，点击"调整"
3. 弹出权重调整窗口：

   ```
   调整贡献度
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   任务: 权限管理模块
   当前贡献度: 20%

   新贡献度: [━━━━━━━━━━━━━━━━━━░░] 30%

   💡 提示：
   - 调整后剩余可分配: 20%
   - 该任务完成后，KR 进度将从 60% 提升至 70%

   [确认]  [取消]
   ```

4. 用户确认调整
5. 系统更新贡献度并重新计算 KR 进度
6. 系统提示其他相关任务是否需要调整

**预期结果**:

- 支持单个任务权重调整
- 实时显示调整后的影响
- 总权重不超过 100% 的校验
- 自动重新计算 KR 进度

---

### 核心场景 5: 未关联任务提醒

**场景描述**:  
系统检测到大量未关联目标的任务，提醒用户建立关联。

**用户故事**:

```gherkin
As a 目标管理者
I want 被提醒未关联目标的任务
So that 确保所有工作都对准目标
```

**操作流程**:

1. 用户登录系统
2. 系统检测到 10 个未关联目标的高优先级任务
3. 显示提醒卡片：

   ```
   ⚠️ 未关联目标的任务
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   您有 10 个高优先级任务尚未关联到任何目标

   这可能意味着：
   • 这些任务缺少明确的目标导向
   • 可能需要重新评估任务的价值

   建议操作：
   1. 将任务关联到现有目标
   2. 创建新目标承接这些任务
   3. 调整任务优先级

   未关联任务示例：
   🔴 优化数据库性能 (HIGH)
   🔴 重构前端架构 (HIGH)
   🟡 更新文档 (MEDIUM)

   [立即处理]  [忽略]  [不再提醒]
   ```

4. 用户点击"立即处理"
5. 系统进入批量关联模式：

   ```
   批量关联任务到目标
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   未关联任务 (10)          可用目标 (3)

   ┌─────────────────┐    ┌─────────────────┐
   │ ☑️ 优化数据库    │───→│ 📊 Q4 产品上线  │
   │ ☑️ 重构前端架构  │    │ 📊 技术债务清理 │
   │ ☐ 更新文档      │    │ 📊 团队效能提升 │
   │ ☐ ...           │    └─────────────────┘
   └─────────────────┘

   智能推荐：
   💡 "优化数据库" 推荐关联到 "Q4 产品上线 > KR2"
      理由：标签匹配 (#性能优化)

   [应用推荐]  [手动关联]  [跳过]
   ```

6. 用户选择推荐或手动关联
7. 系统批量创建关联

**预期结果**:

- 自动检测未关联任务
- 提供智能推荐
- 支持批量操作

---

### 核心场景 6: 目标任务看板视图

**场景描述**:  
用户以看板形式查看目标下的所有任务。

**用户故事**:

```gherkin
As a 目标管理者
I want 以看板形式查看目标任务
So that 直观了解任务执行状态
```

**操作流程**:

1. 用户打开目标详情页
2. 点击"任务看板"标签
3. 系统展示看板视图：

   ```
   目标: Q4 产品上线
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   待处理 (4)        进行中 (3)        已完成 (6)
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │数据导出  │     │CDN 部署  │     │用户注册  │
   │功能      │     │          │     │功能      │
   │🎯 KR1    │     │🎯 KR2    │     │🎯 KR1    │
   │📅 11-05  │     │📅 10-28  │     │✓ 10-15   │
   │贡献:10%  │     │贡献:15%  │     │贡献:15%  │
   └──────────┘     └──────────┘     └──────────┘

   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │缓存策略  │     │功能测试  │     │用户登录  │
   │实施      │     │          │     │功能      │
   │🎯 KR2    │     │🎯 KR3    │     │🎯 KR1    │
   │📅 11-10  │     │📅 10-25  │     │✓ 10-16   │
   │贡献:15%  │     │贡献:20%  │     │贡献:15%  │
   └──────────┘     └──────────┘     └──────────┘

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   按 KR 筛选: [全部] [KR1] [KR2] [KR3]
   排序: [截止日期] [贡献度] [优先级]

   [+ 新建任务]
   ```

4. 用户拖拽"数据导出功能"到"进行中"列
5. 系统更新任务状态
6. 用户点击"KR1"筛选
7. 看板仅显示关联到 KR1 的任务

**预期结果**:

- 看板视图展示任务
- 显示关联的 KR
- 支持拖拽更新状态
- 支持按 KR 筛选

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：GoalTaskLink（目标任务关联）

**位置**: `packages/contracts/src/modules/goal/entities/GoalTaskLinkServer.ts`

```typescript
/**
 * 目标任务关联
 */
export interface GoalTaskLinkServerDTO {
  readonly uuid: string;
  readonly goalUuid: string; // 目标 UUID
  readonly keyResultUuid?: string; // KR UUID（可选，直接关联目标）
  readonly taskUuid: string; // 任务 UUID
  readonly contributionWeight: number; // 贡献度权重（0-100）
  readonly linkType: GoalTaskLinkType;
  readonly autoCreated: boolean; // 是否自动创建
  readonly metadata?: LinkMetadata;
  readonly createdBy: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 关联类型
 */
export enum GoalTaskLinkType {
  CONTRIBUTES_TO = 'contributes_to', // 贡献于（默认）
  SUPPORTS = 'supports', // 支持
  PREREQUISITE = 'prerequisite', // 前置条件
  MILESTONE = 'milestone', // 里程碑
}

/**
 * 关联元数据
 */
export interface LinkMetadata {
  readonly reason?: string; // 关联理由
  readonly autoLinkedByTags?: string[]; // 自动关联的标签
  readonly estimatedImpact?: number; // 预估影响（0-1）
}
```

#### 更新 Goal 实体

**位置**: `packages/contracts/src/modules/goal/entities/GoalServer.ts`

```typescript
export interface GoalServerDTO {
  // ...existing fields...

  // 任务关联相关
  readonly linkedTasks?: GoalTaskLinkServerDTO[];
  readonly totalTaskCount?: number;
  readonly completedTaskCount?: number;
  readonly taskCompletionRate?: number; // 任务完成率
}
```

#### 更新 KeyResult 实体

**位置**: `packages/contracts/src/modules/goal/entities/KeyResultServer.ts`

```typescript
export interface KeyResultServerDTO {
  // ...existing fields...

  // 任务关联相关
  readonly linkedTasks?: GoalTaskLinkServerDTO[];
  readonly totalContributionWeight?: number; // 已分配的总贡献度
  readonly remainingWeight?: number; // 剩余可分配权重
}
```

#### 更新 Task 实体

**位置**: `packages/contracts/src/modules/task/entities/TaskServer.ts`

```typescript
export interface TaskServerDTO {
  // ...existing fields...

  // 目标关联相关
  readonly goalLinks?: GoalTaskLinkServerDTO[];
  readonly primaryGoalUuid?: string; // 主要关联目标
  readonly contributesToGoals?: string[]; // 贡献的目标 UUID 列表
}
```

---

### 交互设计

#### 1. 关联创建方式

| 方式       | 触发场景       | 权重设置         |
| ---------- | -------------- | ---------------- |
| 任务创建时 | 创建任务表单   | 默认 10%         |
| 目标详情页 | 点击"添加任务" | 自动计算剩余权重 |
| 批量关联   | 未关联任务提醒 | 平均分配         |
| 自动推荐   | 标签匹配       | 根据相似度       |

#### 2. 进度计算逻辑

```typescript
// KR 进度计算（基于任务贡献度）
function calculateKRProgress(kr: KeyResult): number {
  const links = kr.linkedTasks || [];
  const completedContribution = links
    .filter((link) => link.task.status === 'COMPLETED')
    .reduce((sum, link) => sum + link.contributionWeight, 0);

  return Math.min(completedContribution, 100);
}

// 目标进度计算（基于 KR 权重和任务贡献）
function calculateGoalProgress(goal: Goal): number {
  const krs = goal.keyResults || [];

  const weightedProgress = krs.reduce((sum, kr) => {
    const krProgress = calculateKRProgress(kr);
    return sum + (krProgress * kr.weight) / 100;
  }, 0);

  return Math.round(weightedProgress);
}
```

#### 3. 贡献度权重规则

| 规则         | 说明              |
| ------------ | ----------------- |
| 单个任务上限 | ≤ 50%             |
| KR 总权重    | ≤ 100%            |
| 警告阈值     | 超过 90% 提示     |
| 默认权重     | 10%               |
| 自动分配     | 剩余权重 / 任务数 |

---

## 4. MVP/MMP/Full 路径

### MVP: 基础关联功能（1-1.5 周）

**范围**:

- ✅ 创建任务时关联目标/KR
- ✅ 手动设置贡献度权重
- ✅ 任务完成自动更新 KR 进度
- ✅ 目标详情页显示关联任务列表
- ✅ 简单的任务分解树（两层）

**技术要点**:

- Contracts: 定义 `GoalTaskLinkServerDTO`
- Domain: Goal 聚合根添加 `linkTask()` 方法
- Application: `GoalTaskLinkService` 应用服务
- API: `POST /api/v1/goals/:uuid/tasks`, `GET /api/v1/goals/:uuid/tasks`
- UI: 关联选择器 + 任务列表

**验收标准**:

```gherkin
Given 用户创建新任务
When 关联到某个 KR 并设置贡献度 20%
And 完成该任务
Then KR 进度应自动增加 20%
And 目标详情页应显示该任务
```

---

### MMP: 智能推荐与可视化（+1 周）

**在 MVP 基础上新增**:

- ✅ 基于标签的自动关联推荐
- ✅ 贡献度权重智能建议
- ✅ 未关联任务检测与提醒
- ✅ 批量关联操作
- ✅ 完整的任务分解树（多层）
- ✅ 任务看板视图

**技术要点**:

- 推荐算法（标签相似度）
- 定时任务检测未关联任务
- 树形结构渲染（递归组件）

**验收标准**:

```gherkin
Given 用户创建带 #性能优化 标签的任务
When 存在目标"技术债务清理"也有 #性能优化 标签
Then 系统应推荐关联到该目标
And 显示推荐理由
```

---

### Full Release: 高级分析与优化（+1.5 周）

**在 MMP 基础上新增**:

- ✅ 任务贡献度分析报告
- ✅ 目标任务健康度检测（过度/不足分配）
- ✅ 关联关系图谱
- ✅ 任务路径分析（A→B→C 依赖链）
- ✅ 历史关联模式学习
- ✅ 跨目标任务冲突检测

**技术要点**:

- 图算法（路径分析）
- 机器学习（关联模式）
- 冲突检测算法

**验收标准**:

```gherkin
Given 某个 KR 关联了 8 个任务，总贡献度 120%
When 系统执行健康度检测
Then 应警告"贡献度超过 100%"
And 建议调整权重
```

---

## 5. 验收标准（Gherkin）

### Feature: 目标任务关联

#### Scenario 1: 创建任务时关联目标

```gherkin
Feature: 目标任务关联
  作为目标管理者，我希望将任务关联到目标

  Background:
    Given 用户"郑十"已登录
    And 存在目标：
      | uuid    | title          | status  |
      | goal-1  | Q4 产品上线    | IN_PROGRESS |
    And 目标有 KR：
      | uuid  | title              | weight | progress |
      | kr-1  | 完成核心功能开发   | 50     | 60       |
      | kr-2  | 完成性能优化       | 30     | 40       |

  Scenario: 任务创建时选择关联
    When 用户创建新任务"用户认证模块"
    And 选择关联到 kr-1
    And 设置贡献度为 15%
    Then 应创建关联记录：
      | 字段               | 值              |
      | goalUuid           | goal-1          |
      | keyResultUuid      | kr-1            |
      | taskUuid           | 新任务 UUID     |
      | contributionWeight | 15              |
      | linkType           | contributes_to  |
    And 任务详情应显示："关联到 Q4 产品上线 > KR1"
```

---

#### Scenario 2: 任务完成自动更新 KR 进度

```gherkin
  Background:
    Given kr-1 当前进度为 60%
    And kr-1 有关联任务：
      | taskUuid | status      | contributionWeight |
      | task-1   | COMPLETED   | 20                 |
      | task-2   | COMPLETED   | 25                 |
      | task-3   | IN_PROGRESS | 15                 |
      | task-4   | TODO        | 10                 |

  Scenario: 完成任务触发进度更新
    When 用户将 task-3 状态改为 COMPLETED
    Then kr-1 的进度应更新为：
      | 计算逻辑                       | 结果 |
      | 20 + 25 + 15 (已完成任务总贡献) | 60%  |
    And 应发送通知："KR1 进度从 45% 更新至 60%"
    And 目标"Q4 产品上线"的进度应重新计算
```

---

#### Scenario 3: 贡献度权重验证

```gherkin
  Background:
    Given kr-1 已分配贡献度 70%
    And 剩余可分配贡献度 30%

  Scenario: 超出权重限制
    When 用户尝试添加贡献度为 40% 的新任务
    Then 应提示错误："贡献度超出限制（剩余 30%）"
    And 建议："调整为 30% 或调整已有任务权重"
    And 不应创建关联

  Scenario: 单个任务权重过高
    When 用户尝试设置任务贡献度为 60%
    Then 应提示警告："单个任务贡献度过高（上限 50%）"
    And 提供选项："继续创建" 或 "调整为 50%"
```

---

#### Scenario 4: 任务分解树展示

```gherkin
  Background:
    Given goal-1 有以下 KR 和任务：
      | KR   | 任务           | 状态      |
      | kr-1 | task-1         | COMPLETED |
      | kr-1 | task-2         | COMPLETED |
      | kr-2 | task-3         | IN_PROGRESS |

  Scenario: 查看分解树
    When 用户打开 goal-1 详情页
    And 点击"任务分解树"
    Then 应显示树形结构：
      """
      📊 Q4 产品上线
      ├─ 📈 KR1: 完成核心功能开发
      │  ├─ ✅ task-1
      │  └─ ✅ task-2
      └─ 📈 KR2: 完成性能优化
         └─ 🔄 task-3
      """
    And 显示统计：总任务 3，已完成 2，进行中 1
```

---

#### Scenario 5: 未关联任务提醒

```gherkin
  Background:
    Given 用户有 15 个高优先级任务
    And 其中 10 个未关联任何目标
    And 用户偏好设置中启用了"未关联任务提醒"

  Scenario: 登录时检测并提醒
    When 用户登录系统
    Then 应显示提醒卡片：
      | 字段       | 值                              |
      | 标题       | 未关联目标的任务                |
      | 数量       | 10                              |
      | 优先级     | HIGH                            |
    And 提供操作：立即处理、忽略、不再提醒

    When 用户点击"立即处理"
    Then 应进入批量关联模式
    And 显示智能推荐（基于标签匹配）
```

---

#### Scenario 6: 智能关联推荐

```gherkin
  Background:
    Given 用户创建任务"数据库性能优化"
    And 任务标签为：#性能优化 #数据库
    And 存在目标"技术债务清理"，标签为：#性能优化 #重构

  Scenario: 基于标签推荐关联
    When 任务保存后
    Then 应显示推荐：
      | 目标             | 匹配标签     | 相似度 |
      | 技术债务清理     | #性能优化    | 75%    |
    And 推荐理由："标签匹配度 75%"
    And 提供"一键关联"按钮

    When 用户点击"一键关联"
    Then 应创建关联，贡献度默认为 10%
    And 发送通知："任务已关联到目标 技术债务清理"
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 创建关联
{
  event: 'goal_task_link_created',
  properties: {
    goalUuid: string,
    keyResultUuid?: string,
    taskUuid: string,
    contributionWeight: number,
    linkType: GoalTaskLinkType,
    source: 'manual' | 'recommended' | 'auto'
  }
}

// KR 进度自动更新
{
  event: 'kr_progress_auto_updated',
  properties: {
    keyResultUuid: string,
    oldProgress: number,
    newProgress: number,
    triggeredByTaskUuid: string
  }
}

// 贡献度调整
{
  event: 'contribution_weight_adjusted',
  properties: {
    linkUuid: string,
    oldWeight: number,
    newWeight: number
  }
}

// 查看分解树
{
  event: 'task_breakdown_tree_viewed',
  properties: {
    goalUuid: string,
    totalTasks: number,
    depth: number
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 任务关联率 | >70% | 关联任务数 / 总任务数 |
| 自动进度更新准确率 | >95% | 正确更新次数 / 总更新次数 |
| 推荐接受率 | >50% | 接受推荐数 / 推荐总数 |
| 分解树查看率 | >40% | 查看用户数 / 活跃用户数 |

**定性指标**:

- 用户反馈"目标和任务的关联更清晰"
- 进度追踪自动化程度提升
- 任务优先级更明确

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model GoalTaskLink {
  uuid                String   @id @default(uuid())
  goalUuid            String   @map("goal_uuid")
  keyResultUuid       String?  @map("key_result_uuid")
  taskUuid            String   @map("task_uuid")
  contributionWeight  Int      @map("contribution_weight")
  linkType            String   @map("link_type")
  autoCreated         Boolean  @default(false) @map("auto_created")
  metadata            Json?    @map("metadata")
  createdBy           String   @map("created_by")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  goal                Goal       @relation(fields: [goalUuid], references: [uuid])
  keyResult           KeyResult? @relation(fields: [keyResultUuid], references: [uuid])
  task                Task       @relation(fields: [taskUuid], references: [uuid])

  @@index([goalUuid])
  @@index([keyResultUuid])
  @@index([taskUuid])
  @@unique([taskUuid, keyResultUuid])
  @@map("goal_task_links")
}

// 更新 KeyResult 模型
model KeyResult {
  // ...existing fields...

  linkedTasks         GoalTaskLink[]

  @@map("key_results")
}

// 更新 Task 模型
model Task {
  // ...existing fields...

  goalLinks           GoalTaskLink[]

  @@map("tasks")
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/goal/application/GoalTaskLinkService.ts

export class GoalTaskLinkService {
  // 创建任务-目标关联
  async linkTaskToGoal(params: {
    goalUuid: string;
    keyResultUuid?: string;
    taskUuid: string;
    contributionWeight: number;
    linkType?: GoalTaskLinkType;
  }): Promise<GoalTaskLink> {
    const { goalUuid, keyResultUuid, taskUuid, contributionWeight, linkType } = params;

    // 验证贡献度
    if (keyResultUuid) {
      await this.validateContributionWeight(keyResultUuid, contributionWeight);
    }

    // 创建关联
    const link = new GoalTaskLink({
      goalUuid,
      keyResultUuid,
      taskUuid,
      contributionWeight,
      linkType: linkType || GoalTaskLinkType.CONTRIBUTES_TO,
      autoCreated: false,
    });

    await this.linkRepository.save(link);

    // 发送事件
    this.eventBus.publish(new TaskLinkedToGoalEvent({ linkUuid: link.uuid }));

    return link;
  }

  // 验证贡献度
  private async validateContributionWeight(
    keyResultUuid: string,
    newWeight: number,
  ): Promise<void> {
    const kr = await this.keyResultRepository.findByUuid(keyResultUuid);
    const existingLinks = await this.linkRepository.findByKeyResult(keyResultUuid);

    const totalAllocated = existingLinks.reduce((sum, link) => sum + link.contributionWeight, 0);

    if (totalAllocated + newWeight > 100) {
      throw new DomainError(
        `贡献度超出限制（剩余 ${100 - totalAllocated}%）`,
        'CONTRIBUTION_WEIGHT_EXCEEDED',
      );
    }

    if (newWeight > 50) {
      // 警告但不阻止
      this.logger.warn(`单个任务贡献度过高：${newWeight}%`);
    }
  }

  // 任务完成时更新 KR 进度
  async handleTaskCompleted(taskUuid: string): Promise<void> {
    const links = await this.linkRepository.findByTask(taskUuid);

    for (const link of links) {
      if (link.keyResultUuid) {
        await this.updateKRProgress(link.keyResultUuid);
      }
    }
  }

  // 更新 KR 进度
  private async updateKRProgress(keyResultUuid: string): Promise<void> {
    const kr = await this.keyResultRepository.findByUuid(keyResultUuid);
    const links = await this.linkRepository.findByKeyResult(keyResultUuid);

    const completedContribution = links
      .filter((link) => link.task.status === TaskStatus.COMPLETED)
      .reduce((sum, link) => sum + link.contributionWeight, 0);

    const newProgress = Math.min(completedContribution, 100);

    if (kr.currentProgress !== newProgress) {
      kr.updateProgress(newProgress);
      await this.keyResultRepository.save(kr);

      // 发送进度更新事件
      this.eventBus.publish(
        new KRProgressAutoUpdatedEvent({
          keyResultUuid,
          oldProgress: kr.currentProgress,
          newProgress,
        }),
      );
    }
  }

  // 智能推荐关联
  async recommendLinks(taskUuid: string): Promise<GoalTaskLinkRecommendation[]> {
    const task = await this.taskRepository.findByUuid(taskUuid);
    const goals = await this.goalRepository.findActive();

    const recommendations: GoalTaskLinkRecommendation[] = [];

    for (const goal of goals) {
      const similarity = this.calculateSimilarity(task, goal);

      if (similarity > 0.5) {
        recommendations.push({
          goalUuid: goal.uuid,
          taskUuid,
          similarity,
          reason: this.generateReason(task, goal),
          suggestedContribution: this.suggestContribution(goal),
        });
      }
    }

    return recommendations.sort((a, b) => b.similarity - a.similarity);
  }

  // 计算相似度（基于标签）
  private calculateSimilarity(task: Task, goal: Goal): number {
    const taskTags = new Set(task.tags);
    const goalTags = new Set(goal.tags);
    const intersection = new Set([...taskTags].filter((x) => goalTags.has(x)));
    const union = new Set([...taskTags, ...goalTags]);

    return intersection.size / union.size; // Jaccard 相似度
  }
}
```

### API 端点

```typescript
// 创建任务-目标关联
POST /api/v1/goals/:goalUuid/tasks
Body: {
  taskUuid: string,
  keyResultUuid?: string,
  contributionWeight: number,
  linkType?: GoalTaskLinkType
}
Response: GoalTaskLinkClientDTO

// 获取目标的所有关联任务
GET /api/v1/goals/:goalUuid/tasks?includeCompleted=true
Response: {
  links: GoalTaskLinkClientDTO[],
  summary: {
    total: number,
    completed: number,
    inProgress: number
  }
}

// 获取任务分解树
GET /api/v1/goals/:goalUuid/task-tree
Response: {
  goal: GoalClientDTO,
  tree: TaskTreeNode[]
}

// 调整贡献度
PATCH /api/v1/goal-task-links/:linkUuid/weight
Body: {
  contributionWeight: number
}
Response: GoalTaskLinkClientDTO

// 获取关联推荐
GET /api/v1/tasks/:taskUuid/goal-recommendations
Response: {
  recommendations: GoalLinkRecommendationClientDTO[]
}

// 批量关联任务
POST /api/v1/goals/:goalUuid/tasks/batch
Body: {
  links: Array<{
    taskUuid: string,
    keyResultUuid?: string,
    contributionWeight: number
  }>
}
Response: {
  created: GoalTaskLinkClientDTO[],
  failed: Array<{ taskUuid: string, error: string }>
}

// 检测未关联任务
GET /api/v1/tasks/unlinked?priority=HIGH&limit=20
Response: {
  tasks: TaskClientDTO[],
  count: number
}
```

---

## 8. 风险与缓解

| 风险                 | 可能性 | 影响 | 缓解措施                |
| -------------------- | ------ | ---- | ----------------------- |
| 贡献度分配不合理     | 高     | 中   | 提供智能建议 + 验证规则 |
| 进度更新逻辑复杂     | 中     | 高   | 充分单元测试 + 事务保证 |
| 关联关系过于复杂     | 中     | 中   | 限制关联层级 + UI 简化  |
| 性能问题（大量关联） | 中     | 中   | 分页加载 + 索引优化     |

---

## 9. 后续增强方向

### Phase 2 功能

- 🔄 任务依赖链分析（A→B→C）
- 📊 贡献度健康度报告
- 🤖 基于历史的智能贡献度建议
- 📱 移动端看板拖拽

### Phase 3 功能

- 🔗 跨目标任务冲突检测
- 👥 团队目标任务协同
- 🎯 关键路径分析（PERT/CPM）
- 📈 任务对目标影响力分析

---

## 10. 参考资料

- [Goal Contracts](../../../../packages/contracts/src/modules/goal/)
- [Task Contracts](../../../../packages/contracts/src/modules/task/)
- [OKR 最佳实践](https://www.whatmatters.com/resources/okr-examples)
- [任务分解方法论（WBS）](https://en.wikipedia.org/wiki/Work_breakdown_structure)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
