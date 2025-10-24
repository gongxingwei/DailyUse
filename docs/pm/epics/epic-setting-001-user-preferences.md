# Epic: 用户偏好设置

> **Epic ID**: EPIC-SETTING-001  
> **Feature Spec**: [SETTING-001](../modules/setting/features/01-user-preferences.md)  
> **优先级**: P0  
> **模块**: Setting  
> **Sprint**: Sprint 1  
> **状态**: Draft

---

## 📋 Epic 概述

### 业务价值

提供用户个性化配置能力，让每个用户可以根据自己的偏好定制 DailyUse 的界面和行为，提升用户体验和满意度。

**核心收益**:

- 🎨 **外观定制**: 主题、语言、字体大小、侧边栏位置
- 🔔 **通知控制**: 渠道选择、免打扰模式、声音设置
- ⌨️ **快捷键**: 自定义全局和编辑器快捷键
- 🌍 **区域设置**: 时区、日期格式、周起始日

### 目标用户

- **主要用户**: 所有 DailyUse 用户
- **典型场景**:
  - 新用户首次登录进行个性化设置
  - 老用户根据工作环境切换主题（白天/夜晚）
  - 高级用户自定义快捷键提升效率

---

## 🎯 验收标准

### Epic 级别 AC

```gherkin
Feature: 用户偏好设置
  作为 DailyUse 用户
  我希望能够自定义应用的外观和行为
  以便获得更舒适和高效的使用体验

Scenario: 完整的偏好设置流程
  Given 用户首次登录 DailyUse
  When 用户打开设置页面
  Then 应该看到完整的偏好设置选项
  And 所有设置都有合理的默认值
  And 用户可以修改任何设置
  And 修改后的设置立即生效
  And 设置在刷新后保持
```

---

## 📦 User Stories 分解

### Story 1: Contracts & Domain 层 (2 SP)

**Story ID**: STORY-SETTING-001-001  
**标题**: 定义用户偏好 Contracts 和 Domain 实体

**描述**:

```gherkin
As a 开发者
I want 定义用户偏好的数据结构
So that 前后端可以基于统一的契约开发
```

**任务清单**:

- [ ] 在 `packages/contracts` 创建 `UserPreferenceServerDTO`
- [ ] 定义所有偏好字段（theme, language, notifications等）
- [ ] 在 `packages/domain-server` 创建 `UserPreference` 实体
- [ ] 实现值对象（ThemeType, LanguageType, NotificationSettings）
- [ ] 编写单元测试（覆盖率 ≥ 80%）

**验收标准**:

```gherkin
Scenario: DTO 结构完整
  Given UserPreferenceServerDTO 已定义
  Then 应包含所有必需字段
  And 字段类型符合 TypeScript 严格模式
  And 时间字段使用 number 类型
  And DTO 通过类型检查

Scenario: Domain 实体正确
  Given UserPreference 实体已创建
  Then 应正确映射 DTO 字段
  And 实体方法完整（update, toDTO等）
  And 所有测试通过
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 2: Application Service (3 SP)

**Story ID**: STORY-SETTING-001-002  
**标题**: 实现用户偏好应用服务

**描述**:

```gherkin
As a 后端开发者
I want 创建用户偏好的业务逻辑层
So that API 可以调用统一的服务接口
```

**任务清单**:

- [ ] 创建 `UserPreferenceApplicationService`
- [ ] 实现 `getUserPreference(userId)` 方法
- [ ] 实现 `updateUserPreference(userId, data)` 方法
- [ ] 实现 `resetToDefaults(userId)` 方法
- [ ] 添加输入验证（字段有效性、范围检查）
- [ ] 编写集成测试

**验收标准**:

```gherkin
Scenario: 获取用户偏好
  Given 用户ID存在
  When 调用 getUserPreference
  Then 返回该用户的完整偏好设置
  And 如果用户无设置，返回默认值

Scenario: 更新用户偏好
  Given 用户ID存在
  And 更新数据有效
  When 调用 updateUserPreference
  Then 成功更新用户偏好
  And 返回更新后的数据
  And updatedAt 字段更新为当前时间戳

Scenario: 重置为默认
  Given 用户ID存在
  When 调用 resetToDefaults
  Then 用户偏好恢复为默认值
  And 返回默认设置
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 3: Infrastructure & Repository (2 SP)

**Story ID**: STORY-SETTING-001-003  
**标题**: 实现用户偏好数据持久化

**描述**:

```gherkin
As a 后端开发者
I want 实现用户偏好的数据库操作
So that 偏好设置可以持久化存储
```

**任务清单**:

- [ ] 创建 Prisma Schema (`UserPreference` 模型)
- [ ] 运行 Prisma 迁移
- [ ] 实现 `UserPreferenceRepository`
- [ ] 实现 `findByUserId` 方法
- [ ] 实现 `save` 方法
- [ ] 实现 `delete` 方法
- [ ] 编写 Repository 测试（使用测试数据库）

**验收标准**:

```gherkin
Scenario: Schema 正确定义
  Given Prisma Schema 已更新
  Then UserPreference 模型包含所有字段
  And 字段类型正确映射（JSON for nested objects）
  And 设置了正确的索引（userId unique）

Scenario: Repository 方法可用
  Given Repository 已实现
  When 调用 save 方法
  Then 数据正确保存到数据库
  And 可以通过 findByUserId 查询
  And 所有测试通过
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 4: API Endpoints (3 SP)

**Story ID**: STORY-SETTING-001-004  
**标题**: 创建用户偏好 REST API

**描述**:

```gherkin
As a 前端开发者
I want 调用用户偏好的 HTTP API
So that Web/Desktop 应用可以读写用户设置
```

**任务清单**:

- [ ] 创建 `UserPreferenceController`
- [ ] 实现 `GET /api/user-preferences/:userId` 端点
- [ ] 实现 `PUT /api/user-preferences/:userId` 端点
- [ ] 实现 `POST /api/user-preferences/:userId/reset` 端点
- [ ] 添加请求验证（Zod schema）
- [ ] 添加错误处理（404, 400, 500）
- [ ] 编写 API 测试（使用 supertest）
- [ ] 更新 OpenAPI 文档

**验收标准**:

```gherkin
Scenario: GET 用户偏好
  Given 用户已认证
  When 发送 GET /api/user-preferences/:userId
  Then 返回 200 状态码
  And 响应体包含 UserPreferenceServerDTO
  And 如果用户无设置，返回默认值

Scenario: PUT 更新偏好
  Given 用户已认证
  And 请求体包含有效的偏好数据
  When 发送 PUT /api/user-preferences/:userId
  Then 返回 200 状态码
  And 响应体包含更新后的数据
  And 数据已保存到数据库

Scenario: POST 重置偏好
  Given 用户已认证
  When 发送 POST /api/user-preferences/:userId/reset
  Then 返回 200 状态码
  And 响应体包含默认设置
  And 数据库中的设置已重置

Scenario: 错误处理
  Given 用户未认证
  When 发送任何请求
  Then 返回 401 状态码

  Given 请求体数据无效
  When 发送 PUT 请求
  Then 返回 400 状态码
  And 包含详细的错误信息
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 5: Client Services (2 SP)

**Story ID**: STORY-SETTING-001-005  
**标题**: 实现用户偏好客户端服务

**描述**:

```gherkin
As a 前端开发者
I want 封装用户偏好的 HTTP 调用
So that UI 组件可以方便地读写设置
```

**任务清单**:

- [ ] 在 `packages/domain-client` 创建 `UserPreferenceClientService`
- [ ] 实现 `getUserPreference()` 方法
- [ ] 实现 `updateUserPreference(data)` 方法
- [ ] 实现 `resetToDefaults()` 方法
- [ ] 添加错误处理和重试逻辑
- [ ] 集成 React Query（缓存、自动刷新）
- [ ] 编写客户端测试（mock HTTP）

**验收标准**:

```gherkin
Scenario: 获取用户偏好
  Given 用户已登录
  When 调用 getUserPreference
  Then 发送 GET 请求到 API
  And 返回 UserPreferenceClientDTO
  And 数据被 React Query 缓存

Scenario: 更新偏好
  Given 用户已登录
  And 有新的偏好数据
  When 调用 updateUserPreference
  Then 发送 PUT 请求到 API
  And 乐观更新本地缓存
  And 请求成功后确认缓存
  And 请求失败时回滚缓存

Scenario: 错误处理
  Given API 返回错误
  When 调用任何方法
  Then 抛出友好的错误信息
  And 包含错误代码和详情
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

### Story 6: UI Components - 外观设置 (3 SP)

**Story ID**: STORY-SETTING-001-006  
**标题**: 创建外观设置 UI 组件

**描述**:

```gherkin
As a 用户
I want 在设置页面修改外观选项
So that 可以自定义应用的视觉风格
```

**任务清单**:

- [ ] 创建 `AppearanceSettings.vue` 组件
- [ ] 实现主题切换（亮色/暗色/自动）
- [ ] 实现语言切换下拉框
- [ ] 实现字体大小滑块
- [ ] 实现侧边栏位置单选按钮
- [ ] 集成 `UserPreferenceClientService`
- [ ] 添加实时预览（修改立即生效）
- [ ] 编写组件测试（Vitest + Testing Library）

**验收标准**:

```gherkin
Scenario: 主题切换
  Given 用户在外观设置页面
  When 选择 "暗色主题"
  Then 应用立即切换为暗色模式
  And 设置自动保存到服务器
  And 页面刷新后主题保持

Scenario: 语言切换
  Given 用户在外观设置页面
  When 选择 "English"
  Then 界面文本切换为英文
  And 设置自动保存
  And 下次登录时保持英文

Scenario: 字体大小调整
  Given 用户在外观设置页面
  When 拖动字体大小滑块
  Then 界面字体实时变化
  And 滑块旁显示当前大小（如 "16px"）
  And 设置自动保存

Scenario: 重置为默认
  Given 用户修改了多个外观设置
  When 点击 "重置为默认" 按钮
  Then 所有外观设置恢复默认值
  And 界面立即更新
  And 服务器设置已重置
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 7: UI Components - 通知设置 (3 SP)

**Story ID**: STORY-SETTING-001-007  
**标题**: 创建通知设置 UI 组件

**描述**:

```gherkin
As a 用户
I want 配置通知偏好
So that 可以控制何时和如何接收通知
```

**任务清单**:

- [ ] 创建 `NotificationSettings.vue` 组件
- [ ] 实现通知渠道多选框（应用内/桌面/邮件）
- [ ] 实现免打扰模式开关和时间选择器
- [ ] 实现声音设置单选按钮
- [ ] 集成 `UserPreferenceClientService`
- [ ] 添加通知权限检查（浏览器 API）
- [ ] 编写组件测试

**验收标准**:

```gherkin
Scenario: 启用桌面通知
  Given 用户在通知设置页面
  When 勾选 "桌面推送"
  Then 弹出浏览器通知权限请求
  And 用户授权后，设置保存
  And 后续会收到桌面通知

Scenario: 配置免打扰模式
  Given 用户在通知设置页面
  When 启用免打扰并设置时间 22:00-08:00
  Then 设置立即保存
  And 该时间段内不会收到通知
  And 时间段外正常接收通知

Scenario: 声音设置
  Given 用户在通知设置页面
  When 选择 "无声"
  Then 通知不再播放声音
  And 设置保存
  And 可以通过 "播放测试" 按钮验证
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 8: UI Components - 快捷键设置 (3 SP)

**Story ID**: STORY-SETTING-001-008  
**标题**: 创建快捷键设置 UI 组件

**描述**:

```gherkin
As a 高级用户
I want 自定义快捷键
So that 可以根据自己的习惯提升操作效率
```

**任务清单**:

- [ ] 创建 `ShortcutSettings.vue` 组件
- [ ] 实现快捷键显示列表（全局/编辑器）
- [ ] 实现快捷键录制对话框（监听键盘输入）
- [ ] 添加冲突检测（不允许重复快捷键）
- [ ] 实现 "恢复默认" 功能
- [ ] 实现 "导入/导出配置" 功能
- [ ] 编写组件测试

**验收标准**:

```gherkin
Scenario: 修改快捷键
  Given 用户在快捷键设置页面
  When 点击 "创建任务" 的 "修改" 按钮
  Then 打开快捷键录制对话框
  And 提示 "请按下新的快捷键组合"

  When 用户按下 Ctrl+Shift+N
  Then 对话框显示 "Ctrl+Shift+N"
  And 检测无冲突时，允许保存
  And 保存后列表更新
  And 新快捷键立即生效

Scenario: 冲突检测
  Given "快速搜索" 已使用 Ctrl+K
  When 用户尝试将 "创建任务" 改为 Ctrl+K
  Then 显示冲突警告
  And 提示 "该快捷键已被 '快速搜索' 使用"
  And 不允许保存

Scenario: 导出配置
  Given 用户自定义了多个快捷键
  When 点击 "导出配置" 按钮
  Then 下载 shortcuts.json 文件
  And 文件包含所有自定义快捷键

Scenario: 导入配置
  Given 用户有导出的配置文件
  When 点击 "导入配置" 并选择文件
  Then 快捷键设置被导入
  And 显示确认提示
  And 新设置立即生效
```

**Story Points**: 3  
**预估工时**: 1-1.5 天

---

### Story 9: E2E Tests (2 SP)

**Story ID**: STORY-SETTING-001-009  
**标题**: 编写用户偏好 E2E 测试

**描述**:

```gherkin
As a QA 工程师
I want 编写端到端测试
So that 确保用户偏好功能在真实环境中正常工作
```

**任务清单**:

- [ ] 使用 Playwright 编写 E2E 测试
- [ ] 测试完整的用户流程（登录 → 设置 → 验证）
- [ ] 测试跨页面的设置持久化
- [ ] 测试多设备同步（如果支持）
- [ ] 测试边界情况（极端值、无效输入）
- [ ] 集成到 CI/CD Pipeline

**验收标准**:

```gherkin
Scenario: 完整的设置流程
  Given 用户登录 DailyUse
  When 用户依次修改外观、通知、快捷键设置
  And 点击保存
  Then 所有设置成功保存

  When 用户刷新页面
  Then 所有设置保持不变

  When 用户登出并重新登录
  Then 所有设置依然保持

Scenario: 主题切换验证
  Given 用户在亮色主题下
  When 切换到暗色主题
  Then 页面立即变为暗色
  And CSS 变量正确更新
  And 导航到其他页面后主题保持
```

**Story Points**: 2  
**预估工时**: 4-6 小时

---

## 📊 Story 统计

| Story ID              | 标题                        | SP  | 工时   | 依赖          |
| --------------------- | --------------------------- | --- | ------ | ------------- |
| STORY-SETTING-001-001 | Contracts & Domain          | 2   | 4-6h   | -             |
| STORY-SETTING-001-002 | Application Service         | 3   | 1-1.5d | 001           |
| STORY-SETTING-001-003 | Infrastructure & Repository | 2   | 4-6h   | 002           |
| STORY-SETTING-001-004 | API Endpoints               | 3   | 1-1.5d | 003           |
| STORY-SETTING-001-005 | Client Services             | 2   | 4-6h   | 004           |
| STORY-SETTING-001-006 | UI - 外观设置               | 3   | 1-1.5d | 005           |
| STORY-SETTING-001-007 | UI - 通知设置               | 3   | 1-1.5d | 005           |
| STORY-SETTING-001-008 | UI - 快捷键设置             | 3   | 1-1.5d | 005           |
| STORY-SETTING-001-009 | E2E Tests                   | 2   | 4-6h   | 006, 007, 008 |

**总计**: 23 SP, 预估 8-10 工作日（1.5-2 周）

---

## 🔗 技术依赖

### 外部依赖

- **无** - 用户偏好是基础设施功能，不依赖其他模块

### 技术栈

- **Backend**: Express, Prisma, TypeScript
- **Frontend**: Vue 3, TypeScript, Pinia (状态管理)
- **Testing**: Vitest, Playwright, Supertest

### 数据库 Schema

```prisma
model UserPreference {
  id                String   @id @default(uuid())
  userId            String   @unique

  // 外观
  theme             String   @default("light")
  language          String   @default("zh-CN")
  fontSize          Int      @default(14)
  sidebarPosition   String   @default("left")

  // 通知（存储为 JSON）
  notificationSettings Json   @default("{\"enabled\":true,\"channels\":[\"in_app\"],\"dndEnabled\":false,\"soundEnabled\":true}")

  // 快捷键（存储为 JSON）
  shortcuts         Json     @default("{}")

  // 其他
  timezone          String   @default("Asia/Shanghai")
  weekStartDay      Int      @default(1)
  dateFormat        String   @default("YYYY-MM-DD")

  updatedAt         BigInt

  @@map("user_preferences")
}
```

---

## ✅ Epic Definition of Done

- [ ] 所有 9 个 Stories 状态为 Done
- [ ] 所有测试通过（单元 + 集成 + E2E）
- [ ] 代码覆盖率 ≥ 80%
- [ ] API 文档完整（OpenAPI）
- [ ] UI 组件库文档更新
- [ ] 性能测试通过（设置加载 < 200ms）
- [ ] 可访问性测试通过（WCAG AA）
- [ ] 产品验收通过

---

## 🚀 发布计划

### Sprint 1 (Week 1-2)

**Week 1**:

- Day 1-2: Story 001-003 (Contracts + Application + Infrastructure)
- Day 3-4: Story 004-005 (API + Client Services)
- Day 5: Code Review & Fixes

**Week 2**:

- Day 1-2: Story 006-007 (UI - 外观 + 通知)
- Day 3: Story 008 (UI - 快捷键)
- Day 4: Story 009 (E2E Tests)
- Day 5: Final Testing & Bug Fixes

**发布标准**:

- ✅ 所有 Stories Done
- ✅ 无 P0/P1 Bug
- ✅ Performance OK
- ✅ PO 验收通过

---

## 📝 注意事项

### 技术挑战

1. **主题切换性能**: 需要优化 CSS 变量切换，避免闪烁
2. **快捷键冲突**: 需要全局快捷键管理器，防止冲突
3. **跨设备同步**: 如果支持多设备，需要同步机制

### 风险与缓解

| 风险                 | 影响 | 缓解策略                  |
| -------------------- | ---- | ------------------------- |
| 浏览器通知权限被拒绝 | 中   | 提供友好的引导和备选方案  |
| 快捷键与系统冲突     | 低   | 检测并警告用户            |
| JSON 字段过大        | 低   | 限制快捷键数量（< 50 个） |

---

_Epic 创建于: 2025-10-21_  
_下一步: 开始 Story 001 开发_
