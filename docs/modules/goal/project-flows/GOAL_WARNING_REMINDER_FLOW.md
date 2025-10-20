# 目标预警与提醒集成实现流程文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-20
- **架构模式**: DDD (Goal, Reminder 模块联动)
- **相关模块**: Goal, Reminder
- **业务场景**: 目标进展异常时自动预警，并集成提醒模块

---

## 1. 业务目标与背景

### 1.1 业务目标

- 提升目标预警响应率 +20%
- 降低目标逾期率 -15%
- 建立主动式目标风险管理机制

### 1.2 核心价值

- 系统自动检测目标异常（逾期、进度缓慢）
- 通过提醒模块及时通知用户
- 支持预警规则配置（提前 N 天提醒、进度低于 X%）

---

## 2. 实现流程概览

### 2.1 核心流程

1. 系统定时（每天）扫描所有活跃目标
2. 检测异常：逾期、接近截止日期、进度缓慢
3. 生成预警记录并创建提醒
4. 用户收到提醒，进入目标详情页查看

---

## 3. 领域模型与属性

### 3.1 新增/修改属性

| 实体 | 新增/修改 | 属性名         | 类型          | 说明               |
| ---- | --------- | -------------- | ------------- | ------------------ |
| Goal | 新增      | isOverdue      | boolean       | 是否已逾期         |
| Goal | 新增      | daysRemaining  | number        | 距离截止日期的天数 |
| Goal | 新增      | warningConfig  | WarningConfig | 预警配置           |
| Goal | 新增方法  | checkWarning() | WarningResult | 检查是否需要预警   |

### 3.2 新增值对象（WarningConfig）

```typescript
interface WarningConfig {
  enabled: boolean;
  daysBeforeDeadline: number; // 提前 N 天提醒
  slowProgressThreshold: number; // 进度低于 X% 预警
}

interface WarningResult {
  shouldWarn: boolean;
  warningType: 'OVERDUE' | 'APPROACHING_DEADLINE' | 'SLOW_PROGRESS';
  message: string;
}
```

---

## 4. 详细实现流程

### 4.1 预警配置

| 步骤         | 输入                  | 输出          | 责任人 | 依赖            | 风险       | 验收标准               |
| ------------ | --------------------- | ------------- | ------ | --------------- | ---------- | ---------------------- |
| 前端配置界面 | goalId                | 预警配置表单  | 前端   | Goal API        | -          | 配置入口可见           |
| 提交配置     | goalId, warningConfig | 更新后的 Goal | 前端   | PUT /goals/{id} | 网络异常   | 配置保存成功           |
| 保存配置     | Goal                  | 更新后的 Goal | 后端   | GoalRepository  | 数据库异常 | warningConfig 正确存储 |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async setWarningConfig(
  goalId: string,
  config: WarningConfig,
): Promise<Goal> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  goal.setWarningConfig(config);
  await this.goalRepository.save(goal);

  return goal;
}
```

### 4.2 定时扫描与预警检测

| 步骤         | 输入                | 输出          | 责任人   | 依赖                | 风险         | 验收标准             |
| ------------ | ------------------- | ------------- | -------- | ------------------- | ------------ | -------------------- |
| 定时任务触发 | -                   | -             | Schedule | -                   | 调度失败     | 每天执行             |
| 查询活跃目标 | -                   | goals[]       | 后端     | GoalRepository      | -            | 返回所有 ACTIVE 目标 |
| 逐个检查预警 | goal                | WarningResult | 后端     | Goal.checkWarning() | 计算错误     | 预警判断准确         |
| 创建提醒     | goalId, warningType | Reminder      | 后端     | ReminderService     | 提醒服务异常 | 提醒已创建           |
| 记录预警日志 | goalId, warningType | -             | 后端     | Logger              | -            | 日志已记录           |

**实现代码片段**：

```typescript
// Goal.ts (领域模型)
checkWarning(): WarningResult {
  if (!this.warningConfig?.enabled) {
    return { shouldWarn: false, warningType: null, message: '' };
  }

  const now = Date.now();
  const deadline = this.deadline;

  // 检查逾期
  if (deadline && now > deadline) {
    return {
      shouldWarn: true,
      warningType: 'OVERDUE',
      message: `Goal "${this.title}" is overdue`,
    };
  }

  // 检查接近截止日期
  if (deadline) {
    const daysRemaining = Math.ceil((deadline - now) / (24 * 60 * 60 * 1000));
    if (daysRemaining <= this.warningConfig.daysBeforeDeadline) {
      return {
        shouldWarn: true,
        warningType: 'APPROACHING_DEADLINE',
        message: `Goal "${this.title}" is due in ${daysRemaining} days`,
      };
    }
  }

  // 检查进度缓慢
  const totalProgress = this.calculateTotalProgress();
  if (totalProgress < this.warningConfig.slowProgressThreshold) {
    return {
      shouldWarn: true,
      warningType: 'SLOW_PROGRESS',
      message: `Goal "${this.title}" progress is only ${totalProgress}%`,
    };
  }

  return { shouldWarn: false, warningType: null, message: '' };
}
```

**定时任务**：

```typescript
// GoalWarningScheduler.ts
@Scheduled('0 9 * * *') // 每天 9:00 执行
async checkGoalWarnings() {
  const activeGoals = await this.goalRepository.findByStatus('ACTIVE');

  for (const goal of activeGoals) {
    const warningResult = goal.checkWarning();

    if (warningResult.shouldWarn) {
      // 创建提醒
      await this.reminderService.createGoalWarningReminder({
        goalId: goal.uuid,
        warningType: warningResult.warningType,
        message: warningResult.message,
        triggerAt: Date.now(),
      });

      logger.warn('Goal warning created', {
        goalId: goal.uuid,
        warningType: warningResult.warningType,
      });
    }
  }
}
```

### 4.3 用户收到提醒

| 步骤             | 输入     | 输出       | 责任人        | 依赖          | 风险     | 验收标准       |
| ---------------- | -------- | ---------- | ------------- | ------------- | -------- | -------------- |
| 提醒触发         | Reminder | 推送消息   | Reminder 模块 | Notification  | 推送失败 | 用户收到通知   |
| 前端展示提醒     | 推送消息 | 预警提示   | 前端          | SSE/WebSocket | 连接断开 | 预警可见       |
| 点击进入目标详情 | goalId   | 目标详情页 | 前端          | -             | -        | 详情页正确展示 |

---

## 5. 错误与异常处理

| 错误场景     | HTTP 状态 | 错误码                 | 处理方式           |
| ------------ | --------- | ---------------------- | ------------------ |
| 目标不存在   | 404       | GOAL_NOT_FOUND         | 跳过该目标         |
| 提醒服务异常 | 500       | REMINDER_SERVICE_ERROR | 记录日志，下次重试 |
| 定时任务失败 | -         | SCHEDULER_ERROR        | 记录日志，告警     |

---

## 6. 安全与合规

- **权限校验**：仅目标所有者可配置预警
- **数据隔离**：用户只能收到自己的目标预警
- **审计日志**：记录所有预警事件

---

## 7. 测试策略

### 7.1 单元测试

- Goal.checkWarning() 预警判断
- 日期计算准确性

### 7.2 集成测试

- 定时任务 → 预警检测 → 提醒创建 → 用户收到通知

### 7.3 E2E 测试

```gherkin
Feature: 目标预警

Scenario: 目标接近截止日期自动预警
  Given 用户已创建目标"Q1 增长目标"，截止日期为 3 天后
  And 用户配置提前 5 天预警
  When 系统执行预警检测
  Then 系统创建预警提醒
  And 用户收到"距离截止日期 3 天"的通知
```

---

## 8. 未来优化

1. **预警升级**：多次未响应后升级预警优先级
2. **智能预警**：根据历史进展预测风险
3. **预警分组**：支持批量查看所有预警
4. **预警统计**：统计预警响应率与目标达成率的关联

---

## 9. 相关文档

- [目标预警与提醒集成功能文档](../features/04-goal-warning-reminder.md)
- [Goal 模块设计](../GOAL_MODULE_DESIGN.md)
- [Reminder 模块设计](../../reminder/REMINDER_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-20 | AI Assistant | 初始版本 |
