# Sprint 1 - User Stories 索引

> **Sprint**: Sprint 1  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint 周期**: 2 周 (Week 1-2)  
> **总 Story Points**: 23 SP  
> **Story 数量**: 9 个

---

## 📊 Sprint 概览

本 Sprint 实现用户偏好设置功能，包括外观、通知、快捷键三大设置模块。采用 DDD 架构，从 Contracts → Domain → Application → Infrastructure → API → Client → UI 逐层实现。

### Story 分布

| Layer                                           | Stories | Story Points |
| ----------------------------------------------- | ------- | ------------ |
| Backend 基础层 (Contracts, Domain, Application) | 2       | 5 SP         |
| Backend 持久化层 (Infrastructure, API)          | 2       | 5 SP         |
| Frontend 基础层 (Client Services)               | 1       | 2 SP         |
| Frontend UI 层 (外观/通知/快捷键)               | 3       | 9 SP         |
| 测试层 (E2E Tests)                              | 1       | 2 SP         |

---

## 📝 Story 列表

### 🏗️ Backend 基础层

#### [STORY-SETTING-001-001: Contracts & Domain 层实现](./STORY-SETTING-001-001.md)

- **Story Points**: 2 SP
- **预估时间**: 6 小时
- **负责人**: Backend Developer
- **依赖**: 无
- **交付物**:
  - TypeScript 类型定义 (ThemeType, LanguageType, NotificationSettings, ShortcutSettings)
  - UserPreferenceServerDTO 接口
  - Zod 验证器 (Schema)
  - UserPreference 实体类 (11 个业务方法)
  - Domain 错误类 (InvalidThemeError, InvalidLanguageError, etc.)
  - 单元测试 (覆盖率 ≥ 80%)

#### [STORY-SETTING-001-002: Application Service 层实现](./STORY-SETTING-001-002.md)

- **Story Points**: 3 SP
- **预估时间**: 8 小时
- **负责人**: Backend Developer
- **依赖**: ✅ STORY-001
- **交付物**:
  - IUserPreferenceRepository 接口定义
  - UserPreferenceService (11 个方法: CRUD + 5 个单项更新 + 批量更新)
  - Application DTOs (CreateDTO, UpdateDTO, etc.)
  - Application 错误类 (UserPreferenceNotFoundError, UserPreferenceAlreadyExistsError)
  - 默认值逻辑 (getDefaultNotificationSettings, getDefaultShortcuts)
  - 单元测试 (Mock Repository, 覆盖率 ≥ 80%)

---

### 🗄️ Backend 持久化层

#### [STORY-SETTING-001-003: Infrastructure & Repository 实现](./STORY-SETTING-001-003.md)

- **Story Points**: 2 SP
- **预估时间**: 6 小时
- **负责人**: Backend Developer
- **依赖**: ✅ STORY-001, ✅ STORY-002
- **交付物**:
  - Prisma Schema (UserPreference model, 10 个字段, JSON 字段, 索引)
  - Prisma Migration (add_user_preference)
  - PrismaUserPreferenceRepository (实现 IUserPreferenceRepository)
  - UserPreferenceMapper (toDomain, toPrisma)
  - 集成测试 (真实数据库, 覆盖率 ≥ 80%)

#### [STORY-SETTING-001-004: API Endpoints 实现](./STORY-SETTING-001-004.md)

- **Story Points**: 3 SP
- **预估时间**: 9 小时
- **负责人**: Backend Developer
- **依赖**: ✅ STORY-002, ✅ STORY-003
- **交付物**:
  - UserPreferenceController (10 个 API 端点)
  - RESTful API 设计:
    - `POST /api/v1/user-preferences` (创建)
    - `GET /api/v1/user-preferences?accountUuid=...` (查询)
    - `PATCH /api/v1/user-preferences/:accountUuid/theme` (更新主题)
    - `PATCH .../language`, `.../notifications`, `.../shortcuts` (单项更新)
    - `PUT /api/v1/user-preferences/:accountUuid` (批量更新)
    - `DELETE /api/v1/user-preferences/:accountUuid` (删除)
  - Request DTOs with Validation (class-validator)
  - 统一错误处理 (handleError 方法)
  - Swagger API 文档
  - E2E 测试 (supertest, 覆盖率 ≥ 80%)

---

### 💻 Frontend 基础层

#### [STORY-SETTING-001-005: Client Services 实现](./STORY-SETTING-001-005.md)

- **Story Points**: 2 SP
- **预估时间**: 8 小时
- **负责人**: Frontend Developer
- **依赖**: ✅ STORY-004
- **交付物**:
  - UserPreferenceClientService (10 个方法)
  - UserPreferenceAPI (HTTP Client 封装)
  - 本地缓存 (currentPreference)
  - 乐观更新 (Optimistic Update + Rollback on Failure)
  - 事件系统 (EventEmitter):
    - `onThemeChanged`
    - `onLanguageChanged`
    - `onNotificationsChanged`
    - `onPreferenceChanged` (通用)
    - `onError`
  - 主题应用逻辑 (applyTheme → DOM)
  - 单元测试 (Mock API, 覆盖率 ≥ 80%)

---

### 🎨 Frontend UI 层

#### [STORY-SETTING-001-006: UI - 外观设置页面](./STORY-SETTING-001-006.md)

- **Story Points**: 3 SP
- **预估时间**: 10.5 小时
- **负责人**: Frontend Developer
- **依赖**: ✅ STORY-005
- **交付物**:
  - `AppearanceSettings.vue` 页面
  - `ThemeSelector.vue` (3 个主题选项 + 预览图)
  - `LanguageSelector.vue` (下拉菜单, 3 种语言)
  - `FontSizeSlider.vue` (12-24px 范围, 实时预览)
  - `SidebarPositionToggle.vue` (Left/Right 切换)
  - 主题切换动画 (CSS 变量 + 过渡效果)
  - 响应式布局 (桌面/移动)
  - 组件测试 (覆盖率 ≥ 80%)

#### [STORY-SETTING-001-007: UI - 通知设置页面](./STORY-SETTING-001-007.md)

- **Story Points**: 3 SP
- **预估时间**: 10 小时
- **负责人**: Frontend Developer
- **依赖**: ✅ STORY-005
- **交付物**:
  - `NotificationSettings.vue` 页面
  - `NotificationToggle.vue` (总开关)
  - `NotificationChannels.vue` (Push, Email, SMS 选择器 + 至少选择一个验证)
  - `DoNotDisturbPicker.vue` (时间选择器 + 时间格式验证 + 跨天支持)
  - `NotificationSoundToggle.vue` (声音开关 + 测试按钮)
  - `NotificationPreview.vue` (设置摘要)
  - 发送测试通知功能
  - 组件测试 (覆盖率 ≥ 80%)

#### [STORY-SETTING-001-008: UI - 快捷键设置页面](./STORY-SETTING-001-008.md)

- **Story Points**: 3 SP
- **预估时间**: 11.5 小时
- **负责人**: Frontend Developer
- **依赖**: ✅ STORY-005
- **交付物**:
  - `ShortcutSettings.vue` 页面
  - `ShortcutList.vue` (分组显示 30+ 快捷键)
  - `ShortcutEditor.vue` (快捷键捕获 + 编辑模式)
  - `ShortcutConflictDetector.ts` (冲突检测 + 系统保留检测)
  - `ShortcutFormatter.ts` (格式化 + 平台适配 Mac/Windows)
  - 快捷键搜索功能
  - 恢复默认功能 (单个 + 全部)
  - 组件测试 (覆盖率 ≥ 80%)

---

### 🧪 测试层

#### [STORY-SETTING-001-009: E2E 测试](./STORY-SETTING-001-009.md)

- **Story Points**: 2 SP
- **预估时间**: 8 小时
- **负责人**: QA Engineer
- **依赖**: ✅ STORY-006, ✅ STORY-007, ✅ STORY-008
- **交付物**:
  - Playwright 配置 (Chromium + Firefox)
  - 测试 Fixtures (自动登录 + 重置偏好)
  - `appearance.spec.ts` (5 个测试场景)
  - `notifications.spec.ts` (4 个测试场景)
  - `shortcuts.spec.ts` (4 个测试场景)
  - `persistence.spec.ts` (登出登入 + 多标签同步)
  - `error-handling.spec.ts` (网络错误 + 验证错误 + 并发修改)
  - HTML 测试报告
  - GitHub Actions CI 集成

---

## 📅 开发时间表

### Week 1: Backend 开发 (Day 1-5)

**Day 1: Contracts & Domain**

- 上午: STORY-001 (Contracts 类型定义 + Zod Schema)
- 下午: STORY-001 (Domain 实体 + 单元测试)

**Day 2: Application Service**

- 上午: STORY-002 (Repository 接口 + Service 实现)
- 下午: STORY-002 (单元测试 + Mock Repository)

**Day 3: Infrastructure**

- 上午: STORY-003 (Prisma Schema + Migration)
- 下午: STORY-003 (Repository 实现 + Mapper)

**Day 4: API Endpoints**

- 上午: STORY-004 (Controller + DTOs)
- 下午: STORY-004 (Swagger 文档 + 错误处理)

**Day 5: API E2E Tests + Client Services**

- 上午: STORY-004 (E2E 测试)
- 下午: STORY-005 (Client Service + API Client)

---

### Week 2: Frontend 开发 + 测试 (Day 6-10)

**Day 6: Client Services + 外观设置**

- 上午: STORY-005 (事件系统 + 乐观更新 + 单元测试)
- 下午: STORY-006 (AppearanceSettings 页面 + ThemeSelector)

**Day 7: 外观设置**

- 上午: STORY-006 (LanguageSelector + FontSizeSlider)
- 下午: STORY-006 (SidebarPositionToggle + 组件测试)

**Day 8: 通知设置**

- 上午: STORY-007 (NotificationSettings 页面 + 总开关 + 渠道选择器)
- 下午: STORY-007 (免打扰时间 + 声音开关 + 测试通知)

**Day 9: 快捷键设置**

- 上午: STORY-008 (ShortcutSettings 页面 + 列表 + 编辑器)
- 下午: STORY-008 (冲突检测 + 格式化 + 搜索 + 恢复默认)

**Day 10: E2E 测试 + Sprint Review**

- 上午: STORY-009 (Playwright E2E 测试全套)
- 下午: Sprint Review + Retrospective

---

## 📊 Story 状态追踪

| Story ID  | 名称                | Story Points | 状态      | 负责人       | 完成日期 |
| --------- | ------------------- | ------------ | --------- | ------------ | -------- |
| STORY-001 | Contracts & Domain  | 2 SP         | ⏸️ 待开始 | Backend Dev  | -        |
| STORY-002 | Application Service | 3 SP         | ⏸️ 待开始 | Backend Dev  | -        |
| STORY-003 | Infrastructure      | 2 SP         | ⏸️ 待开始 | Backend Dev  | -        |
| STORY-004 | API Endpoints       | 3 SP         | ⏸️ 待开始 | Backend Dev  | -        |
| STORY-005 | Client Services     | 2 SP         | ⏸️ 待开始 | Frontend Dev | -        |
| STORY-006 | UI - 外观设置       | 3 SP         | ⏸️ 待开始 | Frontend Dev | -        |
| STORY-007 | UI - 通知设置       | 3 SP         | ⏸️ 待开始 | Frontend Dev | -        |
| STORY-008 | UI - 快捷键设置     | 3 SP         | ⏸️ 待开始 | Frontend Dev | -        |
| STORY-009 | E2E 测试            | 2 SP         | ⏸️ 待开始 | QA Engineer  | -        |

**总计**: 9 个 Stories, 23 SP

---

## 🎯 Definition of Done (Sprint Level)

Sprint 1 被认为完成，当且仅当：

### 功能完整性

- [x] 用户可以设置主题、语言、字体大小、侧边栏位置
- [x] 用户可以配置通知偏好 (启用/禁用、渠道、免打扰、声音)
- [x] 用户可以自定义快捷键 (30+ 个快捷键可配置)
- [x] 所有设置自动保存到服务器
- [x] 所有设置在刷新/登出登入后保持

### 代码质量

- [x] 所有代码通过 TypeScript strict 检查
- [x] 所有代码通过 ESLint 检查
- [x] 单元测试覆盖率 ≥ 80% (Backend + Frontend)
- [x] E2E 测试覆盖率 ≥ 80%
- [x] 所有测试通过 (Unit + Integration + E2E)

### 文档

- [x] API 文档完整 (Swagger)
- [x] 所有公共方法有 JSDoc 注释
- [x] README 更新 (如有新依赖)

### Code Review

- [x] 所有 Story 通过 Code Review
- [x] 所有反馈已解决
- [x] PR 已合并到 dev 分支

### 部署

- [x] 数据库 Migration 已应用
- [x] 应用已部署到 Staging 环境
- [x] Staging 环境测试通过

---

## 🚀 Sprint 目标

**主要目标**: 实现用户偏好设置功能，允许用户自定义应用外观、通知和快捷键

**成功指标**:

- ✅ 用户可以保存和加载个性化设置
- ✅ 主题切换实时生效
- ✅ 快捷键系统工作正常
- ✅ 所有设置持久化到数据库
- ✅ E2E 测试覆盖所有核心场景

---

## 📝 会议安排

### Sprint Planning (Day 0)

- **时间**: Sprint 开始前 1 天
- **参与者**: PO Sarah, SM Bob, Dev James, QA Quinn
- **议程**: 讲解所有 9 个 Stories, 澄清需求, 确认 DoD

### Daily Standup (每天)

- **时间**: 每天上午 9:30
- **时长**: 15 分钟
- **格式**: 昨天做了什么 / 今天做什么 / 有什么阻碍

### Sprint Review (Day 10 下午)

- **时间**: Sprint 最后一天下午
- **参与者**: 全团队 + Stakeholders
- **议程**: Demo 所有功能, 收集反馈

### Sprint Retrospective (Day 10 下午)

- **时间**: Sprint Review 之后
- **参与者**: 全团队
- **议程**: What went well / What didn't / Action items

---

## 📌 注意事项

1. **依赖顺序**: 必须按照 Backend → Frontend → E2E 的顺序开发
2. **每日集成**: 每个 Story 完成后立即集成，避免最后一天大量冲突
3. **测试优先**: 单元测试和 E2E 测试不能省略
4. **Code Review**: 每个 PR 必须至少 1 人 Review 通过
5. **数据库 Migration**: STORY-003 完成后立即应用 Migration 到所有环境

---

**文档创建日期**: 2025-10-21  
**创建者**: SM Bob  
**最后更新**: 2025-10-21
