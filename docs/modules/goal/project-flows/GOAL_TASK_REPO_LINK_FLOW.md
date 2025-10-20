# 目标/任务/知识包联动实现流程文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-20
- **架构模式**: DDD (Goal, Task, Repository 模块联动)
- **相关模块**: Goal, Task, Repository
- **业务场景**: 目标与任务、知识包建立关联，形成闭环管理

---

## 1. 业务目标与背景

### 1.1 业务目标

- 提升目标-任务-知识联动率 +25%
- 目标达成路径清晰可追溯
- 建立目标驱动的任务与知识管理闭环

### 1.2 核心价值

- 任务可关联到目标（goalUuid 字段）
- 知识包可关联到目标（relatedGoals 字段）
- 目标详情页可查看关联的任务与知识包
- 支持联动追踪：任务完成 → KR 进度更新

---

## 2. 实现流程概览

### 2.1 核心流程

1. 用户在任务详情页关联目标
2. 用户在知识包详情页关联目标
3. 目标详情页展示关联的任务与知识包
4. 任务完成时自动更新关联 KR 的进度

---

## 3. 领域模型与属性

### 3.1 新增/修改属性

| 实体           | 新增/修改 | 属性名                | 类型                      | 说明                |
| -------------- | --------- | --------------------- | ------------------------- | ------------------- |
| Task           | 新增      | goalUuid              | string \| null            | 关联的目标ID        |
| Task           | 新增      | keyResultUuid         | string \| null            | 关联的KR ID（可选） |
| RepositoryItem | 新增      | relatedGoals          | string[]                  | 关联的目标ID数组    |
| Goal           | 新增方法  | getRelatedTasks()     | Promise<Task[]>           | 查询关联任务        |
| Goal           | 新增方法  | getRelatedResources() | Promise<RepositoryItem[]> | 查询关联知识包      |

---

## 4. 详细实现流程

### 4.1 任务关联目标

| 步骤         | 输入             | 输出          | 责任人 | 依赖            | 风险       | 验收标准          |
| ------------ | ---------------- | ------------- | ------ | --------------- | ---------- | ----------------- |
| 前端选择目标 | taskId           | 目标列表      | 前端   | Goal API        | -          | 目标可选          |
| 提交关联     | taskId, goalUuid | 更新后的 Task | 前端   | PUT /tasks/{id} | 网络异常   | 关联成功          |
| 验证目标存在 | goalUuid         | Goal          | 后端   | GoalRepository  | 目标不存在 | 返回 404          |
| 保存关联     | Task             | 更新后的 Task | 后端   | TaskRepository  | 数据库异常 | goalUuid 正确存储 |
| 发布联动事件 | taskId, goalUuid | -             | 后端   | EventBus        | -          | 事件已发布        |

**实现代码片段**：

```typescript
// TaskApplicationService.ts
async linkGoal(
  taskId: string,
  goalUuid: string,
  keyResultUuid?: string,
): Promise<Task> {
  const task = await this.taskRepository.findByUuid(taskId);
  if (!task) throw new Error('Task not found');

  // 验证目标存在
  const goal = await this.goalRepository.findByUuid(goalUuid);
  if (!goal) throw new Error('Goal not found');

  // 验证 KR 存在（如果提供）
  if (keyResultUuid) {
    const kr = goal.keyResults.find(k => k.uuid === keyResultUuid);
    if (!kr) throw new Error('KeyResult not found');
  }

  // 设置关联
  task.linkGoal(goalUuid, keyResultUuid);
  await this.taskRepository.save(task);

  // 发布事件
  eventBus.send('task:goal-linked', { taskId, goalUuid, keyResultUuid });

  return task;
}
```

### 4.2 知识包关联目标

| 步骤         | 输入                    | 输出                    | 责任人 | 依赖                     | 风险           | 验收标准              |
| ------------ | ----------------------- | ----------------------- | ------ | ------------------------ | -------------- | --------------------- |
| 前端选择目标 | resourceId              | 目标列表                | 前端   | Goal API                 | -              | 可多选目标            |
| 提交关联     | resourceId, goalUuids[] | 更新后的 RepositoryItem | 前端   | PUT /resources/{id}      | 网络异常       | 关联成功              |
| 验证目标存在 | goalUuids[]             | Goals[]                 | 后端   | GoalRepository           | 部分目标不存在 | 返回 404              |
| 保存关联     | RepositoryItem          | 更新后的 RepositoryItem | 后端   | RepositoryItemRepository | 数据库异常     | relatedGoals 正确存储 |

**实现代码片段**：

```typescript
// RepositoryApplicationService.ts
async linkGoals(
  resourceId: string,
  goalUuids: string[],
): Promise<RepositoryItem> {
  const resource = await this.resourceRepository.findByUuid(resourceId);
  if (!resource) throw new Error('Resource not found');

  // 验证目标存在
  for (const goalUuid of goalUuids) {
    const goal = await this.goalRepository.findByUuid(goalUuid);
    if (!goal) throw new Error(`Goal ${goalUuid} not found`);
  }

  resource.linkGoals(goalUuids);
  await this.resourceRepository.save(resource);

  return resource;
}
```

### 4.3 目标详情页展示关联

| 步骤           | 输入                 | 输出        | 责任人 | 依赖                     | 风险 | 验收标准           |
| -------------- | -------------------- | ----------- | ------ | ------------------------ | ---- | ------------------ |
| 查询关联任务   | goalUuid             | tasks[]     | 后端   | TaskRepository           | -    | 返回所有关联任务   |
| 查询关联知识包 | goalUuid             | resources[] | 后端   | RepositoryItemRepository | -    | 返回所有关联知识包 |
| 前端渲染       | tasks[], resources[] | 关联列表    | 前端   | -                        | -    | 关联清晰展示       |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async getGoalDetails(goalUuid: string): Promise<GoalDetailsDTO> {
  const goal = await this.goalRepository.findByUuid(goalUuid);
  if (!goal) throw new Error('Goal not found');

  // 查询关联任务
  const tasks = await this.taskRepository.findByGoalUuid(goalUuid);

  // 查询关联知识包
  const resources = await this.resourceRepository.findByGoalUuid(goalUuid);

  return {
    ...goal.toClientDTO(),
    relatedTasks: tasks.map(t => t.toClientDTO()),
    relatedResources: resources.map(r => r.toClientDTO()),
  };
}
```

### 4.4 任务完成联动 KR 进度

| 步骤             | 输入                    | 输出        | 责任人 | 依赖           | 风险         | 验收标准     |
| ---------------- | ----------------------- | ----------- | ------ | -------------- | ------------ | ------------ |
| 监听任务完成事件 | taskId                  | Task        | 后端   | EventBus       | -            | 事件监听正常 |
| 查询关联 KR      | goalUuid, keyResultUuid | KeyResult   | 后端   | GoalRepository | KR 不存在    | KR 查询成功  |
| 更新 KR 进度     | KeyResult               | 更新后的 KR | 后端   | -              | 进度计算错误 | 进度准确更新 |
| 生成快照         | goalUuid                | KRSnapshot  | 后端   | -              | -            | 快照已生成   |

**实现代码片段**：

```typescript
// TaskEventHandler.ts
@EventListener('task:completed')
async onTaskCompleted(event: TaskCompletedEvent) {
  const { taskId } = event;
  const task = await this.taskRepository.findByUuid(taskId);

  if (task.goalUuid && task.keyResultUuid) {
    const goal = await this.goalRepository.findByUuid(task.goalUuid);
    const kr = goal.keyResults.find(k => k.uuid === task.keyResultUuid);

    if (kr) {
      // 自动增加 KR 进度（假设每个任务贡献 1 单位）
      kr.incrementProgress(1);
      await this.goalRepository.save(goal);

      // 生成快照
      await this.goalService.createSnapshot(goal.uuid, 'KR_COMPLETED');
    }
  }
}
```

---

## 5. 错误与异常处理

| 错误场景     | HTTP 状态 | 错误码             | 处理方式 |
| ------------ | --------- | ------------------ | -------- |
| 目标不存在   | 404       | GOAL_NOT_FOUND     | 提示用户 |
| KR 不存在    | 404       | KR_NOT_FOUND       | 提示用户 |
| 任务不存在   | 404       | TASK_NOT_FOUND     | 提示用户 |
| 知识包不存在 | 404       | RESOURCE_NOT_FOUND | 提示用户 |

---

## 6. 安全与合规

- **权限校验**：仅资源所有者可关联目标
- **数据隔离**：用户只能关联自己的目标
- **审计日志**：记录所有关联操作

---

## 7. 测试策略

### 7.1 单元测试

- 任务关联目标
- 知识包关联目标
- 任务完成联动 KR 进度

### 7.2 集成测试

- 关联 → 查询 → 展示
- 任务完成 → KR 进度更新 → 快照生成

### 7.3 E2E 测试

```gherkin
Feature: 目标任务知识包联动

Scenario: 任务关联目标并完成
  Given 用户已创建目标"Q1 增长目标"，包含 KR"新增用户 1000"
  When 用户创建任务"推广活动 A"并关联到该 KR
  Then 目标详情页展示该任务
  When 用户完成任务"推广活动 A"
  Then KR"新增用户 1000"的进度自动增加
  And 系统生成快照
```

---

## 8. 未来优化

1. **批量关联**：支持批量任务关联目标
2. **智能推荐**：推荐相关任务与知识包
3. **影响分析**：任务变更时分析对目标的影响
4. **可视化**：目标-任务-知识包关系图谱

---

## 9. 相关文档

- [目标/任务/知识包联动功能文档](../features/03-goal-task-repo-link.md)
- [Goal 模块设计](../GOAL_MODULE_DESIGN.md)
- [Task 模块设计](../../task/TASK_MODULE_DESIGN.md)
- [Repository 模块设计](../../repository/REPOSITORY_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-20 | AI Assistant | 初始版本 |
