# Prisma Transaction 架构详解：为什么看不到数据库操作却能控制事务？

## 📌 问题背景

在 `RegistrationApplicationService.ts` 中，你看到了这样的代码：

```typescript
// 使用 Prisma 事务保证原子性
const result = await prisma.$transaction(async (tx) => {
  // 1. 创建 Account 聚合根
  const account = await this.accountDomainService.createAccount({...});

  // 2. 创建 AuthCredential 聚合根
  const credential = await this.authenticationDomainService.createPasswordCredential({...});

  return { account, credential };
});
```

**疑问**：

> "Prisma 不是用于仓储层控制数据库的吗？这里怎么看着像是控制服务了，都没有数据库操作？"

---

## 🎯 核心概念：Prisma Transaction 的工作原理

### **关键点**：

1. **`prisma.$transaction()` 不是直接操作数据库**，而是创建一个**事务上下文（Transaction Context）**
2. **事务上下文**只对使用 `tx`（Transaction Client）的数据库操作生效
3. **如果内部代码使用的是全局 `prisma` 实例，那么它们不在事务中！**

---

## 📊 调用链路分析

### **完整的调用链路**：

```typescript
┌────────────────────────────────────────────────────────────────┐
│ ApplicationService（事务边界）                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ await prisma.$transaction(async (tx) => {                 │ │
│ │   // ⚠️ 这里创建了事务上下文，但需要传递 tx 才能生效      │ │
│ │                                                            │ │
│ │   const account = await accountDomainService.createAccount()│ │
│ │                         ↓                                  │ │
│ └─────────────────────────┼──────────────────────────────────┘ │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ DomainService（领域逻辑层）                                      │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ async createAccount(params) {                             │ │
│ │   const account = Account.create(params);                 │ │
│ │   return await accountRepository.save(account);           │ │
│ │                         ↓                                  │ │
│ └─────────────────────────┼──────────────────────────────────┘ │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ Repository（数据库操作层）                                       │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ async save(account: Account) {                            │ │
│ │   const data = account.toPersistenceDTO();                │ │
│ │                                                            │ │
│ │   // ⚠️ 关键：这里使用的是全局 prisma，而非 tx！          │ │
│ │   return await prisma.account.create({ data });           │ │
│ │              ^^^^^^ 全局实例，不在事务中                  │ │
│ │                                                            │ │
│ │   // ✅ 正确做法：应该接收并使用 tx                        │ │
│ │   // return await tx.account.create({ data });            │ │
│ │ }                                                          │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ 当前实现的问题

### **问题代码**：

```typescript
// ApplicationService.ts
await prisma.$transaction(async (tx) => {
  // ❌ 问题：这里没有传递 tx 给 DomainService
  const account = await this.accountDomainService.createAccount({...});
  const credential = await this.authenticationDomainService.createPasswordCredential({...});
});

// DomainService.ts
async createAccount(params) {
  const account = Account.create(params);
  // ❌ 问题：这里没有传递 tx 给 Repository
  return await this.accountRepository.save(account);
}

// Repository.ts
async save(account: Account) {
  const data = account.toPersistenceDTO();
  // ❌ 问题：这里使用的是全局 prisma，而非 tx！
  return await prisma.account.create({ data });
  //            ^^^^^^ 全局实例，不在事务中！
}
```

### **问题分析**：

1. `prisma.$transaction(async (tx) => {...})` 创建了事务上下文
2. 但是 `DomainService` 和 `Repository` 不知道自己在事务中
3. 它们使用的是全局 `prisma` 实例，而非事务中的 `tx`
4. **结果**：Account 和 Credential 的创建**不在同一个事务中**！

---

## ✅ 正确的实现方式

### **方案 1: 传递 Transaction Client（推荐）**

#### **1.1 修改 Repository 接口**：

```typescript
// IAccountRepository.ts
export interface IAccountRepository {
  save(account: Account, tx?: PrismaTransactionClient): Promise<Account>;
  findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<Account | null>;
  // ...
}

// PrismaAccountRepository.ts
export class PrismaAccountRepository implements IAccountRepository {
  async save(account: Account, tx?: PrismaTransactionClient): Promise<Account> {
    const data = account.toPersistenceDTO();

    // ✅ 如果传递了 tx，使用 tx；否则使用全局 prisma
    const client = tx || prisma;
    const record = await client.account.create({ data });

    return Account.fromPersistenceDTO(record);
  }
}
```

#### **1.2 修改 DomainService**：

```typescript
// AccountDomainService.ts
export class AccountDomainService {
  async createAccount(params, tx?: PrismaTransactionClient): Promise<Account> {
    const account = Account.create(params);

    // ✅ 传递 tx 给 Repository
    return await this.accountRepository.save(account, tx);
  }
}
```

#### **1.3 修改 ApplicationService**：

```typescript
// RegistrationApplicationService.ts
async createAccountAndCredential(params) {
  const result = await prisma.$transaction(async (tx) => {
    // ✅ 传递 tx 给 DomainService
    const account = await this.accountDomainService.createAccount(params, tx);
    const credential = await this.authDomainService.createPasswordCredential(params, tx);

    return { account, credential };
  });

  return result;
}
```

---

### **方案 2: ApplicationService 直接调用 Repository（临时方案）**

```typescript
// RegistrationApplicationService.ts
async createAccountAndCredential(params) {
  const result = await prisma.$transaction(async (tx) => {
    // ✅ 直接在 ApplicationService 中调用 Repository，传递 tx
    const account = Account.create(params);
    const savedAccount = await this.accountRepository.save(account, tx);

    const credential = AuthCredential.create({
      accountUuid: savedAccount.uuid,
      hashedPassword: params.hashedPassword,
    });
    const savedCredential = await this.credentialRepository.save(credential, tx);

    return { account: savedAccount, credential: savedCredential };
  });

  return result;
}
```

**缺点**：

- ApplicationService 包含了领域逻辑（创建聚合根）
- 违反了 DDD 分层原则
- 但能保证事务性

---

### **方案 3: 使用 Prisma Interactive Transactions（推荐）**

```typescript
// RegistrationApplicationService.ts
async createAccountAndCredential(params) {
  return await prisma.$transaction(async (tx) => {
    // 创建一个临时的 Repository 实例，注入 tx
    const accountRepoWithTx = new PrismaAccountRepository(tx);
    const credentialRepoWithTx = new PrismaAuthCredentialRepository(tx);

    // 创建临时的 DomainService 实例，注入带 tx 的 Repository
    const accountServiceWithTx = new AccountDomainService(accountRepoWithTx);
    const authServiceWithTx = new AuthenticationDomainService(credentialRepoWithTx);

    // 调用 DomainService（它们使用的 Repository 已经包含了 tx）
    const account = await accountServiceWithTx.createAccount(params);
    const credential = await authServiceWithTx.createPasswordCredential(params);

    return { account, credential };
  });
}

// Repository 构造函数支持传递 tx
export class PrismaAccountRepository implements IAccountRepository {
  constructor(private readonly client: PrismaClient | PrismaTransactionClient = prisma) {}

  async save(account: Account): Promise<Account> {
    const data = account.toPersistenceDTO();
    // ✅ 使用构造函数注入的 client（可能是 tx 或全局 prisma）
    const record = await this.client.account.create({ data });
    return Account.fromPersistenceDTO(record);
  }
}
```

---

## 📊 三种方案对比

| 方案                                               | 优点                      | 缺点                                 | 推荐指数   |
| -------------------------------------------------- | ------------------------- | ------------------------------------ | ---------- |
| **方案 1: 传递 tx 参数**                           | 清晰、灵活                | 需要修改所有方法签名                 | ⭐⭐⭐⭐   |
| **方案 2: ApplicationService 直接调用 Repository** | 简单、保证事务性          | 违反 DDD 分层原则                    | ⭐⭐       |
| **方案 3: 构造函数注入 tx**                        | 符合 DDD 原则、保证事务性 | 需要重构 Repository 和 DomainService | ⭐⭐⭐⭐⭐ |

---

## 🎯 推荐实现：方案 3（构造函数注入）

### **重构步骤**：

#### **1. 修改 Repository**：

```typescript
// packages/domain-server/src/account/repositories/implementations/PrismaAccountRepository.ts
export class PrismaAccountRepository implements IAccountRepository {
  constructor(private readonly client: PrismaClient | PrismaTransactionClient = prisma) {}

  async save(account: Account): Promise<Account> {
    const data = account.toPersistenceDTO();
    const record = await this.client.account.create({ data });
    return Account.fromPersistenceDTO(record);
  }

  async findByUuid(uuid: string): Promise<Account | null> {
    const record = await this.client.account.findUnique({ where: { uuid } });
    return record ? Account.fromPersistenceDTO(record) : null;
  }
}
```

#### **2. 修改 DomainService**：

```typescript
// packages/domain-server/src/account/services/AccountDomainService.ts
export class AccountDomainService {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async createAccount(params): Promise<Account> {
    const account = Account.create(params);
    return await this.accountRepository.save(account);
  }
}
```

#### **3. 修改 ApplicationService**：

```typescript
// apps/api/src/modules/account/application/services/RegistrationApplicationService.ts
async createAccountAndCredential(params) {
  return await prisma.$transaction(async (tx) => {
    // 创建带 tx 的 Repository 实例
    const accountRepoWithTx = new PrismaAccountRepository(tx);
    const credentialRepoWithTx = new PrismaAuthCredentialRepository(tx);

    // 创建 DomainService 实例（注入带 tx 的 Repository）
    const accountService = new AccountDomainService(accountRepoWithTx);
    const authService = new AuthenticationDomainService(credentialRepoWithTx);

    // 调用 DomainService（保证事务性）
    const account = await accountService.createAccount(params);
    const credential = await authService.createPasswordCredential({
      accountUuid: account.uuid,
      hashedPassword: params.hashedPassword,
    });

    return { account, credential };
  });
}
```

---

## 🔍 为什么当前代码看起来有效？

你可能会问：如果当前代码无法保证事务性，为什么看起来能正常工作？

**答案**：

1. **大多数情况下能成功**：如果网络正常、数据库健康，两个操作都能成功
2. **极端情况下会失败**：
   - Credential 创建失败时，Account 已经写入数据库（无法回滚）
   - 数据库连接断开时，可能只创建了 Account
   - 并发冲突时，可能导致部分操作失败

3. **测试环境难以复现**：这种问题通常在生产环境高并发或网络不稳定时才会出现

---

## ✅ 总结

### **核心问题**：

**Prisma.$transaction() 只是创建了事务上下文，但不会自动让所有数据库操作都在事务中执行。必须确保内部代码使用的是 `tx`（Transaction Client），而非全局 `prisma` 实例。**

### **解决方案**：

**推荐方案 3（构造函数注入）**：

- Repository 构造函数接受 `client` 参数（可以是 `prisma` 或 `tx`）
- ApplicationService 在事务中创建带 `tx` 的 Repository 实例
- 将这些 Repository 注入到 DomainService
- 保证所有数据库操作都使用同一个 `tx`

### **参考文档**：

- [Prisma Interactive Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions#interactive-transactions)
- [DDD Repository Pattern with Transactions](https://enterprisecraftsmanship.com/posts/domain-driven-design-in-practice/)

---

**创建时间**: 2024-01-XX  
**问题**: Prisma Transaction 无法保证真正的原子性  
**原因**: Repository 使用全局 prisma 而非 Transaction Client  
**解决方案**: 构造函数注入 Transaction Client
