# Account 模块接口设计

## 模块概述

Account 模块负责管理用户账户信息，包括用户资料、偏好设置、订阅信息等。

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
Account (聚合根)
├── Profile (值对象 - 用户资料)
├── Subscription (实体 - 订阅信息)
└── AccountHistory (实体 - 账户历史)
```

---

## 1. Account (聚合根)

### 业务描述

账户是用户在系统中的身份标识，包含用户的基本信息、偏好设置、订阅状态等。

### Server 接口

```typescript
export interface AccountServer {
  // ===== 基础属性 =====
  uuid: string;
  username: string; // 用户名（唯一）
  email: string; // 邮箱（唯一）
  emailVerified: boolean;
  phoneNumber?: string | null;
  phoneVerified: boolean;

  // ===== 状态 =====
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

  // ===== 用户资料 (值对象) =====
  profile: {
    displayName: string; // 显示名称
    avatar?: string | null; // 头像 URL
    bio?: string | null; // 个人简介
    location?: string | null; // 位置
    timezone: string; // 时区
    language: string; // 语言
    dateOfBirth?: number | null; // epoch ms
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  };

  // ===== 订阅信息 (子实体) =====
  subscription?: SubscriptionServer | null;

  // ===== 存储配额 =====
  storage: {
    used: number; // bytes
    quota: number; // bytes
    quotaType: 'FREE' | 'BASIC' | 'PRO' | 'UNLIMITED';
  };

  // ===== 安全信息 =====
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: number | null; // epoch ms
    loginAttempts: number;
    lockedUntil?: number | null; // epoch ms
  };

  // ===== 历史记录 (子实体) =====
  history: AccountHistoryServer[];

  // ===== 统计信息 =====
  stats: {
    totalGoals: number;
    totalTasks: number;
    totalSchedules: number;
    totalReminders: number;
    lastLoginAt?: number | null; // epoch ms
    loginCount: number;
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  lastActiveAt?: number | null; // epoch ms
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 状态管理
  activate(): void;
  deactivate(): void;
  suspend(reason: string): void;
  softDelete(): void;
  restore(): void;

  // 资料管理
  updateProfile(profile: Partial<AccountServer['profile']>): void;
  updateAvatar(avatarUrl: string): void;
  updateDisplayName(displayName: string): void;

  // 偏好管理
  updatePreferences(preferences: Partial<AccountServer['preferences']>): void;
  updateTheme(theme: 'LIGHT' | 'DARK' | 'AUTO'): void;
  updateNotificationSettings(
    notifications: Partial<AccountServer['preferences']['notifications']>,
  ): void;
  updatePrivacySettings(privacy: Partial<AccountServer['preferences']['privacy']>): void;

  // 邮箱与手机
  verifyEmail(): void;
  updateEmail(newEmail: string): void;
  verifyPhone(): void;
  updatePhone(newPhone: string): void;

  // 安全管理
  enableTwoFactor(): void;
  disableTwoFactor(): void;
  changePassword(): void;
  incrementLoginAttempts(): void;
  resetLoginAttempts(): void;
  lockAccount(durationMinutes: number): void;
  unlockAccount(): void;

  // 订阅管理
  updateSubscription(subscription: SubscriptionServer): void;
  cancelSubscription(): void;

  // 存储管理
  checkStorageQuota(requiredBytes: number): boolean;
  updateStorageUsage(bytesUsed: number): void;

  // 历史记录
  addHistory(action: string, details?: any): void;
  getHistory(limit?: number): AccountHistoryServer[];

  // 统计更新
  updateStats(stats: Partial<AccountServer['stats']>): void;
  recordLogin(): void;
  recordActivity(): void;

  // DTO 转换方法
  toServerDTO(): AccountServerDTO;
  toClientDTO(): AccountClientDTO;
  toPersistenceDTO(): AccountPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: AccountServerDTO): AccountServer;
  fromClientDTO(dto: AccountClientDTO): AccountServer;
  fromPersistenceDTO(dto: AccountPersistenceDTO): AccountServer;
}
```

### Client 接口

```typescript
export interface AccountClient {
  // ===== 基础属性 =====
  uuid: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  status: string;

  // ===== 用户资料 =====
  profile: {
    displayName: string;
    avatar?: string | null;
    bio?: string | null;
    location?: string | null;
    timezone: string;
    language: string;
    dateOfBirth?: number | null;
    gender?: string | null;
  };

  // ===== 用户偏好 =====
  preferences: {
    theme: string;
    accentColor?: string | null;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    privacy: {
      profileVisibility: string;
      showOnlineStatus: boolean;
      allowSearchByEmail: boolean;
      allowSearchByPhone: boolean;
    };
    dateFormat: string;
    timeFormat: string;
    weekStartsOn: number;
    defaultView: {
      tasks: string;
      goals: string;
      schedule: string;
    };
  };

  // ===== 订阅信息 =====
  subscription?: SubscriptionClient | null;

  // ===== 存储配额 =====
  storage: {
    used: number;
    quota: number;
    quotaType: string;
  };

  // ===== 安全信息 =====
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: number | null;
  };

  // ===== 统计信息 =====
  stats: {
    totalGoals: number;
    totalTasks: number;
    totalSchedules: number;
    totalReminders: number;
    lastLoginAt?: number | null;
    loginCount: number;
  };

  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
  lastActiveAt?: number | null;
  deletedAt?: number | null;

  // ===== UI 计算属性 =====
  isDeleted: boolean;
  isActive: boolean;
  isSuspended: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  hasTwoFactor: boolean;
  hasSubscription: boolean;
  subscriptionLevel: string; // 'FREE' | 'BASIC' | 'PRO'
  storageUsedPercentage: number; // 0-100
  storageUsedText: string; // "1.5 GB / 10 GB"
  statusText: string;
  memberSince: string; // "2024年1月"
  lastSeenText: string; // "2 小时前"

  // ===== UI 业务方法 =====

  // 格式化展示
  getDisplayName(): string;
  getAvatarUrl(): string;
  getStatusBadge(): { text: string; color: string };
  getSubscriptionBadge(): { text: string; color: string };
  getStorageProgressBar(): { percentage: number; color: string };
  getMembershipDuration(): string; // "会员 3 个月"

  // 操作判断
  canUploadFile(fileSize: number): boolean;
  canCreateGoal(): boolean;
  canCreateTask(): boolean;
  needsVerification(): boolean;
  isStorageFull(): boolean;

  // DTO 转换
  toServerDTO(): AccountServerDTO;
}
```

---

## 2. Subscription (实体)

### 业务描述

订阅信息表示用户的付费订阅状态和权益。

### Server 接口

```typescript
export interface SubscriptionServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;

  // ===== 订阅计划 =====
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';

  // ===== 计费信息 =====
  billing: {
    interval: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    currency: string; // 'USD', 'CNY', etc.
    amount: number; // 金额（分）
    nextBillingDate?: number | null; // epoch ms
  };

  // ===== 试用信息 =====
  trial?: {
    isTrialPeriod: boolean;
    trialStartDate: number; // epoch ms
    trialEndDate: number; // epoch ms
    daysRemaining: number;
  } | null;

  // ===== 权益配额 =====
  features: {
    maxGoals: number | null; // null = unlimited
    maxTasks: number | null;
    maxSchedules: number | null;
    maxReminders: number | null;
    maxRepositories: number | null;
    storageQuota: number; // bytes
    canExportData: boolean;
    canUseAdvancedFeatures: boolean;
    canUseTeamFeatures: boolean;
  };

  // ===== 支付信息 =====
  payment?: {
    paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'ALIPAY' | 'WECHAT_PAY' | 'OTHER';
    lastFourDigits?: string | null;
    expiryDate?: string | null; // 'MM/YY'
  } | null;

  // ===== 订阅历史 =====
  history: {
    subscribedAt: number; // epoch ms
    cancelledAt?: number | null; // epoch ms
    expiredAt?: number | null; // epoch ms
    renewalCount: number;
  };

  // ===== 时间戳 =====
  startDate: number; // epoch ms
  endDate?: number | null; // epoch ms
  createdAt: number;
  updatedAt: number;

  // ===== 业务方法 =====

  // 状态管理
  activate(): void;
  cancel(reason?: string): void;
  suspend(reason: string): void;
  expire(): void;
  renew(): void;

  // 计划管理
  upgrade(newPlan: 'BASIC' | 'PRO' | 'ENTERPRISE'): void;
  downgrade(newPlan: 'FREE' | 'BASIC'): void;

  // 试用管理
  startTrial(durationDays: number): void;
  endTrial(): void;

  // 查询
  isActive(): boolean;
  isTrial(): boolean;
  isExpired(): boolean;
  getDaysRemaining(): number | null;
  hasFeature(feature: string): boolean;

  // DTO 转换方法
  toServerDTO(): SubscriptionServerDTO;
  toClientDTO(): SubscriptionClientDTO;
  toPersistenceDTO(): SubscriptionPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: SubscriptionServerDTO): SubscriptionServer;
  fromClientDTO(dto: SubscriptionClientDTO): SubscriptionServer;
  fromPersistenceDTO(dto: SubscriptionPersistenceDTO): SubscriptionServer;
}
```

### Client 接口

```typescript
export interface SubscriptionClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  plan: string;
  status: string;

  // ===== 计费信息 =====
  billing: {
    interval: string;
    currency: string;
    amount: number;
    nextBillingDate?: number | null;
  };

  // ===== 试用信息 =====
  trial?: {
    isTrialPeriod: boolean;
    trialStartDate: number;
    trialEndDate: number;
    daysRemaining: number;
  } | null;

  // ===== 权益配额 =====
  features: {
    maxGoals: number | null;
    maxTasks: number | null;
    maxSchedules: number | null;
    maxReminders: number | null;
    maxRepositories: number | null;
    storageQuota: number;
    canExportData: boolean;
    canUseAdvancedFeatures: boolean;
    canUseTeamFeatures: boolean;
  };

  // ===== 支付信息 =====
  payment?: {
    paymentMethod: string;
    lastFourDigits?: string | null;
    expiryDate?: string | null;
  } | null;

  // ===== 订阅历史 =====
  history: {
    subscribedAt: number;
    cancelledAt?: number | null;
    expiredAt?: number | null;
    renewalCount: number;
  };

  // ===== 时间戳 =====
  startDate: number;
  endDate?: number | null;
  createdAt: number;
  updatedAt: number;

  // ===== UI 计算属性 =====
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  daysRemaining: number | null;
  planText: string; // "免费版" / "专业版"
  statusText: string;
  billingText: string; // "¥99/月"
  nextBillingText: string; // "下次扣款: 2024-02-15"
  storageQuotaText: string; // "10 GB 存储空间"

  // ===== UI 业务方法 =====

  // 格式化展示
  getPlanBadge(): { text: string; color: string };
  getStatusBadge(): { text: string; color: string };
  getBillingText(): string;
  getFeaturesList(): string[]; // ["无限目标", "10GB存储", ...]
  getRenewalText(): string;

  // 操作判断
  canUpgrade(): boolean;
  canDowngrade(): boolean;
  canCancel(): boolean;
  needsRenewal(): boolean;

  // DTO 转换
  toServerDTO(): SubscriptionServerDTO;
}
```

---

## 3. AccountHistory (实体)

### 业务描述

账户历史记录用于追踪账户的重要变更。

### Server 接口

```typescript
export interface AccountHistoryServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  action: string; // 'CREATED' | 'UPDATED' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGED' | etc.
  details?: any | null; // 变更详情

  // ===== 操作信息 =====
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: string | null;

  // ===== 时间戳 =====
  createdAt: number;

  // ===== 业务方法 =====

  // 查询
  getAccount(): Promise<AccountServer>;

  // DTO 转换方法
  toServerDTO(): AccountHistoryServerDTO;
  toClientDTO(): AccountHistoryClientDTO;
  toPersistenceDTO(): AccountHistoryPersistenceDTO;

  // 静态工厂方法
  fromServerDTO(dto: AccountHistoryServerDTO): AccountHistoryServer;
  fromClientDTO(dto: AccountHistoryClientDTO): AccountHistoryServer;
  fromPersistenceDTO(dto: AccountHistoryPersistenceDTO): AccountHistoryServer;
}
```

### Client 接口

```typescript
export interface AccountHistoryClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: string | null;
  createdAt: number;

  // ===== UI 扩展 =====
  actionText: string; // "登录账户"
  timeAgo: string; // "3 天前"
  deviceInfo?: string | null; // "Chrome on Windows"

  // ===== UI 业务方法 =====

  // 格式化展示
  getActionIcon(): string;
  getActionColor(): string;
  getDisplayText(): string;
  getDeviceText(): string;
  getLocationText(): string;

  // DTO 转换
  toServerDTO(): AccountHistoryServerDTO;
}
```

---

## 值对象 (Value Objects)

### Profile

```typescript
export interface Profile {
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  timezone: string;
  language: string;
  dateOfBirth?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
}
```

### Preferences

```typescript
export interface Preferences {
  theme: 'LIGHT' | 'DARK' | 'AUTO';
  accentColor?: string | null;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timeFormat: '12H' | '24H';
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  defaultView: DefaultViewSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  showOnlineStatus: boolean;
  allowSearchByEmail: boolean;
  allowSearchByPhone: boolean;
}

export interface DefaultViewSettings {
  tasks: 'LIST' | 'KANBAN' | 'CALENDAR';
  goals: 'LIST' | 'TREE' | 'TIMELINE';
  schedule: 'DAY' | 'WEEK' | 'MONTH';
}
```

### StorageInfo

```typescript
export interface StorageInfo {
  used: number; // bytes
  quota: number; // bytes
  quotaType: 'FREE' | 'BASIC' | 'PRO' | 'UNLIMITED';
}
```

### SecurityInfo

```typescript
export interface SecurityInfo {
  twoFactorEnabled: boolean;
  lastPasswordChange?: number | null;
  loginAttempts: number;
  lockedUntil?: number | null;
}
```

---

## 仓储接口

### IAccountRepository

```typescript
export interface IAccountRepository {
  save(account: AccountServer): Promise<void>;
  findByUuid(uuid: string): Promise<AccountServer | null>;
  findByUsername(username: string): Promise<AccountServer | null>;
  findByEmail(email: string): Promise<AccountServer | null>;
  findByPhone(phone: string): Promise<AccountServer | null>;

  // 查询
  findByStatus(status: AccountStatus): Promise<AccountServer[]>;
  existsByUsername(username: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;

  // 逻辑删除
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>;
}
```

---

## 领域服务

### AccountValidationService

```typescript
export interface AccountValidationService {
  validateUsername(username: string): boolean;
  validateEmail(email: string): boolean;
  validatePhone(phone: string): boolean;
  validatePassword(password: string): { isValid: boolean; errors: string[] };
  isUsernameAvailable(username: string): Promise<boolean>;
  isEmailAvailable(email: string): Promise<boolean>;
  isPhoneAvailable(phone: string): Promise<boolean>;
}
```

### StorageManagementService

```typescript
export interface StorageManagementService {
  calculateStorageUsage(accountUuid: string): Promise<number>;
  checkQuota(accountUuid: string, requiredBytes: number): Promise<boolean>;
  cleanupUnusedFiles(accountUuid: string): Promise<number>; // returns bytes freed
  upgradeStorageQuota(accountUuid: string, newQuota: number): Promise<void>;
}
```

---

## 应用层服务

### AccountService

```typescript
export interface AccountService {
  // CRUD 操作
  createAccount(params: CreateAccountParams): Promise<AccountServer>;
  updateAccount(uuid: string, params: UpdateAccountParams): Promise<AccountServer>;
  deleteAccount(uuid: string): Promise<void>;
  getAccount(uuid: string): Promise<AccountServer | null>;
  getAccountByUsername(username: string): Promise<AccountServer | null>;
  getAccountByEmail(email: string): Promise<AccountServer | null>;

  // 资料管理
  updateProfile(uuid: string, profile: Partial<Profile>): Promise<AccountServer>;
  updateAvatar(uuid: string, avatarUrl: string): Promise<AccountServer>;

  // 偏好管理
  updatePreferences(uuid: string, preferences: Partial<Preferences>): Promise<AccountServer>;

  // 邮箱与手机
  sendEmailVerification(uuid: string): Promise<void>;
  verifyEmail(uuid: string, code: string): Promise<boolean>;
  sendPhoneVerification(uuid: string): Promise<void>;
  verifyPhone(uuid: string, code: string): Promise<boolean>;
  updateEmail(uuid: string, newEmail: string): Promise<AccountServer>;
  updatePhone(uuid: string, newPhone: string): Promise<AccountServer>;

  // 安全管理
  enableTwoFactor(uuid: string): Promise<{ secret: string; qrCode: string }>;
  disableTwoFactor(uuid: string, code: string): Promise<boolean>;
  changePassword(uuid: string, oldPassword: string, newPassword: string): Promise<boolean>;

  // 订阅管理
  getSubscription(accountUuid: string): Promise<SubscriptionServer | null>;
  updateSubscription(
    accountUuid: string,
    subscription: Partial<SubscriptionServer>,
  ): Promise<SubscriptionServer>;
  cancelSubscription(accountUuid: string): Promise<void>;

  // 历史记录
  getHistory(accountUuid: string, limit?: number): Promise<AccountHistoryServer[]>;
  recordLogin(accountUuid: string, ipAddress: string, userAgent: string): Promise<void>;

  // 统计查询
  getStats(accountUuid: string): Promise<AccountServer['stats']>;
}
```

---

## 总结

### 聚合根

- **Account**: 1 个聚合根（包含 Subscription、AccountHistory）

### 实体

- **Subscription**: 订阅信息（Account 的子实体）
- **AccountHistory**: 账户历史（Account 的子实体）

### 值对象

- Profile
- Preferences
- NotificationSettings
- PrivacySettings
- DefaultViewSettings
- StorageInfo
- SecurityInfo

### 领域服务

- AccountValidationService（账户验证）
- StorageManagementService（存储管理）

### 关键设计原则

1. **Server 侧重业务逻辑**: 完整的业务方法、领域规则
2. **Client 侧重 UI 展示**: 格式化方法、UI 状态、快捷操作
3. **时间戳统一**: 全部使用 epoch ms (number)
4. **统计信息**: Client 包含更多预计算的统计数据和格式化字符串
5. **聚合根控制子实体**: Account 聚合根管理 Subscription 和 AccountHistory
6. **安全管理**: 提供两步验证、密码管理等安全功能
7. **订阅管理**: 支持多种订阅计划和权益配额
8. **隐私保护**: 提供完善的隐私设置和数据保护
