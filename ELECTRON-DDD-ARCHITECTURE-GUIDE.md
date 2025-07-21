# Electron 应用中的 DDD 架构：主进程与渲染进程代码分离策略

## 当前问题

项目中同时存在两套领域模型定义：
- `src/shared/domain/` - 渲染进程版本
- `electron/shared/domain/` - 主进程版本

这导致了：
1. **类型冲突**：TypeScript 编译器混淆不同版本的类型
2. **代码重复**：相同的实体和值对象定义了两遍
3. **维护困难**：修改需要在两个地方同步
4. **依赖复杂**：渲染进程和主进程有不同的依赖需求

## Electron 架构特点

### 主进程 (Main Process)
- **职责**：系统级操作、文件系统、数据库、业务逻辑
- **特点**：Node.js 环境，可以访问所有 Node.js API
- **适合**：业务逻辑、数据持久化、服务协调

### 渲染进程 (Renderer Process)
- **职责**：用户界面、用户交互、视图逻辑
- **特点**：浏览器环境，受限的 Node.js 访问
- **适合**：UI 组件、用户交互、视图模型

## 推荐架构方案

### 方案一：统一领域模型（推荐）

将所有领域模型统一放在主进程中，渲染进程通过 IPC 通信和 DTO 传输。

#### 架构结构：
```
electron/
├── modules/
│   ├── Account/
│   │   ├── domain/           # 统一的领域模型
│   │   ├── application/      # 应用服务
│   │   ├── infrastructure/   # 数据持久化
│   │   └── ipcs/            # IPC 处理器
│   └── Authentication/
│       └── ...
├── shared/
│   ├── domain/              # 统一的基础设施
│   ├── types/               # 共享类型定义
│   └── utils/               # 工具函数
└── ...

src/
├── modules/
│   ├── Account/
│   │   ├── components/      # Vue 组件
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── apis/            # IPC 客户端
│   │   └── types/           # DTO 类型定义
│   └── ...
├── shared/
│   ├── apis/                # IPC 通信工具
│   ├── types/               # DTO 类型定义
│   └── utils/               # 前端工具函数
└── ...
```

#### 优势：
- ✅ **单一数据源**：领域逻辑只在主进程中
- ✅ **类型安全**：避免类型冲突
- ✅ **易于维护**：逻辑集中，修改同步
- ✅ **性能优化**：业务逻辑在主进程中执行更高效
- ✅ **安全性**：敏感业务逻辑不暴露给渲染进程

#### 实现步骤：

1. **保留主进程的领域模型**
2. **删除渲染进程的领域模型**
3. **创建 DTO 类型定义**
4. **实现 IPC 通信层**
5. **渲染进程使用 API 调用**

### 方案二：分层共享（不推荐）

保持当前的双重定义，但明确职责分离。

#### 问题：
- ❌ 代码重复
- ❌ 类型冲突
- ❌ 维护复杂
- ❌ 逻辑分散

## 具体实施建议

### 1. 领域模型统一化

```typescript
// electron/shared/types/dtos.ts
export interface AccountDTO {
  uuid: string;
  username: string;
  email?: string;
  phone?: string;
  accountType: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface SessionLogDTO {
  uuid: string;
  accountUuid: string;
  sessionId: string;
  operationType: string;
  ipLocation: IPLocationDTO;
  timestamp: number;
  riskLevel: string;
}

export interface IPLocationDTO {
  ipAddress: string;
  country: string;
  region: string;
  city: string;
  locationDescription: string;
  isSuspicious: boolean;
}
```

### 2. 渲染进程 API 层

```typescript
// src/shared/apis/accountApi.ts
export class AccountApi {
  static async getAllUsers(): Promise<AccountDTO[]> {
    return await window.electronAPI.invoke('account:get-all-users');
  }

  static async updateAccount(uuid: string, data: any): Promise<AccountDTO> {
    return await window.electronAPI.invoke('account:update', { uuid, data });
  }
}
```

### 3. 主进程实体转换

```typescript
// electron/modules/Account/application/services/accountApplicationService.ts
export class AccountApplicationService {
  async getAllUsers(): Promise<TResponse<AccountDTO[]>> {
    const accounts = await this.accountRepository.findAll();
    const accountDTOs = accounts.map(account => account.toDTO());
    return {
      success: true,
      data: accountDTOs
    };
  }
}
```

### 4. 实体添加 toDTO 方法

```typescript
// electron/modules/Account/domain/aggregates/account.ts
export class Account extends AggregateRoot {
  // ...existing code...

  toDTO(): AccountDTO {
    return {
      uuid: this.uuid,
      username: this.username,
      email: this.email?.value,
      phone: this.phoneNumber?.number,
      accountType: this.accountType,
      status: this.status,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime()
    };
  }
}
```

## 迁移步骤

### 第一阶段：清理重复代码
1. 删除 `src/shared/domain/` 目录
2. 删除 `src/modules/*/domain/` 目录
3. 创建统一的 DTO 类型定义

### 第二阶段：重构通信层
1. 为所有实体添加 `toDTO()` 方法
2. 更新 IPC 处理器返回 DTO
3. 重构渲染进程使用 API 调用

### 第三阶段：优化和测试
1. 测试所有功能
2. 优化性能
3. 完善错误处理

## 总结

**强烈建议采用方案一（统一领域模型）**，因为：

1. **符合 DDD 原则**：领域逻辑集中管理
2. **符合 Electron 架构**：主进程处理业务，渲染进程处理 UI
3. **提高maintainability**：避免代码重复和同步问题
4. **提高安全性**：敏感逻辑只在主进程中
5. **提高性能**：减少进程间的复杂对象传输

这种架构将使您的应用更加健壮、可维护和可扩展。
