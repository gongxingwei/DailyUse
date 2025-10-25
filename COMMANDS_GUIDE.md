# 📘 DailyUse 命令使用指南

> 本文档提供项目中所有常用命令的完整说明

## 📋 目录

- [快速开始](#快速开始)
- [开发命令](#开发命令)
- [构建命令](#构建命令)
- [类型检查](#类型检查)
- [测试命令](#测试命令)
- [数据库操作](#数据库操作)
- [代码质量](#代码质量)
- [项目维护](#项目维护)

---

## 🚀 快速开始

### 首次安装
```bash
# 安装所有依赖
pnpm install

# 生成 Prisma 客户端 (自动在 postinstall 执行)
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 启动开发服务器（API + Web 并行）
pnpm dev
```

### 日常开发
```bash
# 启动所有服务（推荐）
pnpm dev

# 或者单独启动
pnpm dev:api    # API 服务 (http://localhost:3888)
pnpm dev:web    # Web 前端 (http://localhost:5173)
```

---

## 💻 开发命令

### 启动开发服务器

| 命令 | 说明 | 端口 |
|------|------|------|
| `pnpm dev` | 启动 API + Web (并行) | 3888 + 5173 |
| `pnpm dev:api` | 仅启动 API 服务 | 3888 |
| `pnpm dev:web` | 仅启动 Web 前端 | 5173 |
| `pnpm dev:desktop` | 启动 Desktop 应用 | - |
| `pnpm dev:all` | 同 `pnpm dev` | 3888 + 5173 |

### 包开发

```bash
# 监听所有包的变化并自动构建
pnpm packages:watch

# 或者使用别名
pnpm packages:dev
```

---

## 🏗️ 构建命令

### 完整构建流程

```bash
# 构建所有项目（推荐用于生产）
pnpm build

# 等价于：
# 1. 构建所有 packages
# 2. 构建 api, web, desktop
```

### 单独构建

| 命令 | 说明 |
|------|------|
| `pnpm build:api` | 构建 API 服务 |
| `pnpm build:web` | 构建 Web 前端 |
| `pnpm build:desktop` | 构建 Desktop 应用 |
| `pnpm build:packages` | 构建所有共享包 |
| `pnpm build:all` | 构建所有项目 |

### 清理构建

```bash
# 清理构建产物
pnpm clean:build

# 清理 Nx 缓存
pnpm clean

# 完全重置（删除 node_modules + 缓存）
pnpm reset
```

---

## 🔍 类型检查

### 全局类型检查

```bash
# 检查所有项目的类型
pnpm typecheck

# 检查受影响的项目
pnpm affected:typecheck
```

### 单项目类型检查

| 命令 | 说明 |
|------|------|
| `pnpm typecheck:api` | 检查 API 类型 |
| `pnpm typecheck:web` | 检查 Web 类型 |
| `pnpm typecheck:desktop` | 检查 Desktop 类型 |
| `pnpm typecheck:packages` | 检查所有包的类型 |

---

## 🧪 测试命令

### 单元测试

```bash
# 运行所有测试 (watch 模式)
pnpm test

# 运行一次所有测试
pnpm test:run

# 带 UI 界面运行
pnpm test:ui

# 生成覆盖率报告
pnpm test:coverage

# 监听模式
pnpm test:watch
```

### 分项目测试

| 命令 | 说明 |
|------|------|
| `pnpm test:api` | 测试 API |
| `pnpm test:web` | 测试 Web |
| `pnpm test:desktop` | 测试 Desktop |
| `pnpm test:domain-server` | 测试 domain-server 包 |
| `pnpm test:domain-client` | 测试 domain-client 包 |
| `pnpm test:contracts` | 测试 contracts 包 |
| `pnpm test:utils` | 测试 utils 包 |
| `pnpm test:ui-lib` | 测试 UI 库 |

### E2E 测试 (Playwright)

```bash
# 运行 E2E 测试
pnpm e2e

# 带浏览器界面
pnpm e2e:headed

# 调试模式
pnpm e2e:debug

# Playwright UI
pnpm e2e:ui

# 查看测试报告
pnpm e2e:report
```

---

## 🗄️ 数据库操作 (Prisma)

### 快速操作

| 命令 | 说明 |
|------|------|
| `pnpm prisma:generate` | 生成 Prisma 客户端 |
| `pnpm prisma:migrate` | 创建并应用迁移 |
| `pnpm prisma:studio` | 打开数据库可视化工具 |
| `pnpm prisma:seed` | 填充种子数据 |
| `pnpm db:reset` | 重置数据库并重新填充 |

### 迁移管理

```bash
# 创建新迁移（自动应用）
pnpm prisma:migrate

# 只创建迁移文件，不应用
pnpm prisma:migrate:create

# 应用迁移（生产环境）
pnpm prisma:migrate:deploy

# 重置所有迁移
pnpm prisma:migrate:reset

# 直接推送 schema 到数据库（开发用）
pnpm db:push

# 从数据库拉取 schema
pnpm --filter @dailyuse/api db:pull
```

### Schema 管理

```bash
# 格式化 schema 文件
pnpm prisma:format

# 验证 schema
pnpm prisma:validate

# 直接运行 prisma 命令
pnpm prisma [command]
```

### 数据管理

```bash
# 填充数据库
pnpm db:seed

# 完全重置（迁移 + 种子数据）
pnpm db:reset
```

---

## 🎨 代码质量

### Linting

```bash
# 检查所有项目
pnpm lint

# 自动修复
pnpm lint:fix

# 单项目 lint
pnpm lint:api
pnpm lint:web
pnpm lint:desktop
```

### 格式化

```bash
# 格式化所有文件
pnpm format

# 检查格式
pnpm format:check
```

### Affected 分析

```bash
# 构建受影响的项目
pnpm affected:build

# 测试受影响的项目
pnpm affected:test

# Lint 受影响的项目
pnpm affected:lint

# 类型检查受影响的项目
pnpm affected:typecheck
```

---

## 🛠️ 项目维护

### 依赖管理

```bash
# 安装依赖
pnpm install:all

# 更新依赖到最新版本
pnpm update:deps

# 检查过期依赖
pnpm check:deps

# 清理所有 node_modules
pnpm clean:deps
```

### 缓存管理

```bash
# 清理 Nx 缓存
pnpm clean

# 完全重置项目
pnpm reset  # = clean + clean:deps + install
```

### 项目可视化

```bash
# 查看项目依赖图
pnpm graph
```

---

## 📁 项目结构

```
DailyUse/
├── apps/
│   ├── api/          # Express API 服务 (3888)
│   ├── web/          # Vue 3 Web 应用 (5173)
│   └── desktop/      # Electron 桌面应用
├── packages/
│   ├── contracts/    # 共享类型定义
│   ├── domain-server/# 服务端领域模型
│   ├── domain-client/# 客户端领域模型
│   ├── ui/           # UI 组件库
│   └── utils/        # 工具函数
└── docs/             # 项目文档
```

---

## ⚙️ 环境变量配置

### API 项目 (`apps/api/.env`)

```env
# 服务端口
PORT=3888

# 数据库连接
DATABASE_URL="postgresql://user:password@host:5432/database"

# CORS 配置
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# JWT 密钥
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret
```

### Web 项目 (`apps/web/.env`)

```env
# API 地址
VITE_API_BASE_URL=http://localhost:3888

# 其他配置...
```

---

## 🔧 常见问题

### 1. Prisma 客户端找不到

```bash
# 重新生成客户端
pnpm prisma:generate
```

### 2. 类型错误

```bash
# 清理缓存并重新检查
pnpm clean
pnpm typecheck
```

### 3. 端口被占用

```bash
# 修改 apps/api/.env 中的 PORT
# 或者杀掉占用端口的进程
```

### 4. 构建失败

```bash
# 清理构建产物
pnpm clean:build

# 重新构建
pnpm build
```

### 5. 测试失败

```bash
# 清理缓存
pnpm clean

# 重新运行测试
pnpm test:run
```

---

## 📚 相关文档

- [BMAD 开发流程](./docs/BMAD_DEVELOPMENT_WORKFLOW.md)
- [脚本使用指南](./SCRIPTS_GUIDE.md)
- [Prisma 生成指南](./PRISMA_GENERATION_GUIDE.md)
- [项目架构文档](./docs/architecture/)

---

## 🤝 贡献指南

1. 创建功能分支: `git checkout -b feature/your-feature`
2. 运行测试: `pnpm test:run`
3. 类型检查: `pnpm typecheck`
4. 代码检查: `pnpm lint:fix`
5. 提交代码: `git commit -m "feat: your feature"`
6. 推送分支: `git push origin feature/your-feature`
7. 创建 Pull Request

---

## 📞 获取帮助

- 查看 [Issue](https://github.com/BakerSean168/DailyUse/issues)
- 阅读 [Wiki](https://github.com/BakerSean168/DailyUse/wiki)
- 联系维护者

---

**最后更新**: 2025-10-25
**维护者**: BakerSean
