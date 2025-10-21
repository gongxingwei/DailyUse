# Feature Spec: 目标依赖关系

> **功能编号**: GOAL-007  
> **RICE 评分**: 105 (Reach: 7, Impact: 5, Confidence: 6, Effort: 2)  
> **优先级**: P3
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

复杂项目中，目标之间存在依赖关系：
- ❌ 无法表达"完成目标 A 后才能开始目标 B"
- ❌ 前置目标未完成，后续目标提前开始导致资源浪费
- ❌ 缺少目标依赖链路可视化
- ❌ 无法识别关键路径

### 价值主张

**一句话价值**: 建立目标间的依赖关系，确保按正确顺序推进战略目标

**核心收益**:
- ✅ 定义目标前置/后续依赖
- ✅ 依赖链路可视化（目标地图）
- ✅ 自动阻塞未满足依赖的目标
- ✅ 识别关键路径

---

## 2. 用户价值与场景

### 核心场景 1: 创建目标依赖

**场景描述**:  
用户为目标设置前置依赖目标。

**用户故事**:
```gherkin
As a 项目管理者
I want 设置目标依赖关系
So that 明确目标执行顺序
```

**操作流程**:
1. 用户打开目标"产品正式发布"详情
2. 点击"添加依赖"：
   ```
   🎯 产品正式发布（Q4）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   📊 依赖关系
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   此目标依赖以下目标：
   (暂无)
   
   [+ 添加前置目标]
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   以下目标依赖此目标：
   (暂无)
   ```

3. 点击"添加前置目标"，选择：
   ```
   选择前置目标
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   同周期推荐：
   ☐ Beta 版本测试（Q3）
      进度: 90% | 预计: 10-25 完成
      
   ☐ MVP 功能完成（Q3）
      进度: 100% | 已完成 ✓
      
   ☐ 市场调研完成（Q2）
      进度: 100% | 已完成 ✓
   
   依赖类型：
   🔘 必须完成（强依赖）
      前置目标未完成，此目标无法开始
   ⚪ 建议完成（弱依赖）
      前置目标未完成，仅提醒但不阻止
   
   [确认]  [取消]
   ```

4. 用户选择"Beta 版本测试"和"MVP 功能完成"
5. 系统创建依赖关系并显示：
   ```
   📊 依赖关系
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   此目标依赖以下目标：
   
   ✅ MVP 功能完成 (Q3)
      进度: 100% | 已完成
      [查看目标]
   
   🟡 Beta 版本测试 (Q3)
      进度: 90% | 预计 10-25 完成
      ⚠️ 未完成，此目标被阻塞
      [查看目标]
   
   💡 建议：等待 Beta 测试完成后再启动
   ```

**预期结果**:
- 清晰的依赖关系
- 阻塞状态提示
- 支持查看依赖目标

---

### 核心场景 2: 依赖阻塞检测

**场景描述**:  
用户尝试启动被依赖阻塞的目标。

**用户故事**:
```gherkin
As a 用户
I want 被依赖阻塞时收到提示
So that 避免提前启动
```

**操作流程**:
1. 用户尝试将"产品正式发布"状态改为"进行中"
2. 系统检测依赖未满足：
   ```typescript
   function canStartGoal(goal: Goal): { allowed: boolean; reason?: string } {
     const dependencies = goal.dependencies.filter(
       d => d.dependencyType === 'blocking'
     );
     
     const unfinished = dependencies.filter(
       d => d.dependencyGoal.status !== GoalStatus.COMPLETED
     );
     
     if (unfinished.length > 0) {
       return {
         allowed: false,
         reason: `以下 ${unfinished.length} 个前置目标尚未完成`
       };
     }
     
     return { allowed: true };
   }
   ```

3. 弹出阻塞提示：
   ```
   ⚠️ 无法启动目标
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   "产品正式发布" 被以下目标阻塞：
   
   🟡 Beta 版本测试 (Q3)
      负责人: 张三
      进度: 90%
      预计完成: 10-25
      [查看目标] [提醒负责人]
   
   你可以：
   [等待依赖完成]  [移除依赖]  [仍然启动（不推荐）]
   ```

**预期结果**:
- 阻止提前启动
- 清晰的阻塞原因
- 提供解决方案

---

### 核心场景 3: 目标地图可视化

**场景描述**:  
用户查看目标依赖关系图谱。

**用户故事**:
```gherkin
As a 战略规划者
I want 查看目标依赖地图
So that 理解整体战略布局
```

**操作流程**:
1. 用户打开"目标地图"视图
2. 显示依赖拓扑图：
   ```
                  ┌──────────────┐
                  │ 市场调研完成 │ ✓
                  └───────┬──────┘
                          ↓
                  ┌──────────────┐
                  │ MVP 功能完成 │ ✓
                  └───────┬──────┘
                          ↓
           ┌──────────────────────────┐
           │                          │
           ↓                          ↓
   ┌──────────────┐          ┌──────────────┐
   │ Beta 测试    │ 90%      │ 市场推广准备 │ ✓
   └──────┬───────┘          └──────┬───────┘
          │                         │
          └────────┬────────────────┘
                   ↓
           ┌──────────────┐
           │ 产品正式发布 │ 🔒 阻塞中
           └──────────────┘
   
   
   图例：
   ✓ 已完成  🔄 进行中  🔒 被阻塞  ⏳ 未开始
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 关键路径分析
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   最长路径（关键路径）：
   市场调研 → MVP 功能 → Beta 测试 → 正式发布
   预计完成: 2025-11-01
   
   ⚠️ 风险提示：
   "Beta 测试" 可能延期 3 天，影响整体交付
   
   [调整计划]  [导出图谱]
   ```

**预期结果**:
- 直观的依赖关系
- 识别关键路径
- 风险预警

---

### 核心场景 4: 依赖完成自动通知

**场景描述**:  
前置目标完成时，自动通知后续目标负责人。

**用户故事**:
```gherkin
As a 目标负责人
I want 前置目标完成时收到通知
So that 及时启动我的目标
```

**操作流程**:
1. 用户完成"Beta 版本测试"目标
2. 系统检测到下游目标：
   ```typescript
   async function handleGoalCompleted(goalUuid: string): Promise<void> {
     const goal = await this.goalRepository.findByUuid(goalUuid);
     
     // 查找依赖此目标的目标
     const dependentGoals = await this.goalRepository.findDependentGoals(goalUuid);
     
     for (const dependentGoal of dependentGoals) {
       // 检查所有依赖是否满足
       const allDependenciesMet = dependentGoal.dependencies.every(
         d => d.dependencyGoal.status === GoalStatus.COMPLETED
       );
       
       if (allDependenciesMet) {
         // 发送通知
         await this.notificationService.create({
           userId: dependentGoal.ownerId,
           type: 'goal_dependencies_met',
           title: '目标可以启动了',
           content: `"${dependentGoal.objective}" 的所有前置目标已完成`,
           priority: 'HIGH'
         });
       }
     }
   }
   ```

3. 负责人收到通知：
   ```
   🎉 目标可以启动了
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   "产品正式发布" 的所有前置目标已完成：
   ✓ MVP 功能完成（Q3）
   ✓ Beta 版本测试（Q3）刚刚完成
   ✓ 市场推广准备（Q3）
   
   现在可以启动这个目标了！
   
   [启动目标]  [稍后处理]
   ```

**预期结果**:
- 自动检测依赖满足
- 及时通知负责人
- 快速启动选项

---

## 3. 设计要点

### Contracts

#### 新增实体：GoalDependency

```typescript
export interface GoalDependencyServerDTO {
  readonly uuid: string;
  readonly dependentGoalUuid: string;      // 依赖方目标
  readonly dependencyGoalUuid: string;     // 被依赖目标
  readonly dependencyType: 'blocking' | 'suggested';
  readonly status: 'active' | 'satisfied' | 'removed';
  readonly reason?: string;
  readonly createdBy: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}
```

#### 更新 Goal 实体

```typescript
export interface GoalServerDTO {
  // ...existing fields...
  readonly dependencies?: GoalDependencyServerDTO[];
  readonly dependents?: GoalDependencyServerDTO[];
  readonly isBlocked: boolean;
  readonly blockingGoals?: string[];
}
```

---

## 4. MVP 范围

### MVP（1 周）

- ✅ 创建/删除目标依赖
- ✅ 依赖阻塞检测
- ✅ 简单依赖列表
- ✅ 依赖完成通知

### Full（+0.5 周）

- ✅ 目标地图可视化
- ✅ 关键路径分析
- ✅ 循环依赖检测
- ✅ 依赖影响分析

---

## 5. 验收标准（Gherkin）

```gherkin
Feature: 目标依赖关系

  Scenario: 创建依赖
    Given 目标 A "MVP 完成"
    And 目标 B "产品发布"
    When 为 B 添加前置依赖 A
    Then 应创建依赖关系
    And B 应标记为"被阻塞"
    
  Scenario: 依赖阻塞
    Given B 依赖 A（强依赖）
    And A 状态为"进行中"
    When 用户尝试启动 B
    Then 应阻止并提示
```

---

## 6. 成功指标

| 指标 | 目标值 |
|------|-------|
| 依赖使用率 | >15% 目标有依赖 |
| 阻塞准确率 | 100% |
| 依赖完成通知打开率 | >70% |

---

**文档状态**: ✅ Ready for Review

