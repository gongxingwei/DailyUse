# Vitest Workspace 配置指南

本项目已配置 Vitest Workspace Projects 功能，用于统一管理 monorepo 中所有包和应用的测试配置。

## 📚 文档

- [Vitest Workspace Projects 官方文档](https://vitest.dev/guide/projects)
- [Vitest 配置参考](https://vitest.dev/config/)

## 🏗️ 架构

```
DailyUse/
├── vitest.workspace.ts          # 📋 Workspace 主配置文件
├── vitest.shared.ts             # 🔧 共享配置工具
├── packages/
│   ├── contracts/
│   ├── domain-core/
│   ├── domain-server/
│   │   ├── vitest.config.ts     # ✅ 现有配置（仍然有效）
│   │   └── vitest.config.new.ts # 🆕 新的共享配置示例
│   ├── domain-client/
│   │   ├── vitest.config.ts
│   │   └── vitest.config.new.ts
│   ├── ui/
│   └── utils/
└── apps/
    ├── api/
    │   ├── vitest.config.ts
    │   └── vitest.config.new.ts
    ├── desktop/
    └── web/
```

## 🎯 配置的项目

Workspace 配置定义了以下测试项目：

### 📦 Libraries (包)

| 项目 | 名称 | 环境 | 说明 |
|------|------|------|------|
| contracts | `📦 contracts` | node | 类型定义和 DTO |
| domain-core | `📦 domain-core` | node | 核心领域实体 |
| domain-server | `📦 domain-server` | node | 服务端领域逻辑 |
| domain-client | `📦 domain-client` | happy-dom | 客户端领域逻辑 |
| ui | `📦 ui` | happy-dom | UI 组件库 |
| utils | `📦 utils` | node | 工具函数 |

### 🚀 Applications (应用)

| 项目 | 名称 | 环境 | 特殊配置 |
|------|------|------|----------|
| api | `🚀 api` | node | 数据库测试，单进程模式 |
| desktop | `🖥️ desktop` | happy-dom | Electron 应用 |
| web | `🌐 web` | happy-dom | Web 应用 |

## 🚀 使用方法

### 运行所有测试

```bash
# 运行所有项目的测试
pnpm test

# 运行所有测试（一次性执行）
pnpm test:run

# 以 UI 模式运行
pnpm test:ui

# 生成覆盖率报告
pnpm test:coverage

# 监听模式
pnpm test:watch
```

### 运行特定项目的测试

```bash
# 运行 domain-server 测试
pnpm test:domain-server

# 运行 domain-client 测试
pnpm test:domain-client

# 运行 API 测试
pnpm test:api

# 运行 Web 测试
pnpm test:web

# 运行 Desktop 测试
pnpm test:desktop

# 运行其他包的测试
pnpm test:contracts
pnpm test:core
pnpm test:ui-lib
pnpm test:utils
```

### 使用 CLI 直接运行

```bash
# 运行特定项目（使用项目名称）
vitest --project='📦 domain-server'
vitest --project='🚀 api'

# 运行多个项目
vitest --project='📦 domain-server' --project='📦 domain-client'

# 只运行库的测试（使用通配符）
vitest --project='📦*'

# 只运行应用的测试
vitest --project='🚀*' --project='🖥️*' --project='🌐*'
```

### 在 CI 环境中运行

```bash
# CI 环境会自动启用详细输出和 bail 模式
CI=true pnpm test:run

# 生成多种格式的报告
CI=true pnpm test:run -- --reporter=verbose --reporter=json --reporter=html
```

## 🎨 UI 模式

Vitest 提供了一个强大的 UI 界面来运行和调试测试：

```bash
pnpm test:ui
```

访问 `http://localhost:51204/__vitest__/` 查看测试 UI。

UI 模式特性：
- 📊 查看所有项目和测试
- 🔍 按项目、文件或测试名称筛选
- ⏱️ 查看测试执行时间
- 🐛 调试失败的测试
- 📈 查看覆盖率报告

## 📝 配置说明

### vitest.workspace.ts

这是主配置文件，定义了：
- ✅ 所有测试项目及其配置
- ✅ 全局覆盖率设置
- ✅ 全局 reporters 配置
- ✅ 每个项目的特定设置（环境、超时等）

### vitest.shared.ts

提供共享配置工具：
- ✅ `createSharedConfig(options)` - 创建带有通用设置的配置
- ✅ 统一的 path alias 配置
- ✅ 统一的排除规则
- ✅ 统一的覆盖率设置

### 单独项目配置（可选）

每个项目可以保留自己的 `vitest.config.ts`：
- 当从项目根目录运行测试时使用
- 可以使用 `vitest.shared.ts` 中的工具
- Workspace 配置优先级更高（从 monorepo 根运行时）

## 🔧 自定义项目配置

### 方式 1: 在 workspace 中内联配置

编辑 `vitest.workspace.ts`：

```typescript
{
  extends: true,
  test: {
    name: { label: '📦 my-package', color: 'blue' },
    root: './packages/my-package',
    environment: 'node',
    // 添加自定义配置
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
  },
}
```

### 方式 2: 使用共享配置

创建项目的 `vitest.config.ts`：

```typescript
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
    aliases: {
      // 添加额外的 alias
      '~/': path.resolve(__dirname, './custom'),
    },
  }),
  defineConfig({
    test: {
      name: 'my-package',
      // 添加项目特定配置
      setupFiles: ['./src/test/setup.ts'],
    },
  })
);
```

## 📊 覆盖率配置

覆盖率在 workspace 级别统一配置：

```bash
# 生成覆盖率报告
pnpm test:coverage

# 查看报告
open coverage/index.html
```

覆盖率报告格式：
- ✅ `text` - 终端输出
- ✅ `json` - JSON 格式
- ✅ `html` - HTML 报告
- ✅ `lcov` - LCOV 格式（用于 CI 集成）

覆盖率排除：
- ❌ node_modules
- ❌ dist 目录
- ❌ 测试文件本身
- ❌ 类型定义文件
- ❌ 配置文件
- ❌ Prisma 文件

## 🎯 测试环境

### Node 环境
适用于：纯 Node.js 代码、服务端逻辑

项目：
- contracts
- domain-core
- domain-server
- utils
- api

### Happy-DOM 环境
适用于：需要 DOM API 的客户端代码

项目：
- domain-client
- ui
- desktop
- web

### JSDOM 环境（可选）
如需更完整的浏览器环境，可切换到 jsdom：

```typescript
test: {
  environment: 'jsdom',
}
```

## 🔍 调试测试

### VS Code 调试

在 `.vscode/launch.json` 中添加：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 命令行调试

```bash
# Node.js 调试
node --inspect-brk ./node_modules/.bin/vitest --project='📦 domain-server'

# Chrome DevTools
vitest --project='📦 domain-server' --inspect-brk
```

### 只运行特定测试

```bash
# 运行匹配的测试文件
vitest Goal.test.ts

# 运行匹配的测试用例
vitest -t "should create goal"

# 结合项目筛选
vitest --project='📦 domain-server' -t "should create goal"
```

## 📈 性能优化

### 并发控制

```typescript
test: {
  // 并发测试（默认）
  pool: 'threads',
  
  // 或使用 forks（隔离性更好）
  pool: 'forks',
  poolOptions: {
    forks: {
      singleFork: false, // 允许多个进程
    },
  },
}
```

### 缓存

Vitest 会自动缓存测试结果。清除缓存：

```bash
# 清除 Nx 缓存（推荐）
pnpm clean

# 手动删除 Vitest 缓存
rm -rf node_modules/.vitest
```

## 🚨 常见问题

### Q: Workspace 配置和项目配置冲突怎么办？

A: Workspace 配置优先级更高。建议主要使用 workspace 配置，项目配置作为补充。

### Q: 如何禁用某个项目？

A: 在 `vitest.workspace.ts` 中注释掉该项目的配置。

### Q: 测试运行很慢怎么办？

A: 
1. 使用 `--project` 只运行需要的项目
2. 使用 `-t` 只运行特定测试
3. 检查是否有慢速测试（使用 `--reporter=verbose`）
4. 考虑使用 `pool: 'threads'` 而不是 `forks`

### Q: 覆盖率不准确怎么办？

A: 检查 `coverage.exclude` 配置，确保没有排除不该排除的文件。

## 📚 更多资源

- [Vitest API 文档](https://vitest.dev/api/)
- [Vitest 配置参考](https://vitest.dev/config/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Vitest 覆盖率](https://vitest.dev/guide/coverage.html)
- [Vitest 最佳实践](https://vitest.dev/guide/features.html)

## 🎉 开始使用

1. 运行所有测试：`pnpm test`
2. 打开 UI 界面：`pnpm test:ui`
3. 查看这个 README，了解更多命令
4. 开始编写测试！

Happy Testing! 🚀
