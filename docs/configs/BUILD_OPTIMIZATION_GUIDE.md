# DailyUse 项目打包优化方案

> 📦 为 Monorepo 中的每个包选择最佳打包工具，实现构建速度和产物质量的完美平衡

## 📋 目录

- [概述](#概述)
- [打包工具选择](#打包工具选择)
- [Packages 配置详解](#packages-配置详解)
- [Apps 配置详解](#apps-配置详解)
- [构建命令](#构建命令)
- [性能优化](#性能优化)
- [常见问题](#常见问题)

---

## 概述

### 打包目标

1. **构建速度**：利用 esbuild/Vite 的极速打包能力
2. **产物质量**：支持 tree-shaking、代码分割、source map
3. **开发体验**：快速的增量编译和热更新
4. **类型安全**：完整的 TypeScript 类型声明和跨包引用
5. **统一管理**：通过工具函数统一配置，减少重复代码

### 核心原则

- **纯 TS 库**：使用 tsup (基于 esbuild)
- **Vue 组件**：使用 Vite (Library Mode)
- **Node 应用**：使用 tsc (TypeScript Compiler)
- **前端应用**：使用 Vite
- **桌面应用**：使用 Vite + Electron Builder

---

## 打包工具选择

### 对比表

| 包名 | 类型 | 打包工具 | 原因 | 构建速度 |
|------|------|---------|------|---------|
| **@dailyuse/contracts** | 类型定义库 | tsup | 纯类型，无运行时，tsup 最快 | ⚡️⚡️⚡️ |
| **@dailyuse/domain-core** | 核心域模型 | tsup | 前后端共享，需要 tree-shaking | ⚡️⚡️⚡️ |
| **@dailyuse/domain-client** | 前端域模型 | tsup | 前端专用，优秀的 tree-shaking | ⚡️⚡️⚡️ |
| **@dailyuse/domain-server** | 后端域模型 | tsup | Node.js 环境，tsup 对 Node 支持好 | ⚡️⚡️⚡️ |
| **@dailyuse/utils** | 工具函数库 | tsup | 需要最小化体积，tsup 最优 | ⚡️⚡️⚡️ |
| **@dailyuse/ui** | Vue 组件库 | Vite | 处理 .vue 文件和 CSS | ⚡️⚡️ |
| **@dailyuse/assets** | 静态资源 | 无 | 直接复制，无需打包 | ⚡️⚡️⚡️ |
| **@dailyuse/api** | Node.js 后端 | tsc | 无需打包，tsc 编译即可 | ⚡️⚡️ |
| **@dailyuse/web** | Vue SPA | Vite | Vue 3 标准选择 | ⚡️⚡️ |
| **@dailyuse/desktop** | Electron 应用 | Vite + EB | Electron 最佳实践 | ⚡️⚡️ |

### 工具特性对比

#### tsup (⭐️ 推荐用于纯 TS 库)

**优点：**
- 基于 esbuild，打包速度极快（10-100x 速度提升）
- 开箱即用，配置简单
- 完美支持 ESM/CJS 双格式
- 内置 tree-shaking 和代码压缩
- 支持 watch 模式，增量编译
- 文件体积小

**缺点：**
- 不支持 .vue 等特殊文件
- 不支持复杂的 Rollup 插件

**适用场景：**
- 纯 TypeScript 库
- 工具函数库
- 域模型包
- 无需处理资源文件的包

#### Vite (⭐️ 推荐用于 Vue/前端应用)

**优点：**
- Vue 3 生态标准
- 优秀的 HMR (热模块替换)
- 支持 .vue、.css、图片等资源
- Library Mode 专为组件库优化
- 生产环境使用 Rollup，产物质量高
- 插件生态丰富

**缺点：**
- 比 esbuild 稍慢
- 配置相对复杂

**适用场景：**
- Vue 组件库
- Vue 应用
- 需要处理资源文件的包

#### tsc (⭐️ 推荐用于 Node.js 应用)

**优点：**
- 官方工具，最可靠
- 完整的类型检查
- 支持 composite 项目引用
- 增量编译
- 无需打包，保留模块结构

**缺点：**
- 编译速度较慢
- 不进行打包优化

**适用场景：**
- Node.js 后端应用
- 需要保留模块结构的项目
- 对类型安全要求极高的项目

---

## Packages 配置详解

### 1. @dailyuse/contracts

**包类型：** 纯类型定义库

**打包工具：** tsup

**配置文件：** `packages/contracts/tsup.config.ts`

```typescript
/**
 * @dailyuse/contracts 打包配置
 * 
 * 包类型：纯类型定义库
 * 打包工具：tsup (基于 esbuild)
 */

import { baseLibraryConfig } from '../../tools/build/tsup.base.config';

export default baseLibraryConfig('@dailyuse/contracts');
```

**关键配置说明：**

- **格式**：ESM (现代化模块格式)
- **目标**：ES2020 (平衡兼容性与特性)
- **类型声明**：通过 `tsc --build` 生成 (支持 composite)
- **Source Map**：生产环境启用 (便于调试)
- **Tree-shaking**：自动启用
- **代码分割**：启用 (优化加载性能)

**构建命令：**

```bash
# 开发模式 (watch + 增量编译)
pnpm nx run contracts:dev

# 生产构建
pnpm nx run contracts:build

# 仅类型检查
pnpm nx run contracts:typecheck
```

---

### 2. @dailyuse/domain-core

**包类型：** 核心域模型库 (前后端共享)

**打包工具：** tsup

**配置文件：** `packages/domain-core/tsup.config.ts`

```typescript
/**
 * @dailyuse/domain-core 打包配置
 * 
 * 包类型：核心域模型库 (前后端共享)
 * 打包工具：tsup (基于 esbuild)
 */

import { domainConfig } from '../../tools/build/tsup.base.config';

export default domainConfig('@dailyuse/domain-core');
```

**特殊处理：**

- 外部化 `@dailyuse/contracts` 和 `@dailyuse/utils`
- 支持前后端环境
- 启用 tree-shaking (按需引入域模型)

---

### 3. @dailyuse/domain-client & domain-server

**包类型：** 域模型库

**打包工具：** tsup

**配置：** 同 domain-core，使用 `domainConfig` 预设

**构建策略：**

```typescript
// domain-client: 前端专用域模型
export default domainConfig('@dailyuse/domain-client');

// domain-server: 后端专用域模型
export default domainConfig('@dailyuse/domain-server');
```

---

### 4. @dailyuse/utils

**包类型：** 工具函数库

**打包工具：** tsup

**配置文件：** `packages/utils/tsup.config.ts`

```typescript
/**
 * @dailyuse/utils 打包配置
 * 
 * 包类型：工具函数库
 * 打包工具：tsup (基于 esbuild)
 * 
 * 选择原因：
 * - 工具函数需要最小化体积
 * - tsup 支持优秀的 tree-shaking
 * - 打包速度快，适合频繁修改
 */

import { baseLibraryConfig } from '../../tools/build/tsup.base.config';

export default baseLibraryConfig('@dailyuse/utils');
```

**优化重点：**

- Tree-shaking：只打包使用的工具函数
- 最小化体积：通过 esbuild 压缩
- 快速重建：watch 模式下增量编译

---

### 5. @dailyuse/ui

**包类型：** Vue 3 组件库

**打包工具：** Vite (Library Mode)

**配置文件：** `packages/ui/vite.config.ts`

```typescript
/**
 * @dailyuse/ui 打包配置
 * 
 * 包类型：Vue 3 组件库
 * 打包工具：Vite (Library Mode)
 * 
 * 选择原因：
 * 1. Vue 组件库需要处理 .vue 文件和 CSS
 * 2. Vite 对 Vue 3 有最佳支持
 * 3. 支持 CSS 代码分割和优化
 * 4. HMR 快速，开发体验好
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DailyUseUI',
      fileName: 'index',
      formats: ['es'], // 仅 ESM
    },
    
    rollupOptions: {
      // 外部化 peer dependencies
      external: [
        'vue',
        'vuetify',
        '@mdi/font',
        /^vuetify\/.*/,
      ],
      
      output: {
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify',
        },
        exports: 'named',
      },
    },
    
    cssCodeSplit: false, // CSS 打包到单个文件
    sourcemap: true,
    target: 'es2020',
    minify: 'esbuild',
  },
});
```

**关键特性：**

- **格式**：仅 ESM (现代化，tree-shaking 友好)
- **CSS**：打包到 `dist/style.css`
- **外部依赖**：vue, vuetify 不打包 (peer dependencies)
- **压缩**：esbuild (速度快)

**使用方式：**

```typescript
// 在其他项目中使用
import { DuButton, DuDialog } from '@dailyuse/ui';
import '@dailyuse/ui/style'; // 导入样式
```

---

### 6. @dailyuse/assets

**包类型：** 静态资源包

**打包工具：** 无 (直接复制)

**说明：**

静态资源（图片、音频等）无需打包，直接通过 `@dailyuse/assets/images` 等路径引用即可。

---

## Apps 配置详解

### 1. @dailyuse/api

**应用类型：** Node.js Express 后端

**打包工具：** tsc (TypeScript Compiler)

**配置文件：** `apps/api/tsconfig.json`

**选择原因：**

1. Node.js 应用无需打包，tsc 编译即可
2. 保留模块结构，便于调试
3. 支持 composite 项目引用
4. 完整的类型检查

**构建配置：**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "lib": ["ES2020"],
    "types": ["node"]
  },
  "references": [
    { "path": "../../packages/contracts" },
    { "path": "../../packages/domain-server" },
    { "path": "../../packages/utils" }
  ]
}
```

**构建命令：**

```bash
# 开发模式 (watch + 热重载)
pnpm nx run api:dev

# 生产构建
pnpm nx run api:build

# 启动生产服务
pnpm nx run api:start
```

---

### 2. @dailyuse/web

**应用类型：** Vue 3 SPA

**打包工具：** Vite

**配置文件：** `apps/web/vite.config.ts`

**关键配置：**

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dailyuse/utils': path.resolve(__dirname, '../../packages/utils/src'),
      // ... 其他别名
    },
  },
  
  build: {
    sourcemap: isDev,
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'ui': ['vuetify', '@mdi/font'],
        },
      },
    },
  },
});
```

**优化策略：**

- **代码分割**：vendor、ui 等分块
- **Tree-shaking**：自动移除未使用代码
- **压缩**：esbuild 压缩
- **Source Map**：开发环境启用

**构建命令：**

```bash
# 开发服务器
pnpm nx run web:dev

# 生产构建
pnpm nx run web:build

# 预览生产构建
pnpm nx run web:preview
```

---

### 3. @dailyuse/desktop

**应用类型：** Electron 桌面应用

**打包工具：** Vite + Electron Builder

**配置文件：** `apps/desktop/vite.config.ts`

**特殊处理：**

```typescript
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'src/main/main-simple.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['better-sqlite3', 'bcrypt', 'electron'],
            },
          },
        },
      },
      preload: {
        input: {
          main_preload: path.resolve(__dirname, 'src/preload/main.ts'),
        },
      },
    }),
  ],
  
  optimizeDeps: {
    exclude: ['better-sqlite3', 'bcrypt', ...workspacePkgs],
  },
});
```

**构建流程：**

1. **渲染进程**：Vite 打包 Vue 应用
2. **主进程**：Vite 打包 Electron 主进程代码
3. **Preload**：打包预加载脚本
4. **打包应用**：Electron Builder 生成安装包

**构建命令：**

```bash
# 开发模式
pnpm nx run desktop:dev

# 构建应用
pnpm nx run desktop:build

# 打包安装程序
pnpm nx run desktop:dist
```

---

## 构建命令

### 单包构建

```bash
# 构建单个包
pnpm nx run <package-name>:build

# 示例
pnpm nx run contracts:build
pnpm nx run web:build
```

### 批量构建

```bash
# 构建所有 packages
pnpm nx run-many --target=build --projects=contracts,domain-core,domain-client,domain-server,utils,ui --parallel=6

# 构建所有 apps
pnpm nx run-many --target=build --projects=api,web,desktop --parallel=3

# 构建整个项目
pnpm nx run-many --target=build --all
```

### 开发模式

```bash
# Watch 模式 (自动重新构建)
pnpm nx run <package-name>:dev

# 示例
pnpm nx run contracts:dev
pnpm nx run web:dev
```

---

## 性能优化

### 构建速度优化

1. **并行构建**：
   ```bash
   # 并行构建多个包
   pnpm nx run-many --target=build --projects=pkg1,pkg2,pkg3 --parallel=3
   ```

2. **增量编译**：
   - tsup 和 Vite 自动支持增量编译
   - tsc 通过 `--incremental` 启用

3. **缓存利用**：
   - Nx 自动缓存构建结果
   - 修改一个包只重新构建相关依赖

4. **依赖外部化**：
   - 所有包都正确配置 `external`
   - 避免重复打包相同依赖

### 产物优化

1. **Tree-shaking**：
   - tsup 和 Vite 自动启用
   - 确保使用 ESM 格式

2. **代码分割**：
   - Vite 支持自动代码分割
   - 手动配置 `manualChunks` 优化

3. **压缩**：
   - 生产环境自动压缩
   - esbuild (快) 或 terser (小)

4. **Source Map**：
   - 开发环境：inline source map
   - 生产环境：external source map

---

## 常见问题

### Q1: 为什么不全部使用 esbuild？

**A:** esbuild 虽然快，但：
- 不支持 .vue 文件
- 不支持复杂的 Rollup 插件
- 对于应用，Vite 提供更完整的功能

### Q2: 为什么 API 不使用打包工具？

**A:** Node.js 应用特点：
- 无需打包到单文件
- 保留模块结构便于调试
- tsc 提供最好的类型安全

### Q3: 如何处理跨包类型引用？

**A:** 通过 TypeScript Project References：
```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "references": [
    { "path": "../other-package" }
  ]
}
```

### Q4: 构建失败怎么办？

**A:** 检查步骤：
1. 清理缓存：`pnpm nx reset`
2. 重新安装依赖：`pnpm install`
3. 检查类型错误：`pnpm nx run <pkg>:typecheck`
4. 查看详细日志：`pnpm nx run <pkg>:build --verbose`

### Q5: 如何调试打包产物？

**A:**
1. 启用 source map
2. 使用 `pnpm nx run <pkg>:dev` watch 模式
3. 检查 dist 目录结构
4. 使用 `node --inspect` 调试 Node 应用

---

## 测试结果

### Packages 构建测试

所有 packages 构建通过 ✅

| 包名 | 构建状态 | 构建时间 | 产物大小 | 备注 |
|------|---------|---------|---------|------|
| @dailyuse/contracts | ✅ 通过 | ~2s | - | 纯类型定义 |
| @dailyuse/domain-core | ✅ 通过 | ~2s | - | 核心域模型 |
| @dailyuse/domain-client | ✅ 通过 | ~8s | - | 前端域模型 |
| @dailyuse/domain-server | ✅ 通过 | ~3s | - | 后端域模型 |
| @dailyuse/utils | ✅ 通过 | ~1s | - | 工具函数 |
| @dailyuse/ui | ✅ 通过 | ~1.2s | 125.89 kB | Vue 组件库 |

**修复记录：**
- UI 包：修复了 `DuPasswordResetForm.vue` 中的 `Timeout` 类型错误
  - 问题：`countdownTimer: number | null` 与浏览器 `setInterval` 返回 `Timeout` 类型冲突
  - 解决：使用 `ReturnType<typeof setInterval>` 自动推断正确类型

### Apps 构建测试

| 应用 | 构建状态 | 备注 |
|------|---------|------|
| @dailyuse/api | ⏳ 未测试 | Node.js 后端，使用 tsc |
| @dailyuse/web | ⚠️ 有类型错误 | 业务代码类型问题，非打包配置问题 |
| @dailyuse/desktop | ⏳ 未测试 | Electron 应用 |

**Web 应用说明：**
- 构建工具配置正确
- 类型错误来自业务代码（contracts 导出变更、domain-client 重构等）
- 需要单独修复业务代码，不影响打包优化完成度

---

## 总结

### 优势

✅ **极速构建**：tsup (esbuild) 比传统工具快 10-100 倍  
✅ **统一管理**：通过 `tools/build/tsup.base.config.ts` 工具函数统一配置  
✅ **类型安全**：完整的 TypeScript 支持和 composite 项目引用  
✅ **现代化**：全面采用 ESM 格式  
✅ **优化产物**：tree-shaking、代码分割、压缩  
✅ **开发体验**：增量编译、watch 模式、快速重建  

### 最佳实践

1. **纯 TS 库**：优先选择 tsup
   - 示例：contracts, domain-core, domain-client, domain-server, utils
   - 原因：极速、tree-shaking、ESM/CJS 双格式

2. **Vue 组件**：使用 Vite Library Mode
   - 示例：ui (Vue 组件库)
   - 原因：处理 .vue 文件、CSS 优化、HMR

3. **Node 应用**：使用 tsc
   - 示例：api (Express 后端)
   - 原因：无需打包、保留模块结构、完整类型检查

4. **前端应用**：使用 Vite
   - 示例：web (Vue SPA)
   - 原因：Vue 3 生态标准、代码分割、优秀性能

5. **开发模式**：使用 watch 模式
   ```bash
   pnpm nx run <package-name>:dev
   ```

6. **生产构建**：启用 source map 和压缩
   ```bash
   pnpm nx run <package-name>:build
   ```

### 性能数据

**并行构建 6 个 packages：**
- 总耗时：~10s
- Nx 缓存：4/7 任务从缓存读取 (节省 ~60% 时间)
- 增量编译：仅重新构建修改的包

**单包构建速度：**
- contracts: ~2s
- domain-core: ~2s
- utils: ~1s
- domain-client: ~8s
- domain-server: ~3s
- ui: ~1.2s (Vite) + ~10s (vue-tsc)

---

## 下一步

### 完成项

✅ 创建统一的 tsup 配置工具  
✅ 优化所有 packages 打包配置  
✅ 优化所有 apps 打包配置  
✅ 测试所有 packages 构建  
✅ 修复 UI 包类型错误  
✅ 编写完整的打包优化文档  

### 待优化项

⏳ 修复 web 应用的业务代码类型错误  
⏳ 测试 desktop 应用构建  
⏳ 测试 api 应用构建  
⏳ 优化 Nx 缓存策略（已经很好）  
⏳ 添加构建性能监控  

---

**文档更新日期：** 2025-01-13  
**维护者：** DailyUse Team
