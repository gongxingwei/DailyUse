# DailyUse Scripts Guide

> 快速参考指南：所有项目脚本命令统一入口

---

## 🚀 开发环境启动

```bash
# 启动单个服务
pnpm dev:api         # 后端 API (http://localhost:3888)
pnpm dev:web         # 前端 Web (http://localhost:5173)
pnpm dev:desktop     # 桌面应用

# 同时启动多个服务
pnpm dev:all         # API + Web 同时启动
```

---

## 🗄️ 数据库操作 (Prisma)

```bash
# 生成 Prisma Client (更新类型定义)
pnpm prisma:generate

# 创建并执行迁移 (开发环境)
pnpm prisma:migrate
# 或指定名称
pnpm prisma migrate add_weight_snapshot

# 部署迁移 (生产环境)
pnpm prisma:migrate:deploy

# 打开 Prisma Studio (数据库 GUI)
pnpm prisma:studio

# 推送 Schema 到数据库 (跳过迁移文件生成)
pnpm db:push

# 数据库重置 + 种子数据
pnpm prisma:reset

# 运行种子数据
pnpm db:seed

# 执行任意 Prisma 命令
pnpm prisma <command>
# 例如: pnpm prisma format
```

---

## 🏗️ 构建

```bash
# 构建所有项目
pnpm build

# 构建单个项目
pnpm build:api
pnpm build:web
pnpm build:desktop

# 仅构建共享包 (contracts, domain, ui, utils)
pnpm packages:build
```

---

## 🧪 测试

```bash
# 运行所有测试 (watch 模式)
pnpm test

# 运行一次并退出
pnpm test:run

# 测试 UI (浏览器界面)
pnpm test:ui

# 测试覆盖率报告
pnpm test:coverage

# 测试特定包
pnpm test:api
pnpm test:web
pnpm test:domain-server
pnpm test:domain-client
pnpm test:contracts
pnpm test:ui-lib
pnpm test:utils

# 仅测试受影响的项目
pnpm test:affected
```

---

## ✨ 代码质量

```bash
# ESLint 检查
pnpm lint

# ESLint 自动修复
pnpm lint:fix

# Prettier 格式化
pnpm format

# Prettier 检查
pnpm format:check

# TypeScript 类型检查
pnpm typecheck
```

---

## 📦 包管理

```bash
# 安装所有依赖
pnpm install

# 构建共享包并监听变化
pnpm packages:watch

# 查看项目依赖图
pnpm graph

# 仅构建受影响的项目
pnpm affected:build
pnpm affected:test
pnpm affected:lint
```

---

## 🧹 清理

```bash
# 清理 Nx 缓存
pnpm clean

# 完全重装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 🎯 常用工作流

### 启动开发环境

```bash
# 1. 安装依赖
pnpm install

# 2. 生成 Prisma Client
pnpm prisma:generate

# 3. 运行迁移（如果是首次）
pnpm prisma:migrate

# 4. 启动服务
pnpm dev:all
```

### 创建新的数据库迁移

```bash
# 1. 修改 apps/api/prisma/schema.prisma

# 2. 创建迁移文件
pnpm prisma migrate add_your_feature_name

# 3. 生成新类型
pnpm prisma:generate

# 4. 验证代码编译
pnpm build:api
```

### 添加新功能前

```bash
# 1. 确保所有包最新
pnpm packages:build

# 2. 检查代码质量
pnpm lint
pnpm typecheck

# 3. 运行测试
pnpm test:run
```

---

## 💡 技巧

### 使用 Nx 缓存加速

Nx 会自动缓存构建和测试结果，相同的输入会直接使用缓存。

### 仅运行受影响的任务

```bash
# Git commit 后，仅测试变更影响的项目
pnpm affected:test

# 仅构建受影响的项目
pnpm affected:build
```

### 查看依赖关系

```bash
# 可视化项目依赖图
pnpm graph

# 查看特定项目的依赖
pnpm nx graph --focus=api
```

### 并行执行

```bash
# 并行构建多个项目
pnpm nx run-many --target=build --projects=api,web --parallel=2
```

---

## 🆘 常见问题

### Prisma Client 类型不对

```bash
# 解决方案：重新生成
pnpm prisma:generate
```

### 数据库连接失败

```bash
# 检查 apps/api/.env 文件
# 确保 DATABASE_URL 正确
```

### 依赖安装失败

```bash
# 清理并重装
pnpm clean
rm -rf node_modules
pnpm install
```

### TypeScript 编译错误

```bash
# 重新构建共享包
pnpm packages:build

# 类型检查
pnpm typecheck
```

---

## 📚 更多信息

- [Nx Documentation](https://nx.dev)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [Prisma Documentation](https://www.prisma.io/docs)
