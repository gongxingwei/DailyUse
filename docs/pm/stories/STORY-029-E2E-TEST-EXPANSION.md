# STORY-029: E2E Test Coverage Expansion

**Story ID**: STORY-029  
**Epic**: Technical Excellence  
**Sprint**: Sprint 4  
**Story Points**: 2 SP  
**Priority**: P1  
**Status**: 🔄 In Progress  
**Assignee**: Dev Team  
**Created**: 2024-10-23  
**Updated**: 2024-10-23

---

## 📋 User Story

**As a** developer  
**I want** comprehensive E2E test coverage  
**So that** we can catch regressions before production and ensure critical user flows work end-to-end

---

## 🎯 Business Value

### Why This Matters

E2E (End-to-End) 测试是质量保障的最后一道防线，模拟真实用户操作流程，确保：

1. **回归检测**: 新功能不会破坏已有功能
2. **用户体验保障**: 关键流程始终可用
3. **发布信心**: 减少生产环境 bug
4. **文档化用户流程**: E2E 测试即活文档

### Success Metrics

- **Coverage**: ≥80% 的关键用户流程被 E2E 测试覆盖
- **Execution Time**: 完整测试套件 < 10 分钟
- **Flakiness**: 误报率 < 5%
- **CI Integration**: 100% 测试在 CI 环境自动执行

---

## ✅ Acceptance Criteria

### AC-1: Task Dependency System E2E Tests ✅
**Given** Task 模块已实现依赖功能 (STORY-022-025)  
**When** 运行 E2E 测试套件  
**Then** 
- ✅ 创建任务依赖 (finish-to-start, start-to-start, etc.)
- ✅ 检测并阻止循环依赖
- ✅ DAG 可视化正确渲染
- ✅ 关键路径高亮显示
- ✅ 依赖状态自动更新 (blocked, ready, etc.)
- ✅ 导出 DAG 为 PNG/JSON

### AC-2: Drag & Drop E2E Tests ✅
**Given** STORY-027 拖放功能已实现  
**When** 运行拖放相关测试  
**Then**
- ✅ 拖动任务卡片可重排序
- ✅ 拖放任务到另一任务可创建依赖
- ✅ 视觉反馈正确显示 (valid/invalid drop zone)
- ✅ Undo/Redo 功能正常

### AC-3: Command Palette E2E Tests ✅
**Given** STORY-026 命令面板已实现  
**When** 运行命令面板测试  
**Then**
- ✅ Ctrl/Cmd + K 打开命令面板
- ✅ 模糊搜索可找到 goals, tasks, reminders
- ✅ 快速操作可执行 (create, edit, delete)
- ✅ 导航功能正常工作
- ✅ 最近项目历史记录正确

### AC-4: Goal System E2E Tests ✅
**Given** Sprint 3 完成的 Goal 模块功能  
**When** 运行 Goal 相关测试  
**Then**
- ✅ Goal DAG 可视化正确
- ✅ Goal 对比功能正常
- ✅ KR 权重调整被记录
- ✅ Goal 导出/导入正常

### AC-5: CI/CD Integration ✅
**Given** E2E 测试套件完成  
**When** 提交代码到 GitHub  
**Then**
- ✅ CI 自动运行 E2E 测试
- ✅ 测试失败阻止合并
- ✅ 测试报告自动生成
- ✅ 覆盖率报告可查看

### AC-6: Test Quality Standards ✅
**Given** 所有 E2E 测试  
**When** 审查测试代码质量  
**Then**
- ✅ 每个测试都有清晰的场景描述
- ✅ 使用 Page Object Model 模式
- ✅ 测试数据独立，不相互依赖
- ✅ 测试运行速度优化 (并行、截图仅失败时)
- ✅ 错误信息清晰，易于调试

---

## 📊 Current E2E Test Status

### 现有测试文件

让我先检查现有的 E2E 测试：

```bash
apps/web/e2e/
├── goal/
│   ├── goal-creation.spec.ts (✅ exists)
│   └── goal-dag-visualization.spec.ts (✅ exists)
├── task/
│   └── task-dependency.spec.ts (⏳ to be enhanced)
└── reminder/
    └── reminder-crud.spec.ts (✅ exists)
```

### 测试覆盖缺口分析

| 模块 | 功能 | 现有测试 | 缺失测试 | 优先级 |
|------|------|----------|----------|--------|
| Task Dependency | 创建依赖 | ❌ | 需要 | P0 |
| Task Dependency | 循环检测 | ❌ | 需要 | P0 |
| Task Dependency | DAG 可视化 | ❌ | 需要 | P0 |
| Task Dependency | 关键路径 | ❌ | 需要 | P1 |
| Drag & Drop | 拖放重排序 | ❌ | 需要 | P1 |
| Drag & Drop | 拖放创建依赖 | ❌ | 需要 | P0 |
| Command Palette | 搜索 | ❌ | 需要 | P1 |
| Command Palette | 快捷操作 | ❌ | 需要 | P1 |
| Goal | DAG 对比 | ⚠️ 部分 | 补充 | P2 |
| Goal | 导出/导入 | ❌ | 需要 | P2 |

**总计**: 需要新增 **15+ 测试场景**

---

## 🏗️ Technical Implementation

### Test Framework & Tools

**Primary**: Playwright
- Cross-browser testing (Chromium, Firefox, WebKit)
- 自动等待机制
- 强大的选择器引擎
- 内置截图和视频录制

**Utilities**:
- `@playwright/test`: 测试运行器
- `playwright-core`: 浏览器自动化
- `dotenv`: 环境变量管理

### Project Structure

```
apps/web/e2e/
├── fixtures/
│   ├── test-data.ts          # 测试数据工厂
│   └── page-objects/         # Page Object Models
│       ├── GoalPage.ts
│       ├── TaskPage.ts
│       ├── CommandPalette.ts
│       └── DAGVisualization.ts
├── task/
│   ├── task-dependency-crud.spec.ts      # 依赖 CRUD
│   ├── task-dependency-validation.spec.ts # 循环检测
│   ├── task-dag-visualization.spec.ts    # DAG 可视化
│   ├── task-critical-path.spec.ts        # 关键路径
│   └── task-drag-drop.spec.ts            # 拖放功能
├── ux/
│   ├── command-palette-search.spec.ts    # 命令面板搜索
│   └── command-palette-actions.spec.ts   # 快捷操作
├── goal/
│   ├── goal-dag-comparison.spec.ts       # Goal 对比
│   └── goal-export-import.spec.ts        # 导出/导入
└── utils/
    ├── test-helpers.ts       # 通用助手函数
    └── assertions.ts         # 自定义断言
```

### Page Object Model Example

```typescript
// apps/web/e2e/fixtures/page-objects/TaskPage.ts
export class TaskPage {
  constructor(public page: Page) {}

  // Locators
  get createTaskButton() {
    return this.page.getByRole('button', { name: '创建任务' });
  }

  get taskList() {
    return this.page.getByTestId('task-list');
  }

  taskCard(taskName: string) {
    return this.page.getByTestId(`task-card-${taskName}`);
  }

  // Actions
  async createTask(taskData: TaskData) {
    await this.createTaskButton.click();
    await this.page.fill('[name="title"]', taskData.title);
    // ... fill other fields
    await this.page.click('[type="submit"]');
    await this.page.waitForResponse(resp => 
      resp.url().includes('/api/tasks') && resp.status() === 201
    );
  }

  async createDependency(sourceTask: string, targetTask: string) {
    await this.taskCard(sourceTask).click();
    await this.page.click('[data-testid="add-dependency"]');
    await this.page.selectOption('[name="predecessorTask"]', targetTask);
    await this.page.click('[data-testid="save-dependency"]');
  }

  // Assertions
  async expectTaskVisible(taskName: string) {
    await expect(this.taskCard(taskName)).toBeVisible();
  }

  async expectDependencyExists(source: string, target: string) {
    const depLine = this.page.locator(
      `[data-dependency="${source}->${target}"]`
    );
    await expect(depLine).toBeVisible();
  }
}
```

---

## 📝 Test Scenarios

### 1. Task Dependency CRUD (5 scenarios)

#### Scenario 1.1: Create Finish-to-Start Dependency
```gherkin
Given 用户创建了任务 "Design API" 和 "Implement API"
When 用户为 "Implement API" 添加依赖 "Design API" (finish-to-start)
Then 依赖关系被创建
And "Implement API" 状态变为 "blocked"
And DAG 中显示连线从 "Design API" 到 "Implement API"
```

#### Scenario 1.2: Detect Circular Dependency
```gherkin
Given 任务依赖链: A -> B -> C
When 用户尝试添加依赖 C -> A
Then 系统显示错误 "会形成循环依赖"
And 依赖未被创建
And 显示循环路径: C -> A -> B -> C
```

#### Scenario 1.3: Delete Dependency Updates Status
```gherkin
Given "Task B" 依赖 "Task A" (blocked)
When 用户删除该依赖
Then 依赖被删除
And "Task B" 状态变为 "ready"
And DAG 中连线消失
```

#### Scenario 1.4: Update Dependency Type
```gherkin
Given 依赖 A -> B (finish-to-start)
When 用户修改为 start-to-start
Then 依赖类型更新
And DAG 中连线样式变化
```

#### Scenario 1.5: Bulk Dependency Creation
```gherkin
Given 用户选中 3 个任务
When 用户批量添加依赖到 "Milestone Task"
Then 3 个依赖被创建
And DAG 正确显示多条连线
```

---

### 2. DAG Visualization (3 scenarios)

#### Scenario 2.1: Render Task DAG
```gherkin
Given 存在 5 个任务，包含 4 条依赖
When 用户打开 DAG 可视化
Then DAG 正确渲染所有任务节点
And 所有依赖连线正确显示
And 布局清晰无重叠
```

#### Scenario 2.2: Highlight Critical Path
```gherkin
Given 任务依赖链: A(3d) -> B(2d) -> C(4d) 和 A -> D(1d) -> C
When 用户点击 "显示关键路径"
Then 路径 A -> B -> C 被高亮 (总计 9 天)
And 节点颜色变为红色
```

#### Scenario 2.3: Export DAG as PNG
```gherkin
Given DAG 已渲染
When 用户点击 "导出为 PNG"
Then 浏览器下载 PNG 文件
And PNG 包含完整的 DAG 图像
```

---

### 3. Drag & Drop (3 scenarios)

#### Scenario 3.1: Drag to Reorder Tasks
```gherkin
Given 任务列表: [Task A, Task B, Task C]
When 用户拖动 Task C 到第一位
Then 任务顺序变为 [Task C, Task A, Task B]
And 顺序被持久化
```

#### Scenario 3.2: Drag to Create Dependency
```gherkin
Given 任务 A 和 B 不存在依赖
When 用户拖动 Task B 到 Task A 上
Then 显示 "创建依赖" 提示
And 释放后依赖被创建 (A -> B)
And 显示成功通知
```

#### Scenario 3.3: Invalid Drop Visual Feedback
```gherkin
Given Task A 已依赖 Task B
When 用户拖动 Task A 到 Task B 上 (会形成循环)
Then 显示红色边框和禁止图标
And 释放后依赖未被创建
And 显示错误提示
```

---

### 4. Command Palette (4 scenarios)

#### Scenario 4.1: Open Command Palette
```gherkin
Given 用户在任意页面
When 用户按下 Cmd+K (Mac) 或 Ctrl+K (Windows)
Then 命令面板弹出
And 输入框自动聚焦
```

#### Scenario 4.2: Search Goals and Navigate
```gherkin
Given 存在 Goal "Complete Sprint 4"
When 用户输入 "sprint"
Then 搜索结果显示 "Complete Sprint 4"
And 用户按 Enter
Then 导航到 Goal 详情页
```

#### Scenario 4.3: Quick Create Task
```gherkin
Given 命令面板已打开
When 用户输入 "create task"
Then 显示 "创建任务" 操作
And 用户选择并确认
Then 打开任务创建对话框
```

#### Scenario 4.4: Recent Items History
```gherkin
Given 用户最近访问了 Goal A, Task B, Reminder C
When 用户打开命令面板
Then "最近项目" 区域显示这 3 项
And 按访问时间倒序排列
```

---

## 🚀 Implementation Plan

### Phase 1: Infrastructure Setup (2 hours)

**Tasks**:
- [ ] Install Playwright dependencies
- [ ] Configure `playwright.config.ts`
- [ ] Set up test database seeding
- [ ] Create Page Object Models
- [ ] Add `data-testid` attributes to components

**Deliverables**:
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm nx serve web',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### Phase 2: Task Dependency Tests (4 hours)

**Files to Create**:
1. `task-dependency-crud.spec.ts` (5 scenarios)
2. `task-dependency-validation.spec.ts` (循环检测)
3. `task-dag-visualization.spec.ts` (DAG 渲染)
4. `task-critical-path.spec.ts` (关键路径)

**Example Test**:
```typescript
// apps/web/e2e/task/task-dependency-crud.spec.ts
import { test, expect } from '@playwright/test';
import { TaskPage } from '../fixtures/page-objects/TaskPage';
import { createTestTask } from '../fixtures/test-data';

test.describe('Task Dependency CRUD', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    await page.goto('/tasks');
  });

  test('should create finish-to-start dependency', async ({ page }) => {
    // Arrange
    await taskPage.createTask(createTestTask('Design API'));
    await taskPage.createTask(createTestTask('Implement API'));

    // Act
    await taskPage.createDependency('Implement API', 'Design API');

    // Assert
    await taskPage.expectDependencyExists('Design API', 'Implement API');
    await expect(page.getByText('"Implement API" 现在依赖于 "Design API"')).toBeVisible();
    
    // Check status update
    const implTask = taskPage.taskCard('Implement API');
    await expect(implTask.locator('[data-status="blocked"]')).toBeVisible();
  });

  test('should detect circular dependency', async ({ page }) => {
    // Arrange: Create chain A -> B -> C
    await taskPage.createTask(createTestTask('Task A'));
    await taskPage.createTask(createTestTask('Task B'));
    await taskPage.createTask(createTestTask('Task C'));
    await taskPage.createDependency('Task B', 'Task A');
    await taskPage.createDependency('Task C', 'Task B');

    // Act: Try to create C -> A (circular)
    await taskPage.attemptCreateDependency('Task A', 'Task C');

    // Assert
    await expect(page.getByText('会形成循环依赖')).toBeVisible();
    await expect(page.getByText('循环路径: Task C → Task A → Task B → Task C')).toBeVisible();
    
    // Verify dependency was NOT created
    await taskPage.expectDependencyNotExists('Task C', 'Task A');
  });

  // ... more tests
});
```

---

### Phase 3: Drag & Drop Tests (2 hours)

**File**: `task-drag-drop.spec.ts`

```typescript
test('should create dependency via drag and drop', async ({ page }) => {
  const taskPage = new TaskPage(page);
  
  await taskPage.createTask(createTestTask('Task A'));
  await taskPage.createTask(createTestTask('Task B'));

  // Drag Task B onto Task A
  const taskB = taskPage.taskCard('Task B');
  const taskA = taskPage.taskCard('Task A');
  
  await taskB.dragTo(taskA);
  
  // Wait for drop animation and API call
  await page.waitForResponse(resp => 
    resp.url().includes('/api/task-dependencies') && resp.status() === 201
  );

  // Verify dependency created
  await taskPage.expectDependencyExists('Task A', 'Task B');
  await expect(page.getByText('✓ 依赖关系已创建')).toBeVisible();
});

test('should show invalid drop feedback for circular dependency', async ({ page }) => {
  const taskPage = new TaskPage(page);
  
  // Create A -> B dependency
  await taskPage.createTask(createTestTask('Task A'));
  await taskPage.createTask(createTestTask('Task B'));
  await taskPage.createDependency('Task B', 'Task A');

  // Try to drag A onto B (circular)
  const taskA = taskPage.taskCard('Task A');
  const taskB = taskPage.taskCard('Task B');
  
  await taskA.hover();
  await page.mouse.down();
  await taskB.hover();

  // Check invalid drop feedback
  await expect(taskB).toHaveClass(/invalid-drop/);
  await expect(page.locator('.drop-zone-indicator.invalid')).toBeVisible();
  
  await page.mouse.up();
  
  // Verify dependency was NOT created
  await taskPage.expectDependencyNotExists('Task B', 'Task A');
});
```

---

### Phase 4: Command Palette Tests (2 hours)

**File**: `command-palette.spec.ts`

```typescript
test('should open command palette with keyboard shortcut', async ({ page }) => {
  await page.goto('/');
  
  // Press Cmd+K (Mac) or Ctrl+K (Windows)
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+KeyK`);
  
  // Verify palette opened
  const palette = page.getByTestId('command-palette');
  await expect(palette).toBeVisible();
  
  // Verify input focused
  const input = palette.locator('input[type="text"]');
  await expect(input).toBeFocused();
});

test('should search and navigate to goal', async ({ page }) => {
  await page.goto('/');
  
  // Open palette
  await page.keyboard.press('Control+KeyK');
  
  // Search
  await page.fill('[data-testid="command-palette-input"]', 'complete sprint');
  
  // Wait for search results
  await page.waitForSelector('[data-testid="search-result-goal"]');
  
  // Select first result
  await page.keyboard.press('Enter');
  
  // Verify navigation
  await expect(page).toHaveURL(/\/goals\/[a-f0-9-]+/);
});
```

---

### Phase 5: CI/CD Integration (1 hour)

**GitHub Actions Workflow**:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Start API server
        run: pnpm nx serve api &
        env:
          NODE_ENV: test
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Wait for API
        run: npx wait-on http://localhost:3000/health

      - name: Run E2E tests
        run: pnpm nx e2e web-e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 7

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/e2e/coverage-final.json
```

---

### Phase 6: Test Reports & Documentation (1 hour)

**Generate HTML Report**:
```bash
pnpm exec playwright show-report
```

**Coverage Report**:
```typescript
// Add to playwright.config.ts
export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['list'],
  ],
});
```

---

## 📊 Success Criteria

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Coverage | ≥80% | Critical user flows covered |
| Execution Time | <10 min | Full suite on CI |
| Pass Rate | ≥95% | On main branch |
| Flaky Test Rate | <5% | Failed then passed without code change |

### Qualitative Metrics

- ✅ All P0 scenarios have E2E tests
- ✅ Tests are readable and maintainable
- ✅ Page Object Models reduce duplication
- ✅ CI fails fast on test failures
- ✅ Test reports are clear and actionable

---

## 🐛 Known Issues & Mitigations

### Issue 1: Test Flakiness
**Symptom**: Tests fail intermittently  
**Cause**: Async operations, race conditions  
**Mitigation**:
- Use Playwright's auto-waiting
- Avoid fixed `sleep()`, use `waitFor()` instead
- Increase timeout for slow operations
- Run tests in isolation

### Issue 2: Slow Test Execution
**Symptom**: Tests take too long  
**Cause**: Sequential execution, heavy setup  
**Mitigation**:
- Run tests in parallel (Playwright workers)
- Reuse browser context when possible
- Optimize database seeding
- Use test sharding for CI

### Issue 3: Screenshot Overload
**Symptom**: CI artifacts too large  
**Cause**: Screenshot on every test  
**Mitigation**:
- Only screenshot on failure
- Compress images
- Limit retention to 7 days

---

## 🔗 Dependencies

### Prerequisite Stories
- ✅ STORY-022: Task Dependency Data Model
- ✅ STORY-023: Task DAG Visualization
- ✅ STORY-024: Dependency Validation
- ✅ STORY-025: Critical Path Analysis
- ✅ STORY-026: Command Palette
- ✅ STORY-027: Drag & Drop

### Technical Dependencies
- Playwright 1.40+
- Test database with seed data
- `data-testid` attributes on components

---

## 📚 Reference Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

## 📈 Progress Tracking

### Day 1: Infrastructure & Task Tests (4 hours)
- [x] Set up Playwright config
- [x] Create Page Object Models
- [ ] Write Task dependency tests (5 scenarios)
- [ ] Write DAG visualization tests

### Day 2: UX Tests & CI (4 hours)
- [ ] Write Drag & Drop tests
- [ ] Write Command Palette tests
- [ ] Configure CI/CD pipeline
- [ ] Generate test reports
- [ ] Write completion report

---

**Story Created**: 2024-10-23  
**Target Completion**: 2024-10-25  
**Estimated Effort**: 2 SP (12-16 hours)  
**Actual Effort**: TBD

---

**Next Steps**:
1. ✅ Create story planning document (this file)
2. ⏳ Set up Playwright infrastructure
3. ⏳ Write first batch of tests
4. ⏳ Configure CI/CD
5. ⏳ Complete and review

---

*Let's build comprehensive E2E test coverage to ensure quality! 🧪*
