# STORY-GOAL-002-004: KR 权重快照 - API Endpoints

> **Story ID**: STORY-GOAL-002-004  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 2a  
> **Story Points**: 4 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Backend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 前端开发者  
**我想要** REST API 端点来管理权重快照  
**以便于** 在客户端查询和展示权重变更历史

---

## 🎯 验收标准 (Acceptance Criteria)

### API 1: POST /api/goals/:goalUuid/key-results/:krUuid/weight

````gherkin
Scenario: 更新 KR 权重并自动创建快照
  Given 用户已登录且有权限
  When POST /api/goals/{goalUuid}/key-results/{krUuid}/weight
  And Request Body:
    ```json
    {
      "newWeight": 50,
      "reason": "季度中期调整"
    }
    ```
  Then 应该返回 200 OK
  And 应该创建权重快照
  And 应该更新 KR 权重
  And Response Body 包含更新后的 KR 信息

Scenario: 权重总和校验失败
  When 更新权重导致总和 ≠ 100
  Then 应该返回 400 Bad Request
  And Error Code 为 INVALID_WEIGHT_SUM
  And Error Message 包含详细权重信息
````

### API 2: GET /api/goals/:goalUuid/weight-snapshots

```gherkin
Scenario: 查询 Goal 的所有权重快照
  Given Goal 有多个权重快照
  When GET /api/goals/{goalUuid}/weight-snapshots?page=1&pageSize=20
  Then 应该返回 200 OK
  And Response Body 包含:
    - snapshots: 快照数组（按时间倒序）
    - total: 总数
    - page: 当前页
    - pageSize: 每页数量

Scenario: 支持分页查询
  Given Goal 有 50 个快照
  When GET /api/goals/{goalUuid}/weight-snapshots?page=2&pageSize=20
  Then 应该返回第 21-40 条记录

Scenario: 未授权访问
  Given 用户未登录
  When GET /api/goals/{goalUuid}/weight-snapshots
  Then 应该返回 401 Unauthorized
```

### API 3: GET /api/key-results/:krUuid/weight-snapshots

```gherkin
Scenario: 查询 KR 的权重快照历史
  Given KeyResult 有多个权重快照
  When GET /api/key-results/{krUuid}/weight-snapshots?page=1&pageSize=20
  Then 应该返回 200 OK
  And Response Body 包含快照列表（按时间倒序）
```

### API 4: GET /api/goals/:goalUuid/weight-trend

```gherkin
Scenario: 查询权重趋势数据
  Given Goal 有一段时间的权重变更历史
  When GET /api/goals/{goalUuid}/weight-trend?startTime=1640000000000&endTime=1672535999000
  Then 应该返回 200 OK
  And Response Body 包含:
    - timePoints: 时间点数组
    - krTrends: 每个 KR 的权重趋势数据
  And 数据按时间升序排列（用于绘制趋势图）

Scenario: 支持时间范围筛选
  When 指定 startTime 和 endTime
  Then 只返回该时间范围内的快照
```

### API 5: GET /api/goals/:goalUuid/weight-comparison

```gherkin
Scenario: 对比多个时间点的权重分配
  Given 需要对比不同时间点的权重
  When GET /api/goals/{goalUuid}/weight-comparison?timePoints=1640000000000,1656633600000,1672535999000
  Then 应该返回 200 OK
  And Response Body 包含:
    - keyResults: KR 列表
    - comparisons: 每个 KR 在各时间点的权重
    - deltas: 权重变化量

Scenario: 最多支持 5 个时间点对比
  When timePoints 参数超过 5 个
  Then 应该返回 400 Bad Request
  And Error Message 提示最多 5 个时间点
```

---

## 📋 任务清单 (Task Breakdown)

### API 实现任务

- [ ] **Task 1.1**: POST /api/goals/:goalUuid/key-results/:krUuid/weight
  - [ ] 创建 `updateKeyResultWeight` controller
  - [ ] 请求参数验证 (Zod schema)
  - [ ] 调用 UpdateKeyResultService.updateWeight()
  - [ ] 错误处理 (InvalidWeightSumError, GoalNotFoundError)
  - [ ] 返回更新后的 KR 信息

- [ ] **Task 1.2**: GET /api/goals/:goalUuid/weight-snapshots
  - [ ] 创建 `getGoalSnapshots` controller
  - [ ] 查询参数验证 (page, pageSize)
  - [ ] 调用 WeightSnapshotApplicationService
  - [ ] 分页响应格式化

- [ ] **Task 1.3**: GET /api/key-results/:krUuid/weight-snapshots
  - [ ] 创建 `getKeyResultSnapshots` controller
  - [ ] 参数验证和分页处理
  - [ ] 调用 Service 层方法

- [ ] **Task 1.4**: GET /api/goals/:goalUuid/weight-trend
  - [ ] 创建 `getWeightTrend` controller
  - [ ] 时间范围参数验证
  - [ ] 数据聚合和格式化（用于 ECharts）
  - [ ] 性能优化（大数据量采样）

- [ ] **Task 1.5**: GET /api/goals/:goalUuid/weight-comparison
  - [ ] 创建 `getWeightComparison` controller
  - [ ] 时间点参数验证（最多 5 个）
  - [ ] 查询各时间点快照
  - [ ] 计算权重变化量（delta）

### 中间件和验证

- [ ] **Task 2.1**: 创建请求验证 Schemas
  - [ ] UpdateWeightRequestSchema
  - [ ] SnapshotQuerySchema (分页参数)
  - [ ] WeightTrendQuerySchema (时间范围)
  - [ ] WeightComparisonQuerySchema (时间点数组)

- [ ] **Task 2.2**: 权限控制中间件
  - [ ] 验证用户是否有权限访问 Goal
  - [ ] 验证用户是否有权限修改 KR 权重

### 路由注册

- [ ] **Task 3.1**: 注册所有路由
  - [ ] 在 `apps/api/src/presentation/routes/goalRoutes.ts` 中添加
  - [ ] 应用认证中间件
  - [ ] 应用权限中间件

### 测试任务

- [ ] **Task 4.1**: 编写集成测试
  - [ ] 测试 POST /weight 成功场景
  - [ ] 测试 POST /weight 权重总和校验失败
  - [ ] 测试 GET /weight-snapshots 分页
  - [ ] 测试 GET /weight-trend 时间范围
  - [ ] 测试 GET /weight-comparison 多时间点
  - [ ] 测试未授权访问 (401)
  - [ ] 测试无权限访问 (403)

- [ ] **Task 4.2**: 性能测试
  - [ ] 测试大数据量查询性能 (1000+ 快照)
  - [ ] 测试趋势图数据采样
  - [ ] 验证 API P95 响应时间 < 500ms

---

## 🔧 技术实现细节

### API 1: 更新 KR 权重

**apps/api/src/presentation/controllers/goal/updateKeyResultWeight.ts**:

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { UpdateKeyResultService } from '../../../application/goal/UpdateKeyResultService';
import { InvalidWeightSumError } from '../../../application/goal/errors';

const UpdateWeightRequestSchema = z.object({
  newWeight: z.number().min(0).max(100),
  reason: z.string().optional(),
});

export async function updateKeyResultWeight(req: Request, res: Response): Promise<void> {
  try {
    // 1. 参数验证
    const { goalUuid, krUuid } = req.params;
    const body = UpdateWeightRequestSchema.parse(req.body);
    const operatorUuid = req.user!.uuid; // 从认证中间件获取

    // 2. 调用 Service
    const service = req.container.resolve(UpdateKeyResultService);
    await service.updateWeight(krUuid, body.newWeight, operatorUuid, body.reason);

    // 3. 返回成功
    res.status(200).json({
      success: true,
      message: 'Weight updated successfully',
    });
  } catch (error) {
    if (error instanceof InvalidWeightSumError) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    } else {
      throw error; // 交给全局错误处理器
    }
  }
}
```

### API 2: 查询 Goal 快照

**apps/api/src/presentation/controllers/goal/getGoalSnapshots.ts**:

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { WeightSnapshotApplicationService } from '../../../application/goal/WeightSnapshotApplicationService';

const SnapshotQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getGoalSnapshots(req: Request, res: Response): Promise<void> {
  // 1. 参数验证
  const { goalUuid } = req.params;
  const query = SnapshotQuerySchema.parse(req.query);

  // 2. 调用 Service
  const service = req.container.resolve(WeightSnapshotApplicationService);
  const result = await service.getSnapshotsByGoal(goalUuid, {
    page: query.page,
    pageSize: query.pageSize,
  });

  // 3. 格式化响应
  res.status(200).json({
    success: true,
    data: {
      snapshots: result.snapshots.map((s) => s.toServerDTO()),
      pagination: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    },
  });
}
```

### API 4: 权重趋势图数据

**apps/api/src/presentation/controllers/goal/getWeightTrend.ts**:

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { WeightSnapshotApplicationService } from '../../../application/goal/WeightSnapshotApplicationService';
import { GoalRepository } from '../../../domain/goal/repositories/GoalRepository';

const WeightTrendQuerySchema = z.object({
  startTime: z.coerce.number().int().positive(),
  endTime: z.coerce.number().int().positive(),
});

export async function getWeightTrend(req: Request, res: Response): Promise<void> {
  // 1. 参数验证
  const { goalUuid } = req.params;
  const query = WeightTrendQuerySchema.parse(req.query);

  // 2. 查询快照
  const service = req.container.resolve(WeightSnapshotApplicationService);
  const { snapshots } = await service.getSnapshotsByTimeRange(
    query.startTime,
    query.endTime,
    { page: 1, pageSize: 1000 }, // 最多取 1000 个点
  );

  // 3. 聚合数据（按 KR 分组）
  const goalRepo = req.container.resolve(GoalRepository);
  const goal = await goalRepo.findByUuid(goalUuid);

  const krTrends: Record<string, Array<{ time: number; weight: number }>> = {};
  goal.keyResults.forEach((kr) => {
    krTrends[kr.uuid] = [];
  });

  snapshots.forEach((snapshot) => {
    if (krTrends[snapshot.keyResultUuid]) {
      krTrends[snapshot.keyResultUuid].push({
        time: snapshot.snapshotTime,
        weight: snapshot.newWeight,
      });
    }
  });

  // 4. 格式化为 ECharts 数据格式
  res.status(200).json({
    success: true,
    data: {
      timePoints: snapshots.map((s) => s.snapshotTime),
      keyResults: goal.keyResults.map((kr) => ({
        uuid: kr.uuid,
        title: kr.title,
        data: krTrends[kr.uuid],
      })),
    },
  });
}
```

### API 5: 权重对比

**apps/api/src/presentation/controllers/goal/getWeightComparison.ts**:

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { WeightSnapshotRepository } from '../../../domain/goal/repositories/WeightSnapshotRepository';
import { GoalRepository } from '../../../domain/goal/repositories/GoalRepository';

const WeightComparisonQuerySchema = z.object({
  timePoints: z
    .string()
    .transform((str) => str.split(',').map(Number))
    .refine((arr) => arr.length >= 2 && arr.length <= 5, {
      message: 'Must provide 2-5 time points',
    }),
});

export async function getWeightComparison(req: Request, res: Response): Promise<void> {
  // 1. 参数验证
  const { goalUuid } = req.params;
  const query = WeightComparisonQuerySchema.parse(req.query);

  // 2. 查询各时间点快照
  const snapshotRepo = req.container.resolve(WeightSnapshotRepository);
  const goalRepo = req.container.resolve(GoalRepository);
  const goal = await goalRepo.findByUuid(goalUuid);

  // 3. 构建对比数据
  const comparisons: Array<{
    krUuid: string;
    krTitle: string;
    weights: number[];
    deltas: number[];
  }> = [];

  for (const kr of goal.keyResults) {
    const weights: number[] = [];

    for (const timePoint of query.timePoints) {
      // 查询该时间点之前最近的快照
      const { snapshots } = await snapshotRepo.findByTimeRange(0, timePoint, 1, 1);
      weights.push(snapshots[0]?.newWeight ?? kr.weight);
    }

    // 计算 delta (相对于第一个时间点)
    const deltas = weights.map((w) => w - weights[0]);

    comparisons.push({
      krUuid: kr.uuid,
      krTitle: kr.title,
      weights,
      deltas,
    });
  }

  // 4. 返回数据
  res.status(200).json({
    success: true,
    data: {
      timePoints: query.timePoints,
      comparisons,
    },
  });
}
```

### 路由注册

**apps/api/src/presentation/routes/goalRoutes.ts** (新增部分):

```typescript
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorizeGoalAccess } from '../middlewares/authorizeGoalAccess';
import { updateKeyResultWeight } from '../controllers/goal/updateKeyResultWeight';
import { getGoalSnapshots } from '../controllers/goal/getGoalSnapshots';
import { getKeyResultSnapshots } from '../controllers/goal/getKeyResultSnapshots';
import { getWeightTrend } from '../controllers/goal/getWeightTrend';
import { getWeightComparison } from '../controllers/goal/getWeightComparison';

const router = Router();

// 更新 KR 权重
router.post(
  '/goals/:goalUuid/key-results/:krUuid/weight',
  authenticate,
  authorizeGoalAccess('write'),
  updateKeyResultWeight,
);

// 查询 Goal 快照
router.get(
  '/goals/:goalUuid/weight-snapshots',
  authenticate,
  authorizeGoalAccess('read'),
  getGoalSnapshots,
);

// 查询 KR 快照
router.get('/key-results/:krUuid/weight-snapshots', authenticate, getKeyResultSnapshots);

// 权重趋势图
router.get(
  '/goals/:goalUuid/weight-trend',
  authenticate,
  authorizeGoalAccess('read'),
  getWeightTrend,
);

// 权重对比
router.get(
  '/goals/:goalUuid/weight-comparison',
  authenticate,
  authorizeGoalAccess('read'),
  getWeightComparison,
);

export default router;
```

---

## ✅ Definition of Done

### 功能完整性

- [ ] 所有 5 个 API 端点实现完成
- [ ] 请求参数验证完成 (Zod schemas)
- [ ] 响应格式统一且正确
- [ ] 错误处理完整

### 代码质量

- [ ] TypeScript strict 模式无错误
- [ ] ESLint 无警告
- [ ] 所有 API 有 JSDoc 注释
- [ ] 路由正确注册

### 测试

- [ ] 所有集成测试通过
- [ ] 测试覆盖成功和失败场景
- [ ] 测试覆盖权限控制
- [ ] 性能测试通过 (P95 < 500ms)

### 文档

- [ ] API 文档更新 (Swagger/OpenAPI)
- [ ] 示例请求和响应

### Code Review

- [ ] Code Review 完成
- [ ] Code Review 反馈已解决

---

## 📊 预估时间

| 任务                     | 预估时间    |
| ------------------------ | ----------- |
| API 1-3 实现             | 3 小时      |
| API 4-5 实现（数据聚合） | 2 小时      |
| 请求验证 Schemas         | 1 小时      |
| 路由注册和中间件         | 0.5 小时    |
| 集成测试编写             | 2.5 小时    |
| 性能测试                 | 1 小时      |
| API 文档更新             | 1 小时      |
| Code Review & 修复       | 1 小时      |
| **总计**                 | **12 小时** |

**Story Points**: 4 SP

---

## 🔗 依赖关系

### 上游依赖

- STORY-GOAL-002-002 (Application Service) - 必须完成
- STORY-GOAL-002-003 (Repository) - 必须完成

### 下游依赖

- STORY-GOAL-002-005 (客户端服务) 依赖此 Story 提供 API

---

## 🚨 风险与注意事项

### 技术风险

1. **大数据量性能**: 权重趋势图可能涉及大量快照
   - 缓解: 实现数据采样算法，限制返回点数
2. **并发更新冲突**: 多用户同时更新权重
   - 缓解: 使用乐观锁或数据库事务

### API 设计风险

1. **分页性能**: 大偏移量分页性能差
   - 缓解: 考虑使用游标分页（后续优化）

---

**Story 创建日期**: 2025-10-22  
**Story 创建者**: SM  
**最后更新**: 2025-10-22
