---
title: Repository 模块 - Contracts 实现指南
created: 2025-10-10
updated: 2025-10-10
tags:
  - repository
  - contracts
  - typescript
  - ddd
category: 实现指南
---

# Repository 模块 - Contracts 实现指南

> **Contract First 原则**：先定义类型契约，再实现业务逻辑

---

## 📋 实现顺序

```
1. 枚举类型 (enums.ts)
   ↓
2. 值对象 (value-objects/)
   ↓
3. 聚合根 DTO (aggregates/)
   ↓
4. 实体 DTO (entities/)
   ↓
5. API 请求/响应 (api-requests.ts)
   ↓
6. 统一导出 (index.ts)
```

---

## 1️⃣ 枚举类型定义

**位置**: `packages/contracts/src/modules/repository/enums.ts`

### 📐 规范

- ✅ 使用 `export enum` 而非 `const enum`
- ✅ 使用 UPPER_SNAKE_CASE 命名
- ✅ 添加完整的 JSDoc 注释
- ✅ 按业务领域分组
- ✅ 保持枚举值稳定，不随意修改

### 📝 示例代码

```typescript
/**
 * 仓库类型
 * Repository Type Enum
 */
export enum RepositoryType {
  /** 本地仓库 */
  LOCAL = 'LOCAL',
  /** Git 仓库 */
  GIT = 'GIT',
  /** 云端仓库 */
  CLOUD = 'CLOUD',
  /** 远程仓库 */
  REMOTE = 'REMOTE',
}

/**
 * 仓库状态
 * Repository Status Enum
 */
export enum RepositoryStatus {
  /** 活跃 */
  ACTIVE = 'ACTIVE',
  /** 未激活 */
  INACTIVE = 'INACTIVE',
  /** 已归档 */
  ARCHIVED = 'ARCHIVED',
  /** 同步中 */
  SYNCING = 'SYNCING',
  /** 错误 */
  ERROR = 'ERROR',
}

/**
 * 资源类型
 * Resource Type Enum
 */
export enum ResourceType {
  /** 文件 */
  FILE = 'FILE',
  /** 文件夹 */
  FOLDER = 'FOLDER',
  /** 笔记 */
  NOTE = 'NOTE',
  /** 文档 */
  DOCUMENT = 'DOCUMENT',
  /** 图片 */
  IMAGE = 'IMAGE',
  /** 视频 */
  VIDEO = 'VIDEO',
  /** 音频 */
  AUDIO = 'AUDIO',
  /** 其他 */
  OTHER = 'OTHER',
}

/**
 * 资源状态
 * Resource Status Enum
 */
export enum ResourceStatus {
  /** 活跃 */
  ACTIVE = 'ACTIVE',
  /** 草稿 */
  DRAFT = 'DRAFT',
  /** 已归档 */
  ARCHIVED = 'ARCHIVED',
  /** 已删除 */
  DELETED = 'DELETED',
}

/**
 * 同步状态
 * Sync Status Enum
 */
export enum SyncStatus {
  /** 未同步 */
  NOT_SYNCED = 'NOT_SYNCED',
  /** 同步中 */
  SYNCING = 'SYNCING',
  /** 已同步 */
  SYNCED = 'SYNCED',
  /** 同步失败 */
  SYNC_FAILED = 'SYNC_FAILED',
  /** 有冲突 */
  CONFLICT = 'CONFLICT',
}
```

### ⚠️ 易错点

❌ **错误**：使用小写或数字值
```typescript
// 错误示例
export enum RepositoryType {
  local = 'local',      // ❌ 应该大写
  git = 1,              // ❌ 应该字符串
}
```

✅ **正确**：使用大写字符串值
```typescript
export enum RepositoryType {
  LOCAL = 'LOCAL',      // ✅
  GIT = 'GIT',          // ✅
}
```

---

## 2️⃣ 值对象定义

**位置**: `packages/contracts/src/modules/repository/value-objects/`

### 📐 规范

- ✅ 值对象是不可变的
- ✅ 使用 `readonly` 修饰所有属性
- ✅ 提供完整的 JSDoc 注释
- ✅ 包含验证逻辑（可选）
- ✅ 导出接口而非类

### 📝 示例代码

#### RepositoryConfig.ts

```typescript
/**
 * 仓库配置值对象
 * Repository Configuration Value Object
 */
export interface RepositoryConfig {
  /**
   * 是否自动同步
   * Auto sync enabled
   */
  readonly autoSync: boolean;

  /**
   * 同步间隔（分钟）
   * Sync interval in minutes
   */
  readonly syncInterval: number;

  /**
   * 最大文件大小（MB）
   * Max file size in MB
   */
  readonly maxFileSize: number;

  /**
   * 忽略的文件模式
   * Ignored file patterns
   */
  readonly ignoredPatterns: readonly string[];

  /**
   * 是否启用版本控制
   * Version control enabled
   */
  readonly versionControlEnabled: boolean;
}

/**
 * 默认仓库配置
 */
export const DEFAULT_REPOSITORY_CONFIG: RepositoryConfig = {
  autoSync: false,
  syncInterval: 5,
  maxFileSize: 100,
  ignoredPatterns: ['.git', 'node_modules', '.DS_Store'],
  versionControlEnabled: false,
};
```

#### GitInfo.ts

```typescript
/**
 * Git 信息值对象
 * Git Information Value Object
 */
export interface GitInfo {
  /**
   * 仓库 URL
   * Repository URL
   */
  readonly url: string | null;

  /**
   * 当前分支
   * Current branch
   */
  readonly branch: string | null;

  /**
   * 最后提交 SHA
   * Last commit SHA
   */
  readonly lastCommit: string | null;

  /**
   * 远程名称
   * Remote name
   */
  readonly remoteName: string | null;

  /**
   * 是否有未提交的变更
   * Has uncommitted changes
   */
  readonly hasUncommittedChanges: boolean;
}
```

#### RepositoryStats.ts

```typescript
/**
 * 仓库统计信息值对象
 * Repository Statistics Value Object
 */
export interface RepositoryStats {
  /**
   * 总文件数
   * Total file count
   */
  readonly totalFiles: number;

  /**
   * 总文件夹数
   * Total folder count
   */
  readonly totalFolders: number;

  /**
   * 总大小（字节）
   * Total size in bytes
   */
  readonly totalSize: number;

  /**
   * 最后更新时间
   * Last updated at
   */
  readonly lastUpdatedAt: Date | null;

  /**
   * 资源类型分布
   * Resource type distribution
   */
  readonly resourceTypeDistribution: Record<string, number>;
}
```

### ⚠️ 易错点

❌ **错误**：值对象属性可变
```typescript
// 错误示例
export interface RepositoryConfig {
  autoSync: boolean;        // ❌ 缺少 readonly
  ignoredPatterns: string[]; // ❌ 数组应该是 readonly
}
```

✅ **正确**：所有属性都是只读的
```typescript
export interface RepositoryConfig {
  readonly autoSync: boolean;           // ✅
  readonly ignoredPatterns: readonly string[]; // ✅
}
```

---

## 3️⃣ 聚合根 DTO 定义

**位置**: `packages/contracts/src/modules/repository/aggregates/`

### 📐 规范

- ✅ 分为 Server 和 Client 两个版本
- ✅ Server 版本包含完整数据（包括敏感信息）
- ✅ Client 版本是 Server 版本的子集
- ✅ 使用 `DTO` 后缀命名
- ✅ 包含领域事件定义

### 📝 示例代码

#### RepositoryServer.ts

```typescript
import { RepositoryType, RepositoryStatus, SyncStatus } from '../enums';
import type { RepositoryConfig, GitInfo, RepositoryStats } from '../value-objects';

/**
 * 仓库聚合根 - 服务端版本
 * Repository Aggregate Root - Server DTO
 */
export interface RepositoryServerDTO {
  /**
   * 仓库UUID（主键）
   * Repository UUID (Primary Key)
   */
  readonly uuid: string;

  /**
   * 账户UUID（外键）
   * Account UUID (Foreign Key)
   */
  readonly accountUuid: string;

  /**
   * 仓库名称
   * Repository name
   */
  readonly name: string;

  /**
   * 仓库路径
   * Repository path
   */
  readonly path: string;

  /**
   * 仓库类型
   * Repository type
   */
  readonly type: RepositoryType;

  /**
   * 仓库状态
   * Repository status
   */
  readonly status: RepositoryStatus;

  /**
   * 仓库描述
   * Repository description
   */
  readonly description: string | null;

  /**
   * 仓库配置
   * Repository configuration
   */
  readonly config: RepositoryConfig;

  /**
   * Git 信息
   * Git information
   */
  readonly gitInfo: GitInfo | null;

  /**
   * 同步状态
   * Sync status
   */
  readonly syncStatus: SyncStatus;

  /**
   * 最后同步时间
   * Last synced at
   */
  readonly lastSyncedAt: Date | null;

  /**
   * 关联的目标UUID列表
   * Related goal UUIDs
   */
  readonly relatedGoals: readonly string[];

  /**
   * 标签
   * Tags
   */
  readonly tags: readonly string[];

  /**
   * 统计信息
   * Statistics
   */
  readonly stats: RepositoryStats | null;

  /**
   * 创建时间
   * Created at
   */
  readonly createdAt: Date;

  /**
   * 更新时间
   * Updated at
   */
  readonly updatedAt: Date;

  /**
   * 版本号（乐观锁）
   * Version (Optimistic lock)
   */
  readonly version: number;
}

/**
 * ============ 领域事件 ============
 */

/**
 * 仓库已创建事件
 * Repository Created Event
 */
export interface RepositoryCreatedEvent {
  readonly eventType: 'RepositoryCreated';
  readonly aggregateId: string;
  readonly accountUuid: string;
  readonly name: string;
  readonly type: RepositoryType;
  readonly occurredAt: Date;
}

/**
 * 仓库已更新事件
 * Repository Updated Event
 */
export interface RepositoryUpdatedEvent {
  readonly eventType: 'RepositoryUpdated';
  readonly aggregateId: string;
  readonly accountUuid: string;
  readonly updatedFields: readonly string[];
  readonly occurredAt: Date;
}

/**
 * 仓库已删除事件
 * Repository Deleted Event
 */
export interface RepositoryDeletedEvent {
  readonly eventType: 'RepositoryDeleted';
  readonly aggregateId: string;
  readonly accountUuid: string;
  readonly occurredAt: Date;
}

/**
 * 仓库状态已变更事件
 * Repository Status Changed Event
 */
export interface RepositoryStatusChangedEvent {
  readonly eventType: 'RepositoryStatusChanged';
  readonly aggregateId: string;
  readonly accountUuid: string;
  readonly oldStatus: RepositoryStatus;
  readonly newStatus: RepositoryStatus;
  readonly occurredAt: Date;
}

/**
 * 仓库已同步事件
 * Repository Synced Event
 */
export interface RepositorySyncedEvent {
  readonly eventType: 'RepositorySynced';
  readonly aggregateId: string;
  readonly accountUuid: string;
  readonly syncStatus: SyncStatus;
  readonly syncedAt: Date;
}
```

#### RepositoryClient.ts

```typescript
import type { RepositoryServerDTO } from './RepositoryServer';

/**
 * 仓库聚合根 - 客户端版本
 * Repository Aggregate Root - Client DTO
 * 
 * @description
 * 客户端版本是服务端版本的子集
 * 去除了敏感信息和内部字段
 */
export type RepositoryClientDTO = Omit<
  RepositoryServerDTO,
  'version' // 版本号仅服务端使用
>;

/**
 * 简化的仓库信息（用于列表展示）
 * Simplified Repository Info
 */
export interface RepositoryListItemDTO {
  readonly uuid: string;
  readonly name: string;
  readonly path: string;
  readonly type: RepositoryType;
  readonly status: RepositoryStatus;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### ⚠️ 易错点

❌ **错误**：Client DTO 包含服务端专用字段
```typescript
// 错误示例
export interface RepositoryClientDTO {
  uuid: string;
  accountUuid: string;  // ❌ 可能暴露敏感信息
  version: number;      // ❌ 版本号应该只在服务端使用
}
```

✅ **正确**：Client DTO 是 Server DTO 的安全子集
```typescript
export type RepositoryClientDTO = Omit<
  RepositoryServerDTO,
  'version'  // ✅ 排除内部字段
>;
```

---

## 4️⃣ 实体 DTO 定义

**位置**: `packages/contracts/src/modules/repository/entities/`

### 📐 规范

- ✅ 实体属于聚合根
- ✅ 必须包含聚合根 ID 作为外键
- ✅ 同样分为 Server 和 Client 版本
- ✅ 遵循相同的命名规范

### 📝 示例代码

#### ResourceServer.ts

```typescript
import { ResourceType, ResourceStatus } from '../enums';

/**
 * 资源实体 - 服务端版本
 * Resource Entity - Server DTO
 */
export interface ResourceServerDTO {
  /**
   * 资源UUID（主键）
   */
  readonly uuid: string;

  /**
   * 仓库UUID（外键 - 聚合根ID）
   * ⚠️ 必填：实体必须属于某个聚合根
   */
  readonly repositoryUuid: string;

  /**
   * 账户UUID（外键）
   */
  readonly accountUuid: string;

  /**
   * 资源名称
   */
  readonly name: string;

  /**
   * 资源路径（相对于仓库根目录）
   */
  readonly path: string;

  /**
   * 资源类型
   */
  readonly type: ResourceType;

  /**
   * 资源状态
   */
  readonly status: ResourceStatus;

  /**
   * 文件大小（字节）
   */
  readonly size: number | null;

  /**
   * MIME 类型
   */
  readonly mimeType: string | null;

  /**
   * 文件哈希值（用于检测变更）
   */
  readonly hash: string | null;

  /**
   * 父资源UUID（用于层级结构）
   */
  readonly parentUuid: string | null;

  /**
   * 描述
   */
  readonly description: string | null;

  /**
   * 标签
   */
  readonly tags: readonly string[];

  /**
   * 元数据（自定义字段）
   */
  readonly metadata: Record<string, any> | null;

  /**
   * 创建时间
   */
  readonly createdAt: Date;

  /**
   * 更新时间
   */
  readonly updatedAt: Date;

  /**
   * 版本号
   */
  readonly version: number;
}
```

#### ResourceClient.ts

```typescript
import type { ResourceServerDTO } from './ResourceServer';

/**
 * 资源实体 - 客户端版本
 */
export type ResourceClientDTO = Omit<
  ResourceServerDTO,
  'version' | 'hash' // 排除内部字段
>;
```

### ⚠️ 易错点

❌ **错误**：实体缺少聚合根外键
```typescript
// 错误示例
export interface ResourceServerDTO {
  uuid: string;
  name: string;
  // ❌ 缺少 repositoryUuid，实体必须属于聚合根
}
```

✅ **正确**：实体包含聚合根外键
```typescript
export interface ResourceServerDTO {
  uuid: string;
  repositoryUuid: string;  // ✅ 聚合根外键
  name: string;
}
```

---

## 5️⃣ API 请求/响应定义

**位置**: `packages/contracts/src/modules/repository/api-requests.ts`

### 📐 规范

- ✅ 使用 `RequestDTO` 和 `ResponseDTO` 后缀
- ✅ 请求 DTO 包含验证规则（可选）
- ✅ 响应 DTO 使用已定义的实体 DTO
- ✅ 包含分页参数和响应

### 📝 示例代码

```typescript
import type { RepositoryClientDTO, ResourceClientDTO } from './aggregates';
import { RepositoryType, RepositoryStatus } from './enums';

/**
 * ============ Repository 请求 ============
 */

/**
 * 创建仓库请求
 */
export interface CreateRepositoryRequestDTO {
  readonly name: string;
  readonly path: string;
  readonly type: RepositoryType;
  readonly description?: string;
  readonly config?: Partial<RepositoryConfig>;
}

/**
 * 更新仓库请求
 */
export interface UpdateRepositoryRequestDTO {
  readonly name?: string;
  readonly path?: string;
  readonly description?: string;
  readonly config?: Partial<RepositoryConfig>;
  readonly tags?: readonly string[];
}

/**
 * ============ Repository 响应 ============
 */

/**
 * 仓库详情响应（单个）
 */
export type RepositoryDTO = RepositoryClientDTO;

/**
 * 仓库列表响应
 */
export interface RepositoryListResponseDTO {
  readonly items: readonly RepositoryClientDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * ============ Resource 请求 ============
 */

/**
 * 创建资源请求
 */
export interface CreateResourceRequestDTO {
  readonly repositoryUuid: string;  // ⚠️ 必填
  readonly name: string;
  readonly path: string;
  readonly type: ResourceType;
  readonly parentUuid?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
}

/**
 * 更新资源请求
 */
export interface UpdateResourceRequestDTO {
  readonly name?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, any>;
}

/**
 * 资源查询参数
 */
export interface ResourceQueryParamsDTO {
  readonly repositoryUuid?: string;
  readonly type?: ResourceType;
  readonly status?: ResourceStatus;
  readonly parentUuid?: string;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

/**
 * ============ Resource 响应 ============
 */

/**
 * 资源详情响应（单个）
 */
export type ResourceDTO = ResourceClientDTO;

/**
 * 资源列表响应
 */
export interface ResourceListResponseDTO {
  readonly items: readonly ResourceClientDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
```

### ⚠️ 易错点

❌ **错误**：请求 DTO 使用 Client DTO 直接暴露
```typescript
// 错误示例
export type CreateRepositoryRequestDTO = RepositoryClientDTO;
// ❌ 请求应该只包含必要字段，不应该包含 uuid、createdAt 等
```

✅ **正确**：请求 DTO 只包含创建/更新所需字段
```typescript
export interface CreateRepositoryRequestDTO {
  readonly name: string;     // ✅ 只包含必要字段
  readonly path: string;
  readonly type: RepositoryType;
  readonly description?: string;  // ✅ 可选字段
}
```

---

## 6️⃣ 统一导出

**位置**: `packages/contracts/src/modules/repository/index.ts`

### 📐 规范

- ✅ 按类别分组导出
- ✅ 添加注释说明
- ✅ 保持导出顺序一致

### 📝 示例代码

```typescript
/**
 * Repository Module - Contracts
 * 仓储模块契约定义
 */

// ============ 枚举 ============
export * from './enums';

// ============ 值对象 ============
export * from './value-objects';

// ============ 聚合根 ============
export * from './aggregates/RepositoryServer';
export * from './aggregates/RepositoryClient';

// ============ 实体 ============
export * from './entities/ResourceServer';
export * from './entities/ResourceClient';

// ============ API 请求/响应 ============
export * from './api-requests';
```

---

## ✅ Contracts 层检查清单

创建完成后，检查以下项：

- [ ] 所有枚举使用 UPPER_SNAKE_CASE
- [ ] 所有接口使用 DTO 后缀
- [ ] 值对象所有属性都是 readonly
- [ ] Server DTO 和 Client DTO 正确分离
- [ ] 实体包含聚合根外键
- [ ] API 请求不包含自动生成字段（uuid、createdAt 等）
- [ ] 所有类型都有完整的 JSDoc 注释
- [ ] 导出文件正确组织

---

## 📚 下一步

完成 Contracts 层后，进入：
- [[02-DOMAIN_SERVER_IMPLEMENTATION|Domain Server 实现]]

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-10
