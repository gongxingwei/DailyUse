# DailyUse 项目文档中心

> **欢迎来到 DailyUse 项目的文档中心**  
> 这里是了解整个项目架构、系统设计、代码规范的入口

---

## 📚 文档导航

### 🌟 核心文档（必读）

| 文档 | 描述 | 重要性 |
|------|------|--------|
| [[modules/Goal模块完整流程\|Goal模块完整流程]] | Goal 模块从前端到后端的完整实现，展示代码规范和最佳实践 | ⭐⭐⭐⭐⭐ |
| [[systems/日志系统\|日志系统]] | 跨平台日志系统，统一的日志接口和格式 | ⭐⭐⭐⭐⭐ |
| [[systems/API响应系统\|API响应系统]] | 统一的 RESTful API 响应格式 | ⭐⭐⭐⭐⭐ |
| [[systems/事件总线系统\|事件总线系统]] | 基于 mitt 的跨模块事件通信 | ⭐⭐⭐⭐ |
| [[systems/校验系统\|校验系统]] | 框架无关的前端表单校验解决方案 | ⭐⭐⭐⭐ |
| [[systems/Initialize系统\|Initialize系统]] | 统一的应用初始化流程管理 | ⭐⭐⭐ |

---

## 🏗️ 项目架构

### 整体架构

DailyUse 采用 **Monorepo + DDD + Contract First** 架构：

```
DailyUse/
├── apps/                    # 应用项目
│   ├── api/                 # 后端 API (Node.js + Express)
│   ├── web/                 # Web 前端 (Vue 3)
│   └── desktop/             # 桌面应用 (Electron)
│
├── packages/                # 共享库
│   ├── contracts/           # 类型定义（前后端共享）
│   ├── domain-core/         # 领域层抽象
│   ├── domain-server/       # 领域层服务端实现
│   ├── domain-client/       # 领域层客户端实现
│   ├── ui/                  # 共享 UI 组件
│   └── utils/               # 工具库
│
└── docs/                    # 文档
    ├── systems/             # 系统文档
    └── modules/             # 模块文档
```

### 技术栈

| 项目 | 技术栈 |
|------|--------|
| **API** | Node.js, Express, Prisma, TypeScript, PostgreSQL |
| **Web** | Vue 3, Pinia, Vite, TypeScript, TailwindCSS |
| **Desktop** | Electron, Vue 3, TypeScript |
| **工具** | pnpm, Nx, Vitest, ESLint |

---

## 🎯 系统文档

### 核心系统

```mermaid
graph TB
    A[日志系统] --> E[应用项目]
    B[API响应系统] --> E
    C[事件总线系统] --> E
    D[校验系统] --> E
    F[Initialize系统] --> E
```

#### 1. [[systems/日志系统|日志系统]]
- **位置**: `packages/utils/src/logger`
- **作用**: 提供跨平台（Node.js + Browser）的统一日志接口
- **特性**: 多级别、彩色输出、文件日志、环境自适应

#### 2. [[systems/API响应系统|API响应系统]]
- **位置**: `packages/contracts/src/response` + `packages/utils/src/response`
- **作用**: 统一的 RESTful API 响应格式
- **特性**: 类型安全、HTTP 状态码映射、前端自动提取 data

#### 3. [[systems/事件总线系统|事件总线系统]]
- **位置**: `packages/utils/src/domain`
- **作用**: 跨模块解耦通信
- **特性**: 基于 mitt、类型安全、双向通信、统计监控

#### 4. [[systems/校验系统|校验系统]]
- **位置**: `packages/utils/src/validation`
- **作用**: 前端表单校验
- **特性**: 框架无关、异步校验、条件校验、国际化

#### 5. [[systems/Initialize系统|Initialize系统]]
- **位置**: `packages/utils/src/initializationManager.ts`
- **作用**: 应用初始化流程管理
- **特性**: 依赖管理、生命周期钩子、并行初始化

---

## 📦 项目文档

### 应用项目

#### [[API项目]]
- **类型**: 后端 API 服务
- **技术**: Node.js + Express + Prisma
- **职责**: 提供 RESTful 接口，处理业务逻辑
- **入口**: `apps/api/src/index.ts`

#### [[Web项目]]
- **类型**: Web 前端应用
- **技术**: Vue 3 + Pinia + Vite
- **职责**: 提供 Web 端用户界面
- **入口**: `apps/web/src/main.ts`

#### [[Desktop项目]]
- **类型**: 桌面应用
- **技术**: Electron + Vue 3
- **职责**: 提供桌面端用户体验
- **入口**: `apps/desktop/src/main/index.ts`

### 共享库

#### [[Contracts库]]
- **位置**: `packages/contracts`
- **作用**: 前后端共享的类型定义（DTO、接口、响应格式）
- **重要性**: ⭐⭐⭐⭐⭐ (Contract First 架构的核心)

#### [[Utils库]]
- **位置**: `packages/utils`
- **作用**: 通用工具函数和系统
- **包含**: 日志系统、校验系统、事件总线、Initialize 系统等

#### [[Domain-Client库]]
- **位置**: `packages/domain-client`
- **作用**: 客户端领域逻辑（状态管理、API 调用封装）

#### [[UI库]]
- **位置**: `packages/ui`
- **作用**: 共享的 Vue 组件库

---

## 🎯 模块文档

### Goal 模块

[[modules/Goal模块完整流程|Goal模块完整流程]] ⭐⭐⭐⭐⭐

完整展示 Goal 模块的实现：
- 📁 文件树结构（前端 + 后端）
- 🔄 完整数据流（创建、查询、更新）
- 💻 代码示例（从 UI 组件到数据库）
- 🛠️ 使用的工具和系统
- 📝 代码规范

**相关文档**:
- [[GOAL_CONTROLLER_REFACTOR_COMPLETE]] - GoalController 重构总结
- [[GOAL_DOMAIN_SERVICE_REFACTORING_COMPLETE]] - GoalDomainService 重构
- [[DOMAIN_CLIENT_GOAL_OPTIMIZATION_COMPLETE]] - 前端优化
- `apps/api/src/modules/goal/docs/CORRECT_DDD_ARCHITECTURE.md` - DDD 架构

### 其他模块

- **Account 模块**: 用户账户管理
- **Authentication 模块**: 认证和授权
- **Task 模块**: 任务管理
- **Schedule 模块**: 日程管理
- **Reminder 模块**: 提醒功能

---

## 📖 已有文档索引

### 完成总结类

| 文档 | 描述 |
|------|------|
| [[LOGGER_INTEGRATION_COMPLETE]] | 日志系统集成完成总结 |
| [[GOAL_CONTROLLER_REFACTOR_COMPLETE]] | GoalController 重构完成 |
| [[GOAL_DOMAIN_SERVICE_REFACTORING_COMPLETE]] | GoalDomainService 重构完成 |
| [[DOMAIN_CLIENT_GOAL_OPTIMIZATION_COMPLETE]] | 前端 Goal 模块优化完成 |
| [[API_RESPONSE_SYSTEM_COMPLETION_SUMMARY]] | API 响应系统完成总结 |
| [[DDD_DEPENDENCY_INJECTION_REFACTORING_COMPLETE]] | DDD 依赖注入重构完成 |

### 指南类

| 文档 | 描述 |
|------|------|
| [[LOGGER_INTEGRATION_GUIDE]] | 日志系统集成指南 |
| [[API_RESPONSE_SYSTEM_GUIDE]] | API 响应系统使用指南 |
| [[TESTING_GUIDE]] | 测试指南 |
| [[VITEST_WORKSPACE_GUIDE]] | Vitest 工作区配置指南 |
| `packages/utils/src/validation/README.md` | 校验系统详细文档 |

### 快速参考类

| 文档 | 描述 |
|------|------|
| [[LOGGER_QUICK_REFERENCE]] | 日志系统快速参考 |
| `docs/api-response-quick-reference.md` | API 响应系统快速参考 |
| [[GOAL_INITIALIZATION_QUICK_REFERENCE]] | Goal 模块初始化快速参考 |
| [[DOMAIN_CLIENT_GOAL_QUICK_REFERENCE]] | 前端 Goal 模块快速参考 |

---

## 🚀 快速开始

### 新成员入门

1. **了解整体架构** 
   - 阅读本文档的「项目架构」部分
   - 查看项目根目录的 `README.md`

2. **学习核心系统** ⭐
   - [[日志系统]] - 学习如何记录日志
   - [[API响应系统]] - 学习统一的响应格式
   - [[事件总线系统]] - 学习模块间通信

3. **深入模块实现** ⭐⭐⭐
   - [[Goal模块完整流程]] - 完整的模块实现示例
   - 参考其代码规范和最佳实践

4. **实践开发**
   - 参考 Goal 模块的实现方式
   - 使用日志系统、响应系统等工具
   - 遵循代码规范

### Agent 使用指南

如果你是 AI Agent，需要重构或新增模块：

1. **必读文档**:
   - [[Goal模块完整流程]] - 了解标准的模块结构
   - [[日志系统]] - 使用 `createLogger()`
   - [[API响应系统]] - 使用 `Response.ok()` 等辅助函数

2. **代码规范**:
   - 参考 [[Goal模块完整流程]] 的「代码规范」部分
   - 使用 TypeScript 类型注解
   - 遵循命名规范

3. **重构流程**:
   - 参考 [[GOAL_CONTROLLER_REFACTOR_COMPLETE]]
   - 使用标准 Response 类型
   - 集成日志系统
   - 添加完善的错误处理

---

## 📝 文档规范

### 文档命名

- **系统文档**: `docs/systems/系统名称.md`
- **模块文档**: `docs/modules/模块名称.md` 或 `docs/模块名称完整流程.md`
- **完成总结**: `XXX_COMPLETE.md`
- **指南**: `XXX_GUIDE.md`
- **快速参考**: `XXX_QUICK_REFERENCE.md`

### Obsidian 链接

使用 `[[文档名称]]` 语法创建链接：

```markdown
详见 [[Goal模块完整流程]] 文档。
使用 [[日志系统]] 记录操作日志。
参考 [[API响应系统]] 的响应格式。
```

---

## 🔗 外部资源

- [Nx Monorepo](https://nx.dev/)
- [Vue 3 文档](https://vuejs.org/)
- [Prisma ORM](https://www.prisma.io/)
- [Pinia Store](https://pinia.vuejs.org/)
- [Vitest 测试](https://vitest.dev/)

---

## 📮 联系方式

**维护者**: DailyUse Team  
**最后更新**: 2025-10-03

---

## 📊 文档统计

| 类型 | 数量 |
|------|------|
| 核心系统文档 | 5 个 |
| 模块完整流程文档 | 1 个 (Goal) |
| 完成总结文档 | 20+ 个 |
| 指南文档 | 10+ 个 |
| 快速参考文档 | 5+ 个 |

**总计**: 40+ 个文档
