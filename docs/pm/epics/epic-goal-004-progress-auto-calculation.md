# EPIC-GOAL-004: 目标进度自动计算

> **Epic ID**: EPIC-GOAL-004  
> **功能编号**: GOAL-004  
> **RICE 评分**: 480 (Reach: 8, Impact: 8, Confidence: 10, Effort: 1.33)  
> **优先级**: P0  
> **预估工期**: 1.5-2 周 (15 SP)  
> **Sprint**: Sprint 3  
> **状态**: Draft  
> **创建日期**: 2025-10-21

---

## 1. Epic 概述

### 业务价值

根据 KR（关键结果）的完成情况和权重自动计算目标进度，确保数据实时准确，消除手动更新的繁琐和错误。

**核心问题**:
- ❌ 用户需要手动更新目标进度，费时费力且容易遗忘
- ❌ 目标进度与 KR 进度不一致，导致数据混乱
- ❌ KR 权重变化后，目标进度未自动重新计算

**解决方案**:
- ✅ 基于加权平均算法自动计算目标进度
- ✅ KR 进度或权重变化时触发自动重算
- ✅ 提供进度分解详情，透明化计算过程
- ✅ 支持手动覆盖（特殊情况）

---

## 2. User Stories

### Story 001: Contracts & Domain - 进度计算核心定义

**Story ID**: GOAL-004-S001  
**Story Points**: 3 SP  
**优先级**: P0  
**预估时间**: 1-1.5 天

#### User Story

```gherkin
As a 开发者
I want 定义进度计算的 Contracts 和 Domain 模型
So that 系统有清晰的进度计算规则和数据结构
```

#### Acceptance Criteria

```gherkin
Scenario: 定义进度计算 Contracts
  Given 需要支持多种进度计算模式
  When 开发者创建 Contracts
  Then 应定义以下接口：
    | 接口                          | 说明                     |
    | ProgressCalculationMode      | 计算模式枚举              |
    | ProgressBreakdown           | 进度分解详情              |
    | ProgressOverride            | 手动覆盖配置              |
  And GoalServerDTO 应扩展以下字段：
    | 字段                        | 类型                    | 说明                |
    | progress                    | number                  | 目标进度 (0-100)     |
    | progressCalculationMode     | ProgressCalculationMode | 计算模式            |
    | progressBreakdown           | ProgressBreakdown?      | 进度分解详情         |
    | progressOverride            | ProgressOverride?       | 手动覆盖配置         |
    | lastProgressUpdateTime      | number                  | 最后更新时间         |
    | progressUpdateTrigger       | string                  | 触发原因            |

Scenario: 实现 Domain 层计算逻辑
  Given Goal 聚合根需要计算进度
  When 开发者实现 Domain 层
  Then Goal 类应包含以下方法：
    | 方法                       | 功能                         |
    | calculateProgress()       | 根据 KR 计算目标进度          |
    | getProgressBreakdown()    | 获取进度分解详情              |
    | overrideProgress()        | 手动覆盖进度                 |
    | restoreAutoProgress()     | 恢复自动计算                 |
  And 应实现加权平均算法：
    """
    progress = Σ(KR.progress × KR.weight) / Σ(KR.weight)
    """
```

#### Technical Details

**Contracts Definition** (`packages/contracts/src/modules/goal/aggregates/GoalServer.ts`):

```typescript
/**
 * 进度计算模式
 */
export enum ProgressCalculationMode {
  WEIGHTED_AVERAGE = 'weighted_average',  // 加权平均（MVP 默认）
  MIN_VALUE = 'min_value',                // 最小值（MMP）
  THRESHOLD = 'threshold',                // 阈值模式（MMP）
  CUSTOM = 'custom'                       // 自定义（Full）
}

/**
 * 进度分解详情
 */
export interface ProgressBreakdown {
  readonly totalProgress: number;                    // 总进度
  readonly calculationMode: ProgressCalculationMode; // 计算模式
  readonly krContributions: Array<{                  // KR 贡献度
    keyResultUuid: string;
    keyResultName: string;
    progress: number;                                // KR 进度
    weight: number;                                  // KR 权重
    contribution: number;                            // 贡献值 = progress × weight
  }>;
  readonly calculationFormula: string;               // 计算公式（可读）
  readonly updatedAt: number;
}

/**
 * 手动进度覆盖
 */
export interface ProgressOverride {
  readonly isOverridden: boolean;
  readonly manualProgress: number;
  readonly overrideReason: string;
  readonly autoRestore: boolean;                     // 数据同步后自动恢复
  readonly overrideTime: number;
  readonly operatorUuid: string;
}

export interface GoalServerDTO {
  // ...existing fields...
  readonly progress: number;
  readonly progressCalculationMode: ProgressCalculationMode;
  readonly progressBreakdown?: ProgressBreakdown;
  readonly progressOverride?: ProgressOverride;
  readonly lastProgressUpdateTime: number;
  readonly progressUpdateTrigger: string;
}
```

**Domain Implementation** (`packages/domain-server/src/modules/goal/aggregates/Goal.ts`):

```typescript
export class Goal extends AggregateRoot {
  private _progress: number = 0;
  private _progressCalculationMode: ProgressCalculationMode = ProgressCalculationMode.WEIGHTED_AVERAGE;
  private _progressOverride?: ProgressOverride;
  
  /**
   * 自动计算目标进度
   */
  calculateProgress(): void {
    // 如果手动覆盖且不自动恢复，跳过计算
    if (this._progressOverride?.isOverridden && !this.shouldAutoRestore()) {
      return;
    }

    const newProgress = this.computeProgressByMode();
    const oldProgress = this._progress;

    if (newProgress !== oldProgress) {
      this._progress = newProgress;
      this.recordProgressChange(oldProgress, newProgress);
      this.addDomainEvent(new GoalProgressUpdatedEvent({
        goalUuid: this.uuid,
        oldProgress,
        newProgress,
        trigger: this.progressUpdateTrigger
      }));
    }
  }

  /**
   * 加权平均算法
   */
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

  /**
   * 获取进度分解详情
   */
  getProgressBreakdown(): ProgressBreakdown {
    const krContributions = this.keyResults.map(kr => ({
      keyResultUuid: kr.uuid,
      keyResultName: kr.name,
      progress: kr.progress,
      weight: kr.weight,
      contribution: Math.round((kr.progress * kr.weight) / 100)
    }));

    return {
      totalProgress: this._progress,
      calculationMode: this._progressCalculationMode,
      krContributions,
      calculationFormula: this.buildFormula(krContributions),
      updatedAt: Date.now()
    };
  }

  private buildFormula(contributions: Array<any>): string {
    const terms = contributions.map(c => `${c.progress}% × ${c.weight}%`).join(' + ');
    return `(${terms}) / 100% = ${this._progress}%`;
  }
}
```

#### Dependencies
- None (基础功能)

#### Testing Strategy
- **Unit Tests**: 加权平均算法测试（各种权重组合）
- **Edge Cases**: 无 KR、权重为 0、权重不等于 100%

---

### Story 002: Application Service - 进度更新服务

**Story ID**: GOAL-004-S002  
**Story Points**: 3 SP  
**优先级**: P0  
**预估时间**: 1-1.5 天

#### User Story

```gherkin
As a 开发者
I want 创建进度更新应用服务
So that 系统可以在 KR 变化时自动触发进度重算
```

#### Acceptance Criteria

```gherkin
Scenario: KR 进度更新触发进度重算
  Given Goal 有 3 个 KR，权重分别为 50%, 30%, 20%
  And KR 进度分别为 60%, 70%, 80%
  And 目标当前进度为 66%
  When KR1 进度从 60% 更新为 80%
  Then 系统应自动调用 UpdateGoalProgressService
  And 目标进度应重新计算为 76%
  And 进度更新事件应发布到事件总线
  And 触发原因应记录为 "kr_progress_update"

Scenario: KR 权重变化触发进度重算
  Given 目标当前进度为 76%
  When KR1 权重从 50% 调整为 40%
  And KR2 权重从 30% 调整为 40%
  Then 系统应触发进度重算
  And 新进度应根据新权重计算
  And 触发原因应记录为 "kr_weight_change"

Scenario: 批量操作合并计算
  Given 用户批量更新 3 个 KR 的进度
  When 批量操作提交
  Then 系统应合并为一次进度计算
  And 避免触发 3 次重复计算
```

#### Technical Details

**Application Service** (`packages/domain-server/src/modules/goal/application/UpdateGoalProgressService.ts`):

```typescript
export class UpdateGoalProgressService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: UpdateGoalProgressCommand): Promise<void> {
    const { goalUuid, trigger } = command;
    
    // 加载聚合根
    const goal = await this.goalRepository.findByUuid(goalUuid);
    if (!goal) {
      throw new GoalNotFoundException(goalUuid);
    }

    // 计算进度
    const oldProgress = goal.progress;
    goal.calculateProgress();
    goal.progressUpdateTrigger = trigger;

    // 持久化
    await this.goalRepository.save(goal);

    // 发布事件
    if (goal.progress !== oldProgress) {
      await this.eventBus.publish(
        new GoalProgressUpdatedEvent({
          goalUuid: goal.uuid,
          oldProgress,
          newProgress: goal.progress,
          progressDelta: goal.progress - oldProgress,
          trigger,
          timestamp: Date.now()
        })
      );
    }
  }

  /**
   * 批量更新（合并计算）
   */
  async executeBatch(goalUuids: string[], trigger: string): Promise<void> {
    const goals = await this.goalRepository.findByUuids(goalUuids);
    
    for (const goal of goals) {
      goal.calculateProgress();
      goal.progressUpdateTrigger = trigger;
    }

    await this.goalRepository.saveAll(goals);
    
    // 批量发布事件
    const events = goals
      .filter(g => g.hasProgressChanged())
      .map(g => new GoalProgressUpdatedEvent({...}));
    
    await this.eventBus.publishBatch(events);
  }
}
```

**Event Handler** (监听 KR 变化):

```typescript
@EventHandler(KeyResultProgressUpdatedEvent)
export class KeyResultProgressUpdatedHandler {
  constructor(
    private readonly updateProgressService: UpdateGoalProgressService
  ) {}

  async handle(event: KeyResultProgressUpdatedEvent): Promise<void> {
    await this.updateProgressService.execute({
      goalUuid: event.goalUuid,
      trigger: 'kr_progress_update'
    });
  }
}

@EventHandler(KeyResultWeightChangedEvent)
export class KeyResultWeightChangedHandler {
  async handle(event: KeyResultWeightChangedEvent): Promise<void> {
    await this.updateProgressService.execute({
      goalUuid: event.goalUuid,
      trigger: 'kr_weight_change'
    });
  }
}
```

#### Dependencies
- Story 001 (Contracts & Domain)

#### Testing Strategy
- **Integration Tests**: 监听 KR 事件触发进度更新
- **Performance Tests**: 批量更新性能测试

---

### Story 003: Infrastructure - 数据库字段扩展

**Story ID**: GOAL-004-S003  
**Story Points**: 2 SP  
**优先级**: P0  
**预估时间**: 0.5-1 天

#### User Story

```gherkin
As a 开发者
I want 扩展 Goal 表支持进度计算相关字段
So that 系统可以持久化进度计算状态
```

#### Acceptance Criteria

```gherkin
Scenario: 扩展 Goal 表字段
  Given 需要存储进度计算配置
  When 开发者更新 Prisma schema
  Then Goal 表应新增以下字段：
    | 字段                        | 类型      | 默认值          | 索引 |
    | progress                    | Int       | 0               | -    |
    | progressCalculationMode     | String    | weighted_average| -    |
    | lastProgressUpdateTime      | BigInt?   | null            | Yes  |
    | progressUpdateTrigger       | String?   | null            | -    |
    | progressIsOverridden        | Boolean   | false           | -    |
    | progressManualValue         | Int?      | null            | -    |
    | progressOverrideReason      | String?   | null            | -    |
  And 应创建迁移脚本
  And 不应破坏现有数据
```

#### Technical Details

**Prisma Schema** (`apps/api/prisma/schema.prisma`):

```prisma
model Goal {
  // ...existing fields...
  
  // 进度计算
  progress                    Int      @default(0) @map("progress")
  progressCalculationMode     String   @default("weighted_average") @map("progress_calculation_mode")
  lastProgressUpdateTime      BigInt?  @map("last_progress_update_time")
  progressUpdateTrigger       String?  @map("progress_update_trigger")
  
  // 手动覆盖
  progressIsOverridden        Boolean  @default(false) @map("progress_is_overridden")
  progressManualValue         Int?     @map("progress_manual_value")
  progressOverrideReason      String?  @map("progress_override_reason")
  progressAutoRestore         Boolean  @default(false) @map("progress_auto_restore")
  progressOverrideTime        BigInt?  @map("progress_override_time")
  progressOverrideOperator    String?  @map("progress_override_operator")

  @@index([lastProgressUpdateTime])
}
```

**Migration Script**:

```sql
-- Add progress calculation fields
ALTER TABLE "Goal" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Goal" ADD COLUMN "progress_calculation_mode" TEXT NOT NULL DEFAULT 'weighted_average';
ALTER TABLE "Goal" ADD COLUMN "last_progress_update_time" BIGINT;
ALTER TABLE "Goal" ADD COLUMN "progress_update_trigger" TEXT;
ALTER TABLE "Goal" ADD COLUMN "progress_is_overridden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Goal" ADD COLUMN "progress_manual_value" INTEGER;
ALTER TABLE "Goal" ADD COLUMN "progress_override_reason" TEXT;
ALTER TABLE "Goal" ADD COLUMN "progress_auto_restore" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Goal" ADD COLUMN "progress_override_time" BIGINT;
ALTER TABLE "Goal" ADD COLUMN "progress_override_operator" TEXT;

-- Create index
CREATE INDEX "Goal_last_progress_update_time_idx" ON "Goal"("last_progress_update_time");
```

#### Dependencies
- Story 001 (Contracts)

#### Testing Strategy
- **Migration Tests**: 验证迁移不破坏现有数据
- **Repository Tests**: CRUD 操作包含新字段

---

### Story 004: API Endpoints - 进度查询接口

**Story ID**: GOAL-004-S004  
**Story Points**: 2 SP  
**优先级**: P0  
**预估时间**: 0.5-1 天

#### User Story

```gherkin
As a 前端开发者
I want 调用 API 获取目标进度和分解详情
So that UI 可以展示进度计算结果
```

#### Acceptance Criteria

```gherkin
Scenario: 获取进度分解详情
  Given 目标存在且有 3 个 KR
  When 前端调用 GET /api/v1/goals/:id/progress-breakdown
  Then 应返回 200 状态码
  And 响应应包含：
    | 字段               | 类型   | 说明                |
    | totalProgress      | number | 总进度              |
    | calculationMode    | string | 计算模式            |
    | krContributions    | array  | KR 贡献度列表        |
    | calculationFormula | string | 计算公式（可读）     |
    | updatedAt          | number | 最后更新时间         |

Scenario: 手动覆盖进度
  Given 目标当前进度为 76%
  When 前端调用 POST /api/v1/goals/:id/progress-override
  And Body 为：
    """json
    {
      "manualProgress": 80,
      "reason": "KR2 数据延迟",
      "autoRestore": true
    }
    """
  Then 应返回 200 状态码
  And 目标进度应更新为 80%
  And 覆盖标记应设置为 true
```

#### Technical Details

**API Routes** (`apps/api/src/routes/goal.routes.ts`):

```typescript
// 获取进度分解详情
router.get('/:id/progress-breakdown', 
  authenticate,
  async (req, res) => {
    const goalUuid = req.params.id;
    const breakdown = await goalApplicationService.getProgressBreakdown(goalUuid);
    res.json(breakdown);
  }
);

// 手动覆盖进度
router.post('/:id/progress-override',
  authenticate,
  validateBody(ProgressOverrideSchema),
  async (req, res) => {
    const { manualProgress, reason, autoRestore } = req.body;
    const goal = await goalApplicationService.overrideProgress({
      goalUuid: req.params.id,
      manualProgress,
      reason,
      autoRestore,
      operatorUuid: req.user.uuid
    });
    res.json(toClientDTO(goal));
  }
);

// 恢复自动计算
router.delete('/:id/progress-override',
  authenticate,
  async (req, res) => {
    const goal = await goalApplicationService.restoreAutoProgress(req.params.id);
    res.json(toClientDTO(goal));
  }
);
```

**Validation Schema**:

```typescript
const ProgressOverrideSchema = z.object({
  manualProgress: z.number().min(0).max(100),
  reason: z.string().min(1).max(200),
  autoRestore: z.boolean().default(false)
});
```

#### Dependencies
- Story 002 (Application Service)
- Story 003 (Infrastructure)

#### Testing Strategy
- **API Tests**: 测试所有端点的请求/响应
- **Auth Tests**: 验证权限控制

---

### Story 005: Client Services - React Query 集成

**Story ID**: GOAL-004-S005  
**Story Points**: 2 SP  
**优先级**: P0  
**预估时间**: 0.5-1 天

#### User Story

```gherkin
As a 前端开发者
I want 使用 React Query 管理进度数据
So that UI 可以实时获取和缓存进度信息
```

#### Acceptance Criteria

```gherkin
Scenario: 查询进度分解详情
  Given 用户打开目标详情页
  When 组件调用 useProgressBreakdown(goalUuid)
  Then 应发送 GET /api/v1/goals/:id/progress-breakdown 请求
  And 数据应缓存 5 分钟
  And 返回 { data, isLoading, error }

Scenario: 覆盖进度（Optimistic Update）
  Given 目标当前进度为 76%
  When 用户调用 overrideProgress.mutate({ manualProgress: 80 })
  Then UI 应立即显示 80%（乐观更新）
  And 发送 POST 请求
  And 成功后保持 80%
  And 失败后回滚到 76%
```

#### Technical Details

**Client Service** (`packages/domain-client/src/modules/goal/services/GoalProgressService.ts`):

```typescript
export class GoalProgressService {
  /**
   * 获取进度分解详情
   */
  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    const response = await apiClient.get<ProgressBreakdown>(
      `/api/v1/goals/${goalUuid}/progress-breakdown`
    );
    return response.data;
  }

  /**
   * 手动覆盖进度
   */
  async overrideProgress(params: {
    goalUuid: string;
    manualProgress: number;
    reason: string;
    autoRestore: boolean;
  }): Promise<GoalClientDTO> {
    const response = await apiClient.post<GoalClientDTO>(
      `/api/v1/goals/${params.goalUuid}/progress-override`,
      {
        manualProgress: params.manualProgress,
        reason: params.reason,
        autoRestore: params.autoRestore
      }
    );
    return response.data;
  }

  /**
   * 恢复自动计算
   */
  async restoreAutoProgress(goalUuid: string): Promise<GoalClientDTO> {
    const response = await apiClient.delete<GoalClientDTO>(
      `/api/v1/goals/${goalUuid}/progress-override`
    );
    return response.data;
  }
}
```

**React Query Hooks** (`packages/domain-client/src/modules/goal/hooks/useProgressBreakdown.ts`):

```typescript
export function useProgressBreakdown(goalUuid: string) {
  const service = new GoalProgressService();
  
  return useQuery({
    queryKey: ['goal-progress-breakdown', goalUuid],
    queryFn: () => service.getProgressBreakdown(goalUuid),
    staleTime: 5 * 60 * 1000, // 5 分钟
    enabled: !!goalUuid
  });
}

export function useOverrideProgress() {
  const queryClient = useQueryClient();
  const service = new GoalProgressService();

  return useMutation({
    mutationFn: (params: OverrideProgressParams) => 
      service.overrideProgress(params),
    onMutate: async (params) => {
      // Optimistic Update
      await queryClient.cancelQueries(['goal', params.goalUuid]);
      
      const previousGoal = queryClient.getQueryData(['goal', params.goalUuid]);
      
      queryClient.setQueryData(['goal', params.goalUuid], (old: any) => ({
        ...old,
        progress: params.manualProgress,
        progressOverride: {
          isOverridden: true,
          manualProgress: params.manualProgress,
          overrideReason: params.reason
        }
      }));

      return { previousGoal };
    },
    onError: (err, params, context) => {
      // 回滚
      queryClient.setQueryData(['goal', params.goalUuid], context.previousGoal);
    },
    onSuccess: (data, params) => {
      // 更新缓存
      queryClient.invalidateQueries(['goal', params.goalUuid]);
      queryClient.invalidateQueries(['goal-progress-breakdown', params.goalUuid]);
    }
  });
}
```

#### Dependencies
- Story 004 (API Endpoints)

#### Testing Strategy
- **Unit Tests**: Mock API 响应测试 Hooks
- **Integration Tests**: 真实 API 调用测试

---

### Story 006: UI Components - 进度分解面板

**Story ID**: GOAL-004-S006  
**Story Points**: 3 SP  
**优先级**: P0  
**预估时间**: 1-1.5 天

#### User Story

```gherkin
As a 用户
I want 查看目标进度的计算详情
So that 我可以理解进度是如何得出的
```

#### Acceptance Criteria

```gherkin
Scenario: 显示进度分解面板
  Given 目标进度为 76%
  When 用户点击进度旁的"查看详情"图标
  Then 应显示进度分解弹窗
  And 弹窗应包含：
    | 区域           | 内容                          |
    | 标题           | "进度计算详情"                |
    | 总进度         | 76% （大号显示）               |
    | 计算模式       | 加权平均                      |
    | KR 贡献列表    | 3 个 KR 的进度/权重/贡献度     |
    | 计算公式       | (80%×50% + 70%×30% + 80%×20%) / 100% = 76% |
    | 最后更新时间   | 2025-10-21 14:30              |

Scenario: KR 贡献度可视化
  Given 进度分解面板已打开
  When 用户查看 KR 贡献列表
  Then 每个 KR 应显示进度条
  And 进度条长度应反映贡献度占比
  And 贡献度最高的 KR 应高亮显示
```

#### Technical Details

**Component** (`packages/ui/src/components/goal/ProgressBreakdownPanel.vue`):

```vue
<template>
  <el-dialog
    v-model="visible"
    title="进度计算详情"
    width="600px"
  >
    <div v-if="breakdown" class="progress-breakdown">
      <!-- 总进度 -->
      <div class="total-progress">
        <div class="progress-value">{{ breakdown.totalProgress }}%</div>
        <div class="progress-mode">
          计算模式: {{ getModeLabel(breakdown.calculationMode) }}
        </div>
      </div>

      <!-- KR 贡献列表 -->
      <div class="kr-contributions">
        <h4>各 KR 贡献度</h4>
        <div
          v-for="kr in breakdown.krContributions"
          :key="kr.keyResultUuid"
          class="kr-item"
          :class="{ 'is-highest': isHighestContribution(kr) }"
        >
          <div class="kr-info">
            <span class="kr-name">{{ kr.keyResultName }}</span>
            <span class="kr-weight">权重 {{ kr.weight }}%</span>
          </div>
          
          <div class="kr-progress">
            <el-progress
              :percentage="kr.progress"
              :stroke-width="12"
              :color="getProgressColor(kr.contribution)"
            />
            <span class="contribution">贡献 {{ kr.contribution }}%</span>
          </div>
        </div>
      </div>

      <!-- 计算公式 -->
      <div class="calculation-formula">
        <h4>计算公式</h4>
        <code>{{ breakdown.calculationFormula }}</code>
      </div>

      <!-- 元数据 -->
      <div class="metadata">
        <span>最后更新: {{ formatTime(breakdown.updatedAt) }}</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useProgressBreakdown } from '@domain-client/goal';

const props = defineProps<{ goalUuid: string }>();
const visible = defineModel<boolean>('visible', { default: false });

const { data: breakdown, isLoading } = useProgressBreakdown(
  () => props.goalUuid,
  { enabled: visible }
);

const isHighestContribution = (kr: any) => {
  if (!breakdown.value) return false;
  const maxContribution = Math.max(
    ...breakdown.value.krContributions.map(k => k.contribution)
  );
  return kr.contribution === maxContribution;
};

const getModeLabel = (mode: string) => {
  const labels = {
    weighted_average: '加权平均',
    min_value: '最小值',
    threshold: '阈值模式'
  };
  return labels[mode] || mode;
};
</script>

<style scoped>
.progress-breakdown {
  .total-progress {
    text-align: center;
    padding: 20px 0;
    border-bottom: 1px solid #eee;
    
    .progress-value {
      font-size: 48px;
      font-weight: bold;
      color: #409eff;
    }
  }

  .kr-contributions {
    margin-top: 20px;
    
    .kr-item {
      padding: 12px;
      margin-bottom: 12px;
      border-radius: 4px;
      background: #f5f7fa;
      
      &.is-highest {
        background: #e6f7ff;
        border: 1px solid #91d5ff;
      }
    }
  }

  .calculation-formula {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    
    code {
      display: block;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }
  }
}
</style>
```

#### Dependencies
- Story 005 (Client Services)

#### Testing Strategy
- **Component Tests**: 渲染各种进度数据
- **E2E Tests**: 用户交互流程测试

---

### Story 007: E2E Tests - 完整流程测试

**Story ID**: GOAL-004-S007  
**Story Points**: 2 SP  
**优先级**: P0  
**预估时间**: 0.5-1 天

#### User Story

```gherkin
As a QA 工程师
I want 编写端到端测试覆盖进度计算流程
So that 系统在生产环境可靠运行
```

#### Acceptance Criteria

```gherkin
Scenario: 完整流程测试
  Given 用户已创建目标和 3 个 KR
  When 测试执行以下步骤：
    1. 更新 KR1 进度
    2. 验证目标进度自动更新
    3. 打开进度分解面板
    4. 验证 KR 贡献度正确
    5. 调整 KR2 权重
    6. 验证进度重新计算
  Then 所有步骤应成功
  And 数据应一致

Scenario: 手动覆盖流程测试
  Given 目标进度为 76%
  When 用户手动覆盖为 80%
  Then UI 应显示覆盖标记
  When 用户恢复自动计算
  Then 进度应恢复为 76%
```

#### Technical Details

**E2E Test** (`apps/web/e2e/goal-progress.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('目标进度自动计算', () => {
  test('更新 KR 进度触发目标进度重算', async ({ page }) => {
    // Setup
    await page.goto('/goals');
    await page.click('[data-testid="create-goal"]');
    await page.fill('[data-testid="goal-name"]', '测试目标');
    await page.click('[data-testid="save-goal"]');
    
    // 添加 3 个 KR
    await page.click('[data-testid="add-kr"]');
    await page.fill('[data-testid="kr-name"]', 'KR1');
    await page.fill('[data-testid="kr-weight"]', '50');
    await page.fill('[data-testid="kr-progress"]', '60');
    await page.click('[data-testid="save-kr"]');
    
    // 验证初始进度
    const initialProgress = await page.textContent('[data-testid="goal-progress"]');
    expect(initialProgress).toContain('66%');
    
    // 更新 KR1 进度
    await page.click('[data-testid="edit-kr-1"]');
    await page.fill('[data-testid="kr-progress"]', '80');
    await page.click('[data-testid="save-kr"]');
    
    // 验证进度自动更新
    await page.waitForSelector('[data-testid="goal-progress"]');
    const newProgress = await page.textContent('[data-testid="goal-progress"]');
    expect(newProgress).toContain('76%');
    
    // 验证进度分解
    await page.click('[data-testid="view-progress-breakdown"]');
    await expect(page.locator('[data-testid="kr-1-contribution"]')).toContainText('40%');
  });

  test('手动覆盖进度流程', async ({ page }) => {
    await page.goto('/goals/test-goal-uuid');
    
    // 点击手动设置进度
    await page.click('[data-testid="override-progress"]');
    await page.fill('[data-testid="manual-progress"]', '80');
    await page.fill('[data-testid="override-reason"]', '测试覆盖');
    await page.click('[data-testid="confirm-override"]');
    
    // 验证覆盖标记
    await expect(page.locator('[data-testid="progress-override-badge"]')).toBeVisible();
    
    // 恢复自动计算
    await page.click('[data-testid="restore-auto-progress"]');
    await expect(page.locator('[data-testid="progress-override-badge"]')).not.toBeVisible();
  });
});
```

#### Dependencies
- Story 006 (UI Components)

#### Testing Strategy
- **Playwright Tests**: 覆盖所有用户场景
- **Visual Tests**: 截图对比验证 UI

---

## 3. 技术依赖

### 外部依赖
- Prisma (数据库操作)
- TypeScript (类型系统)
- Vue 3 / Element Plus (UI 组件)
- React Query (状态管理)

### 内部依赖
- Goal Contracts (数据结构定义)
- KeyResult Entity (KR 数据)
- Event Bus (事件驱动)

---

## 4. Definition of Done

- [ ] 所有 7 个 User Stories 开发完成
- [ ] Unit Tests 覆盖率 ≥ 80%
- [ ] Integration Tests 通过
- [ ] E2E Tests 通过
- [ ] API 文档已更新
- [ ] Code Review 通过
- [ ] 无 Critical/High 优先级 Bug
- [ ] 性能测试通过（P95 < 100ms）
- [ ] 用户验收测试通过

---

## 5. Release Plan

### Sprint 3 (Week 5-6)

**Week 1**:
- Day 1-2: Story 001 (Contracts & Domain)
- Day 3-4: Story 002 (Application Service)
- Day 5: Story 003 (Infrastructure)

**Week 2**:
- Day 1-2: Story 004 (API) + Story 005 (Client)
- Day 3-4: Story 006 (UI Components)
- Day 5: Story 007 (E2E Tests) + Bug Fixes

---

## 6. 验收标准总结

```gherkin
Feature: 目标进度自动计算
  作为用户，我希望系统自动计算目标进度

  Scenario: 核心流程验收
    Given 用户创建目标"2025 Q4 产品创新"
    And 添加 3 个 KR：
      | KR   | progress | weight |
      | KR1  | 60%      | 50%    |
      | KR2  | 70%      | 30%    |
      | KR3  | 80%      | 20%    |
    When 系统自动计算进度
    Then 目标进度应为 66%
    When 用户将 KR1 进度更新为 80%
    Then 目标进度应自动更新为 76%
    When 用户打开进度分解面板
    Then 应显示各 KR 贡献度
    And 计算公式应为："(80%×50% + 70%×30% + 80%×20%) / 100% = 76%"
```

---

**Epic 状态**: Ready for Development  
**下一步**: Sprint Planning → 开始开发

---

*文档创建: 2025-10-21*  
*Epic Owner: PM Agent*
