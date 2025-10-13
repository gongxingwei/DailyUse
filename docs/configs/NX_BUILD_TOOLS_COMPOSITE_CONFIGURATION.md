# Nx 项目中不同打包工具与 Composite 配置指南

**更新日期**: 2025-10-13  
**核心问题**: 如何在使用多种打包工具（tsup、Vite、tsc）的 Nx Monorepo 中正确配置 TypeScript Composite

---

## 🎯 问题详情

### 你遇到的错误

```
Referenced project 'd:/myPrograms/DailyUse/packages/contracts' must have setting "composite": true.
```

**错误原因**：
- `apps/desktop/tsconfig.json` 启用了 `composite: true`
- `packages/contracts/tsconfig.json` 设置了 `composite: false`
- TypeScript 要求：如果 A 引用 B（通过 references），且 A 是 composite 项目，那么 B 也必须是 composite 项目

### 核心冲突

你的项目中存在三种打包工具：

| 包 | 打包工具 | Composite 设置 | 冲突情况 |
|---|---------|---------------|---------|
| `contracts` | tsup (esbuild) | ❌ `false` | 注释说与 tsup --dts 不兼容 |
| `domain-core` | tsup (esbuild) | ❌ `false` | 注释说与 tsup --dts 不兼容 |
| `domain-server` | tsup (esbuild) | ❌ `false` | 注释说与 tsup --dts 不兼容 |
| `utils` | tsup (esbuild) | ❌ `false` | 注释说与 tsup --dts 不兼容 |
| `ui` | Vite + vue-tsc | ✅ `true` | 无冲突 |
| `assets` | 无（纯资源） | ✅ `true` | 无冲突 |
| `desktop` | Vite (Electron) | ✅ `true` | **引用 contracts 导致错误** |
| `web` | Vite | ✅ `true` | **引用 contracts 导致错误** |
| `api` | tsup/tsc | ✅ `true` | **引用 contracts 导致错误** |

---

## 💡 解决方案：双轨制配置策略

### 核心理念

**关键认知**：
1. **tsc 的 composite 用于类型检查和引用关系**，不是用于打包
2. **打包工具（tsup、Vite）负责生成 .js 文件**
3. **类型声明文件（.d.ts）可以由 tsc 或打包工具生成**
4. **`composite: true` 不会与 tsup/Vite 冲突！**

**误解澄清**：
- ❌ "composite 与 tsup --dts 不兼容" ← **这是错误的**
- ✅ composite 与 `incremental: true` 在某些打包配置下可能有问题
- ✅ 但 composite **不影响** tsup/Vite 的打包过程

### 推荐方案：分离类型检查和打包

```
┌─────────────────────────────────────────────────────┐
│              TypeScript 职责分工                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  tsc (composite + references)                      │
│  ├─ 类型检查（typecheck target）                    │
│  ├─ 生成 .d.ts 声明文件                             │
│  ├─ 生成 .tsbuildinfo（增量编译）                   │
│  └─ 跨包类型热更新                                  │
│                                                     │
│  打包工具（tsup/Vite）                              │
│  ├─ 生成优化的 .js 文件（build target）             │
│  ├─ Tree-shaking                                   │
│  ├─ Code splitting                                 │
│  └─ Bundling                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ 实战配置

### 配置策略

**所有包都启用 `composite: true`**，理由：
1. ✅ 支持跨包类型热更新
2. ✅ 增量编译，提升性能
3. ✅ 清晰的依赖关系图
4. ✅ 与打包工具完全兼容

### 1. 基础库配置（使用 tsup）

#### packages/contracts/tsconfig.json

```jsonc
{
  "extends": "../../tsconfig.base.json",

  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,

    // ============================================================
    // ✅ 启用 Composite（关键修改）
    // ============================================================
    
    "composite": true,  // ✅ 启用项目引用
    "incremental": true, // ✅ 启用增量编译
    
    // 生成类型声明文件
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // ============================================================
    // 库环境配置
    // ============================================================
    
    "lib": ["ES2020"],
    
    "paths": {
      "@/*": ["./src/*"]
    }
  },

  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

#### packages/contracts/package.json

```json
{
  "name": "@dailyuse/contracts",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "development": {
        "types": "./src/index.ts",
        "import": "./src/index.ts"
      },
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "clean": "rimraf dist",
    
    // 🔑 关键：类型检查和打包分离
    "typecheck": "tsc --build",
    "build": "pnpm typecheck && tsup src/index.ts --dts --format esm --target es2020 --out-dir dist",
    "dev": "pnpm typecheck --watch & tsup src/index.ts --watch --dts --format esm --target es2020 --out-dir dist"
  }
}
```

**工作流程**：
1. `tsc --build` 生成 `.d.ts` 和 `.tsbuildinfo`（用于类型检查和引用）
2. `tsup` 生成优化的 `.js` 文件（用于运行时）
3. 两者互不干扰

#### packages/contracts/project.json

```json
{
  "name": "contracts",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/contracts/src",
  "tags": ["scope:shared", "type:lib"],
  "targets": {
    // 🔑 类型检查 target（使用 tsc）
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --build",
        "cwd": "packages/contracts"
      }
    },
    
    // 🔑 打包 target（依赖 typecheck）
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{workspaceRoot}/packages/contracts/dist"],
      "dependsOn": ["typecheck"],
      "options": {
        "command": "tsup src/index.ts --dts --format esm --target es2020 --out-dir dist",
        "cwd": "packages/contracts"
      }
    },
    
    // 🔑 开发模式
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "tsc --build --watch",
          "tsup src/index.ts --watch --dts --format esm --target es2020 --out-dir dist"
        ],
        "parallel": true,
        "cwd": "packages/contracts"
      }
    },
    
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
```

### 2. 应用配置（使用 Vite）

#### apps/desktop/tsconfig.json

**保持不变**，已经正确配置：

```jsonc
{
  "extends": "../../tsconfig.base.json",

  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist",
    "noEmit": false,

    // ✅ 启用 Composite
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"],
    "moduleResolution": "Bundler",
    "jsx": "preserve",

    "paths": {
      "@/*": ["./src/*"],
      "@electron/*": ["./electron/*"],
      "@common/*": ["./common/*"]
    }
  },

  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue", "electron/**/*", "common/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],

  // ✅ 引用依赖（现在 contracts 也是 composite 了）
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "../../packages/contracts" },
    { "path": "../../packages/domain-core" },
    { "path": "../../packages/domain-client" },
    { "path": "../../packages/utils" },
    { "path": "../../packages/ui" }
  ]
}
```

### 3. API 服务配置（使用 tsup/tsc）

#### apps/api/tsconfig.json

```jsonc
{
  "extends": "../../tsconfig.base.json",

  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,

    // ✅ 启用 Composite
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    "lib": ["ES2020"],
    "types": ["node"],
    "moduleResolution": "Node",

    "paths": {
      "@/*": ["./src/*"]
    }
  },

  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],

  // ✅ 恢复 references（之前被注释掉了）
  "references": [
    { "path": "../../packages/contracts" },
    { "path": "../../packages/domain-core" },
    { "path": "../../packages/domain-server" },
    { "path": "../../packages/utils" }
  ]
}
```

---

## 📋 完整迁移清单

### Step 1: 更新所有库的 tsconfig.json

对以下包启用 composite：

- [x] `packages/contracts/tsconfig.json`
- [x] `packages/domain-core/tsconfig.json`
- [x] `packages/domain-server/tsconfig.json`
- [x] `packages/utils/tsconfig.json`

修改内容：
```jsonc
{
  "compilerOptions": {
    "composite": true,      // ❌ false → ✅ true
    "incremental": true,    // ❌ false → ✅ true
    "declaration": true,
    "declarationMap": true
  }
}
```

### Step 2: 恢复应用的 references

`apps/api/tsconfig.json` 中恢复注释掉的 references：

```jsonc
{
  "references": [
    { "path": "../../packages/contracts" },
    { "path": "../../packages/domain-core" },
    { "path": "../../packages/domain-server" },
    { "path": "../../packages/utils" }
  ]
}
```

### Step 3: 更新 package.json scripts

所有使用 tsup 的包，更新为：

```json
{
  "scripts": {
    "typecheck": "tsc --build",
    "build": "pnpm typecheck && tsup src/index.ts --dts --format esm --out-dir dist",
    "dev": "concurrently \"tsc --build --watch\" \"tsup src/index.ts --watch --dts --format esm --out-dir dist\""
  }
}
```

如果没有 `concurrently`，可以用 Nx 的并行运行。

### Step 4: 更新 project.json

为每个包添加 `typecheck` target：

```json
{
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --build",
        "cwd": "packages/xxx"
      }
    },
    "build": {
      "dependsOn": ["typecheck"]
    }
  }
}
```

### Step 5: 清理并重新构建

```bash
# 清理所有缓存
pnpm tsc --build --clean

# 清理 dist 目录
pnpm nx run-many --target=clean --all

# 重新构建所有项目
pnpm nx run-many --target=build --all
```

---

## 🎯 开发工作流

### 开发模式（推荐）

```bash
# 方式 1: 使用 Nx watch（推荐）
pnpm nx watch --all -- nx affected --target=build

# 方式 2: 同时监听类型和打包
pnpm nx run-many --target=dev --all

# 方式 3: 只监听类型（用于纯类型检查）
pnpm tsc --build --watch
```

### 类型检查

```bash
# 检查所有项目类型
pnpm nx run-many --target=typecheck --all

# 检查受影响的项目
pnpm nx affected --target=typecheck

# 单独检查某个项目
pnpm nx typecheck contracts
```

### 生产构建

```bash
# 构建所有项目（有缓存）
pnpm nx run-many --target=build --all

# 构建受影响的项目
pnpm nx affected --target=build

# 强制重新构建
pnpm nx run-many --target=build --all --skip-nx-cache
```

---

## ❓ 常见问题解答

### Q1: tsup --dts 和 tsc 生成的 .d.ts 有什么区别？

**A**: 
- **tsc**: 严格按照 TypeScript 语义生成，支持 project references
- **tsup --dts**: 使用 [@microsoft/api-extractor](https://api-extractor.com/)，可能会丢失一些复杂类型信息

**推荐**：使用 tsc 生成 .d.ts，tsup 只生成 .js

### Q2: composite: true 会影响打包性能吗？

**A**: 不会！
- `composite: true` 只影响 tsc 的类型检查和 .d.ts 生成
- tsup/Vite 等打包工具**不使用** tsc 的 composite 功能
- 它们直接读取源码进行打包

### Q3: 为什么要分离 typecheck 和 build？

**A**: 
1. **明确职责**：类型检查和代码打包是两个独立的过程
2. **性能优化**：可以并行运行类型检查和打包
3. **缓存利用**：Nx 可以分别缓存 typecheck 和 build 的结果
4. **调试方便**：类型错误和打包错误不会混在一起

### Q4: 开发时是否每次都要运行 typecheck？

**A**: 不需要！
- **开发模式**：只运行 `tsc --build --watch` 监听类型变化
- **CI/CD**：执行完整的 `typecheck` + `build`
- **IDE**：自动进行类型检查（基于 tsconfig.json）

### Q5: incremental: true 和 composite: true 的关系？

**A**:
- `composite: true` 自动启用 `incremental: true`
- `incremental` 生成 `.tsbuildinfo` 用于缓存编译信息
- 两者配合实现增量编译和跨项目引用

### Q6: 为什么 package.json 要配置 development 条件导出？

```json
"exports": {
  ".": {
    "development": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    },
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  }
}
```

**A**: 
- **开发模式**：直接导入源码（src/index.ts），无需构建即可开发
- **生产模式**：使用构建产物（dist）
- 这需要打包工具支持（如 Vite、tsup）

### Q7: 是否可以只用 tsup --dts，不用 tsc？

**A**: 可以，但不推荐：
- ❌ 失去 composite 和 references 的好处（类型热更新）
- ❌ 无法利用 tsc 的增量编译
- ❌ 在复杂项目中 api-extractor 可能生成不正确的类型

**推荐方案**：tsc 生成类型，tsup 打包代码

---

## 📊 配置对比总结

### 旧配置（有问题）

```
packages/contracts
├─ tsconfig.json: composite: false  ❌
└─ 导致 apps/desktop 引用错误

apps/desktop
├─ tsconfig.json: composite: true
└─ references: [contracts]  ⚠️ 引用非 composite 项目
```

### 新配置（推荐）

```
packages/contracts
├─ tsconfig.json: composite: true  ✅
├─ typecheck: tsc --build
└─ build: tsup (生成 .js)

apps/desktop
├─ tsconfig.json: composite: true  ✅
└─ references: [contracts]  ✅ 正常引用
```

---

## 🎯 配置原则总结

### 黄金法则

1. **所有库和应用都启用 `composite: true`**
   - 获得类型热更新
   - 支持增量编译
   - 清晰的依赖关系

2. **分离类型检查和打包**
   - tsc: 类型检查 + 生成 .d.ts
   - tsup/Vite: 代码打包 + 优化

3. **使用 references 声明依赖**
   - 不要用 paths 指向源码
   - 让 TypeScript 自动管理依赖顺序

4. **在 CI/CD 中先运行 typecheck**
   ```bash
   pnpm nx affected --target=typecheck
   pnpm nx affected --target=build
   ```

5. **开发时使用 watch 模式**
   ```bash
   pnpm tsc --build --watch  # 类型监听
   pnpm nx watch --all       # 代码监听
   ```

---

## 🚀 下一步行动

### 立即执行

1. ✅ 更新所有 `tsconfig.json`，启用 `composite: true`
2. ✅ 更新 `package.json`，添加 `typecheck` script
3. ✅ 更新 `project.json`，添加 `typecheck` target
4. ✅ 清理缓存并重新构建

### 验证配置

```bash
# 1. 检查类型
pnpm nx run-many --target=typecheck --all

# 2. 如果有错误，逐个检查
pnpm nx typecheck contracts
pnpm nx typecheck domain-core
# ...

# 3. 验证 references 是否正确
pnpm tsc --build --dry --force

# 4. 完整构建
pnpm nx run-many --target=build --all
```

### 测试类型热更新

1. 启动 watch 模式：
   ```bash
   pnpm tsc --build --watch
   ```

2. 修改 `packages/contracts/src/index.ts` 中的类型

3. 观察 IDE 中使用该类型的地方是否立即更新

---

## 📚 相关文档

- [TSCONFIG_MONOREPO_BEST_PRACTICES.md](./TSCONFIG_MONOREPO_BEST_PRACTICES.md) - TypeScript Monorepo 配置基础
- [NX_CONFIGURATION_GUIDE.md](./NX_CONFIGURATION_GUIDE.md) - Nx 项目配置指南
- [PROJECT_JSON_GUIDE.md](./PROJECT_JSON_GUIDE.md) - project.json 配置详解

---

**配置完成！** 🎉

你现在拥有：
- ✅ 所有包支持类型热更新
- ✅ 类型检查和打包完全分离
- ✅ 充分利用 Nx 的缓存和并行构建
- ✅ 清晰的开发和构建流程
- ✅ 与 tsup、Vite 等现代工具完美配合
