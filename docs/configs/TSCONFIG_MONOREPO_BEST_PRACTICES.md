# TypeScript Monorepo 配置最佳实践

**更新日期**: 2025-10-11  
**配置原则**: Composite + References + 类型热更新

---

## 🎯 核心原则

### 1. **使用 Composite + References 而不是 Paths**

❌ **错误做法**：直接用 paths 指向其他包的源码
```jsonc
{
  "compilerOptions": {
    "paths": {
      "@dailyuse/utils": ["../../packages/utils/src/index.ts"]  // ❌ 指向源码
    }
  }
}
```

**问题**：
- ❌ 没有类型热更新（修改依赖包后不会自动重新编译）
- ❌ 没有增量编译（每次都重新编译所有文件）
- ❌ 无法保证构建顺序（可能引用未构建的包）
- ❌ IDE 性能差（需要解析所有依赖包的源码）

✅ **正确做法**：使用 composite + references
```jsonc
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
    // 不配置 paths 指向其他包
  },
  "references": [
    { "path": "../../packages/utils" }  // ✅ 项目引用
  ]
}
```

**优势**：
- ✅ 类型热更新（依赖包修改后自动重新编译）
- ✅ 增量编译（只重新编译变化的部分）
- ✅ 保证构建顺序（依赖项先构建）
- ✅ IDE 性能好（只读取 .d.ts 文件）
- ✅ 支持并行构建

---

## 📦 项目引用工作原理

### TypeScript 如何解析跨包引用

```typescript
// 在 apps/api/src/main.ts 中
import { Goal } from '@dailyuse/domain-core';
```

**解析流程**：

1. **查找 package.json**
   ```json
   // packages/domain-core/package.json
   {
     "name": "@dailyuse/domain-core",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts"
   }
   ```

2. **读取类型定义**
   - TypeScript 从 `dist/index.d.ts` 读取类型（而不是 `src/index.ts`）
   - 类型定义由 `composite: true` 和 `declaration: true` 生成

3. **触发重新编译**
   - `tsc --build --watch` 监听所有 references
   - 当 `domain-core/src/**` 变化时：
     1. 重新编译 `domain-core` → 生成新的 `.d.ts`
     2. 自动重新编译依赖它的 `api` 项目
   - **这就是类型热更新！**

4. **增量编译**
   - TypeScript 生成 `.tsbuildinfo` 文件缓存编译信息
   - 只重新编译变化的文件

---

## 🏗️ 配置结构详解

### 完整的 Monorepo 配置层次

```
根目录/
├── tsconfig.base.json          # 基础配置（不含 paths）
├── tsconfig.json                # 根配置（组织 references）
├── apps/
│   ├── api/tsconfig.json        # 应用配置（含 references）
│   ├── web/tsconfig.json
│   └── desktop/tsconfig.json
└── packages/
    ├── contracts/tsconfig.json  # 库配置（composite: true）
    ├── utils/tsconfig.json
    ├── domain-core/tsconfig.json
    ├── domain-client/tsconfig.json
    ├── domain-server/tsconfig.json
    ├── ui/tsconfig.json
    └── assets/tsconfig.json
```

### 每个配置文件的作用

#### 1. tsconfig.base.json - 基础配置

**不应该包含**：
- ❌ `paths` 配置（在 monorepo 中不需要）
- ❌ `noEmit` 配置（应该由子项目决定）
- ❌ 环境相关配置（lib、types 等）

**应该包含**：
- ✅ 通用编译选项（target、module、strict 等）
- ✅ 性能优化（skipLibCheck、incremental）
- ✅ 代码风格（verbatimModuleSyntax、isolatedModules）

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "skipLibCheck": true,
    "incremental": true,
    // ... 其他通用配置
    // ❌ 不配置 paths
    // ❌ 不配置 noEmit
  }
}
```

#### 2. tsconfig.json - 根配置

**作用**：组织所有项目引用

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,      // 根项目不生成输出
    "composite": false   // 根项目不是 composite
  },
  "files": [],
  "references": [
    // 列出所有子项目
    { "path": "./apps/api" },
    { "path": "./packages/contracts" },
    // ...
  ]
}
```

**运行 `tsc --build` 时**：
- TypeScript 会按依赖顺序构建所有 references
- 自动处理并行构建

#### 3. 库配置（packages/*/tsconfig.json）

**必须配置**：

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    
    // 🔑 关键配置：启用项目引用
    "composite": true,        // 生成 .tsbuildinfo
    "declaration": true,      // 生成 .d.ts
    "declarationMap": true,   // 生成 .d.ts.map (IDE 跳转源码)
    "sourceMap": true,        // 生成 .js.map (调试支持)
    
    // 🔑 不配置 paths 指向其他包
    "paths": {
      "@/*": ["./src/*"]  // 只配置内部别名
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"],
  
  // 🔑 声明依赖的包
  "references": [
    { "path": "../other-package" }
  ]
}
```

**为什么不配置 paths**：
- TypeScript 会通过 `references` 自动找到依赖包
- 从依赖包的 `dist` 目录读取类型（不是 `src`）
- 监听依赖包的变化并触发重新编译

#### 4. 应用配置（apps/*/tsconfig.json）

**与库配置类似**，但依赖更多的包：

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    // 只配置内部别名
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  
  // 声明依赖的所有包
  "references": [
    { "path": "../../packages/contracts" },
    
    { "path": "../../packages/utils" }
  ]
}
```

---

## 🔥 类型热更新示例

### 场景：修改 domain-core 包的类型

1. **修改源码**
   ```typescript
   // packages/domain-core/src/entities/Goal.ts
   export class Goal {
     // 新增字段
     priority: number;
   }
   ```

2. **触发增量编译**
   ```bash
   pnpm tsc --build --watch
   ```

3. **自动更新流程**
   ```
   [Watch] 检测到 domain-core/src/entities/Goal.ts 变化
   ├─ [1] 重新编译 domain-core
   │   ├─ 生成 dist/entities/Goal.js
   │   ├─ 生成 dist/entities/Goal.d.ts       ← 类型定义更新
   │   └─ 更新 .tsbuildinfo
   ├─ [2] 检测到 domain-client 依赖 domain-core
   │   └─ 重新编译 domain-client
   ├─ [3] 检测到 api 依赖 domain-core
   │   └─ 重新编译 api
   └─ [4] 检测到 web 依赖 domain-core
       └─ 重新编译 web
   ```

4. **IDE 实时反馈**
   ```typescript
   // apps/api/src/modules/goal/service.ts
   import { Goal } from '@dailyuse/domain-core';
   
   const goal = new Goal();
   goal.priority = 1;  // ✅ IDE 立即识别新字段
   ```

**没有 composite + references 的情况**：
- ❌ 需要手动重启 IDE 才能看到新类型
- ❌ 或者需要手动运行 `tsc` 多次
- ❌ 无法自动检测依赖变化

---

## 📊 配置对比

### 方案对比表

| 特性 | Paths 方案 | Composite + References 方案 |
|------|-----------|----------------------------|
| **类型热更新** | ❌ 不支持 | ✅ 自动更新 |
| **增量编译** | ❌ 每次全量编译 | ✅ 只编译变化部分 |
| **并行构建** | ❌ 不支持 | ✅ 自动并行 |
| **构建顺序** | ⚠️ 需手动管理 | ✅ 自动处理 |
| **IDE 性能** | ⚠️ 需解析所有源码 | ✅ 只读取 .d.ts |
| **调试支持** | ⚠️ 需额外配置 | ✅ 自带 sourceMap |
| **复杂度** | 🟢 简单 | 🟡 中等 |
| **推荐度** | ❌ 不推荐 | ✅ **强烈推荐** |

---

## 🛠️ 实战指南

### 开发模式（监听变化）

```bash
# 启动监听模式（推荐）
pnpm tsc --build --watch

# 或者使用 Nx 的 watch 模式
pnpm nx watch api
```

**监听模式的工作流程**：
1. 首次构建所有项目（按依赖顺序）
2. 监听所有 references 项目的文件变化
3. 文件变化时：
   - 重新编译变化的项目
   - 自动重新编译依赖它的项目
4. IDE 自动获取最新类型

### 生产构建

```bash
# 清理缓存
pnpm tsc --build --clean

# 强制重新构建所有项目
pnpm tsc --build --force

# 或者使用 Nx（推荐，有缓存）
pnpm nx run-many --target=build --all
```

### 类型检查

```bash
# 检查所有项目的类型
pnpm tsc --build

# 只检查特定项目
pnpm tsc --build apps/api

# 查看构建顺序（不实际构建）
pnpm tsc --build --dry --force
```

---

## 📝 Package.json 配置要求

### 库包的 package.json 必须配置

```json
{
  "name": "@dailyuse/domain-core",
  
  // 🔑 必须配置：指向构建产物
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  
  // 🔑 推荐配置：使用 exports 字段（Node.js 16+）
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./entities/*": {
      "types": "./dist/entities/*.d.ts",
      "import": "./dist/entities/*.js"
    }
  },
  
  // 🔑 确保文件被发布
  "files": [
    "dist"
  ]
}
```

**为什么重要**：
- TypeScript 通过 `types` 字段找到类型定义
- 必须指向 `dist` 目录，而不是 `src`
- `exports` 字段支持子路径导入

---

## 🎯 最佳实践总结

### ✅ 应该做的

1. **所有库启用 composite**
   ```jsonc
   {
     "compilerOptions": {
       "composite": true,
       "declaration": true,
       "declarationMap": true
     }
   }
   ```

2. **使用 references 声明依赖**
   ```jsonc
   {
     "references": [
       { "path": "../dependency-package" }
     ]
   }
   ```

3. **只配置内部 paths**
   ```jsonc
   {
     "paths": {
       "@/*": ["./src/*"]  // ✅ 只配置内部别名
     }
   }
   ```

4. **使用 watch 模式开发**
   ```bash
   pnpm tsc --build --watch
   ```

5. **在 package.json 正确配置 types**
   ```json
   {
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts"
   }
   ```

### ❌ 不应该做的

1. **不要用 paths 指向其他包的源码**
   ```jsonc
   {
     "paths": {
       "@dailyuse/utils": ["../../packages/utils/src/index.ts"]  // ❌
     }
   }
   ```

2. **不要在 tsconfig.base.json 配置 paths**
   ```jsonc
   // tsconfig.base.json
   {
     "paths": { ... }  // ❌ 不要在基础配置中配置
   }
   ```

3. **不要忘记配置 composite**
   ```jsonc
   {
     "compilerOptions": {
       // ❌ 缺少 composite: true
       "declaration": true
     }
   }
   ```

4. **不要在库的 include 中排除 src**
   ```jsonc
   {
     "exclude": ["src"]  // ❌ 这会导致无法编译
   }
   ```

5. **不要在 package.json 的 types 指向 src**
   ```json
   {
     "types": "./src/index.ts"  // ❌ 应该指向 dist
   }
   ```

---

## 🔍 故障排查

### 问题 1: 类型没有更新

**症状**：修改依赖包后，使用它的项目没有看到新类型

**检查**：
1. 依赖包是否启用了 `composite: true`？
2. 依赖包是否在 `references` 中声明？
3. 是否运行了 `tsc --build --watch`？
4. package.json 的 `types` 字段是否指向 dist？

**解决**：
```bash
# 清理缓存并重新构建
pnpm tsc --build --clean
pnpm tsc --build --force
```

### 问题 2: 编译顺序错误

**症状**：提示找不到模块或类型

**检查**：
1. `references` 配置是否正确？
2. 是否存在循环依赖？

**解决**：
```bash
# 查看构建顺序
pnpm tsc --build --dry --force

# 检查是否有循环引用错误
```

### 问题 3: IDE 性能差

**症状**：IDE 卡顿、类型检查慢

**原因**：可能还在用 paths 指向源码

**解决**：
1. 移除 paths 配置（除了内部别名）
2. 使用 composite + references
3. 确保 `skipLibCheck: true`

### 问题 4: 无法找到模块

**症状**：`Cannot find module '@dailyuse/xxx'`

**检查**：
1. package.json 是否正确配置？
   ```json
   {
     "name": "@dailyuse/xxx",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts"
   }
   ```
2. dist 目录是否存在？
3. 是否运行过构建？

**解决**：
```bash
# 构建依赖包
pnpm tsc --build packages/xxx
```

---

## 📚 参考资料

- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript Handbook - Composite](https://www.typescriptlang.org/tsconfig#composite)
- [Monorepo Best Practices](https://turbo.build/repo/docs/handbook)

---

**配置完成！** 🎉

你的 Monorepo 现在具备：
- ✅ 类型热更新（修改后自动重新编译）
- ✅ 增量编译（只编译变化部分）
- ✅ 并行构建（自动并行处理）
- ✅ IDE 智能提示（快速准确）
- ✅ 调试支持（sourceMap + declarationMap）
