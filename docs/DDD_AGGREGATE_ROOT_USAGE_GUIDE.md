# DDD 聚合根使用指南

## 🚀 快速开始

### 1. 创建聚合根（使用工厂方法）

```typescript
import { RepositoryServer, RepositoryType, ResourceType } from '@dailyuse/contracts';

// ✅ 使用工厂方法创建新的 Repository
const repository = RepositoryServer.create({
  accountUuid: 'account-123',
  name: 'My Knowledge Base',
  type: RepositoryType.LOCAL,
  path: '/Users/me/Documents/knowledge',
  description: 'Personal knowledge management',
  config: {
    enableGit: true,
    autoSync: false,
    defaultLinkedDocName: 'index.md',
    supportedFileTypes: [
      ResourceType.MARKDOWN,
      ResourceType.PDF,
      ResourceType.IMAGE,
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    enableVersionControl: true,
  },
  initializeGit: true,
});

console.log(repository.uuid); // 自动生成的 UUID
console.log(repository.status); // RepositoryStatus.ACTIVE
console.log(repository.createdAt); // 当前时间戳
```

### 2. 创建子实体（通过聚合根）

```typescript
// ✅ 通过聚合根创建 Resource
const resource = repository.createResource({
  name: 'getting-started.md',
  type: ResourceType.MARKDOWN,
  path: '/docs/getting-started.md',
  content: '# Getting Started\n\nWelcome to my knowledge base!',
  description: 'Introduction document',
  tags: ['documentation', 'guide', 'intro'],
});

// ✅ 添加到聚合根
repository.addResource(resource);

console.log(repository.getAllResources().length); // 1
```

### 3. 创建孙实体（通过子实体）

```typescript
// ✅ 通过 Resource 创建 LinkedContent
const linkedContent = resource.createLinkedContent({
  title: 'Domain-Driven Design Book',
  url: 'https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215',
  contentType: 'document',
  description: 'Essential reading for DDD',
});

// ✅ 添加到 Resource
resource.addLinkedContent(linkedContent);

// ✅ 通过 Resource 创建 ResourceReference
const reference = resource.createReference({
  targetResourceUuid: 'another-resource-uuid',
  referenceType: 'link',
  description: 'Related documentation',
});

resource.addReference(reference);
```

### 4. 创建浏览器配置（通过聚合根）

```typescript
// ✅ 通过聚合根创建 Explorer
const explorer = repository.createExplorer({
  name: 'Main Explorer',
  description: 'Default repository browser',
  currentPath: '/docs',
});

// ✅ 设置到聚合根
repository.setExplorer(explorer);

// ✅ 配置浏览器
explorer.updateViewConfig({
  viewMode: 'list',
  sortBy: 'name',
  sortOrder: 'asc',
  showHidden: false,
});

explorer.pinPath('/docs');
explorer.pinPath('/projects');
```

---

## 🔄 DTO 转换（递归）

### 转换为 DTO（包含子实体）

```typescript
// ✅ 转换为 DTO（不包含子实体，懒加载）
const dtoBasic = repository.toServerDTO();
console.log(dtoBasic.resources); // undefined

// ✅ 转换为 DTO（包含所有子实体）
const dtoFull = repository.toServerDTO(true);
console.log(dtoFull.resources); // ResourceServerDTO[]
console.log(dtoFull.explorer); // RepositoryExplorerServerDTO

// ✅ 递归包含孙实体
const resourceDTO = dtoFull.resources![0];
console.log(resourceDTO.references); // ResourceReferenceServerDTO[]
console.log(resourceDTO.linkedContents); // LinkedContentServerDTO[]
```

### 从 DTO 创建实体（递归）

```typescript
// ✅ 从 DTO 重建完整的聚合根
const dto: RepositoryServerDTO = {
  uuid: 'repo-123',
  accountUuid: 'account-123',
  name: 'My Repository',
  // ... 其他属性
  resources: [
    {
      uuid: 'resource-1',
      name: 'doc.md',
      // ... 其他属性
      references: [
        { uuid: 'ref-1', /* ... */ },
      ],
      linkedContents: [
        { uuid: 'link-1', /* ... */ },
      ],
    },
  ],
  explorer: {
    uuid: 'explorer-1',
    // ... 其他属性
  },
};

// ✅ 递归创建实体树
const repository = RepositoryServer.fromServerDTO(dto);

// ✅ 验证子实体已创建
console.log(repository.resources!.length); // 1
console.log(repository.resources![0].references!.length); // 1
console.log(repository.resources![0].linkedContents!.length); // 1
console.log(repository.explorer); // RepositoryExplorerServer
```

---

## 🎯 子实体管理

### Repository 管理 Resource

```typescript
// ✅ 添加资源
const resource1 = repository.createResource({ /* ... */ });
repository.addResource(resource1);

// ✅ 获取资源
const foundResource = repository.getResource('resource-uuid');
if (foundResource) {
  console.log(foundResource.name);
}

// ✅ 获取所有资源
const allResources = repository.getAllResources();
console.log(`Total resources: ${allResources.length}`);

// ✅ 按类型筛选
const markdownFiles = repository.getResourcesByType(ResourceType.MARKDOWN);
console.log(`Markdown files: ${markdownFiles.length}`);

// ✅ 移除资源
const removed = repository.removeResource('resource-uuid');
if (removed) {
  console.log(`Removed: ${removed.name}`);
}
```

### Resource 管理 Reference 和 LinkedContent

```typescript
const resource = repository.getResource('resource-uuid')!;

// ===== 引用管理 =====
const ref = resource.createReference({
  targetResourceUuid: 'target-uuid',
  referenceType: 'link',
});
resource.addReference(ref);

const allRefs = resource.getAllReferences();
console.log(`Total references: ${allRefs.length}`);

const removedRef = resource.removeReference('ref-uuid');

// ===== 关联内容管理 =====
const link = resource.createLinkedContent({
  title: 'External Article',
  url: 'https://example.com/article',
  contentType: 'article',
});
resource.addLinkedContent(link);

const allLinks = resource.getAllLinkedContents();
console.log(`Total linked contents: ${allLinks.length}`);

const removedLink = resource.removeLinkedContent('link-uuid');
```

---

## 📡 API 使用示例

### 服务端（API 实现）

```typescript
// ============ Repository 控制器 ============

@Controller('/api/repositories')
export class RepositoryController {
  
  // 获取 Repository（可选加载子实体）
  @Get(':id')
  async getRepository(
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    const includeChildren = include?.split(',').includes('resources');
    
    const repo = await this.repositoryService.findById(id);
    if (!repo) {
      throw new NotFoundException();
    }
    
    // 转换为 DTO（根据参数决定是否包含子实体）
    return repo.toServerDTO(includeChildren);
  }
  
  // 创建 Repository
  @Post()
  async createRepository(@Body() createDto: CreateRepositoryDTO) {
    // 使用工厂方法创建
    const repo = RepositoryServer.create({
      accountUuid: createDto.accountUuid,
      name: createDto.name,
      type: createDto.type,
      path: createDto.path,
      description: createDto.description,
      config: createDto.config,
      initializeGit: createDto.initializeGit,
    });
    
    // 保存到数据库
    await this.repositoryService.save(repo);
    
    return repo.toServerDTO();
  }
  
  // 添加 Resource 到 Repository
  @Post(':repoId/resources')
  async addResource(
    @Param('repoId') repoId: string,
    @Body() createDto: CreateResourceDTO,
  ) {
    // 获取聚合根
    const repo = await this.repositoryService.findById(repoId);
    if (!repo) {
      throw new NotFoundException();
    }
    
    // 通过聚合根创建子实体
    const resource = repo.createResource({
      name: createDto.name,
      type: createDto.type,
      path: createDto.path,
      content: createDto.content,
      description: createDto.description,
      tags: createDto.tags,
    });
    
    // 添加到聚合根
    repo.addResource(resource);
    
    // 保存聚合根（级联保存子实体）
    await this.repositoryService.save(repo);
    
    return resource.toServerDTO();
  }
  
  // 删除 Resource
  @Delete(':repoId/resources/:resourceId')
  async removeResource(
    @Param('repoId') repoId: string,
    @Param('resourceId') resourceId: string,
  ) {
    const repo = await this.repositoryService.findById(repoId);
    if (!repo) {
      throw new NotFoundException();
    }
    
    // 从聚合根移除
    const removed = repo.removeResource(resourceId);
    if (!removed) {
      throw new NotFoundException();
    }
    
    // 保存聚合根
    await this.repositoryService.save(repo);
    
    return { success: true, removed: removed.toServerDTO() };
  }
}
```

### 客户端（调用 API）

```typescript
// ============ Repository Service (Frontend) ============

export class RepositoryApiService {
  
  // 获取 Repository（不包含子实体）
  async getRepository(id: string): Promise<RepositoryClient> {
    const response = await fetch(`/api/repositories/${id}`);
    const dto = await response.json();
    return RepositoryClient.fromServerDTO(dto);
  }
  
  // 获取 Repository（包含子实体）
  async getRepositoryWithResources(id: string): Promise<RepositoryClient> {
    const response = await fetch(`/api/repositories/${id}?include=resources,explorer`);
    const dto = await response.json();
    return RepositoryClient.fromServerDTO(dto);
  }
  
  // 创建 Repository
  async createRepository(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
  }): Promise<RepositoryClient> {
    const response = await fetch('/api/repositories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const dto = await response.json();
    return RepositoryClient.fromServerDTO(dto);
  }
  
  // 添加 Resource
  async addResource(
    repoId: string,
    params: {
      name: string;
      type: ResourceType;
      path: string;
      content?: string;
    },
  ): Promise<ResourceClient> {
    const response = await fetch(`/api/repositories/${repoId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const dto = await response.json();
    return ResourceClient.fromServerDTO(dto);
  }
  
  // 删除 Resource
  async removeResource(repoId: string, resourceId: string): Promise<void> {
    await fetch(`/api/repositories/${repoId}/resources/${resourceId}`, {
      method: 'DELETE',
    });
  }
}
```

---

## 💾 数据库操作

### Repository 仓储实现

```typescript
export class RepositoryRepositoryImpl {
  
  // 保存聚合根（级联保存子实体）
  async save(repository: RepositoryServer): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. 保存聚合根
      const repoPersistence = repository.toPersistenceDTO();
      await tx('repositories')
        .insert(repoPersistence)
        .onConflict('uuid')
        .merge();
      
      // 2. 级联保存子实体：Resources
      if (repository.resources) {
        for (const resource of repository.resources) {
          const resourcePersistence = resource.toPersistenceDTO();
          await tx('resources')
            .insert(resourcePersistence)
            .onConflict('uuid')
            .merge();
          
          // 3. 级联保存孙实体：References
          if (resource.references) {
            for (const ref of resource.references) {
              const refPersistence = ref.toPersistenceDTO();
              await tx('resource_references')
                .insert(refPersistence)
                .onConflict('uuid')
                .merge();
            }
          }
          
          // 4. 级联保存孙实体：LinkedContents
          if (resource.linkedContents) {
            for (const link of resource.linkedContents) {
              const linkPersistence = link.toPersistenceDTO();
              await tx('linked_contents')
                .insert(linkPersistence)
                .onConflict('uuid')
                .merge();
            }
          }
        }
      }
      
      // 5. 级联保存子实体：Explorer
      if (repository.explorer) {
        const explorerPersistence = repository.explorer.toPersistenceDTO();
        await tx('repository_explorers')
          .insert(explorerPersistence)
          .onConflict('uuid')
          .merge();
      }
    });
  }
  
  // 查找聚合根（可选加载子实体）
  async findById(
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<RepositoryServer | null> {
    // 1. 查询聚合根
    const repoPersistence = await this.db('repositories')
      .where('uuid', id)
      .first();
    
    if (!repoPersistence) {
      return null;
    }
    
    // 2. 创建聚合根实体
    const repo = RepositoryServer.fromPersistenceDTO(repoPersistence);
    
    // 3. 可选加载子实体
    if (options?.includeChildren) {
      // 加载 Resources
      const resourcesPersistence = await this.db('resources')
        .where('repository_uuid', id);
      
      repo.resources = [];
      for (const resPersistence of resourcesPersistence) {
        const resource = ResourceServer.fromPersistenceDTO(resPersistence);
        
        // 加载 References
        const refsPersistence = await this.db('resource_references')
          .where('source_resource_uuid', resource.uuid);
        resource.references = refsPersistence.map(r => 
          ResourceReferenceServer.fromPersistenceDTO(r)
        );
        
        // 加载 LinkedContents
        const linksPersistence = await this.db('linked_contents')
          .where('resource_uuid', resource.uuid);
        resource.linkedContents = linksPersistence.map(l => 
          LinkedContentServer.fromPersistenceDTO(l)
        );
        
        repo.resources.push(resource);
      }
      
      // 加载 Explorer
      const explorerPersistence = await this.db('repository_explorers')
        .where('repository_uuid', id)
        .first();
      
      if (explorerPersistence) {
        repo.explorer = RepositoryExplorerServer.fromPersistenceDTO(explorerPersistence);
      }
    }
    
    return repo;
  }
}
```

---

## 🎯 最佳实践

### ✅ DO（推荐）

```typescript
// ✅ 使用工厂方法创建实体
const repo = RepositoryServer.create({ /* ... */ });

// ✅ 通过聚合根创建子实体
const resource = repo.createResource({ /* ... */ });

// ✅ 通过聚合根管理子实体
repo.addResource(resource);
const found = repo.getResource('uuid');

// ✅ 保存整个聚合根（事务边界）
await repositoryService.save(repo);

// ✅ API 只暴露聚合根
GET /api/repositories/:id
POST /api/repositories/:id/resources

// ✅ 按需加载子实体
const repo = await service.findById('id', { includeChildren: true });
```

### ❌ DON'T（避免）

```typescript
// ❌ 直接 new 创建实体
const repo = new RepositoryServerImpl({ /* ... */ });

// ❌ 独立创建子实体
const resource = new ResourceServerImpl({ /* ... */ });

// ❌ 直接访问子实体 Service
const resource = await resourceService.findById('uuid');

// ❌ 独立保存子实体
await resourceService.save(resource);

// ❌ API 直接暴露子实体
GET /api/resources/:id
POST /api/resources
```

---

## 📚 总结

### 核心原则

1. **聚合根是入口**：外部只能通过聚合根访问子实体
2. **工厂方法创建**：使用工厂方法而不是构造函数
3. **递归转换**：DTO 转换时递归处理子实体
4. **事务边界**：聚合根是事务和一致性边界
5. **DDD 风格 API**：RESTful API 只暴露聚合根

### 关键收益

- ✅ 更符合 DDD 原则
- ✅ 更清晰的领域模型
- ✅ 更好的封装性
- ✅ 更简洁的 API
- ✅ 更明确的事务边界
- ✅ 更容易维护和扩展

---

**文档版本**：v1.0  
**最后更新**：2025-10-09  
**适用范围**：Repository 模块和 Editor 模块
