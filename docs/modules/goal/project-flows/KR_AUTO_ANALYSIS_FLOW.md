# KR 进展自动采集与分析实现流程文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-20
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal, Task
- **业务场景**: 自动采集 KR 进展数据，智能分析趋势与风险

---

## 1. 业务目标与背景

### 1.1 业务目标

- 提升 KR 进展采集率 +30%
- 提升风险预警准确率
- 减少手动更新 KR 的工作量

### 1.2 核心价值

- 自动从关联任务、数据源采集 KR 进展
- 智能分析进展趋势（加速/减速/停滞）
- 提前预警风险（进度落后、增长缓慢）

---

## 2. 实现流程概览

### 2.1 核心流程

1. 用户配置 KR 的自动采集规则（数据源）
2. 系统定时采集数据并更新 KR 进度
3. 分析进展趋势与风险
4. 生成分析报告并通知用户

---

## 3. 领域模型与属性

### 3.1 新增/修改属性

| 实体      | 新增/修改 | 属性名            | 类型              | 说明         |
| --------- | --------- | ----------------- | ----------------- | ------------ |
| KeyResult | 新增      | autoCollectConfig | AutoCollectConfig | 自动采集配置 |
| KeyResult | 新增      | progressHistory   | ProgressHistory[] | 进度历史     |
| KeyResult | 新增      | trendAnalysis     | TrendAnalysis     | 趋势分析结果 |

### 3.2 新增值对象

```typescript
interface AutoCollectConfig {
  enabled: boolean;
  source: 'TASK' | 'API' | 'MANUAL'; // 数据源类型
  taskFilter?: {
    status: 'COMPLETED'; // 采集已完成任务数量
  };
  apiConfig?: {
    endpoint: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    valueField: string; // 从响应中提取值的字段
  };
  interval: 'DAILY' | 'WEEKLY'; // 采集频率
}

interface ProgressHistory {
  recordedAt: number; // epoch ms
  value: number;
  source: 'AUTO' | 'MANUAL';
}

interface TrendAnalysis {
  trend: 'ACCELERATING' | 'STABLE' | 'DECELERATING' | 'STALLED';
  avgDailyProgress: number;
  projectedCompletion: number; // 预计完成时间
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason?: string;
}
```

---

## 4. 详细实现流程

### 4.1 配置自动采集

| 步骤         | 输入         | 输出         | 责任人 | 依赖                  | 风险         | 验收标准        |
| ------------ | ------------ | ------------ | ------ | --------------------- | ------------ | --------------- |
| 前端配置界面 | krId         | 采集配置表单 | 前端   | KR API                | -            | 配置入口可见    |
| 选择数据源   | -            | 数据源类型   | 前端   | -                     | -            | 可选 TASK/API   |
| 提交配置     | krId, config | 更新后的 KR  | 前端   | PUT /key-results/{id} | 网络异常     | 配置保存成功    |
| 验证配置     | config       | 验证结果     | 后端   | -                     | API 配置错误 | 返回 400 错误   |
| 保存配置     | KeyResult    | 更新后的 KR  | 后端   | GoalRepository        | 数据库异常   | config 正确存储 |

**实现代码片段**：

```typescript
// KeyResultApplicationService.ts
async setAutoCollect(
  krId: string,
  config: AutoCollectConfig,
): Promise<KeyResult> {
  const kr = await this.keyResultRepository.findByUuid(krId);
  if (!kr) throw new Error('KeyResult not found');

  // 验证配置
  if (config.source === 'API' && !config.apiConfig) {
    throw new Error('API config is required');
  }

  kr.setAutoCollectConfig(config);
  await this.keyResultRepository.save(kr);

  return kr;
}
```

### 4.2 自动采集数据

| 步骤                  | 输入      | 输出            | 责任人   | 依赖                | 风险       | 验收标准          |
| --------------------- | --------- | --------------- | -------- | ------------------- | ---------- | ----------------- |
| 定时任务触发          | -         | -               | Schedule | -                   | 调度失败   | 按配置频率执行    |
| 查询启用自动采集的 KR | -         | krs[]           | 后端     | KeyResultRepository | -          | 返回所有启用的 KR |
| 采集数据              | kr        | 新进度值        | 后端     | 数据源              | 数据源异常 | 数据采集成功      |
| 更新 KR 进度          | kr, value | 更新后的 KR     | 后端     | -                   | -          | 进度正确更新      |
| 记录进度历史          | kr, value | ProgressHistory | 后端     | -                   | -          | 历史已记录        |

**实现代码片段**：

```typescript
// KeyResultAutoCollectScheduler.ts
@Scheduled('0 9 * * *') // 每天 9:00 执行
async collectKRProgress() {
  const krs = await this.keyResultRepository.findByAutoCollectEnabled(true);

  for (const kr of krs) {
    try {
      const newValue = await this.collectData(kr);
      kr.updateProgress(newValue);
      kr.recordProgressHistory(newValue, 'AUTO');
      await this.keyResultRepository.save(kr);

      logger.info('KR progress collected', { krId: kr.uuid, newValue });
    } catch (error) {
      logger.error('Failed to collect KR progress', { krId: kr.uuid, error });
    }
  }
}

private async collectData(kr: KeyResult): Promise<number> {
  const config = kr.autoCollectConfig!;

  switch (config.source) {
    case 'TASK':
      // 从关联任务采集
      const tasks = await this.taskRepository.findByKRUuid(kr.uuid);
      return tasks.filter(t => t.status === 'COMPLETED').length;

    case 'API':
      // 从外部 API 采集
      const response = await axios.request({
        url: config.apiConfig!.endpoint,
        method: config.apiConfig!.method,
        headers: config.apiConfig!.headers,
      });
      return response.data[config.apiConfig!.valueField];

    default:
      throw new Error('Unsupported source');
  }
}
```

### 4.3 趋势分析

| 步骤         | 输入                          | 输出                | 责任人 | 依赖                | 风险         | 验收标准       |
| ------------ | ----------------------------- | ------------------- | ------ | ------------------- | ------------ | -------------- |
| 计算日均进度 | progressHistory[]             | avgDailyProgress    | 后端   | -                   | 历史数据不足 | 计算准确       |
| 判断趋势     | progressHistory[]             | trend               | 后端   | -                   | -            | 趋势判断准确   |
| 预测完成时间 | avgDailyProgress, targetValue | projectedCompletion | 后端   | -                   | 增长率为0    | 预测合理       |
| 评估风险     | projectedCompletion, deadline | riskLevel           | 后端   | -                   | -            | 风险等级准确   |
| 保存分析结果 | TrendAnalysis                 | -                   | 后端   | KeyResultRepository | 数据库异常   | 分析结果已保存 |

**实现代码片段**：

```typescript
// KeyResult.ts (领域模型)
analyzeTrend(): TrendAnalysis {
  const history = this.progressHistory.slice(-7); // 最近 7 条记录
  if (history.length < 2) {
    return { trend: 'STABLE', avgDailyProgress: 0, projectedCompletion: 0, riskLevel: 'LOW' };
  }

  // 计算日均进度
  const totalDays = (history[history.length - 1].recordedAt - history[0].recordedAt) / (24 * 60 * 60 * 1000);
  const totalProgress = history[history.length - 1].value - history[0].value;
  const avgDailyProgress = totalProgress / totalDays;

  // 判断趋势
  let trend: string;
  if (avgDailyProgress === 0) trend = 'STALLED';
  else if (avgDailyProgress > this.avgDailyProgress * 1.2) trend = 'ACCELERATING';
  else if (avgDailyProgress < this.avgDailyProgress * 0.8) trend = 'DECELERATING';
  else trend = 'STABLE';

  // 预测完成时间
  const remainingProgress = this.targetValue - this.currentValue;
  const daysToComplete = avgDailyProgress > 0 ? remainingProgress / avgDailyProgress : Infinity;
  const projectedCompletion = Date.now() + daysToComplete * 24 * 60 * 60 * 1000;

  // 评估风险
  let riskLevel: string;
  if (this.deadline && projectedCompletion > this.deadline) riskLevel = 'HIGH';
  else if (trend === 'STALLED' || trend === 'DECELERATING') riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  return { trend, avgDailyProgress, projectedCompletion, riskLevel };
}
```

### 4.4 展示分析报告

| 步骤         | 输入          | 输出              | 责任人 | 依赖                | 风险 | 验收标准     |
| ------------ | ------------- | ----------------- | ------ | ------------------- | ---- | ------------ |
| 查询分析结果 | krId          | TrendAnalysis     | 后端   | KeyResultRepository | -    | 返回分析结果 |
| 前端渲染     | TrendAnalysis | 趋势图 + 风险提示 | 前端   | 图表库              | -    | 趋势清晰展示 |

---

## 5. 错误与异常处理

| 错误场景     | HTTP 状态 | 错误码             | 处理方式       |
| ------------ | --------- | ------------------ | -------------- |
| KR 不存在    | 404       | KR_NOT_FOUND       | 提示用户       |
| API 配置错误 | 400       | INVALID_API_CONFIG | 前端校验       |
| 数据源异常   | 500       | DATA_SOURCE_ERROR  | 记录日志，重试 |
| 历史数据不足 | -         | INSUFFICIENT_DATA  | 返回默认分析   |

---

## 6. 安全与合规

- **权限校验**：仅 KR 所有者可配置自动采集
- **数据隔离**：用户只能采集自己的数据
- **API 密钥管理**：加密存储 API 配置

---

## 7. 测试策略

### 7.1 单元测试

- 数据采集逻辑
- 趋势分析算法
- 风险评估逻辑

### 7.2 集成测试

- 配置 → 采集 → 分析 → 展示

### 7.3 E2E 测试

```gherkin
Feature: KR 自动采集与分析

Scenario: 从任务自动采集 KR 进度
  Given 用户已创建 KR"完成 10 个任务"
  And 配置自动采集，数据源为"关联任务"
  When 用户完成 3 个关联任务
  And 系统执行自动采集
  Then KR 进度自动更新为 3
  And 系统生成趋势分析报告
```

---

## 8. 未来优化

1. **多数据源融合**：支持从多个数据源采集并融合
2. **机器学习预测**：基于历史数据预测未来趋势
3. **异常检测**：自动检测异常波动
4. **智能建议**：根据分析结果提供优化建议

---

## 9. 相关文档

- [KR 进展自动采集与分析功能文档](../features/05-kr-auto-analysis.md)
- [Goal 模块设计](../GOAL_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-20 | AI Assistant | 初始版本 |
