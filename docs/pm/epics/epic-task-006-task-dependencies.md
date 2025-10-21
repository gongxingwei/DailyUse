# EPIC-TASK-006: 任务依赖关系管理

> **Epic ID**: EPIC-TASK-006  
> **功能编号**: TASK-006  
> **RICE 评分**: 171.5 (Reach: 7, Impact: 7, Confidence: 7, Effort: 2)  
> **优先级**: P0  
> **预估工期**: 1.5-2 周 (15 SP)  
> **Sprint**: Sprint 3-4  
> **状态**: Draft  
> **创建日期**: 2025-10-21

---

## 1. Epic 概述

### 业务价值

建立任务前置/后置依赖关系，自动阻塞未满足依赖的任务，通知依赖完成，确保任务按正确顺序执行。

**核心问题**:
- ❌ 无法明确表达任务间的前后依赖
- ❌ 依赖任务未完成时，后续任务无法被阻止
- ❌ 缺少依赖完成通知机制

**解决方案**:
- ✅ 定义阻塞型/建议型依赖关系
- ✅ 自动检测循环依赖
- ✅ 依赖未满足时阻塞任务开始
- ✅ 依赖满足时自动通知负责人

**注**：本 Epic 聚焦于依赖关系的**管理逻辑**，可视化功能已在 **EPIC-TASK-001（依赖图）** 中实现。

---

## 2. User Stories

### Story 001: Contracts & Domain - 依赖关系模型

**Story ID**: TASK-006-S001  
**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

#### Acceptance Criteria

```gherkin
Scenario: 定义依赖关系 Contracts
  When 开发者创建 Contracts
  Then 应定义 TaskDependencyServerDTO：
    | 字段                | 类型            | 说明              |
    | uuid                | string          | 依赖记录ID        |
    | dependentTaskUuid   | string          | 依赖方任务        |
    | dependencyTaskUuid  | string          | 被依赖任务        |
    | dependencyType      | enum            | blocking/suggested|
    | status              | enum            | active/satisfied  |
    | metadata            | object?         | 附加信息          |
```

#### Technical Details

**Contracts**:

```typescript
export enum DependencyType {
  BLOCKING = 'blocking',      // 阻塞型：必须完成
  SUGGESTED = 'suggested'     // 建议型：仅提醒
}

export enum DependencyStatus {
  ACTIVE = 'active',          // 激活（未满足）
  SATISFIED = 'satisfied',    // 已满足
  REMOVED = 'removed'         // 已移除
}

export interface TaskDependencyServerDTO {
  readonly uuid: string;
  readonly dependentTaskUuid: string;      // 此任务
  readonly dependencyTaskUuid: string;     // 依赖的任务
  readonly dependencyType: DependencyType;
  readonly status: DependencyStatus;
  readonly metadata?: {
    reason?: string;
    estimatedLag?: number;    // 预估间隔时间（ms）
  };
  readonly createdBy: string;
  readonly createdAt: number;
}

export interface TaskServerDTO {
  // ...existing fields...
  readonly dependencies?: TaskDependencyServerDTO[];
  readonly dependents?: TaskDependencyServerDTO[];
  readonly isBlocked: boolean;
  readonly blockingTasks?: string[];     // 阻塞此任务的任务UUID
}
```

**Domain**:

```typescript
export class Task extends AggregateRoot {
  private _dependencies: TaskDependency[] = [];
  private _isBlocked: boolean = false;
  
  addDependency(
    dependencyTaskUuid: string,
    type: DependencyType,
    userUuid: string
  ): void {
    // 防止重复
    if (this.hasDependency(dependencyTaskUuid)) {
      throw new DuplicateDependencyError();
    }
    
    // 防止自我依赖
    if (dependencyTaskUuid === this.uuid) {
      throw new SelfDependencyError();
    }
    
    const dependency = new TaskDependency({
      uuid: generateUuid(),
      dependentTaskUuid: this.uuid,
      dependencyTaskUuid,
      dependencyType: type,
      status: DependencyStatus.ACTIVE,
      createdBy: userUuid,
      createdAt: Date.now()
    });
    
    this._dependencies.push(dependency);
    this.updateBlockedStatus();
    
    this.addDomainEvent(new TaskDependencyAddedEvent({
      taskUuid: this.uuid,
      dependencyTaskUuid,
      type
    }));
  }
  
  removeDependency(dependencyUuid: string): void {
    this._dependencies = this._dependencies.filter(d => d.uuid !== dependencyUuid);
    this.updateBlockedStatus();
  }
  
  satisfyDependency(dependencyTaskUuid: string): void {
    const dep = this._dependencies.find(
      d => d.dependencyTaskUuid === dependencyTaskUuid
    );
    
    if (dep) {
      dep.status = DependencyStatus.SATISFIED;
      this.updateBlockedStatus();
      
      this.addDomainEvent(new TaskDependencySatisfiedEvent({
        taskUuid: this.uuid,
        dependencyTaskUuid
      }));
    }
  }
  
  private updateBlockedStatus(): void {
    const activeDeps = this._dependencies.filter(
      d => d.status === DependencyStatus.ACTIVE && 
           d.dependencyType === DependencyType.BLOCKING
    );
    
    this._isBlocked = activeDeps.length > 0;
    this._blockingTasks = activeDeps.map(d => d.dependencyTaskUuid);
  }
  
  canStart(): { allowed: boolean; reason?: string } {
    if (this._isBlocked) {
      return {
        allowed: false,
        reason: `被 ${this._blockingTasks.length} 个前置任务阻塞`
      };
    }
    return { allowed: true };
  }
}
```

---

### Story 002: Application Service - 依赖管理服务

**Story ID**: TASK-006-S002  
**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

#### Acceptance Criteria

```gherkin
Scenario: 添加依赖并检测循环
  Given 任务 A, B, C 已存在
  When 用户为任务添加依赖链：A→B, B→C
  Then 依赖应成功创建
  When 用户尝试添加依赖：C→A
  Then 应检测到循环并阻止
  And 返回循环路径：["A", "B", "C", "A"]
```

#### Technical Details

**Application Service**:

```typescript
export class TaskDependencyService {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly depRepo: TaskDependencyRepository,
    private readonly cycleDetector: CycleDetectorService,
    private readonly eventBus: EventBus
  ) {}

  async addDependency(command: AddDependencyCommand): Promise<void> {
    const { taskUuid, dependencyTaskUuid, type, userUuid } = command;
    
    // 加载任务
    const task = await this.taskRepo.findByUuid(taskUuid);
    const depTask = await this.taskRepo.findByUuid(dependencyTaskUuid);
    
    if (!task || !depTask) {
      throw new TaskNotFoundException();
    }
    
    // 循环检测
    const allDeps = await this.depRepo.findAll();
    const cycle = this.cycleDetector.detect(
      allDeps,
      { from: dependencyTaskUuid, to: taskUuid }
    );
    
    if (cycle) {
      throw new CircularDependencyError(cycle);
    }
    
    // 添加依赖
    task.addDependency(dependencyTaskUuid, type, userUuid);
    await this.taskRepo.save(task);
    
    await this.eventBus.publish(
      new TaskDependencyAddedEvent({
        taskUuid,
        dependencyTaskUuid,
        type
      })
    );
  }

  async removeDependency(taskUuid: string, depId: string): Promise<void> {
    const task = await this.taskRepo.findByUuid(taskUuid);
    task.removeDependency(depId);
    await this.taskRepo.save(task);
  }
}
```

**Event Handlers**:

```typescript
@EventHandler(TaskCompletedEvent)
export class TaskCompletedHandler {
  constructor(private readonly dependencyService: TaskDependencyService) {}

  async handle(event: TaskCompletedEvent): Promise<void> {
    // 查找所有依赖此任务的任务
    const dependentTasks = await this.taskRepo.findByDependency(
      event.taskUuid
    );
    
    for (const task of dependentTasks) {
      // 标记依赖为已满足
      task.satisfyDependency(event.taskUuid);
      await this.taskRepo.save(task);
      
      // 检查是否所有依赖都已满足
      if (!task.isBlocked) {
        // 发送通知
        await this.notificationService.create({
          userId: task.assigneeId,
          type: 'task_dependencies_met',
          title: '任务可以开始了',
          content: `"${task.title}" 的所有依赖任务已完成`,
          actionUrl: `/tasks/${task.uuid}`
        });
      }
    }
  }
}
```

---

### Story 003: Infrastructure - 依赖关系表

**Story ID**: TASK-006-S003  
**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

#### Technical Details

**Prisma Schema**:

```prisma
model TaskDependency {
  uuid                String   @id @default(uuid())
  dependentTaskUuid   String   @map("dependent_task_uuid")
  dependencyTaskUuid  String   @map("dependency_task_uuid")
  dependencyType      String   @map("dependency_type")
  status              String   @default("active") @map("status")
  metadata            Json?    @map("metadata")
  createdBy           String   @map("created_by")
  createdAt           BigInt   @map("created_at")
  
  dependentTask       Task     @relation("DependentTask", fields: [dependentTaskUuid], references: [uuid], onDelete: Cascade)
  dependencyTask      Task     @relation("DependencyTask", fields: [dependencyTaskUuid], references: [uuid], onDelete: Cascade)
  
  @@unique([dependentTaskUuid, dependencyTaskUuid])
  @@index([dependentTaskUuid])
  @@index([dependencyTaskUuid])
  @@index([status])
  @@map("task_dependencies")
}

model Task {
  // ...existing fields...
  
  dependencies        TaskDependency[] @relation("DependentTask")
  dependents          TaskDependency[] @relation("DependencyTask")
  isBlocked           Boolean          @default(false) @map("is_blocked")
  blockingTasks       Json?            @map("blocking_tasks")
}
```

---

### Story 004: API Endpoints - 依赖接口

**Story ID**: TASK-006-S004  
**Story Points**: 2 SP  

#### Technical Details

```typescript
// 添加依赖
router.post('/:id/dependencies',
  authenticate,
  validateBody(AddDependencySchema),
  async (req, res) => {
    try {
      await taskDependencyService.addDependency({
        taskUuid: req.params.id,
        dependencyTaskUuid: req.body.dependencyTaskUuid,
        type: req.body.dependencyType,
        userUuid: req.user.uuid
      });
      
      const task = await taskService.getByUuid(req.params.id);
      res.status(201).json(toClientDTO(task));
    } catch (error) {
      if (error instanceof CircularDependencyError) {
        res.status(400).json({
          error: 'Circular dependency detected',
          cycle: error.cycle
        });
      } else {
        throw error;
      }
    }
  }
);

// 删除依赖
router.delete('/:id/dependencies/:depId',
  authenticate,
  async (req, res) => {
    await taskDependencyService.removeDependency(
      req.params.id,
      req.params.depId
    );
    res.status(204).send();
  }
);

// 检查是否可开始
router.get('/:id/can-start',
  authenticate,
  async (req, res) => {
    const task = await taskService.getByUuid(req.params.id);
    const check = task.canStart();
    res.json(check);
  }
);
```

---

### Story 005: Client Services

**Story ID**: TASK-006-S005  
**Story Points**: 2 SP  

#### Technical Details

```typescript
export function useAddDependency() {
  const queryClient = useQueryClient();
  const service = new TaskDependencyService();

  return useMutation({
    mutationFn: (params: AddDependencyParams) => 
      service.addDependency(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries(['task', params.taskUuid]);
    },
    onError: (error: any) => {
      if (error.code === 'CIRCULAR_DEPENDENCY') {
        ElMessage.error({
          message: '检测到循环依赖',
          description: `路径: ${error.cycle.join(' → ')}`
        });
      }
    }
  });
}

export function useTaskDependencies(taskUuid: string) {
  return useQuery({
    queryKey: ['task-dependencies', taskUuid],
    queryFn: () => service.getDependencies(taskUuid)
  });
}
```

---

### Story 006: UI Component - 依赖配置面板

**Story ID**: TASK-006-S006  
**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

#### Acceptance Criteria

```gherkin
Scenario: 配置依赖关系
  Given 用户打开任务详情页
  When 点击"添加依赖"
  Then 应显示任务选择器
  And 支持搜索任务
  And 支持选择依赖类型（阻塞/建议）
  When 保存依赖
  Then 依赖列表应更新
  And 显示任务阻塞状态
```

#### Technical Details

**Component** (`packages/ui/src/components/task/DependencyPanel.vue`):

```vue
<template>
  <div class="dependency-panel">
    <el-card>
      <template #header>
        <div class="header">
          <span>📌 依赖关系</span>
          <el-button
            size="small"
            type="primary"
            @click="showAddDialog = true"
          >
            添加依赖
          </el-button>
        </div>
      </template>

      <!-- 此任务依赖的任务 -->
      <div class="section">
        <h4>此任务依赖以下任务完成：</h4>
        <div v-if="dependencies.length === 0" class="empty">
          暂无依赖任务
        </div>
        <div
          v-for="dep in dependencies"
          :key="dep.uuid"
          class="dependency-item"
          :class="{ 'is-blocking': dep.status === 'active' }"
        >
          <div class="task-info">
            <el-icon v-if="dep.status === 'active'" color="#f56c6c">
              <Warning />
            </el-icon>
            <el-icon v-else color="#67c23a">
              <Check />
            </el-icon>
            
            <span class="task-name">{{ dep.dependencyTask.title }}</span>
            <el-tag :type="getStatusType(dep.dependencyTask.status)" size="small">
              {{ dep.dependencyTask.status }}
            </el-tag>
          </div>
          
          <div class="actions">
            <el-button
              link
              size="small"
              @click="viewTask(dep.dependencyTaskUuid)"
            >
              查看任务
            </el-button>
            <el-button
              link
              size="small"
              type="danger"
              @click="removeDependency(dep.uuid)"
            >
              移除
            </el-button>
          </div>
        </div>

        <el-alert
          v-if="task.isBlocked"
          type="warning"
          :closable="false"
          class="blocked-alert"
        >
          <template #title>
            ⚠️ 任务被阻塞
          </template>
          此任务有 {{ blockingCount }} 个未完成的前置任务，无法开始。
        </el-alert>
      </div>

      <!-- 依赖此任务的任务 -->
      <div class="section">
        <h4>以下任务依赖此任务：</h4>
        <div v-if="dependents.length === 0" class="empty">
          暂无后续任务
        </div>
        <div
          v-for="dep in dependents"
          :key="dep.uuid"
          class="dependency-item"
        >
          <span class="task-name">{{ dep.dependentTask.title }}</span>
          <el-button link size="small" @click="viewTask(dep.dependentTaskUuid)">
            查看任务
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 添加依赖对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加依赖任务"
      width="600px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="搜索任务">
          <el-select
            v-model="form.dependencyTaskUuid"
            filterable
            remote
            :remote-method="searchTasks"
            placeholder="输入任务名称搜索"
          >
            <el-option
              v-for="task in searchResults"
              :key="task.uuid"
              :label="task.title"
              :value="task.uuid"
            >
              <div class="task-option">
                <span>{{ task.title }}</span>
                <el-tag size="small">{{ task.status }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="依赖类型">
          <el-radio-group v-model="form.dependencyType">
            <el-radio label="blocking">
              🔴 必须完成（阻塞型）
              <div class="radio-description">
                前置任务未完成时，此任务无法开始
              </div>
            </el-radio>
            <el-radio label="suggested">
              🟡 建议完成（提醒型）
              <div class="radio-description">
                前置任务未完成时，仅提醒但不阻止
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTaskDependencies, useAddDependency, useRemoveDependency } from '@domain-client/task';
import { ElMessage } from 'element-plus';

const props = defineProps<{ taskUuid: string }>();

const { data: dependencies } = useTaskDependencies(props.taskUuid);
const addDependency = useAddDependency();
const removeDependency = useRemoveDependency();

const showAddDialog = ref(false);
const form = ref({
  dependencyTaskUuid: '',
  dependencyType: 'blocking'
});

const blockingCount = computed(() => 
  dependencies.value?.filter(d => d.status === 'active').length || 0
);

async function handleAdd() {
  try {
    await addDependency.mutateAsync({
      taskUuid: props.taskUuid,
      dependencyTaskUuid: form.value.dependencyTaskUuid,
      dependencyType: form.value.dependencyType
    });
    
    ElMessage.success('依赖关系已添加');
    showAddDialog.value = false;
  } catch (error: any) {
    if (error.code === 'CIRCULAR_DEPENDENCY') {
      ElMessage.error(`检测到循环依赖: ${error.cycle.join(' → ')}`);
    }
  }
}
</script>

<style scoped>
.dependency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: #f5f7fa;
}

.dependency-item.is-blocking {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.blocked-alert {
  margin-top: 16px;
}
</style>
```

---

### Story 007: E2E Tests

**Story ID**: TASK-006-S007  
**Story Points**: 1 SP  

```typescript
test('添加依赖并验证阻塞', async ({ page }) => {
  await page.goto('/tasks/task-b-uuid');
  
  // 添加依赖
  await page.click('[data-testid="add-dependency"]');
  await page.fill('[data-testid="search-task"]', 'API 开发');
  await page.click('[data-testid="task-result-1"]');
  await page.click('[data-testid="dependency-type-blocking"]');
  await page.click('[data-testid="confirm-add"]');
  
  // 验证阻塞状态
  await expect(page.locator('[data-testid="blocked-alert"]')).toBeVisible();
  
  // 尝试开始任务
  await page.click('[data-testid="start-task"]');
  await expect(page.locator('[data-testid="error-message"]')).toContainText('任务被阻塞');
});

test('检测循环依赖', async ({ page }) => {
  // A→B, B→C 已存在
  // 尝试创建 C→A
  await page.goto('/tasks/task-c-uuid');
  await page.click('[data-testid="add-dependency"]');
  await page.fill('[data-testid="search-task"]', '任务 A');
  await page.click('[data-testid="task-result-1"]');
  await page.click('[data-testid="confirm-add"]');
  
  // 验证循环检测
  await expect(page.locator('[data-testid="circular-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="cycle-path"]')).toContainText('A → B → C → A');
});
```

---

## 3. 技术依赖

- Prisma (数据库)
- Event Bus (事件驱动)
- Notification Service (通知)

---

## 4. Definition of Done

- [ ] 所有 7 个 Stories 完成
- [ ] Unit Tests 覆盖率 ≥ 80%
- [ ] 循环检测 100% 准确
- [ ] 依赖阻塞检测 <50ms
- [ ] E2E Tests 通过
- [ ] 无 Critical Bug

---

## 5. Release Plan

**Sprint 3-4 (Week 5-8)** - 与其他 TASK Epics 并行

**Week 1**:
- Day 1-2: Story 001-002 (Contracts, Domain, Application)
- Day 3: Story 003 (Infrastructure)

**Week 2**:
- Day 1: Story 004 (API)
- Day 2-3: Story 005-006 (Client + UI)
- Day 4: Story 007 (E2E)

---

## 6. 验收标准总结

```gherkin
Feature: 任务依赖关系管理

  Scenario: 核心流程验收
    Given 任务 A, B 已存在
    When 用户为任务 B 添加依赖任务 A（阻塞型）
    Then 依赖关系应创建成功
    And 任务 B 应被标记为阻塞
    When 用户尝试开始任务 B
    Then 应阻止并提示依赖未满足
    When 用户完成任务 A
    Then 任务 B 应解除阻塞
    And 任务 B 负责人应收到通知
```

---

*文档创建: 2025-10-21*  
*Epic Owner: PM Agent*
