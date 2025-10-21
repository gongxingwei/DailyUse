# DailyUse 项目 - 所有模块 MVP 功能需求总览

> **文档类型**: Product Roadmap  
> **负责人**: Product Owner  
> **状态**: Draft  
> **最后更新**: 2025-10-21

---

## 📋 目录

1. [总体概览](#总体概览)
2. [模块功能矩阵](#模块功能矩阵)
3. [各模块详细说明](#各模块详细说明)
4. [开发优先级](#开发优先级)
5. [资源分配](#资源分配)

---

## 总体概览

### 项目目标

为 DailyUse 的 8 个核心模块提供 **Beyond-CRUD** 的 MVP 功能，提升产品竞争力和用户体验。

### 模块清单

| 模块 | 英文名 | 核心职责 | MVP 功能数 | 预估时间 |
|------|--------|---------|-----------|---------|
| 目标管理 | Goal | OKR 目标设定与追踪 | 5 | 4-6周 |
| 任务管理 | Task | 待办任务与时间管理 | 5 | 4-5周 |
| 提醒管理 | Reminder | 智能提醒与通知 | 4 | 3-4周 |
| 日程管理 | Schedule | 定时任务与计划调度 | 4 | 3-4周 |
| 知识仓库 | Repository | 知识管理与关联 | 4 | 3-4周 |
| 编辑器 | Editor | 富文本与结构化编辑 | 4 | 3-4周 |
| 通知中心 | Notification | 多渠道通知聚合 | 3 | 2-3周 |
| 设置管理 | Setting | 个性化配置 | 3 | 2-3周 |

**总计**: 32 个 MVP 功能 | 24-37 周（约 6-9 个月）

---

## 模块功能矩阵

### 📊 按 RICE 优先级排序（Top 20）

| 排名 | 功能 | 模块 | RICE | Reach | Impact | Confidence | Effort | 优先级 |
|------|------|------|------|-------|--------|------------|--------|--------|
| 1 | KR 权重快照 | Goal | 672 | 7 | 6 | 8 | 0.5 | P0 |
| 2 | 专注聚焦模式 | Goal | 432 | 8 | 9 | 8 | 1.33 | P0 |
| 3 | 任务优先级智能排序 | Task | 576 | 9 | 8 | 8 | 1 | P0 |
| 4 | 任务批量操作 | Task | 567 | 9 | 7 | 9 | 1 | P0 |
| 5 | 进度自动计算 | Goal | 480 | 8 | 8 | 10 | 1.33 | P0 |
| 6 | 智能提醒频率调整 | Reminder | 392 | 7 | 7 | 8 | 1 | P0 |
| 7 | 日程冲突检测 | Schedule | 384 | 8 | 8 | 8 | 1.33 | P0 |
| 8 | 目标复盘 | Goal | 336 | 7 | 8 | 6 | 1 | P1 |
| 9 | 任务时间块 | Task | 298.7 | 8 | 7 | 8 | 1.5 | P0 |
| 10 | 多渠道通知聚合 | Notification | 288 | 8 | 6 | 8 | 1.33 | P0 |
| 11 | 任务进度快照 | Task | 252 | 6 | 6 | 7 | 1 | P1 |
| 12 | 提醒历史追踪 | Reminder | 252 | 6 | 6 | 7 | 1 | P1 |
| 13 | 知识关联推荐 | Repository | 240 | 6 | 8 | 5 | 1 | P1 |
| 14 | 目标任务关联 | Goal | 224 | 8 | 7 | 8 | 2 | P1 |
| 15 | 双向链接 | Editor | 216 | 6 | 6 | 6 | 1 | P1 |
| 16 | 日程自动同步 | Schedule | 196 | 7 | 7 | 8 | 2 | P1 |
| 17 | 通知优先级分类 | Notification | 189 | 7 | 6 | 9 | 2 | P1 |
| 18 | 任务依赖关系 | Task | 171.5 | 7 | 7 | 7 | 2 | P1 |
| 19 | 日程周视图 | Schedule | 147 | 7 | 7 | 7 | 2.33 | P1 |
| 20 | Markdown 增强 | Editor | 140 | 7 | 5 | 8 | 2 | P1 |

---

## 各模块详细说明

### 1️⃣ Goal（目标管理）模块

**核心价值**: 帮助用户设定和追踪 OKR 目标

**MVP 功能列表**:

| # | 功能名 | RICE | 简述 | 文档链接 |
|---|--------|------|------|---------|
| 02 | KR 权重快照 | 672 | 关键结果权重历史快照 | [详情](./goal/features/02-kr-weight-snapshot.md) |
| 03 | 目标任务关联 | 224 | 目标与任务双向关联 | [详情](./goal/features/03-goal-task-linking.md) |
| 04 | 进度自动计算 | 480 | 根据 KR 自动计算目标进度 | [详情](./goal/features/04-progress-auto-calculation.md) |
| 05 | 目标复盘 | 336 | 定期/完成时复盘（4D 模板） | [详情](./goal/features/05-goal-retrospective.md) |
| 09 | 专注聚焦模式 | 432 | 临时隐藏非关键目标，UI 只显示 1-3 个聚焦目标 | [详情](./goal/features/09-focus-mode.md) |

**关键字段** (packages/contracts/src/modules/goal/):
- Goal 聚合根: `uuid`, `status`, `progress`, `keyResults[]`, `reviews[]`
- KeyResult: `weight`, `currentValue`, `targetValue`
- GoalReview: `reviewType`, `score`, `highlights`, `challenges`

**完整文档**: [Goal 模块 MVP 需求](./goal/features/README.md)

---

### 2️⃣ Task（任务管理）模块

**核心价值**: 高效的任务执行与时间管理

**MVP 功能列表**:

| # | 功能名 | RICE | 简述 | 文档链接 |
|---|--------|------|------|---------|
| 01 | 任务优先级智能排序 | 576 | 多维度自动排序 + 拖拽调整 | [详情](./task/features/01-priority-smart-sort.md) |
| 02 | 任务依赖关系 | 171.5 | 前置任务依赖与阻塞管理 | [详情](./task/features/02-task-dependencies.md) |
| 03 | 任务时间块 | 298.7 | 时间盒管理 + 日历集成 | [详情](./task/features/03-task-time-blocks.md) |
| 04 | 任务进度快照 | 252 | 进度历史追踪 + 停滞检测 | [详情](./task/features/04-progress-snapshot.md) |
| 05 | 任务批量操作 | 567 | 批量状态/标签/时间修改 | [详情](./task/features/05-batch-operations.md) |

**关键字段** (packages/contracts/src/modules/task/):
- Task 聚合根: `uuid`, `status`, `priority`, `dueDate`, `estimatedTime`, `actualTime`
- TimeBlock: `startTime`, `endTime`, `duration`, `status`
- Dependency: `dependentTaskUuid`, `dependencyType`

**完整文档**: [Task 模块 MVP 需求](./task/features/README.md)

---

### 3️⃣ Reminder（提醒管理）模块

**核心价值**: 智能化的提醒与通知系统

**MVP 功能列表**:

| # | 功能名 | RICE | 简述 | 文档链接 |
|---|--------|------|------|---------|
| 01 | 智能提醒频率调整 | 392 | 根据用户行为自适应调整频率 | [详情](./reminder/features/01-smart-frequency.md) |
| 02 | 多渠道提醒 | 256 | 支持桌面/邮件/微信等多渠道 | [详情](./reminder/features/02-multi-channel.md) |
| 03 | 提醒历史追踪 | 252 | 所有提醒事件可追溯 | [详情](./reminder/features/03-history-tracking.md) |
| 04 | 情境感知提醒 | 210 | 根据时间/地点/状态触发 | [详情](./reminder/features/04-context-aware.md) |

**关键字段** (packages/contracts/src/modules/reminder/):
- Reminder 聚合根: `uuid`, `triggerTime`, `frequency`, `channels[]`, `status`
- ReminderHistory: `triggeredAt`, `channel`, `status`, `response`

**完整文档**: [Reminder 模块 MVP 需求](./reminder/features/README.md)

---

### 4️⃣ Schedule（日程管理）模块

**核心价值**: 定时任务调度与计划管理

**MVP 功能列表**:

| # | 功能名 | RICE | 简述 | 文档链接 |
|---|--------|------|------|---------|
| 01 | 日程冲突检测 | 384 | 自动检测时间冲突并提醒 | [详情](./schedule/features/01-conflict-detection.md) |
| 02 | 日程自动同步 | 196 | 与任务/目标自动同步 | [详情](./schedule/features/02-auto-sync.md) |
| 03 | 日程周视图 | 147 | 周视图 + 甘特图展示 | [详情](./schedule/features/03-week-view.md) |
| 04 | 重复日程模板 | 128 | 支持复杂重复规则 | [详情](./schedule/features/04-recurring-template.md) |

**关键字段** (packages/contracts/src/modules/schedule/):
- ScheduleTask 聚合根: `uuid`, `schedule`, `execution`, `status`
- ScheduleConfig: `cronExpression`, `timezone`, `startDate`, `endDate`
- ExecutionInfo: `lastExecutedAt`, `nextExecutionAt`, `executionCount`

**完整文档**: [Schedule 模块 MVP 需求](./schedule/features/README.md)

---

### 5️⃣ Repository（知识仓库）模块

**核心价值**: 知识管理与双向链接

**MVP 功能列表**:

| # | 功能名 | RICE | 简述 | 文档链接 |
|---|--------|------|------|---------|
| 01 | 知识关联推荐 | 240 | 基于内容的智能关联推荐 | [详情](./repository/features/01-link-recommendation.md) |
| 02 | 资源引用追踪 | 168 | 追踪资源被引用情况 | [详情](./repository/features/02-reference-tracking.md) |
| 03 | 知识图谱可视化 | 144 | 知识点关系图谱 | [详情](./repository/features/03-knowledge-graph.md) |
| 04 | 版本历史对比 | 126 | 资源版本变更追踪 | [详情](./repository/features/04-version-diff.md) |

**关键字段** (packages/contracts/src/modules/repository/):
- Repository 聚合根: `uuid`, `name`, `type`, `status`, `resources[]`
- Resource: `uuid`, `type`, `content`, `metadata`, `references[]`
- ResourceReference: `sourceUuid`, `targetUuid`, `referenceType`

**完整文档**: [Repository 模块 MVP 需求](./repository/features/README.md)

---

### 6️⃣ Editor（编辑器）模块

**核心价值**: 富文本与结构化编辑能力

**MVP 功能列表**:

| # | 功能名 | RICE | 简述 | 文档链接 |
|---|--------|------|------|---------|
| 01 | 双向链接 | 216 | [[]] 语法双向链接 | [详情](./editor/features/01-bidirectional-links.md) |
| 02 | Markdown 增强 | 140 | 扩展 Markdown 语法 | [详情](./editor/features/02-markdown-enhanced.md) |
| 03 | 块引用 | 120 | 块级别的引用功能 | [详情](./editor/features/03-block-reference.md) |
| 04 | 快捷命令 | 180 | `/` 斜杠命令菜单 | [详情](./editor/features/04-slash-commands.md) |

**关键字段** (packages/contracts/src/modules/editor/):
- EditorDocument 聚合根: `uuid`, `content`, `blocks[]`, `links[]`
- EditorBlock: `uuid`, `type`, `content`, `metadata`
- EditorLink: `sourceBlockUuid`, `targetBlockUuid`, `linkType`

**完整文档**: [Editor 模块 MVP 需求](./editor/features/README.md)

---

### 7️⃣ Notification（通知中心）模块

**核心价值**: 多渠道通知聚合与管理

**MVP 功能列表**:

| # | 功能名 | RICE | 简述 | 文档链接 |
|---|--------|------|------|---------|
| 01 | 多渠道通知聚合 | 288 | 聚合所有模块的通知 | [详情](./notification/features/01-multi-channel-aggregation.md) |
| 02 | 通知优先级分类 | 189 | 按紧急度分类展示 | [详情](./notification/features/02-priority-classification.md) |
| 03 | 通知批量处理 | 162 | 批量标记已读/删除 | [详情](./notification/features/03-batch-processing.md) |

**关键字段** (packages/contracts/src/modules/notification/):
- Notification 聚合根: `uuid`, `title`, `content`, `priority`, `channels[]`, `status`
- NotificationChannel: `type`, `enabled`, `config`

**完整文档**: [Notification 模块 MVP 需求](./notification/features/README.md)

---

### 8️⃣ Setting（设置管理）模块

**核心价值**: 个性化配置与偏好管理

**MVP 功能列表**:

| # | 功能名 | RICE | 简述 | 文档链接 |
|---|--------|------|------|---------|
| 01 | 主题切换 | 216 | 明暗主题 + 自定义配色 | [详情](./setting/features/01-theme-switching.md) |
| 02 | 快捷键自定义 | 144 | 用户自定义快捷键 | [详情](./setting/features/02-keyboard-shortcuts.md) |
| 03 | 数据导入导出 | 120 | 支持 JSON/CSV 导出 | [详情](./setting/features/03-data-export-import.md) |

**关键字段** (packages/contracts/src/modules/setting/):
- Setting 聚合根: `uuid`, `category`, `key`, `value`, `type`
- ThemeSetting: `mode`, `primaryColor`, `fontSize`
- ShortcutSetting: `action`, `keys[]`

**完整文档**: [Setting 模块 MVP 需求](./setting/features/README.md)

---

## 开发优先级

### Phase 1: 核心基础功能 (8-10周)

**目标**: 完成高 RICE 评分的 P0 功能，建立产品核心竞争力

**功能清单** (按优先级):
1. ✅ Goal - KR 权重快照 (RICE: 672) - 0.5周
2. ✅ Goal - 专注聚焦模式 (RICE: 432) - 1.33周
3. ✅ Task - 任务优先级智能排序 (RICE: 576) - 1周
4. ✅ Task - 任务批量操作 (RICE: 567) - 1周
5. ✅ Goal - 进度自动计算 (RICE: 480) - 1.33周
6. ✅ Reminder - 智能提醒频率调整 (RICE: 392) - 1周
7. ✅ Schedule - 日程冲突检测 (RICE: 384) - 1.33周
8. Task - 任务时间块 (RICE: 298.7) - 1.5周
9. Notification - 多渠道通知聚合 (RICE: 288) - 1.33周

**预计时间**: 8-10 周  
**人力配置**: 1 全栈 + 0.5 前端

---

### Phase 2: 功能增强与体验优化 (10-14周)

**目标**: 完成 P1 功能，提升用户体验深度

**功能清单**:
1. Goal - 目标复盘 (RICE: 336) - 1周
2. Task - 任务进度快照 (RICE: 252) - 1周
3. Reminder - 提醒历史追踪 (RICE: 252) - 1周
4. Repository - 知识关联推荐 (RICE: 240) - 1周
5. Goal - 目标任务关联 (RICE: 224) - 2周
6. Editor - 双向链接 (RICE: 216) - 1周
7. Schedule - 日程自动同步 (RICE: 196) - 2周
8. Notification - 通知优先级分类 (RICE: 189) - 2周
9. Task - 任务依赖关系 (RICE: 171.5) - 2周
10. Schedule - 日程周视图 (RICE: 147) - 2.33周

**预计时间**: 10-14 周  
**人力配置**: 1 全栈 + 1 前端

---

### Phase 3: 高级特性与智能化 (6-13周)

**目标**: 完成剩余功能，引入 AI 和自动化

**功能清单**:
- Editor - Markdown 增强 (RICE: 140) - 2周
- Repository - 资源引用追踪 (RICE: 168) - 1.5周
- Repository - 知识图谱可视化 (RICE: 144) - 2周
- Setting - 主题切换 (RICE: 216) - 1周
- Editor - 快捷命令 (RICE: 180) - 1.5周
- Reminder - 情境感知提醒 (RICE: 210) - 2周
- 其他低优先级功能...

**预计时间**: 6-13 周  
**人力配置**: 1 全栈 + 1 前端 + 0.5 后端

---

## 资源分配

### 开发团队配置

| 角色 | 人数 | 职责 |
|------|------|------|
| 全栈工程师 | 1 | Contracts → Domain → Application → Infrastructure → API |
| 前端工程师 | 1 | Client → UI → E2E 测试 |
| 后端工程师 | 0.5 (兼职) | 复杂业务逻辑、性能优化 |
| QA 工程师 | 0.5 (兼职) | 测试用例编写、质量审查 |
| PM/PO | 0.5 (兼职) | 需求澄清、优先级调整 |

### 时间表（甘特图概览）

```
月份:        M1    M2    M3    M4    M5    M6    M7    M8    M9
Phase 1:     ████████████████████
Phase 2:                        ████████████████████████
Phase 3:                                                ████████████
里程碑:      MVP1               MVP2                     Full
```

### 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 技术债积累 | 高 | 高 | 每个 Phase 结束后安排 1 周重构 |
| 需求变更频繁 | 中 | 中 | 严格 Contracts-First，最小化影响范围 |
| 跨模块集成复杂 | 中 | 高 | 事件驱动架构，松耦合设计 |
| 测试覆盖不足 | 中 | 高 | 强制 80% 单元测试覆盖率 |
| 性能瓶颈 | 低 | 中 | Phase 3 专项性能优化 |

---

## ⚙️ DailyUse 架构约束（全局）

### 所有模块必须遵守

1. **Contracts-First**  
   - 所有开发从 `packages/contracts` 开始
   - 字段严格对齐，禁止臆造字段

2. **时间字段规范**  
   - 统一使用 `number` (timestamp in milliseconds)
   - 禁止使用 `Date` 对象
   - 示例：`createdAt: Date.now()`

3. **7 层开发顺序**  
   - Contracts → Domain → Application → Infrastructure → API → Client → UI → E2E
   - 不可跳跃，每层完成后 Checkpoint

4. **Aggregate Root 模式**  
   - 子实体只能通过聚合根方法操作
   - 业务规则封装在聚合根内

5. **事件驱动架构**  
   - 所有状态变更发布领域事件
   - 跨模块通信通过事件总线

6. **测试金字塔**  
   - 单元测试 70% (vitest)
   - 集成测试 20% (test DB)
   - E2E 测试 10% (Playwright)

---

## 🔗 相关文档

### 产品文档
- [Goal 模块 MVP](./goal/features/README.md)
- [Task 模块 MVP](./task/features/README.md)
- [Reminder 模块 MVP](./reminder/features/README.md)
- [Schedule 模块 MVP](./schedule/features/README.md)
- [Repository 模块 MVP](./repository/features/README.md)
- [Editor 模块 MVP](./editor/features/README.md)
- [Notification 模块 MVP](./notification/features/README.md)
- [Setting 模块 MVP](./setting/features/README.md)

### 技术文档
- [Contracts 层规范](../packages/contracts/README.md)
- [DDD 架构指南](../.github/prompts/dailyuse.architecture.prompt.md)
- [BMAD 开发流程](./BMAD_DEVELOPMENT_WORKFLOW.md)

### 项目管理
- [项目 Roadmap](./roadmap.md)
- [Sprint Planning](./sprints/)
- [技术债追踪](./technical-debt.md)

---

## 📈 成功指标

### 产品指标
- 功能完成率: >=95% (32个功能中完成 >=30 个)
- 用户满意度: >=4.5/5.0
- DAU (Daily Active Users): 增长 >50%
- 功能使用率: Top 10 功能使用率 >60%

### 技术指标
- 单元测试覆盖率: >=80%
- E2E 测试通过率: >=95%
- API 响应时间: P95 <500ms
- 前端首屏加载: <2s
- Bug 密度: <0.5 bugs/KLOC

### 团队指标
- Sprint 交付准时率: >=90%
- Code Review 覆盖率: 100%
- 技术债偿还率: >=20% 每 Phase
- 知识分享: >=1 次/月

---

## 📝 文档维护

- **创建**: 2025-10-21
- **创建者**: PO Agent
- **版本**: 1.0
- **审核**: 待定
- **下次更新**: 每 Sprint 结束后

---

## 🎯 下一步行动

1. **PO**: 为 Phase 1 的 9 个功能创建详细 Feature Spec
2. **PM**: 根据 Feature Spec 生成 Project Flow 文档
3. **Architect**: 审查跨模块依赖和技术方案
4. **Dev**: 从 Goal 模块的 KR 权重快照功能开始实现
5. **QA**: 准备测试环境和自动化测试框架

**首个 Sprint 目标**: 完成 Goal 模块的前 2 个功能（KR 权重快照 + 专注周期追踪）

---

💡 **提示**: 此文档是动态的产品路线图，应随项目进展持续更新。每完成一个功能，更新状态并调整后续优先级。
