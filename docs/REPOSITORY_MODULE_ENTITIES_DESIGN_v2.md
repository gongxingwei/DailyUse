# Repository 模块实体设计 (更新版)

> **设计决策变更**:
> 1. ✅ 时间戳统一使用 `number` (epoch ms)
> 2. ✅ 添加完整的双向转换方法 (`from*DTO`)

## 关键变更说明

### 1. 时间戳类型
```typescript
// ❌ 旧版本
createdAt: Date;
updatedAt: Date;
lastAccessedAt?: Date | null;

// ✅ 新版本
createdAt: number; // epoch ms
updatedAt: number;
lastAccessedAt?: number | null;
```

### 2. 转换方法
```typescript
// ❌ 旧版本 (只有 to)
toServerDTO(): RepositoryServerDTO;
toClientDTO(): RepositoryClientDTO;
toPersistenceDTO(): RepositoryPersistenceDTO;

// ✅ 新版本 (完整双向)
// To Methods
toServerDTO(): RepositoryServerDTO;
toClientDTO(): RepositoryClientDTO;
toPersistenceDTO(): RepositoryPersistenceDTO;

// From Methods (静态工厂)
fromServerDTO(dto: RepositoryServerDTO): RepositoryServer;
fromClientDTO(dto: RepositoryClientDTO): RepositoryServer;
fromPersistenceDTO(dto: RepositoryPersistenceDTO): RepositoryServer;
```

---

## 实体接口更新摘要

### 1. RepositoryServer (聚合根)

#### 时间戳属性变更
```typescript
export interface RepositoryServer {
  // ... 其他属性
  
  stats: {
    lastUpdated: number; // ✅ 改为 number
  };
  
  syncStatus?: {
    lastSyncAt?: number; // ✅ 改为 number
  };
  
  // ✅ 统一使用 number
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ✅ 添加完整转换方法
  toServerDTO(): RepositoryServerDTO;
  toClientDTO(): RepositoryClientDTO;
  toPersistenceDTO(): RepositoryPersistenceDTO;
  fromServerDTO(dto: RepositoryServerDTO): RepositoryServer;
  fromClientDTO(dto: RepositoryClientDTO): RepositoryServer;
  fromPersistenceDTO(dto: RepositoryPersistenceDTO): RepositoryServer;
}
```

### 2. RepositoryClient

```typescript
export interface RepositoryClient {
  // ✅ 统一使用 number
  lastSyncAt?: number | null;
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ✅ 添加转换方法
  toServerDTO(): RepositoryServerDTO;
  toClientDTO(): RepositoryClientDTO; // ✅ 新增
  fromServerDTO(dto: RepositoryServerDTO): RepositoryClient; // ✅ 新增
  fromClientDTO(dto: RepositoryClientDTO): RepositoryClient; // ✅ 新增
}
```

### 3. ResourceServer (实体)

```typescript
export interface ResourceServer {
  // ✅ 统一使用 number
  metadata: {
    lastAccessedAt?: number; // ✅ 改为 number
  };
  
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;
  
  // ✅ 添加完整转换方法
  toServerDTO(): ResourceServerDTO;
  toClientDTO(): ResourceClientDTO;
  toPersistenceDTO(): ResourcePersistenceDTO;
  fromServerDTO(dto: ResourceServerDTO): ResourceServer;
  fromClientDTO(dto: ResourceClientDTO): ResourceServer;
  fromPersistenceDTO(dto: ResourcePersistenceDTO): ResourceServer;
}
```

### 4. ResourceClient

```typescript
export interface ResourceClient {
  // ✅ 统一使用 number
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;
  
  // ✅ 添加转换方法
  toServerDTO(): ResourceServerDTO;
  toClientDTO(): ResourceClientDTO;
  fromServerDTO(dto: ResourceServerDTO): ResourceClient;
  fromClientDTO(dto: ResourceClientDTO): ResourceClient;
}
```

### 5. ResourceReferenceServer

```typescript
export interface ResourceReferenceServer {
  // ✅ 统一使用 number
  createdAt: number;
  updatedAt?: number | null;
  lastVerifiedAt?: number | null;
  
  // ✅ 添加完整转换方法
  toServerDTO(): ResourceReferenceServerDTO;
  toClientDTO(): ResourceReferenceClientDTO;
  toPersistenceDTO(): ResourceReferencePersistenceDTO;
  fromServerDTO(dto: ResourceReferenceServerDTO): ResourceReferenceServer;
  fromClientDTO(dto: ResourceReferenceClientDTO): ResourceReferenceServer;
  fromPersistenceDTO(dto: ResourceReferencePersistenceDTO): ResourceReferenceServer;
}
```

### 6. ResourceReferenceClient

```typescript
export interface ResourceReferenceClient {
  // ✅ 统一使用 number
  createdAt: number;
  lastVerifiedAt?: number | null;
  
  // ✅ 添加转换方法
  toServerDTO(): ResourceReferenceServerDTO;
  toClientDTO(): ResourceReferenceClientDTO;
  fromServerDTO(dto: ResourceReferenceServerDTO): ResourceReferenceClient;
  fromClientDTO(dto: ResourceReferenceClientDTO): ResourceReferenceClient;
}
```

### 7. LinkedContentServer

```typescript
export interface LinkedContentServer {
  // ✅ 统一使用 number
  publishedAt?: number | null;
  lastCheckedAt?: number | null;
  cachedAt?: number | null;
  createdAt: number;
  updatedAt?: number | null;
  
  // ✅ 添加完整转换方法
  toServerDTO(): LinkedContentServerDTO;
  toClientDTO(): LinkedContentClientDTO;
  toPersistenceDTO(): LinkedContentPersistenceDTO;
  fromServerDTO(dto: LinkedContentServerDTO): LinkedContentServer;
  fromClientDTO(dto: LinkedContentClientDTO): LinkedContentServer;
  fromPersistenceDTO(dto: LinkedContentPersistenceDTO): LinkedContentServer;
}
```

### 8. LinkedContentClient

```typescript
export interface LinkedContentClient {
  // ✅ 统一使用 number
  publishedAt?: number | null;
  lastCheckedAt?: number | null;
  createdAt: number;
  
  // ✅ 添加转换方法
  toServerDTO(): LinkedContentServerDTO;
  toClientDTO(): LinkedContentClientDTO;
  fromServerDTO(dto: LinkedContentServerDTO): LinkedContentClient;
  fromClientDTO(dto: LinkedContentClientDTO): LinkedContentClient;
}
```

### 9. RepositoryExplorerServer

```typescript
export interface RepositoryExplorerServer {
  // ✅ 统一使用 number
  lastScanAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ✅ 添加完整转换方法
  toServerDTO(): RepositoryExplorerServerDTO;
  toClientDTO(): RepositoryExplorerClientDTO;
  toPersistenceDTO(): RepositoryExplorerPersistenceDTO;
  fromServerDTO(dto: RepositoryExplorerServerDTO): RepositoryExplorerServer;
  fromClientDTO(dto: RepositoryExplorerClientDTO): RepositoryExplorerServer;
  fromPersistenceDTO(dto: RepositoryExplorerPersistenceDTO): RepositoryExplorerServer;
}
```

### 10. RepositoryExplorerClient

```typescript
export interface RepositoryExplorerClient {
  // ✅ 统一使用 number
  lastScanAt?: number | null;
  
  // ✅ 添加转换方法
  toServerDTO(): RepositoryExplorerServerDTO;
  toClientDTO(): RepositoryExplorerClientDTO;
  fromServerDTO(dto: RepositoryExplorerServerDTO): RepositoryExplorerClient;
  fromClientDTO(dto: RepositoryExplorerClientDTO): RepositoryExplorerClient;
}
```

---

## 值对象更新

### GitStatusInfo
```typescript
// 无时间戳，无需变更
export interface GitStatusInfo {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  conflicted: string[];
  isClean: boolean;
}
```

### ResourceFilters
```typescript
export interface ResourceFilters {
  type?: string[];
  tags?: string[];
  status?: string;
  keyword?: string;
  dateRange?: { 
    start: number;  // ✅ 改为 number
    end: number;    // ✅ 改为 number
  };
  sizeRange?: { min: number; max: number };
  isFavorite?: boolean;
}
```

### SyncStatus
```typescript
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt?: number;  // ✅ 改为 number
  syncError?: string;
  pendingSyncCount: number;
  conflictCount: number;
}
```

---

## 转换方法实现模式

### Server Entity

```typescript
// 实现类示例
class RepositoryServerImpl implements RepositoryServer {
  // ... properties
  
  // ===== To Methods =====
  toServerDTO(): RepositoryServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      // ...
      createdAt: this.createdAt, // ✅ 直接复制 number
      updatedAt: this.updatedAt,
    };
  }
  
  toClientDTO(): RepositoryClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      // ...
      createdAt: this.createdAt, // ✅ 直接复制 number
      updatedAt: this.updatedAt,
    };
  }
  
  toPersistenceDTO(): RepositoryPersistenceDTO {
    return {
      uuid: this.uuid,
      account_uuid: this.accountUuid,
      // ...
      created_at: this.createdAt, // ✅ 直接复制 number
      updated_at: this.updatedAt,
    };
  }
  
  // ===== From Methods (静态工厂) =====
  static fromServerDTO(dto: RepositoryServerDTO): RepositoryServer {
    return new RepositoryServerImpl({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      // ...
      createdAt: dto.createdAt, // ✅ 直接复制 number
      updatedAt: dto.updatedAt,
    });
  }
  
  static fromClientDTO(dto: RepositoryClientDTO): RepositoryServer {
    return new RepositoryServerImpl({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      // ...
      createdAt: dto.createdAt, // ✅ 直接复制 number
      updatedAt: dto.updatedAt,
    });
  }
  
  static fromPersistenceDTO(dto: RepositoryPersistenceDTO): RepositoryServer {
    return new RepositoryServerImpl({
      uuid: dto.uuid,
      accountUuid: dto.account_uuid,
      // ...
      createdAt: dto.created_at, // ✅ 直接复制 number
      updatedAt: dto.updated_at,
    });
  }
}
```

### Client Entity

```typescript
class RepositoryClientImpl implements RepositoryClient {
  // ... properties
  
  // ===== To Methods =====
  toServerDTO(): RepositoryServerDTO {
    return {
      uuid: this.uuid,
      // ...
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  
  toClientDTO(): RepositoryClientDTO {
    return {
      uuid: this.uuid,
      // ...
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  
  // ===== From Methods =====
  static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
    return new RepositoryClientImpl({
      uuid: dto.uuid,
      // ...
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
  
  static fromClientDTO(dto: RepositoryClientDTO): RepositoryClient {
    return new RepositoryClientImpl({
      uuid: dto.uuid,
      // ...
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
```

---

## 总结

### 变更点
1. ✅ **时间戳类型**: 所有 `Date` → `number` (epoch ms)
2. ✅ **转换方法**: 添加 `fromXxxDTO()` 静态工厂方法
3. ✅ **零成本转换**: 时间戳跨层传递无需转换
4. ✅ **date-fns 兼容**: 完全支持 `number` 参数

### 影响范围
- ✅ 所有 Server 实体（5个）
- ✅ 所有 Client 实体（5个）
- ✅ 所有值对象（3个）
- ✅ 所有 DTO 定义

### 下一步
1. ✅ 更新 Editor 模块实体设计
2. ✅ 生成完整的 contracts 文件
3. ✅ 实现 Mapper 类

---

📖 **参考文档**:
- `docs/TIMESTAMP_DESIGN_DECISION.md` - 时间戳选择详解
- `docs/ENTITY_DTO_CONVERSION_SPEC.md` - 转换方法完整规范
