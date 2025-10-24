# Nx Scripts and Targets 完全指南

## 目录

1. [核心概念](#核心概念)
2. [Targets（任务目标）详解](#targets任务目标详解)
3. [Executors（执行器）详解](#executors执行器详解)
4. [Plugins（插件）和 Inferred Targets（推断目标）](#plugins插件和-inferred-targets推断目标)
5. [Project.json vs Package.json Scripts](#projectjson-vs-packagejson-scripts)
6. [实战案例分析](#实战案例分析)
7. [常见问题和最佳实践](#常见问题和最佳实践)

---

## 核心概念

### 什么是 Nx Target（目标）？

**Target** 是 Nx 中可以执行的任务单元。每个 project 可以有多个 targets，例如：

- `build` - 构建项目
- `dev` / `serve` - 启动开发服务器
- `test` - 运行测试
- `lint` - 代码检查
- `typecheck` - TypeScript 类型检查

### Target 的两种来源

#### 1. **Explicit Targets（显式目标）** - 在 `project.json` 中定义

```json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "apps/web"
      }
    }
  }
}
```

#### 2. **Inferred Targets（推断目标）** - 由 Nx Plugin 自动生成

在 `nx.json` 中注册的插件会扫描项目配置文件（如 `vite.config.ts`），自动生成相关 targets：

```json
{
  "plugins": [
    {
      "plugin": "@nx/vite/plugin",
      "options": {
        "devTargetName": "vite:dev",
        "buildTargetName": "vite:build"
      }
    }
  ]
}
```

---

## Targets（任务目标）详解

### Target 的完整结构

```json
{
  "targets": {
    "targetName": {
      "executor": "执行器名称",
      "options": { /* 执行选项 */ },
      "configurations": { /* 不同环境的配置 */ },
      "dependsOn": [ /* 依赖的其他 targets */ ],
      "inputs": [ /* 缓存输入 */ ],
      "outputs": [ /* 缓存输出 */ ],
      "cache": true/false
    }
  }
}
```

### Target 的关键属性

| 属性             | 说明                               | 示例                                             |
| ---------------- | ---------------------------------- | ------------------------------------------------ |
| `executor`       | 指定使用哪个执行器来运行任务       | `"@nx/vite:dev-server"`, `"nx:run-commands"`     |
| `options`        | 传递给执行器的配置选项             | `{ "command": "pnpm build", "cwd": "apps/web" }` |
| `configurations` | 针对不同环境（dev/prod）的配置覆盖 | `{ "production": { "mode": "production" } }`     |
| `dependsOn`      | 定义此 target 依赖的其他 targets   | `["^build"]` 表示依赖所有依赖项的 build          |
| `cache`          | 是否缓存此 target 的输出           | `true` / `false`                                 |
| `inputs`         | 影响缓存的输入文件模式             | `["default", "^production"]`                     |
| `outputs`        | target 的输出路径，用于缓存        | `["{workspaceRoot}/dist/apps/web"]`              |

### 运行 Target 的方式

```bash
# 方式 1: 使用 nx 命令（推荐）
pnpm nx <target> <project>
pnpm nx build web
pnpm nx dev api

# 方式 2: 使用完整语法
pnpm nx run <project>:<target>
pnpm nx run web:build
pnpm nx run api:dev

# 方式 3: 使用配置
pnpm nx run web:build:production

# 方式 4: 通过 package.json scripts（如果定义了）
pnpm dev:web  # 实际执行 pnpm nx dev web
```

---

## Executors（执行器）详解

### 什么是 Executor？

**Executor** 是实际执行任务的代码。它定义了 target 如何运行。

### 常用的 Executors

#### 1. **`nx:run-commands`** - 运行 Shell 命令

最灵活的执行器，可以运行任何命令：

```json
{
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc --noEmit",
    "cwd": "apps/api"
  }
}
```

**使用场景：**

- 运行自定义脚本
- 调用 package.json 中的 scripts
- 运行构建工具（tsup, tsc, webpack 等）

#### 2. **`@nx/vite:dev-server`** - Vite 开发服务器

专门用于启动 Vite 开发服务器：

```json
{
  "executor": "@nx/vite:dev-server",
  "options": {
    "buildTarget": "web:build"
  }
}
```

**特点：**

- 需要指定 `buildTarget`（构建配置）
- 提供 HMR（热模块替换）
- 支持配置覆盖

**⚠️ 注意：** 此 executor 期望 `buildTarget` 使用 Vite 构建工具。如果 `buildTarget` 是自定义命令（如 `vue-tsc && vite build`），可能会出现问题。

#### 3. **`@nx/vite:preview-server`** - Vite 预览服务器

预览生产构建：

```json
{
  "executor": "@nx/vite:preview-server",
  "options": {
    "buildTarget": "web:build"
  }
}
```

#### 4. **`@nx/vite:test`** - Vitest 测试

运行 Vitest 测试：

```json
{
  "executor": "@nx/vite:test",
  "options": {
    "passWithNoTests": true,
    "reportsDirectory": "../../coverage/apps/web"
  }
}
```

#### 5. **`@nx/eslint:lint`** - ESLint 检查

运行 ESLint：

```json
{
  "executor": "@nx/eslint:lint",
  "options": {
    "lintFilePatterns": ["apps/web/**/*.{ts,tsx,js,jsx,vue}"]
  }
}
```

#### 6. **`nx:run-script`** - 运行 package.json script

自动将 package.json 中的 scripts 暴露为 Nx targets：

```json
{
  "executor": "nx:run-script",
  "options": {
    "script": "test:watch"
  }
}
```

---

## Plugins（插件）和 Inferred Targets（推断目标）

### Nx Plugin 的作用

Nx Plugin 会：

1. **扫描项目配置文件**（如 `vite.config.ts`, `webpack.config.js`）
2. **自动推断（infer）** 可用的 targets
3. **生成标准化的 target 名称**

### `@nx/vite/plugin` 示例

在 `nx.json` 中：

```json
{
  "plugins": [
    {
      "plugin": "@nx/vite/plugin",
      "options": {
        "buildTargetName": "vite:build",
        "testTargetName": "test",
        "serveTargetName": "serve",
        "devTargetName": "vite:dev",
        "previewTargetName": "vite:preview",
        "typecheckTargetName": "typecheck"
      }
    }
  ]
}
```

### 插件如何推断 Targets

当插件检测到项目中有 `vite.config.ts` 文件时，会自动生成以下 targets：

| Inferred Target | 实际命令                          | 说明                   |
| --------------- | --------------------------------- | ---------------------- |
| `vite:build`    | `vite build`                      | 生产构建               |
| `vite:dev`      | `vite`                            | 开发服务器             |
| `vite:preview`  | `vite preview`                    | 预览生产构建           |
| `serve`         | `vite`                            | 开发服务器（将被废弃） |
| `typecheck`     | （如果检测到 `vue-tsc` 或 `tsc`） | 类型检查               |

### Inferred vs Explicit Targets 的优先级

- **Explicit Targets（显式定义）优先级更高**
- 如果 `project.json` 中定义了 `dev` target，它会覆盖插件推断的同名 target
- 推断的 target 可以作为**后备选项**

---

## Project.json vs Package.json Scripts

### 两者的关系

| 对比维度     | `project.json` targets        | `package.json` scripts                       |
| ------------ | ----------------------------- | -------------------------------------------- |
| **作用范围** | Nx 工作区级别                 | npm/pnpm 包级别                              |
| **缓存支持** | ✅ 支持（通过 `cache: true`） | ❌ 不支持                                    |
| **依赖管理** | ✅ 支持（`dependsOn`）        | ❌ 手动管理                                  |
| **配置环境** | ✅ 支持（`configurations`）   | ❌ 需要多个 script                           |
| **执行方式** | `pnpm nx <target> <project>`  | `pnpm <script>` 或 `pnpm -C <path> <script>` |
| **可见性**   | Nx Console 中可见             | 需要手动查看 package.json                    |

### 何时使用 project.json targets？

**优先使用 project.json targets**，因为：

1. ✅ 支持 Nx 缓存，加快构建速度
2. ✅ 支持依赖管理（`dependsOn`），自动构建依赖项
3. ✅ 统一的执行方式（`pnpm nx <target> <project>`）
4. ✅ Nx Console 中可视化展示
5. ✅ 支持 `nx affected`（只运行受影响的项目）

### 何时使用 package.json scripts？

**仅在以下情况使用 package.json scripts：**

1. 需要在 **Nx 工作区外** 独立运行的命令
2. 包的 **发布后需要执行** 的脚本（如 `postinstall`）
3. 简单的 **别名命令**（如 `pnpm dev:web` → `pnpm nx dev web`）

### 混合使用的最佳实践

#### 方式 1: project.json 调用 package.json script

```json
// project.json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build", // 调用 package.json 中的 build script
        "cwd": "apps/web"
      }
    }
  }
}
```

```json
// package.json
{
  "scripts": {
    "build": "vue-tsc && vite build"
  }
}
```

**优点：**

- 保留 package.json 的构建逻辑
- 利用 Nx 的缓存和依赖管理

#### 方式 2: 完全使用 project.json（推荐）

```json
// project.json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["vue-tsc --noEmit", "vite build"],
        "cwd": "apps/web",
        "parallel": false
      }
    }
  }
}
```

**优点：**

- 更清晰的任务定义
- 更细粒度的缓存控制

---

## 实战案例分析

### 案例 1: Web 项目的 `dev` vs `vite:dev`

#### 问题描述

在 Nx Console 中看到两个开发服务器 target：

- `dev` - 无法正常运行
- `vite:dev` - 可以正常运行

#### 原因分析

**1. `dev` target（显式定义）**

```json
// apps/web/project.json
{
  "targets": {
    "dev": {
      "executor": "@nx/vite:dev-server",
      "options": {
        "buildTarget": "web:build"
      }
    }
  }
}
```

**问题：**

- `@nx/vite:dev-server` executor 期望 `buildTarget` 使用 Vite 构建
- 但 `web:build` 实际运行的是：
  ```json
  {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build", // 调用 package.json
        "cwd": "apps/web"
      }
    }
  }
  ```
- `package.json` 中的 `build` script 是：
  ```json
  {
    "scripts": {
      "build": "vue-tsc && vite build"
    }
  }
  ```
- `@nx/vite:dev-server` 无法正确解析这个组合命令

**2. `vite:dev` target（插件推断）**

```json
// nx.json
{
  "plugins": [
    {
      "plugin": "@nx/vite/plugin",
      "options": {
        "devTargetName": "vite:dev"
      }
    }
  ]
}
```

**为什么可以工作：**

- `@nx/vite/plugin` 检测到 `apps/web/vite.config.ts`
- 自动生成 `vite:dev` target，直接运行 `vite` 命令
- 等价于：
  ```json
  {
    "executor": "nx:run-commands",
    "options": {
      "command": "vite",
      "cwd": "apps/web"
    }
  }
  ```

#### 解决方案

**方案 1: 删除显式的 `dev` target，使用插件推断的 `vite:dev`**

```json
// apps/web/project.json
{
  "targets": {
    // 删除 dev target
    "build": {
      /* ... */
    }
  }
}
```

然后运行：

```bash
pnpm nx vite:dev web
```

**方案 2: 修改 `dev` target 直接运行 vite 命令**

```json
// apps/web/project.json
{
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vite",
        "cwd": "apps/web"
      }
    }
  }
}
```

然后运行：

```bash
pnpm nx dev web
```

**推荐方案：** 方案 1，因为插件推断的 target 更符合 Nx 的约定，且与其他 Vite 项目保持一致。

---

### 案例 2: Typecheck 配置错误

#### 问题描述

运行 `pnpm nx typecheck web` 报错：

```
'.' is not recognized as an internal or external command
```

#### 原因分析

```json
// apps/web/project.json（错误配置）
{
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm -w -C . tsc --noEmit",
        "cwd": "./"
      }
    }
  }
}
```

**问题：**

1. `-C .` 在 Windows PowerShell 中被解释为命令 `.`
2. `cwd: "./"` 指向工作区根目录，不是项目目录
3. 使用 `pnpm -w` 是多余的（已经在 Nx 上下文中）

#### 解决方案

```json
// apps/web/project.json（正确配置）
{
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vue-tsc --noEmit", // web 项目使用 vue-tsc
        "cwd": "apps/web"
      }
    }
  }
}
```

**其他项目的 typecheck 配置：**

```json
// packages/contracts/project.json
{
  "typecheck": {
    "executor": "nx:run-commands",
    "options": {
      "command": "tsc --noEmit", // 纯 TypeScript 项目使用 tsc
      "cwd": "packages/contracts"
    }
  }
}
```

```json
// apps/api/project.json
{
  "typecheck": {
    "executor": "nx:run-commands",
    "options": {
      "command": "tsc --noEmit", // NestJS 项目使用 tsc
      "cwd": "apps/api"
    }
  }
}
```

---

### 案例 3: 添加批量 Typecheck

#### 需求

为所有项目添加 typecheck target，并支持一次性检查所有项目。

#### 实现步骤

**1. 为每个项目添加 typecheck target**

```json
// 每个 project.json
{
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit", // 或 vue-tsc --noEmit
        "cwd": "packages/xxx" // 或 apps/xxx
      }
    }
  }
}
```

**2. 在根 package.json 添加批量命令**

```json
{
  "scripts": {
    "typecheck": "pnpm nx run-many --target=typecheck --all",
    "typecheck:affected": "pnpm nx affected --target=typecheck"
  }
}
```

**3. 运行**

```bash
# 检查所有项目
pnpm typecheck

# 只检查受影响的项目
pnpm typecheck:affected

# 检查特定项目
pnpm nx typecheck web
pnpm nx typecheck contracts
```

---

## 常见问题和最佳实践

### Q1: 何时使用 `nx:run-commands` vs 专用 executor？

**使用 `nx:run-commands`：**

- ✅ 运行简单命令（如 `tsc`, `tsup`, `pnpm build`）
- ✅ 调用 package.json scripts
- ✅ 不需要复杂配置

**使用专用 executor（如 `@nx/vite:dev-server`）：**

- ✅ 需要 Nx 提供的高级功能（如配置合并、端口管理）
- ✅ 需要与其他 Nx 功能深度集成
- ⚠️ 但要确保配置正确（如 `buildTarget` 指向正确的 Vite 构建）

### Q2: 如何调试 Target 配置？

```bash
# 查看项目所有 targets
pnpm nx show project web

# 查看 target 的完整配置（包括推断的）
pnpm nx show project web --web

# 查看 target 的详细执行信息
pnpm nx run web:dev --verbose

# 干跑（不实际执行）
pnpm nx run web:build --dry-run
```

### Q3: 如何处理 Inferred Targets 和 Explicit Targets 的冲突？

**原则：Explicit Targets 优先级更高**

如果你定义了显式 target，它会覆盖插件推断的同名 target。

**最佳实践：**

1. **使用插件推断的 target 名称**（如 `vite:dev`, `vite:build`）
2. **避免定义与推断 target 同名的显式 target**
3. 如果必须覆盖，确保配置与插件预期一致

### Q4: 如何为 Monorepo 中的所有项目批量添加 Target？

**方法 1: 使用 `targetDefaults`（推荐）**

```json
// nx.json
{
  "targetDefaults": {
    "typecheck": {
      "cache": true,
      "inputs": ["default", "^production"]
    }
  }
}
```

然后在每个 `project.json` 中只需定义 executor 和 options：

```json
{
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit",
        "cwd": "packages/contracts"
      }
    }
  }
}
```

**方法 2: 使用 Nx Generators（高级）**
创建自定义 generator 批量修改 `project.json`。

### Q5: package.json 中的 scripts 会自动成为 Nx Targets 吗？

**是的，但有条件：**

Nx 会自动将 package.json 中的 scripts 转换为 targets（使用 `nx:run-script` executor），**但仅当：**

1. 该 project 是 npm package（有 package.json）
2. Script 名称不与现有 target 冲突

**查看自动转换的 targets：**

```bash
pnpm nx show project web
```

你会看到类似：

```json
{
  "test:watch": {
    "executor": "nx:run-script",
    "options": {
      "script": "test:watch"
    }
  }
}
```

### Q6: 如何禁用某个 Inferred Target？

**方法 1: 在 project.json 中定义空 target**

```json
{
  "targets": {
    "vite:dev": {} // 禁用插件推断的 vite:dev
  }
}
```

**方法 2: 在 nx.json 中排除项目**

```json
{
  "plugins": [
    {
      "plugin": "@nx/vite/plugin",
      "exclude": ["apps/web"] // 排除 web 项目
    }
  ]
}
```

### Q7: 如何优化 Nx 缓存？

**1. 正确配置 `inputs` 和 `outputs`**

```json
{
  "targets": {
    "build": {
      "cache": true,
      "inputs": ["production", "^production"],
      "outputs": ["{workspaceRoot}/dist/apps/web"]
    }
  }
}
```

**2. 使用 `dependsOn` 自动构建依赖**

```json
{
  "targets": {
    "build": {
      "dependsOn": ["^build"] // 先构建所有依赖项
    }
  }
}
```

**3. 避免在 `dev` target 上启用缓存**

```json
{
  "targetDefaults": {
    "dev": {
      "cache": false // 开发服务器不应缓存
    }
  }
}
```

---

## 总结

### 核心要点

1. **Target = 可执行的任务**，来源于 `project.json`（显式）或 Plugins（推断）
2. **Executor = 任务的执行方式**，`nx:run-commands` 最灵活
3. **Plugins 自动推断 Targets**，基于项目配置文件（如 `vite.config.ts`）
4. **project.json > package.json scripts**，优先使用 project.json
5. **显式 Targets 优先级 > 推断 Targets**

### 推荐的项目结构

```
apps/web/
├── project.json          # Nx targets 配置
├── package.json          # npm scripts（仅用于简单别名）
├── vite.config.ts        # Vite 配置（插件会推断 targets）
└── src/

packages/contracts/
├── project.json          # Nx targets 配置
├── package.json          # npm scripts
├── tsconfig.json         # TypeScript 配置
└── src/
```

### 下一步

- 为所有项目配置 `typecheck` target
- 统一 `dev` target 的命名和实现
- 优化 Nx 缓存配置
- 学习使用 `nx affected` 提高 CI/CD 效率
