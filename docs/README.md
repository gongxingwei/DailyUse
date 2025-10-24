# DailyUse 项目文档

> **个人效能管理系统** - 文档中心  
> **最后更新**: 2025-10-21

---

## 📁 文档组织结构

```
docs/
├── README.md                    # 本文件 - 文档导航中心
│
├── pm/                          # 🎯 PM 阶段文档 (Product Management)
│   ├── README.md                # PM 文档导航
│   ├── PM_PHASE_SUMMARY.md      # 📊 PM 阶段总结报告 (核心)
│   ├── epics/                   # Epic 文档 (10 个)
│   ├── sprints/                 # Sprint 计划 (6 个)
│   └── stories/                 # User Story 详细文档
│
├── modules/                     # 📦 模块功能需求文档
│   ├── goal/                    # 目标管理模块
│   ├── task/                    # 任务管理模块
│   ├── reminder/                # 提醒模块
│   ├── schedule/                # 日程模块
│   ├── notification/            # 通知模块
│   └── setting/                 # 设置模块
│
├── architecture/                # 🏗️ 技术架构文档
│   ├── ddd/                     # DDD 设计
│   ├── api/                     # API 设计
│   └── database/                # 数据库设计
│
├── guides/                      # 📖 开发指南
│   ├── development-workflow.md  # BMAD 开发流程
│   ├── coding-standards.md      # 代码规范
│   └── testing-guide.md         # 测试指南
│
├── testing/                     # 🧪 测试文档
│   └── e2e/                     # E2E 测试计划
│
└── sprints/                     # (已废弃，移至 pm/sprints/)
```

---

## 🚀 快速开始

### 新成员入门

**第一步: 了解项目**

1. 阅读 [项目 README](../README.md)
2. 查看 [PM 阶段总结报告](./pm/PM_PHASE_SUMMARY.md) 📊 ← **最重要**

**第二步: 了解开发流程**

1. 阅读 [BMAD 开发流程](./guides/BMAD_DEVELOPMENT_WORKFLOW.md)
2. 查看 [代码规范](./COMMIT_STYLE.md)

**第三步: 选择模块深入**

1. 查看 [模块文档](./modules/) 了解业务需求
2. 查看 [Epic 文档](./pm/epics/) 了解开发计划
3. 查看 [架构文档](./architecture/) 了解技术设计

---

## 📚 核心文档索引

### 🎯 PM 阶段 (Product Management)

**一站式 PM 文档**: 👉 **[PM 目录](./pm/README.md)**

| 文档                                             | 说明                   | 优先级 |
| ------------------------------------------------ | ---------------------- | ------ |
| **[PM 阶段总结报告](./pm/PM_PHASE_SUMMARY.md)**  | 完整的 PM 阶段成果总结 | 🔥🔥🔥 |
| [PM 阶段概览](./pm/PM_PHASE_OVERVIEW.md)         | PM 阶段目标与流程      | ⭐⭐   |
| [PM 阶段进度](./pm/PM_PHASE_PROGRESS.md)         | 进度追踪               | ⭐     |
| [Epic 创建状态](./pm/PM_EPIC_CREATION_STATUS.md) | Epic 创建进度          | ⭐     |

**PM 阶段核心成果**:

- ✅ 10 个 Epic 文档 (在 `pm/epics/`)
- ✅ ~70 个 User Stories
- ✅ ~161 Story Points
- ✅ 6 个 Sprint 规划
- ✅ 12-15 周开发时间线

---

### 📦 模块功能需求

**36 个 Feature Spec 文档** (按模块组织):

#### Goal 模块 (目标管理)

- [目标管理功能需求](./modules/goal/)
- 核心 Epic: GOAL-002, GOAL-003, GOAL-004

#### Task 模块 (任务管理)

- [任务管理功能需求](./modules/task/)
- 核心 Epic: TASK-001, TASK-002, TASK-006

#### Reminder 模块 (提醒)

- [提醒功能需求](./modules/reminder/)
- 核心 Epic: REMINDER-001

#### Schedule 模块 (日程)

- [日程功能需求](./modules/schedule/)
- 核心 Epic: SCHEDULE-001

#### Notification 模块 (通知)

- [通知功能需求](./modules/notification/)
- 核心 Epic: NOTIFICATION-001

#### Setting 模块 (设置)

- [设置功能需求](./modules/setting/)
- 核心 Epic: SETTING-001

---

### 🏗️ 技术架构

| 文档                                   | 说明                |
| -------------------------------------- | ------------------- |
| [DDD 架构设计](./architecture/ddd/)    | 领域驱动设计        |
| [API 设计](./architecture/api/)        | RESTful API 规范    |
| [数据库设计](./architecture/database/) | Prisma Schema       |
| [前端架构](./architecture/frontend/)   | Vue 3 + React Query |

---

### 📖 开发指南

| 文档                                                   | 说明                 |
| ------------------------------------------------------ | -------------------- |
| [BMAD 开发流程](./guides/BMAD_DEVELOPMENT_WORKFLOW.md) | 完整开发流程         |
| [代码提交规范](./COMMIT_STYLE.md)                      | Conventional Commits |
| [测试指南](./testing/)                                 | 单元/集成/E2E 测试   |
| [Web 模块修复指南](./WEB_MODULE_FIX_GUIDE.md)          | 前端开发指南         |

---

## 📊 项目统计

### 文档统计

| 分类             | 数量   | 说明            |
| ---------------- | ------ | --------------- |
| **Epic 文档**    | 10 个  | PM 阶段核心产出 |
| **Feature Spec** | 36 个  | 功能需求文档    |
| **User Stories** | ~70 个 | 详细用户故事    |
| **架构文档**     | 10+ 个 | 技术设计文档    |
| **开发指南**     | 5+ 个  | 流程规范文档    |

### 项目规模

| 指标             | 数值     |
| ---------------- | -------- |
| **Story Points** | ~161 SP  |
| **Sprint 数量**  | 6 个     |
| **预估工期**     | 12-15 周 |
| **团队规模**     | 2-3 人   |

---

## 🔍 按角色查找文档

### 产品经理 (PM)

1. [PM 阶段总结报告](./pm/PM_PHASE_SUMMARY.md) - 完整项目计划
2. [模块功能需求](./modules/) - 业务需求详情
3. [Epic 文档](./pm/epics/) - 功能分解

### 技术负责人 (Tech Lead)

1. [PM 阶段总结报告](./pm/PM_PHASE_SUMMARY.md) - 技术架构章节
2. [DDD 架构设计](./architecture/ddd/) - 领域模型
3. [API 设计](./architecture/api/) - 接口规范
4. [风险评估](./pm/PM_PHASE_SUMMARY.md#风险评估与缓解) - 技术风险

### 后端开发

1. [Epic 文档](./pm/epics/) - 查看 Application Service 层
2. [DDD 架构](./architecture/ddd/) - 领域模型设计
3. [数据库设计](./architecture/database/) - Prisma Schema
4. [API 文档](./architecture/api/) - RESTful 接口

### 前端开发

1. [Epic 文档](./pm/epics/) - 查看 UI Layer 部分
2. [前端架构](./architecture/frontend/) - Vue 3 + React Query
3. [Web 模块指南](./WEB_MODULE_FIX_GUIDE.md) - 前端开发规范
4. [UI 组件](./modules/) - 各模块 UI 需求

### 测试工程师

1. [Epic 文档](./pm/epics/) - 查看 E2E Testing 部分
2. [测试指南](./testing/) - 测试策略
3. [DoD 标准](./pm/PM_PHASE_SUMMARY.md#质量标准) - 验收标准

---

## 🔄 文档更新记录

### 2025-10-21

- ✅ 创建 PM 阶段总结报告 (PM_PHASE_SUMMARY.md)
- ✅ 重组 PM 文档到 `docs/pm/` 目录
- ✅ 完成 10 个 Epic 文档创建
- ✅ 创建 PM 目录 README 导航

### 之前

- ✅ 完成 36 个 Feature Spec 文档
- ✅ 建立 DDD 架构设计
- ✅ 创建 BMAD 开发流程指南

---

## 📞 需要帮助？

### 找不到文档？

**按内容搜索**:

- PM 相关: 查看 `docs/pm/`
- 功能需求: 查看 `docs/modules/`
- 技术架构: 查看 `docs/architecture/`
- 开发指南: 查看 `docs/guides/`

**按阶段搜索**:

- 需求分析阶段: Feature Spec 文档
- 产品管理阶段: Epic 文档
- 开发阶段: Sprint 计划 + User Story
- 测试阶段: 测试文档

### 文档质量问题？

- 文档缺失: 提交 Issue 或 PR
- 内容过时: 提交更新建议
- 描述不清: 联系文档作者

---

## 🎯 下一步

### 立即行动

1. **阅读 PM 总结报告** 👉 [PM_PHASE_SUMMARY.md](./pm/PM_PHASE_SUMMARY.md)
2. **查看 Sprint 1 计划** 👉 [Sprint 1 Plan](./pm/sprints/sprint-01-plan.md) (待创建)
3. **启动开发环境** 👉 参考项目 README

### 下个阶段

- 🚀 Sprint 1 开发启动 (Week 1-2)
- 📝 创建详细 Sprint 计划 (Sprint 1-6)
- 🔧 搭建 CI/CD 流水线

---

_文档维护: 项目团队_  
_最后更新: 2025-10-21_  
_状态: ✅ PM 阶段完成_
