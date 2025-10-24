# EPIC-TASK-002: 任务优先级矩阵

> **Epic ID**: EPIC-TASK-002  
> **功能编号**: TASK-002  
> **RICE 评分**: 576 (Reach: 8, Impact: 6, Confidence: 6, Effort: 0.5)  
> **优先级**: P0  
> **预估工期**: 1-1.5 周 (15 SP)  
> **Sprint**: Sprint 3  
> **状态**: Draft  
> **创建日期**: 2025-10-21

---

## 1. Epic 概述

### 业务价值

基于艾森豪威尔矩阵（重要性×紧急度），自动计算任务优先级并智能排序，帮助用户科学决策"先做什么"，提升任务执行效率。

**核心问题**:

- ❌ 缺少科学的优先级评估方法，凭感觉决策
- ❌ 无法一目了然地看到哪些任务"重要且紧急"
- ❌ 手动排序任务费时费力

**解决方案**:

- ✅ 重要性（1-5）× 紧急度（1-5）自动计算优先级分数（1-25）
- ✅ 四象限矩阵视图（Q1-Q4）可视化展示
- ✅ 一键智能排序，自动按优先级重排任务
- ✅ 支持拖拽调整象限

---

## 2. User Stories

### Story 001: Contracts & Domain - 优先级字段定义

**Story ID**: TASK-002-S001  
**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

#### Acceptance Criteria

```gherkin
Scenario: 定义优先级 Contracts
  When 开发者创建 Contracts
  Then TaskServerDTO 应扩展以下字段：
    | 字段              | 类型    | 默认值 | 说明               |
    | importance        | number  | 3      | 重要性 (1-5)       |
    | urgency           | number  | 3      | 紧急度 (1-5)       |
    | priorityScore     | number  | 9      | 优先级分数 (1-25)  |
    | autoAdjustEnabled | boolean | true   | 是否启用自动调整   |
```

#### Technical Details

**Contracts**:

```typescript
export interface TaskServerDTO {
  // ...existing fields...
  readonly importance: number; // 1-5
  readonly urgency: number; // 1-5
  readonly priorityScore: number; // importance × urgency
  readonly autoAdjustEnabled: boolean;
}
```

**Domain**:

```typescript
export class Task extends AggregateRoot {
  private _importance: number = 3;
  private _urgency: number = 3;
  private _priorityScore: number = 9;

  setPriority(importance: number, urgency: number): void {
    this.validatePriority(importance, urgency);

    const oldScore = this._priorityScore;
    this._importance = importance;
    this._urgency = urgency;
    this._priorityScore = importance * urgency;

    if (oldScore !== this._priorityScore) {
      this.addDomainEvent(
        new TaskPriorityChangedEvent({
          taskUuid: this.uuid,
          oldScore,
          newScore: this._priorityScore,
        }),
      );
    }
  }

  private validatePriority(importance: number, urgency: number): void {
    if (importance < 1 || importance > 5) {
      throw new InvalidPriorityError('重要性必须在 1-5 之间');
    }
    if (urgency < 1 || urgency > 5) {
      throw new InvalidPriorityError('紧急度必须在 1-5 之间');
    }
  }

  getQuadrant(): string {
    if (this._importance >= 4 && this._urgency >= 4) return 'Q1';
    if (this._importance >= 4 && this._urgency < 4) return 'Q2';
    if (this._importance < 4 && this._urgency >= 4) return 'Q3';
    return 'Q4';
  }
}
```

---

### Story 002: Application Service - 优先级管理

**Story ID**: TASK-002-S002  
**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

#### Acceptance Criteria

```gherkin
Scenario: 智能排序任务
  Given 任务列表有 10 个任务
  When 用户调用智能排序服务
  Then 系统应按以下规则排序：
    1. priorityScore 降序
    2. dueDate 升序（越近越优先）
    3. createdAt 升序
  And 更新任务的 orderIndex 字段
```

#### Technical Details

**Application Service**:

```typescript
export class TaskPriorityService {
  async smartSort(taskUuids: string[]): Promise<Task[]> {
    const tasks = await this.taskRepository.findByUuids(taskUuids);

    const sorted = tasks.sort((a, b) => {
      // 1. 优先级分数
      if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      // 2. 截止日期
      if (a.dueDate && b.dueDate) {
        return a.dueDate - b.dueDate;
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      // 3. 创建时间
      return a.createdAt - b.createdAt;
    });

    // 更新 orderIndex
    sorted.forEach((task, index) => {
      task.setOrderIndex(index + 1);
    });

    await this.taskRepository.saveAll(sorted);

    return sorted;
  }

  async batchSetPriority(params: {
    taskUuids: string[];
    importance?: number;
    urgency?: number;
  }): Promise<number> {
    const tasks = await this.taskRepository.findByUuids(params.taskUuids);

    tasks.forEach((task) => {
      const newImportance = params.importance ?? task.importance;
      const newUrgency = params.urgency ?? task.urgency;
      task.setPriority(newImportance, newUrgency);
    });

    await this.taskRepository.saveAll(tasks);

    return tasks.length;
  }
}
```

---

### Story 003: Infrastructure - 数据库扩展

**Story ID**: TASK-002-S003  
**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

#### Technical Details

**Prisma Schema**:

```prisma
model Task {
  // ...existing fields...

  importance           Int      @default(3) @map("importance")
  urgency              Int      @default(3) @map("urgency")
  priorityScore        Int      @default(9) @map("priority_score")
  autoAdjustEnabled    Boolean  @default(true) @map("auto_adjust_enabled")

  @@index([priorityScore(sort: Desc), dueDate(sort: Asc)])
}
```

**Migration**:

```sql
ALTER TABLE "Task" ADD COLUMN "importance" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Task" ADD COLUMN "urgency" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Task" ADD COLUMN "priority_score" INTEGER NOT NULL DEFAULT 9;
ALTER TABLE "Task" ADD COLUMN "auto_adjust_enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Task_priorityScore_dueDate_idx" ON "Task"("priority_score" DESC, "due_date" ASC);
```

---

### Story 004: API Endpoints - 优先级接口

**Story ID**: TASK-002-S004  
**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

#### Technical Details

**API Routes**:

```typescript
// 设置优先级
router.patch('/:id/priority', authenticate, validateBody(SetPrioritySchema), async (req, res) => {
  const { importance, urgency } = req.body;
  const task = await taskApplicationService.setPriority(req.params.id, importance, urgency);
  res.json(toClientDTO(task));
});

// 智能排序
router.post('/batch/smart-sort', authenticate, validateBody(SmartSortSchema), async (req, res) => {
  const { taskUuids } = req.body;
  const sorted = await taskPriorityService.smartSort(taskUuids);
  res.json({
    sortedTasks: sorted.map(toClientDTO),
    count: sorted.length,
  });
});

// 批量设置优先级
router.post(
  '/batch/set-priority',
  authenticate,
  validateBody(BatchSetPrioritySchema),
  async (req, res) => {
    const count = await taskPriorityService.batchSetPriority(req.body);
    res.json({ updatedCount: count });
  },
);

// 获取象限分布
router.get('/priority-matrix', authenticate, async (req, res) => {
  const tasks = await taskApplicationService.getByUser(req.user.uuid);
  const distribution = {
    q1: tasks.filter((t) => t.getQuadrant() === 'Q1'),
    q2: tasks.filter((t) => t.getQuadrant() === 'Q2'),
    q3: tasks.filter((t) => t.getQuadrant() === 'Q3'),
    q4: tasks.filter((t) => t.getQuadrant() === 'Q4'),
  };
  res.json(distribution);
});
```

---

### Story 005: Client Services

**Story ID**: TASK-002-S005  
**Story Points**: 2 SP

#### Technical Details

**React Query Hooks**:

```typescript
export function useSmartSort() {
  const queryClient = useQueryClient();
  const service = new TaskPriorityService();

  return useMutation({
    mutationFn: (taskUuids: string[]) => service.smartSort(taskUuids),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });
}

export function usePriorityMatrix() {
  const service = new TaskPriorityService();

  return useQuery({
    queryKey: ['task-priority-matrix'],
    queryFn: () => service.getMatrixDistribution(),
    staleTime: 5 * 60 * 1000,
  });
}
```

---

### Story 006: UI Component - 四象限矩阵视图

**Story ID**: TASK-002-S006  
**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

#### Acceptance Criteria

```gherkin
Scenario: 显示四象限矩阵
  Given 任务列表有 10 个任务
  When 用户切换到矩阵视图
  Then 应显示 2×2 矩阵布局
  And 每个象限应显示任务数量和建议操作
  And 可拖拽任务在象限间移动
```

#### Technical Details

**Component** (`packages/ui/src/components/task/PriorityMatrixView.vue`):

```vue
<template>
  <div class="priority-matrix">
    <div class="matrix-header">
      <h2>优先级矩阵</h2>
      <el-button @click="switchToList">切换到列表视图</el-button>
    </div>

    <div class="matrix-grid">
      <!-- Q1: 重要且紧急 -->
      <div class="quadrant q1" @drop="onDrop('Q1', $event)" @dragover.prevent>
        <div class="quadrant-header">
          <h3>Q1: 立即执行</h3>
          <el-badge :value="q1Tasks.length" type="danger" />
        </div>
        <div class="quadrant-label">重要且紧急</div>
        <draggable v-model="q1Tasks" group="tasks" @change="onTaskMoved">
          <TaskCard v-for="task in q1Tasks" :key="task.uuid" :task="task" quadrant="Q1" />
        </draggable>
      </div>

      <!-- Q2: 重要但不紧急 -->
      <div class="quadrant q2" @drop="onDrop('Q2', $event)" @dragover.prevent>
        <div class="quadrant-header">
          <h3>Q2: 计划执行</h3>
          <el-badge :value="q2Tasks.length" type="warning" />
        </div>
        <div class="quadrant-label">重要但不紧急</div>
        <draggable v-model="q2Tasks" group="tasks">
          <TaskCard v-for="task in q2Tasks" :key="task.uuid" :task="task" />
        </draggable>
      </div>

      <!-- Q3: 紧急但不重要 -->
      <div class="quadrant q3">
        <div class="quadrant-header">
          <h3>Q3: 委托他人</h3>
          <el-badge :value="q3Tasks.length" type="info" />
        </div>
        <div class="quadrant-label">紧急但不重要</div>
        <draggable v-model="q3Tasks" group="tasks">
          <TaskCard v-for="task in q3Tasks" :key="task.uuid" :task="task" />
        </draggable>
      </div>

      <!-- Q4: 既不紧急也不重要 -->
      <div class="quadrant q4">
        <div class="quadrant-header">
          <h3>Q4: 考虑删除</h3>
          <el-badge :value="q4Tasks.length" />
        </div>
        <div class="quadrant-label">既不紧急也不重要</div>
        <draggable v-model="q4Tasks" group="tasks">
          <TaskCard v-for="task in q4Tasks" :key="task.uuid" :task="task" />
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePriorityMatrix, useUpdatePriority } from '@domain-client/task';
import draggable from 'vuedraggable';

const { data: matrix } = usePriorityMatrix();
const updatePriority = useUpdatePriority();

const q1Tasks = computed(() => matrix.value?.q1 || []);
const q2Tasks = computed(() => matrix.value?.q2 || []);
const q3Tasks = computed(() => matrix.value?.q3 || []);
const q4Tasks = computed(() => matrix.value?.q4 || []);

function onTaskMoved(event: any, targetQuadrant: string) {
  if (event.added) {
    const task = event.added.element;
    const newPriority = getQuadrantPriority(targetQuadrant);

    updatePriority.mutate({
      taskUuid: task.uuid,
      importance: newPriority.importance,
      urgency: newPriority.urgency,
    });
  }
}

function getQuadrantPriority(quadrant: string) {
  const map = {
    Q1: { importance: 5, urgency: 5 },
    Q2: { importance: 5, urgency: 2 },
    Q3: { importance: 2, urgency: 5 },
    Q4: { importance: 2, urgency: 2 },
  };
  return map[quadrant];
}
</script>

<style scoped>
.matrix-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.quadrant {
  min-height: 300px;
  padding: 16px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  background: #f5f7fa;
}

.quadrant.q1 {
  border-color: #f56c6c;
  background: #fef0f0;
}
.quadrant.q2 {
  border-color: #e6a23c;
  background: #fdf6ec;
}
.quadrant.q3 {
  border-color: #409eff;
  background: #ecf5ff;
}
.quadrant.q4 {
  border-color: #909399;
  background: #f4f4f5;
}

.quadrant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
</style>
```

---

### Story 007: E2E Tests

**Story ID**: TASK-002-S007  
**Story Points**: 1 SP

#### Technical Details

```typescript
test('设置优先级并智能排序', async ({ page }) => {
  await page.goto('/tasks');

  // 设置优先级
  await page.click('[data-testid="task-1"]');
  await page.click('[data-testid="set-priority"]');
  await page.fill('[data-testid="importance-input"]', '5');
  await page.fill('[data-testid="urgency-input"]', '5');
  await page.click('[data-testid="save-priority"]');

  // 验证优先级分数
  await expect(page.locator('[data-testid="priority-score"]')).toContainText('25');

  // 智能排序
  await page.click('[data-testid="smart-sort"]');
  await page.click('[data-testid="confirm-sort"]');

  // 验证排序结果
  const firstTask = await page.locator('[data-testid="task-item-1"]').textContent();
  expect(firstTask).toContain('优先级: 25');
});

test('四象限矩阵视图', async ({ page }) => {
  await page.goto('/tasks/matrix');

  // 验证象限显示
  await expect(page.locator('[data-testid="quadrant-q1"]')).toBeVisible();

  // 拖拽任务
  await page.dragAndDrop('[data-testid="task-1"]', '[data-testid="quadrant-q1"]');

  // 验证优先级更新
  await expect(page.locator('[data-testid="task-1-importance"]')).toContainText('5');
});
```

---

## 3. 技术依赖

- Prisma (数据库)
- Vue Draggable (拖拽交互)
- Element Plus (UI 组件)

---

## 4. Definition of Done

- [ ] 所有 7 个 Stories 完成
- [ ] Unit Tests 覆盖率 ≥ 80%
- [ ] 智能排序 <100ms (100 任务)
- [ ] 矩阵视图渲染 <200ms
- [ ] E2E Tests 通过
- [ ] 无 Critical Bug

---

## 5. Release Plan

**Sprint 3 (Week 5-6)** - 与 GOAL-004 并行开发

**Week 1**:

- Day 1-2: Story 001-003 (Contracts, Application, Infrastructure)
- Day 3: Story 004 (API)

**Week 2**:

- Day 1-2: Story 005-006 (Client + UI)
- Day 3: Story 007 (E2E Tests)

---

## 6. 验收标准总结

```gherkin
Feature: 任务优先级矩阵

  Scenario: 核心流程验收
    Given 用户创建任务并设置 importance=5, urgency=4
    Then priorityScore 应计算为 20
    When 用户点击智能排序
    Then 任务应按 priorityScore 降序排列
    When 用户切换到矩阵视图
    Then 任务应出现在 Q1 象限
    And 支持拖拽调整象限
```

---

_文档创建: 2025-10-21_  
_Epic Owner: PM Agent_
