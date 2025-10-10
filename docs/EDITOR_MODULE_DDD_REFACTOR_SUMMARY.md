# Editor 模块 DDD 重构总结

## ✅ 已完成的工作

### 1. 正确的聚合根设计文档
- 创建了 `docs/EDITOR_MODULE_AGGREGATE_DESIGN.md`
- 明确了 DDD 原则：
  - EditorWorkspace (聚合根) → EditorSession (实体) → EditorGroup (实体) → EditorTab (实体)
  - Document (聚合根) → DocumentVersion (实体) + LinkedResource (实体)
  - 跨聚合只通过 UUID 引用
  - 一个聚合根对应一个仓储

### 2. 文件结构调整
- ✅ 将 EditorSession 从 `aggregates/` 移动到 `entities/`
- ✅ 更新了 `aggregates/index.ts` (只导出聚合根)
- ✅ 更新了 `entities/index.ts` (导出 EditorSession)
- ✅ 修正了 EditorWorkspace 的导入路径

### 3. EditorSession 实体实现
- ✅ 创建了 `entities/EditorSession.ts`
- ✅ 实现了完整的实体功能：
  - 工厂方法 `create()`
  - 子实体管理方法 (`addGroup`, `removeGroup`, etc.)
  - 业务方法 (`activate`, `deactivate`, `updateLayout`, etc.)
  - DTO 转换方法 (`toServerDTO`, `toClientDTO`, `toPersistenceDTO`)
  - From DTO 方法 (`fromServerDTO`, `fromClientDTO`, `fromPersistenceDTO`)

### 4. EditorGroup 实体增强
- ✅ 添加了 `fromServerDTO` 方法
- ✅ 添加了 `fromClientDTO` 方法
- ✅ 添加了 `fromPersistenceDTO` 方法
- ✅ 实现了递归重建子实体 (EditorTab)

---

## ❌ 当前存在的问题

### 1. Contracts 包缺少 DTO 定义
**问题**: `packages/contracts/src/editor/` 中没有以下 DTO 定义：
- `EditorSessionServerDTO`
- `EditorSessionClientDTO`
- `EditorSessionPersistenceDTO`
- `EditorGroupServerDTO`
- `EditorGroupClientDTO`
- `EditorGroupPersistenceDTO`

**影响**: 
- TypeScript 编译错误
- 无法完成类型检查
- domain-server 和 domain-client 无法正确导入类型

### 2. EditorGroup 有重复的方法
**问题**: `EditorGroup.ts` 中有两个 `fromPersistenceDTO` 方法定义

**位置**:
- Line 143
- Line 327

**解决方案**: 删除其中一个重复定义

### 3. EditorTab 缺少 From DTO 方法
**问题**: EditorTab 没有以下静态方法：
- `EditorTab.fromServerDTO()`
- `EditorTab.fromClientDTO()`
- `EditorTab.fromPersistenceDTO()`

**影响**: EditorGroup 无法递归重建 EditorTab 子实体

### 4. DTO 类型不匹配
**问题列表**:
1. `EditorSessionClientDTO` 没有 `groupCount` 属性
2. `EditorSessionPersistenceDTO` 的 `layout` 字段类型是 `string`，但代码尝试转换为对象
3. `EditorSessionPersistenceDTO` 没有 `groups` 属性
4. `EditorGroupPersistenceDTO` 没有 `tabs` 属性

---

## 📋 接下来需要做的工作

### 优先级 1：完善 Contracts 包 (必须先做)

#### 1.1 创建 EditorSession DTO 定义
文件: `packages/contracts/src/editor/editor-session-dtos.ts`

```typescript
// Server DTO
export interface EditorSessionServerDTO {
  uuid: string;
  workspaceUuid: string;
  accountUuid: string;
  name: string;
  description: string | null;
  groups: EditorGroupServerDTO[]; // ✅ 包含子实体
  isActive: boolean;
  activeGroupIndex: number;
  layout: SessionLayoutServerDTO;
  lastAccessedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

// Client DTO
export interface EditorSessionClientDTO {
  uuid: string;
  workspaceUuid: string;
  accountUuid: string;
  name: string;
  description: string | null;
  groups: EditorGroupClientDTO[]; // ✅ 包含子实体
  isActive: boolean;
  activeGroupIndex: number;
  layout: SessionLayoutClientDTO;
  groupCount: number; // UI 辅助字段
  lastAccessedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

// Persistence DTO
export interface EditorSessionPersistenceDTO {
  uuid: string;
  workspace_uuid: string;
  account_uuid: string;
  name: string;
  description: string | null;
  groups: EditorGroupPersistenceDTO[]; // ✅ 包含子实体 (JSON 存储)
  is_active: boolean;
  active_group_index: number;
  layout: string; // JSON 字符串 (或者改为对象类型)
  last_accessed_at: number | null;
  created_at: number;
  updated_at: number;
}
```

#### 1.2 创建/修正 EditorGroup DTO 定义
文件: `packages/contracts/src/editor/editor-group-dtos.ts`

```typescript
// Server DTO
export interface EditorGroupServerDTO {
  uuid: string;
  sessionUuid: string;
  workspaceUuid: string;
  accountUuid: string;
  groupIndex: number;
  activeTabIndex: number;
  name: string | null;
  tabs: EditorTabServerDTO[]; // ✅ 包含子实体
  createdAt: number;
  updatedAt: number;
}

// Client DTO
export interface EditorGroupClientDTO {
  uuid: string;
  sessionUuid: string;
  workspaceUuid: string;
  accountUuid: string;
  groupIndex: number;
  activeTabIndex: number;
  name: string | null;
  tabs: EditorTabClientDTO[]; // ✅ 包含子实体
  createdAt: number;
  updatedAt: number;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

// Persistence DTO
export interface EditorGroupPersistenceDTO {
  uuid: string;
  session_uuid: string;
  workspace_uuid: string;
  account_uuid: string;
  group_index: number;
  active_tab_index: number;
  name: string | null;
  tabs: EditorTabPersistenceDTO[]; // ✅ 包含子实体 (JSON 存储)
  created_at: number;
  updated_at: number;
}
```

#### 1.3 更新 contracts 导出
文件: `packages/contracts/src/editor/index.ts`

```typescript
export * from './editor-session-dtos';
export * from './editor-group-dtos';
// ... 其他导出
```

### 优先级 2：修复 Domain-Server 实现

#### 2.1 删除 EditorGroup 重复方法
文件: `packages/domain-server/src/editor/entities/EditorGroup.ts`

- 找到第143行和第327行的 `fromPersistenceDTO` 方法
- 删除其中一个（保留后面的完整实现）

#### 2.2 为 EditorTab 添加 From DTO 方法
文件: `packages/domain-server/src/editor/entities/EditorTab.ts`

```typescript
// 添加以下静态方法

public static fromServerDTO(dto: EditorTabServerDTO): EditorTab {
  return new EditorTab({
    uuid: dto.uuid,
    groupUuid: dto.groupUuid,
    sessionUuid: dto.sessionUuid,
    workspaceUuid: dto.workspaceUuid,
    accountUuid: dto.accountUuid,
    tabIndex: dto.tabIndex,
    name: dto.name,
    documentUuid: dto.documentUuid,
    type: dto.type,
    isActive: dto.isActive,
    isPinned: dto.isPinned,
    isPreview: dto.isPreview,
    viewState: dto.viewState ? TabViewState.fromServerDTO(dto.viewState) : null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  });
}

public static fromClientDTO(dto: EditorTabClientDTO): EditorTab {
  // 类似实现
}

public static fromPersistenceDTO(dto: EditorTabPersistenceDTO): EditorTab {
  // 类似实现
}
```

#### 2.3 修正 Persistence DTO 的 layout 字段处理
如果 `EditorSessionPersistenceDTO.layout` 是 JSON 字符串，需要在转换时处理：

```typescript
// 在 EditorSession.fromPersistenceDTO 中
layout: SessionLayout.fromPersistenceDTO(
  typeof dto.layout === 'string' 
    ? JSON.parse(dto.layout) 
    : dto.layout
),
```

### 优先级 3：同步 Domain-Client

Domain-Client 中也需要相同的调整：
1. 将 EditorSession 从 aggregates 移到 entities
2. 实现完整的 DTO 转换方法
3. 更新导入路径

---

## 🎯 建议的执行顺序

1. **先完善 Contracts 包** (这是基础)
   ```bash
   cd packages/contracts
   # 创建/修正 DTO 定义文件
   # 更新导出
   # 编译检查
   pnpm run build
   ```

2. **修复 Domain-Server**
   ```bash
   cd packages/domain-server
   # 删除重复方法
   # 添加缺失的 From DTO 方法
   # 修正类型问题
   # 编译检查
   npx tsc --noEmit --skipLibCheck src/editor/index.ts
   ```

3. **同步 Domain-Client**
   ```bash
   cd packages/domain-client
   # 应用相同的结构调整
   # 实现转换方法
   # 编译检查
   ```

4. **全量编译测试**
   ```bash
   cd packages/domain-server
   pnpm run build
   cd ../domain-client
   pnpm run build
   ```

---

## 📝 核心设计原则回顾

### DDD 聚合根规则
1. ✅ 聚合根下只能有实体，不能有子聚合根
2. ✅ 每个实体必须属于一个聚合根
3. ✅ 聚合根负责管理其下所有实体的生命周期
4. ✅ 跨聚合只能通过 UUID 引用，不能直接引用对象
5. ✅ 一个仓储对应一个聚合根

### DTO 转换规则
1. ✅ Server/Client/Persistence 三层 DTO
2. ✅ 聚合根递归转换所有子实体
3. ✅ 每个实体都有 toXxxDTO() 和 static fromXxxDTO() 方法
4. ✅ Persistence DTO 使用 snake_case 命名

### 文件组织规则
```
packages/domain-server/src/editor/
├── aggregates/        # 只放聚合根
│   └── EditorWorkspace.ts
├── entities/          # 所有实体
│   ├── EditorSession.ts
│   ├── EditorGroup.ts
│   └── EditorTab.ts
├── value-objects/     # 值对象
│   ├── SessionLayout.ts
│   └── TabViewState.ts
└── repositories/      # 每个聚合根一个仓储
    └── IEditorWorkspaceRepository.ts
```

---

## 🚀 一旦完成后的优势

1. **清晰的职责划分**: 聚合根管理实体，实体管理业务逻辑
2. **类型安全**: 完整的 TypeScript 类型定义
3. **可测试性**: 每个层次都可以独立测试
4. **可维护性**: 符合 DDD 原则，易于理解和扩展
5. **数据一致性**: 通过聚合根保证事务边界

