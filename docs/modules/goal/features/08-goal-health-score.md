# Feature Spec: 目标健康度评分

> **功能编号**: GOAL-008  
> **RICE 评分**: 98 (Reach: 5, Impact: 5, Confidence: 7, Effort: 1.8)  
> **优先级**: P3  
> **预估时间**: 1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

目标管理中缺少客观的健康度指标：

- ❌ 不知道目标是否"健康"
- ❌ 无法识别风险目标
- ❌ 缺少量化的诊断依据
- ❌ 难以优先处理问题目标

### 价值主张

**一句话价值**: 通过多维度评分量化目标健康度，及早识别风险

**核心收益**:

- ✅ 综合健康度评分（0-100）
- ✅ 5 个维度评估（进度/质量/风险/活跃度/完整性）
- ✅ 自动识别问题目标
- ✅ 个性化改进建议

---

## 2. 用户价值与场景

### 核心场景 1: 查看目标健康度

**场景描述**:  
用户查看目标的综合健康度评分。

**用户故事**:

```gherkin
As a 目标管理者
I want 查看目标健康度评分
So that 快速识别问题目标
```

**操作流程**:

1. 用户打开目标列表
2. 每个目标显示健康度标识：

   ```
   我的目标
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🎯 Q4 产品上线
   进度: 65%  健康度: 🟢 85 (健康)
   [查看详情]

   🎯 用户增长计划
   进度: 40%  健康度: 🟡 62 (一般)
   ⚠️ 进度落后
   [查看详情]

   🎯 技术债务清理
   进度: 20%  健康度: 🔴 38 (不健康)
   ⚠️ 长期未更新 + 质量问题
   [查看详情]
   ```

3. 用户点击"技术债务清理"查看详情：

   ```
   🎯 技术债务清理（Q4）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📊 健康度评分: 🔴 38 / 100 (不健康)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   维度评分：

   📈 进度健康 (20/25)
   ░░░░░░░░░░░░░░░░░░░░████  80%
   • KR1: 80% (正常)
   • KR2: 30% ⚠️ (落后)
   • KR3: 10% ⚠️ (严重落后)

   ✅ 质量健康 (5/25)
   ░░░░████████████████████  20%
   • 3 个 KR 缺少更新证据
   • 数据来源不明确

   ⚡ 活跃度 (8/20)
   ░░░░░░░░████████████████  40%
   • 最近更新: 15 天前 ⚠️
   • 互动次数: 2 次（过少）

   ⚠️ 风险控制 (5/15)
   ░░░░░░░░░░██████████████  33%
   • 时间风险: 高（剩余 25 天）
   • 资源风险: 中（人员不足）

   📋 完整性 (0/15)
   ░░░░░░░░░░░░░░░░░░░░████  0%
   • 缺少描述
   • 缺少负责人
   • KR 描述过于简单

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💡 改进建议
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   1. 🚨 高优先级（立即处理）
      • 补充目标描述和负责人信息
      • 更新 KR2 和 KR3 进度
      • 明确数据来源和更新频率

   2. 📌 中优先级（本周处理）
      • 增加目标互动（评论、讨论）
      • 评估资源需求，申请支持
      • 设置风险缓解措施

   [应用建议]  [自定义改进计划]
   ```

**预期结果**:

- 清晰的健康度评分
- 分维度诊断
- 可执行的改进建议

---

### 核心场景 2: 健康度趋势分析

**场景描述**:  
用户查看目标健康度的历史变化趋势。

**用户故事**:

```gherkin
As a 用户
I want 查看健康度趋势
So that 了解目标改善情况
```

**操作流程**:

1. 用户点击"健康度趋势"
2. 显示趋势图：

   ```
   📊 健康度趋势 - 技术债务清理
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   分数
   100 |
       |
   80  |     ●─────●
       |    /       \
   60  |   ●         ●─────●
       |  /                 \
   40  | ●                   ●───────●  ← 当前: 38
       |/
   20  |
       |
    0  |─────────────────────────────────────────────────────
       9/1  9/8  9/15 9/22 9/29 10/6 10/13 10/20

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📈 趋势分析
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   • 9月初：健康度 58（一般）
   • 9月中：改进至 72（健康）← 增加了负责人和描述
   • 10月初：下降至 62 ⚠️ ← KR2 进度落后
   • 10月中：持续下降至 38 🔴 ← 长期未更新

   ⚠️ 警告：健康度连续 3 周下降

   💡 建议：
   • 召开专项会议讨论
   • 重新评估目标可行性
   • 调整资源分配

   [导出报告]  [设置提醒]
   ```

**预期结果**:

- 直观的趋势变化
- 识别关键转折点
- 预警机制

---

### 核心场景 3: 健康度排行榜

**场景描述**:  
团队 Leader 查看所有目标的健康度排行。

**用户故事**:

```gherkin
As a 团队 Leader
I want 查看目标健康度排行
So that 快速识别需要关注的目标
```

**操作流程**:

1. 用户打开"目标健康度"看板
2. 显示排行和分布：

   ```
   📊 目标健康度看板 - Q4
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   整体概览：
   平均健康度: 67 / 100 (一般)

   健康度分布：
   🟢 健康 (80-100):   5 个目标 (25%)  ████████░░░░░░░░
   🟡 一般 (60-79):    10 个目标 (50%)  ████████████████
   🔴 不健康 (<60):     5 个目标 (25%)  ████████░░░░░░░░

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔴 需要关注（健康度 < 60）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   1. 技术债务清理 (38) 🔴
      负责人: 张三
      主要问题: 长期未更新 + 进度落后
      [查看] [干预]

   2. 用户留存提升 (52) 🔴
      负责人: 李四
      主要问题: 数据质量问题
      [查看] [干预]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🟢 表现优秀（健康度 > 85）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   1. 产品功能迭代 (92) 🟢
      负责人: 王五
      亮点: 进度稳定 + 高质量更新

   2. 市场推广计划 (88) 🟢
      负责人: 赵六
      亮点: 活跃度高 + 风险可控

   [导出报告]  [设置定期推送]
   ```

**预期结果**:

- 快速识别问题目标
- 团队整体健康度概览
- 支持批量干预

---

### 核心场景 4: 健康度自动预警

**场景描述**:  
目标健康度低于阈值时自动预警。

**用户故事**:

```gherkin
As a 目标负责人
I want 健康度下降时收到预警
So that 及时采取措施
```

**操作流程**:

1. 系统每日计算健康度
2. 检测到"技术债务清理"健康度降至 38
3. 发送预警通知：

   ```
   ⚠️ 目标健康度预警
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   "技术债务清理" 健康度低于阈值

   当前: 🔴 38 / 100
   上周: 🟡 62 / 100
   变化: -24 分 ⬇️

   主要问题：
   • 15 天未更新 ⚠️
   • KR2 严重落后（仅 30%）
   • 缺少关键信息

   建议行动：
   1. 立即更新目标进度
   2. 召开评审会议
   3. 补充缺失信息

   [立即处理]  [查看详情]  [稍后提醒]
   ```

**预期结果**:

- 自动监控
- 及时预警
- 可执行建议

---

## 3. 设计要点

### 健康度计算算法

```typescript
interface HealthScore {
  total: number; // 0-100
  dimensions: {
    progress: number; // 0-25 (进度健康)
    quality: number; // 0-25 (质量健康)
    activity: number; // 0-20 (活跃度)
    risk: number; // 0-15 (风险控制)
    completeness: number; // 0-15 (完整性)
  };
}

function calculateHealthScore(goal: Goal): HealthScore {
  // 1. 进度健康 (0-25)
  const progress = calculateProgressHealth(goal);

  // 2. 质量健康 (0-25)
  const quality = calculateQualityHealth(goal);

  // 3. 活跃度 (0-20)
  const activity = calculateActivityHealth(goal);

  // 4. 风险控制 (0-15)
  const risk = calculateRiskHealth(goal);

  // 5. 完整性 (0-15)
  const completeness = calculateCompletenessHealth(goal);

  return {
    total: progress + quality + activity + risk + completeness,
    dimensions: { progress, quality, activity, risk, completeness },
  };
}

// 进度健康
function calculateProgressHealth(goal: Goal): number {
  const avgProgress =
    goal.keyResults.reduce((sum, kr) => sum + kr.currentProgress, 0) / goal.keyResults.length;

  const timeProgress = (Date.now() - goal.startDate) / (goal.endDate - goal.startDate);

  // 进度与时间匹配度
  const deviation = Math.abs(avgProgress - timeProgress);

  if (deviation < 0.1) return 25; // 完美匹配
  if (deviation < 0.2) return 20; // 接近
  if (deviation < 0.3) return 15; // 轻微落后
  return 10; // 严重落后
}

// 质量健康
function calculateQualityHealth(goal: Goal): number {
  let score = 25;

  // 数据来源明确性
  goal.keyResults.forEach((kr) => {
    if (!kr.dataSource) score -= 5;
  });

  // 更新频率
  const lastUpdate = Date.now() - goal.updatedAt;
  if (lastUpdate > 14 * 24 * 3600 * 1000) score -= 10; // 超过 14 天

  return Math.max(0, score);
}

// 活跃度
function calculateActivityHealth(goal: Goal): number {
  let score = 20;

  // 更新频率
  const daysSinceUpdate = (Date.now() - goal.updatedAt) / (24 * 3600 * 1000);
  if (daysSinceUpdate > 14) score -= 10;
  if (daysSinceUpdate > 30) score -= 5;

  // 互动次数
  if (goal.commentCount < 3) score -= 5;

  return Math.max(0, score);
}
```

---

### Contracts

#### 更新 Goal 实体

```typescript
export interface GoalServerDTO {
  // ...existing fields...
  readonly healthScore?: HealthScore;
  readonly lastHealthCheck?: number;
}

export interface HealthScore {
  readonly total: number;
  readonly dimensions: {
    readonly progress: number;
    readonly quality: number;
    readonly activity: number;
    readonly risk: number;
    readonly completeness: number;
  };
  readonly level: 'healthy' | 'fair' | 'unhealthy';
  readonly suggestions: string[];
}
```

---

## 4. MVP 范围

### MVP（1 周）

- ✅ 5 维度健康度计算
- ✅ 健康度显示（列表 + 详情）
- ✅ 基础改进建议
- ✅ 健康度预警

### Full（后续）

- ✅ 健康度趋势图
- ✅ 团队健康度看板
- ✅ 自定义评分权重
- ✅ AI 改进建议

---

## 5. 验收标准（Gherkin）

```gherkin
Feature: 目标健康度评分

  Scenario: 计算健康度
    Given 目标进度 60%，时间进度 50%
    And 15 天未更新
    When 计算健康度
    Then 总分应为 50-60 之间
    And 活跃度应扣分

  Scenario: 健康度预警
    Given 目标健康度 38
    When 低于阈值 40
    Then 应发送预警通知
    And 提供改进建议
```

---

## 6. 成功指标

| 指标       | 目标值                 |
| ---------- | ---------------------- |
| 功能使用率 | >40% 用户查看健康度    |
| 预警响应率 | >60% 预警后 24h 内处理 |
| 健康度改善 | 平均提升 15 分/月      |

---

**文档状态**: ✅ Ready for Review
