# 账号注销流程设计文档

## 流程概述

新的账号注销流程采用了更严格的安全验证机制，遵循DDD和事件驱动架构原则：

### 流程步骤

1. **用户发起注销** 
   - 渲染进程调用 `rendererAccountService.requestAccountDeactivation()`
   - 通过IPC发送到主进程Account模块

2. **Account模块处理**
   - `AccountDeactivationService` 验证账号存在性和权限
   - 发布 `AccountDeactivationVerificationRequested` 事件

3. **Authentication模块响应**
   - `AuthenticationDeactivationVerificationHandler` 监听事件
   - 向渲染进程请求二次认证（密码验证）

4. **用户二次认证**
   - 渲染进程显示 `AccountDeactivationDialog` 组件
   - 用户输入密码确认
   - 通过IPC发送验证信息到Authentication模块

5. **认证验证**
   - Authentication模块验证密码
   - 发布 `AccountDeactivationVerificationResponse` 事件

6. **最终确认**
   - 验证成功后，Authentication模块：
     - 删除认证凭证
     - 发布 `AccountDeactivationConfirmed` 事件
   - Account模块监听并禁用账号

## 关键组件

### 主进程组件

#### Account模块
- `AccountDeactivationService` - 账号注销业务逻辑
- `AccountIpcHandler` - 处理来自渲染进程的IPC请求

#### Authentication模块
- `AuthenticationDeactivationVerificationHandler` - 处理注销验证
- 事件监听和二次认证逻辑

### 渲染进程组件
- `RendererAccountService` - 账号操作的渲染进程接口
- `AccountDeactivationDialog.vue` - 注销确认对话框

## 事件流

```
[渲染进程] 用户点击注销
    ↓ IPC: account:request-deactivation
[Account模块] 验证账号 → 发布 AccountDeactivationVerificationRequested
    ↓
[Authentication模块] 监听事件 → 请求用户验证
    ↓ IPC: 向渲染进程请求密码
[渲染进程] 显示密码确认对话框
    ↓ IPC: authentication:deactivation-verification-response
[Authentication模块] 验证密码 → 发布 AccountDeactivationVerificationResponse
    ↓ 成功后发布 AccountDeactivationConfirmed
[Account模块] 监听确认事件 → 禁用账号
[Authentication模块] 删除认证凭证
```

## 安全特性

1. **双重验证**：账号验证 + 密码验证
2. **权限控制**：用户只能注销自己的账号
3. **事件驱动**：模块间松耦合，通过事件通信
4. **审计跟踪**：所有操作都有事件记录
5. **超时保护**：验证请求有30秒超时机制

## 支持的注销类型

- **用户注销**(`user`)：需要密码验证
- **管理员强制注销**(`admin`)：跳过用户验证
- **系统自动注销**(`system`)：用于违规处理

## 错误处理

- `ACCOUNT_NOT_FOUND` - 账号不存在
- `ALREADY_DEACTIVATED` - 账号已被注销
- `PERMISSION_DENIED` - 权限不足
- `SYSTEM_ERROR` - 系统错误

## 使用示例

### 渲染进程发起注销
```typescript
import { rendererAccountService } from '@/modules/Account/services/rendererAccountService';

const result = await rendererAccountService.requestAccountDeactivation({
  accountUuid: 'user-123',
  requestedBy: 'user',
  reason: '用户主动注销',
  clientInfo: {
    ipAddress: '127.0.0.1',
    userAgent: navigator.userAgent,
    deviceId: 'device-123'
  }
});

if (result.success && result.requiresVerification) {
  // 等待密码验证对话框处理
}
```

### 管理员强制注销
```typescript
const result = await rendererAccountService.forceDeactivateAccount(
  'user-123',
  'admin-456',
  '违规行为'
);
```

## 数据清理

注销完成后会清理：
- 认证凭证（密码、会话、令牌）
- 账号状态设置为 `disabled`
- 相关会话全部终止

账号的历史数据和日志会保留用于审计。
