# Domain-Server Repository 模块实现计划

## 🎯 实现目标

在 `packages/domain-server/src/repository` 中实现完整的领域层代码：

1. **聚合根实现**：RepositoryAggregate (实现 RepositoryServer 接口)
2. **实体实现**：Resource, ResourceReference, LinkedContent, RepositoryExplorer
3. **值对象实现**：RepositoryConfig, RepositoryStats, SyncStatus, GitInfo 等
4. **领域服务**：RepositoryDomainService (使用依赖注入的仓储接口)
5. **仓储接口定义**：IRepositoryRepository (由应用层/基础设施层实现)

## 📁 文件结构

```
packages/domain-server/src/repository/
├── aggregates/
│   └── RepositoryAggregate.ts          # 聚合根实现
├── entities/
│   ├── ResourceEntity.ts               # 资源实体
│   ├── ResourceReferenceEntity.ts      # 引用实体
│   ├── LinkedContentEntity.ts          # 关联内容实体
│   └── RepositoryExplorerEntity.ts     # 浏览器实体
├── value-objects/
│   ├── RepositoryConfig.ts             # 仓库配置值对象
│   ├── RepositoryStats.ts              # 统计信息值对象
│   ├── SyncStatus.ts                   # 同步状态值对象
│   ├── GitInfo.ts                      # Git 信息值对象
│   ├── GitStatusInfo.ts                # Git 状态值对象
│   ├── ResourceMetadata.ts             # 资源元数据值对象
│   ├── ResourceFilters.ts              # 资源过滤器值对象
│   └── ExplorerViewConfig.ts           # 浏览器视图配置值对象
├── services/
│   └── RepositoryDomainService.ts      # 领域服务
├── repositories/
│   └── IRepositoryRepository.ts        # 仓储接口（不是实现！）
└── index.ts                            # 导出
```

## 🏗️ 实现要点

### 1. 聚合根实现 (RepositoryAggregate)

```typescript
/**
 * RepositoryAggregate 实现 RepositoryServer 接口
 * 
 * 职责：
 * - 管理聚合内的所有实体（Repository、Resource、RepositoryExplorer）
 * - 执行业务逻辑（配置管理、同步、统计）
 * - 确保聚合内的一致性
 * - 触发领域事件
 */
export class RepositoryAggregate implements RepositoryServer {
  // 私有字段
  private _uuid: string;
  private _accountUuid: string;
  private _name: string;
  // ... 其他属性

  // 子实体集合
  private _resources: ResourceEntity[] = [];
  private _explorer?: RepositoryExplorerEntity;

  // 构造函数（私有，通过工厂方法创建）
  private constructor(params: { /* ... */ }) {
    this._uuid = params.uuid;
    // ...
  }

  // 工厂方法
  public static create(params: { /* ... */ }): RepositoryAggregate {
    const uuid = crypto.randomUUID();
    const now = Date.now();
    // 初始化逻辑
    return new RepositoryAggregate({ /* ... */ });
  }

  // 实现 RepositoryServer 接口的所有方法
  public get uuid(): string { return this._uuid; }
  
  public get resources(): ResourceEntity[] | null {
    return this._resources.length > 0 ? this._resources : null;
  }

  public addResource(resource: ResourceServer): void {
    if (!(resource instanceof ResourceEntity)) {
      throw new Error('Resource must be an instance of ResourceEntity');
    }
    this._resources.push(resource);
    this.incrementResourceCount(resource.type);
  }

  // ... 其他方法
}
```

### 2. 实体实现 (ResourceEntity)

```typescript
/**
 * ResourceEntity 实现 ResourceServer 接口
 * 
 * 职责：
 * - 管理资源的生命周期
 * - 管理子实体（Reference、LinkedContent）
 * - 执行资源相关的业务逻辑
 */
export class ResourceEntity implements ResourceServer {
  private _uuid: string;
  private _references: ResourceReferenceEntity[] = [];
  private _linkedContents: LinkedContentEntity[] = [];

  private constructor(params: { /* ... */ }) { /* ... */ }

  public static create(params: { /* ... */ }): ResourceEntity {
    // 创建新资源
  }

  public static fromServerDTO(dto: ResourceServerDTO): ResourceEntity {
    // 从 DTO 重建（递归子实体）
  }

  public toServerDTO(includeChildren = false): ResourceServerDTO {
    // 转换为 DTO（递归子实体）
  }

  public addReference(reference: ResourceReferenceServer): void {
    if (!(reference instanceof ResourceReferenceEntity)) {
      throw new Error('Reference must be an instance of ResourceReferenceEntity');
    }
    this._references.push(reference);
  }

  // ... 其他方法
}
```

### 3. 值对象实现 (RepositoryConfig)

```typescript
/**
 * RepositoryConfig 值对象
 * 
 * 特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 轻量级
 */
export class RepositoryConfig {
  // 所有属性只读
  public readonly enableGit: boolean;
  public readonly autoSync: boolean;
  public readonly syncInterval: number | null;
  // ...

  constructor(params: {
    enableGit: boolean;
    autoSync: boolean;
    // ...
  }) {
    this.enableGit = params.enableGit;
    this.autoSync = params.autoSync;
    // ...
    Object.freeze(this); // 确保不可变
  }

  // 创建新的值对象（而不是修改）
  public with(changes: Partial<RepositoryConfigParams>): RepositoryConfig {
    return new RepositoryConfig({
      enableGit: changes.enableGit ?? this.enableGit,
      autoSync: changes.autoSync ?? this.autoSync,
      // ...
    });
  }

  // 相等性比较
  public equals(other: RepositoryConfig): boolean {
    return (
      this.enableGit === other.enableGit &&
      this.autoSync === other.autoSync &&
      // ...
    );
  }

  // 转换为 contract 接口
  public toContract(): RepositoryConfig {
    return {
      enableGit: this.enableGit,
      autoSync: this.autoSync,
      // ...
    };
  }

  // 从 contract 接口创建
  public static fromContract(config: RepositoryConfig): RepositoryConfig {
    return new RepositoryConfig(config);
  }
}
```

### 4. 领域服务 (RepositoryDomainService)

```typescript
/**
 * RepositoryDomainService
 * 
 * 职责：
 * - 跨聚合根的业务逻辑
 * - 使用仓储接口进行持久化
 * - 协调多个聚合根
 * - 触发领域事件
 */
export class RepositoryDomainService {
  constructor(
    private readonly repositoryRepo: IRepositoryRepository,
    // 可以注入其他仓储或服务
  ) {}

  /**
   * 创建新的仓库
   */
  public async createRepository(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfigParams>;
    initializeGit?: boolean;
  }): Promise<RepositoryAggregate> {
    // 1. 创建聚合根
    const repository = RepositoryAggregate.create(params);

    // 2. 可选：初始化 Git
    if (params.initializeGit) {
      await repository.enableGit();
    }

    // 3. 持久化
    await this.repositoryRepo.save(repository);

    // 4. 触发领域事件
    // eventBus.publish(new RepositoryCreatedEvent(...));

    return repository;
  }

  /**
   * 添加资源到仓库
   */
  public async addResourceToRepository(
    repositoryUuid: string,
    resourceParams: { /* ... */ },
  ): Promise<ResourceEntity> {
    // 1. 获取聚合根
    const repository = await this.repositoryRepo.findById(repositoryUuid);
    if (!repository) {
      throw new Error('Repository not found');
    }

    // 2. 通过聚合根创建资源
    const resource = repository.createResource(resourceParams);

    // 3. 添加到聚合根
    repository.addResource(resource);

    // 4. 保存聚合根（级联保存资源）
    await this.repositoryRepo.save(repository);

    return resource;
  }

  /**
   * 同步仓库
   */
  public async syncRepository(
    repositoryUuid: string,
    type: 'pull' | 'push' | 'both',
    force = false,
  ): Promise<void> {
    const repository = await this.repositoryRepo.findById(repositoryUuid);
    if (!repository) {
      throw new Error('Repository not found');
    }

    await repository.startSync(type, force);
    await this.repositoryRepo.save(repository);
  }

  // ... 其他领域服务方法
}
```

### 5. 仓储接口定义 (IRepositoryRepository)

```typescript
/**
 * IRepositoryRepository 仓储接口
 * 
 * 职责：
 * - 定义持久化操作的契约
 * - 由基础设施层实现（不在 domain 层实现！）
 * - 使用依赖注入
 */
export interface IRepositoryRepository {
  /**
   * 保存聚合根（级联保存所有子实体）
   */
  save(repository: RepositoryAggregate): Promise<void>;

  /**
   * 通过 UUID 查找聚合根
   * @param options.includeChildren 是否加载子实体
   */
  findById(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<RepositoryAggregate | null>;

  /**
   * 通过账户 UUID 查找所有仓库
   */
  findByAccountUuid(accountUuid: string): Promise<RepositoryAggregate[]>;

  /**
   * 删除聚合根
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查仓库是否存在
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 通过路径查找仓库
   */
  findByPath(path: string): Promise<RepositoryAggregate | null>;
}
```

## 🔄 转换逻辑

### DTO → Entity (fromServerDTO)

```typescript
public static fromServerDTO(dto: RepositoryServerDTO): RepositoryAggregate {
  const repository = new RepositoryAggregate({
    uuid: dto.uuid,
    accountUuid: dto.accountUuid,
    // ... 其他属性
    config: RepositoryConfigValueObject.fromContract(dto.config),
    stats: RepositoryStatsValueObject.fromContract(dto.stats),
  });

  // 递归创建子实体
  if (dto.resources) {
    repository._resources = dto.resources.map(resDto =>
      ResourceEntity.fromServerDTO(resDto)
    );
  }

  if (dto.explorer) {
    repository._explorer = RepositoryExplorerEntity.fromServerDTO(dto.explorer);
  }

  return repository;
}
```

### Entity → DTO (toServerDTO)

```typescript
public toServerDTO(includeChildren = false): RepositoryServerDTO {
  const dto: RepositoryServerDTO = {
    uuid: this._uuid,
    accountUuid: this._accountUuid,
    // ... 其他属性
    config: this._config.toContract(),
    stats: this._stats.toContract(),
    createdAt: this._createdAt,
    updatedAt: this._updatedAt,
  };

  // 可选：递归包含子实体
  if (includeChildren) {
    dto.resources = this._resources.length > 0
      ? this._resources.map(r => r.toServerDTO(true))
      : null;
    dto.explorer = this._explorer?.toServerDTO(true) ?? null;
  }

  return dto;
}
```

## 📝 命名约定

1. **聚合根**：`XxxAggregate` (如 RepositoryAggregate)
2. **实体**：`XxxEntity` (如 ResourceEntity)
3. **值对象**：`XxxValueObject` 或直接 `Xxx` (如 RepositoryConfig)
4. **领域服务**：`XxxDomainService` (如 RepositoryDomainService)
5. **仓储接口**：`IXxxRepository` (如 IRepositoryRepository)

## ✅ 实现检查清单

### 聚合根 (RepositoryAggregate)
- [ ] 实现 RepositoryServer 接口的所有属性
- [ ] 实现所有 getter 方法
- [ ] 实现工厂方法：create(), createResource(), createExplorer()
- [ ] 实现子实体管理：add, remove, get 方法
- [ ] 实现业务方法：updateConfig, enableGit, startSync 等
- [ ] 实现转换方法：toServerDTO(), toPersistenceDTO(), fromServerDTO(), fromPersistenceDTO()
- [ ] 确保子实体是私有的，只能通过方法访问
- [ ] 添加必要的验证逻辑

### 实体 (ResourceEntity 等)
- [ ] 实现对应的 Server 接口
- [ ] 实现工厂方法
- [ ] 实现子实体管理（如果有）
- [ ] 实现业务方法
- [ ] 实现转换方法
- [ ] 添加验证逻辑

### 值对象
- [ ] 所有属性 readonly
- [ ] 使用 Object.freeze() 确保不可变
- [ ] 实现 with() 方法（创建新实例而不是修改）
- [ ] 实现 equals() 方法（值比较）
- [ ] 实现 toContract() 和 fromContract() 方法

### 领域服务
- [ ] 通过构造函数注入仓储接口
- [ ] 实现跨聚合根的业务逻辑
- [ ] 使用仓储接口进行持久化
- [ ] 添加适当的错误处理

### 仓储接口
- [ ] 只定义接口，不实现
- [ ] 所有方法返回 Promise
- [ ] 方法签名清晰明确
- [ ] 添加 JSDoc 注释

## 🎯 关键原则

1. **聚合根是唯一入口**：外部只能通过聚合根访问子实体
2. **值对象不可变**：修改时创建新实例
3. **依赖注入**：领域服务使用仓储接口，不直接依赖实现
4. **单一职责**：每个类只负责一件事
5. **DDD 原则**：严格遵守 DDD 的聚合、实体、值对象概念
6. **类型安全**：充分利用 TypeScript 类型系统
7. **错误处理**：业务逻辑错误抛出明确的异常

## 📚 参考资料

- DDD_AGGREGATE_ROOT_REDESIGN.md - DDD 设计文档
- DDD_AGGREGATE_ROOT_USAGE_GUIDE.md - 使用指南
- packages/contracts/src/modules/repository/ - Contract 接口定义

---

**计划版本**：v1.0  
**创建时间**：2025-10-09  
**状态**：待实现
