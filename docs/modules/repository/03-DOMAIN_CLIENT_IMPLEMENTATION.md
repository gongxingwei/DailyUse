---
title: Repository 模块 - Domain Client 实现指南
created: 2025-10-10
updated: 2025-10-10
tags:
  - repository
  - domain
  - client
  - frontend
category: 实现指南
---

# Repository 模块 - Domain Client 实现指南

> **前端领域层原则**：简化的领域模型，专注于前端业务逻辑

---

## 📋 实现顺序

```
1. 客户端聚合根 (AggregateRoot Client)
   ↓
2. 客户端实体 (Entity Client)
   ↓
3. DTO 转换工具
   ↓
4. 统一导出
```

---

## ⚡ 前端领域层特点

**与 Server 领域层的区别**：

| 特性         | Server 端     | Client 端          |
| ------------ | ------------- | ------------------ |
| **复杂度**   | 完整业务逻辑  | 简化业务逻辑       |
| **状态管理** | 内存 + 数据库 | 内存 + Store       |
| **领域事件** | 发布/订阅     | 通常不用           |
| **验证**     | 完整验证      | UI 验证 + 后端确认 |
| **方法**     | 所有业务方法  | 常用业务方法       |

---

## 1️⃣ 客户端聚合根实现

**位置**: `packages/domain-client/src/repository/aggregates/RepositoryClient.ts`

### 📐 规范

- ✅ 继承 `AggregateRoot` 基类
- ✅ 简化构造函数（可以是 public）
- ✅ 提供 `fromServerDTO` 静态方法
- ✅ 提供 `toClientDTO` 方法
- ✅ 只包含前端需要的业务方法
- ✅ 不发布领域事件（除非有特殊需求）

### 📝 示例代码

```typescript
import { AggregateRoot } from '@dailyuse/utils';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * 仓库聚合根（客户端）
 * Repository Aggregate Root (Client)
 *
 * @description
 * 前端领域模型，简化的仓库业务逻辑
 */
export class RepositoryClient extends AggregateRoot {
  // ============ 公共属性（前端简化模式）============

  public accountUuid: string;
  public name: string;
  public path: string;
  public type: RepositoryContracts.RepositoryType;
  public status: RepositoryContracts.RepositoryStatus;
  public description: string | null;
  public config: RepositoryContracts.RepositoryConfig;
  public gitInfo: RepositoryContracts.GitInfo | null;
  public syncStatus: RepositoryContracts.SyncStatus;
  public lastSyncedAt: Date | null;
  public relatedGoals: string[];
  public tags: string[];
  public stats: RepositoryContracts.RepositoryStats | null;

  // ============ 构造函数（公共）============

  /**
   * 前端可以使用 public 构造函数
   * ⚠️ 推荐使用 fromServerDTO 创建实例
   */
  constructor(
    uuid: string,
    accountUuid: string,
    name: string,
    path: string,
    type: RepositoryContracts.RepositoryType,
    status: RepositoryContracts.RepositoryStatus,
    description: string | null,
    config: RepositoryContracts.RepositoryConfig,
    gitInfo: RepositoryContracts.GitInfo | null,
    syncStatus: RepositoryContracts.SyncStatus,
    lastSyncedAt: Date | null,
    relatedGoals: string[],
    tags: string[],
    stats: RepositoryContracts.RepositoryStats | null,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ) {
    super(uuid, createdAt, updatedAt, version);
    this.accountUuid = accountUuid;
    this.name = name;
    this.path = path;
    this.type = type;
    this.status = status;
    this.description = description;
    this.config = config;
    this.gitInfo = gitInfo;
    this.syncStatus = syncStatus;
    this.lastSyncedAt = lastSyncedAt;
    this.relatedGoals = relatedGoals;
    this.tags = tags;
    this.stats = stats;
  }

  // ============ 静态工厂方法 ============

  /**
   * 从 Server DTO 创建客户端实例
   * ⚠️ 这是主要的创建方法
   */
  static fromServerDTO(dto: RepositoryContracts.RepositoryServerDTO): RepositoryClient {
    // ⚠️ 重要：处理日期类型转换
    return new RepositoryClient(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.path,
      dto.type,
      dto.status,
      dto.description,
      dto.config,
      dto.gitInfo,
      dto.syncStatus,
      dto.lastSyncedAt ? new Date(dto.lastSyncedAt) : null, // ⚠️ Date 转换
      [...dto.relatedGoals],
      [...dto.tags],
      dto.stats,
      new Date(dto.createdAt), // ⚠️ Date 转换
      new Date(dto.updatedAt), // ⚠️ Date 转换
      dto.version,
    );
  }

  /**
   * 从 Client DTO 创建实例（用于从 Store 恢复）
   */
  static fromClientDTO(dto: RepositoryContracts.RepositoryDTO): RepositoryClient {
    return new RepositoryClient(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.path,
      dto.type,
      dto.status,
      dto.description,
      dto.config,
      dto.gitInfo,
      dto.syncStatus,
      dto.lastSyncedAt ? new Date(dto.lastSyncedAt) : null,
      [...dto.relatedGoals],
      [...dto.tags],
      dto.stats,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.version,
    );
  }

  // ============ 业务方法（简化版）============

  /**
   * 检查是否是 Git 仓库
   */
  isGitRepository(): boolean {
    return this.type === RepositoryContracts.RepositoryType.GIT;
  }

  /**
   * 检查是否活跃
   */
  isActive(): boolean {
    return this.status === RepositoryContracts.RepositoryStatus.ACTIVE;
  }

  /**
   * 检查是否已同步
   */
  isSynced(): boolean {
    return this.syncStatus === RepositoryContracts.SyncStatus.SYNCED;
  }

  /**
   * 检查是否有统计信息
   */
  hasStats(): boolean {
    return this.stats !== null;
  }

  /**
   * 获取总资源数
   */
  getTotalResourceCount(): number {
    return this.stats?.totalResources || 0;
  }

  /**
   * 获取总大小（格式化）
   */
  getFormattedSize(): string {
    if (!this.stats?.totalSize) {
      return '0 B';
    }

    const size = this.stats.totalSize;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let convertedSize = size;

    while (convertedSize >= 1024 && unitIndex < units.length - 1) {
      convertedSize /= 1024;
      unitIndex++;
    }

    return `${convertedSize.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 检查是否关联了指定目标
   */
  hasLinkedGoal(goalUuid: string): boolean {
    return this.relatedGoals.includes(goalUuid);
  }

  /**
   * 检查是否包含指定标签
   */
  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  /**
   * 获取显示名称（带状态）
   */
  getDisplayName(): string {
    let displayName = this.name;

    if (this.status === RepositoryContracts.RepositoryStatus.ARCHIVED) {
      displayName += ' (已归档)';
    } else if (this.status === RepositoryContracts.RepositoryStatus.INACTIVE) {
      displayName += ' (未激活)';
    } else if (this.syncStatus === RepositoryContracts.SyncStatus.SYNCING) {
      displayName += ' (同步中...)';
    }

    return displayName;
  }

  /**
   * 获取图标名称
   */
  getIconName(): string {
    switch (this.type) {
      case RepositoryContracts.RepositoryType.GIT:
        return 'mdi-git';
      case RepositoryContracts.RepositoryType.DATABASE:
        return 'mdi-database';
      case RepositoryContracts.RepositoryType.CLOUD:
        return 'mdi-cloud';
      case RepositoryContracts.RepositoryType.LOCAL:
      default:
        return 'mdi-folder';
    }
  }

  /**
   * 获取状态颜色
   */
  getStatusColor(): string {
    switch (this.status) {
      case RepositoryContracts.RepositoryStatus.ACTIVE:
        return 'success';
      case RepositoryContracts.RepositoryStatus.INACTIVE:
        return 'warning';
      case RepositoryContracts.RepositoryStatus.ARCHIVED:
        return 'grey';
      case RepositoryContracts.RepositoryStatus.SYNCING:
        return 'info';
      default:
        return 'default';
    }
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 Client DTO（用于存储到 Store）
   */
  toClientDTO(): RepositoryContracts.RepositoryDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      path: this.path,
      type: this.type,
      status: this.status,
      description: this.description,
      config: this.config,
      gitInfo: this.gitInfo,
      syncStatus: this.syncStatus,
      lastSyncedAt: this.lastSyncedAt,
      relatedGoals: [...this.relatedGoals],
      tags: [...this.tags],
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  /**
   * 转换为更新请求 DTO
   */
  toUpdateRequestDTO(): RepositoryContracts.UpdateRepositoryRequestDTO {
    return {
      uuid: this.uuid,
      name: this.name,
      path: this.path,
      description: this.description,
      config: this.config,
      tags: [...this.tags],
    };
  }

  /**
   * 克隆当前实例
   */
  clone(): RepositoryClient {
    return new RepositoryClient(
      this.uuid,
      this.accountUuid,
      this.name,
      this.path,
      this.type,
      this.status,
      this.description,
      { ...this.config },
      this.gitInfo ? { ...this.gitInfo } : null,
      this.syncStatus,
      this.lastSyncedAt,
      [...this.relatedGoals],
      [...this.tags],
      this.stats ? { ...this.stats } : null,
      this.createdAt,
      this.updatedAt,
      this.version,
    );
  }
}
```

### ⚠️ 易错点

❌ **错误 1**：忘记处理日期类型转换

```typescript
// 错误示例
static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
  return new RepositoryClient(
    // ...
    dto.createdAt,   // ❌ 可能是字符串
    dto.updatedAt,   // ❌ 可能是字符串
  );
}
```

✅ **正确**：显式转换日期

```typescript
static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
  return new RepositoryClient(
    // ...
    new Date(dto.createdAt),   // ✅ 转换为 Date
    new Date(dto.updatedAt),   // ✅ 转换为 Date
  );
}
```

❌ **错误 2**：直接引用数组/对象

```typescript
// 错误示例
static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
  return new RepositoryClient(
    // ...
    dto.tags,           // ❌ 共享引用
    dto.relatedGoals,   // ❌ 共享引用
  );
}
```

✅ **正确**：创建副本

```typescript
static fromServerDTO(dto: RepositoryServerDTO): RepositoryClient {
  return new RepositoryClient(
    // ...
    [...dto.tags],           // ✅ 创建新数组
    [...dto.relatedGoals],   // ✅ 创建新数组
  );
}
```

---

## 2️⃣ 客户端实体实现

**位置**: `packages/domain-client/src/repository/entities/ResourceClient.ts`

### 📝 示例代码

```typescript
import { Entity } from '@dailyuse/utils';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * 资源实体（客户端）
 * Resource Entity (Client)
 */
export class ResourceClient extends Entity {
  // ============ 公共属性 ============

  public repositoryUuid: string;
  public accountUuid: string;
  public name: string;
  public path: string;
  public type: RepositoryContracts.ResourceType;
  public status: RepositoryContracts.ResourceStatus;
  public size: number | null;
  public mimeType: string | null;
  public hash: string | null;
  public parentUuid: string | null;
  public description: string | null;
  public tags: string[];
  public metadata: Record<string, any> | null;

  // ============ 构造函数 ============

  constructor(
    uuid: string,
    repositoryUuid: string,
    accountUuid: string,
    name: string,
    path: string,
    type: RepositoryContracts.ResourceType,
    status: RepositoryContracts.ResourceStatus,
    size: number | null,
    mimeType: string | null,
    hash: string | null,
    parentUuid: string | null,
    description: string | null,
    tags: string[],
    metadata: Record<string, any> | null,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ) {
    super(uuid, createdAt, updatedAt, version);
    this.repositoryUuid = repositoryUuid;
    this.accountUuid = accountUuid;
    this.name = name;
    this.path = path;
    this.type = type;
    this.status = status;
    this.size = size;
    this.mimeType = mimeType;
    this.hash = hash;
    this.parentUuid = parentUuid;
    this.description = description;
    this.tags = tags;
    this.metadata = metadata;
  }

  // ============ 静态工厂方法 ============

  /**
   * 从 Server DTO 创建客户端实例
   */
  static fromServerDTO(dto: RepositoryContracts.ResourceServerDTO): ResourceClient {
    return new ResourceClient(
      dto.uuid,
      dto.repositoryUuid,
      dto.accountUuid,
      dto.name,
      dto.path,
      dto.type,
      dto.status,
      dto.size,
      dto.mimeType,
      dto.hash,
      dto.parentUuid,
      dto.description,
      [...dto.tags],
      dto.metadata,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.version,
    );
  }

  /**
   * 从 Client DTO 创建实例
   */
  static fromClientDTO(dto: RepositoryContracts.ResourceDTO): ResourceClient {
    return new ResourceClient(
      dto.uuid,
      dto.repositoryUuid,
      dto.accountUuid,
      dto.name,
      dto.path,
      dto.type,
      dto.status,
      dto.size,
      dto.mimeType,
      dto.hash,
      dto.parentUuid,
      dto.description,
      [...dto.tags],
      dto.metadata,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.version,
    );
  }

  // ============ 业务方法（简化版）============

  /**
   * 检查是否是文件
   */
  isFile(): boolean {
    return this.type === RepositoryContracts.ResourceType.FILE;
  }

  /**
   * 检查是否是文件夹
   */
  isFolder(): boolean {
    return this.type === RepositoryContracts.ResourceType.FOLDER;
  }

  /**
   * 检查是否是链接
   */
  isLink(): boolean {
    return this.type === RepositoryContracts.ResourceType.LINK;
  }

  /**
   * 检查是否活跃
   */
  isActive(): boolean {
    return this.status === RepositoryContracts.ResourceStatus.ACTIVE;
  }

  /**
   * 获取文件扩展名
   */
  getExtension(): string | null {
    if (!this.isFile()) {
      return null;
    }

    const lastDotIndex = this.name.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return null;
    }

    return this.name.substring(lastDotIndex + 1).toLowerCase();
  }

  /**
   * 获取格式化的大小
   */
  getFormattedSize(): string {
    if (this.size === null) {
      return '-';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 获取图标名称
   */
  getIconName(): string {
    if (this.isFolder()) {
      return 'mdi-folder';
    }

    if (this.isLink()) {
      return 'mdi-link-variant';
    }

    // 根据扩展名判断文件类型
    const ext = this.getExtension();
    switch (ext) {
      case 'md':
        return 'mdi-file-document';
      case 'pdf':
        return 'mdi-file-pdf-box';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'mdi-file-image';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'mdi-file-video';
      case 'mp3':
      case 'wav':
        return 'mdi-file-music';
      default:
        return 'mdi-file';
    }
  }

  /**
   * 检查是否包含指定标签
   */
  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): RepositoryContracts.ResourceDTO {
    return {
      uuid: this.uuid,
      repositoryUuid: this.repositoryUuid,
      accountUuid: this.accountUuid,
      name: this.name,
      path: this.path,
      type: this.type,
      status: this.status,
      size: this.size,
      mimeType: this.mimeType,
      hash: this.hash,
      parentUuid: this.parentUuid,
      description: this.description,
      tags: [...this.tags],
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  /**
   * 转换为更新请求 DTO
   */
  toUpdateRequestDTO(): RepositoryContracts.UpdateResourceRequestDTO {
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      tags: [...this.tags],
      metadata: this.metadata,
    };
  }

  /**
   * 克隆当前实例
   */
  clone(): ResourceClient {
    return new ResourceClient(
      this.uuid,
      this.repositoryUuid,
      this.accountUuid,
      this.name,
      this.path,
      this.type,
      this.status,
      this.size,
      this.mimeType,
      this.hash,
      this.parentUuid,
      this.description,
      [...this.tags],
      this.metadata ? { ...this.metadata } : null,
      this.createdAt,
      this.updatedAt,
      this.version,
    );
  }
}
```

---

## 3️⃣ DTO 转换工具

**位置**: `packages/domain-client/src/repository/utils/dtoConverters.ts`

### 📝 示例代码

```typescript
import type { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryClient } from '../aggregates/RepositoryClient';
import { ResourceClient } from '../entities/ResourceClient';

/**
 * DTO 转换工具
 * DTO Converters
 */

/**
 * Server DTO 列表转 Client 实体列表
 */
export function convertRepositoryListFromServer(
  dtos: RepositoryContracts.RepositoryServerDTO[],
): RepositoryClient[] {
  return dtos.map((dto) => RepositoryClient.fromServerDTO(dto));
}

/**
 * Client 实体列表转 Client DTO 列表
 */
export function convertRepositoryListToClient(
  repositories: RepositoryClient[],
): RepositoryContracts.RepositoryDTO[] {
  return repositories.map((repo) => repo.toClientDTO());
}

/**
 * Server DTO 列表转 Resource Client 列表
 */
export function convertResourceListFromServer(
  dtos: RepositoryContracts.ResourceServerDTO[],
): ResourceClient[] {
  return dtos.map((dto) => ResourceClient.fromServerDTO(dto));
}

/**
 * Resource Client 列表转 Client DTO 列表
 */
export function convertResourceListToClient(
  resources: ResourceClient[],
): RepositoryContracts.ResourceDTO[] {
  return resources.map((res) => res.toClientDTO());
}
```

---

## 4️⃣ 统一导出

**位置**: `packages/domain-client/src/repository/index.ts`

```typescript
// 聚合根
export { RepositoryClient } from './aggregates/RepositoryClient';

// 实体
export { ResourceClient } from './entities/ResourceClient';

// 工具
export * from './utils/dtoConverters';
```

---

## ✅ Domain Client 层检查清单

- [ ] 聚合根继承 AggregateRoot
- [ ] 提供 fromServerDTO 静态方法
- [ ] 日期类型显式转换 `new Date(...)`
- [ ] 数组/对象创建副本 `[...array]` `{...object}`
- [ ] 提供 toClientDTO 方法
- [ ] 提供前端常用的业务方法（isXxx, getXxx）
- [ ] 实体包含 repositoryUuid 外键
- [ ] 创建 DTO 转换工具函数

---

**下一步**: [[04-API_IMPLEMENTATION|API 实现]]
