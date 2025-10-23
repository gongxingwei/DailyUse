# E2E Testing Guide

本指南介绍如何运行和维护 DailyUse 的 E2E 测试。

## 📋 目录

- [快速开始](#快速开始)
- [本地开发](#本地开发)
- [CI/CD 集成](#cicd-集成)
- [测试架构](#测试架构)
- [编写测试](#编写测试)
- [故障排查](#故障排查)

---

## 🚀 快速开始

### 前置要求

- Node.js 20+
- pnpm 9.14.4+
- PostgreSQL 15+
- Playwright 已安装

### 安装 Playwright

```bash
# 安装 Playwright 浏览器
pnpm exec playwright install --with-deps chromium
```

### 运行测试

```bash
# 运行所有 E2E 测试
pnpm nx e2e web

# 运行特定测试文件
pnpm nx e2e web --spec=task-dependency-crud.spec.ts

# 调试模式（带 UI）
pnpm nx run web:e2e:debug

# 查看测试报告
pnpm nx run web:e2e:report
```

---

## 💻 本地开发

### 1. 准备环境

```bash
# 1. 启动 PostgreSQL
# 确保 PostgreSQL 运行在 localhost:5432

# 2. 设置环境变量
export DATABASE_URL="postgresql://username:password@localhost:5432/dailyuse_dev"
export JWT_SECRET="your-secret-key"

# 3. 运行数据库迁移
pnpm nx run api:prisma:migrate:dev

# 4. 生成 Prisma Client
pnpm nx run api:prisma:generate
```

### 2. 启动服务

**终端 1 - API 服务器**:
```bash
pnpm nx serve api
# API 运行在 http://localhost:3000
```

**终端 2 - Web 应用**:
```bash
pnpm nx serve web
# Web 运行在 http://localhost:5173
```

### 3. 运行测试

**终端 3 - E2E 测试**:
```bash
# 运行所有测试
pnpm nx e2e web

# 运行特定模块的测试
pnpm nx e2e web --grep "Task Dependency"

# 以 UI 模式运行（推荐用于开发）
pnpm nx run web:e2e:ui
```

### 测试开发工作流

```bash
# 1. 启动 Playwright UI
pnpm nx run web:e2e:ui

# 2. 在 UI 中选择测试文件
# 3. 点击测试场景查看执行过程
# 4. 使用 time travel 调试失败步骤
# 5. 查看截图和追踪日志
```

---

## 🔄 CI/CD 集成

### GitHub Actions Workflow

E2E 测试通过 `.github/workflows/e2e-tests.yml` 在 CI 中自动运行。

**触发条件**:
- 推送到 `main`、`develop` 或 `feature/**` 分支
- 创建 Pull Request 到 `main` 或 `develop`

**执行流程**:
1. ✅ 设置 Node.js 和 pnpm
2. ✅ 安装依赖
3. ✅ 启动 PostgreSQL 服务
4. ✅ 运行数据库迁移和种子数据
5. ✅ 安装 Playwright 浏览器
6. ✅ 构建 API 和 Web 应用
7. ✅ 启动 API 和 Web 服务器
8. ✅ 运行 E2E 测试
9. ✅ 上传测试结果和截图
10. ✅ 在 PR 中评论测试结果

### 查看 CI 测试结果

1. **GitHub Actions 页面**: 查看测试执行日志
2. **Artifacts**: 下载测试报告、截图和视频
3. **PR 评论**: 自动生成的测试结果摘要

### CI 环境配置

```yaml
# PostgreSQL 服务
POSTGRES_USER: dailyuse_test
POSTGRES_PASSWORD: test_password
POSTGRES_DB: dailyuse_test

# 环境变量
DATABASE_URL: postgresql://dailyuse_test:test_password@localhost:5432/dailyuse_test
NODE_ENV: test
JWT_SECRET: test-secret-key-for-e2e
```

---

## 🏗️ 测试架构

### 目录结构

```
apps/web/e2e/
├── page-objects/          # Page Object Models
│   ├── TaskPage.ts
│   ├── TaskDAGPage.ts
│   ├── CommandPalettePage.ts
│   └── index.ts
├── helpers/               # 测试辅助函数
│   └── testHelpers.ts
├── task/                  # Task 模块测试
│   ├── task-dependency-crud.spec.ts
│   ├── task-dag-visualization.spec.ts
│   ├── task-critical-path.spec.ts
│   └── task-drag-drop.spec.ts
├── ux/                    # UX 功能测试
│   └── command-palette.spec.ts
├── goal/                  # Goal 模块测试
│   └── goal-dag.spec.ts
├── reminder/              # Reminder 模块测试
│   └── reminder-notifications.spec.ts
└── user-settings/         # 用户设置测试
    └── settings.spec.ts
```

### 设计模式

#### Page Object Model (POM)

将页面元素和操作封装在类中，提高测试可维护性。

```typescript
// TaskPage.ts
export class TaskPage {
  taskCard(identifier: string | number): Locator {
    // 灵活的任务定位器
  }
  
  async createTask(taskData: TaskData) {
    // 创建任务的完整流程
  }
  
  async expectDependencyExists(source: string, target: string) {
    // 验证依赖关系
  }
}
```

#### 测试辅助函数

通用操作封装为辅助函数。

```typescript
// testHelpers.ts
export async function login(page: Page, username: string, password: string) {
  // 登录流程
}

export async function navigateToTasks(page: Page) {
  // 导航到任务页面
}

export async function cleanupTask(page: Page, taskTitle: string) {
  // 清理测试数据
}
```

### 测试数据管理

#### 自动清理

每个测试后自动清理测试数据，避免污染。

```typescript
test.afterEach(async ({ page }) => {
  const testTasks = ['E2E Test 1', 'E2E Test 2'];
  for (const taskTitle of testTasks) {
    await cleanupTask(page, taskTitle);
  }
});
```

#### 测试数据工厂

使用工厂函数创建测试数据。

```typescript
export function createTestTask(title: string, options?: Partial<TaskData>) {
  return {
    title,
    description: options?.description || '',
    duration: options?.duration || 60,
    priority: options?.priority || 'medium',
    tags: options?.tags || [],
  };
}
```

---

## ✍️ 编写测试

### 测试结构

```typescript
test.describe('Feature Name', () => {
  let page: Page;
  let featurePage: FeaturePage;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    featurePage = new FeaturePage(page);
    
    // 登录
    await login(page, TEST_USER.username, TEST_USER.password);
    
    // 导航到功能页面
    await featurePage.navigate();
  });

  test.afterEach(async () => {
    // 清理测试数据
  });

  test('should do something', async () => {
    // Arrange: 准备测试数据
    
    // Act: 执行操作
    
    // Assert: 验证结果
    
    // Screenshot: 截图记录
  });
});
```

### 最佳实践

#### 1. 使用 data-testid

```vue
<!-- DraggableTaskCard.vue -->
<div data-testid="draggable-task-card" :data-task-uuid="task.uuid">
  <button data-testid="drag-handle">拖动</button>
</div>
```

```typescript
// 测试中使用
const taskCard = page.getByTestId('draggable-task-card');
const dragHandle = taskCard.getByTestId('drag-handle');
```

#### 2. 详细日志

```typescript
console.log('\n📝 Test: Create Dependency\n');
console.log('Step 1: Creating tasks...');
console.log('✅ Tasks created\n');
```

#### 3. 截图文档

```typescript
// Before 截图
await page.screenshot({ 
  path: 'test-results/01-before-action.png', 
  fullPage: true 
});

// After 截图
await page.screenshot({ 
  path: 'test-results/02-after-action.png', 
  fullPage: true 
});
```

#### 4. 优雅降级

```typescript
// 处理可选功能
const hasBulkAction = await bulkActionBtn.isVisible().catch(() => false);
if (hasBulkAction) {
  await bulkActionBtn.click();
} else {
  // 回退到单个操作
  for (const task of tasks) {
    await createDependency(task);
  }
}
```

#### 5. 合理等待

```typescript
// 动态等待（推荐）
await element.waitFor({ state: 'visible', timeout: 3000 });

// 固定等待（仅用于动画）
await page.waitForTimeout(500);
```

---

## 🐛 故障排查

### 常见问题

#### 1. 测试超时

**问题**: 测试在等待元素时超时

**解决方案**:
```typescript
// 增加超时时间
await expect(element).toBeVisible({ timeout: 10000 });

// 检查元素是否存在
const exists = await element.isVisible().catch(() => false);
if (!exists) {
  console.log('Element not found, skipping...');
}
```

#### 2. 元素定位失败

**问题**: 无法找到元素

**解决方案**:
```typescript
// 使用多种定位策略
const element = 
  page.getByTestId('element-id') ||
  page.getByText('Element Text') ||
  page.locator('.element-class');

// 等待页面加载完成
await page.waitForLoadState('networkidle');
```

#### 3. 测试数据污染

**问题**: 前一个测试的数据影响当前测试

**解决方案**:
```typescript
// 确保 afterEach 清理所有数据
test.afterEach(async ({ page }) => {
  await cleanupAllTestData(page);
});

// 使用唯一标识符
const uniqueId = Date.now();
const taskTitle = `E2E Test ${uniqueId}`;
```

#### 4. CI 环境失败但本地通过

**可能原因**:
- 时间相关的测试（时区差异）
- 资源限制（内存、CPU）
- 并发问题

**解决方案**:
```typescript
// 使用相对时间而非绝对时间
const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

// 减少并行度
// playwright.config.ts
workers: process.env.CI ? 1 : 2

// 增加重试次数
retries: process.env.CI ? 2 : 0
```

### 调试技巧

#### 1. Playwright UI 模式

```bash
pnpm nx run web:e2e:ui
```

- 查看测试执行过程
- Time travel 调试
- 查看元素定位器
- 检查截图和追踪

#### 2. Debug 模式

```bash
pnpm nx run web:e2e:debug
```

- 在浏览器中逐步执行
- 使用 DevTools
- 暂停和继续执行

#### 3. 截图和视频

```typescript
// 失败时自动截图（已配置）
screenshot: 'only-on-failure'

// 失败时保留视频
video: 'retain-on-failure'
```

#### 4. 追踪日志

```typescript
// 启用追踪
trace: 'on-first-retry'

// 查看追踪
pnpm exec playwright show-trace trace.zip
```

---

## 📊 测试覆盖

### 当前覆盖率: 86%

| 模块 | 覆盖率 | 场景数 |
|------|--------|--------|
| Reminder | 100% | 6 |
| Goal DAG | 100% | 4 |
| User Settings | 100% | 3 |
| Task Dependency | 62.5% | 5 |
| Task DAG | 60% | 5 |
| Drag & Drop | 100% | 4 |
| Command Palette | 75% | 6 |

### 目标

- ✅ 总体覆盖率 ≥80%
- ✅ 所有 P0 功能有测试
- ✅ 关键用户流程有测试
- 🔲 所有模块覆盖率 ≥80% (未来目标)

---

## 🔗 相关资源

- [Playwright 官方文档](https://playwright.dev/)
- [Page Object Model 指南](https://playwright.dev/docs/pom)
- [GitHub Actions 配置](https://docs.github.com/en/actions)
- [STORY-029 规划文档](../STORY-029-E2E-TEST-EXPANSION.md)
- [Phase 1 完成报告](../STORY-029-PHASE-1-COMPLETION.md)
- [Phase 2 完成报告](../STORY-029-PHASE-2-COMPLETION.md)

---

## 📝 维护

### 添加新测试

1. 确定测试场景和模块
2. 创建或更新 Page Object Model
3. 添加 data-testid 到组件（如需要）
4. 编写测试场景
5. 运行测试验证
6. 更新本文档

### 更新测试

1. 识别失败或过时的测试
2. 更新 Page Object Model
3. 修改测试场景
4. 验证修复
5. 更新文档

### 性能优化

1. 减少不必要的等待
2. 使用并行执行（小心数据冲突）
3. 优化选择器
4. 缓存测试数据

---

## 👥 贡献

如果您发现测试问题或有改进建议，请：

1. 创建 Issue 描述问题
2. 提交 PR 修复问题
3. 更新相关文档

---

**最后更新**: 2025-10-23  
**维护者**: DailyUse Development Team
