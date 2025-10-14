# Account 和 Authentication 模块 Domain-Client 实现总结

## 概述

本文档记录了 Account 和 Authentication 模块在 `domain-client` 层的完整实现。

## 实现日期

2025-01-XX

---

## Account 模块

### 模块结构

```
packages/domain-client/src/account/
├── aggregates/
│   ├── AccountClient.ts          # 账户聚合根
│   └── index.ts
├── entities/
│   ├── SubscriptionClient.ts     # 订阅实体
│   ├── AccountHistoryClient.ts   # 账户历史实体
│   └── index.ts
└── index.ts
```

### 聚合根：AccountClient

**文件**: `aggregates/AccountClient.ts` (~520 行)

**核心属性**:
- 账户基本信息: username, email, phoneNumber, status
- 个人资料: displayName, avatar, bio, location, timezone, language, dateOfBirth, gender
- 偏好设置: theme, notifications, privacy
- 订阅信息: subscription (SubscriptionClient)
- 存储配额: used, quota, quotaType
- 安全设置: twoFactorEnabled, loginAttempts, lockedUntil
- 历史记录: history (AccountHistoryClient[])
- 统计信息: totalGoals, totalTasks, lastLoginAt, loginCount

**UI 计算属性**:
- `displayName`: 显示名称
- `statusText`: "活跃" | "未激活" | "已暂停" | "已删除"
- `genderText`: "男" | "女" | "其他" | "未设置"
- `themeText`: "浅色" | "深色" | "跟随系统"
- `privacyText`: "公开" | "私密" | "仅好友"
- `isActive`, `isDeleted`, `isSuspended`, `isLocked`: 状态判断
- `storageUsagePercent`: 存储使用百分比
- `storageUsageText`: "100 MB / 5 GB"
- `lastLoginText`: 相对时间显示
- `subscriptionPlanText`: 订阅计划显示

**UI 方法**:
- `getStatusBadge()`: 获取状态徽章
- `getVerificationBadge()`: 获取邮箱/手机验证徽章
- `getStorageBadge()`: 获取存储使用徽章
- `getAvatarUrl()`: 获取头像URL（带默认值）

**权限检查**:
- `canEditProfile()`, `canChangeEmail()`, `canChangePassword()`, `canDeleteAccount()`, `canUpgradeSubscription()`
- `needsEmailVerification()`, `needsPhoneVerification()`

### 实体：SubscriptionClient

**文件**: `entities/SubscriptionClient.ts` (~280 行)

**核心属性**:
- plan: FREE | BASIC | PRO | ENTERPRISE
- status: ACTIVE | CANCELLED | EXPIRED | SUSPENDED
- billingCycle: MONTHLY | YEARLY | LIFETIME
- startDate, endDate, renewalDate, autoRenew
- paymentMethod, amount, currency

**UI 计算属性**:
- `planText`: "免费版" | "基础版" | "专业版" | "企业版"
- `statusText`, `billingCycleText`
- `isActive`, `isExpired`, `isCancelled`, `isFree`, `isPaid`
- `priceText`: "免费" | "CNY 99.00"
- `daysRemaining`: 剩余天数
- `daysRemainingText`: "剩余 30 天"

**UI 方法**:
- `getStatusBadge()`, `getPlanBadge()`

**权限检查**:
- `canRenew()`, `canCancel()`, `canUpgrade()`, `canDowngrade()`

### 实体：AccountHistoryClient

**文件**: `entities/AccountHistoryClient.ts` (~170 行)

**核心属性**:
- action: 操作类型（如 'account.created', 'profile.updated'）
- details, ipAddress, userAgent
- createdAt

**UI 计算属性**:
- `actionText`: 操作的中文显示
- `createdAtText`: 相对时间显示
- `ipAddressText`, `hasDetails`

**UI 方法**:
- `getActionIcon()`: 根据操作类型返回图标
- `getActionColor()`: 根据操作类型返回颜色

---

## Authentication 模块

### 模块结构

```
packages/domain-client/src/authentication/
├── aggregates/
│   ├── AuthCredentialClient.ts     # 认证凭证聚合根
│   ├── AuthSessionClient.ts        # 会话聚合根
│   └── index.ts
├── entities/
│   ├── PasswordCredentialClient.ts
│   ├── ApiKeyCredentialClient.ts
│   ├── RememberMeTokenClient.ts
│   ├── RefreshTokenClient.ts
│   ├── CredentialHistoryClient.ts
│   ├── SessionHistoryClient.ts
│   └── index.ts
├── value-objects/
│   ├── DeviceInfoClient.ts         # 设备信息值对象
│   └── index.ts
└── index.ts
```

### 聚合根：AuthCredentialClient

**文件**: `aggregates/AuthCredentialClient.ts` (~220 行)

**核心属性**:
- type: PASSWORD | API_KEY | BIOMETRIC | MAGIC_LINK | HARDWARE_KEY
- passwordCredential: PasswordCredentialClient
- apiKeyCredentials: ApiKeyCredentialClient[]
- rememberMeTokens: RememberMeTokenClient[]
- twoFactor: { enabled, method, verifiedAt }
- biometric: { enabled, type, deviceId, enrolledAt }
- status: ACTIVE | SUSPENDED | EXPIRED | REVOKED
- security: failedLoginAttempts, lockedUntil, lastPasswordChangeAt

**UI 计算属性**:
- `statusText`: 凭证状态显示
- `isActive`, `isLocked`, `hasTwoFactor`, `hasBiometric`
- `hasActiveApiKeys`, `activeApiKeysCount`
- `twoFactorMethodText`: "TOTP" | "短信" | "邮箱" | "认证器应用"

**UI 方法**:
- `getStatusBadge()`: 凭证状态徽章
- `getSecurityBadge()`: 安全评分徽章（根据密码、两步验证、生物识别计算）

**权限检查**:
- `canChangePassword()`, `canEnableTwoFactor()`, `canDisableTwoFactor()`, `canCreateApiKey()`

### 聚合根：AuthSessionClient

**文件**: `aggregates/AuthSessionClient.ts` (~200 行)

**核心属性**:
- accessToken, accessTokenExpiresAt
- refreshToken: RefreshTokenClient
- device: DeviceInfoClient
- status: ACTIVE | EXPIRED | REVOKED | LOCKED
- ipAddress, location: { country, region, city, timezone }
- lastActivityAt, lastActivityType
- history: SessionHistoryClient[]

**UI 计算属性**:
- `statusText`: 会话状态显示
- `isActive`, `isExpired`, `isRevoked`, `isLocked`
- `locationText`: "中国, 北京, 北京"
- `lastActivityText`: 相对时间显示
- `expiresInText`: "3 小时后过期"
- `sessionAgeDays`: 会话存在天数
- `isCurrentDevice`: 是否为当前设备

**UI 方法**:
- `getStatusBadge()`: 会话状态徽章
- `getDeviceBadge()`: 设备徽章

**权限检查**:
- `canRevoke()`: 是否可撤销
- `canRefresh()`: 是否可刷新

### 值对象：DeviceInfoClient

**文件**: `value-objects/DeviceInfoClient.ts` (~200 行)

**核心属性**:
- deviceId, deviceFingerprint
- deviceType: BROWSER | DESKTOP | MOBILE | TABLET | API | UNKNOWN
- deviceName, os, browser
- ipAddress, location
- firstSeenAt, lastSeenAt

**UI 计算属性**:
- `deviceTypeText`: "浏览器" | "桌面应用" | "移动设备"
- `displayName`: 设备显示名称
- `osText`, `browserText`, `locationText`, `ipAddressText`
- `lastSeenText`: 相对时间显示
- `isMobile`, `isDesktop`

**UI 方法**:
- `getDeviceIcon()`: 设备类型图标

### 实体实现

#### PasswordCredentialClient (~60 行)
- algorithm: BCRYPT | ARGON2 | SCRYPT
- `algorithmText`: 算法显示名称

#### ApiKeyCredentialClient (~90 行)
- name, keyPrefix, status, lastUsedAt, expiresAt
- `statusText`, `isActive`, `isExpired`
- `lastUsedText`: 相对时间显示

#### RememberMeTokenClient (~90 行)
- tokenSeries, device, status, usageCount
- `statusText`, `isActive`, `isExpired`

#### RefreshTokenClient (~50 行)
- token, expiresAt, usedAt
- `isExpired`, `isUsed`

#### CredentialHistoryClient (~60 行)
- action, details, ipAddress, userAgent
- `actionText`: 操作的中文显示

#### SessionHistoryClient (~60 行)
- action, details, ipAddress, userAgent
- `actionText`: 操作的中文显示

---

## 设计模式与最佳实践

### 1. DDD 分层架构
- **值对象**: DeviceInfo（设备信息）
- **实体**: Subscription, AccountHistory, PasswordCredential, ApiKeyCredential 等
- **聚合根**: Account, AuthCredential, AuthSession

### 2. 命名空间导入模式
```typescript
import { AccountContracts as AC } from '@dailyuse/contracts';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';
```

### 3. Client 简化原则
- 专注于 UI 展示需求
- 移除复杂的业务逻辑（由 domain-server 处理）
- 提供丰富的计算属性和便捷方法

### 4. 完整的 DTO 转换
- `toClientDTO()`: 实体 → DTO
- `fromClientDTO()`: DTO → 实体
- 正确处理嵌套对象的转换

### 5. 时间格式化
```typescript
get lastLoginText(): string {
  const diff = Date.now() - this.stats.lastLoginAt;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟前`;
  // ...
}
```

### 6. 徽章配置模式
```typescript
getStatusBadge(): { text: string; variant: string; icon: string } {
  if (this.isActive) {
    return { text: '活跃', variant: 'success', icon: 'check-circle' };
  }
  // ...
}
```

### 7. 权限检查方法
```typescript
canEditProfile(): boolean {
  return this.isActive && !this.isLocked;
}
```

---

## 类型安全

所有实现都严格遵循 TypeScript 类型系统:
1. **继承关系**: Entity, AggregateRoot, ValueObject 基类
2. **完整类型定义**: 所有属性都有明确的类型
3. **DTO 类型**: 使用 `@dailyuse/contracts` 中定义的类型
4. **枚举处理**: 正确的类型断言 `as CredentialType`
5. **编译通过**: 所有代码通过 `tsc --noEmit` 检查

---

## 统计信息

### Account 模块
- **文件数**: 6 个 TypeScript 文件
- **代码量**: ~970 行
- **聚合根**: 1 个（AccountClient）
- **实体**: 2 个（SubscriptionClient, AccountHistoryClient）

### Authentication 模块
- **文件数**: 11 个 TypeScript 文件
- **代码量**: ~1030 行
- **聚合根**: 2 个（AuthCredentialClient, AuthSessionClient）
- **实体**: 6 个
- **值对象**: 1 个（DeviceInfoClient）

### 总计
- **文件数**: 17 个 TypeScript 文件
- **代码量**: ~2000 行
- **聚合根**: 3 个
- **实体**: 8 个
- **值对象**: 1 个

---

## 导出结构

```typescript
// packages/domain-client/src/index.ts
export * as AccountDomain from './account';
export * as AuthenticationDomain from './authentication';

// 使用示例
import { AccountDomain, AuthenticationDomain } from '@dailyuse/domain-client';

const account = new AccountDomain.AccountClient(data);
const credential = new AuthenticationDomain.AuthCredentialClient(data);
const session = new AuthenticationDomain.AuthSessionClient(data);
```

---

## 变更记录

### 2025-01-XX - 初始实现
- ✅ 实现 Account 模块（1 个聚合根 + 2 个实体）
- ✅ 实现 Authentication 模块（2 个聚合根 + 6 个实体 + 1 个值对象）
- ✅ 完整的 DTO 转换支持
- ✅ 丰富的 UI 计算属性
- ✅ 通过 TypeScript 编译检查

---

## 参考文档

- `remodules.prompt.md`: 模块实现规范
- `@dailyuse/contracts`: Account 和 Authentication 相关的 DTO 定义
- `@dailyuse/utils`: 基础工具类和领域基类
- `packages/domain-client/src/reminder/`: Reminder 模块参考实现
