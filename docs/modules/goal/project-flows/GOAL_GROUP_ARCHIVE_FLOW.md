# 目标分组与归档实现流程文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-20
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal
- **业务场景**: 支持目标分组管理与归档，提升管理灵活性

---

## 1. 业务目标与背景

### 1.1 业务目标

- 提升目标分类准确率 +20%
- 历史目标管理便捷
- 建立目标生命周期管理机制

### 1.2 核心价值

- 用户可创建目标分组（如"个人成长"、"工作"、"副业"）
- 支持将目标移动到不同分组
- 支持归档已完成/取消的目标
- 支持恢复归档目标

---

## 2. 实现流程概览

### 2.1 核心流程

1. 用户创建目标分组
2. 将目标分配到分组
3. 按分组查看目标
4. 归档不再活跃的目标
5. 查看归档目标并恢复

---

## 3. 领域模型与属性

### 3.1 新增实体（GoalGroup）

```typescript
interface GoalGroup {
  uuid: string;
  userUuid: string;
  name: string;
  description?: string;
  color?: string; // 分组颜色标识
  icon?: string; // 分组图标
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}
```

### 3.2 新增/修改属性

| 实体 | 新增/修改 | 属性名     | 类型                                                 | 说明               |
| ---- | --------- | ---------- | ---------------------------------------------------- | ------------------ |
| Goal | 新增      | groupUuid  | string \| null                                       | 所属分组ID         |
| Goal | 修改      | status     | 'ACTIVE' \| 'ARCHIVED' \| 'COMPLETED' \| 'CANCELLED' | 新增 ARCHIVED 状态 |
| Goal | 新增      | archivedAt | number \| null                                       | 归档时间           |

---

## 4. 详细实现流程

### 4.1 创建目标分组

| 步骤         | 输入              | 输出         | 责任人 | 依赖                | 风险       | 验收标准      |
| ------------ | ----------------- | ------------ | ------ | ------------------- | ---------- | ------------- |
| 前端创建表单 | -                 | 分组创建表单 | 前端   | -                   | -          | 表单可用      |
| 提交创建请求 | name, description | GoalGroup    | 前端   | POST /goal-groups   | 网络异常   | 分组创建成功  |
| 验证分组名称 | name              | 验证结果     | 后端   | -                   | 名称为空   | 返回 400 错误 |
| 创建分组     | GoalGroup         | 创建后的分组 | 后端   | GoalGroupRepository | 数据库异常 | 分组正确存储  |

**实现代码片段**：

```typescript
// GoalGroupApplicationService.ts
async createGroup(
  userUuid: string,
  input: CreateGoalGroupInput,
): Promise<GoalGroup> {
  // 验证名称
  if (!input.name || input.name.trim() === '') {
    throw new Error('Group name is required');
  }

  // 创建分组
  const group = GoalGroup.create({
    userUuid,
    name: input.name,
    description: input.description,
    color: input.color || '#3B82F6',
    icon: input.icon || 'folder',
    sortOrder: await this.getNextSortOrder(userUuid),
  });

  await this.goalGroupRepository.save(group);

  return group;
}

private async getNextSortOrder(userUuid: string): Promise<number> {
  const groups = await this.goalGroupRepository.findByUserUuid(userUuid);
  return groups.length > 0 ? Math.max(...groups.map(g => g.sortOrder)) + 1 : 0;
}
```

### 4.2 将目标分配到分组

| 步骤         | 输入              | 输出          | 责任人 | 依赖                | 风险       | 验收标准           |
| ------------ | ----------------- | ------------- | ------ | ------------------- | ---------- | ------------------ |
| 前端选择分组 | goalId            | 分组列表      | 前端   | GoalGroup API       | -          | 分组可选           |
| 提交分配请求 | goalId, groupUuid | 更新后的 Goal | 前端   | PUT /goals/{id}     | 网络异常   | 分配成功           |
| 验证分组存在 | groupUuid         | GoalGroup     | 后端   | GoalGroupRepository | 分组不存在 | 返回 404           |
| 更新目标分组 | goal              | 更新后的 Goal | 后端   | GoalRepository      | 数据库异常 | groupUuid 正确存储 |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async assignGroup(
  goalId: string,
  groupUuid: string | null,
): Promise<Goal> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  // 验证分组存在（如果提供）
  if (groupUuid) {
    const group = await this.goalGroupRepository.findByUuid(groupUuid);
    if (!group) throw new Error('Goal group not found');
  }

  goal.setGroup(groupUuid);
  await this.goalRepository.save(goal);

  return goal;
}
```

### 4.3 按分组查看目标

| 步骤             | 输入              | 输出     | 责任人 | 依赖                | 风险 | 验收标准     |
| ---------------- | ----------------- | -------- | ------ | ------------------- | ---- | ------------ |
| 查询分组列表     | userUuid          | groups[] | 后端   | GoalGroupRepository | -    | 返回所有分组 |
| 查询分组下的目标 | groupUuid         | goals[]  | 后端   | GoalRepository      | -    | 返回分组目标 |
| 前端渲染         | groups[], goals[] | 分组视图 | 前端   | -                   | -    | 分组清晰展示 |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async getGoalsByGroup(groupUuid: string): Promise<Goal[]> {
  return this.goalRepository.findByGroupUuid(groupUuid);
}

async getGroupedGoals(userUuid: string): Promise<GroupedGoalsDTO> {
  const groups = await this.goalGroupRepository.findByUserUuid(userUuid);
  const ungroupedGoals = await this.goalRepository.findByGroupUuid(null);

  const groupedGoals = await Promise.all(
    groups.map(async group => ({
      group: group.toClientDTO(),
      goals: (await this.goalRepository.findByGroupUuid(group.uuid)).map(g => g.toClientDTO()),
    })),
  );

  return {
    grouped: groupedGoals,
    ungrouped: ungroupedGoals.map(g => g.toClientDTO()),
  };
}
```

### 4.4 归档目标

| 步骤         | 输入   | 输出          | 责任人 | 依赖                     | 风险       | 验收标准           |
| ------------ | ------ | ------------- | ------ | ------------------------ | ---------- | ------------------ |
| 前端归档操作 | goalId | -             | 前端   | -                        | -          | 归档入口可见       |
| 提交归档请求 | goalId | 更新后的 Goal | 前端   | POST /goals/{id}/archive | 网络异常   | 归档成功           |
| 更新目标状态 | goal   | 更新后的 Goal | 后端   | GoalRepository           | 数据库异常 | status 为 ARCHIVED |
| 记录归档时间 | goal   | -             | 后端   | -                        | -          | archivedAt 已设置  |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async archiveGoal(goalId: string): Promise<Goal> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  goal.archive();
  await this.goalRepository.save(goal);

  return goal;
}

// Goal.ts (领域模型)
archive(): void {
  this.status = 'ARCHIVED';
  this.archivedAt = Date.now();
  this.updatedAt = Date.now();
}
```

### 4.5 恢复归档目标

| 步骤         | 输入   | 输出          | 责任人 | 依赖                       | 风险       | 验收标准           |
| ------------ | ------ | ------------- | ------ | -------------------------- | ---------- | ------------------ |
| 前端恢复操作 | goalId | -             | 前端   | -                          | -          | 恢复入口可见       |
| 提交恢复请求 | goalId | 更新后的 Goal | 前端   | POST /goals/{id}/unarchive | 网络异常   | 恢复成功           |
| 更新目标状态 | goal   | 更新后的 Goal | 后端   | GoalRepository             | 数据库异常 | status 为 ACTIVE   |
| 清除归档时间 | goal   | -             | 后端   | -                          | -          | archivedAt 为 null |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async unarchiveGoal(goalId: string): Promise<Goal> {
  const goal = await this.goalRepository.findByUuid(goalId);
  if (!goal) throw new Error('Goal not found');

  goal.unarchive();
  await this.goalRepository.save(goal);

  return goal;
}

// Goal.ts (领域模型)
unarchive(): void {
  this.status = 'ACTIVE';
  this.archivedAt = null;
  this.updatedAt = Date.now();
}
```

### 4.6 批量归档

| 步骤         | 输入      | 输出           | 责任人 | 依赖                      | 风险     | 验收标准         |
| ------------ | --------- | -------------- | ------ | ------------------------- | -------- | ---------------- |
| 前端批量选择 | goalIds[] | -              | 前端   | -                         | -        | 可多选           |
| 提交批量归档 | goalIds[] | 批量结果       | 前端   | POST /goals/batch-archive | 网络异常 | 批量归档成功     |
| 逐个归档     | goalIds[] | 更新后的 Goals | 后端   | GoalRepository            | 部分失败 | 成功归档的已更新 |

**实现代码片段**：

```typescript
// GoalApplicationService.ts
async batchArchiveGoals(goalIds: string[]): Promise<BatchArchiveResult> {
  const results: BatchArchiveResult = {
    succeeded: [],
    failed: [],
  };

  for (const goalId of goalIds) {
    try {
      const goal = await this.archiveGoal(goalId);
      results.succeeded.push({ goalId, goal: goal.toClientDTO() });
    } catch (error: any) {
      results.failed.push({ goalId, reason: error.message });
    }
  }

  return results;
}
```

---

## 5. 错误与异常处理

| 错误场景         | HTTP 状态 | 错误码             | 处理方式          |
| ---------------- | --------- | ------------------ | ----------------- |
| 目标不存在       | 404       | GOAL_NOT_FOUND     | 提示用户          |
| 分组不存在       | 404       | GROUP_NOT_FOUND    | 提示用户          |
| 分组名称为空     | 400       | INVALID_GROUP_NAME | 前端校验          |
| 批量操作部分失败 | 207       | PARTIAL_SUCCESS    | 返回成功/失败列表 |

---

## 6. 安全与合规

- **权限校验**：仅资源所有者可操作分组与归档
- **数据隔离**：用户只能操作自己的数据
- **审计日志**：记录所有分组与归档操作

---

## 7. 测试策略

### 7.1 单元测试

- 分组创建
- 目标分配到分组
- 归档/恢复

### 7.2 集成测试

- 创建分组 → 分配目标 → 查询分组目标
- 归档目标 → 查询归档列表 → 恢复目标

### 7.3 E2E 测试

```gherkin
Feature: 目标分组与归档

Scenario: 创建分组并分配目标
  Given 用户已创建 3 个目标
  When 用户创建分组"个人成长"
  And 将 2 个目标分配到该分组
  Then 分组下展示 2 个目标

Scenario: 归档已完成的目标
  Given 用户已完成目标"Q1 增长目标"
  When 用户归档该目标
  Then 目标状态变为"已归档"
  And 归档列表中可见该目标
```

---

## 8. 未来优化

1. **智能分组**：根据目标类型自动推荐分组
2. **分组模板**：提供预设分组模板
3. **自动归档**：完成/取消的目标自动归档
4. **归档统计**：统计归档目标的完成率

---

## 9. 相关文档

- [目标分组与归档功能文档](../features/08-goal-group-archive.md)
- [Goal 模块设计](../GOAL_MODULE_DESIGN.md)

---

## 10. 变更历史

| 版本 | 日期       | 作者         | 变更说明 |
| ---- | ---------- | ------------ | -------- |
| 1.0  | 2025-10-20 | AI Assistant | 初始版本 |
