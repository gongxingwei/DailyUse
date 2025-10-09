# DDD 聚合根设计修正方案

## 📋 问题分析

### 问题1：聚合根缺少子实体管理

**原设计问题**：
```typescript
❌ export interface RepositoryServer {
  uuid: string;
  name: string;
  // ... 只有自己的属性，没有子实体
}
```

**DDD 原则**：
> 聚合根应该作为事务边界，统一管理其下的所有子实体。外部只能通过聚合根访问子实体。

### 问题2：缺少工厂方法

**原设计问题**：
```typescript
❌ // 需要手动 new 或调用构造函数
const repo = new RepositoryServerImpl({ ... });
```

**DDD 原则**：
> 应该提供工厂方法，封装复杂的创建逻辑，使创建过程更简洁和类型安全。

---

## ✅ 修正方案

### 1. 聚合根包含子实体集合

#### Repository 聚合根结构

```typescript
export interface RepositoryServer {
  // 基础属性
  uuid: string;
  name: string;
  // ...
  
  // ===== 子实体集合（聚合根统一管理） =====
  resources?: ResourceServer[] | null;          // 资源列表
  explorer?: RepositoryExplorerServer | null;   // 浏览器配置
  
  // ===== 子实体管理方法 =====
  addResource(resource: ResourceServer): void;
  removeResource(uuid: string): ResourceServer | null;
  getResource(uuid: string): ResourceServer | null;
  getAllResources(): ResourceServer[];
  getResourcesByType(type: ResourceType): ResourceServer[];
  
  setExplorer(explorer: RepositoryExplorerServer): void;
  getExplorer(): RepositoryExplorerServer | null;
}
```

#### Resource 实体结构（也有子实体）

```typescript
export interface ResourceServer {
  // 基础属性
  uuid: string;
  name: string;
  // ...
  
  // ===== 子实体集合 =====
  references?: ResourceReferenceServer[] | null;      // 引用列表
  linkedContents?: LinkedContentServer[] | null;      // 关联内容列表
  
  // ===== 子实体管理方法 =====
  addReference(reference: ResourceReferenceServer): void;
  removeReference(uuid: string): ResourceReferenceServer | null;
  getAllReferences(): ResourceReferenceServer[];
  
  addLinkedContent(content: LinkedContentServer): void;
  removeLinkedContent(uuid: string): LinkedContentServer | null;
  getAllLinkedContents(): LinkedContentServer[];
}
```

### 2. DTO 包含子实体 DTO

```typescript
export interface RepositoryServerDTO {
  uuid: string;
  name: string;
  // ... 其他属性
  
  // ===== 子实体 DTO（可选加载，懒加载） =====
  resources?: ResourceServerDTO[] | null;
  explorer?: RepositoryExplorerServerDTO | null;
}

export interface ResourceServerDTO {
  uuid: string;
  name: string;
  // ... 其他属性
  
  // ===== 子实体 DTO =====
  references?: ResourceReferenceServerDTO[] | null;
  linkedContents?: LinkedContentServerDTO[] | null;
}
```

### 3. 递归转换子实体

```typescript
export interface RepositoryServer {
  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false，懒加载）
   */
  toServerDTO(includeChildren?: boolean): RepositoryServerDTO;
  
  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: RepositoryServerDTO): RepositoryServer;
}
```

**实现示例**：
```typescript
class RepositoryServerImpl implements RepositoryServer {
  // ...
  
  toServerDTO(includeChildren = false): RepositoryServerDTO {
    const dto: RepositoryServerDTO = {
      uuid: this.uuid,
      name: this.name,
      // ... 其他属性
    };
    
    // 递归转换子实体
    if (includeChildren && this.resources) {
      dto.resources = this.resources.map(r => r.toServerDTO(true));
    }
    
    if (includeChildren && this.explorer) {
      dto.explorer = this.explorer.toServerDTO();
    }
    
    return dto;
  }
  
  static fromServerDTO(dto: RepositoryServerDTO): RepositoryServer {
    const repo = new RepositoryServerImpl({
      uuid: dto.uuid,
      name: dto.name,
      // ... 其他属性
    });
    
    // 递归创建子实体
    if (dto.resources) {
      repo.resources = dto.resources.map(r => ResourceServer.fromServerDTO(r));
    }
    
    if (dto.explorer) {
      repo.explorer = RepositoryExplorerServer.fromServerDTO(dto.explorer);
    }
    
    return repo;
  }
}
```

### 4. 添加工厂方法

```typescript
export interface RepositoryServer {
  // ===== 工厂方法（创建新实体） =====
  
  /**
   * 创建新的 Repository 聚合根（静态工厂方法）
   */
  create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfig>;
    initializeGit?: boolean;
  }): RepositoryServer;
  
  /**
   * 创建子实体：Resource（通过聚合根创建）
   */
  createResource(params: {
    name: string;
    type: ResourceType;
    path: string;
    content?: string | Uint8Array;
    description?: string;
    tags?: string[];
  }): ResourceServer;
  
  /**
   * 创建子实体：RepositoryExplorer
   */
  createExplorer(params: {
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorerServer;
}
```

**使用示例**：
```typescript
// ✅ 使用工厂方法创建聚合根
const repo = RepositoryServer.create({
  accountUuid: 'account-123',
  name: 'My Repository',
  type: RepositoryType.LOCAL,
  path: '/path/to/repo',
  description: 'A test repository',
  initializeGit: true,
});

// ✅ 通过聚合根创建子实体
const resource = repo.createResource({
  name: 'document.md',
  type: ResourceType.MARKDOWN,
  path: '/docs/document.md',
  tags: ['document', 'markdown'],
});

// ✅ 添加到聚合根
repo.addResource(resource);

// ✅ 通过子实体创建孙实体
const reference = resource.createReference({
  targetResourceUuid: 'target-uuid',
  referenceType: 'link',
  description: 'Reference to another resource',
});

resource.addReference(reference);
```

---

## 🏗️ 架构层次关系

```
Repository (聚合根)
├── resources: ResourceServer[]
│   ├── references: ResourceReferenceServer[]
│   └── linkedContents: LinkedContentServer[]
└── explorer: RepositoryExplorerServer
```

### 访问规则

1. ✅ **外部只能通过聚合根访问**：
   ```typescript
   // ✅ 正确：通过聚合根访问
   const repo = await repositoryService.getById('repo-uuid');
   const resource = repo.getResource('resource-uuid');
   
   // ❌ 错误：直接访问子实体
   const resource = await resourceService.getById('resource-uuid');
   ```

2. ✅ **子实体修改通过聚合根提交**：
   ```typescript
   // ✅ 正确：通过聚合根修改
   const repo = await repositoryService.getById('repo-uuid');
   const resource = repo.getResource('resource-uuid');
   resource.updateContent('new content');
   await repositoryService.save(repo); // 保存整个聚合根
   
   // ❌ 错误：直接保存子实体
   await resourceService.save(resource);
   ```

3. ✅ **事务边界在聚合根**：
   ```typescript
   // ✅ 正确：一个事务保存整个聚合
   await db.transaction(async (tx) => {
     await repositoryRepo.save(repo, tx);
     // 子实体自动保存
   });
   ```

---

## 📡 RESTful API 设计（DDD 风格）

### ✅ 正确的 API 设计（只暴露聚合根）

```typescript
// ============ Repository 聚合根 API ============

// 获取 Repository（可选加载子实体）
GET /api/repositories/:id?include=resources,explorer
Response: {
  uuid: "repo-123",
  name: "My Repository",
  resources: [
    {
      uuid: "resource-1",
      name: "doc.md",
      references: [ ... ],      // 孙实体
      linkedContents: [ ... ]   // 孙实体
    }
  ],
  explorer: { ... }
}

// 创建 Repository
POST /api/repositories
Body: { name, type, path, ... }
Response: RepositoryServerDTO

// 更新 Repository
PATCH /api/repositories/:id
Body: { name?, description?, ... }
Response: RepositoryServerDTO

// 删除 Repository（级联删除子实体）
DELETE /api/repositories/:id

// ============ 子实体操作（通过聚合根） ============

// 添加 Resource 到 Repository
POST /api/repositories/:repoId/resources
Body: { name, type, path, ... }
Response: ResourceServerDTO

// 更新 Resource（通过聚合根）
PATCH /api/repositories/:repoId/resources/:resourceId
Body: { name?, description?, ... }
Response: ResourceServerDTO

// 删除 Resource（从聚合根移除）
DELETE /api/repositories/:repoId/resources/:resourceId

// 添加 Reference 到 Resource
POST /api/repositories/:repoId/resources/:resourceId/references
Body: { targetResourceUuid, referenceType, ... }
Response: ResourceReferenceServerDTO
```

### ❌ 错误的 API 设计（直接暴露子实体）

```typescript
// ❌ 不应该直接访问子实体
GET /api/resources/:id
GET /api/resource-references/:id
GET /api/linked-contents/:id

// ❌ 不应该独立操作子实体
POST /api/resources
PATCH /api/resources/:id
DELETE /api/resources/:id
```

---

## 🔄 数据加载策略

### 1. 懒加载（Lazy Loading）

```typescript
// 只加载聚合根，不加载子实体
const repo = await repositoryService.getById('repo-123');
console.log(repo.resources); // undefined (未加载)

// 需要时再加载子实体
await repositoryService.loadResources(repo);
console.log(repo.resources); // ResourceServer[] (已加载)
```

### 2. 预加载（Eager Loading）

```typescript
// 一次性加载聚合根和所有子实体
const repo = await repositoryService.getById('repo-123', {
  include: ['resources', 'explorer'],
});
console.log(repo.resources); // ResourceServer[] (已加载)
console.log(repo.explorer);  // RepositoryExplorerServer (已加载)
```

### 3. 部分加载（Partial Loading）

```typescript
// 只加载部分子实体
const repo = await repositoryService.getById('repo-123', {
  include: ['resources'], // 只加载 resources，不加载 explorer
});
console.log(repo.resources); // ResourceServer[]
console.log(repo.explorer);  // undefined
```

---

## 📊 对比表

| 维度 | ❌ 原设计 | ✅ 修正后 |
|------|----------|----------|
| **聚合根属性** | 只有自己的属性 | 包含子实体集合 |
| **子实体访问** | 直接从 Service 获取 | 通过聚合根获取 |
| **DTO 结构** | 扁平结构 | 嵌套结构（递归） |
| **转换方法** | 简单复制 | 递归转换 |
| **工厂方法** | 只有 `fromXxxDTO` | 完整工厂方法 |
| **创建实体** | `new XxxImpl(...)` | `Xxx.create(...)` |
| **API 设计** | 暴露所有实体 | 只暴露聚合根 |
| **事务边界** | 不明确 | 聚合根边界 |
| **DDD 符合度** | 低 | 高 ✅ |

---

## 🎯 修改总结

### 已修改的文件

1. ✅ **RepositoryServer.ts**
   - 添加子实体集合 (`resources`, `explorer`)
   - 添加子实体管理方法
   - 添加工厂方法
   - 修改转换方法支持递归
   - DTO 包含子实体 DTO

2. ✅ **ResourceServer.ts**
   - 添加子实体集合 (`references`, `linkedContents`)
   - 添加子实体管理方法
   - 添加工厂方法
   - 修改转换方法支持递归
   - DTO 包含子实体 DTO

### 需要修改的其他文件

- **RepositoryClient.ts** - 同步添加子实体和工厂方法
- **ResourceClient.ts** - 同步添加子实体和工厂方法
- **实现类** (domain-server) - 实现新增的方法
- **API 层** - 按 DDD 风格重构路由

---

## 📚 参考

### DDD 核心原则

1. **聚合（Aggregate）**
   - 聚合根是访问入口
   - 子实体通过聚合根访问
   - 聚合是事务边界

2. **工厂（Factory）**
   - 封装复杂的创建逻辑
   - 确保创建的对象是有效的
   - 提供清晰的创建接口

3. **仓储（Repository）**
   - 只为聚合根提供仓储
   - 加载聚合根时可选加载子实体
   - 保存聚合根时级联保存子实体

### 推荐阅读

- 《领域驱动设计》- Eric Evans
- 《实现领域驱动设计》- Vaughn Vernon
- Martin Fowler - Aggregate Pattern

---

**修改时间**：2025-10-09  
**修改理由**：符合 DDD 聚合根设计原则  
**影响范围**：contracts 层接口定义，需要同步更新实现层
