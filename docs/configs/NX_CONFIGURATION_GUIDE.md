# Nx 配置完整指南

> 📖 本文档详细解释 Nx 工作空间的所有配置文件和选项
> 
> 📌 配置文件位置：`nx.json`（根目录）、`project.json`（各项目目录）

---

## 目录

- [1. 核心概念](#1-核心概念)
- [2. nx.json 详解](#2-nxjson-详解)
  - [2.1 namedInputs（命名输入）](#21-namedinputs命名输入)
  - [2.2 targetDefaults（目标默认配置）](#22-targetdefaults目标默认配置)
  - [2.3 plugins（插件配置）](#23-plugins插件配置)
  - [2.4 nxCloudId（远程缓存）](#24-nxcloudid远程缓存)
- [3. project.json 详解](#3-projectjson-详解)
  - [3.1 基本结构](#31-基本结构)
  - [3.2 targets（任务目标）](#32-targets任务目标)
  - [3.3 executors（执行器）](#33-executors执行器)
  - [3.4 依赖关系](#34-依赖关系)
- [4. 最佳实践](#4-最佳实践)
- [5. 常见问题](#5-常见问题)

---

## 1. 核心概念

### 1.1 什么是 Nx？

Nx 是一个智能的 monorepo 构建系统，它通过以下核心特性提升开发效率：

- **依赖图分析**：自动理解项目之间的依赖关系
- **智能缓存**：只重新构建变更的部分
- **并行执行**：同时运行多个独立任务
- **受影响分析**：只测试/构建受影响的项目

### 1.2 配置文件层级

```
DailyUse/
├── nx.json                          # 全局配置（所有项目共享）
├── apps/
│   ├── api/
│   │   └── project.json            # API 项目特定配置
│   ├── web/
│   │   └── project.json            # Web 项目特定配置
│   └── desktop/
│       └── project.json            # Desktop 项目特定配置
└── packages/
    ├── domain-core/
    │   └── project.json            # domain-core 包配置
    └── contracts/
        └── project.json            # contracts 包配置
```

**继承规则**：
- `project.json` 中的配置会**覆盖** `nx.json` 中的默认配置
- 如果 `project.json` 没有定义某个配置，会自动使用 `nx.json` 中的默认值

---

## 2. nx.json 详解

`nx.json` 是整个工作空间的全局配置文件，定义了所有项目共享的默认行为。

### 2.1 namedInputs（命名输入）

**作用**：定义哪些文件变化会触发任务重新运行（缓存失效）

**当前配置**：

```json
"namedInputs": {
  "default": [
    "{projectRoot}/**/*",
    "sharedGlobals"
  ],
  "production": [
    "default",
    "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
    "!{projectRoot}/tsconfig.spec.json",
    "!{projectRoot}/jest.config.[jt]s",
    "!{projectRoot}/src/test-setup.[jt]s",
    "!{projectRoot}/test-setup.[jt]s",
    "!{projectRoot}/.eslintrc.json",
    "!{projectRoot}/eslint.config.js"
  ],
  "sharedGlobals": []
}
```

#### 详细说明

| 输入名称 | 作用 | 包含内容 | 使用场景 |
|---------|------|---------|---------|
| `default` | 默认输入 | 项目根目录下所有文件 + 共享全局文件 | 开发环境、测试任务 |
| `production` | 生产输入 | `default` - 测试文件 - 开发配置 | 生产构建 |
| `sharedGlobals` | 全局共享文件 | 当前为空（可自定义） | 根级别配置文件（如 tsconfig.base.json） |

#### 路径变量说明

- `{projectRoot}`：当前项目的根目录（例如 `apps/api`）
- `{workspaceRoot}`：工作空间根目录（例如 `DailyUse`）
- `!` 前缀：表示排除（不包含）
- `^` 前缀：表示依赖项目（上游项目）

#### production 输入排除规则详解

```json
"!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)"
```
- 排除所有测试文件：`*.spec.ts`、`*.test.tsx`、`*.spec.js`、`*.snap`

```json
"!{projectRoot}/tsconfig.spec.json"
"!{projectRoot}/jest.config.[jt]s"
```
- 排除测试配置文件：`tsconfig.spec.json`、`jest.config.js`/`jest.config.ts`

```json
"!{projectRoot}/.eslintrc.json"
"!{projectRoot}/eslint.config.js"
```
- 排除 ESLint 配置：lint 配置变化不应该触发生产构建

#### 优化建议

当前 `sharedGlobals` 为空，建议添加全局配置文件：

```json
"sharedGlobals": [
  "{workspaceRoot}/tsconfig.base.json",   // 全局 TS 配置
  "{workspaceRoot}/package.json",          // 依赖版本变化
  "{workspaceRoot}/.npmrc"                 // npm 配置变化
]
```

**效果**：这些文件变化时，所有项目都会重新构建（因为它们影响整个工作空间）

---

### 2.2 targetDefaults（目标默认配置）

**作用**：为所有项目的特定任务（target）定义默认行为，减少重复配置

#### 2.2.1 build 目标

```json
"build": {
  "dependsOn": ["^build"],
  "inputs": ["production", "^production"],
  "cache": true
}
```

| 配置项 | 值 | 含义 | 示例 |
|-------|---|------|-----|
| `dependsOn` | `["^build"]` | 先构建所有依赖项目 | 构建 `web` 前先构建 `domain-client` |
| `inputs` | `["production", "^production"]` | 监听生产代码变化 + 依赖项生产代码变化 | `web/src/app.tsx` 或 `domain-client/src/index.ts` 变化都会触发重新构建 |
| `cache` | `true` | 启用缓存 | 输入未变化时直接使用上次构建结果 |

**关键概念：`^` 符号**
- `"^build"`：依赖图中**上游项目**的 build 任务
- 例如：`web` 依赖 `domain-client`，执行 `nx build web` 时会自动先执行 `nx build domain-client`

**缓存机制**：
1. Nx 计算 `inputs` 定义的所有文件的哈希值
2. 如果哈希值与上次相同，直接从缓存恢复产物
3. 如果哈希值不同，执行构建并缓存结果

#### 2.2.2 test 目标

```json
"test": {
  "inputs": [
    "default",
    "^production",
    "{workspaceRoot}/jest.preset.js"
  ],
  "cache": true
}
```

| 配置项 | 值 | 含义 |
|-------|---|------|
| `inputs` | `["default", "^production", ...]` | 监听所有项目文件（包括测试） + 依赖项生产代码 + Jest 配置 |
| `cache` | `true` | 启用测试缓存（相同输入不重复测试） |

**为什么用 `default` 而不是 `production`？**
- 测试需要执行测试文件本身（`*.spec.ts`）
- `production` 输入排除了测试文件
- `default` 包含所有文件（包括测试文件）

#### 2.2.3 lint 目标

```json
"lint": {
  "inputs": [
    "default",
    "{workspaceRoot}/.eslintrc.json",
    "{workspaceRoot}/eslint.config.js"
  ],
  "cache": true
}
```

| 配置项 | 值 | 含义 |
|-------|---|------|
| `inputs` | `["default", ...]` | 监听所有项目文件 + 根级别 ESLint 配置 |
| `cache` | `true` | 未修改的文件不重新检查 |

**为什么包含 `{workspaceRoot}/.eslintrc.json`？**
- 根级别 ESLint 配置变化会影响所有项目的 lint 结果
- 需要重新 lint 所有项目以应用新规则

#### 2.2.4 dev 目标

```json
"dev": {
  "cache": false
}
```

| 配置项 | 值 | 含义 |
|-------|---|------|
| `cache` | `false` | 不缓存开发服务器 |

**为什么不缓存？**
- 开发服务器需要实时响应文件变化
- 缓存会导致看到旧的开发服务器状态
- 开发服务器本身不产生可缓存的产物

---

### 2.3 plugins（插件配置）

**作用**：自动为项目推断配置，减少手动配置工作量

#### 2.3.1 ESLint 插件

```json
{
  "plugin": "@nx/eslint/plugin",
  "options": {
    "targetName": "lint"
  }
}
```

**功能**：
- 自动检测包含 ESLint 配置的项目（`.eslintrc.json` 或 `eslint.config.js`）
- 自动为这些项目添加 `lint` 任务目标
- 无需在 `project.json` 中手动配置 `lint` 目标

**自动推断规则**：
```
如果项目中存在：
  - .eslintrc.json
  - eslint.config.js
  - eslint.config.ts
则：
  自动生成 "lint" 目标，执行 eslint 检查
```

#### 2.3.2 Vite 插件

```json
{
  "plugin": "@nx/vite/plugin",
  "options": {
    "buildTargetName": "vite:build",
    "testTargetName": "test",
    "serveTargetName": "serve",
    "devTargetName": "vite:dev",
    "previewTargetName": "vite:preview",
    "serveStaticTargetName": "serve-static",
    "typecheckTargetName": "typecheck",
    "buildDepsTargetName": "build-deps",
    "watchDepsTargetName": "watch-deps"
  }
}
```

**功能**：
- 自动检测包含 `vite.config.ts` 的项目
- 自动为这些项目添加 9 个目标（构建、测试、开发服务器等）

**自动生成的目标**：

| 目标名称 | 命令 | 作用 |
|---------|------|-----|
| `vite:build` | `vite build` | 生产构建 |
| `test` | `vitest run` | 运行单元测试 |
| `serve` | `vite dev` | 启动开发服务器 |
| `vite:dev` | `vite dev --mode development` | 开发模式 |
| `vite:preview` | `vite preview` | 预览生产构建 |
| `serve-static` | `vite preview` | 静态文件服务 |
| `typecheck` | `vue-tsc --noEmit` | TypeScript 类型检查 |
| `build-deps` | 构建依赖 | 自动构建依赖项目 |
| `watch-deps` | 监听依赖变化 | 自动重新构建依赖 |

**自动推断规则**：
```
如果项目中存在：
  - vite.config.ts
  - vite.config.js
则：
  自动生成上述 9 个目标
```

---

### 2.4 nxCloudId（远程缓存）

```json
"nxCloudId": "68bbbbe10edeab7b22a78ead"
```

**功能**：
- 启用 Nx Cloud 远程缓存
- 团队成员共享构建缓存
- CI/CD 和本地开发共享缓存

**工作原理**：
```
开发者 A:
  1. 构建 api 项目
  2. 构建产物上传到 Nx Cloud

开发者 B（同一分支）:
  1. 尝试构建 api 项目
  2. Nx 检测到输入未变化
  3. 直接从 Nx Cloud 下载开发者 A 的构建产物
  4. 跳过构建，节省时间
```

**优势**：
- CI/CD 首次构建后，本地开发无需重新构建
- 团队成员共享构建结果
- 显著减少整体构建时间

**禁用方法**（如果不需要）：
```bash
# 删除或注释掉 nxCloudId 配置
# "nxCloudId": "68bbbbe10edeab7b22a78ead"
```

---

## 3. project.json 详解

每个项目（app 或 package）可以有自己的 `project.json` 文件来定义特定配置。

### 3.1 基本结构

```json
{
  "name": "api",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/api/src",
  "projectType": "application",
  "tags": ["scope:api", "type:app"]
}
```

| 字段 | 作用 | 示例值 |
|-----|------|--------|
| `name` | 项目名称（唯一标识） | `"api"`, `"web"`, `"domain-core"` |
| `$schema` | JSON Schema 路径（提供自动补全） | 指向 `nx/schemas/project-schema.json` |
| `sourceRoot` | 源代码根目录 | `"apps/api/src"` |
| `projectType` | 项目类型 | `"application"` 或 `"library"` |
| `tags` | 项目标签（用于过滤和限制依赖） | `["scope:api", "type:app"]` |

---

### 3.2 targets（任务目标）

**作用**：定义项目可以执行的任务（构建、测试、运行等）

#### 示例：API 项目的 serve 目标

```json
"targets": {
  "serve": {
    "executor": "nx:run-commands",
    "options": {
      "command": "tsx watch apps/api/src/index.ts"
    }
  }
}
```

| 字段 | 作用 | 说明 |
|-----|------|-----|
| `executor` | 执行器类型 | `nx:run-commands`（执行 shell 命令） |
| `options.command` | 要执行的命令 | `tsx watch apps/api/src/index.ts` |

**执行方式**：
```bash
pnpm nx serve api
# 等同于执行：tsx watch apps/api/src/index.ts
```

---

### 3.3 executors（执行器）

**执行器**是 Nx 任务的执行引擎，有多种类型：

#### 3.3.1 nx:run-commands（执行 shell 命令）

**适用场景**：运行任意 shell 命令

```json
"build": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc -p apps/api/tsconfig.app.json"
  }
}
```

**优势**：
- 灵活，可以执行任何命令
- 无需额外配置

**劣势**：
- 不提供额外优化
- 缓存需要手动配置

#### 3.3.2 @nx/vite:dev（Vite 开发服务器）

**适用场景**：启动 Vite 开发服务器

```json
"serve": {
  "executor": "@nx/vite:dev-server",
  "defaultConfiguration": "development",
  "options": {
    "buildTarget": "web:build"
  },
  "configurations": {
    "development": {
      "buildTarget": "web:build:development",
      "hmr": true
    }
  }
}
```

**特性**：
- 自动启用 HMR（热模块替换）
- 集成 Nx 依赖图
- 支持多配置（development、production）

#### 3.3.3 @nx/vite:build（Vite 构建）

**适用场景**：构建生产产物

```json
"build": {
  "executor": "@nx/vite:build",
  "outputs": ["{options.outputPath}"],
  "defaultConfiguration": "production",
  "options": {
    "outputPath": "dist/apps/web"
  }
}
```

**特性**：
- 自动使用 `vite.config.ts` 配置
- 支持输出路径配置
- 自动缓存构建产物

---

### 3.4 依赖关系

#### 3.4.1 implicitDependencies（隐式依赖）

**作用**：声明非代码依赖关系（配置文件依赖）

```json
{
  "implicitDependencies": ["domain-server"]
}
```

**示例场景**：
- `domain-client` 隐式依赖 `domain-server`（共享类型定义）
- 虽然没有 `import` 语句，但 `domain-server` 变化会影响 `domain-client`

**效果**：
```bash
# domain-server 变化后，domain-client 会被标记为"受影响"
pnpm nx affected:test
# 会同时测试 domain-server 和 domain-client
```

#### 3.4.2 dependsOn（任务依赖）

**作用**：定义任务执行顺序

```json
"build": {
  "dependsOn": ["^build"]
}
```

**示例**：
```bash
pnpm nx build web

执行顺序：
  1. 先构建 domain-client（web 的依赖）
  2. 再构建 domain-core（domain-client 的依赖）
  3. 最后构建 web
```

**`^` 符号含义**：
- `"^build"`：依赖项目的 build 任务
- `"build"`：当前项目的 build 任务（不常用）

---

## 4. 最佳实践

### 4.1 合理使用 namedInputs

**❌ 不推荐**：所有任务都用 `default` 输入
```json
"build": {
  "inputs": ["default"]
}
```
**问题**：测试文件变化也会触发生产构建

**✅ 推荐**：根据任务类型使用合适的输入
```json
"build": {
  "inputs": ["production", "^production"]
},
"test": {
  "inputs": ["default", "^production"]
}
```

### 4.2 启用缓存

**❌ 不推荐**：禁用所有缓存
```json
"build": {
  "cache": false
}
```
**问题**：每次都重新构建，浪费时间

**✅ 推荐**：只对长时间运行的任务禁用缓存
```json
"build": {
  "cache": true
},
"serve": {
  "cache": false"
}
```

### 4.3 使用 tags 限制依赖

**场景**：防止 UI 包依赖后端代码

```json
// packages/ui/project.json
{
  "tags": ["scope:client", "type:ui"]
}

// packages/domain-server/project.json
{
  "tags": ["scope:server", "type:lib"]
}

// .eslintrc.json（根目录）
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          {
            "sourceTag": "scope:client",
            "onlyDependOnLibsWithTags": ["scope:client", "scope:shared"]
          }
        ]
      }
    ]
  }
}
```

**效果**：
```typescript
// packages/ui/src/index.ts
import { User } from '@daily-use/domain-server'; // ❌ ESLint 报错
import { UserDTO } from '@daily-use/contracts'; // ✅ 允许
```

### 4.4 优化 targetDefaults

**场景**：所有项目的 build 都依赖 lint 通过

```json
"targetDefaults": {
  "build": {
    "dependsOn": ["^build", "lint"]
  }
}
```

**效果**：
```bash
pnpm nx build api
# 执行顺序：
# 1. lint api
# 2. build 依赖项目
# 3. build api
```

---

## 5. 常见问题

### 5.1 缓存未生效，每次都重新构建

**可能原因**：
1. `inputs` 配置错误，包含了非必要文件
2. `outputs` 未配置（Nx 不知道缓存什么）
3. 命令中包含时间戳等动态内容

**解决方法**：
```json
"build": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc -p tsconfig.app.json"
  },
  "inputs": ["production", "^production"],
  "outputs": ["{projectRoot}/dist"],  // 指定输出路径
  "cache": true
}
```

### 5.2 依赖项目未自动构建

**问题**：执行 `pnpm nx build web`，但 `domain-client` 没有先构建

**解决方法**：
```json
// nx.json
"targetDefaults": {
  "build": {
    "dependsOn": ["^build"]  // 确保有 ^ 符号
  }
}
```

### 5.3 全局配置不生效

**问题**：在 `nx.json` 中配置了 `build` 的 `dependsOn`，但某个项目不生效

**原因**：`project.json` 会完全覆盖 `nx.json` 的配置

**解决方法**：
```json
// apps/api/project.json
"targets": {
  "build": {
    "dependsOn": ["^build"],  // 必须重新声明
    "executor": "nx:run-commands",
    "options": {
      "command": "tsc"
    }
  }
}
```

**或者**：删除 `project.json` 中的 `build` 配置，让它使用全局默认配置

---

## 6. 进阶配置

### 6.1 多配置支持

```json
"build": {
  "executor": "@nx/vite:build",
  "defaultConfiguration": "production",
  "configurations": {
    "development": {
      "mode": "development",
      "sourcemap": true
    },
    "production": {
      "mode": "production",
      "sourcemap": false,
      "minify": true
    }
  }
}
```

**使用方法**：
```bash
pnpm nx build web                     # 使用 production 配置
pnpm nx build web --configuration=development  # 使用 development 配置
```

### 6.2 自定义 outputs（输出路径）

```json
"build": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc -p tsconfig.app.json",
    "cwd": "apps/api"
  },
  "outputs": [
    "{projectRoot}/dist",
    "{workspaceRoot}/dist/apps/api"
  ]
}
```

**作用**：
- Nx 会缓存这些目录的内容
- 恢复缓存时会还原这些目录

### 6.3 条件依赖

```json
"e2e": {
  "dependsOn": [
    {
      "target": "build",
      "projects": "self",
      "params": "forward"
    }
  ]
}
```

**含义**：
- `projects: "self"`：只依赖当前项目的 build
- `params: "forward"`：转发命令行参数

---

## 总结

### 配置文件职责

| 文件 | 职责 | 影响范围 |
|-----|------|---------|
| `nx.json` | 全局默认配置 | 所有项目 |
| `project.json` | 项目特定配置 | 单个项目 |
| `vite.config.ts` | Vite 构建配置 | 使用 Vite 的项目 |
| `tsconfig.json` | TypeScript 编译配置 | TypeScript 项目 |

### 配置优先级

```
project.json > nx.json > 插件默认配置
```

### 关键配置总结

1. **namedInputs**：定义缓存失效条件
2. **targetDefaults**：统一管理任务配置
3. **plugins**：自动推断项目配置
4. **dependsOn**：定义任务依赖关系
5. **cache**：启用智能缓存
6. **tags**：限制依赖关系

---

📚 **相关文档**：
- [NX_USAGE_GUIDE.md](./NX_USAGE_GUIDE.md) - 常用命令和工作流
- [Nx 官方文档](https://nx.dev/getting-started/intro)
