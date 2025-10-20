# 目标历史与趋势分析实现流程文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-20
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal
- **业务场景**: 统计分析目标历史数据，提供趋势图与异常检测

---

## 1. 业务目标与背景

### 1.1 业务目标

- 提升目标调整及时率 +15%
- 决策数据化
- 建立目标绩效分析体系

### 1.2 核心价值

- 统计目标历史进展、逾期率、完成率
- 可视化趋势图（进度曲线、KR 完成率变化）
- 自动检测异常（进度突降、长时间停滞）

---

## 2. 实现流程概览

### 2.1 核心流程

1. 系统定时汇总目标历史数据
2. 计算关键指标（完成率、逾期率、平均进展速度）
3. 生成趋势图数据
4. 检测异常并预警
5. 前端展示分析报告

---

## 3. 领域模型与属性

### 3.1 新增/修改属性

| 实体 | 新增/修改 | 属性名       | 类型         | 说明         |
| ---- | --------- | ------------ | ------------ | ------------ |
| Goal | 新增      | historyStats | HistoryStats | 历史统计数据 |
| Goal | 新增      | trendData    | TrendData[]  | 趋势图数据   |
| Goal | 新增      | anomalies    | Anomaly[]    | 异常记录     |

### 3.2 新增值对象

```typescript
interface HistoryStats {
  totalDays: number; // 总天数
  completedKRs: number; // 已完成 KR 数
  avgDailyProgress: number; // 日均进度
  overdueCount: number; // 逾期次数
  reviewCount: number; // 复盘次数
  lastUpdatedAt: number; // 最后更新时间
}

interface TrendData {
  date: number; // epoch ms
  totalProgress: number; // 总进度
  completedKRs: number; // 已完成 KR 数
  healthScore: number; // 健康度评分
}

interface Anomaly {
  detectedAt: number; // 检测时间
  type: 'PROGRESS_DROP' | 'STALLED' | 'SUDDEN_INCREASE';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

---

## 4. 详细实现流程

### 4.1 汇总历史数据

| 步骤         | 输入        | 输出         | 责任人   | 依赖           | 风险       | 验收标准     |
| ------------ | ----------- | ------------ | -------- | -------------- | ---------- | ------------ |
| 定时任务触发 | -           | -            | Schedule | -              | 调度失败   | 每天执行     |
| 查询目标快照 | goalId      | snapshots[]  | 后端     | GoalRepository | -          | 返回所有快照 |
| 计算关键指标 | snapshots[] | HistoryStats | 后端     | -              | 计算错误   | 指标准确     |
| 生成趋势数据 | snapshots[] | TrendData[]  | 后端     | -              | -          | 趋势数据正确 |
| 保存统计数据 | goal        | -            | 后端     | GoalRepository | 数据库异常 | 数据已保存   |

**实现代码片段**：

```typescript
// GoalAnalyticsService.ts
async analyzeGoalHistory(goalId: string): Promise<void> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  const snapshots = goal.keyResultSnapshots;
  if (snapshots.length === 0) return;

  // 计算历史统计
  const totalDays = Math.ceil((Date.now() - goal.startAt) / (24 * 60 * 60 * 1000));
  const completedKRs = goal.keyResults.filter(kr => kr.status === 'COMPLETED').length;
  const avgDailyProgress = goal.calculateTotalProgress() / totalDays;
  const overdueCount = goal.isOverdue ? 1 : 0;
  const reviewCount = goal.reviews.length;

  goal.historyStats = {
    totalDays,
    completedKRs,
    avgDailyProgress,
    overdueCount,
    reviewCount,
    lastUpdatedAt: Date.now(),
  };

  // 生成趋势数据
  goal.trendData = snapshots.map(snapshot => ({
    date: snapshot.snapshotAt,
    totalProgress: snapshot.totalProgress,
    completedKRs: snapshot.keyResults.filter(kr => kr.status === 'COMPLETED').length,
    healthScore: goal.healthScore, // 从快照或当前值获取
  }));

  await this.goalRepository.save(goal);
}
```

### 4.2 异常检测

| 步骤           | 输入        | 输出     | 责任人 | 依赖                | 风险       | 验收标准   |
| -------------- | ----------- | -------- | ------ | ------------------- | ---------- | ---------- |
| 检测进度突降   | trendData[] | Anomaly? | 后端   | -                   | 误报       | 异常准确   |
| 检测长时间停滞 | trendData[] | Anomaly? | 后端   | -                   | 误报       | 异常准确   |
| 检测突增       | trendData[] | Anomaly? | 后端   | -                   | 误报       | 异常准确   |
| 保存异常记录   | goal        | -        | 后端   | GoalRepository      | 数据库异常 | 异常已保存 |
| 发送预警       | anomaly     | -        | 后端   | NotificationService | 通知失败   | 预警已发送 |

**实现代码片段**：

```typescript
// GoalAnalyticsService.ts
async detectAnomalies(goalId: string): Promise<void> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  const trendData = goal.trendData.slice(-7); // 最近 7 天
  if (trendData.length < 2) return;

  const anomalies: Anomaly[] = [];

  // 检测进度突降
  for (let i = 1; i < trendData.length; i++) {
    const prevProgress = trendData[i - 1].totalProgress;
    const currProgress = trendData[i].totalProgress;

    if (currProgress < prevProgress - 10) { // 进度下降超过 10%
      anomalies.push({
        detectedAt: trendData[i].date,
        type: 'PROGRESS_DROP',
        description: `进度从 ${prevProgress}% 下降到 ${currProgress}%`,
        severity: 'HIGH',
      });
    }
  }

  // 检测长时间停滞
  const recentProgress = trendData.slice(-3).map(d => d.totalProgress);
  if (recentProgress.every(p => p === recentProgress[0])) {
    anomalies.push({
      detectedAt: Date.now(),
      type: 'STALLED',
      description: '近 3 天进度无变化',
      severity: 'MEDIUM',
    });
  }

  // 检测突增
  for (let i = 1; i < trendData.length; i++) {
    const prevProgress = trendData[i - 1].totalProgress;
    const currProgress = trendData[i].totalProgress;

    if (currProgress > prevProgress + 20) { // 进度增加超过 20%
      anomalies.push({
        detectedAt: trendData[i].date,
        type: 'SUDDEN_INCREASE',
        description: `进度从 ${prevProgress}% 增加到 ${currProgress}%`,
        severity: 'LOW',
      });
    }
  }

  goal.anomalies = anomalies;
  await this.goalRepository.save(goal);

  // 发送预警
  for (const anomaly of anomalies) {
    if (anomaly.severity === 'HIGH' || anomaly.severity === 'MEDIUM') {
      await this.notificationService.sendAnomalyAlert({
        goalId,
        anomaly,
      });
    }
  }
}
```

### 4.3 展示分析报告

| 步骤         | 输入        | 输出         | 责任人 | 依赖           | 风险 | 验收标准     |
| ------------ | ----------- | ------------ | ------ | -------------- | ---- | ------------ |
| 查询统计数据 | goalId      | HistoryStats | 后端   | GoalRepository | -    | 返回统计数据 |
| 查询趋势数据 | goalId      | TrendData[]  | 后端   | GoalRepository | -    | 返回趋势数据 |
| 查询异常记录 | goalId      | Anomaly[]    | 后端   | GoalRepository | -    | 返回异常记录 |
| 前端渲染     | 统计数据    | 分析报告     | 前端   | 图表库         | -    | 报告清晰展示 |
| 趋势图       | TrendData[] | 进度曲线     | 前端   | 图表库         | -    | 趋势一目了然 |
| 异常列表     | Anomaly[]   | 异常时间轴   | 前端   | -              | -    | 异常可追溯   |

---

## 5. 错误与异常处理

| 错误场景   | HTTP 状态 | 错误码            | 处理方式       |
| ---------- | --------- | ----------------- | -------------- |
| 目标不存在 | 404       | GOAL_NOT_FOUND    | 提示用户       |
| 数据不足   | -         | INSUFFICIENT_DATA | 返回默认值     |
| 计算异常   | 500       | CALCULATION_ERROR | 记录日志，重试 |

---

## 6. 安全与合规

- **权限校验**：仅目标所有者可查看分析报告
- **数据隔离**：用户只能查看自己的数据
- **审计日志**：记录分析查询

---

## 7. 测试策略

### 7.1 单元测试

- 统计计算准确性
- 异常检测算法
- 趋势数据生成

### 7.2 集成测试

- 汇总 → 分析 → 异常检测 → 展示

### 7.3 E2E 测试

```gherkin
Feature: 目标历史与趋势分析

Scenario: 查看目标分析报告
  Given 用户已创建目标"Q1 增长目标"并运行 30 天
  When 用户查看分析报告
  Then 展示关键指标"日均进度 2%"
  And 展示进度趋势图
  And 展示异常记录"第 15 天进度突降"
```

---

## 8. 未来优化

1. **对比分析**：与历史目标对比
2. **团队分析**：团队目标统计
3. **导出报告**：导出为 PDF/Excel
4. **自定义指标**：用户自定义统计指标

---

## 9. 相关文档

- [目标历史与趋势分析功能文档](../features/07-goal-history-trend.md)
- [Goal 模块设计](../GOAL_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-20 | AI Assistant | 初始版本 |
