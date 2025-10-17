# 事件驱动 vs Saga 模式：用户注册业务的架构选型分析

## 📌 问题背景

在用户注册业务中，需要同时创建两个聚合根：
1. **Account**（账户模块）
2. **AuthCredential**（认证模块）

如何保证这两个操作的**原子性**和**数据一致性**？

---

## 🔍 两种架构方案对比

### **方案 1: 异步事件驱动（Fire-and-Forget）**

```typescript
// Account Module (Producer)
async registerUser(request) {
  const account = await this.createAccount(request);
  
  // 🔥 发布事件后立即返回（不等待处理结果）
  eventBus.publish('account:created', {
    accountUuid: account.uuid,
    plainPassword: request.password,
  });
  
  return { success: true, account };
}

// Authentication Module (Consumer)
eventBus.on('account:created', async (event) => {
  const hashedPassword = await bcrypt.hash(event.plainPassword, 12);
  await credentialRepo.create({
    accountUuid: event.accountUuid,
    hashedPassword,
  });
});
```

#### **优点** ✅
- **完全解耦**：Account 模块不依赖 Authentication 模块
- **高性能**：不阻塞主流程，注册请求立即返回
- **易扩展**：添加新订阅者（邮件服务、统计服务）无需修改生产者
- **符合微服务理念**：模块之间通过事件总线通信

#### **缺点** ❌
- **无法保证原子性**：Account 创建成功但 Credential 创建失败
- **数据不一致风险**：用户可能无法登录（有账户但无凭证）
- **需要补偿机制**：定时任务检查并修复不一致数据
- **调试困难**：事件处理失败不会立即反馈给用户

#### **适用场景** 🎯
- 微服务架构（跨服务通信）
- 对一致性要求不高的场景（如发送通知、更新统计）
- 需要极高性能的场景（秒杀、高并发）

---

### **方案 2: Saga 模式 + 本地事务（推荐）**

```typescript
// Account Module (Orchestrator)
async registerUser(request) {
  // 密码加密
  const hashedPassword = await bcrypt.hash(request.password, 12);
  
  // 🔒 使用 Prisma 事务保证原子性
  const result = await prisma.$transaction(async (tx) => {
    // 1. 创建 Account
    const account = await accountService.createAccount({
      username: request.username,
      email: request.email,
    });
    
    // 2. 同步调用 Authentication 模块创建 Credential
    const credential = await authService.createPasswordCredential({
      accountUuid: account.uuid,
      hashedPassword,
    });
    
    // 要么同时成功，要么自动回滚
    return { account, credential };
  });
  
  // 事务成功后才发布领域事件（通知其他服务）
  eventBus.publish('account:created', { accountUuid: result.account.uuid });
  
  return { success: true, account: result.account };
}
```

#### **优点** ✅
- **强一致性**：Account 和 Credential 要么同时成功，要么同时失败
- **无数据不一致**：不会出现"有账户但无凭证"的情况
- **错误处理直观**：Credential 创建失败会立即回滚 Account
- **易于调试**：事务失败会抛出异常，用户立即得到反馈
- **符合 DDD 原则**：通过 DomainService 编排跨聚合根逻辑

#### **缺点** ❌
- **模块耦合度增加**：Account 模块需要知道 Authentication 模块的接口
- **性能略差**：需要等待 Credential 创建完成才能返回
- **扩展性略差**：添加新订阅者需要修改事务逻辑（如果要求原子性）

#### **适用场景** 🎯
- **单体应用**（Monolith）或**模块化单体**（Modular Monolith）
- **对数据一致性要求高的场景**（如用户注册、订单支付）
- **核心业务流程**（不能出错的关键路径）

---

## 🎯 推荐方案：**Saga 模式（本地事务）**

### **为什么选择 Saga 模式？**

1. **业务原子性要求**：
   - 用户注册是核心业务流程，**不能允许数据不一致**
   - 如果 Credential 创建失败，用户无法登录，体验极差
   - 需要保证"Account + Credential 同时存在"的不变量

2. **单体架构特性**：
   - 你的项目是 **Monorepo + DDD 模块化单体架构**
   - 所有模块在同一个进程、同一个数据库中运行
   - 可以使用 **Prisma.$transaction** 轻松实现 ACID 事务

3. **错误处理成本**：
   - 异步事件需要额外的**补偿机制**（定时任务、手动修复）
   - Saga 模式的错误处理是**自动的**（事务回滚）

4. **性能影响可接受**：
   - 用户注册是**低频操作**（每个用户只注册一次）
   - 多等待 100-200ms 创建 Credential 是完全可以接受的

---

## 📊 架构对比总结

| 维度               | 异步事件驱动               | Saga 模式 + 本地事务          |
| ------------------ | -------------------------- | ----------------------------- |
| **数据一致性**     | ❌ 最终一致性（可能不一致） | ✅ 强一致性（ACID 事务）       |
| **模块耦合度**     | ✅ 完全解耦                 | ⚠️ 中等耦合（通过 Service 调用） |
| **性能**           | ✅ 高（不阻塞）             | ⚠️ 中等（需要等待）            |
| **错误处理**       | ❌ 需要补偿机制             | ✅ 自动回滚                    |
| **调试难度**       | ❌ 困难（异步）             | ✅ 简单（同步）                |
| **扩展性**         | ✅ 易于添加订阅者           | ⚠️ 添加需修改事务              |
| **适用架构**       | 微服务                     | 单体 / 模块化单体              |
| **适用业务**       | 非核心流程                 | 核心业务流程                   |

---

## 🔧 实现细节：Saga 模式

### **核心代码结构**

```typescript
export class RegistrationApplicationService {
  constructor(
    private accountRepo: IAccountRepository,
    private credentialRepo: IAuthCredentialRepository,
  ) {
    this.accountService = new AccountDomainService(accountRepo);
    this.authService = new AuthenticationDomainService(credentialRepo);
  }

  async registerUser(request: RegisterUserRequest) {
    // 1. 输入验证
    this.validateInput(request);
    
    // 2. 唯一性检查
    await this.checkUniqueness(request.username, request.email);
    
    // 3. 密码加密
    const hashedPassword = await bcrypt.hash(request.password, 12);
    
    // 🔒 4. 事务 - 创建 Account + Credential
    const result = await prisma.$transaction(async (tx) => {
      const account = await this.accountService.createAccount({
        username: request.username,
        email: request.email,
      });
      
      const credential = await this.authService.createPasswordCredential({
        accountUuid: account.uuid,
        hashedPassword,
      });
      
      return { account, credential };
    });
    
    // 5. 发布领域事件（通知其他服务，如邮件、统计）
    await this.publishDomainEvents(result.account, result.credential);
    
    // 6. 返回结果
    return { success: true, account: result.account.toClientDTO() };
  }
}
```

### **事务保证的原子性**

```typescript
// ✅ 成功场景：Account + Credential 同时创建
await prisma.$transaction(async (tx) => {
  const account = await createAccount();    // 成功
  const credential = await createCredential(); // 成功
  return { account, credential };             // 事务提交
});
// 结果：两条记录都写入数据库 ✅

// ❌ 失败场景：Credential 创建失败
await prisma.$transaction(async (tx) => {
  const account = await createAccount();    // 成功
  const credential = await createCredential(); // 抛出异常 ❌
});
// 结果：事务自动回滚，Account 也不会写入数据库 ✅
```

---

## 🔄 混合模式：核心流程用 Saga，其他用事件

### **最佳实践架构**

```typescript
async registerUser(request: RegisterUserRequest) {
  // 🔒 核心流程：Saga 模式（保证原子性）
  const result = await prisma.$transaction(async (tx) => {
    const account = await this.createAccount(request);
    const credential = await this.createCredential(account, request.password);
    return { account, credential };
  });
  
  // 🔥 非核心流程：异步事件（解耦）
  eventBus.publish('account:created', {
    accountUuid: result.account.uuid,
    username: result.account.username,
    email: result.account.email,
  });
  
  // 订阅者（不影响注册成功）：
  // - 邮件服务：发送欢迎邮件（失败也不影响注册）
  // - 统计服务：更新注册人数（失败也不影响注册）
  // - 审计服务：记录注册日志（失败也不影响注册）
  
  return { success: true, account: result.account.toClientDTO() };
}
```

---

## 📚 相关资源

- [Saga Pattern - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- [Event Sourcing vs ACID Transactions](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [DDD: Aggregate Root Consistency](https://enterprisecraftsmanship.com/posts/domain-driven-design-in-practice/)

---

## 🎯 决策建议

### **对于你的项目（DailyUse）：**

✅ **推荐使用 Saga 模式 + 本地事务**，原因：

1. **单体架构**：所有模块在同一个数据库中，可以用 Prisma.$transaction
2. **核心业务**：用户注册是关键流程，必须保证数据一致性
3. **低频操作**：注册是低频操作，性能影响可接受
4. **简化开发**：不需要额外的补偿机制和监控

### **何时使用异步事件？**

仅在以下场景使用异步事件：
- 发送欢迎邮件（失败不影响注册）
- 更新统计数据（失败不影响注册）
- 记录审计日志（失败不影响注册）

---

**重构完成时间**: 2024-01-XX  
**架构选型**: Saga 模式（本地事务 + 异步事件）  
**审核状态**: ✅ 推荐方案
