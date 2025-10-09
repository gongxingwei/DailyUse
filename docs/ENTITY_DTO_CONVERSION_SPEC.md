# 实体与 DTO 转换规范

## 转换方法完整定义

每个实体（Server/Client）都应该包含完整的双向转换方法：

### 转换方法矩阵

```
              To Methods                    From Methods
              ↓                             ↓
Entity  →  toServerDTO()             fromServerDTO(dto)      ← ServerDTO
Entity  →  toClientDTO()             fromClientDTO(dto)      ← ClientDTO  
Entity  →  toPersistenceDTO()        fromPersistenceDTO(dto) ← PersistenceDTO
```

## 完整示例：User 实体

### 1. Server 实体

```typescript
/**
 * UserServer - 服务端用户实体
 * 包含完整的业务逻辑和转换方法
 */
export interface UserServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  isActive: boolean;
  
  // ===== 时间戳 (统一使用 number epoch ms) =====
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number | null;
  
  // ===== 业务方法 =====
  activate(): void;
  deactivate(): void;
  updateProfile(data: Partial<UserServer>): void;
  changeRole(role: UserServer['role']): void;
  
  // ===== DTO 转换方法 (To) =====
  toServerDTO(): UserServerDTO;
  toClientDTO(): UserClientDTO;
  toPersistenceDTO(): UserPersistenceDTO;
  
  // ===== DTO 转换方法 (From - 静态工厂方法) =====
  fromServerDTO(dto: UserServerDTO): UserServer;
  fromClientDTO(dto: UserClientDTO): UserServer;
  fromPersistenceDTO(dto: UserPersistenceDTO): UserServer;
}

// ===== Server DTO =====
export interface UserServerDTO {
  uuid: string;
  accountUuid: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: number; // epoch ms
  updatedAt: number;
  lastLoginAt?: number | null;
}

// ===== Client DTO =====
export interface UserClientDTO {
  uuid: string;
  accountUuid: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: number; // epoch ms
  updatedAt: number;
  lastLoginAt?: number | null;
}

// ===== Persistence DTO =====
export interface UserPersistenceDTO {
  uuid: string;
  account_uuid: string;
  username: string;
  email: string;
  role: string;
  is_active: number; // 0 or 1
  created_at: number; // epoch ms
  updated_at: number;
  last_login_at?: number | null;
}
```

### 2. Client 实体

```typescript
/**
 * UserClient - 客户端用户实体
 * 侧重 UI 展示和用户交互
 */
export interface UserClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  
  // ===== 时间戳 (统一使用 number epoch ms) =====
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number | null;
  
  // ===== UI 辅助属性 =====
  displayName: string; // 格式化的显示名
  avatarUrl?: string | null;
  statusBadge: { text: string; color: string };
  roleLabel: string; // "管理员" / "普通用户"
  
  // ===== 格式化时间 (可选) =====
  createdAtFormatted?: string; // "2023-10-09 10:30"
  lastLoginTimeAgo?: string | null; // "2 小时前"
  
  // ===== UI 业务方法 =====
  getDisplayName(): string;
  getRoleBadge(): { text: string; color: string };
  canEdit(): boolean;
  canDelete(): boolean;
  
  // ===== DTO 转换方法 (To) =====
  toServerDTO(): UserServerDTO;
  toClientDTO(): UserClientDTO;
  
  // ===== DTO 转换方法 (From) =====
  fromServerDTO(dto: UserServerDTO): UserClient;
  fromClientDTO(dto: UserClientDTO): UserClient;
}
```

## 转换实现示例

### Mapper 类

```typescript
export class UserMapper {
  // ===== Server Entity <-> Server DTO =====
  
  static serverEntityToDTO(entity: UserServer): UserServerDTO {
    return {
      uuid: entity.uuid,
      accountUuid: entity.accountUuid,
      username: entity.username,
      email: entity.email,
      role: entity.role,
      isActive: entity.isActive,
      createdAt: entity.createdAt, // ✅ 直接复制
      updatedAt: entity.updatedAt,
      lastLoginAt: entity.lastLoginAt,
    };
  }
  
  static serverEntityFromDTO(dto: UserServerDTO): UserServer {
    // 返回实体实例（具体实现类）
    return new UserServerImpl({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      username: dto.username,
      email: dto.email,
      role: dto.role as UserServer['role'],
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastLoginAt: dto.lastLoginAt,
    });
  }
  
  // ===== Server DTO <-> Client DTO =====
  
  static serverToClientDTO(server: UserServerDTO): UserClientDTO {
    return {
      uuid: server.uuid,
      accountUuid: server.accountUuid,
      username: server.username,
      email: server.email,
      role: server.role,
      isActive: server.isActive,
      createdAt: server.createdAt, // ✅ 直接复制
      updatedAt: server.updatedAt,
      lastLoginAt: server.lastLoginAt,
    };
  }
  
  static clientToServerDTO(client: UserClientDTO): UserServerDTO {
    return {
      uuid: client.uuid,
      accountUuid: client.accountUuid,
      username: client.username,
      email: client.email,
      role: client.role,
      isActive: client.isActive,
      createdAt: client.createdAt, // ✅ 直接复制
      updatedAt: client.updatedAt,
      lastLoginAt: client.lastLoginAt,
    };
  }
  
  // ===== Persistence DTO <-> Server DTO =====
  
  static persistenceToServerDTO(persistence: UserPersistenceDTO): UserServerDTO {
    return {
      uuid: persistence.uuid,
      accountUuid: persistence.account_uuid,
      username: persistence.username,
      email: persistence.email,
      role: persistence.role,
      isActive: persistence.is_active === 1, // ✅ 0/1 -> boolean
      createdAt: persistence.created_at, // ✅ 直接复制
      updatedAt: persistence.updated_at,
      lastLoginAt: persistence.last_login_at,
    };
  }
  
  static serverToPersistenceDTO(server: UserServerDTO): UserPersistenceDTO {
    return {
      uuid: server.uuid,
      account_uuid: server.accountUuid,
      username: server.username,
      email: server.email,
      role: server.role,
      is_active: server.isActive ? 1 : 0, // ✅ boolean -> 0/1
      created_at: server.createdAt, // ✅ 直接复制
      updated_at: server.updatedAt,
      last_login_at: server.lastLoginAt,
    };
  }
  
  // ===== Client Entity <-> Client DTO =====
  
  static clientEntityToDTO(entity: UserClient): UserClientDTO {
    return {
      uuid: entity.uuid,
      accountUuid: entity.accountUuid,
      username: entity.username,
      email: entity.email,
      role: entity.role,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastLoginAt: entity.lastLoginAt,
    };
  }
  
  static clientEntityFromDTO(dto: UserClientDTO): UserClient {
    return new UserClientImpl({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      username: dto.username,
      email: dto.email,
      role: dto.role,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastLoginAt: dto.lastLoginAt,
      // 计算格式化属性
      displayName: dto.username,
      statusBadge: {
        text: dto.isActive ? '活跃' : '停用',
        color: dto.isActive ? 'green' : 'gray',
      },
      roleLabel: dto.role === 'admin' ? '管理员' : '普通用户',
      createdAtFormatted: format(dto.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      lastLoginTimeAgo: dto.lastLoginAt 
        ? formatDistanceToNow(dto.lastLoginAt, { addSuffix: true })
        : null,
    });
  }
}
```

## 使用示例

### 服务端流程

```typescript
// 1. 从数据库加载 (Persistence -> Server Entity)
const persistenceDTO = await db.users.findOne({ uuid: '123' });
const userEntity = UserMapper.serverEntityFromDTO(
  UserMapper.persistenceToServerDTO(persistenceDTO)
);

// 2. 业务逻辑操作
userEntity.activate();
userEntity.updateProfile({ email: 'new@example.com' });

// 3. 转换为 Client DTO 返回前端
const clientDTO = UserMapper.serverToClientDTO(
  userEntity.toServerDTO()
);

res.json(clientDTO);

// 4. 保存回数据库 (Server Entity -> Persistence)
const updatedPersistence = UserMapper.serverToPersistenceDTO(
  userEntity.toServerDTO()
);
await db.users.update({ uuid: userEntity.uuid }, updatedPersistence);
```

### 客户端流程

```typescript
// 1. 从 API 接收 (Client DTO -> Client Entity)
const response = await fetch('/api/users/123');
const clientDTO: UserClientDTO = await response.json();
const userEntity = UserMapper.clientEntityFromDTO(clientDTO);

// 2. UI 展示
console.log(userEntity.displayName); // "Alice"
console.log(userEntity.statusBadge); // { text: "活跃", color: "green" }
console.log(userEntity.createdAtFormatted); // "2023-10-09 10:30"
console.log(userEntity.lastLoginTimeAgo); // "2 小时前"

// 3. 用户操作后发送更新 (Client Entity -> Client DTO -> API)
const updateDTO = userEntity.toClientDTO();
await fetch('/api/users/123', {
  method: 'PUT',
  body: JSON.stringify(updateDTO),
});
```

## 转换链路总览

```
┌─────────────────────────────────────────────────────────────┐
│                     Complete Data Flow                       │
└─────────────────────────────────────────────────────────────┘

Database (Persistence DTO)
    ↓ fromPersistenceDTO()
Server Entity (UserServer)
    ↓ toServerDTO()
Server DTO (UserServerDTO)
    ↓ serverToClientDTO()
Client DTO (UserClientDTO)
    ↓ fromClientDTO()
Client Entity (UserClient)
    ↓ UI Rendering

[Reverse flow for updates goes back up the chain]
```

## 关键转换规则

### 1. 时间戳转换
```typescript
// ✅ 所有层次都是 number，零成本转换
createdAt: number  →  created_at: number  →  createdAt: number
```

### 2. 布尔值转换
```typescript
// Persistence (0/1) ←→ Server/Client (boolean)
is_active: 1 → isActive: true
isActive: false → is_active: 0
```

### 3. 字段名转换
```typescript
// snake_case (Persistence) ←→ camelCase (Server/Client)
account_uuid → accountUuid
created_at → createdAt
last_login_at → lastLoginAt
```

### 4. JSON 字段转换
```typescript
// JSON string (Persistence) ←→ Object (Server/Client)
metadata_json: '{"key":"value"}' → metadata: { key: "value" }
config_json: '{"setting":true}' → config: { setting: true }
```

### 5. 格式化属性 (Client only)
```typescript
// Client Entity 可添加格式化属性
createdAt: 1696838400000 → createdAtFormatted: "2023-10-09 10:30"
lastLoginAt: 1696838400000 → lastLoginTimeAgo: "2 小时前"
```

## 最佳实践

### ✅ 推荐
1. 使用 Mapper 类集中管理所有转换逻辑
2. 实体的 `toXxxDTO()` 方法只负责转换自身属性
3. 实体的 `fromXxxDTO()` 使用静态工厂模式
4. 时间戳统一使用 `number` (epoch ms)
5. Client Entity 添加格式化属性和 UI 辅助方法

### ❌ 避免
1. ~~在实体内部直接依赖 DTO 类型~~
2. ~~混用多种时间格式（Date / ISO string / epoch）~~
3. ~~在 Server Entity 添加 UI 相关逻辑~~
4. ~~忘记添加双向转换方法~~
5. ~~手动在业务代码中进行转换（应该使用 Mapper）~~
