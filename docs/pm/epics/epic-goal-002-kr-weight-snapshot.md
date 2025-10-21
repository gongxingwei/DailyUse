# Epic: KR 权重快照

> **Epic ID**: EPIC-GOAL-002  
> **Feature Spec**: [GOAL-002](../modules/goal/features/02-kr-weight-snapshot.md)  
> **优先级**: P0  
> **RICE 评分**: 672 (最高)  
> **模块**: Goal  
> **Sprint**: Sprint 2  
> **状态**: Draft

---

## 📋 Epic 概述

### 业务价值

提供 KR（关键结果）权重调整的完整历史追溯能力，让目标管理更加透明和可审计。用户可以查看权重如何随时间演变，对比不同时期的权重分配策略，为目标复盘和优化提供数据支持。

**核心收益**:
- 📊 **历史追溯**: 完整记录每次权重调整，支持时间轴查看
- 📈 **趋势分析**: 可视化权重变化趋势，识别调整规律
- 🔍 **对比分析**: 对比不同时间点的权重分布，评估策略变化
- 🔄 **历史恢复**: 支持恢复到任意历史权重状态

### 目标用户

- **主要用户**: OKR 管理者、目标负责人
- **典型场景**: 
  - 季度中期发现某个 KR 权重过高，需调整并记录原因
  - 季度末复盘时查看权重调整历史
  - 对比初始权重分配与最终权重，分析策略变化

---

## 🎯 验收标准

### Epic 级别 AC

```gherkin
Feature: KR 权重快照
  作为 目标负责人
  我希望系统自动记录 KR 权重的每次变更
  以便追溯权重调整历史并进行对比分析

Scenario: 完整的权重快照流程
  Given 目标有 3 个 KR，权重分别为 30%, 40%, 30%
  When 用户将 KR1 权重从 30% 改为 50%
  And 将 KR2 权重从 40% 改为 20%
  Then 系统应自动创建 2 条权重快照
  And 每条快照记录 oldWeight → newWeight
  And 用户可在权重历史页面查看所有快照
  And 快照按时间倒序排列
  And 可以选择任意两个时间点进行对比
```

---

## 📦 User Stories 分解

### Story 1: Contracts & Domain 层 (3 SP)

**Story ID**: STORY-GOAL-002-001  
**标题**: 定义权重快照 Contracts 和 Domain 实体

**描述**:
```gherkin
As a 开发者
I want 定义权重快照的数据结构和领域实体
So that 前后端可以基于统一的契约开发
```

**任务清单**:
- [ ] 在 `packages/contracts` 创建 `KeyResultWeightSnapshotServerDTO`
- [ ] 定义 `SnapshotTrigger` 枚举 (manual/auto/restore/import)
- [ ] 更新 `GoalServerDTO` 添加 `weightSnapshots` 字段
- [ ] 在 `packages/domain-server` 创建 `KeyResultWeightSnapshot` 值对象
- [ ] Goal 聚合根添加 `recordWeightSnapshot()` 方法
- [ ] 编写单元测试（覆盖率 ≥ 80%）

**验收标准**:
```gherkin
Scenario: DTO 结构完整
  Given KeyResultWeightSnapshotServerDTO 已定义
  Then 应包含所有必需字段
  And 字段类型符合 TypeScript 严格模式
  And snapshotTime 使用 number 类型 (timestamp)
  And weightDelta 自动计算 (newWeight - oldWeight)

Scenario: Goal 聚合根方法正确
  Given Goal 实体已创建
  When 调用 recordWeightSnapshot(krUuid, oldWeight, newWeight)
  Then 应创建新的快照值对象
  And 快照包含正确的时间戳
  And 所有测试通过
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 2: Application Service - 快照创建 (3 SP)

**Story ID**: STORY-GOAL-002-002  
**标题**: 实现权重快照自动创建逻辑

**描述**:
```gherkin
As a 后端开发者
I want 在 KR 权重更新时自动创建快照
So that 每次权重变更都被完整记录
```

**任务清单**:
- [ ] 创建 `WeightSnapshotApplicationService`
- [ ] 实现 `createSnapshot(goalUuid, krUuid, oldWeight, newWeight, trigger)` 方法
- [ ] 在 `UpdateKeyResultService` 中集成快照创建
- [ ] 添加权重总和校验（确保 = 100%）
- [ ] 实现事务管理（权重更新 + 快照创建原子性）
- [ ] 编写集成测试

**验收标准**:
```gherkin
Scenario: 权重更新时自动创建快照
  Given 目标有 KR1 权重为 30%
  When 调用 updateKeyResultWeight(kr1Uuid, 50%)
  Then 应先创建快照记录 oldWeight=30, newWeight=50
  And 再更新 KR 的权重为 50%
  And 如果快照创建失败，权重更新也回滚

Scenario: 权重总和校验
  Given 目标有 3 个 KR，权重分别为 30%, 40%, 30%
  When 尝试将 KR1 权重改为 80%（导致总和 > 100%）
  Then 应抛出 InvalidWeightDistributionError
  And 不创建快照
  And KR1 权重保持 30% 不变
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 3: Infrastructure & Repository (2 SP)

**Story ID**: STORY-GOAL-002-003  
**标题**: 实现权重快照数据持久化

**描述**:
```gherkin
As a 后端开发者
I want 实现权重快照的数据库操作
So that 快照数据可以持久化存储和查询
```

**任务清单**:
- [ ] 创建 Prisma Schema (`KeyResultWeightSnapshot` 模型)
- [ ] 添加索引: `(goalUuid, snapshotTime DESC)`
- [ ] 运行 Prisma 迁移
- [ ] 实现 `WeightSnapshotRepository`
- [ ] 实现 `save(snapshot)` 方法
- [ ] 实现 `findByGoalUuid(goalUuid, options)` 方法
- [ ] 实现 `findByKeyResultUuid(krUuid)` 方法
- [ ] 编写 Repository 测试

**验收标准**:
```gherkin
Scenario: Schema 正确定义
  Given Prisma Schema 已更新
  Then KeyResultWeightSnapshot 模型包含所有字段
  And 设置了正确的外键关联 (Goal, KeyResult)
  And 索引已创建 (goalUuid, snapshotTime DESC)

Scenario: Repository 查询方法
  Given 目标有 5 条权重快照
  When 调用 findByGoalUuid(goalUuid, {limit: 3})
  Then 返回最新的 3 条快照
  And 按 snapshotTime 降序排列
  And 所有测试通过
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 4: API Endpoints (3 SP)

**Story ID**: STORY-GOAL-002-004  
**标题**: 创建权重快照查询 API

**描述**:
```gherkin
As a 前端开发者
I want 调用权重快照的 HTTP API
So that Web/Desktop 应用可以查询和展示快照历史
```

**任务清单**:
- [ ] 创建 `WeightSnapshotController`
- [ ] 实现 `GET /api/goals/:goalId/weight-snapshots` 端点（查询目标的所有快照）
- [ ] 实现 `GET /api/goals/:goalId/key-results/:krId/snapshots` 端点（查询单个 KR 的快照）
- [ ] 支持查询参数: `limit`, `offset`, `startTime`, `endTime`, `trigger`
- [ ] 添加请求验证（Zod schema）
- [ ] 添加权限检查（用户必须是目标成员）
- [ ] 编写 API 测试
- [ ] 更新 OpenAPI 文档

**验收标准**:
```gherkin
Scenario: GET 目标的权重快照
  Given 用户是目标成员
  And 目标有 10 条权重快照
  When 发送 GET /api/goals/:goalId/weight-snapshots?limit=5
  Then 返回 200 状态码
  And 响应体包含 5 条快照
  And 快照按 snapshotTime 降序排列

Scenario: 筛选快照
  Given 目标有多条快照
  When 发送 GET /api/goals/:goalId/weight-snapshots?trigger=manual&startTime=1698048000000
  Then 返回仅手动调整的快照
  And 快照时间 >= startTime

Scenario: 权限检查
  Given 用户不是目标成员
  When 发送任何请求
  Then 返回 403 状态码
  And 包含错误信息 "无权访问此目标"
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 5: Client Services (2 SP)

**Story ID**: STORY-GOAL-002-005  
**标题**: 实现权重快照客户端服务

**描述**:
```gherkin
As a 前端开发者
I want 封装权重快照的 HTTP 调用
So that UI 组件可以方便地获取快照数据
```

**任务清单**:
- [ ] 在 `packages/domain-client` 创建 `WeightSnapshotClientService`
- [ ] 实现 `getGoalSnapshots(goalUuid, options)` 方法
- [ ] 实现 `getKeyResultSnapshots(krUuid, options)` 方法
- [ ] 实现 `compareSnapshots(goalUuid, time1, time2)` 方法（对比分析）
- [ ] 集成 React Query（缓存、自动刷新）
- [ ] 添加错误处理
- [ ] 编写客户端测试

**验收标准**:
```gherkin
Scenario: 获取目标快照
  Given 用户已登录
  When 调用 getGoalSnapshots(goalUuid, {limit: 10})
  Then 发送 GET 请求到 API
  And 返回 KeyResultWeightSnapshotClientDTO 数组
  And 数据被 React Query 缓存（5 分钟）

Scenario: 对比两个时间点
  Given 目标在两个时间点的权重不同
  When 调用 compareSnapshots(goalUuid, time1, time2)
  Then 返回对比结果
  And 包含每个 KR 的权重变化量
  And 标记权重增加/减少/不变的 KR
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 6: UI Components - 快照列表 (3 SP)

**Story ID**: STORY-GOAL-002-006  
**标题**: 创建权重快照列表 UI 组件

**描述**:
```gherkin
As a 用户
I want 在目标详情页查看权重变化历史
So that 可以追溯每次权重调整
```

**任务清单**:
- [ ] 创建 `WeightSnapshotList.vue` 组件
- [ ] 实现时间轴式列表（显示所有快照）
- [ ] 每条快照显示: 时间、KR名称、旧权重 → 新权重、触发方式
- [ ] 支持按 KR 筛选（只看某个 KR 的历史）
- [ ] 支持按触发方式筛选（手动/自动/恢复）
- [ ] 集成 `WeightSnapshotClientService`
- [ ] 编写组件测试

**验收标准**:
```gherkin
Scenario: 查看权重历史
  Given 目标有 5 条权重快照
  When 用户打开目标详情页的"权重历史"标签
  Then 应显示所有 5 条快照
  And 按时间倒序排列（最新的在上）
  And 每条快照显示完整信息

Scenario: 筛选快照
  Given 快照列表已显示
  When 用户选择"只看 KR1 的历史"
  Then 列表仅显示 KR1 的快照
  And 其他 KR 的快照被隐藏

Scenario: 快照详情
  Given 快照列表已显示
  When 用户点击某条快照
  Then 弹出详情对话框
  And 显示完整的快照数据（包括操作人、原因等）
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 7: UI Components - 权重趋势图 (3 SP)

**Story ID**: STORY-GOAL-002-007  
**标题**: 创建权重变化趋势可视化

**描述**:
```gherkin
As a 用户
I want 通过折线图查看权重变化趋势
So that 可以直观地识别权重调整规律
```

**任务清单**:
- [ ] 创建 `WeightTrendChart.vue` 组件
- [ ] 使用 ECharts 或 Chart.js 绘制折线图
- [ ] X 轴: 时间，Y 轴: 权重百分比
- [ ] 支持多条折线（每个 KR 一条）
- [ ] 支持时间范围选择（最近 7 天/30 天/全部）
- [ ] 高亮显示权重调整点（标注具体数值）
- [ ] 编写组件测试

**验收标准**:
```gherkin
Scenario: 显示权重趋势图
  Given 目标有 3 个 KR
  And 过去 30 天有 8 次权重调整
  When 用户打开"权重趋势"标签
  Then 应显示折线图
  And 有 3 条折线（每个 KR 一条）
  And 每条折线颜色不同
  And 折线上标注关键调整点

Scenario: 交互功能
  Given 权重趋势图已显示
  When 用户鼠标悬停在某个数据点
  Then 显示 Tooltip
  And 包含: 时间、KR 名称、权重值
  
  When 用户点击某条折线
  Then 高亮该 KR
  And 其他 KR 变为半透明
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 8: UI Components - 权重对比 (4 SP)

**Story ID**: STORY-GOAL-002-008  
**标题**: 创建权重分布对比功能

**描述**:
```gherkin
As a 用户
I want 对比两个时间点的权重分布
So that 可以分析权重调整策略的变化
```

**任务清单**:
- [ ] 创建 `WeightComparisonView.vue` 组件
- [ ] 实现时间点选择器（两个日期选择框）
- [ ] 获取两个时间点的权重快照
- [ ] 并排显示两个饼图（或柱状图）
- [ ] 计算并显示权重变化量（KR1: +10%, KR2: -5%）
- [ ] 高亮显示权重增加/减少的 KR
- [ ] 支持导出对比报告（PDF/PNG）
- [ ] 编写组件测试

**验收标准**:
```gherkin
Scenario: 选择对比时间点
  Given 用户在权重对比页面
  When 选择 "目标创建时" 和 "当前"
  Then 系统获取两个时间点的权重快照
  And 显示并排的两个饼图

Scenario: 显示权重变化
  Given 对比图已显示
  Then 每个 KR 旁边显示权重变化
  And 权重增加的用绿色 ↑ 标识
  And 权重减少的用红色 ↓ 标识
  And 权重不变的用灰色 - 标识

Scenario: 详细分析
  Given 对比图已显示
  When 用户点击某个 KR
  Then 弹出详细分析
  And 显示该 KR 的完整权重历史
  And 解释权重变化的可能影响
```

**Story Points**: 4  
**预估工时**: 2 天

---

### Story 9: E2E Tests (2 SP)

**Story ID**: STORY-GOAL-002-009  
**标题**: 编写权重快照 E2E 测试

**描述**:
```gherkin
As a QA 工程师
I want 编写端到端测试
So that 确保权重快照功能在真实环境中正常工作
```

**任务清单**:
- [ ] 使用 Playwright 编写 E2E 测试
- [ ] 测试完整的权重调整 → 快照创建 → 历史查看流程
- [ ] 测试权重趋势图的渲染和交互
- [ ] 测试权重对比功能
- [ ] 测试边界情况（权重总和超 100%、负值等）
- [ ] 集成到 CI/CD Pipeline

**验收标准**:
```gherkin
Scenario: 完整的权重快照流程
  Given 用户创建了一个目标，有 3 个 KR
  When 用户修改 KR1 的权重从 30% 到 50%
  Then 权重立即更新
  And 快照自动创建
  
  When 用户打开"权重历史"标签
  Then 看到最新的快照记录
  And 显示 "30% → 50%"
  
  When 用户打开"权重趋势"标签
  Then 看到折线图正确显示新权重
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

## 📊 Story 统计

| Story ID | 标题 | SP | 工时 | 依赖 |
|----------|------|----|----|------|
| STORY-GOAL-002-001 | Contracts & Domain | 3 | 1-1.5d | - |
| STORY-GOAL-002-002 | Application Service | 3 | 1-1.5d | 001 |
| STORY-GOAL-002-003 | Infrastructure & Repository | 2 | 4-6h | 002 |
| STORY-GOAL-002-004 | API Endpoints | 3 | 1-1.5d | 003 |
| STORY-GOAL-002-005 | Client Services | 2 | 4-6h | 004 |
| STORY-GOAL-002-006 | UI - 快照列表 | 3 | 1-1.5d | 005 |
| STORY-GOAL-002-007 | UI - 权重趋势图 | 3 | 1-1.5d | 005 |
| STORY-GOAL-002-008 | UI - 权重对比 | 4 | 2d | 005 |
| STORY-GOAL-002-009 | E2E Tests | 2 | 4-6h | 006, 007, 008 |

**总计**: 25 SP, 预估 9-11 工作日（2 周）

---

## 🔗 技术依赖

### 内部依赖
- **Goal 模块基础**: 需要 Goal 和 KeyResult 实体已实现
- **用户认证**: 需要用户身份验证和权限检查

### 外部依赖
- **图表库**: ECharts 或 Chart.js
- **日期处理**: date-fns 或 dayjs

### 数据库 Schema

```prisma
model KeyResultWeightSnapshot {
  id              String   @id @default(uuid())
  uuid            String   @unique @default(uuid())
  
  goalUuid        String
  keyResultUuid   String
  
  oldWeight       Int      // 权重百分比 0-100
  newWeight       Int      // 权重百分比 0-100
  weightDelta     Int      // 变化量 (newWeight - oldWeight)
  
  snapshotTime    BigInt   // 快照时间
  trigger         String   // manual/auto/restore/import
  reason          String?  // 调整原因
  operatorUuid    String   // 操作人
  
  createdAt       BigInt
  
  goal            Goal     @relation(fields: [goalUuid], references: [uuid], onDelete: Cascade)
  keyResult       KeyResult @relation(fields: [keyResultUuid], references: [uuid], onDelete: Cascade)
  
  @@index([goalUuid, snapshotTime(sort: Desc)])
  @@index([keyResultUuid, snapshotTime(sort: Desc)])
  @@map("key_result_weight_snapshots")
}
```

---

## ✅ Epic Definition of Done

- [ ] 所有 9 个 Stories 状态为 Done
- [ ] 所有测试通过（单元 + 集成 + E2E）
- [ ] 代码覆盖率 ≥ 80%
- [ ] API 文档完整（OpenAPI）
- [ ] 权重总和校验通过（无数据不一致）
- [ ] 图表渲染性能 OK（< 500ms for 100 snapshots）
- [ ] 产品验收通过

---

## 🚀 发布计划

### Sprint 2 (Week 3-4)

**Week 3**:
- Day 1-2: Story 001-003 (Contracts + Application + Infrastructure)
- Day 3-4: Story 004-005 (API + Client Services)
- Day 5: Code Review & Fixes

**Week 4**:
- Day 1-2: Story 006-007 (UI - 列表 + 趋势图)
- Day 3-4: Story 008 (UI - 权重对比)
- Day 4: Story 009 (E2E Tests)
- Day 5: Final Testing & Bug Fixes

---

## 📝 注意事项

### 技术挑战

1. **权重总和校验**: 必须确保所有 KR 权重总和始终 = 100%
2. **快照性能**: 大量快照时的查询优化
3. **图表渲染**: 处理大量数据点时的性能

### 风险与缓解

| 风险 | 影响 | 缓解策略 |
|------|------|---------|
| 快照数据量过大 | 中 | 添加分页、时间范围筛选 |
| 权重总和不一致 | 高 | 事务管理、严格校验 |
| 图表渲染性能 | 中 | 数据采样、懒加载 |

---

*Epic 创建于: 2025-10-21*  
*下一步: 创建 EPIC-GOAL-003*
