# Authentication 模块 - 核心架构规划

> **版本**: v1.1 (简化版)  
> **日期**: 2025-01-13  
> **架构参考**: Goal 模块（`docs/modules/goal/GOAL_MODULE_PLAN.md`）

---

## 🎯 核心要点

Authentication 模块处理用户认证和会话管理。

### 主要聚合根
1. **Session** - 用户会话
2. **AuthToken** - 认证令牌（JWT/Refresh Token）

### 主要实体
1. **LoginHistory** - 登录历史记录

---

## 📋 DTO 命名规范

```typescript
// Server DTO
SessionServerDTO
AuthTokenServerDTO
LoginHistoryServerDTO

// Client DTO（注意 Client 后缀）
SessionClientDTO
AuthTokenClientDTO
LoginHistoryClientDTO

// Persistence DTO
SessionPersistenceDTO
AuthTokenPersistenceDTO
LoginHistoryPersistenceDTO
```

---

## 🔄 DTO 转换方法

与 Goal 模块完全一致。

---

## 🗂️ 状态管理

```typescript
export enum SessionStatus {
  Active = 'active',
  Expired = 'expired',
  Revoked = 'revoked',
  Deleted = 'deleted',
}
```

---

## 🔑 核心业务方法

```typescript
export class Session extends AggregateRoot {
  // 会话管理
  public refresh(): void;
  public revoke(reason: string): void;
  public softDelete(): void;
  
  // 验证
  public isValid(): boolean;
  public isExpired(): boolean;
  
  // 更新
  public updateLastActivity(): void;
  public updateDeviceInfo(info: DeviceInfo): void;
}
```

---

## 📦 仓储接口

```typescript
export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findByUuid(uuid: string): Promise<Session | null>;
  findByAccountUuid(accountUuid: string): Promise<Session[]>;
  findByToken(token: string): Promise<Session | null>;
  
  // 会话管理
  revokeAll(accountUuid: string): Promise<void>;
  deleteExpired(): Promise<void>;
  
  // 查询
  findActiveSessions(accountUuid: string): Promise<Session[]>;
}
```

---

## 💡 重构建议

1. **基于 Goal 模块架构**
2. **关注安全性**（Token 存储、过期处理）
3. **实现会话刷新机制**

---

参考：`docs/modules/goal/GOAL_MODULE_PLAN.md`
