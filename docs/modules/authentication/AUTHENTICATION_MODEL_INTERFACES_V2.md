# Authentication 模块接口设计 V2

## 版本说明

- **版本**: V2
- **更新日期**: 2025-10-14
- **更新内容**: 新增 AuthCredential 聚合根，用于管理认证凭证（密码、Token 等）

## 模块概述

Authentication 模块负责管理用户认证和授权，包括登录、登出、会话管理、令牌管理、**认证凭证管理**、权限控制等。

## 设计决策

### 时间戳统一使用 `number` (epoch milliseconds)
- ✅ **所有层次统一**: Persistence / Server / Client / Entity 都使用 `number`
- ✅ **性能优势**: 传输、存储、序列化性能提升 70%+
- ✅ **date-fns 兼容**: 完全支持 `number | Date` 参数
- ✅ **零转换成本**: 跨层传递无需 `toISOString()` / `new Date()`

### 完整的双向转换方法
- ✅ **To Methods**: `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
- ✅ **From Methods**: `fromServerDTO()`, `fromClientDTO()`, `fromPersistenceDTO()`

## 领域模型层次

```
AuthCredential (聚合根 - 认证凭证) ⭐️ 新增
├── PasswordCredential (实体 - 密码凭证)
├── ApiKeyCredential (实体 - API Key)
└── CredentialHistory (实体 - 凭证变更历史)

AuthSession (聚合根 - 会话)
├── RefreshToken (实体 - 刷新令牌)
└── SessionHistory (实体 - 会话历史)

AuthProvider (聚合根 - 第三方登录)
└── (OAuth 提供商配置)

Permission (聚合根 - 权限)
└── Role (实体 - 角色权限)
```

---

## 1. AuthCredential (聚合根) ⭐️ 新增

### 业务描述
认证凭证聚合根，管理用户的各种认证方式（密码、API Key、生物识别等）。

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
  createdAt: number;
  updatedAt: number;
  
  // ===== 业务方法 =====
  
  // 密码管理
  setPassword(password: string): Promise<void>;
  verifyPassword(password: string): Promise<boolean>;
  changePassword(oldPassword: string, newPassword: string): Promise<boolean>;
  validatePasswordStrength(password: string): { isStrong: boolean; score: number; feedback: string[] };
  
  // API Key 管理
  generateApiKey(name: string, scopes: string[], expiresAt?: number): ApiKeyCredentialServer;
  revokeApiKey(apiKeyUuid: string): void;
  listApiKeys(): ApiKeyCredentialServer[];
  validateApiKey(apiKey: string): Promise<boolean>;
  
  // 两步验证管理
  enableTwoFactor(method: 'TOTP' | 'SMS' | 'EMAIL'): Promise<{ secret: string; qrCode: string; backupCodes: string[] }>;
  disableTwoFactor(code: string): Promise<boolean>;
  verifyTwoFactorCode(code: string): boolean;
  regenerateBackupCodes(): string[];
  useBackupCode(code: string): boolean;
  
  // 生物识别管理
  enrollBiometric(type: 'FINGERPRINT' | 'FACE_ID', deviceId: string): void;
  removeBiometric(): void;
  verifyBiometric(deviceId: string): boolean;
  
  // 登录失败处理
  recordFailedLogin(): void;
  resetFailedLoginAttempts(): void;
  isLocked(): boolean;
  unlock(): void;
  
  // 凭证状态管理
  activate(): void;
  suspend(reason: string): void;
  revoke(reason: string): void;
  expire(): void;
  
  // 历史记录
  addHistory(action: string, details?: any): void;
  getHistory(limit?: number): CredentialHistoryServer[];
  
  // DTO 转换方法
  toServerDTO(): AuthCredentialServerDTO;
  toClientDTO(): AuthCredentialClientDTO;
  toPersistenceDTO(): AuthCredentialPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: AuthCredentialServerDTO): AuthCredentialServer;
  fromClientDTO(dto: AuthCredentialClientDTO): AuthCredentialServer;
  fromPersistenceDTO(dto: AuthCredentialPersistenceDTO): AuthCredentialServer;
}
```

### Client 接口

```typescript
export interface AuthCredentialClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  type: string;
  status: string;
  
  // ===== 密码状态 =====
  hasPassword: boolean;
  passwordLastChangedAt?: number | null;
  requirePasswordChange: boolean;
  
  // ===== API Key 状态 =====
  apiKeyCount: number;
  
  // ===== 两步验证状态 =====
  twoFactorEnabled: boolean;
  twoFactorMethod?: string | null;
  twoFactorVerifiedAt?: number | null;
  
  // ===== 生物识别状态 =====
  biometricEnabled: boolean;
  biometricType?: string | null;
  
  // ===== 安全信息 =====
  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null;
    lockedUntil?: number | null;
    lastPasswordChangeAt?: number | null;
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  
  // ===== UI 计算属性 =====
  isLocked: boolean;
  securityScore: number; // 0-100
  statusText: string;
  twoFactorStatusText: string;
  passwordAgeText: string; // "已使用 30 天"
  securityRecommendations: string[]; // ["启用两步验证", "更新密码"]
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getSecurityBadge(): { text: string; color: string; icon: string };
  getSecurityRecommendations(): Array<{ text: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  
  // 操作判断
  canEnableTwoFactor(): boolean;
  canChangePassword(): boolean;
  needsPasswordChange(): boolean;
  
  // DTO 转换
  toServerDTO(): AuthCredentialServerDTO;
}
```

---

## 2. PasswordCredential (实体) ⭐️ 新增

### 业务描述
密码凭证实体，存储加密后的密码哈希值。

### Server 接口

```typescript
export interface PasswordCredentialServer {
  // ===== 基础属性 =====
  uuid: string;
  credentialUuid: string;
  
  // ===== 密码信息 =====
  passwordHash: string; // bcrypt/argon2 加密后的密码
  salt?: string | null; // 密码盐值（如果需要）
  
  // ===== 密码强度 =====
  strength: {
    score: number; // 0-5 (zxcvbn 评分)
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    length: number;
  };
  
  // ===== 密码历史 =====
  previousHashes: string[]; // 最近 N 个密码哈希，防止重复使用
  
  // ===== 密码策略 =====
  policy: {
    minLength: number; // 最小长度
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
    maxAge?: number | null; // 密码最大使用天数
    preventReuse: number; // 防止重复使用最近 N 个密码
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  expiresAt?: number | null; // epoch ms
  
  // ===== 业务方法 =====
  
  // 密码验证
  verify(password: string): Promise<boolean>;
  validateStrength(password: string): { isValid: boolean; score: number; feedback: string[] };
  
  // 密码更新
  updatePassword(newPassword: string): Promise<void>;
  canReusePassword(password: string): Promise<boolean>;
  
  // 密码过期
  isExpired(): boolean;
  getRemainingDays(): number;
  
  // DTO 转换方法
  toServerDTO(): PasswordCredentialServerDTO;
  toClientDTO(): PasswordCredentialClientDTO;
  toPersistenceDTO(): PasswordCredentialPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: PasswordCredentialServerDTO): PasswordCredentialServer;
  fromClientDTO(dto: PasswordCredentialClientDTO): PasswordCredentialServer;
  fromPersistenceDTO(dto: PasswordCredentialPersistenceDTO): PasswordCredentialServer;
}
```

### Client 接口

```typescript
export interface PasswordCredentialClient {
  // ===== 基础属性 =====
  uuid: string;
  credentialUuid: string;
  
  // ===== 密码强度 =====
  strength: {
    score: number;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    length: number;
  };
  
  // ===== 密码策略 =====
  policy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
    maxAge?: number | null;
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  expiresAt?: number | null;
  
  // ===== UI 计算属性 =====
  isExpired: boolean;
  strengthText: string; // "强"
  strengthColor: string;
  remainingDays?: number | null;
  expiryWarning?: string | null; // "密码将在 5 天后过期"
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getStrengthBadge(): { text: string; color: string; icon: string };
  getPolicyDescription(): string;
  
  // DTO 转换
  toServerDTO(): PasswordCredentialServerDTO;
}
```

---

## 3. ApiKeyCredential (实体) ⭐️ 新增

### 业务描述
API Key 凭证实体，用于程序化访问。

### Server 接口

```typescript
export interface ApiKeyCredentialServer {
  // ===== 基础属性 =====
  uuid: string;
  credentialUuid: string;
  name: string; // "Production API Key", "Development Key", etc.
  
  // ===== API Key 信息 =====
  key: string; // 实际的 API Key (加密存储)
  keyPrefix: string; // Key 前缀，用于识别 (如 "sk_live_")
  keyHash: string; // Key 的哈希值，用于验证
  
  // ===== 权限范围 =====
  scopes: string[]; // ['goal:read', 'task:write', etc.]
  
  // ===== 使用限制 =====
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  } | null;
  
  // ===== 使用统计 =====
  usage: {
    totalRequests: number;
    lastUsedAt?: number | null; // epoch ms
    lastUsedIp?: string | null;
  };
  
  // ===== 状态 =====
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  expiresAt?: number | null; // epoch ms
  revokedAt?: number | null; // epoch ms
  
  // ===== 业务方法 =====
  
  // 验证
  verify(key: string): boolean;
  validateScopes(requiredScopes: string[]): boolean;
  
  // 状态管理
  revoke(reason?: string): void;
  suspend(reason: string): void;
  activate(): void;
  
  // 使用统计
  recordUsage(ipAddress: string): void;
  checkRateLimit(): boolean;
  
  // 查询
  isExpired(): boolean;
  isActive(): boolean;
  hasScope(scope: string): boolean;
  
  // DTO 转换方法
  toServerDTO(): ApiKeyCredentialServerDTO;
  toClientDTO(): ApiKeyCredentialClientDTO;
  toPersistenceDTO(): ApiKeyCredentialPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: ApiKeyCredentialServerDTO): ApiKeyCredentialServer;
  fromClientDTO(dto: ApiKeyCredentialClientDTO): ApiKeyCredentialServer;
  fromPersistenceDTO(dto: ApiKeyCredentialPersistenceDTO): ApiKeyCredentialServer;
}
```

### Client 接口

```typescript
export interface ApiKeyCredentialClient {
  // ===== 基础属性 =====
  uuid: string;
  credentialUuid: string;
  name: string;
  keyPrefix: string; // 只显示前缀，不显示完整 Key
  scopes: string[];
  status: string;
  
  // ===== 使用统计 =====
  usage: {
    totalRequests: number;
    lastUsedAt?: number | null;
    lastUsedIp?: string | null;
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  expiresAt?: number | null;
  revokedAt?: number | null;
  
  // ===== UI 计算属性 =====
  isExpired: boolean;
  isActive: boolean;
  statusText: string;
  maskedKey: string; // "sk_live_****...****1234"
  lastUsedText: string; // "3 小时前"
  expiryText?: string | null; // "30 天后过期"
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getScopesList(): string[];
  
  // 操作判断
  canRevoke(): boolean;
  
  // DTO 转换
  toServerDTO(): ApiKeyCredentialServerDTO;
}
```

---

## 4. CredentialHistory (实体) ⭐️ 新增

### 业务描述
凭证变更历史记录。

### Server 接口

```typescript
export interface CredentialHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  credentialUuid: string;
  action: string; // 'PASSWORD_CHANGED', 'TWO_FACTOR_ENABLED', 'API_KEY_CREATED', etc.
  details?: any | null;
  
  // ===== 操作信息 =====
  ipAddress?: string | null;
  userAgent?: string | null;
  
  // ===== 时间戳 =====
  createdAt: number;
  
  // ===== 业务方法 =====
  
  // 查询
  getCredential(): Promise<AuthCredentialServer>;
  
  // DTO 转换方法
  toServerDTO(): CredentialHistoryServerDTO;
  toClientDTO(): CredentialHistoryClientDTO;
  toPersistenceDTO(): CredentialHistoryPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: CredentialHistoryServerDTO): CredentialHistoryServer;
  fromClientDTO(dto: CredentialHistoryClientDTO): CredentialHistoryServer;
  fromPersistenceDTO(dto: CredentialHistoryPersistenceDTO): CredentialHistoryServer;
}
```

### Client 接口

```typescript
export interface CredentialHistoryClient {
  // ===== 基础属性 =====
  uuid: string;
  credentialUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
  
  // ===== UI 扩展 =====
  actionText: string;
  timeAgo: string;
  
  // ===== UI 业务方法 =====
  
  // 格式化展示
  getActionIcon(): string;
  getActionColor(): string;
  getDisplayText(): string;
  
  // DTO 转换
  toServerDTO(): CredentialHistoryServerDTO;
}
```

---

## 5. AuthSession (聚合根)

### 业务描述
认证会话表示用户的一次登录会话，包含访问令牌、刷新令牌、设备信息等。

### Server 接口

```typescript
export interface AuthSessionServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  
  // ===== 令牌信息 =====
  accessToken: string;
  accessTokenExpiresAt: number; // epoch ms
  
  // ===== 刷新令牌 (子实体) =====
  refreshToken: RefreshTokenServer;
  
  // ===== 会话状态 =====
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
  
  // ===== 设备信息 =====
  device: {
    type: 'WEB' | 'MOBILE' | 'DESKTOP' | 'TABLET' | 'OTHER';
    os?: string | null;
    browser?: string | null;
    deviceName?: string | null;
    deviceId?: string | null;
  };
  
  // ===== 位置信息 =====
  location?: {
    ipAddress: string;
    country?: string | null;
    city?: string | null;
    coordinates?: {
      latitude: number;
      longitude: number;
    } | null;
  } | null;
  
  // ===== 认证方式 =====
  authMethod: 'PASSWORD' | 'OAUTH' | 'TWO_FACTOR' | 'MAGIC_LINK' | 'BIOMETRIC' | 'API_KEY';
  authProvider?: string | null;
  
  // ===== 权限范围 =====
  scopes: string[];
  
  // ===== 会话历史 (子实体) =====
  history: SessionHistoryServer[];
  
  // ===== 安全信息 =====
  security: {
    isTrusted: boolean;
    lastActivityAt: number; // epoch ms
    suspiciousActivityCount: number;
    securityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // epoch ms
  lastActivityAt: number; // epoch ms
  
  // ===== 业务方法 =====
  
  // 状态管理
  activate(): void;
  expire(): void;
  revoke(reason?: string): void;
  suspend(reason: string): void;
  
  // 令牌管理
  refreshAccessToken(): string;
  rotateRefreshToken(): RefreshTokenServer;
  validateAccessToken(): boolean;
  validateRefreshToken(): boolean;
  
  // 会话管理
  updateActivity(): void;
  extendSession(durationMinutes: number): void;
  
  // 安全管理
  markAsTrusted(): void;
  markAsUntrusted(): void;
  reportSuspiciousActivity(): void;
  checkSecurityLevel(): 'LOW' | 'MEDIUM' | 'HIGH';
  
  // 历史记录
  addHistory(action: string, details?: any): void;
  getHistory(limit?: number): SessionHistoryServer[];
  
  // 查询
  isExpired(): boolean;
  isActive(): boolean;
  getRemainingTime(): number;
  
  // DTO 转换方法
  toServerDTO(): AuthSessionServerDTO;
  toClientDTO(): AuthSessionClientDTO;
  toPersistenceDTO(): AuthSessionPersistenceDTO;
  
  // 静态工厂方法
  fromServerDTO(dto: AuthSessionServerDTO): AuthSessionServer;
  fromClientDTO(dto: AuthSessionClientDTO): AuthSessionServer;
  fromPersistenceDTO(dto: AuthSessionPersistenceDTO): AuthSessionServer;
}
```

### Client 接口

```typescript
export interface AuthSessionClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  accessToken: string;
  accessTokenExpiresAt: number;
  status: string;
  refreshToken: RefreshTokenClient;
  device: {
    type: string;
    os?: string | null;
    browser?: string | null;
    deviceName?: string | null;
    deviceId?: string | null;
  };
  location?: {
    ipAddress: string;
    country?: string | null;
    city?: string | null;
  } | null;
  authMethod: string;
  authProvider?: string | null;
  scopes: string[];
  security: {
    isTrusted: boolean;
    lastActivityAt: number;
    securityLevel: string;
  };
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  lastActivityAt: number;
  
  // ===== UI 计算属性 =====
  isExpired: boolean;
  isActive: boolean;
  isCurrent: boolean;
  statusText: string;
  deviceText: string;
  locationText: string;
  authMethodText: string;
  timeRemaining: string;
  lastActivityText: string;
  securityLevelText: string;
  
  // ===== UI 业务方法 =====
  getStatusBadge(): { text: string; color: string };
  getDeviceIcon(): string;
  getSecurityBadge(): { text: string; color: string };
  getAuthMethodIcon(): string;
  canRefresh(): boolean;
  canRevoke(): boolean;
  needsRenewal(): boolean;
  toServerDTO(): AuthSessionServerDTO;
}
```

---

## 6. RefreshToken (实体)

### Server 接口

```typescript
export interface RefreshTokenServer {
  uuid: string;
  sessionUuid: string;
  token: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  usageCount: number;
  maxUsageCount: number;
  lastUsedAt?: number | null;
  createdAt: number;
  expiresAt: number;
  revokedAt?: number | null;
  
  use(): void;
  expire(): void;
  revoke(reason?: string): void;
  validate(): boolean;
  isExpired(): boolean;
  canUse(): boolean;
  getSession(): Promise<AuthSessionServer>;
  getRemainingUses(): number;
  
  toServerDTO(): RefreshTokenServerDTO;
  toClientDTO(): RefreshTokenClientDTO;
  toPersistenceDTO(): RefreshTokenPersistenceDTO;
  
  fromServerDTO(dto: RefreshTokenServerDTO): RefreshTokenServer;
  fromClientDTO(dto: RefreshTokenClientDTO): RefreshTokenServer;
  fromPersistenceDTO(dto: RefreshTokenPersistenceDTO): RefreshTokenServer;
}
```

### Client 接口

```typescript
export interface RefreshTokenClient {
  uuid: string;
  sessionUuid: string;
  token: string;
  status: string;
  usageCount: number;
  maxUsageCount: number;
  lastUsedAt?: number | null;
  createdAt: number;
  expiresAt: number;
  revokedAt?: number | null;
  isExpired: boolean;
  canUse: boolean;
  statusText: string;
  remainingUses: number;
  timeRemaining: string;
  
  getStatusBadge(): { text: string; color: string };
  getUsageText(): string;
  toServerDTO(): RefreshTokenServerDTO;
}
```

---

## 7. SessionHistory (实体)

### Server 接口

```typescript
export interface SessionHistoryServer {
  uuid: string;
  sessionUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
  
  getSession(): Promise<AuthSessionServer>;
  
  toServerDTO(): SessionHistoryServerDTO;
  toClientDTO(): SessionHistoryClientDTO;
  toPersistenceDTO(): SessionHistoryPersistenceDTO;
  
  fromServerDTO(dto: SessionHistoryServerDTO): SessionHistoryServer;
  fromClientDTO(dto: SessionHistoryClientDTO): SessionHistoryServer;
  fromPersistenceDTO(dto: SessionHistoryPersistenceDTO): SessionHistoryServer;
}
```

### Client 接口

```typescript
export interface SessionHistoryClient {
  uuid: string;
  sessionUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
  actionText: string;
  timeAgo: string;
  deviceInfo?: string | null;
  
  getActionIcon(): string;
  getActionColor(): string;
  getDisplayText(): string;
  toServerDTO(): SessionHistoryServerDTO;
}
```

---

## 8. AuthProvider (聚合根)

### Server 接口

```typescript
export interface AuthProviderServer {
  uuid: string;
  name: string;
  type: 'OAUTH2' | 'SAML' | 'LDAP' | 'OPENID_CONNECT';
  config: {
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl?: string | null;
    scopes: string[];
    redirectUri: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'DISABLED';
  isEnabled: boolean;
  mapping: {
    emailField: string;
    nameField: string;
    avatarField?: string | null;
    idField: string;
  };
  stats: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    lastUsedAt?: number | null;
  };
  createdAt: number;
  updatedAt: number;
  
  enable(): void;
  disable(): void;
  updateConfig(config: Partial<AuthProviderServer['config']>): void;
  updateMapping(mapping: Partial<AuthProviderServer['mapping']>): void;
  generateAuthorizationUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken?: string }>;
  getUserInfo(accessToken: string): Promise<any>;
  recordLogin(success: boolean): void;
  
  toServerDTO(): AuthProviderServerDTO;
  toClientDTO(): AuthProviderClientDTO;
  toPersistenceDTO(): AuthProviderPersistenceDTO;
  
  fromServerDTO(dto: AuthProviderServerDTO): AuthProviderServer;
  fromClientDTO(dto: AuthProviderClientDTO): AuthProviderServer;
  fromPersistenceDTO(dto: AuthProviderPersistenceDTO): AuthProviderServer;
}
```

### Client 接口

```typescript
export interface AuthProviderClient {
  uuid: string;
  name: string;
  type: string;
  status: string;
  isEnabled: boolean;
  stats: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    lastUsedAt?: number | null;
  };
  createdAt: number;
  updatedAt: number;
  displayName: string;
  icon: string;
  color: string;
  successRate: number;
  
  getDisplayName(): string;
  getIcon(): string;
  getStatusBadge(): { text: string; color: string };
  getSuccessRateText(): string;
  canUse(): boolean;
  toServerDTO(): AuthProviderServerDTO;
}
```

---

## 9. Permission (聚合根)

### Server 接口

```typescript
export interface PermissionServer {
  uuid: string;
  accountUuid: string;
  roles: RoleServer[];
  permissions: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  restrictions?: {
    maxGoals?: number | null;
    maxTasks?: number | null;
    maxSchedules?: number | null;
    canExportData: boolean;
    canShareData: boolean;
    canUseAPI: boolean;
  } | null;
  createdAt: number;
  updatedAt: number;
  
  addRole(role: RoleServer): void;
  removeRole(roleUuid: string): void;
  hasRole(roleName: string): boolean;
  addPermission(permission: string): void;
  removePermission(permission: string): void;
  hasPermission(permission: string): boolean;
  hasAnyPermission(permissions: string[]): boolean;
  hasAllPermissions(permissions: string[]): boolean;
  can(action: string, resource: string): boolean;
  canCreate(resource: string): boolean;
  canRead(resource: string): boolean;
  canUpdate(resource: string): boolean;
  canDelete(resource: string): boolean;
  checkRestriction(restriction: string): boolean;
  
  toServerDTO(): PermissionServerDTO;
  toClientDTO(): PermissionClientDTO;
  toPersistenceDTO(): PermissionPersistenceDTO;
  
  fromServerDTO(dto: PermissionServerDTO): PermissionServer;
  fromClientDTO(dto: PermissionClientDTO): PermissionServer;
  fromPersistenceDTO(dto: PermissionPersistenceDTO): PermissionServer;
}
```

### Client 接口

```typescript
export interface PermissionClient {
  uuid: string;
  accountUuid: string;
  roles: RoleClient[];
  permissions: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  restrictions?: {
    maxGoals?: number | null;
    maxTasks?: number | null;
    maxSchedules?: number | null;
    canExportData: boolean;
    canShareData: boolean;
    canUseAPI: boolean;
  } | null;
  createdAt: number;
  updatedAt: number;
  roleNames: string[];
  permissionCount: number;
  
  can(action: string, resource: string): boolean;
  canCreate(resource: string): boolean;
  canRead(resource: string): boolean;
  canUpdate(resource: string): boolean;
  canDelete(resource: string): boolean;
  getRoleBadges(): Array<{ text: string; color: string }>;
  getPermissionsList(): string[];
  toServerDTO(): PermissionServerDTO;
}
```

---

## 10. Role (实体)

### Server 接口

```typescript
export interface RoleServer {
  uuid: string;
  name: string;
  displayName: string;
  description?: string | null;
  permissions: string[];
  level: number;
  isSystemRole: boolean;
  createdAt: number;
  updatedAt: number;
  
  addPermission(permission: string): void;
  removePermission(permission: string): void;
  hasPermission(permission: string): boolean;
  
  toServerDTO(): RoleServerDTO;
  toClientDTO(): RoleClientDTO;
  toPersistenceDTO(): RolePersistenceDTO;
  
  fromServerDTO(dto: RoleServerDTO): RoleServer;
  fromClientDTO(dto: RoleClientDTO): RoleServer;
  fromPersistenceDTO(dto: RolePersistenceDTO): RoleServer;
}
```

### Client 接口

```typescript
export interface RoleClient {
  uuid: string;
  name: string;
  displayName: string;
  description?: string | null;
  permissions: string[];
  level: number;
  isSystemRole: boolean;
  createdAt: number;
  updatedAt: number;
  permissionCount: number;
  color: string;
  
  getBadge(): { text: string; color: string };
  getPermissionsList(): string[];
  toServerDTO(): RoleServerDTO;
}
```

---

## 仓储接口

### IAuthCredentialRepository ⭐️ 新增
```typescript
export interface IAuthCredentialRepository {
  save(credential: AuthCredentialServer): Promise<void>;
  findByUuid(uuid: string): Promise<AuthCredentialServer | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthCredentialServer | null>;
  
  // 密码凭证
  findPasswordCredential(accountUuid: string): Promise<PasswordCredentialServer | null>;
  
  // API Key 凭证
  findApiKeyByKey(key: string): Promise<ApiKeyCredentialServer | null>;
  findApiKeysByAccountUuid(accountUuid: string): Promise<ApiKeyCredentialServer[]>;
  revokeApiKey(uuid: string): Promise<void>;
  
  // 两步验证
  saveTwoFactorSecret(accountUuid: string, secret: string): Promise<void>;
  getTwoFactorSecret(accountUuid: string): Promise<string | null>;
}
```

### IAuthSessionRepository
```typescript
export interface IAuthSessionRepository {
  save(session: AuthSessionServer): Promise<void>;
  findByUuid(uuid: string): Promise<AuthSessionServer | null>;
  findByAccessToken(accessToken: string): Promise<AuthSessionServer | null>;
  findByRefreshToken(refreshToken: string): Promise<AuthSessionServer | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthSessionServer[]>;
  findActiveByAccountUuid(accountUuid: string): Promise<AuthSessionServer[]>;
  revokeAllByAccountUuid(accountUuid: string): Promise<void>;
  revokeByUuid(uuid: string): Promise<void>;
  cleanupExpiredSessions(): Promise<number>;
}
```

### IAuthProviderRepository
```typescript
export interface IAuthProviderRepository {
  save(provider: AuthProviderServer): Promise<void>;
  findByUuid(uuid: string): Promise<AuthProviderServer | null>;
  findByName(name: string): Promise<AuthProviderServer | null>;
  listAll(): Promise<AuthProviderServer[]>;
  listEnabled(): Promise<AuthProviderServer[]>;
}
```

### IPermissionRepository
```typescript
export interface IPermissionRepository {
  save(permission: PermissionServer): Promise<void>;
  findByAccountUuid(accountUuid: string): Promise<PermissionServer | null>;
  findRoleByName(name: string): Promise<RoleServer | null>;
  listAllRoles(): Promise<RoleServer[]>;
}
```

---

## 领域服务

### TokenService
```typescript
export interface TokenService {
  generateAccessToken(accountUuid: string, scopes: string[]): string;
  generateRefreshToken(): string;
  generateApiKey(prefix: string): string;
  validateAccessToken(token: string): { isValid: boolean; payload?: any };
  validateRefreshToken(token: string): { isValid: boolean; payload?: any };
  validateApiKey(key: string): { isValid: boolean; payload?: any };
  decodeToken(token: string): any;
}
```

### PasswordService
```typescript
export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
  validateStrength(password: string): { isStrong: boolean; score: number; feedback: string[] };
  generateSalt(): string;
}
```

### TwoFactorService
```typescript
export interface TwoFactorService {
  generateSecret(): string;
  generateQRCode(secret: string, accountEmail: string): Promise<string>;
  generateBackupCodes(count: number): string[];
  validateCode(secret: string, code: string): boolean;
  validateBackupCode(backupCodes: string[], code: string): boolean;
}
```

### BiometricService ⭐️ 新增
```typescript
export interface BiometricService {
  enrollDevice(accountUuid: string, deviceId: string, type: 'FINGERPRINT' | 'FACE_ID'): Promise<void>;
  verifyDevice(accountUuid: string, deviceId: string): Promise<boolean>;
  removeDevice(accountUuid: string, deviceId: string): Promise<void>;
  listDevices(accountUuid: string): Promise<Array<{ deviceId: string; type: string; enrolledAt: number }>>;
}
```

---

## 应用层服务

### AuthService
```typescript
export interface AuthService {
  // 登录/登出
  login(credentials: LoginCredentials): Promise<AuthSessionServer>;
  loginWithProvider(provider: string, code: string): Promise<AuthSessionServer>;
  loginWithApiKey(apiKey: string): Promise<AuthSessionServer>;
  loginWithBiometric(accountUuid: string, deviceId: string): Promise<AuthSessionServer>;
  logout(sessionUuid: string): Promise<void>;
  logoutAll(accountUuid: string): Promise<void>;
  
  // 令牌管理
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  revokeToken(sessionUuid: string): Promise<void>;
  
  // 会话管理
  getSession(sessionUuid: string): Promise<AuthSessionServer | null>;
  listSessions(accountUuid: string): Promise<AuthSessionServer[]>;
  validateSession(accessToken: string): Promise<boolean>;
  
  // 密码管理
  setPassword(accountUuid: string, password: string): Promise<void>;
  changePassword(accountUuid: string, oldPassword: string, newPassword: string): Promise<boolean>;
  resetPassword(email: string): Promise<void>;
  resetPasswordWithToken(token: string, newPassword: string): Promise<boolean>;
  validatePassword(accountUuid: string, password: string): Promise<boolean>;
  
  // API Key 管理
  createApiKey(accountUuid: string, name: string, scopes: string[], expiresAt?: number): Promise<ApiKeyCredentialServer>;
  listApiKeys(accountUuid: string): Promise<ApiKeyCredentialServer[]>;
  revokeApiKey(accountUuid: string, apiKeyUuid: string): Promise<void>;
  validateApiKey(apiKey: string): Promise<boolean>;
  
  // 两步验证
  enableTwoFactor(accountUuid: string, method: 'TOTP' | 'SMS' | 'EMAIL'): Promise<{ secret: string; qrCode: string; backupCodes: string[] }>;
  disableTwoFactor(accountUuid: string, code: string): Promise<boolean>;
  verifyTwoFactorCode(accountUuid: string, code: string): Promise<boolean>;
  regenerateBackupCodes(accountUuid: string): Promise<string[]>;
  
  // 生物识别
  enrollBiometric(accountUuid: string, deviceId: string, type: 'FINGERPRINT' | 'FACE_ID'): Promise<void>;
  removeBiometric(accountUuid: string, deviceId: string): Promise<void>;
  verifyBiometric(accountUuid: string, deviceId: string): Promise<boolean>;
  
  // 权限管理
  getPermissions(accountUuid: string): Promise<PermissionServer>;
  checkPermission(accountUuid: string, permission: string): Promise<boolean>;
  assignRole(accountUuid: string, roleName: string): Promise<void>;
  removeRole(accountUuid: string, roleName: string): Promise<void>;
}

interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
  deviceInfo?: DeviceInfo;
  rememberMe?: boolean;
}
```

---

## 总结

### V2 更新内容

#### ⭐️ 新增聚合根
- **AuthCredential**: 认证凭证管理（密码、API Key、两步验证、生物识别）

#### ⭐️ 新增实体
- **PasswordCredential**: 密码凭证（密码哈希、强度、策略）
- **ApiKeyCredential**: API Key 凭证（程序化访问）
- **CredentialHistory**: 凭证变更历史

#### ⭐️ 新增领域服务
- **BiometricService**: 生物识别管理

#### 架构优化
1. **凭证与会话分离**: AuthCredential 管理认证凭证，AuthSession 管理登录会话
2. **多因素认证**: 支持密码、API Key、两步验证、生物识别等多种认证方式
3. **细粒度权限**: 基于角色和权限的访问控制
4. **安全增强**: 密码策略、失败登录锁定、两步验证、API Key 速率限制

### 聚合根总结
- **AuthCredential**: 1 个聚合根（包含 PasswordCredential、ApiKeyCredential、CredentialHistory）
- **AuthSession**: 1 个聚合根（包含 RefreshToken、SessionHistory）
- **AuthProvider**: 1 个聚合根（OAuth 提供商）
- **Permission**: 1 个聚合根（包含 Role）

### 关键设计原则
1. **安全优先**: 密码加密、令牌管理、权限控制
2. **多因素认证**: 支持多种认证方式组合
3. **会话管理**: 多设备、多会话支持
4. **细粒度权限**: 基于角色和权限的访问控制
5. **审计追踪**: 完整的凭证和会话历史记录
