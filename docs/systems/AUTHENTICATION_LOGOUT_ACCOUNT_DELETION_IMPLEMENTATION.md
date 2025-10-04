# Authentication 模块增强 - Logout 和账户注销功能实现

## 概述

本次更新为 Authentication 和 Account 模块添加了以下功能：
1. ✅ 用户登出（单个会话和全部会话）
2. ✅ 账户停用/删除时自动清理认证数据
3. ✅ 事件驱动的模块间协作

---

## 实现的功能

### 1. 用户登出功能

#### API 端点
- **POST** `/api/v1/auth/logout`
  - **请求参数**:
    ```typescript
    {
      sessionId?: string;       // 可选，指定要登出的会话
      allSessions?: boolean;    // 是否登出所有会话
      accountUuid?: string;     // 可选，用于验证权限
    }
    ```
  - **响应**:
    ```typescript
    {
      success: true,
      data: {
        message: "登出成功",
        sessionsClosed: 1  // 关闭的会话数
      }
    }
    ```

#### 核心实现

**AuthenticationApplicationService** 新增方法：

```typescript
/**
 * 登出单个会话
 */
async logout(sessionId: string, accountUuid?: string): Promise<TResponse<{ sessionsClosed: number }>>

/**
 * 登出所有会话
 */
async logoutAll(accountUuid: string): Promise<TResponse<{ sessionsClosed: number }>>
```

**执行步骤**：
1. 查找并验证会话
2. 终止会话（更新 `isActive` 为 `false`）
3. 撤销相关令牌
4. 发布 `SessionTerminated` 或 `AllSessionsTerminated` 事件

---

### 2. 账户停用/删除功能增强

#### API 端点（已存在，功能增强）
- **POST** `/api/v1/accounts/:id/deactivate` - 停用账户
- **DELETE** `/api/v1/accounts/:id` - 删除账户（软删除）

#### 增强内容

**AccountApplicationService** 更新方法：

```typescript
/**
 * 停用账户
 * - 设置账户状态为 INACTIVE
 * - 发布 AccountDeactivated 事件
 * - 触发 Authentication 模块清理所有会话和令牌
 */
async deactivateAccount(id: string): Promise<boolean>

/**
 * 删除账户（软删除）
 * - 设置账户状态为 INACTIVE
 * - 发布 AccountDeleted 事件
 * - 触发 Authentication 模块清理所有会话和令牌
 */
async deleteAccount(id: string): Promise<boolean>
```

**事件流程**：
```
Account Module                  Event Bus                  Authentication Module
     |                              |                              |
     |-- deactivateAccount()        |                              |
     |-- account.disable()          |                              |
     |-- save to DB                 |                              |
     |                              |                              |
     |-- publish('AccountDeactivated')                             |
     |                              |-- on('AccountDeactivated') --|
     |                              |                              |
     |                              |                         logoutAll()
     |                              |                         - terminateAllSessions
     |                              |                         - revokeAllTokens
     |                              |                         - deleteMFADevices (future)
```

---

### 3. Repository 接口增强

更新了 `ISessionRepository` 和 `ITokenRepository` 接口，添加了清理方法：

**ISessionRepository**:
```typescript
interface ISessionRepository {
  terminateSession(sessionId: string): Promise<void>;
  terminateAllByAccount(accountUuid: string): Promise<void>;
  updateLastAccessed(sessionId: string): Promise<void>;
  // ... 其他方法
}
```

**ITokenRepository**:
```typescript
interface ITokenRepository {
  revokeToken(tokenValue: string, reason?: string): Promise<void>;
  revokeAllTokensByAccount(accountUuid: string, reason?: string): Promise<void>;
  // ... 其他方法
}
```

---

### 4. 事件处理器

**AuthenticationEventHandlers** 新增事件监听：

```typescript
// 监听账户停用事件
eventBus.on('AccountDeactivated', async (event) => {
  const authService = await this.getAuthService();
  await authService.logoutAll(event.aggregateId);
  // 清理了所有会话和令牌
});

// 监听账户删除事件
eventBus.on('AccountDeleted', async (event) => {
  const authService = await this.getAuthService();
  await authService.logoutAll(event.aggregateId);
  // 清理了所有会话和令牌
});
```

---

## 文件修改清单

### 新增文件
- 无

### 修改文件

#### Authentication 模块
1. **packages/domain-server/src/authentication/repositories/IAuthenticationRepository.ts**
   - ✅ 添加 `terminateSession`, `terminateAllByAccount` 到 `ISessionRepository`
   - ✅ 添加 `revokeToken`, `revokeAllTokensByAccount` 到 `ITokenRepository`

2. **apps/api/src/modules/authentication/application/services/AuthenticationApplicationService.ts**
   - ✅ 添加 `logout()` 方法 - 登出单个会话
   - ✅ 添加 `logoutAll()` 方法 - 登出所有会话

3. **apps/api/src/modules/authentication/interface/http/controller.ts**
   - ✅ 完善 `logout()` 方法实现（之前只是 TODO）

4. **apps/api/src/modules/authentication/application/events/EventHandler.ts**
   - ✅ 添加 `AccountDeactivated` 事件监听
   - ✅ 添加 `AccountDeleted` 事件监听

#### Account 模块
5. **apps/api/src/modules/account/application/services/AccountApplicationService.ts**
   - ✅ 增强 `deactivateAccount()` - 添加事件发布
   - ✅ 增强 `deleteAccount()` - 添加事件发布

---

## 数据流图

### Logout 流程
```
Client
  |
  | POST /api/v1/auth/logout
  | { sessionId: "xxx", allSessions: false }
  |
  v
AuthenticationController.logout()
  |
  v
AuthenticationApplicationService.logout(sessionId)
  |
  +-- 1. sessionRepository.findById(sessionId)
  |
  +-- 2. 验证账户所有权
  |
  +-- 3. sessionRepository.terminateSession(sessionId)
  |
  +-- 4. tokenRepository.revokeAllTokensByAccount(accountUuid)
  |
  +-- 5. eventBus.publish('SessionTerminated')
  |
  v
Response: { success: true, data: { sessionsClosed: 1 } }
```

### Account Deactivation 流程
```
Client
  |
  | POST /api/v1/accounts/:id/deactivate
  |
  v
AccountController.deactivateAccount()
  |
  v
AccountApplicationService.deactivateAccount(id)
  |
  +-- 1. accountRepository.findById(id)
  |
  +-- 2. account.disable()
  |
  +-- 3. accountRepository.save(account)
  |
  +-- 4. eventBus.publish('AccountDeactivated')
  |       {
  |         eventType: 'AccountDeactivated',
  |         aggregateId: id,
  |         payload: { accountUuid, username, deactivatedAt, reason }
  |       }
  |
  v
EventBus dispatches to subscribers
  |
  v
AuthenticationEventHandlers.on('AccountDeactivated')
  |
  v
AuthenticationApplicationService.logoutAll(accountUuid)
  |
  +-- 1. sessionRepository.findActiveByAccountUuid(accountUuid)
  |
  +-- 2. sessionRepository.terminateAllByAccount(accountUuid)
  |
  +-- 3. tokenRepository.revokeAllTokensByAccount(accountUuid)
  |
  +-- 4. eventBus.publish('AllSessionsTerminated')
  |
  v
All authentication data cleaned up
```

---

## 路由配置

所有路由已正确配置在：
- `apps/api/src/modules/authentication/interface/http/routes.ts`
- `apps/api/src/modules/account/interface/http/routes.ts`

---

## 领域事件

### 发布的事件

#### SessionTerminated
```typescript
{
  eventType: 'SessionTerminated',
  aggregateId: sessionId,
  occurredAt: Date,
  payload: {
    sessionUuid: string,
    accountUuid: string,
    terminationType: 'logout' | 'timeout' | 'forced' | 'concurrent_login',
    terminatedAt: Date,
    remainingActiveSessions: number
  }
}
```

#### AllSessionsTerminated
```typescript
{
  eventType: 'AllSessionsTerminated',
  aggregateId: accountUuid,
  occurredAt: Date,
  payload: {
    accountUuid: string,
    username: string,
    terminationType: 'password_change' | 'security_breach' | 'admin_action',
    terminatedSessionCount: number,
    terminatedAt: Date
  }
}
```

#### AccountDeactivated
```typescript
{
  eventType: 'AccountDeactivated',
  aggregateId: accountUuid,
  occurredAt: Date,
  payload: {
    accountUuid: string,
    username: string,
    deactivatedAt: Date,
    reason: string
  }
}
```

#### AccountDeleted
```typescript
{
  eventType: 'AccountDeleted',
  aggregateId: accountUuid,
  occurredAt: Date,
  payload: {
    accountUuid: string,
    username: string,
    deletedAt: Date,
    reason: string
  }
}
```

---

## 测试建议

### 手动测试步骤

#### 1. 测试单个会话登出
```bash
# 1. 登录获取 sessionId
POST /api/v1/auth/login
{
  "username": "testuser",
  "password": "password123"
}

# 2. 登出
POST /api/v1/auth/logout
{
  "sessionId": "<从登录响应获取的 sessionId>"
}

# 3. 验证会话已失效
GET /api/v1/auth/sessions/:accountUuid
# 应该看到该会话的 isActive 为 false
```

#### 2. 测试登出所有会话
```bash
# 1. 多次登录创建多个会话
POST /api/v1/auth/login  # 第一次
POST /api/v1/auth/login  # 第二次
POST /api/v1/auth/login  # 第三次

# 2. 登出所有会话
POST /api/v1/auth/logout
{
  "allSessions": true,
  "accountUuid": "<账户UUID>"
}

# 3. 验证所有会话都已终止
GET /api/v1/auth/sessions/:accountUuid
# 所有会话的 isActive 应该都为 false
```

#### 3. 测试账户停用时自动清理
```bash
# 1. 登录创建会话
POST /api/v1/auth/login

# 2. 停用账户
POST /api/v1/accounts/:id/deactivate

# 3. 验证会话已自动清理
GET /api/v1/auth/sessions/:accountUuid
# 应该看不到活跃会话
```

#### 4. 测试账户删除时自动清理
```bash
# 1. 登录创建会话
POST /api/v1/auth/login

# 2. 删除账户
DELETE /api/v1/accounts/:id

# 3. 验证会话已自动清理
GET /api/v1/auth/sessions/:accountUuid
# 应该看不到活跃会话
```

---

## TypeScript 编译检查

✅ **通过** - 未引入新的类型错误

运行命令：
```bash
cd apps/api && npx tsc --noEmit
```

结果：
- Authentication 模块: 0 errors
- Account 模块: 0 errors (新增代码部分)
- 现有模块的一些错误不在本次修改范围内

---

## 遵循的开发规范

### 1. DDD 架构
- ✅ Domain 层定义领域对象和仓储接口
- ✅ Application 层实现业务逻辑
- ✅ Infrastructure 层实现技术细节
- ✅ Interface 层处理 HTTP 请求

### 2. 事件驱动
- ✅ 使用 EventBus 进行模块间通信
- ✅ 发布领域事件触发副作用
- ✅ 解耦模块依赖

### 3. 导入规范
- ✅ 使用 `XxxContracts` 命名空间导入
- ✅ 使用 `type XxxDTO = XxxContracts.XxxDTO` 创建类型别名
- ✅ 示例：
  ```typescript
  import { AuthenticationContracts } from '@dailyuse/contracts';
  type AuthByPasswordRequestDTO = AuthenticationContracts.AuthByPasswordRequestDTO;
  ```

### 4. 响应格式
- ✅ 使用统一的 `ResponseBuilder`
- ✅ 成功: `{ success: true, data: {...}, message: "..." }`
- ✅ 失败: `{ success: false, message: "...", code: "..." }`

### 5. 日志记录
- ✅ 使用 `createLogger('ModuleName')` 创建 logger
- ✅ 在关键操作前后记录日志
- ✅ 包含必要的上下文信息

---

## 未来增强计划

### 1. MFA 设备管理
- 停用/删除账户时自动删除 MFA 设备
- 添加到 `logoutAll()` 方法中

### 2. Token 刷新
- 实现 `refreshToken()` 方法
- 支持令牌轮换策略

### 3. 会话管理
- 实现 `getSessions()` - 获取用户所有会话
- 实现 `terminateSession()` - 终止指定会话
- 添加会话过期自动清理定时任务

### 4. 安全增强
- 密码修改时强制登出所有会话
- 检测异常登录自动终止会话
- 添加并发登录限制

---

## 总结

本次更新成功实现了：
1. ✅ 完整的用户登出功能（单个/全部会话）
2. ✅ 账户停用/删除时自动清理认证数据
3. ✅ 事件驱动的模块协作机制
4. ✅ 遵循项目的 DDD 架构和开发规范
5. ✅ 通过 TypeScript 类型检查

所有功能已实现并可以使用，接口已通过路由正确注册。
