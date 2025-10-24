# Sprint 1 详细计划 - 用户偏好设置基础设施

> **Sprint ID**: Sprint-01  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint 周期**: Week 1-2 (2025-10-27 ~ 2025-11-07)  
> **Story Points**: 23 SP  
> **状态**: 待启动  
> **Sprint 目标**: 建立 DailyUse 基础设施，实现用户个性化配置能力

---

## 📋 Sprint 概览

### Sprint 目标

作为 DailyUse 的第一个 Sprint，本 Sprint 的核心目标是：

1. ✅ 建立完整的 8 层 DDD 架构基础
2. ✅ 实现用户偏好设置功能（主题、语言、通知等）
3. ✅ 建立开发工作流和质量标准
4. ✅ 为后续 Sprint 奠定架构基础

### 业务价值

- **用户体验**: 用户可以自定义应用外观和行为
- **架构基础**: 为所有后续模块提供标准开发模式
- **技术验证**: 验证 DDD 架构和技术栈选型

---

## 🎯 User Stories 列表

| Story ID              | 标题                        | SP  | 优先级 | 负责人   | 状态   |
| --------------------- | --------------------------- | --- | ------ | -------- | ------ |
| STORY-SETTING-001-001 | Contracts & Domain          | 2   | P0     | Backend  | 待开始 |
| STORY-SETTING-001-002 | Application Service         | 3   | P0     | Backend  | 待开始 |
| STORY-SETTING-001-003 | Infrastructure & Repository | 2   | P0     | Backend  | 待开始 |
| STORY-SETTING-001-004 | API Endpoints               | 3   | P0     | Backend  | 待开始 |
| STORY-SETTING-001-005 | Client Services             | 2   | P0     | Frontend | 待开始 |
| STORY-SETTING-001-006 | UI - 外观设置               | 3   | P0     | Frontend | 待开始 |
| STORY-SETTING-001-007 | UI - 通知设置               | 3   | P0     | Frontend | 待开始 |
| STORY-SETTING-001-008 | UI - 快捷键设置             | 3   | P0     | Frontend | 待开始 |
| STORY-SETTING-001-009 | E2E Tests                   | 2   | P0     | QA       | 待开始 |

**总计**: 23 SP

---

## 📅 Sprint 日程规划

### Week 1 (Day 1-5)

#### Day 1-2 (Monday-Tuesday): Backend 基础层

**目标**: 完成 Contracts, Domain, Application 层

**Story-001: Contracts & Domain (2 SP)**

- [ ] 定义 `UserPreferenceServerDTO`
- [ ] 创建值对象 (ThemeType, LanguageType, NotificationSettings)
- [ ] 实现 `UserPreference` 实体
- [ ] 编写单元测试 (覆盖率 ≥ 80%)
- [ ] Code Review

**Story-002: Application Service (3 SP)**

- [ ] 创建 `UserPreferenceApplicationService`
- [ ] 实现 CRUD 方法 (get, update, reset)
- [ ] 添加输入验证
- [ ] 编写集成测试
- [ ] Code Review

**每日站会重点**:

- 是否遇到 TypeScript 类型问题？
- Contracts 定义是否清晰？
- 是否需要前端开发者参与讨论？

---

#### Day 3 (Wednesday): Infrastructure 层

**Story-003: Infrastructure & Repository (2 SP)**

- [ ] 更新 Prisma Schema (`UserPreference` 模型)
- [ ] 运行数据库迁移
- [ ] 实现 `UserPreferenceRepository`
- [ ] 实现 Repository 方法 (findByUserId, save, delete)
- [ ] 编写 Repository 测试
- [ ] Code Review

**技术决策**:

- 使用 Prisma JSON 字段存储复杂偏好 (notifications, shortcuts)
- 建立数据库索引策略 (userId unique)

---

#### Day 4 (Thursday): API 层

**Story-004: API Endpoints (3 SP)**

- [ ] 创建 `UserPreferenceController`
- [ ] 实现 GET `/api/user-preferences/:userId`
- [ ] 实现 PUT `/api/user-preferences/:userId`
- [ ] 实现 POST `/api/user-preferences/:userId/reset`
- [ ] 添加 Zod 请求验证
- [ ] 添加错误处理 (404, 400, 500)
- [ ] 编写 API 测试 (supertest)
- [ ] 更新 OpenAPI 文档
- [ ] Code Review

**验收标准**:

- 所有 API 返回正确的 HTTP 状态码
- 请求验证捕获所有无效输入
- API 文档完整且准确

---

#### Day 5 (Friday): Code Review & Week 1 回顾

**任务**:

- [ ] Backend 代码全面 Review
- [ ] 修复 Code Review 发现的问题
- [ ] 运行完整测试套件
- [ ] Week 1 Sprint Review (内部)

**Week 1 验收标准**:

- ✅ Backend 4 层架构完整实现
- ✅ 所有单元测试和集成测试通过
- ✅ 代码覆盖率 ≥ 80%
- ✅ API 文档已更新

---

### Week 2 (Day 6-10)

#### Day 6 (Monday): Client Services

**Story-005: Client Services (2 SP)**

- [ ] 创建 `UserPreferenceClientService`
- [ ] 实现 HTTP 调用方法
- [ ] 集成 React Query (缓存、自动刷新)
- [ ] 添加错误处理和重试逻辑
- [ ] 编写客户端测试 (mock HTTP)
- [ ] Code Review

**技术决策**:

- React Query staleTime: 5 分钟
- 使用 Optimistic Updates 提升用户体验

---

#### Day 7-8 (Tuesday-Wednesday): UI 组件开发

**Story-006: UI - 外观设置 (3 SP)**

- [ ] 创建 `AppearanceSettings.vue` 组件
- [ ] 实现主题切换 (亮色/暗色/自动)
- [ ] 实现语言切换下拉框
- [ ] 实现字体大小滑块
- [ ] 实现侧边栏位置单选按钮
- [ ] 集成 `UserPreferenceClientService`
- [ ] 添加实时预览
- [ ] 编写组件测试 (Vitest + Testing Library)
- [ ] Code Review

**Story-007: UI - 通知设置 (3 SP)**

- [ ] 创建 `NotificationSettings.vue` 组件
- [ ] 实现通知渠道多选框
- [ ] 实现免打扰模式时间选择器
- [ ] 实现声音设置
- [ ] 添加浏览器通知权限检查
- [ ] 编写组件测试
- [ ] Code Review

---

#### Day 9 (Thursday): 高级 UI 功能

**Story-008: UI - 快捷键设置 (3 SP)**

- [ ] 创建 `ShortcutSettings.vue` 组件
- [ ] 实现快捷键录制对话框
- [ ] 添加冲突检测逻辑
- [ ] 实现导入/导出配置
- [ ] 编写组件测试
- [ ] Code Review

**技术挑战**:

- 全局快捷键监听 (使用 `mousetrap` 或类似库)
- 快捷键冲突检测算法
- 跨平台兼容性 (Windows/Mac/Linux)

---

#### Day 10 (Friday): E2E 测试 & Sprint 收尾

**Story-009: E2E Tests (2 SP)**

- [ ] 使用 Playwright 编写 E2E 测试
- [ ] 测试完整用户流程 (登录 → 设置 → 验证)
- [ ] 测试跨页面设置持久化
- [ ] 测试边界情况
- [ ] 集成到 CI/CD Pipeline

**Sprint 收尾任务**:

- [ ] 运行完整测试套件 (单元 + 集成 + E2E)
- [ ] 修复所有 P0/P1 Bug
- [ ] 性能测试 (设置加载 < 200ms)
- [ ] 可访问性测试 (WCAG AA)
- [ ] 更新文档
- [ ] Sprint Review & Retrospective

---

## 🏗️ 技术架构

### DDD 8 层架构

```
┌─────────────────────────────────────────┐
│  1. Contracts Layer                      │  ← UserPreferenceServerDTO
│     (DTO/Interface)                      │
├─────────────────────────────────────────┤
│  2. Domain Layer                         │  ← UserPreference Entity
│     (Entity/Value Object)                │     + 业务逻辑
├─────────────────────────────────────────┤
│  3. Application Layer                    │  ← UserPreferenceApplicationService
│     (Service/Use Case)                   │     + 输入验证
├─────────────────────────────────────────┤
│  4. Infrastructure Layer                 │  ← UserPreferenceRepository
│     (Persistence/External)               │     + Prisma 操作
├─────────────────────────────────────────┤
│  5. API Layer                            │  ← UserPreferenceController
│     (REST Endpoints)                     │     + 路由/错误处理
├─────────────────────────────────────────┤
│  6. Client Layer                         │  ← UserPreferenceClientService
│     (HTTP Calls + React Query)          │     + 缓存/重试
├─────────────────────────────────────────┤
│  7. UI Layer                             │  ← Vue 3 Components
│     (Components)                         │     + Element Plus
├─────────────────────────────────────────┤
│  8. E2E Testing                          │  ← Playwright Tests
│     (Integration Tests)                  │
└─────────────────────────────────────────┘
```

### 技术栈

| 层级     | 技术         | 版本    | 用途      |
| -------- | ------------ | ------- | --------- |
| Backend  | Express      | ^4.18.0 | Web 框架  |
| Backend  | Prisma       | ^5.0.0  | ORM       |
| Backend  | TypeScript   | ^5.0.0  | 类型安全  |
| Backend  | Zod          | ^3.22.0 | 请求验证  |
| Backend  | Vitest       | ^1.0.0  | 单元测试  |
| Backend  | Supertest    | ^6.3.0  | API 测试  |
| Frontend | Vue 3        | ^3.4.0  | UI 框架   |
| Frontend | Element Plus | ^2.5.0  | UI 组件库 |
| Frontend | Pinia        | ^2.1.0  | 状态管理  |
| Frontend | React Query  | ^5.0.0  | 数据管理  |
| Frontend | Vitest       | ^1.0.0  | 组件测试  |
| E2E      | Playwright   | ^1.40.0 | E2E 测试  |

---

## 🔧 开发环境配置

### 初始化任务 (Day 0)

**Backend 配置**:

```bash
# 安装依赖
pnpm install

# 配置数据库
cp .env.example .env
# 编辑 .env 设置 DATABASE_URL

# 运行 Prisma 迁移
pnpm prisma migrate dev

# 启动开发服务器
pnpm nx serve api
```

**Frontend 配置**:

```bash
# 启动 Web 应用
pnpm nx serve web

# 启动 Desktop 应用
pnpm nx serve desktop
```

**测试环境**:

```bash
# 运行单元测试
pnpm nx test api
pnpm nx test web

# 运行 E2E 测试
pnpm nx e2e web-e2e
```

---

## ✅ Definition of Done (DoD)

### User Story DoD

每个 User Story 完成时必须满足：

**功能完整性**:

- [ ] 所有 Acceptance Criteria 通过
- [ ] Gherkin 场景全部验证
- [ ] 错误处理完整 (4xx, 5xx)

**代码质量**:

- [ ] TypeScript strict 模式无错误
- [ ] ESLint 无警告
- [ ] 代码覆盖率 ≥ 80%
- [ ] Code Review 通过 (至少 1 人审核)

**文档**:

- [ ] API 文档已更新 (OpenAPI)
- [ ] 组件文档已更新 (Storybook, 如适用)
- [ ] README 已更新 (如有新依赖)

**性能**:

- [ ] API 响应时间 < 500ms (P95)
- [ ] 前端渲染 < 2s (初始加载)

**集成**:

- [ ] CI/CD 测试通过
- [ ] 与现有代码集成无冲突
- [ ] 数据库迁移脚本可逆

---

### Sprint DoD

Sprint 完成时必须满足：

**功能完整性**:

- [ ] 所有 9 个 User Stories 状态为 Done
- [ ] Sprint 目标完全实现

**测试**:

- [ ] 所有单元测试通过 (>100 tests)
- [ ] 所有集成测试通过
- [ ] E2E 测试覆盖核心流程
- [ ] 手动测试通过 (UAT)

**质量**:

- [ ] 无 P0 Bug
- [ ] P1 Bug < 3 个
- [ ] 代码覆盖率 ≥ 80%

**部署**:

- [ ] 可部署到 Staging 环境
- [ ] 数据库迁移已验证
- [ ] 文档已更新

**团队协作**:

- [ ] Sprint Review 完成 (演示给 PO)
- [ ] Sprint Retrospective 完成
- [ ] 下一 Sprint 准备就绪

---

## 🚨 风险与缓解

### 风险矩阵

| 风险                  | 概率 | 影响 | 优先级 | 缓解策略                                               |
| --------------------- | ---- | ---- | ------ | ------------------------------------------------------ |
| Prisma 迁移失败       | 中   | 高   | P0     | - 提前在本地测试<br>- 准备回滚脚本                     |
| 浏览器通知权限被拒    | 高   | 中   | P1     | - 提供友好引导<br>- 降级到应用内通知                   |
| 快捷键与系统冲突      | 中   | 低   | P2     | - 检测并警告用户<br>- 提供默认替代方案                 |
| TypeScript 类型复杂度 | 低   | 中   | P2     | - 使用 `unknown` + 类型守卫<br>- 适当使用 `any` (临时) |
| JSON 字段查询性能     | 低   | 中   | P2     | - 限制 JSON 大小<br>- 考虑 JSONB 索引                  |

### 技术债务

**已识别的技术债务**:

1. **Prisma JSON 字段**: 复杂查询性能可能受限
   - **缓解**: Sprint 2 考虑拆分为关联表
2. **全局状态管理**: 使用 Pinia，可能需要优化
   - **缓解**: Sprint 3 评估是否迁移到 Zustand
3. **快捷键冲突检测**: 简单实现，未覆盖所有边界情况
   - **缓解**: Sprint 4 增强算法

---

## 📊 Sprint 指标

### 开发效率指标

| 指标             | 目标  | 测量方式                 |
| ---------------- | ----- | ------------------------ |
| Sprint 完成率    | ≥ 90% | 完成的 SP / 计划的 SP    |
| Code Review 时间 | < 4h  | PR 创建到批准的平均时间  |
| Bug 修复时间     | < 1d  | Bug 报告到修复的平均时间 |
| CI/CD 成功率     | ≥ 95% | 通过的构建 / 总构建数    |
| 测试覆盖率       | ≥ 80% | Jest/Vitest 报告         |

### 质量指标

| 指标         | 目标    | 测量方式                     |
| ------------ | ------- | ---------------------------- |
| P0 Bug 数量  | 0       | Sprint 结束时未解决的 P0 Bug |
| 技术债务     | < 10%   | SonarQube 评分               |
| 代码重复率   | < 3%    | SonarQube 分析               |
| API 响应时间 | < 500ms | P95 延迟                     |
| 前端加载时间 | < 2s    | Lighthouse 评分              |

### 团队协作指标

| 指标                 | 目标       | 测量方式             |
| -------------------- | ---------- | -------------------- |
| Daily Standup 参与率 | 100%       | 出席记录             |
| Code Review 参与率   | 100%       | PR Review 记录       |
| 文档完整性           | 100%       | 文档审查清单         |
| 知识分享             | ≥ 1/Sprint | Tech Talk 或文档贡献 |

---

## 🎤 会议安排

### Daily Standup (每日 10:00, 15 分钟)

**议程**:

1. 昨天完成了什么？
2. 今天计划做什么？
3. 遇到什么阻碍？

**注意事项**:

- 控制时间，每人 < 5 分钟
- 阻碍问题会后单独讨论
- 远程参会者优先发言

---

### Sprint Planning (Sprint 开始, 2 小时)

**议程** (已完成):

1. ✅ Sprint 目标确认
2. ✅ User Stories 拆分和评估
3. ✅ 任务分配
4. ✅ DoD 确认

---

### Sprint Review (Week 2 Friday, 1 小时)

**议程**:

1. Demo 已完成的功能 (30 分钟)
   - Story-001 ~ Story-009 演示
   - 重点展示用户价值
2. 收集反馈 (20 分钟)
   - PO/用户反馈
   - 记录改进建议
3. Sprint 指标回顾 (10 分钟)
   - 完成率、质量指标

---

### Sprint Retrospective (Week 2 Friday, 1 小时)

**议程**:

1. What went well? (20 分钟)
2. What didn't go well? (20 分钟)
3. Action items for next Sprint (20 分钟)

**Retrospective 格式**: Start-Stop-Continue

---

## 📚 参考文档

### Epic 文档

- [EPIC-SETTING-001: 用户偏好设置](../epics/epic-setting-001-user-preferences.md)

### 架构文档

- [DDD 8 层架构设计](../../architecture/DDD_8_LAYER_ARCHITECTURE.md)
- [API 设计规范](../../guides/API_DESIGN_GUIDELINES.md)
- [前端组件规范](../../guides/FRONTEND_COMPONENT_GUIDELINES.md)

### 开发指南

- [TypeScript 编码规范](../../guides/TYPESCRIPT_CODING_STANDARDS.md)
- [Git Commit 规范](../../COMMIT_STYLE.md)
- [测试最佳实践](../../testing/TESTING_BEST_PRACTICES.md)

---

## 🎯 Sprint 成功标准

Sprint 1 被认为成功，当且仅当：

1. ✅ **功能完整**: 用户可以完整使用偏好设置功能
2. ✅ **架构验证**: DDD 8 层架构经过实战验证
3. ✅ **质量达标**: 所有 DoD 检查项通过
4. ✅ **团队就绪**: 团队对工作流程达成共识
5. ✅ **基础设施**: CI/CD、测试、文档流程建立

**关键验收场景**:

```gherkin
Scenario: 新用户首次使用 DailyUse
  Given 用户首次登录 DailyUse
  When 用户打开设置页面
  Then 应该看到默认的偏好设置
  When 用户修改主题为"暗色"
  And 修改语言为"English"
  And 启用桌面通知
  And 点击保存
  Then 应用立即切换为暗色主题和英文界面
  When 用户刷新页面
  Then 所有设置应该保持不变
  When 用户在另一设备登录
  Then 所有设置应该同步
```

---

## 🚀 Sprint 1 之后的展望

### Sprint 2a 准备 (Week 3-4)

**Epic**: GOAL-002 - KR 权重快照  
**Story Points**: 25 SP

**依赖项检查**:

- [ ] Sprint 1 的 Contracts 模式可复用
- [ ] 用户认证系统已就绪
- [ ] 数据库迁移流程已验证

**技术预研**:

- [ ] 快照算法设计 (Copy-on-Write)
- [ ] 时间旅行 UI 交互设计

---

### 长期技术规划

**Sprint 3-4 技术决策** (需要在 Sprint 1-2 期间完成技术 spike):

1. **DAG 可视化库选型** (TASK-001)
   - ✅ **决策**: 使用 **graphlib** + **React Flow** / **Cytoscape.js**
   - **理由**:
     - graphlib: 成熟的图算法库，支持拓扑排序、循环检测
     - React Flow: 易用性高，Vue 可通过 `@vue-flow/core` 使用
     - Cytoscape.js: 更强大的布局算法 (备选方案)
   - **技术 Spike 任务** (Sprint 2a):
     - [ ] 评估 React Flow vs Cytoscape.js 性能 (1000+ 节点)
     - [ ] 原型验证 DAG 布局算法 (Dagre/ELK)
     - [ ] 测试 Vue 3 集成方案

2. **消息队列选型** (NOTIFICATION-001)
   - ✅ **决策**: 使用 **Bull** 或 **BullMQ** + **Redis**
   - **理由**:
     - Bull: 成熟稳定，社区活跃
     - BullMQ: Bull 的升级版，TypeScript 原生支持
     - Redis: 高性能，已在技术栈中
   - **技术 Spike 任务** (Sprint 5):
     - [ ] 评估 Bull vs BullMQ API 差异
     - [ ] 测试消息可靠性 (重试、死信队列)
     - [ ] 性能基准测试 (1000+ 通知/分钟)
     - [ ] Redis 集群配置 (Staging 环境)

---

## 📝 Sprint 1 日志模板

### 每日日志格式

```markdown
# Sprint 1 - Day X (YYYY-MM-DD)

## ✅ 今日完成

- [Story-XXX] 任务描述
- [Story-XXX] 任务描述

## 🚧 进行中

- [Story-XXX] 任务描述 (预计明天完成)

## ❌ 阻碍

- 问题描述
- 责任人 / 解决方案

## 📊 每日指标

- 完成 SP: X / 23
- 测试覆盖率: XX%
- 未解决 Bug: X 个
```

---

## 🎉 Sprint 1 启动检查清单

### 开发环境 (Day 0)

- [ ] 所有团队成员克隆代码仓库
- [ ] 所有团队成员安装依赖 (`pnpm install`)
- [ ] 数据库配置完成 (PostgreSQL/MySQL)
- [ ] 环境变量配置完成 (`.env` 文件)
- [ ] 开发服务器可启动 (`pnpm nx serve api/web`)
- [ ] 测试环境可运行 (`pnpm nx test`)

### 工具配置

- [ ] Git 分支策略确认 (main/develop/feature/\*)
- [ ] Code Review 工具配置 (GitHub PR)
- [ ] CI/CD Pipeline 配置 (GitHub Actions)
- [ ] Issue Tracker 配置 (GitHub Issues / Jira)
- [ ] Communication 工具 (Slack / Discord)

### 文档准备

- [ ] Sprint Backlog 创建 (GitHub Projects)
- [ ] Task Board 设置 (Kanban)
- [ ] Daily Standup 时间确认
- [ ] Sprint Review 会议邀请发送
- [ ] Retrospective 会议邀请发送

### 团队对齐

- [ ] Sprint 目标宣讲
- [ ] User Stories 讲解
- [ ] DoD 确认
- [ ] 角色分工确认
- [ ] Questions & Answers

---

**Sprint 1 状态**: ⏳ 待启动  
**下一步**: 完成启动检查清单，启动 Sprint Planning 会议

---

_文档创建: 2025-10-21_  
_Sprint Owner: PM Agent_  
_最后更新: 2025-10-21_
