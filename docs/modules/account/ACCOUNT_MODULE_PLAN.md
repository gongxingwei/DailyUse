# Account 模块 - 核心架构规划

> **版本**: v1.1 (简化版)  
> **日期**: 2025-01-13  
> **架构参考**: Goal 模块（`docs/modules/goal/GOAL_MODULE_PLAN.md`）

---

## 🎯 核心要点

Account 模块是基础设施模块，管理用户账户和偏好设置。

### 主要聚合根

1. **Account** - 用户账户（核心）
2. **AccountPreferences** - 账户偏好设置

### 主要实体

1. **AccountProfile** - 账户资料（可作为值对象）
2. **AccountQuota** - 账户配额（可作为值对象）

---

## 📋 DTO 命名规范

```typescript
// Server DTO
AccountServerDTO;
AccountPreferencesServerDTO;

// Client DTO（注意 Client 后缀）
AccountClientDTO;
AccountPreferencesClientDTO;

// Persistence DTO
AccountPersistenceDTO;
AccountPreferencesPersistenceDTO;
```

---

## 🔄 DTO 转换方法

与 Goal 模块完全一致。

---

## 🗂️ 状态管理

```typescript
export enum AccountStatus {
  Active = 'active',
  Suspended = 'suspended',
  Deleted = 'deleted', // 逻辑删除
}
```

---

## 🔑 核心业务方法

```typescript
export class Account extends AggregateRoot {
  // 状态管理
  public activate(): void;
  public suspend(reason: string): void;
  public softDelete(): void;
  public restore(): void;

  // 偏好设置
  public updatePreferences(preferences: AccountPreferences): void;

  // 资料管理
  public updateProfile(profile: AccountProfile): void;
  public updateEmail(email: string): void;
  public updateDisplayName(displayName: string): void;

  // 配额管理
  public checkQuota(resource: string): boolean;
  public updateQuota(quota: AccountQuota): void;
}
```

---

## 📦 仓储接口

```typescript
export interface IAccountRepository {
  save(account: Account): Promise<void>;
  findByUuid(uuid: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  findAll(includeDeleted?: boolean): Promise<Account[]>;

  // 逻辑删除
  softDelete(uuid: string): Promise<void>;
  restore(uuid: string): Promise<void>;
  hardDelete(uuid: string): Promise<void>;

  // 查询
  findByStatus(status: AccountStatus): Promise<Account[]>;
}
```

---

## 💡 重构建议

1. **基于 Goal 模块架构**
2. **简化业务逻辑**（Account 相对简单）
3. **关注安全性**（密码、邮箱等敏感信息）

---

参考：`docs/modules/goal/GOAL_MODULE_PLAN.md`
