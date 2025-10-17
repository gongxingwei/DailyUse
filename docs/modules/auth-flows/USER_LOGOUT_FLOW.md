# 用户登出流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-17
- **架构模式**: DDD (Account 模块 + Authentication 模块分离)
- **相关模块**: Authentication
- **业务场景**: 用户主动登出当前会话

---

## 1. 业务概述

### 1.1 业务目标

用户主动退出当前登录会话，系统需要：
- 注销当前会话（Session）
- 使 access token 和 refresh token 失效
- 记录登出历史
- 支持单设备登出或全设备登出
- 清理客户端存储的敏感信息

### 1.2 核心原则

- **Authentication 模块**：负责会话管理、token 失效
- **Account 模块**：无直接参与（可选更新最后活动时间）
- **安全优先**：确保登出后 token 不可再用
- **用户体验**：支持多端会话管理

### 1.3 前置条件

- 用户已登录
- 用户提供有效的 access token
- 会话存在且状态为 ACTIVE

### 1.4 后置条件

- ✅ AuthSession 状态已更新为 REVOKED
- ✅ access token 和 refresh token 已失效
- ✅ 会话历史已记录登出事件
- ✅ 领域事件已发布：`UserLoggedOutEvent`
- ✅ 返回登出成功响应

---

## 2. 架构分层设计

### 2.1 领域模型 (Domain Layer)

#### Authentication 模块 (packages/domain-server/authentication/)

**聚合根**: `AuthSession`
- 属性:
  - `uuid`: 会话唯一标识
  - `accountUuid`: 关联账户 UUID
  - `accessToken`: 访问令牌
  - `refreshToken`: 刷新令牌
  - `status`: 会话状态（ACTIVE, EXPIRED, REVOKED, LOCKED）
  - `revokedAt`: 注销时间
- 方法:
  - `revoke()`: 注销会话
  - `recordActivity(type: string)`: 记录活动

**领域服务**: `AuthenticationDomainService`
- 职责:
  - 查询会话（getSessionByAccessToken）
  - 注销会话（revokeSession）
  - 注销所有会话（revokeAllSessions）

**仓储接口**: `IAuthSessionRepository`
```typescript
interface IAuthSessionRepository {
  findByUuid(uuid: string): Promise<AuthSession | null>;
  findByAccessToken(accessToken: string): Promise<AuthSession | null>;
  findActiveSessionsByAccountUuid(accountUuid: string): Promise<AuthSession[]>;
  save(session: AuthSession): Promise<void>;
}
```

---

### 2.2 应用层 (Application Layer)

#### 登出应用服务 (apps/api/modules/authentication/application/services/)

**服务**: `AuthenticationApplicationService`

**核心用例**: `logout()`, `logoutAll()`

**输入 DTO**:
```typescript
interface LogoutRequest {
  accessToken: string;       // 当前会话的 access token
}

interface LogoutAllRequest {
  accountUuid: string;       // 账户 UUID
  accessToken: string;       // 当前会话的 access token（用于验证身份）
}
```

**输出 DTO**:
```typescript
interface LogoutResponse {
  success: boolean;
  message: string;
  revokedSessionsCount?: number;  // 注销的会话数量（logoutAll）
}
```

**职责**:
1. 验证 access token 有效性
2. 查询会话（通过 AuthSessionRepository）
3. 注销会话：
   - 单设备登出：注销当前会话
   - 全设备登出：注销账户下所有活跃会话
4. 更新会话状态为 REVOKED
5. 记录登出历史
6. 发布领域事件（UserLoggedOutEvent）
7. 返回登出结果

---

### 2.3 基础设施层 (Infrastructure Layer)

#### 仓储实现 (apps/api/modules/authentication/infrastructure/repositories/)

**PrismaAuthSessionRepository**:
- 实现 `IAuthSessionRepository` 接口
- 查询会话：`findByAccessToken(token)`
- 更新会话：`save(session)`（更新 status 和 revokedAt）
- 批量查询：`findActiveSessionsByAccountUuid(accountUuid)`

#### 数据库操作

```typescript
// 注销单个会话
await prisma.authSession.update({
  where: { uuid: sessionUuid },
  data: {
    status: 'REVOKED',
    revoked_at: new Date(),
  },
});

// 注销所有会话
await prisma.authSession.updateMany({
  where: {
    account_uuid: accountUuid,
    status: 'ACTIVE',
  },
  data: {
    status: 'REVOKED',
    revoked_at: new Date(),
  },
});
```

---

## 3. 详细流程设计

### 3.1 时序图 - 单设备登出

```
Frontend         API Controller         AuthenticationApp      AuthenticationDomain
  │                    │                  Service                Service
  │                    │                     │                        │
  │──Logout Request────>│                     │                        │
  │  {accessToken}      │                     │                        │
  │                    │                     │                        │
  │                    │──logout()──────────>│                        │
  │                    │                     │                        │
  │                    │                     │──Get Session by Token──>│
  │                    │                     │<──Session or null──────│
  │                    │                     │                        │
  │                    │                     │[If session not found]  │
  │                    │                     │──Throw Error───────────>│
  │                    │                     │                        │
  │                    │                     │[If session found]      │
  │                    │                     │──Check Session Status──>│
  │                    │                     │<──ACTIVE───────────────│
  │                    │                     │                        │
  │                    │                     │──Revoke Session────────>│
  │                    │                     │   (session.revoke())   │
  │                    │                     │<──Success──────────────│
  │                    │                     │                        │
  │                    │                     │──Save Session──────────>│
  │                    │                     │<──Success──────────────│
  │                    │                     │                        │
  │                    │                     │──Publish Event─────────>│
  │                    │                     │  UserLoggedOutEvent    │
  │                    │                     │                        │
  │                    │<──LogoutResponse────│                        │
  │<──200 OK───────────│  {success: true}   │                        │
```

### 3.2 时序图 - 全设备登出

```
Frontend         API Controller         AuthenticationApp      AuthenticationDomain
  │                    │                  Service                Service
  │                    │                     │                        │
  │──LogoutAll Request─>│                     │                        │
  │  {accountUuid,     │                     │                        │
  │   accessToken}     │                     │                        │
  │                    │                     │                        │
  │                    │──logoutAll()───────>│                        │
  │                    │                     │                        │
  │                    │                     │──Verify Current Token──>│
  │                    │                     │<──Session─────────────│
  │                    │                     │                        │
  │                    │                     │──Get All Active Sessions>│
  │                    │                     │   (by accountUuid)     │
  │                    │                     │<──Sessions[]───────────│
  │                    │                     │                        │
  │                    │                     │──For each session──────>│
  │                    │                     │   session.revoke()     │
  │                    │                     │<──Success──────────────│
  │                    │                     │                        │
  │                    │                     │──Save All Sessions─────>│
  │                    │                     │<──Success──────────────│
  │                    │                     │                        │
  │                    │                     │──Publish Event─────────>│
  │                    │                     │  AllSessionsRevokedEvent│
  │                    │                     │                        │
  │                    │<──LogoutResponse────│                        │
  │<──200 OK───────────│  {success: true,   │                        │
  │                    │   count: 3}        │                        │
```

---

## 4. 核心代码实现

### 4.1 API Controller (apps/api/modules/authentication/interface/http/)

```typescript
// AuthController.ts
import { Router, Request, Response } from 'express';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';
import { createLogger } from '@dailyuse/utils';
import { authMiddleware } from '../../infrastructure/middleware/authMiddleware';

const logger = createLogger('AuthController');
const router = Router();

/**
 * POST /api/auth/logout
 * 单设备登出
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Access token is required',
      });
    }

    const service = await AuthenticationApplicationService.getInstance();
    const result = await service.logout({ accessToken });

    logger.info('User logged out successfully', {
      sessionUuid: req.user?.sessionUuid,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Logout failed', error);

    if (error.message.includes('not found') || error.message.includes('invalid')) {
      return res.status(404).json({
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found or already logged out',
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Logout failed. Please try again later.',
    });
  }
});

/**
 * POST /api/auth/logout-all
 * 全设备登出
 */
router.post('/logout-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const accountUuid = req.user?.accountUuid;

    if (!accessToken || !accountUuid) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Access token and account UUID are required',
      });
    }

    const service = await AuthenticationApplicationService.getInstance();
    const result = await service.logoutAll({ accountUuid, accessToken });

    logger.info('User logged out from all devices', {
      accountUuid,
      revokedCount: result.revokedSessionsCount,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Logout all failed', error);

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Logout failed. Please try again later.',
    });
  }
});

export default router;
```

---

### 4.2 Application Service (apps/api/modules/authentication/application/services/)

```typescript
// AuthenticationApplicationService.ts (新增方法)

export class AuthenticationApplicationService {
  // ... existing code ...

  /**
   * 单设备登出
   */
  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    const { accessToken } = request;

    // 1. 查询会话
    const session = await this.sessionRepo.findByAccessToken(accessToken);
    if (!session) {
      throw new Error('Session not found');
    }

    // 2. 检查会话状态
    if (session.status !== 'ACTIVE') {
      throw new Error(`Session is already ${session.status.toLowerCase()}`);
    }

    // 3. 注销会话
    await this.authDomainService.revokeSession(session.uuid);

    // 4. 发布登出事件
    eventBus.send('user:logged-out', {
      accountUuid: session.accountUuid,
      sessionUuid: session.uuid,
      logoutAt: Date.now(),
    });

    logger.info('Session revoked', {
      accountUuid: session.accountUuid,
      sessionUuid: session.uuid,
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * 全设备登出
   */
  async logoutAll(request: LogoutAllRequest): Promise<LogoutResponse> {
    const { accountUuid, accessToken } = request;

    // 1. 验证当前会话
    const currentSession = await this.sessionRepo.findByAccessToken(accessToken);
    if (!currentSession || currentSession.accountUuid !== accountUuid) {
      throw new Error('Invalid session');
    }

    // 2. 查询所有活跃会话
    const activeSessions = await this.sessionRepo.findActiveSessionsByAccountUuid(accountUuid);

    // 3. 注销所有会话
    await this.authDomainService.revokeAllSessions(accountUuid);

    // 4. 发布事件
    eventBus.send('user:logged-out-all', {
      accountUuid,
      revokedSessionsCount: activeSessions.length,
      logoutAt: Date.now(),
    });

    logger.info('All sessions revoked', {
      accountUuid,
      revokedCount: activeSessions.length,
    });

    return {
      success: true,
      message: 'Logged out from all devices successfully',
      revokedSessionsCount: activeSessions.length,
    };
  }
}
```

---

### 4.3 Domain Service (packages/domain-server/authentication/services/)

```typescript
// AuthenticationDomainService.ts (新增方法)

export class AuthenticationDomainService {
  // ... existing code ...

  /**
   * 注销会话
   */
  async revokeSession(sessionUuid: string): Promise<void> {
    const session = await this.sessionRepository.findByUuid(sessionUuid);
    if (!session) {
      throw new Error('Session not found');
    }

    session.revoke();
    await this.sessionRepository.save(session);
  }

  /**
   * 注销账户下所有活跃会话
   */
  async revokeAllSessions(accountUuid: string): Promise<void> {
    const sessions = await this.sessionRepository.findActiveSessionsByAccountUuid(accountUuid);

    for (const session of sessions) {
      session.revoke();
      await this.sessionRepository.save(session);
    }
  }

  /**
   * 根据 access token 获取会话
   */
  async getSessionByAccessToken(accessToken: string): Promise<AuthSession | null> {
    return this.sessionRepository.findByAccessToken(accessToken);
  }
}
```

---

### 4.4 AuthSession 聚合根方法

```typescript
// AuthSession.ts (packages/domain-server/authentication/aggregates/)

export class AuthSession extends AggregateRoot implements IAuthSessionServer {
  // ... existing properties ...

  /**
   * 注销会话
   */
  public revoke(): void {
    if (this._status === 'REVOKED') {
      throw new Error('Session is already revoked');
    }

    this._status = 'REVOKED';
    this._revokedAt = Date.now();

    // 记录会话历史
    this.recordActivity('SESSION_REVOKED');
  }

  /**
   * 记录活动
   */
  private recordActivity(activityType: string): void {
    const history = SessionHistory.create({
      sessionUuid: this.uuid,
      activityType,
      timestamp: Date.now(),
    });
    this._history.push(history);
    this._lastActivityAt = Date.now();
    this._lastActivityType = activityType;
  }
}
```

---

## 5. 错误处理策略

### 5.1 业务异常

| 错误代码 | HTTP 状态 | 描述 | 处理方式 |
|---------|---------|------|---------|
| `SESSION_NOT_FOUND` | 404 | 会话不存在 | 提示已登出或会话过期 |
| `UNAUTHORIZED` | 401 | Token 无效 | 要求重新登录 |
| `ALREADY_REVOKED` | 400 | 会话已注销 | 提示已登出 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器错误 | 提示稍后重试 |

### 5.2 容错处理

- **Token 不存在**: 返回 401，但不报错（可能已过期）
- **会话已注销**: 返回成功，幂等操作
- **网络失败**: 客户端本地清理 token，后台异步注销

---

## 6. 安全考虑

### 6.1 Token 失效

- **黑名单机制**: 将注销的 token 加入 Redis 黑名单（有效期内）
- **JWT 验证**: 每次请求验证 token 是否在黑名单中
- **短期有效**: access token 短期有效（15分钟-1小时），减少黑名单压力

```typescript
// TokenService.ts
async revokeToken(token: string, expiresIn: number): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(`blacklist:${token}`, expiresIn, '1');
}

async isTokenRevoked(token: string): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
}
```

### 6.2 客户端清理

- **清除存储**: 删除 localStorage/sessionStorage 中的 token
- **清除 Cookie**: 清除 httpOnly cookie（如果使用）
- **清除内存**: 清除应用状态中的用户信息

```typescript
// 前端登出逻辑
async function logout() {
  try {
    // 1. 调用后端 API
    await api.post('/auth/logout', {
      accessToken: getAccessToken(),
    });
  } finally {
    // 2. 清除本地存储（无论 API 成功与否）
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    
    // 3. 清除应用状态
    store.commit('auth/clearUser');
    
    // 4. 重定向到登录页
    router.push('/login');
  }
}
```

---

## 7. 测试策略

### 7.1 单元测试

```typescript
describe('AuthenticationApplicationService - Logout', () => {
  it('should successfully logout with valid token', async () => {
    // Arrange
    const mockSessionRepo = createMockSessionRepository();
    const service = await AuthenticationApplicationService.createInstance(
      null,
      null,
      mockSessionRepo,
    );

    // Act
    const result = await service.logout({
      accessToken: 'valid-token',
    });

    // Assert
    expect(result.success).toBe(true);
    expect(mockSessionRepo.save).toHaveBeenCalled();
  });

  it('should throw error when session not found', async () => {
    // Test session not found
  });

  it('should revoke all sessions for logout-all', async () => {
    // Test logout all
  });
});
```

### 7.2 集成测试

```typescript
describe('Logout API Integration', () => {
  it('POST /api/auth/logout - should logout successfully', async () => {
    const loginResponse = await login(); // 先登录获取 token
    const accessToken = loginResponse.body.data.accessToken;

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 验证 token 已失效
    const verifyResponse = await request(app)
      .get('/api/account/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(verifyResponse.status).toBe(401);
  });
});
```

---

## 8. 监控与日志

### 8.1 日志记录

- 登出成功：`logger.info('User logged out', { accountUuid, sessionUuid })`
- 登出失败：`logger.error('Logout failed', { error, accessToken })`
- 全设备登出：`logger.info('Logout all', { accountUuid, revokedCount })`

### 8.2 监控指标

- **登出频率**: 每小时登出次数
- **平均会话时长**: 从登录到登出的时间
- **全设备登出频率**: 使用该功能的频率（可能表示安全问题）
- **异常登出**: 会话突然中断（非主动登出）

---

## 9. 未来优化

1. **登出通知**: 登出后发送邮件/推送通知
2. **会话管理页面**: 用户可查看并管理所有活跃会话
3. **异常检测**: 检测异常登出（如被强制踢出）
4. **登出原因**: 记录登出原因（用户主动、超时、被踢出）
5. **会话迁移**: 支持会话在不同设备间迁移
6. **登出确认**: 敏感操作前要求二次确认

---

## 10. 相关文档

- [用户注册流程设计](./USER_REGISTRATION_FLOW.md)
- [用户登录流程设计](./USER_LOGIN_FLOW.md)
- [账户注销流程设计](./ACCOUNT_DELETION_FLOW.md)
- [Authentication 模块设计](../AUTHENTICATION_MODULE_DESIGN.md)
- [Token 刷新流程](./TOKEN_REFRESH_FLOW.md)

---

## 11. 变更历史

| 版本 | 日期 | 作者 | 变更说明 |
|-----|------|------|---------|
| 1.0 | 2025-10-17 | AI Assistant | 初始版本 |
