# KR 权重与进度快照实现流程文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-20
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal
- **业务场景**: 为 KR 配置权重并自动生成进度快照，支持历史追溯

---

## 1. 业务目标与背景

### 1.1 业务目标

- 提升 KR 进展准确率 +20%
- 实现目标管理精细化
- 支持 KR 权重动态调整与历史回溯

### 1.2 核心价值

- 用户可为每个 KR 配置权重（0-100），权重总和为 100
- 系统在关键节点（周期结束、KR 完成、手动触发）自动生成快照
- 快照记录当前时间、KR 进度、权重、状态
- 支持历史快照查询与趋势分析

---

## 2. 实现流程概览

### 2.1 核心流程

1. 用户在 KR 详情页配置权重
2. 系统验证权重总和为 100
3. 保存权重到 KeyResult
4. 在关键节点自动生成快照（keyResultSnapshots 字段）
5. 前端展示快照历史与趋势图

### 2.2 时序图

```
用户端              前端                后端                Goal聚合根
  │                  │                   │                      │
  │──配置KR权重────>│                   │                      │
  │                  │──PUT /goals/{id}/key-results/{krId}──>│
  │                  │                   │──验证权重总和────>│
  │                  │                   │──保存权重────────>│
  │<──权重配置成功──│<──200 OK──────────│                      │
  │                  │                   │                      │
  │                  │                   │<──触发快照事件────│
  │                  │                   │──生成快照────────>│
  │                  │                   │──保存快照────────>│
  │                  │                   │                      │
  │──查询快照历史──>│                   │                      │
  │                  │──GET /goals/{id}/snapshots──>│          │
  │<──快照列表──────│<──200 OK──────────│                      │
```

---

## 3. 领域模型与属性

### 3.1 现有模型（KeyResult）

```typescript
interface KeyResult {
  uuid: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}
```

### 3.2 新增/修改属性

| 实体      | 新增/修改 | 属性名             | 类型         | 说明             |
| --------- | --------- | ------------------ | ------------ | ---------------- |
| KeyResult | 新增      | weight             | number       | KR 权重（0-100） |
| Goal      | 新增      | keyResultSnapshots | KRSnapshot[] | KR 快照数组      |

### 3.3 新增值对象（KRSnapshot）

```typescript
interface KRSnapshot {
  uuid: string;
  goalUuid: string;
  snapshotAt: number; // epoch ms
  triggerType: 'CYCLE_END' | 'KR_COMPLETED' | 'MANUAL';
  keyResults: {
    krUuid: string;
    title: string;
    weight: number;
    currentValue: number;
    targetValue: number;
    progress: number; // 0-100
    status: string;
  }[];
  totalProgress: number; // 加权平均进度
  createdAt: number;
}
```

---

## 4. 详细实现流程

### 4.1 配置 KR 权重

| 步骤             | 输入                 | 输出                 | 责任人 | 依赖           | 风险       | 验收标准      |
| ---------------- | -------------------- | -------------------- | ------ | -------------- | ---------- | ------------- |
| 前端权重配置界面 | goalId               | KR 列表 + 权重输入框 | 前端   | Goal API       | -          | 权重可调整    |
| 验证权重总和     | weights[]            | 验证结果             | 前端   | -              | 总和≠100   | 实时提示总和  |
| 提交权重         | goalId, krId, weight | 更新后的 KR          | 前端   | PUT API        | 网络异常   | 权重保存成功  |
| 后端验证         | weights[]            | 验证结果             | 后端   | -              | 总和≠100   | 返回 400 错误 |
| 保存权重         | KeyResult            | 更新后的 KR          | 后端   | GoalRepository | 数据库异常 | 权重正确存储  |
| 触发快照         | goalId               | KRSnapshot           | 后端   | Goal           | -          | 快照已生成    |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async updateKRWeights(
  goalId: string,
  weights: { krId: string; weight: number }[],
): Promise<Goal> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  // 验证权重总和
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight !== 100) {
    throw new Error('Total weight must equal 100');
  }

  // 更新权重
  for (const { krId, weight } of weights) {
    const kr = goal.keyResults.find(k => k.uuid === krId);
    if (!kr) throw new Error(`KR ${krId} not found`);
    kr.setWeight(weight);
  }

  await this.goalRepository.save(goal);

  // 生成快照
  await this.createSnapshot(goalId, 'MANUAL');

  return goal;
}
```

### 4.2 自动生成快照

| 步骤         | 输入              | 输出        | 责任人 | 依赖           | 风险       | 验收标准     |
| ------------ | ----------------- | ----------- | ------ | -------------- | ---------- | ------------ |
| 监听触发事件 | 事件类型          | -           | 后端   | EventBus       | -          | 事件监听正常 |
| 计算当前进度 | Goal              | KR 进度列表 | 后端   | KeyResult      | 计算错误   | 进度准确     |
| 计算加权平均 | KR 进度 + 权重    | 总进度      | 后端   | -              | 权重为0    | 加权平均准确 |
| 创建快照     | Goal, triggerType | KRSnapshot  | 后端   | -              | -          | 快照创建成功 |
| 保存快照     | KRSnapshot        | -           | 后端   | GoalRepository | 数据库异常 | 快照正确存储 |

**触发时机**：

1. **周期结束**：专注周期结束时自动触发
2. **KR 完成**：任一 KR 状态变为 COMPLETED
3. **手动触发**：用户主动生成快照

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async createSnapshot(
  goalId: string,
  triggerType: SnapshotTriggerType,
): Promise<KRSnapshot> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  // 计算每个 KR 的进度
  const krData = goal.keyResults.map(kr => ({
    krUuid: kr.uuid,
    title: kr.title,
    weight: kr.weight,
    currentValue: kr.currentValue,
    targetValue: kr.targetValue,
    progress: (kr.currentValue / kr.targetValue) * 100,
    status: kr.status,
  }));

  // 计算加权平均进度
  const totalProgress = krData.reduce(
    (sum, kr) => sum + (kr.progress * kr.weight / 100),
    0,
  );

  // 创建快照
  const snapshot = KRSnapshot.create({
    goalUuid: goalId,
    snapshotAt: Date.now(),
    triggerType,
    keyResults: krData,
    totalProgress,
  });

  goal.addSnapshot(snapshot);
  await this.goalRepository.save(goal);

  return snapshot;
}
```

### 4.3 查询快照历史

| 步骤           | 输入        | 输出        | 责任人 | 依赖           | 风险         | 验收标准     |
| -------------- | ----------- | ----------- | ------ | -------------- | ------------ | ------------ |
| 查询快照列表   | goalId      | snapshots[] | 后端   | GoalRepository | -            | 返回所有快照 |
| 前端渲染时间轴 | snapshots[] | 时间轴视图  | 前端   | -              | -            | 历史可追溯   |
| 趋势图展示     | snapshots[] | 进度趋势图  | 前端   | 图表库         | 数据格式异常 | 趋势清晰     |

---

## 5. 错误与异常处理

| 错误场景     | HTTP 状态 | 错误码                   | 处理方式       |
| ------------ | --------- | ------------------------ | -------------- |
| 目标不存在   | 404       | GOAL_NOT_FOUND           | 提示用户       |
| KR 不存在    | 404       | KR_NOT_FOUND             | 提示用户       |
| 权重总和≠100 | 400       | INVALID_WEIGHT_SUM       | 前端实时提示   |
| 快照生成失败 | 500       | SNAPSHOT_CREATION_FAILED | 记录日志，重试 |

---

## 6. 安全与合规

- **权限校验**：仅目标所有者可配置权重与查看快照
- **数据隔离**：用户只能查看自己的快照
- **审计日志**：记录权重变更、快照生成

---

## 7. 测试策略

### 7.1 单元测试

- 权重总和验证
- 加权平均进度计算
- 快照创建

### 7.2 集成测试

- 配置权重 → 保存 → 生成快照 → 查询快照
- 权重调整后快照对比

### 7.3 E2E 测试

```gherkin
Feature: KR 权重与快照

Scenario: 配置权重并生成快照
  Given 用户已创建目标"Q1 增长目标"，包含 3 个 KR
  When 用户设置 KR1 权重 50%，KR2 权重 30%，KR3 权重 20%
  Then 权重保存成功
  And 系统自动生成快照
  When 用户查看快照历史
  Then 快照包含所有 KR 的当前进度与权重
```

---

## 8. 未来优化

1. **智能权重推荐**：根据 KR 难度与重要性推荐权重
2. **快照对比**：支持任意两个快照对比
3. **快照导出**：导出为 PDF/图片
4. **快照通知**：生成快照后通知用户

---

## 9. 相关文档

- [KR 权重与进度快照功能文档](../features/02-kr-weight-snapshot.md)
- [Goal 模块设计](../GOAL_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-20 | AI Assistant | 初始版本 |
