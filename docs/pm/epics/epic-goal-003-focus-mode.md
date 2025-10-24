# Epic: 专注周期聚焦模式

> **Epic ID**: EPIC-GOAL-003  
> **Feature Spec**: [GOAL-003](../modules/goal/features/03-focus-mode.md)  
> **优先级**: P0  
> **RICE 评分**: 432  
> **模块**: Goal  
> **Sprint**: Sprint 2  
> **状态**: Draft

---

## 📋 Epic 概述

### 业务价值

提供临时聚焦模式，让用户在关键冲刺期能够屏蔽非核心目标，专注于 1-3 个最重要的目标。通过 UI 的视觉简化和信息过滤，帮助用户保持专注，提升执行效率。

**核心收益**:

- 🎯 **一键聚焦**: 快速开启/关闭聚焦模式，操作简单
- 👁️ **视觉简化**: 隐藏非关键目标，减少视觉干扰
- ⏰ **周期管理**: 支持设置聚焦周期（本周/本月/自定义）
- 🔄 **灵活切换**: 可临时查看全部目标，不退出聚焦模式

### 目标用户

- **主要用户**: 目标管理者、需要阶段性聚焦的知识工作者
- **典型场景**:
  - 季度末冲刺，需要专注完成 2-3 个关键 OKR
  - 项目关键期，暂时屏蔽其他日常目标
  - 个人专注时段（如深度工作日）

---

## 🎯 验收标准

### Epic 级别 AC

```gherkin
Feature: 专注周期聚焦模式
  作为 目标负责人
  我希望能够临时开启聚焦模式
  以便在关键时期专注于少数重要目标

Scenario: 完整的聚焦模式流程
  Given 用户有 5 个活跃目标
  When 用户开启聚焦模式
  And 选择 2 个目标进行聚焦
  And 设置聚焦周期为"本月"
  Then 目标列表只显示 2 个聚焦目标
  And 其他 3 个目标被隐藏
  And 顶部显示聚焦状态栏

  When 用户点击"查看全部"
  Then 临时显示所有 5 个目标
  And 聚焦目标用特殊标记高亮

  When 用户点击"返回聚焦模式"
  Then 恢复只显示 2 个聚焦目标

  When 聚焦周期结束
  Then 自动退出聚焦模式
  And 恢复显示所有目标
```

---

## 📦 User Stories 分解

### Story 1: Contracts & Domain 层 (2 SP)

**Story ID**: STORY-GOAL-003-001  
**标题**: 定义聚焦模式 Contracts 和 Domain 实体

**描述**:

```gherkin
As a 开发者
I want 定义聚焦模式的数据结构
So that 前后端可以基于统一的契约开发
```

**任务清单**:

- [ ] 在 `packages/contracts` 创建 `FocusModeServerDTO`
- [ ] 定义 `HiddenGoalsMode` 枚举 (hide/collapse/deprioritize)
- [ ] 更新 `UserServerDTO` 添加 `activeFocusMode` 字段
- [ ] 在 `packages/domain-server` 创建 `FocusMode` 值对象
- [ ] 实现聚焦模式激活/停用逻辑
- [ ] 编写单元测试

**验收标准**:

```gherkin
Scenario: DTO 结构完整
  Given FocusModeServerDTO 已定义
  Then 应包含所有必需字段
  And focusedGoalUuids 数组限制 1-3 个元素
  And startTime < endTime
  And isActive 默认为 true

Scenario: Domain 逻辑正确
  Given 用户创建聚焦模式
  When focusedGoalUuids 包含 4 个目标
  Then 抛出 TooManyFocusedGoalsError

  When endTime < startTime
  Then 抛出 InvalidFocusPeriodError
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 2: Application Service (3 SP)

**Story ID**: STORY-GOAL-003-002  
**标题**: 实现聚焦模式应用服务

**描述**:

```gherkin
As a 后端开发者
I want 创建聚焦模式的业务逻辑
So that API 可以调用统一的服务接口
```

**任务清单**:

- [ ] 创建 `FocusModeApplicationService`
- [ ] 实现 `activateFocusMode(userId, goalUuids, period)` 方法
- [ ] 实现 `deactivateFocusMode(userId)` 方法
- [ ] 实现 `extendFocusPeriod(userId, newEndTime)` 方法
- [ ] 实现 `updateFocusedGoals(userId, goalUuids)` 方法
- [ ] 添加自动结束聚焦的定时任务
- [ ] 编写集成测试

**验收标准**:

```gherkin
Scenario: 激活聚焦模式
  Given 用户有 5 个目标
  When 调用 activateFocusMode(userId, [goal1, goal2], 'this_month')
  Then 创建 FocusMode 实体
  And 设置 endTime 为本月最后一天 23:59:59
  And 用户的 activeFocusMode 字段更新

Scenario: 自动结束聚焦
  Given 聚焦模式的 endTime 为昨天
  When 定时任务运行
  Then 自动调用 deactivateFocusMode
  And 用户的 activeFocusMode 设为 null
  And 发送通知"聚焦模式已自动结束"
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 3: Infrastructure & Repository (2 SP)

**Story ID**: STORY-GOAL-003-003  
**标题**: 实现聚焦模式数据持久化

**描述**:

```gherkin
As a 后端开发者
I want 实现聚焦模式的数据库操作
So that 聚焦状态可以持久化
```

**任务清单**:

- [ ] 更新 Prisma Schema (User 模型添加 `activeFocusMode` JSON 字段)
- [ ] 运行 Prisma 迁移
- [ ] 创建 `FocusModeRepository`
- [ ] 实现 `saveFocusMode(userId, focusMode)` 方法
- [ ] 实现 `findActiveFocusMode(userId)` 方法
- [ ] 实现 `findExpiredFocusModes()` 方法（用于定时任务）
- [ ] 编写 Repository 测试

**验收标准**:

```gherkin
Scenario: 保存聚焦模式
  Given 用户激活聚焦模式
  When 调用 saveFocusMode
  Then User 表的 activeFocusMode 字段更新
  And 数据正确存储为 JSON

Scenario: 查询过期聚焦
  Given 数据库中有 10 个聚焦模式
  And 其中 3 个已过期（endTime < now）
  When 调用 findExpiredFocusModes
  Then 返回 3 个过期的聚焦模式
  And 按 endTime 升序排列
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 4: API Endpoints (3 SP)

**Story ID**: STORY-GOAL-003-004  
**标题**: 创建聚焦模式 REST API

**描述**:

```gherkin
As a 前端开发者
I want 调用聚焦模式的 HTTP API
So that Web/Desktop 应用可以管理聚焦状态
```

**任务清单**:

- [ ] 创建 `FocusModeController`
- [ ] 实现 `POST /api/focus-mode/activate` 端点
- [ ] 实现 `POST /api/focus-mode/deactivate` 端点
- [ ] 实现 `PUT /api/focus-mode/extend` 端点
- [ ] 实现 `PUT /api/focus-mode/update-goals` 端点
- [ ] 实现 `GET /api/focus-mode/active` 端点（查询当前聚焦状态）
- [ ] 添加请求验证
- [ ] 编写 API 测试
- [ ] 更新 OpenAPI 文档

**验收标准**:

```gherkin
Scenario: POST 激活聚焦
  Given 用户已认证
  And 请求体包含 {goalUuids: [uuid1, uuid2], endTime: 1730390399000}
  When 发送 POST /api/focus-mode/activate
  Then 返回 200 状态码
  And 响应体包含 FocusModeServerDTO
  And 用户进入聚焦模式

Scenario: GET 查询聚焦状态
  Given 用户已激活聚焦模式
  When 发送 GET /api/focus-mode/active
  Then 返回 200 状态码
  And 响应体包含当前聚焦模式详情

  Given 用户未激活聚焦模式
  When 发送 GET /api/focus-mode/active
  Then 返回 200 状态码
  And 响应体为 null
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 5: Client Services (2 SP)

**Story ID**: STORY-GOAL-003-005  
**标题**: 实现聚焦模式客户端服务

**描述**:

```gherkin
As a 前端开发者
I want 封装聚焦模式的 HTTP 调用
So that UI 组件可以方便地管理聚焦状态
```

**任务清单**:

- [ ] 在 `packages/domain-client` 创建 `FocusModeClientService`
- [ ] 实现 `activateFocusMode(goalUuids, endTime)` 方法
- [ ] 实现 `deactivateFocusMode()` 方法
- [ ] 实现 `extendFocusPeriod(newEndTime)` 方法
- [ ] 实现 `updateFocusedGoals(goalUuids)` 方法
- [ ] 实现 `getActiveFocusMode()` 方法
- [ ] 集成 React Query（实时同步聚焦状态）
- [ ] 编写客户端测试

**验收标准**:

```gherkin
Scenario: 激活聚焦模式
  Given 用户选择了 2 个目标
  When 调用 activateFocusMode([uuid1, uuid2], endTime)
  Then 发送 POST 请求到 API
  And 返回 FocusModeClientDTO
  And 本地状态更新
  And React Query 缓存更新

Scenario: 实时同步
  Given 聚焦模式已激活
  When 在另一设备上停用聚焦
  Then React Query 通过轮询检测到变化
  And 自动更新本地状态
  And UI 实时更新
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 6: UI Components - 聚焦配置面板 (3 SP)

**Story ID**: STORY-GOAL-003-006  
**标题**: 创建聚焦模式配置 UI

**描述**:

```gherkin
As a 用户
I want 通过友好的界面配置聚焦模式
So that 可以快速选择目标和设置周期
```

**任务清单**:

- [ ] 创建 `FocusModeConfigPanel.vue` 组件
- [ ] 实现目标多选列表（最多 3 个）
- [ ] 实现周期选择（本周/本月/自定义）
- [ ] 实现隐藏模式选择（隐藏/折叠/降低优先级）
- [ ] 添加表单验证（至少选 1 个目标，最多 3 个）
- [ ] 集成 `FocusModeClientService`
- [ ] 编写组件测试

**验收标准**:

```gherkin
Scenario: 打开配置面板
  Given 用户在目标列表页
  When 点击"聚焦模式"按钮
  Then 弹出配置面板
  And 显示所有活跃目标供选择
  And 默认选中 0 个目标

Scenario: 选择目标
  Given 配置面板已打开
  When 用户勾选 2 个目标
  Then 这 2 个目标被标记为选中
  And "开启聚焦"按钮变为可用

  When 用户尝试勾选第 4 个目标
  Then 显示提示"最多选择 3 个目标"
  And 第 4 个目标无法勾选

Scenario: 设置周期
  Given 用户选择"本月"
  Then 自动计算 endTime 为本月最后一天 23:59:59
  And 显示"2025-10-01 ~ 2025-10-31"

  Given 用户选择"自定义"
  Then 显示日期选择器
  And 用户可选择任意未来日期
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 7: UI Components - 聚焦模式视图 (4 SP)

**Story ID**: STORY-GOAL-003-007  
**标题**: 创建聚焦模式下的目标列表 UI

**描述**:

```gherkin
As a 用户
I want 聚焦模式下看到简洁的目标列表
So that 可以专注于关键目标
```

**任务清单**:

- [ ] 创建 `FocusedGoalList.vue` 组件
- [ ] 实现聚焦状态栏（显示剩余天数、退出按钮）
- [ ] 实现"查看全部"/"返回聚焦"切换逻辑
- [ ] 聚焦模式下只显示聚焦目标
- [ ] 非聚焦模式下高亮聚焦目标
- [ ] 实现聚焦目标的视觉强化（大卡片、高亮边框）
- [ ] 编写组件测试

**验收标准**:

```gherkin
Scenario: 聚焦模式激活
  Given 用户激活了聚焦模式（2 个目标）
  When 进入目标列表页
  Then 只显示 2 个聚焦目标
  And 顶部显示聚焦状态栏
  And 状态栏显示"剩余 X 天"
  And 有"退出聚焦"和"查看全部"按钮

Scenario: 查看全部目标
  Given 用户在聚焦模式下
  When 点击"查看全部"
  Then 显示所有 5 个目标
  And 聚焦的 2 个目标有特殊标记（⭐）
  And 其他 3 个目标视觉弱化（灰色）
  And 状态栏变为"临时查看全部，点击返回聚焦"

Scenario: 返回聚焦
  Given 用户在"查看全部"状态
  When 点击"返回聚焦模式"
  Then 恢复只显示 2 个聚焦目标
  And 状态栏恢复原状
```

**Story Points**: 4  
**预估工时**: 2 天

---

### Story 8: UI Components - 聚焦管理 (2 SP)

**Story ID**: STORY-GOAL-003-008  
**标题**: 创建聚焦模式管理功能

**描述**:

```gherkin
As a 用户
I want 调整聚焦周期或提前结束
So that 可以灵活控制聚焦模式
```

**任务清单**:

- [ ] 创建 `FocusModeManager.vue` 组件
- [ ] 显示当前聚焦详情（目标、周期、剩余时间）
- [ ] 实现"延长聚焦"功能（选择新结束时间）
- [ ] 实现"提前结束"功能（带确认对话框）
- [ ] 实现"调整目标"功能（更换聚焦目标）
- [ ] 编写组件测试

**验收标准**:

```gherkin
Scenario: 延长聚焦周期
  Given 聚焦模式将在 3 天后结束
  When 用户点击"延长聚焦"
  And 选择新结束时间为 15 天后
  Then 聚焦周期更新
  And 状态栏显示"剩余 15 天"

Scenario: 提前结束
  Given 聚焦模式还有 10 天
  When 用户点击"提前结束"
  Then 显示确认对话框
  And 提示"确定要退出聚焦模式吗？"

  When 用户确认
  Then 聚焦模式停用
  And 所有目标恢复显示
  And 显示提示"聚焦模式已结束"
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 9: 定时任务 & E2E Tests (2 SP)

**Story ID**: STORY-GOAL-003-009  
**标题**: 实现自动结束定时任务和 E2E 测试

**描述**:

```gherkin
As a 系统管理员
I want 聚焦模式到期后自动结束
So that 用户无需手动管理过期的聚焦模式
```

**任务清单**:

- [ ] 创建 Cron 定时任务（每小时检查一次）
- [ ] 查询所有过期的聚焦模式
- [ ] 批量停用过期聚焦
- [ ] 发送通知给相关用户
- [ ] 使用 Playwright 编写 E2E 测试
- [ ] 测试完整的聚焦流程
- [ ] 集成到 CI/CD Pipeline

**验收标准**:

```gherkin
Scenario: 自动结束过期聚焦
  Given 有 3 个聚焦模式，其中 1 个已过期
  When Cron 任务运行
  Then 过期的聚焦模式被停用
  And 该用户的 activeFocusMode 设为 null
  And 用户收到通知"聚焦模式已自动结束"
  And 其他 2 个未过期的聚焦保持激活

Scenario: E2E 完整流程
  Given 用户登录并有 5 个目标
  When 用户激活聚焦模式（选 2 个目标，本月）
  Then 目标列表只显示 2 个目标

  When 用户点击"查看全部"
  Then 显示所有 5 个目标

  When 用户点击"提前结束"并确认
  Then 恢复显示所有 5 个目标
  And 聚焦状态栏消失
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

## 📊 Story 统计

| Story ID           | 标题                        | SP  | 工时   | 依赖               |
| ------------------ | --------------------------- | --- | ------ | ------------------ |
| STORY-GOAL-003-001 | Contracts & Domain          | 2   | 4-6h   | -                  |
| STORY-GOAL-003-002 | Application Service         | 3   | 1-1.5d | 001                |
| STORY-GOAL-003-003 | Infrastructure & Repository | 2   | 4-6h   | 002                |
| STORY-GOAL-003-004 | API Endpoints               | 3   | 1-1.5d | 003                |
| STORY-GOAL-003-005 | Client Services             | 2   | 4-6h   | 004                |
| STORY-GOAL-003-006 | UI - 配置面板               | 3   | 1-1.5d | 005                |
| STORY-GOAL-003-007 | UI - 聚焦视图               | 4   | 2d     | 005                |
| STORY-GOAL-003-008 | UI - 聚焦管理               | 2   | 4-6h   | 005                |
| STORY-GOAL-003-009 | 定时任务 & E2E              | 2   | 4-6h   | 002, 006, 007, 008 |

**总计**: 23 SP, 预估 8-10 工作日（1.5-2 周）

---

## 🔗 技术依赖

### 内部依赖

- **Goal 模块基础**: 需要 Goal 实体已实现
- **用户认证**: 需要用户身份验证

### 外部依赖

- **定时任务**: Node-Cron 或类似库
- **通知系统**: 用于聚焦结束提醒

### 数据库 Schema

```prisma
model User {
  id                String    @id @default(uuid())
  // ...existing fields...

  activeFocusMode   Json?     // FocusMode 结构的 JSON

  @@map("users")
}

// FocusMode JSON 结构：
// {
//   uuid: string,
//   focusedGoalUuids: string[],
//   startTime: number,
//   endTime: number,
//   hiddenGoalsMode: 'hide' | 'collapse' | 'deprioritize',
//   isActive: boolean,
//   createdAt: number
// }
```

---

## ✅ Epic Definition of Done

- [ ] 所有 9 个 Stories 状态为 Done
- [ ] 所有测试通过（单元 + 集成 + E2E）
- [ ] 代码覆盖率 ≥ 80%
- [ ] API 文档完整
- [ ] 定时任务稳定运行
- [ ] UI 交互流畅（< 200ms 响应）
- [ ] 产品验收通过

---

## 🚀 发布计划

### Sprint 2 (Week 3-4)

与 EPIC-GOAL-002 并行开发，共享基础架构。

**Week 3**:

- Day 1-2: Story 001-003 (Contracts + Application + Infrastructure)
- Day 3-4: Story 004-005 (API + Client Services)
- Day 5: Code Review

**Week 4**:

- Day 1-2: Story 006-007 (UI - 配置面板 + 聚焦视图)
- Day 3: Story 008 (UI - 聚焦管理)
- Day 4: Story 009 (定时任务 + E2E)
- Day 5: Final Testing

---

## 📝 注意事项

### 技术挑战

1. **状态同步**: 聚焦状态需在多设备间同步
2. **定时任务**: 确保定时任务可靠运行
3. **UI 性能**: 快速切换聚焦/非聚焦视图

### 风险与缓解

| 风险             | 影响 | 缓解策略             |
| ---------------- | ---- | -------------------- |
| 定时任务失败     | 中   | 添加监控和告警       |
| 多设备状态不一致 | 中   | React Query 实时轮询 |
| 用户忘记聚焦模式 | 低   | 到期前 3 天提醒      |

---

_Epic 创建于: 2025-10-21_  
_下一步: 创建 EPIC-GOAL-004_
