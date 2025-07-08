# Account 模块重构说明

## 概述

本次重构将原有的 Account 模块按照 DDD（领域驱动设计）原则分离为三个独立的模块：

1. **Account 模块** - 账号管理
2. **Authentication 模块** - 认证服务
3. **SessionManagement 模块** - 用户会话管理

## 新架构特点

### 1. 模块职责清晰
- **Account**: 负责账号的核心业务逻辑，包括账号创建、修改、角色管理等
- **Authentication**: 负责用户认证逻辑，包括登录、注册、密码验证等
- **SessionManagement**: 负责会话生命周期管理，包括会话创建、验证、销毁等

### 2. DDD 设计模式
- **聚合根**: `Account` 作为核心聚合根，管理所有相关实体
- **实体**: `User`、`Role`、`Permission`
- **值对象**: `Email`、`PhoneNumber`、`Password`、`Address`
- **存储库**: 定义了清晰的数据访问接口

### 3. 向后兼容
- 保持了原有的 `localUserService` 接口不变
- 新架构可以逐步替换旧实现
- 支持新旧架构并存的过渡期

## 目录结构

```
src/modules/
├── Account/                          # 账号模块
│   ├── domain/                       # 领域层
│   │   ├── aggregates/               # 聚合根
│   │   │   └── account.ts           # 账号聚合根
│   │   ├── entities/                 # 实体
│   │   │   ├── user.ts              # 用户实体
│   │   │   ├── role.ts              # 角色实体
│   │   │   └── permission.ts        # 权限实体
│   │   ├── valueObjects/             # 值对象
│   │   │   ├── email.ts             # 邮箱值对象
│   │   │   ├── phoneNumber.ts       # 手机号值对象
│   │   │   ├── password.ts          # 密码值对象
│   │   │   └── address.ts           # 地址值对象
│   │   ├── repositories/             # 存储库接口
│   │   │   └── accountRepository.ts
│   │   └── types/                    # 类型定义
│   │       └── account.ts
│   ├── application/                  # 应用层
│   │   └── services/
│   │       └── accountApplicationService.ts
│   ├── services/                     # 向后兼容服务
│   │   └── localUserService.ts     # 重构后的本地用户服务
│   ├── initialization/               # 初始化工具
│   │   └── accountSystemInitializer.ts
│   └── index.ts                      # 模块导出
├── Authentication/                   # 认证模块
│   ├── domain/
│   │   └── types.ts                 # 认证相关类型
│   ├── services/
│   │   └── authenticationService.ts # 认证服务
│   └── index.ts
└── SessionManagement/                # 会话管理模块
    ├── domain/
    │   ├── types.ts                 # 会话相关类型
    │   └── repositories/
    │       └── sessionRepository.ts # 会话存储库接口
    ├── services/
    │   └── sessionManagementService.ts
    └── index.ts
```

## 使用方式

### 1. 新架构使用方式

```typescript
import { AccountSystemInitializer } from '@/modules/Account/initialization/accountSystemInitializer';
import { MockAccountRepository, MockSessionRepository } from './mocks'; // 你的存储库实现

// 初始化系统
const accountAppService = AccountSystemInitializer.initialize(
  new MockAccountRepository(),
  new MockSessionRepository()
);

// 使用新架构
const loginResult = await accountAppService.login({
  username: 'test',
  password: 'password',
  remember: true
});
```

### 2. 向后兼容使用方式

```typescript
import { localUserService } from '@/modules/Account';
import { initializeAccountSystem } from '@/modules/Account/initialization/accountSystemInitializer';

// 初始化新架构并注入到旧服务中
initializeAccountSystem(
  new MockAccountRepository(),
  new MockSessionRepository()
);

// 继续使用原有接口
const result = await localUserService.login({
  username: 'test',
  password: 'password',
  remember: true
});
```

## 核心概念

### Account 聚合根
```typescript
// 创建账号
const account = new Account(
  id,
  username,
  password,
  AccountType.LOCAL,
  user,
  email,
  phoneNumber
);

// 修改密码
account.changePassword(oldPassword, newPassword);

// 更新邮箱
account.updateEmail('new@email.com');

// 验证邮箱
account.verifyEmail();
```

### 值对象的不可变性
```typescript
// 邮箱值对象
const email = new Email('user@example.com');
const verifiedEmail = email.verify(); // 创建新实例

// 密码值对象
const password = new Password('plaintext');
const isValid = password.verify('plaintext'); // true
```

### 会话管理
```typescript
// 创建会话
const sessionResult = await sessionService.createSession(
  accountId,
  username,
  accountType,
  { rememberMe: true }
);

// 验证会话
const validationResult = await sessionService.validateSession(token);

// 销毁会话
await sessionService.destroySession(token);
```

## 迁移建议

1. **渐进式迁移**: 新功能使用新架构，旧功能保持不变
2. **数据库适配**: 实现存储库接口来适配现有数据库结构
3. **测试覆盖**: 为新架构编写充分的单元测试和集成测试
4. **性能监控**: 监控新架构的性能表现

## 扩展点

- **存储库实现**: 可以针对不同数据库实现存储库接口
- **认证策略**: 可以扩展多种认证方式（OAuth、LDAP等）
- **会话存储**: 可以使用 Redis、数据库等不同存储方式
- **权限系统**: 可以基于 Role 和 Permission 实体构建完整的 RBAC 系统

## 注意事项

1. 新架构使用了 TypeScript 的严格类型检查
2. 所有领域事件都通过 DomainEvent 系统发布
3. 值对象具有不可变性，修改时会创建新实例
4. 聚合根负责维护业务规则的一致性
