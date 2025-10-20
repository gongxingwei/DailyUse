# 专注周期与复盘节奏实现流程文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-20
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal, Reminder
- **业务场景**: 用户为目标设置专注周期（周/月/季度）并定期复盘

---

## 1. 业务目标与背景

### 1.1 业务目标

- 提升目标复盘率 +30%
- 提升 KR 调整及时性
- 建立目标达成的正向反馈闭环

### 1.2 核心价值

- 用户可自定义专注周期（weekly/monthly/quarterly）
- 系统在周期结束时自动触发复盘提醒
- 记录每次复盘内容（reviews 字段），支持历史回溯
- 帮助用户及时调整 KR 权重与目标策略

### 1.3 前置条件

- 用户已创建目标（Goal）
- 目标状态为 ACTIVE
- 用户已配置专注周期（focusCycle 字段）

---

## 2. 实现流程概览

### 2.1 核心流程

1. 用户在目标详情页配置专注周期（weekly/monthly/quarterly）
2. 后端创建定时任务，在周期结束时触发复盘提醒
3. 用户收到提醒，进入复盘页面填写复盘内容
4. 后端保存复盘记录到 reviews 数组
5. 前端展示历史复盘记录与趋势分析

### 2.2 时序图

```
用户端              前端                后端                Reminder模块
  │                  │                   │                      │
  │──配置专注周期──>│                   │                      │
  │                  │──PUT /goals/{id}──>│                      │
  │                  │                   │──保存 focusCycle──>│
  │                  │                   │──创建定时任务──────>│
  │<──配置成功────────│<──200 OK──────────│                      │
  │                  │                   │                      │
  │                  │                   │<──周期到期触发提醒───│
  │<──复盘提醒────────│<──SSE/推送────────│                      │
  │                  │                   │                      │
  │──填写复盘────────>│                   │                      │
  │                  │──POST /goals/{id}/reviews─>│              │
  │                  │                   │──保存 review──────>│
  │<──复盘成功────────│<──200 OK──────────│                      │
  │                  │                   │──创建下一周期提醒──>│
```

---

## 3. 领域模型与属性

### 3.1 现有模型（Goal 聚合根）

```typescript
interface Goal {
  uuid: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  // ... 其他字段
}
```

### 3.2 新增/修改属性

| 实体 | 新增/修改 | 属性名            | 类型                                         | 说明             |
| ---- | --------- | ----------------- | -------------------------------------------- | ---------------- |
| Goal | 新增      | focusCycle        | 'WEEKLY' \| 'MONTHLY' \| 'QUARTERLY' \| null | 专注周期配置     |
| Goal | 新增      | focusCycleStartAt | number (epoch ms)                            | 当前周期开始时间 |
| Goal | 新增      | nextReviewAt      | number (epoch ms)                            | 下次复盘时间     |
| Goal | 新增      | reviews           | Review[]                                     | 复盘记录数组     |

### 3.3 新增值对象（Review）

```typescript
interface Review {
  uuid: string;
  goalUuid: string;
  cycleType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  reviewAt: number; // epoch ms
  content: string; // 复盘内容（Markdown）
  krAdjustments?: {
    krUuid: string;
    beforeWeight: number;
    afterWeight: number;
    reason: string;
  }[];
  createdAt: number;
}
```

---

## 4. 详细实现流程

### 4.1 配置专注周期

| 步骤             | 输入                 | 输出            | 责任人 | 依赖            | 风险         | 验收标准            |
| ---------------- | -------------------- | --------------- | ------ | --------------- | ------------ | ------------------- |
| 前端配置界面     | goalId               | focusCycle 选项 | 前端   | Goal 详情 API   | -            | 配置入口清晰可见    |
| 提交配置请求     | goalId, focusCycle   | 更新后的 Goal   | 前端   | PUT /goals/{id} | 网络异常     | 配置成功提示        |
| 验证周期合法性   | focusCycle           | 验证结果        | 后端   | -               | 无效值       | 仅允许枚举值        |
| 保存 focusCycle  | Goal 实体            | 更新后的 Goal   | 后端   | GoalRepository  | 数据库异常   | focusCycle 正确存储 |
| 计算下次复盘时间 | focusCycle, 当前时间 | nextReviewAt    | 后端   | 日期计算        | 时区问题     | 复盘时间准确        |
| 创建提醒任务     | goalId, nextReviewAt | Reminder        | 后端   | ReminderService | 提醒服务异常 | 提醒已创建          |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async setFocusCycle(goalId: string, focusCycle: FocusCycle): Promise<Goal> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  // 设置周期
  goal.setFocusCycle(focusCycle);

  // 计算下次复盘时间
  const nextReviewAt = this.calculateNextReview(focusCycle);
  goal.setNextReviewAt(nextReviewAt);

  await this.goalRepository.save(goal);

  // 创建提醒
  await this.reminderService.createReviewReminder({
    goalId,
    triggerAt: nextReviewAt,
    message: `Time to review your goal: ${goal.title}`,
  });

  return goal;
}

private calculateNextReview(cycle: FocusCycle): number {
  const now = Date.now();
  switch (cycle) {
    case 'WEEKLY': return now + 7 * 24 * 60 * 60 * 1000;
    case 'MONTHLY': return now + 30 * 24 * 60 * 60 * 1000;
    case 'QUARTERLY': return now + 90 * 24 * 60 * 60 * 1000;
  }
}
```

### 4.2 触发复盘提醒

| 步骤         | 输入           | 输出          | 责任人        | 依赖          | 风险     | 验收标准     |
| ------------ | -------------- | ------------- | ------------- | ------------- | -------- | ------------ |
| 定时任务触发 | nextReviewAt   | Reminder 事件 | Reminder 模块 | Schedule      | 调度失败 | 提醒准时触发 |
| 发送通知     | goalId, userId | 推送消息      | Notification  | 推送服务      | 推送失败 | 用户收到通知 |
| 前端展示提醒 | 推送消息       | 复盘入口      | 前端          | SSE/WebSocket | 连接断开 | 复盘入口可见 |

### 4.3 填写复盘内容

| 步骤             | 输入                           | 输出          | 责任人 | 依赖                     | 风险         | 验收标准        |
| ---------------- | ------------------------------ | ------------- | ------ | ------------------------ | ------------ | --------------- |
| 前端复盘表单     | goalId                         | 复盘内容表单  | 前端   | Goal 详情                | -            | 表单可用        |
| 提交复盘         | goalId, content, krAdjustments | Review 实体   | 前端   | POST /goals/{id}/reviews | 网络异常     | 复盘成功提示    |
| 验证复盘内容     | content                        | 验证结果      | 后端   | -                        | 内容为空     | 必填项校验      |
| 保存 Review      | Review 实体                    | 更新后的 Goal | 后端   | GoalRepository           | 数据库异常   | Review 正确存储 |
| 更新 KR 权重     | krAdjustments                  | 更新后的 KR   | 后端   | KeyResult                | KR 不存在    | 权重调整生效    |
| 创建下一周期提醒 | goalId, focusCycle             | Reminder      | 后端   | ReminderService          | 提醒服务异常 | 下次提醒已创建  |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async createReview(
  goalId: string,
  input: CreateReviewInput,
): Promise<Review> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  // 创建复盘记录
  const review = Review.create({
    goalUuid: goalId,
    cycleType: goal.focusCycle!,
    reviewAt: Date.now(),
    content: input.content,
    krAdjustments: input.krAdjustments,
  });

  // 保存到 Goal
  goal.addReview(review);

  // 更新 KR 权重
  if (input.krAdjustments) {
    for (const adj of input.krAdjustments) {
      const kr = goal.keyResults.find(k => k.uuid === adj.krUuid);
      if (kr) kr.setWeight(adj.afterWeight);
    }
  }

  await this.goalRepository.save(goal);

  // 创建下一周期提醒
  const nextReviewAt = this.calculateNextReview(goal.focusCycle!);
  goal.setNextReviewAt(nextReviewAt);
  await this.reminderService.createReviewReminder({
    goalId,
    triggerAt: nextReviewAt,
    message: `Time to review your goal: ${goal.title}`,
  });

  return review;
}
```

### 4.4 展示历史复盘

| 步骤         | 输入      | 输出       | 责任人 | 依赖           | 风险         | 验收标准     |
| ------------ | --------- | ---------- | ------ | -------------- | ------------ | ------------ |
| 查询复盘记录 | goalId    | reviews[]  | 后端   | GoalRepository | -            | 返回所有复盘 |
| 前端渲染列表 | reviews[] | 复盘时间轴 | 前端   | -              | -            | 历史可追溯   |
| 趋势分析     | reviews[] | 趋势图     | 前端   | 图表库         | 数据格式异常 | 趋势一目了然 |

---

## 5. 错误与异常处理

| 错误场景          | HTTP 状态 | 错误码                 | 处理方式       |
| ----------------- | --------- | ---------------------- | -------------- |
| 目标不存在        | 404       | GOAL_NOT_FOUND         | 提示用户       |
| focusCycle 值非法 | 400       | INVALID_FOCUS_CYCLE    | 前端枚举限制   |
| 复盘内容为空      | 400       | EMPTY_REVIEW_CONTENT   | 必填项校验     |
| 提醒服务异常      | 500       | REMINDER_SERVICE_ERROR | 记录日志，重试 |
| KR 不存在         | 404       | KR_NOT_FOUND           | 跳过该 KR 调整 |

---

## 6. 安全与合规

- **权限校验**：仅目标所有者可配置专注周期与填写复盘
- **数据隔离**：用户只能查看自己的复盘记录
- **审计日志**：记录 focusCycle 配置变更、复盘提交、KR 调整

---

## 7. 测试策略

### 7.1 单元测试

- `calculateNextReview()` 周期计算准确性
- `Review.create()` 复盘记录创建
- `Goal.addReview()` 复盘记录添加

### 7.2 集成测试

- 配置专注周期 → 提醒创建 → 提醒触发 → 填写复盘 → 保存成功
- 多次复盘历史记录查询
- KR 权重调整联动

### 7.3 E2E 测试

```gherkin
Feature: 专注周期与复盘

Scenario: 配置周专注周期并完成首次复盘
  Given 用户已创建目标"学习 DDD"
  When 用户设置专注周期为"每周"
  Then 系统创建 7 天后的复盘提醒
  When 7 天后提醒触发
  Then 用户收到复盘通知
  When 用户填写复盘内容"本周进展顺利"
  Then 复盘记录保存成功
  And 系统创建下一个 7 天后的提醒
```

---

## 8. 未来优化

1. **智能周期推荐**：根据目标类型与用户习惯推荐最佳专注周期
2. **复盘模板**：提供复盘模板（STAR、4L 等）
3. **AI 辅助复盘**：自动汇总本周期 KR 进展与任务完成情况
4. **团队复盘**：支持多人共同复盘目标
5. **复盘提醒策略**：支持提前 N 天提醒、多次提醒

---

## 9. 相关文档

- [专注周期与复盘节奏功能文档](../features/01-focus-cycle-review.md)
- [Goal 模块设计](../GOAL_MODULE_DESIGN.md)
- [Reminder 模块设计](../../reminder/REMINDER_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-20 | AI Assistant | 初始版本 |
