# Sprint 2a Story 索引

> **Sprint ID**: Sprint 2a  
> **Sprint 周期**: Week 3-4 (2025-11-03 ~ 2025-11-14)  
> **Sprint 目标**: 实现 KR 权重快照功能 (GOAL-002)  
> **Total Story Points**: 25 SP  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **状态**: Planning

---

## 📋 Story 清单

| Story ID | Story 名称 | SP | 优先级 | 负责人 | 状态 | 依赖 |
|----------|-----------|----:|--------|--------|------|------|
| [STORY-GOAL-002-001](./STORY-GOAL-002-001.md) | Contracts & Domain 层 | 3 | P0 | Backend | To Do | 无 |
| [STORY-GOAL-002-002](./STORY-GOAL-002-002.md) | Application Service | 3 | P0 | Backend | To Do | 001 |
| [STORY-GOAL-002-003](./STORY-GOAL-002-003.md) | Repository & Infrastructure | 3 | P0 | Backend | To Do | 001 |
| [STORY-GOAL-002-004](./STORY-GOAL-002-004.md) | API Endpoints | 4 | P0 | Backend | To Do | 002, 003 |
| [STORY-GOAL-002-005](./STORY-GOAL-002-005.md) | 客户端服务层 | 3 | P0 | Frontend | To Do | 004 |
| [STORY-GOAL-002-006](./STORY-GOAL-002-006.md) | UI - 权重快照列表 | 3 | P0 | Frontend | To Do | 005 |
| [STORY-GOAL-002-007](./STORY-GOAL-002-007.md) | UI - 权重趋势图 | 3 | P1 | Frontend | To Do | 005 |
| [STORY-GOAL-002-008](./STORY-GOAL-002-008.md) | UI - 权重对比视图 | 2 | P2 | Frontend | To Do | 005 |
| [STORY-GOAL-002-009](./STORY-GOAL-002-009.md) | Spike - DAG 可视化调研 | 1 | P2 | Tech Lead | To Do | 无 |

**Total**: 9 Stories, 25 Story Points

---

## 🎯 Sprint 目标详解

**核心目标**: 为 Goal 模块添加 KR 权重快照功能，实现权重变更的完整历史追溯和可视化分析。

**价值交付**:
- ✅ 用户可以查看 KR 权重的完整变更历史
- ✅ 支持权重趋势图和时间点对比分析
- ✅ 建立 Goal 模块的基础架构（为 Sprint 2b 铺路）
- ✅ 完成 DAG 可视化技术 Spike（为 Sprint 4 铺路）

---

## 📊 Story 依赖图

```
STORY-001 (Contracts & Domain)
    ↓
    ├─→ STORY-002 (Application Service)
    │       ↓
    ├─→ STORY-003 (Repository)
    │       ↓
    │   STORY-004 (API Endpoints)
    │       ↓
    └─→ STORY-005 (Client Services)
            ↓
            ├─→ STORY-006 (UI - 列表)
            ├─→ STORY-007 (UI - 趋势图)
            └─→ STORY-008 (UI - 对比)

STORY-009 (DAG Spike) - 独立并行任务
```

---

## 🏗️ 架构分层

### Backend Stories (13 SP)
1. **STORY-001**: Contracts & Domain 层 (3 SP)
   - 定义 `KeyResultWeightSnapshotServerDTO`
   - 实现 `KeyResultWeightSnapshot` 值对象
   - 创建 Zod 验证器

2. **STORY-002**: Application Service (3 SP)
   - 实现 `WeightSnapshotApplicationService`
   - 集成到 `UpdateKeyResultService`
   - 实现权重总和校验逻辑

3. **STORY-003**: Repository & Infrastructure (3 SP)
   - Prisma Schema 添加 `KeyResultWeightSnapshot` 表
   - 实现 `WeightSnapshotRepository`
   - 数据库迁移和测试

4. **STORY-004**: API Endpoints (4 SP)
   - 实现 5 个 REST API 端点
   - 添加权限控制和参数验证
   - 编写集成测试

### Frontend Stories (11 SP)
5. **STORY-005**: 客户端服务层 (3 SP)
   - 实现 `WeightSnapshotClientApplicationService`
   - 使用 React Query 管理状态
   - 实现实时事件监听

6. **STORY-006**: UI - 权重快照列表 (3 SP)
   - 实现 `WeightSnapshotListView` 组件
   - 支持分页、筛选、搜索
   - Element Plus Table 集成

7. **STORY-007**: UI - 权重趋势图 (3 SP)
   - 实现 ECharts 权重趋势折线图
   - 支持时间范围筛选
   - 性能优化（数据采样）

8. **STORY-008**: UI - 权重对比视图 (2 SP)
   - 实现时间点权重对比表格
   - 支持多时间点对比
   - 高亮权重变化

### Research Stories (1 SP)
9. **STORY-009**: DAG 可视化 Spike (1 SP)
   - 调研 3 种可视化方案（ELK.js, Cytoscape.js, D3-DAG）
   - 性能测试（1000+ 节点）
   - 输出技术决策文档（ADR-002）

---

## 🚀 开发顺序建议

### Week 3 (Nov 3-7): 后端开发 + DAG Spike
- **Day 1 (Mon)**: STORY-001 ✅
- **Day 2 (Tue)**: STORY-002 ✅
- **Day 3 (Wed)**: STORY-003 ✅
- **Day 4 (Thu)**: STORY-004 (上半天) ✅
- **Day 4-5 (Thu-Fri)**: STORY-009 (DAG Spike 并行) ✅
- **Day 5 (Fri)**: STORY-004 (下半天) ✅

### Week 4 (Nov 10-14): 前端开发 + 集成测试
- **Day 6 (Mon)**: STORY-005 ✅
- **Day 7 (Tue)**: STORY-006 ✅
- **Day 8 (Wed)**: STORY-007 ✅
- **Day 9 (Thu)**: STORY-008 ✅
- **Day 10 (Fri)**: E2E 测试 + Sprint Review ✅

---

## ✅ Sprint 完成标准

### 功能完整性
- [ ] 所有 9 个 Stories 状态为 Done
- [ ] 5 个 API 端点全部实现并通过测试
- [ ] 3 个 UI 视图全部实现并可用
- [ ] DAG Spike 报告完成并审批

### 测试覆盖
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试覆盖关键路径
- [ ] E2E 测试覆盖核心用户流程
- [ ] 所有测试通过

### 质量标准
- [ ] 无 P0 Bug（阻塞性缺陷）
- [ ] P1 Bug ≤ 3 个
- [ ] TypeScript 编译无错误
- [ ] ESLint 无警告

### 交付物
- [ ] 可部署到 Staging 环境
- [ ] Sprint Review Demo 完成
- [ ] Sprint Retrospective 完成
- [ ] 技术文档更新

---

## 📚 相关文档

- [Sprint 2a 详细执行计划](../sprints/sprint-02a-plan.md)
- [Epic: GOAL-002 - KR 权重快照](../epics/epic-goal-002-kr-weight-snapshot.md)
- [Sprint 1 完成总结](../sprints/sprint-01-completion-summary.md)
- [Sprint 过渡指南](../workflow/sprint-transition-guide.md)

---

## 🎯 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| Story 完成率 | ≥ 90% (23/25 SP) | Jira/GitHub Projects |
| 代码覆盖率 | ≥ 80% | Vitest Coverage Report |
| Bug 数量 | P0=0, P1≤3 | Bug Tracking System |
| API 响应时间 | P95 < 500ms | 性能测试 |
| 前端渲染性能 | 趋势图 < 500ms (100 快照) | Performance Monitor |

---

**索引创建日期**: 2025-10-22  
**创建者**: SM (Scrum Master)  
**状态**: Ready for Planning

---

*祝 Sprint 2a 开发顺利！🚀*
