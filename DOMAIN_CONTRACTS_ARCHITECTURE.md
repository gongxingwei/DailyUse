# DailyUse Domain Architecture Refactoring

## 概述

我们正在将 DailyUse 项目的架构从分散的类型定义重构为基于 contracts 的集中式类型管理模式。这种设计遵循依赖倒置原则 (DIP)，让所有 domain 包依赖于 contracts 包中定义的抽象接口。

## 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   domain-client │    │   domain-server │    │    domain-core  │
│                 │    │                 │    │                 │
│  客户端实现      │    │   服务端实现     │    │   核心业务逻辑   │
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │        contracts         │
                    │                          │
                    │  • 领域接口定义 (domain) │
                    │  • 实体类型 (entities)   │
                    │  • 事件类型 (events)     │
                    │  • 共享类型 (shared)     │
                    │                          │
                    └──────────────────────────┘
```

## 包结构说明

### 1. `@dailyuse/contracts` 包

作为整个系统的"契约中心"，定义了：

- **`domain/`** - 核心领域接口和抽象类型
  - `IAccountCore`, `IUserCore` 等核心接口
  - `AccountStatus`, `AccountType` 等枚举类型
  - 基础数据传输对象 (DTOs)

- **`entities/`** - 用于事件传输的实体类型
  - `AccountEntity`, `UserEntity` 等完整实体定义
  - 类型守卫和转换工具函数

- **`events/`** - 事件驱动架构的类型定义
  - 所有领域事件的接口定义
  - 事件常量和类型映射

### 2. Domain 包的职责分工

- **`domain-core`**: 实现核心业务逻辑，不依赖特定环境
- **`domain-server`**: 实现服务端特定的业务逻辑和持久化
- **`domain-client`**: 实现客户端特定的业务逻辑和UI交互

## 迁移计划

### 阶段 1: 建立 Contracts 基础 ✅
- [x] 创建 contracts 包的基础结构
- [x] 从 domain-core 迁移核心类型定义
- [x] 建立事件类型定义系统
- [x] 创建实体类型定义

### 阶段 2: 更新 Domain 包
- [ ] 更新 domain-core 以使用 contracts 中的接口
- [ ] 更新 domain-server 以使用 contracts 中的接口  
- [ ] 更新 domain-client 以使用 contracts 中的接口

### 阶段 3: 更新应用层
- [ ] 更新 API 应用以使用新的类型系统
- [ ] 更新 Web 应用以使用新的类型系统
- [ ] 更新 Electron 应用以使用新的类型系统

## 好处

1. **类型安全性**: 统一的类型定义确保模块间通信的类型安全
2. **可维护性**: 集中的类型管理，减少重复和不一致
3. **可扩展性**: 新的领域可以轻松添加到 contracts 中
4. **解耦**: domain 包不再相互依赖，只依赖于抽象契约
5. **测试友好**: 可以轻松创建 mock 实现用于测试

## 使用示例

```typescript
// 在 domain-server 中实现接口
import { IAccount, AccountStatus } from '@dailyuse/contracts';

export class Account implements IAccount {
  // 实现接口定义的所有属性和方法
}

// 在事件处理中使用实体类型
import { AccountEntity, UserLoggedInEvent } from '@dailyuse/contracts';

function handleUserLogin(event: UserLoggedInEvent) {
  const account: AccountEntity = event.payload.account;
  // 处理登录逻辑
}
```

## 注意事项

1. 所有新的类型定义都应该添加到 contracts 包中
2. Domain 包应该实现 contracts 中的接口，而不是定义自己的类型
3. 事件传输时使用 entities 中定义的类型，而不是直接使用 domain 对象
4. 保持 contracts 包的向后兼容性，避免破坏性更改
