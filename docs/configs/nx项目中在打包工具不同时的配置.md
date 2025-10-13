# Nx 项目中配置跨包更新（使用不同打包工具）

**最后更新**: 2025-10-13  
**适用场景**: Nx Monorepo + TypeScript + 多种打包工具（tsup、Vite、tsc）

---

## 问题详情

### 遇到的问题

1. ❌ **错误提示**: `Referenced project must have setting "composite": true`
2. ❌ **错误理解**: "composite 与 tsup --dts 不兼容"
3. ❌ **配置冲突**: 部分包设置 `composite: false`，导致引用它们的应用报错
4. ❓ **疑惑**: tsc、tsup、Vite 等打包工具该如何配置？

---

## 解决方案

### 核心原理

**关键认知**：TypeScript 的 `composite` 与打包工具**完全独立**！

```
┌─────────────────────────────────────────┐
│   TypeScript 职责分工（双轨制）          │
├─────────────────────────────────────────┤
│                                         │
│  Track 1: tsc (类型系统)                │
│  ├─ composite + references              │
│  ├─ 类型检查 (typecheck)                │
│  ├─ 生成 .d.ts 声明文件                 │
│  ├─ 生成 .tsbuildinfo (增量编译)        │
│  └─ 跨包类型热更新                      │
│                                         │
│  Track 2: 打包工具 (代码打包)           │
│  ├─ tsup: 读取源码 → 生成 .js          │
│  ├─ Vite: 读取源码 → 打包               │
│  ├─ 与 composite 无关                   │
│  └─ 独立运行                            │
│                                         │
└─────────────────────────────────────────┘
```

### 配置原则（黄金法则）

| 原则 | 说明 | 理由 |
|-----|------|-----|
| **1. 所有包启用 composite** | `composite: true` | 支持类型热更新和增量编译 |
| **2. 使用 references 声明依赖** | 不要用 paths 指向源码 | 让 TypeScript 自动管理依赖 |
| **3. 分离类型检查和打包** | typecheck + build 分开 | 各司其职，清晰明确 |
| **4. 类型检查用 tsc --build** | 不是 tsc --noEmit | 利用增量编译，更快 |
| **5. 打包工具独立运行** | tsup/Vite 不依赖 tsc | 互不干扰 |

---

## 实战经验

### 配置模板

#### 1. 库包配置（使用 tsup）

**tsconfig.json**:
```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    
    // ✅ 关键：启用 composite
    "composite": true,
    "incremental": true,
    "declaration": true,
    "declarationMap": true,
    
    "paths": {
      "@/*": ["./src/*"]  // 只配置内部别名
    }
  },
  "include": ["src"],
  
  // ✅ 声明依赖的包
  "references": [
    { "path": "../dependency-package" }
  ]
}
```

**package.json**:
```json
{
  "scripts": {
    "typecheck": "tsc --build",
    "build": "tsup src/index.ts --dts --format esm --out-dir dist",
    "dev": "tsup src/index.ts --watch --dts --format esm --out-dir dist"
  }
}
```

**project.json**:
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
      "dependsOn": ["typecheck"],
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "packages/xxx"
      }
    }
  }
}
```

#### 2. 应用配置（使用 Vite）

**tsconfig.json**:
```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "noEmit": false,
    
    // ✅ 启用 composite
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    
    "moduleResolution": "Bundler",  // Vite
    
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  
  // ✅ 引用依赖的包
  "references": [
    { "path": "../../packages/contracts" },
    { "path": "../../packages/domain-core" }
  ]
}
```

### 开发工作流

#### 日常开发

```bash
# 启动类型监听（自动重新编译）
pnpm tsc --build --watch

# 或者使用 Nx watch
pnpm nx watch --all -- nx affected --target=build
```

**效果**：
- 修改任何包的类型
- 依赖它的包自动重新编译
- IDE 立即显示最新类型

#### 类型检查

```bash
# 检查所有项目
pnpm nx run-many --target=typecheck --all

# 检查受影响的项目
pnpm nx affected --target=typecheck

# 检查单个项目
pnpm nx typecheck contracts
```

#### 生产构建

```bash
# 构建所有项目（自动先执行 typecheck）
pnpm nx run-many --target=build --all

# 构建受影响的项目
pnpm nx affected --target=build
```

#### 清理缓存

```bash
# 清理 TypeScript 缓存
pnpm tsc --build --clean

# 清理 dist 目录
pnpm nx run-many --target=clean --all

# 强制重新构建
pnpm nx run-many --target=build --all --skip-nx-cache
```

---

## 经验总结

### ✅ 正确的做法

1. **所有包都启用 composite**
   - 获得类型热更新
   - 支持增量编译
   - 清晰的依赖关系

2. **使用 references 而不是 paths**
   - TypeScript 自动管理依赖顺序
   - 支持跨包类型更新
   - IDE 性能更好

3. **分离 typecheck 和 build**
   - tsc --build: 类型检查
   - tsup/Vite: 代码打包
   - 职责清晰，互不干扰

4. **在 CI/CD 中先执行 typecheck**
   ```bash
   pnpm nx affected --target=typecheck
   pnpm nx affected --target=build
   ```

### ❌ 错误的做法

1. **❌ 用 paths 指向源码**
   ```jsonc
   {
     "paths": {
       "@dailyuse/utils": ["../../packages/utils/src/index.ts"]
     }
   }
   ```
   **问题**: 失去类型热更新，无法增量编译

2. **❌ 混用 composite: true 和 false**
   ```
   app (composite: true)
   └─ references: [lib (composite: false)]  ← 错误！
   ```
   **问题**: TypeScript 报错

3. **❌ 在 tsconfig.base.json 配置 paths**
   ```jsonc
   // tsconfig.base.json
   {
     "paths": { ... }  // ❌ 不要在基础配置中配置
   }
   ```
   **问题**: 覆盖子项目配置，导致混乱

4. **❌ package.json 的 types 指向源码**
   ```json
   {
     "types": "./src/index.ts"  // ❌ 应该指向 dist
   }
   ```
   **问题**: TypeScript 找不到类型定义

### 🎯 最佳实践

| 场景 | 推荐方案 | 原因 |
|-----|---------|-----|
| **类型检查** | `tsc --build` | 支持增量编译和 references |
| **代码打包** | `tsup` / `Vite` | 更快、更优化 |
| **开发模式** | `tsc --build --watch` | 自动类型热更新 |
| **CI/CD** | typecheck → build | 先检查类型再打包 |
| **依赖管理** | `references` | 不用 paths 指向源码 |

---

## 常见问题

### Q: composite 会影响打包性能吗？

**A**: 不会！
- composite 只影响 **tsc 的类型检查**
- tsup/Vite 等打包工具**不使用** tsc 的 composite 功能
- 它们直接读取源码进行打包

### Q: tsup --dts 和 tsc 生成的 .d.ts 有什么区别？

**A**: 
- **tsc**: 严格按照 TypeScript 语义，支持 project references
- **tsup --dts**: 使用 api-extractor，可能丢失复杂类型

**推荐**: 用 tsc 生成 .d.ts，tsup 只生成 .js

### Q: 为什么要用 tsc --build 而不是 tsc --noEmit？

**A**: 
- `tsc --build`: 生成 .tsbuildinfo，支持增量编译，更快
- `tsc --noEmit`: 每次都全量检查，更慢

### Q: 开发时是否每次都要运行 typecheck？

**A**: 不需要！
- **开发**: 只运行 `tsc --build --watch` 后台监听
- **CI/CD**: 执行完整的 typecheck + build
- **IDE**: 自动类型检查（基于 tsconfig.json）

### Q: 如何验证类型热更新？

**A**: 
1. 启动: `pnpm tsc --build --watch`
2. 修改依赖包的类型定义
3. 观察 IDE 中使用该类型的地方是否立即更新
4. 无需重启 IDE 或手动重新构建

---

## 信息参考

### 官方文档

- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript Composite](https://www.typescriptlang.org/tsconfig#composite)
- [Nx TypeScript Configuration](https://nx.dev/recipes/tips-n-tricks/advanced-typescript-support)

### 项目文档

- [NX_BUILD_TOOLS_COMPOSITE_CONFIGURATION.md](./NX_BUILD_TOOLS_COMPOSITE_CONFIGURATION.md) - 完整指南
- [COMPOSITE_CONFIGURATION_FIX_SUMMARY.md](./COMPOSITE_CONFIGURATION_FIX_SUMMARY.md) - 修复总结
- [TSCONFIG_MONOREPO_BEST_PRACTICES.md](./TSCONFIG_MONOREPO_BEST_PRACTICES.md) - 最佳实践

---

## 快速检查清单

在配置 Nx Monorepo 的 TypeScript 时，确保：

- [ ] ✅ 所有库启用 `composite: true`
- [ ] ✅ 所有应用启用 `composite: true`
- [ ] ✅ 使用 `references` 声明依赖
- [ ] ✅ 不用 `paths` 指向其他包的源码
- [ ] ✅ package.json 的 `types` 指向 `dist`
- [ ] ✅ 添加 `typecheck` script（`tsc --build`）
- [ ] ✅ `build` 依赖 `typecheck`
- [ ] ✅ 开发时运行 `tsc --build --watch`
- [ ] ✅ CI/CD 先执行 typecheck 再 build

---

**配置完成！** 🎉

你现在拥有：
- ✅ 类型热更新（修改即生效）
- ✅ 增量编译（只编译变化部分）
- ✅ 清晰的依赖关系（自动管理）
- ✅ 完美的打包工具集成（tsup、Vite）
- ✅ 高性能的开发体验
