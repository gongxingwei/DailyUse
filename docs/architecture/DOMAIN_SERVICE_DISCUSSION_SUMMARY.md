# DomainService 架构讨论总结

## 📌 问题

**用户提问**：

> "对了，domainService 中是不是最好不要调用仓储层，是不是应该只返回生成的对象，在 applicationService 中调用仓储层？"

---

## 🎯 答案：完全正确！

**DomainService 不应该调用 Repository（仓储层），应该只返回聚合根对象，由 ApplicationService 负责持久化。**

---

## 📊 架构对比

### **❌ 反模式：DomainService 调用 Repository**

```typescript
// ❌ DomainService 依赖 Repository
export class AccountDomainService {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async createAccount(params): Promise<Account> {
    const account = Account.create(params);
    // ❌ 错误：DomainService 调用 Repository 持久化
    return await this.accountRepository.save(account);
  }
}

// ApplicationService 只是简单转发
export class RegistrationApplicationService {
  async registerUser(request) {
    return await this.accountDomainService.createAccount(request);
  }
}
```

**问题**：

1. ❌ 职责混乱：DomainService 既负责领域逻辑又负责持久化
2. ❌ 事务控制困难：难以在事务中调用多个 DomainService
3. ❌ 基础设施耦合：DomainService 依赖 Repository 接口
4. ❌ 测试困难：需要 Mock Repository

---

### **✅ 最佳实践：DomainService 只返回对象**

```typescript
// ✅ DomainService 不依赖 Repository
export class AccountDomainService {
  // 不注入任何基础设施依赖

  createAccount(params: { username: string; email: string; displayName: string }): Account {
    // 1. 创建聚合根
    const account = Account.create(params);

    // 2. 业务逻辑验证
    this.validateAccount(account);

    // 3. 只返回聚合根，不持久化
    return account;
  }

  private validateAccount(account: Account): void {
    if (account.username.length < 3) {
      throw new DomainError('Username too short');
    }
  }
}

// ✅ ApplicationService 负责持久化
export class RegistrationApplicationService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly accountDomainService: AccountDomainService,
  ) {}

  async registerUser(request): Promise<Account> {
    // 1. 唯一性检查（ApplicationService 调用 Repository）
    await this.checkUniqueness(request.username);

    // 2. DomainService 创建聚合根（不持久化）
    const account = this.accountDomainService.createAccount(request);

    // 3. ApplicationService 负责持久化
    const savedAccount = await this.accountRepository.save(account);

    return savedAccount;
  }
}
```

**优点**：

1. ✅ 职责清晰：DomainService 只负责领域逻辑
2. ✅ 事务控制简单：ApplicationService 统一管理事务
3. ✅ 基础设施解耦：DomainService 零基础设施依赖
4. ✅ 易于测试：不需要 Mock Repository

---

## 🔄 事务控制对比

### **❌ 反模式：无法保证真正的事务性**

```typescript
// ❌ 虽然在 $transaction 内部，但无法保证事务性
await prisma.$transaction(async (tx) => {
  // DomainService 内部使用全局 prisma，而非 tx
  const account = await accountService.createAccount(params);
  const credential = await authService.createCredential(params);
  // 如果 credential 失败，account 已经写入数据库，无法回滚
});
```

---

### **✅ 最佳实践：ApplicationService 统一控制事务**

```typescript
// ✅ ApplicationService 统一控制事务
await prisma.$transaction(async (tx) => {
  // 1. DomainService 创建聚合根（不持久化）
  const account = accountService.createAccount(params);
  const credential = authService.createPasswordCredential(params);

  // 2. ApplicationService 在事务中持久化
  const savedAccount = await accountRepository.save(account, tx);
  const savedCredential = await credentialRepository.save(credential, tx);

  // 要么同时成功，要么自动回滚
  return { account: savedAccount, credential: savedCredential };
});
```

---

## 📚 架构层次总结

```
┌─────────────────────────────────────────────────────────────┐
│ ApplicationService（用例编排层）                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 职责：                                                   │ │
│ │ ✅ 接收请求 DTO                                          │ │
│ │ ✅ 输入验证（格式、非空）                                │ │
│ │ ✅ 调用 Repository 查询（唯一性检查、关联对象）          │ │
│ │ ✅ 调用 DomainService 创建聚合根                         │ │
│ │ ✅ 调用 Repository 持久化                                │ │
│ │ ✅ 控制事务边界（prisma.$transaction）                   │ │
│ │ ✅ 发布领域事件                                          │ │
│ │ ✅ 返回响应 DTO                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ 调用
┌─────────────────────────────────────────────────────────────┐
│ DomainService（领域逻辑层）                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 职责：                                                   │ │
│ │ ✅ 创建聚合根（调用 Aggregate.create()）                 │ │
│ │ ✅ 复杂的业务规则验证                                    │ │
│ │ ✅ 跨聚合根的业务协调（但不持久化）                      │ │
│ │ ✅ 复杂的领域计算                                        │ │
│ │ ✅ 只返回聚合根对象                                      │ │
│ │                                                          │ │
│ │ ❌ 不调用 Repository.save()                              │ │
│ │ ❌ 不调用 Repository.find()                              │ │
│ │ ❌ 不控制事务                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ 调用
┌─────────────────────────────────────────────────────────────┐
│ Aggregate/Entity（聚合根/实体）                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 职责：                                                   │ │
│ │ ✅ 封装内部状态                                          │ │
│ │ ✅ 工厂方法（create, fromPersistenceDTO）               │ │
│ │ ✅ 业务方法（修改状态 + 验证）                           │ │
│ │ ✅ 记录领域事件（addDomainEvent）                        │ │
│ │ ✅ DTO 转换                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 核心原则

> **领域逻辑（DomainService、Aggregate）不应该知道自己如何被持久化。持久化是基础设施关注点，由 ApplicationService 统一管理。**

---

## 📖 相关文档

- **详细指南**：[DomainService 最佳实践](../architecture/DOMAIN_SERVICE_BEST_PRACTICES.md)
- **事务控制**：[Prisma Transaction 架构详解](../systems/PRISMA_TRANSACTION_ARCHITECTURE.md)
- **架构对比**：[事件驱动 vs Saga 模式](../systems/EVENT_VS_SAGA_PATTERN_ANALYSIS.md)

---

## ✅ 后续行动

### **当前代码状态**：

- ⚠️ DomainService 依然依赖 Repository（遗留架构）
- ⚠️ 需要重构以符合最佳实践

### **重构计划**：

1. 修改 `AccountDomainService`：去除 Repository 依赖
2. 修改 `AuthenticationDomainService`：去除 Repository 依赖
3. 修改 `RegistrationApplicationService`：接管持久化职责
4. 修改 Repository 接口：支持传递 Transaction Client
5. 更新测试用例

---

**创建时间**: 2024-01-XX  
**问题**: DomainService 应该调用 Repository 吗？  
**答案**: 不应该。DomainService 只负责领域逻辑，返回聚合根对象，由 ApplicationService 负责持久化。  
**用户反馈**: ✅ 完全正确的架构理解
