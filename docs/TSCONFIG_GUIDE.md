# tsconfig 使用详解与实战指南

## 基础概念
- tsconfig.json：TypeScript 编译器选项与包含/排除的配置文件，定义了一个 "program" 的边界。
- rootDir：源代码根目录（用于确定输出目录结构）。若某个被编译文件位于 rootDir 之外，ts 会报错（ts6059）。
- outDir：编译输出目录（`.js` / `.d.ts`）。
- composite：将当前包标记为可被引用（Project References）且必须生成 declaration 文件（`declaration: true`）。
- declaration / declarationMap：生成 `.d.ts` 和可选的 `*.d.ts.map`，供其它包在编译时消费。
- paths：用于模块路径映射（在 monorepo 中常用于把 `@dailyuse/contracts` 映射到源码或声明文件）。
- references：Project References 的键，用来声明此项目依赖的其它可编译项目（需要被引用的项目要启用 `composite`）。


## 使用指南

1) 单包（简单）项目推荐的最小 tsconfig：
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

2) Monorepo（Nx / pnpm workspace）推荐：为 library/package 使用 Project References
- contracts 包（library）应该配置为 composite：
```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```
- consumer 包引用 contracts：
```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "references": [{ "path": "../contracts" }],
  "include": ["src/**/*"]
}
```

3) 关于 `paths` 的正确用法
- 不要把 `paths` 指向另一个包的 `src` 源码（这会把目标源码纳入当前的 TS program，引起 rootDir 问题）。
- `paths` 可以指向构建产物（例如 `dist/index.d.ts`），或者仅用于 IDE 的 alias（在这种情况下还是要确保编译时引用是正确的）。

4) 增量构建与 watch
- `composite` 会自动启用增量输出（`.tsbuildinfo`）。
- 开发时推荐在 contracts 包运行 `tsc --build packages/contracts --watch`，使之输出 `.d.ts`，消费包即可在不重启编译器的情况下获得新类型（只要消费包引用 `.d.ts` 而不是源码）。


## 实战经验
- 将 `declaration` 与 `composite` 配合使用，能让 consumer 通过 `references` 安全消费 types 而不将源文件纳入同一 program。
- 当你在 VS Code 中看到 rootDir 报错时，先检查是否有 `paths` 指向别的包的源码。
- 使用 Nx 时把 library 的 build target 设为先构建 contracts，再构建其它包；Nx 的任务缓存能大幅加速重复构建。


## 经验总结
- 在 monorepo 中明确“包边界”是第一要务：使用 Project References（composite + references）而非在 paths 中跨包指向源码。
- paths 是方便的别名工具，但在 monorepo 中必须慎用：指向源码会带来类型检查噪音和 rootDir 问题。将 paths 指向声明文件或最终构建产物是更安全的选择。


## 参考信息
- TypeScript 官方：Project References — https://www.typescriptlang.org/docs/handbook/project-references.html
- tsconfig options — https://www.typescriptlang.org/tsconfig
- Nx monorepo guide — https://nx.dev

