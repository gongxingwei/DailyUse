# 客户端信息获取和处理指南

## 概述

在用户登录过程中，系统需要收集客户端信息用于安全审计、设备管理和记住我令牌绑定。本文档详细说明了客户端信息的获取、处理和使用方式。

## ClientInfo 类型定义

```typescript
export type ClientInfo = {
  clientId: string; // 客户端唯一标识
  clientName: string; // 客户端友好名称
  userAgent: string; // 浏览器用户代理
  ipAddress?: string; // IP地址
};
```

## 客户端信息获取流程

### 1. HTTP请求层面 (Controller)

在 `AuthenticationController.login()` 方法中，使用 `extractClientInfo()` 函数从 HTTP 请求中提取客户端信息：

```typescript
// 提取客户端信息
const clientInfo = extractClientInfo(req);

const loginRequest: AuthByPasswordRequestDTO = {
  username: req.body.username,
  password: req.body.password,
  remember: req.body.remember || false,
  clientInfo, // 传递客户端信息
};
```

### 2. 客户端信息提取器 (`clientInfoExtractor.ts`)

#### 主要功能：

1. **IP地址获取**：

   ```typescript
   const ipAddress =
     (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
     (req.headers['x-real-ip'] as string) ||
     req.connection?.remoteAddress ||
     req.socket?.remoteAddress ||
     req.ip ||
     'unknown';
   ```

2. **User-Agent获取**：

   ```typescript
   const userAgent = req.headers['user-agent'] || 'unknown';
   ```

3. **客户端ID生成**：

   ```typescript
   let clientId = req.body.clientId || (req.headers['x-client-id'] as string);
   if (!clientId) {
     // 基于用户代理和IP生成简单的客户端ID
     const fingerprint = `${userAgent}-${ipAddress}`;
     clientId = crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
   }
   ```

4. **设备名称推断**：

   ```typescript
   let clientName = req.body.clientName || 'Unknown Device';

   // 从User-Agent中解析设备信息
   if (userAgent.includes('Mobile')) {
     clientName = 'Mobile Device';
   } else if (userAgent.includes('Chrome')) {
     clientName = 'Chrome Browser';
   }
   // ... 更多设备类型判断
   ```

### 3. 业务逻辑层面 (Service)

在 `AuthenticationApplicationService` 中，将客户端信息转换为内部格式：

```typescript
async loginByPassword(request: AuthByPasswordRequestDTO): Promise<TResponse<AuthResponseDTO>> {
  const { username, password, remember, clientInfo } = request;

  // 构造内部服务需要的请求格式
  const loginRequest = {
    username,
    password,
    remember,
    clientInfo: clientInfo ? {
      ip: clientInfo.ipAddress || 'unknown',
      userAgent: clientInfo.userAgent,
      deviceId: clientInfo.clientId,
      location: 'unknown',
      country: 'unknown',
      city: 'unknown',
    } : undefined,
  };

  return await this.loginService.PasswordAuthentication(loginRequest);
}
```

## 客户端信息的使用场景

### 1. 记住我令牌绑定

```typescript
// 在 AuthenticationLoginService 中
if (remember) {
  const deviceInfo = clientInfo
    ? `${clientInfo.deviceId}-${clientInfo.userAgent}`
    : 'unknown-device';
  rememberToken = authCredential.createRememberToken(deviceInfo) as Token;
  await this.tokenRepository.save(rememberToken);
}
```

### 2. 会话创建

```typescript
// 创建会话时使用客户端信息
const newClientInfo: ClientInfo = {
  deviceId: clientInfo?.deviceId || 'unknown',
  deviceName: 'unknown',
  userAgent: clientInfo?.userAgent || 'unknown',
  ipAddress: clientInfo?.ip || 'unknown',
};
const newAuthSession = authCredential.createSession(newClientInfo);
```

### 3. 安全审计

```typescript
// 发布登录尝试事件时包含客户端信息
await this.publishLoginAttemptEvent({
  username,
  accountUuid,
  result: 'success',
  attemptedAt: new Date(),
  clientInfo, // 用于安全审计
});
```

## 前端客户端信息提供

### 1. 浏览器环境

前端可以提供额外的客户端信息：

```javascript
// 前端登录请求
const loginData = {
  username: 'user@example.com',
  password: 'password',
  remember: true,
  clientId: generateClientFingerprint(), // 客户端生成的设备指纹
  clientName: getDeviceName(), // 用户友好的设备名称
};

function generateClientFingerprint() {
  // 基于浏览器特征生成设备指纹
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.fillText('Device fingerprint', 2, 2);

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');

  return btoa(fingerprint).substring(0, 16);
}

function getDeviceName() {
  const ua = navigator.userAgent;
  if (/Mobile/.test(ua)) return 'Mobile Device';
  if (/Tablet|iPad/.test(ua)) return 'Tablet';
  if (/Electron/.test(ua)) return 'Desktop App';
  return 'Web Browser';
}
```

### 2. 移动应用环境

```javascript
// React Native 或其他移动应用
const deviceInfo = {
  clientId: await DeviceInfo.getUniqueId(),
  clientName: await DeviceInfo.getDeviceName(),
  userAgent: await DeviceInfo.getUserAgent(),
};
```

### 3. 桌面应用环境

```javascript
// Electron 应用
const deviceInfo = {
  clientId: require('node-machine-id').machineIdSync(),
  clientName: require('os').hostname(),
  userAgent: navigator.userAgent,
};
```

## 安全考虑

### 1. 隐私保护

- 不收集过于详细的设备指纹信息
- 遵循相关隐私法规（GDPR、CCPA等）
- 提供用户控制选项

### 2. 数据加密

```typescript
// 敏感的客户端信息应该加密存储
function encryptClientInfo(clientInfo: ClientInfo): string {
  const data = JSON.stringify(clientInfo);
  return crypto.createHash('sha256').update(data).digest('hex');
}
```

### 3. 异常检测

```typescript
// 检测可疑登录行为
function detectSuspiciousActivity(currentClientInfo: ClientInfo, lastClientInfo?: ClientInfo) {
  if (!lastClientInfo) return false;

  // IP地址变化检测
  if (currentClientInfo.ipAddress !== lastClientInfo.ipAddress) {
    return true;
  }

  // 设备变化检测
  if (currentClientInfo.clientId !== lastClientInfo.clientId) {
    return true;
  }

  return false;
}
```

## 最佳实践

### 1. 渐进式收集

- 首次登录收集基本信息
- 后续登录逐步完善设备信息
- 避免一次性收集过多信息

### 2. 用户友好

- 提供设备管理界面
- 允许用户为设备命名
- 显示登录历史和设备列表

### 3. 性能优化

- 客户端信息提取应该快速
- 避免阻塞登录流程
- 缓存设备指纹信息

### 4. 错误处理

```typescript
export function extractClientInfo(req: Request): ClientInfo {
  try {
    // ... 提取逻辑
  } catch (error) {
    console.warn('Failed to extract client info:', error);
    return {
      clientId: 'unknown',
      clientName: 'Unknown Device',
      userAgent: 'unknown',
      ipAddress: 'unknown',
    };
  }
}
```

这样的设计确保了客户端信息的完整收集和安全处理，为后续的设备管理、安全审计和用户体验优化提供了基础。
