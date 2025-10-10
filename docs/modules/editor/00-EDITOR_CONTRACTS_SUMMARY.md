# Editor 模块 Contracts 层实现总结

> 创建时间：2024-06-28  
> 模块位置：`packages/contracts/src/modules/editor/`  
> 参考模板：`packages/contracts/src/modules/repository/`

## 📋 创建文件清单

### 1. **枚举定义** (1 个文件)

- ✅ `enums.ts` (约 2KB)
  - ProjectType (4 个值)
  - DocumentLanguage (15 个值)
  - VersionChangeType (7 个值)
  - TabType (6 个值)
  - SplitDirection (2 个值)
  - IndexStatus (5 个值)
  - LinkedSourceType (10 个值)
  - LinkedTargetType (7 个值)
  - ViewMode (4 个值)
  - SidebarActiveTab (5 个值)

### 2. **值对象** (5 个值对象 + 1 个导出文件)

- ✅ `valueObjects/WorkspaceLayout.ts` (约 2KB)
  - IWorkspaceLayoutServer + IWorkspaceLayoutClient
  - WorkspaceLayoutServerDTO + WorkspaceLayoutClientDTO + WorkspaceLayoutPersistenceDTO
  - 包含 equals, with, toServerDTO, toClientDTO, toPersistenceDTO

- ✅ `valueObjects/WorkspaceSettings.ts` (约 2KB)
  - IWorkspaceSettingsServer + IWorkspaceSettingsClient
  - WorkspaceSettingsServerDTO + WorkspaceSettingsClientDTO + WorkspaceSettingsPersistenceDTO
  - 包含主题、字体、自动保存等配置

- ✅ `valueObjects/SessionLayout.ts` (约 1.5KB)
  - ISessionLayoutServer + ISessionLayoutClient
  - SessionLayoutServerDTO + SessionLayoutClientDTO + SessionLayoutPersistenceDTO
  - 包含分屏类型、分组数量、活动分组索引

- ✅ `valueObjects/TabViewState.ts` (约 2KB)
  - ITabViewStateServer + ITabViewStateClient
  - TabViewStateServerDTO + TabViewStateClientDTO + TabViewStatePersistenceDTO
  - 包含滚动位置、光标位置、选区

- ✅ `valueObjects/DocumentMetadata.ts` (约 2KB)
  - IDocumentMetadataServer + IDocumentMetadataClient
  - DocumentMetadataServerDTO + DocumentMetadataClientDTO + DocumentMetadataPersistenceDTO
  - 包含标签、分类、字数、阅读时间等元数据

- ✅ `valueObjects/index.ts` (导出文件)

### 3. **聚合根** (2 个聚合根 × 2 = 4 个文件 + 1 个导出文件)

#### EditorWorkspace 聚合根

- ✅ `aggregates/EditorWorkspaceServer.ts` (约 3KB)
  - EditorWorkspaceServerDTO (12 个字段)
  - EditorWorkspacePersistenceDTO (snake_case)
  - 4 个领域事件：Created, Updated, Deleted, Activated
  - EditorWorkspaceServer 接口（8 个业务方法）
    - update, activate, deactivate, updateLayout, updateSettings, setLastActiveSession, recordAccess

- ✅ `aggregates/EditorWorkspaceClient.ts` (约 2KB)
  - EditorWorkspaceClientDTO (含 UI 格式化字段)
  - EditorWorkspaceClient 接口（5 个 UI 辅助方法）
    - getDisplayName, getProjectTypeLabel, getStatusColor, canActivate, getFormattedLastAccessed

#### EditorSession 聚合根

- ✅ `aggregates/EditorSessionServer.ts` (约 3KB)
  - EditorSessionServerDTO (10 个字段)
  - EditorSessionPersistenceDTO (snake_case)
  - 6 个领域事件：Created, Updated, Deleted, Activated, LayoutUpdated, ActiveGroupChanged
  - EditorSessionServer 接口（7 个业务方法）
    - update, activate, deactivate, updateLayout, setActiveGroup, recordAccess, isValidGroupIndex

- ✅ `aggregates/EditorSessionClient.ts` (约 2KB)
  - EditorSessionClientDTO (含 UI 格式化字段)
  - EditorSessionClient 接口（7 个 UI 辅助方法）
    - getDisplayName, getStatusColor, getLayoutTypeLabel, canActivate, getFormattedLastAccessed, getGroupCount, isActiveGroup

- ✅ `aggregates/index.ts` (导出文件)

### 4. **实体** (6 个实体 × 2 = 12 个文件 + 1 个导出文件)

#### Document 实体

- ✅ `entities/DocumentServer.ts` (约 3KB)
  - DocumentServerDTO (14 个字段)
  - DocumentPersistenceDTO (snake_case)
  - DocumentServer 接口（10 个业务方法）
    - updateContent, updateMetadata, rename, move, markIndexed, markIndexOutdated, markIndexFailed, updateFileModifiedTime, getFileExtension, isMarkdown

- ✅ `entities/DocumentClient.ts` (约 2.5KB)
  - DocumentClientDTO (含 UI 格式化字段)
  - DocumentClient 接口（10 个 UI 辅助方法）
    - getFileExtension, getLanguageLabel, getIndexStatusColor, getIndexStatusLabel, isMarkdown, needsReindex, getFormattedLastIndexed, getFormattedLastModified, getContentPreview, getContentSize

#### DocumentVersion 实体

- ✅ `entities/DocumentVersionServer.ts` (约 2KB)
  - DocumentVersionServerDTO (11 个字段)
  - DocumentVersionPersistenceDTO (snake_case)
  - DocumentVersionServer 接口（4 个业务方法）
    - updateDescription, isFirstVersion, isEditChange, isCreateChange

- ✅ `entities/DocumentVersionClient.ts` (约 2KB)
  - DocumentVersionClientDTO (含 UI 格式化字段)
  - DocumentVersionClient 接口（6 个 UI 辅助方法）
    - getChangeTypeLabel, getChangeTypeColor, getVersionLabel, isFirstVersion, hasDescription, getCreatorDisplayName

#### EditorGroup 实体

- ✅ `entities/EditorGroupServer.ts` (约 2KB)
  - EditorGroupServerDTO (8 个字段)
  - EditorGroupPersistenceDTO (snake_case)
  - EditorGroupServer 接口（4 个业务方法）
    - setActiveTab, rename, updateGroupIndex, isValidTabIndex

- ✅ `entities/EditorGroupClient.ts` (约 1.5KB)
  - EditorGroupClientDTO (含 UI 格式化字段)
  - EditorGroupClient 接口（3 个 UI 辅助方法）
    - getDisplayName, isActiveTab, hasCustomName

#### EditorTab 实体

- ✅ `entities/EditorTabServer.ts` (约 3KB)
  - EditorTabServerDTO (14 个字段)
  - EditorTabPersistenceDTO (snake_case)
  - EditorTabServer 接口（9 个业务方法）
    - updateTitle, updateViewState, togglePin, markDirty, markClean, recordAccess, updateTabIndex, isDocumentTab

- ✅ `entities/EditorTabClient.ts` (约 2.5KB)
  - EditorTabClientDTO (含 UI 格式化字段)
  - EditorTabClient 接口（8 个 UI 辅助方法）
    - getDisplayTitle, getTabTypeLabel, getIconName, isDocumentTab, canClose, needsCloseConfirmation, getFormattedLastAccessed, getStatusColor

#### SearchEngine 实体

- ✅ `entities/SearchEngineServer.ts` (约 2.5KB)
  - SearchEngineServerDTO (12 个字段)
  - SearchEnginePersistenceDTO (snake_case)
  - SearchEngineServer 接口（9 个业务方法）
    - startIndexing, updateProgress, completeIndexing, cancelIndexing, resetIndex, indexDocument, isIndexComplete, isIndexOutdated

- ✅ `entities/SearchEngineClient.ts` (约 2KB)
  - SearchEngineClientDTO (含 UI 格式化字段)
  - SearchEngineClient 接口（7 个 UI 辅助方法）
    - getIndexStatusLabel, getIndexStatusColor, getProgressText, isIndexComplete, getCompletionRate, getFormattedLastIndexed, needsReindex

#### LinkedResource 实体

- ✅ `entities/LinkedResourceServer.ts` (约 3KB)
  - LinkedResourceServerDTO (14 个字段)
  - LinkedResourcePersistenceDTO (snake_case)
  - LinkedResourceServer 接口（10 个业务方法）
    - markValid, markInvalid, updateTargetPath, updateTargetDocument, updateSourceLocation, recordValidation, isInternalLink, isExternalLink, hasAnchor

- ✅ `entities/LinkedResourceClient.ts` (约 2.5KB)
  - LinkedResourceClientDTO (含 UI 格式化字段)
  - LinkedResourceClient 接口（11 个 UI 辅助方法）
    - getSourceTypeLabel, getTargetTypeLabel, getTargetIconName, getValidStatusLabel, getValidStatusColor, isInternalLink, isExternalLink, hasAnchor, getSourceLocationText, getFormattedLastValidated, getFullTargetUrl

- ✅ `entities/index.ts` (导出文件)

### 5. **API DTO** (1 个文件)

- ✅ `api-requests.ts` (约 7KB)
  - **EditorWorkspace API** (3 个 DTO)
    - CreateEditorWorkspaceRequest, UpdateEditorWorkspaceRequest, ListEditorWorkspacesResponse
  - **EditorSession API** (3 个 DTO)
    - CreateEditorSessionRequest, UpdateEditorSessionRequest, ListEditorSessionsResponse
  - **Document API** (3 个 DTO)
    - CreateDocumentRequest, UpdateDocumentRequest, ListDocumentsResponse
  - **DocumentVersion API** (1 个 DTO)
    - ListDocumentVersionsResponse
  - **EditorGroup API** (3 个 DTO)
    - CreateEditorGroupRequest, UpdateEditorGroupRequest, ListEditorGroupsResponse
  - **EditorTab API** (3 个 DTO)
    - CreateEditorTabRequest, UpdateEditorTabRequest, ListEditorTabsResponse
  - **SearchEngine API** (4 个 DTO)
    - CreateSearchEngineRequest, UpdateSearchEngineProgressRequest, SearchRequest, SearchResponse
  - **LinkedResource API** (5 个 DTO)
    - CreateLinkedResourceRequest, UpdateLinkedResourceRequest, ListLinkedResourcesResponse, ValidateLinksRequest, ValidateLinksResponse

### 6. **统一导出** (1 个文件)

- ✅ `index.ts`
  - 导出所有枚举
  - 导出所有值对象
  - 导出所有聚合根
  - 导出所有实体
  - 导出所有 API DTO

## 📊 文件统计

| 类型 | 文件数量 | 总大小（约） |
|-----|---------|------------|
| 枚举 | 1 | 2KB |
| 值对象 | 6 (5+1导出) | 11KB |
| 聚合根 | 5 (4+1导出) | 12KB |
| 实体 | 13 (12+1导出) | 28KB |
| API DTO | 1 | 7KB |
| 统一导出 | 1 | 0.5KB |
| **总计** | **27** | **60.5KB** |

## 🏗️ 架构规范

### 1. 文件组织

```
contracts/src/modules/editor/
├── enums.ts                    # 所有枚举定义
├── valueObjects/               # 值对象
│   ├── WorkspaceLayout.ts
│   ├── WorkspaceSettings.ts
│   ├── SessionLayout.ts
│   ├── TabViewState.ts
│   ├── DocumentMetadata.ts
│   └── index.ts
├── aggregates/                 # 聚合根
│   ├── EditorWorkspaceServer.ts
│   ├── EditorWorkspaceClient.ts
│   ├── EditorSessionServer.ts
│   ├── EditorSessionClient.ts
│   └── index.ts
├── entities/                   # 实体
│   ├── DocumentServer.ts
│   ├── DocumentClient.ts
│   ├── DocumentVersionServer.ts
│   ├── DocumentVersionClient.ts
│   ├── EditorGroupServer.ts
│   ├── EditorGroupClient.ts
│   ├── EditorTabServer.ts
│   ├── EditorTabClient.ts
│   ├── SearchEngineServer.ts
│   ├── SearchEngineClient.ts
│   ├── LinkedResourceServer.ts
│   ├── LinkedResourceClient.ts
│   └── index.ts
├── api-requests.ts             # API 请求/响应 DTO
└── index.ts                    # 统一导出
```

### 2. 命名规范

#### DTO 命名
- **Server DTO**: `XxxServerDTO`
- **Client DTO**: `XxxClientDTO`
- **Persistence DTO**: `XxxPersistenceDTO` (snake_case 字段)

#### 接口命名
- **Server 接口**: `IXxxServer` → `export type XxxServer = IXxxServer`
- **Client 接口**: `IXxxClient` → `export type XxxClient = IXxxClient`

#### 领域事件命名
- **事件接口**: `XxxCreatedEvent`, `XxxUpdatedEvent`, `XxxDeletedEvent` 等
- **事件联合类型**: `XxxDomainEvent = Event1 | Event2 | ...`

### 3. 时间戳规范

**所有时间戳使用 `number` 类型，表示 epoch milliseconds**

```typescript
export interface XxxServerDTO {
  createdAt: number;      // ✅ epoch ms
  updatedAt: number;      // ✅ epoch ms
  lastAccessedAt?: number | null;  // ✅ epoch ms
}
```

### 4. 值对象规范

**每个值对象必须包含：**

1. **Server 接口** (IXxxServer)
   - 业务属性
   - `equals(other: IXxxServer): boolean`
   - `with(updates: Partial<...>): IXxxServer` (不可变更新)
   - `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`

2. **Client 接口** (IXxxClient)
   - 业务属性（与 Server 相同）
   - `equals(other: IXxxClient): boolean`
   - `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`

3. **DTO 定义**
   - `XxxServerDTO` (camelCase)
   - `XxxClientDTO` (camelCase，可能包含额外的 UI 字段)
   - `XxxPersistenceDTO` (snake_case)

4. **默认值常量**
   - `export const DEFAULT_XXX: XxxServerDTO = { ... }`

### 5. 聚合根规范

**每个聚合根必须包含：**

1. **Server 文件**
   - `XxxServerDTO`
   - `XxxPersistenceDTO`
   - 领域事件定义（Created, Updated, Deleted 等）
   - `XxxDomainEvent` 联合类型
   - `XxxServer` 接口（业务方法 + DTO 转换）

2. **Client 文件**
   - `XxxClientDTO` (含 UI 格式化字段)
   - `XxxClient` 接口（UI 辅助方法 + DTO 转换）

### 6. 实体规范

**每个实体必须包含：**

1. **Server 文件**
   - `XxxServerDTO`
   - `XxxPersistenceDTO`
   - `XxxServer` 接口（业务方法 + DTO 转换）
   - **必须包含聚合根外键**（如 `workspaceUuid`）

2. **Client 文件**
   - `XxxClientDTO` (含 UI 格式化字段)
   - `XxxClient` 接口（UI 辅助方法 + DTO 转换）

### 7. API DTO 规范

**分类：**

1. **Create Request**: `CreateXxxRequest`
2. **Update Request**: `UpdateXxxRequest`
3. **List Response**: `ListXxxResponse`
4. **特殊操作 Request/Response**: 根据具体业务命名

**注意事项：**
- Request 不包含 `uuid`, `createdAt`, `updatedAt`（由服务端生成）
- Response 通常包含完整或简化的 DTO
- List Response 必须包含 `total` 字段

## 🎯 关键设计决策

### 1. Server/Client 分离

**原因：**
- Server 接口包含完整的业务逻辑和 Persistence DTO
- Client 接口简化，只包含 UI 相关的辅助方法
- 避免客户端依赖服务端特定的实现细节

**示例：**
```typescript
// Server 包含 Persistence DTO
export interface XxxServer {
  toPersistenceDTO(): XxxPersistenceDTO;
}

// Client 不包含 Persistence DTO
export interface XxxClient {
  toClientDTO(): XxxClientDTO;
  toServerDTO(): XxxServerDTO;
}
```

### 2. 聚合根外键

**所有实体必须包含聚合根外键：**

```typescript
export interface DocumentServerDTO {
  uuid: string;
  workspaceUuid: string;  // ✅ 聚合根外键
  accountUuid: string;
  // ...
}

export interface EditorTabServerDTO {
  uuid: string;
  groupUuid: string;      // 所属分组
  sessionUuid: string;    // 所属会话
  workspaceUuid: string;  // ✅ 聚合根外键
  accountUuid: string;
  // ...
}
```

### 3. 可选字段规范

**使用 `| null` 而不是 `undefined`：**

```typescript
export interface XxxServerDTO {
  description?: string | null;  // ✅ 正确
  lastAccessedAt?: number | null;  // ✅ 正确
}
```

**原因：**
- `null` 可以显式序列化到 JSON
- `undefined` 在 JSON 序列化时会丢失
- 数据库中 `NULL` 对应 TypeScript 的 `null`

### 4. UI 格式化字段

**Client DTO 包含格式化字段：**

```typescript
export interface XxxClientDTO {
  // 基础字段
  createdAt: number;
  updatedAt: number;
  
  // UI 格式化字段
  formattedCreatedAt: string;  // "2024-06-28 10:30:00"
  formattedUpdatedAt: string;
}
```

### 5. 领域事件结构

**统一的事件结构：**

```typescript
export interface XxxCreatedEvent {
  readonly eventType: 'XxxCreated';  // 事件类型标识
  readonly occurredAt: number;       // 发生时间（epoch ms）
  readonly aggregateId: string;      // 聚合根 ID
  readonly xxx: XxxServerDTO;        // 完整的领域对象
}
```

## ✅ 检查清单

### 创建新值对象时

- [ ] 包含 `IXxxServer` 和 `IXxxClient` 接口
- [ ] 包含 `XxxServerDTO`, `XxxClientDTO`, `XxxPersistenceDTO`
- [ ] Server 接口包含 `equals()` 和 `with()` 方法
- [ ] 包含 `toServerDTO()`, `toClientDTO()`, `toPersistenceDTO()`
- [ ] 提供默认值常量 `DEFAULT_XXX`
- [ ] 在 `valueObjects/index.ts` 中导出

### 创建新聚合根时

- [ ] 分为 Server 和 Client 两个文件
- [ ] Server 包含 Persistence DTO 定义
- [ ] 定义领域事件（Created, Updated, Deleted 等）
- [ ] Server 接口包含完整的业务方法
- [ ] Client 接口包含 UI 辅助方法
- [ ] Client DTO 包含格式化字段（`formatted*`）
- [ ] 时间戳使用 `number` (epoch ms)
- [ ] 在 `aggregates/index.ts` 中导出

### 创建新实体时

- [ ] 分为 Server 和 Client 两个文件
- [ ] **包含聚合根外键**（如 `workspaceUuid`）
- [ ] Server 包含 Persistence DTO 定义
- [ ] Server 接口包含业务方法
- [ ] Client 接口包含 UI 辅助方法
- [ ] Client DTO 包含格式化字段（`formatted*`）
- [ ] 时间戳使用 `number` (epoch ms)
- [ ] 在 `entities/index.ts` 中导出

### 创建新 API DTO 时

- [ ] Create Request 不包含 `uuid`, `createdAt`, `updatedAt`
- [ ] Update Request 使用 `Partial` 类型（可选字段）
- [ ] List Response 包含 `total` 字段
- [ ] 在 `api-requests.ts` 中添加
- [ ] 从 `index.ts` 导出（通过 `export * from './api-requests'`）

## 🚀 下一步

1. **Domain-Server 层实现**
   - 参考 `docs/modules/repository/02-DOMAIN_SERVER_IMPLEMENTATION.md`
   - 实现聚合根类（private 构造函数 + 静态工厂）
   - 实现实体类
   - 定义仓储接口

2. **Domain-Client 层实现**
   - 参考 `docs/modules/repository/03-DOMAIN_CLIENT_IMPLEMENTATION.md`
   - 实现客户端领域模型（简化版）
   - 实现 UI 辅助方法
   - 实现日期格式化

3. **API 层实现**
   - 参考 `docs/modules/repository/04-API_IMPLEMENTATION.md`
   - 创建 TypeORM Entity
   - 实现 Repository
   - 实现 Application Service
   - 创建 Controller

4. **Web 层实现**
   - 参考 `docs/modules/repository/05-WEB_IMPLEMENTATION.md`
   - 创建 Pinia Store
   - 实现 Application Service
   - 创建 API Client
   - 实现 Composables
   - 创建 Vue Components

## 📚 参考文档

- Repository 模块实现指南：`docs/modules/repository/`
- Repository 模块总结：`docs/modules/repository/00-MODULE_IMPLEMENTATION_SUMMARY.md`
- Editor 模块 Contracts 层：`packages/contracts/src/modules/editor/`
- Repository 模块 Contracts 层：`packages/contracts/src/modules/repository/`

---

**创建完成时间**: 2024-06-28  
**总文件数**: 27 个文件  
**总代码量**: 约 60.5KB  
**编译状态**: ✅ 无错误
