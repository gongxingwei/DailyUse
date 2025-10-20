# Account & Authentication 模块测试完成总结

## 📁 测试文件位置

测试文件已按照最佳实践放置在 `tests` 文件夹中：

### Account 模块测试
- `apps/api/src/modules/account/tests/`
  - ✅ `registration.integration.test.ts` - 用户注册测试
  - ✅ `account-deletion.integration.test.ts` - 账号注销测试

### Authentication 模块测试
- `apps/api/src/modules/authentication/tests/`
  - ✅ `login.integration.test.ts` - 用户登录测试
  - ✅ `logout.integration.test.ts` - 用户登出测试

---

## 🧪 测试覆盖内容

### 1. 注册测试 (`registration.integration.test.ts`)

#### 测试场景：
- ✅ **正常注册流程** - 创建账户 + 凭证（使用事务保证一致性）
- ✅ **用户名重复检测** - 拒绝重复的用户名
- ✅ **邮箱重复检测** - 拒绝重复的邮箱
- ✅ **领域事件发布** - 验证 `account:created` 事件正确发布

#### 测试要点：
```typescript
// 1. 使用 Saga 模式 + 事务保证账户和凭证原子性创建
const result = await registrationService.registerUser(request);

// 2. 验证密码已加密
const credential = await prisma.authCredential.findFirst({
  where: { accountUuid: result.account.uuid, credentialType: 'PASSWORD' }
});
expect(credential?.credentialValue).not.toBe(request.password);

// 3. 验证事件发布
eventBus.on('account:created', eventHandler);
```

---

### 2. 登录测试 (`login.integration.test.ts`)

#### 测试场景：
- ✅ **成功登录** - 创建会话并返回访问令牌
- ✅ **密码验证** - 拒绝错误的密码
- ✅ **用户验证** - 拒绝不存在的用户名
- ✅ **多设备登录** - 支持同一账户多设备同时在线
- ✅ **设备信息记录** - 记录设备类型、位置、IP 等信息

#### 测试要点：
```typescript
// 1. 登录返回会话信息
const result = await authService.login(loginRequest);
expect(result.session.accessToken).toBeDefined();
expect(result.session.refreshToken).toBeDefined();

// 2. 验证数据库中的会话
const dbSession = await prisma.authSession.findUnique({
  where: { uuid: result.session.sessionUuid }
});
expect(dbSession?.accountUuid).toBe(testAccountUuid);
expect(dbSession?.deviceName).toBe('Test Device');
```

---

### 3. 登出测试 (`logout.integration.test.ts`)

#### 测试场景：
- ✅ **单个会话登出** - 终止指定会话
- ✅ **保留其他会话** - 登出一个设备不影响其他设备
- ✅ **全部登出** - 终止账户所有会话
- ✅ **全部登出（保留当前）** - 终止其他设备但保留当前设备
- ✅ **错误处理** - 拒绝终止不存在的会话

#### 测试要点：
```typescript
// 1. 单个会话登出
await sessionService.terminateSession({
  sessionUuid,
  accountUuid: testAccountUuid
});

// 验证会话状态
const dbSession = await prisma.authSession.findUnique({
  where: { uuid: sessionUuid }
});
expect(dbSession?.status).toBe('TERMINATED');

// 2. 全部登出（保留当前）
await sessionService.terminateAllSessions({
  accountUuid: testAccountUuid,
  exceptSessionUuid: currentSessionUuid // 保留当前会话
});
```

---

### 4. 账号注销测试 (`account-deletion.integration.test.ts`)

#### 测试场景：
- ✅ **完整注销流程** - 软删除账户 + 终止所有会话 + 清理凭证
- ✅ **密码二次验证** - 必须验证密码才能注销
- ✅ **防止重复注销** - 拒绝已删除的账户再次注销
- ✅ **注销原因记录** - 支持用户提供注销原因和反馈
- ✅ **注销后无法登录** - 验证已删除账户无法再次登录

#### 测试要点：
```typescript
// 1. 密码验证 + 软删除
const result = await deletionService.deleteAccount({
  accountUuid,
  password: testPassword,
  reason: 'Testing account deletion',
  confirmationText: 'DELETE'
});

// 2. 验证账户状态
const accountAfter = await prisma.account.findUnique({
  where: { uuid: accountUuid }
});
expect(accountAfter?.status).toBe('DELETED');

// 3. 验证所有会话已终止
const sessionsAfter = await prisma.authSession.findMany({
  where: { accountUuid }
});
const activeSessions = sessionsAfter.filter(s => s.status === 'ACTIVE');
expect(activeSessions).toHaveLength(0);
```

---

## 🔧 技术实现要点

### 1. 事务一致性（Saga 模式）
```typescript
// 注册时使用 Prisma 事务保证账户和凭证原子性创建
await prisma.$transaction(async (tx) => {
  const account = await createAccount(tx);
  const credential = await createCredential(tx, account.uuid);
  return { account, credential };
});
```

### 2. 密码安全
```typescript
// 使用 bcrypt 加密密码（12 轮）
const hashedPassword = await bcrypt.hash(password, 12);

// 验证密码
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

### 3. 领域事件驱动
```typescript
// 注册成功后发布事件
eventBus.publish('account:created', {
  accountUuid: account.uuid,
  username: account.username,
  email: account.email,
  occurredOn: Date.now()
});
```

### 4. 测试数据清理
```typescript
// 每个测试后自动清理
afterAll(async () => {
  for (const accountUuid of testAccounts) {
    await prisma.authCredential.deleteMany({ where: { accountUuid } });
    await prisma.authSession.deleteMany({ where: { accountUuid } });
    await prisma.account.delete({ where: { uuid: accountUuid } });
  }
});
```

---

## 🚀 如何运行测试

### 运行所有 API 测试
```bash
pnpm nx test api
```

### 运行特定模块测试
```bash
# Account 模块测试
pnpm nx test api --testPathPattern=account/tests

# Authentication 模块测试
pnpm nx test api --testPathPattern=authentication/tests
```

### 运行单个测试文件
```bash
# 注册测试
pnpm nx test api --testFile=registration.integration.test.ts

# 登录测试
pnpm nx test api --testFile=login.integration.test.ts

# 登出测试
pnpm nx test api --testFile=logout.integration.test.ts

# 注销测试
pnpm nx test api --testFile=account-deletion.integration.test.ts
```

---

## 📝 注意事项

### 1. 测试隔离
- 每个测试使用唯一的时间戳后缀（`Date.now()`）避免数据冲突
- 测试结束后自动清理数据，避免污染数据库

### 2. 测试顺序
- 测试用例之间相互独立，可以任意顺序执行
- 使用 `beforeAll` 和 `afterAll` 管理生命周期

### 3. 真实数据库测试
- 这些是集成测试，连接真实的测试数据库
- 确保测试数据库已正确配置（`DATABASE_URL`）

### 4. 事件监听器清理
```typescript
// 避免事件监听器泄露
afterAll(async () => {
  eventBus.off('account:created', eventHandler);
});
```

---

## ✅ 测试完整性检查

| 功能     | 测试文件                               | 测试场景数 | 状态 |
| -------- | -------------------------------------- | ---------- | ---- |
| 用户注册 | `registration.integration.test.ts`     | 3          | ✅    |
| 用户登录 | `login.integration.test.ts`            | 5          | ✅    |
| 用户登出 | `logout.integration.test.ts`           | 5          | ✅    |
| 账号注销 | `account-deletion.integration.test.ts` | 5          | ✅    |

**总计：18 个测试场景**

---

## 🎯 测试覆盖的核心业务流程

1. **注册流程** ✅
   - 输入验证 → 唯一性检查 → 密码加密 → 创建账户 + 凭证 → 发布事件

2. **登录流程** ✅
   - 用户验证 → 密码验证 → 创建会话 → 返回令牌

3. **登出流程** ✅
   - 会话验证 → 终止会话 → 更新状态

4. **注销流程** ✅
   - 密码验证 → 软删除账户 → 终止所有会话 → 清理凭证

---

## 🔐 安全性验证

- ✅ 密码使用 bcrypt 加密（12 轮）
- ✅ 密码二次验证（注销时）
- ✅ 防止重复注册（用户名/邮箱唯一性）
- ✅ 防止已删除账户登录
- ✅ 会话管理（支持多设备、单独登出、全部登出）

---

## 📚 参考文档

- [DDD 架构指南](../../../.github/prompts/fullstack.prompt.md)
- [事件驱动 vs Saga 模式](../../../docs/systems/EVENT_VS_SAGA_PATTERN_ANALYSIS.md)
- [应用服务最佳实践](../../../docs/architecture/APPLICATION_SERVICE_BEST_PRACTICES.md)

---

## 🎉 总结

所有核心功能（注册、登录、登出、注销）的集成测试已完成，涵盖了：
- ✅ 正常流程测试
- ✅ 异常情况处理
- ✅ 边界条件验证
- ✅ 数据一致性保证
- ✅ 安全性验证

测试文件已按照最佳实践组织在 `tests/` 文件夹中，便于维护和扩展。
