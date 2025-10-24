# Domain-Server Repository Module Refactoring Script

# 领域层-服务端 Repository 模块重构脚本

## 📋 重构概览

本脚本详细说明如何重构 domain-server/repository 模块：

1. 聚合根、实体继承基础类（AggregateRoot, Entity）
2. 值对象继承 ValueObject
3. 移除类名后缀（Aggregate, Entity）
4. 更新所有引用

---

## 🔄 重构步骤

### 步骤 1: 重构聚合根 (Repository)

**文件**: `aggregates/RepositoryAggregate.ts` → `aggregates/Repository.ts`

**关键变更**:

1. 类名: `RepositoryAggregate` → `Repository`
2. 继承: `implements IRepositoryServer` → `extends AggregateRoot implements IRepositoryServer`
3. 移除 `private _uuid: string` 字段
4. 移除 `uuid` getter（基类已有）
5. 构造函数: 添加 `super(params.uuid)`
6. UUID 生成: `crypto.randomUUID()` → `Repository.generateUUID()`

### 步骤 2: 重构实体 (Resource, RepositoryExplorer, ResourceReference, LinkedContent)

**文件重命名**:

- `entities/ResourceEntity.ts` → `entities/Resource.ts`
- `entities/RepositoryExplorerEntity.ts` → `entities/RepositoryExplorer.ts`
- `entities/ResourceReferenceEntity.ts` → `entities/ResourceReference.ts`
- `entities/LinkedContentEntity.ts` → `entities/LinkedContent.ts`

**关键变更** (每个实体):

1. 类名: 移除 `Entity` 后缀
2. 继承: `implements IXxxServer` → `extends Entity implements IXxxServer`
3. 移除 `private _uuid: string` 字段
4. 移除 `uuid` getter
5. 构造函数: 添加 `super(params.uuid)`
6. UUID 生成: `crypto.randomUUID()` → `ClassName.generateUUID()`

### 步骤 3: 重构值对象 (RepositoryConfig, RepositoryStats)

**文件**:

- `value-objects/RepositoryConfig.ts`
- `value-objects/RepositoryStats.ts`

**关键变更**:

1. 继承: `export class RepositoryConfig` → `export class RepositoryConfig extends ValueObject`
2. 构造函数: 添加 `super()`
3. 实现 `equals()` 方法（抽象方法）
4. 保持不可变性（`Object.freeze()`）

### 步骤 4: 更新服务和仓储接口

**文件**:

- `services/RepositoryDomainService.ts`
- `repositories/IRepositoryRepository.ts`

**关键变更**:

- 所有 `RepositoryAggregate` → `Repository`
- 所有 `ResourceEntity` → `Resource`
- 所有 `RepositoryExplorerEntity` → `RepositoryExplorer`
- 所有 `ResourceReferenceEntity` → `ResourceReference`
- 所有 `LinkedContentEntity` → `LinkedContent`

### 步骤 5: 更新模块导出

**文件**: `index.ts`

**变更**:

```typescript
// 旧导出
export { RepositoryAggregate } from './aggregates/RepositoryAggregate';
export { ResourceEntity } from './entities/ResourceEntity';
// ...

// 新导出
export { Repository } from './aggregates/Repository';
export { Resource } from './entities/Resource';
// ...
```

---

## ⚠️ 注意事项

1. **Git 操作**: 使用 `git mv` 重命名文件以保留历史记录
2. **逐步验证**: 每完成一个类的重构后，运行 TypeScript 编译检查
3. **测试**: 重构完成后运行所有相关测试

---

## 📝 执行命令

```bash
# 1. 重命名聚合根
git mv packages/domain-server/src/repository/aggregates/RepositoryAggregate.ts packages/domain-server/src/repository/aggregates/Repository.ts

# 2. 重命名实体
git mv packages/domain-server/src/repository/entities/ResourceEntity.ts packages/domain-server/src/repository/entities/Resource.ts
git mv packages/domain-server/src/repository/entities/RepositoryExplorerEntity.ts packages/domain-server/src/repository/entities/RepositoryExplorer.ts
git mv packages/domain-server/src/repository/entities/ResourceReferenceEntity.ts packages/domain-server/src/repository/entities/ResourceReference.ts
git mv packages/domain-server/src/repository/entities/LinkedContentEntity.ts packages/domain-server/src/repository/entities/LinkedContent.ts
```

---

现在开始执行重构...
