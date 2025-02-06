# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

# 概述

挡住进步的不一定是懒惰或躺平，也可能是频繁的遗忘和被碎片化娱乐占据时间。  

## 功能

- 文档编辑  
- todo  
- 健康提醒
- quicklaunch  
- b站等的订阅消息转发  
- 收藏页面  
- RSS  
- 动作脚本  

## 结构

my-app/
├── electron/                 # Electron 主进程核心代码
│   ├── main.ts               # 主进程入口
│   ├── windows/              # 窗口管理模块（主窗口、设置窗口等）
│   ├── core/                 # 核心逻辑（系统交互、数据库、硬件通信等）
│   ├── ipc/                  # IPC 通信模块（API 定义、事件处理）
│   └── plugins/              # 主进程插件系统（可选）
│
├── src/                      # 渲染进程 (Vue 3)
│   ├── views/                # 路由级页面组件
│   ├── components/           # 公共组件
│   ├── layouts/              # 全局布局组件
│   ├── plugins/              # 渲染进程插件系统（动态加载功能）
│   ├── stores/               # Pinia 状态管理（按模块拆分）
│   ├── router/               # 动态路由配置（支持懒加载）
│   ├── assets/               # 静态资源
│   ├── utils/                # 工具函数（网络请求、日志等）
│   └── main.ts               # 渲染进程入口
│
├── shared/                   # 共享代码（主进程和渲染进程共用）
│   ├── types/                # TypeScript 类型定义
│   ├── constants/            # 常量（路由、IPC 事件名、配置项）
│   └── interfaces/           # 通用接口（数据模型、API 响应格式）
│
├── scripts/                  # 构建/部署脚本
├── tests/                    # 单元测试 & E2E 测试
├── .env                      # 环境变量（区分开发、生产）
├── electron-builder.json     # Electron 打包配置
├── vite.config.ts            # Vite 配置（集成 Electron）
└── package.json              # 依赖管理 & NPM 脚本


my-app/
├── electron/
│   ├── main.ts
│   ├── windows/              # 窗口管理
│   │   └── quick-launch.ts   # 快速启动窗口逻辑
│   └── ipc/
│       └── quick-launch.ts   # 快速启动相关 IPC 通信
│
├── src/
│   ├── plugins/
│   │   └── quick-launch/     # 快速启动插件目录
│   │       ├── components/   # 搜索框、命令列表等 UI 组件
│   │       ├── commands/     # 内置命令插件（如打开文件、计算器等）
│   │       ├── store.ts      # Pinia 状态管理（搜索关键词、命令列表）
│   │       └── index.ts      # 插件入口（注册到全局）
│   ├── views/
│   │   └── MainLayout.vue    # 主布局组件（包含快速启动窗口的挂载点）
│   └── main.ts               # 渲染进程入口
│
└── shared/
    └── constants/
        └── ipc.ts            # IPC 通信事件名常量

# 具体实现

把 todo 、 文档编辑 作为组件，任由用户组合为 待办列表 或 goal 页面

用户可以单独编辑组件，在页面中组合

物理分割、逻辑组合

## goals

goals 和 文档编辑 切断，但保留联系，可以选择将 文档 与 goal 相绑定  
goal 属性

# 知识

## 项目结构

### 按文件类型分组（Type-Based）

```
结构示例：

src/
├── components/
├── views/
├── utils/
├── api/
├── store/
├── router/
└── assets/
优点：
简单直观：适合新手和小型项目，快速上手。

一致性高：所有组件、工具函数等按类型集中存放。

缺点：
耦合度高：功能相关的代码分散在不同目录，修改时需要跨目录操作。

难以扩展：随着项目规模增大，目录会变得臃肿。

适用场景：
小型项目（如个人博客、静态页面）。

快速原型开发。
```

### 按功能模块分组（Feature-Based）

```
结构示例：

src/
├── modules/
│   ├── User/
│   │   ├── components/
│   │   ├── store/
│   │   └── api/
│   ├── Product/
│   └── Order/
├── core/          # 全局共享代码
└── App.vue
优点：
高内聚低耦合：功能模块自包含所有代码（UI、状态、API）。

可维护性强：模块可独立开发、测试和复用。

适合团队协作：不同团队负责不同模块。

缺点：
初期复杂度高：需要设计模块边界和通信机制。

可能重复代码：不同模块间共享逻辑需抽离到 core/。

适用场景：
中大型应用（如 SaaS、ERP）。

长期迭代、多人协作项目。
```

### 领域驱动设计（DDD）

```
结构示例：

src/
├── domains/              # 领域层
│   ├── User/
│   │   ├── entities/     # 领域实体
│   │   ├── services/     # 领域服务
│   │   └── repositories/ # 数据仓库
│   └── Product/
├── infrastructure/       # 基础设施（API、数据库）
├── application/          # 应用服务（协调领域层）
└── presentation/         # UI 层（Vue 组件）
优点：
业务逻辑清晰：严格分层，核心业务与 UI/基础设施解耦。

高度可测试：领域层不依赖外部框架。

缺点：
过度设计：对简单项目来说过于复杂。

学习成本高：需理解 DDD 概念（实体、值对象、聚合根）。

适用场景：
复杂业务系统（如金融、电商平台）。

需要长期维护和演进的业务核心项目。
```

### Atomic Design（原子设计）

```
结构示例：
Copy
src/
├── atoms/        # 基础原子组件（按钮、输入框）
├── molecules/    # 分子组件（搜索框 = 输入框 + 按钮）
├── organisms/    # 有机体组件（导航栏、表单）
├── templates/    # 页面骨架
└── pages/        # 完整页面
优点：
UI 高度复用：从原子到页面逐级组合，减少重复代码。

设计一致性：强制遵循统一的 UI 规范。

缺点：
灵活性低：复杂业务组件可能难以归类。

不适合业务逻辑：仅解决 UI 分层，需结合其他结构管理状态和 API。

适用场景：
UI 密集型应用（如设计工具、门户网站）。

需要与设计团队紧密协作的项目。
```

### Monorepo（多包管理）

```
结构示例：
Copy
project/
├── apps/
│   ├── web/           # 主应用
│   └── electron/      # Electron 壳
├── packages/
│   ├── shared/        # 通用工具和类型
│   └── ui-kit/        # 独立 UI 组件库
└── package.json       # Workspace 配置
优点：
代码共享便捷：多个应用共享公共包。

依赖统一管理：避免版本冲突。

缺点：
构建复杂：需配置 Turborepo、Nx 等工具。

仓库体积大：所有代码集中在一个仓库。

适用场景：
多端应用（Web + Electron + Mobile）。

需要维护多个独立组件库或微前端模块。
```

### Electron 专属结构

```
结构示例：

src/
├── main/              # Electron 主进程
│   ├── ipc/
│   └── windows/
├── renderer/          # Vue 渲染进程
│   ├── modules/
│   └── core/
├── shared/            # 共享代码（类型、工具）
└── resources/         # 静态资源（图标、配置文件）
关键点：
进程隔离：严格分离主进程（Node.js）和渲染进程（Vue）。

IPC 规范化：通过预加载脚本安全通信。

适用场景：
跨平台桌面应用（如 IDE、数据管理工具）。
```

### 微前端架构

```
结构示例：
Copy
project/
├── app-shell/         # 基座应用（路由、全局状态）
├── app-dashboard/     # 子应用（独立仓库或模块）
└── app-admin/         # 子应用（可独立部署）
优点：
独立部署：子应用可单独开发、测试和上线。

技术栈无关：不同子应用可用不同框架。

缺点：
通信复杂：需处理跨应用状态共享和路由同步。

性能开销：资源重复加载。

适用场景：
巨型企业级应用（如阿里云控制台）。

整合遗留系统。
```

## 接口导入方式

- 按需导入  
- 全部导入  

对于小型项目，两种方式差异不大。大型项目建议使用按需导入，有利于代码分割和tree-shaking。   

## 包

- 'fs/promises'
- 'path'
- shell

