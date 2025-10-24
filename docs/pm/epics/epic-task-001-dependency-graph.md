# EPIC-TASK-001: 任务依赖图

> **Epic ID**: EPIC-TASK-001  
> **功能编号**: TASK-001  
> **RICE 评分**: 567 (Reach: 9, Impact: 7, Confidence: 9, Effort: 1)  
> **优先级**: P0  
> **预估工期**: 2-2.5 周 (18 SP)  
> **Sprint**: Sprint 4  
> **状态**: Draft  
> **创建日期**: 2025-10-21

---

## 1. Epic 概述

### 业务价值

支持任务依赖关系管理和 DAG 可视化，帮助用户理解任务执行顺序、识别阻塞链路和关键路径，提升项目协调效率。

**核心问题**:

- ❌ 任务间存在依赖时，无法可视化依赖链路
- ❌ 不知道哪些任务被阻塞，影响项目进度
- ❌ 依赖关系复杂时，难以理解整体结构
- ❌ 可能创建循环依赖，导致逻辑错误

**解决方案**:

- ✅ 配置前置/后置任务依赖关系
- ✅ DAG (有向无环图) 可视化展示依赖结构
- ✅ 自动检测循环依赖，阻止错误配置
- ✅ 识别关键路径，优先处理影响最大的任务

---

## 2. User Stories

### Story 001: Contracts & Domain - 依赖关系定义

**Story ID**: TASK-001-S001  
**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

#### User Story

```gherkin
As a 开发者
I want 定义任务依赖关系的 Contracts 和 Domain 模型
So that 系统有清晰的依赖管理规则
```

#### Acceptance Criteria

```gherkin
Scenario: 定义依赖关系 Contracts
  Given 需要支持多种依赖类型
  When 开发者创建 Contracts
  Then 应定义以下接口：
    | 接口               | 说明              |
    | TaskDependency    | 依赖关系实体       |
    | DependencyType    | 依赖类型枚举       |
    | DependencyStatus  | 依赖状态枚举       |
  And TaskServerDTO 应扩展以下字段：
    | 字段              | 类型                | 说明              |
    | dependencies      | TaskDependency[]    | 依赖的其他任务     |
    | dependents        | string[]            | 依赖此任务的UUID   |
    | isBlocked         | boolean             | 是否被阻塞         |
    | blockingReason    | string?             | 阻塞原因           |
    | dependencyStatus  | DependencyStatus    | 依赖状态           |
```

#### Technical Details

**Contracts** (`packages/contracts/src/modules/task/aggregates/TaskServer.ts`):

```typescript
/**
 * 依赖类型
 */
export enum DependencyType {
  FINISH_TO_START = 'finish_to_start', // 完成后开始（最常见）
  START_TO_START = 'start_to_start', // 开始后开始
  FINISH_TO_FINISH = 'finish_to_finish', // 完成后完成
  START_TO_FINISH = 'start_to_finish', // 开始后完成
}

/**
 * 依赖状态
 */
export enum DependencyStatus {
  NONE = 'none', // 无依赖
  WAITING = 'waiting', // 等待前置任务
  READY = 'ready', // 依赖已解除
  BLOCKED = 'blocked', // 被阻塞
}

/**
 * 任务依赖关系
 */
export interface TaskDependency {
  readonly uuid: string;
  readonly taskUuid: string; // 此任务
  readonly dependsOnTaskUuid: string; // 依赖的任务
  readonly dependencyType: DependencyType;
  readonly status: 'active' | 'resolved';
  readonly createdAt: number;
  readonly createdBy: string;
}

export interface TaskServerDTO {
  // ...existing fields...
  readonly dependencies?: TaskDependency[];
  readonly dependents?: string[];
  readonly isBlocked: boolean;
  readonly blockingReason?: string;
  readonly dependencyStatus: DependencyStatus;
}
```

**Domain** (`packages/domain-server/src/modules/task/aggregates/Task.ts`):

```typescript
export class Task extends AggregateRoot {
  private _dependencies: TaskDependency[] = [];
  private _isBlocked: boolean = false;

  /**
   * 添加依赖关系
   */
  addDependency(
    dependsOnTaskUuid: string,
    dependencyType: DependencyType,
    createdBy: string,
  ): void {
    // 检查是否已存在
    if (this.hasDependency(dependsOnTaskUuid)) {
      throw new DuplicateDependencyError();
    }

    const dependency: TaskDependency = {
      uuid: generateUuid(),
      taskUuid: this.uuid,
      dependsOnTaskUuid,
      dependencyType,
      status: 'active',
      createdAt: Date.now(),
      createdBy,
    };

    this._dependencies.push(dependency);
    this.updateBlockedStatus();

    this.addDomainEvent(
      new TaskDependencyAddedEvent({
        taskUuid: this.uuid,
        dependsOnTaskUuid,
        dependencyType,
      }),
    );
  }

  /**
   * 更新阻塞状态
   */
  private updateBlockedStatus(): void {
    const activeDeps = this._dependencies.filter((d) => d.status === 'active');
    this._isBlocked = activeDeps.length > 0;

    if (this._isBlocked) {
      this._blockingReason = `等待 ${activeDeps.length} 个前置任务完成`;
      this._dependencyStatus = DependencyStatus.WAITING;
    } else {
      this._blockingReason = undefined;
      this._dependencyStatus = DependencyStatus.READY;
    }
  }
}
```

---

### Story 002: Application Service - 依赖管理服务

**Story ID**: TASK-001-S002  
**Story Points**: 4 SP  
**预估时间**: 2 天

#### User Story

```gherkin
As a 开发者
I want 创建依赖管理应用服务
So that 系统可以处理依赖关系的增删改查和循环检测
```

#### Acceptance Criteria

```gherkin
Scenario: 添加依赖关系
  Given 任务 A 和任务 B 已存在
  When 用户为任务 B 添加前置依赖任务 A
  Then 系统应验证不存在循环依赖
  And 创建依赖记录
  And 更新任务 B 的阻塞状态
  And 发布依赖添加事件

Scenario: 检测循环依赖
  Given 已有依赖链：A → B → C
  When 用户尝试为 A 添加依赖 C
  Then 系统应检测到循环：A → B → C → A
  And 抛出 CircularDependencyError
  And 返回循环路径给用户
```

#### Technical Details

**Application Service** (`packages/domain-server/src/modules/task/application/TaskDependencyService.ts`):

```typescript
export class TaskDependencyService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly dependencyRepository: TaskDependencyRepository,
    private readonly graphService: DependencyGraphService,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * 添加依赖关系
   */
  async addDependency(command: AddDependencyCommand): Promise<void> {
    const { taskUuid, dependsOnTaskUuid, dependencyType, userUuid } = command;

    // 加载任务
    const task = await this.taskRepository.findByUuid(taskUuid);
    const dependsOnTask = await this.taskRepository.findByUuid(dependsOnTaskUuid);

    if (!task || !dependsOnTask) {
      throw new TaskNotFoundException();
    }

    // 检测循环依赖
    const allDeps = await this.dependencyRepository.findAll();
    const circularPath = this.graphService.detectCircularDependency(
      taskUuid,
      dependsOnTaskUuid,
      allDeps,
    );

    if (circularPath) {
      throw new CircularDependencyError(circularPath);
    }

    // 添加依赖
    task.addDependency(dependsOnTaskUuid, dependencyType, userUuid);
    await this.taskRepository.save(task);

    // 发布事件
    await this.eventBus.publish(
      new TaskDependencyAddedEvent({
        taskUuid,
        dependsOnTaskUuid,
        dependencyType,
      }),
    );
  }

  /**
   * 解除依赖（前置任务完成时）
   */
  async resolveDependency(taskUuid: string, completedTaskUuid: string): Promise<void> {
    const task = await this.taskRepository.findByUuid(taskUuid);
    if (!task) return;

    task.resolveDependency(completedTaskUuid);
    await this.taskRepository.save(task);
  }
}
```

**Dependency Graph Service** (`packages/domain-server/src/modules/task/services/DependencyGraphService.ts`):

```typescript
export class DependencyGraphService {
  /**
   * 检测循环依赖（DFS）
   */
  detectCircularDependency(
    taskUuid: string,
    newDependencyUuid: string,
    allDependencies: TaskDependency[],
  ): string[] | null {
    // 构建邻接表
    const graph = this.buildGraph(allDependencies);
    graph[taskUuid] = graph[taskUuid] || [];
    graph[taskUuid].push(newDependencyUuid);

    // DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      for (const neighbor of graph[node] || []) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          path.push(neighbor);
          return true;
        }
      }

      recStack.delete(node);
      path.pop();
      return false;
    };

    return dfs(taskUuid) ? path : null;
  }

  /**
   * 计算关键路径
   */
  findCriticalPath(tasks: Task[], dependencies: TaskDependency[]): string[] {
    // 最长路径算法（拓扑排序 + 动态规划）
    const graph = this.buildGraph(dependencies);
    const longestPath: Map<string, number> = new Map();
    const parent: Map<string, string> = new Map();

    // 拓扑排序
    const sorted = this.topologicalSort(
      tasks.map((t) => t.uuid),
      graph,
    );

    for (const node of sorted) {
      let maxPath = 0;
      let maxParent = null;

      for (const [from, tos] of Object.entries(graph)) {
        if (tos.includes(node)) {
          const pathLength = (longestPath.get(from) || 0) + 1;
          if (pathLength > maxPath) {
            maxPath = pathLength;
            maxParent = from;
          }
        }
      }

      longestPath.set(node, maxPath);
      if (maxParent) parent.set(node, maxParent);
    }

    // 回溯构建关键路径
    let maxNode = sorted[0];
    let maxLength = 0;

    for (const [node, length] of longestPath) {
      if (length > maxLength) {
        maxLength = length;
        maxNode = node;
      }
    }

    const path: string[] = [];
    let current: string | undefined = maxNode;

    while (current) {
      path.unshift(current);
      current = parent.get(current);
    }

    return path;
  }
}
```

---

### Story 003: Infrastructure - 依赖关系表

**Story ID**: TASK-001-S003  
**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

#### User Story

```gherkin
As a 开发者
I want 创建依赖关系数据库表
So that 系统可以持久化任务依赖数据
```

#### Acceptance Criteria

```gherkin
Scenario: 创建 TaskDependency 表
  When 开发者执行数据库迁移
  Then 应创建 task_dependencies 表
  And 表应包含唯一索引：(task_uuid, depends_on_task_uuid)
  And 应创建外键约束到 Task 表
```

#### Technical Details

**Prisma Schema**:

```prisma
model Task {
  // ...existing fields...

  isBlocked            Boolean  @default(false) @map("is_blocked")
  blockingReason       String?  @map("blocking_reason")
  dependencyStatus     String   @default("none") @map("dependency_status")

  dependencies         TaskDependency[] @relation("TaskDependencies")
  dependents           TaskDependency[] @relation("DependentTasks")
}

model TaskDependency {
  uuid                 String   @id @default(uuid())
  taskUuid             String   @map("task_uuid")
  dependsOnTaskUuid    String   @map("depends_on_task_uuid")
  dependencyType       String   @map("dependency_type")
  status               String   @default("active")
  createdAt            BigInt   @map("created_at")
  createdBy            String   @map("created_by")

  task                 Task     @relation("TaskDependencies", fields: [taskUuid], references: [uuid], onDelete: Cascade)
  dependsOnTask        Task     @relation("DependentTasks", fields: [dependsOnTaskUuid], references: [uuid], onDelete: Cascade)

  @@unique([taskUuid, dependsOnTaskUuid])
  @@index([taskUuid])
  @@index([dependsOnTaskUuid])
  @@index([status])
  @@map("task_dependencies")
}
```

**Migration**:

```sql
CREATE TABLE "task_dependencies" (
  "uuid" TEXT NOT NULL PRIMARY KEY,
  "task_uuid" TEXT NOT NULL,
  "depends_on_task_uuid" TEXT NOT NULL,
  "dependency_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" BIGINT NOT NULL,
  "created_by" TEXT NOT NULL,
  FOREIGN KEY ("task_uuid") REFERENCES "Task"("uuid") ON DELETE CASCADE,
  FOREIGN KEY ("depends_on_task_uuid") REFERENCES "Task"("uuid") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "task_dependencies_task_uuid_depends_on_task_uuid_key"
  ON "task_dependencies"("task_uuid", "depends_on_task_uuid");

CREATE INDEX "task_dependencies_task_uuid_idx" ON "task_dependencies"("task_uuid");
CREATE INDEX "task_dependencies_depends_on_task_uuid_idx" ON "task_dependencies"("depends_on_task_uuid");
CREATE INDEX "task_dependencies_status_idx" ON "task_dependencies"("status");

ALTER TABLE "Task" ADD COLUMN "is_blocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "blocking_reason" TEXT;
ALTER TABLE "Task" ADD COLUMN "dependency_status" TEXT NOT NULL DEFAULT 'none';
```

---

### Story 004: API Endpoints - 依赖管理接口

**Story ID**: TASK-001-S004  
**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

#### User Story

```gherkin
As a 前端开发者
I want 调用 API 管理任务依赖关系
So that UI 可以配置和查询依赖数据
```

#### Acceptance Criteria

```gherkin
Scenario: 添加依赖关系
  When 前端调用 POST /api/v1/tasks/:id/dependencies
  And Body 为：
    """json
    {
      "dependsOnTaskUuid": "task-uuid-123",
      "dependencyType": "finish_to_start"
    }
    """
  Then 应返回 201 状态码
  And 响应应包含更新后的任务数据

Scenario: 获取依赖图数据
  When 前端调用 GET /api/v1/tasks/dependency-graph
  Then 应返回 200 状态码
  And 响应应包含：
    | 字段   | 类型            | 说明        |
    | nodes  | TaskNode[]      | 任务节点列表 |
    | edges  | DependencyEdge[]| 依赖边列表   |
```

#### Technical Details

**API Routes**:

```typescript
// 添加依赖
router.post(
  '/:id/dependencies',
  authenticate,
  validateBody(AddDependencySchema),
  async (req, res) => {
    try {
      await taskDependencyService.addDependency({
        taskUuid: req.params.id,
        dependsOnTaskUuid: req.body.dependsOnTaskUuid,
        dependencyType: req.body.dependencyType,
        userUuid: req.user.uuid,
      });

      const task = await taskApplicationService.getByUuid(req.params.id);
      res.status(201).json(toClientDTO(task));
    } catch (error) {
      if (error instanceof CircularDependencyError) {
        res.status(400).json({
          error: 'Circular dependency detected',
          circularPath: error.path,
        });
      } else {
        throw error;
      }
    }
  },
);

// 删除依赖
router.delete('/:id/dependencies/:depId', authenticate, async (req, res) => {
  await taskDependencyService.removeDependency(req.params.id, req.params.depId);
  res.status(204).send();
});

// 获取依赖图数据
router.get('/dependency-graph', authenticate, async (req, res) => {
  const taskUuids = req.query.taskUuids ? (req.query.taskUuids as string).split(',') : undefined;

  const graphData = await taskDependencyService.getGraphData(taskUuids);
  res.json(graphData);
});

// 验证依赖（检测循环）
router.post('/dependency-graph/validate', authenticate, async (req, res) => {
  const { taskUuid, newDependencyUuid } = req.body;
  const validation = await taskDependencyService.validateDependency(taskUuid, newDependencyUuid);
  res.json(validation);
});
```

**Validation Schemas**:

```typescript
const AddDependencySchema = z.object({
  dependsOnTaskUuid: z.string().uuid(),
  dependencyType: z.enum([
    'finish_to_start',
    'start_to_start',
    'finish_to_finish',
    'start_to_finish',
  ]),
});
```

---

### Story 005: Client Services - 依赖管理客户端

**Story ID**: TASK-001-S005  
**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

#### User Story

```gherkin
As a 前端开发者
I want 使用 React Query 管理依赖数据
So that UI 可以实时获取和更新依赖关系
```

#### Technical Details

**Client Service** (`packages/domain-client/src/modules/task/services/TaskDependencyService.ts`):

```typescript
export class TaskDependencyService {
  async addDependency(params: {
    taskUuid: string;
    dependsOnTaskUuid: string;
    dependencyType: DependencyType;
  }): Promise<TaskClientDTO> {
    const response = await apiClient.post<TaskClientDTO>(
      `/api/v1/tasks/${params.taskUuid}/dependencies`,
      {
        dependsOnTaskUuid: params.dependsOnTaskUuid,
        dependencyType: params.dependencyType,
      },
    );
    return response.data;
  }

  async removeDependency(taskUuid: string, dependencyId: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${taskUuid}/dependencies/${dependencyId}`);
  }

  async getGraphData(taskUuids?: string[]): Promise<DependencyGraph> {
    const params = taskUuids ? { taskUuids: taskUuids.join(',') } : {};
    const response = await apiClient.get<DependencyGraph>('/api/v1/tasks/dependency-graph', {
      params,
    });
    return response.data;
  }

  async validateDependency(taskUuid: string, newDependencyUuid: string): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(
      '/api/v1/tasks/dependency-graph/validate',
      { taskUuid, newDependencyUuid },
    );
    return response.data;
  }
}
```

**React Query Hooks**:

```typescript
export function useDependencyGraph(taskUuids?: string[]) {
  const service = new TaskDependencyService();

  return useQuery({
    queryKey: ['task-dependency-graph', taskUuids],
    queryFn: () => service.getGraphData(taskUuids),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddDependency() {
  const queryClient = useQueryClient();
  const service = new TaskDependencyService();

  return useMutation({
    mutationFn: (params: AddDependencyParams) => service.addDependency(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries(['task', params.taskUuid]);
      queryClient.invalidateQueries(['task-dependency-graph']);
    },
  });
}
```

---

### Story 006: UI Component - 依赖图可视化

**Story ID**: TASK-001-S006  
**Story Points**: 4 SP  
**预估时间**: 2 天

#### User Story

```gherkin
As a 用户
I want 查看任务依赖关系的可视化图表
So that 我可以理解任务间的复杂依赖结构
```

#### Acceptance Criteria

```gherkin
Scenario: 渲染依赖图
  Given 有 5 个任务和多个依赖关系
  When 用户打开依赖图视图
  Then 应使用 React Flow 渲染有向图
  And 已完成任务应显示为绿色
  And 被阻塞任务应显示为红色
  And 关键路径应高亮显示
```

#### Technical Details

**Component** (`packages/ui/src/components/task/DependencyGraphView.vue`):

```vue
<template>
  <div class="dependency-graph-container">
    <div class="graph-toolbar">
      <el-button @click="fitView">适应视图</el-button>
      <el-button @click="toggleCriticalPath">
        {{ showCriticalPath ? '隐藏' : '显示' }}关键路径
      </el-button>
      <el-button @click="exportGraph">导出图片</el-button>
    </div>

    <VueFlow
      v-model="elements"
      :default-zoom="1"
      :min-zoom="0.2"
      :max-zoom="2"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
    >
      <Background />
      <Controls />
      <MiniMap />

      <template #node-task="{ data }">
        <TaskNode
          :task="data"
          :is-critical="isCriticalNode(data.uuid)"
          :is-blocked="data.isBlocked"
        />
      </template>
    </VueFlow>

    <!-- 任务详情侧边栏 -->
    <TaskDetailPanel
      v-if="selectedTask"
      v-model:visible="showDetailPanel"
      :task-uuid="selectedTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { VueFlow, useVueFlow, Background, Controls, MiniMap } from '@vue-flow/core';
import { useDependencyGraph } from '@domain-client/task';
import dagre from 'dagre';

const { data: graphData, isLoading } = useDependencyGraph();
const { fitView: flowFitView, project } = useVueFlow();

const showCriticalPath = ref(false);
const selectedTask = ref<string | null>(null);
const showDetailPanel = ref(false);

// 转换为 React Flow 数据格式
const elements = computed(() => {
  if (!graphData.value) return [];

  const nodes = graphData.value.nodes.map((task) => ({
    id: task.uuid,
    type: 'task',
    data: task,
    position: calculatePosition(task),
    style: getNodeStyle(task),
  }));

  const edges = graphData.value.edges.map((dep) => ({
    id: `${dep.from}-${dep.to}`,
    source: dep.from,
    target: dep.to,
    type: 'smoothstep',
    label: getDependencyTypeLabel(dep.type),
    style: getEdgeStyle(dep),
    animated: dep.isOnCriticalPath && showCriticalPath.value,
  }));

  return [...nodes, ...edges];
});

// 使用 Dagre 计算布局
function calculatePosition(task: any) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  graphData.value?.nodes.forEach((n) => {
    g.setNode(n.uuid, { width: 200, height: 80 });
  });

  graphData.value?.edges.forEach((e) => {
    g.setEdge(e.from, e.to);
  });

  dagre.layout(g);

  const node = g.node(task.uuid);
  return { x: node.x, y: node.y };
}

function getNodeStyle(task: any) {
  if (task.status === 'completed') {
    return { background: '#67c23a', border: '2px solid #529b2e' };
  } else if (task.isBlocked) {
    return { background: '#f56c6c', border: '2px solid #f56c6c', animation: 'pulse 2s infinite' };
  } else if (task.status === 'in_progress') {
    return { background: '#409eff', border: '2px solid #337ecc' };
  }
  return { background: '#e4e7ed', border: '2px solid #dcdfe6' };
}

function getEdgeStyle(edge: any) {
  if (edge.isOnCriticalPath && showCriticalPath.value) {
    return { stroke: '#f56c6c', strokeWidth: 3 };
  }
  return { stroke: '#909399' };
}

function isCriticalNode(uuid: string): boolean {
  return showCriticalPath.value && graphData.value?.criticalPath?.includes(uuid);
}

function onNodeClick(event: any) {
  selectedTask.value = event.node.id;
  showDetailPanel.value = true;
}

function fitView() {
  flowFitView({ padding: 0.2, duration: 800 });
}
</script>

<style scoped>
.dependency-graph-container {
  width: 100%;
  height: calc(100vh - 200px);
  position: relative;
}

.graph-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
```

---

### Story 007: E2E Tests - 依赖管理测试

**Story ID**: TASK-001-S007  
**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

#### Acceptance Criteria

```gherkin
Scenario: 完整流程测试
  Given 用户已创建 3 个任务
  When 测试执行以下步骤：
    1. 为任务 B 添加依赖任务 A
    2. 验证任务 B 被阻塞
    3. 完成任务 A
    4. 验证任务 B 解除阻塞
    5. 打开依赖图
    6. 验证图形正确渲染
  Then 所有步骤应成功
```

#### Technical Details

**E2E Test** (`apps/web/e2e/task-dependency.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('任务依赖图', () => {
  test('配置依赖关系并验证阻塞状态', async ({ page }) => {
    // 创建任务
    await page.goto('/tasks');
    await page.click('[data-testid="create-task"]');
    await page.fill('[data-testid="task-name"]', '设计原型');
    await page.click('[data-testid="save-task"]');

    await page.click('[data-testid="create-task"]');
    await page.fill('[data-testid="task-name"]', '开发前端');
    await page.click('[data-testid="save-task"]');

    // 配置依赖
    await page.click('[data-testid="task-item-2"]');
    await page.click('[data-testid="add-dependency"]');
    await page.fill('[data-testid="search-dependency"]', '设计原型');
    await page.click('[data-testid="dependency-result-1"]');
    await page.select('[data-testid="dependency-type"]', 'finish_to_start');
    await page.click('[data-testid="confirm-dependency"]');

    // 验证阻塞状态
    await expect(page.locator('[data-testid="task-blocked-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="blocking-reason"]')).toContainText('等待任务');

    // 完成前置任务
    await page.click('[data-testid="task-item-1"]');
    await page.click('[data-testid="mark-completed"]');

    // 验证解除阻塞
    await page.click('[data-testid="task-item-2"]');
    await expect(page.locator('[data-testid="task-blocked-badge"]')).not.toBeVisible();
  });

  test('查看依赖图并验证可视化', async ({ page }) => {
    await page.goto('/tasks/dependency-graph');

    // 等待图形渲染
    await page.waitForSelector('[data-testid="vue-flow-container"]');

    // 验证节点数量
    const nodes = await page.locator('.vue-flow__node').count();
    expect(nodes).toBeGreaterThan(0);

    // 验证关键路径按钮
    await page.click('[data-testid="toggle-critical-path"]');
    await expect(page.locator('.critical-path-edge')).toBeVisible();

    // 点击节点查看详情
    await page.click('.vue-flow__node:first-child');
    await expect(page.locator('[data-testid="task-detail-panel"]')).toBeVisible();
  });

  test('检测循环依赖', async ({ page }) => {
    // 创建依赖链：A → B → C
    // 尝试创建 A → C (会形成循环)

    await page.goto('/tasks/task-a-uuid');
    await page.click('[data-testid="add-dependency"]');
    await page.fill('[data-testid="search-dependency"]', '任务 C');
    await page.click('[data-testid="dependency-result-1"]');
    await page.click('[data-testid="confirm-dependency"]');

    // 验证错误提示
    await expect(page.locator('[data-testid="circular-dependency-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="circular-path"]')).toContainText('A → B → C → A');
  });
});
```

---

## 3. 技术依赖

### 外部依赖

- React Flow / Cytoscape.js (图形渲染)
- Dagre (布局算法)
- Prisma (数据库)

### 内部依赖

- Task Contracts
- Event Bus

---

## 4. Definition of Done

- [ ] 所有 6 个 User Stories 完成
- [ ] Unit Tests 覆盖率 ≥ 80%
- [ ] 循环依赖检测 100% 准确
- [ ] 依赖图渲染 <500ms (100 节点)
- [ ] E2E Tests 通过
- [ ] Code Review 通过
- [ ] 无 Critical Bug

---

## 5. Release Plan

### Sprint 4 (Week 7-8)

**Week 1**:

- Day 1-2: Story 001-002 (Contracts, Domain, Application)
- Day 3-4: Story 003-004 (Infrastructure, API)

**Week 2**:

- Day 1-2: Story 005 (Client Services)
- Day 3-5: Story 006 (UI Component - 依赖图)
- Day 5: Story 007 (E2E Tests)

---

## 6. 验收标准总结

```gherkin
Feature: 任务依赖图
  作为用户，我希望管理任务依赖并查看可视化图表

  Scenario: 核心流程验收
    Given 用户创建任务 A, B, C
    When 配置依赖：B 依赖 A，C 依赖 B
    Then 任务 B, C 应被阻塞
    When 完成任务 A
    Then 任务 B 应解除阻塞
    When 用户打开依赖图
    Then 应显示有向图：A → B → C
    And 关键路径应为：A → B → C
    And 支持拖拽调整布局
```

---

_文档创建: 2025-10-21_  
_Epic Owner: PM Agent_
