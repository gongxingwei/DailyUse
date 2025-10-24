# Sprint 2a 详细执行计划

> **Sprint ID**: Sprint 2a  
> **Sprint 周期**: Week 3-4 (2025-11-03 ~ 2025-11-14)  
> **Sprint 目标**: 实现 KR 权重快照功能 (GOAL-002)  
> **Story Points**: 25 SP  
> **Epic**: GOAL-002 - KR 权重快照  
> **状态**: Planning

---

## 📋 Sprint 概览

### Sprint 目标 (Sprint Goal)

> **为 Goal 模块添加 KR 权重快照功能，实现权重变更的完整历史追溯和可视化分析。**

**核心价值**:

- ✅ 用户可以查看 KR 权重的完整变更历史
- ✅ 支持权重趋势图和时间点对比分析
- ✅ 建立 Goal 模块的基础架构（为后续 Sprint 2b 铺路）
- ✅ 完成 DAG 可视化技术 Spike（为 Sprint 4 铺路）

### Epic 背景

**业务价值**: 提供 KR 权重调整的完整历史追溯能力，让目标管理更加透明和可审计。

**用户场景**:

- 目标负责人在季度中期调整 KR 权重，需记录调整原因和历史
- 季度末复盘时查看权重调整历史，分析策略变化
- 对比初始权重分配与最终权重，评估决策质量

---

## 📅 每日执行计划 (Day-by-Day Plan)

### **Week 3: 后端开发 + DAG Spike 启动**

#### **Day 1 (2025-11-03 周一): Contracts & Domain 层**

**目标**: 完成 Story-001 (3 SP)

**任务清单**:

- [ ] **09:00-09:15** Sprint 2a Kickoff 会议
  - 全员参与
  - Review Sprint 目标和 Story 列表
  - 确认技术栈和分工
  - 讨论潜在风险

- [ ] **09:30-12:00** 开发 Contracts 层 (2.5h)
  - 创建 `packages/contracts/src/goal/KeyResultWeightSnapshotServerDTO.ts`
  - 定义 DTO 结构:

    ```typescript
    export interface KeyResultWeightSnapshotServerDTO {
      uuid: string;
      goalUuid: string;
      keyResultUuid: string;
      oldWeight: number;
      newWeight: number;
      weightDelta: number;
      snapshotTime: number;
      trigger: 'manual' | 'auto' | 'restore' | 'import';
      reason?: string;
      operatorUuid: string;
      createdAt: number;
    }

    export type SnapshotTrigger = 'manual' | 'auto' | 'restore' | 'import';
    ```

  - 更新 `GoalServerDTO` 添加 `weightSnapshots?: KeyResultWeightSnapshotServerDTO[]`
  - 编写 Zod schema 验证器

- [ ] **13:00-15:00** 开发 Domain 层 (2h)
  - 创建 `packages/domain-server/src/goal/KeyResultWeightSnapshot.ts` 值对象
  - 实现 `KeyResultWeightSnapshot` 类:
    ```typescript
    export class KeyResultWeightSnapshot {
      constructor(
        public readonly uuid: string,
        public readonly goalUuid: string,
        public readonly keyResultUuid: string,
        public readonly oldWeight: number,
        public readonly newWeight: number,
        public readonly snapshotTime: number,
        public readonly trigger: SnapshotTrigger,
        public readonly operatorUuid: string,
        public readonly reason?: string,
      ) {
        this.validateWeights();
      }

      get weightDelta(): number {
        return this.newWeight - this.oldWeight;
      }

      private validateWeights(): void {
        if (this.oldWeight < 0 || this.oldWeight > 100) {
          throw new InvalidWeightError('oldWeight');
        }
        if (this.newWeight < 0 || this.newWeight > 100) {
          throw new InvalidWeightError('newWeight');
        }
      }
    }
    ```
  - 更新 `Goal` 聚合根添加 `recordWeightSnapshot()` 方法

- [ ] **15:00-17:00** 编写单元测试 (2h)
  - 测试 DTO 验证逻辑
  - 测试值对象创建和 `weightDelta` 计算
  - 测试 Goal 聚合根的快照记录方法
  - 目标覆盖率: ≥ 80%

- [ ] **17:00-17:30** Code Review & 提交
  - Self-review 代码
  - 运行 `pnpm nx test domain-server` 和 `pnpm nx test contracts`
  - 提交 PR: `feat(goal): add weight snapshot contracts and domain`

**交付物**:

- ✅ `KeyResultWeightSnapshotServerDTO` 和 Zod schema
- ✅ `KeyResultWeightSnapshot` 值对象
- ✅ `Goal.recordWeightSnapshot()` 方法
- ✅ 单元测试覆盖率 ≥ 80%

**验收标准**:

```gherkin
Scenario: DTO 和 Domain 层正确实现
  Given KeyResultWeightSnapshotServerDTO 已定义
  Then Zod 验证器可正确验证数据
  And KeyResultWeightSnapshot 可正确创建实例
  And weightDelta 自动计算正确
  And Goal 可记录快照
  And 所有测试通过
```

---

#### **Day 2 (2025-11-04 周二): Application Service**

**目标**: 完成 Story-002 (3 SP)

**任务清单**:

- [ ] **09:00-12:00** 创建 Application Service (3h)
  - 创建 `apps/api/src/application/goal/WeightSnapshotApplicationService.ts`
  - 实现核心方法:
    ```typescript
    export class WeightSnapshotApplicationService {
      constructor(
        private goalRepository: GoalRepository,
        private snapshotRepository: WeightSnapshotRepository,
      ) {}

      async createSnapshot(
        goalUuid: string,
        krUuid: string,
        oldWeight: number,
        newWeight: number,
        trigger: SnapshotTrigger,
        operatorUuid: string,
        reason?: string,
      ): Promise<KeyResultWeightSnapshot> {
        // 1. 验证 Goal 和 KR 存在
        const goal = await this.goalRepository.findByUuid(goalUuid);
        if (!goal) throw new GoalNotFoundError();

        // 2. 创建快照值对象
        const snapshot = new KeyResultWeightSnapshot(
          uuidv4(),
          goalUuid,
          krUuid,
          oldWeight,
          newWeight,
          Date.now(),
          trigger,
          operatorUuid,
          reason,
        );

        // 3. 保存快照
        await this.snapshotRepository.save(snapshot);

        return snapshot;
      }

      async validateWeightSum(goalUuid: string): Promise<boolean> {
        // 验证所有 KR 权重总和 = 100%
        const goal = await this.goalRepository.findByUuid(goalUuid);
        const totalWeight = goal.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
        return totalWeight === 100;
      }
    }
    ```

- [ ] **13:00-15:00** 集成到 UpdateKeyResult 流程 (2h)
  - 更新 `UpdateKeyResultService`:
    ```typescript
    async updateKeyResultWeight(
      krUuid: string,
      newWeight: number,
      operatorUuid: string
    ): Promise<void> {
      return this.transactionManager.runInTransaction(async () => {
        // 1. 获取当前权重
        const kr = await this.krRepository.findByUuid(krUuid);
        const oldWeight = kr.weight;

        // 2. 更新权重
        kr.updateWeight(newWeight);
        await this.krRepository.save(kr);

        // 3. 验证权重总和
        const isValid = await this.snapshotService.validateWeightSum(kr.goalUuid);
        if (!isValid) {
          throw new InvalidWeightDistributionError('总权重必须为 100%');
        }

        // 4. 创建快照（如果权重改变）
        if (oldWeight !== newWeight) {
          await this.snapshotService.createSnapshot(
            kr.goalUuid,
            krUuid,
            oldWeight,
            newWeight,
            'manual',
            operatorUuid
          );
        }
      });
    }
    ```

- [ ] **15:00-17:00** 编写集成测试 (2h)
  - 测试快照自动创建
  - 测试权重总和校验
  - 测试事务回滚（快照失败时）
  - 使用 Vitest + 内存数据库

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add weight snapshot application service`

**交付物**:

- ✅ `WeightSnapshotApplicationService` 完整实现
- ✅ 集成到 `UpdateKeyResultService`
- ✅ 事务管理和权重校验
- ✅ 集成测试覆盖率 ≥ 80%

**验收标准**:

```gherkin
Scenario: 权重更新时自动创建快照
  Given KR1 权重为 30%
  When 调用 updateKeyResultWeight(kr1Uuid, 50%)
  Then 快照记录 oldWeight=30, newWeight=50
  And KR1 权重更新为 50%
  And 如果快照失败，权重更新回滚
```

---

#### **Day 3 (2025-11-05 周三): Infrastructure & Repository**

**目标**: 完成 Story-003 (2 SP)

**任务清单**:

- [ ] **09:00-11:00** 创建 Prisma Schema (2h)
  - 更新 `apps/api/prisma/schema.prisma`:
    ```prisma
    model KeyResultWeightSnapshot {
      id              String   @id @default(uuid())
      uuid            String   @unique @default(uuid())

      goalUuid        String
      keyResultUuid   String

      oldWeight       Int      // 0-100
      newWeight       Int      // 0-100
      weightDelta     Int      // newWeight - oldWeight

      snapshotTime    BigInt
      trigger         String   // manual/auto/restore/import
      reason          String?
      operatorUuid    String

      createdAt       BigInt

      goal            Goal     @relation(fields: [goalUuid], references: [uuid], onDelete: Cascade)
      keyResult       KeyResult @relation(fields: [keyResultUuid], references: [uuid], onDelete: Cascade)

      @@index([goalUuid, snapshotTime(sort: Desc)])
      @@index([keyResultUuid, snapshotTime(sort: Desc)])
      @@map("key_result_weight_snapshots")
    }
    ```
  - 运行 `pnpm nx run api:prisma-migrate-dev --name add_weight_snapshot`
  - 验证迁移成功

- [ ] **11:00-13:00** 实现 Repository (2h)
  - 创建 `apps/api/src/infrastructure/goal/WeightSnapshotRepository.ts`:
    ```typescript
    export class WeightSnapshotRepository {
      constructor(private prisma: PrismaClient) {}

      async save(snapshot: KeyResultWeightSnapshot): Promise<void> {
        await this.prisma.keyResultWeightSnapshot.create({
          data: {
            uuid: snapshot.uuid,
            goalUuid: snapshot.goalUuid,
            keyResultUuid: snapshot.keyResultUuid,
            oldWeight: snapshot.oldWeight,
            newWeight: snapshot.newWeight,
            weightDelta: snapshot.weightDelta,
            snapshotTime: snapshot.snapshotTime,
            trigger: snapshot.trigger,
            reason: snapshot.reason,
            operatorUuid: snapshot.operatorUuid,
            createdAt: snapshot.snapshotTime,
          },
        });
      }

      async findByGoalUuid(
        goalUuid: string,
        options?: { limit?: number; offset?: number },
      ): Promise<KeyResultWeightSnapshot[]> {
        const snapshots = await this.prisma.keyResultWeightSnapshot.findMany({
          where: { goalUuid },
          orderBy: { snapshotTime: 'desc' },
          take: options?.limit,
          skip: options?.offset,
        });

        return snapshots.map((s) => this.toDomain(s));
      }

      async findByKeyResultUuid(krUuid: string): Promise<KeyResultWeightSnapshot[]> {
        const snapshots = await this.prisma.keyResultWeightSnapshot.findMany({
          where: { keyResultUuid: krUuid },
          orderBy: { snapshotTime: 'desc' },
        });

        return snapshots.map((s) => this.toDomain(s));
      }

      private toDomain(data: any): KeyResultWeightSnapshot {
        return new KeyResultWeightSnapshot(
          data.uuid,
          data.goalUuid,
          data.keyResultUuid,
          data.oldWeight,
          data.newWeight,
          Number(data.snapshotTime),
          data.trigger as SnapshotTrigger,
          data.operatorUuid,
          data.reason,
        );
      }
    }
    ```

- [ ] **14:00-16:00** 编写 Repository 测试 (2h)
  - 使用测试数据库
  - 测试 save、findByGoalUuid、findByKeyResultUuid
  - 测试分页和排序

- [ ] **16:00-17:30** Code Review & 集成测试 (1.5h)
  - 运行所有测试
  - PR: `feat(goal): add weight snapshot repository and migrations`

**交付物**:

- ✅ Prisma Schema 和数据库迁移
- ✅ `WeightSnapshotRepository` 完整实现
- ✅ Repository 测试覆盖率 ≥ 80%

**验收标准**:

```gherkin
Scenario: Repository 方法正确工作
  Given 目标有 5 条权重快照
  When 调用 findByGoalUuid(goalUuid, {limit: 3})
  Then 返回最新的 3 条快照
  And 按 snapshotTime 降序排列
```

---

#### **Day 4 (2025-11-06 周四): API Endpoints**

**目标**: 完成 Story-004 (3 SP)

**任务清单**:

- [ ] **09:00-12:00** 创建 Controller (3h)
  - 创建 `apps/api/src/api/goal/WeightSnapshotController.ts`:
    ```typescript
    @Controller('/api/goals')
    export class WeightSnapshotController {
      constructor(private snapshotService: WeightSnapshotApplicationService) {}

      @Get('/:goalId/weight-snapshots')
      @UseGuards(AuthGuard, GoalMemberGuard)
      async getGoalSnapshots(
        @Param('goalId') goalId: string,
        @Query() query: GetSnapshotsQueryDTO,
      ): Promise<KeyResultWeightSnapshotServerDTO[]> {
        const snapshots = await this.snapshotService.getGoalSnapshots(goalId, {
          limit: query.limit,
          offset: query.offset,
          startTime: query.startTime,
          endTime: query.endTime,
          trigger: query.trigger,
        });

        return snapshots.map((s) => this.toDTO(s));
      }

      @Get('/:goalId/key-results/:krId/snapshots')
      @UseGuards(AuthGuard, GoalMemberGuard)
      async getKeyResultSnapshots(
        @Param('goalId') goalId: string,
        @Param('krId') krId: string,
      ): Promise<KeyResultWeightSnapshotServerDTO[]> {
        const snapshots = await this.snapshotService.getKeyResultSnapshots(krId);
        return snapshots.map((s) => this.toDTO(s));
      }

      private toDTO(snapshot: KeyResultWeightSnapshot): KeyResultWeightSnapshotServerDTO {
        return {
          uuid: snapshot.uuid,
          goalUuid: snapshot.goalUuid,
          keyResultUuid: snapshot.keyResultUuid,
          oldWeight: snapshot.oldWeight,
          newWeight: snapshot.newWeight,
          weightDelta: snapshot.weightDelta,
          snapshotTime: snapshot.snapshotTime,
          trigger: snapshot.trigger,
          operatorUuid: snapshot.operatorUuid,
          reason: snapshot.reason,
          createdAt: snapshot.snapshotTime,
        };
      }
    }
    ```
  - 创建查询 DTO 验证器:
    ```typescript
    export const GetSnapshotsQuerySchema = z.object({
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
      startTime: z.number().int().positive().optional(),
      endTime: z.number().int().positive().optional(),
      trigger: z.enum(['manual', 'auto', 'restore', 'import']).optional(),
    });
    ```

- [ ] **13:00-15:00** 添加路由和权限 (2h)
  - 注册路由到 Express App
  - 实现 `GoalMemberGuard`（验证用户是目标成员）
  - 添加错误处理中间件

- [ ] **15:00-17:00** 编写 API 测试 (2h)
  - 使用 Supertest
  - 测试 GET endpoints
  - 测试查询参数筛选
  - 测试权限检查

- [ ] **17:00-17:30** 更新 OpenAPI 文档
  - 使用 Swagger 注解
  - 生成 API 文档
  - PR: `feat(goal): add weight snapshot API endpoints`

**交付物**:

- ✅ `WeightSnapshotController` 完整实现
- ✅ 查询参数验证和权限检查
- ✅ API 测试覆盖率 ≥ 80%
- ✅ OpenAPI 文档更新

**验收标准**:

```gherkin
Scenario: GET 目标的权重快照
  Given 用户是目标成员
  And 目标有 10 条快照
  When GET /api/goals/:goalId/weight-snapshots?limit=5
  Then 返回 200
  And 响应包含 5 条快照
  And 按 snapshotTime 降序排列

Scenario: 权限检查
  Given 用户不是目标成员
  When GET 任何快照端点
  Then 返回 403
  And 错误信息 "无权访问此目标"
```

---

#### **Day 5 (2025-11-07 周五): Code Review & DAG Spike 启动**

**目标**: Code Review + 启动技术 Spike

**任务清单**:

- [ ] **09:00-11:00** Code Review 会议 (2h)
  - Review Week 3 所有代码
  - 讨论技术债务
  - 确认重构需求

- [ ] **11:00-12:00** 修复 Review 问题 (1h)
  - 根据 Review 意见修改代码
  - 提交最终版本

- [ ] **13:00-15:00** DAG 可视化技术 Spike 启动 (2h)
  - **目标**: 为 Sprint 4 (TASK-001) 评估 graphlib + @vue-flow/core 可行性
  - **任务**:
    - [ ] 安装依赖: `pnpm add graphlib @vue-flow/core dagre`
    - [ ] 创建 POC 项目: `apps/web/src/poc/dag-visualization/`
    - [ ] 创建简单测试图（10 个节点，20 条边）
    - [ ] 测试 graphlib 的环检测:

      ```typescript
      import { Graph, alg } from 'graphlib';

      const g = new Graph();
      g.setNode('task1');
      g.setNode('task2');
      g.setEdge('task1', 'task2');

      const cycles = alg.findCycles(g);
      console.log('检测到循环依赖:', cycles);
      ```

    - [ ] 测试 dagre 布局算法
  - **交付**: 初步 POC 代码和可行性笔记

- [ ] **15:00-17:00** Sprint 回顾准备 (2h)
  - 整理 Week 3 完成的工作
  - 记录遇到的问题和解决方案
  - 准备 Week 4 任务

- [ ] **17:00-17:30** 每日站会 & 周总结
  - 汇报 Week 3 进展
  - 讨论下周计划

**交付物**:

- ✅ Week 3 所有代码 Review 完成
- ✅ DAG Spike 初步 POC
- ✅ Week 3 工作总结

---

### **Week 4: 前端开发 + DAG Spike 完成**

#### **Day 6 (2025-11-10 周一): Client Services**

**目标**: 完成 Story-005 (2 SP)

**任务清单**:

- [ ] **09:00-12:00** 创建 Client Service (3h)
  - 创建 `packages/domain-client/src/goal/WeightSnapshotClientService.ts`:
    ```typescript
    export class WeightSnapshotClientService {
      constructor(private httpClient: HttpClient) {}

      async getGoalSnapshots(
        goalUuid: string,
        options?: {
          limit?: number;
          offset?: number;
          startTime?: number;
          endTime?: number;
          trigger?: SnapshotTrigger;
        },
      ): Promise<KeyResultWeightSnapshotClientDTO[]> {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', String(options.limit));
        if (options?.offset) params.append('offset', String(options.offset));
        if (options?.startTime) params.append('startTime', String(options.startTime));
        if (options?.endTime) params.append('endTime', String(options.endTime));
        if (options?.trigger) params.append('trigger', options.trigger);

        const response = await this.httpClient.get(
          `/api/goals/${goalUuid}/weight-snapshots?${params}`,
        );

        return response.data;
      }

      async getKeyResultSnapshots(krUuid: string): Promise<KeyResultWeightSnapshotClientDTO[]> {
        // 需要 goalUuid，从 KR 数据中获取
        const kr = await this.krClientService.getKeyResult(krUuid);
        const response = await this.httpClient.get(
          `/api/goals/${kr.goalUuid}/key-results/${krUuid}/snapshots`,
        );

        return response.data;
      }

      async compareSnapshots(
        goalUuid: string,
        time1: number,
        time2: number,
      ): Promise<WeightComparisonResult> {
        // 获取两个时间点附近的快照
        const snapshots1 = await this.getGoalSnapshots(goalUuid, {
          endTime: time1,
          limit: 100,
        });
        const snapshots2 = await this.getGoalSnapshots(goalUuid, {
          endTime: time2,
          limit: 100,
        });

        // 计算权重变化
        return this.calculateWeightChanges(snapshots1, snapshots2);
      }

      private calculateWeightChanges(
        snapshots1: KeyResultWeightSnapshotClientDTO[],
        snapshots2: KeyResultWeightSnapshotClientDTO[],
      ): WeightComparisonResult {
        // 对比逻辑
        // ...
      }
    }
    ```

- [ ] **13:00-15:00** 集成 React Query (2h)
  - 创建 hooks:

    ```typescript
    export function useGoalSnapshots(goalUuid: string, options?: UseSnapshotsOptions) {
      return useQuery({
        queryKey: ['goal-snapshots', goalUuid, options],
        queryFn: () => snapshotService.getGoalSnapshots(goalUuid, options),
        staleTime: 5 * 60 * 1000, // 5 分钟缓存
        cacheTime: 10 * 60 * 1000,
      });
    }

    export function useKeyResultSnapshots(krUuid: string) {
      return useQuery({
        queryKey: ['kr-snapshots', krUuid],
        queryFn: () => snapshotService.getKeyResultSnapshots(krUuid),
        staleTime: 5 * 60 * 1000,
      });
    }

    export function useSnapshotComparison(goalUuid: string, time1: number, time2: number) {
      return useQuery({
        queryKey: ['snapshot-comparison', goalUuid, time1, time2],
        queryFn: () => snapshotService.compareSnapshots(goalUuid, time1, time2),
        enabled: time1 > 0 && time2 > 0,
      });
    }
    ```

- [ ] **15:00-17:00** 编写客户端测试 (2h)
  - Mock HTTP responses
  - 测试 React Query hooks
  - 测试对比计算逻辑

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add weight snapshot client services`

**交付物**:

- ✅ `WeightSnapshotClientService` 完整实现
- ✅ React Query hooks
- ✅ 客户端测试覆盖率 ≥ 80%

---

#### **Day 7 (2025-11-11 周二): UI - 快照列表**

**目标**: 完成 Story-006 (3 SP)

**任务清单**:

- [ ] **09:00-12:00** 创建列表组件 (3h)
  - 创建 `apps/web/src/features/goal/components/WeightSnapshotList.vue`:

    ```vue
    <template>
      <div class="weight-snapshot-list">
        <div class="filters">
          <el-select v-model="filterKr" placeholder="筛选 KR">
            <el-option label="全部 KR" :value="null" />
            <el-option v-for="kr in keyResults" :key="kr.uuid" :label="kr.title" :value="kr.uuid" />
          </el-select>

          <el-select v-model="filterTrigger" placeholder="筛选触发方式">
            <el-option label="全部" :value="null" />
            <el-option label="手动调整" value="manual" />
            <el-option label="自动调整" value="auto" />
            <el-option label="历史恢复" value="restore" />
          </el-select>
        </div>

        <el-timeline class="snapshot-timeline">
          <el-timeline-item
            v-for="snapshot in filteredSnapshots"
            :key="snapshot.uuid"
            :timestamp="formatTime(snapshot.snapshotTime)"
            placement="top"
          >
            <el-card>
              <div class="snapshot-header">
                <span class="kr-name">{{ getKrName(snapshot.keyResultUuid) }}</span>
                <el-tag :type="getTriggerType(snapshot.trigger)">
                  {{ getTriggerLabel(snapshot.trigger) }}
                </el-tag>
              </div>

              <div class="weight-change">
                <span class="old-weight">{{ snapshot.oldWeight }}%</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="new-weight">{{ snapshot.newWeight }}%</span>
                <span class="delta" :class="getDeltaClass(snapshot.weightDelta)">
                  {{ formatDelta(snapshot.weightDelta) }}
                </span>
              </div>

              <div v-if="snapshot.reason" class="reason">
                <el-icon><Document /></el-icon>
                <span>{{ snapshot.reason }}</span>
              </div>

              <div class="actions">
                <el-button text @click="viewDetails(snapshot)"> 查看详情 </el-button>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <div v-if="hasMore" class="load-more">
          <el-button @click="loadMore">加载更多</el-button>
        </div>
      </div>
    </template>

    <script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useGoalSnapshots } from '@/hooks/useGoalSnapshots';
    import { formatRelativeTime } from '@/utils/time';

    const props = defineProps<{
      goalUuid: string;
      keyResults: KeyResult[];
    }>();

    const filterKr = ref<string | null>(null);
    const filterTrigger = ref<SnapshotTrigger | null>(null);
    const limit = ref(20);

    const {
      data: snapshots,
      isLoading,
      fetchMore,
    } = useGoalSnapshots(props.goalUuid, { limit: limit.value });

    const filteredSnapshots = computed(() => {
      let result = snapshots.value || [];

      if (filterKr.value) {
        result = result.filter((s) => s.keyResultUuid === filterKr.value);
      }

      if (filterTrigger.value) {
        result = result.filter((s) => s.trigger === filterTrigger.value);
      }

      return result;
    });

    function formatTime(timestamp: number): string {
      return formatRelativeTime(timestamp);
    }

    function getDeltaClass(delta: number): string {
      if (delta > 0) return 'positive';
      if (delta < 0) return 'negative';
      return 'neutral';
    }

    function formatDelta(delta: number): string {
      if (delta > 0) return `+${delta}%`;
      if (delta < 0) return `${delta}%`;
      return '0%';
    }

    function viewDetails(snapshot: KeyResultWeightSnapshot) {
      // 打开详情对话框
      // ...
    }

    function loadMore() {
      limit.value += 20;
      fetchMore();
    }
    </script>

    <style scoped>
    .weight-snapshot-list {
      padding: 20px;
    }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .snapshot-timeline {
      margin-top: 20px;
    }

    .snapshot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .kr-name {
      font-weight: 600;
      font-size: 16px;
    }

    .weight-change {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      margin-bottom: 12px;
    }

    .old-weight {
      color: var(--el-color-info);
    }

    .new-weight {
      font-weight: 600;
      color: var(--el-color-primary);
    }

    .delta {
      font-size: 14px;
      font-weight: 500;
    }

    .delta.positive {
      color: var(--el-color-success);
    }

    .delta.negative {
      color: var(--el-color-danger);
    }

    .delta.neutral {
      color: var(--el-color-info);
    }

    .reason {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }

    .load-more {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
    </style>
    ```

- [ ] **13:00-15:00** 添加详情对话框 (2h)
  - 创建 `SnapshotDetailsDialog.vue`
  - 显示完整快照信息（包括操作人、时间戳等）

- [ ] **15:00-17:00** 编写组件测试 (2h)
  - 使用 Vitest + Vue Test Utils
  - 测试筛选功能
  - 测试加载更多
  - 测试详情对话框

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add weight snapshot list UI`

**交付物**:

- ✅ `WeightSnapshotList.vue` 组件
- ✅ 筛选和分页功能
- ✅ 组件测试覆盖率 ≥ 80%

---

#### **Day 8 (2025-11-12 周三): UI - 权重趋势图 + DAG Spike**

**目标**: 完成 Story-007 (3 SP) + 继续 DAG Spike

**任务清单**:

- [ ] **09:00-12:00** 创建趋势图组件 (3h)
  - 安装 ECharts: `pnpm add echarts`
  - 创建 `apps/web/src/features/goal/components/WeightTrendChart.vue`:

    ```vue
    <template>
      <div class="weight-trend-chart">
        <div class="chart-controls">
          <el-radio-group v-model="timeRange">
            <el-radio-button label="7d">最近 7 天</el-radio-button>
            <el-radio-button label="30d">最近 30 天</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
        </div>

        <div ref="chartRef" class="chart-container"></div>
      </div>
    </template>

    <script setup lang="ts">
    import { ref, onMounted, watch, computed } from 'vue';
    import * as echarts from 'echarts';
    import { useGoalSnapshots } from '@/hooks/useGoalSnapshots';

    const props = defineProps<{
      goalUuid: string;
      keyResults: KeyResult[];
    }>();

    const chartRef = ref<HTMLDivElement>();
    const timeRange = ref<'7d' | '30d' | 'all'>('30d');
    let chart: echarts.ECharts;

    const { data: snapshots } = useGoalSnapshots(props.goalUuid, {
      startTime: computed(() => getStartTime(timeRange.value)),
    });

    function getStartTime(range: string): number {
      const now = Date.now();
      if (range === '7d') return now - 7 * 24 * 60 * 60 * 1000;
      if (range === '30d') return now - 30 * 24 * 60 * 60 * 1000;
      return 0;
    }

    function initChart() {
      if (!chartRef.value) return;

      chart = echarts.init(chartRef.value);
      updateChart();
    }

    function updateChart() {
      if (!snapshots.value || !chart) return;

      // 按 KR 分组
      const seriesByKr = new Map<string, any[]>();

      props.keyResults.forEach((kr) => {
        const krSnapshots = snapshots.value
          .filter((s) => s.keyResultUuid === kr.uuid)
          .sort((a, b) => a.snapshotTime - b.snapshotTime);

        const data = krSnapshots.map((s) => [new Date(s.snapshotTime), s.newWeight]);

        seriesByKr.set(kr.uuid, {
          name: kr.title,
          type: 'line',
          data,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 2 },
        });
      });

      const option: echarts.EChartsOption = {
        title: {
          text: '权重变化趋势',
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
          formatter: (params: any) => {
            let result = `${params[0].axisValueLabel}<br/>`;
            params.forEach((param: any) => {
              result += `${param.marker} ${param.seriesName}: ${param.value[1]}%<br/>`;
            });
            return result;
          },
        },
        legend: {
          data: Array.from(seriesByKr.values()).map((s) => s.name),
          top: 40,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'time',
          boundaryGap: false,
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: {
            formatter: '{value}%',
          },
        },
        series: Array.from(seriesByKr.values()),
      };

      chart.setOption(option);
    }

    onMounted(() => {
      initChart();
    });

    watch(
      () => [snapshots.value, timeRange.value],
      () => {
        updateChart();
      },
      { deep: true },
    );
    </script>

    <style scoped>
    .weight-trend-chart {
      padding: 20px;
    }

    .chart-controls {
      margin-bottom: 20px;
    }

    .chart-container {
      width: 100%;
      height: 400px;
    }
    </style>
    ```

- [ ] **13:00-15:00** DAG Spike - 性能测试 (2h)
  - **目标**: 测试 graphlib + dagre 性能
  - **任务**:
    - [ ] 创建 100 节点测试图
    - [ ] 测量环检测时间:
      ```typescript
      console.time('Cycle Detection - 100 nodes');
      const cycles = alg.findCycles(graph);
      console.timeEnd('Cycle Detection - 100 nodes');
      // 目标: < 200ms
      ```
    - [ ] 测量拓扑排序时间:
      ```typescript
      console.time('Topological Sort - 100 nodes');
      const sorted = alg.topsort(graph);
      console.timeEnd('Topological Sort - 100 nodes');
      // 目标: < 100ms
      ```
    - [ ] 测量 dagre 布局时间:
      ```typescript
      console.time('Dagre Layout - 100 nodes');
      dagre.layout(dagreGraph);
      console.timeEnd('Dagre Layout - 100 nodes');
      // 目标: < 300ms
      ```
  - **记录**: 性能数据到 `docs/pm/TECHNICAL_DECISIONS.md` 的 ADR-002

- [ ] **15:00-17:00** 编写趋势图测试 (2h)
  - Mock ECharts
  - 测试时间范围切换
  - 测试数据更新

- [ ] **17:00-17:30** Code Review & 提交
  - PR: `feat(goal): add weight trend chart`
  - 更新 DAG Spike 进度

**交付物**:

- ✅ `WeightTrendChart.vue` 组件
- ✅ ECharts 集成和交互
- ✅ DAG Spike 性能数据（100 节点）
- ✅ 组件测试覆盖率 ≥ 80%

---

#### **Day 9 (2025-11-13 周四): UI - 权重对比 + DAG Spike 完成**

**目标**: 完成 Story-008 (4 SP) + 完成 DAG Spike

**任务清单**:

- [ ] **09:00-12:00** 创建对比组件 (3h)
  - 创建 `WeightComparisonView.vue`
  - 实现时间点选择器（两个日期选择）
  - 并排显示两个饼图（使用 ECharts）
  - 计算并显示权重变化量

- [ ] **13:00-15:00** DAG Spike - 最终评估 (2h)
  - **目标**: 完成 Go/No-Go 决策
  - **任务**:
    - [ ] 创建 500 节点测试图
    - [ ] 测试 @vue-flow/core 集成:

      ```vue
      <template>
        <VueFlow :nodes="nodes" :edges="edges" />
      </template>

      <script setup>
      import { VueFlow } from '@vue-flow/core';
      import { ref } from 'vue';

      const nodes = ref([
        /* 从 graphlib 转换 */
      ]);
      const edges = ref([
        /* 从 graphlib 转换 */
      ]);
      </script>
      ```

    - [ ] 测量 500 节点性能（目标 < 500ms）
    - [ ] 验证与 Vue 3 组合式 API 的兼容性
  - **输出**:
    - [ ] 更新 ADR-002 的 "技术 Spike 结果" 部分
    - [ ] Go/No-Go 决策：✅ Go（如果性能达标）
    - [ ] 风险和缓解措施（如果有）

- [ ] **15:00-17:00** 完成对比组件 (2h)
  - 添加权重变化高亮
  - 支持导出对比报告（PDF/PNG）

- [ ] **17:00-17:30** Code Review & DAG Spike 总结
  - PR: `feat(goal): add weight comparison view`
  - 提交 DAG Spike 报告到 `docs/pm/spikes/dag-visualization-spike.md`

**交付物**:

- ✅ `WeightComparisonView.vue` 组件
- ✅ 时间点对比和可视化
- ✅ DAG Spike 完整报告（含性能数据、Go/No-Go 决策）
- ✅ 组件测试覆盖率 ≥ 80%

---

#### **Day 10 (2025-11-14 周五): E2E Tests + Sprint Review**

**目标**: 完成 Story-009 (2 SP) + Sprint Review

**任务清单**:

- [ ] **09:00-12:00** 编写 E2E 测试 (3h)
  - 使用 Playwright
  - 创建 `apps/web/e2e/goal/weight-snapshot.spec.ts`:

    ```typescript
    import { test, expect } from '@playwright/test';

    test.describe('权重快照功能', () => {
      test('完整的权重快照流程', async ({ page }) => {
        // 1. 登录
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password');
        await page.click('button[type="submit"]');

        // 2. 创建目标（3 个 KR，权重 30%, 40%, 30%）
        await page.goto('/goals/new');
        // ... 创建目标逻辑

        // 3. 修改 KR1 权重从 30% 到 50%
        await page.click('[data-testid="edit-kr1-weight"]');
        await page.fill('input[name="weight"]', '50');
        await page.click('button[type="submit"]');

        // 4. 验证权重更新
        await expect(page.locator('[data-testid="kr1-weight"]')).toHaveText('50%');

        // 5. 打开权重历史标签
        await page.click('[data-testid="weight-history-tab"]');

        // 6. 验证快照显示
        const snapshot = page.locator('.snapshot-timeline .el-timeline-item').first();
        await expect(snapshot).toContainText('30%');
        await expect(snapshot).toContainText('50%');
        await expect(snapshot).toContainText('+20%');

        // 7. 查看权重趋势图
        await page.click('[data-testid="weight-trend-tab"]');
        await expect(page.locator('.chart-container')).toBeVisible();

        // 8. 测试权重对比
        await page.click('[data-testid="weight-comparison-tab"]');
        // ... 选择两个时间点
        // ... 验证对比结果
      });

      test('权重总和校验', async ({ page }) => {
        // 测试权重总和超 100% 的情况
        // ...
      });

      test('快照筛选功能', async ({ page }) => {
        // 测试按 KR 和触发方式筛选
        // ...
      });
    });
    ```

  - 运行测试: `pnpm nx e2e web`

- [ ] **13:00-15:00** Bug Fixes & 优化 (2h)
  - 修复 E2E 测试发现的问题
  - 性能优化（如有需要）
  - 最终代码清理

- [ ] **15:00-17:00** Sprint Review 会议 (2h)
  - **参与者**: 全员 + 产品经理
  - **议程**:
    - [ ] Demo 权重快照功能（15 分钟）
      - 演示权重调整 → 快照创建
      - 演示权重历史列表
      - 演示权重趋势图
      - 演示权重对比功能
    - [ ] Review Story 完成情况（30 分钟）
      - 9 个 Stories 全部完成 ✅
      - Story Points: 25/25 (100%)
    - [ ] Review DAG Spike 结果（15 分钟）
      - 性能测试数据
      - Go/No-Go 决策
      - Sprint 4 准备建议
    - [ ] 讨论技术债务（15 分钟）
    - [ ] 收集反馈和改进建议（15 分钟）
    - [ ] 确认 Sprint 2a 是否达到 DoD（10 分钟）

- [ ] **17:00-17:30** Sprint Retrospective 会议 (30 分钟)
  - **议程**:
    - [ ] 回顾：做得好的地方（10 分钟）
    - [ ] 回顾：需要改进的地方（10 分钟）
    - [ ] 行动计划：Sprint 2b 改进措施（10 分钟）

**交付物**:

- ✅ E2E 测试套件完整
- ✅ 所有测试通过（单元 + 集成 + E2E）
- ✅ Sprint Review 完成
- ✅ Sprint Retrospective 完成

---

## 📊 Sprint 统计

### Story 完成情况

| Story ID           | 标题                | SP  | 预估工时 | 实际工时 | 状态     |
| ------------------ | ------------------- | --- | -------- | -------- | -------- |
| STORY-GOAL-002-001 | Contracts & Domain  | 3   | 1d       | -        | Planning |
| STORY-GOAL-002-002 | Application Service | 3   | 1d       | -        | Planning |
| STORY-GOAL-002-003 | Infrastructure      | 2   | 0.5d     | -        | Planning |
| STORY-GOAL-002-004 | API Endpoints       | 3   | 1d       | -        | Planning |
| STORY-GOAL-002-005 | Client Services     | 2   | 0.5d     | -        | Planning |
| STORY-GOAL-002-006 | UI - 快照列表       | 3   | 1d       | -        | Planning |
| STORY-GOAL-002-007 | UI - 权重趋势图     | 3   | 1d       | -        | Planning |
| STORY-GOAL-002-008 | UI - 权重对比       | 4   | 1.5d     | -        | Planning |
| STORY-GOAL-002-009 | E2E Tests           | 2   | 0.5d     | -        | Planning |

**总计**: 25 SP, 预估 8.5 工作日

### 技术 Spike

**DAG 可视化 Spike** (为 Sprint 4 铺路):

- **时间**: Day 5, Day 8, Day 9 (共 6 小时)
- **目标**: 评估 graphlib + @vue-flow/core + dagre 可行性
- **交付**: Spike 报告 + Go/No-Go 决策

---

## ✅ Definition of Done (DoD)

### Story 级别 DoD

每个 Story 必须满足:

- [ ] 所有验收标准通过
- [ ] 代码覆盖率 ≥ 80%
- [ ] ESLint 检查通过（0 errors, 0 warnings）
- [ ] TypeScript 编译无错误
- [ ] Code Review 完成并批准
- [ ] API 文档更新（如适用）
- [ ] 性能指标达标:
  - API 响应时间 P95 < 500ms
  - UI 交互响应 < 200ms

### Sprint 级别 DoD

Sprint 2a 必须满足:

- [ ] 所有 9 个 Stories 状态为 Done
- [ ] 所有测试通过（单元 + 集成 + E2E）
  - 单元测试: ≥ 80% 覆盖率
  - 集成测试: 关键路径 100% 覆盖
  - E2E 测试: 核心用户流程覆盖
- [ ] 无 P0 Bug（阻塞性缺陷）
- [ ] P1 Bug ≤ 3 个（高优先级缺陷）
- [ ] 代码覆盖率 ≥ 80%
- [ ] 可部署到 Staging 环境
- [ ] Sprint Review 完成
- [ ] Sprint Retrospective 完成
- [ ] DAG Spike 报告完成

---

## 🚨 风险管理

### 识别的风险

| 风险                 | 概率 | 影响 | 缓解策略                                   | 负责人     |
| -------------------- | ---- | ---- | ------------------------------------------ | ---------- |
| Prisma 迁移失败      | 中   | 高   | 本地环境预先测试，准备回滚脚本             | 后端负责人 |
| ECharts 性能问题     | 低   | 中   | 数据采样，限制显示点数                     | 前端负责人 |
| 权重总和校验逻辑复杂 | 中   | 中   | 提前设计算法，编写充分的单元测试           | 后端负责人 |
| DAG Spike 时间不足   | 低   | 中   | 优先完成核心功能，Spike 可延期到 Week 4    | Tech Lead  |
| E2E 测试不稳定       | 中   | 低   | 使用 Playwright 的 auto-wait，增加重试逻辑 | QA 负责人  |

### 应急计划

如果 Sprint 2a 无法按时完成：

1. **优先级调整**: 降低 Story-008 (权重对比) 的优先级，推迟到 Sprint 2b
2. **Scope 削减**: 移除"导出报告"功能
3. **延期**: 延长 Sprint 2-3 天（但需与 Sprint 2b 协调）

---

## 📈 Sprint 监控指标

### 开发效率

- **Sprint 完成率**: Story Points 完成数 / 25 SP (目标 ≥ 90%)
- **平均 Story 完成时间**: 实际工时 / 预估工时 (目标 ≤ 1.2)
- **代码审查周期**: PR 创建 → 合并时间 (目标 ≤ 4 小时)
- **Bug 修复周期**: Bug 发现 → 修复完成 (目标 ≤ 1 工作日)
- **CI/CD 成功率**: 通过的 CI 构建 / 总构建数 (目标 ≥ 95%)

### 质量指标

- **P0 Bug 数量**: 0 个
- **P1 Bug 数量**: ≤ 3 个
- **技术债务**: ≤ 10% 的代码需要重构
- **代码重复率**: ≤ 3%
- **测试覆盖率**: ≥ 80%
- **性能指标**:
  - API P95 响应时间: < 500ms
  - 前端首屏加载: < 2s
  - 权重趋势图渲染: < 500ms (100 快照)

### 协作指标

- **每日站会出席率**: 100%
- **Code Review 参与度**: 每人至少 Review 3 个 PR
- **文档完整度**: 100%（所有 Story 有文档）
- **知识分享**: 至少 1 次技术分享（DAG Spike 结果）

---

## 🔧 技术栈总结

### 后端

- **语言**: TypeScript 5.x
- **框架**: Express.js 4.x
- **ORM**: Prisma 5.x
- **数据库**: PostgreSQL 15.x
- **测试**: Vitest 1.x

### 前端

- **框架**: Vue 3.4.x (组合式 API)
- **UI 库**: Element Plus 2.x
- **状态管理**: Pinia 2.x
- **数据获取**: React Query (TanStack Query) 5.x
- **图表**: ECharts 5.x
- **测试**: Vitest + Vue Test Utils

### 基础设施

- **包管理**: pnpm 9.x
- **构建工具**: Vite 5.x
- **Monorepo**: Nx 21.x
- **CI/CD**: GitHub Actions
- **E2E 测试**: Playwright 1.x

---

## 📚 参考文档

- [Epic: GOAL-002 - KR 权重快照](../epics/epic-goal-002-kr-weight-snapshot.md)
- [技术决策: ADR-002 - DAG 可视化](../TECHNICAL_DECISIONS.md#adr-002-dag-可视化技术选型)
- [PM 阶段总结](../PM_PHASE_SUMMARY.md)
- [DDD 8 层架构指南](../../architecture/)
- [测试指南](../../testing/)

---

## 🎯 Sprint 成功标准

Sprint 2a 被认为成功当且仅当:

1. ✅ 所有 9 个 Stories 完成并通过验收
2. ✅ 所有 DoD 检查项通过
3. ✅ 可在 Staging 环境正常运行
4. ✅ 产品经理验收通过
5. ✅ DAG Spike 报告完成，为 Sprint 4 提供明确建议
6. ✅ 团队士气良好，准备好开始 Sprint 2b

---

**Sprint 计划创建于**: 2025-10-21  
**计划审批**: 待团队 Review  
**下一步**: 团队 Sprint Planning 会议，确认分工和细节

---

_祝 Sprint 2a 顺利！🚀_
