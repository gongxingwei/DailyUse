# 目标健康度评分实现流程文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-20
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal
- **业务场景**: 综合评估目标健康度并给出优化建议

---

## 1. 业务目标与背景

### 1.1 业务目标

- 提升低分目标优化率 +40%
- 实现目标管理科学化
- 建立目标质量评估体系

### 1.2 核心价值

- 综合 KR 完成率、逾期率、进展速度等指标为目标打分
- 分级展示健康度（优秀/良好/一般/差）
- 提供针对性优化建议

---

## 2. 实现流程概览

### 2.1 核心流程

1. 系统定时计算目标健康度评分
2. 根据评分分级（优秀/良好/一般/差）
3. 生成优化建议
4. 前端展示评分与建议

---

## 3. 领域模型与属性

### 3.1 新增/修改属性

| 实体 | 新增/修改 | 属性名                 | 类型     | 说明                |
| ---- | --------- | ---------------------- | -------- | ------------------- |
| Goal | 新增      | healthScore            | number   | 健康度评分（0-100） |
| Goal | 新增      | healthGrade            | string   | 健康度分级          |
| Goal | 新增      | healthSuggestions      | string[] | 优化建议            |
| Goal | 新增方法  | calculateHealthScore() | number   | 计算健康度评分      |

### 3.2 评分算法

```typescript
interface HealthScoreFactors {
  krCompletionRate: number; // KR 完成率（权重 40%）
  progressRate: number; // 进展速度（权重 30%）
  onTimeRate: number; // 按时完成率（权重 20%）
  reviewRate: number; // 复盘频率（权重 10%）
}

function calculateHealthScore(factors: HealthScoreFactors): number {
  return (
    factors.krCompletionRate * 0.4 +
    factors.progressRate * 0.3 +
    factors.onTimeRate * 0.2 +
    factors.reviewRate * 0.1
  );
}

function getHealthGrade(score: number): string {
  if (score >= 90) return 'EXCELLENT'; // 优秀
  if (score >= 75) return 'GOOD'; // 良好
  if (score >= 60) return 'FAIR'; // 一般
  return 'POOR'; // 差
}
```

---

## 4. 详细实现流程

### 4.1 计算健康度评分

| 步骤             | 输入        | 输出             | 责任人   | 依赖            | 风险       | 验收标准             |
| ---------------- | ----------- | ---------------- | -------- | --------------- | ---------- | -------------------- |
| 定时任务触发     | -           | -                | Schedule | -               | 调度失败   | 每天执行             |
| 查询所有活跃目标 | -           | goals[]          | 后端     | GoalRepository  | -          | 返回所有 ACTIVE 目标 |
| 计算 KR 完成率   | goal        | krCompletionRate | 后端     | KeyResult       | -          | 完成率准确           |
| 计算进展速度     | goal        | progressRate     | 后端     | ProgressHistory | 历史不足   | 速度准确             |
| 计算按时完成率   | goal        | onTimeRate       | 后端     | Deadline        | -          | 按时率准确           |
| 计算复盘频率     | goal        | reviewRate       | 后端     | Reviews         | -          | 频率准确             |
| 综合计算评分     | factors     | healthScore      | 后端     | -               | -          | 评分准确             |
| 确定分级         | healthScore | healthGrade      | 后端     | -               | -          | 分级准确             |
| 生成建议         | factors     | suggestions[]    | 后端     | -               | -          | 建议可用             |
| 保存评分         | goal        | -                | 后端     | GoalRepository  | 数据库异常 | 评分已保存           |

**实现代码片段**：

```typescript
// Goal.ts (领域模型)
calculateHealthScore(): number {
  // 1. KR 完成率
  const completedKRs = this.keyResults.filter(kr => kr.status === 'COMPLETED').length;
  const krCompletionRate = (completedKRs / this.keyResults.length) * 100;

  // 2. 进展速度（基于加权平均进度与时间进度的比率）
  const totalProgress = this.calculateTotalProgress();
  const timeElapsed = (Date.now() - this.startAt) / (this.deadline - this.startAt);
  const progressRate = Math.min((totalProgress / 100) / timeElapsed, 1) * 100;

  // 3. 按时完成率
  const isOnTime = Date.now() <= this.deadline;
  const onTimeRate = isOnTime ? 100 : Math.max(0, 100 - (Date.now() - this.deadline) / (24 * 60 * 60 * 1000) * 10);

  // 4. 复盘频率
  const expectedReviews = Math.floor((Date.now() - this.startAt) / (this.focusCycleDays * 24 * 60 * 60 * 1000));
  const reviewRate = Math.min(this.reviews.length / expectedReviews, 1) * 100;

  // 综合评分
  const healthScore = (
    krCompletionRate * 0.4 +
    progressRate * 0.3 +
    onTimeRate * 0.2 +
    reviewRate * 0.1
  );

  this.healthScore = Math.round(healthScore);
  this.healthGrade = this.getHealthGrade(this.healthScore);
  this.healthSuggestions = this.generateSuggestions({
    krCompletionRate,
    progressRate,
    onTimeRate,
    reviewRate,
  });

  return this.healthScore;
}

private getHealthGrade(score: number): string {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'FAIR';
  return 'POOR';
}

private generateSuggestions(factors: HealthScoreFactors): string[] {
  const suggestions: string[] = [];

  if (factors.krCompletionRate < 50) {
    suggestions.push('KR 完成率较低，建议重新评估 KR 难度或分解为更小的任务');
  }

  if (factors.progressRate < 50) {
    suggestions.push('进展速度缓慢，建议增加投入或调整优先级');
  }

  if (factors.onTimeRate < 70) {
    suggestions.push('存在逾期风险，建议调整截止日期或加快进度');
  }

  if (factors.reviewRate < 70) {
    suggestions.push('复盘频率较低，建议按时复盘以及时调整策略');
  }

  return suggestions;
}
```

**定时任务**：

```typescript
// GoalHealthScoreScheduler.ts
@Scheduled('0 10 * * *') // 每天 10:00 执行
async calculateGoalHealthScores() {
  const activeGoals = await this.goalRepository.findByStatus('ACTIVE');

  for (const goal of activeGoals) {
    try {
      goal.calculateHealthScore();
      await this.goalRepository.save(goal);

      logger.info('Goal health score calculated', {
        goalId: goal.uuid,
        healthScore: goal.healthScore,
        healthGrade: goal.healthGrade,
      });

      // 如果评分过低，发送预警
      if (goal.healthScore < 60) {
        await this.notificationService.sendLowHealthAlert({
          goalId: goal.uuid,
          healthScore: goal.healthScore,
          suggestions: goal.healthSuggestions,
        });
      }
    } catch (error) {
      logger.error('Failed to calculate health score', { goalId: goal.uuid, error });
    }
  }
}
```

### 4.2 展示健康度评分

| 步骤       | 输入     | 输出                                  | 责任人 | 依赖           | 风险 | 验收标准     |
| ---------- | -------- | ------------------------------------- | ------ | -------------- | ---- | ------------ |
| 查询评分   | goalId   | healthScore, healthGrade, suggestions | 后端   | GoalRepository | -    | 返回评分数据 |
| 前端渲染   | 评分数据 | 评分卡片 + 建议列表                   | 前端   | -              | -    | 评分清晰展示 |
| 健康度趋势 | goalId   | 历史评分                              | 后端   | -              | -    | 趋势图可用   |

---

## 5. 错误与异常处理

| 错误场景     | HTTP 状态 | 错误码            | 处理方式       |
| ------------ | --------- | ----------------- | -------------- |
| 目标不存在   | 404       | GOAL_NOT_FOUND    | 提示用户       |
| 历史数据不足 | -         | INSUFFICIENT_DATA | 返回默认评分   |
| 计算异常     | 500       | CALCULATION_ERROR | 记录日志，重试 |

---

## 6. 安全与合规

- **权限校验**：仅目标所有者可查看健康度
- **数据隔离**：用户只能查看自己的目标评分
- **审计日志**：记录评分计算

---

## 7. 测试策略

### 7.1 单元测试

- 评分算法准确性
- 分级逻辑
- 建议生成

### 7.2 集成测试

- 计算评分 → 保存 → 查询 → 展示

### 7.3 E2E 测试

```gherkin
Feature: 目标健康度评分

Scenario: 查看目标健康度评分与建议
  Given 用户已创建目标"Q1 增长目标"
  When 系统计算健康度评分
  Then 目标评分为 85，分级为"良好"
  And 展示优化建议"建议增加复盘频率"
```

---

## 8. 未来优化

1. **自定义权重**：允许用户自定义评分因子权重
2. **对标分析**：与团队/行业平均分对标
3. **历史趋势**：展示健康度变化趋势
4. **AI 建议**：基于机器学习生成个性化建议

---

## 9. 相关文档

- [目标健康度评分功能文档](../features/06-goal-health-score.md)
- [Goal 模块设计](../GOAL_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-20 | AI Assistant | 初始版本 |
