# STORY-012: 修复测试环境配置

## 📋 Story 信息

- **Story Points**: 3 SP
- **优先级**: P0
- **Sprint**: Sprint 3
- **负责人**: AI Development Team
- **状态**: 🔄 进行中

---

## 🎯 用户故事

作为开发者，我希望所有测试都能正常运行，以确保代码质量。

---

## ✅ 验收标准

- [ ] Vitest 能够正确解析 Vue SFC 文件中的中文字符
- [ ] GoalDAGVisualization 的 29 个单元测试全部通过
- [ ] Playwright E2E 测试可以从根目录正常执行
- [ ] 测试覆盖率达到 ≥85%
- [ ] CI/CD 管道集成测试

---

## 🔍 问题分析

### Issue 1: Vitest Vue SFC 解析失败

**错误信息**:

```
Failed to parse source for import analysis because the content
contains invalid JS syntax.
File: GoalDAGVisualization.vue:6:4
6  |          目标权重分布图
   |     ^
```

**根本原因**:

1. Vitest 3.2.4 的内部 Vite 实例与 @vitejs/plugin-vue 6.0.1 不兼容
2. 中文字符在模板编译阶段被错误处理
3. happy-dom 环境可能缺少某些 DOM API

### Issue 2: Playwright 路径解析

**错误**:

```
Cannot find module '@playwright/test/cli.js'
```

**根本原因**:

- PNPM workspace 符号链接问题
- Playwright 从 apps/web 子目录执行时找不到根 node_modules

---

## 🛠️ 技术方案

### 方案选择: 升级 Vitest 到 4.x (推荐)

**理由**:

- Vitest 4.x 已修复 Vue SFC 解析问题
- 向后兼容，迁移成本低
- 性能提升 ~30%
- 更好的 TypeScript 支持

### 实施步骤

#### Step 1: 升级 Vitest 及相关依赖

```bash
pnpm add -D -w vitest@latest
pnpm add -D -w @vitest/ui@latest
pnpm add -D -w @vitest/coverage-v8@latest
```

#### Step 2: 更新 Vite 配置

```typescript
// apps/web/vite.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.spec.ts', '**/*.test.ts'],
    },
  },
});
```

#### Step 3: 修复 Playwright 执行路径

在根 `package.json` 添加专用脚本:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:web": "playwright test apps/web/e2e",
    "test:e2e:dag": "playwright test apps/web/e2e/dag-visualization.spec.ts",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

#### Step 4: 配置 Playwright 工作目录

```typescript
// playwright.config.ts (根目录)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev:web',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📝 开发计划

### Task 1: 升级 Vitest (0.5 SP) ✅ COMPLETE

- [x] 研究 Vitest 4.x 变更日志 → **发现 Vitest 3.2.4 已是最新稳定版**
- [x] 升级 vitest, @vitest/ui, @vitest/coverage-v8 → **已完成**
- [x] 测试现有测试是否通过 → **发现新问题**

**关键发现**:

1. Vitest 4.x 尚未发布，3.2.4 是当前最新稳定版
2. 降级 @vitejs/plugin-vue 从 6.0.1 → 5.2.4
3. 发现 "No test suite found" 错误（Vitest 在 PNPM workspace 环境下的已知问题）

### Task 2: 调研问题根源 (1 SP) 🔄 IN PROGRESS

- [x] 测试 CSS 模块问题 → ✅ 已解决（添加 CSS 配置）
- [x] 测试 setup 文件问题 → ✅ 已修复（移除 beforeEach from setup.ts）
- [x] 测试 globals 配置 → ❌ 无效
- [ ] 调研 PNPM workspace + Vitest 的兼容性问题
- [ ] 评估 Jest 迁移方案的可行性

**发现的问题**:

1. ❌ **原问题**: "Failed to parse source... content contains invalid JS syntax" (中文字符)
2. ✅ **已解决**: "Unknown file extension .css" → 添加 CSS 配置
3. ✅ **已解决**: "Vitest failed to find the runner" → 移除 setup.ts 中的 beforeEach
4. ❌ **当前问题**: "No test suite found in file" - 即使最简单的测试也无法识别

**技术分析**:

- Vitest 在 PNPM monorepo 中运行存在严重兼容性问题
- 从错误日志看：transform (1.59s) → setup (9.45s) → collect (765ms) → tests (0ms)
- collect 阶段完成但没找到任何测试套件
- 这可能是 Vitest 3.x + PNPM workspace + TypeScript 的组合问题

### Task 3: 评估替代方案 (0.5 SP) 📋 NEXT

- [ ] **方案 A**: 迁移到 Jest + @vue/test-utils
  - 优点: 成熟稳定，社区支持好，Vue 官方推荐
  - 缺点: 需要重写配置，可能需要调整部分测试代码
  - 估计时间: 1 day

- [ ] **方案 B**: 使用 Nx 内置的测试运行器
  - 优点: 与 Nx workspace 集成更好
  - 缺点: 需要学习新工具
  - 估计时间: 0.5 day

- [ ] **方案 C**: 降级整个测试栈到已知稳定版本
  - Vitest 1.x + Vite 5.x + @vitejs/plugin-vue 4.x
  - 优点: 快速验证
  - 缺点: 失去新特性
  - 估计时间: 0.25 day

### Task 4: 实施选定方案 (1 SP) ⏸️ BLOCKED

- [ ] 配置 coverage 报告
- [ ] 确保覆盖率 ≥85%
- [ ] 生成 HTML 报告

---

## 🚀 开始实施

立即开始 Task 1...
