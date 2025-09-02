# 记住我令牌 (Remember Token) 功能实现

## 概述

为 DailyUse 系统添加了记住我令牌功能，支持多设备场景，允许用户在不同设备上保持登录状态。

## 设计原则

1. **多设备支持**: 每个设备可以有独立的记住我令牌
2. **统一存储**: 记住我令牌与其他令牌一起存储在 `tokens` Map 中
3. **设备隔离**: 创建新的记住我令牌时，只撤销相同设备的旧令牌，不影响其他设备
4. **类型安全**: 通过 TypeScript 接口确保类型安全

## 新增的方法和属性

### Domain Core (共享)

#### AuthCredentialCore 类新增方法

```typescript
// 获取所有有效的记住我令牌
getRememberTokens(): ITokenCore[]

// 获取特定设备的记住我令牌
getRememberTokenForDevice(deviceInfo: string): ITokenCore | undefined

// 检查是否有有效的记住我令牌
hasValidRememberToken(deviceInfo?: string): boolean
```

#### TokenCore 类新增静态方法

```typescript
// 创建记住我令牌（30天有效期）
static createRememberToken(accountUuid: string, deviceInfo?: string): TokenCore
```

### Domain Server

#### AuthCredential 服务端类新增方法

```typescript
// 创建记住我令牌（JWT 签名，30天有效期）
createRememberToken(deviceInfo?: string): Token
```

#### Token 服务端类新增静态方法

```typescript
// 创建带 JWT 签名的记住我令牌
static createRememberToken(accountUuid: string, deviceInfo?: string, secret?: string): Token
```

### Domain Client

#### AuthCredential 客户端类新增方法

```typescript
// 创建记住我令牌（客户端版本，包含本地存储）
createRememberToken(deviceInfo?: string): Token

// 获取用于 UI 显示的记住我令牌信息
getRememberTokensForDisplay(): Array<{
  deviceInfo?: string;
  token: Token;
  createdAt: Date;
  expiresAt: Date;
  status: 'valid' | 'expiring' | 'expired';
}>

// 获取当前设备的记住我令牌
getCurrentDeviceRememberToken(): Token | undefined
```

## 使用示例

### 服务端创建记住我令牌

```typescript
// 用户登录时，如果勾选了"记住我"
const authCredential = await AuthCredential.fromPersistence(params);
const deviceInfo = `${userAgent}-${ipAddress}`;
const rememberToken = authCredential.createRememberToken(deviceInfo);

// 设置 Cookie
res.cookie('remember_token', rememberToken.value, {
  httpOnly: true,
  secure: true,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
  sameSite: 'strict',
});
```

### 客户端管理记住我令牌

```typescript
// 创建记住我令牌
const authCredential = new AuthCredential(params);
const rememberToken = authCredential.createRememberToken(); // 自动获取设备信息

// 获取当前设备的记住我令牌
const currentToken = authCredential.getCurrentDeviceRememberToken();

// 显示所有设备的记住我令牌
const tokensForDisplay = authCredential.getRememberTokensForDisplay();
tokensForDisplay.forEach(({ deviceInfo, status, expiresAt }) => {
  console.log(`设备: ${deviceInfo}, 状态: ${status}, 过期时间: ${expiresAt}`);
});
```

### 验证记住我令牌

```typescript
// 服务端验证
const isValidJWT = await token.validateWithJWT();
if (isValidJWT && token.isValid()) {
  // 自动登录用户
  const session = authCredential.createSession(clientInfo);
}

// 客户端验证
const rememberTokens = authCredential.getRememberTokens();
const validTokens = rememberTokens.filter((token) => token.isValid());
```

## 数据库考虑

记住我令牌存储在现有的 tokens 表中，通过 `type` 字段区分：

```sql
-- tokens 表中的记住我令牌记录
SELECT * FROM tokens WHERE type = 'remember_me' AND is_revoked = false;
```

## 安全特性

1. **JWT 签名**: 服务端令牌使用 JWT 签名防止篡改
2. **设备绑定**: 令牌与设备信息绑定，提高安全性
3. **自动过期**: 30天自动过期，平衡安全性和用户体验
4. **撤销机制**: 支持单独撤销特定设备的令牌
5. **HttpOnly Cookie**: 服务端设置 HttpOnly Cookie 防止 XSS 攻击

## 领域事件

新增的领域事件：

- `RememberTokenCreated`: 记住我令牌创建时触发
- `RememberTokenRevoked`: 记住我令牌撤销时触发

这些事件可用于审计日志、安全监控等场景。

## 后续扩展

1. **令牌刷新**: 可以添加自动刷新机制延长有效期
2. **设备管理**: 可以添加用户设备管理界面
3. **异常检测**: 可以检测异常登录行为并自动撤销令牌
4. **推送通知**: 新设备登录时推送通知给用户
