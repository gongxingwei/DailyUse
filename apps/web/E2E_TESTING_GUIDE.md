# Playwright E2E 测试指南

## 📋 概述

本项目使用 Playwright 进行端到端 (E2E) 测试，测试覆盖关键业务流程，特别是 Reminder 功能的完整流程。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd apps/web
pnpm install
```

### 2. 安装浏览器驱动

```bash
npx playwright install chromium
```

### 3. 创建测试用户

测试需要一个专用测试账号：

```bash
# 运行测试用户设置脚本 (从 API 项目)
cd ../../apps/api
npx tsx src/__tests__/manual/setup-e2e-test-user.ts
```

这将创建或验证测试用户：
- **用户名**: `testuser`
- **密码**: `Test123456!`
- **Email**: `testuser@example.com`

### 4. 启动开发服务器

在运行测试前，需要确保以下服务正在运行：

```bash
# 终端 1: 启动 API 服务器
cd apps/api
pnpm dev

# 终端 2: 启动 Web 前端
cd apps/web
pnpm dev
```

### 5. 运行测试

```bash
# 无头模式运行 (默认)
pnpm e2e

# 显示浏览器窗口运行
pnpm e2e:headed

# 调试模式 (逐步执行)
pnpm e2e:debug

# UI 模式 (交互式)
pnpm e2e:ui

# 查看测试报告
pnpm e2e:report
```

## 📝 测试用例说明

### Reminder E2E 流程测试

**文件**: `e2e/reminder.spec.ts`

**测试流程**:

1. **用户登录** - 使用测试账号登录系统
2. **导航到 Reminder 页面** - 进入 Reminder 管理界面
3. **创建 Reminder** - 创建一个每分钟触发的提醒
   - 名称: `E2E Test - [timestamp]`
   - 内容: 测试提醒内容
   - 间隔: 每 1 分钟
   - 启用声音: ✅
   - 启用弹窗: ✅
4. **等待触发** - 等待最多 3 分钟，监听提醒通知
5. **验证通知** - 验证通过 SSE 收到通知事件

**预期结果**:
- ✅ 用户成功登录
- ✅ Reminder 创建成功并显示在列表中
- ✅ 1-2 分钟内收到第一次提醒
- ✅ SSE 事件包含 `schedule:reminder-triggered` 等事件
- ✅ 页面显示通知弹窗或 toast

**执行时间**: 约 3-5 分钟

## 🔧 配置说明

### playwright.config.ts

主要配置项：

```typescript
{
  testDir: './e2e',                    // 测试文件目录
  timeout: 5 * 60 * 1000,              // 单个测试超时 5 分钟
  baseURL: 'http://localhost:5173',    // Web 前端地址
  workers: 1,                          // 单线程执行 (避免冲突)
  retries: 0,                          // 失败重试次数
  use: {
    trace: 'on-first-retry',           // 失败时记录追踪
    screenshot: 'only-on-failure',     // 失败时截图
    video: 'retain-on-failure',        // 失败时保留视频
  }
}
```

### 测试辅助工具

**文件**: `e2e/helpers/testHelpers.ts`

提供的辅助函数：

- `login(page, username, password)` - 登录
- `navigateToReminder(page)` - 导航到 Reminder 页面
- `createReminder(page, options)` - 创建 Reminder
- `captureSSEEvents(page)` - 捕获 SSE 事件
- `waitForReminderNotification(page, minutes)` - 等待通知
- `getSSEEvents(page)` - 获取捕获的事件
- `cleanupReminder(page, name)` - 清理测试数据

## 🎯 测试策略

### 1. 真实用户场景模拟

- 使用真实的浏览器 (Chromium)
- 完整的用户交互流程
- 真实的网络请求和 SSE 连接

### 2. 时间敏感测试

- Reminder 间隔设置为 1 分钟
- 等待最多 3 分钟确保至少触发一次
- 每 5 秒检查一次事件状态

### 3. 多重验证

- ✅ SSE 事件监听
- ✅ 页面元素检查
- ✅ 网络请求验证
- ✅ 截图记录关键步骤

### 4. 自动清理

- 测试前后自动清理测试数据
- 避免测试数据污染数据库

## 📊 测试报告

测试完成后会生成：

1. **HTML 报告** - `playwright-report/index.html`
   - 测试执行摘要
   - 失败详情
   - 截图和视频

2. **JSON 结果** - `test-results/results.json`
   - 机器可读的测试结果
   - 用于 CI/CD 集成

3. **截图** - `test-results/*.png`
   - 01-before-create.png - 创建前
   - 02-after-create.png - 创建后
   - 03-notification-received.png - 收到通知

## 🐛 调试技巧

### 1. 使用调试模式

```bash
pnpm e2e:debug
```

这会打开 Playwright Inspector，可以：
- 逐步执行测试
- 查看每一步的状态
- 实时修改代码

### 2. 使用 UI 模式

```bash
pnpm e2e:ui
```

提供图形界面：
- 查看测试列表
- 观看测试执行
- 时间旅行调试

### 3. 查看浏览器窗口

```bash
pnpm e2e:headed
```

显示浏览器窗口，观察测试执行过程。

### 4. 添加日志

在测试中添加 `console.log()` 输出调试信息。

## ⚙️ CI/CD 集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Start services
        run: |
          pnpm dev:api &
          pnpm dev:web &
          sleep 10
      
      - name: Run E2E tests
        run: pnpm e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/web/playwright-report/
```

## 📌 注意事项

1. **测试用户**: 确保数据库中存在测试用户 `testuser / Test123456!`
2. **服务运行**: 测试前必须启动 API 和 Web 服务
3. **端口占用**: 确保 3888 (API) 和 5173 (Web) 端口未被占用
4. **时间等待**: Reminder 测试需要等待 1-3 分钟，属于正常现象
5. **数据清理**: 测试会自动清理数据，但失败时可能需要手动删除

## 🔗 相关资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Vue Testing Handbook](https://lmiller1990.github.io/vue-testing-handbook/)

## 📧 支持

如有问题，请查看：
- 测试日志输出
- `playwright-report/` 中的 HTML 报告
- 失败时的截图和视频

---

**最后更新**: 2025-10-07
