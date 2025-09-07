# DailyUse MonoRepo 架构重构建议

## 推荐的目录结构

```
DailyUse/
├── .github/                    # GitHub Actions 工作流
├── .nx/                        # Nx 缓存和配置
├── docs/                       # 项目文档
├── tools/                      # 开发工具和脚本
│   ├── scripts/               # 构建和部署脚本
│   ├── generators/            # Nx 自定义生成器
│   └── eslint-rules/          # 自定义 ESLint 规则
├── apps/                       # 应用程序
│   ├── web/                   # Vue3 Web 应用
│   ├── api/                   # Express API 服务
│   ├── desktop/               # Electron 桌面应用
│   └── mobile/                # (未来) 移动应用
├── libs/                       # 共享库 (推荐用 libs 而不是 packages)
│   ├── contracts/             # 类型定义与契约
│   ├── domain/                # 领域模型 (合并 domain-core/server/client)
│   ├── shared/                # 共享工具和配置
│   │   ├── ui/                # UI 组件库
│   │   ├── utils/             # 通用工具
│   │   ├── config/            # 共享配置
│   │   └── testing/           # 测试工具
│   ├── web/                   # Web 特定的共享库
│   │   ├── components/        # Web 组件
│   │   ├── services/          # Web 服务
│   │   └── stores/            # 状态管理
│   ├── api/                   # API 特定的共享库
│   │   ├── middleware/        # 中间件
│   │   ├── validation/        # 验证器
│   │   └── auth/              # 认证模块
│   └── desktop/               # 桌面应用特定的库
│       ├── ipc/               # IPC 通信
│       ├── native/            # 原生功能
│       └── windows/           # 窗口管理
├── dist/                       # 构建输出 (gitignore)
├── node_modules/               # 依赖 (gitignore)
├── tmp/                        # 临时文件 (gitignore)
├── nx.json                     # Nx 配置
├── package.json                # 根包配置
├── pnpm-lock.yaml             # 锁定文件
├── pnpm-workspace.yaml        # pnpm workspace 配置
├── tsconfig.base.json         # 基础 TypeScript 配置
├── eslint.config.js           # ESLint 配置
├── prettier.config.js         # Prettier 配置
├── vitest.config.ts           # 测试配置
└── README.md                  # 项目说明
```

## 重构步骤

### 1. 清理和重组
- 将 `src/` 内容迁移到 `apps/desktop/src/`
- 将 `electron/` 内容迁移到 `apps/desktop/`
- 将 `packages/` 重命名为 `libs/`
- 创建 `tools/` 目录存放开发工具

### 2. 领域模型重组
```
libs/domain/
├── account/                   # 账户领域
│   ├── entities/
│   ├── services/
│   ├── repositories/
│   └── events/
├── task/                      # 任务领域
├── goal/                      # 目标领域
├── notification/              # 通知领域
└── shared/                    # 领域间共享
    ├── base-entity.ts
    ├── domain-event.ts
    └── value-objects/
```

### 3. 应用结构标准化
```
apps/web/
├── src/
│   ├── app/                   # 应用根组件
│   ├── pages/                 # 页面组件
│   ├── features/              # 功能模块
│   │   ├── auth/
│   │   ├── tasks/
│   │   └── goals/
│   ├── shared/                # 应用内共享
│   │   ├── components/
│   │   ├── services/
│   │   ├── guards/
│   │   └── utils/
│   ├── assets/
│   └── environments/
├── project.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 配置文件组织

### 根级配置
- 只保留影响整个 workspace 的配置
- 使用 `tsconfig.base.json` 作为所有子项目的基础

### 项目级配置
- 每个 app/lib 有自己的 `project.json`
- 继承根级配置，只覆盖特定设置

## 依赖管理策略

### 内部依赖
```json
{
  "dependencies": {
    "@dailyuse/contracts": "*",
    "@dailyuse/domain": "*",
    "@dailyuse/shared-ui": "*"
  }
}
```

### 外部依赖
- 在根 `package.json` 中声明所有依赖
- 使用 `pnpm` 的 workspace 功能避免重复安装

## Nx 项目标签策略

```json
{
  "tags": [
    "scope:shared",     // 共享库
    "scope:web",        // Web 应用相关
    "scope:api",        // API 相关
    "scope:desktop",    // 桌面应用相关
    "type:app",         // 应用程序
    "type:lib",         // 库
    "type:util",        // 工具库
    "type:ui",          // UI 组件
    "type:feature",     // 功能模块
    "type:data-access"  // 数据访问层
  ]
}
```

## 构建和发布策略

### 构建目标
```bash
# 开发环境
nx serve web
nx serve api
nx serve desktop

# 生产构建
nx build web
nx build api
nx build desktop

# 测试
nx test web
nx e2e web-e2e

# 代码质量
nx lint --all
nx format --all
```

### 发布流程
1. 版本管理：使用 semantic versioning
2. 变更日志：自动生成 CHANGELOG
3. 构建验证：CI/CD 管道验证
4. 部署：分环境部署策略
