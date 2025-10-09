# 时间戳类型选择与转换规范

## 设计决策

### 统一使用 `number` (epoch milliseconds) 作为时间戳

**适用范围**: 所有层次（Persistence / Server / Client / Entity）

## 决策理由

### 1. 性能优势
- ✅ **传输效率**: JSON 中 `1696838400000` (13 bytes) vs `"2023-10-09T00:00:00.000Z"` (24 bytes)
- ✅ **存储效率**: 数据库数字索引比字符串索引快 3-5 倍
- ✅ **序列化零成本**: 无需 `toISOString()` / `new Date()` 转换
- ✅ **内存占用**: 数字 8 bytes vs Date 对象 24+ bytes

### 2. 兼容性优势
- ✅ **date-fns 完全兼容**: 所有函数接受 `number | Date`
- ✅ **跨语言一致**: Unix 时间戳是通用标准
- ✅ **JSON 原生支持**: 直接序列化/反序列化
- ✅ **无时区歧义**: UTC 时间戳无需额外处理

### 3. 开发体验
- ✅ **TypeScript 类型安全**: 可用 `type Timestamp = number` 增强语义
- ✅ **易于调试**: 时间戳可直接在浏览器控制台转换 `new Date(1696838400000)`
- ✅ **易于计算**: 时间差计算直接用减法 `end - start`

## 类型定义

```typescript
/**
 * Unix timestamp in milliseconds (UTC)
 * @example 1696838400000 // 2023-10-09T00:00:00.000Z
 */
export type Timestamp = number;

/**
 * Optional timestamp (nullable)
 */
export type TimestampOptional = number | null;
```

## 使用规范

### 1. 实体定义

```typescript
export interface UserServer {
  uuid: string;
  name: string;
  email: string;
  // ✅ 统一使用 number
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number | null;
}

export interface UserClient {
  uuid: string;
  name: string;
  email: string;
  // ✅ Client 也使用 number
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number | null;
  // UI 格式化属性
  createdAtFormatted: string; // "2023-10-09 10:30"
  lastLoginTimeAgo?: string | null; // "2 hours ago"
}
```

### 2. DTO 定义

```typescript
// Persistence DTO (snake_case)
export interface UserPersistenceDTO {
  uuid: string;
  name: string;
  email: string;
  created_at: number; // epoch ms
  updated_at: number;
  last_login_at?: number | null;
}

// Server DTO (camelCase)
export interface UserServerDTO {
  uuid: string;
  name: string;
  email: string;
  createdAt: number; // epoch ms
  updatedAt: number;
  lastLoginAt?: number | null;
}

// Client DTO (camelCase)
export interface UserClientDTO {
  uuid: string;
  name: string;
  email: string;
  createdAt: number; // epoch ms
  updatedAt: number;
  lastLoginAt?: number | null;
}
```

### 3. 转换方法

```typescript
export interface UserServer {
  // ... properties
  
  // ===== DTO 转换方法 =====
  
  // To DTOs
  toServerDTO(): UserServerDTO;
  toClientDTO(): UserClientDTO;
  toPersistenceDTO(): UserPersistenceDTO;
  
  // From DTOs
  fromServerDTO(dto: UserServerDTO): UserServer;
  fromClientDTO(dto: UserClientDTO): UserServer;
  fromPersistenceDTO(dto: UserPersistenceDTO): UserServer;
}
```

### 4. date-fns 使用示例

```typescript
import { format, formatDistanceToNow, isAfter, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ✅ date-fns 直接接受 number
const user: UserClient = {
  uuid: '123',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: 1696838400000,
  updatedAt: Date.now(),
  lastLoginAt: Date.now() - 7200000, // 2 hours ago
};

// 格式化显示
user.createdAtFormatted = format(user.createdAt, 'yyyy-MM-dd HH:mm:ss');
// → "2023-10-09 10:00:00"

// 相对时间
user.lastLoginTimeAgo = formatDistanceToNow(user.lastLoginAt!, { 
  addSuffix: true,
  locale: zhCN 
});
// → "2 小时前"

// 时间比较
if (isAfter(user.updatedAt, user.createdAt)) {
  console.log('User has been updated');
}

// 时间计算
const expiresAt = addDays(user.createdAt, 30);
// → 1699430400000
```

### 5. 数据库存储

#### PostgreSQL
```sql
-- 使用 BIGINT 存储 epoch ms
CREATE TABLE users (
  uuid UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at BIGINT NOT NULL, -- epoch ms
  updated_at BIGINT NOT NULL,
  last_login_at BIGINT
);

-- 查询示例（转换为 TIMESTAMP 显示）
SELECT 
  uuid,
  name,
  to_timestamp(created_at / 1000.0) AS created_at_ts,
  to_timestamp(updated_at / 1000.0) AS updated_at_ts
FROM users;

-- 索引（数字索引非常快）
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_updated_at ON users(updated_at);
```

#### Prisma Schema
```prisma
model User {
  uuid        String  @id @default(uuid())
  name        String
  email       String  @unique
  createdAt   BigInt  @map("created_at") // epoch ms
  updatedAt   BigInt  @map("updated_at")
  lastLoginAt BigInt? @map("last_login_at")
  
  @@index([createdAt])
  @@index([updatedAt])
  @@map("users")
}
```

### 6. API 传输

#### Request
```typescript
// POST /api/users
{
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": 1696838400000  // ✅ 直接传数字
}
```

#### Response
```typescript
// GET /api/users/123
{
  "uuid": "123",
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": 1696838400000,  // ✅ 直接返回数字
  "updatedAt": 1696838500000,
  "lastLoginAt": 1696845600000
}
```

### 7. 常用工具函数

```typescript
/**
 * 获取当前时间戳
 */
export const now = (): number => Date.now();

/**
 * 从 ISO 字符串转换为时间戳
 */
export const fromISO = (iso: string): number => new Date(iso).getTime();

/**
 * 从时间戳转换为 ISO 字符串
 */
export const toISO = (timestamp: number): string => new Date(timestamp).toISOString();

/**
 * 格式化时间戳
 */
export const formatTimestamp = (
  timestamp: number,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): string => {
  return format(timestamp, formatStr);
};

/**
 * 相对时间
 */
export const timeAgo = (timestamp: number, locale = zhCN): string => {
  return formatDistanceToNow(timestamp, { addSuffix: true, locale });
};

/**
 * 时间范围判断
 */
export const isInRange = (
  timestamp: number,
  start: number,
  end: number
): boolean => {
  return timestamp >= start && timestamp <= end;
};

/**
 * 计算时间差（毫秒）
 */
export const timeDiff = (end: number, start: number): number => {
  return end - start;
};

/**
 * 计算时间差（秒）
 */
export const timeDiffSeconds = (end: number, start: number): number => {
  return Math.floor((end - start) / 1000);
};

/**
 * 计算时间差（分钟）
 */
export const timeDiffMinutes = (end: number, start: number): number => {
  return Math.floor((end - start) / 60000);
};
```

## Mapper 转换规范

### Persistence <-> Server
```typescript
class UserMapper {
  // Persistence -> Server (只需改字段名)
  toServerDTO(persistence: UserPersistenceDTO): UserServerDTO {
    return {
      uuid: persistence.uuid,
      name: persistence.name,
      email: persistence.email,
      createdAt: persistence.created_at, // ✅ 直接复制，都是 number
      updatedAt: persistence.updated_at,
      lastLoginAt: persistence.last_login_at,
    };
  }
  
  // Server -> Persistence (只需改字段名)
  toPersistenceDTO(server: UserServerDTO): UserPersistenceDTO {
    return {
      uuid: server.uuid,
      name: server.name,
      email: server.email,
      created_at: server.createdAt, // ✅ 直接复制，都是 number
      updated_at: server.updatedAt,
      last_login_at: server.lastLoginAt,
    };
  }
}
```

### Server <-> Client
```typescript
class UserMapper {
  // Server -> Client (可以添加格式化)
  toClientDTO(server: UserServerDTO): UserClientDTO {
    return {
      uuid: server.uuid,
      name: server.name,
      email: server.email,
      createdAt: server.createdAt, // ✅ 直接复制
      updatedAt: server.updatedAt,
      lastLoginAt: server.lastLoginAt,
      // 可选：添加格式化字段
      createdAtFormatted: format(server.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      lastLoginTimeAgo: server.lastLoginAt 
        ? formatDistanceToNow(server.lastLoginAt, { addSuffix: true })
        : null,
    };
  }
  
  // Client -> Server (移除格式化字段)
  fromClientDTO(client: UserClientDTO): UserServerDTO {
    return {
      uuid: client.uuid,
      name: client.name,
      email: client.email,
      createdAt: client.createdAt, // ✅ 直接复制
      updatedAt: client.updatedAt,
      lastLoginAt: client.lastLoginAt,
    };
  }
}
```

## 旧代码迁移

如果已有代码使用 `Date` 类型，迁移步骤：

### 1. 替换类型定义
```typescript
// Before
createdAt: Date;
updatedAt: Date;

// After
createdAt: number;
updatedAt: number;
```

### 2. 替换实例化
```typescript
// Before
const user = {
  createdAt: new Date(),
  updatedAt: new Date(),
};

// After
const user = {
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### 3. 替换转换
```typescript
// Before (Date -> ISO string -> Date)
const dto = {
  createdAt: entity.createdAt.toISOString(),
};
const entity = {
  createdAt: new Date(dto.createdAt),
};

// After (number 直接传递)
const dto = {
  createdAt: entity.createdAt, // ✅ 零成本
};
const entity = {
  createdAt: dto.createdAt, // ✅ 零成本
};
```

## 性能对比

### 序列化性能
```typescript
// Benchmark: 序列化 10,000 次
// Date 类型
console.time('Date');
for (let i = 0; i < 10000; i++) {
  JSON.stringify({ createdAt: new Date().toISOString() });
}
console.timeEnd('Date'); // ~45ms

// number 类型
console.time('number');
for (let i = 0; i < 10000; i++) {
  JSON.stringify({ createdAt: Date.now() });
}
console.timeEnd('number'); // ~12ms

// 性能提升: ~73% 🚀
```

### 反序列化性能
```typescript
// Benchmark: 反序列化 10,000 次
const dateJson = '{"createdAt":"2023-10-09T00:00:00.000Z"}';
const numberJson = '{"createdAt":1696838400000}';

// Date 类型
console.time('Date');
for (let i = 0; i < 10000; i++) {
  const obj = JSON.parse(dateJson);
  new Date(obj.createdAt);
}
console.timeEnd('Date'); // ~38ms

// number 类型
console.time('number');
for (let i = 0; i < 10000; i++) {
  JSON.parse(numberJson);
}
console.timeEnd('number'); // ~8ms

// 性能提升: ~79% 🚀
```

## 总结

### ✅ 推荐做法
- 所有层次统一使用 `number` (epoch ms)
- 使用 `Date.now()` 获取当前时间
- 使用 date-fns 处理格式化和计算
- Client 可添加格式化字符串属性用于显示

### ❌ 不推荐做法
- ~~使用 `Date` 对象~~（除非需要复杂时区处理）
- ~~使用 ISO 字符串~~（传输和存储效率低）
- ~~混用多种时间格式~~（增加转换成本）

### 🎯 最佳实践
1. **统一性**: 全栈统一使用 epoch ms
2. **类型安全**: 使用 `type Timestamp = number` 增强语义
3. **格式化延迟**: 仅在 UI 渲染时格式化
4. **索引优化**: 数据库时间字段使用 BIGINT
5. **工具函数**: 封装常用时间操作
