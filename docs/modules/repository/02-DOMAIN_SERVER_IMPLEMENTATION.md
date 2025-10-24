---
title: Repository 模块 - Domain Server 实现指南
created: 2025-10-10
updated: 2025-10-10
tags:
  - repository
  - domain
  - server
  - ddd
category: 实现指南
---

# Repository 模块 - Domain Server 实现指南

> **DDD 原则**：领域层是业务逻辑的核心，独立于基础设施

---

## 📋 实现顺序

```
1. 聚合根 (AggregateRoot)
   ↓
2. 实体 (Entity)
   ↓
3. 仓储接口 (Repository Interface)
   ↓
4. 领域服务 (Domain Service)
   ↓
5. 统一导出
```

---

## 1️⃣ 聚合根实现

**位置**: `packages/domain-server/src/repository/aggregates/Repository.ts`

### 📐 规范

- ✅ 继承 `AggregateRoot` 基类
- ✅ 使用 private 构造函数 + 静态工厂方法
- ✅ 实现 `fromDTO` 和 `toDTO` 方法
- ✅ 所有业务逻辑封装在方法中
- ✅ 状态变更发布领域事件
- ✅ 使用值对象封装复杂属性

### 📝 示例代码

```typescript
import { AggregateRoot } from '@dailyuse/utils';
import { v4 as uuidv4 } from 'uuid';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * 仓库聚合根
 * Repository Aggregate Root
 *
 * @description
 * 负责管理仓库的完整生命周期
 */
export class Repository extends AggregateRoot {
  // ============ 私有属性 ============

  private _accountUuid: string;
  private _name: string;
  private _path: string;
  private _type: RepositoryContracts.RepositoryType;
  private _status: RepositoryContracts.RepositoryStatus;
  private _description: string | null;
  private _config: RepositoryContracts.RepositoryConfig;
  private _gitInfo: RepositoryContracts.GitInfo | null;
  private _syncStatus: RepositoryContracts.SyncStatus;
  private _lastSyncedAt: Date | null;
  private _relatedGoals: string[];
  private _tags: string[];
  private _stats: RepositoryContracts.RepositoryStats | null;

  // ============ 只读访问器 ============

  get accountUuid(): string {
    return this._accountUuid;
  }

  get name(): string {
    return this._name;
  }

  get path(): string {
    return this._path;
  }

  get type(): RepositoryContracts.RepositoryType {
    return this._type;
  }

  get status(): RepositoryContracts.RepositoryStatus {
    return this._status;
  }

  get description(): string | null {
    return this._description;
  }

  get config(): RepositoryContracts.RepositoryConfig {
    return this._config;
  }

  get gitInfo(): RepositoryContracts.GitInfo | null {
    return this._gitInfo;
  }

  get syncStatus(): RepositoryContracts.SyncStatus {
    return this._syncStatus;
  }

  get lastSyncedAt(): Date | null {
    return this._lastSyncedAt;
  }

  get relatedGoals(): readonly string[] {
    return Object.freeze([...this._relatedGoals]);
  }

  get tags(): readonly string[] {
    return Object.freeze([...this._tags]);
  }

  get stats(): RepositoryContracts.RepositoryStats | null {
    return this._stats;
  }

  // ============ 构造函数（私有）============

  /**
   * 私有构造函数
   * ⚠️ 不要直接 new，使用静态工厂方法
   */
  private constructor(
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
    this._accountUuid = accountUuid;
    this._name = name;
    this._path = path;
    this._type = type;
    this._status = status;
    this._description = description;
    this._config = config;
    this._gitInfo = gitInfo;
    this._syncStatus = syncStatus;
    this._lastSyncedAt = lastSyncedAt;
    this._relatedGoals = relatedGoals;
    this._tags = tags;
    this._stats = stats;
  }

  // ============ 静态工厂方法 ============

  /**
   * 创建新仓库
   * ⚠️ 这是创建新实例的唯一入口
   */
  static create(
    accountUuid: string,
    name: string,
    path: string,
    type: RepositoryContracts.RepositoryType,
    description?: string,
    config?: Partial<RepositoryContracts.RepositoryConfig>,
  ): Repository {
    // 验证
    if (!name || name.trim().length === 0) {
      throw new Error('Repository name is required');
    }
    if (!path || path.trim().length === 0) {
      throw new Error('Repository path is required');
    }

    const now = new Date();
    const uuid = uuidv4();

    // 使用默认配置 + 覆盖
    const finalConfig: RepositoryContracts.RepositoryConfig = {
      ...RepositoryContracts.DEFAULT_REPOSITORY_CONFIG,
      ...config,
    };

    const repository = new Repository(
      uuid,
      accountUuid,
      name.trim(),
      path.trim(),
      type,
      RepositoryContracts.RepositoryStatus.ACTIVE, // 默认活跃
      description?.trim() || null,
      finalConfig,
      null, // gitInfo 初始为空
      RepositoryContracts.SyncStatus.NOT_SYNCED,
      null, // lastSyncedAt
      [], // relatedGoals
      [], // tags
      null, // stats
      now, // createdAt
      now, // updatedAt
      1, // version
    );

    // 发布领域事件
    repository.addDomainEvent({
      eventType: 'RepositoryCreated',
      aggregateId: uuid,
      accountUuid,
      name,
      type,
      occurredAt: now,
    } as RepositoryContracts.RepositoryCreatedEvent);

    return repository;
  }

  /**
   * 从 DTO 重建实体
   * ⚠️ 用于从数据库/API 加载数据
   */
  static fromDTO(dto: RepositoryContracts.RepositoryServerDTO): Repository {
    return new Repository(
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
      dto.lastSyncedAt,
      [...dto.relatedGoals],
      [...dto.tags],
      dto.stats,
      dto.createdAt,
      dto.updatedAt,
      dto.version,
    );
  }

  // ============ 业务方法 ============

  /**
   * 更新仓库信息
   */
  update(updates: {
    name?: string;
    path?: string;
    description?: string;
    config?: Partial<RepositoryContracts.RepositoryConfig>;
    tags?: string[];
  }): void {
    const updatedFields: string[] = [];

    if (updates.name !== undefined && updates.name !== this._name) {
      if (!updates.name.trim()) {
        throw new Error('Repository name cannot be empty');
      }
      this._name = updates.name.trim();
      updatedFields.push('name');
    }

    if (updates.path !== undefined && updates.path !== this._path) {
      if (!updates.path.trim()) {
        throw new Error('Repository path cannot be empty');
      }
      this._path = updates.path.trim();
      updatedFields.push('path');
    }

    if (updates.description !== undefined) {
      this._description = updates.description?.trim() || null;
      updatedFields.push('description');
    }

    if (updates.config) {
      this._config = { ...this._config, ...updates.config };
      updatedFields.push('config');
    }

    if (updates.tags) {
      this._tags = [...updates.tags];
      updatedFields.push('tags');
    }

    if (updatedFields.length > 0) {
      this.markAsModified();

      // 发布领域事件
      this.addDomainEvent({
        eventType: 'RepositoryUpdated',
        aggregateId: this.uuid,
        accountUuid: this._accountUuid,
        updatedFields,
        occurredAt: new Date(),
      } as RepositoryContracts.RepositoryUpdatedEvent);
    }
  }

  /**
   * 激活仓库
   */
  activate(): void {
    if (this._status === RepositoryContracts.RepositoryStatus.ACTIVE) {
      return; // 已经是活跃状态
    }

    const oldStatus = this._status;
    this._status = RepositoryContracts.RepositoryStatus.ACTIVE;
    this.markAsModified();

    this.addDomainEvent({
      eventType: 'RepositoryStatusChanged',
      aggregateId: this.uuid,
      accountUuid: this._accountUuid,
      oldStatus,
      newStatus: this._status,
      occurredAt: new Date(),
    } as RepositoryContracts.RepositoryStatusChangedEvent);
  }

  /**
   * 归档仓库
   */
  archive(): void {
    if (this._status === RepositoryContracts.RepositoryStatus.ARCHIVED) {
      return;
    }

    const oldStatus = this._status;
    this._status = RepositoryContracts.RepositoryStatus.ARCHIVED;
    this.markAsModified();

    this.addDomainEvent({
      eventType: 'RepositoryStatusChanged',
      aggregateId: this.uuid,
      accountUuid: this._accountUuid,
      oldStatus,
      newStatus: this._status,
      occurredAt: new Date(),
    } as RepositoryContracts.RepositoryStatusChangedEvent);
  }

  /**
   * 关联目标
   */
  linkGoal(goalUuid: string): void {
    if (this._relatedGoals.includes(goalUuid)) {
      return; // 已经关联
    }

    this._relatedGoals.push(goalUuid);
    this.markAsModified();
  }

  /**
   * 取消关联目标
   */
  unlinkGoal(goalUuid: string): void {
    const index = this._relatedGoals.indexOf(goalUuid);
    if (index === -1) {
      return; // 未关联
    }

    this._relatedGoals.splice(index, 1);
    this.markAsModified();
  }

  /**
   * 更新同步状态
   */
  updateSyncStatus(syncStatus: RepositoryContracts.SyncStatus, lastSyncedAt?: Date): void {
    this._syncStatus = syncStatus;
    if (lastSyncedAt) {
      this._lastSyncedAt = lastSyncedAt;
    }
    this.markAsModified();

    if (syncStatus === RepositoryContracts.SyncStatus.SYNCED) {
      this.addDomainEvent({
        eventType: 'RepositorySynced',
        aggregateId: this.uuid,
        accountUuid: this._accountUuid,
        syncStatus,
        syncedAt: this._lastSyncedAt || new Date(),
      } as RepositoryContracts.RepositorySyncedEvent);
    }
  }

  /**
   * 更新 Git 信息
   */
  updateGitInfo(gitInfo: RepositoryContracts.GitInfo): void {
    this._gitInfo = gitInfo;
    this.markAsModified();
  }

  /**
   * 更新统计信息
   */
  updateStats(stats: RepositoryContracts.RepositoryStats): void {
    this._stats = stats;
    this.markAsModified();
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 Server DTO
   */
  toDTO(): RepositoryContracts.RepositoryServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      path: this._path,
      type: this._type,
      status: this._status,
      description: this._description,
      config: this._config,
      gitInfo: this._gitInfo,
      syncStatus: this._syncStatus,
      lastSyncedAt: this._lastSyncedAt,
      relatedGoals: [...this._relatedGoals],
      tags: [...this._tags],
      stats: this._stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }
}
```

### ⚠️ 易错点

❌ **错误 1**：使用 public 构造函数

```typescript
// 错误示例
export class Repository extends AggregateRoot {
  constructor(uuid: string, name: string) {
    // ❌ public
    super(uuid);
    this._name = name;
  }
}
```

✅ **正确**：使用 private 构造函数 + 静态工厂

```typescript
export class Repository extends AggregateRoot {
  private constructor(...) { ... }  // ✅ private

  static create(...) {              // ✅ 静态工厂
    return new Repository(...);
  }

  static fromDTO(...) {             // ✅ 从 DTO 重建
    return new Repository(...);
  }
}
```

❌ **错误 2**：直接暴露可变属性

```typescript
// 错误示例
export class Repository {
  public tags: string[]; // ❌ 可以外部修改
}
```

✅ **正确**：使用 private 属性 + getter

```typescript
export class Repository {
  private _tags: string[];

  get tags(): readonly string[] {
    // ✅ 只读
    return Object.freeze([...this._tags]);
  }
}
```

❌ **错误 3**：忘记发布领域事件

```typescript
// 错误示例
activate(): void {
  this._status = RepositoryStatus.ACTIVE;
  // ❌ 忘记发布事件
}
```

✅ **正确**：状态变更发布事件

```typescript
activate(): void {
  this._status = RepositoryStatus.ACTIVE;
  this.markAsModified();

  // ✅ 发布领域事件
  this.addDomainEvent({
    eventType: 'RepositoryStatusChanged',
    ...
  });
}
```

---

## 2️⃣ 实体实现

**位置**: `packages/domain-server/src/repository/entities/Resource.ts`

### 📐 规范

- ✅ 继承 `Entity` 基类
- ✅ 必须包含聚合根 ID
- ✅ 遵循与聚合根相同的模式
- ✅ 不发布领域事件（由聚合根负责）

### 📝 示例代码

```typescript
import { Entity } from '@dailyuse/utils';
import { v4 as uuidv4 } from 'uuid';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * 资源实体
 * Resource Entity
 */
export class Resource extends Entity {
  // ============ 私有属性 ============

  private _repositoryUuid: string; // ⚠️ 聚合根ID，必填
  private _accountUuid: string;
  private _name: string;
  private _path: string;
  private _type: RepositoryContracts.ResourceType;
  private _status: RepositoryContracts.ResourceStatus;
  private _size: number | null;
  private _mimeType: string | null;
  private _hash: string | null;
  private _parentUuid: string | null;
  private _description: string | null;
  private _tags: string[];
  private _metadata: Record<string, any> | null;

  // ============ 只读访问器 ============

  get repositoryUuid(): string {
    return this._repositoryUuid;
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get name(): string {
    return this._name;
  }

  get path(): string {
    return this._path;
  }

  get type(): RepositoryContracts.ResourceType {
    return this._type;
  }

  get status(): RepositoryContracts.ResourceStatus {
    return this._status;
  }

  get size(): number | null {
    return this._size;
  }

  get mimeType(): string | null {
    return this._mimeType;
  }

  get hash(): string | null {
    return this._hash;
  }

  get parentUuid(): string | null {
    return this._parentUuid;
  }

  get description(): string | null {
    return this._description;
  }

  get tags(): readonly string[] {
    return Object.freeze([...this._tags]);
  }

  get metadata(): Record<string, any> | null {
    return this._metadata ? { ...this._metadata } : null;
  }

  // ============ 构造函数（私有）============

  private constructor(
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
    this._repositoryUuid = repositoryUuid;
    this._accountUuid = accountUuid;
    this._name = name;
    this._path = path;
    this._type = type;
    this._status = status;
    this._size = size;
    this._mimeType = mimeType;
    this._hash = hash;
    this._parentUuid = parentUuid;
    this._description = description;
    this._tags = tags;
    this._metadata = metadata;
  }

  // ============ 静态工厂方法 ============

  /**
   * 创建新资源
   */
  static create(
    repositoryUuid: string,
    accountUuid: string,
    name: string,
    path: string,
    type: RepositoryContracts.ResourceType,
    options?: {
      size?: number;
      mimeType?: string;
      hash?: string;
      parentUuid?: string;
      description?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    },
  ): Resource {
    // 验证
    if (!repositoryUuid) {
      throw new Error('Repository UUID is required'); // ⚠️ 必须验证
    }
    if (!name.trim()) {
      throw new Error('Resource name is required');
    }

    const now = new Date();
    const uuid = uuidv4();

    return new Resource(
      uuid,
      repositoryUuid,
      accountUuid,
      name.trim(),
      path.trim(),
      type,
      RepositoryContracts.ResourceStatus.ACTIVE,
      options?.size || null,
      options?.mimeType || null,
      options?.hash || null,
      options?.parentUuid || null,
      options?.description?.trim() || null,
      options?.tags || [],
      options?.metadata || null,
      now,
      now,
      1,
    );
  }

  /**
   * 从 DTO 重建实体
   */
  static fromDTO(dto: RepositoryContracts.ResourceServerDTO): Resource {
    return new Resource(
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
      dto.createdAt,
      dto.updatedAt,
      dto.version,
    );
  }

  // ============ 业务方法 ============

  /**
   * 更新资源
   */
  update(updates: {
    name?: string;
    description?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): void {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('Resource name cannot be empty');
      }
      this._name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      this._description = updates.description?.trim() || null;
    }

    if (updates.tags) {
      this._tags = [...updates.tags];
    }

    if (updates.metadata) {
      this._metadata = { ...updates.metadata };
    }

    this.markAsModified();
  }

  /**
   * 归档资源
   */
  archive(): void {
    this._status = RepositoryContracts.ResourceStatus.ARCHIVED;
    this.markAsModified();
  }

  /**
   * 更新文件信息
   */
  updateFileInfo(size: number, hash: string, mimeType?: string): void {
    this._size = size;
    this._hash = hash;
    if (mimeType) {
      this._mimeType = mimeType;
    }
    this.markAsModified();
  }

  // ============ DTO 转换 ============

  toDTO(): RepositoryContracts.ResourceServerDTO {
    return {
      uuid: this.uuid,
      repositoryUuid: this._repositoryUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      path: this._path,
      type: this._type,
      status: this._status,
      size: this._size,
      mimeType: this._mimeType,
      hash: this._hash,
      parentUuid: this._parentUuid,
      description: this._description,
      tags: [...this._tags],
      metadata: this._metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }
}
```

---

## 3️⃣ 仓储接口定义

**位置**: `packages/domain-server/src/repository/repositories/IRepositoryRepository.ts`

### 📐 规范

- ✅ 接口名使用 `I` 前缀
- ✅ 只定义业务需要的查询方法
- ✅ 返回领域实体，不是 DTO
- ✅ 使用 Promise 返回值

### 📝 示例代码

```typescript
import type { Repository } from '../aggregates/Repository';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * 仓库仓储接口
 * Repository Repository Interface
 */
export interface IRepositoryRepository {
  /**
   * 保存仓库（创建或更新）
   */
  save(repository: Repository): Promise<void>;

  /**
   * 根据 UUID 查找仓库
   */
  findByUuid(uuid: string): Promise<Repository | null>;

  /**
   * 根据账户 UUID 查找所有仓库
   */
  findByAccountUuid(accountUuid: string): Promise<Repository[]>;

  /**
   * 根据路径查找仓库
   */
  findByPath(accountUuid: string, path: string): Promise<Repository | null>;

  /**
   * 根据状态查找仓库
   */
  findByStatus(
    accountUuid: string,
    status: RepositoryContracts.RepositoryStatus,
  ): Promise<Repository[]>;

  /**
   * 删除仓库
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查仓库是否存在
   */
  exists(uuid: string): Promise<boolean>;
}
```

### ⚠️ 易错点

❌ **错误**：仓储方法返回 DTO

```typescript
// 错误示例
interface IRepositoryRepository {
  findByUuid(uuid: string): Promise<RepositoryServerDTO>; // ❌
}
```

✅ **正确**：仓储方法返回领域实体

```typescript
interface IRepositoryRepository {
  findByUuid(uuid: string): Promise<Repository | null>; // ✅
}
```

---

## ✅ Domain Server 层检查清单

- [ ] 聚合根继承 AggregateRoot
- [ ] 使用 private 构造函数
- [ ] 提供 create 和 fromDTO 静态方法
- [ ] 所有属性 private + getter
- [ ] 业务方法调用 markAsModified()
- [ ] 状态变更发布领域事件
- [ ] 实体包含聚合根外键
- [ ] 仓储接口返回领域实体

---

**下一步**: [[03-DOMAIN_CLIENT_IMPLEMENTATION|Domain Client 实现]]
