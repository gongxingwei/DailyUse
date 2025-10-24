# Project.json 配置说明

> 📖 详细解释各个项目的 project.json 配置
>
> 每个项目的配置文件位于：`{project-root}/project.json`

---

## 目录

- [1. API 项目配置](#1-api-项目配置)
- [2. Web 项目配置](#2-web-项目配置)
- [3. Desktop 项目配置](#3-desktop-项目配置)
- [4. Domain Core 包配置](#4-domain-core-包配置)
- [5. Domain Client 包配置](#5-domain-client-包配置)
- [6. Domain Server 包配置](#6-domain-server-包配置)
- [7. Contracts 包配置](#7-contracts-包配置)
- [8. Utils 包配置](#8-utils-包配置)
- [9. 配置最佳实践](#9-配置最佳实践)

---

## 1. API 项目配置

**文件路径**：`apps/api/project.json`

### 基本信息

```json
{
  "name": "api",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/api/src",
  "projectType": "application",
  "tags": ["scope:api", "type:app", "platform:node"]
}
```

| 字段          | 值                                           | 说明                     |
| ------------- | -------------------------------------------- | ------------------------ |
| `name`        | `"api"`                                      | 项目唯一标识符           |
| `sourceRoot`  | `"apps/api/src"`                             | 源代码根目录             |
| `projectType` | `"application"`                              | 项目类型（应用程序）     |
| `tags`        | `["scope:api", "type:app", "platform:node"]` | 项目标签（用于依赖限制） |

**标签说明**：

- `scope:api`：属于后端 API 范围
- `type:app`：应用程序类型（而非库）
- `platform:node`：运行在 Node.js 平台

### 目标配置

#### serve（启动开发服务器）

```json
{
  "serve": {
    "executor": "nx:run-commands",
    "options": {
      "command": "tsx watch apps/api/src/index.ts"
    }
  }
}
```

| 配置项     | 值                                  | 说明                             |
| ---------- | ----------------------------------- | -------------------------------- |
| `executor` | `"nx:run-commands"`                 | 使用 Nx 的通用命令执行器         |
| `command`  | `"tsx watch apps/api/src/index.ts"` | 使用 tsx 监听模式启动 API 服务器 |

**执行命令**：

```bash
pnpm nx serve api
# 等同于：tsx watch apps/api/src/index.ts
```

**特点**：

- ✅ 热重载：文件变化时自动重启
- ✅ 无需编译：tsx 直接执行 TypeScript
- ✅ 快速启动：跳过构建步骤

#### build（构建生产产物）

```json
{
  "build": {
    "executor": "nx:run-commands",
    "outputs": ["{workspaceRoot}/dist/apps/api"],
    "options": {
      "command": "tsc -p apps/api/tsconfig.app.json"
    }
  }
}
```

| 配置项    | 值                                    | 说明                         |
| --------- | ------------------------------------- | ---------------------------- |
| `outputs` | `["{workspaceRoot}/dist/apps/api"]`   | 构建产物输出路径（用于缓存） |
| `command` | `"tsc -p apps/api/tsconfig.app.json"` | 使用 TypeScript 编译器构建   |

**缓存机制**：

- Nx 会缓存 `dist/apps/api` 目录
- 如果源代码未变化，直接恢复缓存（跳过编译）

#### test（运行单元测试）

```json
{
  "test": {
    "executor": "nx:run-commands",
    "outputs": ["{workspaceRoot}/coverage/apps/api"],
    "options": {
      "command": "vitest run",
      "cwd": "apps/api"
    }
  }
}
```

| 配置项    | 值                                      | 说明                   |
| --------- | --------------------------------------- | ---------------------- |
| `outputs` | `["{workspaceRoot}/coverage/apps/api"]` | 测试覆盖率报告输出路径 |
| `cwd`     | `"apps/api"`                            | 命令执行的工作目录     |

**执行命令**：

```bash
pnpm nx test api
# 在 apps/api 目录下执行：vitest run
```

#### lint（代码检查）

```json
{
  "lint": {
    "executor": "@nx/eslint:lint",
    "outputs": ["{options.outputFile}"],
    "options": {
      "lintFilePatterns": ["apps/api/**/*.{ts,js}"]
    }
  }
}
```

| 配置项             | 值                          | 说明                     |
| ------------------ | --------------------------- | ------------------------ |
| `executor`         | `"@nx/eslint:lint"`         | 使用 Nx 的 ESLint 执行器 |
| `lintFilePatterns` | `["apps/api/**/*.{ts,js}"]` | 要检查的文件模式         |

**特点**：

- ✅ 集成 Nx 缓存
- ✅ 自动并行执行
- ✅ 支持 `--fix` 参数自动修复

---

## 2. Web 项目配置

**文件路径**：`apps/web/project.json`

### 基本信息

```json
{
  "name": "web",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/web/src",
  "tags": ["scope:client", "type:app", "platform:web"]
}
```

**标签说明**：

- `scope:client`：属于前端客户端范围
- `type:app`：应用程序类型
- `platform:web`：运行在浏览器平台

### 目标配置

#### build（Vite 构建）

```json
{
  "build": {
    "executor": "@nx/vite:build",
    "outputs": ["{options.outputPath}"],
    "defaultConfiguration": "production",
    "options": {
      "outputPath": "dist/apps/web"
    },
    "configurations": {
      "development": {
        "mode": "development",
        "sourcemap": true
      },
      "production": {
        "mode": "production",
        "sourcemap": false
      }
    }
  }
}
```

| 配置项                 | 值                 | 说明                       |
| ---------------------- | ------------------ | -------------------------- |
| `executor`             | `"@nx/vite:build"` | 使用 Nx 的 Vite 构建执行器 |
| `defaultConfiguration` | `"production"`     | 默认使用生产配置           |
| `outputPath`           | `"dist/apps/web"`  | 构建产物输出路径           |

**配置（configurations）**：

| 配置名称      | 用途     | 特点                     |
| ------------- | -------- | ------------------------ |
| `development` | 开发构建 | 启用 sourcemap，未压缩   |
| `production`  | 生产构建 | 禁用 sourcemap，压缩代码 |

**执行命令**：

```bash
# 使用默认配置（production）
pnpm nx build web

# 使用开发配置
pnpm nx build web --configuration=development

# 简写形式
pnpm nx build web -c development
```

#### serve（开发服务器）

```json
{
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
}
```

| 配置项        | 值                      | 说明                                     |
| ------------- | ----------------------- | ---------------------------------------- |
| `executor`    | `"@nx/vite:dev-server"` | 使用 Nx 的 Vite 开发服务器执行器         |
| `buildTarget` | `"web:build"`           | 关联的构建目标                           |
| `hmr`         | `true`                  | 启用热模块替换（Hot Module Replacement） |

**特点**：

- ✅ 热重载：代码变化立即反映到浏览器
- ✅ 快速启动：Vite 按需编译
- ✅ 开发体验：实时错误提示

#### test（Vitest 测试）

```json
{
  "test": {
    "executor": "@nx/vite:test",
    "outputs": ["{options.reportsDirectory}"],
    "options": {
      "passWithNoTests": true,
      "reportsDirectory": "../../coverage/apps/web"
    }
  }
}
```

| 配置项             | 值                          | 说明                     |
| ------------------ | --------------------------- | ------------------------ |
| `executor`         | `"@nx/vite:test"`           | 使用 Nx 的 Vitest 执行器 |
| `passWithNoTests`  | `true`                      | 如果没有测试文件也不报错 |
| `reportsDirectory` | `"../../coverage/apps/web"` | 测试覆盖率报告目录       |

**执行命令**：

```bash
# 运行所有测试
pnpm nx test web

# 监听模式
pnpm nx test web -- --watch

# 查看 UI 界面
pnpm nx test web -- --ui
```

---

## 3. Desktop 项目配置

**文件路径**：`apps/desktop/project.json`

### 基本信息

```json
{
  "name": "desktop",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/desktop/src",
  "tags": ["scope:desktop", "type:app", "platform:electron"]
}
```

**标签说明**：

- `scope:desktop`：属于桌面应用范围
- `type:app`：应用程序类型
- `platform:electron`：运行在 Electron 平台

### 目标配置

#### build（Electron + Vite 构建）

```json
{
  "build": {
    "executor": "nx:run-commands",
    "outputs": ["{workspaceRoot}/apps/desktop/dist"],
    "defaultConfiguration": "production",
    "options": {
      "command": "pnpm build",
      "cwd": "apps/desktop"
    },
    "configurations": {
      "development": {
        "mode": "development"
      },
      "production": {
        "mode": "production"
      }
    }
  }
}
```

**说明**：

- 使用 `pnpm build` 命令（定义在 `apps/desktop/package.json`）
- 支持 development 和 production 两种配置
- 输出到 `apps/desktop/dist` 目录

#### serve（启动 Electron 开发模式）

```json
{
  "serve": {
    "executor": "@nx/vite:dev-server",
    "defaultConfiguration": "development",
    "options": {
      "buildTarget": "desktop:build"
    },
    "configurations": {
      "development": {
        "buildTarget": "desktop:build:development",
        "hmr": true
      }
    }
  }
}
```

**特点**：

- ✅ 热重载：渲染进程代码变化时自动刷新
- ✅ Electron DevTools：内置开发者工具
- ✅ 实时调试：主进程和渲染进程都支持调试

#### package（打包应用，不分发）

```json
{
  "package": {
    "executor": "nx:run-commands",
    "options": {
      "command": "electron-builder --dir",
      "cwd": "apps/desktop"
    }
  }
}
```

**说明**：

- 使用 `electron-builder --dir` 打包应用
- 不创建安装包，只生成可执行文件（用于测试）
- 输出到 `apps/desktop/dist` 目录

**执行命令**：

```bash
pnpm nx package desktop
# 生成未打包的应用程序（快速测试）
```

#### dist（打包并创建安装包）

```json
{
  "dist": {
    "executor": "nx:run-commands",
    "options": {
      "command": "electron-builder",
      "cwd": "apps/desktop"
    }
  }
}
```

**说明**：

- 使用 `electron-builder` 创建安装包
- 根据 `electron-builder` 配置生成 .exe、.dmg、.AppImage 等
- 用于生产发布

**执行命令**：

```bash
pnpm nx dist desktop
# 生成完整的安装包（用于分发）
```

---

## 4. Domain Core 包配置

**文件路径**：`packages/domain-core/project.json`

### 基本信息

```json
{
  "name": "domain-core",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/domain-core/src",
  "tags": ["scope:shared", "type:lib", "layer:domain"]
}
```

**标签说明**：

- `scope:shared`：共享库（可被任何项目使用）
- `type:lib`：库类型（而非应用）
- `layer:domain`：领域层（DDD 架构中的核心业务逻辑）

### 目标配置

#### build（TypeScript 编译）

```json
{
  "build": {
    "executor": "nx:run-commands",
    "outputs": ["{workspaceRoot}/packages/domain-core/dist"],
    "options": {
      "command": "pnpm build",
      "cwd": "packages/domain-core"
    }
  }
}
```

**说明**：

- 执行 `pnpm build`（定义在 `packages/domain-core/package.json`）
- 输出编译后的 JavaScript 和类型定义文件（.d.ts）
- 其他项目通过 `import { ... } from '@daily-use/domain-core'` 使用

#### dev（监听模式构建）

```json
{
  "dev": {
    "executor": "nx:run-commands",
    "options": {
      "command": "pnpm dev",
      "cwd": "packages/domain-core"
    }
  }
}
```

**说明**：

- 监听源代码变化，自动重新编译
- 用于开发时实时更新依赖项目

**执行命令**：

```bash
pnpm nx dev domain-core
# 启动监听模式，文件变化时自动重新编译
```

**典型工作流**：

```bash
# 终端 1：启动 domain-core 监听模式
pnpm nx dev domain-core

# 终端 2：启动 web 应用
pnpm nx serve web

# 修改 domain-core 代码 → 自动编译 → web 自动热重载
```

---

## 5. Domain Client 包配置

**文件路径**：`packages/domain-client/project.json`

### 基本信息

```json
{
  "name": "domain-client",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/domain-client/src",
  "tags": ["scope:client", "type:lib", "layer:application"]
}
```

**标签说明**：

- `scope:client`：客户端专用库（只能被前端项目使用）
- `type:lib`：库类型
- `layer:application`：应用层（DDD 架构中的业务编排层）

### 依赖关系

```json
{
  "implicitDependencies": ["domain-core"]
}
```

**说明**：

- `domain-client` 依赖 `domain-core`
- 构建 `domain-client` 前会自动先构建 `domain-core`
- 如果 `domain-core` 变化，`domain-client` 会被标记为受影响

**依赖图**：

```
domain-core
    ↓
domain-client
    ↓
web, desktop
```

### 目标配置

与 `domain-core` 相同（build、dev、lint），详见上一节。

---

## 6. Domain Server 包配置

**文件路径**：`packages/domain-server/project.json`

### 基本信息

```json
{
  "name": "domain-server",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/domain-server/src",
  "tags": ["scope:server", "type:lib", "layer:application"]
}
```

**标签说明**：

- `scope:server`：服务端专用库（只能被后端项目使用）
- `type:lib`：库类型
- `layer:application`：应用层

### 依赖关系

```json
{
  "implicitDependencies": ["domain-core"]
}
```

**依赖图**：

```
domain-core
    ↓
domain-server
    ↓
api
```

### 模块边界限制

**配置**（在 `.eslintrc.json` 中）：

```json
{
  "depConstraints": [
    {
      "sourceTag": "scope:client",
      "onlyDependOnLibsWithTags": ["scope:client", "scope:shared"]
    },
    {
      "sourceTag": "scope:server",
      "onlyDependOnLibsWithTags": ["scope:server", "scope:shared"]
    }
  ]
}
```

**效果**：

```typescript
// ❌ 不允许：客户端依赖服务端代码
// packages/domain-client/src/index.ts
import { Repository } from '@daily-use/domain-server'; // ESLint 报错

// ✅ 允许：客户端依赖共享代码
import { User } from '@daily-use/domain-core'; // 正常

// ✅ 允许：服务端依赖共享代码
// packages/domain-server/src/index.ts
import { User } from '@daily-use/domain-core'; // 正常
```

---

## 7. Contracts 包配置

**文件路径**：`packages/contracts/project.json`

### 基本信息

```json
{
  "name": "contracts",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/contracts/src",
  "tags": ["scope:shared", "type:lib", "layer:interface"]
}
```

**标签说明**：

- `scope:shared`：共享库（前后端都可使用）
- `type:lib`：库类型
- `layer:interface`：接口层（定义 API 契约、DTO 等）

### 用途

- 定义前后端共享的 TypeScript 类型
- 定义 API 请求/响应格式（DTO）
- 定义验证规则（Zod schemas）

**示例**：

```typescript
// packages/contracts/src/user.ts
export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// apps/api/src/controllers/UserController.ts
import { UserDTO, userSchema } from '@daily-use/contracts';

// apps/web/src/api/userApi.ts
import { UserDTO } from '@daily-use/contracts';
```

### 目标配置

#### build（生成 TypeScript 声明文件）

```json
{
  "build": {
    "executor": "nx:run-commands",
    "outputs": ["{workspaceRoot}/packages/contracts/dist"],
    "options": {
      "command": "pnpm build",
      "cwd": "packages/contracts"
    }
  }
}
```

**说明**：

- 编译 TypeScript 并生成类型定义文件
- 前后端都通过编译后的产物使用类型

#### dev（监听模式）

```json
{
  "dev": {
    "executor": "nx:run-commands",
    "options": {
      "command": "pnpm dev",
      "cwd": "packages/contracts"
    }
  }
}
```

**典型工作流**：

```bash
# 终端 1：启动 contracts 监听模式
pnpm nx dev contracts

# 终端 2：启动 API
pnpm nx serve api

# 终端 3：启动 Web
pnpm nx serve web

# 修改 contracts 代码 → 自动编译 → api 和 web 自动热重载
```

---

## 8. Utils 包配置

**文件路径**：`packages/utils/project.json`

### 基本信息

```json
{
  "name": "utils",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/utils/src",
  "tags": ["scope:shared", "type:util"]
}
```

**标签说明**：

- `scope:shared`：共享工具库
- `type:util`：工具类型（纯函数、辅助工具）

### 用途

- 通用工具函数（日期处理、字符串操作等）
- 常量定义
- 类型工具（TypeScript utility types）

**示例**：

```typescript
// packages/utils/src/date.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}

// packages/utils/src/string.ts
export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

// apps/web/src/components/UserCard.tsx
import { formatDate, truncate } from '@daily-use/utils';
```

### 目标配置

与 `contracts` 相同（build、dev、lint），详见上一节。

---

## 9. 配置最佳实践

### 9.1 合理使用 outputs

**❌ 不推荐**：不配置 outputs

```json
{
  "build": {
    "executor": "nx:run-commands",
    "options": {
      "command": "tsc"
    }
  }
}
```

**问题**：Nx 不知道缓存什么，缓存无法生效

**✅ 推荐**：明确指定 outputs

```json
{
  "build": {
    "executor": "nx:run-commands",
    "outputs": ["{workspaceRoot}/packages/domain-core/dist"],
    "options": {
      "command": "tsc"
    }
  }
}
```

---

### 9.2 合理使用 tags

**用途**：限制项目依赖关系，防止架构腐化

**示例配置**：

```json
// packages/domain-client/project.json
{
  "tags": ["scope:client", "type:lib"]
}

// packages/domain-server/project.json
{
  "tags": ["scope:server", "type:lib"]
}

// .eslintrc.json
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

---

### 9.3 合理使用 configurations

**适用场景**：需要多种构建配置（开发、生产、测试等）

**示例**：

```json
{
  "build": {
    "executor": "@nx/vite:build",
    "defaultConfiguration": "production",
    "configurations": {
      "development": {
        "mode": "development",
        "sourcemap": true,
        "minify": false
      },
      "production": {
        "mode": "production",
        "sourcemap": false,
        "minify": true
      },
      "staging": {
        "mode": "production",
        "sourcemap": true,
        "minify": true
      }
    }
  }
}
```

**使用方法**：

```bash
pnpm nx build web                      # 使用 production 配置
pnpm nx build web -c development       # 使用 development 配置
pnpm nx build web -c staging           # 使用 staging 配置
```

---

### 9.4 合理使用 implicitDependencies

**适用场景**：代码中没有 `import` 语句，但存在隐式依赖关系

**示例**：

```json
// packages/domain-client/project.json
{
  "implicitDependencies": ["domain-core"]
}
```

**效果**：

1. 构建 `domain-client` 前会自动先构建 `domain-core`
2. `domain-core` 变化后，`domain-client` 会被标记为受影响
3. 受影响分析会包含整个依赖链

**何时使用**：

- ✅ 共享类型定义（通过类型导入）
- ✅ 运行时依赖（例如配置文件）
- ❌ 不要滥用（会降低并行度）

---

### 9.5 优化 cwd 配置

**问题**：在子目录中执行命令，可能找不到 package.json

**❌ 不推荐**：不指定 cwd

```json
{
  "build": {
    "executor": "nx:run-commands",
    "options": {
      "command": "pnpm build" // 在哪里执行？
    }
  }
}
```

**✅ 推荐**：明确指定 cwd

```json
{
  "build": {
    "executor": "nx:run-commands",
    "options": {
      "command": "pnpm build",
      "cwd": "packages/domain-core" // 在此目录执行
    }
  }
}
```

---

### 9.6 使用 passWithNoTests（测试配置）

**问题**：新项目或库可能还没有测试文件

**❌ 不推荐**：不配置 passWithNoTests

```json
{
  "test": {
    "executor": "@nx/vite:test"
  }
}
```

**结果**：如果没有测试文件，测试会失败

**✅ 推荐**：允许无测试文件的情况

```json
{
  "test": {
    "executor": "@nx/vite:test",
    "options": {
      "passWithNoTests": true
    }
  }
}
```

---

### 9.7 统一 lint 配置

**所有项目的 lint 目标配置**：

```json
{
  "lint": {
    "executor": "@nx/eslint:lint",
    "outputs": ["{options.outputFile}"],
    "options": {
      "lintFilePatterns": ["<项目路径>/**/*.{ts,tsx,js,jsx}"]
    }
  }
}
```

**说明**：

- `executor`：使用 Nx 的 ESLint 执行器（集成缓存）
- `outputs`：缓存 lint 结果
- `lintFilePatterns`：指定要检查的文件模式

**执行命令**：

```bash
# 检查单个项目
pnpm nx lint api

# 自动修复
pnpm nx lint api --fix

# 检查所有项目
pnpm nx run-many --target=lint --all
```

---

## 总结

### 项目类型总结

| 项目            | 类型        | 标签                    | 用途              |
| --------------- | ----------- | ----------------------- | ----------------- |
| `api`           | application | scope:api, type:app     | 后端 API 服务器   |
| `web`           | application | scope:client, type:app  | Web 前端应用      |
| `desktop`       | application | scope:desktop, type:app | Electron 桌面应用 |
| `domain-core`   | library     | scope:shared, type:lib  | 核心领域模型      |
| `domain-client` | library     | scope:client, type:lib  | 客户端业务逻辑    |
| `domain-server` | library     | scope:server, type:lib  | 服务端业务逻辑    |
| `contracts`     | library     | scope:shared, type:lib  | 前后端共享契约    |
| `utils`         | library     | scope:shared, type:util | 通用工具函数      |

### 依赖关系总结

```
                domain-core
                /     |     \
               /      |      \
              /       |       \
    domain-client  contracts  domain-server
         /  \         |            |
        /    \        |            |
      web  desktop   api          api
```

### 常用执行器总结

| 执行器                | 用途                | 项目类型     |
| --------------------- | ------------------- | ------------ |
| `nx:run-commands`     | 执行任意 shell 命令 | 所有项目     |
| `@nx/vite:build`      | Vite 构建           | web, desktop |
| `@nx/vite:dev-server` | Vite 开发服务器     | web, desktop |
| `@nx/vite:test`       | Vitest 测试         | 所有项目     |
| `@nx/eslint:lint`     | ESLint 检查         | 所有项目     |

---

📚 **相关文档**：

- [NX_CONFIGURATION_GUIDE.md](./NX_CONFIGURATION_GUIDE.md) - Nx 配置详解
- [NX_USAGE_GUIDE.md](./NX_USAGE_GUIDE.md) - Nx 使用指南
