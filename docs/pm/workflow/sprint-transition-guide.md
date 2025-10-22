# 下一步工作流程 - Sprint 2 启动指南

## 📋 当前状态

### ✅ Sprint 1 已完成
- **状态**: 已合并到 `dev` 分支
- **完成度**: 100% (9/9 stories, 23 SP)
- **合并提交**: `a4aed64e`
- **分支**: `feature/sprint-1-remaining-stories` → `dev`

### 📊 统计数据
- **新增代码**: 2,292+ 行
- **E2E 测试**: 49 个测试用例
- **文件变更**: 12 个文件
- **提交数**: 8 个

---

## 🚀 下一步：Sprint 2 启动流程

### 角色分工

#### 👔 SM (Scrum Master/产品经理)
**主要职责**: Sprint 规划、Story 细化、优先级管理

#### 👨‍💻 Dev (开发人员)
**主要职责**: Story 实现、代码审查、测试编写

---

## 📝 推荐工作流程

### 阶段 1: Sprint 规划会议 (SM 主导)

**时间**: 1-2 小时  
**参与人员**: SM + Dev + Tech Lead

**议程**:
1. **回顾 Sprint 1**
   - ✅ 总结成功经验（DDD 架构、事件系统、E2E 测试）
   - ⚠️ 识别改进点（后端合约待更新、@ts-ignore 标记）
   - 📊 Velocity 计算：23 SP / 2 weeks = 11.5 SP/week

2. **确定 Sprint 2 目标**
   - **选项 A**: Sprint 2a - KR 权重快照（25 SP，~2.2 weeks）
   - **选项 B**: Sprint 2b - Goal 时序图（21 SP，~1.8 weeks）
   - **推荐**: 按 2a → 2b 顺序，因为 2a 建立了 Goal 模块基础

3. **Story 优先级排序**
   - 根据 `sprint-02a-plan.md` 确认 Story 列表
   - 识别依赖关系（Backend → Frontend）
   - 确认技术 Spike（DAG 可视化）

4. **Sprint 承诺**
   - Dev 确认 Story Points 是否合理
   - 识别风险和阻塞点
   - 确认 Sprint 完成标准

**输出**:
- ✅ Sprint 2a Backlog (9 个 Story)
- ✅ Sprint Goal 确认
- ✅ Story Points 确认（25 SP）
- ✅ Definition of Done (DoD)

---

### 阶段 2: Story 细化 (SM + Dev 协作)

**时间**: 每个 Story 15-30 分钟

**Story 细化模板**:

```markdown
# STORY-GOAL-002-001: Contracts & Domain 层

## 📋 Story 描述
作为一个后端开发者，我需要定义 KR 权重快照的合约和领域模型，以便后续开发使用。

## ✅ 验收标准
- [ ] `KeyResultWeightSnapshotServerDTO` 定义完成
- [ ] Zod schema 验证器实现
- [ ] 领域实体 `KeyResultWeightSnapshot` 实现
- [ ] 单元测试覆盖率 > 80%

## 🔧 技术任务
1. 创建 DTO 文件（30 min）
2. 实现 Zod 验证（20 min）
3. 创建领域实体（1 hour）
4. 编写单元测试（1 hour）

## 📝 技术细节
- 文件路径: `packages/contracts/src/goal/KeyResultWeightSnapshotServerDTO.ts`
- 依赖: `@repo/contracts`, `zod`
- 参考: Sprint 1 的 UserSetting 实现

## 🚧 阻塞点
- 无

## 📊 Story Points: 3 SP
**理由**: 类似于 Sprint 1 的 STORY-001，但领域逻辑更简单
```

**细化清单** (按 `sprint-02a-plan.md` 顺序):
1. ✅ STORY-GOAL-002-001: Contracts & Domain (3 SP)
2. ✅ STORY-GOAL-002-002: Application Service (3 SP)
3. ✅ STORY-GOAL-002-003: Repository 层 (3 SP)
4. ✅ STORY-GOAL-002-004: API Endpoints (4 SP)
5. ✅ STORY-GOAL-002-005: 客户端服务 (3 SP)
6. ✅ STORY-GOAL-002-006: UI - 权重快照列表 (3 SP)
7. ✅ STORY-GOAL-002-007: UI - 权重趋势图 (3 SP)
8. ✅ STORY-GOAL-002-008: UI - 权重对比视图 (2 SP)
9. ✅ STORY-GOAL-002-009: Spike - DAG 可视化调研 (1 SP)

**输出**:
- ✅ 每个 Story 的详细任务分解
- ✅ 技术实现方案
- ✅ 依赖关系图

---

### 阶段 3: Sprint 执行 (Dev 主导)

**开发流程**:

#### 3.1 创建 Feature 分支
```bash
git checkout dev
git pull origin dev
git checkout -b feature/sprint-2a-kr-weight-snapshots
```

#### 3.2 Story 开发循环
**对于每个 Story**:

1. **Story Kickoff** (5 min)
   - Review Story 描述和验收标准
   - 确认技术方案
   - 识别潜在风险

2. **TDD 开发** (按 `sprint-02a-plan.md` 的每日计划)
   - 先写测试（Red）
   - 实现功能（Green）
   - 重构优化（Refactor）

3. **代码审查**
   - Self-review（开发者自查）
   - Peer review（团队成员审查）
   - 修复反馈

4. **Story 验收**
   - 运行所有测试（单元 + 集成 + E2E）
   - 验证验收标准
   - 更新文档

5. **提交代码**
   ```bash
   git add .
   git commit -m "feat(goal): implement STORY-GOAL-002-001 - Contracts & Domain for KR Weight Snapshots"
   ```

#### 3.3 每日站会 (Daily Standup)
**时间**: 每天 15 分钟

**三个问题**:
1. 昨天完成了什么？
2. 今天计划做什么？
3. 有什么阻碍？

**输出**: 更新 Sprint Board (Jira/GitHub Projects)

---

### 阶段 4: Sprint 评审与回顾 (SM + Dev)

#### 4.1 Sprint Review (Sprint 结束时)
**时间**: 1 小时

**议程**:
1. Demo 新功能（15 min）
   - KR 权重快照列表
   - 权重趋势图
   - 权重对比视图
2. 验收 Story（30 min）
   - 检查 DoD
   - 测试覆盖率
   - 代码质量
3. 收集反馈（15 min）
   - 利益相关者反馈
   - 调整 Backlog 优先级

#### 4.2 Sprint Retrospective
**时间**: 1 小时

**议程**:
1. What went well? (继续保持)
2. What could be improved? (改进点)
3. Action items (下一步行动)

**输出**:
- ✅ Sprint 完成总结文档
- ✅ 改进行动计划
- ✅ Sprint 2b Backlog 调整

---

## 🎯 立即行动项

### 对于 SM:
1. **[ ] 查看 Sprint 2a 计划**
   - 文件: `docs/pm/sprints/sprint-02a-plan.md`
   - 确认 Story 列表和优先级
   - 准备 Sprint Planning 会议

2. **[ ] 创建 GitHub Issues**
   - 为每个 Story 创建 Issue
   - 添加标签（sprint-2a, goal-module）
   - 分配 Story Points

3. **[ ] 准备 Sprint Board**
   - 在 GitHub Projects 或 Jira 中创建 Sprint 2a
   - 添加所有 Story
   - 设置 Sprint 日期（Nov 3-14, 2025）

4. **[ ] 召集 Planning 会议**
   - 邀请: Dev + Tech Lead
   - 时间: 1-2 小时
   - 准备材料: Sprint 2a 计划文档

### 对于 Dev:
1. **[ ] 复习 Sprint 1 代码**
   - 理解 DDD 架构模式
   - 熟悉事件系统
   - 查看 UserSetting 模块作为参考

2. **[ ] 技术准备**
   - 安装所需依赖（如 ECharts for 趋势图）
   - 配置开发环境
   - 运行 Sprint 1 的 E2E 测试

3. **[ ] 阅读 Sprint 2a 计划**
   - 文件: `docs/pm/sprints/sprint-02a-plan.md`
   - 理解技术方案
   - 准备问题清单

4. **[ ] 参加 Planning 会议**
   - 确认 Story Points
   - 提出技术风险
   - 承诺 Sprint 目标

---

## 📚 相关文档

### Sprint 计划
- ✅ [Sprint 1 完成总结](./sprint-01-completion-summary.md)
- 📖 [Sprint 2a 详细计划](./sprint-02a-plan.md)
- 📖 [Sprint 2b 详细计划](./sprint-02b-plan.md)

### Epic 文档
- 📖 [EPIC-001: 用户设置增强](../epics/EPIC-001-user-settings-enhancement.md)
- 📖 [EPIC-002: KR 权重快照](../epics/) (待创建)

### 技术文档
- 📖 [DDD 架构指南](../../architecture/ddd-architecture.md)
- 📖 [Git 工作流](../../guides/git-workflow.md)
- 📖 [测试策略](../../guides/testing-strategy.md)

---

## 🏁 成功标准

**Sprint 2a 完成标准**:
- ✅ 所有 9 个 Story 完成并合并到 `dev`
- ✅ E2E 测试覆盖所有功能
- ✅ 代码审查通过
- ✅ 技术债务文档化
- ✅ Demo 可以展示给利益相关者

**质量标准**:
- 单元测试覆盖率 > 80%
- E2E 测试通过率 100%
- TypeScript 编译无错误
- ESLint 无警告

---

## 💡 经验总结（来自 Sprint 1）

### ✅ 做得好的地方
1. **统一事件总线**: 使用 `@dailyuse/utils` 的 `CrossPlatformEventBus` 避免重复造轮子
2. **详细的 E2E 测试**: 49 个测试用例覆盖所有场景
3. **Vuetify 架构**: 一致的 UI 设计语言
4. **类型安全**: 完整的 TypeScript 支持

### ⚠️ 需要改进
1. **后端合约同步**: 前端使用 `@ts-ignore` 等待后端更新（技术债务）
2. **测试执行**: E2E 测试已编写但未运行
3. **文档同步**: 需要及时更新架构文档

### 🔧 改进行动
1. **前置合约设计**: Sprint 2a 先完成 Backend Contracts 再开始 Frontend
2. **CI/CD 集成**: 自动运行 E2E 测试
3. **文档驱动**: 每个 Story 完成后更新文档

---

**创建日期**: 2025-10-22  
**更新日期**: 2025-10-22  
**作者**: Development Team  
**状态**: Ready for Sprint 2a Planning
