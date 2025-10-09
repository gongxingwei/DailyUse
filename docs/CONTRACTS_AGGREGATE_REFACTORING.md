# Contracts 聚合重构指南

## 概述

我们已将 `packages/contracts` 的 Repository 和 Editor 模块重构为 **aggregates-first** 架构，参考 domain 层的文件组织方式。每个聚合现在是一个自包含的文件，包含：

1. **业务接口** - 定义 API/Service 层的操作契约
2. **DTO 定义** - Persistence / Server / Client 三层 DTO
3. **Mapper 签名** - 数据转换方法的类型定义
4. **共享类型** - 值对象、枚举等
5. **领域事件** - Server 和 Client 事件类型

## 新的文件结构

### Repository 模块

```
packages/contracts/src/modules/repository/
├── aggregates/
│   └── RepositoryServer.ts    # 完整的聚合定义
├── errors.ts                   # 错误类型
├── events.ts                   # 领域事件
└── index.ts                    # 简化的导出入口
```

### Editor 模块

```
packages/contracts/src/modules/editor/
├── aggregates/
│   └── EditorServer.ts         # 完整的聚合定义
├── api-requests.ts             # API 辅助类型
└── index.ts                    # 简化的导出入口
```

## 导入方式变更

### 旧的导入方式（已废弃）

```typescript
// ❌ 不再推荐
import { RepositoryServerDTO, RepositoryClientDTO } from '@dailyuse/contracts/modules/repository/server-dtos';
import { ResourcePersistenceDTO } from '@dailyuse/contracts/modules/repository/persistence-dtos';
import { DocumentMetadata } from '@dailyuse/contracts/modules/editor/types';
```

### 新的导入方式（推荐）

```typescript
// ✅ 从聚合命名空间导入
import { RepositoryAggregate } from '@dailyuse/contracts/modules/repository';
import { EditorAggregate } from '@dailyuse/contracts/modules/editor';

// 使用示例
type RepoServer = RepositoryAggregate.RepositoryServerDTO;
type RepoClient = RepositoryAggregate.RepositoryClientDTO;
type RepoPersistence = RepositoryAggregate.RepositoryPersistenceDTO;

type Doc = EditorAggregate.DocumentServerDTO;
type Metadata = EditorAggregate.DocumentMetadata;
type Session = EditorAggregate.EditorSessionClientDTO;
```

### 业务接口实现

```typescript
import { RepositoryAggregate } from '@dailyuse/contracts/modules/repository';

// 实现业务接口
class RepositoryService implements RepositoryAggregate.RepositoryServer {
  async findByUuid(uuid: string): Promise<RepositoryAggregate.RepositoryServerDTO | null> {
    // implementation
  }
  
  async list(params?: RepositoryAggregate.RepositoryQueryParamsDTO) {
    // implementation
  }
  
  // ... 其他方法
}
```

### Mapper 实现

```typescript
import { RepositoryAggregate } from '@dailyuse/contracts/modules/repository';

// 实现 Mapper 接口
class RepositoryMapperImpl implements RepositoryAggregate.RepositoryMapper {
  toServerDTO(persistence: RepositoryAggregate.RepositoryPersistenceDTO): RepositoryAggregate.RepositoryServerDTO {
    return {
      uuid: persistence.uuid,
      accountUuid: persistence.account_uuid,
      name: persistence.name,
      type: persistence.type as RepositoryAggregate.RepositoryType,
      path: persistence.path,
      description: persistence.description,
      config: persistence.config_json ? JSON.parse(persistence.config_json) : {},
      status: persistence.status as RepositoryAggregate.RepositoryStatus,
      createdAt: persistence.created_at ? new Date(persistence.created_at) : null,
      updatedAt: persistence.updated_at ? new Date(persistence.updated_at) : null,
    };
  }
  
  toClientDTO(server: RepositoryAggregate.RepositoryServerDTO): RepositoryAggregate.RepositoryClientDTO {
    return {
      uuid: server.uuid,
      accountUuid: server.accountUuid,
      name: server.name,
      type: server.type,
      path: server.path,
      description: server.description,
      config: server.config,
      status: server.status,
      stats: server.stats ? {
        totalFiles: server.stats.totalResources,
        totalSize: server.stats.totalSize,
      } : null,
      createdAt: server.createdAt?.getTime() ?? null, // Date -> epoch ms
      updatedAt: server.updatedAt?.getTime() ?? null,
    };
  }
  
  toPersistenceDTO(server: RepositoryAggregate.RepositoryServerDTO): RepositoryAggregate.RepositoryPersistenceDTO {
    return {
      uuid: server.uuid,
      account_uuid: server.accountUuid,
      name: server.name,
      type: server.type,
      path: server.path,
      description: server.description,
      config_json: JSON.stringify(server.config),
      status: server.status,
      created_at: server.createdAt?.toISOString() ?? null,
      updated_at: server.updatedAt?.toISOString() ?? null,
    };
  }
  
  // ... 其他 mapper 方法
}
```

## 聚合内容一览

### RepositoryServer.ts 包含

- **Enums**: RepositoryType, RepositoryStatus, ResourceType, ResourceStatus, ReferenceType, ContentType
- **Shared Types**: IRepositoryConfig, IRepositoryStats, IRepositorySyncStatus, IGitInfo, IResourceMetadata
- **Persistence DTOs**: RepositoryPersistenceDTO, ResourcePersistenceDTO, ResourceReferencePersistenceDTO, LinkedContentPersistenceDTO
- **Server DTOs**: RepositoryServerDTO, ResourceServerDTO, ResourceReferenceServerDTO, LinkedContentServerDTO
- **Client DTOs**: RepositoryClientDTO, ResourceClientDTO, ResourceReferenceClientDTO, LinkedContentClientDTO
- **Request DTOs**: CreateRepositoryRequestDTO, UpdateRepositoryRequestDTO, CreateResourceRequestDTO, UpdateResourceRequestDTO, RepositoryQueryParamsDTO, ResourceQueryParamsDTO, BatchOperationRequestDTO
- **Response DTOs**: RepositoryListResponseDTO, ResourceListResponseDTO, BatchOperationResponseDTO, SearchResultResponseDTO
- **Business Interface**: RepositoryServer (findByUuid, list, create, update, delete, listResources, getResource, createResource, updateResource, deleteResource, batchOperation, search, gitStatus, gitCommit)
- **Mapper Interface**: RepositoryMapper (toServerDTO, toClientDTO, toPersistenceDTO, fromClientDTO, resource mappers, reference mappers, linkedContent mappers)

### EditorServer.ts 包含

- **Enums**: DocumentFormat, SupportedFileType, FileOperationType, RenderingMode, ViewMode, SidebarTab, SearchType, ResourceType, ChangeType
- **Value Objects**: DocumentMetadata, Position, ScrollPosition, TextSelection, CursorPosition, WorkspaceLayout, EditorSettings, OpenDocument
- **Persistence DTOs**: DocumentPersistenceDTO, DocumentVersionPersistenceDTO, WorkspacePersistenceDTO, EditorSessionPersistenceDTO, EditorGroupPersistenceDTO, EditorTabPersistenceDTO, SearchQueryPersistenceDTO, LinkedResourcePersistenceDTO
- **Server DTOs**: DocumentServerDTO, DocumentVersionServerDTO, WorkspaceServerDTO, EditorSessionServerDTO, EditorGroupServerDTO, EditorTabServerDTO, SearchQueryServerDTO, LinkedResourceServerDTO
- **Client DTOs**: DocumentClientDTO, WorkspaceClientDTO, EditorSessionClientDTO, EditorGroupClientDTO, EditorTabClientDTO, SearchQueryClientDTO
- **Request DTOs**: CreateDocumentRequestDTO, UpdateDocumentRequestDTO, SaveDocumentRequestDTO, CreateWorkspaceRequestDTO, UpdateWorkspaceRequestDTO, SearchDocumentsRequestDTO, OpenDocumentRequestDTO
- **Response DTOs**: DocumentListResponseDTO, OpenDocumentResponseDTO, SearchResultResponseDTO, DocumentSummaryDTO, WorkspaceSummaryDTO
- **Events**: EditorServerEvent (DocumentOpenedEvent, DocumentSavedEvent, DocumentCreatedEvent, DocumentUpdatedEvent, DocumentDeletedEvent), EditorClientEvent (DocumentOpenedClientEvent, DocumentSavedClientEvent, TabActivatedClientEvent)
- **Business Interface**: EditorServer (getDocument, listDocuments, createDocument, updateDocument, saveDocument, deleteDocument, openDocument, closeDocument, searchDocuments, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace, getSession, saveSession, restoreSession, getDocumentVersions, getDocumentVersion, revertToVersion)
- **Mapper Interface**: EditorMapper (document mappers, workspace mappers, session mappers, group mappers, tab mappers, version mappers, event mappers)

## DTO 分层约定

### Persistence Layer (持久化层)
- **字段命名**: snake_case（`account_uuid`, `created_at`）
- **时间戳**: ISO 字符串或 DB 时间戳字符串
- **JSON 字段**: 以 `_json` 结尾（`metadata_json`, `config_json`）
- **布尔值**: 数字 0/1
- **用途**: 直接映射数据库行结构

### Server Layer (服务层)
- **字段命名**: camelCase（`accountUuid`, `createdAt`）
- **时间戳**: `Date` 对象
- **JSON 字段**: 解析后的对象/数组
- **布尔值**: boolean
- **用途**: 领域逻辑处理、业务规则验证

### Client Layer (客户端层)
- **字段命名**: camelCase（`accountUuid`, `createdAt`）
- **时间戳**: epoch milliseconds（number）
- **JSON 字段**: 解析后的对象/数组
- **布尔值**: boolean
- **用途**: API 传输、前端展示

## Mapper 转换规则

### Persistence → Server
```typescript
{
  // 字段名转换: snake_case → camelCase
  account_uuid → accountUuid
  
  // 时间戳转换: string → Date
  created_at: "2024-01-01T00:00:00Z" → createdAt: new Date("2024-01-01T00:00:00Z")
  
  // JSON 解析: string → object
  metadata_json: '{"tags":["a"]}' → metadata: { tags: ["a"] }
  
  // 布尔转换: 0/1 → boolean
  is_dirty: 1 → isDirty: true
}
```

### Server → Client
```typescript
{
  // 时间戳转换: Date → epoch ms
  createdAt: Date → createdAt: Date.getTime()
  
  // 其他字段直接映射
  uuid → uuid
  name → name
}
```

### Client → Server
```typescript
{
  // 时间戳转换: epoch ms → Date
  createdAt: number → createdAt: new Date(number)
}
```

### Server → Persistence
```typescript
{
  // 字段名转换: camelCase → snake_case
  accountUuid → account_uuid
  
  // 时间戳转换: Date → ISO string
  createdAt: Date → created_at: date.toISOString()
  
  // JSON 序列化: object → string
  metadata: { tags: ["a"] } → metadata_json: '{"tags":["a"]}'
  
  // 布尔转换: boolean → 0/1
  isDirty: true → is_dirty: 1
}
```

## 迁移清单

如果你的代码使用了旧的导入方式，请按以下步骤迁移：

1. ✅ **搜索旧导入**
   ```bash
   # 搜索所有旧的导入语句
   grep -r "from.*contracts.*/(types|dtos|client-dtos|server-dtos|persistence-dtos)" apps/ packages/
   ```

2. ✅ **替换导入语句**
   ```typescript
   // Before
   import { RepositoryServerDTO } from '@dailyuse/contracts/modules/repository/server-dtos';
   
   // After
   import { RepositoryAggregate } from '@dailyuse/contracts/modules/repository';
   type RepositoryServerDTO = RepositoryAggregate.RepositoryServerDTO;
   ```

3. ✅ **更新类型引用**
   ```typescript
   // Before
   function process(repo: RepositoryServerDTO) { }
   
   // After
   function process(repo: RepositoryAggregate.RepositoryServerDTO) { }
   ```

4. ✅ **验证构建**
   ```bash
   pnpm -w tsc --noEmit
   pnpm -w nx run-many --target=build --all
   ```

## 优势

1. **单一真相来源**: 每个聚合的所有相关类型都在一个文件中
2. **清晰的边界**: 业务接口、DTO、Mapper 职责明确
3. **易于发现**: 不需要在多个文件间跳转
4. **类型安全**: 通过命名空间避免命名冲突
5. **易于维护**: 修改聚合时只需编辑一个文件
6. **对齐架构**: 与 domain 层的 aggregates 结构保持一致

## 注意事项

- ⚠️ 旧的文件（types.ts, dtos.ts, client-dtos.ts 等）暂时保留但不应再使用
- ⚠️ 所有新代码应该从 aggregates 导入
- ⚠️ 如果发现旧导入，应该及时更新
- ⚠️ 建议在 IDE 中添加 lint 规则禁止从旧路径导入

## 下一步

1. **创建 Mapper 实现**: 在 `apps/api` 中实现 `RepositoryMapper` 和 `EditorMapper`
2. **更新 Service 层**: 实现 `RepositoryServer` 和 `EditorServer` 接口
3. **创建客户端 SDK**: 在 `apps/web` 或 `packages/domain-client` 中创建类型安全的 API 客户端
4. **添加示例代码**: 在 `packages/contracts/examples/` 中添加 mapper 和 service 的参考实现

## 参考文档

- [REPOSITORY_AND_EDITOR_DESIGN.md](./REPOSITORY_AND_EDITOR_DESIGN.md) - 设计思路
- [EDITOR_AGGREGATES_AND_DTOS.md](./EDITOR_AGGREGATES_AND_DTOS.md) - Editor 聚合详细说明
- [NX_CROSS_PACKAGE_WORKFLOW.md](./NX_CROSS_PACKAGE_WORKFLOW.md) - 跨包开发工作流
- [TSCONFIG_GUIDE.md](./TSCONFIG_GUIDE.md) - TypeScript 配置指南
