# PM 阶段文档目录

> **Product Management Phase**  
> **状态**: ✅ 已完成  
> **日期**: 2025-10-21

---

## 📁 目录结构

```
docs/pm/
├── README.md                          # 本文件 - PM 阶段导航
├── PM_PHASE_SUMMARY.md                # 📊 PM 阶段总结报告 (核心文档)
├── PM_PHASE_OVERVIEW.md               # PM 阶段概览
├── PM_PHASE_PROGRESS.md               # PM 阶段进度追踪
├── PM_EPIC_CREATION_STATUS.md         # Epic 创建状态报告
│
├── epics/                             # Epic 文档 (10 个)
│   ├── epic-setting-001-user-preferences.md
│   ├── epic-goal-002-kr-weight-snapshot.md
│   ├── epic-goal-003-focus-mode.md
│   ├── epic-goal-004-progress-auto-calculation.md
│   ├── epic-task-001-dependency-graph.md
│   ├── epic-task-002-priority-matrix.md
│   ├── epic-task-006-task-dependencies.md
│   ├── epic-reminder-001-smart-frequency.md
│   ├── epic-schedule-001-conflict-detection.md
│   └── epic-notification-001-multi-channel-aggregation.md
│
├── sprints/                           # Sprint 计划文档 (待创建)
│   ├── sprint-01-plan.md              # Sprint 1: SETTING-001
│   ├── sprint-02-plan.md              # Sprint 2: GOAL-002/003
│   ├── sprint-03-plan.md              # Sprint 3: GOAL-004 + TASK-002
│   ├── sprint-04-plan.md              # Sprint 4: TASK-001/006
│   ├── sprint-05-plan.md              # Sprint 5: SCHEDULE-001 + REMINDER-001
│   └── sprint-06-plan.md              # Sprint 6: NOTIFICATION-001
│
└── stories/                           # User Story 详细文档 (待创建)
    └── (按 Sprint 或 Epic 组织)
```

---

## 🎯 快速导航

### 🔥 核心文档

**如果只看一个文档，请看这个**:

👉 **[PM 阶段总结报告](./PM_PHASE_SUMMARY.md)** 📊

包含完整内容：
- ✅ 10 个 Epic 概览
- ✅ 6 个 Sprint 规划
- ✅ 技术架构设计
- ✅ 风险评估与缓解
- ✅ 团队资源与时间线
- ✅ 质量标准 (DoD)
- ✅ 下一步行动计划

---

### 📚 其他文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [PM_PHASE_OVERVIEW.md](./PM_PHASE_OVERVIEW.md) | PM 阶段概览与目标 | ✅ |
| [PM_PHASE_PROGRESS.md](./PM_PHASE_PROGRESS.md) | 进度追踪 | ✅ |
| [PM_EPIC_CREATION_STATUS.md](./PM_EPIC_CREATION_STATUS.md) | Epic 创建状态 | ✅ |

---

## 📖 Epic 文档列表

### Sprint 1 (Week 1-2)

- **[EPIC-SETTING-001: 用户偏好设置](./epics/epic-setting-001-user-preferences.md)** (23 SP)
  - 主题切换、语言切换、通知偏好

### Sprint 2 (Week 3-4)

- **[EPIC-GOAL-002: KR 权重快照](./epics/epic-goal-002-kr-weight-snapshot.md)** (25 SP)
  - KR 权重系统、历史快照
  
- **[EPIC-GOAL-003: 专注周期聚焦模式](./epics/epic-goal-003-focus-mode.md)** (23 SP)
  - 专注周期管理、进度追踪

### Sprint 3 (Week 5-6)

- **[EPIC-GOAL-004: 目标进度自动计算](./epics/epic-goal-004-progress-auto-calculation.md)** (15 SP)
  - 加权平均算法、自动进度计算
  
- **[EPIC-TASK-002: 任务优先级矩阵](./epics/epic-task-002-priority-matrix.md)** (15 SP)
  - Eisenhower 四象限矩阵

### Sprint 4 (Week 7-8)

- **[EPIC-TASK-001: 任务依赖图](./epics/epic-task-001-dependency-graph.md)** (18 SP)
  - DAG 可视化、循环检测、关键路径
  
- **[EPIC-TASK-006: 任务依赖关系管理](./epics/epic-task-006-task-dependencies.md)** (15 SP)
  - Blocking/Suggested 依赖类型

### Sprint 5 (Week 9-10)

- **[EPIC-SCHEDULE-001: 日程冲突检测](./epics/epic-schedule-001-conflict-detection.md)** (18 SP)
  - 时间重叠检测、冲突解决建议
  
- **[EPIC-REMINDER-001: 智能提醒频率](./epics/epic-reminder-001-smart-frequency.md)** (15 SP)
  - 自适应提醒、响应率追踪

### Sprint 6 (Week 11-12)

- **[EPIC-NOTIFICATION-001: 多渠道通知聚合](./epics/epic-notification-001-multi-channel-aggregation.md)** (15 SP)
  - 统一通知中心、多渠道推送

---

## 📊 统计数据

### 整体规模

| 指标 | 数值 |
|------|------|
| **Epic 数量** | 10 个 |
| **User Stories** | ~70 个 |
| **Story Points** | ~161 SP |
| **Sprint 数量** | 6 个 |
| **预估工期** | 12-15 周 |

### Story Points 分布

```
Sprint 1: 23 SP  (14.3%)  ████████████████
Sprint 2: 48 SP  (29.8%)  ████████████████████████████████
Sprint 3: 30 SP  (18.6%)  ████████████████████
Sprint 4: 33 SP  (20.5%)  ██████████████████████
Sprint 5: 33 SP  (20.5%)  ██████████████████████
Sprint 6: 15 SP  (9.3%)   ██████████
```

### 模块分布

```
Setting:      23 SP  (14.3%)
Goal:         88 SP  (54.7%)  ← 最大模块
Task:         48 SP  (29.8%)
Reminder:     15 SP  (9.3%)
Schedule:     18 SP  (11.2%)
Notification: 15 SP  (9.3%)
```

---

## 🚀 下一步行动

### 立即执行

1. **✅ 创建 Sprint 1 详细计划**
   - 文件: `sprints/sprint-01-plan.md`
   - 内容: SETTING-001 的 9 个 Story 分解

2. **⚠️ Sprint 2 拆分决策**
   - 48 SP 超出标准容量
   - 需决定拆分方案

3. **🔧 搭建开发环境**
   - Git 分支策略
   - CI/CD 流水线
   - 测试框架

### 短期规划

4. **启动 Sprint 1 开发**
5. **技术预研 (Spike)**
6. **创建 Sprint 2-6 计划**

---

## 📞 联系方式

有疑问？需要更多细节？

- **Epic 详细设计**: 查看 `epics/*.md`
- **技术架构**: 查看 `PM_PHASE_SUMMARY.md` 技术架构章节
- **风险管理**: 查看 `PM_PHASE_SUMMARY.md` 风险评估章节

---

*最后更新: 2025-10-21*  
*状态: ✅ PM 阶段完成，准备进入 Sprint 1*
