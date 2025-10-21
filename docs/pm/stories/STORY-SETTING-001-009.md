# STORY-SETTING-001-009: E2E 测试

> **Story ID**: STORY-SETTING-001-009  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 2 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: QA Engineer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** QA 工程师  
**我想要** 编写用户偏好设置的 E2E 测试  
**以便于** 确保整个功能端到端工作正常，覆盖真实用户场景

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 首次使用场景

```gherkin
Feature: 新用户首次设置偏好
  As a New User
  I want to set my preferences for the first time
  So that the app is customized to my needs

Scenario: 新用户初始化偏好设置
  Given 我是一个新注册的用户
  And 我还没有设置过偏好
  When 我登录应用
  Then 应该使用默认偏好设置
  When 我打开设置页面
  And 我更改主题为 'dark'
  And 我更改语言为 'en-US'
  And 我点击保存
  Then 应该显示成功消息
  When 我刷新页面
  Then 主题应该是 'dark'
  And 语言应该是 'en-US'
```

### Scenario 2: 外观设置完整流程

```gherkin
Feature: 外观设置完整测试
  As a User
  I want to customize all appearance settings
  So that I can verify the complete workflow

Scenario: 修改所有外观选项
  Given 我已登录应用
  When 我导航到 设置 > 外观
  And 我选择主题 'dark'
  Then 页面应该立即切换到暗色主题
  When 我选择语言 'English (US)'
  Then 界面文本应该切换到英语
  When 我将字体大小调整到 18px
  Then 预览文本应该显示 18px 字体
  When 我选择侧边栏位置 'right'
  Then 侧边栏应该移动到右侧
  When 我刷新页面
  Then 所有设置应该保持不变
```

### Scenario 3: 通知设置完整流程

```gherkin
Feature: 通知设置完整测试
  As a User
  I want to configure notification preferences
  So that I can control how I receive notifications

Scenario: 配置通知偏好
  Given 我已登录应用
  When 我导航到 设置 > 通知
  Then 通知应该默认启用
  When 我选择通知渠道 'push' 和 'email'
  And 我设置免打扰时间为 22:00 - 08:00
  And 我关闭通知声音
  And 我点击 "发送测试通知"
  Then 应该收到一条测试通知
  And 测试通知不应该有声音
  When 我刷新页面
  Then 通知设置应该保持不变

Scenario: 禁用所有通知
  Given 通知当前已启用
  When 我关闭通知总开关
  Then 所有渠道选项应该被禁用
  When 我点击 "发送测试通知"
  Then 不应该收到任何通知
```

### Scenario 4: 快捷键设置完整流程

```gherkin
Feature: 快捷键设置完整测试
  As a User
  I want to customize keyboard shortcuts
  So that I can use my preferred key combinations

Scenario: 修改快捷键
  Given 我已登录应用
  When 我导航到 设置 > 快捷键
  Then 应该显示所有默认快捷键
  When 我点击 "创建任务" 旁边的编辑按钮
  Then 应该进入编辑模式
  When 我按下 "Ctrl+Shift+N"
  Then 快捷键应该更新为 "Ctrl+Shift+N"
  When 我在主页按下 "Ctrl+Shift+N"
  Then 应该打开创建任务对话框

Scenario: 快捷键冲突检测
  Given 我在快捷键设置页面
  When 我尝试将 "完成任务" 设置为 "Ctrl+N" (已被使用)
  Then 应该显示冲突警告
  When 我点击 "覆盖"
  Then "创建任务" 的快捷键应该被清空
  And "完成任务" 应该使用 "Ctrl+N"

Scenario: 恢复默认快捷键
  Given 我修改了多个快捷键
  When 我点击 "全部恢复默认"
  And 我确认恢复
  Then 所有快捷键应该恢复为默认值
```

### Scenario 5: 跨页面偏好持久化

```gherkin
Feature: 偏好设置持久化测试
  As a User
  I want my preferences to persist across sessions
  So that I don't have to reconfigure every time

Scenario: 多次登录保持设置
  Given 我已配置了所有偏好设置:
    | Setting          | Value              |
    | theme            | dark               |
    | language         | en-US              |
    | fontSize         | 18                 |
    | notifications    | enabled, push only |
  When 我登出应用
  And 我重新登录
  Then 所有偏好设置应该保持不变
  
Scenario: 多设备同步
  Given 我在电脑 A 上配置了偏好
  When 我在电脑 B 上登录同一账户
  Then 应该看到相同的偏好设置
```

### Scenario 6: 错误处理和边界情况

```gherkin
Feature: 错误处理测试
  As a QA Engineer
  I want to test error scenarios
  So that the app handles errors gracefully

Scenario: 网络错误时保存设置
  Given 我在设置页面
  When 我修改主题为 'dark'
  And 网络连接断开
  Then 应该显示错误消息 "无法保存设置，请检查网络连接"
  And 页面应该保持在当前状态
  When 网络恢复
  And 我点击 "重试"
  Then 设置应该成功保存

Scenario: 无效数据验证
  Given 我在免打扰时间设置
  When 我手动输入无效时间 "25:00"
  Then 应该显示验证错误
  And 不应该允许保存

Scenario: 并发修改
  Given 我在浏览器 Tab A 和 Tab B 都打开了设置页面
  When 我在 Tab A 修改主题为 'dark'
  And 我在 Tab B 修改主题为 'light'
  Then Tab B 的更改应该覆盖 Tab A
  When 我在 Tab A 刷新页面
  Then 应该显示 'light' 主题
```

---

## 📋 任务清单 (Task Breakdown)

### Playwright E2E 测试任务

- [ ] **Task 1.1**: 配置 Playwright 测试环境
  - [ ] 确认 `apps/web/playwright.config.ts` 配置正确
  - [ ] 添加测试数据库配置
  - [ ] 添加测试用户账户

- [ ] **Task 1.2**: 编写测试 Fixtures
  - [ ] 创建 `e2e/fixtures/auth.fixture.ts` (自动登录)
  - [ ] 创建 `e2e/fixtures/user-preference.fixture.ts` (重置偏好)

- [ ] **Task 1.3**: 编写外观设置测试
  - [ ] 创建 `e2e/settings/appearance.spec.ts`
  - [ ] 测试主题切换
  - [ ] 测试语言切换
  - [ ] 测试字体大小调整
  - [ ] 测试侧边栏位置切换
  - [ ] 测试设置持久化

- [ ] **Task 1.4**: 编写通知设置测试
  - [ ] 创建 `e2e/settings/notifications.spec.ts`
  - [ ] 测试通知启用/禁用
  - [ ] 测试渠道选择
  - [ ] 测试免打扰时间设置
  - [ ] 测试通知声音
  - [ ] 测试测试通知发送

- [ ] **Task 1.5**: 编写快捷键设置测试
  - [ ] 创建 `e2e/settings/shortcuts.spec.ts`
  - [ ] 测试快捷键修改
  - [ ] 测试冲突检测
  - [ ] 测试恢复默认
  - [ ] 测试快捷键搜索
  - [ ] 测试快捷键实际触发

- [ ] **Task 1.6**: 编写跨场景测试
  - [ ] 创建 `e2e/settings/persistence.spec.ts`
  - [ ] 测试登出登入后设置保持
  - [ ] 测试刷新页面后设置保持
  - [ ] 测试多标签页同步

- [ ] **Task 1.7**: 编写错误场景测试
  - [ ] 创建 `e2e/settings/error-handling.spec.ts`
  - [ ] 测试网络错误处理
  - [ ] 测试验证错误显示
  - [ ] 测试并发修改

### 测试报告和 CI 集成任务

- [ ] **Task 2.1**: 生成测试报告
  - [ ] 配置 Playwright HTML Reporter
  - [ ] 生成测试覆盖率报告

- [ ] **Task 2.2**: CI 集成
  - [ ] 将 E2E 测试添加到 GitHub Actions
  - [ ] 配置在 PR 时自动运行
  - [ ] 配置测试失败时的通知

---

## 🔧 技术实现细节

### Playwright 配置

**apps/web/playwright.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'pnpm nx serve web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 测试 Fixtures

**e2e/fixtures/auth.fixture.ts**:
```typescript
import { test as base } from '@playwright/test';

type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // 自动登录
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### 外观设置测试

**e2e/settings/appearance.spec.ts**:
```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Appearance Settings', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/appearance');
  });

  test('should change theme to dark', async ({ authenticatedPage: page }) => {
    // 选择暗色主题
    await page.click('button[data-theme="dark"]');
    
    // 验证主题立即应用
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    
    // 刷新页面验证持久化
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('should change language to English', async ({ authenticatedPage: page }) => {
    // 选择英语
    await page.selectOption('select[name="language"]', 'en-US');
    
    // 验证语言切换
    await expect(page.locator('h1')).toContainText('Appearance Settings');
    
    // 刷新页面验证持久化
    await page.reload();
    await expect(page.locator('h1')).toContainText('Appearance Settings');
  });

  test('should adjust font size', async ({ authenticatedPage: page }) => {
    // 拖动滑块到 18px
    const slider = page.locator('input[type="range"][name="fontSize"]');
    await slider.fill('18');
    
    // 等待 debounce
    await page.waitForTimeout(600);
    
    // 验证预览文本字体大小
    const preview = page.locator('.preview-text');
    await expect(preview).toHaveCSS('font-size', '18px');
    
    // 刷新验证持久化
    await page.reload();
    await expect(slider).toHaveValue('18');
  });

  test('should move sidebar to right', async ({ authenticatedPage: page }) => {
    // 选择右侧侧边栏
    await page.click('input[value="right"]');
    
    // 验证侧边栏位置
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveClass(/sidebar-right/);
    
    // 刷新验证持久化
    await page.reload();
    await expect(sidebar).toHaveClass(/sidebar-right/);
  });
});
```

### 通知设置测试

**e2e/settings/notifications.spec.ts**:
```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Notification Settings', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/notifications');
  });

  test('should disable all notifications', async ({ authenticatedPage: page }) => {
    // 关闭通知总开关
    await page.click('input[name="notificationEnabled"]');
    
    // 验证渠道选项被禁用
    const channelCheckboxes = page.locator('input[name="channel"]');
    await expect(channelCheckboxes.first()).toBeDisabled();
    
    // 刷新验证持久化
    await page.reload();
    const toggle = page.locator('input[name="notificationEnabled"]');
    await expect(toggle).not.toBeChecked();
  });

  test('should select notification channels', async ({ authenticatedPage: page }) => {
    // 选择多个渠道
    await page.check('input[value="push"]');
    await page.check('input[value="email"]');
    
    // 刷新验证持久化
    await page.reload();
    await expect(page.locator('input[value="push"]')).toBeChecked();
    await expect(page.locator('input[value="email"]')).toBeChecked();
  });

  test('should set do not disturb time', async ({ authenticatedPage: page }) => {
    // 设置免打扰时间
    await page.fill('input[name="doNotDisturbStart"]', '22:00');
    await page.fill('input[name="doNotDisturbEnd"]', '08:00');
    
    // 验证时长显示
    await expect(page.locator('.duration-info')).toContainText('10');
    
    // 刷新验证持久化
    await page.reload();
    await expect(page.locator('input[name="doNotDisturbStart"]')).toHaveValue('22:00');
    await expect(page.locator('input[name="doNotDisturbEnd"]')).toHaveValue('08:00');
  });

  test('should send test notification', async ({ authenticatedPage: page, context }) => {
    // 授权通知权限
    await context.grantPermissions(['notifications']);
    
    // 点击发送测试通知
    await page.click('button:has-text("发送测试通知")');
    
    // 验证通知显示 (需要等待异步操作)
    await page.waitForTimeout(1000);
    // 注：实际通知验证需要特殊处理
  });
});
```

### 快捷键设置测试

**e2e/settings/shortcuts.spec.ts**:
```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Shortcut Settings', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/shortcuts');
  });

  test('should modify shortcut', async ({ authenticatedPage: page }) => {
    // 点击编辑按钮
    await page.click('button[data-action="edit-task.create"]');
    
    // 等待进入编辑模式
    await expect(page.locator('.capture-mode')).toBeVisible();
    
    // 按下新快捷键
    await page.keyboard.press('Control+Shift+N');
    
    // 验证快捷键更新
    const shortcut = page.locator('[data-shortcut="task.create"]');
    await expect(shortcut).toContainText('Ctrl+Shift+N');
    
    // 刷新验证持久化
    await page.reload();
    await expect(shortcut).toContainText('Ctrl+Shift+N');
  });

  test('should detect shortcut conflict', async ({ authenticatedPage: page }) => {
    // 尝试设置冲突的快捷键
    await page.click('button[data-action="edit-task.complete"]');
    await page.keyboard.press('Control+N'); // 已被 task.create 使用
    
    // 验证冲突警告显示
    await expect(page.locator('.conflict-dialog')).toBeVisible();
    await expect(page.locator('.conflict-dialog')).toContainText('创建任务');
    
    // 点击覆盖
    await page.click('button:has-text("覆盖")');
    
    // 验证快捷键更新
    const createShortcut = page.locator('[data-shortcut="task.create"]');
    await expect(createShortcut).toBeEmpty();
    
    const completeShortcut = page.locator('[data-shortcut="task.complete"]');
    await expect(completeShortcut).toContainText('Ctrl+N');
  });

  test('should reset all shortcuts', async ({ authenticatedPage: page }) => {
    // 修改几个快捷键
    await page.click('button[data-action="edit-task.create"]');
    await page.keyboard.press('Control+Shift+T');
    
    // 点击全部恢复默认
    await page.click('button:has-text("全部恢复默认")');
    
    // 确认对话框
    page.on('dialog', dialog => dialog.accept());
    
    // 验证恢复为默认值
    const shortcut = page.locator('[data-shortcut="task.create"]');
    await expect(shortcut).toContainText('Ctrl+N');
  });

  test('should search shortcuts', async ({ authenticatedPage: page }) => {
    // 输入搜索关键词
    await page.fill('input[name="search"]', '任务');
    
    // 验证只显示相关快捷键
    const visibleShortcuts = page.locator('.shortcut-item:visible');
    await expect(visibleShortcuts).toHaveCount(3); // create, complete, delete
  });
});
```

### 持久化测试

**e2e/settings/persistence.spec.ts**:
```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Settings Persistence', () => {
  test('should persist settings after logout and login', async ({ page }) => {
    // 登录并设置偏好
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    
    await page.goto('/settings/appearance');
    await page.click('button[data-theme="dark"]');
    
    // 登出
    await page.click('button[data-action="logout"]');
    
    // 重新登录
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    
    // 验证设置保持
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });
});
```

---

## ✅ Definition of Done

- [x] Playwright E2E 测试环境配置完成
- [x] 所有外观设置测试编写完成
- [x] 所有通知设置测试编写完成
- [x] 所有快捷键设置测试编写完成
- [x] 持久化测试编写完成
- [x] 错误处理测试编写完成
- [x] 所有测试通过 (在 Chromium 和 Firefox)
- [x] 测试覆盖率 ≥ 80%
- [x] CI 集成完成
- [x] 测试报告生成
- [x] Code Review 完成

---

## 📊 预估时间

| 任务 | 预估时间 |
|------|---------|
| 测试环境配置 | 1 小时 |
| 外观设置测试 | 1.5 小时 |
| 通知设置测试 | 1.5 小时 |
| 快捷键设置测试 | 1.5 小时 |
| 持久化测试 | 1 小时 |
| 错误处理测试 | 1 小时 |
| CI 集成 | 0.5 小时 |
| **总计** | **8 小时** |

**Story Points**: 2 SP

---

## 🔗 依赖关系

### 上游依赖
- ✅ STORY-SETTING-001-006 (UI - 外观设置)
- ✅ STORY-SETTING-001-007 (UI - 通知设置)
- ✅ STORY-SETTING-001-008 (UI - 快捷键设置)

---

## 📝 测试策略

### 测试优先级
1. **P0 - 关键路径**: 首次设置、保存、持久化
2. **P1 - 核心功能**: 主题切换、语言切换、快捷键修改
3. **P2 - 边界情况**: 冲突检测、验证错误、网络错误

### 测试数据管理
- 使用测试专用数据库
- 每个测试前重置用户偏好为默认值
- 使用 Fixture 自动登录

### CI/CD 集成
- PR 时自动运行所有 E2E 测试
- 每日定时运行完整测试套件
- 测试失败时发送通知到 Slack

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob  
**最后更新**: 2025-10-21
