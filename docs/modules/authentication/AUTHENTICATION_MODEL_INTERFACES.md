# Authentication 模块接口设计

## 模块概述

Authentication 模块负责管理用户认证和授权，包括登录、登出、会话管理、令牌管理、权限控制等。

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
AuthSession (聚合根)
├── RefreshToken (实体 - 刷新令牌)
└── SessionHistory (实体 - 会话历史)

AuthProvider (聚合根 - 第三方登录)
└── (OAuth 提供商配置)

Permission (聚合根)
└── Role (实体 - 角色权限)
```

---

## 1. AuthSession (聚合根)

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
    os?: string | null; // 'Windows', 'macOS', 'iOS', 'Android', etc.
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
  authMethod: 'PASSWORD' | 'OAUTH' | 'TWO_FACTOR' | 'MAGIC_LINK' | 'BIOMETRIC';
  authProvider?: string | null; // 'Google', 'GitHub', 'Apple', etc.

  // ===== 权限范围 =====
  scopes: string[]; // ['read', 'write', 'admin', etc.]

  // ===== 会话历史 (子实体) =====
  history: SessionHistoryServer[];

  // ===== 安全信息 =====
  security: {
    isTrusted: boolean; // 是否为受信任设备
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
  getRemainingTime(): number; // 剩余时间（分钟）

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

  // ===== 刷新令牌 =====
  refreshToken: RefreshTokenClient;

  // ===== 设备信息 =====
  device: {
    type: string;
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
  } | null;

  // ===== 认证方式 =====
  authMethod: string;
  authProvider?: string | null;

  // ===== 权限范围 =====
  scopes: string[];

  // ===== 安全信息 =====
  security: {
    isTrusted: boolean;
    lastActivityAt: number;
    securityLevel: string;
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  lastActivityAt: number;

  // ===== UI 计算属性 =====
  isExpired: boolean;
  isActive: boolean;
  isCurrent: boolean; // 是否为当前会话
  statusText: string;
  deviceText: string; // "Chrome on Windows"
  locationText: string; // "北京, 中国"
  authMethodText: string; // "密码登录"
  timeRemaining: string; // "2 小时后过期"
  lastActivityText: string; // "3 分钟前活跃"
  securityLevelText: string;

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getDeviceIcon(): string;
  getSecurityBadge(): { text: string; color: string };
  getAuthMethodIcon(): string;

  // 操作判断
  canRefresh(): boolean;
  canRevoke(): boolean;
  needsRenewal(): boolean;

  // DTO 转换
  toServerDTO(): AuthSessionServerDTO;
}
```

---

## 2. RefreshToken (实体)

### 业务描述

刷新令牌用于获取新的访问令牌，生命周期较长。

### Server 接口

```typescript
export interface RefreshTokenServer {
  // ===== 基础属性 =====
  uuid: string;
  sessionUuid: string;
  token: string;

  // ===== 状态 =====
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

  // ===== 使用信息 =====
  usageCount: number;
  maxUsageCount: number; // 最大使用次数
  lastUsedAt?: number | null; // epoch ms

  // ===== 时间戳 =====
  createdAt: number;
  expiresAt: number; // epoch ms
  revokedAt?: number | null; // epoch ms

  // ===== 业务方法 =====

  // 状态管理
  use(): void;
  expire(): void;
  revoke(reason?: string): void;

  // 验证
  validate(): boolean;
  isExpired(): boolean;
  canUse(): boolean;

  // 查询
  getSession(): Promise<AuthSessionServer>;
  getRemainingUses(): number;

  // DTO 转换方法
  toServerDTO(): RefreshTokenServerDTO;
  toClientDTO(): RefreshTokenClientDTO;
  toPersistenceDTO(): RefreshTokenPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: RefreshTokenServerDTO): RefreshTokenServer;
  fromClientDTO(dto: RefreshTokenClientDTO): RefreshTokenServer;
  fromPersistenceDTO(dto: RefreshTokenPersistenceDTO): RefreshTokenServer;
}
```

### Client 接口

```typescript
export interface RefreshTokenClient {
  // ===== 基础属性 =====
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

  // ===== UI 计算属性 =====
  isExpired: boolean;
  canUse: boolean;
  statusText: string;
  remainingUses: number;
  timeRemaining: string;

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getUsageText(): string; // "已使用 3/10 次"

  // DTO 转换
  toServerDTO(): RefreshTokenServerDTO;
}
```

---

## 3. SessionHistory (实体)

### 业务描述

会话历史记录用于追踪会话的活动。

### Server 接口

```typescript
export interface SessionHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  sessionUuid: string;
  action: string; // 'LOGIN' | 'LOGOUT' | 'REFRESH' | 'REVOKE' | 'ACTIVITY' | etc.
  details?: any | null;

  // ===== 操作信息 =====
  ipAddress?: string | null;
  userAgent?: string | null;

  // ===== 时间戳 =====
  createdAt: number;

  // ===== 业务方法 =====

  // 查询
  getSession(): Promise<AuthSessionServer>;

  // DTO 转换方法
  toServerDTO(): SessionHistoryServerDTO;
  toClientDTO(): SessionHistoryClientDTO;
  toPersistenceDTO(): SessionHistoryPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: SessionHistoryServerDTO): SessionHistoryServer;
  fromClientDTO(dto: SessionHistoryClientDTO): SessionHistoryServer;
  fromPersistenceDTO(dto: SessionHistoryPersistenceDTO): SessionHistoryServer;
}
```

### Client 接口

```typescript
export interface SessionHistoryClient {
  // ===== 基础属性 =====
  uuid: string;
  sessionUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;

  // ===== UI 扩展 =====
  actionText: string;
  timeAgo: string;
  deviceInfo?: string | null;

  // ===== UI 业务方法 =====

  // 格式化展示
  getActionIcon(): string;
  getActionColor(): string;
  getDisplayText(): string;

  // DTO 转换
  toServerDTO(): SessionHistoryServerDTO;
}
```

---

## 4. AuthProvider (聚合根)

### 业务描述

认证提供商表示第三方OAuth登录配置。

### Server 接口

```typescript
export interface AuthProviderServer {
  // ===== 基础属性 =====
  uuid: string;
  name: string; // 'Google', 'GitHub', 'Apple', etc.
  type: 'OAUTH2' | 'SAML' | 'LDAP' | 'OPENID_CONNECT';

  // ===== 配置信息 =====
  config: {
    clientId: string;
    clientSecret: string; // 加密存储
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl?: string | null;
    scopes: string[];
    redirectUri: string;
  };

  // ===== 状态 =====
  status: 'ACTIVE' | 'INACTIVE' | 'DISABLED';
  isEnabled: boolean;

  // ===== 映射配置 =====
  mapping: {
    emailField: string; // 'email'
    nameField: string; // 'name'
    avatarField?: string | null; // 'picture'
    idField: string; // 'sub' or 'id'
  };

  // ===== 统计信息 =====
  stats: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    lastUsedAt?: number | null; // epoch ms
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 状态管理
  enable(): void;
  disable(): void;

  // 配置管理
  updateConfig(config: Partial<AuthProviderServer['config']>): void;
  updateMapping(mapping: Partial<AuthProviderServer['mapping']>): void;

  // OAuth 流程
  generateAuthorizationUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken?: string }>;
  getUserInfo(accessToken: string): Promise<any>;

  // 统计更新
  recordLogin(success: boolean): void;

  // DTO 转换方法
  toServerDTO(): AuthProviderServerDTO;
  toClientDTO(): AuthProviderClientDTO;
  toPersistenceDTO(): AuthProviderPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: AuthProviderServerDTO): AuthProviderServer;
  fromClientDTO(dto: AuthProviderClientDTO): AuthProviderServer;
  fromPersistenceDTO(dto: AuthProviderPersistenceDTO): AuthProviderServer;
}
```

### Client 接口

```typescript
export interface AuthProviderClient {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  type: string;
  status: string;
  isEnabled: boolean;

  // ===== 统计信息 =====
  stats: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    lastUsedAt?: number | null;
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== UI 计算属性 =====
  displayName: string;
  icon: string;
  color: string;
  successRate: number; // 0-100

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayName(): string;
  getIcon(): string;
  getStatusBadge(): { text: string; color: string };
  getSuccessRateText(): string;

  // 操作判断
  canUse(): boolean;

  // DTO 转换
  toServerDTO(): AuthProviderServerDTO;
}
```

---

## 5. Permission (聚合根)

### 业务描述

权限管理系统，定义用户的访问权限。

### Server 接口

```typescript
export interface PermissionServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;

  // ===== 角色 =====
  roles: RoleServer[]; // 用户拥有的角色

  // ===== 权限列表 =====
  permissions: string[]; // ['goal:read', 'goal:write', 'task:delete', etc.]

  // ===== 特殊权限 =====
  isAdmin: boolean;
  isSuperAdmin: boolean;

  // ===== 权限限制 =====
  restrictions?: {
    maxGoals?: number | null;
    maxTasks?: number | null;
    maxSchedules?: number | null;
    canExportData: boolean;
    canShareData: boolean;
    canUseAPI: boolean;
  } | null;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 角色管理
  addRole(role: RoleServer): void;
  removeRole(roleUuid: string): void;
  hasRole(roleName: string): boolean;

  // 权限管理
  addPermission(permission: string): void;
  removePermission(permission: string): void;
  hasPermission(permission: string): boolean;
  hasAnyPermission(permissions: string[]): boolean;
  hasAllPermissions(permissions: string[]): boolean;

  // 权限检查
  can(action: string, resource: string): boolean; // can('read', 'goal')
  canCreate(resource: string): boolean;
  canRead(resource: string): boolean;
  canUpdate(resource: string): boolean;
  canDelete(resource: string): boolean;

  // 限制检查
  checkRestriction(restriction: string): boolean;

  // DTO 转换方法
  toServerDTO(): PermissionServerDTO;
  toClientDTO(): PermissionClientDTO;
  toPersistenceDTO(): PermissionPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: PermissionServerDTO): PermissionServer;
  fromClientDTO(dto: PermissionClientDTO): PermissionServer;
  fromPersistenceDTO(dto: PermissionPersistenceDTO): PermissionServer;
}
```

### Client 接口

```typescript
export interface PermissionClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  roles: RoleClient[];
  permissions: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;

  // ===== 权限限制 =====
  restrictions?: {
    maxGoals?: number | null;
    maxTasks?: number | null;
    maxSchedules?: number | null;
    canExportData: boolean;
    canShareData: boolean;
    canUseAPI: boolean;
  } | null;

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== UI 计算属性 =====
  roleNames: string[];
  permissionCount: number;

  // ===== UI 业务方法 =====

  // 权限检查
  can(action: string, resource: string): boolean;
  canCreate(resource: string): boolean;
  canRead(resource: string): boolean;
  canUpdate(resource: string): boolean;
  canDelete(resource: string): boolean;

  // 格式化展示
  getRoleBadges(): Array<{ text: string; color: string }>;
  getPermissionsList(): string[];

  // DTO 转换
  toServerDTO(): PermissionServerDTO;
}
```

---

## 6. Role (实体)

### 业务描述

角色定义一组权限的集合。

### Server 接口

```typescript
export interface RoleServer {
  // ===== 基础属性 =====
  uuid: string;
  name: string; // 'user', 'admin', 'editor', etc.
  displayName: string;
  description?: string | null;

  // ===== 权限 =====
  permissions: string[];

  // ===== 层级 =====
  level: number; // 权限级别，数字越大权限越高
  isSystemRole: boolean; // 是否为系统预设角色

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 权限管理
  addPermission(permission: string): void;
  removePermission(permission: string): void;
  hasPermission(permission: string): boolean;

  // DTO 转换方法
  toServerDTO(): RoleServerDTO;
  toClientDTO(): RoleClientDTO;
  toPersistenceDTO(): RolePersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: RoleServerDTO): RoleServer;
  fromClientDTO(dto: RoleClientDTO): RoleServer;
  fromPersistenceDTO(dto: RolePersistenceDTO): RoleServer;
}
```

### Client 接口

```typescript
export interface RoleClient {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  displayName: string;
  description?: string | null;
  permissions: string[];
  level: number;
  isSystemRole: boolean;
  createdAt: number;
  updatedAt: number;

  // ===== UI 计算属性 =====
  permissionCount: number;
  color: string;

  // ===== UI 业务方法 =====

  // 格式化展示
  getBadge(): { text: string; color: string };
  getPermissionsList(): string[];

  // DTO 转换
  toServerDTO(): RoleServerDTO;
}
```

---

## 值对象 (Value Objects)

### DeviceInfo

```typescript
export interface DeviceInfo {
  type: 'WEB' | 'MOBILE' | 'DESKTOP' | 'TABLET' | 'OTHER';
  os?: string | null;
  browser?: string | null;
  deviceName?: string | null;
  deviceId?: string | null;
}
```

### LocationInfo

```typescript
export interface LocationInfo {
  ipAddress: string;
  country?: string | null;
  city?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
}
```

### SecurityInfo

```typescript
export interface SecurityInfo {
  isTrusted: boolean;
  lastActivityAt: number;
  suspiciousActivityCount: number;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

---

## 仓储接口

### IAuthSessionRepository

```typescript
export interface IAuthSessionRepository {
  save(session: AuthSessionServer): Promise<void>;
  findByUuid(uuid: string): Promise<AuthSessionServer | null>;
  findByAccessToken(accessToken: string): Promise<AuthSessionServer | null>;
  findByRefreshToken(refreshToken: string): Promise<AuthSessionServer | null>;
  findByAccountUuid(accountUuid: string): Promise<AuthSessionServer[]>;
  findActiveByAccountUuid(accountUuid: string): Promise<AuthSessionServer[]>;

  // 清理
  revokeAllByAccountUuid(accountUuid: string): Promise<void>;
  revokeByUuid(uuid: string): Promise<void>;
  cleanupExpiredSessions(): Promise<number>; // returns count of cleaned sessions
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
  validateAccessToken(token: string): { isValid: boolean; payload?: any };
  validateRefreshToken(token: string): { isValid: boolean; payload?: any };
  decodeToken(token: string): any;
}
```

### PasswordService

```typescript
export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
  validateStrength(password: string): { isStrong: boolean; score: number; feedback: string[] };
}
```

### TwoFactorService

```typescript
export interface TwoFactorService {
  generateSecret(): string;
  generateQRCode(secret: string, accountEmail: string): Promise<string>;
  validateCode(secret: string, code: string): boolean;
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
  logout(sessionUuid: string): Promise<void>;
  logoutAll(accountUuid: string): Promise<void>;

  // 令牌管理
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  revokeToken(sessionUuid: string): Promise<void>;

  // 会话管理
  getSession(sessionUuid: string): Promise<AuthSessionServer | null>;
  listSessions(accountUuid: string): Promise<AuthSessionServer[]>;
  validateSession(accessToken: string): Promise<boolean>;

  // 两步验证
  enableTwoFactor(accountUuid: string): Promise<{ secret: string; qrCode: string }>;
  disableTwoFactor(accountUuid: string, code: string): Promise<boolean>;
  verifyTwoFactorCode(accountUuid: string, code: string): Promise<boolean>;

  // 密码管理
  changePassword(accountUuid: string, oldPassword: string, newPassword: string): Promise<boolean>;
  resetPassword(email: string): Promise<void>;
  resetPasswordWithToken(token: string, newPassword: string): Promise<boolean>;

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

### 聚合根

- **AuthSession**: 1 个聚合根（包含 RefreshToken、SessionHistory）
- **AuthProvider**: 1 个聚合根（OAuth 提供商）
- **Permission**: 1 个聚合根（包含 Role）

### 实体

- **RefreshToken**: 刷新令牌（AuthSession 的子实体）
- **SessionHistory**: 会话历史（AuthSession 的子实体）
- **Role**: 角色（Permission 的子实体）

### 值对象

- DeviceInfo
- LocationInfo
- SecurityInfo

### 领域服务

- TokenService（令牌管理）
- PasswordService（密码管理）
- TwoFactorService（两步验证）

### 关键设计原则

1. **Server 侧重业务逻辑**: 完整的业务方法、领域规则
2. **Client 侧重 UI 展示**: 格式化方法、UI 状态、快捷操作
3. **时间戳统一**: 全部使用 epoch ms (number)
4. **安全优先**: 令牌加密、会话管理、权限控制
5. **多设备支持**: 设备识别、会话隔离
6. **OAuth 集成**: 支持第三方登录
7. **细粒度权限**: 基于角色和权限的访问控制
8. **两步验证**: 增强安全性
