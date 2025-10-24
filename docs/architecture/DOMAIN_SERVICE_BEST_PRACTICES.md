# DomainService 最佳实践：应该调用 Repository 吗？

## 📌 核心问题

**DomainService 应该调用 Repository（仓储层）吗？还是只返回聚合根对象，由 ApplicationService 调用 Repository？**

---

## 🎯 答案：DomainService 不应该调用 Repository（推荐）

### **核心原则**：

> **DomainService 应该只负责纯领域逻辑，不应该涉及持久化操作。持久化由 ApplicationService 统一管理。**

---

## 📊 两种架构对比

### **❌ 反模式：DomainService 调用 Repository**

```typescript
// ❌ DomainService 依赖 Repository
export class AccountDomainService {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async createAccount(params): Promise<Account> {
    // 1. 创建聚合根
    const account = Account.create(params);

    // 2. 业务逻辑验证
    this.validateAccount(account);

    // ❌ 3. 调用 Repository 持久化
    return await this.accountRepository.save(account);
  }
}

// ApplicationService
export class RegistrationApplicationService {
  async registerUser(request) {
    // ApplicationService 只是简单调用 DomainService
    const account = await this.accountDomainService.createAccount(request);
    return account.toClientDTO();
  }
}
```

#### **问题分析**：

1. **职责混乱**：
   - DomainService 既负责领域逻辑，又负责持久化
   - 违反单一职责原则（SRP）

2. **事务控制困难**：

   ```typescript
   // ❌ 难以在事务中调用多个 DomainService
   await prisma.$transaction(async (tx) => {
     // DomainService 内部使用全局 prisma，无法传递 tx
     const account = await accountService.createAccount(params);
     const credential = await authService.createCredential(params);
   });
   ```

3. **基础设施耦合**：
   - DomainService 依赖 Repository 接口（基础设施层）
   - 违反依赖倒置原则（DIP）

4. **测试困难**：
   - 测试 DomainService 时需要 Mock Repository
   - 无法单独测试领域逻辑

---

### **✅ 最佳实践：DomainService 只返回聚合根**

```typescript
// ✅ DomainService 不依赖 Repository
export class AccountDomainService {
  // 不注入任何基础设施依赖

  createAccount(params: { username: string; email: string; displayName: string }): Account {
    // 1. 创建聚合根
    const account = Account.create({
      username: params.username,
      email: params.email,
      displayName: params.displayName,
      status: AccountStatus.ACTIVE,
      emailVerified: false,
    });

    // 2. 业务逻辑验证
    this.validateAccount(account);

    // 3. 只返回聚合根，不持久化
    return account;
  }

  private validateAccount(account: Account): void {
    // 复杂的业务规则验证
    if (account.username.length < 3) {
      throw new DomainError('Username must be at least 3 characters');
    }

    if (!this.isValidEmailDomain(account.email)) {
      throw new DomainError('Email domain not allowed');
    }
  }

  private isValidEmailDomain(email: string): boolean {
    // 复杂的业务逻辑：检查邮箱域名是否在黑名单中
    const domain = email.split('@')[1];
    const blacklist = ['tempmail.com', 'throwaway.email'];
    return !blacklist.includes(domain);
  }
}

// ✅ ApplicationService 负责持久化
export class RegistrationApplicationService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly accountDomainService: AccountDomainService,
  ) {}

  async registerUser(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // 1. 输入验证
    this.validateInput(request);

    // 2. 唯一性检查（ApplicationService 负责）
    await this.checkUniqueness(request.username, request.email);

    // 3. 调用 DomainService 创建聚合根（不持久化）
    const account = this.accountDomainService.createAccount({
      username: request.username,
      email: request.email,
      displayName: request.profile?.nickname || request.username,
    });

    // 4. ApplicationService 负责持久化
    const savedAccount = await this.accountRepository.save(account);

    // 5. 发布领域事件
    await this.publishDomainEvents(savedAccount);

    return { success: true, account: savedAccount.toClientDTO() };
  }

  private async checkUniqueness(username: string, email: string): Promise<void> {
    // ApplicationService 负责调用 Repository 进行查询
    const existingByUsername = await this.accountRepository.findByUsername(username);
    if (existingByUsername) {
      throw new Error('Username already exists');
    }

    const existingByEmail = await this.accountRepository.findByEmail(email);
    if (existingByEmail) {
      throw new Error('Email already exists');
    }
  }
}
```

#### **优点**：

1. **职责清晰**：
   - ✅ DomainService：纯领域逻辑（创建、验证、计算）
   - ✅ ApplicationService：用例编排（查询、持久化、事务、事件）

2. **事务控制简单**：

   ```typescript
   // ✅ ApplicationService 统一控制事务
   await prisma.$transaction(async (tx) => {
     // 1. DomainService 创建聚合根（不持久化）
     const account = accountService.createAccount(params);
     const credential = authService.createPasswordCredential(params);

     // 2. ApplicationService 在事务中持久化
     const savedAccount = await accountRepository.save(account, tx);
     const savedCredential = await credentialRepository.save(credential, tx);

     return { account: savedAccount, credential: savedCredential };
   });
   ```

3. **基础设施解耦**：
   - ✅ DomainService 零基础设施依赖
   - ✅ 可以在不同上下文中重用（Web API、批处理、消息队列）

4. **测试简单**：
   ```typescript
   // ✅ 测试 DomainService 不需要 Mock
   describe('AccountDomainService', () => {
     const service = new AccountDomainService();

     it('should create account with valid data', () => {
       const account = service.createAccount({
         username: 'testuser',
         email: 'test@example.com',
         displayName: 'Test User',
       });

       expect(account.username).toBe('testuser');
       expect(account.status).toBe(AccountStatus.ACTIVE);
     });

     it('should reject invalid username', () => {
       expect(() => {
         service.createAccount({
           username: 'ab', // 太短
           email: 'test@example.com',
           displayName: 'Test',
         });
       }).toThrow('Username must be at least 3 characters');
     });
   });
   ```

---

## 🔄 跨聚合根逻辑如何处理？

### **场景：创建 Account 时需要查询 Organization**

```typescript
// ✅ 方案 1：ApplicationService 先查询，再传递给 DomainService
export class RegistrationApplicationService {
  async registerUser(request) {
    // 1. ApplicationService 查询 Organization
    const organization = await this.organizationRepository.findByCode(request.orgCode);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // 2. 传递给 DomainService
    const account = this.accountDomainService.createAccountInOrganization({
      username: request.username,
      organization: organization, // 传递聚合根对象
    });

    // 3. ApplicationService 持久化
    return await this.accountRepository.save(account);
  }
}

// DomainService 不查询，只接收对象
export class AccountDomainService {
  createAccountInOrganization(params: {
    username: string;
    organization: Organization; // 接收聚合根对象
  }): Account {
    const account = Account.create({
      username: params.username,
      organizationId: params.organization.id,
    });

    // 复杂的业务规则：检查组织是否允许创建账户
    if (!params.organization.canCreateAccount()) {
      throw new DomainError('Organization has reached account limit');
    }

    return account;
  }
}
```

---

## 📊 DomainService 职责清单

### **✅ DomainService 应该做的**：

1. **创建聚合根**：

   ```typescript
   createAccount(params): Account {
     return Account.create(params);
   }
   ```

2. **复杂的业务规则验证**：

   ```typescript
   validateAccountCreation(account: Account, organization: Organization): void {
     if (!organization.canCreateAccount()) {
       throw new DomainError('Cannot create account in this organization');
     }
   }
   ```

3. **复杂的领域计算**：

   ```typescript
   calculateAccountTier(account: Account): AccountTier {
     // 复杂的业务逻辑：根据多个因素计算账户等级
     const activityScore = this.calculateActivityScore(account);
     const contributionScore = this.calculateContributionScore(account);
     return this.determineTier(activityScore, contributionScore);
   }
   ```

4. **跨聚合根的业务协调**：
   ```typescript
   assignAccountToOrganization(account: Account, organization: Organization): void {
     // 业务规则：检查组织是否有剩余名额
     if (organization.memberCount >= organization.maxMembers) {
       throw new DomainError('Organization is full');
     }

     // 修改聚合根状态
     account.assignToOrganization(organization.id);
     organization.incrementMemberCount();
   }
   ```

---

### **❌ DomainService 不应该做的**：

1. **持久化操作**：

   ```typescript
   // ❌ 不要调用 Repository.save()
   async createAccount(params): Promise<Account> {
     const account = Account.create(params);
     return await this.accountRepository.save(account); // ❌
   }
   ```

2. **查询数据库**：

   ```typescript
   // ❌ 不要调用 Repository.find()
   async validateUniqueness(username: string): Promise<void> {
     const existing = await this.accountRepository.findByUsername(username); // ❌
     if (existing) throw new Error('Username exists');
   }
   ```

3. **事务管理**：

   ```typescript
   // ❌ 不要使用 prisma.$transaction
   async createAccountAndCredential(params) {
     return await prisma.$transaction(async (tx) => { // ❌
       // ...
     });
   }
   ```

4. **发布领域事件到事件总线**：

   ```typescript
   // ❌ 不要直接发布到 eventBus
   async createAccount(params): Promise<Account> {
     const account = Account.create(params);
     eventBus.publish('account:created', { accountId: account.id }); // ❌
     return account;
   }

   // ✅ 应该由聚合根记录领域事件，由 ApplicationService 发布
   createAccount(params): Account {
     const account = Account.create(params);
     // 聚合根内部记录领域事件
     account.addDomainEvent(new AccountCreatedEvent(account));
     return account;
   }
   ```

---

## 🎯 重构步骤

### **当前代码的问题**：

```typescript
// ❌ 当前实现：DomainService 调用 Repository
export class AccountDomainService {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async createAccount(params): Promise<Account> {
    const account = Account.create(params);
    return await this.accountRepository.save(account); // ❌ 持久化
  }
}
```

### **重构方案**：

#### **步骤 1: 修改 DomainService（去除 Repository 依赖）**

```typescript
// ✅ 重构后：DomainService 只返回聚合根
export class AccountDomainService {
  // 不再注入 Repository

  createAccount(params: { username: string; email: string; displayName: string }): Account {
    // 1. 创建聚合根
    const account = Account.create({
      username: params.username,
      email: params.email,
      displayName: params.displayName,
      status: AccountStatus.ACTIVE,
      emailVerified: false,
    });

    // 2. 业务逻辑验证
    this.validateAccount(account);

    // 3. 只返回聚合根
    return account;
  }

  private validateAccount(account: Account): void {
    // 复杂的业务规则验证
    if (account.username.length < 3) {
      throw new DomainError('Username must be at least 3 characters');
    }
  }
}
```

#### **步骤 2: 修改 ApplicationService（接管持久化）**

```typescript
// ✅ ApplicationService 负责持久化
export class RegistrationApplicationService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly accountDomainService: AccountDomainService,
  ) {}

  async registerUser(request): Promise<RegisterUserResponse> {
    // 1. 输入验证
    this.validateInput(request);

    // 2. 唯一性检查（ApplicationService 负责）
    await this.checkUniqueness(request.username, request.email);

    // 3. 调用 DomainService 创建聚合根（不持久化）
    const account = this.accountDomainService.createAccount({
      username: request.username,
      email: request.email,
      displayName: request.profile?.nickname || request.username,
    });

    // 4. ApplicationService 负责持久化
    const savedAccount = await this.accountRepository.save(account);

    return { success: true, account: savedAccount.toClientDTO() };
  }
}
```

#### **步骤 3: 事务控制（ApplicationService 统一管理）**

```typescript
export class RegistrationApplicationService {
  async registerUser(request): Promise<RegisterUserResponse> {
    // 事务控制在 ApplicationService
    return await prisma.$transaction(async (tx) => {
      // 1. DomainService 创建聚合根（不持久化）
      const account = this.accountDomainService.createAccount(params);
      const credential = this.authDomainService.createPasswordCredential(params);

      // 2. ApplicationService 在事务中持久化
      const savedAccount = await this.accountRepository.save(account, tx);
      const savedCredential = await this.credentialRepository.save(credential, tx);

      // 3. 发布领域事件
      await this.publishDomainEvents(savedAccount, savedCredential);

      return { account: savedAccount, credential: savedCredential };
    });
  }
}
```

---

## 📚 架构层次总结

```
┌─────────────────────────────────────────────────────────────┐
│ ApplicationService（用例编排层）                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 职责：                                                   │ │
│ │ - 接收请求 DTO                                           │ │
│ │ - 输入验证（格式、非空）                                 │ │
│ │ - 调用 Repository 进行查询（唯一性检查、关联对象查询）   │ │
│ │ - 调用 DomainService 创建聚合根                          │ │
│ │ - 调用 Repository 持久化                                 │ │
│ │ - 控制事务边界（prisma.$transaction）                    │ │
│ │ - 发布领域事件到事件总线                                 │ │
│ │ - 返回响应 DTO                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ 调用
┌─────────────────────────────────────────────────────────────┐
│ DomainService（领域逻辑层）                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 职责：                                                   │ │
│ │ - 创建聚合根（调用 Aggregate.create()）                  │ │
│ │ - 复杂的业务规则验证                                     │ │
│ │ - 跨聚合根的业务协调（但不持久化）                       │ │
│ │ - 复杂的领域计算                                         │ │
│ │ - 只返回聚合根对象，不调用 Repository                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ 调用
┌─────────────────────────────────────────────────────────────┐
│ Aggregate/Entity（聚合根/实体）                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 职责：                                                   │ │
│ │ - 封装内部状态（私有字段）                               │ │
│ │ - 工厂方法（create, fromPersistenceDTO）                │ │
│ │ - 业务方法（修改状态 + 验证）                            │ │
│ │ - 记录领域事件（addDomainEvent）                         │ │
│ │ - DTO 转换（toClientDTO, toPersistenceDTO）             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 结论

### **推荐架构**：

**DomainService 不应该调用 Repository，只返回聚合根对象，由 ApplicationService 负责持久化。**

### **理由**：

1. ✅ **职责清晰**：DomainService 只负责纯领域逻辑
2. ✅ **事务控制简单**：ApplicationService 统一管理事务
3. ✅ **基础设施解耦**：DomainService 零基础设施依赖
4. ✅ **易于测试**：不需要 Mock Repository
5. ✅ **易于重用**：可在不同上下文中使用 DomainService

### **核心原则**：

> **领域逻辑（DomainService、Aggregate）不应该知道自己如何被持久化。持久化是基础设施关注点，由 ApplicationService 统一管理。**

---

**创建时间**: 2024-01-XX  
**问题**: DomainService 应该调用 Repository 吗？  
**答案**: 不应该。DomainService 只负责领域逻辑，返回聚合根对象，由 ApplicationService 负责持久化。  
**参考**: Eric Evans - Domain-Driven Design, Vaughn Vernon - Implementing Domain-Driven Design
