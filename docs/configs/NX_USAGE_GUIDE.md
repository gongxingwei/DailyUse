# Nx 使用指南

> 📖 Nx monorepo 常用命令、优势、工作流和最佳实践
> 
> 🚀 快速上手 Nx 开发，提升团队效率

---

## 目录

- [1. 安装和配置](#1-安装和配置)
- [2. 核心优势](#2-核心优势)
- [3. 常用命令](#3-常用命令)
  - [3.1 运行任务](#31-运行任务)
  - [3.2 受影响分析](#32-受影响分析)
  - [3.3 依赖图可视化](#33-依赖图可视化)
  - [3.4 生成器](#34-生成器)
- [4. 开发工作流](#4-开发工作流)
- [5. CI/CD 集成](#5-cicd-集成)
- [6. 性能优化](#6-性能优化)
- [7. 故障排查](#7-故障排查)

---

## 1. 安装和配置

### 1.1 使用 pnpm nx（当前方式）

当前项目需要通过 `pnpm` 前缀运行 Nx 命令：

```bash
# ✅ 当前方式（必须加 pnpm 前缀）
pnpm nx serve api
pnpm nx test web
pnpm nx build --all

# ❌ 不可用（会提示找不到命令）
nx serve api
```

**原因**：
- Nx CLI 安装在项目本地（`node_modules/.bin/nx`）
- 未安装全局 Nx CLI
- `pnpm` 会自动找到本地安装的 `nx` 可执行文件

---

### 1.2 安装全局 Nx CLI（推荐）

**安装方法**：

```bash
# 使用 pnpm 全局安装
pnpm add -g nx

# 或者使用 npm 全局安装
npm install -g nx

# 或者使用 yarn 全局安装
yarn global add nx
```

**验证安装**：

```bash
nx --version
# 输出：21.4.1（或其他版本）
```

**安装后的优势**：

```bash
# ✅ 可以直接使用 nx 命令（无需 pnpm 前缀）
nx serve api
nx test web
nx build --all

# ✅ 更短的命令，更快的输入
nx affected:test  # vs. pnpm nx affected:test

# ✅ 与 Nx 官方文档示例一致
# 官方文档中的命令可以直接复制使用
```

**全局 vs 本地 Nx CLI**：

| 特性 | 全局安装 | 本地安装（pnpm nx） |
|-----|---------|-------------------|
| 命令长度 | 短（`nx ...`） | 长（`pnpm nx ...`） |
| 安装位置 | 系统全局 | 项目 node_modules |
| 多项目支持 | 共享一个版本 | 每个项目独立版本 |
| 版本控制 | 需手动更新 | package.json 锁定版本 |
| 推荐场景 | 日常开发 | CI/CD 环境 |

**最佳实践**：
- ✅ 开发环境：安装全局 Nx CLI（方便日常使用）
- ✅ CI/CD 环境：使用 `pnpm nx`（确保版本一致）
- ✅ 团队协作：在 README 中说明两种用法

---

### 1.3 使用 npx（无需安装）

如果不想安装全局 Nx CLI，也可以使用 `npx`：

```bash
# 使用 npx 临时下载并执行 nx
npx nx serve api

# 首次运行会提示：
# Need to install the following packages: nx@21.4.1
# Ok to proceed? (y)
```

**优缺点**：
- ✅ 无需全局安装
- ✅ 自动使用项目锁定的版本
- ❌ 首次运行需要下载（稍慢）
- ❌ 每次都需要输入 `npx` 前缀

---

## 2. 核心优势

### 2.1 智能缓存（Computation Caching）

**原理**：
- Nx 计算任务输入文件的哈希值
- 如果输入未变化，直接从缓存恢复输出
- 缓存存储在 `.nx/cache` 目录

**示例**：

```bash
# 第一次构建（无缓存）
$ pnpm nx build api
> Executing 1 task...
✔  nx run api:build (5.2s)

# 第二次构建（使用缓存）
$ pnpm nx build api
> Executing 1 task...
✔  nx run api:build [existing outputs match the cache, left as is]

# ⚡ 从 5.2s 降低到 ~50ms
```

**缓存失效条件**：
- 源代码文件变化（`src/**/*`）
- 配置文件变化（`tsconfig.json`、`vite.config.ts`）
- 依赖项目的输出变化（`domain-client` 构建产物变化）

**远程缓存（Nx Cloud）**：
- 团队成员共享构建缓存
- CI 和本地开发共享缓存
- 显著减少整体构建时间（50%+ 提升）

**示例场景**：
```
开发者 A（周一）：
  构建 api 项目 → 上传缓存到 Nx Cloud

开发者 B（周二，相同分支）：
  构建 api 项目 → 从 Nx Cloud 下载缓存 → 跳过构建
```

---

### 2.2 受影响分析（Affected Analysis）

**原理**：
- Nx 分析 Git 变更的文件
- 构建项目依赖图
- 只运行受影响项目的任务

**示例**：

```bash
# 场景：只修改了 domain-core 包
$ git status
modified:   packages/domain-core/src/User.ts

# 只测试受影响的项目
$ pnpm nx affected:test
> Executing 3 tasks...
✔  nx run domain-core:test
✔  nx run domain-client:test  # 依赖 domain-core
✔  nx run web:test            # 依赖 domain-client

# ✅ api、desktop 等不依赖 domain-core 的项目不会运行测试
# ⚡ 从 11 个项目测试 → 3 个项目测试（节省 70% 时间）
```

**对比传统 monorepo**：

| 场景 | 传统 monorepo | Nx monorepo |
|-----|--------------|-------------|
| 修改 1 个包 | 测试所有 11 个项目 | 只测试 3 个受影响项目 |
| 构建时间 | 每次都全量构建 | 只构建变更部分 |
| CI/CD | 每次提交都跑全部测试 | 只跑受影响测试 |

---

### 2.3 并行执行（Parallel Execution）

**原理**：
- Nx 分析任务依赖图
- 并行执行无依赖关系的任务
- 自动利用多核 CPU

**示例**：

```bash
# 构建所有项目
$ pnpm nx run-many --target=build --all

# Nx 自动并行执行：
# ┌─────────────────────────────────┐
# │ 同时执行（无依赖关系）            │
# ├─────────────────────────────────┤
# │ build domain-core               │
# │ build contracts                 │
# │ build utils                     │
# │ build assets                    │
# └─────────────────────────────────┘
#           ↓
# ┌─────────────────────────────────┐
# │ 等待依赖完成后执行                │
# ├─────────────────────────────────┤
# │ build domain-server (依赖 domain-core)
# │ build domain-client (依赖 domain-core)
# └─────────────────────────────────┘
#           ↓
# ┌─────────────────────────────────┐
# │ 最后执行应用构建                  │
# ├─────────────────────────────────┤
# │ build api (依赖 domain-server)  │
# │ build web (依赖 domain-client)  │
# │ build desktop (依赖 domain-client)
# └─────────────────────────────────┘
```

**性能提升**：
- 4 核 CPU：理论上可提升 3-4 倍速度
- 8 核 CPU：理论上可提升 6-8 倍速度

---

### 2.4 类型热更新（Type-safe Imports）

**特性**：
- TypeScript 项目引用（Project References）
- 实时类型检查
- 快速跳转到源代码定义

**配置**（已在本项目中配置）：

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "composite": true,  // 启用项目引用
    "paths": {
      "@daily-use/domain-core": ["packages/domain-core/src/index.ts"],
      "@daily-use/domain-client": ["packages/domain-client/src/index.ts"]
    }
  }
}

// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "references": [
    { "path": "../../packages/domain-client" }
  ]
}
```

**效果**：

```typescript
// apps/web/src/App.tsx
import { User } from '@daily-use/domain-client';

const user: User = {
  id: '123',
  name: 'Alice',
  email: 'invalid'  // ❌ TypeScript 立即报错（无需构建）
};

// ✅ Ctrl+Click 跳转到 domain-client 的源代码定义
// ✅ 修改 domain-client 的类型，web 实时看到错误
// ✅ 无需手动构建 domain-client 即可获得类型检查
```

**优势对比**：

| 特性 | 传统方式（构建后导入） | Nx + TypeScript 项目引用 |
|-----|---------------------|----------------------|
| 类型检查 | 需要先构建依赖包 | 实时检查，无需构建 |
| 跳转到定义 | 跳转到 .d.ts 文件 | 跳转到源代码 |
| 开发体验 | 修改依赖包需重新构建 | 实时反馈 |
| 调试 | 只能看到编译后代码 | 直接调试源代码 |

---

### 2.5 代码检测和错误检测

**快速检测单个项目**：

```bash
# 只检测 api 项目的 TypeScript 错误
pnpm nx run api:typecheck

# 只检测 web 项目的 lint 错误
pnpm nx run web:lint

# 只运行 domain-core 的单元测试
pnpm nx run domain-core:test
```

**批量检测受影响项目**：

```bash
# 只检测受 Git 变更影响的项目
pnpm nx affected:lint
pnpm nx affected:test
pnpm nx affected --target=typecheck
```

**全量检测**：

```bash
# 检测所有项目的 lint 错误
pnpm nx run-many --target=lint --all

# 运行所有项目的测试
pnpm nx run-many --target=test --all

# 检测所有项目的类型错误
pnpm nx run-many --target=typecheck --all
```

**性能对比**：

```bash
# ❌ 传统方式：逐个检测（串行）
cd packages/domain-core && npm run lint
cd ../domain-client && npm run lint
cd ../../apps/api && npm run lint
# ...（11 次，耗时约 3-5 分钟）

# ✅ Nx 方式：并行检测 + 缓存
pnpm nx run-many --target=lint --all
# ⚡ 首次：~30 秒（并行执行）
# ⚡ 二次：~2 秒（使用缓存）
```

---

## 3. 常用命令

### 3.1 运行任务

#### 运行单个项目的任务

```bash
# 格式：nx run <项目名>:<任务名>
# 或者：nx <任务名> <项目名>

# 启动 API 开发服务器
pnpm nx serve api
pnpm nx run api:serve  # 等同于上面

# 构建 web 应用
pnpm nx build web

# 运行 domain-core 的测试
pnpm nx test domain-core

# 检查 api 的代码规范
pnpm nx lint api

# TypeScript 类型检查（web 项目）
pnpm nx typecheck web
```

#### 运行多个项目的任务

```bash
# 格式：nx run-many --target=<任务名> --projects=<项目列表>

# 构建 api 和 web 两个项目
pnpm nx run-many --target=build --projects=api,web

# 测试所有以 "domain-" 开头的包
pnpm nx run-many --target=test --projects=domain-*

# 构建所有项目
pnpm nx run-many --target=build --all

# 并行运行（指定最大并行数）
pnpm nx run-many --target=test --all --parallel=4
```

#### 使用配置（configuration）

```bash
# 使用 production 配置构建
pnpm nx build web --configuration=production

# 使用 development 配置构建
pnpm nx build web --configuration=development

# 简写形式
pnpm nx build web -c production
```

#### 传递额外参数

```bash
# 传递参数给底层命令（使用 --）
pnpm nx test domain-core -- --watch

# 等同于执行：
# vitest run --watch

# 传递多个参数
pnpm nx test domain-core -- --watch --ui
```

---

### 3.2 受影响分析

#### affected 命令（与 Git 变更相关）

```bash
# 显示受影响的项目
pnpm nx affected:graph

# 只测试受影响的项目
pnpm nx affected:test

# 只构建受影响的项目
pnpm nx affected:build

# 只 lint 受影响的项目
pnpm nx affected:lint

# 运行受影响项目的任意任务
pnpm nx affected --target=typecheck
```

#### 指定对比基准

```bash
# 默认：与 main 分支对比
pnpm nx affected:test

# 与指定分支对比
pnpm nx affected:test --base=develop

# 与指定 commit 对比
pnpm nx affected:test --base=HEAD~1

# 指定范围（从 commit A 到 commit B）
pnpm nx affected:test --base=abc123 --head=def456

# 与远程分支对比
pnpm nx affected:test --base=origin/main
```

#### 受影响分析的工作原理

```bash
# 1. Nx 检测 Git 变更的文件
$ git diff main...HEAD --name-only
packages/domain-core/src/User.ts
packages/domain-core/src/index.ts

# 2. Nx 分析项目依赖图
domain-core
  ↓ 被依赖
domain-client
  ↓ 被依赖
web

# 3. Nx 标记受影响的项目
受影响项目：domain-core, domain-client, web

# 4. 只运行这些项目的任务
pnpm nx affected:test
# 只测试：domain-core, domain-client, web
# 跳过：api, desktop, domain-server 等
```

---

### 3.3 依赖图可视化

#### 查看项目依赖关系

```bash
# 打开交互式依赖图（在浏览器中）
pnpm nx graph

# 浏览器会打开：http://localhost:4211
# 可以：
# - 查看所有项目的依赖关系
# - 点击项目查看详细信息
# - 筛选特定项目的依赖
# - 查看受影响的项目
```

#### 聚焦特定项目

```bash
# 只显示 web 项目的依赖关系
pnpm nx graph --focus=web

# 显示受影响的项目（高亮显示）
pnpm nx affected:graph
```

#### 导出依赖图

```bash
# 导出为 JSON 文件
pnpm nx graph --file=dependency-graph.json

# 导出为 HTML 文件
pnpm nx graph --file=dependency-graph.html
```

#### 依赖图示例

```
         ┌─────────────┐
         │ domain-core │
         └──────┬──────┘
                │
        ┌───────┴───────┐
        ↓               ↓
 ┌──────────────┐  ┌──────────────┐
 │ domain-server│  │ domain-client│
 └──────┬───────┘  └──────┬───────┘
        │                 │
        ↓          ┌──────┴──────┐
   ┌────────┐     ↓             ↓
   │  api   │  ┌─────┐      ┌────────┐
   └────────┘  │ web │      │desktop │
               └─────┘      └────────┘
```

---

### 3.4 生成器（Generators）

#### 生成新项目

```bash
# 生成新的 React 应用
pnpm nx generate @nx/react:app my-app

# 生成新的 Node.js 库
pnpm nx generate @nx/node:lib my-lib

# 生成新的 TypeScript 库（不含框架）
pnpm nx generate @nx/js:lib my-utils
```

#### 生成代码

```bash
# 生成 React 组件
pnpm nx generate @nx/react:component Button --project=web

# 生成 Express 路由
pnpm nx generate @nx/express:route users --project=api

# 生成单元测试
pnpm nx generate @nx/js:lib my-lib --unitTestRunner=vitest
```

#### 使用简写

```bash
# nx generate 可以简写为 nx g
pnpm nx g @nx/react:app my-app

# 使用默认生成器（根据项目类型推断）
pnpm nx g component Button --project=web
```

#### 查看可用生成器

```bash
# 列出所有生成器
pnpm nx list

# 查看特定插件的生成器
pnpm nx list @nx/react

# 查看生成器的选项
pnpm nx g @nx/react:app --help
```

---

## 4. 开发工作流

### 4.1 日常开发流程

```bash
# 1. 拉取最新代码
git checkout main
git pull origin main

# 2. 创建新分支
git checkout -b feature/add-user-profile

# 3. 修改代码（例如修改 domain-core）
# 编辑 packages/domain-core/src/User.ts

# 4. 快速验证（只检测受影响项目）
pnpm nx affected:lint      # 代码规范检查
pnpm nx affected:test      # 单元测试
pnpm nx affected:build     # 构建检查

# 5. 启动开发服务器（测试功能）
pnpm nx serve api          # 启动 API
pnpm nx serve web          # 启动 Web（另一个终端）

# 6. 提交代码
git add .
git commit -m "feat: add user profile field"
git push origin feature/add-user-profile

# 7. CI/CD 自动运行（受影响项目检测）
# GitHub Actions 会自动执行：
# - nx affected:lint
# - nx affected:test
# - nx affected:build
```

---

### 4.2 修复错误的工作流

```bash
# 场景：修改 domain-core 后，发现类型错误

# 1. 快速检测受影响项目的类型错误
pnpm nx affected --target=typecheck

# 输出：
# ✔  nx run domain-core:typecheck
# ✖  nx run domain-client:typecheck
#    Error: Type 'string' is not assignable to type 'number'
# ✖  nx run web:typecheck
#    Error: Property 'age' is missing

# 2. 修复 domain-core 的类型定义
# 编辑 packages/domain-core/src/User.ts

# 3. 只重新检测之前失败的项目（使用缓存）
pnpm nx affected --target=typecheck

# 输出（使用缓存）：
# ✔  nx run domain-core:typecheck [existing outputs match the cache]
# ✔  nx run domain-client:typecheck
# ✔  nx run web:typecheck

# ✅ 节省时间：domain-core 使用缓存，只重新检测 domain-client 和 web
```

---

### 4.3 大规模重构工作流

```bash
# 场景：重构 domain-core 的核心接口

# 1. 创建重构分支
git checkout -b refactor/user-interface

# 2. 修改 domain-core
# 编辑 packages/domain-core/src/User.ts（大规模修改）

# 3. 查看哪些项目会受影响
pnpm nx affected:graph

# 浏览器打开依赖图，看到：
# domain-core → domain-client → web
# domain-core → domain-client → desktop
# domain-core → domain-server → api

# 4. 逐个修复受影响的项目
pnpm nx run domain-client:typecheck  # 查看类型错误
# 修复 domain-client

pnpm nx run domain-server:typecheck  # 查看类型错误
# 修复 domain-server

pnpm nx run web:typecheck            # 查看类型错误
# 修复 web

# 5. 全量验证所有项目
pnpm nx run-many --target=typecheck --all
pnpm nx run-many --target=test --all
pnpm nx run-many --target=build --all

# 6. 提交重构
git add .
git commit -m "refactor: redesign User interface"
```

---

### 4.4 多人协作工作流

**场景**：开发者 A 和开发者 B 同时开发不同模块

```bash
# 开发者 A：修改 domain-client
git checkout -b feature/client-update
# 编辑 packages/domain-client/src/ApiClient.ts
pnpm nx affected:test  # 只测试 domain-client, web, desktop
git commit -m "feat: add API retry logic"
git push

# 开发者 B：修改 domain-server
git checkout -b feature/server-update
# 编辑 packages/domain-server/src/Repository.ts
pnpm nx affected:test  # 只测试 domain-server, api
git commit -m "feat: add database connection pooling"
git push

# ✅ 两个开发者互不干扰
# ✅ 各自只运行自己受影响的测试
# ✅ CI/CD 也只运行受影响的测试（提升速度）
```

---

## 5. CI/CD 集成

### 5.1 GitHub Actions 示例

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # 获取完整 Git 历史（用于 affected 分析）

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      # 设置 Nx Cloud（启用远程缓存）
      - run: pnpx nx-cloud start-ci-run

      # 只 lint 受影响的项目
      - run: pnpm nx affected:lint --base=origin/main

      # 只测试受影响的项目（并行执行）
      - run: pnpm nx affected:test --base=origin/main --parallel=3

      # 只构建受影响的项目
      - run: pnpm nx affected:build --base=origin/main --parallel=3
```

**优势**：
- ✅ 只运行受影响的任务（节省 50-90% CI 时间）
- ✅ 并行执行（充分利用 CI 服务器资源）
- ✅ 远程缓存（不同 CI 运行之间共享缓存）

---

### 5.2 受影响分析的 CI 优化

**传统 monorepo CI**：

```yaml
# ❌ 每次都全量构建（慢）
- run: npm run lint    # 检查所有 11 个项目
- run: npm run test    # 测试所有 11 个项目
- run: npm run build   # 构建所有 11 个项目
# ⏱️ 耗时：约 15-20 分钟
```

**Nx monorepo CI**：

```yaml
# ✅ 只构建受影响项目（快）
- run: pnpm nx affected:lint   # 只检查受影响项目（例如 2 个）
- run: pnpm nx affected:test   # 只测试受影响项目（例如 3 个）
- run: pnpm nx affected:build  # 只构建受影响项目（例如 2 个）
# ⏱️ 耗时：约 3-5 分钟（节省 70-80% 时间）
```

---

### 5.3 Nx Cloud 配置

**当前配置**（已启用）：

```json
// nx.json
{
  "nxCloudId": "68bbbbe10edeab7b22a78ead"
}
```

**查看缓存状态**：

```bash
# 查看远程缓存状态
pnpm nx show projects

# 查看特定任务的缓存状态
pnpm nx run api:build --verbose
```

**手动上传/下载缓存**：

```bash
# 禁用远程缓存（只使用本地缓存）
pnpm nx build api --skip-nx-cache

# 清除本地缓存
pnpm nx reset
```

---

## 6. 性能优化

### 6.1 缓存优化

#### 确保缓存生效

```json
// project.json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -p tsconfig.app.json"
      },
      // ✅ 必须配置 inputs 和 outputs
      "inputs": ["production", "^production"],
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    }
  }
}
```

#### 查看缓存命中率

```bash
# 构建所有项目（查看缓存使用情况）
pnpm nx run-many --target=build --all

# 输出示例：
# ✔  nx run domain-core:build [existing outputs match the cache]
# ✔  nx run domain-client:build [existing outputs match the cache]
# ✔  nx run api:build (2.1s)
#
# 缓存命中：2/3 (66%)
```

#### 清除缓存（排查问题时使用）

```bash
# 清除所有缓存
pnpm nx reset

# 重新构建（不使用缓存）
pnpm nx build api --skip-nx-cache
```

---

### 6.2 并行优化

#### 调整并行数量

```bash
# 默认：Nx 自动检测 CPU 核心数
pnpm nx run-many --target=build --all

# 手动指定并行数（例如 4 个任务同时执行）
pnpm nx run-many --target=build --all --parallel=4

# 串行执行（用于调试）
pnpm nx run-many --target=build --all --parallel=1
```

#### 优化任务依赖

```json
// ❌ 过度依赖（降低并行度）
{
  "build": {
    "dependsOn": ["lint", "test", "^build"]
  }
}

// ✅ 最小化依赖（提升并行度）
{
  "build": {
    "dependsOn": ["^build"]
  },
  "lint": {},
  "test": {}
}
```

**原因**：
- `build` 依赖 `lint` 和 `test` 会导致串行执行
- 分离依赖允许 `lint`、`test`、`build` 并行执行

---

### 6.3 项目边界限制（Module Boundaries）

**作用**：防止循环依赖和不合理的依赖关系

```json
// .eslintrc.json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "enforceBuildableLibDependency": true,
        "allow": [],
        "depConstraints": [
          {
            "sourceTag": "scope:client",
            "onlyDependOnLibsWithTags": ["scope:client", "scope:shared"]
          },
          {
            "sourceTag": "scope:server",
            "onlyDependOnLibsWithTags": ["scope:server", "scope:shared"]
          },
          {
            "sourceTag": "type:app",
            "onlyDependOnLibsWithTags": ["type:lib", "type:util"]
          }
        ]
      }
    ]
  }
}
```

**效果**：

```typescript
// packages/domain-client/src/index.ts
import { Repository } from '@daily-use/domain-server'; // ❌ ESLint 报错
// Error: A project tagged with "scope:client" can only depend on libs tagged with "scope:client" or "scope:shared"

// packages/ui/src/Button.tsx
import { Repository } from '@daily-use/domain-server'; // ❌ ESLint 报错
// Error: A project tagged with "type:ui" can only depend on libs tagged with "type:util"
```

---

## 7. 故障排查

### 7.1 缓存问题

**问题**：修改代码后，构建结果没有更新

**解决方法**：

```bash
# 1. 清除本地缓存
pnpm nx reset

# 2. 重新构建
pnpm nx build api

# 3. 如果仍有问题，检查 inputs 配置
# 确保 inputs 包含了所有相关文件
```

---

### 7.2 依赖图错误

**问题**：`nx graph` 显示错误的依赖关系

**解决方法**：

```bash
# 1. 清除 Nx 缓存
pnpm nx reset

# 2. 重新分析依赖
pnpm nx graph

# 3. 检查 tsconfig.json 的 paths 配置
# 确保所有 @daily-use/* 路径映射正确
```

---

### 7.3 affected 命令不准确

**问题**：`nx affected:test` 运行了不应该运行的项目

**解决方法**：

```bash
# 1. 检查 Git 基准分支
pnpm nx affected:test --base=main --head=HEAD

# 2. 查看检测到的变更文件
git diff main...HEAD --name-only

# 3. 查看受影响的项目
pnpm nx affected:graph --base=main
```

---

### 7.4 类型检查错误

**问题**：TypeScript 报错找不到模块

**解决方法**：

```bash
# 1. 确保所有依赖都已构建
pnpm nx run-many --target=build --all

# 2. 重启 TypeScript 服务器（VS Code）
# 命令面板 → "TypeScript: Restart TS Server"

# 3. 检查 tsconfig.json 的 references 配置
# 确保引用了所有依赖项目
```

---

## 8. 总结

### 8.1 关键命令速查

| 命令 | 作用 | 示例 |
|-----|------|-----|
| `nx serve <project>` | 启动开发服务器 | `pnpm nx serve api` |
| `nx build <project>` | 构建项目 | `pnpm nx build web` |
| `nx test <project>` | 运行测试 | `pnpm nx test domain-core` |
| `nx lint <project>` | 代码检查 | `pnpm nx lint api` |
| `nx affected:*` | 只运行受影响项目的任务 | `pnpm nx affected:test` |
| `nx run-many --target=* --all` | 运行所有项目的任务 | `pnpm nx run-many --target=build --all` |
| `nx graph` | 查看依赖图 | `pnpm nx graph` |
| `nx reset` | 清除缓存 | `pnpm nx reset` |

---

### 8.2 最佳实践总结

1. ✅ **安装全局 Nx CLI**（方便日常使用）
   ```bash
   pnpm add -g nx
   ```

2. ✅ **使用受影响分析**（节省时间）
   ```bash
   pnpm nx affected:test  # 而不是 run-many --all
   ```

3. ✅ **启用缓存**（显著提升速度）
   ```json
   { "cache": true }
   ```

4. ✅ **配置项目边界**（防止循环依赖）
   ```json
   { "tags": ["scope:client"] }
   ```

5. ✅ **使用 Nx Cloud**（团队协作必备）
   ```json
   { "nxCloudId": "..." }
   ```

6. ✅ **TypeScript 项目引用**（实时类型检查）
   ```json
   { "references": [{ "path": "../domain-core" }] }
   ```

---

### 8.3 性能提升对比

| 场景 | 传统 monorepo | Nx monorepo | 提升幅度 |
|-----|--------------|-------------|---------|
| 全量构建（首次） | 15 分钟 | 5 分钟 | **3x** |
| 全量构建（二次） | 15 分钟 | 30 秒 | **30x** |
| 修改 1 个包后测试 | 测试 11 个项目（10 分钟） | 测试 3 个项目（2 分钟） | **5x** |
| CI/CD 时间 | 每次 15 分钟 | 平均 3-5 分钟 | **3-5x** |
| 类型检查 | 构建后检查 | 实时检查 | **即时反馈** |

---

📚 **相关文档**：
- [NX_CONFIGURATION_GUIDE.md](./NX_CONFIGURATION_GUIDE.md) - 配置文件详解
- [Nx 官方文档](https://nx.dev/getting-started/intro)
- [Nx Cloud 文档](https://nx.app/)
