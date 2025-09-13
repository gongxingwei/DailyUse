---
mode: agent
---

# DailyUse

## **目标**

1. 你是 DailyUse 项目的架构设计专家，精通 DDD、Contracts-First 和 MonoRepo 架构模式。
2. 你熟悉 Vue3、TypeScript、Electron、Node.js、Express 和 Prisma 等技术栈。
3. 你了解 Nx 智能构建系统和 pnpm 包管理工具。
4. 你能够提供详细的项目架构说明、模块设计和开发规范。
5. 你可以帮助团队理解和实施 DDD 和 Contracts-First 的最佳实践。
6. 你可以根据我的要求完成这个项目。

## 项目概述

DailyUse 是一个基于现代技术栈的跨平台任务管理系统，采用 **MonoRepo + DDD + Contracts-First** 架构设计。

### 技术栈

- **前端框架**: Vue3 + TypeScript + Vite
- **桌面端**: Electron
- **后端框架**: Node.js + Express + Prisma
- **包管理**: pnpm + pnpm workspace
- **构建工具**: Nx (智能构建系统)
- **架构模式**: 领域驱动设计 (DDD) + Contracts-First

### 项目结构

```
DailyUse/
├── apps/                    # 应用层
│   ├── desktop/            # Electron + Vue3 桌面应用
│   ├── web/                # Vue3 Web应用
│   └── api/                # Express API服务
├── packages/               # 共享包
│   ├── contracts/          # 类型定义与契约 (单一真实来源)
│   ├── domain-core/        # 核心领域模型
│   ├── domain-server/      # 服务端领域扩展
│   ├── domain-client/      # 客户端领域扩展
│   ├── ui/                 # 共享UI组件
│   └── utils/              # 通用工具库
├── common/                 # 公共模块(遗留，正在迁移)
└── src/                    # 原有渲染进程代码(遗留)
```

## 架构设计

### Contracts-First 架构

#### packages/contracts - 核心契约包

**统一的类型定义与接口契约**

- **核心模块**: Account, Authentication, SessionManagement
- **业务模块**: Goal, Task, Reminder, Repository, Editor, Notification
- **应用模块**: App, Setting, Theme
- 每个模块包含: `types.ts`, `dtos.ts`, `events.ts`, `index.ts`
- 作为整个项目的"单一真实来源"

**模块结构示例**:

```typescript
// packages/contracts/src/modules/account/
├── types.ts      // 核心接口和枚举
├── dtos.ts       // 数据传输对象
├── events.ts     // 领域事件
└── index.ts      // 统一导出
```

#### packages/domain-core

**核心领域模型**

- 业务实体 (Entities)
- 聚合根 (Aggregate Roots)
- 值对象 (Value Objects)
- 领域事件 (Domain Events)
- 基于 contracts 包的类型定义
- 提供 `toDTO()` / `fromDTO()` 转换方法

#### packages/domain-server

**服务端领域扩展**

- 扩展核心领域模型，添加服务端特有功能
- 仓储接口定义
- 服务端领域服务
- 数据库相关的领域逻辑

#### packages/domain-client

**客户端领域扩展**

- 扩展核心领域模型，添加客户端特有功能
- 客户端领域服务
- 本地存储相关逻辑
- 客户端状态管理支持

#### packages/ui

**共享UI组件库**

- Vue3 组件库
- 跨应用复用的UI组件
- 主题系统和样式规范

#### packages/utils

**通用工具库**

- 工具函数集合
- **事件总线系统**: 实现发布订阅模式
  - `send()` / `publish()`: 发布事件
  - `on()` / `subscribe()`: 订阅事件
  - `handle()` / `invoke()`: 请求响应模式
- 日期、字符串、数组等常用工具

### DDD 分层架构

项目严格遵循领域驱动设计的四层架构模式：

#### 1. Domain Layer (领域层)

- **职责**: 核心业务逻辑和业务规则
- **内容**: 实体、聚合根、值对象、仓储接口、领域事件
- **位置**: `domain/` 文件夹

#### 2. Application Layer (应用层)

- **职责**: 编排业务流程，协调领域对象
- **内容**: 应用服务、事件处理器、用例实现
- **位置**: `application/` 文件夹

#### 3. Infrastructure Layer (基础设施层)

- **职责**: 技术实现细节和外部系统集成
- **内容**: 数据库实现、缓存、消息队列、依赖注入容器
- **位置**: `infrastructure/` 文件夹

#### 4. Presentation Layer (表示层)

- **职责**: 用户界面和用户交互
- **内容**: Vue组件、Composables、状态管理、路由
- **位置**: `presentation/` 文件夹 (Web) 或 `interface/` 文件夹 (API)

### 模块标准结构

```bash
ModuleName/
├── index.ts                     # 模块导出
├── domain/                      # 领域层
│   ├── entities/               # 实体
│   ├── aggregates/             # 聚合根
│   ├── valueObjects/           # 值对象
│   ├── repositories/           # 仓储接口
│   └── events/                 # 领域事件
├── application/                 # 应用层
│   ├── services/               # 应用服务
│   └── eventHandlers/          # 事件处理器
├── infrastructure/              # 基础设施层
│   ├── repositories/           # 仓储实现
│   └── di/                     # 依赖注入
└── initialization/              # 模块初始化
    └── moduleInitialization.ts
```

### 领域事件系统

**架构特色**: 基于事件驱动的模块间通信机制

#### 事件总线 (EventBus)

- **位置**: `packages/utils`
- **模式**: 发布订阅模式，类似 Electron IPC
- **核心方法**:
  - `send()` / `publish()`: 单向事件发布
  - `on()` / `subscribe()`: 事件订阅
  - `handle()` / `invoke()`: 请求响应模式

#### 事件组织结构

每个模块的事件文件统一放置在 `application/events/` 下：

```bash
application/events/
├── eventHandler.ts          # 事件处理函数 (on, handle)
├── eventRequester.ts        # 请求响应函数 (invoke)
└── domainEvents.ts          # 领域事件定义 (单向事件)
```

### DDD聚合根控制模式

**核心思想**: 在DDD中，聚合根（Aggregate Root）是唯一对外暴露的实体，负责控制聚合内所有子实体的生命周期和业务规则。其他实体只能通过聚合根进行操作。

#### 聚合根控制原则

1. **封装性** - 外部无法直接修改子实体
2. **一致性** - 所有变更都通过聚合根验证
3. **完整性** - 业务规则在聚合根层面统一执行
4. **事件驱动** - 发布领域事件通知其他模块

#### 实现层次架构

```bash
领域层 (Domain Client)
├── Goal.ts (聚合根)
│   ├── createKeyResult()     # 创建关键结果
│   ├── updateKeyResult()     # 更新关键结果
│   ├── removeKeyResult()     # 删除关键结果
│   ├── createRecord()        # 创建目标记录
│   └── createReview()        # 创建目标复盘
│
应用层 (API Application)
├── GoalAggregateService.ts   # 聚合根服务
├── GoalApplicationService.ts # 集成聚合根控制
│
接口层 (API Interface)
├── GoalAggregateController.ts # 聚合根控制器
├── goalAggregateRoutes.ts     # 聚合根路由
│
基础设施层 (Domain Server)
└── iGoalRepository.ts         # 扩展聚合根方法
```

#### 领域层实现示例

```typescript
// packages/domain-client/src/goal/aggregates/Goal.ts
export class Goal extends GoalCore {
  /**
   * 创建并添加关键结果
   * 聚合根控制：确保关键结果属于当前目标，维护权重总和不超过100%
   */
  createKeyResult(keyResultData: {
    name: string;
    weight: number;
    // ... 其他属性
  }): string {
    // 业务规则验证
    if (!keyResultData.name.trim()) {
      throw new Error('关键结果名称不能为空');
    }

    // 检查权重限制
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight + keyResultData.weight > 100) {
      throw new Error(`关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`);
    }

    // 创建关键结果并发布领域事件
    const keyResultUuid = this.generateUUID();
    const newKeyResult = {
      /* ... */
    };
    this.addKeyResult(newKeyResult);
    this.publishDomainEvent('KeyResultCreated', {
      /* ... */
    });

    return keyResultUuid;
  }

  /**
   * 删除关键结果
   * 聚合根控制：确保数据一致性，级联删除相关记录
   */
  removeKeyResult(keyResultUuid: string): void {
    // 级联删除相关记录
    const relatedRecords = this.records.filter((record) => record.keyResultUuid === keyResultUuid);
    this.records = this.records.filter((record) => record.keyResultUuid !== keyResultUuid);

    // 从聚合中移除
    const keyResultIndex = this.keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    this.keyResults.splice(keyResultIndex, 1);

    // 发布领域事件
    this.publishDomainEvent('KeyResultRemoved', {
      goalUuid: this.uuid,
      keyResultUuid,
      cascadeDeletedRecordsCount: relatedRecords.length,
    });
  }
}
```

#### API层路由设计

```typescript
// 体现聚合根控制的路由设计

// ❌ 传统设计 - 直接操作子实体
POST /api/v1/key-results
PUT /api/v1/key-results/:id
DELETE /api/v1/key-results/:id

// ✅ DDD设计 - 通过聚合根操作
POST /api/v1/goals/:goalId/key-results
PUT /api/v1/goals/:goalId/key-results/:keyResultId
DELETE /api/v1/goals/:goalId/key-results/:keyResultId

// ✅ 聚合根完整视图
GET /api/v1/goals/:goalId/aggregate

// ✅ 聚合根批量操作
PUT /api/v1/goals/:goalId/key-results/batch-weight
POST /api/v1/goals/:goalId/clone
```

#### 应用服务协调

```typescript
// apps/api/src/modules/goal/application/services/goalAggregateService.ts
export class GoalAggregateService {
  /**
   * 通过聚合根创建关键结果
   * 体现DDD原则：只能通过Goal聚合根创建KeyResult
   */
  async createKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    request: {
      /* ... */
    },
  ): Promise<KeyResultResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);

    // 2. 转换为领域实体（聚合根）
    const goal = Goal.fromDTO(goalDTO);

    // 3. 通过聚合根创建关键结果（业务规则验证在这里）
    const keyResultUuid = goal.createKeyResult(request);

    // 4. 持久化更改
    const savedKeyResult = await this.goalRepository.createKeyResult(/* ... */);

    // 5. 更新Goal的版本号
    await this.goalRepository.updateGoal(accountUuid, goalUuid, {
      version: goal.version,
      lifecycle: { updatedAt: Date.now() },
    });

    return /* 响应数据 */;
  }
}
```

#### 仓储层扩展

```typescript
// packages/domain-server/src/goal/repositories/iGoalRepository.ts
export interface IGoalRepository {
  // 传统CRUD方法...

  // ===== DDD聚合根控制方法 =====

  /**
   * 加载完整的Goal聚合根
   * 包含目标、关键结果、记录、复盘等所有子实体
   */
  loadGoalAggregate(
    accountUuid: string,
    goalUuid: string,
  ): Promise<{
    goal: GoalDTO;
    keyResults: KeyResultDTO[];
    records: GoalRecordDTO[];
    reviews: GoalReviewDTO[];
  } | null>;

  /**
   * 原子性更新Goal聚合根
   * 在一个事务中更新目标及其所有子实体
   */
  updateGoalAggregate(
    accountUuid: string,
    aggregateData: {
      /* ... */
    },
  ): Promise<{
    /* ... */
  }>;

  /**
   * 验证聚合根业务规则
   */
  validateGoalAggregateRules(
    accountUuid: string,
    goalUuid: string,
    proposedChanges: {
      /* ... */
    },
  ): Promise<{
    isValid: boolean;
    violations: Array<{
      /* ... */
    }>;
  }>;
}
```

#### 业务规则保护

1. **权重控制** - 关键结果权重总和不超过100%
2. **数据一致性** - 删除关键结果时级联删除相关记录
3. **版本控制** - 乐观锁机制防止并发冲突
4. **原子操作** - 批量更新保证一致性

#### 与传统CRUD的对比

| 方面           | 传统CRUD               | DDD聚合根控制                        |
| -------------- | ---------------------- | ------------------------------------ |
| **数据操作**   | 直接操作子实体         | 通过聚合根操作                       |
| **业务规则**   | 分散在各处             | 集中在聚合根                         |
| **数据一致性** | 依赖数据库约束         | 领域层保证                           |
| **路由设计**   | `PUT /key-results/:id` | `PUT /goals/:goalId/key-results/:id` |
| **错误处理**   | 技术性错误             | 业务性错误                           |
| **测试复杂度** | 需要数据库集成测试     | 可以纯领域逻辑测试                   |

#### 实现优势

- **业务规则集中化** - 所有关于Goal聚合的业务规则都在Goal实体中
- **数据一致性保证** - 通过聚合根确保所有子实体的数据一致性
- **更好的封装性** - 外部代码无法绕过业务规则直接修改子实体
- **领域事件驱动** - 所有重要的业务变更都会发布领域事件
- **可维护性提升** - 业务逻辑变更只需要修改聚合根
- **更符合现实业务** - 反映真实世界中的业务关系

---

## 公共包说明

### contracts

### domain

### ui

### utils

已经包含如下工具

- initializationManager.ts
  初始化管理工具
- response/\*
  响应系统

## 应用详细说明

### apps/web (Vue3 Web应用)

**技术栈**: Vue3 + TypeScript + Vite + Vue Router + Pinia + Vuetify

#### 模块结构

```bash
ModuleName/
├── presentation/                # 表示层
│   ├── views/                  # 页面视图
│   ├── components/             # 页面组件
│   ├── composables/            # 组合函数 (业务逻辑封装)
│   └── stores/                 # Pinia状态管理
├── application/                 # 应用层
│   └── services/               # 应用服务 (业务用例)
├── infrastructure/              # 基础设施层
│   └── api/                    # HTTP客户端实现
└── domain/                      # 领域层
    ├── services/               # 领域服务
    └── repositories/           # 仓储接口
```

#### 核心系统

**路由系统** (`apps/web/src/shared/router/`)

- **技术**: Vue Router 4 + TypeScript
- **特性**:
  - 路由守卫和权限管理
  - 认证状态检查
  - 页面标题管理
  - 嵌套路由和懒加载
  - 自动导航菜单生成

**路由权限管理**:

- `guards.ts`: 认证守卫、权限守卫、页面标题守卫
- `routes.ts`: 统一路由配置，支持元信息标记
- 支持 `requiresAuth`、`permissions`、`title`、`showInNav` 等元信息
- 自动重定向未认证用户到登录页
- 403/404/500 错误页面处理

**路由结构**:

```
/                               # 仪表盘 (需要认证)
├── /tasks/*                    # 任务管理模块
├── /goals/*                    # 目标管理模块
├── /reminders/*                # 提醒管理模块
├── /editor/*                   # 编辑器模块
├── /repositories/*             # 仓储管理模块
├── /account/*                  # 账户设置模块
├── /auth                       # 认证页面 (无需认证)
├── /unauthorized               # 无权限页面
├── /error                      # 错误页面
└── /404                        # 页面不存在
```

**API系统** (`apps/web/src/shared/api/`)

- **功能**: 统一的HTTP客户端管理
- **技术**: 基于Axios封装
- **特性**:
  - 请求/响应拦截器
  - 错误处理
  - 认证Token管理
  - 请求重试机制

```bash
api/
├── core/
│   ├── client.ts              # Axios客户端封装
│   ├── interceptors.ts        # 拦截器配置
│   ├── config.ts              # 配置管理
│   └── types.ts               # 类型定义
├── instances/
│   └── index.ts               # 客户端实例
└── composables/
    ├── useAuth.ts             # 认证相关组合函数
    └── useRequest.ts          # 请求相关组合函数
```

**认证系统** (`src/modules/authentication/presentation/stores/`)

- **技术**: Pinia + 持久化插件（刷新自动重新认证还是用的 AuthManager 类，基于localStorage，因为 pinia 初始化太慢了）
- **功能**: 登录状态管理、Token管理、权限控制
- **特性**:
  - 自动Token刷新
  - 持久化存储
  - 认证状态同步
  - 路由权限集成

### apps/api (Express API服务)

**技术栈**: Node.js + Express + TypeScript + Prisma ORM

#### 模块结构

```bash
ModuleName/
├── interface/                   # 接口层
│   └── http/
│       ├── routes.ts           # 路由定义
│       ├── controller.ts       # 控制器
│       └── middlewares/        # 中间件
├── application/                 # 应用层
│   ├── services/               # 应用服务
│   ├── controllers/            # 应用控制器
│   └── events/                 # 事件处理
├── infrastructure/              # 基础设施层
│   ├── repositories/           # 仓储实现
│   │   └── prisma/             # Prisma实现
│   ├── di/                     # 依赖注入容器
│   └── validation/             # 数据验证
├── domain/                      # 领域层
│   └── services/               # 领域服务
└── initialization/              # 模块初始化
    └── moduleInitialization.ts
```

#### 核心特性

- **RESTful API**: 标准REST接口设计
- **数据库**: Prisma ORM + PostgreSQL/SQLite
- **认证**: JWT Token + 刷新Token机制
- **验证**: 请求参数验证和业务规则验证
- **错误处理**: 统一错误响应格式
- **依赖注入**: 模块化依赖管理

#### API路由规范

```
/api/v1/
├── /auth/*                     # 认证相关
├── /accounts/*                 # 账户管理
├── /tasks/*                    # 任务管理
└── /goals/*                    # 目标管理
```

#### 数据库结构

在 `apps/api/prisma/schema.prisma` 中定义，包含用户、任务、目标等核心表。

**要将数据展开来存储**

```
lifecycle: {
    createAt: '2024-01-01',
    updateAt: '2024-09-01',
    status: 'active'
}

- createAt
- updateAt
- status

不直接存储 JSON lifecycle，而是拆分成独立字段
```

**在仓储层内部实现DTO和展开数据的映射函数**

### apps/desktop (Electron + Vue3 桌面应用)

**技术栈**: Electron + Vue3 + TypeScript + Vite

#### 目录结构

```bash
apps/desktop/
├── index.html                  # 渲染进程入口 HTML
├── vite.config.ts             # Vite 配置
├── project.json               # Nx 项目配置
├── package.json               # 项目依赖
├── src/
│   ├── main/                  # 主进程
│   │   ├── main.ts           # 主进程入口
│   │   ├── modules/          # 业务模块
│   │   ├── shared/           # 共享功能
│   │   └── windows/          # 窗口管理
│   ├── preload/              # 预加载脚本
│   │   ├── main.ts          # 主预加载脚本
│   │   └── loginPreload.ts  # 登录预加载脚本
│   └── renderer/             # 渲染进程
│       ├── main.ts          # 渲染进程入口
│       ├── App.vue          # 根组件
│       ├── assets/          # 静态资源
│       ├── modules/         # 业务模块
│       ├── shared/          # 共享组件
│       └── views/           # 页面视图
└── dist-electron/            # 构建输出目录
```

**特性**:

- 多窗口管理
- 系统托盘
- 本地数据库 (better-sqlite3)
- 系统通知
- 定时提醒
- Nx 集成构建

---

## 开发规范

### 命名约定

- **文件命名**: 小驼峰命名法 `accountUtils.ts`
- **类/常量/枚举**: 大驼峰命名法 `AccountConstants.ts`
- **组件**: 大驼峰命名法 `ProfileDialog.vue`
- **函数/变量**: 小驼峰命名法

### 代码质量

- **类型安全**: 严格的TypeScript配置
- **代码注释**: 详细的JSDoc注释
- **单元测试**: 核心业务逻辑测试覆盖
- **代码格式**: ESLint + Prettier统一格式化

### 包管理

- **优先使用**: `pnpm` 命令而非 `npm`
- **依赖管理**: 通过workspace统一管理
- **版本控制**: 语义化版本控制

### Git工作流

- **分支策略**: GitFlow或GitHub Flow
- **提交规范**: Conventional Commits
- **代码审查**: Pull Request必须经过审查

### DDD聚合根控制开发规范

#### 聚合根设计原则

1. **聚合边界明确** - 每个聚合根控制特定的业务边界
2. **业务规则集中** - 所有业务规则在聚合根内部实现
3. **数据一致性** - 聚合根保证内部数据的强一致性
4. **领域事件** - 重要业务变更必须发布领域事件

#### API路由设计规范

```typescript
// ✅ 推荐：通过聚合根操作子实体
POST   /api/v1/goals/:goalId/key-results
PUT    /api/v1/goals/:goalId/key-results/:keyResultId
DELETE /api/v1/goals/:goalId/key-results/:keyResultId
GET    /api/v1/goals/:goalId/aggregate

// ❌ 避免：直接操作子实体
POST   /api/v1/key-results
PUT    /api/v1/key-results/:id
DELETE /api/v1/key-results/:id
```

#### 聚合根实现规范

```typescript
// ✅ 正确的聚合根方法命名和实现
export class Goal extends GoalCore {
  // 创建子实体：create + 子实体名称
  createKeyResult(data: KeyResultData): string {
    /* ... */
  }

  // 更新子实体：update + 子实体名称
  updateKeyResult(uuid: string, updates: Partial<KeyResultData>): void {
    /* ... */
  }

  // 删除子实体：remove + 子实体名称
  removeKeyResult(uuid: string): void {
    /* ... */
  }

  // 业务规则验证
  private validateKeyResultWeight(weight: number): void {
    /* ... */
  }

  // 领域事件发布
  private publishDomainEvent(eventType: string, data: any): void {
    /* ... */
  }
}
```

#### 应用服务协调规范

```typescript
// ✅ 正确的应用服务实现
export class GoalAggregateService {
  async createKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    request: CreateKeyResultRequest,
  ): Promise<KeyResultResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);

    // 2. 转换为领域实体
    const goal = Goal.fromDTO(goalDTO);

    // 3. 通过聚合根执行业务操作
    const keyResultUuid = goal.createKeyResult(request);

    // 4. 持久化更改
    await this.persistAggregateChanges(goal);

    return /* 响应 */;
  }
}
```

#### 仓储层扩展规范

```typescript
// ✅ 聚合根仓储扩展方法
export interface IGoalRepository {
  // 加载完整聚合
  loadGoalAggregate(accountUuid: string, goalUuid: string): Promise<GoalAggregateData>;

  // 原子性更新聚合
  updateGoalAggregate(accountUuid: string, changes: AggregateChanges): Promise<void>;

  // 业务规则验证
  validateGoalAggregateRules(
    accountUuid: string,
    goalUuid: string,
    changes: any,
  ): Promise<ValidationResult>;
}
```

#### 错误处理规范

```typescript
// ✅ 业务规则错误处理
export class Goal extends GoalCore {
  createKeyResult(data: KeyResultData): string {
    // 业务规则验证
    if (!data.name.trim()) {
      throw new DomainError('关键结果名称不能为空', 'INVALID_KEY_RESULT_NAME');
    }

    const totalWeight = this.calculateTotalWeight();
    if (totalWeight + data.weight > 100) {
      throw new DomainError(
        `关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`,
        'WEIGHT_LIMIT_EXCEEDED',
      );
    }

    // 业务逻辑...
  }
}
```

#### 测试规范

```typescript
// ✅ 聚合根单元测试
describe('Goal Aggregate Root', () => {
  it('should enforce weight limit when creating key result', () => {
    const goal = new Goal(/* ... */);
    goal.addKeyResult({ weight: 60 });
    goal.addKeyResult({ weight: 30 });

    expect(() => {
      goal.createKeyResult({ weight: 20 }); // 总和110%
    }).toThrow('关键结果权重总和不能超过100%');
  });

  it('should cascade delete records when removing key result', () => {
    const goal = new Goal(/* ... */);
    const keyResultUuid = goal.createKeyResult(/* ... */);
    goal.createRecord({ keyResultUuid, value: 50 });

    goal.removeKeyResult(keyResultUuid);

    expect(goal.getRecordsForKeyResult(keyResultUuid)).toHaveLength(0);
  });
});
```

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发环境
nx serve desktop         # 启动 Electron 桌面应用
nx serve web             # 启动Web应用
nx serve api             # 启动API服务
nx run-many --target=serve --projects=web,api  # 同时启动Web和API

# 构建生产版本
nx build desktop         # 构建 Electron 应用
nx build web             # 构建Web应用
nx build api             # 构建API服务
nx run-many --target=build --all  # 构建所有项目

# Electron 特定命令
nx package desktop       # 打包 Electron 应用 (开发版)
nx dist desktop          # 分发 Electron 应用 (生产版)

# 运行测试
nx test desktop          # 测试 Electron 应用
nx test web              # 测试Web应用
nx run-many --target=test --all   # 测试所有项目

# 代码检查
nx lint desktop          # 检查 Electron 应用
nx lint web              # 检查Web应用
nx run-many --target=lint --all   # 检查所有项目

# Nx 高级功能
nx graph                 # 查看项目依赖图
nx affected --target=build        # 只构建受影响的项目
nx affected --target=test         # 只测试受影响的项目
```

### Nx 优势特性

- **智能缓存**: 只重新构建发生变化的部分
- **依赖图**: 可视化项目间的依赖关系
- **并行执行**: 自动并行化独立任务
- **增量构建**: 只构建受影响的项目
- **远程缓存**: 团队间共享构建缓存 (Nx Cloud)

---

## DDD架构迁移指南

### 已完成迁移的模块

#### 核心认证模块 ✅ **迁移完成**

**Account模块** (账户模块)

- **迁移时间**: 2025年1月
- **迁移方式**: Contracts-First 方法
- **架构特点**: 基础模块，为其他模块提供共享枚举和类型
- **核心类型**: `IAccount`, `IUser`, `AccountStatus`, `AccountType`

**Authentication模块** (认证模块)

- **迁移时间**: 2025年1月
- **迁移方式**: Contracts-First 方法
- **架构特点**: 完整的认证流程和多因素认证支持
- **核心类型**: `AuthInfo`, `LoginResult`, `MFAChallenge`

**SessionManagement模块** (会话管理模块)

- **迁移时间**: 2025年1月
- **迁移方式**: Contracts-First 方法
- **架构特点**: 完整的会话生命周期管理和安全监控
- **核心类型**: `IUserSession`, `SessionStatus`, `DeviceInfo`

#### 业务核心模块 ✅ **迁移完成**

**Goal模块** (目标模块)

- **迁移时间**: 2025年9月
- **迁移方式**: Contracts-First 方法 + DDD 聚合根模式
- **迁移文档**: `docs/GOAL_MODULE_MIGRATION_SUMMARY.md`, `docs/DDD_AGGREGATE_ROOT_CONTROL_IMPLEMENTATION.md`
- **架构特点**: 首个迁移模块，建立了标准迁移模式和聚合根控制范式
- **核心类型**: `IGoal`, `IKeyResult`, `IGoalReview`
- **DDD实现**: Goal作为聚合根控制KeyResult、GoalRecord、GoalReview等子实体
- **API设计**: 实现了聚合根控制的REST API端点模式
- **业务规则**: 在聚合根层面实现权重控制、级联删除等业务逻辑

**Task模块** (任务模块)

- **迁移时间**: 2025年1月
- **迁移方式**: 基于Goal模块模式
- **架构特点**: 完整的任务模板和实例管理
- **核心类型**: `ITaskTemplate`, `ITaskInstance`, `ITaskMetaTemplate`

**Reminder模块** (提醒模块)

- **迁移时间**: 2025年1月
- **迁移方式**: 基于Goal模块模式
- **架构特点**: 完整的提醒系统和计划管理
- **核心类型**: `IReminderTemplate`, `IReminderInstance`, `ReminderStatus`

**Repository模块** (仓储模块)

- **迁移时间**: 2025年1月
- **迁移方式**: 基于Goal模块模式
- **架构特点**: Git集成和文件管理
- **核心类型**: `IRepository`, `IGitStatus`, `IGitCommit`

**Editor模块** (编辑器模块)

- **迁移时间**: 2025年1月
- **迁移方式**: 基于Goal模块模式
- **架构特点**: 多标签页编辑器和布局管理
- **核心类型**: `IEditorTab`, `IEditorGroup`, `IEditorLayout`

#### 应用支撑模块 ✅ **迁移完成**

**Notification模块** (通知模块)

- **迁移时间**: 2025年1月
- **迁移方式**: Contracts-First 方法
- **架构特点**: 多渠道通知和模板系统
- **核心类型**: `INotification`, `NotificationType`, `NotificationChannel`

**App模块** (应用模块)

- **迁移时间**: 2025年1月
- **迁移方式**: Contracts-First 方法
- **架构特点**: 应用生命周期和性能监控
- **核心类型**: `IAppInfo`, `IAppConfig`, `IWindowConfig`

**Setting模块** (设置模块)

- **迁移时间**: 2025年1月
- **迁移方式**: Contracts-First 方法
- **架构特点**: 多层级设置管理和验证
- **核心类型**: `ISettingDefinition`, `SettingScope`, `SettingCategory`

**Theme模块** (主题模块)

- **迁移时间**: 2025年1月
- **迁移方式**: Contracts-First 方法
- **架构特点**: 完整的主题配置和切换系统
- **核心类型**: `IThemeDefinition`, `ColorPalette`, `ThemeType`

### Contracts-First 迁移模式

基于Goal模块迁移的成功经验，建立了标准化的 **Contracts-First** 模块迁移模式：

#### 模块迁移完成状态

- **总模块数**: 11个
- **迁移完成率**: 100%
- **迁移文档**: `CONTRACTS_MIGRATION_COMPLETE.md`

#### 1. Contracts层定义 (第一步)

```typescript
// packages/contracts/src/modules/{module}/
├── types.ts       // 接口定义 (I{Entity}, 枚举类型)
├── dtos.ts        // 数据传输对象 (请求/响应DTO)
├── events.ts      // 领域事件定义
└── index.ts       // 统一导出
```

#### 2. Domain-Core层实现 (第二步)

```typescript
// packages/domain-core/src/{module}/
└── aggregates/
    └── {Entity}Core.ts    // 核心业务逻辑抽象基类
```

#### 3. Domain-Server层扩展 (第三步)

```typescript
// packages/domain-server/src/{module}/
├── aggregates/
│   └── {Entity}.ts           // 聚合根具体实现
├── entities/
│   ├── {SubEntity1}.ts       // 子实体实现
│   └── {SubEntity2}.ts       // 子实体实现
└── repositories/
    └── i{Entity}Repository.ts // 仓储接口 (返回DTO)
```

#### 4. Domain-Client层实现 (第四步)

```typescript
// packages/domain-client/src/{module}/
├── entities/
│   └── {Entity}.ts           // 客户端实体扩展
└── services/
    └── {Entity}Service.ts    // 客户端服务
```

#### 5. API层适配 (第五步)

```typescript
// apps/api/src/modules/{module}/
├── application/
│   └── services/           // 应用服务更新
├── interface/
│   └── http/              // 控制器和路由更新
└── infrastructure/
    └── repositories/      // 具体仓储实现
```

### 迁移最佳实践

#### Contracts-First 原则

1. **先定义接口契约** - 所有类型定义在contracts包
2. **DTO vs 实体分离** - 仓储返回DTO，应用层转换为实体
3. **类型安全** - 全程TypeScript类型检查
4. **版本兼容** - 保持API向后兼容

#### DDD设计原则

1. **聚合根设计** - 明确业务边界和一致性保证
2. **实体生命周期** - 完整的创建、更新、删除逻辑
3. **领域事件** - 解耦模块间通信
4. **仓储模式** - 数据访问抽象化

## 数据获取流程架构设计

### 推荐架构：Composable + ApplicationService + Store 分层

**设计原则**：

- **Domain层**: 纯业务逻辑，不涉及技术实现
- **Application层**: 业务用例协调，API调用，缓存策略
- **Presentation层**: UI状态管理，用户交互

**数据流向**：

```
Vue组件 → Composable → ApplicationService → API Client
                  ↓                      ↓
                Store (缓存)              Backend API
```

### 架构层次职责

#### 1. Presentation Layer (表示层)

**Pinia Store**: 纯缓存存储

```typescript
// store/goalStore.ts
export const useGoalStore = defineStore('goal', {
  state: () => ({
    // 缓存数据
    goals: [] as Goal[],
    goalDirs: [] as GoalDir[],

    // UI状态
    isLoading: false,
    error: null,
    pagination: {...},
    filters: {...},
    selectedGoalUuid: null,
  }),

  getters: {
    // 纯数据查询，无业务逻辑
    getGoalByUuid: (state) => (uuid: string) =>
      state.goals.find(g => g.uuid === uuid),

    getActiveGoals: (state) =>
      state.goals.filter(g => g.status === 'active'),
  },

  actions: {
    // 纯数据操作，不调用外部服务
    setGoals(goals: Goal[]) { this.goals = goals; },
    addGoal(goal: Goal) { this.goals.push(goal); },
    updateGoal(goal: Goal) { /* 更新逻辑 */ },
    removeGoal(uuid: string) { /* 删除逻辑 */ },

    // UI状态管理
    setLoading(loading: boolean) { this.isLoading = loading; },
    setError(error: string | null) { this.error = error; },
  },
});
```

**Composable**: 业务逻辑封装

```typescript
// composables/useGoal.ts
export function useGoal() {
  const goalStore = useGoalStore();
  const goalService = new GoalWebApplicationService();

  // 获取所有目标 - 优先从缓存读取
  const fetchGoals = async (forceRefresh = false) => {
    // 如果有缓存且不强制刷新，直接返回
    if (!forceRefresh && goalStore.goals.length > 0) {
      return goalStore.goals;
    }

    // 调用应用服务获取数据
    await goalService.fetchAndCacheGoals();
    return goalStore.goals;
  };

  // 创建目标
  const createGoal = async (request: CreateGoalRequest) => {
    return await goalService.createGoal(request);
  };

  return {
    // 响应式数据（从store获取）
    goals: computed(() => goalStore.goals),
    isLoading: computed(() => goalStore.isLoading),

    // 业务方法
    fetchGoals,
    createGoal,
    // ...其他方法
  };
}
```

#### 2. Application Layer (应用层)

**ApplicationService**: 业务用例协调

```typescript
// application/services/GoalWebApplicationService.ts
export class GoalWebApplicationService {
  constructor(
    private goalApiClient = goalApiClient,
    private goalStore = useGoalStore(),
  ) {}

  /**
   * 获取并缓存目标数据
   * 职责：API调用 + 缓存管理 + 错误处理
   */
  async fetchAndCacheGoals(params?: GetGoalsParams): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // 调用API
      const response = await this.goalApiClient.getGoals(params);

      // 转换为领域实体
      const goals = response.goals.map((dto) => Goal.fromDTO(dto));

      // 缓存到store
      this.goalStore.setGoals(goals);
    } catch (error) {
      this.goalStore.setError(error.message);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 创建目标
   */
  async createGoal(request: CreateGoalRequest): Promise<Goal> {
    try {
      this.goalStore.setLoading(true);

      // API调用
      const response = await this.goalApiClient.createGoal(request);

      // 转换为领域实体
      const goal = Goal.fromResponse(response);

      // 更新缓存
      this.goalStore.addGoal(goal);

      return goal;
    } catch (error) {
      this.goalStore.setError(error.message);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 初始化模块数据
   * 登录时调用，同步所有数据
   */
  async initializeModuleData(): Promise<void> {
    await Promise.all([
      this.fetchAndCacheGoals({ limit: 1000 }),
      this.fetchAndCacheGoalDirs({ limit: 1000 }),
    ]);
  }
}
```

#### 3. Infrastructure Layer (基础设施层)

**API Client**: 纯API调用

```typescript
// infrastructure/api/goalApiClient.ts
export const goalApiClient = {
  async getGoals(params?: GetGoalsParams): Promise<GoalListResponse> {
    const response = await httpClient.get('/api/goals', { params });
    return response.data;
  },

  async createGoal(request: CreateGoalRequest): Promise<GoalResponse> {
    const response = await httpClient.post('/api/goals', request);
    return response.data;
  },

  // ...其他API方法
};
```

### 登录时数据初始化策略

**全局初始化服务**：

```typescript
// shared/services/InitializationService.ts
export class InitializationService {
  async initializeUserData(accountUuid: string): Promise<void> {
    // 并行初始化所有模块数据
    await Promise.all([
      this.initializeGoalModule(),
      this.initializeTaskModule(),
      this.initializeReminderModule(),
      // ...其他模块
    ]);
  }

  private async initializeGoalModule(): Promise<void> {
    const goalService = new GoalWebApplicationService();
    await goalService.initializeModuleData();
  }
}
```

**登录后调用**：

```typescript
// authentication/stores/authStore.ts
const login = async (credentials) => {
  const response = await authApi.login(credentials);

  // 设置用户信息
  setUser(response.user);
  setToken(response.token);

  // 初始化所有模块数据
  await initializationService.initializeUserData(response.user.uuid);
};
```

### 架构优势

1. **职责明确**：Store纯缓存，Service纯业务协调，API纯数据获取
2. **性能优化**：登录时一次性同步，后续直接从缓存读取
3. **错误隔离**：每层独立的错误处理机制
4. **可测试性**：每层可独立单元测试
5. **可维护性**：清晰的依赖关系和数据流

### 实际使用示例

```vue
<!-- views/GoalList.vue -->
<script setup>
import { useGoal } from '../composables/useGoal';

const { goals, isLoading, fetchGoals, createGoal } = useGoal();

// 组件挂载时，优先从缓存获取数据
onMounted(async () => {
  await fetchGoals(); // 如果有缓存直接返回，无缓存则API获取
});

// 手动刷新
const refresh = () => fetchGoals(true); // 强制从API刷新
</script>
```

这种架构既保证了性能（缓存优先），又保证了数据的准确性（支持强制刷新），同时符合DDD的分层原则。

#### 仓储接口设计规范

**核心原则**: 仓储接口必须返回DTO对象，而不是领域实体

1. **接口定义** (`packages/domain-server/src/{module}/repositories/`)

   ```typescript
   // ❌ 错误 - 返回领域实体
   findByUuid(uuid: string): Promise<Repository | null>;

   // ✅ 正确 - 返回DTO对象
   findByUuid(uuid: string): Promise<RepositoryDTO | null>;
   ```

2. **DTO转换原则**
   - 仓储层负责数据库实体 ↔ DTO 的转换
   - 应用层负责 DTO ↔ 领域实体 的转换
   - 领域实体提供 `toDTO()` 和 `fromDTO()` 方法

3. **数据流向**

   ```
   数据库实体 → [仓储层] → DTO → [应用层] → 领域实体 → [业务逻辑]
   ```

4. **实现示例**
   ```typescript
   // 仓储实现中的转换
   async findByUuid(uuid: string): Promise<RepositoryDTO | null> {
     const dbEntity = await this.prisma.repository.findUnique({ where: { uuid } });
     return dbEntity ? this.mapToDTO(dbEntity) : null;
   }
   ```

#### 架构分层原则

1. **依赖方向** - 内层不依赖外层
2. **关注点分离** - 每层职责明确
3. **接口隔离** - 通过接口而非具体实现通信
4. **可测试性** - 支持单元测试和模拟

### 待迁移模块优先级

#### 高优先级 (核心业务)

1. **Task模块** - 任务管理核心功能
2. **Account模块** - 用户账户管理
3. **Authentication模块** - 认证授权系统

#### 中优先级 (扩展功能)

1. **Reminder模块** - 提醒通知系统
2. **Repository模块** - 文件仓储管理
3. **SessionLog模块** - 会话日志记录

#### 低优先级 (辅助功能)

1. **Notification模块** - 消息通知系统
2. **Editor模块** - 在线编辑器

### 迁移工作估时

基于Goal模块迁移经验：

- **小型模块** (1-2个实体): 1-2天
- **中型模块** (3-5个实体): 3-5天
- **大型模块** (5+个实体): 1-2周

每个模块包含：

- Contracts定义: 0.5天
- Domain层实现: 1-3天
- API层适配: 0.5-1天
- 测试和文档: 0.5天

---

## 模块实现状态

### 已实现模块

#### 1. Authentication (认证模块) ✅ 完整实现

- **表示层**: 登录页面、注册页面、密码重置
- **状态管理**: Pinia认证Store (Token管理、登录状态)
- **API层**: 认证接口客户端
- **服务端**: NestJS认证服务 (JWT + Redis)
- **特性**: 记住我功能、Token刷新、密码安全策略

#### 2. Account (账户管理模块) ✅ 完整实现

- **表示层**: 个人信息页面、密码修改、账户设置
- **状态管理**: Pinia账户Store
- **API层**: 账户接口客户端
- **服务端**: NestJS账户服务
- **特性**: 头像上传、个人信息编辑、安全设置

#### 3. Task (任务管理模块) ✅ 完整实现

- **表示层**: 任务列表、创建任务、任务详情、编辑
- **状态管理**: Pinia任务Store (分页、过滤、缓存)
- **API层**: 任务接口客户端
- **服务端**: NestJS任务服务 (CRUD + 批量操作)
- **特性**: 优先级管理、截止日期、任务状态、批量操作

#### 4. Goal (目标管理模块) ✅ **完整实现** - **已完全迁移到新架构 + DDD聚合根控制**

- **DDD聚合根控制**: ✅ **完整实现标准DDD模式**
  - **聚合根**: Goal (控制所有子实体生命周期)
  - **子实体控制**: KeyResult, GoalRecord, GoalReview 只能通过 Goal 聚合根操作
  - **业务规则保护**: 权重总和不超过100%，数据一致性保证，级联删除
  - **领域事件**: 完整的事件驱动架构 (KeyResultCreated, KeyResultRemoved 等)
  - **聚合根方法**:
    - `createKeyResult()` - 创建关键结果
    - `updateKeyResult()` - 更新关键结果
    - `removeKeyResult()` - 删除关键结果(级联删除记录)
    - `createRecord()` - 创建记录(自动更新关键结果进度)
    - `createReview()` - 创建复盘(生成状态快照)
- **API聚合根控制**: ✅ **完整的DDD REST API设计**
  - **GoalAggregateService** - 专门的聚合根业务协调服务
  - **GoalAggregateController** - 聚合根控制器
  - **聚合根路由**: 体现DDD原则的路由设计
    - `POST /goals/:goalId/key-results` (通过聚合根创建)
    - `PUT /goals/:goalId/key-results/:id` (通过聚合根更新)
    - `DELETE /goals/:goalId/key-results/:id` (通过聚合根删除)
    - `GET /goals/:goalId/aggregate` (完整聚合视图)
    - `PUT /goals/:goalId/key-results/batch-weight` (批量权重更新)
    - `POST /goals/:goalId/clone` (聚合根复制)
  - **传统CRUD对比**: 替代直接操作子实体的传统方式
- **仓储层扩展**: ✅ **DDD聚合根仓储模式**
  - `loadGoalAggregate()` - 完整聚合加载
  - `updateGoalAggregate()` - 原子性聚合更新
  - `validateGoalAggregateRules()` - 业务规则验证
  - `cascadeDeleteGoalAggregate()` - 级联删除
- **领域层**: 完整的DDD实体设计
  - **聚合根**: Goal, GoalDir (目标和目标目录)
  - **实体**: KeyResult (关键结果), GoalRecord (目标记录), GoalReview (目标复盘)
  - **仓储接口**: IGoalRepository (返回DTO结构)
  - **领域事件**: 完整的事件驱动架构
- **数据库优化**: ✅ **重大架构升级**
  - **JSON字段展开**: `analysis` → `motive`, `feasibility`, `importanceLevel`, `urgencyLevel`
  - **元数据展开**: `metadata` → `tags`, `category`
  - **生命周期展开**: `lifecycle` → `status`
  - **性能提升**: 战略性索引，直接列查询替代JSON解析
  - **查询增强**: 支持精确过滤和高效排序
- **API层**: ✅ **完整实现**
  - **应用服务**: GoalApplicationService, KeyResultApplicationService, GoalRecordApplicationService, GoalReviewApplicationService
  - **控制器**: GoalController, KeyResultController, GoalRecordController, GoalReviewController
  - **路由**: 完整的RESTful API覆盖所有实体操作
  - **认证**: JWT token 用户身份验证
  - **类型安全**: 完善的契约类型定义
- **Desktop端**: ✅ **完整实现**
  - **表示层**: 目标列表、创建目标、目标详情、进度跟踪
  - **状态管理**: Pinia目标Store
  - **服务端**: 基于DDD的目标服务，Prisma仓储实现已完全适配新架构
- **Web端**: ✅ **迁移完成** - **2025年9月新增**
  - **表示层**:
    - ✅ **目标列表页面**: 完整的目标列表展示，支持分类筛选、状态过滤
    - ✅ **目标创建页面**: 全功能的目标创建表单，支持关键结果、标签、分类
    - ✅ **目标详情页面**: 详细的目标信息展示，进度跟踪，状态管理
    - ✅ **目标卡片组件**: 美观的目标卡片，显示进度、状态、操作按钮
    - ✅ **目标分类组件**: 左侧分类导航，支持系统分类和自定义分类
  - **状态管理**: ✅ **完整的Pinia Store** - 基于domain-client架构
  - **API集成**: ✅ **完整的应用服务** - GoalWebApplicationService
  - **路由配置**: ✅ **完整的路由系统** - 目标列表、创建、详情、编辑页面
  - **响应式设计**: ✅ **基于Vuetify的现代UI**
- **特性**:
  - **DDD聚合根控制**: 所有子实体操作必须通过Goal聚合根
  - **业务规则保护**: 权重控制、数据一致性、版本控制、原子操作
  - **OKR系统**: 目标-关键结果追踪
  - **进度管理**: 自动进度计算和更新
  - **复盘系统**: 定期目标回顾和评分
  - **目录管理**: 目标分类和层级组织
  - **生命周期**: 激活、暂停、完成、归档状态管理
  - **高性能查询**: 基于分解字段的复杂过滤和聚合查询
  - **跨平台同步**: Desktop和Web端数据同步
- **迁移文档**:
  - `docs/GOAL_MODULE_MIGRATION_COMPLETE.md` - 完整的迁移总结和模式指导
  - `docs/DDD_AGGREGATE_ROOT_CONTROL_IMPLEMENTATION.md` - DDD聚合根控制模式实现指南

#### 5. Reminder (提醒管理模块) ✅ 完整实现

- **表示层**: 提醒列表、创建提醒、提醒设置
- **状态管理**: Pinia提醒Store
- **API层**: 提醒接口客户端
- **服务端**: NestJS提醒服务 (定时任务)
- **特性**: 多种提醒类型、重复提醒、提醒历史

#### 6. SessionLog (会话日志模块) ✅ 完整实现

- **表示层**: 日志查看、统计分析
- **状态管理**: Pinia日志Store
- **API层**: 日志接口客户端
- **服务端**: NestJS日志服务 (自动记录)
- **特性**: 操作日志、访问统计、错误追踪

#### 7. Notification (通知模块) ✅ 完整实现

- **表示层**: 通知中心、通知设置、通知历史
- **状态管理**: Pinia通知Store
- **API层**: 通知接口客户端
- **服务端**: NestJS通知服务 (WebSocket + 定时推送)
- **特性**: 实时通知、通知分类、推送策略

#### 8. Repository (仓储管理模块) ✅ 完整实现

- **表示层**: 仓储列表、创建仓储、仓储详情、文件管理
- **状态管理**: Pinia仓储Store (文件树、搜索、缓存)
- **API层**: 仓储接口客户端 (文件上传、下载、预览)
- **服务端**: NestJS仓储服务 (文件存储、版本控制)
- **特性**: 文件管理、版本控制、搜索功能、权限管理

#### 9. 路由权限系统 ✅ 完整实现

- **路由守卫**: 认证守卫、权限守卫、页面标题守卫
- **权限管理**: 基于角色的访问控制 (RBAC)
- **路由配置**: 嵌套路由、懒加载、元信息管理
- **导航系统**: 动态菜单生成、面包屑导航
- **错误处理**: 404、401、500 错误页面

#### 10. 共享系统组件 ✅ 完整实现

- **API客户端**: 统一HTTP客户端、拦截器、错误处理
- **UI组件库**: 基于Vuetify的通用组件
- **工具函数**: 日期处理、文件操作、验证函数
- **类型定义**: TypeScript类型声明、接口定义

### 正在开发的模块

#### Editor (编辑器模块) 🚧 部分实现

- **表示层**: ✅ 编辑器界面、文件树、预览功能
- **状态管理**: ⏳ 编辑器Store (文档状态、历史记录)
- **API层**: ⏳ 编辑器接口客户端
- **服务端**: ⏳ NestJS编辑器服务
- **待实现**: 实时协作、语法高亮、插件系统

### 系统架构优势

#### 技术特性

- **TypeScript**: 全栈类型安全，编译时错误检测
- **Nx Monorepo**: 统一项目管理，代码共享，智能缓存
- **领域驱动设计**: 清晰的业务逻辑分离，易维护扩展
- **事件驱动架构**: 模块间解耦，异步处理，性能优化
- **微前端架构**: Vue3 + Electron双端支持，代码复用

#### 开发体验

- **热重载**: Vite快速开发，实时预览
- **自动化测试**: 单元测试、集成测试、E2E测试
- **代码规范**: ESLint + Prettier自动格式化
- **依赖管理**: pnpm workspace统一管理
- **构建优化**: 增量构建，并行执行，缓存机制

#### 生产特性

- **性能优化**: 代码分割、懒加载、缓存策略
- **安全性**: JWT认证、权限控制、输入验证
- **可扩展性**: 模块化设计、插件系统、微服务架构
- **监控日志**: 操作日志、错误追踪、性能监控
- **部署方案**: Docker容器化、CI/CD自动化部署
