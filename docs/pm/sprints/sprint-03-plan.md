# Sprint 3 详细执行计划

> **Sprint ID**: Sprint 3  
> **Sprint 周期**: Week 7-8 (2025-12-01 ~ 2025-12-12)  
> **Sprint 目标**: 实现目标进度自动计算 + 任务优先级矩阵  
> **Story Points**: 30 SP  
> **Epics**: GOAL-004 + TASK-002  
> **状态**: Planning  
> **依赖**: Sprint 2a/2b (Goal 模块基础架构)

---

## 📋 Sprint 概览

### Sprint 目标 (Sprint Goal)

> **实现目标进度的自动计算能力和任务优先级的科学管理，提升数据准确性和任务执行效率。**

**核心价值**:
- ✅ 目标进度根据 KR 权重自动计算，消除手动更新
- ✅ 基于艾森豪威尔矩阵（重要性×紧急度）管理任务优先级
- ✅ 提供四象限矩阵可视化，帮助用户科学决策
- ✅ 智能排序功能，自动按优先级重排任务列表

### Epic 背景

**GOAL-004 - 目标进度自动计算**:
- **业务价值**: 根据 KR 完成情况和权重自动计算目标进度，确保数据实时准确
- **核心算法**: 加权平均 `progress = Σ(KR.progress × KR.weight) / Σ(KR.weight)`
- **用户场景**: 用户更新 KR 进度后，目标进度自动更新；调整 KR 权重后，目标进度自动重算

**TASK-002 - 任务优先级矩阵**:
- **业务价值**: 基于艾森豪威尔矩阵自动计算任务优先级，科学决策"先做什么"
- **核心算法**: 优先级分数 = 重要性(1-5) × 紧急度(1-5)
- **用户场景**: 用户设置任务重要性和紧急度，系统自动计算优先级并分配到四象限

---

## 📅 每日执行计划 (Day-by-Day Plan)

### **Week 7: 目标进度自动计算 (GOAL-004)**

#### **Day 1 (2025-12-01 周一): Contracts & Domain 层**

**目标**: 完成 GOAL-004 Story-001 (3 SP)

**任务清单**:
- [ ] **09:00-09:15** Sprint 3 Kickoff 会议
  - Review Sprint 2a/2b 成果
  - Review Sprint 3 目标和 Story 列表
  - 确认技术栈和分工

- [ ] **09:30-12:00** 开发 Contracts 层 (2.5h)
  - 创建进度计算相关 DTO:
    ```typescript
    // packages/contracts/src/goal/ProgressCalculationMode.ts
    export enum ProgressCalculationMode {
      WEIGHTED_AVERAGE = 'weighted_average',  // 加权平均（默认）
      MIN_VALUE = 'min_value',                // 最小值
      THRESHOLD = 'threshold',                // 阈值模式
      CUSTOM = 'custom'                       // 自定义
    }
    
    // packages/contracts/src/goal/ProgressBreakdown.ts
    export interface ProgressBreakdown {
      totalProgress: number;
      calculationMode: ProgressCalculationMode;
      krContributions: Array<{
        keyResultUuid: string;
        keyResultName: string;
        progress: number;
        weight: number;
        contribution: number;  // progress × weight
      }>;
      calculationFormula: string;
      updatedAt: number;
    }
    
    // packages/contracts/src/goal/ProgressOverride.ts
    export interface ProgressOverride {
      isOverridden: boolean;
      manualProgress: number;
      overrideReason: string;
      autoRestore: boolean;
      overrideTime: number;
      operatorUuid: string;
    }
    ```
  - 更新 `GoalServerDTO` 添加进度相关字段

- [ ] **13:00-15:00** 开发 Domain 层 (2h)
  - 更新 `Goal` 聚合根添加进度计算方法:
    ```typescript
    export class Goal extends AggregateRoot {
      private _progress: number = 0;
      private _progressCalculationMode = ProgressCalculationMode.WEIGHTED_AVERAGE;
      private _progressOverride?: ProgressOverride;
      
      /**
       * 自动计算目标进度（加权平均算法）
       */
      calculateProgress(): void {
        if (this._progressOverride?.isOverridden && !this.shouldAutoRestore()) {
          return;
        }
        
        const newProgress = this.calculateWeightedAverage();
        
        if (newProgress !== this._progress) {
          const oldProgress = this._progress;
          this._progress = newProgress;
          
          this.addDomainEvent(new GoalProgressUpdatedEvent({
            goalUuid: this.uuid,
            oldProgress,
            newProgress,
            trigger: 'kr_update'
          }));
        }
      }
      
      private calculateWeightedAverage(): number {
        if (this.keyResults.length === 0) return 0;
        
        const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
        if (totalWeight === 0) return 0;
        
        const weightedSum = this.keyResults.reduce(
          (sum, kr) => sum + (kr.progress * kr.weight / 100),
          0
        );
        
        return Math.round((weightedSum / totalWeight) * 100);
      }
      
      getProgressBreakdown(): ProgressBreakdown {
        // 返回进度分解详情
      }
      
      overrideProgress(manual: number, reason: string, operator: string): void {
        // 手动覆盖进度
      }
    }
    ```

- [ ] **15:00-17:00** 编写单元测试 (2h)
  - 测试加权平均算法
  - 测试进度分解计算
  - 测试手动覆盖逻辑
  - 目标覆盖率: ≥ 80%

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add progress auto-calculation contracts and domain`

**交付物**:
- ✅ 进度计算相关 Contracts (DTO + 枚举)
- ✅ Goal 聚合根的进度计算方法
- ✅ 单元测试覆盖率 ≥ 80%

---

#### **Day 2 (2025-12-02 周二): Application Service - 进度计算服务**

**目标**: 完成 GOAL-004 Story-002 (3 SP)

**任务清单**:
- [ ] **09:00-12:00** 创建 Application Service (3h)
  - 创建 `ProgressCalculationApplicationService.ts`:
    ```typescript
    export class ProgressCalculationApplicationService {
      constructor(
        private goalRepository: GoalRepository,
        private eventBus: EventBus
      ) {}
      
      /**
       * 重新计算目标进度（由 KR 更新触发）
       */
      async recalculateGoalProgress(goalUuid: string): Promise<void> {
        const goal = await this.goalRepository.findByUuid(goalUuid);
        if (!goal) throw new GoalNotFoundError();
        
        goal.calculateProgress();
        await this.goalRepository.save(goal);
        
        // 发布进度更新事件
        this.eventBus.publish(goal.getDomainEvents());
      }
      
      /**
       * 批量重算多个目标
       */
      async recalculateMultipleGoals(goalUuids: string[]): Promise<number> {
        let updatedCount = 0;
        
        for (const uuid of goalUuids) {
          try {
            await this.recalculateGoalProgress(uuid);
            updatedCount++;
          } catch (error) {
            console.error(`重算目标 ${uuid} 失败:`, error);
          }
        }
        
        return updatedCount;
      }
      
      /**
       * 手动覆盖进度
       */
      async overrideProgress(
        goalUuid: string,
        manualProgress: number,
        reason: string,
        operatorUuid: string
      ): Promise<void> {
        const goal = await this.goalRepository.findByUuid(goalUuid);
        if (!goal) throw new GoalNotFoundError();
        
        goal.overrideProgress(manualProgress, reason, operatorUuid);
        await this.goalRepository.save(goal);
      }
      
      /**
       * 恢复自动计算
       */
      async restoreAutoProgress(goalUuid: string): Promise<void> {
        const goal = await this.goalRepository.findByUuid(goalUuid);
        if (!goal) throw new GoalNotFoundError();
        
        goal.restoreAutoProgress();
        goal.calculateProgress();
        await this.goalRepository.save(goal);
      }
    }
    ```

- [ ] **13:00-15:00** 集成事件监听 (2h)
  - 创建 `KeyResultProgressUpdatedEventHandler`:
    ```typescript
    export class KeyResultProgressUpdatedEventHandler {
      constructor(
        private progressService: ProgressCalculationApplicationService
      ) {}
      
      async handle(event: KeyResultProgressUpdatedEvent): Promise<void> {
        // KR 进度更新时，自动触发目标进度重算
        await this.progressService.recalculateGoalProgress(event.goalUuid);
      }
    }
    ```
  - 创建 `KeyResultWeightChangedEventHandler`（权重变化也触发重算）

- [ ] **15:00-17:00** 编写集成测试 (2h)
  - 测试进度自动重算
  - 测试事件驱动流程
  - 测试批量重算

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add progress calculation application service`

**交付物**:
- ✅ `ProgressCalculationApplicationService` 完整实现
- ✅ 事件监听器（自动触发重算）
- ✅ 集成测试覆盖率 ≥ 80%

---

#### **Day 3 (2025-12-03 周三): Infrastructure + API**

**目标**: 完成 GOAL-004 Story-003 (2 SP) + Story-004 (2 SP)

**任务清单**:
- [ ] **09:00-11:00** 更新 Prisma Schema (2h)
  - 更新 `Goal` 模型:
    ```prisma
    model Goal {
      // ...existing fields...
      
      progress                    Int       // 0-100
      progressCalculationMode     String    @default("weighted_average")
      progressBreakdown           Json?     // ProgressBreakdown
      progressOverride            Json?     // ProgressOverride
      lastProgressUpdateTime      BigInt
      progressUpdateTrigger       String    @default("manual")
      
      @@map("goals")
    }
    ```
  - 运行迁移: `pnpm nx run api:prisma-migrate-dev --name add_goal_progress_fields`

- [ ] **11:00-13:00** 创建 API Endpoints (2h)
  - 创建 `ProgressController.ts`:
    ```typescript
    @Controller('/api/goals')
    export class ProgressController {
      constructor(private progressService: ProgressCalculationApplicationService) {}
      
      @Post('/:goalId/recalculate-progress')
      @UseGuards(AuthGuard, GoalMemberGuard)
      async recalculateProgress(@Param('goalId') goalId: string): Promise<void> {
        await this.progressService.recalculateGoalProgress(goalId);
      }
      
      @Post('/batch-recalculate-progress')
      @UseGuards(AuthGuard)
      async batchRecalculate(@Body() body: { goalUuids: string[] }): Promise<{ count: number }> {
        const count = await this.progressService.recalculateMultipleGoals(body.goalUuids);
        return { count };
      }
      
      @Post('/:goalId/override-progress')
      @UseGuards(AuthGuard, GoalMemberGuard)
      async overrideProgress(
        @Param('goalId') goalId: string,
        @Body() body: { progress: number; reason: string },
        @CurrentUser() user: User
      ): Promise<void> {
        await this.progressService.overrideProgress(
          goalId,
          body.progress,
          body.reason,
          user.uuid
        );
      }
      
      @Post('/:goalId/restore-auto-progress')
      @UseGuards(AuthGuard, GoalMemberGuard)
      async restoreAutoProgress(@Param('goalId') goalId: string): Promise<void> {
        await this.progressService.restoreAutoProgress(goalId);
      }
    }
    ```

- [ ] **14:00-16:00** 编写 API 测试 (2h)
  - 使用 Supertest
  - 测试所有端点
  - 测试权限检查

- [ ] **16:00-17:30** Code Review & 集成测试
  - PR: `feat(goal): add progress calculation API`

**交付物**:
- ✅ Prisma Schema 和数据库迁移
- ✅ Progress API 端点
- ✅ API 测试覆盖率 ≥ 80%

---

#### **Day 4 (2025-12-04 周四): Client Services + UI 准备**

**目标**: 完成 GOAL-004 Story-005 (2 SP)

**任务清单**:
- [ ] **09:00-12:00** 创建 Client Service (3h)
  - 创建 `ProgressClientService.ts`:
    ```typescript
    export class ProgressClientService {
      constructor(private httpClient: HttpClient) {}
      
      async recalculateProgress(goalUuid: string): Promise<void> {
        await this.httpClient.post(`/api/goals/${goalUuid}/recalculate-progress`);
      }
      
      async overrideProgress(
        goalUuid: string,
        progress: number,
        reason: string
      ): Promise<void> {
        await this.httpClient.post(`/api/goals/${goalUuid}/override-progress`, {
          progress,
          reason
        });
      }
      
      async restoreAutoProgress(goalUuid: string): Promise<void> {
        await this.httpClient.post(`/api/goals/${goalUuid}/restore-auto-progress`);
      }
    }
    ```

- [ ] **13:00-15:00** 集成 React Query (2h)
  - 创建 hooks:
    ```typescript
    export function useRecalculateProgress() {
      const queryClient = useQueryClient();
      
      return useMutation({
        mutationFn: (goalUuid: string) =>
          progressService.recalculateProgress(goalUuid),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }
      });
    }
    ```

- [ ] **15:00-17:00** 编写客户端测试 (2h)
  - Mock HTTP responses
  - 测试 React Query hooks

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add progress client services`

**交付物**:
- ✅ `ProgressClientService` 完整实现
- ✅ React Query hooks
- ✅ 客户端测试覆盖率 ≥ 80%

---

#### **Day 5 (2025-12-05 周五): UI - 进度分解详情 + Code Review**

**目标**: 完成 GOAL-004 Story-006 (3 SP)

**任务清单**:
- [ ] **09:00-12:00** 创建进度分解组件 (3h)
  - 创建 `ProgressBreakdownPanel.vue`:
    ```vue
    <template>
      <el-card class="progress-breakdown">
        <template #header>
          <div class="header">
            <span>进度详情</span>
            <el-tag>{{ calculationModeLabel }}</el-tag>
          </div>
        </template>
        
        <div class="total-progress">
          <el-progress
            :percentage="breakdown.totalProgress"
            :color="progressColor"
          />
          <span class="value">{{ breakdown.totalProgress }}%</span>
        </div>
        
        <el-divider />
        
        <div class="kr-contributions">
          <div
            v-for="kr in breakdown.krContributions"
            :key="kr.keyResultUuid"
            class="kr-item"
          >
            <div class="kr-info">
              <span class="kr-name">{{ kr.keyResultName }}</span>
              <span class="kr-weight">(权重: {{ kr.weight }}%)</span>
            </div>
            <div class="kr-progress">
              <el-progress
                :percentage="kr.progress"
                :stroke-width="8"
                :show-text="false"
              />
              <span class="progress-value">{{ kr.progress }}%</span>
            </div>
            <div class="kr-contribution">
              贡献: {{ kr.contribution }}%
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="calculation-formula">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ breakdown.calculationFormula }}</span>
        </div>
        
        <div class="actions">
          <el-button @click="recalculate">
            <el-icon><Refresh /></el-icon>
            重新计算
          </el-button>
          <el-button @click="showOverrideDialog">
            <el-icon><Edit /></el-icon>
            手动覆盖
          </el-button>
        </div>
      </el-card>
    </template>
    
    <script setup lang="ts">
    import { computed } from 'vue';
    import { useRecalculateProgress } from '@/hooks/useProgress';
    
    const props = defineProps<{
      goalUuid: string;
      breakdown: ProgressBreakdown;
    }>();
    
    const { mutate: recalculate } = useRecalculateProgress();
    
    const calculationModeLabel = computed(() => {
      const labels = {
        weighted_average: '加权平均',
        min_value: '最小值',
        threshold: '阈值模式',
        custom: '自定义'
      };
      return labels[props.breakdown.calculationMode];
    });
    
    function showOverrideDialog() {
      // 打开手动覆盖对话框
    }
    </script>
    ```

- [ ] **13:00-15:00** Code Review 会议 (2h)
  - Review Week 7 所有代码
  - 讨论技术债务

- [ ] **15:00-17:00** 修复 Review 问题 (2h)

- [ ] **17:00-17:30** 周总结
  - GOAL-004 完成度: 预计 100%

**交付物**:
- ✅ `ProgressBreakdownPanel.vue` 组件
- ✅ Week 7 Code Review 完成
- ✅ GOAL-004 (15 SP) 基本完成

---

### **Week 8: 任务优先级矩阵 (TASK-002)**

#### **Day 6 (2025-12-08 周一): Contracts & Domain + Application**

**目标**: 完成 TASK-002 Story-001 (2 SP) + Story-002 (3 SP)

**任务清单**:
- [ ] **09:00-11:00** Contracts & Domain 层 (2h)
  - 更新 `TaskServerDTO`:
    ```typescript
    export interface TaskServerDTO {
      // ...existing fields...
      importance: number;        // 1-5
      urgency: number;           // 1-5
      priorityScore: number;     // importance × urgency (1-25)
      autoAdjustEnabled: boolean;
    }
    ```
  - 更新 `Task` 聚合根:
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
          this.addDomainEvent(new TaskPriorityChangedEvent({
            taskUuid: this.uuid,
            oldScore,
            newScore: this._priorityScore
          }));
        }
      }
      
      getQuadrant(): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
        if (this._importance >= 4 && this._urgency >= 4) return 'Q1';  // 重要且紧急
        if (this._importance >= 4 && this._urgency < 4) return 'Q2';   // 重要不紧急
        if (this._importance < 4 && this._urgency >= 4) return 'Q3';   // 紧急不重要
        return 'Q4';  // 不重要不紧急
      }
    }
    ```

- [ ] **11:00-13:00** Application Service (2h)
  - 创建 `TaskPriorityService.ts`:
    ```typescript
    export class TaskPriorityService {
      constructor(private taskRepository: TaskRepository) {}
      
      /**
       * 智能排序（按优先级分数 + 截止日期 + 创建时间）
       */
      async smartSort(taskUuids: string[]): Promise<Task[]> {
        const tasks = await this.taskRepository.findByUuids(taskUuids);
        
        const sorted = tasks.sort((a, b) => {
          // 1. 优先级分数降序
          if (a.priorityScore !== b.priorityScore) {
            return b.priorityScore - a.priorityScore;
          }
          // 2. 截止日期升序（越近越优先）
          if (a.dueDate && b.dueDate) {
            return a.dueDate - b.dueDate;
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          // 3. 创建时间升序
          return a.createdAt - b.createdAt;
        });
        
        // 更新 orderIndex
        sorted.forEach((task, index) => {
          task.setOrderIndex(index + 1);
        });
        
        await this.taskRepository.saveAll(sorted);
        
        return sorted;
      }
      
      /**
       * 批量设置优先级
       */
      async batchSetPriority(
        taskUuids: string[],
        importance?: number,
        urgency?: number
      ): Promise<number> {
        const tasks = await this.taskRepository.findByUuids(taskUuids);
        
        tasks.forEach(task => {
          const newImportance = importance ?? task.importance;
          const newUrgency = urgency ?? task.urgency;
          task.setPriority(newImportance, newUrgency);
        });
        
        await this.taskRepository.saveAll(tasks);
        
        return tasks.length;
      }
      
      /**
       * 按象限获取任务
       */
      async getTasksByQuadrant(
        quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4'
      ): Promise<Task[]> {
        const allTasks = await this.taskRepository.findAll();
        return allTasks.filter(task => task.getQuadrant() === quadrant);
      }
    }
    ```

- [ ] **14:00-17:00** 编写测试 + Code Review (3h)
  - 单元测试
  - 集成测试
  - PR: `feat(task): add priority matrix contracts, domain and service`

**交付物**:
- ✅ 优先级相关 Contracts 和 Domain 实体
- ✅ `TaskPriorityService` 完整实现
- ✅ 测试覆盖率 ≥ 80%

---

#### **Day 7 (2025-12-09 周二): Infrastructure + API**

**目标**: 完成 TASK-002 Story-003 (2 SP) + Story-004 (2 SP)

**任务清单**:
- [ ] **09:00-11:00** 更新 Prisma Schema (2h)
  - 更新 `Task` 模型:
    ```prisma
    model Task {
      // ...existing fields...
      
      importance          Int       @default(3)  // 1-5
      urgency             Int       @default(3)  // 1-5
      priorityScore       Int       @default(9)  // importance × urgency
      autoAdjustEnabled   Boolean   @default(true)
      orderIndex          Int       @default(0)
      
      @@index([priorityScore(sort: Desc), dueDate(sort: Asc)])
      @@map("tasks")
    }
    ```
  - 运行迁移

- [ ] **11:00-13:00** 创建 API Endpoints (2h)
  - 创建 `TaskPriorityController.ts`:
    ```typescript
    @Controller('/api/tasks')
    export class TaskPriorityController {
      constructor(private priorityService: TaskPriorityService) {}
      
      @Put('/:taskId/priority')
      @UseGuards(AuthGuard)
      async setPriority(
        @Param('taskId') taskId: string,
        @Body() body: { importance: number; urgency: number }
      ): Promise<TaskServerDTO> {
        const task = await this.taskRepository.findByUuid(taskId);
        task.setPriority(body.importance, body.urgency);
        await this.taskRepository.save(task);
        return this.toDTO(task);
      }
      
      @Post('/smart-sort')
      @UseGuards(AuthGuard)
      async smartSort(@Body() body: { taskUuids: string[] }): Promise<TaskServerDTO[]> {
        const sorted = await this.priorityService.smartSort(body.taskUuids);
        return sorted.map(t => this.toDTO(t));
      }
      
      @Get('/by-quadrant/:quadrant')
      @UseGuards(AuthGuard)
      async getByQuadrant(@Param('quadrant') quadrant: string): Promise<TaskServerDTO[]> {
        const tasks = await this.priorityService.getTasksByQuadrant(quadrant as any);
        return tasks.map(t => this.toDTO(t));
      }
    }
    ```

- [ ] **14:00-17:00** 编写 API 测试 + Code Review (3h)
  - PR: `feat(task): add priority matrix API`

**交付物**:
- ✅ Prisma Schema 更新
- ✅ Priority API 端点
- ✅ API 测试覆盖率 ≥ 80%

---

#### **Day 8 (2025-12-10 周三): Client Services + UI - 四象限矩阵**

**目标**: 完成 TASK-002 Story-005 (2 SP) + Story-006 (3 SP 部分)

**任务清单**:
- [ ] **09:00-11:00** Client Service (2h)
  - 创建 `TaskPriorityClientService.ts`
  - 创建 React Query hooks

- [ ] **11:00-17:00** 创建四象限矩阵 UI (6h)
  - 创建 `PriorityMatrixView.vue`:
    ```vue
    <template>
      <div class="priority-matrix">
        <div class="matrix-grid">
          <div class="quadrant q1">
            <div class="quadrant-header">
              <h3>Q1: 重要且紧急</h3>
              <el-tag type="danger">{{ q1Tasks.length }} 个任务</el-tag>
            </div>
            <draggable
              v-model="q1Tasks"
              :group="{ name: 'tasks', pull: true, put: true }"
              @change="onTaskMoved"
            >
              <TaskCard
                v-for="task in q1Tasks"
                :key="task.uuid"
                :task="task"
              />
            </draggable>
          </div>
          
          <div class="quadrant q2">
            <div class="quadrant-header">
              <h3>Q2: 重要不紧急</h3>
              <el-tag type="warning">{{ q2Tasks.length }} 个任务</el-tag>
            </div>
            <draggable
              v-model="q2Tasks"
              :group="{ name: 'tasks', pull: true, put: true }"
              @change="onTaskMoved"
            >
              <TaskCard
                v-for="task in q2Tasks"
                :key="task.uuid"
                :task="task"
              />
            </draggable>
          </div>
          
          <div class="quadrant q3">
            <div class="quadrant-header">
              <h3>Q3: 紧急不重要</h3>
              <el-tag type="info">{{ q3Tasks.length }} 个任务</el-tag>
            </div>
            <draggable
              v-model="q3Tasks"
              :group="{ name: 'tasks', pull: true, put: true }"
              @change="onTaskMoved"
            >
              <TaskCard
                v-for="task in q3Tasks"
                :key="task.uuid"
                :task="task"
              />
            </draggable>
          </div>
          
          <div class="quadrant q4">
            <div class="quadrant-header">
              <h3>Q4: 不重要不紧急</h3>
              <el-tag>{{ q4Tasks.length }} 个任务</el-tag>
            </div>
            <draggable
              v-model="q4Tasks"
              :group="{ name: 'tasks', pull: true, put: true }"
              @change="onTaskMoved"
            >
              <TaskCard
                v-for="task in q4Tasks"
                :key="task.uuid"
                :task="task"
              />
            </draggable>
          </div>
        </div>
        
        <div class="matrix-actions">
          <el-button type="primary" @click="smartSort">
            <el-icon><Sort /></el-icon>
            智能排序
          </el-button>
        </div>
      </div>
    </template>
    
    <script setup lang="ts">
    import { ref, computed } from 'vue';
    import draggable from 'vuedraggable';
    import { useTasks } from '@/hooks/useTasks';
    import { useSmartSort } from '@/hooks/useTaskPriority';
    
    const { data: tasks } = useTasks();
    const { mutate: smartSort } = useSmartSort();
    
    const q1Tasks = computed(() => 
      tasks.value?.filter(t => t.importance >= 4 && t.urgency >= 4) || []
    );
    const q2Tasks = computed(() => 
      tasks.value?.filter(t => t.importance >= 4 && t.urgency < 4) || []
    );
    const q3Tasks = computed(() => 
      tasks.value?.filter(t => t.importance < 4 && t.urgency >= 4) || []
    );
    const q4Tasks = computed(() => 
      tasks.value?.filter(t => t.importance < 4 && t.urgency < 4) || []
    );
    
    function onTaskMoved(event: any) {
      // 根据拖拽位置自动调整重要性和紧急度
    }
    </script>
    
    <style scoped>
    .priority-matrix {
      height: 100%;
    }
    
    .matrix-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 16px;
      height: calc(100% - 60px);
    }
    
    .quadrant {
      border: 2px solid var(--el-border-color);
      border-radius: 8px;
      padding: 16px;
      overflow-y: auto;
    }
    
    .q1 { border-color: var(--el-color-danger); background: #fef0f0; }
    .q2 { border-color: var(--el-color-warning); background: #fdf6ec; }
    .q3 { border-color: var(--el-color-info); background: #f4f4f5; }
    .q4 { border-color: var(--el-border-color); background: #fafafa; }
    </style>
    ```

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(task): add priority matrix UI`

**交付物**:
- ✅ Client Service 和 hooks
- ✅ 四象限矩阵 UI（基础版）
- ✅ 拖拽功能集成

---

#### **Day 9 (2025-12-11 周四): UI 完善 + E2E 测试准备**

**目标**: 完成 TASK-002 Story-006 (剩余) + E2E 准备

**任务清单**:
- [ ] **09:00-12:00** UI 优化 (3h)
  - 优化拖拽体验
  - 添加任务卡片样式
  - 添加优先级编辑对话框

- [ ] **13:00-15:00** E2E 测试准备 (2h)
  - 为所有组件添加 `data-testid`
  - Review 前端组件完整性

- [ ] **15:00-17:00** 编写组件测试 (2h)
  - 测试四象限矩阵
  - 测试拖拽功能

- [ ] **17:00-17:30** Code Review
  - PR: `feat(task): complete priority matrix UI`

**交付物**:
- ✅ 优先级矩阵 UI 完整版
- ✅ 组件测试覆盖率 ≥ 80%
- ✅ E2E 测试准备就绪

---

#### **Day 10 (2025-12-12 周五): E2E Tests + Sprint Review**

**目标**: 完成 GOAL-004 Story-007 (2 SP) + TASK-002 Story-007 (1 SP) + Sprint Review

**任务清单**:
- [ ] **09:00-12:00** 编写 E2E 测试 (3h)
  - 测试目标进度自动计算流程
  - 测试任务优先级矩阵操作
  - 测试智能排序功能

- [ ] **13:00-15:00** Bug Fixes & 优化 (2h)
  - 修复 E2E 测试发现的问题
  - 性能优化
  - 最终代码清理

- [ ] **15:00-17:00** Sprint Review 会议 (2h)
  - **参与者**: 全员 + 产品经理
  - **议程**:
    - Demo 目标进度自动计算（10 分钟）
    - Demo 任务优先级矩阵（10 分钟）
    - Review Story 完成情况（30 分钟）
      - GOAL-004: 15/15 SP ✅
      - TASK-002: 15/15 SP ✅
      - 总计: 30/30 SP (100%)
    - 讨论技术债务（15 分钟）
    - 收集反馈和改进建议（15 分钟）
    - 确认 Sprint 3 是否达到 DoD（10 分钟）

- [ ] **17:00-17:30** Sprint Retrospective 会议 (30 分钟)
  - 回顾 Sprint 3 表现
  - 讨论改进措施
  - 为 Sprint 4 做准备

**交付物**:
- ✅ E2E 测试套件完整
- ✅ 所有测试通过
- ✅ Sprint Review 完成
- ✅ Sprint Retrospective 完成

---

## 📊 Sprint 统计

### Story 完成情况

#### GOAL-004 (15 SP)

| Story ID | 标题 | SP | 预估工时 | 状态 |
|----------|------|----|---------|----|
| GOAL-004-S001 | Contracts & Domain | 3 | 1d | Planning |
| GOAL-004-S002 | Application Service | 3 | 1d | Planning |
| GOAL-004-S003 | Infrastructure | 2 | 0.5d | Planning |
| GOAL-004-S004 | API Endpoints | 2 | 0.5d | Planning |
| GOAL-004-S005 | Client Services | 2 | 0.5d | Planning |
| GOAL-004-S006 | UI - 进度分解 | 3 | 1d | Planning |
| GOAL-004-S007 | E2E Tests | 2 | 0.5d | Planning |

**小计**: 15 SP, 预估 5 工作日

#### TASK-002 (15 SP)

| Story ID | 标题 | SP | 预估工时 | 状态 |
|----------|------|----|---------|----|
| TASK-002-S001 | Contracts & Domain | 2 | 0.5d | Planning |
| TASK-002-S002 | Application Service | 3 | 1d | Planning |
| TASK-002-S003 | Infrastructure | 2 | 0.5d | Planning |
| TASK-002-S004 | API Endpoints | 2 | 0.5d | Planning |
| TASK-002-S005 | Client Services | 2 | 0.5d | Planning |
| TASK-002-S006 | UI - 四象限矩阵 | 3 | 1.5d | Planning |
| TASK-002-S007 | E2E Tests | 1 | 0.5d | Planning |

**小计**: 15 SP, 预估 5 工作日

**总计**: 30 SP, 预估 10 工作日（2 周）

---

## ✅ Definition of Done (DoD)

### Story 级别 DoD

每个 Story 必须满足:
- [ ] 所有验收标准通过
- [ ] 代码覆盖率 ≥ 80%
- [ ] ESLint 检查通过
- [ ] TypeScript 编译无错误
- [ ] Code Review 完成并批准
- [ ] API 文档更新（如适用）
- [ ] 性能指标达标

### Sprint 级别 DoD

Sprint 3 必须满足:
- [ ] 所有 14 个 Stories 状态为 Done
- [ ] 所有测试通过（单元 + 集成 + E2E）
- [ ] 无 P0 Bug
- [ ] P1 Bug ≤ 3 个
- [ ] 代码覆盖率 ≥ 80%
- [ ] 可部署到 Staging 环境
- [ ] Sprint Review 完成
- [ ] Sprint Retrospective 完成

---

## 🚨 风险管理

| 风险 | 概率 | 影响 | 缓解策略 | 负责人 |
|------|------|------|---------|--------|
| 进度计算逻辑复杂 | 中 | 高 | 充分的单元测试，覆盖边界情况 | 后端负责人 |
| 权重变化触发频繁重算 | 低 | 中 | 事件去重，批量处理 | 后端负责人 |
| 四象限矩阵拖拽性能 | 低 | 中 | 使用虚拟滚动，限制任务数量 | 前端负责人 |
| 依赖 Sprint 2a/2b | 中 | 高 | 确保 Sprint 2a/2b 按时完成 | PM |

---

## 📈 Sprint 监控指标

同 Sprint 2a，详见 [sprint-02a-plan.md](./sprint-02a-plan.md)

---

## 🔧 技术栈总结

同 Sprint 2a/2b，额外增加:
- **拖拽库**: vuedraggable 4.x

---

## 📚 参考文档

- [Epic: GOAL-004 - 目标进度自动计算](../epics/epic-goal-004-progress-auto-calculation.md)
- [Epic: TASK-002 - 任务优先级矩阵](../epics/epic-task-002-priority-matrix.md)
- [PM 阶段总结](../PM_PHASE_SUMMARY.md)
- [Sprint 2a 计划](./sprint-02a-plan.md)
- [Sprint 2b 计划](./sprint-02b-plan.md)

---

## 🎯 Sprint 成功标准

Sprint 3 被认为成功当且仅当:
1. ✅ 所有 14 个 Stories 完成并通过验收
2. ✅ 所有 DoD 检查项通过
3. ✅ 可在 Staging 环境正常运行
4. ✅ 产品经理验收通过
5. ✅ 进度计算准确，四象限矩阵易用
6. ✅ 团队准备好开始 Sprint 4

---

**Sprint 计划创建于**: 2025-10-21  
**计划审批**: 待团队 Review  
**前置条件**: Sprint 2a/2b 完成  
**下一步**: 等待 Sprint 2b 完成后启动

---

*祝 Sprint 3 顺利！🚀*
