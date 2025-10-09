# Editor 模块实体设计 (更新版)

> **设计决策变更**:
> 1. ✅ 时间戳统一使用 `number` (epoch ms)
> 2. ✅ 添加完整的双向转换方法 (`from*DTO`)

## 关键变更说明

### 1. 时间戳类型
```typescript
// ❌ 旧版本
createdAt: Date;
updatedAt: Date;
openedAt?: Date | null;

// ✅ 新版本
createdAt: number; // epoch ms
updatedAt: number;
openedAt?: number | null;
```

### 2. 转换方法
```typescript
// ❌ 旧版本 (只有 to)
toServerDTO(): EditorWorkspaceServerDTO;
toClientDTO(): EditorWorkspaceClientDTO;
toPersistenceDTO(): EditorWorkspacePersistenceDTO;

// ✅ 新版本 (完整双向)
// To Methods
toServerDTO(): EditorWorkspaceServerDTO;
toClientDTO(): EditorWorkspaceClientDTO;
toPersistenceDTO(): EditorWorkspacePersistenceDTO;

// From Methods (静态工厂)
fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspaceServer;
fromClientDTO(dto: EditorWorkspaceClientDTO): EditorWorkspaceServer;
fromPersistenceDTO(dto: EditorWorkspacePersistenceDTO): EditorWorkspaceServer;
```

---

## 实体接口更新摘要

### 1. EditorWorkspaceServer (聚合根)

```typescript
export interface EditorWorkspaceServer {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  
  // 关联项目
  projectPath: string;
  projectType: ProjectType;
  
  // 工作区配置
  layout: WorkspaceLayout;
  settings: WorkspaceSettings;
  
  // 状态
  isActive: boolean;
  lastActiveSessionUuid?: string | null;
  
  // ✅ 统一使用 number
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ✅ 完整转换方法
  toServerDTO(): EditorWorkspaceServerDTO;
  toClientDTO(): EditorWorkspaceClientDTO;
  toPersistenceDTO(): EditorWorkspacePersistenceDTO;
  fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspaceServer;
  fromClientDTO(dto: EditorWorkspaceClientDTO): EditorWorkspaceServer;
  fromPersistenceDTO(dto: EditorWorkspacePersistenceDTO): EditorWorkspaceServer;
}
```

### 2. EditorWorkspaceClient

```typescript
export interface EditorWorkspaceClient {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  
  projectPath: string;
  projectType: ProjectType;
  
  layout: WorkspaceLayout;
  settings: WorkspaceSettings;
  
  isActive: boolean;
  lastActiveSessionUuid?: string | null;
  
  // ✅ 统一使用 number
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // UI 格式化属性
  formattedLastAccessed?: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  
  // ✅ 转换方法
  toServerDTO(): EditorWorkspaceServerDTO;
  toClientDTO(): EditorWorkspaceClientDTO;
  fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspaceClient;
  fromClientDTO(dto: EditorWorkspaceClientDTO): EditorWorkspaceClient;
}
```

---

### 3. DocumentServer (实体)

```typescript
export interface DocumentServer {
  uuid: string;
  workspaceUuid: string;
  
  path: string;
  filename: string;
  language: string;
  encoding: string;
  
  content: string;
  size: number;
  
  // 版本控制
  currentVersionUuid?: string | null;
  versionCount: number;
  
  // 状态
  isDirty: boolean;
  isSaved: boolean;
  isReadonly: boolean;
  
  // 元数据
  lineCount: number;
  hash?: string | null;
  
  // ✅ 统一使用 number
  lastSavedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;
  
  // ✅ 完整转换方法
  toServerDTO(): DocumentServerDTO;
  toClientDTO(): DocumentClientDTO;
  toPersistenceDTO(): DocumentPersistenceDTO;
  fromServerDTO(dto: DocumentServerDTO): DocumentServer;
  fromClientDTO(dto: DocumentClientDTO): DocumentServer;
  fromPersistenceDTO(dto: DocumentPersistenceDTO): DocumentServer;
}
```

### 4. DocumentClient

```typescript
export interface DocumentClient {
  uuid: string;
  workspaceUuid: string;
  
  path: string;
  filename: string;
  language: string;
  
  content: string;
  size: number;
  
  currentVersionUuid?: string | null;
  versionCount: number;
  
  isDirty: boolean;
  isSaved: boolean;
  isReadonly: boolean;
  
  lineCount: number;
  
  // ✅ 统一使用 number
  lastSavedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  modifiedAt?: number | null;
  
  // UI 格式化
  formattedLastSaved?: string;
  formattedSize: string;
  formattedModified?: string;
  
  // ✅ 转换方法
  toServerDTO(): DocumentServerDTO;
  toClientDTO(): DocumentClientDTO;
  fromServerDTO(dto: DocumentServerDTO): DocumentClient;
  fromClientDTO(dto: DocumentClientDTO): DocumentClient;
}
```

---

### 5. DocumentVersionServer (实体)

```typescript
export interface DocumentVersionServer {
  uuid: string;
  documentUuid: string;
  
  versionNumber: number;
  content: string;
  
  changeType: VersionChangeType;
  changeDescription?: string | null;
  changeSize: number;
  
  hash: string;
  
  authorUuid?: string | null;
  authorName?: string | null;
  
  // ✅ 统一使用 number
  createdAt: number;
  
  // ✅ 完整转换方法
  toServerDTO(): DocumentVersionServerDTO;
  toClientDTO(): DocumentVersionClientDTO;
  toPersistenceDTO(): DocumentVersionPersistenceDTO;
  fromServerDTO(dto: DocumentVersionServerDTO): DocumentVersionServer;
  fromClientDTO(dto: DocumentVersionClientDTO): DocumentVersionServer;
  fromPersistenceDTO(dto: DocumentVersionPersistenceDTO): DocumentVersionServer;
}
```

### 6. DocumentVersionClient

```typescript
export interface DocumentVersionClient {
  uuid: string;
  documentUuid: string;
  
  versionNumber: number;
  content: string;
  
  changeType: VersionChangeType;
  changeDescription?: string | null;
  changeSize: number;
  
  authorName?: string | null;
  
  // ✅ 统一使用 number
  createdAt: number;
  
  // UI 格式化
  formattedCreatedAt: string;
  formattedChangeSize: string;
  changeTypeLabel: string;
  
  // ✅ 转换方法
  toServerDTO(): DocumentVersionServerDTO;
  toClientDTO(): DocumentVersionClientDTO;
  fromServerDTO(dto: DocumentVersionServerDTO): DocumentVersionClient;
  fromClientDTO(dto: DocumentVersionClientDTO): DocumentVersionClient;
}
```

---

### 7. EditorSessionServer (实体)

```typescript
export interface EditorSessionServer {
  uuid: string;
  workspaceUuid: string;
  
  sessionName: string;
  description?: string | null;
  
  // 当前状态
  activeGroupUuid?: string | null;
  activeTabUuid?: string | null;
  openedDocumentUuids: string[];
  
  // 会话配置
  layout: SessionLayout;
  viewState: SessionViewState;
  
  // 状态
  isActive: boolean;
  isPinned: boolean;
  
  // ✅ 统一使用 number
  lastActiveAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ✅ 完整转换方法
  toServerDTO(): EditorSessionServerDTO;
  toClientDTO(): EditorSessionClientDTO;
  toPersistenceDTO(): EditorSessionPersistenceDTO;
  fromServerDTO(dto: EditorSessionServerDTO): EditorSessionServer;
  fromClientDTO(dto: EditorSessionClientDTO): EditorSessionServer;
  fromPersistenceDTO(dto: EditorSessionPersistenceDTO): EditorSessionServer;
}
```

### 8. EditorSessionClient

```typescript
export interface EditorSessionClient {
  uuid: string;
  workspaceUuid: string;
  
  sessionName: string;
  description?: string | null;
  
  activeGroupUuid?: string | null;
  activeTabUuid?: string | null;
  openedDocumentUuids: string[];
  
  layout: SessionLayout;
  viewState: SessionViewState;
  
  isActive: boolean;
  isPinned: boolean;
  
  // ✅ 统一使用 number
  lastActiveAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // UI 格式化
  formattedLastActive?: string;
  openedDocumentCount: number;
  
  // ✅ 转换方法
  toServerDTO(): EditorSessionServerDTO;
  toClientDTO(): EditorSessionClientDTO;
  fromServerDTO(dto: EditorSessionServerDTO): EditorSessionClient;
  fromClientDTO(dto: EditorSessionClientDTO): EditorSessionClient;
}
```

---

### 9. EditorGroupServer (实体)

```typescript
export interface EditorGroupServer {
  uuid: string;
  sessionUuid: string;
  workspaceUuid: string;
  
  groupName?: string | null;
  groupIndex: number;
  
  // 标签页
  tabUuids: string[];
  activeTabUuid?: string | null;
  
  // 布局
  splitDirection?: SplitDirection | null;
  size?: number | null;
  
  // ✅ 统一使用 number
  createdAt: number;
  updatedAt: number;
  
  // ✅ 完整转换方法
  toServerDTO(): EditorGroupServerDTO;
  toClientDTO(): EditorGroupClientDTO;
  toPersistenceDTO(): EditorGroupPersistenceDTO;
  fromServerDTO(dto: EditorGroupServerDTO): EditorGroupServer;
  fromClientDTO(dto: EditorGroupClientDTO): EditorGroupServer;
  fromPersistenceDTO(dto: EditorGroupPersistenceDTO): EditorGroupServer;
}
```

### 10. EditorGroupClient

```typescript
export interface EditorGroupClient {
  uuid: string;
  sessionUuid: string;
  workspaceUuid: string;
  
  groupName?: string | null;
  groupIndex: number;
  
  tabUuids: string[];
  activeTabUuid?: string | null;
  
  splitDirection?: SplitDirection | null;
  size?: number | null;
  
  // ✅ 统一使用 number
  createdAt: number;
  updatedAt: number;
  
  // UI 属性
  tabCount: number;
  splitDirectionLabel?: string;
  
  // ✅ 转换方法
  toServerDTO(): EditorGroupServerDTO;
  toClientDTO(): EditorGroupClientDTO;
  fromServerDTO(dto: EditorGroupServerDTO): EditorGroupClient;
  fromClientDTO(dto: EditorGroupClientDTO): EditorGroupClient;
}
```

---

### 11. EditorTabServer (实体)

```typescript
export interface EditorTabServer {
  uuid: string;
  groupUuid: string;
  sessionUuid: string;
  documentUuid?: string | null;
  
  tabName: string;
  tabIndex: number;
  
  // 标签页类型
  type: TabType;
  
  // 视图状态
  viewState?: TabViewState | null;
  
  // 状态
  isActive: boolean;
  isPinned: boolean;
  isDirty: boolean;
  isPreview: boolean;
  
  // ✅ 统一使用 number
  openedAt: number;
  lastActiveAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ✅ 完整转换方法
  toServerDTO(): EditorTabServerDTO;
  toClientDTO(): EditorTabClientDTO;
  toPersistenceDTO(): EditorTabPersistenceDTO;
  fromServerDTO(dto: EditorTabServerDTO): EditorTabServer;
  fromClientDTO(dto: EditorTabClientDTO): EditorTabServer;
  fromPersistenceDTO(dto: EditorTabPersistenceDTO): EditorTabServer;
}
```

### 12. EditorTabClient

```typescript
export interface EditorTabClient {
  uuid: string;
  groupUuid: string;
  sessionUuid: string;
  documentUuid?: string | null;
  
  tabName: string;
  tabIndex: number;
  type: TabType;
  
  viewState?: TabViewState | null;
  
  isActive: boolean;
  isPinned: boolean;
  isDirty: boolean;
  isPreview: boolean;
  
  // ✅ 统一使用 number
  openedAt: number;
  lastActiveAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // UI 格式化
  formattedOpenedAt: string;
  formattedLastActive?: string;
  typeLabel: string;
  
  // ✅ 转换方法
  toServerDTO(): EditorTabServerDTO;
  toClientDTO(): EditorTabClientDTO;
  fromServerDTO(dto: EditorTabServerDTO): EditorTabClient;
  fromClientDTO(dto: EditorTabClientDTO): EditorTabClient;
}
```

---

### 13. SearchEngineServer (实体)

```typescript
export interface SearchEngineServer {
  uuid: string;
  workspaceUuid: string;
  
  // 索引状态
  indexStatus: IndexStatus;
  indexedFileCount: number;
  totalFileCount: number;
  indexProgress: number;
  
  // 索引配置
  indexedPaths: string[];
  excludedPatterns: string[];
  
  // 统计
  searchCount: number;
  
  // ✅ 统一使用 number
  lastIndexedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ✅ 完整转换方法
  toServerDTO(): SearchEngineServerDTO;
  toClientDTO(): SearchEngineClientDTO;
  toPersistenceDTO(): SearchEnginePersistenceDTO;
  fromServerDTO(dto: SearchEngineServerDTO): SearchEngineServer;
  fromClientDTO(dto: SearchEngineClientDTO): SearchEngineServer;
  fromPersistenceDTO(dto: SearchEnginePersistenceDTO): SearchEngineServer;
}
```

### 14. SearchEngineClient

```typescript
export interface SearchEngineClient {
  uuid: string;
  workspaceUuid: string;
  
  indexStatus: IndexStatus;
  indexedFileCount: number;
  totalFileCount: number;
  indexProgress: number;
  
  indexedPaths: string[];
  excludedPatterns: string[];
  
  searchCount: number;
  
  // ✅ 统一使用 number
  lastIndexedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // UI 格式化
  indexStatusLabel: string;
  formattedProgress: string;
  formattedLastIndexed?: string;
  
  // ✅ 转换方法
  toServerDTO(): SearchEngineServerDTO;
  toClientDTO(): SearchEngineClientDTO;
  fromServerDTO(dto: SearchEngineServerDTO): SearchEngineClient;
  fromClientDTO(dto: SearchEngineClientDTO): SearchEngineClient;
}
```

---

### 15. LinkedResourceServer (实体)

```typescript
export interface LinkedResourceServer {
  uuid: string;
  documentUuid: string;
  
  sourceType: LinkedSourceType;
  targetType: LinkedTargetType;
  
  // 链接信息
  linkPath: string;
  linkName?: string | null;
  linkDescription?: string | null;
  
  // 验证状态
  isValid: boolean;
  validationError?: string | null;
  
  // 元数据
  metadata?: Record<string, any> | null;
  
  // ✅ 统一使用 number
  lastValidatedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // ✅ 完整转换方法
  toServerDTO(): LinkedResourceServerDTO;
  toClientDTO(): LinkedResourceClientDTO;
  toPersistenceDTO(): LinkedResourcePersistenceDTO;
  fromServerDTO(dto: LinkedResourceServerDTO): LinkedResourceServer;
  fromClientDTO(dto: LinkedResourceClientDTO): LinkedResourceServer;
  fromPersistenceDTO(dto: LinkedResourcePersistenceDTO): LinkedResourceServer;
}
```

### 16. LinkedResourceClient

```typescript
export interface LinkedResourceClient {
  uuid: string;
  documentUuid: string;
  
  sourceType: LinkedSourceType;
  targetType: LinkedTargetType;
  
  linkPath: string;
  linkName?: string | null;
  linkDescription?: string | null;
  
  isValid: boolean;
  validationError?: string | null;
  
  // ✅ 统一使用 number
  lastValidatedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  
  // UI 格式化
  sourceTypeLabel: string;
  targetTypeLabel: string;
  formattedLastValidated?: string;
  validationStatusIcon: string;
  
  // ✅ 转换方法
  toServerDTO(): LinkedResourceServerDTO;
  toClientDTO(): LinkedResourceClientDTO;
  fromServerDTO(dto: LinkedResourceServerDTO): LinkedResourceClient;
  fromClientDTO(dto: LinkedResourceClientDTO): LinkedResourceClient;
}
```

---

## 值对象更新

### WorkspaceLayout
```typescript
// 无时间戳，无需变更
export interface WorkspaceLayout {
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number;
  panelPosition: 'bottom' | 'right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;
}
```

### SessionLayout
```typescript
// 无时间戳，无需变更
export interface SessionLayout {
  splitType: 'horizontal' | 'vertical' | 'grid';
  groupCount: number;
  activeGroupIndex: number;
}
```

### TabViewState
```typescript
// 无时间戳，无需变更
export interface TabViewState {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }>;
}
```

---

## 转换方法实现模式

### Server Entity (示例)

```typescript
class EditorWorkspaceServerImpl implements EditorWorkspaceServer {
  // ... properties
  
  // ===== To Methods =====
  toServerDTO(): EditorWorkspaceServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      // ...
      lastAccessedAt: this.lastAccessedAt, // ✅ 直接复制 number
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  
  toClientDTO(): EditorWorkspaceClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      // ...
      lastAccessedAt: this.lastAccessedAt, // ✅ 直接复制 number
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  
  toPersistenceDTO(): EditorWorkspacePersistenceDTO {
    return {
      uuid: this.uuid,
      account_uuid: this.accountUuid,
      name: this.name,
      // ...
      last_accessed_at: this.lastAccessedAt, // ✅ 直接复制 number
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
  
  // ===== From Methods (静态工厂) =====
  static fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspaceServer {
    return new EditorWorkspaceServerImpl({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      // ...
      lastAccessedAt: dto.lastAccessedAt, // ✅ 直接复制 number
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
  
  static fromClientDTO(dto: EditorWorkspaceClientDTO): EditorWorkspaceServer {
    return new EditorWorkspaceServerImpl({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      // ...
      lastAccessedAt: dto.lastAccessedAt, // ✅ 直接复制 number
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
  
  static fromPersistenceDTO(dto: EditorWorkspacePersistenceDTO): EditorWorkspaceServer {
    return new EditorWorkspaceServerImpl({
      uuid: dto.uuid,
      accountUuid: dto.account_uuid,
      name: dto.name,
      // ...
      lastAccessedAt: dto.last_accessed_at, // ✅ 直接复制 number
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    });
  }
}
```

---

## 总结

### 变更点
1. ✅ **时间戳类型**: 所有 `Date` → `number` (epoch ms)
2. ✅ **转换方法**: 添加 `fromXxxDTO()` 静态工厂方法
3. ✅ **零成本转换**: 时间戳跨层传递无需转换
4. ✅ **date-fns 兼容**: 完全支持 `number` 参数

### 影响范围
- ✅ 所有 Server 实体（8个）
- ✅ 所有 Client 实体（8个）
- ✅ 所有值对象（3个）
- ✅ 所有 DTO 定义

### 下一步
1. ✅ 生成完整的 contracts 文件
2. ✅ 实现 Mapper 类
3. ✅ 更新所有使用这些实体的模块

---

📖 **参考文档**:
- `docs/TIMESTAMP_DESIGN_DECISION.md` - 时间戳选择详解
- `docs/ENTITY_DTO_CONVERSION_SPEC.md` - 转换方法完整规范
- `docs/REPOSITORY_MODULE_ENTITIES_DESIGN_v2.md` - Repository 模块更新
