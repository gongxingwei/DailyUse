# Editor 模块聚合根设计 (DDD 正确版本)

## DDD 设计原则

### 核心规则
1. ✅ **聚合根下只能有实体，不能有子聚合根**
2. ✅ **每个实体必须属于一个聚合根**
3. ✅ **聚合根负责管理其下所有实体的生命周期**
4. ✅ **跨聚合只能通过 UUID 引用，不能直接引用对象**
5. ✅ **一个仓储对应一个聚合根**

---

## 聚合根划分

根据 Editor 模块的业务特性，我们将其划分为 **2 个聚合根**：

### 1. EditorWorkspace (聚合根)
**业务职责**: 管理工作区及其会话
**包含实体**:
- EditorSession (实体)
- EditorGroup (实体)  
- EditorTab (实体)

**生命周期**: 工作区创建时创建，工作区删除时级联删除所有会话、分组、标签页

### 2. Document (聚合根)
**业务职责**: 管理文档及其版本
**包含实体**:
- DocumentVersion (实体)
- LinkedResource (实体)

**生命周期**: 文档创建时创建，文档删除时级联删除所有版本和链接资源

---

## 聚合根 1: EditorWorkspace

### 层次结构
```
EditorWorkspace (聚合根)
├── EditorSession (实体) - 编辑器会话
│   ├── EditorGroup (实体) - 分组
│   │   └── EditorTab (实体) - 标签页
```

### 关系说明
- **EditorWorkspace** 包含多个 **EditorSession**
- **EditorSession** 包含多个 **EditorGroup**
- **EditorGroup** 包含多个 **EditorTab**
- **EditorTab** 通过 `documentUuid` 引用 Document 聚合根

### EditorWorkspace (聚合根)

```typescript
export interface EditorWorkspaceServerDTO {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  
  // ===== 子实体集合 (直接管理) =====
  sessions: EditorSessionServerDTO[]; // ✅ 直接包含实体
  
  // ===== 状态 =====
  isActive: boolean;
  activeSessionUuid?: string | null;
  
  // ===== 工作区配置 =====
  layout: WorkspaceLayoutServerDTO;
  settings: WorkspaceSettingsServerDTO;
  
  // ===== 时间戳 =====
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export class EditorWorkspace extends Entity {
  private _sessions: EditorSession[] = [];
  private _activeSessionUuid?: string | null;
  
  // ===== 实体管理方法 =====
  
  // Session 管理
  addSession(params: CreateSessionParams): EditorSession {
    const session = EditorSession.create({
      workspaceUuid: this.uuid,
      accountUuid: this._accountUuid,
      ...params,
    });
    this._sessions.push(session);
    this.updateTimestamp();
    return session;
  }
  
  removeSession(sessionUuid: string): void {
    const index = this._sessions.findIndex(s => s.uuid === sessionUuid);
    if (index !== -1) {
      this._sessions.splice(index, 1);
      if (this._activeSessionUuid === sessionUuid) {
        this._activeSessionUuid = this._sessions[0]?.uuid ?? null;
      }
      this.updateTimestamp();
    }
  }
  
  getSession(sessionUuid: string): EditorSession | undefined {
    return this._sessions.find(s => s.uuid === sessionUuid);
  }
  
  getAllSessions(): EditorSession[] {
    return [...this._sessions];
  }
  
  setActiveSession(sessionUuid: string): void {
    const session = this.getSession(sessionUuid);
    if (session) {
      this._activeSessionUuid = sessionUuid;
      session.activate();
      this.updateTimestamp();
    }
  }
  
  // ===== 递归 DTO 转换 =====
  toServerDTO(): EditorWorkspaceServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      sessions: this._sessions.map(s => s.toServerDTO()), // ✅ 递归转换
      isActive: this._isActive,
      activeSessionUuid: this._activeSessionUuid,
      layout: this._layout.toServerDTO(),
      settings: this._settings.toServerDTO(),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
  
  static fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspace {
    const workspace = new EditorWorkspace({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
      activeSessionUuid: dto.activeSessionUuid,
      layout: WorkspaceLayout.fromServerDTO(dto.layout),
      settings: WorkspaceSettings.fromServerDTO(dto.settings),
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
    
    // ✅ 递归重建子实体
    workspace._sessions = dto.sessions.map(sessionDto => 
      EditorSession.fromServerDTO(sessionDto)
    );
    
    return workspace;
  }
}
```

### EditorSession (实体 - 属于 EditorWorkspace)

```typescript
export interface EditorSessionServerDTO {
  // ===== 基础属性 =====
  uuid: string;
  workspaceUuid: string; // ✅ 外键：所属聚合根
  accountUuid: string;
  name: string;
  description?: string | null;
  
  // ===== 子实体集合 =====
  groups: EditorGroupServerDTO[]; // ✅ 直接包含实体
  
  // ===== 状态 =====
  isActive: boolean;
  activeGroupUuid?: string | null;
  
  // ===== 布局配置 =====
  layout: SessionLayoutServerDTO;
  
  // ===== 时间戳 =====
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export class EditorSession extends Entity {
  private _workspaceUuid: string; // ✅ 所属聚合根 UUID
  private _groups: EditorGroup[] = [];
  private _activeGroupUuid?: string | null;
  
  // ===== 实体管理方法 =====
  
  addGroup(params: CreateGroupParams): EditorGroup {
    const group = EditorGroup.create({
      sessionUuid: this.uuid,
      workspaceUuid: this._workspaceUuid,
      ...params,
    });
    this._groups.push(group);
    this.updateTimestamp();
    return group;
  }
  
  removeGroup(groupUuid: string): void {
    const index = this._groups.findIndex(g => g.uuid === groupUuid);
    if (index !== -1) {
      this._groups.splice(index, 1);
      if (this._activeGroupUuid === groupUuid) {
        this._activeGroupUuid = this._groups[0]?.uuid ?? null;
      }
      this.updateTimestamp();
    }
  }
  
  getGroup(groupUuid: string): EditorGroup | undefined {
    return this._groups.find(g => g.uuid === groupUuid);
  }
  
  getAllGroups(): EditorGroup[] {
    return [...this._groups];
  }
  
  setActiveGroup(groupUuid: string): void {
    if (this._groups.some(g => g.uuid === groupUuid)) {
      this._activeGroupUuid = groupUuid;
      this.updateTimestamp();
    }
  }
  
  // ===== 递归 DTO 转换 =====
  toServerDTO(): EditorSessionServerDTO {
    return {
      uuid: this.uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      groups: this._groups.map(g => g.toServerDTO()), // ✅ 递归转换
      isActive: this._isActive,
      activeGroupUuid: this._activeGroupUuid,
      layout: this._layout.toServerDTO(),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
  
  static fromServerDTO(dto: EditorSessionServerDTO): EditorSession {
    const session = new EditorSession({
      uuid: dto.uuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
      activeGroupUuid: dto.activeGroupUuid,
      layout: SessionLayout.fromServerDTO(dto.layout),
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
    
    // ✅ 递归重建子实体
    session._groups = dto.groups.map(groupDto => 
      EditorGroup.fromServerDTO(groupDto)
    );
    
    return session;
  }
}
```

### EditorGroup (实体 - 属于 EditorSession)

```typescript
export interface EditorGroupServerDTO {
  // ===== 基础属性 =====
  uuid: string;
  sessionUuid: string; // ✅ 外键：所属实体
  workspaceUuid: string; // ✅ 外键：所属聚合根
  groupIndex: number;
  groupName?: string | null;
  
  // ===== 子实体集合 =====
  tabs: EditorTabServerDTO[]; // ✅ 直接包含实体
  
  // ===== 状态 =====
  activeTabUuid?: string | null;
  
  // ===== 布局 =====
  splitDirection?: 'horizontal' | 'vertical' | null;
  size?: number | null;
  
  // ===== 时间戳 =====
  createdAt: number;
  updatedAt: number;
}

export class EditorGroup extends Entity {
  private _sessionUuid: string; // ✅ 所属实体 UUID
  private _workspaceUuid: string; // ✅ 所属聚合根 UUID
  private _tabs: EditorTab[] = [];
  private _activeTabUuid?: string | null;
  
  // ===== 实体管理方法 =====
  
  addTab(params: CreateTabParams): EditorTab {
    const tab = EditorTab.create({
      groupUuid: this.uuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      ...params,
    });
    this._tabs.push(tab);
    this.updateTimestamp();
    return tab;
  }
  
  removeTab(tabUuid: string): void {
    const index = this._tabs.findIndex(t => t.uuid === tabUuid);
    if (index !== -1) {
      this._tabs.splice(index, 1);
      if (this._activeTabUuid === tabUuid) {
        this._activeTabUuid = this._tabs[0]?.uuid ?? null;
      }
      this.updateTimestamp();
    }
  }
  
  getTab(tabUuid: string): EditorTab | undefined {
    return this._tabs.find(t => t.uuid === tabUuid);
  }
  
  getAllTabs(): EditorTab[] {
    return [...this._tabs];
  }
  
  setActiveTab(tabUuid: string): void {
    if (this._tabs.some(t => t.uuid === tabUuid)) {
      this._activeTabUuid = tabUuid;
      this.updateTimestamp();
    }
  }
  
  // ===== 递归 DTO 转换 =====
  toServerDTO(): EditorGroupServerDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      groupIndex: this._groupIndex,
      groupName: this._groupName,
      tabs: this._tabs.map(t => t.toServerDTO()), // ✅ 递归转换
      activeTabUuid: this._activeTabUuid,
      splitDirection: this._splitDirection,
      size: this._size,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
  
  static fromServerDTO(dto: EditorGroupServerDTO): EditorGroup {
    const group = new EditorGroup({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      groupIndex: dto.groupIndex,
      groupName: dto.groupName,
      activeTabUuid: dto.activeTabUuid,
      splitDirection: dto.splitDirection,
      size: dto.size,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
    
    // ✅ 递归重建子实体
    group._tabs = dto.tabs.map(tabDto => 
      EditorTab.fromServerDTO(tabDto)
    );
    
    return group;
  }
}
```

### EditorTab (实体 - 属于 EditorGroup)

```typescript
export interface EditorTabServerDTO {
  // ===== 基础属性 =====
  uuid: string;
  groupUuid: string; // ✅ 外键：所属实体
  sessionUuid: string; // ✅ 外键：所属实体
  workspaceUuid: string; // ✅ 外键：所属聚合根
  documentUuid?: string | null; // ✅ 跨聚合引用 (Document 聚合根)
  
  // ===== 标签页属性 =====
  tabIndex: number;
  tabName: string;
  type: 'document' | 'preview' | 'diff' | 'settings';
  
  // ===== 状态 =====
  isActive: boolean;
  isPinned: boolean;
  isDirty: boolean;
  isPreview: boolean;
  
  // ===== 视图状态 =====
  viewState?: TabViewStateServerDTO | null;
  
  // ===== 时间戳 =====
  openedAt: number;
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export class EditorTab extends Entity {
  private _groupUuid: string; // ✅ 所属实体 UUID
  private _sessionUuid: string; // ✅ 所属实体 UUID
  private _workspaceUuid: string; // ✅ 所属聚合根 UUID
  private _documentUuid?: string | null; // ✅ 跨聚合引用
  
  // ===== 业务方法 =====
  
  activate(): void {
    this._isActive = true;
    this._lastAccessedAt = Date.now();
    this.updateTimestamp();
  }
  
  deactivate(): void {
    this._isActive = false;
    this.updateTimestamp();
  }
  
  markDirty(): void {
    this._isDirty = true;
    this.updateTimestamp();
  }
  
  markClean(): void {
    this._isDirty = false;
    this.updateTimestamp();
  }
  
  pin(): void {
    this._isPinned = true;
    this.updateTimestamp();
  }
  
  unpin(): void {
    this._isPinned = false;
    this.updateTimestamp();
  }
  
  updateViewState(viewState: TabViewState): void {
    this._viewState = viewState;
    this.updateTimestamp();
  }
  
  // ===== DTO 转换 =====
  toServerDTO(): EditorTabServerDTO {
    return {
      uuid: this.uuid,
      groupUuid: this._groupUuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      documentUuid: this._documentUuid,
      tabIndex: this._tabIndex,
      tabName: this._tabName,
      type: this._type,
      isActive: this._isActive,
      isPinned: this._isPinned,
      isDirty: this._isDirty,
      isPreview: this._isPreview,
      viewState: this._viewState?.toServerDTO() ?? null,
      openedAt: this._openedAt,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
  
  static fromServerDTO(dto: EditorTabServerDTO): EditorTab {
    return new EditorTab({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      documentUuid: dto.documentUuid,
      tabIndex: dto.tabIndex,
      tabName: dto.tabName,
      type: dto.type,
      isActive: dto.isActive,
      isPinned: dto.isPinned,
      isDirty: dto.isDirty,
      isPreview: dto.isPreview,
      viewState: dto.viewState ? TabViewState.fromServerDTO(dto.viewState) : null,
      openedAt: dto.openedAt,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
```

---

## 聚合根 2: Document

### 层次结构
```
Document (聚合根)
├── DocumentVersion (实体) - 文档版本
└── LinkedResource (实体) - 链接资源
```

### 关系说明
- **Document** 包含多个 **DocumentVersion**
- **Document** 包含多个 **LinkedResource**
- **EditorTab** 通过 `documentUuid` 引用 **Document**

### Document (聚合根)

```typescript
export interface DocumentServerDTO {
  // ===== 基础属性 =====
  uuid: string;
  workspaceUuid: string; // ✅ 跨聚合引用 (EditorWorkspace)
  
  // ===== 文件信息 =====
  path: string;
  filename: string;
  language: string;
  encoding: string;
  
  // ===== 内容 =====
  content: string;
  size: number;
  lineCount: number;
  hash?: string | null;
  
  // ===== 子实体集合 =====
  versions: DocumentVersionServerDTO[]; // ✅ 直接包含实体
  resources: LinkedResourceServerDTO[]; // ✅ 直接包含实体
  
  // ===== 版本控制 =====
  currentVersionUuid?: string | null;
  versionCount: number;
  
  // ===== 状态 =====
  isDirty: boolean;
  isSaved: boolean;
  isReadonly: boolean;
  
  // ===== 时间戳 =====
  lastSavedAt?: number | null;
  modifiedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export class Document extends Entity {
  private _workspaceUuid: string; // ✅ 跨聚合引用
  private _versions: DocumentVersion[] = [];
  private _resources: LinkedResource[] = [];
  
  // ===== 实体管理方法 =====
  
  // Version 管理
  createVersion(params: CreateVersionParams): DocumentVersion {
    const version = DocumentVersion.create({
      documentUuid: this.uuid,
      versionNumber: this._versions.length + 1,
      content: this._content,
      ...params,
    });
    this._versions.push(version);
    this._currentVersionUuid = version.uuid;
    this._versionCount++;
    this.updateTimestamp();
    return version;
  }
  
  getVersion(versionUuid: string): DocumentVersion | undefined {
    return this._versions.find(v => v.uuid === versionUuid);
  }
  
  getAllVersions(): DocumentVersion[] {
    return [...this._versions];
  }
  
  // Resource 管理
  addResource(params: CreateResourceParams): LinkedResource {
    const resource = LinkedResource.create({
      documentUuid: this.uuid,
      ...params,
    });
    this._resources.push(resource);
    this.updateTimestamp();
    return resource;
  }
  
  removeResource(resourceUuid: string): void {
    const index = this._resources.findIndex(r => r.uuid === resourceUuid);
    if (index !== -1) {
      this._resources.splice(index, 1);
      this.updateTimestamp();
    }
  }
  
  getResource(resourceUuid: string): LinkedResource | undefined {
    return this._resources.find(r => r.uuid === resourceUuid);
  }
  
  getAllResources(): LinkedResource[] {
    return [...this._resources];
  }
  
  // ===== 递归 DTO 转换 =====
  toServerDTO(): DocumentServerDTO {
    return {
      uuid: this.uuid,
      workspaceUuid: this._workspaceUuid,
      path: this._path,
      filename: this._filename,
      language: this._language,
      encoding: this._encoding,
      content: this._content,
      size: this._size,
      lineCount: this._lineCount,
      hash: this._hash,
      versions: this._versions.map(v => v.toServerDTO()), // ✅ 递归转换
      resources: this._resources.map(r => r.toServerDTO()), // ✅ 递归转换
      currentVersionUuid: this._currentVersionUuid,
      versionCount: this._versionCount,
      isDirty: this._isDirty,
      isSaved: this._isSaved,
      isReadonly: this._isReadonly,
      lastSavedAt: this._lastSavedAt,
      modifiedAt: this._modifiedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
  
  static fromServerDTO(dto: DocumentServerDTO): Document {
    const document = new Document({
      uuid: dto.uuid,
      workspaceUuid: dto.workspaceUuid,
      path: dto.path,
      filename: dto.filename,
      language: dto.language,
      encoding: dto.encoding,
      content: dto.content,
      size: dto.size,
      lineCount: dto.lineCount,
      hash: dto.hash,
      currentVersionUuid: dto.currentVersionUuid,
      versionCount: dto.versionCount,
      isDirty: dto.isDirty,
      isSaved: dto.isSaved,
      isReadonly: dto.isReadonly,
      lastSavedAt: dto.lastSavedAt,
      modifiedAt: dto.modifiedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
    
    // ✅ 递归重建子实体
    document._versions = dto.versions.map(versionDto => 
      DocumentVersion.fromServerDTO(versionDto)
    );
    document._resources = dto.resources.map(resourceDto => 
      LinkedResource.fromServerDTO(resourceDto)
    );
    
    return document;
  }
}
```

---

## 仓储接口设计

### ✅ 一个聚合根对应一个仓储

```typescript
// ===== EditorWorkspace 聚合根仓储 =====
export interface IEditorWorkspaceRepository {
  // 聚合根操作
  save(workspace: EditorWorkspace): Promise<void>;
  findById(uuid: string): Promise<EditorWorkspace | null>;
  findByAccountUuid(accountUuid: string): Promise<EditorWorkspace[]>;
  delete(uuid: string): Promise<void>;
  
  // ⚠️ 注意：不需要单独的 Session/Group/Tab 操作
  // 所有子实体都通过聚合根管理
}

// ===== Document 聚合根仓储 =====
export interface IDocumentRepository {
  // 聚合根操作
  save(document: Document): Promise<void>;
  findById(uuid: string): Promise<Document | null>;
  findByWorkspaceUuid(workspaceUuid: string): Promise<Document[]>;
  delete(uuid: string): Promise<void>;
  
  // ⚠️ 注意：不需要单独的 Version/Resource 操作
  // 所有子实体都通过聚合根管理
}
```

---

## 跨聚合引用示例

```typescript
// ❌ 错误：直接引用对象
class EditorTab {
  private _document: Document; // ❌ 不能直接持有另一个聚合根
}

// ✅ 正确：通过 UUID 引用
class EditorTab {
  private _documentUuid?: string | null; // ✅ 只保存 UUID
  
  // 需要时通过仓储获取
  async getDocument(documentRepo: IDocumentRepository): Promise<Document | null> {
    if (!this._documentUuid) return null;
    return await documentRepo.findById(this._documentUuid);
  }
}
```

---

## 操作示例

### 1. 创建完整的工作区结构

```typescript
// 创建聚合根
const workspace = EditorWorkspace.create({
  accountUuid: 'user-123',
  name: 'My Workspace',
});

// 添加会话 (实体)
const session = workspace.addSession({
  name: 'Session 1',
});

// 添加分组 (实体)
const group = session.addGroup({
  groupIndex: 0,
  groupName: 'Group 1',
});

// 添加标签页 (实体)
const tab = group.addTab({
  tabIndex: 0,
  tabName: 'index.ts',
  type: 'document',
  documentUuid: 'doc-456', // ✅ 跨聚合引用
});

// 保存整个聚合根（级联保存所有子实体）
await workspaceRepository.save(workspace);
```

### 2. 获取并修改聚合根

```typescript
// 加载整个聚合根（包含所有子实体）
const workspace = await workspaceRepository.findById('workspace-123');

if (workspace) {
  // 获取会话
  const session = workspace.getSession('session-456');
  
  // 获取分组
  const group = session?.getGroup('group-789');
  
  // 获取标签页
  const tab = group?.getTab('tab-012');
  
  // 修改标签页
  tab?.markDirty();
  
  // 保存整个聚合根（级联更新所有修改）
  await workspaceRepository.save(workspace);
}
```

---

## 总结

### ✅ 正确的设计
1. **EditorWorkspace** 聚合根管理 Session → Group → Tab
2. **Document** 聚合根管理 Version + Resource
3. 跨聚合只通过 UUID 引用
4. 一个聚合根对应一个仓储
5. 所有子实体通过聚合根管理

### ❌ 之前的错误
1. ~~EditorSession 作为聚合根~~ (应该是实体)
2. ~~聚合根下包含子聚合根~~ (违反 DDD 原则)
3. ~~每个实体都有独立仓储~~ (应该通过聚合根管理)

### 📂 文件结构
```
packages/domain-server/src/editor/
├── aggregates/
│   ├── EditorWorkspace.ts    # 聚合根
│   ├── Document.ts            # 聚合根
│   └── index.ts
├── entities/
│   ├── EditorSession.ts       # 实体
│   ├── EditorGroup.ts         # 实体
│   ├── EditorTab.ts           # 实体
│   ├── DocumentVersion.ts     # 实体
│   ├── LinkedResource.ts      # 实体
│   └── index.ts
├── repositories/
│   ├── IEditorWorkspaceRepository.ts
│   ├── IDocumentRepository.ts
│   └── index.ts
└── value-objects/
    ├── WorkspaceLayout.ts
    ├── SessionLayout.ts
    ├── TabViewState.ts
    └── index.ts
```

这样的设计完全符合 DDD 原则！
