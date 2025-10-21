# Sprint 4 详细执行计划

> **Sprint ID**: Sprint 4  
> **Sprint 周期**: Week 9-10 (2025-12-15 ~ 2025-12-26)  
> **Sprint 目标**: 实现任务依赖图可视化 + 依赖关系管理  
> **Story Points**: 33 SP  
> **Epics**: TASK-001 (18 SP) + TASK-006 (15 SP)  
> **状态**: Planning  
> **依赖**: Sprint 3 (Task 模块基础), Sprint 2a DAG Spike 结果

---

## 📋 Sprint 概览

### Sprint 目标 (Sprint Goal)

> **实现基于 DAG 的任务依赖图可视化和智能依赖关系管理，支持循环依赖检测和关键路径分析。**

**核心价值**:
- ✅ 使用 graphlib 实现 DAG 算法（循环检测、拓扑排序、关键路径）
- ✅ 使用 @vue-flow/core + dagre 实现依赖图可视化
- ✅ 支持 Blocking/Suggested 两种依赖类型
- ✅ 自动检测循环依赖并阻止创建

### 技术决策

**基于 Sprint 2a DAG Spike 结果**:
- ✅ **graphlib** (v2.1.8): 图算法库，O(V+E) 时间复杂度
- ✅ **@vue-flow/core** (v1.26.0): Vue 3 流程图组件
- ✅ **dagre** (v0.8.5): 层次化布局算法

详见 [ADR-002](../TECHNICAL_DECISIONS.md#adr-002)

---

## 📅 每日执行计划 (Day-by-Day Plan)

### **Week 9: 任务依赖图 (TASK-001, 18 SP)**

#### **Day 1 (2025-12-15 周一): Contracts & Domain**

**目标**: 完成 TASK-001 Story-001 (3 SP)

**任务清单**:
- [ ] **09:00-09:15** Sprint 4 Kickoff
  - Review Sprint 3 成果
  - Review DAG Spike 技术方案
  - 确认 graphlib 集成方案

- [ ] **09:30-12:00** Contracts 层 (2.5h)
  ```typescript
  // packages/contracts/src/task/TaskDependency.ts
  export enum DependencyType {
    BLOCKING = 'blocking',      // 阻塞依赖（前置任务必须完成）
    SUGGESTED = 'suggested'     // 建议依赖（仅建议顺序）
  }
  
  export interface TaskDependencyServerDTO {
    uuid: string;
    sourceTaskUuid: string;      // 前置任务（被依赖）
    targetTaskUuid: string;      // 后置任务（依赖者）
    dependencyType: DependencyType;
    createdAt: number;
    createdBy: string;
  }
  
  export interface TaskGraphDTO {
    nodes: Array<{
      id: string;
      taskUuid: string;
      taskName: string;
      status: string;
      position?: { x: number; y: number };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      dependencyType: DependencyType;
    }>;
    hasCycle: boolean;
    cycleInfo?: string[];
  }
  ```

- [ ] **13:00-15:00** Domain 层 (2h)
  ```typescript
  export class TaskDependency extends Entity {
    constructor(
      uuid: string,
      public readonly sourceTaskUuid: string,
      public readonly targetTaskUuid: string,
      public readonly dependencyType: DependencyType,
      createdAt: number,
      createdBy: string
    ) {
      super();
      this.validate();
    }
    
    private validate(): void {
      if (this.sourceTaskUuid === this.targetTaskUuid) {
        throw new SelfDependencyError('任务不能依赖自己');
      }
    }
  }
  
  // Task 聚合根添加依赖管理
  export class Task extends AggregateRoot {
    private _dependencies: TaskDependency[] = [];
    
    addDependency(dep: TaskDependency): void {
      // 检查重复
      const exists = this._dependencies.some(
        d => d.sourceTaskUuid === dep.sourceTaskUuid && 
             d.targetTaskUuid === dep.targetTaskUuid
      );
      if (exists) throw new DuplicateDependencyError();
      
      this._dependencies.push(dep);
      this.addDomainEvent(new TaskDependencyAddedEvent({ dependency: dep }));
    }
    
    removeDependency(depUuid: string): void {
      const index = this._dependencies.findIndex(d => d.uuid === depUuid);
      if (index === -1) throw new DependencyNotFoundError();
      
      this._dependencies.splice(index, 1);
      this.addDomainEvent(new TaskDependencyRemovedEvent({ depUuid }));
    }
  }
  ```

- [ ] **15:00-17:00** 单元测试 + Code Review
  - PR: `feat(task): add dependency contracts and domain`

**交付物**: ✅ Contracts + Domain 层完成

---

#### **Day 2 (2025-12-16 周二): Application Service - DAG 算法**

**目标**: 完成 TASK-001 Story-002 (4 SP)

**任务清单**:
- [ ] **09:00-12:00** 安装 graphlib + 创建服务 (3h)
  ```bash
  pnpm add graphlib @types/graphlib
  ```
  
  ```typescript
  // apps/api/src/application/task/TaskDependencyGraphService.ts
  import { Graph, alg } from 'graphlib';
  
  export class TaskDependencyGraphService {
    constructor(
      private taskRepository: TaskRepository,
      private dependencyRepository: TaskDependencyRepository
    ) {}
    
    /**
     * 检测循环依赖（DFS 算法，O(V+E)）
     */
    async detectCycle(taskUuids: string[]): Promise<{
      hasCycle: boolean;
      cycle?: string[];
    }> {
      const graph = await this.buildGraph(taskUuids);
      const cycles = alg.findCycles(graph);
      
      if (cycles.length > 0) {
        return {
          hasCycle: true,
          cycle: cycles[0]  // 返回第一个环
        };
      }
      
      return { hasCycle: false };
    }
    
    /**
     * 拓扑排序（返回任务执行顺序）
     */
    async topologicalSort(taskUuids: string[]): Promise<string[]> {
      const graph = await this.buildGraph(taskUuids);
      
      try {
        return alg.topsort(graph);
      } catch (error) {
        throw new CyclicDependencyError('存在循环依赖，无法排序');
      }
    }
    
    /**
     * 计算关键路径（最长路径算法）
     */
    async calculateCriticalPath(taskUuids: string[]): Promise<{
      path: string[];
      totalDuration: number;
    }> {
      const graph = await this.buildGraph(taskUuids);
      
      // 拓扑排序
      const sorted = alg.topsort(graph);
      
      // 计算最长路径
      const dist: Record<string, number> = {};
      const prev: Record<string, string | null> = {};
      
      sorted.forEach(node => {
        dist[node] = 0;
        prev[node] = null;
      });
      
      sorted.forEach(node => {
        const task = await this.taskRepository.findByUuid(node);
        const duration = task.estimatedHours || 1;
        
        graph.successors(node)?.forEach(successor => {
          const newDist = dist[node] + duration;
          if (newDist > dist[successor]) {
            dist[successor] = newDist;
            prev[successor] = node;
          }
        });
      });
      
      // 回溯路径
      const endNode = sorted[sorted.length - 1];
      const path: string[] = [];
      let current: string | null = endNode;
      
      while (current) {
        path.unshift(current);
        current = prev[current];
      }
      
      return {
        path,
        totalDuration: dist[endNode]
      };
    }
    
    /**
     * 构建 graphlib Graph
     */
    private async buildGraph(taskUuids: string[]): Promise<Graph> {
      const graph = new Graph({ directed: true });
      
      // 添加节点
      taskUuids.forEach(uuid => graph.setNode(uuid));
      
      // 添加边
      const dependencies = await this.dependencyRepository.findByTaskUuids(taskUuids);
      dependencies.forEach(dep => {
        graph.setEdge(dep.sourceTaskUuid, dep.targetTaskUuid);
      });
      
      return graph;
    }
    
    /**
     * 添加依赖（带循环检测）
     */
    async addDependency(
      sourceTaskUuid: string,
      targetTaskUuid: string,
      dependencyType: DependencyType,
      userId: string
    ): Promise<TaskDependency> {
      // 临时添加到图中检测循环
      const allTaskUuids = await this.getAllRelatedTaskUuids(sourceTaskUuid, targetTaskUuid);
      const graph = await this.buildGraph(allTaskUuids);
      graph.setEdge(sourceTaskUuid, targetTaskUuid);
      
      const cycles = alg.findCycles(graph);
      if (cycles.length > 0) {
        throw new CyclicDependencyError(`添加此依赖会形成循环: ${cycles[0].join(' → ')}`);
      }
      
      // 无循环，创建依赖
      const dependency = new TaskDependency(
        uuidv4(),
        sourceTaskUuid,
        targetTaskUuid,
        dependencyType,
        Date.now(),
        userId
      );
      
      await this.dependencyRepository.save(dependency);
      
      return dependency;
    }
  }
  ```

- [ ] **13:00-17:00** 集成测试 + Code Review (4h)
  - 测试循环检测（各种环形结构）
  - 测试拓扑排序
  - 测试关键路径计算
  - PR: `feat(task): add DAG algorithm service`

**交付物**: ✅ DAG 算法服务完成

---

#### **Day 3 (2025-12-17 周三): Infrastructure + API**

**目标**: 完成 TASK-001 Story-003 (2 SP) + Story-004 (3 SP)

**任务清单**:
- [ ] **09:00-11:00** Prisma Schema (2h)
  ```prisma
  model TaskDependency {
    id              String   @id @default(uuid())
    uuid            String   @unique @default(uuid())
    
    sourceTaskUuid  String   // 前置任务
    targetTaskUuid  String   // 后置任务
    dependencyType  String   // blocking/suggested
    
    createdAt       BigInt
    createdBy       String
    
    sourceTask      Task     @relation("SourceDependencies", fields: [sourceTaskUuid], references: [uuid], onDelete: Cascade)
    targetTask      Task     @relation("TargetDependencies", fields: [targetTaskUuid], references: [uuid], onDelete: Cascade)
    
    @@unique([sourceTaskUuid, targetTaskUuid])
    @@index([sourceTaskUuid])
    @@index([targetTaskUuid])
    @@map("task_dependencies")
  }
  
  model Task {
    // ...existing fields...
    
    outgoingDependencies  TaskDependency[]  @relation("SourceDependencies")
    incomingDependencies  TaskDependency[]  @relation("TargetDependencies")
  }
  ```

- [ ] **11:00-13:00** API Endpoints (2h)
  ```typescript
  @Controller('/api/tasks')
  export class TaskDependencyController {
    constructor(private graphService: TaskDependencyGraphService) {}
    
    @Post('/:taskId/dependencies')
    @UseGuards(AuthGuard)
    async addDependency(
      @Param('taskId') taskId: string,
      @Body() body: { targetTaskUuid: string; dependencyType: DependencyType },
      @CurrentUser() user: User
    ): Promise<TaskDependencyServerDTO> {
      const dep = await this.graphService.addDependency(
        taskId,
        body.targetTaskUuid,
        body.dependencyType,
        user.uuid
      );
      return this.toDTO(dep);
    }
    
    @Get('/dependency-graph')
    @UseGuards(AuthGuard)
    async getGraph(@Query('taskUuids') taskUuids: string): Promise<TaskGraphDTO> {
      const uuids = taskUuids.split(',');
      const graph = await this.graphService.buildGraphDTO(uuids);
      return graph;
    }
    
    @Post('/detect-cycle')
    @UseGuards(AuthGuard)
    async detectCycle(@Body() body: { taskUuids: string[] }): Promise<{ hasCycle: boolean; cycle?: string[] }> {
      return await this.graphService.detectCycle(body.taskUuids);
    }
    
    @Get('/critical-path')
    @UseGuards(AuthGuard)
    async getCriticalPath(@Query('taskUuids') taskUuids: string): Promise<{ path: string[]; totalDuration: number }> {
      const uuids = taskUuids.split(',');
      return await this.graphService.calculateCriticalPath(uuids);
    }
  }
  ```

- [ ] **14:00-17:00** API 测试 + Code Review (3h)
  - PR: `feat(task): add dependency API endpoints`

**交付物**: ✅ Infrastructure + API 完成

---

#### **Day 4 (2025-12-18 周四): Client Services**

**目标**: 完成 TASK-001 Story-005 (2 SP)

**任务清单**:
- [ ] **09:00-12:00** Client Service (3h)
  ```typescript
  export class TaskDependencyClientService {
    constructor(private httpClient: HttpClient) {}
    
    async addDependency(
      sourceTaskUuid: string,
      targetTaskUuid: string,
      dependencyType: DependencyType
    ): Promise<TaskDependencyClientDTO> {
      const response = await this.httpClient.post(
        `/api/tasks/${sourceTaskUuid}/dependencies`,
        { targetTaskUuid, dependencyType }
      );
      return response.data;
    }
    
    async getGraph(taskUuids: string[]): Promise<TaskGraphDTO> {
      const response = await this.httpClient.get('/api/tasks/dependency-graph', {
        params: { taskUuids: taskUuids.join(',') }
      });
      return response.data;
    }
    
    async detectCycle(taskUuids: string[]): Promise<{ hasCycle: boolean; cycle?: string[] }> {
      const response = await this.httpClient.post('/api/tasks/detect-cycle', { taskUuids });
      return response.data;
    }
  }
  ```

- [ ] **13:00-15:00** React Query Hooks (2h)
  ```typescript
  export function useTaskGraph(taskUuids: string[]) {
    return useQuery({
      queryKey: ['task-graph', taskUuids],
      queryFn: () => dependencyService.getGraph(taskUuids),
      staleTime: 2 * 60 * 1000
    });
  }
  
  export function useAddDependency() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (params: { sourceTaskUuid: string; targetTaskUuid: string; dependencyType: DependencyType }) =>
        dependencyService.addDependency(params.sourceTaskUuid, params.targetTaskUuid, params.dependencyType),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task-graph'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    });
  }
  ```

- [ ] **15:00-17:00** 客户端测试 + Code Review
  - PR: `feat(task): add dependency client services`

**交付物**: ✅ Client Services 完成

---

#### **Day 5 (2025-12-19 周五): UI - DAG 可视化 (Part 1)**

**目标**: 完成 TASK-001 Story-006 (4 SP 部分)

**任务清单**:
- [ ] **09:00-12:00** 安装 @vue-flow/core + dagre (3h)
  ```bash
  pnpm add @vue-flow/core dagre @types/dagre
  ```
  
  创建 `TaskDependencyGraphView.vue`:
  ```vue
  <template>
    <div class="dependency-graph">
      <div class="graph-toolbar">
        <el-button @click="autoLayout">
          <el-icon><Refresh /></el-icon>
          自动布局
        </el-button>
        <el-button @click="detectCycles">
          <el-icon><Warning /></el-icon>
          检测循环
        </el-button>
        <el-button @click="showCriticalPath">
          <el-icon><TrendCharts /></el-icon>
          关键路径
        </el-button>
      </div>
      
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        @node-drag-stop="onNodeDragStop"
        @edge-click="onEdgeClick"
      >
        <template #node-task="{ data }">
          <TaskNode :task="data.task" />
        </template>
        
        <template #edge-dependency="{ data }">
          <DependencyEdge :dependency="data" />
        </template>
      </VueFlow>
      
      <CycleDetectionDialog
        v-model="showCycleDialog"
        :cycle="detectedCycle"
      />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { VueFlow, useVueFlow } from '@vue-flow/core';
  import dagre from 'dagre';
  import { useTaskGraph, useDetectCycle } from '@/hooks/useTaskDependency';
  
  const props = defineProps<{
    taskUuids: string[];
  }>();
  
  const { data: graphData } = useTaskGraph(props.taskUuids);
  const { mutate: detectCyclesMutation } = useDetectCycle();
  
  const showCycleDialog = ref(false);
  const detectedCycle = ref<string[]>([]);
  
  const { fitView } = useVueFlow();
  
  const nodes = computed(() => {
    if (!graphData.value) return [];
    
    return graphData.value.nodes.map(node => ({
      id: node.id,
      type: 'task',
      position: node.position || { x: 0, y: 0 },
      data: { task: node }
    }));
  });
  
  const edges = computed(() => {
    if (!graphData.value) return [];
    
    return graphData.value.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'dependency',
      data: edge,
      animated: edge.dependencyType === 'blocking',
      style: {
        stroke: edge.dependencyType === 'blocking' ? '#f56c6c' : '#909399'
      }
    }));
  });
  
  function autoLayout() {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));
    
    nodes.value.forEach(node => {
      g.setNode(node.id, { width: 200, height: 80 });
    });
    
    edges.value.forEach(edge => {
      g.setEdge(edge.source, edge.target);
    });
    
    dagre.layout(g);
    
    nodes.value.forEach(node => {
      const nodeWithPosition = g.node(node.id);
      node.position = {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y
      };
    });
    
    setTimeout(() => fitView(), 100);
  }
  
  function detectCycles() {
    detectCyclesMutation(props.taskUuids, {
      onSuccess: (result) => {
        if (result.hasCycle) {
          detectedCycle.value = result.cycle || [];
          showCycleDialog.value = true;
        } else {
          ElMessage.success('未检测到循环依赖');
        }
      }
    });
  }
  
  watch(
    () => graphData.value,
    () => {
      if (graphData.value) {
        autoLayout();
      }
    },
    { immediate: true }
  );
  </script>
  ```

- [ ] **13:00-17:00** 创建自定义节点和边组件 + Code Review (4h)
  - `TaskNode.vue`: 任务节点（显示状态、进度）
  - `DependencyEdge.vue`: 依赖边（区分 blocking/suggested）

**交付物**: ✅ DAG 可视化基础版

---

### **Week 10: 继续 TASK-001 + TASK-006**

#### **Day 6 (2025-12-22 周一): UI - DAG 可视化 (Part 2)**

**目标**: 完成 TASK-001 Story-006 (剩余)

**任务清单**:
- [ ] **09:00-12:00** 添加交互功能 (3h)
  - 拖拽添加依赖
  - 右键菜单（删除依赖、查看详情）
  - 关键路径高亮

- [ ] **13:00-17:00** UI 优化 + 组件测试 (4h)
  - 性能优化（虚拟化）
  - 组件测试
  - PR: `feat(task): complete DAG visualization UI`

**交付物**: ✅ DAG 可视化完整版

---

#### **Day 7 (2025-12-23 周二): TASK-006 - 依赖关系管理 (快速开发)**

**目标**: 完成 TASK-006 Story-001~005 (13 SP)

由于 TASK-006 复用 TASK-001 的大部分基础设施，可以快速开发：

**任务清单**:
- [ ] **09:00-12:00** Contracts + Domain + Application (3h)
  - 添加依赖管理的辅助方法
  - 批量添加/删除依赖
  - 依赖冲突检测

- [ ] **13:00-17:00** API + Client + 基础 UI (4h)
  - 依赖管理 API 端点
  - Client Services
  - 简单的依赖列表 UI

**交付物**: ✅ TASK-006 基础功能 (13 SP)

---

#### **Day 8 (2025-12-24 周三): TASK-001 + TASK-006 E2E 测试**

**目标**: 完成 E2E 测试

**任务清单**:
- [ ] **09:00-12:00** 编写 E2E 测试 (3h)
  - 测试添加依赖
  - 测试循环检测
  - 测试 DAG 可视化

- [ ] **13:00-17:00** Bug Fixes + 优化 (4h)

**交付物**: ✅ E2E 测试完成

---

#### **Day 9 (2025-12-25 周四): Buffer Day + Code Review**

**目标**: 缓冲时间，处理遗留问题

---

#### **Day 10 (2025-12-26 周五): Sprint Review**

**目标**: Sprint 4 Review & Retrospective

---

## 📊 Sprint 统计

- **TASK-001**: 18 SP (7 Stories)
- **TASK-006**: 15 SP (7 Stories)
- **总计**: 33 SP, 预估 10 工作日

---

## ✅ Definition of Done

同 Sprint 3，详见 [sprint-03-plan.md](./sprint-03-plan.md)

---

## 🚨 风险管理

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| graphlib 性能问题 | 低 | 高 | Sprint 2a Spike 已验证，性能达标 |
| @vue-flow/core 兼容性 | 低 | 中 | 提前测试，准备 Cytoscape.js 备选 |
| 大规模图渲染性能 | 中 | 中 | 虚拟化，限制节点数量（< 500）|

---

## 📚 参考文档

- [Epic: TASK-001](../epics/epic-task-001-dependency-graph.md)
- [Epic: TASK-006](../epics/epic-task-006-task-dependencies.md)
- [ADR-002: DAG 可视化技术选型](../TECHNICAL_DECISIONS.md#adr-002)
- [Sprint 2a DAG Spike 报告](./sprint-02a-plan.md)

---

**Sprint 计划创建于**: 2025-10-21  
**前置条件**: Sprint 3 完成, Sprint 2a DAG Spike 通过  
**下一步**: Sprint 5 (日程冲突检测 + 智能提醒)

---

*祝 Sprint 4 顺利！🚀*
