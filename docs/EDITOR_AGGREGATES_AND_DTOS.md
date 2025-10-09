# Editor 模块 聚合根 / 实体 / 值对象 详细定义

日期：2025-10-08

此文档补充 `docs/REPOSITORY_AND_EDITOR_DESIGN.md`，给出 Editor 聚合根、实体与值对象的精确 TypeScript 类型定义（契约层、server/client/persistence 层次分离的视角）。目标：

- 明确 Editor 的边界（Editor 仅为前端 UI 聚合，文件内容与资源由 Repository 提供）
- 提供与 `packages/contracts` 风格一致的 DTO 分层示例（persistence / server / client / client-types）
- 为后续在 `apps/api` 中实现 mapper 和 `apps/web` 中实现 client 提供清晰参考

## 快速约定

- 时间在 persistence 层以数字（epoch ms）或数据库时间格式保存；在 server 层使用 `Date`；在 client 层使用 epoch ms（number）以便序列化。 
- 所有路径均使用 repository 相对路径并以 `/` 分隔，字段名为 `relativePath` 或 `path`（依据上下文）。
- Editor 聚合并不直接操作磁盘；它通过 `IFileStorage` / `IResourceServer` 在应用层获取内容。

## 聚合根：EditorSession (聚合根)

用途：管理一个会话（类似于 VS Code 的窗口级状态），包含 EditorGroups、Layout、Settings、OpenTabs 等。

Server 类型（domain-friendly）：

export interface EditorSessionServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  activeGroupId?: string | null;
  layoutId?: string | null;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  lastSavedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

Persistence 类型（DB/持久化行）示例：

export interface EditorSessionPersistenceDTO {
  uuid: string;
  account_uuid: string;
  name: string;
  active_group_id?: string | null;
  layout_id?: string | null;
  auto_save: number; // 0/1
  auto_save_interval: number; // seconds
  last_saved_at?: number; // epoch ms
  created_at?: number; // epoch ms
  updated_at?: number; // epoch ms
}

Client 类型（序列化友好）：

export interface EditorSessionClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  activeGroupId?: string | null;
  layoutId?: string | null;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  lastSavedAt?: number | null; // epoch ms
  createdAt?: number | null; // epoch ms
  updatedAt?: number | null; // epoch ms
}

---

## 实体：EditorGroup

用途：表示 editor 中的一列/分组，包含 tabs 与尺寸信息。

Server / Domain 类型示例：

export interface EditorGroupServerDTO {
  uuid: string;
  sessionUuid: string;
  title?: string | null;
  order: number;
  width: number;
  height?: number | null;
  activeTabId?: string | null;
  lastAccessedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

Persistence DTO (示例)：

export interface EditorGroupPersistenceDTO {
  uuid: string;
  session_uuid: string;
  title?: string | null;
  order: number;
  width: number;
  height?: number | null;
  active_tab_id?: string | null;
  last_accessed_at?: number; // epoch ms
  created_at?: number;
  updated_at?: number;
}

Client DTO：

export interface EditorGroupClientDTO {
  uuid: string;
  sessionUuid: string;
  title?: string | null;
  order: number;
  width: number;
  height?: number | null;
  activeTabId?: string | null;
  lastAccessedAt?: number | null; // epoch ms
  createdAt?: number | null; // epoch ms
  updatedAt?: number | null; // epoch ms
}

---

## 实体：EditorTab (聚合内实体)

用途：表示一个打开的文档标签页。重要：Tab 的内容可以是完整文档内容（可选，列表接口通常省略 content 字段以节约带宽）。

Server DTO：

export interface EditorTabServerDTO {
  uuid: string;
  groupUuid: string;
  title: string;
  path: string; // repo-relative
  isPreview?: boolean;
  fileType?: string | null;
  isDirty?: boolean;
  content?: string | null;
  lastModifiedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

Persistence DTO：

export interface EditorTabPersistenceDTO {
  uuid: string;
  group_uuid: string;
  title: string;
  path: string;
  is_preview: number; // 0/1
  file_type?: string | null;
  is_dirty: number; // 0/1
  content?: string | null;
  last_modified_at?: number; // epoch ms
  created_at?: number;
  updated_at?: number;
}

Client DTO：

export interface EditorTabClientDTO {
  uuid: string;
  groupUuid: string;
  title: string;
  path: string;
  isPreview?: boolean;
  fileType?: string | null;
  isDirty?: boolean;
  content?: string | null;
  lastModified?: number | null; // epoch ms
  createdAt?: number | null;
  updatedAt?: number | null;
}

Client presentation model (client-types) may add helper fields such as `snippet` or `getPreviewUri()`.

---

## 值对象：DocumentMetadata / RenderingState / CursorPosition

这些在 `packages/contracts/src/modules/editor/types.ts` 已经有详细定义，建议在 contracts 中保持其 server/client/persistence 三层对应：

- persistence 存储 JSON 字符串（metadata_json, rendering_state_json）
- server 层保持对象（DocumentMetadata, RenderingState）并使用 `Date` 类型
- client 层使用序列化友好的字段（timestamp -> epoch ms）

示例：

export type DocumentMetadataServer = {
  tags: string[];
  wordCount: number;
  readingTime: number;
  lastSavedAt?: Date;
}

export type DocumentMetadataClient = {
  tags: string[];
  wordCount: number;
  readingTime: number;
  lastSavedAt?: number; // epoch ms
}

## Persistence 存储与扁平列约定（示例）

在 persistence 层，复杂/可变的对象使用 *_json 后缀的字符串字段保存（例如 `metadata_json`, `resources_json`），以减少 DB schema 迁移频率并保留原始结构。

同时，为了支持列表页、排序、筛选与快速搜索，建议把常用、稳定且会被查询的字段拆出为扁平列（nullable）。示例字段：

- `preview_text?: string | null` — 列表/卡片的短摘录
- `word_count?: number | null` — 方便排序/展示
- `tags_json?: string | null` — 可选的小数组序列化；若 tag 查询频繁请创建关联表 `document_tags`
- `size?: number | null` — 文件大小（字节）
- `mime_type?: string | null` — MIME 类型

写入时（server -> persistence）建议同时填充 JSON blob 与扁平列（若能从 metadata 或 content 计算得到），读取时可主要使用扁平列以提高性能，同时保留 JSON 作为权威/完整数据源。


## Editor API Contracts（建议）

- GET /api/editor/sessions -> EditorSessionClientDTO[]
- POST /api/editor/sessions -> CreateEditorSessionRequest -> EditorSessionClientDTO
- GET /api/editor/sessions/:id/aggregate -> EditorSessionAggregateResponse (session + groups + tabs + layout)
- GET /api/editor/open?repo=:repoUuid&path=:path -> OpenEditorResponseDTO (content + editor)
- POST /api/editor/save -> SaveFileRequest -> SaveFileResponse

## Mapper 指南（实现提示）

- Persistence -> Server: parse JSON fields, convert epoch -> Date for createdAt/updatedAt
- Server -> Client: convert Date -> epoch ms; hide internal-only fields; compute previewUri via repository service if available
- Client -> Server (create/update): accept client DTO and convert epoch -> Date where server expects Date; validate path semantics

## 结语

本文件主要用于补充 Editor 聚合根/实体/值对象的契约细节，并为后续实现 mapper 与前端 client 提供清晰参考。接下来我会在 `packages/contracts/src/modules/editor` 检查是否存在缺失的 `server-dtos.ts` / `persistence-dtos.ts` 并补齐（若需要）。
