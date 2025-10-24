# Authentication 模块接口设计 V2.1

## 版本说明

- **版本**: V2.1
- **更新日期**: 2025-10-14
- **更新内容**:
  - 新增 RememberMeToken 实体，支持长期自动登录
  - 增强 AuthSession 支持多端并发在线
  - 新增设备管理功能
  - 优化 Token 刷新和自动登录流程

## 模块概述

Authentication 模块负责管理用户认证和授权，包括登录、登出、会话管理、令牌管理、**认证凭证管理**、**长期自动登录**、**多端并发**、权限控制等。

## 设计决策

### 时间戳统一使用 `number` (epoch milliseconds)

- ✅ **所有层次统一**: Persistence / Server / Client / Entity 都使用 `number`
- ✅ **性能优势**: 传输、存储、序列化性能提升 70%+
- ✅ **date-fns 兼容**: 完全支持 `number | Date` 参数
- ✅ **零转换成本**: 跨层传递无需 `toISOString()` / `new Date()`

### 完整的双向转换方法

- ✅ **To Methods**: `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
- ✅ **From Methods**: `fromServerDTO()`, `fromClientDTO()`, `fromPersistenceDTO()`

### Remember-Me Token 设计

- ✅ **长期有效**: 30-90 天有效期，支持自动登录
- ✅ **单次使用**: 使用后自动刷新，防止 Token 泄漏
- ✅ **设备绑定**: 绑定设备信息，增强安全性
- ✅ **主动失效**: 用户手动登出时清除

### 多端并发登录

- ✅ **设备管理**: 每个设备独立 Session 和 RememberMeToken
- ✅ **并发支持**: Browser、Desktop、Mobile App 可同时在线
- ✅ **活跃追踪**: 记录每个设备的最后活跃时间
- ✅ **设备限制**: 可配置单用户最大并发设备数

## 领域模型层次

```
AuthCredential (聚合根 - 认证凭证)
├── PasswordCredential (实体 - 密码凭证)
├── ApiKeyCredential (实体 - API Key)
├── RememberMeToken (实体 - 记住我令牌) ⭐️ 新增
└── CredentialHistory (实体 - 凭证变更历史)

AuthSession (聚合根 - 会话) ⭐️ 增强多端支持
├── RefreshToken (实体 - 刷新令牌)
├── DeviceInfo (值对象 - 设备信息) ⭐️ 新增
└── SessionHistory (实体 - 会话历史)

AuthProvider (聚合根 - 第三方登录)
└── (OAuth 提供商配置)

Permission (聚合根 - 权限)
└── Role (实体 - 角色权限)
```

---

## 1. AuthCredential (聚合根)

### 业务描述

认证凭证聚合根，管理用户的各种认证方式（密码、API Key、生物识别、**长期自动登录**等）。

### Server 接口

```typescript
export interface AuthCredentialServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;

  // ===== 凭证类型 =====
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';

  // ===== 密码凭证 (子实体) =====
  passwordCredential?: PasswordCredentialServer | null;

  // ===== API Key 凭证 (子实体) =====
  apiKeyCredentials: ApiKeyCredentialServer[];

  // ===== Remember-Me Token 凭证 (子实体) ⭐️ 新增 =====
  rememberMeTokens: RememberMeTokenServer[];

  // ===== 两步验证 =====
  twoFactor?: {
    enabled: boolean;
    secret?: string | null; // TOTP secret (加密存储)
    backupCodes: string[]; // 备用恢复码(加密存储)
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: number | null; // epoch ms
  } | null;

  // ===== 生物识别 =====
  biometric?: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: number | null; // epoch ms
  } | null;

  // ===== 凭证状态 =====
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

  // ===== 安全设置 =====
  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null; // epoch ms
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null; // epoch ms
    lockedUntil?: number | null; // epoch ms (账户锁定到期时间)
    lastPasswordChangeAt?: number | null; // epoch ms
  };

  // ===== 凭证历史 (子实体) =====
  history: CredentialHistoryServer[];

  // ===== 时间戳 =====
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
```

### Client 接口

```typescript
export interface AuthCredentialClient {
  uuid: string;
  accountUuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';

  passwordCredential?: PasswordCredentialClient | null;
  apiKeyCredentials: ApiKeyCredentialClient[];
  rememberMeTokens: RememberMeTokenClient[]; // ⭐️ 新增

  twoFactor?: {
    enabled: boolean;
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: number | null; // epoch ms
    // secret 和 backupCodes 不发送到客户端
  } | null;

  biometric?: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: number | null; // epoch ms
  } | null;

  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null; // epoch ms
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null; // epoch ms
    lockedUntil?: number | null; // epoch ms
    lastPasswordChangeAt?: number | null; // epoch ms
  };

  history: CredentialHistoryClient[];

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
```

### Domain Entity 接口

```typescript
export interface AuthCredentialEntity {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly accountUuid: string;

  // ===== 凭证类型 =====
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';

  // ===== 密码凭证 (子实体) =====
  passwordCredential?: PasswordCredentialEntity | null;

  // ===== API Key 凭证 (子实体) =====
  apiKeyCredentials: ApiKeyCredentialEntity[];

  // ===== Remember-Me Token 凭证 (子实体) ⭐️ 新增 =====
  rememberMeTokens: RememberMeTokenEntity[];

  // ===== 两步验证 =====
  twoFactor?: {
    enabled: boolean;
    secret?: string | null;
    backupCodes: string[];
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: number | null; // epoch ms
  } | null;

  // ===== 生物识别 =====
  biometric?: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: number | null; // epoch ms
  } | null;

  // ===== 凭证状态 =====
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

  // ===== 安全设置 =====
  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null; // epoch ms
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null; // epoch ms
    lockedUntil?: number | null; // epoch ms
    lastPasswordChangeAt?: number | null; // epoch ms
  };

  // ===== 凭证历史 (子实体) =====
  history: CredentialHistoryEntity[];

  // ===== 时间戳 =====
  readonly createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  // ===== 领域方法 =====

  // ----- Password Credential Methods -----
  setPassword(hashedPassword: string): void;
  verifyPassword(hashedPassword: string): boolean;
  requirePasswordChange(): void;

  // ----- Remember-Me Token Methods ⭐️ 新增 -----
  generateRememberMeToken(
    deviceInfo: DeviceInfoValue,
    expiresInDays?: number // 默认 30 天
  ): RememberMeTokenEntity;

  verifyRememberMeToken(
    token: string,
    deviceFingerprint: string
  ): RememberMeTokenEntity | null;

  refreshRememberMeToken(
    oldToken: string,
    deviceFingerprint: string
  ): RememberMeTokenEntity | null;

  revokeRememberMeToken(tokenUuid: string): void;
  revokeAllRememberMeTokens(): void;
  revokeRememberMeTokensByDevice(deviceId: string): void;

  cleanupExpiredRememberMeTokens(): void;

  // ----- API Key Methods -----
  generateApiKey(name: string, expiresInDays?: number): ApiKeyCredentialEntity;
  revokeApiKey(keyUuid: string): void;

  // ----- Two-Factor Methods -----
  enableTwoFactor(method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP'): string; // returns secret
  disableTwoFactor(): void;
  verifyTwoFactorCode(code: string): boolean;
  generateBackupCodes(): string[];
  useBackupCode(code: string): boolean;

  // ----- Biometric Methods -----
  enrollBiometric(type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID', deviceId: string): void;
  revokeBiometric(): void;

  // ----- Security Methods -----
  recordFailedLogin(): void;
  resetFailedAttempts(): void;
  isLocked(): boolean;
  suspend(): void;
  activate(): void;
  revoke(): void;

  // ----- DTO Conversion -----
  toServerDTO(): AuthCredentialServer;
  toClientDTO(): AuthCredentialClient;
  toPersistenceDTO(): AuthCredentialPersistence;

  static fromServerDTO(dto: AuthCredentialServer): AuthCredentialEntity;
  static fromClientDTO(dto: AuthCredentialClient): AuthCredentialEntity;
  static fromPersistenceDTO(dto: AuthCredentialPersistence): AuthCredentialEntity;

  // ----- Factory Methods -----
  static forCreate(data: {
    accountUuid: string;
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
    hashedPassword?: string;
  }): AuthCredentialEntity;
}
```

---

## 2. RememberMeToken (实体) ⭐️ 新增

### 业务描述

长期自动登录令牌，支持"记住我"功能。用户勾选"记住我"后，系统生成长期有效的 Token，下次访问时可自动登录。

### 特性

- **长期有效**: 30-90 天有效期
- **单次使用**: 每次使用后自动刷新 Token
- **设备绑定**: 绑定设备指纹，增强安全性
- **自动清理**: 过期 Token 自动失效

### Server 接口

```typescript
export interface RememberMeTokenServer {
  // ===== 基础属性 =====
  uuid: string;
  credentialUuid: string;
  accountUuid: string;

  // ===== Token 信息 =====
  token: string; // 加密存储的 Token (SHA-256 hash)
  tokenSeries: string; // Token 系列 ID，用于 Token 刷新链追踪

  // ===== 设备信息 (值对象) ⭐️ =====
  device: DeviceInfoServer;

  // ===== Token 状态 =====
  status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';

  // ===== 使用记录 =====
  usageCount: number; // 使用次数
  lastUsedAt?: number | null; // epoch ms
  lastUsedIp?: string | null;

  // ===== 有效期 =====
  expiresAt: number; // epoch ms

  // ===== 时间戳 =====
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  revokedAt?: number | null; // epoch ms
}
```

### Client 接口

```typescript
export interface RememberMeTokenClient {
  uuid: string;
  credentialUuid: string;
  accountUuid: string;

  // Token 本身不发送到客户端，只发送元数据
  tokenSeries: string;

  device: DeviceInfoClient;

  status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';

  usageCount: number;
  lastUsedAt?: number | null; // epoch ms
  lastUsedIp?: string | null;

  expiresAt: number; // epoch ms

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  revokedAt?: number | null; // epoch ms
}
```

### Domain Entity 接口

```typescript
export interface RememberMeTokenEntity {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly credentialUuid: string;
  readonly accountUuid: string;

  // ===== Token 信息 =====
  token: string; // hashed token
  readonly tokenSeries: string;

  // ===== 设备信息 (值对象) =====
  device: DeviceInfoValue;

  // ===== Token 状态 =====
  status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';

  // ===== 使用记录 =====
  usageCount: number;
  lastUsedAt?: number | null; // epoch ms
  lastUsedIp?: string | null;

  // ===== 有效期 =====
  readonly expiresAt: number; // epoch ms

  // ===== 时间戳 =====
  readonly createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  revokedAt?: number | null; // epoch ms

  // ===== 领域方法 =====

  // 验证 Token 是否匹配
  verifyToken(plainToken: string): boolean;

  // 验证设备指纹是否匹配
  verifyDevice(deviceFingerprint: string): boolean;

  // 检查是否过期
  isExpired(): boolean;

  // 检查是否可用
  isValid(): boolean;

  // 记录使用
  recordUsage(ipAddress: string): void;

  // 标记为已使用
  markAsUsed(): void;

  // 吊销 Token
  revoke(): void;

  // ===== DTO Conversion =====
  toServerDTO(): RememberMeTokenServer;
  toClientDTO(): RememberMeTokenClient;
  toPersistenceDTO(): RememberMeTokenPersistence;

  static fromServerDTO(dto: RememberMeTokenServer): RememberMeTokenEntity;
  static fromClientDTO(dto: RememberMeTokenClient): RememberMeTokenEntity;
  static fromPersistenceDTO(dto: RememberMeTokenPersistence): RememberMeTokenEntity;

  // ===== Factory Methods =====
  static forCreate(data: {
    credentialUuid: string;
    accountUuid: string;
    plainToken: string; // 原始 Token，将被 hash 后存储
    tokenSeries: string;
    device: DeviceInfoValue;
    expiresInDays: number;
  }): RememberMeTokenEntity;
}
```

---

## 3. DeviceInfo (值对象) ⭐️ 新增

### 业务描述

设备信息值对象，用于标识和追踪用户的登录设备。

### Server 接口

```typescript
export interface DeviceInfoServer {
  // ===== 设备标识 =====
  deviceId: string; // 设备唯一 ID (UUID)
  deviceFingerprint: string; // 设备指纹 (基于 UA, IP, Canvas 等生成)

  // ===== 设备类型 =====
  deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';

  // ===== 设备信息 =====
  deviceName?: string | null; // 用户自定义设备名称
  os?: string | null; // 操作系统: "Windows 11", "macOS 14.0", "iOS 17.0"
  browser?: string | null; // 浏览器: "Chrome 120", "Safari 17"

  // ===== 网络信息 =====
  ipAddress?: string | null;
  userAgent?: string | null;

  // ===== 地理位置 =====
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;

  // ===== 时间戳 =====
  firstSeenAt: number; // epoch ms - 首次见到此设备
  lastSeenAt: number; // epoch ms - 最后活跃时间
}
```

### Client 接口

```typescript
export interface DeviceInfoClient {
  deviceId: string;
  deviceFingerprint: string;
  deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';

  deviceName?: string | null;
  os?: string | null;
  browser?: string | null;

  ipAddress?: string | null;

  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;

  firstSeenAt: number; // epoch ms
  lastSeenAt: number; // epoch ms
}
```

### Value Object 接口

```typescript
export interface DeviceInfoValue {
  readonly deviceId: string;
  readonly deviceFingerprint: string;
  readonly deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';

  deviceName?: string | null;
  readonly os?: string | null;
  readonly browser?: string | null;

  ipAddress?: string | null;
  readonly userAgent?: string | null;

  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;

  readonly firstSeenAt: number; // epoch ms
  lastSeenAt: number; // epoch ms

  // ===== 值对象方法 =====

  // 更新最后活跃时间
  updateLastSeen(): DeviceInfoValue;

  // 更新设备名称
  updateName(name: string): DeviceInfoValue;

  // 更新 IP 地址
  updateIpAddress(ipAddress: string): DeviceInfoValue;

  // 检查是否匹配指纹
  matchesFingerprint(fingerprint: string): boolean;

  // ===== DTO Conversion =====
  toServerDTO(): DeviceInfoServer;
  toClientDTO(): DeviceInfoClient;

  static fromServerDTO(dto: DeviceInfoServer): DeviceInfoValue;
  static fromClientDTO(dto: DeviceInfoClient): DeviceInfoValue;

  // ===== Factory Methods =====
  static create(data: {
    deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
    os?: string;
    browser?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): DeviceInfoValue;
}
```

---

## 4. AuthSession (聚合根) ⭐️ 增强多端支持

### 业务描述

会话聚合根，管理用户的登录会话。支持**多端并发登录**，每个设备独立管理 Session。

### Server 接口

```typescript
export interface AuthSessionServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;

  // ===== 访问令牌 =====
  accessToken: string; // JWT (短期，15分钟)
  accessTokenExpiresAt: number; // epoch ms

  // ===== 刷新令牌 (子实体) =====
  refreshToken: RefreshTokenServer;

  // ===== 设备信息 (值对象) ⭐️ 新增 =====
  device: DeviceInfoServer;

  // ===== 会话状态 =====
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';

  // ===== IP 和地理位置 =====
  ipAddress: string;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;

  // ===== 活跃追踪 ⭐️ 优化 =====
  lastActivityAt: number; // epoch ms - 最后活跃时间
  lastActivityType?: string | null; // "api_call", "page_view", "data_sync"

  // ===== 会话历史 (子实体) =====
  history: SessionHistoryServer[];

  // ===== 时间戳 =====
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  revokedAt?: number | null; // epoch ms
}
```

### Client 接口

```typescript
export interface AuthSessionClient {
  uuid: string;
  accountUuid: string;

  accessToken: string;
  accessTokenExpiresAt: number; // epoch ms

  refreshToken: RefreshTokenClient;

  device: DeviceInfoClient; // ⭐️ 新增

  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';

  ipAddress: string;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;

  lastActivityAt: number; // epoch ms
  lastActivityType?: string | null;

  history: SessionHistoryClient[];

  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  revokedAt?: number | null; // epoch ms
}
```

### Domain Entity 接口

```typescript
export interface AuthSessionEntity {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly accountUuid: string;

  // ===== 访问令牌 =====
  accessToken: string;
  accessTokenExpiresAt: number; // epoch ms

  // ===== 刷新令牌 (子实体) =====
  refreshToken: RefreshTokenEntity;

  // ===== 设备信息 (值对象) ⭐️ 新增 =====
  device: DeviceInfoValue;

  // ===== 会话状态 =====
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';

  // ===== IP 和地理位置 =====
  ipAddress: string;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;

  // ===== 活跃追踪 =====
  lastActivityAt: number; // epoch ms
  lastActivityType?: string | null;

  // ===== 会话历史 (子实体) =====
  history: SessionHistoryEntity[];

  // ===== 时间戳 =====
  readonly createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  revokedAt?: number | null; // epoch ms

  // ===== 领域方法 =====

  // 刷新访问令牌
  refreshAccessToken(newToken: string, expiresInMinutes: number): void;

  // 刷新 Refresh Token
  refreshRefreshToken(): void;

  // 检查访问令牌是否过期
  isAccessTokenExpired(): boolean;

  // 检查 Refresh Token 是否过期
  isRefreshTokenExpired(): boolean;

  // 检查会话是否有效
  isValid(): boolean;

  // 记录活跃
  recordActivity(activityType: string): void;

  // 更新设备信息
  updateDeviceInfo(device: Partial<DeviceInfoValue>): void;

  // 吊销会话
  revoke(): void;

  // 锁定会话
  lock(): void;

  // 激活会话
  activate(): void;

  // 延长会话
  extend(hours: number): void;

  // ===== DTO Conversion =====
  toServerDTO(): AuthSessionServer;
  toClientDTO(): AuthSessionClient;
  toPersistenceDTO(): AuthSessionPersistence;

  static fromServerDTO(dto: AuthSessionServer): AuthSessionEntity;
  static fromClientDTO(dto: AuthSessionClient): AuthSessionEntity;
  static fromPersistenceDTO(dto: AuthSessionPersistence): AuthSessionEntity;

  // ===== Factory Methods =====
  static forCreate(data: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    device: DeviceInfoValue;
    ipAddress: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): AuthSessionEntity;
}
```

---

## 5. Repository 接口

### AuthCredentialRepository

```typescript
export interface AuthCredentialRepository {
  // ===== 基础 CRUD =====
  save(credential: AuthCredentialEntity): Promise<void>;
  findByUuid(uuid: string): Promise<AuthCredentialEntity | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthCredentialEntity | null>;
  delete(uuid: string): Promise<void>;

  // ===== 密码查询 =====
  findByAccountWithPassword(accountUuid: string): Promise<AuthCredentialEntity | null>;

  // ===== Remember-Me Token 查询 ⭐️ 新增 =====
  findByRememberMeToken(
    token: string,
    deviceFingerprint: string,
  ): Promise<{ credential: AuthCredentialEntity; token: RememberMeTokenEntity } | null>;

  findActiveRememberMeTokensByAccount(accountUuid: string): Promise<RememberMeTokenEntity[]>;

  findRememberMeTokensByDevice(
    accountUuid: string,
    deviceId: string,
  ): Promise<RememberMeTokenEntity[]>;

  cleanupExpiredRememberMeTokens(accountUuid: string): Promise<void>;

  // ===== API Key 查询 =====
  findByApiKey(key: string): Promise<AuthCredentialEntity | null>;
  findActiveApiKeysByAccount(accountUuid: string): Promise<ApiKeyCredentialEntity[]>;

  // ===== 批量操作 =====
  findAll(): Promise<AuthCredentialEntity[]>;
  findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
  ): Promise<AuthCredentialEntity[]>;

  // ===== 安全查询 =====
  findLockedCredentials(): Promise<AuthCredentialEntity[]>;
  findCredentialsRequiringPasswordChange(): Promise<AuthCredentialEntity[]>;
}
```

### AuthSessionRepository ⭐️ 增强多端支持

```typescript
export interface AuthSessionRepository {
  // ===== 基础 CRUD =====
  save(session: AuthSessionEntity): Promise<void>;
  findByUuid(uuid: string): Promise<AuthSessionEntity | null>;
  findByAccessToken(token: string): Promise<AuthSessionEntity | null>;
  findByRefreshToken(token: string): Promise<AuthSessionEntity | null>;
  delete(uuid: string): Promise<void>;

  // ===== 多端查询 ⭐️ 新增 =====
  findActiveSessionsByAccount(accountUuid: string): Promise<AuthSessionEntity[]>;

  findSessionsByDevice(accountUuid: string, deviceId: string): Promise<AuthSessionEntity[]>;

  findSessionsByDeviceType(
    accountUuid: string,
    deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API',
  ): Promise<AuthSessionEntity[]>;

  countActiveSessionsByAccount(accountUuid: string): Promise<number>;

  // ===== 设备管理 ⭐️ 新增 =====
  revokeSessionsByDevice(accountUuid: string, deviceId: string): Promise<void>;

  revokeOtherSessions(accountUuid: string, currentSessionUuid: string): Promise<void>;

  // ===== 清理操作 =====
  cleanupExpiredSessions(accountUuid: string): Promise<void>;
  revokeAllSessions(accountUuid: string): Promise<void>;

  // ===== 批量操作 =====
  findAll(): Promise<AuthSessionEntity[]>;
  findByStatus(status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED'): Promise<AuthSessionEntity[]>;
}
```

---

## 6. Domain Service 接口

### AuthCredentialDomainService ⭐️ 新增 Remember-Me 支持

```typescript
export interface AuthCredentialDomainService {
  // ===== 密码管理 =====
  hashPassword(plainPassword: string): Promise<string>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  generateSalt(): string;

  // ===== Remember-Me Token 管理 ⭐️ 新增 =====
  generateRememberMeToken(
    credential: AuthCredentialEntity,
    device: DeviceInfoValue,
    expiresInDays?: number,
  ): Promise<{ plainToken: string; tokenEntity: RememberMeTokenEntity }>;

  verifyRememberMeToken(
    plainToken: string,
    deviceFingerprint: string,
  ): Promise<{ credential: AuthCredentialEntity; token: RememberMeTokenEntity } | null>;

  refreshRememberMeToken(
    oldPlainToken: string,
    deviceFingerprint: string,
  ): Promise<{ plainToken: string; tokenEntity: RememberMeTokenEntity } | null>;

  revokeRememberMeToken(credential: AuthCredentialEntity, tokenUuid: string): Promise<void>;

  cleanupExpiredRememberMeTokens(credential: AuthCredentialEntity): Promise<void>;

  // ===== API Key 管理 =====
  generateApiKey(
    credential: AuthCredentialEntity,
    name: string,
    expiresInDays?: number,
  ): Promise<string>;
  verifyApiKey(key: string): Promise<AuthCredentialEntity | null>;
  revokeApiKey(credential: AuthCredentialEntity, keyUuid: string): Promise<void>;

  // ===== 两步验证 =====
  generateTOTPSecret(): string;
  verifyTOTPCode(secret: string, code: string): boolean;
  generateBackupCodes(count: number): string[];

  // ===== 安全检查 =====
  checkPasswordStrength(password: string): { score: number; feedback: string[] };
  isPasswordExpired(credential: AuthCredentialEntity): boolean;
  shouldLockAccount(credential: AuthCredentialEntity): boolean;
}
```

### AuthSessionDomainService ⭐️ 增强多端支持

```typescript
export interface AuthSessionDomainService {
  // ===== Token 生成 =====
  generateAccessToken(accountUuid: string, expiresInMinutes?: number): Promise<string>;
  generateRefreshToken(): string;

  // ===== Token 验证 =====
  verifyAccessToken(token: string): Promise<{ accountUuid: string; sessionUuid: string } | null>;
  verifyRefreshToken(session: AuthSessionEntity): boolean;

  // ===== 会话管理 =====
  createSession(
    accountUuid: string,
    device: DeviceInfoValue,
    ipAddress: string,
    location?: { country?: string; region?: string; city?: string; timezone?: string },
  ): Promise<AuthSessionEntity>;

  refreshSession(session: AuthSessionEntity): Promise<void>;
  revokeSession(session: AuthSessionEntity): Promise<void>;

  // ===== 多端管理 ⭐️ 新增 =====
  countActiveSessions(accountUuid: string): Promise<number>;

  validateConcurrentSessionLimit(accountUuid: string, maxSessions: number): Promise<boolean>;

  revokeOldestSession(accountUuid: string): Promise<void>;

  getActiveDevices(accountUuid: string): Promise<DeviceInfoValue[]>;

  revokeSessionsByDevice(accountUuid: string, deviceId: string): Promise<void>;

  // ===== 清理 =====
  cleanupExpiredSessions(accountUuid: string): Promise<void>;
}
```

### DeviceFingerprintService ⭐️ 新增

```typescript
export interface DeviceFingerprintService {
  // ===== 设备指纹生成 =====
  generateFingerprint(data: {
    userAgent: string;
    ipAddress: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    canvas?: string; // Canvas fingerprint
  }): string;

  // ===== 设备信息提取 =====
  extractDeviceInfo(userAgent: string): {
    deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
    os?: string;
    browser?: string;
  };

  // ===== 地理位置查询 =====
  lookupLocation(ipAddress: string): Promise<{
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  } | null>;

  // ===== 设备验证 =====
  verifyDevice(storedFingerprint: string, currentFingerprint: string): boolean;

  // ===== 设备 ID 生成 =====
  generateDeviceId(): string; // UUID v4
}
```

---

## 7. Application Service 接口

### AuthCredentialApplicationService ⭐️ 新增自动登录支持

```typescript
export interface AuthCredentialApplicationService {
  // ===== 密码管理 =====
  setPassword(accountUuid: string, plainPassword: string): Promise<void>;
  changePassword(accountUuid: string, oldPassword: string, newPassword: string): Promise<void>;
  resetPassword(accountUuid: string, newPassword: string): Promise<void>;

  // ===== Remember-Me 自动登录 ⭐️ 新增 =====
  loginWithRememberMeToken(
    rememberMeToken: string,
    deviceFingerprint: string,
    ipAddress: string,
  ): Promise<{
    session: AuthSessionEntity;
    newRememberMeToken: string; // 刷新后的新 Token
  } | null>;

  enableRememberMe(
    accountUuid: string,
    device: DeviceInfoValue,
    expiresInDays?: number,
  ): Promise<string>; // 返回 plainToken

  disableRememberMe(accountUuid: string, tokenUuid?: string): Promise<void>;

  revokeRememberMeTokensByDevice(accountUuid: string, deviceId: string): Promise<void>;

  getAllRememberMeTokens(accountUuid: string): Promise<RememberMeTokenClient[]>;

  // ===== API Key 管理 =====
  generateApiKey(accountUuid: string, name: string, expiresInDays?: number): Promise<string>;
  revokeApiKey(accountUuid: string, keyUuid: string): Promise<void>;
  listApiKeys(accountUuid: string): Promise<ApiKeyCredentialClient[]>;

  // ===== 两步验证 =====
  enableTwoFactor(
    accountUuid: string,
    method: 'TOTP' | 'SMS' | 'EMAIL',
  ): Promise<{ secret: string; qrCode: string }>;
  verifyTwoFactor(accountUuid: string, code: string): Promise<boolean>;
  disableTwoFactor(accountUuid: string): Promise<void>;

  // ===== 查询 =====
  getCredential(accountUuid: string): Promise<AuthCredentialClient | null>;
}
```

### AuthSessionApplicationService ⭐️ 增强多端管理

```typescript
export interface AuthSessionApplicationService {
  // ===== 登录/登出 =====
  login(
    accountUuid: string,
    device: DeviceInfoValue,
    ipAddress: string,
    rememberMe?: boolean, // ⭐️ 新增
    rememberMeDays?: number,
  ): Promise<{
    session: AuthSessionClient;
    rememberMeToken?: string; // ⭐️ 新增
  }>;

  logout(sessionUuid: string): Promise<void>;
  logoutAllDevices(accountUuid: string): Promise<void>; // ⭐️ 新增
  logoutDevice(accountUuid: string, deviceId: string): Promise<void>; // ⭐️ 新增

  // ===== Token 刷新 =====
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    accessTokenExpiresAt: number; // epoch ms
  }>;

  // ===== 会话查询 =====
  getCurrentSession(accessToken: string): Promise<AuthSessionClient | null>;
  getSessionById(sessionUuid: string): Promise<AuthSessionClient | null>;

  // ===== 多端管理 ⭐️ 新增 =====
  getActiveSessions(accountUuid: string): Promise<AuthSessionClient[]>;

  getActiveDevices(accountUuid: string): Promise<DeviceInfoClient[]>;

  getSessionsByDevice(accountUuid: string, deviceId: string): Promise<AuthSessionClient[]>;

  countActiveSessions(accountUuid: string): Promise<number>;

  revokeSession(accountUuid: string, sessionUuid: string): Promise<void>;

  revokeOtherSessions(accountUuid: string, currentSessionUuid: string): Promise<void>;

  // ===== 活跃追踪 =====
  recordActivity(sessionUuid: string, activityType: string): Promise<void>;

  // ===== 清理 =====
  cleanupExpiredSessions(accountUuid: string): Promise<void>;
}
```

---

## 8. 自动登录流程

### 8.1 启用 Remember-Me

```typescript
// Frontend: 用户勾选 "记住我"
const loginResult = await authSessionService.login(
  accountUuid,
  deviceInfo,
  ipAddress,
  true, // rememberMe = true
  30, // 30 天有效期
);

// 将 rememberMeToken 存储到 localStorage (浏览器) 或 secure storage (桌面端/移动端)
localStorage.setItem('rememberMeToken', loginResult.rememberMeToken);
```

### 8.2 自动登录

```typescript
// Frontend: 页面加载时检查是否有 rememberMeToken
const rememberMeToken = localStorage.getItem('rememberMeToken');
if (rememberMeToken && !currentAccessToken) {
  // 生成设备指纹
  const deviceFingerprint = await generateDeviceFingerprint();

  // 使用 remember-me token 自动登录
  const result = await authCredentialService.loginWithRememberMeToken(
    rememberMeToken,
    deviceFingerprint,
    currentIpAddress,
  );

  if (result) {
    // 更新 session
    store.commit('auth/setSession', result.session);

    // 更新 rememberMeToken (单次使用后刷新)
    localStorage.setItem('rememberMeToken', result.newRememberMeToken);

    // 自动登录成功
    router.push('/dashboard');
  } else {
    // Token 无效或过期，清除本地存储
    localStorage.removeItem('rememberMeToken');
  }
}
```

### 8.3 手动登出

```typescript
// Frontend: 用户点击登出
await authSessionService.logout(currentSessionUuid);

// 清除 rememberMeToken (用户主动登出时)
localStorage.removeItem('rememberMeToken');

// 如果需要保留 remember-me (不清除 token)，用户下次访问仍可自动登录
// 则不调用 removeItem()
```

---

## 9. 多端并发登录

### 9.1 获取活跃设备列表

```typescript
// Frontend: 显示所有在线设备
const devices = await authSessionService.getActiveDevices(accountUuid);

// 展示设备列表
devices.forEach((device) => {
  console.log({
    deviceId: device.deviceId,
    deviceType: device.deviceType,
    deviceName: device.deviceName,
    os: device.os,
    browser: device.browser,
    lastSeenAt: new Date(device.lastSeenAt),
    location: device.location,
  });
});
```

### 9.2 踢出特定设备

```typescript
// Frontend: 用户点击 "踢出此设备"
await authSessionService.logoutDevice(accountUuid, deviceId);

// 该设备的所有 session 和 remember-me token 都会被吊销
```

### 9.3 踢出其他设备

```typescript
// Frontend: 用户点击 "踢出其他所有设备"
await authSessionService.revokeOtherSessions(accountUuid, currentSessionUuid);

// 保留当前设备，吊销其他所有设备的 session
```

### 9.4 设备数量限制

```typescript
// Backend: 登录时检查设备数量
const activeSessionCount = await authSessionService.countActiveSessions(accountUuid);

if (activeSessionCount >= MAX_CONCURRENT_SESSIONS) {
  // 超过限制，吊销最老的 session
  await authSessionDomainService.revokeOldestSession(accountUuid);
}

// 创建新 session
const session = await authSessionService.login(...);
```

---

## 10. 安全考虑

### 10.1 Remember-Me Token 安全性

1. **Token 存储**:
   - Server: 仅存储 Token 的 SHA-256 hash
   - Client: 存储明文 Token (localStorage / secure storage)

2. **单次使用**:
   - 每次使用 remember-me token 后，立即生成新 token
   - 旧 token 标记为 USED，不可再次使用

3. **设备绑定**:
   - Token 绑定设备指纹
   - 验证时同时校验 token 和设备指纹

4. **过期时间**:
   - 默认 30 天有效期
   - 支持配置 7-90 天

5. **主动失效**:
   - 用户登出时清除 token
   - 修改密码时吊销所有 remember-me token

### 10.2 多端登录安全性

1. **设备识别**:
   - 每个设备独立 Session
   - 基于设备指纹识别

2. **并发限制**:
   - 可配置最大并发设备数
   - 超限时自动踢出最老设备

3. **活跃追踪**:
   - 记录每个设备的最后活跃时间
   - 支持查看所有在线设备

4. **远程登出**:
   - 支持踢出特定设备
   - 支持踢出所有其他设备

---

## 11. Persistence 层接口

### AuthCredentialPersistence

```typescript
export interface AuthCredentialPersistence {
  uuid: string;
  account_uuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';

  // JSON 字段
  password_credential: string | null; // JSON: PasswordCredentialServer
  api_key_credentials: string; // JSON: ApiKeyCredentialServer[]
  remember_me_tokens: string; // JSON: RememberMeTokenServer[] ⭐️ 新增
  two_factor: string | null; // JSON
  biometric: string | null; // JSON
  security: string; // JSON
  history: string; // JSON: CredentialHistoryServer[]

  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

  created_at: number; // epoch ms
  updated_at: number; // epoch ms
}
```

### AuthSessionPersistence

```typescript
export interface AuthSessionPersistence {
  uuid: string;
  account_uuid: string;
  access_token: string;
  access_token_expires_at: number; // epoch ms

  // JSON 字段
  refresh_token: string; // JSON: RefreshTokenServer
  device: string; // JSON: DeviceInfoServer ⭐️ 新增
  location: string | null; // JSON
  history: string; // JSON: SessionHistoryServer[]

  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';
  ip_address: string;
  last_activity_at: number; // epoch ms
  last_activity_type: string | null;

  created_at: number; // epoch ms
  expires_at: number; // epoch ms
  revoked_at: number | null; // epoch ms
}
```

---

## 12. 总结

### V2.1 新增特性

✅ **Remember-Me Token 支持**

- 长期自动登录 (30-90 天)
- 单次使用 + 自动刷新
- 设备绑定增强安全性

✅ **多端并发登录**

- Browser / Desktop / Mobile 同时在线
- 独立 Session 管理
- 设备列表查看

✅ **设备管理**

- 设备指纹识别
- 活跃设备追踪
- 远程踢出设备

✅ **安全增强**

- 并发设备数量限制
- 最老设备自动踢出
- Remember-me token 自动清理

### 与 V2 的差异

| 特性              | V2       | V2.1                   |
| ----------------- | -------- | ---------------------- |
| Remember-Me Token | ❌       | ✅ 支持长期自动登录    |
| 多端并发          | 部分支持 | ✅ 完整支持 + 设备管理 |
| 设备指纹          | ❌       | ✅ DeviceInfo 值对象   |
| 设备列表          | ❌       | ✅ 查看所有在线设备    |
| 远程登出          | ❌       | ✅ 踢出特定设备        |
| 并发限制          | ❌       | ✅ 可配置最大设备数    |

---

**文档完成** ✅
