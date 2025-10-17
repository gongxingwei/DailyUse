# Domain Service 重构总结

> **重构日期**: 2024
> **重构目标**: 将 Account 和 Authentication 模块的 DomainService 按照 DDD 最佳实践重构
> **核心原则**: DomainService 不应该调用 Repository，只负责创建聚合根和业务规则验证

## 📋 重构概述

### 重构前的问题

**反模式（Anti-pattern）**：
- ❌ DomainService 注入了 Repository 依赖
- ❌ DomainService 调用 `repository.save()` 进行持久化
- ❌ DomainService 调用 `repository.find*()` 进行查询
- ❌ 无法传递事务上下文（Transaction Client）
- ❌ 职责混乱：领域逻辑 + 持久化逻辑混在一起

**具体问题**：

```typescript
// ❌ 错误示例（重构前）
export class AccountDomainService {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async createAccount(params) {
    // 调用 Repository 查询
    const usernameExists = await this.accountRepo.existsByUsername(params.username);
    if (usernameExists) {
      throw new Error('Username already taken');
    }

    const account = Account.create(params);
    
    // 调用 Repository 持久化
    await this.accountRepo.save(account);
    
    return account;
  }
}
```

### 重构后的最佳实践

**正确模式（Best Practice）**：
- ✅ DomainService 不再注入 Repository
- ✅ DomainService 只创建聚合根对象并返回
- ✅ DomainService 只负责复杂业务规则验证
- ✅ ApplicationService 负责持久化和查询
- ✅ 支持事务上下文传递

**具体实现**：

```typescript
// ✅ 正确示例（重构后）
export class AccountDomainService {
  // 不再注入 Repository

  createAccount(params): Account {
    // 1. 业务规则验证
    this.validateAccountCreation(params);

    // 2. 创建聚合根
    const account = Account.create(params);

    // 3. 只返回聚合根，不持久化
    return account;
  }

  private validateAccountCreation(params): void {
    // 纯业务规则验证（不涉及持久化）
    if (params.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    // ...
  }
}

// ApplicationService 负责持久化
export class RegistrationApplicationService {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly domainService: AccountDomainService
  ) {}

  async registerUser(request) {
    // 1. 检查唯一性（ApplicationService 查询）
    const usernameExists = await this.accountRepo.existsByUsername(request.username);
    if (usernameExists) {
      throw new Error('Username already taken');
    }

    // 2. 调用 DomainService 创建聚合根
    const account = this.domainService.createAccount(request);

    // 3. ApplicationService 持久化
    await this.accountRepo.save(account);

    return account;
  }
}
```

## 🔄 重构的文件清单

### 1. Account 模块

#### `AccountDomainService.ts` (142 行 → 145 行)

**重构内容**：

| 序号 | 方法名 | 重构前 | 重构后 |
|-----|--------|--------|--------|
| 1 | `createAccount()` | ❌ 查询 + 创建 + 持久化 | ✅ 验证 + 创建 + 返回 |
| 2 | `getAccount()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 3 | `getAccountByUsername()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 4 | `getAccountByEmail()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 5 | `updateAccountProfile()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 6 | `updateEmail()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 7 | `verifyEmail()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 8 | `recordLogin()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 9 | `deactivateAccount()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 10 | `deleteAccount()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 11 | `listAccounts()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |

**新增方法**（业务规则验证）：

| 方法名 | 职责 | 类型 |
|--------|------|------|
| `validateAccountCreation()` | 验证账户创建的业务规则 | private |
| `validateEmailUpdate()` | 验证邮箱更新的业务规则 | public |
| `validateProfileUpdate()` | 验证资料更新的业务规则 | public |
| `canPerformSensitiveOperation()` | 检查是否可以执行敏感操作 | public |
| `canDeleteAccount()` | 检查是否可以删除账户 | public |

**重构对比**：

```typescript
// ❌ 重构前
export class AccountDomainService {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async updateAccountProfile(uuid, profile): Promise<Account> {
    const account = await this.getAccount(uuid);  // ❌ 查询
    account.updateProfile(profile);
    await this.accountRepo.save(account);          // ❌ 持久化
    return account;
  }
}

// ✅ 重构后
export class AccountDomainService {
  // 不再注入 Repository

  validateProfileUpdate(account: Account, profile): void {
    // 显示名称验证
    if (profile.displayName?.length < 1) {
      throw new Error('Display name cannot be empty');
    }
    
    // 检查账户状态
    if (account.status === 'DELETED') {
      throw new Error('Cannot update profile for deleted account');
    }
  }
}

// ApplicationService 负责持久化
export class AccountApplicationService {
  async updateProfile(uuid, profile) {
    // 1. 查询账户
    const account = await this.accountRepo.findById(uuid);
    
    // 2. DomainService 验证业务规则
    this.domainService.validateProfileUpdate(account, profile);
    
    // 3. 修改聚合根
    account.updateProfile(profile);
    
    // 4. 持久化
    await this.accountRepo.save(account);
    
    return account;
  }
}
```

### 2. Authentication 模块

#### `AuthenticationDomainService.ts` (421 行 → 267 行)

**重构内容**：

| 序号 | 方法名 | 重构前 | 重构后 |
|-----|--------|--------|--------|
| 1 | `createPasswordCredential()` | ❌ 查询 + 创建 + 持久化 | ✅ 验证 + 创建 + 返回 |
| 2 | `createSession()` | ❌ 创建 + 持久化 | ✅ 验证 + 创建 + 返回 |
| 3 | `getCredential()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 4 | `getCredentialByAccountUuid()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 5 | `verifyPassword()` | ❌ 查询 + 验证 | ✅ 只验证（接收已查询的对象） |
| 6 | `changePassword()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 7 | `recordFailedLogin()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 8 | `resetFailedAttempts()` | ❌ 查询 + 修改 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 9 | `isCredentialLocked()` | ❌ 查询 + 检查 | ✅ 只检查（接收已查询的对象） |
| 10 | `generateRememberMeToken()` | ❌ 查询 + 生成 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 11 | `verifyRememberMeToken()` | ❌ 查询 + 验证 | ✅ 只验证（接收已查询的对象） |
| 12 | `refreshRememberMeToken()` | ❌ 查询 + 刷新 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 13 | `revokeRememberMeToken()` | ❌ 查询 + 撤销 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 14 | `revokeAllRememberMeTokens()` | ❌ 查询 + 撤销 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 15 | `generateApiKey()` | ❌ 查询 + 生成 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 16 | `revokeApiKey()` | ❌ 查询 + 撤销 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 17 | `enableTwoFactor()` | ❌ 查询 + 启用 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 18 | `disableTwoFactor()` | ❌ 查询 + 禁用 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 19 | `verifyTwoFactorCode()` | ❌ 查询 + 验证 | ✅ 只验证（接收已查询的对象） |
| 20 | `getSession()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 21 | `getSessionByAccessToken()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 22 | `getSessionByRefreshToken()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 23 | `refreshAccessToken()` | ❌ 查询 + 刷新 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 24 | `refreshRefreshToken()` | ❌ 查询 + 刷新 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 25 | `validateSession()` | ❌ 查询 + 验证 | ✅ 只验证（接收已查询的对象） |
| 26 | `recordActivity()` | ❌ 查询 + 记录 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 27 | `revokeSession()` | ❌ 查询 + 撤销 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 28 | `revokeAllSessions()` | ❌ 查询 + 撤销 + 持久化 | 🗑️ 删除（移到 ApplicationService） |
| 29 | `getActiveSessions()` | ❌ 查询 Repository | 🗑️ 删除（移到 ApplicationService） |
| 30 | `cleanupExpiredSessions()` | ❌ 查询 + 删除 | 🗑️ 删除（移到 ApplicationService） |
| 31 | `cleanupExpiredCredentials()` | ❌ 查询 + 删除 | 🗑️ 删除（移到 ApplicationService） |

**新增方法**（业务规则验证）：

| 方法名 | 职责 | 类型 |
|--------|------|------|
| `validatePasswordCredentialCreation()` | 验证密码凭证创建的业务规则 | private |
| `validateSessionCreation()` | 验证会话创建的业务规则 | private |
| `validatePasswordStrength()` | 验证密码强度 | public |
| `shouldLockCredential()` | 锁定策略验证 | public |
| `shouldExtendSession()` | 会话延长策略 | public |
| `isRefreshTokenExpired()` | 刷新令牌过期检查 | public |
| `requiresTwoFactor()` | 检查是否需要双因素认证 | public |

**代码减少**：421 行 → 267 行（减少 154 行，-36.6%）

## 📊 重构统计

### 文件变化

| 文件 | 重构前 | 重构后 | 变化 | 变化率 |
|------|--------|--------|------|--------|
| `AccountDomainService.ts` | 142 行 | 145 行 | +3 行 | +2.1% |
| `AuthenticationDomainService.ts` | 421 行 | 267 行 | -154 行 | -36.6% |
| **总计** | **563 行** | **412 行** | **-151 行** | **-26.8%** |

### 方法变化

| 模块 | 重构前方法数 | 删除/移动 | 新增 | 重构后方法数 |
|------|-------------|-----------|------|------------|
| Account | 11 | 10 | 5 | 6 |
| Authentication | 31 | 27 | 7 | 11 |
| **总计** | **42** | **37** | **12** | **17** |

### 职责分离

| 职责类型 | 重构前 | 重构后 |
|----------|--------|--------|
| 创建聚合根 | ✅ DomainService | ✅ DomainService |
| 业务规则验证 | ✅ DomainService | ✅ DomainService |
| 查询 Repository | ❌ DomainService | ✅ ApplicationService |
| 持久化 Repository | ❌ DomainService | ✅ ApplicationService |
| 事务管理 | ❌ 不支持 | ✅ ApplicationService |

## 🎯 重构收益

### 1. 架构清晰

- ✅ **DomainService**：纯领域逻辑，无副作用
- ✅ **ApplicationService**：编排层，负责持久化和事务
- ✅ **层次分明**：领域层 ↔ 应用层 ↔ 基础设施层

### 2. 可测试性提升

**重构前**（难以测试）：

```typescript
// ❌ 需要 Mock Repository
const accountRepo = mock<IAccountRepository>();
accountRepo.existsByUsername.mockResolvedValue(false);
accountRepo.save.mockResolvedValue(account);

const domainService = new AccountDomainService(accountRepo);
const result = await domainService.createAccount(params);
```

**重构后**（易于测试）：

```typescript
// ✅ 不需要 Mock，纯函数
const domainService = new AccountDomainService();
const account = domainService.createAccount(params);

expect(account.username).toBe('testuser');
expect(account.email).toBe('test@example.com');
```

### 3. 事务支持

**重构前**（无法支持事务）：

```typescript
// ❌ 无法传递事务上下文
await domainService.createAccount(params);  // 独立事务
await domainService.updateProfile(uuid, profile);  // 独立事务
```

**重构后**（支持事务）：

```typescript
// ✅ 可以传递事务上下文
await prisma.$transaction(async (tx) => {
  const account = domainService.createAccount(params);
  await accountRepo.save(account, tx);  // 事务上下文
  
  domainService.validateProfileUpdate(account, profile);
  account.updateProfile(profile);
  await accountRepo.save(account, tx);  // 同一事务
});
```

### 4. 代码复用性

**重构前**（逻辑耦合）：

```typescript
// ❌ 无法单独复用验证逻辑
await domainService.createAccount(params);  // 包含验证 + 持久化
```

**重构后**（逻辑解耦）：

```typescript
// ✅ 可以单独复用验证逻辑
domainService.validateAccountCreation(params);  // 只验证
const account = domainService.createAccount(params);  // 创建聚合根
// 可以选择何时何地持久化
```

### 5. 依赖反转

**重构前**（依赖具体实现）：

```typescript
// ❌ DomainService 依赖 Repository 接口
constructor(private readonly accountRepo: IAccountRepository) {}
```

**重构后**（无外部依赖）：

```typescript
// ✅ DomainService 无外部依赖
export class AccountDomainService {
  // 纯领域逻辑，无依赖注入
}
```

## 📝 后续工作

### 1. 创建 ApplicationService（高优先级）

需要创建以下 ApplicationService 来接管持久化职责：

#### Account 模块

- [ ] `AccountRegistrationApplicationService` - 账户注册
- [ ] `AccountProfileApplicationService` - 账户资料管理
- [ ] `AccountEmailApplicationService` - 邮箱管理
- [ ] `AccountStatusApplicationService` - 账户状态管理

#### Authentication 模块

- [ ] `AuthenticationApplicationService` - 认证登录
- [ ] `PasswordManagementApplicationService` - 密码管理
- [ ] `SessionManagementApplicationService` - 会话管理
- [ ] `TwoFactorApplicationService` - 双因素认证
- [ ] `RememberMeApplicationService` - 记住我功能
- [ ] `ApiKeyApplicationService` - API 密钥管理

### 2. 更新 Repository 接口（中优先级）

所有 Repository 方法需要添加可选的事务参数：

```typescript
interface IAccountRepository {
  save(account: Account, tx?: PrismaTransactionClient): Promise<Account>;
  findById(uuid: string, tx?: PrismaTransactionClient): Promise<Account | null>;
  existsByUsername(username: string, tx?: PrismaTransactionClient): Promise<boolean>;
  existsByEmail(email: string, tx?: PrismaTransactionClient): Promise<boolean>;
  // ...
}
```

### 3. 更新调用方代码（高优先级）

所有调用 DomainService 的代码需要更新为调用 ApplicationService：

**重构前**：

```typescript
// ❌ 直接调用 DomainService
await accountDomainService.createAccount(params);
```

**重构后**：

```typescript
// ✅ 调用 ApplicationService
await accountRegistrationAppService.registerAccount(params);
```

### 4. 添加集成测试（中优先级）

- [ ] Account 模块 ApplicationService 集成测试
- [ ] Authentication 模块 ApplicationService 集成测试
- [ ] 事务场景测试

### 5. 更新文档（低优先级）

- [ ] 更新 API 文档
- [ ] 更新架构图
- [ ] 更新开发指南

## 🔍 影响分析

### 破坏性变更

此次重构是**破坏性变更**，所有调用 DomainService 的代码需要修改：

**影响范围**：

1. **应用层**：所有 ApplicationService 需要更新
2. **接口层**：所有 Controller/Handler 需要更新依赖注入
3. **测试代码**：所有测试需要更新 Mock 和断言

### 迁移策略

**建议采用渐进式迁移**：

1. ✅ **Phase 1**：重构 DomainService（已完成）
2. ⏳ **Phase 2**：创建新的 ApplicationService（进行中）
3. ⏳ **Phase 3**：更新调用方代码（计划中）
4. ⏳ **Phase 4**：删除旧代码（计划中）

**兼容性方案**（可选）：

可以暂时保留旧的 DomainService 方法（标记为 `@deprecated`），逐步迁移：

```typescript
export class AccountDomainService {
  /**
   * @deprecated Use AccountRegistrationApplicationService instead
   */
  async createAccount(params): Promise<Account> {
    // 旧实现（保留但标记为弃用）
  }

  // 新实现
  createAccountAggregate(params): Account {
    // 新的纯领域逻辑
  }
}
```

## 📚 参考资料

- [DOMAIN_SERVICE_BEST_PRACTICES.md](./DOMAIN_SERVICE_BEST_PRACTICES.md)
- [DOMAIN_SERVICE_DISCUSSION_SUMMARY.md](./DOMAIN_SERVICE_DISCUSSION_SUMMARY.md)
- [PRISMA_TRANSACTION_ARCHITECTURE.md](../systems/PRISMA_TRANSACTION_ARCHITECTURE.md)
- [DDD 架构最佳实践](.github/prompts/fullstack.prompt.md)

## ✅ 重构验证清单

- [x] AccountDomainService 不再注入 Repository
- [x] AccountDomainService 所有方法不再调用 Repository
- [x] AccountDomainService 只返回聚合根对象
- [x] AuthenticationDomainService 不再注入 Repository
- [x] AuthenticationDomainService 所有方法不再调用 Repository
- [x] AuthenticationDomainService 只返回聚合根对象
- [ ] 创建对应的 ApplicationService
- [ ] 更新 Repository 接口添加事务支持
- [ ] 更新所有调用方代码
- [ ] 添加集成测试
- [ ] 更新文档

---

**重构完成日期**: 2024
**重构负责人**: AI Assistant
**审核状态**: ⏳ 待审核
