# Repository Module Domain-Server Refactoring Plan
# Repository 模块 Domain-Server 层重构计划

## 📋 重构目标

1. ✅ **contracts 包添加值对象定义** - 已完成
   - 创建 `value-objects/` 文件夹
   - 添加 RepositoryConfig, RepositoryStats, SyncStatus, GitInfo 类型定义
   - 包含 Server/Client/Persistence DTO

2. 🔄 **domain-server 继承基础类** - 进行中
   - 聚合根继承 `AggregateRoot`
   - 实体继承 `Entity`
   - 值对象继承 `ValueObject`

3. 🔄 **移除类名后缀** - 进行中
   - `RepositoryAggregate` → `Repository`
   - `ResourceEntity` → `Resource`
   - `RepositoryExplorerEntity` → `RepositoryExplorer`
   - `ResourceReferenceEntity` → `ResourceReference`
   - `LinkedContentEntity` → `LinkedContent`

4. ✅ **修复 toServerDTO 参数问题** - 已完成
   - `RepositoryExplorerEntity.toServerDTO()` 不接受参数

---

## 🏗️ 基础类结构

### AggregateRoot (from @dailyuse/utils)
```typescript
export abstract class AggregateRoot extends Entity {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(uuid: string) {
    super(uuid);
  }

  get domainEvents(): ReadonlyArray<DomainEvent> { ... }
  protected addDomainEvent(event: DomainEvent): void { ... }
  clearDomainEvents(): void { ... }
  getUncommittedDomainEvents(): DomainEvent[] { ... }
}
```

### Entity (from @dailyuse/utils)
```typescript
export abstract class Entity {
  protected constructor(protected readonly _uuid: string) {}

  get uuid(): string {
    return this._uuid!;
  }

  equals(other: Entity): boolean { ... }

  protected static generateUUID(): string {
    return generateUUID();
  }
}
```

### ValueObject (from @dailyuse/utils)
```typescript
export abstract class ValueObject {
  abstract equals(other: ValueObject): boolean;
}
```

---

## 🔄 重构细节

### 1. 聚合根：RepositoryAggregate → Repository

**重构前**:
```typescript
export class RepositoryAggregate implements IRepositoryServer {
  private _uuid: string;
  // ...
  
  private constructor(params: {
    uuid: string;
    // ...
  }) {
    this._uuid = params.uuid;
    // ...
  }

  public static create(params: {
    accountUuid: string;
    name: string;
    // ...
  }): RepositoryAggregate {
    const uuid = crypto.randomUUID();
    // ...
    return new RepositoryAggregate({ uuid, ... });
  }
}
```

**重构后**:
```typescript
import { AggregateRoot } from '@dailyuse/utils';

export class Repository extends AggregateRoot implements IRepositoryServer {
  // 移除 private _uuid: string; (已在基类中)
  
  private constructor(params: {
    uuid: string;
    // ...
  }) {
    super(params.uuid); // 调用基类构造函数
    // 不再手动设置 _uuid
  }

  public static create(params: {
    accountUuid: string;
    name: string;
    // ...
  }): Repository {
    const uuid = Repository.generateUUID(); // 使用基类方法
    // ...
    return new Repository({ uuid, ... });
  }

  // uuid getter 已在基类中定义，无需重写
}
```

**关键变更**:
- ✅ 继承 `AggregateRoot`
- ✅ 使用 `super(uuid)` 初始化
- ✅ 使用 `Repository.generateUUID()` 生成 UUID
- ✅ 移除 `private _uuid` 字段（基类已有）
- ✅ 移除 `uuid` getter（基类已有）
- ✅ 类名改为 `Repository`

---

### 2. 实体：ResourceEntity → Resource

**重构前**:
```typescript
export class ResourceEntity implements IResourceServer {
  private _uuid: string;
  // ...
  
  private constructor(params: {
    uuid: string;
    // ...
  }) {
    this._uuid = params.uuid;
    // ...
  }

  public static create(params: { ... }): ResourceEntity {
    const uuid = crypto.randomUUID();
    return new ResourceEntity({ uuid, ... });
  }

  public get uuid(): string {
    return this._uuid;
  }
}
```

**重构后**:
```typescript
import { Entity } from '@dailyuse/utils';

export class Resource extends Entity implements IResourceServer {
  // 移除 private _uuid: string;
  
  private constructor(params: {
    uuid: string;
    // ...
  }) {
    super(params.uuid); // 调用基类构造函数
    // ...
  }

  public static create(params: { ... }): Resource {
    const uuid = Resource.generateUUID(); // 使用基类方法
    return new Resource({ uuid, ... });
  }

  // uuid getter 已在基类中，无需重写
}
```

**关键变更**:
- ✅ 继承 `Entity`
- ✅ 使用 `super(uuid)` 初始化
- ✅ 使用 `Resource.generateUUID()` 生成 UUID
- ✅ 移除 `private _uuid` 字段
- ✅ 移除 `uuid` getter
- ✅ 类名改为 `Resource`

**同样适用于**:
- `RepositoryExplorerEntity` → `RepositoryExplorer`
- `ResourceReferenceEntity` → `ResourceReference`
- `LinkedContentEntity` → `LinkedContent`

---

### 3. 值对象：RepositoryConfig, RepositoryStats

**重构前**:
```typescript
export class RepositoryConfig {
  private readonly _enableGit: boolean;
  // ...

  private constructor(params: { ... }) {
    this._enableGit = params.enableGit;
    // ...
    Object.freeze(this);
  }

  // 缺少 equals 方法
}
```

**重构后**:
```typescript
import { ValueObject } from '@dailyuse/utils';

export class RepositoryConfig extends ValueObject {
  private readonly _enableGit: boolean;
  // ...

  private constructor(params: { ... }) {
    super(); // 调用基类构造函数
    this._enableGit = params.enableGit;
    // ...
    Object.freeze(this);
  }

  // 实现抽象方法
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RepositoryConfig)) {
      return false;
    }
    return (
      this._enableGit === other._enableGit &&
      this._autoSync === other._autoSync &&
      // ... 比较所有字段
    );
  }
}
```

**关键变更**:
- ✅ 继承 `ValueObject`
- ✅ 添加 `super()` 调用
- ✅ 实现 `equals()` 方法（抽象方法）
- ✅ 保持不可变性（`Object.freeze()`）

---

## 📝 需要修改的文件清单

### Domain-Server 包

1. **聚合根** (1 个文件):
   - `aggregates/RepositoryAggregate.ts` → `aggregates/Repository.ts`

2. **实体** (4 个文件):
   - `entities/ResourceEntity.ts` → `entities/Resource.ts`
   - `entities/RepositoryExplorerEntity.ts` → `entities/RepositoryExplorer.ts`
   - `entities/ResourceReferenceEntity.ts` → `entities/ResourceReference.ts`
   - `entities/LinkedContentEntity.ts` → `entities/LinkedContent.ts`

3. **值对象** (2 个文件):
   - `value-objects/RepositoryConfig.ts` (继承 ValueObject)
   - `value-objects/RepositoryStats.ts` (继承 ValueObject)

4. **服务** (1 个文件):
   - `services/RepositoryDomainService.ts` (更新类名引用)

5. **接口** (1 个文件):
   - `repositories/IRepositoryRepository.ts` (更新类名引用)

6. **模块导出** (1 个文件):
   - `index.ts` (更新所有导出的类名)

**总计**: 10 个文件需要修改

---

## ⚠️ 破坏性变更

### 导入语句变更

**之前**:
```typescript
import { RepositoryAggregate } from '@dailyuse/domain-server/repository';
import { ResourceEntity } from '@dailyuse/domain-server/repository';
```

**之后**:
```typescript
import { Repository } from '@dailyuse/domain-server/repository';
import { Resource } from '@dailyuse/domain-server/repository';
```

### 类型引用变更

所有使用这些类的地方都需要更新：
- `RepositoryAggregate` → `Repository`
- `ResourceEntity` → `Resource`
- 其他类名后缀移除

---

## ✅ 验证清单

重构完成后需要验证：

- [ ] 所有类正确继承基础类
- [ ] `uuid` 字段和 getter 已移除（使用基类）
- [ ] 使用 `generateUUID()` 生成 UUID
- [ ] 构造函数调用 `super(uuid)` 或 `super()`
- [ ] 值对象实现 `equals()` 方法
- [ ] 所有导入语句更新
- [ ] 所有类型引用更新
- [ ] TypeScript 编译无错误
- [ ] 单元测试通过（如果存在）

---

## 🚀 执行步骤

### 步骤 1: 重构聚合根
1. 重命名文件 `RepositoryAggregate.ts` → `Repository.ts`
2. 类名改为 `Repository`
3. 继承 `AggregateRoot`
4. 移除 `_uuid` 字段和 getter
5. 使用 `super(uuid)` 和 `generateUUID()`

### 步骤 2: 重构实体
1. 重命名 4 个实体文件
2. 类名移除 `Entity` 后缀
3. 继承 `Entity`
4. 移除 `_uuid` 字段和 getter
5. 使用 `super(uuid)` 和 `generateUUID()`

### 步骤 3: 重构值对象
1. 修改 `RepositoryConfig.ts` 和 `RepositoryStats.ts`
2. 继承 `ValueObject`
3. 实现 `equals()` 方法
4. 添加 `super()` 调用

### 步骤 4: 更新引用
1. 更新 `RepositoryDomainService.ts` 中的类名引用
2. 更新 `IRepositoryRepository.ts` 中的类名引用
3. 更新 `index.ts` 导出

### 步骤 5: 验证
1. 运行 TypeScript 编译器
2. 检查所有错误
3. 运行测试（如果存在）

---

## 💡 建议

由于这是一次较大的重构，建议：

1. **逐步进行**: 先重构一个类，验证无误后再继续
2. **分支操作**: 在单独的 git 分支中进行重构
3. **保留兼容**: 考虑暂时保留旧类名作为别名，逐步迁移
4. **文档更新**: 更新相关文档，说明新的类名

---

## 📌 重构优先级

**高优先级** (立即重构):
- ✅ 修复 `toServerDTO` 参数问题 - 已完成
- ✅ contracts 添加值对象定义 - 已完成
- 🔄 聚合根继承 `AggregateRoot` - 进行中

**中优先级** (后续重构):
- 实体继承 `Entity`
- 值对象继承 `ValueObject`

**低优先级** (可选):
- 移除类名后缀（破坏性变更，影响范围大）

---

## ❓ 需要确认的问题

1. **是否立即执行完整重构？**
   - 选项 A: 立即重构所有类（需要更新大量引用）
   - 选项 B: 分阶段重构（先继承基类，类名后续再改）

2. **类名后缀是否必须移除？**
   - 移除后缀会导致大量破坏性变更
   - 可以考虑保留后缀，只继承基类

3. **是否需要兼容性处理？**
   - 例如导出类型别名: `export type RepositoryAggregate = Repository`

**请确认你希望如何进行重构！**
