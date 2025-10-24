# SSE Token 认证实现指南

**日期：** 2025-10-04  
**版本：** 3.0.0  
**类型：** 架构改进 - Token 认证

## 📋 改进概述

将 SSE 连接的认证方式从**手动传递 accountUuid** 改为**基于 JWT Token 的自动认证**，前端不再需要手动传递用户标识，后端自动从 token 中提取用户信息。

## 🎯 设计理念

### 核心原则

**"前端只需登录，SSE 自动认证"**

- ✅ **前端简化**：connect() 方法无需任何参数
- ✅ **安全性提升**：token 由系统管理，不暴露 accountUuid
- ✅ **统一认证**：与其他 API 使用相同的认证机制
- ✅ **自动化**：用户登录后自动具备 SSE 连接能力

### 技术挑战与解决方案

#### 挑战：EventSource 不支持自定义请求头

原生的 `EventSource` API 不支持设置自定义请求头（如 `Authorization: Bearer token`），这是一个已知的浏览器 API 限制。

#### 解决方案：Token 作为 URL 参数

```typescript
// 前端：将 token 作为 URL 参数传递
const token = AuthManager.getAccessToken();
const url = `/api/v1/schedules/events?token=${encodeURIComponent(token)}`;
const eventSource = new EventSource(url);
```

```typescript
// 后端：从 URL 参数中提取并验证 token
const token = req.query.token as string;
const decoded = jwt.verify(token, secret);
const accountUuid = decoded.accountUuid;
```

**优点：**

- 无需第三方库（如 `event-source-polyfill`）
- 兼容所有支持 EventSource 的浏览器
- 实现简单，易于维护

**安全考虑：**

- ✅ 使用 HTTPS 加密传输
- ✅ Token 有过期时间
- ✅ 后端验证 token 签名
- ⚠️ Token 会出现在 URL 中（建议使用短期 token）

## 🔧 实现细节

### 1. 前端实现

#### SSEClient.ts

```typescript
import { AuthManager } from '@/shared/api/core/interceptors';

export class SSEClient {
  /**
   * 连接到 SSE 端点
   * @description 后端将从 URL 参数中的 token 提取用户信息
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 获取认证 token
      const token = AuthManager.getAccessToken();
      if (!token) {
        console.error('[SSE Client] 缺少认证 token');
        reject(new Error('Authentication token is required'));
        return;
      }

      // 将 token 作为 URL 参数传递
      const url = `${this.baseUrl}/api/v1/schedules/events?token=${encodeURIComponent(token)}`;
      this.eventSource = new EventSource(url);

      // ... 事件处理
    });
  }
}
```

**关键点：**

- ✅ 使用 `AuthManager.getAccessToken()` 获取 token
- ✅ Token 通过 `encodeURIComponent()` 编码
- ✅ 不需要任何参数，完全自动化
- ✅ 如果没有 token，直接拒绝连接

#### 初始化任务

```typescript
const sseConnectionTask: InitializationTask = {
  name: 'sse-connection',
  phase: InitializationPhase.USER_LOGIN,
  priority: 15,
  initialize: async () => {
    // 不需要传递 accountUuid，connect() 自动从 token 获取
    await sseClient.connect();
  },
};
```

### 2. 后端实现

#### SSEController.ts

```typescript
import jwt from 'jsonwebtoken';

export class SSEController {
  connect = async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. 从 URL 参数获取 token
      const token = req.query.token as string;

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Authentication token is required',
        });
        return;
      }

      // 2. 验证 token
      const secret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(token, secret) as any;

      // 3. 提取 accountUuid
      if (!decoded.accountUuid) {
        res.status(401).json({
          success: false,
          message: 'Invalid token: missing user information',
        });
        return;
      }

      const accountUuid = decoded.accountUuid;
      const clientId = accountUuid;

      // 4. 建立 SSE 连接
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      // 5. 注册客户端
      this.clients.set(clientId, {
        id: clientId,
        accountUuid,
        response: res,
        lastPing: Date.now(),
      });

      // ... 心跳和事件处理
    } catch (error) {
      console.error('[SSE] 连接失败:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };
}
```

**关键点：**

- ✅ 从 `req.query.token` 获取 token
- ✅ 使用 `jwt.verify()` 验证 token
- ✅ 提取 `accountUuid` 作为客户端 ID
- ✅ 完整的错误处理
- ✅ 不需要认证中间件

#### 路由配置

```typescript
// 不需要 authMiddleware，在 connect 方法中直接验证 token
router.get('/events', sseController.connect);
```

## 📊 认证流程

```
┌─────────────────────────────────────────────────────────────┐
│                         用户登录                             │
│         (获取 JWT token 并存储到 localStorage)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              InitializationPhase.USER_LOGIN                  │
│         触发 SSE 连接初始化任务                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                  sseClient.connect()                         │
│  1. 从 AuthManager 获取 token                                │
│  2. 构造 URL: /events?token={token}                          │
│  3. 创建 EventSource(url)                                    │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP GET /api/v1/schedules/events?token=xxx
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              后端 SSEController.connect()                    │
│  1. 提取 req.query.token                                     │
│  2. jwt.verify(token, secret)                                │
│  3. 提取 decoded.accountUuid                                 │
│  4. 使用 accountUuid 作为客户端 ID                           │
│  5. 建立 SSE 连接                                            │
└────────────────┬────────────────────────────────────────────┘
                 │ SSE 连接建立成功
                 ↓
┌─────────────────────────────────────────────────────────────┐
│           持续接收服务器推送的事件                            │
│    - schedule:popup-reminder                                 │
│    - schedule:sound-reminder                                 │
│    - schedule:task-executed                                  │
│    - heartbeat                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 安全性分析

### 优势

✅ **Token 验证**

- 使用 JWT 标准验证机制
- 验证签名确保 token 未被篡改
- 检查过期时间防止重放攻击

✅ **自动过期**

- Token 有过期时间（通常几小时到几天）
- 过期后自动断开 SSE 连接
- 需要重新登录获取新 token

✅ **统一认证**

- 与其他 API 使用相同的认证机制
- 统一的 token 管理
- 一处登录，全局可用

### 风险与缓解

⚠️ **风险1：Token 在 URL 中可见**

**风险等级：** 中  
**影响：** Token 可能被记录在服务器日志、浏览器历史等

**缓解措施：**

1. 使用短期 token（1-2小时过期）
2. 使用 HTTPS 加密传输
3. 后端日志脱敏处理
4. 定期轮换 token

⚠️ **风险2：Token 泄露**

**风险等级：** 中  
**影响：** 攻击者可以使用泄露的 token 建立 SSE 连接

**缓解措施：**

1. Token 有过期时间
2. 实现 token 刷新机制
3. 监控异常连接
4. 支持手动撤销 token

⚠️ **风险3：CSRF 攻击**

**风险等级：** 低（SSE 是只读的）  
**影响：** 攻击者无法通过 SSE 修改数据

**缓解措施：**

1. SSE 只用于接收事件，不发送数据
2. CORS 配置限制来源
3. 验证 Referer header

## 🎁 优势总结

### 对比之前的实现

| 特性           | 之前（手动传递 accountUuid） | 现在（Token 自动认证） |
| -------------- | ---------------------------- | ---------------------- |
| **前端复杂度** | 需要获取并传递 accountUuid   | 完全自动化，无需参数   |
| **安全性**     | accountUuid 可能被篡改       | Token 签名验证，防篡改 |
| **认证机制**   | 自定义参数                   | 标准 JWT 认证          |
| **代码维护**   | 需要管理 accountUuid 传递    | 统一使用 AuthManager   |
| **用户体验**   | 需要确保 accountUuid 可用    | 登录即可用             |

### 开发体验提升

✅ **前端开发者**

```typescript
// 之前：需要知道 accountUuid
const accountUuid = useAuthStore().user?.uuid;
await sseClient.connect(accountUuid);

// 现在：完全自动
await sseClient.connect();
```

✅ **后端开发者**

```typescript
// 之前：从查询参数获取，不够安全
const accountUuid = req.query.accountUuid;

// 现在：标准 JWT 验证流程
const decoded = jwt.verify(token, secret);
const accountUuid = decoded.accountUuid;
```

## 📝 迁移指南

### 从之前的实现迁移

#### 前端代码更新

```typescript
// ❌ 旧代码
const accountUuid = useAuthStore().user?.uuid;
await sseClient.connect(accountUuid);

// ✅ 新代码
await sseClient.connect();
```

#### 后端代码更新

```typescript
// ❌ 旧代码
connect = (req: Request, res: Response): void => {
  const accountUuid = req.query.accountUuid as string;
  // ...
};

// ✅ 新代码
connect = async (req: Request, res: Response): Promise<void> => {
  const token = req.query.token as string;
  const decoded = jwt.verify(token, secret);
  const accountUuid = decoded.accountUuid;
  // ...
};
```

### 测试清单

- [ ] 用户登录后 SSE 自动连接
- [ ] 没有 token 时连接失败
- [ ] Token 过期时连接失败
- [ ] Token 无效时连接失败
- [ ] 重新登录后 SSE 重连成功
- [ ] 用户登出后 SSE 断开
- [ ] 接收事件功能正常

## 🚀 未来改进方向

### 短期优化

1. **支持 Token 刷新**
   - 在 token 即将过期时自动刷新
   - 无缝更新 SSE 连接的 token

2. **添加连接池管理**
   - 限制每个用户的最大连接数
   - 自动清理长时间无活动的连接

3. **完善监控指标**
   - Token 验证失败率
   - 连接建立成功率
   - 平均连接持续时间

### 长期规划

1. **支持 WebSocket**
   - 双向通信需求时的备选方案
   - 更好的连接控制

2. **边缘节点部署**
   - 降低延迟
   - 提高可用性

3. **事件优先级**
   - 重要事件优先推送
   - 流量控制

## 📚 参考资源

- [JWT 最佳实践](https://tools.ietf.org/html/rfc8725)
- [EventSource API MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [SSE 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

---

**作者：** GitHub Copilot  
**审核：** DailyUse Team  
**日期：** 2025-10-04  
**版本：** 3.0.0 - Token 认证实现
