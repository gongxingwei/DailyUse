# Nx 跨包更新与工作流

## 问题详情
在 monorepo（Nx）中常见的场景是：你在 `packages/contracts` 修改了类型定义，希望修改能够立即反映到依赖该 contracts 的其他包（如 `domain-core`、`domain-client`、`apps/api`、`apps/web`）中，而不需要手动拷贝或反复构建。

常见困境与根因：
- 编辑器或 tsc 报错：`File '.../packages/contracts/src/xxx' is not under 'rootDir' '.../packages/domain-client/src' (ts6059)`。
- 依赖包通过 `paths` 指向 `packages/contracts/src/index.ts`，导致消费包把 contracts 的源码纳入到自身 TypeScript program，从而触发 `rootDir` / 编译边界错误。
- 缺少明确的编译边界：未使用 Project References 时，不同包会在单个 TS program 中混淆，导致类型/编译问题以及性能下降。


## 解决方案（概览）
- 推荐使用 TypeScript Project References（配合 Nx）：把 `packages/contracts` 设为可编译的子项目（`composite: true` + `declaration: true`），其它包通过 `references` 引用它。
- 不要把 `paths` 指向其它包的 `src` 源码。要么指向已构建的 `dist/*.d.ts`，要么使用 project references。
- 在开发时使用 watch/增量构建（`tsc --build --watch` 或 Nx 的 watch）来实现“修改 contracts 后快速在消费包生效”的开发体验。


## 详细实战步骤（推荐）
下面以 `packages/contracts`、`packages/domain-core` 为例。假设 monorepo 根在 `d:/myPrograms/DailyUse`。

1) 为 `packages/contracts` 增加 tsconfig（或修改现有的）
```jsonc
// packages/contracts/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "./.tsbuildinfo"
  },
  "include": ["src/**/*"]
}
```
- `composite: true`：标记为引用型项目，要求 `declaration`。
- `outDir` 指向构建产物目录。

2) 在消费包（例如 `packages/domain-core`）的 tsconfig 中添加引用（不要把 paths 指向 contracts 的源码）
```jsonc
// packages/domain-core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "references": [
    { "path": "../contracts" }
  ],
  "include": ["src/**/*"]
}
```

3) 在根目录使用 `tsc --build` 或 Nx 构建（按引用顺序自动构建）
```powershell
pnpm -w tsc --build
# 或者使用 nx（如果配置了 build target）
pnpm nx run-many --target=build --projects=contracts,domain-core --parallel=false
```

4) 本地开发体验：同时运行 contracts 的 watch 构建以输出 `.d.ts` / dist，消费包可以在编辑器中即时看到类型变化（推荐）：
```powershell
# 在一个终端执行
pnpm -w tsc --build packages/contracts --watch
# 在另一个终端启动 domain 包或运行测试
pnpm nx serve domain-core
```


## 实战经验（踩过的坑）
- 绝不要把 `paths` 指向另一个包的 `src`，除非你清楚地想要将其源码纳入同一 program（通常会产生 rootDir 错误）。
- 如果你需要非常快速的 edit->see changes 的体验，配置 contracts 的 watch 构建并输出 `.d.ts`，把 domain 的 `paths` 指向这些 `.d.ts` 也可以（trade-off：必须先运行 watch/build）。
- Nx + Project References：和 Nx 的构建缓存（computation caching）搭配能显著提升构建速度。把 contracts 标为 composite，并确保 build target 把生成的 artifacts 放在可被引用的位置。
- 编辑器（VS Code）：若启用了 monorepo 的全局 tsserver，它会尝试把不同包的源码都纳入 program；Project References 帮助 IDE 正确识别包边界，减少噪音。


## 经验总结
- 最佳实践：在 monorepo 中把每个 package 作为独立的 TypeScript project（使用 composite + references），而不是把其它包的源码直接映射到 path 中。这样能同时保证：类型安全、开发体验、构建性能和可维护性。
- 临时方案（次优）：把 paths 指向 contracts 的编译产物（`.d.ts`），并使用 watch 构建来实现快速迭代。


## 参考信息
- TypeScript Project References: https://www.typescriptlang.org/docs/handbook/project-references.html
- Nx 官方关于 monorepo 和 TypeScript: https://nx.dev
- tsc --build 说明与 watch: https://www.typescriptlang.org/docs/handbook/compiler-options.html

