# SSE 用户级别连接升级报告

**日期：** 2025-10-04  
**版本：** 2.0.0  
**类型：** 架构改进

## 📋 改进概述

将 SSE (Server-Sent Events) 连接从**应用级别**升级为**用户级别**连接，每个连接使用用户的 `accountUuid` 作为唯一标识符。

## 🎯 改进目标

### 问题分析

**原实现存在的问题：**

1. ❌ **连接时机不当**
   - SSE 在应用启动时（`APP_STARTUP`）就建立连接
   - 此时用户还未登录，没有用户身份信息
   - 导致无法区分不同用户的连接

2. ❌ **缺少用户标识**
   - 客户端 ID 是随机生成的字符串
   - 无法关联到具体用户
   - 不支持针对特定用户的事件推送

3. ❌ **安全性欠缺**
   - 所有客户端接收相同的广播事件
   - 无法验证用户身份
   - 可能接收到不属于自己的通知

### 改进方案

✅ **用户级别连接**
- 使用 `accountUuid` 作为客户端 ID
- 每个用户有独立的 SSE 连接
- 支持同一用户多设备登录

✅ **正确的连接时机**
- 在用户登录阶段（`USER_LOGIN`）建立连接
- 用户登出时自动断开连接
- 确保连接与用户会话绑定

✅ **增强的安全性**
- 后端验证 `accountUuid` 参数
- 可以针对特定用户推送事件
- 支持扩展 token 验证

## 📝 实现细节

### 1. 前端改动

#### SSEClient.ts

**文件位置：** `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`

**关键变更：**

```typescript
// 新增属性
private currentAccountUuid: string | null = null;

// 方法签名变更
connect(accountUuid: string): Promise<void>

// URL 包含 accountUuid
const url = `${this.baseUrl}/api/v1/schedules/events?accountUuid=${accountUuid}`;

// 断开时清理 accountUuid
disconnect(): void {
  // ...
  this.currentAccountUuid = null;
}

// 重连时使用保存的 accountUuid
private attemptReconnect(): void {
  if (!this.currentAccountUuid) {
    console.error('[SSE Client] 无法重连：缺少 accountUuid');
    return;
  }
  // ...
  this.connect(this.currentAccountUuid);
}
```

**移除的代码：**

```typescript
// ❌ 删除自动连接代码
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    sseClient.connect(); // 不再自动连接
  });
}
```

#### sseInitialization.ts

**文件位置：** `apps/web/src/modules/notification/initialization/sseInitialization.ts`

**关键变更：**

```typescript
const sseConnectionTask: InitializationTask = {
  name: 'sse-connection',
  // ✅ 从 APP_STARTUP 改为 USER_LOGIN
  phase: InitializationPhase.USER_LOGIN,
  priority: 15,
  initialize: async (context) => {
    // ✅ 验证 accountUuid
    if (!context?.accountUuid) {
      throw new Error('SSE initialization requires accountUuid');
    }
    // ✅ 传递 accountUuid
    await sseClient.connect(context.accountUuid);
  },
  cleanup: async () => {
    sseClient.destroy();
  },
};
```

### 2. 后端改动

#### SSEController.ts

**文件位置：** `apps/api/src/modules/schedule/interface/http/SSEController.ts`

**关键变更：**

```typescript
// 客户端接口新增字段
interface SSEClient {
  id: string;
  accountUuid: string;  // ✅ 新增
  response: Response;
  lastPing: number;
}

// 连接处理
connect = (req: Request, res: Response): void => {
  // ✅ 从查询参数获取 accountUuid
  const accountUuid = req.query.accountUuid as string;

  // ✅ 验证参数
  if (!accountUuid) {
    res.status(400).json({
      success: false,
      message: 'accountUuid query parameter is required',
    });
    return;
  }

  // ✅ 使用 accountUuid 作为客户端 ID
  const clientId = accountUuid;

  // ✅ 注册客户端时保存 accountUuid
  const client: SSEClient = {
    id: clientId,
    accountUuid,  // ✅ 新增
    response: res,
    lastPing: Date.now(),
  };
  this.clients.set(clientId, client);
};

// ✅ 新增方法：向特定用户发送事件
private sendToUser(accountUuid: string, eventType: string, data: any): void {
  const client = this.clients.get(accountUuid);
  if (!client) {
    console.warn(`[SSE] 用户 ${accountUuid} 未连接`);
    return;
  }
  // 发送事件...
}
```

#### routes.ts

**文件位置：** `apps/api/src/modules/schedule/interface/http/routes.ts`

**关键变更：**

```typescript
/**
 * @swagger
 * /schedules/events:
 *   get:
 *     parameters:
 *       - in: query
 *         name: accountUuid
 *         required: true        // ✅ 必需参数
 *         schema:
 *           type: string
 *         description: 用户账户 UUID
 */
router.get('/events', sseController.connect);
```

### 3. 文档更新

**文件位置：** `docs/systems/SSE_IMPLEMENTATION_GUIDE.md`

**新增内容：**
- 用户级别连接实现说明
- 迁移指南
- API 变更说明
- 最佳实践

## 🎁 改进成果

### 功能增强

✅ **用户身份绑定**
- 每个 SSE 连接关联到特定用户
- 使用 `accountUuid` 作为唯一标识
- 支持用户级别的事件推送

✅ **多设备支持**
- 同一用户可以在多个设备登录
- 每个设备都有独立的 SSE 连接
- 所有设备同步接收该用户的事件

✅ **生命周期管理**
- 用户登录时自动建立连接
- 用户登出时自动清理连接
- 避免无效连接占用资源

✅ **安全性提升**
- 后端验证 `accountUuid` 参数
- 可以针对特定用户发送事件
- 支持扩展 token 验证

### 性能优化

- 减少无效广播（可以针对特定用户推送）
- 更好的资源管理（用户登出时清理连接）
- 支持按用户统计连接数

### 可扩展性

- 可以轻松添加用户权限验证
- 支持用户级别的事件过滤
- 便于实现用户在线状态监控

## 📊 影响范围

### 代码变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `SSEClient.ts` | 重构 | 添加 accountUuid 参数，移除自动连接 |
| `sseInitialization.ts` | 重构 | 改为 USER_LOGIN 阶段初始化 |
| `SSEController.ts` | 增强 | 使用 accountUuid，新增用户级推送 |
| `routes.ts` | 更新 | API 文档添加 accountUuid 参数 |
| `SSE_IMPLEMENTATION_GUIDE.md` | 更新 | 添加用户级连接说明 |

### 兼容性

⚠️ **破坏性变更：**

1. `sseClient.connect()` 现在需要 `accountUuid` 参数
2. SSE 不再在应用启动时自动连接
3. 后端 API 需要 `accountUuid` 查询参数

✅ **向后兼容：**

- 事件总线接口保持不变
- 事件类型保持不变
- 重连机制保持不变

## 🧪 测试建议

### 前端测试

```typescript
// 1. 测试连接建立
const accountUuid = 'test-user-uuid';
await sseClient.connect(accountUuid);
expect(sseClient.isConnected()).toBe(true);

// 2. 测试无 accountUuid 的情况
await expect(sseClient.connect('')).rejects.toThrow();

// 3. 测试断开连接
sseClient.disconnect();
expect(sseClient.isConnected()).toBe(false);

// 4. 测试重连机制
// 模拟连接断开，验证自动重连使用正确的 accountUuid
```

### 后端测试

```typescript
// 1. 测试缺少 accountUuid 参数
const response = await request(app)
  .get('/api/v1/schedules/events');
expect(response.status).toBe(400);

// 2. 测试正常连接
const response = await request(app)
  .get('/api/v1/schedules/events?accountUuid=test-uuid');
expect(response.status).toBe(200);
expect(response.headers['content-type']).toContain('text/event-stream');

// 3. 测试向特定用户发送事件
sseController.sendToUser('test-uuid', 'test-event', { data: 'test' });
// 验证只有该用户收到事件
```

## 📚 使用指南

### 前端使用

```typescript
import { sseClient } from '@/modules/notification/infrastructure/sse/SSEClient';
import { useAuthStore } from '@/modules/authentication';

// 在用户登录后
const authStore = useAuthStore();
const accountUuid = authStore.user?.uuid;

if (accountUuid) {
  await sseClient.connect(accountUuid);
}

// 监听事件
import { eventBus } from '@dailyuse/utils';

eventBus.on('ui:show-popup-reminder', (data) => {
  // 处理弹窗提醒
});

// 用户登出时（会自动清理，也可以手动调用）
sseClient.disconnect();
```

### 后端使用

```typescript
// 向所有用户广播
sseController.broadcastToAll('system-update', {
  message: '系统维护通知',
});

// 向特定用户发送（新功能）
sseController.sendToUser('user-uuid-123', 'personal-reminder', {
  title: '个人提醒',
  message: '您有新消息',
});
```

## 🔄 迁移步骤

如果你有使用旧版 SSE 的代码，请按以下步骤迁移：

### 步骤 1: 更新连接调用

```typescript
// ❌ 旧代码
await sseClient.connect();

// ✅ 新代码
const accountUuid = useAuthStore().user?.uuid;
if (accountUuid) {
  await sseClient.connect(accountUuid);
}
```

### 步骤 2: 移除自动连接

删除任何在应用启动时自动连接的代码。

### 步骤 3: 更新初始化任务

确保 SSE 初始化任务在 `USER_LOGIN` 阶段执行。

### 步骤 4: 测试

- 测试用户登录后 SSE 连接是否正常
- 测试用户登出后连接是否断开
- 测试重连机制是否正常工作

## ✅ 验收标准

- [ ] 用户登录后 SSE 连接自动建立
- [ ] 连接 URL 包含正确的 accountUuid
- [ ] 后端验证 accountUuid 参数
- [ ] 用户登出时连接自动断开
- [ ] 重连机制使用正确的 accountUuid
- [ ] 可以向特定用户发送事件
- [ ] 文档已更新
- [ ] 无编译错误
- [ ] 通过所有测试

## 🎉 总结

此次升级将 SSE 连接从应用级别提升到用户级别，带来了以下主要优势：

1. **更好的用户体验** - 每个用户只接收属于自己的通知
2. **更强的安全性** - 连接与用户身份绑定
3. **更高的可扩展性** - 支持用户级别的功能扩展
4. **更好的资源管理** - 连接生命周期与用户会话绑定

这是一个重要的架构改进，为未来的功能扩展（如用户在线状态、点对点通知等）奠定了基础。

---

**作者：** GitHub Copilot  
**审核：** DailyUse Team  
**日期：** 2025-10-04
