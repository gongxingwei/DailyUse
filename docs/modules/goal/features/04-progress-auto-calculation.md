# Feature Spec: 进度自动计算

> **功能编号**: GOAL-004  
> **RICE 评分**: 480 (Reach: 8, Impact: 8, Confidence: 10, Effort: 1.33)  
> **优先级**: P0  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

在 OKR 目标管理中，目标进度通常需要根据 KR（关键结果）的完成情况综合计算，但现状存在以下问题：

- ❌ 用户需要手动更新目标进度，费时费力且容易遗忘
- ❌ 目标进度与 KR 进度不一致，导致数据混乱
- ❌ 没有统一的进度计算规则，不同用户计算方式不同
- ❌ KR 权重变化后，目标进度未自动重新计算

### 目标用户

- **主要用户**: OKR 管理者、目标负责人
- **次要用户**: 团队成员（查看目标进度）
- **典型画像**: 管理多个目标和 KR，希望自动追踪进度的用户

### 价值主张

**一句话价值**: 根据 KR 完成情况和权重自动计算目标进度，确保数据实时准确

**核心收益**:

- ✅ 自动计算目标进度，无需手动更新
- ✅ 支持加权平均算法，考虑 KR 的不同重要性
- ✅ KR 或权重变化时自动重算，保持数据一致性
- ✅ 提供多种计算模式（加权平均 / 最小值 / 自定义）

---

## 2. 用户价值与场景

### 核心场景 1: 自动计算目标进度（加权平均）

**场景描述**:  
用户更新某个 KR 的进度后，系统自动根据所有 KR 的进度和权重计算目标总进度。

**用户故事**:

```gherkin
As a 目标负责人
I want 系统根据 KR 进度自动计算目标进度
So that 我无需手动更新目标进度，数据始终准确
```

**操作流程**:

1. 用户打开目标详情页
2. 更新某个 KR 的进度（如 KR1 从 50% 改为 70%）
3. 点击"保存"
4. 系统自动触发目标进度计算：
   ```
   目标进度 = Σ(KR进度 × KR权重) / Σ(KR权重)
   ```
5. 目标进度实时更新显示
6. 进度变化被记录到历史快照

**预期结果**:

- Goal 表的 `progress` 字段自动更新
- 计算公式透明，用户可查看计算细节
- 进度变化触发事件通知

**计算示例**:

```
目标：2025 Q4 收入增长
├─ KR1: 新客户增长 20%  (权重 40%, 进度 70%)
├─ KR2: 客单价提升 15%  (权重 30%, 进度 60%)
└─ KR3: 复购率提升至 40% (权重 30%, 进度 50%)

目标进度 = (70% × 40% + 60% × 30% + 50% × 30%) / 100%
         = (28% + 18% + 15%) / 100%
         = 61%
```

---

### 核心场景 2: KR 权重变化后重新计算

**场景描述**:  
用户调整某个 KR 的权重后，系统自动重新计算目标进度。

**用户故事**:

```gherkin
As a 目标负责人
I want 调整 KR 权重后自动重算目标进度
So that 进度反映最新的优先级分配
```

**操作流程**:

1. 用户在"KR 权重快照"功能中调整权重：
   - KR1: 40% → 50%
   - KR2: 30% → 25%
   - KR3: 30% → 25%
2. 保存权重调整
3. 系统自动触发进度重算
4. 新的目标进度 = (70% × 50% + 60% × 25% + 50% × 25%) / 100% = 60%
5. 显示进度变化提示："目标进度因权重调整从 61% 变为 60%"

**预期结果**:

- 权重调整后立即重算进度
- 记录进度变化历史（含变化原因："权重调整"）
- 用户可对比调整前后的进度

---

### 核心场景 3: 查看进度计算详情

**场景描述**:  
用户查看目标进度的计算明细，了解每个 KR 的贡献度。

**用户故事**:

```gherkin
As a 目标负责人
I want 查看目标进度的计算公式和每个 KR 的贡献度
So that 我可以理解进度是如何得出的
```

**操作流程**:

1. 用户打开目标详情页
2. 点击目标进度旁的"查看计算详情"图标
3. 系统展示进度分解面板：

   ```
   目标进度: 61%
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   计算模式: 加权平均

   各 KR 贡献度：
   ├─ KR1 (权重 40%): 70% → 贡献 28%
   ├─ KR2 (权重 30%): 60% → 贡献 18%
   └─ KR3 (权重 30%): 50% → 贡献 15%

   计算公式:
   (70% × 40% + 60% × 30% + 50% × 30%) / 100% = 61%

   最后更新: 2025-10-21 14:30
   触发原因: KR1 进度更新
   ```

4. 用户可点击某个 KR 查看其进度历史

**预期结果**:

- 进度计算透明化，用户理解进度来源
- 识别哪些 KR 对目标进度贡献最大
- 便于优化资源分配

---

### 核心场景 4: 切换进度计算模式（MMP 功能）

**场景描述**:  
用户根据目标特性，选择不同的进度计算模式（加权平均 / 最小值 / 自定义）。

**用户故事**:

```gherkin
As a 目标负责人
I want 为目标选择合适的进度计算模式
So that 进度反映更符合实际情况
```

**操作流程**:

1. 用户打开目标设置
2. 选择"进度计算模式"：
   - **加权平均**（默认）: 适用于并行 KR，各自独立贡献
   - **最小值模式**: 适用于串行 KR，目标进度 = min(所有 KR 进度)
   - **阈值模式**: 所有 KR 达到阈值（如 80%）才算完成
   - **自定义公式**: 用户自定义计算逻辑
3. 保存设置
4. 系统按新模式重算进度

**计算模式对比**:
| 模式 | 计算公式 | 适用场景 |
|------|---------|---------|
| 加权平均 | Σ(KR进度 × 权重) | 并行 KR，各自独立 |
| 最小值 | min(所有 KR 进度) | 串行 KR，需全部完成 |
| 阈值 | all(KR进度 >= 80%) ? 100% : 0% | 全或无的目标 |
| 自定义 | 用户自定义 | 特殊业务逻辑 |

**预期结果**:

- Goal 表新增 `progressCalculationMode` 字段
- 不同模式下进度可能差异较大
- 模式变更记录到目标历史

---

### 核心场景 5: 手动覆盖自动进度（特殊情况）

**场景描述**:  
用户在特殊情况下需要手动覆盖自动计算的进度（如部分 KR 数据不准确）。

**用户故事**:

```gherkin
As a 目标负责人
I want 在必要时手动覆盖自动计算的进度
So that 我可以处理数据异常的特殊情况
```

**操作流程**:

1. 用户发现自动计算的进度不准确（如 KR 数据滞后）
2. 点击"手动设置进度"
3. 输入进度值（如 75%）
4. 填写覆盖原因："等待 KR2 数据同步"
5. 勾选"临时覆盖，数据同步后自动恢复"
6. 保存
7. 目标进度显示为 75%，带有"手动设置"标记

**预期结果**:

- Goal 表新增 `progressOverride` 字段：
  ```typescript
  {
    isOverridden: boolean,
    manualProgress: number,
    overrideReason: string,
    autoRestore: boolean,       // 数据同步后是否自动恢复
    overrideTime: number,
    operatorUuid: string
  }
  ```
- 手动进度优先显示，但保留自动计算结果
- 可一键恢复为自动计算

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 更新聚合根：Goal

**位置**: `packages/contracts/src/modules/goal/aggregates/GoalServer.ts`

```typescript
export interface GoalServerDTO {
  // ...existing fields...

  // 进度相关字段
  readonly progress: number; // 目标进度 (0-100) - 自动计算
  readonly progressCalculationMode: ProgressCalculationMode; // 计算模式
  readonly progressOverride?: ProgressOverride; // 手动覆盖配置
  readonly progressBreakdown?: ProgressBreakdown; // 进度分解详情
  readonly lastProgressUpdateTime: number; // 最后进度更新时间
  readonly progressUpdateTrigger: string; // 触发原因
}

/**
 * 进度计算模式
 */
export enum ProgressCalculationMode {
  WEIGHTED_AVERAGE = 'weighted_average', // 加权平均（默认）
  MIN_VALUE = 'min_value', // 最小值模式
  THRESHOLD = 'threshold', // 阈值模式
  CUSTOM = 'custom', // 自定义公式
}

/**
 * 手动进度覆盖
 */
export interface ProgressOverride {
  readonly isOverridden: boolean;
  readonly manualProgress: number;
  readonly overrideReason: string;
  readonly autoRestore: boolean;
  readonly overrideTime: number;
  readonly operatorUuid: string;
}

/**
 * 进度分解详情
 */
export interface ProgressBreakdown {
  readonly totalProgress: number;
  readonly calculationMode: ProgressCalculationMode;
  readonly krContributions: Array<{
    keyResultUuid: string;
    keyResultName: string;
    progress: number;
    weight: number;
    contribution: number; // 贡献度 = progress × weight
  }>;
  readonly calculationFormula: string;
  readonly updatedAt: number;
}
```

---

### 交互设计

#### 1. 进度自动更新触发时机

- ✅ 创建新 KR 时：重算目标进度
- ✅ 更新 KR 进度时：重算目标进度
- ✅ 删除 KR 时：重算目标进度
- ✅ 调整 KR 权重时：重算目标进度
- ⚠️ 批量操作时：合并为一次计算（避免多次重算）

#### 2. 进度计算算法

```typescript
/**
 * 加权平均模式
 */
function calculateWeightedAverage(keyResults: KeyResult[]): number {
  const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = keyResults.reduce((sum, kr) => sum + kr.progress * kr.weight, 0);

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * 最小值模式
 */
function calculateMinValue(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0;
  return Math.min(...keyResults.map((kr) => kr.progress));
}

/**
 * 阈值模式
 */
function calculateThreshold(keyResults: KeyResult[], threshold: number = 80): number {
  const allAboveThreshold = keyResults.every((kr) => kr.progress >= threshold);
  return allAboveThreshold ? 100 : 0;
}
```

#### 3. 进度变化通知

- **轻微变化**（< 5%）: 静默更新，不发送通知
- **显著变化**（≥ 5%）: 发送进度更新通知
- **里程碑达成**（25%, 50%, 75%, 100%）: 发送庆祝通知

---

## 4. MVP/MMP/Full 路径

### MVP: 基础自动计算（1-1.5 周）

**范围**:

- ✅ 加权平均模式（默认唯一模式）
- ✅ KR 进度/权重变化时自动重算
- ✅ 进度分解详情查看
- ✅ 进度变化历史记录

**技术要点**:

- Contracts: 定义 `ProgressBreakdown`, `ProgressCalculationMode`
- Domain: Goal 聚合根添加 `calculateProgress()` 方法
- Application: `UpdateGoalProgressService` 应用服务
- Infrastructure: 数据库触发器或事件监听（KR 更新 → 重算进度）
- API: `GET /api/v1/goals/:id/progress-breakdown`
- UI: 进度分解面板组件

**验收标准**:

```gherkin
Given 目标有 3 个 KR：
  | KR   | 进度 | 权重 |
  | KR1  | 70%  | 40%  |
  | KR2  | 60%  | 30%  |
  | KR3  | 50%  | 30%  |
When 用户将 KR1 进度更新为 80%
Then 目标进度应自动从 61% 更新为 65%
And 进度分解详情应显示 KR1 贡献 32%（80% × 40%）
```

---

### MMP: 多种计算模式（+1-2 周）

**在 MVP 基础上新增**:

- ✅ 最小值模式
- ✅ 阈值模式
- ✅ 计算模式切换功能
- ✅ 手动覆盖进度功能
- ✅ 进度异常检测（如 KR 进度总和 ≠ 100%）

**技术要点**:

- 策略模式实现多种计算算法
- 进度覆盖状态管理
- 异常检测规则引擎

**验收标准**:

```gherkin
Given 目标当前使用"加权平均"模式，进度 61%
When 用户切换到"最小值"模式
Then 目标进度应重新计算为 50%（min(70%, 60%, 50%)）
And 系统应显示"计算模式已更改，进度已重算"
And 计算模式变更应记录到历史
```

---

### Full Release: 智能进度分析（+2-3 周）

**在 MMP 基础上新增**:

- ✅ 自定义计算公式（支持表达式解析）
- ✅ 进度趋势预测（基于历史数据预测完成时间）
- ✅ 进度健康度评分（识别进度异常）
- ✅ 进度对比分析（与其他目标对比）
- ✅ 进度里程碑庆祝动画

**技术要点**:

- 表达式解析引擎（如 mathjs）
- 线性回归算法预测趋势
- 进度健康度评分模型

**验收标准**:

```gherkin
Given 目标过去 4 周的进度为：20%, 35%, 50%, 61%
When 用户查看"进度趋势"
Then 系统应预测"按当前速度，预计 3 周后达到 100%"
And 显示进度趋势折线图
And 标注里程碑节点（25%, 50%, 75%）
```

---

## 5. 验收标准（Gherkin）

### Feature: 进度自动计算

#### Scenario 1: 自动计算目标进度

```gherkin
Feature: 进度自动计算
  作为目标负责人，我希望系统根据 KR 进度自动计算目标进度

  Background:
    Given 用户"赵六"已登录
    And 存在目标"2025 Q4 产品创新"
    And 该目标有 3 个 KR：
      | uuid  | name          | progress | weight |
      | kr-1  | 用户增长 20%  | 60%      | 50%    |
      | kr-2  | NPS 提升至 40 | 70%      | 30%    |
      | kr-3  | 留存率 80%    | 80%      | 20%    |
    And 目标当前进度为 66%（计算：60%×50% + 70%×30% + 80%×20%）

  Scenario: 更新 KR 进度后自动重算目标进度
    When 用户将 KR "kr-1" 的进度从 60% 更新为 80%
    And 点击"保存"
    Then 系统应自动重新计算目标进度
    And 新的目标进度应为：
      | 计算公式                          | 结果 |
      | 80%×50% + 70%×30% + 80%×20%      | 76%  |
    And 目标详情页应显示进度 = 76%
    And 进度变化应记录到历史（66% → 76%）
    And 系统应发送通知"目标进度已更新至 76%（+10%）"

  Scenario: 新增 KR 后重新分配权重并重算进度
    When 用户新增 KR "kr-4: 新功能上线"，权重 20%
    And 系统自动调整其他 KR 权重为：
      | KR   | 旧权重 | 新权重 |
      | kr-1 | 50%    | 40%    |
      | kr-2 | 30%    | 24%    |
      | kr-3 | 20%    | 16%    |
    And kr-4 进度为 0%
    Then 目标进度应重新计算为：
      | 计算公式                                      | 结果 |
      | 60%×40% + 70%×24% + 80%×16% + 0%×20%        | 53.6% |
    And 系统应显示"新增 KR 后进度已重算"
```

---

#### Scenario 2: 查看进度计算详情

```gherkin
  Background:
    Given 目标当前进度为 76%
    And 进度由以下 KR 贡献：
      | KR   | progress | weight | contribution |
      | kr-1 | 80%      | 50%    | 40%          |
      | kr-2 | 70%      | 30%    | 21%          |
      | kr-3 | 80%      | 20%    | 16%          |

  Scenario: 查看进度分解详情
    When 用户点击目标进度旁的"查看详情"图标
    Then 系统应显示进度分解面板
    And 面板应包含以下内容：
      | 字段           | 值                                        |
      | 总进度         | 76%                                      |
      | 计算模式       | 加权平均                                  |
      | 最后更新时间   | 2025-10-21 14:30                        |
      | 触发原因       | KR1 进度更新                             |
    And 各 KR 贡献度列表应显示：
      | KR   | 进度 | 权重 | 贡献度 |
      | kr-1 | 80%  | 50%  | 40%    |
      | kr-2 | 70%  | 30%  | 21%    |
      | kr-3 | 80%  | 20%  | 16%    |
    And 显示计算公式："(80% × 50% + 70% × 30% + 80% × 20%) / 100% = 76%"
```

---

#### Scenario 3: 调整权重后重算进度

```gherkin
  Background:
    Given 目标当前进度为 76%
    And KR 权重为：kr-1 (50%), kr-2 (30%), kr-3 (20%)

  Scenario: 权重调整触发进度重算
    When 用户调整 KR 权重：
      | KR   | 旧权重 | 新权重 |
      | kr-1 | 50%    | 40%    |
      | kr-2 | 30%    | 40%    |
      | kr-3 | 20%    | 20%    |
    And 保存权重调整
    Then 目标进度应重新计算为：
      | 计算公式                          | 结果 |
      | 80%×40% + 70%×40% + 80%×20%      | 76%  |
    And 系统应显示"权重已调整，进度已重算"
    And 进度变化历史应记录：
      | 时间              | 旧进度 | 新进度 | 触发原因   |
      | 2025-10-21 15:00 | 76%    | 76%    | 权重调整   |
```

---

#### Scenario 4: 切换计算模式（MMP）

```gherkin
  Background:
    Given 目标当前使用"加权平均"模式，进度 76%
    And KR 进度分别为：kr-1 (80%), kr-2 (70%), kr-3 (80%)

  Scenario: 切换到最小值模式
    When 用户打开目标设置
    And 将"进度计算模式"从"加权平均"改为"最小值"
    And 保存设置
    Then 目标进度应重新计算为 70%（min(80%, 70%, 80%)）
    And 系统应显示警告"计算模式已更改，进度从 76% 变为 70%"
    And 进度分解详情应显示：
      | 字段       | 值                                    |
      | 计算模式   | 最小值                                |
      | 计算公式   | min(80%, 70%, 80%) = 70%             |

  Scenario: 切换到阈值模式
    When 用户将"进度计算模式"改为"阈值模式"（阈值 80%）
    Then 目标进度应计算为 0%（因为 kr-2 只有 70%，未达阈值）
    And 系统应提示"当前有 1 个 KR 未达到 80% 阈值"
    When 用户将 kr-2 进度更新为 85%
    Then 目标进度应立即变为 100%（所有 KR 均达阈值）
```

---

#### Scenario 5: 手动覆盖进度

```gherkin
  Background:
    Given 目标自动计算进度为 76%
    And 用户发现 KR2 的数据存在延迟

  Scenario: 手动设置进度
    When 用户点击"手动设置进度"
    And 输入进度 = 80%
    And 填写原因 = "KR2 数据延迟，实际进度更高"
    And 勾选"数据同步后自动恢复"
    And 保存
    Then 目标进度应显示为 80%
    And 进度旁应显示"手动设置"标记
    And 系统应保留自动计算结果 76%（隐藏显示）
    And 进度覆盖记录应创建：
      | 字段           | 值                          |
      | isOverridden   | true                        |
      | manualProgress | 80%                         |
      | overrideReason | KR2 数据延迟，实际进度更高   |
      | autoRestore    | true                        |

  Scenario: 数据同步后自动恢复
    Given 目标进度被手动覆盖为 80%
    And 设置了"数据同步后自动恢复"
    When KR2 数据同步完成，进度更新为 85%
    Then 系统应自动重新计算进度
    And 新进度 = 81%（80%×40% + 85%×40% + 80%×20%）
    And 手动覆盖标记应自动移除
    And 系统应发送通知"数据已同步，进度已恢复为自动计算"
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 进度自动更新
{
  event: 'goal_progress_auto_updated',
  properties: {
    goalUuid: string,
    oldProgress: number,
    newProgress: number,
    progressDelta: number,
    trigger: 'kr_progress_update' | 'kr_weight_change' | 'kr_added' | 'kr_deleted',
    calculationMode: ProgressCalculationMode,
    calculationDuration: number  // 计算耗时（ms）
  }
}

// 查看进度详情
{
  event: 'goal_progress_breakdown_viewed',
  properties: {
    goalUuid: string,
    krCount: number,
    calculationMode: ProgressCalculationMode
  }
}

// 切换计算模式
{
  event: 'goal_progress_calculation_mode_changed',
  properties: {
    goalUuid: string,
    oldMode: ProgressCalculationMode,
    newMode: ProgressCalculationMode,
    progressChange: number
  }
}

// 手动覆盖进度
{
  event: 'goal_progress_manually_overridden',
  properties: {
    goalUuid: string,
    autoProgress: number,
    manualProgress: number,
    overrideReason: string
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 进度自动更新成功率 | >99.5% | 成功更新次数 / 触发更新次数 |
| 进度计算响应时间 | P95 <100ms | 计算耗时监控 |
| 手动覆盖使用率 | <5% | 手动覆盖次数 / 总进度更新次数 |
| 进度分解查看率 | >30% | 查看详情的用户数 / 更新进度的用户数 |

**定性指标**:

- 用户反馈"进度更新更及时"
- 减少手动更新进度的操作次数
- 目标进度与 KR 进度一致性提升

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model Goal {
  // ...existing fields...

  progress                    Int      @default(0) @map("progress")  // 0-100
  progressCalculationMode     String   @default("weighted_average") @map("progress_calculation_mode")
  lastProgressUpdateTime      BigInt?  @map("last_progress_update_time")
  progressUpdateTrigger       String?  @map("progress_update_trigger")

  // 手动覆盖相关字段
  progressIsOverridden        Boolean  @default(false) @map("progress_is_overridden")
  progressManualValue         Int?     @map("progress_manual_value")
  progressOverrideReason      String?  @map("progress_override_reason")
  progressAutoRestore         Boolean  @default(false) @map("progress_auto_restore")
  progressOverrideTime        BigInt?  @map("progress_override_time")
  progressOverrideOperator    String?  @map("progress_override_operator")
}
```

### Domain Layer (核心逻辑)

```typescript
// packages/domain-server/src/modules/goal/aggregates/Goal.ts

export class Goal {
  /**
   * 自动计算目标进度
   */
  calculateProgress(): void {
    if (this.progressOverride?.isOverridden && !this.shouldAutoRestore()) {
      // 如果手动覆盖且不需要自动恢复，跳过计算
      return;
    }

    const newProgress = this.computeProgressByMode();
    const oldProgress = this.progress;

    if (newProgress !== oldProgress) {
      this.progress = newProgress;
      this.lastProgressUpdateTime = Date.now();
      this.recordProgressChange(oldProgress, newProgress);
    }
  }

  /**
   * 根据计算模式计算进度
   */
  private computeProgressByMode(): number {
    switch (this.progressCalculationMode) {
      case ProgressCalculationMode.WEIGHTED_AVERAGE:
        return this.calculateWeightedAverage();
      case ProgressCalculationMode.MIN_VALUE:
        return this.calculateMinValue();
      case ProgressCalculationMode.THRESHOLD:
        return this.calculateThreshold();
      default:
        return this.calculateWeightedAverage();
    }
  }

  /**
   * 加权平均算法
   */
  private calculateWeightedAverage(): number {
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = this.keyResults.reduce(
      (sum, kr) => sum + (kr.progress * kr.weight) / 100,
      0,
    );

    return Math.round((weightedSum / totalWeight) * 100);
  }

  /**
   * 获取进度分解详情
   */
  getProgressBreakdown(): ProgressBreakdown {
    const krContributions = this.keyResults.map((kr) => ({
      keyResultUuid: kr.uuid,
      keyResultName: kr.name,
      progress: kr.progress,
      weight: kr.weight,
      contribution: (kr.progress * kr.weight) / 100,
    }));

    return {
      totalProgress: this.progress,
      calculationMode: this.progressCalculationMode,
      krContributions,
      calculationFormula: this.buildCalculationFormula(),
      updatedAt: this.lastProgressUpdateTime,
    };
  }
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/goal/application/UpdateGoalProgressService.ts

export class UpdateGoalProgressService {
  async execute(goalUuid: string, trigger: string): Promise<void> {
    const goal = await this.goalRepository.findByUuid(goalUuid);
    if (!goal) throw new Error('Goal not found');

    // 计算进度
    goal.calculateProgress();
    goal.progressUpdateTrigger = trigger;

    // 保存
    await this.goalRepository.save(goal);

    // 发布进度更新事件
    await this.eventBus.publish(
      new GoalProgressUpdatedEvent({
        goalUuid: goal.uuid,
        newProgress: goal.progress,
        trigger,
      }),
    );
  }
}
```

### API 端点

```typescript
// 获取进度分解详情
GET /api/v1/goals/:id/progress-breakdown
Response: ProgressBreakdown

// 切换计算模式
PATCH /api/v1/goals/:id/progress-calculation-mode
Body: { mode: ProgressCalculationMode }
Response: GoalClientDTO

// 手动覆盖进度
POST /api/v1/goals/:id/progress-override
Body: { manualProgress: number, reason: string, autoRestore: boolean }
Response: GoalClientDTO

// 恢复自动计算
DELETE /api/v1/goals/:id/progress-override
Response: GoalClientDTO
```

---

## 8. 风险与缓解

| 风险               | 可能性 | 影响 | 缓解措施                                |
| ------------------ | ------ | ---- | --------------------------------------- |
| 进度计算错误       | 低     | 高   | 单元测试 + 集成测试 + 计算日志          |
| 频繁重算影响性能   | 中     | 中   | 防抖机制（批量操作合并计算） + 异步计算 |
| 用户不理解计算逻辑 | 中     | 中   | 提供计算详情面板 + 示例说明             |
| 手动覆盖滥用       | 低     | 中   | 记录覆盖原因 + 定期审计                 |
| KR 权重不等于 100% | 中     | 中   | 前端校验 + 自动归一化                   |

---

## 9. 参考资料

- [Goal Contracts](../../../../packages/contracts/src/modules/goal/)
- [OKR 进度计算最佳实践](https://www.whatmatters.com/faqs/okr-grading-scoring)
- [加权平均算法](https://en.wikipedia.org/wiki/Weighted_arithmetic_mean)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
