# Sprint 6 执行计划

> **Sprint ID**: Sprint 6  
> **Sprint 周期**: 2025-11-05 ~ 2025-11-18 (2 weeks)  
> **Sprint 目标**: 完成 Sprint 5 遗留 + 实现 KR 权重快照历史功能  
> **Total Story Points**: 22 SP  
> **Primary Epic**: EPIC-GOAL-002 (KR Weight Snapshot - 18 SP)  
> **Secondary Tasks**: Sprint 5 收尾 (4 SP)  
> **状态**: Planning  
> **前置条件**: Sprint 5 代码完成（~85%），数据库恢复可用

---

## 📋 Sprint 6 概览

### Sprint 主题: **目标权重历史追踪 + 系统质量提升**

Sprint 6 采用**混合策略**，既完成 Sprint 5 的技术收尾（数据库迁移、测试补充），又启动新功能开发（KR 权重快照历史），确保技术债务不累积的同时保持功能迭代节奏。

**为什么选择 EPIC-GOAL-002？**

| Epic | RICE Score | Priority | 理由 |
|------|------------|----------|------|
| **EPIC-GOAL-002** | **672 (最高)** | **P0** | ✅ 业务价值最高<br>✅ Stories 已完整定义<br>✅ 技术风险低（复用 Goal 模块） |
| EPIC-TASK-001 | 567 | P0 | ⚠️ 复杂度高（DAG 算法）<br>⚠️ 需要 2.5 周 |
| EPIC-TASK-002 | 576 | P0 | 可作为 Sprint 7 候选 |
| EPIC-GOAL-003 | 432 | P0 | 可作为 Sprint 7 候选 |

**业务价值**:
- 📊 **追踪权重变更历史**: 每次 KR 权重调整都生成快照，支持历史对比
- 🔍 **趋势分析**: 可视化权重变化趋势，识别不合理的频繁调整
- ⏮️ **历史恢复**: 支持恢复到任意历史权重配置
- 📈 **审计追溯**: 满足 OKR 管理的审计需求

---

## 🎯 Sprint 6 目标 (Sprint Goal)

> **完成日程冲突检测系统的数据库集成，并实现 KR 权重快照历史追踪功能，确保目标管理的数据完整性和可追溯性。**

### Week 1 焦点: Sprint 5 收尾 + EPIC-GOAL-002 基础层

- ✅ 完成 Sprint 5 数据库迁移（Story 9.3）
- ✅ 完成关键单元测试
- ✅ 实现 EPIC-GOAL-002 的 Contracts、Domain、Application 层

### Week 2 焦点: EPIC-GOAL-002 完整实现

- ✅ 实现 Infrastructure、API、Client、UI 层
- ✅ E2E 测试验证
- ✅ 集成到现有 Goal 管理界面

---

## 📦 Story 分解与优先级

### **Part A: Sprint 5 收尾工作 (4 SP) - Week 1**

#### ✅ Task A.1: 数据库迁移与验证 (2 SP) - P0

**描述**: 完成 Sprint 5 Story 9.3 的数据库操作

**任务清单**:
- [ ] 确认 Neon 数据库可用（用户手动恢复）
- [ ] 运行 Prisma 迁移: `pnpm prisma migrate dev --name add-schedule-model`
- [ ] 运行 Prisma 生成: `pnpm prisma generate`
- [ ] 验证 `PrismaScheduleRepository` 类型正确
- [ ] 手动测试基础 CRUD 操作

**验收标准**:
```gherkin
Scenario: Prisma 迁移成功
  Given Neon 数据库已恢复连接
  When 运行 prisma migrate dev
  Then Schedule 表成功创建
  And 索引 (userId, startTime, endTime) 已创建
  And 无 TypeScript 类型错误

Scenario: Repository 集成测试
  Given Prisma 客户端已生成
  When 调用 scheduleRepository.save(schedule)
  Then 数据成功写入数据库
  And 可以通过 findConflicts() 查询
```

**预估时间**: 0.5 天（假设数据库可用）

---

#### ✅ Task A.2: 单元测试补充 (2 SP) - P1

**描述**: 完成 Sprint 5 遗留的关键单元测试

**任务清单**:
- [ ] 修正 `scheduleApiClient.spec.ts` 类型错误（20 分钟）
  - 修正导入路径: `@/shared/api/instances`
  - 修正类型名: `ScheduleClientDTO`
  - 修正属性名: `resolution`, `applied`
- [ ] 运行并验证 API Client 测试通过
- [ ] 编写 `useSchedule.spec.ts` composable 测试（3-5 个核心测试）
- [ ] 可选: `PrismaScheduleRepository` 集成测试（如时间允许）

**验收标准**:
```gherkin
Scenario: API Client 测试通过
  Given 类型错误已修正
  When 运行 vitest scheduleApiClient.spec.ts
  Then 所有测试通过（预计 15-20 个测试）
  And 覆盖 detectConflicts, createSchedule, resolveConflict

Scenario: Composable 测试通过
  Given useSchedule composable 已实现
  When 运行 vitest useSchedule.spec.ts
  Then 核心功能测试通过
  And 覆盖 conflict detection state, API integration
```

**预估时间**: 1 天

**优先级说明**: 标记为 P1，如 Week 1 时间紧张可推迟到 Week 2 或 Sprint 7

---

### **Part B: EPIC-GOAL-002 实现 (18 SP) - Week 1 & 2**

#### Story GOAL-002-001: Contracts & Domain (3 SP) - P0 - **Week 1 Day 2**

**User Story**:
```gherkin
As a 开发者
I want 定义权重快照的 Contracts 和 Domain 实体
So that 前后端有统一的数据结构
```

**任务清单**:
- [ ] 创建 `KeyResultWeightSnapshotServerDTO` (Contracts)
  ```typescript
  export interface KeyResultWeightSnapshotServerDTO {
    uuid: string;
    goalUuid: string;
    keyResultUuid: string;
    oldWeight: number; // 调整前权重 (0-100)
    newWeight: number; // 调整后权重 (0-100)
    weightDelta: number; // 自动计算: newWeight - oldWeight
    snapshotTime: number; // timestamp
    trigger: 'manual' | 'auto_balance' | 'kr_delete' | 'system';
    operatorUuid?: string; // 操作人（如果是手动）
    reason?: string; // 调整原因（可选）
    createdAt: number;
  }
  ```

- [ ] 创建 Domain 值对象 `WeightSnapshot`
  ```typescript
  export class WeightSnapshot extends ValueObject {
    constructor(
      public readonly keyResultUuid: string,
      public readonly oldWeight: number,
      public readonly newWeight: number,
      public readonly snapshotTime: number,
      public readonly trigger: string,
      public readonly operatorUuid?: string,
      public readonly reason?: string
    ) {
      super();
      this.validate();
    }

    private validate(): void {
      if (this.oldWeight < 0 || this.oldWeight > 100) {
        throw new InvalidWeightError('旧权重必须在 0-100 之间');
      }
      if (this.newWeight < 0 || this.newWeight > 100) {
        throw new InvalidWeightError('新权重必须在 0-100 之间');
      }
    }

    get weightDelta(): number {
      return this.newWeight - this.oldWeight;
    }
  }
  ```

- [ ] 扩展 `Goal` 聚合根
  ```typescript
  export class Goal extends AggregateRoot {
    private weightSnapshots: WeightSnapshot[] = [];

    /**
     * 记录权重快照
     */
    recordWeightSnapshot(
      krUuid: string,
      oldWeight: number,
      newWeight: number,
      trigger: string,
      operatorUuid?: string,
      reason?: string
    ): void {
      const snapshot = new WeightSnapshot(
        krUuid,
        oldWeight,
        newWeight,
        Date.now(),
        trigger,
        operatorUuid,
        reason
      );

      this.weightSnapshots.push(snapshot);
      this.addDomainEvent(new WeightSnapshotCreatedEvent(this.uuid, snapshot));
    }
  }
  ```

- [ ] 编写单元测试（覆盖率 ≥ 80%）

**验收标准**:
```gherkin
Scenario: DTO 结构完整
  Given KeyResultWeightSnapshotServerDTO 已定义
  Then 应包含所有必需字段
  And weightDelta 自动计算
  And trigger 支持 4 种类型

Scenario: Domain 验证逻辑
  Given WeightSnapshot 值对象
  When oldWeight = -10
  Then 抛出 InvalidWeightError
  And 错误消息为 "旧权重必须在 0-100 之间"
```

**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

---

#### Story GOAL-002-002: Application Service (3 SP) - P0 - **Week 1 Day 3**

**User Story**:
```gherkin
As a 后端开发者
I want 在 KR 权重更新时自动创建快照
So that 每次权重变更都被记录
```

**任务清单**:
- [ ] 创建 `WeightSnapshotApplicationService`
- [ ] 实现 `createSnapshot()` 方法
- [ ] 在 `UpdateKeyResultService` 中集成快照创建
- [ ] 实现权重总和校验（确保 = 100%）
- [ ] 实现事务管理（原子性）
- [ ] 编写集成测试

**核心代码**:
```typescript
export class WeightSnapshotApplicationService {
  constructor(
    private goalRepository: GoalRepository,
    private weightSnapshotRepository: WeightSnapshotRepository
  ) {}

  async createSnapshot(params: {
    goalUuid: string;
    krUuid: string;
    oldWeight: number;
    newWeight: number;
    trigger: string;
    operatorUuid?: string;
    reason?: string;
  }): Promise<void> {
    // 1. 获取 Goal 聚合根
    const goal = await this.goalRepository.findByUuid(params.goalUuid);
    if (!goal) throw new GoalNotFoundError();

    // 2. 调用 Domain 方法记录快照
    goal.recordWeightSnapshot(
      params.krUuid,
      params.oldWeight,
      params.newWeight,
      params.trigger,
      params.operatorUuid,
      params.reason
    );

    // 3. 持久化（通过 Domain Event 或直接保存）
    await this.goalRepository.save(goal);
  }

  /**
   * 更新 KR 权重（集成快照创建）
   */
  async updateKeyResultWeight(params: {
    goalUuid: string;
    krUuid: string;
    newWeight: number;
    operatorUuid: string;
    reason?: string;
  }): Promise<void> {
    const goal = await this.goalRepository.findByUuid(params.goalUuid);
    const kr = goal.getKeyResult(params.krUuid);
    const oldWeight = kr.weight;

    // 校验权重总和
    this.validateWeightSum(goal, params.krUuid, params.newWeight);

    // 开始事务
    await this.goalRepository.transaction(async () => {
      // 1. 创建快照
      await this.createSnapshot({
        goalUuid: params.goalUuid,
        krUuid: params.krUuid,
        oldWeight,
        newWeight: params.newWeight,
        trigger: 'manual',
        operatorUuid: params.operatorUuid,
        reason: params.reason
      });

      // 2. 更新权重
      kr.updateWeight(params.newWeight);
      await this.goalRepository.save(goal);
    });
  }

  private validateWeightSum(goal: Goal, krUuid: string, newWeight: number): void {
    const otherKRsWeightSum = goal.keyResults
      .filter(kr => kr.uuid !== krUuid)
      .reduce((sum, kr) => sum + kr.weight, 0);

    if (otherKRsWeightSum + newWeight !== 100) {
      throw new InvalidWeightDistributionError(
        `权重总和必须为 100%，当前为 ${otherKRsWeightSum + newWeight}%`
      );
    }
  }
}
```

**验收标准**:
```gherkin
Scenario: 权重更新时自动创建快照
  Given 目标有 KR1 权重为 30%
  When 调用 updateKeyResultWeight(kr1, 50%)
  Then 先创建快照 (oldWeight=30, newWeight=50)
  And 再更新 KR 权重为 50%
  And 如果快照失败，权重更新回滚

Scenario: 权重总和校验
  Given 目标有 3 个 KR (30%, 40%, 30%)
  When 尝试将 KR1 改为 80% (总和 > 100%)
  Then 抛出 InvalidWeightDistributionError
  And 不创建快照
```

**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

---

#### Story GOAL-002-003: Infrastructure & Repository (2 SP) - P0 - **Week 1 Day 4**

**User Story**:
```gherkin
As a 后端开发者
I want 实现权重快照的数据库操作
So that 快照数据可持久化存储和查询
```

**任务清单**:
- [ ] 创建 Prisma Schema
  ```prisma
  model KeyResultWeightSnapshot {
    uuid           String   @id @default(uuid())
    goalUuid       String   @map("goal_uuid")
    keyResultUuid  String   @map("key_result_uuid")
    
    oldWeight      Float    @map("old_weight")
    newWeight      Float    @map("new_weight")
    weightDelta    Float    @map("weight_delta")
    
    snapshotTime   DateTime @map("snapshot_time")
    trigger        String   // 'manual' | 'auto_balance' | 'kr_delete' | 'system'
    operatorUuid   String?  @map("operator_uuid")
    reason         String?
    
    createdAt      DateTime @default(now()) @map("created_at")
    
    goal          Goal       @relation(fields: [goalUuid], references: [uuid])
    keyResult     KeyResult  @relation(fields: [keyResultUuid], references: [uuid])
    
    @@index([goalUuid, snapshotTime(sort: Desc)])
    @@index([keyResultUuid, snapshotTime(sort: Desc)])
    @@map("key_result_weight_snapshots")
  }
  ```

- [ ] 运行迁移: `pnpm prisma migrate dev --name add-weight-snapshot`
- [ ] 实现 `WeightSnapshotRepository`
  ```typescript
  export class PrismaWeightSnapshotRepository implements WeightSnapshotRepository {
    async save(goalUuid: string, snapshot: WeightSnapshot): Promise<void> {
      await prisma.keyResultWeightSnapshot.create({
        data: {
          uuid: uuidv4(),
          goalUuid,
          keyResultUuid: snapshot.keyResultUuid,
          oldWeight: snapshot.oldWeight,
          newWeight: snapshot.newWeight,
          weightDelta: snapshot.weightDelta,
          snapshotTime: new Date(snapshot.snapshotTime),
          trigger: snapshot.trigger,
          operatorUuid: snapshot.operatorUuid,
          reason: snapshot.reason
        }
      });
    }

    async findByGoalUuid(
      goalUuid: string,
      options?: { limit?: number; offset?: number }
    ): Promise<WeightSnapshot[]> {
      const snapshots = await prisma.keyResultWeightSnapshot.findMany({
        where: { goalUuid },
        orderBy: { snapshotTime: 'desc' },
        take: options?.limit,
        skip: options?.offset
      });

      return snapshots.map(this.toDomain);
    }
  }
  ```

- [ ] 编写 Repository 测试

**验收标准**:
```gherkin
Scenario: Schema 正确定义
  Given Prisma Schema 已更新
  Then KeyResultWeightSnapshot 模型包含所有字段
  And 索引 (goalUuid, snapshotTime DESC) 已创建

Scenario: Repository 查询
  Given 目标有 5 条快照
  When 调用 findByGoalUuid(goalUuid, {limit: 3})
  Then 返回最新 3 条快照
  And 按 snapshotTime 降序排列
```

**Story Points**: 2 SP  
**预估时间**: 0.5 天

---

#### Story GOAL-002-004: API Endpoints (3 SP) - P0 - **Week 2 Day 1**

**User Story**:
```gherkin
As a 前端开发者
I want 调用权重快照的 HTTP API
So that Web/Desktop 可查询快照历史
```

**任务清单**:
- [ ] 创建 `WeightSnapshotController`
- [ ] 实现 `GET /api/goals/:goalId/weight-snapshots` (查询目标快照)
- [ ] 实现 `GET /api/goals/:goalId/key-results/:krId/snapshots` (查询单个 KR 快照)
- [ ] 支持查询参数: `limit`, `offset`, `startTime`, `endTime`, `trigger`
- [ ] 添加 Zod 验证
- [ ] 添加权限检查（用户必须是目标成员）
- [ ] 编写 API 测试
- [ ] 更新 Swagger 文档

**核心代码**:
```typescript
@Controller('/api/goals/:goalId/weight-snapshots')
export class WeightSnapshotController {
  @Get('/')
  async getGoalSnapshots(
    @Param('goalId') goalId: string,
    @Query() query: GetSnapshotsQuerySchema
  ): Promise<KeyResultWeightSnapshotServerDTO[]> {
    // 权限检查
    await this.checkGoalAccess(goalId, req.user.uuid);

    const snapshots = await this.weightSnapshotService.getGoalSnapshots(
      goalId,
      {
        limit: query.limit,
        offset: query.offset,
        startTime: query.startTime,
        endTime: query.endTime,
        trigger: query.trigger
      }
    );

    return snapshots.map(this.toDTO);
  }

  @Get('/key-results/:krId')
  async getKeyResultSnapshots(
    @Param('goalId') goalId: string,
    @Param('krId') krId: string,
    @Query() query: GetSnapshotsQuerySchema
  ): Promise<KeyResultWeightSnapshotServerDTO[]> {
    await this.checkGoalAccess(goalId, req.user.uuid);

    const snapshots = await this.weightSnapshotService.getKeyResultSnapshots(
      krId,
      query
    );

    return snapshots.map(this.toDTO);
  }
}

// Zod Schema
const GetSnapshotsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  startTime: z.coerce.number().optional(),
  endTime: z.coerce.number().optional(),
  trigger: z.enum(['manual', 'auto_balance', 'kr_delete', 'system']).optional()
});
```

**验收标准**:
```gherkin
Scenario: GET 目标快照
  Given 用户是目标成员
  And 目标有 10 条快照
  When GET /api/goals/:id/weight-snapshots?limit=5
  Then 返回 200
  And 响应包含 5 条快照
  And 按 snapshotTime 降序

Scenario: 筛选快照
  When GET /api/goals/:id/weight-snapshots?trigger=manual&startTime=xxx
  Then 返回仅手动调整的快照
  And 时间 >= startTime

Scenario: 权限检查
  Given 用户不是目标成员
  When 发送任何请求
  Then 返回 403
```

**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

---

#### Story GOAL-002-005: Client Services (2 SP) - P0 - **Week 2 Day 2**

**User Story**:
```gherkin
As a 前端开发者
I want 封装权重快照的 HTTP 调用
So that UI 组件可方便获取快照数据
```

**任务清单**:
- [ ] 创建 `WeightSnapshotClientService`
- [ ] 实现 `getGoalSnapshots()` 方法
- [ ] 实现 `getKeyResultSnapshots()` 方法
- [ ] 实现 `compareSnapshots()` 方法（对比分析）
- [ ] 集成 Vue composable（如需要）
- [ ] 添加错误处理
- [ ] 编写客户端测试

**核心代码**:
```typescript
// apps/web/src/modules/goal/infrastructure/api/weightSnapshotApiClient.ts
export const weightSnapshotApiClient = {
  /**
   * 获取目标的权重快照历史
   */
  async getGoalSnapshots(
    goalUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      startTime?: number;
      endTime?: number;
      trigger?: string;
    }
  ): Promise<KeyResultWeightSnapshotClientDTO[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));
    if (options?.startTime) params.append('startTime', String(options.startTime));
    if (options?.endTime) params.append('endTime', String(options.endTime));
    if (options?.trigger) params.append('trigger', options.trigger);

    const response = await apiClient.get(
      `/api/goals/${goalUuid}/weight-snapshots?${params}`
    );

    return response.data;
  },

  /**
   * 获取单个 KR 的快照历史
   */
  async getKeyResultSnapshots(
    goalUuid: string,
    krUuid: string,
    options?: { limit?: number; offset?: number }
  ): Promise<KeyResultWeightSnapshotClientDTO[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await apiClient.get(
      `/api/goals/${goalUuid}/key-results/${krUuid}/snapshots?${params}`
    );

    return response.data;
  },

  /**
   * 对比两个时间点的权重配置
   */
  async compareSnapshots(
    goalUuid: string,
    time1: number,
    time2: number
  ): Promise<{
    time1Snapshots: KeyResultWeightSnapshotClientDTO[];
    time2Snapshots: KeyResultWeightSnapshotClientDTO[];
    changes: {
      krUuid: string;
      krTitle: string;
      oldWeight: number;
      newWeight: number;
      delta: number;
    }[];
  }> {
    // 获取两个时间点的快照
    const snapshots1 = await this.getGoalSnapshots(goalUuid, {
      startTime: time1 - 1000,
      endTime: time1 + 1000,
      limit: 100
    });

    const snapshots2 = await this.getGoalSnapshots(goalUuid, {
      startTime: time2 - 1000,
      endTime: time2 + 1000,
      limit: 100
    });

    // 计算变化
    const changes = this.calculateWeightChanges(snapshots1, snapshots2);

    return {
      time1Snapshots: snapshots1,
      time2Snapshots: snapshots2,
      changes
    };
  }
};

// Vue Composable (可选)
export function useWeightSnapshot(goalUuid: Ref<string>) {
  const snapshots = ref<KeyResultWeightSnapshotClientDTO[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const loadSnapshots = async (options?: { limit?: number }) => {
    loading.value = true;
    error.value = null;

    try {
      snapshots.value = await weightSnapshotApiClient.getGoalSnapshots(
        goalUuid.value,
        options
      );
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  return {
    snapshots,
    loading,
    error,
    loadSnapshots
  };
}
```

**验收标准**:
```gherkin
Scenario: 获取目标快照
  Given 用户已登录
  When 调用 getGoalSnapshots(goalUuid, {limit: 10})
  Then 发送 GET 请求到 API
  And 返回 KeyResultWeightSnapshotClientDTO[]

Scenario: 对比快照
  When 调用 compareSnapshots(goalUuid, time1, time2)
  Then 返回两个时间点的快照
  And 返回 changes 数组显示权重变化
```

**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

---

#### Story GOAL-002-006: UI Component - 历史列表 (3 SP) - P0 - **Week 2 Day 3**

**User Story**:
```gherkin
As a 用户
I want 查看目标的权重调整历史
So that 我能追溯每次权重变更
```

**任务清单**:
- [ ] 创建 `WeightSnapshotHistory.vue` 组件
- [ ] 显示快照列表（时间、触发方式、权重变化）
- [ ] 支持筛选（按触发方式、时间范围）
- [ ] 支持分页加载
- [ ] 颜色编码权重变化（增加/减少）
- [ ] 支持展开查看详情
- [ ] 响应式设计

**UI 设计**:
```vue
<template>
  <v-card>
    <v-card-title>
      <v-icon>mdi-history</v-icon>
      权重调整历史
    </v-card-title>

    <!-- 筛选器 -->
    <v-card-text>
      <v-row>
        <v-col cols="4">
          <v-select
            v-model="filter.trigger"
            :items="triggerOptions"
            label="触发方式"
            clearable
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="filter.startDate"
            type="date"
            label="开始日期"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="filter.endDate"
            type="date"
            label="结束日期"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 快照列表 -->
    <v-list>
      <v-list-item
        v-for="snapshot in snapshots"
        :key="snapshot.uuid"
        @click="toggleExpand(snapshot.uuid)"
      >
        <template #prepend>
          <v-avatar :color="getChangeColor(snapshot.weightDelta)">
            <v-icon>{{ getChangeIcon(snapshot.weightDelta) }}</v-icon>
          </v-avatar>
        </template>

        <v-list-item-title>
          {{ snapshot.keyResultTitle }}
        </v-list-item-title>

        <v-list-item-subtitle>
          {{ formatTime(snapshot.snapshotTime) }} • 
          {{ getTriggerLabel(snapshot.trigger) }} •
          <span :class="getWeightChangeClass(snapshot.weightDelta)">
            {{ snapshot.oldWeight }}% → {{ snapshot.newWeight }}%
            ({{ snapshot.weightDelta > 0 ? '+' : '' }}{{ snapshot.weightDelta }}%)
          </span>
        </v-list-item-subtitle>

        <!-- 展开详情 -->
        <v-expand-transition>
          <div v-if="expandedIds.includes(snapshot.uuid)" class="mt-2">
            <v-divider class="mb-2" />
            <div class="text-caption">
              <div v-if="snapshot.operatorName">
                操作人: {{ snapshot.operatorName }}
              </div>
              <div v-if="snapshot.reason">
                原因: {{ snapshot.reason }}
              </div>
              <div>
                UUID: {{ snapshot.uuid }}
              </div>
            </div>
          </div>
        </v-expand-transition>
      </v-list-item>
    </v-list>

    <!-- 加载更多 -->
    <v-card-actions v-if="hasMore">
      <v-btn
        block
        :loading="loading"
        @click="loadMore"
      >
        加载更多
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useWeightSnapshot } from '../composables/useWeightSnapshot';

const props = defineProps<{
  goalUuid: string;
}>();

const { snapshots, loading, loadSnapshots } = useWeightSnapshot(
  computed(() => props.goalUuid)
);

const filter = ref({
  trigger: null,
  startDate: null,
  endDate: null
});

const expandedIds = ref<string[]>([]);
const page = ref(0);
const pageSize = 20;

const hasMore = computed(() => snapshots.value.length >= (page.value + 1) * pageSize);

const triggerOptions = [
  { title: '手动调整', value: 'manual' },
  { title: '自动平衡', value: 'auto_balance' },
  { title: 'KR 删除', value: 'kr_delete' },
  { title: '系统调整', value: 'system' }
];

onMounted(() => {
  loadSnapshots({ limit: pageSize });
});

const loadMore = async () => {
  page.value++;
  await loadSnapshots({
    limit: pageSize,
    offset: page.value * pageSize
  });
};

const toggleExpand = (uuid: string) => {
  const index = expandedIds.value.indexOf(uuid);
  if (index > -1) {
    expandedIds.value.splice(index, 1);
  } else {
    expandedIds.value.push(uuid);
  }
};

const getChangeColor = (delta: number) => {
  if (delta > 0) return 'success';
  if (delta < 0) return 'warning';
  return 'grey';
};

const getChangeIcon = (delta: number) => {
  if (delta > 0) return 'mdi-arrow-up';
  if (delta < 0) return 'mdi-arrow-down';
  return 'mdi-minus';
};

const getWeightChangeClass = (delta: number) => {
  if (delta > 0) return 'text-success';
  if (delta < 0) return 'text-warning';
  return '';
};

const getTriggerLabel = (trigger: string) => {
  const labels = {
    manual: '手动调整',
    auto_balance: '自动平衡',
    kr_delete: 'KR 删除',
    system: '系统调整'
  };
  return labels[trigger] || trigger;
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};
</script>
```

**验收标准**:
```gherkin
Scenario: 显示快照历史
  Given 目标有 15 条权重快照
  When 用户打开权重历史
  Then 显示最新 20 条快照
  And 按时间降序排列
  And 每条快照显示: 时间、KR 名称、权重变化、触发方式

Scenario: 筛选快照
  When 用户选择触发方式为 "手动调整"
  Then 仅显示手动触发的快照

Scenario: 加载更多
  When 用户点击 "加载更多"
  Then 加载下一页快照
  And 追加到列表末尾
```

**Story Points**: 3 SP  
**预估时间**: 1-1.5 天

---

#### Story GOAL-002-007: UI - 权重对比视图 (2 SP) - P1 - **Week 2 Day 4**

**User Story**:
```gherkin
As a 用户
I want 对比两个时间点的权重配置
So that 我能分析权重调整的影响
```

**任务清单**:
- [ ] 创建 `WeightComparison.vue` 组件
- [ ] 时间选择器（选择两个对比时间点）
- [ ] 并排显示权重配置
- [ ] 高亮显示变化的 KR
- [ ] 可视化权重变化（条形图/饼图）
- [ ] 支持导出对比报告

**UI 设计**: 左右分栏显示，中间用箭头连接变化

**验收标准**:
```gherkin
Scenario: 对比权重配置
  Given 用户选择了两个时间点
  When 点击 "对比"
  Then 左侧显示时间点 1 的权重配置
  And 右侧显示时间点 2 的权重配置
  And 变化的 KR 用颜色高亮
  And 显示权重变化百分比
```

**Story Points**: 2 SP  
**预估时间**: 0.5-1 天

---

### 📊 Sprint 6 Story Points 汇总

| Category | Stories | Story Points | Week |
|----------|---------|--------------|------|
| **Sprint 5 收尾** | 2 tasks | 4 SP | Week 1 |
| **EPIC-GOAL-002 基础层** | Stories 001-003 | 8 SP | Week 1 |
| **EPIC-GOAL-002 应用层** | Stories 004-007 | 10 SP | Week 2 |
| **Total** | **9 items** | **22 SP** | **2 weeks** |

---

## 📅 Sprint 6 时间表

### **Week 1 (2025-11-05 ~ 2025-11-08): 收尾 + 基础层**

| Day | Date | Focus | SP | Deliverables |
|-----|------|-------|----|--------------||
| **Mon** | 11-05 | Sprint 5 数据库迁移 | 2 | ✅ Schedule 表已创建<br>✅ Prisma 客户端已生成 |
| **Tue** | 11-06 | GOAL-002-001: Contracts & Domain | 3 | ✅ WeightSnapshot 值对象<br>✅ Goal 聚合根扩展<br>✅ 单元测试通过 |
| **Wed** | 11-07 | GOAL-002-002: Application Service | 3 | ✅ WeightSnapshotApplicationService<br>✅ 权重更新集成快照<br>✅ 事务管理 |
| **Thu** | 11-08 | GOAL-002-003: Infrastructure | 2 | ✅ Prisma Schema<br>✅ Repository 实现<br>✅ 迁移完成 |

**Week 1 Total**: 10 SP

---

### **Week 2 (2025-11-11 ~ 2025-11-15): 应用层 + UI**

| Day | Date | Focus | SP | Deliverables |
|-----|------|-------|----|--------------||
| **Mon** | 11-11 | Sprint 5 测试 + GOAL-002-004 API | 2+3 | ✅ API Client 测试修正<br>✅ WeightSnapshotController<br>✅ 2 个 REST 端点 |
| **Tue** | 11-12 | GOAL-002-005: Client Services | 2 | ✅ WeightSnapshotClientService<br>✅ useWeightSnapshot composable<br>✅ 客户端测试 |
| **Wed** | 11-13 | GOAL-002-006: UI 历史列表 | 3 | ✅ WeightSnapshotHistory 组件<br>✅ 筛选、分页功能<br>✅ 响应式设计 |
| **Thu** | 11-14 | GOAL-002-007: UI 对比视图 | 2 | ✅ WeightComparison 组件<br>✅ 可视化对比<br>✅ 导出功能 |
| **Fri** | 11-15 | E2E 测试 + Sprint Review | - | ✅ 全链路测试<br>✅ Sprint 回顾 |

**Week 2 Total**: 12 SP

---

## ✅ Definition of Done (DoD)

每个 Story 必须满足以下条件才能标记为 "Done":

### 代码质量

- [ ] 所有 TypeScript 编译无错误
- [ ] ESLint 无 error 级别警告
- [ ] 代码符合 DDD + Clean Architecture 分层原则
- [ ] 所有 public 方法有 JSDoc 注释

### 测试要求

- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 所有测试通过（`pnpm test`）
- [ ] 关键路径有集成测试

### 文档要求

- [ ] Story 文件更新状态为 "Ready for Review"
- [ ] 添加 "Dev Agent Record" 章节
- [ ] API 端点更新 Swagger 文档
- [ ] UI 组件有使用示例

### 集成要求

- [ ] 与现有模块集成无冲突
- [ ] 数据库迁移已运行
- [ ] 所有依赖项已安装

---

## 🎯 Sprint 6 成功指标

### 技术指标

| Metric | Target | Measurement |
|--------|--------|-------------|
| Story 完成率 | 100% | 9/9 stories |
| 代码覆盖率 | ≥ 80% | Vitest report |
| TypeScript Errors | 0 | `pnpm typecheck` |
| Build Success | 100% | `pnpm build` |
| API Endpoints | 2 | GET snapshots x2 |

### 功能指标

| Feature | Status | Notes |
|---------|--------|-------|
| Sprint 5 数据库迁移 | ✅ | Schedule 表可用 |
| 权重快照自动记录 | ✅ | 每次权重更新触发 |
| 快照历史查询 | ✅ | 支持筛选、分页 |
| UI 历史列表 | ✅ | WeightSnapshotHistory |
| UI 对比视图 | ✅ | WeightComparison |

### 业务指标

| Metric | Target | Value |
|--------|--------|-------|
| RICE Score | 672 | Highest priority |
| User Value | High | 审计追溯、趋势分析 |
| Technical Debt | Low | 完成 Sprint 5 遗留 |

---

## ⚠️ 风险管理

### 风险识别

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **数据库连接仍不可用** | 中 (30%) | 高 | ✅ Day 1 立即验证<br>✅ 备用方案: 使用本地 PostgreSQL |
| **权重校验逻辑复杂** | 低 (20%) | 中 | ✅ 充分的单元测试<br>✅ 边界条件测试 |
| **UI 组件设计调整** | 中 (40%) | 低 | ✅ 使用 Vuetify 现成组件<br>✅ 复用 Goal 模块样式 |
| **Week 1 进度延迟** | 中 (30%) | 中 | ✅ Story 007 可降级为 P2<br>✅ 测试补充可推迟到 Sprint 7 |

### 依赖管理

| Dependency | Status | Owner | Risk |
|------------|--------|-------|------|
| Neon 数据库可用 | ⚠️ Pending | User | High |
| Sprint 5 代码稳定 | ✅ Done | Dev Team | Low |
| Goal 模块 API | ✅ Available | Existing | Low |

---

## 🔄 Sprint 6 与 Sprint 5 的关系

### 技术连续性

Sprint 6 Week 1 完成 Sprint 5 遗留任务，确保:
- ✅ 数据库层完整（Schedule + WeightSnapshot 表）
- ✅ 单元测试覆盖充分
- ✅ 无技术债务累积

### 架构复用

EPIC-GOAL-002 复用 Sprint 5 的成熟模式:
- ✅ DDD 8 层架构
- ✅ Prisma Repository 模式
- ✅ Zod 验证 + Swagger 文档
- ✅ Vue Composable 模式

### 团队节奏

Week 1 慢启动（收尾 + 基础层），Week 2 加速（应用层 + UI），保持可持续的开发节奏。

---

## 📚 参考文档

### Epic & Stories

- [EPIC-GOAL-002: KR 权重快照](../epics/epic-goal-002-kr-weight-snapshot.md)
- [STORY-GOAL-002-001](../stories/STORY-GOAL-002-001.md) through 009
- [Sprint 5 Index](../stories/SPRINT-05-INDEX.md)

### Architecture

- [DDD 8 层架构文档](../../architecture/ddd-8-layer-architecture.md)
- [Prisma 迁移指南](../../PRISMA_GENERATION_GUIDE.md)
- [测试策略文档](../../guides/testing-strategy.md)

### Sprint History

- [Sprint 4 Index](../stories/SPRINT-04-INDEX.md) - Task Dependencies & UX (24 SP)
- [Sprint 5 Index](../stories/SPRINT-05-INDEX.md) - Schedule Conflict Detection (18 SP)

---

## 🎓 Sprint 6 经验预期

### 预期挑战

1. **权重总和校验**: 100% 约束在并发更新时的处理
2. **快照数据量**: 长期使用后的性能优化
3. **UI 交互设计**: 历史对比视图的用户体验

### 预期收益

1. **完整的审计追溯**: 所有权重变更有据可查
2. **趋势分析能力**: 识别不合理的频繁调整
3. **历史恢复功能**: 回滚到任意历史配置

---

## 📋 Sprint 6 Checklist

### Pre-Sprint 准备 (2025-11-04)

- [ ] Sprint 5 代码 merge 到 main
- [ ] 确认 Neon 数据库可用
- [ ] Review EPIC-GOAL-002 所有 Stories
- [ ] 准备开发环境（pnpm install）

### Week 1 Checklist

- [ ] Day 1: Sprint 5 数据库迁移完成
- [ ] Day 2: GOAL-002-001 完成（Contracts & Domain）
- [ ] Day 3: GOAL-002-002 完成（Application Service）
- [ ] Day 4: GOAL-002-003 完成（Infrastructure）
- [ ] Week 1 Review: 基础层测试通过

### Week 2 Checklist

- [ ] Day 1: GOAL-002-004 完成（API Endpoints）
- [ ] Day 2: GOAL-002-005 完成（Client Services）
- [ ] Day 3: GOAL-002-006 完成（UI 历史列表）
- [ ] Day 4: GOAL-002-007 完成（UI 对比视图）
- [ ] Day 5: E2E 测试 + Sprint Review

### Post-Sprint 交付

- [ ] 更新所有 Story 状态为 "Ready for Review"
- [ ] 创建 Sprint 6 总结文档
- [ ] 记录 Lessons Learned
- [ ] 规划 Sprint 7

---

## 🚀 Sprint 7 预告

基于 RICE 评分和业务优先级，Sprint 7 候选 Epics:

| Epic | RICE | Priority | Effort | Theme |
|------|------|----------|--------|-------|
| **EPIC-TASK-002** | 576 | P0 | 0.5w | 任务优先级矩阵 |
| **EPIC-TASK-001** | 567 | P0 | 2.5w | 任务依赖图（DAG） |
| **EPIC-GOAL-004** | 480 | P0 | 1.33w | 进度自动计算 |
| **EPIC-GOAL-003** | 432 | P0 | - | 专注模式 |

**建议**: Sprint 7 选择 **EPIC-TASK-002** (任务优先级矩阵)，理由:
- ✅ 高 RICE 评分 (576)
- ✅ 短周期 (0.5 周 = 3-4 天)
- ✅ 可与其他小 Epic 组合，形成完整 Sprint
- ✅ 用户高频使用场景

---

**Sprint 6 规划完成日期**: 2025-10-24  
**规划创建者**: Bob (Scrum Master)  
**审批状态**: Pending Review  
**下一步行动**: User review & approve → Start Sprint 6

---

_Sprint 6, Let's ship it! 🚀_

### Sprint 目标 (Sprint Goal)

> **实现基于 BullMQ 的多渠道通知聚合系统，完成核心功能闭环。**

**核心价值**:

- ✅ 多渠道通知聚合（应用内 + 桌面推送 + 邮件）
- ✅ BullMQ + Redis 消息队列（可靠性、重试、优先级）
- ✅ Bull Board 可视化监控面板
- ✅ 系统集成测试 + 部署准备

### Epic 背景

**NOTIFICATION-001 - 多渠道通知聚合**:

- **核心架构**: BullMQ 消息队列 + Worker 异步处理
- **技术决策**: 基于 Sprint 2b Spike 结果，采用 BullMQ (ADR-003)
- **用户场景**: 任务提醒、目标提醒、日程提醒自动分发到多个渠道

---

## 📅 每日执行计划 (Day-by-Day Plan)

### **Week 13: BullMQ 核心系统搭建**

#### **Day 1 (2026-01-12 周一): Redis + BullMQ 基础设施**

**目标**: 完成 BullMQ + Redis 环境搭建 (3 SP)

**任务清单**:

- [ ] **上午**: Redis 配置

  ```yaml
  # docker-compose.yml
  services:
    redis:
      image: redis:7-alpine
      ports:
        - '6379:6379'
      volumes:
        - ./data/redis:/data
      command: redis-server --appendonly yes --appendfsync everysec
  ```

- [ ] **下午**: BullMQ Queue 初始化

  ```typescript
  // packages/domain-server/src/infrastructure/queue/notification-queue.ts
  import { Queue, Worker, QueueEvents } from 'bullmq';
  import IORedis from 'ioredis';

  const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
  });

  export const notificationQueue = new Queue('notifications', { connection });

  export interface NotificationJobData {
    targetUuid: string;
    targetType: 'task' | 'goal' | 'schedule';
    channels: ('in_app' | 'desktop' | 'email')[];
    title: string;
    content: string;
    priority: number; // 1-5
    scheduledAt?: number; // 定时发送
  }
  ```

**交付物**: ✅ Redis + BullMQ 环境就绪

---

#### **Day 2-3 (2026-01-13 ~ 2026-01-14): Contracts + Domain + Application**

**目标**: 完成通知领域模型 + Application Service (5 SP)

**任务清单**:

- [ ] **Day 2**: Contracts + Domain

  ```typescript
  // packages/contracts/src/notification/notification.dto.ts
  export interface NotificationDTO {
    uuid: string;
    userUuid: string;
    targetUuid: string;
    targetType: 'task' | 'goal' | 'schedule';

    channel: 'in_app' | 'desktop' | 'email';
    title: string;
    content: string;

    status: 'pending' | 'sent' | 'failed';
    priority: number;

    sentAt?: number;
    failureReason?: string;

    createdAt: number;
  }

  // packages/domain-server/src/domain/notification/notification.entity.ts
  export class Notification extends AggregateRoot {
    constructor(
      uuid: string,
      public readonly userUuid: string,
      public readonly targetUuid: string,
      public readonly targetType: string,
      public readonly channel: string,
      public readonly title: string,
      public readonly content: string,
      public readonly priority: number,
      private _status: 'pending' | 'sent' | 'failed' = 'pending',
      private _sentAt?: number,
      private _failureReason?: string,
    ) {
      super();
      this.validate();
    }

    private validate(): void {
      if (this.priority < 1 || this.priority > 5) {
        throw new InvalidPriorityError('优先级必须在 1-5 之间');
      }
    }

    markAsSent(): void {
      this._status = 'sent';
      this._sentAt = Date.now();
      this.addDomainEvent(new NotificationSentEvent(this.uuid, this.channel));
    }

    markAsFailed(reason: string): void {
      this._status = 'failed';
      this._failureReason = reason;
      this.addDomainEvent(new NotificationFailedEvent(this.uuid, reason));
    }
  }
  ```

- [ ] **Day 3**: Application Service - NotificationDispatcherService

  ```typescript
  // packages/domain-server/src/application/notification/notification-dispatcher.service.ts
  import { notificationQueue } from '../../infrastructure/queue/notification-queue';

  export class NotificationDispatcherService {
    constructor(
      private notificationRepository: NotificationRepository,
      private taskRepository: TaskRepository,
    ) {}

    /**
     * 分发通知到多个渠道
     */
    async dispatch(params: {
      targetUuid: string;
      targetType: string;
      channels: string[];
      title: string;
      content: string;
      priority: number;
      scheduledAt?: number;
    }): Promise<void> {
      // 为每个渠道创建通知实体
      const notifications = params.channels.map(
        (channel) =>
          new Notification(
            uuidv4(),
            'user-uuid', // 从上下文获取
            params.targetUuid,
            params.targetType,
            channel,
            params.title,
            params.content,
            params.priority,
          ),
      );

      // 保存到数据库
      await this.notificationRepository.saveBatch(notifications);

      // 添加到 BullMQ 队列
      for (const notification of notifications) {
        await notificationQueue.add(
          'send-notification',
          {
            notificationUuid: notification.uuid,
            channel: notification.channel,
            title: notification.title,
            content: notification.content,
          },
          {
            priority: 6 - params.priority, // BullMQ: 数字越小优先级越高
            delay: params.scheduledAt ? params.scheduledAt - Date.now() : 0,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        );
      }
    }

    /**
     * 任务提醒（从 Sprint 2b Node-Cron 迁移）
     */
    async sendTaskReminder(taskUuid: string): Promise<void> {
      const task = await this.taskRepository.findByUuid(taskUuid);
      if (!task) return;

      await this.dispatch({
        targetUuid: taskUuid,
        targetType: 'task',
        channels: ['in_app', 'desktop'],
        title: '任务提醒',
        content: `任务 "${task.title}" 即将到期`,
        priority: task.importance, // 复用任务优先级
      });
    }
  }
  ```

**交付物**: ✅ 通知分发逻辑完成

---

#### **Day 4 (2026-01-15 周四): BullMQ Worker 实现**

**目标**: 完成多渠道 Worker (3 SP)

**任务清单**:

- [ ] **全天**: Worker 实现

  ```typescript
  // apps/api/src/workers/notification-worker.ts
  import { Worker, Job } from 'bullmq';
  import { notificationQueue } from '@dailyuse/domain-server';

  const worker = new Worker(
    'notifications',
    async (job: Job) => {
      const { notificationUuid, channel, title, content } = job.data;

      try {
        switch (channel) {
          case 'in_app':
            await sendInAppNotification(notificationUuid, title, content);
            break;
          case 'desktop':
            await sendDesktopNotification(notificationUuid, title, content);
            break;
          case 'email':
            await sendEmailNotification(notificationUuid, title, content);
            break;
        }

        // 标记为已发送
        const notification = await notificationRepository.findByUuid(notificationUuid);
        notification.markAsSent();
        await notificationRepository.save(notification);
      } catch (error) {
        // 标记为失败
        const notification = await notificationRepository.findByUuid(notificationUuid);
        notification.markAsFailed(error.message);
        await notificationRepository.save(notification);

        throw error; // BullMQ 会自动重试
      }
    },
    {
      connection,
      concurrency: 5, // 并发处理 5 个任务
      limiter: {
        max: 100, // 每 10 秒最多 100 个
        duration: 10000,
      },
    },
  );

  /**
   * 应用内通知（SSE）
   */
  async function sendInAppNotification(
    uuid: string,
    title: string,
    content: string,
  ): Promise<void> {
    // 通过 SSE 推送（从 Sprint 2b 复用）
    sseManager.broadcast('user-uuid', {
      type: 'notification',
      uuid,
      title,
      content,
    });
  }

  /**
   * 桌面推送（Electron）
   */
  async function sendDesktopNotification(
    uuid: string,
    title: string,
    content: string,
  ): Promise<void> {
    // 调用 Desktop 应用的 IPC
    // 由 apps/desktop 处理
  }

  /**
   * 邮件通知（Nodemailer）
   */
  async function sendEmailNotification(
    uuid: string,
    title: string,
    content: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'user-email', // 从用户配置获取
      subject: title,
      text: content,
    });
  }

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error);
  });

  export default worker;
  ```

**交付物**: ✅ BullMQ Worker 完成

---

#### **Day 5 (2026-01-16 周五): Bull Board 监控面板**

**目标**: 集成 Bull Board UI (2 SP)

**任务清单**:

- [ ] **上午**: Bull Board 配置

  ```typescript
  // apps/api/src/server.ts
  import { createBullBoard } from '@bull-board/api';
  import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
  import { ExpressAdapter } from '@bull-board/express';

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(notificationQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
  ```

- [ ] **下午**: 测试监控面板
  - 访问 `http://localhost:3000/admin/queues`
  - 查看队列状态、作业列表、重试记录

**交付物**: ✅ Bull Board 可视化面板就绪

---

### **Week 14: 系统集成 + 部署准备**

#### **Day 6-7 (2026-01-19 ~ 2026-01-20): 系统集成**

**目标**: 集成通知系统到现有模块 (2 SP)

**任务清单**:

- [ ] **Day 6**: 迁移 Sprint 2b Node-Cron 到 BullMQ
  - 任务提醒 → NotificationDispatcherService
  - 目标提醒 → NotificationDispatcherService
- [ ] **Day 7**: 集成到 Sprint 5 智能提醒
  - `SmartReminderService.sendReminder()` 调用 `NotificationDispatcherService`

**交付物**: ✅ 通知系统与所有模块集成完成

---

#### **Day 8 (2026-01-21 周三): E2E 测试**

**目标**: 全链路测试

**任务清单**:

- [ ] 创建任务 → 设置提醒 → 触发提醒 → 多渠道分发
- [ ] 测试 BullMQ 重试机制
- [ ] 测试 Bull Board 监控

**交付物**: ✅ E2E 测试通过

---

#### **Day 9 (2026-01-22 周四): 部署准备**

**目标**: 生产环境配置

**任务清单**:

- [ ] Redis 持久化配置（AOF + RDB）
- [ ] BullMQ Worker 部署策略（PM2）
- [ ] 环境变量文档
- [ ] 部署脚本

**交付物**: ✅ 部署文档完成

---

#### **Day 10 (2026-01-23 周五): Sprint Review + Retrospective**

**目标**: Sprint 6 回顾 + 整体复盘

---

## 📊 Sprint 统计

- **NOTIFICATION-001**: 15 SP (7 Stories)
- **系统集成**: 包含在各 Story 中

---

## ✅ Definition of Done

同 Sprint 3，详见 [sprint-03-plan.md](./sprint-03-plan.md)

**额外要求**:

- ✅ Bull Board 监控面板可访问
- ✅ BullMQ Worker 稳定运行
- ✅ Redis 持久化配置验证

---

## 🚨 风险管理

| 风险            | 概率 | 影响 | 缓解策略                         |
| --------------- | ---- | ---- | -------------------------------- |
| BullMQ 学习曲线 | 低   | 中   | Sprint 2b Spike 已验证           |
| Redis 单点故障  | 中   | 高   | Redis Sentinel / Cluster（后续） |
| 邮件发送限流    | 低   | 低   | 速率限制 + 队列缓冲              |

---

## 🎯 Sprint 6 里程碑意义

**✅ 第一阶段开发完成**:

- Sprint 1-6 共 182 SP
- 10 个核心 Epic 全部实现
- DDD 8 层架构完整落地

**🚀 下一阶段预告**:

- 性能优化
- 安全加固
- 可观测性提升

---

## 📚 参考文档

- [Epic: NOTIFICATION-001](../epics/epic-notification-001-multi-channel-aggregation.md)
- [ADR-003: BullMQ 技术决策](../../architecture/adr/ADR-003-bullmq-selection.md)
- [Sprint 2b: Node-Cron 实现](./sprint-02b-plan.md)
- [PM 阶段总结](../PM_PHASE_SUMMARY.md)

---

**Sprint 计划创建于**: 2025-10-21  
**前置条件**: Sprint 5 完成  
**下一步**: Production Deployment

---

_祝 Sprint 6 圆满成功！🎉_
