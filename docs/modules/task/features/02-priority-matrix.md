# Feature Spec: 任务优先级智能排序

> **功能编号**: TASK-002  
> **RICE 评分**: 576 (Reach: 8, Impact: 6, Confidence: 6, Effort: 0.5)  
> **优先级**: P0  
> **预估时间**: 0.5-1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

任务管理中，用户常常面临"不知道先做什么"的困扰：
- ❌ 手动排序任务费时费力，尤其是任务数量多时
- ❌ 缺少科学的优先级评估方法，凭感觉决策
- ❌ 任务优先级变化后，需要手动重新排序
- ❌ 无法一目了然地看到哪些任务"重要且紧急"

### 目标用户

- **主要用户**: 任务繁多的知识工作者、项目管理者
- **次要用户**: 团队成员（查看团队任务优先级）
- **典型画像**: 每天有 10+ 任务，需要科学决策"先做什么"的用户

### 价值主张

**一句话价值**: 基于艾森豪威尔矩阵，自动计算任务优先级并智能排序，提升决策效率

**核心收益**:
- ✅ 自动计算优先级分数（基于重要性 × 紧急度）
- ✅ 四象限矩阵视图，一目了然识别任务类型
- ✅ 一键智能排序，无需手动拖拽
- ✅ 优先级变化时自动重排，保持列表有序

---

## 2. 用户价值与场景

### 核心场景 1: 标记任务重要性和紧急度

**场景描述**:  
用户为任务标记重要性（1-5）和紧急度（1-5），系统自动计算优先级分数。

**用户故事**:
```gherkin
As a 任务执行者
I want 为任务标记重要性和紧急度
So that 系统可以自动计算优先级分数并排序
```

**操作流程**:
1. 用户创建或编辑任务
2. 设置"重要性"滑块（1-5 星）
   - 1 星：不重要
   - 5 星：极其重要
3. 设置"紧急度"滑块（1-5 星）
   - 1 星：不紧急
   - 5 星：极其紧急
4. 系统自动计算优先级分数：`priorityScore = importance * urgency`
5. 任务列表自动按 `priorityScore` 降序排序

**预期结果**:
- Task 表新增字段：
  ```typescript
  importance: number;  // 1-5
  urgency: number;     // 1-5
  priorityScore: number; // importance × urgency (1-25)
  ```
- 任务列表实时重排

---

### 核心场景 2: 查看四象限优先级矩阵

**场景描述**:  
用户切换到"矩阵视图"，查看任务在四象限中的分布。

**用户故事**:
```gherkin
As a 任务执行者
I want 查看任务在四象限矩阵中的分布
So that 我可以一目了然地识别"重要且紧急"的任务
```

**操作流程**:
1. 用户点击"切换到矩阵视图"
2. 系统展示 2×2 四象限矩阵：
   ```
   高紧急度 ↑
   ━━━━━━━━━━━━━━━━━━━━━━━━━
   │ Q1: 紧急且重要 │ Q2: 重要但不紧急 │
   │ (立即执行)    │ (计划执行)      │
   │ 3 个任务      │ 5 个任务        │
   ├─────────────┼──────────────┤
   │ Q3: 紧急但不重要│ Q4: 既不紧急也不重要│
   │ (委托他人)    │ (考虑删除)      │
   │ 2 个任务      │ 1 个任务        │
   ━━━━━━━━━━━━━━━━━━━━━━━━━
   低重要性 ←          → 高重要性
   ```
3. 用户可点击某个象限查看任务列表
4. 可拖拽任务在象限间移动（自动更新 importance/urgency）

**预期结果**:
- 四象限分类：
  - Q1 (高重要+高紧急): `importance >= 4 && urgency >= 4`
  - Q2 (高重要+低紧急): `importance >= 4 && urgency < 4`
  - Q3 (低重要+高紧急): `importance < 4 && urgency >= 4`
  - Q4 (低重要+低紧急): `importance < 4 && urgency < 4`
- 每个象限显示任务数量和建议操作

---

### 核心场景 3: 一键智能排序

**场景描述**:  
用户点击"智能排序"，系统按优先级分数自动重排任务。

**用户故事**:
```gherkin
As a 任务执行者
I want 一键智能排序所有任务
So that 我无需手动拖拽，任务自动按优先级排列
```

**操作流程**:
1. 用户打开任务列表（可能已被手动拖拽打乱）
2. 点击"智能排序"按钮
3. 系统弹出确认框："将按优先级分数重新排序，是否继续？"
4. 用户确认
5. 系统按以下规则排序：
   - 主要：按 `priorityScore` 降序
   - 次要：若分数相同，按 `dueDate` 升序
   - 再次：若截止日期相同，按 `createdAt` 升序
6. 动画展示任务重排过程

**预期结果**:
- 任务的 `orderIndex` 字段被更新
- 排序规则透明，用户可查看排序依据
- 支持撤销（恢复到排序前状态）

---

### 核心场景 4: 优先级自动调整（MMP 功能）

**场景描述**:  
系统根据截止日期临近程度，自动提升任务的紧急度。

**用户故事**:
```gherkin
As a 任务执行者
I want 系统在截止日期临近时自动提升任务紧急度
So that 我不会遗漏即将到期的重要任务
```

**操作流程**:
1. 系统每天凌晨执行定时任务
2. 检查所有未完成任务的 `dueDate`
3. 计算距离截止日期的天数：
   - 1 天内：紧急度 +2
   - 3 天内：紧急度 +1
   - 7 天内：紧急度 +0.5
4. 更新 `urgency` 和 `priorityScore`
5. 发送通知："5 个任务的优先级已自动调整"

**预期结果**:
- 任务紧急度动态变化
- 用户可在任务详情查看"紧急度调整历史"
- 可选择关闭自动调整功能

---

### 核心场景 5: 批量设置优先级

**场景描述**:  
用户选中多个任务，批量设置重要性或紧急度。

**用户故事**:
```gherkin
As a 任务管理者
I want 批量为多个任务设置相同的重要性或紧急度
So that 我可以快速标记一批同类型任务
```

**操作流程**:
1. 用户勾选 5 个任务
2. 点击"批量操作" → "设置优先级"
3. 弹出批量设置面板：
   - 设置重要性：3 星
   - 设置紧急度：保持不变
4. 点击"应用"
5. 系统批量更新任务，重新计算 `priorityScore`
6. 显示"已更新 5 个任务的优先级"

**预期结果**:
- 批量操作支持：设置重要性、设置紧急度、自动排序
- 操作可撤销
- 显示批量操作日志

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 更新聚合根：Task

**位置**: `packages/contracts/src/modules/task/aggregates/TaskServer.ts`

```typescript
export interface TaskServerDTO {
  // ...existing fields...
  
  // 新增字段
  readonly importance: number;      // 重要性 (1-5)
  readonly urgency: number;         // 紧急度 (1-5)
  readonly priorityScore: number;   // 优先级分数 (importance × urgency, 1-25)
  readonly autoAdjustEnabled: boolean; // 是否启用自动调整
  readonly priorityHistory?: PriorityChangeLog[]; // 优先级变更历史
}

export interface PriorityChangeLog {
  readonly timestamp: number;
  readonly oldImportance: number;
  readonly newImportance: number;
  readonly oldUrgency: number;
  readonly newUrgency: number;
  readonly trigger: 'manual' | 'auto' | 'batch';
  readonly reason?: string;
}
```

---

### 交互设计

#### 1. 优先级分数计算公式

```typescript
// 基础公式
priorityScore = importance × urgency

// 高级公式（MMP 功能）
priorityScore = (importance × urgency) + dueDateBonus + dependencyBonus

where:
  dueDateBonus = {
    1天内: +5,
    3天内: +3,
    7天内: +1,
    其他: 0
  }
  
  dependencyBonus = {
    被其他任务依赖: +2,
    依赖其他任务（被阻塞）: -2
  }
```

#### 2. 四象限阈值配置

| 象限 | 重要性 | 紧急度 | 建议操作 |
|------|-------|-------|---------|
| Q1   | ≥ 4   | ≥ 4   | 立即执行（Do First） |
| Q2   | ≥ 4   | < 4   | 计划执行（Schedule） |
| Q3   | < 4   | ≥ 4   | 委托他人（Delegate） |
| Q4   | < 4   | < 4   | 考虑删除（Eliminate） |

#### 3. 排序规则

```typescript
// 智能排序规则
function sortTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    // 1. 优先级分数（降序）
    if (a.priorityScore !== b.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    // 2. 截止日期（升序，越近越优先）
    if (a.dueDate && b.dueDate) {
      return a.dueDate - b.dueDate;
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    // 3. 创建时间（升序，越早越优先）
    return a.createdAt - b.createdAt;
  });
}
```

---

## 4. MVP/MMP/Full 路径

### MVP: 基础优先级排序（0.5-1 周）

**范围**:
- ✅ 任务支持 `importance`, `urgency`, `priorityScore` 字段
- ✅ 手动设置重要性和紧急度（1-5 星）
- ✅ 自动计算优先级分数（importance × urgency）
- ✅ 一键智能排序
- ✅ 列表视图显示优先级分数

**技术要点**:
- Contracts: 更新 `TaskServerDTO`
- Domain: Task 聚合根添加 `setPriority()` 方法
- Application: `UpdateTaskPriorityService`
- Prisma: 添加 `importance`, `urgency`, `priorityScore` 字段
- API: `PATCH /api/v1/tasks/:id/priority`, `POST /api/v1/tasks/batch/smart-sort`
- UI: 优先级设置滑块 + 智能排序按钮

**验收标准**:
```gherkin
Given 任务 A 的 importance=5, urgency=5
And 任务 B 的 importance=3, urgency=4
When 用户点击"智能排序"
Then 任务列表应按优先级排序：
  | 任务 | priorityScore | 排序 |
  | A    | 25            | 1    |
  | B    | 12            | 2    |
```

---

### MMP: 四象限矩阵视图（+1-2 周）

**在 MVP 基础上新增**:
- ✅ 四象限矩阵视图（可视化）
- ✅ 拖拽任务在象限间移动
- ✅ 每个象限显示建议操作
- ✅ 批量设置优先级
- ✅ 优先级变更历史记录

**技术要点**:
- 矩阵布局组件（2×2 grid）
- 拖拽交互（vue-draggable）
- 批量操作 API

**验收标准**:
```gherkin
Given 任务列表有 10 个任务
When 用户切换到"矩阵视图"
Then 系统应展示四象限矩阵
And Q1 象限应包含 importance≥4 且 urgency≥4 的任务
And 用户可拖拽任务从 Q2 移动到 Q1
And 移动后任务的 importance 和 urgency 自动更新
```

---

### Full Release: 智能优先级调整（+2-3 周）

**在 MMP 基础上新增**:
- ✅ 根据截止日期自动提升紧急度
- ✅ 根据任务依赖关系调整优先级
- ✅ 机器学习推荐优先级（基于历史完成模式）
- ✅ 优先级调整通知
- ✅ 优先级趋势分析

**技术要点**:
- 定时任务（每日凌晨执行）
- 任务依赖图分析
- 简单机器学习模型（如决策树）

**验收标准**:
```gherkin
Given 任务 A 的截止日期为明天
And 任务 A 当前 urgency=2
When 系统执行每日优先级调整任务
Then 任务 A 的 urgency 应自动提升至 4
And 系统应发送通知"任务 A 的紧急度已自动提升"
And 优先级变更历史应记录此次调整
```

---

## 5. 验收标准（Gherkin）

### Feature: 任务优先级智能排序

#### Scenario 1: 设置任务优先级

```gherkin
Feature: 任务优先级智能排序
  作为任务执行者，我希望为任务设置重要性和紧急度，自动计算优先级

  Background:
    Given 用户"王五"已登录
    And 存在任务"完成项目提案"

  Scenario: 设置重要性和紧急度
    When 用户打开任务"完成项目提案"
    And 设置重要性 = 5 星
    And 设置紧急度 = 4 星
    And 点击"保存"
    Then 任务的 importance 应为 5
    And 任务的 urgency 应为 4
    And 任务的 priorityScore 应自动计算为 20
    And 任务列表应重新排序（按 priorityScore 降序）

  Scenario: 修改优先级后自动重排
    Given 任务列表有以下任务：
      | name    | importance | urgency | priorityScore |
      | 任务 A  | 5          | 5       | 25            |
      | 任务 B  | 4          | 4       | 16            |
      | 任务 C  | 3          | 3       | 9             |
    When 用户将"任务 C"的 importance 改为 5, urgency 改为 5
    Then 任务 C 的 priorityScore 应变为 25
    And 任务列表排序应变为：任务 A (25), 任务 C (25), 任务 B (16)
```

---

#### Scenario 2: 智能排序

```gherkin
  Background:
    Given 任务列表有以下任务（顺序已被手动打乱）：
      | name    | priorityScore | dueDate    | orderIndex |
      | 任务 A  | 20            | 2025-10-25 | 3          |
      | 任务 B  | 25            | 2025-10-23 | 1          |
      | 任务 C  | 15            | 2025-10-24 | 2          |

  Scenario: 执行智能排序
    When 用户点击"智能排序"按钮
    And 确认排序操作
    Then 任务列表应按以下规则重新排序：
      | name    | 排序规则                           | 新 orderIndex |
      | 任务 B  | priorityScore 最高 (25)           | 1             |
      | 任务 A  | priorityScore 次高 (20)           | 2             |
      | 任务 C  | priorityScore 最低 (15)           | 3             |
    And 系统应显示"已智能排序 3 个任务"
    And 用户可点击"撤销"恢复原排序
```

---

#### Scenario 3: 四象限矩阵视图（MMP）

```gherkin
  Background:
    Given 任务列表有以下任务：
      | name    | importance | urgency | quadrant |
      | 任务 A  | 5          | 5       | Q1       |
      | 任务 B  | 5          | 2       | Q2       |
      | 任务 C  | 2          | 5       | Q3       |
      | 任务 D  | 2          | 2       | Q4       |

  Scenario: 查看四象限矩阵
    When 用户点击"切换到矩阵视图"
    Then 系统应展示四象限矩阵
    And Q1 象限应包含"任务 A"（重要且紧急）
    And Q2 象限应包含"任务 B"（重要但不紧急）
    And Q3 象限应包含"任务 C"（紧急但不重要）
    And Q4 象限应包含"任务 D"（既不紧急也不重要）
    And 每个象限应显示建议操作：
      | 象限 | 建议操作     |
      | Q1   | 立即执行     |
      | Q2   | 计划执行     |
      | Q3   | 委托他人     |
      | Q4   | 考虑删除     |

  Scenario: 拖拽任务更改优先级
    When 用户在矩阵视图中
    And 将"任务 B"从 Q2 拖拽到 Q1
    Then 任务 B 的 urgency 应自动提升至 4（跨越阈值）
    And 任务 B 的 priorityScore 应重新计算为 20
    And 任务 B 应出现在 Q1 象限
```

---

#### Scenario 4: 批量设置优先级

```gherkin
  Background:
    Given 任务列表有 5 个任务，当前 importance 各不相同

  Scenario: 批量设置重要性
    When 用户勾选 3 个任务：任务 A, 任务 B, 任务 C
    And 点击"批量操作" → "设置优先级"
    And 设置重要性 = 4 星
    And 保持紧急度不变
    And 点击"应用"
    Then 任务 A, B, C 的 importance 应全部变为 4
    And priorityScore 应重新计算
    And 系统应显示"已更新 3 个任务的优先级"
    And 优先级变更历史应记录 trigger='batch'
```

---

#### Scenario 5: 自动调整紧急度（Full Release）

```gherkin
  Background:
    Given 当前日期为 2025-10-21
    And 任务 A 的 dueDate = 2025-10-22, urgency = 2
    And 任务 B 的 dueDate = 2025-10-25, urgency = 3
    And 系统启用了自动优先级调整功能

  Scenario: 截止日期临近时自动提升紧急度
    When 系统执行每日优先级调整任务（凌晨 00:00）
    Then 任务 A 的 urgency 应自动提升至 4（距离截止日期 1 天）
    And 任务 A 的 priorityScore 应重新计算
    And 任务 B 的 urgency 应提升至 3.5（距离截止日期 4 天）
    And 系统应发送通知"2 个任务的优先级已自动调整"
    And 优先级变更历史应记录 trigger='auto', reason='截止日期临近'
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 设置优先级
{
  event: 'task_priority_set',
  properties: {
    taskUuid: string,
    importance: number,
    urgency: number,
    priorityScore: number,
    trigger: 'manual' | 'batch'
  }
}

// 智能排序
{
  event: 'tasks_smart_sorted',
  properties: {
    taskCount: number,
    duration: number  // 排序耗时（ms）
  }
}

// 切换到矩阵视图
{
  event: 'matrix_view_opened',
  properties: {
    taskCount: number,
    quadrantDistribution: {
      q1: number,
      q2: number,
      q3: number,
      q4: number
    }
  }
}

// 自动优先级调整
{
  event: 'priority_auto_adjusted',
  properties: {
    taskUuid: string,
    oldUrgency: number,
    newUrgency: number,
    reason: string
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 优先级设置率 | >60% | 设置了优先级的任务数 / 总任务数 |
| 智能排序使用率 | >30% | 使用智能排序的用户数 / 总用户数 |
| 矩阵视图打开率 | >20% | 打开矩阵视图的次数 / 总任务查看次数 |
| Q1 任务完成率 | >80% | Q1 任务完成数 / Q1 任务总数 |

**定性指标**:
- 用户反馈"任务优先级更清晰"
- 减少"不知道先做什么"的决策时间
- 高优先级任务的按时完成率提升

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model Task {
  // ...existing fields...
  
  importance           Int      @default(3) @map("importance")  // 1-5
  urgency              Int      @default(3) @map("urgency")     // 1-5
  priorityScore        Int      @default(9) @map("priority_score") // importance × urgency
  autoAdjustEnabled    Boolean  @default(true) @map("auto_adjust_enabled")
  
  @@index([priorityScore(sort: Desc), dueDate(sort: Asc)])
}
```

### API 端点

```typescript
// 设置任务优先级
PATCH /api/v1/tasks/:id/priority
Body: { importance: number, urgency: number }
Response: TaskClientDTO

// 智能排序
POST /api/v1/tasks/batch/smart-sort
Body: { taskUuids: string[] }
Response: { sortedTasks: TaskClientDTO[] }

// 批量设置优先级
POST /api/v1/tasks/batch/set-priority
Body: { taskUuids: string[], importance?: number, urgency?: number }
Response: { updatedCount: number }
```

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 用户觉得设置优先级太复杂 | 中 | 高 | 提供快速模式（只设置 importance） + 默认值 |
| 自动调整干扰用户决策 | 中 | 中 | 可关闭自动调整 + 调整前通知 |
| 排序算法不符合用户预期 | 低 | 中 | 支持自定义排序规则 + 撤销功能 |
| 大量任务排序性能问题 | 低 | 中 | 分页排序 + 索引优化 |

---

## 9. 参考资料

- [Task Contracts](../../../../packages/contracts/src/modules/task/)
- [艾森豪威尔矩阵](https://en.wikipedia.org/wiki/Time_management#The_Eisenhower_Method)
- [优先级算法最佳实践](https://www.projectmanager.com/blog/task-prioritization)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow
