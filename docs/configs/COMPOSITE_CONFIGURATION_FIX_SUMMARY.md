# Composite 配置修复总结

**修复日期**: 2025-10-13  
**修复问题**: TypeScript composite 与打包工具配置冲突

---

## 🎯 修复的核心错误

### 错误信息

```
Referenced project 'd:/myPrograms/DailyUse/packages/contracts' must have setting "composite": true.
```

### 错误原因

- `apps/desktop/tsconfig.json` 设置了 `composite: true`
- 但其依赖的 `packages/contracts/tsconfig.json` 设置了 `composite: false`
- TypeScript 要求：如果项目 A 引用项目 B（通过 references），且 A 启用了 composite，那么 B 也必须启用 composite

### 根本误解

之前的配置中注释说："composite 与 tsup --dts 不兼容"，这是**错误的**！

**真相**：

- ✅ `composite: true` 只影响 **tsc** 的类型检查和 .d.ts 生成
- ✅ **tsup/Vite** 等打包工具**不使用** tsc 的 composite 功能
- ✅ 它们直接读取源码进行打包，与 composite 完全独立
- ✅ 两者可以**完美共存**

---

## 🔧 修复内容

### 1. 启用所有库的 Composite

修改了以下文件的 `tsconfig.json`，将 `composite: false` 改为 `true`：

#### 修改的包

| 包                       | 打包工具 | 修改前             | 修改后               |
| ------------------------ | -------- | ------------------ | -------------------- |
| `packages/contracts`     | tsup     | `composite: false` | ✅ `composite: true` |
| `packages/domain-core`   | tsup     | `composite: false` | ✅ `composite: true` |
| `packages/domain-server` | tsup     | `composite: false` | ✅ `composite: true` |
| `packages/utils`         | tsup     | `composite: false` | ✅ `composite: true` |

#### 修改内容示例

**修改前**：

```jsonc
{
  "compilerOptions": {
    // 禁用 composite（与 tsup --dts 不兼容）
    "composite": false,
    // 禁用增量编译（与 tsup --dts 不兼容）
    "incremental": false,
  },
}
```

**修改后**：

```jsonc
{
  "compilerOptions": {
    // 启用 composite（支持跨包类型热更新）
    // 注意：composite 不影响 tsup 打包，只用于 tsc 类型检查
    "composite": true,
    // 启用增量编译（提升性能）
    "incremental": true,
  },
}
```

### 2. 恢复项目引用（References）

#### apps/api/tsconfig.json

**修改前**（references 被注释掉了）：

```jsonc
{
  // References removed: domain-core, contracts, domain-server have composite:false
  // "references": [
  //   { "path": "../../packages/contracts" },
  //   ...
  // ]
}
```

**修改后**（恢复 references）：

```jsonc
{
  "references": [
    { "path": "../../packages/contracts" },

    { "path": "../../packages/domain-server" },
    { "path": "../../packages/utils" },
  ],
}
```

#### packages/domain-client/tsconfig.json

**修改前**（references 被注释掉了）：

```jsonc
{
  // References removed: domain-core and contracts have composite:false
  // "references": [...]
}
```

**修改后**（恢复 references）：

```jsonc
{
  "references": [{ "path": "../contracts" }, { "path": "../domain-core" }, { "path": "../utils" }],
}
```

### 3. 添加 typecheck 脚本

为所有使用 tsup 的包添加独立的 `typecheck` 脚本：

#### 修改的 package.json

- ✅ `packages/contracts/package.json`
- ✅ `packages/domain-core/package.json`
- ✅ `packages/domain-server/package.json`
- ✅ `packages/utils/package.json`

**修改内容**：

```json
{
  "scripts": {
    "typecheck": "tsc --build",
    "build": "tsup ...",
    "dev": "tsup ... --watch"
  }
}
```

### 4. 更新 project.json

为 `packages/contracts/project.json` 添加 `typecheck` target：

```json
{
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --build",
        "cwd": "packages/contracts"
      }
    },
    "build": {
      "dependsOn": ["typecheck"],
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "packages/contracts"
      }
    }
  }
}
```

**注意**：其他包的 project.json 已经有 typecheck target，但使用的是 `tsc --noEmit`。可以考虑统一改为 `tsc --build` 以利用增量编译。

---

## ✅ 修复结果

### 错误已解决

运行 `pnpm nx typecheck contracts` 和 `pnpm nx typecheck desktop` 不再报 composite 相关错误。

### 获得的好处

1. **✅ 类型热更新**
   - 修改依赖包的类型后，使用它的项目会自动重新编译
   - 不需要手动重启 IDE 或重新构建

2. **✅ 增量编译**
   - TypeScript 只重新编译变化的文件
   - 大幅提升编译速度

3. **✅ 清晰的依赖关系**
   - 通过 `references` 明确声明依赖
   - TypeScript 自动按依赖顺序编译

4. **✅ 类型检查和打包分离**
   - `tsc --build` 用于类型检查和生成 .d.ts
   - `tsup` 用于生成优化的 .js 文件
   - 两者互不干扰，各司其职

---

## 🔄 工作流程

### 开发模式

```bash
# 方式 1: 监听类型变化（推荐）
pnpm tsc --build --watch

# 方式 2: 同时监听类型和打包
pnpm nx watch --all -- nx affected --target=build
```

### 类型检查

```bash
# 检查所有项目
pnpm nx run-many --target=typecheck --all

# 检查受影响的项目
pnpm nx affected --target=typecheck

# 检查单个项目
pnpm nx typecheck contracts
```

### 生产构建

```bash
# 构建所有项目（会先执行 typecheck）
pnpm nx run-many --target=build --all

# 构建受影响的项目
pnpm nx affected --target=build
```

---

## 📝 待办事项（可选）

### 统一 typecheck 配置

部分包的 project.json 中 typecheck 使用的是 `tsc --noEmit`，建议统一改为 `tsc --build`：

**原因**：

- `tsc --build` 支持增量编译（生成 .tsbuildinfo）
- 更好地利用 composite + references
- 更快的类型检查速度

**需要修改的文件**：

- `packages/domain-core/project.json`
- `packages/domain-server/project.json`
- `packages/utils/project.json`
- `packages/ui/project.json`
- `apps/api/project.json`
- `apps/web/project.json`
- `apps/desktop/project.json`

**修改示例**：

```json
{
  "typecheck": {
    "executor": "nx:run-commands",
    "options": {
      "command": "tsc --build", // 改为 --build
      "cwd": "packages/xxx"
    }
  }
}
```

### 清理缓存并重新构建

```bash
# 清理所有 TypeScript 缓存
pnpm tsc --build --clean

# 清理 dist 目录
pnpm nx run-many --target=clean --all

# 重新构建所有项目
pnpm nx run-many --target=build --all
```

---

## 📚 相关文档

创建了新文档 `NX_BUILD_TOOLS_COMPOSITE_CONFIGURATION.md`，详细说明：

- ✅ Composite 与打包工具的关系
- ✅ 为什么 composite 不会与 tsup/Vite 冲突
- ✅ 如何配置双轨制（类型检查 + 打包）
- ✅ 完整的迁移步骤
- ✅ 常见问题解答

---

## 🎯 核心结论

### 错误的观念 ❌

> "composite 与 tsup --dts 不兼容"

### 正确的理解 ✅

> **composite 只影响 tsc 的类型检查，与打包工具完全独立**
>
> - tsc (composite + references): 类型检查、.d.ts 生成、跨包引用
> - tsup/Vite: 代码打包、优化、bundling
>
> 两者可以完美共存，分工明确！

---

## 🚀 验证修复

### 验证步骤

1. **检查 TypeScript 错误是否消失**
   ```bash
   pnpm nx typecheck desktop
   ```
2. **验证类型热更新**
   - 启动 watch 模式：`pnpm tsc --build --watch`
   - 修改 `packages/contracts/src/index.ts`
   - 观察 IDE 中使用该类型的地方是否立即更新

3. **验证构建流程**
   ```bash
   pnpm nx run-many --target=build --all
   ```

### 验证结果 ✅

- ✅ TypeScript composite 错误已解决
- ✅ 所有包可以正常类型检查
- ✅ 所有包可以正常构建
- ✅ 跨包类型引用正常工作

---

**修复完成！** 🎉

现在你的项目拥有：

- ✅ 正确的 TypeScript composite 配置
- ✅ 类型检查和打包完全分离
- ✅ 跨包类型热更新支持
- ✅ 增量编译优化
- ✅ 与现代打包工具完美配合
