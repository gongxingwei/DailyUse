# STORY-GOAL-002-005: KR 权重快照 - 客户端服务层

> **Story ID**: STORY-GOAL-002-005  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 2a  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Frontend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 前端开发者  
**我想要** 客户端服务层封装权重快照相关逻辑  
**以便于** UI 组件可以方便地调用和管理数据

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: WeightSnapshotClientApplicationService 实现

```gherkin
Scenario: 实现更新 KR 权重方法
  Given 用户想要更新 KR 权重
  When 调用 service.updateKRWeight(krUuid, newWeight, reason)
  Then 应该调用 POST /api/goals/:goalUuid/key-results/:krUuid/weight
  And 返回更新结果
  And 如果成功则触发 WEIGHT_UPDATED 事件
  
Scenario: 实现查询 Goal 快照方法
  Given 需要查询 Goal 的权重快照
  When 调用 service.getGoalSnapshots(goalUuid, page, pageSize)
  Then 应该调用 GET /api/goals/:goalUuid/weight-snapshots
  And 返回快照列表和分页信息
```

### Scenario 2: React Query 集成

```gherkin
Scenario: 使用 useQuery 查询快照列表
  Given 需要展示权重快照列表
  When 组件使用 useGoalSnapshots(goalUuid) hook
  Then 应该自动请求 API
  And 提供 data, isLoading, error 状态
  And 支持自动缓存和刷新
  
Scenario: 使用 useMutation 更新权重
  Given 用户想要更新权重
  When 组件使用 useUpdateKRWeight() hook
  Then 应该提供 mutate 方法
  And 更新成功后自动 invalidate 相关查询
  And 显示乐观更新
```

### Scenario 3: 事件监听

```gherkin
Scenario: 监听权重变更事件
  Given 多个组件需要响应权重变更
  When 权重更新成功
  Then 应该发送 WEIGHT_UPDATED 事件
  And 包含 goalUuid, krUuid, oldWeight, newWeight
  And 所有订阅者都能收到事件
```

---

## 📋 任务清单 (Task Breakdown)

### Service 实现任务

- [ ] **Task 1.1**: 创建 `WeightSnapshotClientApplicationService.ts`
  - [ ] 实现 `updateKRWeight()` 方法
  - [ ] 实现 `getGoalSnapshots()` 方法
  - [ ] 实现 `getKRSnapshots()` 方法
  - [ ] 实现 `getWeightTrend()` 方法
  - [ ] 实现 `getWeightComparison()` 方法

- [ ] **Task 1.2**: 创建 API Client 方法
  - [ ] `weightSnapshotApi.updateKRWeight()`
  - [ ] `weightSnapshotApi.getGoalSnapshots()`
  - [ ] `weightSnapshotApi.getKRSnapshots()`
  - [ ] `weightSnapshotApi.getWeightTrend()`
  - [ ] `weightSnapshotApi.getWeightComparison()`

### React Query Hooks

- [ ] **Task 2.1**: 创建 Query Hooks
  - [ ] `useGoalSnapshots(goalUuid, options)`
  - [ ] `useKRSnapshots(krUuid, options)`
  - [ ] `useWeightTrend(goalUuid, startTime, endTime)`
  - [ ] `useWeightComparison(goalUuid, timePoints)`

- [ ] **Task 2.2**: 创建 Mutation Hooks
  - [ ] `useUpdateKRWeight()`
  - [ ] 实现乐观更新逻辑
  - [ ] 实现 Query Invalidation

### 事件系统

- [ ] **Task 3.1**: 定义权重相关事件
  - [ ] 在 CrossPlatformEventBus 添加 `WEIGHT_UPDATED` 事件类型
  - [ ] 定义事件数据接口

---

## 🔧 技术实现细节

### WeightSnapshotClientApplicationService

```typescript
import { CrossPlatformEventBus } from '@dailyuse/utils';
import type { KeyResultWeightSnapshotServerDTO } from '@dailyuse/contracts';

export class WeightSnapshotClientApplicationService {
  constructor(
    private readonly apiClient: AxiosInstance,
    private readonly eventBus: CrossPlatformEventBus
  ) {}

  async updateKRWeight(
    goalUuid: string,
    krUuid: string,
    newWeight: number,
    reason?: string
  ): Promise<void> {
    const response = await this.apiClient.post(
      `/api/goals/${goalUuid}/key-results/${krUuid}/weight`,
      { newWeight, reason }
    );

    // 触发事件
    this.eventBus.emit('WEIGHT_UPDATED', {
      goalUuid,
      krUuid,
      newWeight,
      timestamp: Date.now(),
    });

    return response.data;
  }

  async getGoalSnapshots(
    goalUuid: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    snapshots: KeyResultWeightSnapshotServerDTO[];
    total: number;
  }> {
    const response = await this.apiClient.get(
      `/api/goals/${goalUuid}/weight-snapshots`,
      { params: { page, pageSize } }
    );
    return response.data.data;
  }

  async getWeightTrend(
    goalUuid: string,
    startTime: number,
    endTime: number
  ): Promise<any> {
    const response = await this.apiClient.get(
      `/api/goals/${goalUuid}/weight-trend`,
      { params: { startTime, endTime } }
    );
    return response.data.data;
  }
}
```

### React Query Hooks

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWeightSnapshotService } from './useWeightSnapshotService';

export function useGoalSnapshots(
  goalUuid: string,
  page: number = 1,
  pageSize: number = 20
) {
  const service = useWeightSnapshotService();
  
  return useQuery({
    queryKey: ['goal-snapshots', goalUuid, page, pageSize],
    queryFn: () => service.getGoalSnapshots(goalUuid, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateKRWeight() {
  const service = useWeightSnapshotService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalUuid,
      krUuid,
      newWeight,
      reason,
    }: {
      goalUuid: string;
      krUuid: string;
      newWeight: number;
      reason?: string;
    }) => service.updateKRWeight(goalUuid, krUuid, newWeight, reason),
    
    onSuccess: (_, variables) => {
      // Invalidate 相关查询
      queryClient.invalidateQueries({
        queryKey: ['goal-snapshots', variables.goalUuid],
      });
      queryClient.invalidateQueries({
        queryKey: ['kr-snapshots', variables.krUuid],
      });
      queryClient.invalidateQueries({
        queryKey: ['weight-trend', variables.goalUuid],
      });
    },
  });
}
```

---

## ✅ Definition of Done

- [ ] WeightSnapshotClientApplicationService 实现完成
- [ ] 所有 React Query hooks 实现完成
- [ ] 事件系统集成完成
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] TypeScript 编译无错误

---

## 📊 预估时间

| 任务 | 预估时间 |
|------|---------|
| Service 实现 | 2 小时 |
| React Query Hooks | 2.5 小时 |
| 事件系统集成 | 1 小时 |
| 单元测试 | 1.5 小时 |
| Code Review | 1 小时 |
| **总计** | **8 小时** |

**Story Points**: 3 SP

---

## 🔗 依赖关系

### 上游依赖
- STORY-GOAL-002-004 (API Endpoints) - 必须完成

### 下游依赖
- STORY-GOAL-002-006, 007, 008 (所有 UI Stories) 依赖此 Story

---

**Story 创建日期**: 2025-10-22  
**Story 创建者**: SM  
**最后更新**: 2025-10-22
