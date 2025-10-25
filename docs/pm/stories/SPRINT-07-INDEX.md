# Sprint 7 Stories Index

> **Sprint**: Sprint 7  
> **Duration**: 2025-11-19 ~ 2025-12-02 (2 weeks)  
> **Theme**: EPIC-GOAL-002 完成 + 技术债务清理  
> **Total Story Points**: 20 SP  
> **Status**: ✅ Planning Complete

---

## 📋 Sprint 7 概述

Sprint 7 继续完成 EPIC-GOAL-002 (KR 权重快照) 的剩余 Stories (001-004, 008-009)，并补充 Sprint 5/6 延期的单元测试工作，确保权重快照功能的完整性和质量。

**Sprint 目标**: 
> 完成 EPIC-GOAL-002 的所有功能开发，补充单元测试覆盖，达到生产就绪状态。

---

## 🎯 Sprint 7 Stories

### Part A: EPIC-GOAL-002 后端完成 (8 SP)

#### STORY-GOAL-002-001: Contracts & Domain (3 SP) - P0

**文件**: [STORY-GOAL-002-001.md](./STORY-GOAL-002-001.md)  
**负责人**: Backend Developer  
**状态**: To Do  
**Week**: Week 1 Day 1-2 (2025-11-19 ~ 2025-11-20)

**目标**:
- 定义 KeyResultWeightSnapshotServerDTO
- 定义 SnapshotTrigger 枚举 (manual/auto/restore/import)
- 创建 KeyResultWeightSnapshot 值对象
- 扩展 Goal 聚合根添加 recordWeightSnapshot() 方法
- 编写单元测试（覆盖率 ≥ 80%）

**验收标准**:
- ✅ DTO 包含所有必需字段 (uuid, goalUuid, krUuid, oldWeight, newWeight, weightDelta, trigger, reason, snapshotTime)
- ✅ WeightSnapshot 值对象实现完整 (validateWeights, toServerDTO, fromServerDTO)
- ✅ Goal 聚合根支持快照记录
- ✅ 单元测试覆盖率 ≥ 80%

**依赖**: 无

---

#### STORY-GOAL-002-002: Application Service (3 SP) - P0

**文件**: [STORY-GOAL-002-002.md](./STORY-GOAL-002-002.md)  
**负责人**: Backend Developer  
**状态**: To Do  
**Week**: Week 1 Day 2-3 (2025-11-20 ~ 2025-11-21)

**目标**:
- 创建 WeightSnapshotApplicationService
- 实现 createSnapshot() 方法
- 在 UpdateKeyResultService 中集成快照创建
- 实现权重总和校验（= 100%）
- 实现事务管理（原子性）
- 编写集成测试

**验收标准**:
- ✅ 权重更新时自动创建快照
- ✅ 权重总和校验正确（所有 KR 权重总和 = 100%）
- ✅ 事务管理确保数据一致性（失败回滚）
- ✅ 所有集成测试通过

**依赖**: STORY-GOAL-002-001

---

#### STORY-GOAL-002-003: Infrastructure & Repository (2 SP) - P0

**文件**: [STORY-GOAL-002-003.md](./STORY-GOAL-002-003.md)  
**负责人**: Backend Developer  
**状态**: To Do  
**Week**: Week 1 Day 3-4 (2025-11-21 ~ 2025-11-22)

**目标**:
- 创建 Prisma Schema (KeyResultWeightSnapshot 模型)
- 添加索引 (goalUuid, keyResultUuid, snapshotTime DESC)
- 运行 Prisma 迁移
- 实现 PrismaWeightSnapshotRepository
- 实现 PrismaWeightSnapshotMapper
- 实现查询方法 (findByGoalUuid, findByKeyResultUuid, findByTimeRange)
- 编写 Repository 集成测试

**验收标准**:
- ✅ Prisma Schema 正确定义，索引已创建
- ✅ Repository 查询方法实现（支持分页、时间范围筛选、trigger 筛选）
- ✅ Mapper 双向转换正确（Prisma ↔ Domain）
- ✅ 所有 Repository 测试通过

**依赖**: STORY-GOAL-002-002

---

### Part B: EPIC-GOAL-002 API 层 (3 SP)

#### STORY-GOAL-002-004: API Endpoints (3 SP) - P0

**文件**: [STORY-GOAL-002-004.md](./STORY-GOAL-002-004.md)  
**负责人**: Backend Developer  
**状态**: To Do  
**Week**: Week 1 Day 4-5 (2025-11-22 ~ 2025-11-23)

**目标**:
- 创建 WeightSnapshotController
- 实现 5 个 RESTful 端点:
  1. `POST /api/goals/:goalUuid/key-results/:krUuid/weight` - 更新权重（自动创建快照）
  2. `GET /api/goals/:goalUuid/weight-snapshots` - 查询目标的所有快照
  3. `GET /api/key-results/:krUuid/weight-snapshots` - 查询单个 KR 的快照
  4. `GET /api/goals/:goalUuid/weight-trend` - 获取权重趋势数据
  5. `GET /api/goals/:goalUuid/weight-comparison` - 获取权重对比数据
- 支持查询参数 (limit, offset, startTime, endTime, trigger)
- 添加 Zod 验证和权限检查
- 编写 API 测试
- 更新 Swagger 文档

**验收标准**:
- ✅ 5 个 REST 端点实现
- ✅ 查询参数验证正确（Zod Schema）
- ✅ 权限检查实现（authMiddleware）
- ✅ API 测试通过（Postman/Thunder Client）
- ✅ Swagger 文档更新

**依赖**: STORY-GOAL-002-003

---

### Part C: EPIC-GOAL-002 UI 增强 (4 SP)

#### STORY-GOAL-002-008: UI - 权重对比视图 (4 SP) - P1

**文件**: [STORY-GOAL-002-008.md](./STORY-GOAL-002-008.md)  
**负责人**: Frontend Developer  
**状态**: To Do  
**Week**: Week 2 Day 1-3 (2025-11-25 ~ 2025-11-27)

**目标**:
- 增强 WeightComparison.vue 组件（已有基础实现）
- 实现多时间点选择器（最多选择 5 个时间点）
- 实现并排对比视图（柱状图 + 雷达图）
- 实现数据表格视图（详细数值对比）
- 高亮显示权重变化（增加绿色 / 减少红色）
- 实现导出对比报告（PNG/PDF）
- 编写组件测试

**验收标准**:
- ✅ 时间点选择器支持多选（最多 5 个）
- ✅ 柱状图和雷达图正确显示权重对比
- ✅ 数据表格显示完整（时间、KR、权重、变化量）
- ✅ 权重变化颜色编码正确
- ✅ 导出功能可用（PNG/PDF）
- ✅ 响应式设计（移动端友好）

**依赖**: STORY-GOAL-002-004, STORY-GOAL-002-005, STORY-GOAL-002-006

---

### Part D: EPIC-GOAL-002 测试完成 (3 SP)

#### STORY-GOAL-002-009: E2E Tests & Documentation (3 SP) - P1

**文件**: [STORY-GOAL-002-009.md](./STORY-GOAL-002-009.md)  
**负责人**: QA / Frontend Developer  
**状态**: To Do  
**Week**: Week 2 Day 3-4 (2025-11-27 ~ 2025-11-28)

**目标**:
- 编写 E2E 测试（使用 Playwright）
- 测试完整的用户流程（权重更新 → 查看历史 → 趋势分析 → 权重对比）
- 编写 API 文档（OpenAPI/Swagger）
- 编写用户使用文档（README）
- 性能测试（100+ 快照数据）
- 验收测试

**验收标准**:
- ✅ E2E 测试覆盖所有核心流程（至少 5 个测试场景）
- ✅ API 文档完整（OpenAPI 3.0）
- ✅ 用户文档完整（使用说明 + 截图）
- ✅ 性能测试通过（查询 100 快照 < 500ms，图表渲染 < 500ms）
- ✅ 产品验收通过

**依赖**: STORY-GOAL-002-008

---

### Part E: 技术债务清理 (2 SP)

#### TASK-SPRINT5-002: 单元测试补充 (2 SP) - P0

**文件**: [TASK-SPRINT5-002.md](./TASK-SPRINT5-002.md)  
**负责人**: Frontend Developer  
**状态**: To Do (Deferred from Sprint 6)  
**Week**: Week 2 Day 4-5 (2025-11-28 ~ 2025-11-29)

**目标**:
- 修正 scheduleApiClient.spec.ts 类型错误
- 运行并验证 API Client 测试通过（15-20 tests）
- 实现 useSchedule composable 单元测试（3-5 tests）
- 补充 PrismaScheduleRepository 集成测试（可选）

**验收标准**:
- ✅ API Client 测试: 类型错误修正，所有测试通过
- ✅ Composable 测试: 核心功能覆盖，所有测试通过
- ✅ 测试覆盖率 ≥ 70%

**依赖**: 无

---

## 📊 Sprint 7 统计

### Story Points 分布

| Category | Stories | Story Points | Percentage |
|----------|---------|--------------|------------|
| EPIC-GOAL-002 后端 (001-004) | 4 stories | 11 SP | 55% |
| EPIC-GOAL-002 前端 (008) | 1 story | 4 SP | 20% |
| EPIC-GOAL-002 测试 (009) | 1 story | 3 SP | 15% |
| 技术债务 (TASK-SPRINT5-002) | 1 task | 2 SP | 10% |
| **Total** | **7 items** | **20 SP** | **100%** |

### 优先级分布

| Priority | Stories | Story Points | Percentage |
|----------|---------|--------------|------------|
| P0 (Must Have) | 5 items | 13 SP | 65% |
| P1 (Should Have) | 2 items | 7 SP | 35% |
| **Total** | **7 items** | **20 SP** | **100%** |

### 技术栈分布

| Role | Stories | Story Points | Percentage |
|------|---------|--------------|------------|
| Backend Developer | 4 items | 11 SP | 55% |
| Frontend Developer | 3 items | 9 SP | 45% |
| **Total** | **7 items** | **20 SP** | **100%** |

---

## 📅 Sprint 7 时间表

### Week 1 (2025-11-19 ~ 2025-11-23): 后端完成 (11 SP)

| Day | Date | Story | SP | Owner | Status |
|-----|------|-------|----|----|--------|
| Tue | 11-19 | STORY-GOAL-002-001 (1/2) | 1.5 | Backend | To Do |
| Wed | 11-20 | STORY-001 (2/2) + 002 (1/2) | 1.5+1.5 | Backend | To Do |
| Thu | 11-21 | STORY-002 (2/2) + 003 | 1.5+2 | Backend | To Do |
| Fri | 11-22 | STORY-004 (1/2) | 1.5 | Backend | To Do |
| Sat | 11-23 | STORY-004 (2/2) | 1.5 | Backend | To Do |

**Week 1 Deliverables**:
- ✅ Contracts & Domain 层完整 (Story 001)
- ✅ Application Service 完整 (Story 002)
- ✅ Infrastructure & Repository 完整 (Story 003)
- ✅ API Endpoints 完整 (Story 004)
- ✅ 后端所有单元/集成测试通过
- ✅ API 文档初版完成

---

### Week 2 (2025-11-25 ~ 2025-11-29): 前端增强 + 测试 (9 SP)

| Day | Date | Story | SP | Owner | Status |
|-----|------|-------|----|----|--------|
| Mon | 11-25 | STORY-GOAL-002-008 (1/3) | 1.5 | Frontend | To Do |
| Tue | 11-26 | STORY-008 (2/3) | 1.5 | Frontend | To Do |
| Wed | 11-27 | STORY-008 (3/3) + 009 (1/3) | 1+1 | Frontend | To Do |
| Thu | 11-28 | STORY-009 (2/3) + TASK-SPRINT5-002 | 1+2 | Frontend | To Do |
| Fri | 11-29 | STORY-009 (3/3) + Sprint Review | 1 | Team | To Do |

**Week 2 Deliverables**:
- ✅ 权重对比视图完整 (Story 008)
- ✅ E2E 测试完成 (Story 009)
- ✅ API & 用户文档完整
- ✅ Schedule 模块单元测试补充 (TASK-SPRINT5-002)
- ✅ EPIC-GOAL-002 完全完成
- ✅ Sprint Review & Retrospective

---

## 🎯 Sprint 7 目标 (Sprint Goal)

> **完成 EPIC-GOAL-002 的所有开发工作，包括后端基础层、API 层、前端增强和完整测试，达到生产就绪状态。同时清理 Sprint 5/6 遗留的技术债务，确保代码质量。**

**业务价值**:
- 📊 KR 权重快照功能 100% 完成（9/9 Stories）
- ✅ 后端架构完整（Domain → Application → Infrastructure → API）
- ✅ 前端体验完善（列表 + 趋势图 + 对比分析）
- ✅ 测试覆盖完整（单元 + 集成 + E2E）
- ✅ 技术债务清零（Schedule 模块测试补充）

---

## ✅ Definition of Done

每个 Story 必须满足以下条件才能标记为 "Done":

### 代码质量
- [ ] 所有 TypeScript 编译无错误（`pnpm typecheck`）
- [ ] ESLint 无 error 级别警告（`pnpm lint`）
- [ ] 代码符合 DDD + Clean Architecture 分层原则
- [ ] 所有 public 方法有 JSDoc 注释

### 测试要求
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 所有测试通过 (`pnpm test`)
- [ ] 关键路径有集成测试
- [ ] E2E 测试覆盖核心流程（Story 009）

### 文档要求
- [ ] Story 文件更新状态为 "Done"
- [ ] 添加 "Dev Agent Record" 章节
- [ ] API 端点更新 Swagger 文档
- [ ] UI 组件有使用示例

### 集成要求
- [ ] 与现有模块集成无冲突
- [ ] 数据库迁移已运行
- [ ] 所有依赖项已安装
- [ ] 前后端联调通过

---

## ⚠️ 风险管理

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 后端开发延期 | 中 (30%) | 高 | Week 1 集中后端，前端可并行开发 Story 008 |
| 权重校验逻辑复杂 | 低 (20%) | 中 | 充分的单元测试，边界条件测试，使用 TDD |
| E2E 测试环境配置 | 中 (40%) | 中 | 使用 Playwright，预先配置好测试环境 |
| 导出功能实现困难 | 中 (30%) | 低 | 使用现成库（html2canvas/jsPDF），可降级为 PNG only |
| Week 1 后端任务重 | 高 (50%) | 中 | Story 004 可延伸到 Week 2 Day 1，前端提前开始 |

---

## 📚 相关文档

- [Sprint 7 执行计划](../sprints/sprint-07-plan.md)
- [EPIC-GOAL-002: KR 权重快照](../epics/epic-goal-002-kr-weight-snapshot.md)
- [Sprint 6 完成报告](../../SPRINT-06-COMPLETION-REPORT.md)
- [Sprint 6 Index](./SPRINT-06-INDEX.md)

---

## 🎓 Sprint 7 里程碑意义

**Epic 完整交付**: EPIC-GOAL-002 (RICE: 672) 从规划到交付完整闭环

**技术债务清零**: Sprint 5/6 遗留的测试工作全部完成

**架构成熟度验证**: DDD + Clean Architecture 在完整 Epic 中验证成功

**质量保障提升**: 单元 + 集成 + E2E 三层测试体系建立

**团队能力提升**: 后端 → 前端 → 测试的完整交付能力

---

## 📈 Sprint 7 之后

### Epic 完成状态（Sprint 7 后）

| Epic ID | Name | Status | SP Completed | Notes |
|---------|------|--------|--------------|-------|
| EPIC-GOAL-002 | KR 权重快照 | ✅ **Done** | 18/18 SP | Sprint 6-7 完成 |
| EPIC-SETTING-001 | 用户偏好设置 | ✅ Done | - | Sprint 1 完成 |
| EPIC-GOAL-003 | 专注模式 | Draft | 0/16 SP | 待规划 |
| EPIC-GOAL-004 | 进度自动计算 | Draft | 0/14 SP | 待规划 |
| EPIC-TASK-001 | 依赖关系图 | Draft | 0/18 SP | 待规划 |
| EPIC-TASK-002 | 优先级矩阵 | Draft | 0/12 SP | 待规划 |

### Sprint 8 候选主题

**Option 1: EPIC-GOAL-003 - 专注模式** (16 SP)
- 优先级: P0
- RICE: 560
- 业务价值: 提升目标执行效率
- 技术复杂度: 中

**Option 2: EPIC-TASK-002 - 优先级矩阵** (12 SP)
- 优先级: P0
- RICE: 448
- 业务价值: 任务管理增强
- 技术复杂度: 低-中

**Option 3: EPIC-GOAL-004 - 进度自动计算** (14 SP)
- 优先级: P1
- RICE: 420
- 业务价值: 目标管理完善
- 技术复杂度: 中

**建议**: 选择 **EPIC-GOAL-003 (专注模式)** 作为 Sprint 8 主题
- 理由 1: RICE 评分最高 (560)
- 理由 2: 与 EPIC-GOAL-002 功能连贯性强（目标管理模块）
- 理由 3: 用户价值明显（提升执行效率）
- 理由 4: 技术复杂度适中（适合团队节奏）

---

**Created**: 2025-10-25  
**Status**: ✅ Planning Complete  
**Next Sprint**: Sprint 8 (建议 EPIC-GOAL-003)
