# DailyUse - 剩余功能实现清单

> **创建日期**: 2025-10-25  
> **基于**: [FEATURES-IMPLEMENTATION-STATUS.md](./FEATURES-IMPLEMENTATION-STATUS.md) 全面审查  
> **目的**: 快速参考未实现的功能，按优先级排序

---

## 📊 快速统计

- **总功能数**: 30 个
- **已实现**: 5 个 (16.7%)
- **未实现**: 25 个 (83.3%)
- **预估剩余工作量**: ~59,000 行代码

---

## 🎯 优先级排序

### P0 (Must Have) - 立即实施

#### 1. GOAL-003: 专注周期聚焦模式 ✨
- **RICE**: 560 (最高)
- **预估**: 16 SP (1-1.5 周)
- **文档**: [03-focus-mode.md](docs/modules/goal/features/03-focus-mode.md)
- **建议 Sprint**: Sprint 8 (2025-12-03 ~ 2025-12-16)
- **预估代码量**: ~3,500 行

**核心功能**:
- [ ] FocusCycle 值对象（专注周期实体）
- [ ] 专注模式切换（单 Goal 聚焦）
- [ ] 复盘触发器（周期结束自动触发）
- [ ] 前端专注视图 UI

---

#### 2. TASK-002: 优先级矩阵 📊
- **RICE**: 448
- **预估**: 12 SP (1 周)
- **文档**: [02-priority-matrix.md](docs/modules/task/features/02-priority-matrix.md)
- **建议 Sprint**: Sprint 9 (2025-12-17 ~ 2025-12-30)
- **预估代码量**: ~2,700 行

**核心功能**:
- [ ] 四象限矩阵算法（紧急-重要）
- [ ] 任务自动分类
- [ ] 矩阵可视化 UI
- [ ] 拖拽调整位置

---

#### 3. GOAL-004: 目标进度自动计算 📈
- **RICE**: 420
- **预估**: 14 SP (1 周)
- **文档**: [04-progress-auto-calculation.md](docs/modules/goal/features/04-progress-auto-calculation.md)
- **建议 Sprint**: Sprint 10 (2026-01-01 ~ 2026-01-14)
- **预估代码量**: ~2,800 行

**核心功能**:
- [ ] ProgressCalculationStrategy 接口
- [ ] WeightedAverageStrategy（加权平均）
- [ ] CustomFormulaStrategy（自定义公式）
- [ ] 实时进度同步

---

### P1 (Should Have) - 近期规划

#### 4. GOAL-004-ALT: 目标复盘 🔍
- **RICE**: 336
- **预估**: 10 SP
- **文档**: [04-goal-retrospective.md](docs/modules/goal/features/04-goal-retrospective.md)

**核心功能**:
- [ ] RetrospectiveReport 值对象
- [ ] 复盘模板系统
- [ ] 复盘报告生成
- [ ] 复盘历史查看

---

#### 5. GOAL-005: 目标任务关联 🔗
- **RICE**: 224
- **预估**: 8 SP
- **文档**: [05-goal-task-link.md](docs/modules/goal/features/05-goal-task-link.md)

**核心功能**:
- [ ] GoalTaskLink 关联表
- [ ] 任务进度同步到 KR
- [ ] 关联管理 UI
- [ ] 任务列表筛选

---

### P2-P3 (Nice to Have) - 长期规划

#### Goal 模块剩余功能

6. **GOAL-006: 目标模板库** (RICE: 140, P2)
7. **GOAL-007: 目标依赖关系** (RICE: 105, P3)
8. **GOAL-008: 目标健康度评分** (RICE: 98, P3)

#### Task 模块剩余功能

9. **TASK-001: 依赖关系图** (DAG 可视化)
10. **TASK-003: 任务时间块**
11. **TASK-004: 进度快照**
12. **TASK-007: 任务标签**
13. **TASK-008: 任务模板**（基础已有，需增强）

#### Schedule 模块剩余功能

14. **SCHEDULE-003: 日历同步**
15. **SCHEDULE-004: 周视图**
16. **SCHEDULE-005: 时间热力图**
17. **SCHEDULE-006: 搜索与筛选**

#### Reminder 模块剩余功能

18. **REMINDER-001: 智能频率**
19. **REMINDER-003: 历史追踪**
20. **REMINDER-004: 提醒模板**
21. **REMINDER-005: 位置提醒**

#### Notification 模块剩余功能

22. **NOTIFICATION-001: 多渠道聚合**
23. **NOTIFICATION-002: 优先级分类**
24. **NOTIFICATION-003: 通知摘要**
25. **NOTIFICATION-004: 通知统计**

#### Setting 模块剩余功能

26. **SETTING-002: 导入导出**

---

## 🚀 建议的实现路线图

### 2025 Q4 (Sprint 7-9)

**Sprint 7** (2025-11-19 ~ 2025-12-02) - 当前 Sprint
- ✅ 完成 EPIC-GOAL-002 (KR 权重快照) 后端验证
- ✅ UI 增强 + E2E 测试
- ✅ 技术债务清理

**Sprint 8** (2025-12-03 ~ 2025-12-16)
- 🎯 **GOAL-003: 专注周期聚焦模式** (16 SP)

**Sprint 9** (2025-12-17 ~ 2025-12-30)
- 🎯 **TASK-002: 优先级矩阵** (12 SP)

### 2026 Q1 (Sprint 10-12)

**Sprint 10** (2026-01-01 ~ 2026-01-14)
- 🎯 **GOAL-004: 目标进度自动计算** (14 SP)

**Sprint 11** (2026-01-15 ~ 2026-01-28)
- 🎯 **GOAL-004-ALT: 目标复盘** (10 SP)

**Sprint 12** (2026-01-29 ~ 2026-02-11)
- 🎯 **GOAL-005: 目标任务关联** (8 SP)

### 2026 Q2 及以后

- P2-P3 功能按需实现
- 根据用户反馈调整优先级

---

## 📋 Sprint 8 详细任务分解（示例）

### GOAL-003: 专注周期聚焦模式 (16 SP)

#### Week 1: 后端实现 (8 SP)

**Day 1-2: Domain 层** (3 SP)
- [ ] 创建 FocusCycle 值对象
- [ ] 定义 FocusCycleStatus 枚举
- [ ] 编写 FocusCycle 单元测试

**Day 3: Application 层** (2 SP)
- [ ] 创建 FocusCycleApplicationService
- [ ] 实现 startFocus() / endFocus() 方法
- [ ] 编写 Application 集成测试

**Day 4: Infrastructure 层** (2 SP)
- [ ] 创建 Prisma Schema (FocusCycle 模型)
- [ ] 实现 PrismaFocusCycleRepository
- [ ] 编写 Repository 测试

**Day 5: API 层** (1 SP)
- [ ] 创建 FocusCycleController
- [ ] 实现 RESTful 端点（启动/结束/查询）
- [ ] 更新 Swagger 文档

#### Week 2: 前端实现 (8 SP)

**Day 1: API Client** (1 SP)
- [ ] 创建 focusCycleApiClient.ts
- [ ] 实现 API 方法

**Day 2: Application Service + Composable** (2 SP)
- [ ] 创建 FocusCycleWebApplicationService
- [ ] 创建 useFocusCycle Composable
- [ ] EventBus 集成

**Day 3-4: UI 组件** (3 SP)
- [ ] FocusModeToggle.vue（专注模式切换）
- [ ] FocusCycleCard.vue（周期卡片）
- [ ] FocusHistoryList.vue（历史列表）

**Day 5: 测试 + 文档** (2 SP)
- [ ] 组件单元测试
- [ ] E2E 测试
- [ ] 文档更新

---

## 🔍 已实现功能总结

### ✅ 完全实现 (5 个)

1. **GOAL-002: KR 权重快照** (100%)
   - 后端: ~2,600 行
   - 前端: ~1,990 行
   - Sprint 6-7 完成

2. **TASK-006: 任务依赖** (70%)
   - 后端: ~800 行
   - 前端: 缺少可视化

3. **SCHEDULE-001: 冲突检测** (80%)
   - 后端: ~600 行
   - 前端: 缺少可视化

4. **SETTING-001: 用户偏好设置** (90%)
   - 后端: ~400 行
   - 前端: ~300 行

5. **基础 CRUD 模块** (100%)
   - Editor
   - Authentication
   - Account
   - Notification (基础)
   - Task (基础)
   - Schedule (基础)

---

## 📊 工作量预估

### 按优先级

| 优先级 | 功能数 | 预估 SP | 预估时间 | 预估代码量 |
|--------|--------|---------|----------|-----------|
| P0 | 3 | 42 SP | 6 周 | ~9,000 行 |
| P1 | 2 | 18 SP | 3 周 | ~5,500 行 |
| P2-P3 | 21 | ~150 SP | 25 周 | ~44,500 行 |
| **总计** | **26** | **~210 SP** | **~34 周** | **~59,000 行** |

### 按模块

| 模块 | 未实现功能数 | 预估代码量 |
|------|-------------|-----------|
| Goal | 7 | ~20,000 行 |
| Task | 6 | ~15,000 行 |
| Schedule | 4 | ~10,000 行 |
| Reminder | 4 | ~8,000 行 |
| Notification | 4 | ~5,000 行 |
| Setting | 1 | ~1,000 行 |
| **总计** | **26** | **~59,000 行** |

---

## ⚠️ 重要提醒

### 当前状态
- ✅ KR 权重快照已完整实现（Sprint 6 完成前端，后端代码已存在）
- ✅ Sprint 7 规划已完成（后端验证 + 测试补充）
- ✅ 实现状态审查报告已生成

### 下一步行动
1. **Sprint 7 执行** (2025-11-19 ~ 2025-12-02)
   - 验证 EPIC-GOAL-002 后端代码
   - 补充 E2E 测试
   - 清理技术债务

2. **Sprint 8 准备** (2025-12-03 开始)
   - 细化 GOAL-003（专注周期）Story 分解
   - 准备设计稿和原型
   - 预评估技术风险

3. **长期规划更新**
   - 根据用户反馈调整优先级
   - 评估资源和时间
   - 制定 2026 Q1-Q2 Roadmap

---

## 📚 相关文档

- [实现状态全面审查报告](./FEATURES-IMPLEMENTATION-STATUS.md) - 详细审查结果
- [Sprint 7 规划](./docs/pm/stories/SPRINT-07-INDEX.md) - 当前 Sprint
- [Sprint 6 完成报告](./SPRINT-06-COMPLETION-REPORT.md) - 历史记录
- [Features 文档目录](./docs/modules/) - 所有功能规格说明

---

**清单维护**:
- 创建: 2025-10-25
- 创建者: QA + PM
- 版本: 1.0
- 下次更新: Sprint 7 结束后
