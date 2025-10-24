# ApplicationService 创建总结

> **创建日期**: 2024
> **目标**: 为重构后的 DomainService 创建对应的 ApplicationService
> **核心原则**: ApplicationService 负责持久化、事务管理、事件发布

## 📋 创建概述

### 架构分层

重构后的架构严格遵循 DDD 分层原则：

```
┌─────────────────────────────────────────────────┐
│         ApplicationService（应用层）             │
│  - 编排业务流程                                   │
│  - 持久化操作（调用 Repository）                  │
│  - 事务管理（Prisma Transaction）                │
│  - 唯一性检查                                     │
│  - 事件发布                                       │
└──────────────────┬──────────────────────────────┘
                   │ 调用
┌──────────────────▼──────────────────────────────┐
│          DomainService（领域层）                 │
│  - 创建聚合根                                     │
│  - 业务规则验证                                   │
│  - 纯领域逻辑（无副作用）                         │
└──────────────────┬──────────────────────────────┘
                   │ 返回聚合根
┌──────────────────▼──────────────────────────────┐
│          Repository（基础设施层）                │
│  - 数据访问                                       │
│  - 持久化                                         │
│  - 接收事务上下文 tx（待更新）                    │
└─────────────────────────────────────────────────┘
```

## 🆕 已创建的 ApplicationService

### 1. Account 模块（4个服务）

#### 1.1 `RegistrationApplicationService` ✅ (已更新)

**文件**: `apps/api/src/modules/account/application/services/RegistrationApplicationService.ts`

**职责**:

- 用户注册流程编排
- 密码加密（bcrypt）
- 唯一性检查（用户名、邮箱）
- 事务管理（Account + AuthCredential）
- 发布注册事件

**核心流程**:

```typescript
async registerUser(request) {
  // 1. 输入验证
  this.validateRegistrationInput(request);

  // 2. 唯一性检查（ApplicationService 负责）
  await this.checkUniqueness(request.username, request.email);

  // 3. 密码加密
  const hashedPassword = await this.hashPassword(request.password);

  // 4. 事务：创建 Account + AuthCredential
  const result = await prisma.$transaction(async (tx) => {
    // 4.1 调用 DomainService 创建 Account 聚合根
    const account = this.accountDomainService.createAccount({
      username, email, displayName
    });

    // 4.2 ApplicationService 持久化 Account
    await this.accountRepository.save(account); // TODO: save(account, tx)

    // 4.3 调用 DomainService 创建 AuthCredential 聚合根
    const credential = this.authenticationDomainService.createPasswordCredential({
      accountUuid: account.uuid, hashedPassword
    });

    // 4.4 ApplicationService 持久化 Credential
    await this.credentialRepository.save(credential); // TODO: save(credential, tx)

    return { account, credential };
  });

  // 5. 发布领域事件
  await this.publishDomainEvents(result.account, result.credential);

  // 6. 返回 DTO
  return result.account.toClientDTO();
}
```

**重构变更**:

- ✅ 更新为调用重构后的 DomainService
- ✅ DomainService 只创建聚合根，不持久化
- ✅ ApplicationService 负责所有持久化操作
- ⚠️ Repository.save() 待更新以支持 tx 参数

---

#### 1.2 `AccountProfileApplicationService` ✅ (新创建)

**文件**: `apps/api/src/modules/account/application/services/AccountProfileApplicationService.ts`

**职责**:

- 账户资料更新
- 调用 DomainService 验证业务规则
- 持久化更新
- 发布资料更新事件

**核心方法**:

- `updateProfile(request)` - 更新账户资料

**流程**:

```typescript
async updateProfile(request) {
  // 1. 查询账户（ApplicationService 负责）
  const account = await this.accountRepository.findById(request.accountUuid);

  // 2. DomainService 验证业务规则
  this.accountDomainService.validateProfileUpdate(account, {
    displayName, avatar, bio, timezone, language
  });

  // 3. 修改聚合根
  account.updateProfile({ displayName, avatar, bio, timezone, language });

  // 4. 持久化
  await this.accountRepository.save(account); // TODO: save(account, tx)

  // 5. 发布领域事件
  await this.publishDomainEvents(account);

  return account.toClientDTO();
}
```

**事件**:

- `account:profile_updated` - 资料更新成功

---

#### 1.3 `AccountEmailApplicationService` ✅ (新创建)

**文件**: `apps/api/src/modules/account/application/services/AccountEmailApplicationService.ts`

**职责**:

- 更新邮箱地址
- 验证邮箱
- 唯一性检查
- 持久化更新
- 发布邮箱相关事件

**核心方法**:

- `updateEmail(request)` - 更新邮箱
- `verifyEmail(request)` - 验证邮箱

**流程 - 更新邮箱**:

```typescript
async updateEmail(request) {
  // 1. 查询账户
  const account = await this.accountRepository.findById(request.accountUuid);

  // 2. 检查新邮箱唯一性（ApplicationService 负责）
  await this.checkEmailUniqueness(request.newEmail);

  // 3. DomainService 验证业务规则
  this.accountDomainService.validateEmailUpdate(account, request.newEmail);

  // 4. 修改聚合根
  account.updateEmail(request.newEmail);

  // 5. 持久化
  await this.accountRepository.save(account); // TODO: save(account, tx)

  // 6. 发布领域事件
  await this.publishEmailUpdatedEvent(account);

  return account.toClientDTO();
}
```

**流程 - 验证邮箱**:

```typescript
async verifyEmail(request) {
  // 1. 查询账户
  const account = await this.accountRepository.findById(request.accountUuid);

  // 2. 调用聚合根方法验证邮箱
  account.verifyEmail();

  // 3. 持久化
  await this.accountRepository.save(account); // TODO: save(account, tx)

  // 4. 发布领域事件
  await this.publishEmailVerifiedEvent(account);

  return account.toClientDTO();
}
```

**事件**:

- `account:email_updated` - 邮箱更新成功
- `account:email_verified` - 邮箱验证成功

---

#### 1.4 `AccountStatusApplicationService` ✅ (新创建)

**文件**: `apps/api/src/modules/account/application/services/AccountStatusApplicationService.ts`

**职责**:

- 记录登录
- 停用账户
- 删除账户（软删除）
- 持久化状态变更
- 发布状态变更事件

**核心方法**:

- `recordLogin(request)` - 记录登录
- `deactivateAccount(request)` - 停用账户
- `deleteAccount(request)` - 删除账户

**流程 - 记录登录**:

```typescript
async recordLogin(request) {
  // 1. 查询账户
  const account = await this.accountRepository.findById(request.accountUuid);

  // 2. 调用聚合根方法记录登录
  account.recordLogin();

  // 3. 持久化
  await this.accountRepository.save(account); // TODO: save(account, tx)

  // 4. 发布领域事件
  await this.publishLoginRecordedEvent(account);

  return account.toClientDTO();
}
```

**流程 - 停用账户**:

```typescript
async deactivateAccount(request) {
  // 1. 查询账户
  const account = await this.accountRepository.findById(request.accountUuid);

  // 2. 调用聚合根方法停用账户
  account.deactivate();

  // 3. 持久化
  await this.accountRepository.save(account); // TODO: save(account, tx)

  // 4. 发布领域事件
  await this.publishAccountDeactivatedEvent(account);

  return account.toClientDTO();
}
```

**流程 - 删除账户**:

```typescript
async deleteAccount(request) {
  // 1. 查询账户
  const account = await this.accountRepository.findById(request.accountUuid);

  // 2. 验证是否可以删除（调用 DomainService）
  const canDelete = this.accountDomainService.canDeleteAccount(account);
  if (!canDelete) {
    throw new Error('Account cannot be deleted (already deleted)');
  }

  // 3. 调用聚合根方法软删除
  account.softDelete();

  // 4. 持久化
  await this.accountRepository.save(account); // TODO: save(account, tx)

  // 5. 发布领域事件
  await this.publishAccountDeletedEvent(account);
}
```

**事件**:

- `account:login_recorded` - 登录记录成功
- `account:deactivated` - 账户已停用
- `account:deleted` - 账户已删除

---

### 2. Authentication 模块（待创建）

以下 ApplicationService 需要创建：

#### 2.1 `AuthenticationApplicationService` ⏳

**职责**:

- 用户登录验证
- 密码验证
- 创建会话（Session）
- 记录失败登录
- 锁定/解锁凭证

**核心方法**（待实现）:

- `login(username, password)` - 用户登录
- `verifyCredentials(accountUuid, hashedPassword)` - 验证凭证
- `recordFailedLogin(accountUuid)` - 记录失败登录
- `resetFailedAttempts(accountUuid)` - 重置失败次数

---

#### 2.2 `PasswordManagementApplicationService` ⏳

**职责**:

- 修改密码
- 重置密码
- 密码强度验证

**核心方法**（待实现）:

- `changePassword(accountUuid, oldPassword, newPassword)` - 修改密码
- `resetPassword(accountUuid, newPassword)` - 重置密码

---

#### 2.3 `SessionManagementApplicationService` ⏳

**职责**:

- 创建会话
- 刷新令牌
- 撤销会话
- 记录会话活动

**核心方法**（待实现）:

- `createSession(accountUuid, device, ipAddress)` - 创建会话
- `refreshAccessToken(sessionUuid, newAccessToken)` - 刷新访问令牌
- `revokeSession(sessionUuid)` - 撤销会话
- `revokeAllSessions(accountUuid)` - 撤销所有会话

---

#### 2.4 `TwoFactorApplicationService` ⏳

**职责**:

- 启用/禁用双因素认证
- 验证双因素代码

**核心方法**（待实现）:

- `enableTwoFactor(accountUuid, method)` - 启用双因素认证
- `disableTwoFactor(accountUuid)` - 禁用双因素认证
- `verifyTwoFactorCode(accountUuid, code)` - 验证双因素代码

---

#### 2.5 `RememberMeApplicationService` ⏳

**职责**:

- 生成记住我令牌
- 验证记住我令牌
- 刷新记住我令牌
- 撤销记住我令牌

**核心方法**（待实现）:

- `generateRememberMeToken(accountUuid, deviceInfo)` - 生成令牌
- `verifyRememberMeToken(accountUuid, token, deviceFingerprint)` - 验证令牌
- `refreshRememberMeToken(accountUuid, oldToken)` - 刷新令牌
- `revokeRememberMeToken(accountUuid, tokenUuid)` - 撤销令牌

---

#### 2.6 `ApiKeyApplicationService` ⏳

**职责**:

- 生成 API 密钥
- 撤销 API 密钥

**核心方法**（待实现）:

- `generateApiKey(accountUuid, name, expiresInDays)` - 生成 API 密钥
- `revokeApiKey(accountUuid, keyUuid)` - 撤销 API 密钥

---

## 📊 创建统计

### 文件创建

| 模块           | 服务数量 | 已创建 | 待创建 | 状态      |
| -------------- | -------- | ------ | ------ | --------- |
| Account        | 4        | 4      | 0      | ✅ 完成   |
| Authentication | 6        | 0      | 6      | ⏳ 待创建 |
| **总计**       | **10**   | **4**  | **6**  | **40%**   |

### 方法统计

| 模块           | 方法数量 | 已实现 | 待实现  |
| -------------- | -------- | ------ | ------- |
| Account        | 7        | 7      | 0       |
| Authentication | ~20      | 0      | ~20     |
| **总计**       | **~27**  | **7**  | **~20** |

## 🎯 架构收益

### 1. 职责清晰

| 层次                   | 职责                     | 示例                                   |
| ---------------------- | ------------------------ | -------------------------------------- |
| **ApplicationService** | 编排、持久化、事务、事件 | `RegistrationApplicationService`       |
| **DomainService**      | 创建聚合根、验证业务规则 | `AccountDomainService.createAccount()` |
| **Repository**         | 数据访问                 | `IAccountRepository.save()`            |

### 2. 事务支持

**正确的事务模式**:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. DomainService 创建聚合根（无副作用）
  const account = this.domainService.createAccount(params);

  // 2. ApplicationService 持久化（使用事务上下文）
  await this.repository.save(account); // TODO: save(account, tx)

  // 3. 其他操作也在同一事务中...
});
```

### 3. 可测试性

**ApplicationService 测试**:

```typescript
// Mock Repository
const mockRepo = mock<IAccountRepository>();
mockRepo.findById.mockResolvedValue(account);

// 测试 ApplicationService
const appService = new AccountProfileApplicationService(mockRepo);
const result = await appService.updateProfile(request);

// 验证流程
expect(mockRepo.findById).toHaveBeenCalledWith(accountUuid);
expect(mockRepo.save).toHaveBeenCalledWith(account);
```

**DomainService 测试**（纯函数）:

```typescript
// 不需要 Mock
const domainService = new AccountDomainService();

// 直接测试
expect(() => domainService.validateProfileUpdate(account, invalidProfile)).toThrow(
  'Display name cannot be empty',
);
```

## ⚠️ 待完成工作

### 高优先级

- [ ] **创建 Authentication 模块的 6 个 ApplicationService**
  - [ ] `AuthenticationApplicationService`
  - [ ] `PasswordManagementApplicationService`
  - [ ] `SessionManagementApplicationService`
  - [ ] `TwoFactorApplicationService`
  - [ ] `RememberMeApplicationService`
  - [ ] `ApiKeyApplicationService`

- [ ] **更新 Repository 接口**

  ```typescript
  interface IAccountRepository {
    save(account: Account, tx?: PrismaTransactionClient): Promise<void>;
    findById(uuid: string, tx?: PrismaTransactionClient): Promise<Account | null>;
    // ...
  }
  ```

- [ ] **更新 Controller/Handler**
  - 修改依赖注入，使用 ApplicationService 而非 DomainService
  - 更新所有调用方代码

### 中优先级

- [ ] **添加集成测试**
  - Account 模块 ApplicationService 集成测试
  - Authentication 模块 ApplicationService 集成测试
  - 事务场景测试

- [ ] **优化事务处理**
  - 实现 Repository 的 tx 参数传递
  - 验证事务回滚机制

### 低优先级

- [ ] **更新文档**
  - 更新 API 文档
  - 更新架构图
  - 更新开发指南

- [ ] **性能优化**
  - 添加缓存层
  - 优化数据库查询

## 🔍 使用示例

### Account 模块

```typescript
// 1. 用户注册
const registrationService = await RegistrationApplicationService.getInstance();
const result = await registrationService.registerUser({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  profile: { nickname: 'John' },
});

// 2. 更新资料
const profileService = await AccountProfileApplicationService.getInstance();
await profileService.updateProfile({
  accountUuid: 'uuid-123',
  displayName: 'John Doe',
  bio: 'Software Engineer',
});

// 3. 更新邮箱
const emailService = await AccountEmailApplicationService.getInstance();
await emailService.updateEmail({
  accountUuid: 'uuid-123',
  newEmail: 'newemail@example.com',
});

// 4. 验证邮箱
await emailService.verifyEmail({ accountUuid: 'uuid-123' });

// 5. 记录登录
const statusService = await AccountStatusApplicationService.getInstance();
await statusService.recordLogin({ accountUuid: 'uuid-123' });

// 6. 停用账户
await statusService.deactivateAccount({ accountUuid: 'uuid-123' });

// 7. 删除账户
await statusService.deleteAccount({ accountUuid: 'uuid-123' });
```

## 📚 参考资料

- [DOMAIN_SERVICE_REFACTORING_SUMMARY.md](./DOMAIN_SERVICE_REFACTORING_SUMMARY.md) - DomainService 重构总结
- [DOMAIN_SERVICE_BEST_PRACTICES.md](./DOMAIN_SERVICE_BEST_PRACTICES.md) - DomainService 最佳实践
- [PRISMA_TRANSACTION_ARCHITECTURE.md](../systems/PRISMA_TRANSACTION_ARCHITECTURE.md) - Prisma 事务架构

---

**创建完成日期**: 2024
**创建负责人**: AI Assistant
**完成度**: 40% (Account 模块完成，Authentication 模块待创建)
