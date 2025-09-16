/**
 * Editor Module DTOs
 * 编辑器模块数据传输对象定义
 */

import type {
  IEditorTab,
  IEditorGroup,
  IEditorLayout,
  IEditorSession,
  SupportedFileType,
  FileOperationType,
} from './types.js';

// ============ DTO 基础类型 ============

/**
 * 编辑器标签页 DTO
 */
export interface EditorTabDTO {
  /** 唯一标识符 */
  uuid: string;
  /** 所属账户UUID */
  accountUuid: string;
  /** 所属编辑器组UUID */
  groupUuid: string;
  /** 标签页标题 */
  title: string;
  /** 文件路径 */
  path: string;
  /** 是否激活 */
  active: boolean;
  /** 是否为预览模式 */
  isPreview?: boolean;
  /** 文件类型 */
  fileType?: SupportedFileType;
  /** 是否已修改 */
  isDirty?: boolean;
  /** 文件内容 */
  content?: string;
  /** 最后修改时间 */
  lastModified?: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 编辑器组 DTO
 */
export interface EditorGroupDTO {
  /** 唯一标识符 */
  uuid: string;
  /** 所属账户UUID */
  accountUuid: string;
  /** 所属会话UUID */
  sessionUuid: string;
  /** 是否激活 */
  active: boolean;
  /** 宽度 */
  width: number;
  /** 高度 */
  height?: number;
  /** 当前激活的标签页ID */
  activeTabId: string | null;
  /** 组标题 */
  title?: string;
  /** 排序序号 */
  order: number;
  /** 最后访问时间 */
  lastAccessed?: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 编辑器布局 DTO
 */
export interface EditorLayoutDTO {
  /** 唯一标识符 */
  uuid: string;
  /** 所属账户UUID */
  accountUuid: string;
  /** 布局名称 */
  name: string;
  /** 活动栏宽度 */
  activityBarWidth: number;
  /** 侧边栏宽度 */
  sidebarWidth: number;
  /** 最小侧边栏宽度 */
  minSidebarWidth: number;
  /** 调整手柄宽度 */
  resizeHandleWidth: number;
  /** 最小编辑器宽度 */
  minEditorWidth: number;
  /** 编辑器标签宽度 */
  editorTabWidth: number;
  /** 窗口宽度 */
  windowWidth: number;
  /** 窗口高度 */
  windowHeight: number;
  /** 是否为默认布局 */
  isDefault: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 编辑器会话 DTO
 */
export interface EditorSessionDTO {
  /** 唯一标识符 */
  uuid: string;
  /** 所属账户UUID */
  accountUuid: string;
  /** 会话名称 */
  name: string;
  /** 活动编辑器组ID */
  activeGroupId: string | null;
  /** 布局UUID */
  layoutUuid: string | null;
  /** 是否自动保存 */
  autoSave: boolean;
  /** 自动保存间隔（秒） */
  autoSaveInterval: number;
  /** 最后保存时间 */
  lastSavedAt?: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

// ============ 请求 DTOs ============

/**
 * 创建编辑器会话请求
 */
export interface CreateEditorSessionRequest {
  /** 会话名称 */
  name: string;
  /** 布局配置（可选，使用默认布局） */
  layout?: Partial<Omit<EditorLayoutDTO, 'uuid' | 'accountUuid' | 'createdAt' | 'updatedAt'>>;
  /** 是否自动保存 */
  autoSave?: boolean;
  /** 自动保存间隔（秒） */
  autoSaveInterval?: number;
}

/**
 * 更新编辑器会话请求
 */
export interface UpdateEditorSessionRequest {
  /** 会话名称 */
  name?: string;
  /** 活动编辑器组ID */
  activeGroupId?: string | null;
  /** 是否自动保存 */
  autoSave?: boolean;
  /** 自动保存间隔（秒） */
  autoSaveInterval?: number;
}

/**
 * 创建编辑器组请求
 */
export interface CreateEditorGroupRequest {
  /** 宽度 */
  width: number;
  /** 高度 */
  height?: number;
  /** 组标题 */
  title?: string;
  /** 排序序号 */
  order?: number;
}

/**
 * 更新编辑器组请求
 */
export interface UpdateEditorGroupRequest {
  /** 是否激活 */
  active?: boolean;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 活动标签页ID */
  activeTabId?: string | null;
  /** 组标题 */
  title?: string;
  /** 排序序号 */
  order?: number;
}

/**
 * 创建编辑器标签页请求
 */
export interface CreateEditorTabRequest {
  /** 标签页标题 */
  title: string;
  /** 文件路径 */
  path: string;
  /** 是否为预览模式 */
  isPreview?: boolean;
  /** 文件类型 */
  fileType?: SupportedFileType;
  /** 文件内容 */
  content?: string;
}

/**
 * 更新编辑器标签页请求
 */
export interface UpdateEditorTabRequest {
  /** 标签页标题 */
  title?: string;
  /** 文件路径 */
  path?: string;
  /** 是否激活 */
  active?: boolean;
  /** 是否为预览模式 */
  isPreview?: boolean;
  /** 文件类型 */
  fileType?: SupportedFileType;
  /** 是否已修改 */
  isDirty?: boolean;
  /** 文件内容 */
  content?: string;
}

/**
 * 更新编辑器布局请求
 */
export interface UpdateEditorLayoutRequest {
  /** 布局名称 */
  name?: string;
  /** 活动栏宽度 */
  activityBarWidth?: number;
  /** 侧边栏宽度 */
  sidebarWidth?: number;
  /** 最小侧边栏宽度 */
  minSidebarWidth?: number;
  /** 调整手柄宽度 */
  resizeHandleWidth?: number;
  /** 最小编辑器宽度 */
  minEditorWidth?: number;
  /** 编辑器标签宽度 */
  editorTabWidth?: number;
  /** 窗口宽度 */
  windowWidth?: number;
  /** 窗口高度 */
  windowHeight?: number;
  /** 是否为默认布局 */
  isDefault?: boolean;
}

// ============ 响应 DTOs ============

/**
 * 编辑器会话响应
 */
export type EditorSessionResponse = EditorSessionDTO;

/**
 * 编辑器组响应
 */
export type EditorGroupResponse = EditorGroupDTO;

/**
 * 编辑器标签页响应
 */
export type EditorTabResponse = EditorTabDTO;

/**
 * 编辑器布局响应
 */
export type EditorLayoutResponse = EditorLayoutDTO;

/**
 * 编辑器会话列表响应
 */
export interface EditorSessionListResponse {
  /** 会话列表 */
  sessions: EditorSessionResponse[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 是否有更多数据 */
  hasMore: boolean;
}

/**
 * 编辑器组列表响应
 */
export interface EditorGroupListResponse {
  /** 编辑器组列表 */
  groups: EditorGroupResponse[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 是否有更多数据 */
  hasMore: boolean;
}

/**
 * 编辑器状态响应
 */
export interface EditorStateResponse {
  /** 当前会话 */
  currentSession: EditorSessionResponse | null;
  /** 编辑器组列表 */
  groups: EditorGroupResponse[];
  /** 活动编辑器组ID */
  activeGroupId: string | null;
  /** 布局配置 */
  layout: EditorLayoutResponse;
  /** 总标签页数 */
  totalTabs: number;
  /** 活动标签页数 */
  activeTabs: number;
  /** 未保存的文件数 */
  unsavedFiles: number;
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
}

/**
 * 文件内容响应
 */
export interface FileContentResponse {
  /** 文件路径 */
  path: string;
  /** 文件内容 */
  content: string;
  /** 文件类型 */
  fileType: SupportedFileType;
  /** 文件大小 */
  size: number;
  /** 最后修改时间 */
  lastModified: number;
  /** 是否只读 */
  readonly: boolean;
}

// ============ 批量操作 DTOs ============

/**
 * 批量创建标签页请求
 */
export interface BatchCreateTabsRequest {
  /** 标签页列表 */
  tabs: CreateEditorTabRequest[];
}

/**
 * 批量更新标签页请求
 */
export interface BatchUpdateTabsRequest {
  /** 更新操作列表 */
  updates: { tabId: string; data: UpdateEditorTabRequest }[];
}

/**
 * 批量关闭标签页请求
 */
export interface BatchCloseTabsRequest {
  /** 标签页ID列表 */
  tabIds: string[];
  /** 是否保存修改的文件 */
  saveModified?: boolean;
}

/**
 * 批量保存文件请求
 */
export interface BatchSaveFilesRequest {
  /** 文件路径列表 */
  paths: string[];
  /** 是否保存所有修改的文件（忽略paths参数） */
  saveAll?: boolean;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponse<T = any> {
  /** 成功的操作 */
  successful: Array<{ id: string; result: T }>;
  /** 失败的操作 */
  failed: Array<{ id: string; error: string }>;
  /** 总操作数 */
  total: number;
  /** 成功数 */
  successCount: number;
  /** 失败数 */
  failureCount: number;
}

/**
 * 会话切换请求
 */
export interface SwitchSessionRequest {
  /** 目标会话ID */
  sessionId: string;
  /** 是否保存当前会话状态 */
  saveCurrentState?: boolean;
}

/**
 * 布局切换请求
 */
export interface SwitchLayoutRequest {
  /** 目标布局ID */
  layoutId: string;
  /** 是否应用到所有会话 */
  applyToAllSessions?: boolean;
}

/**
 * 工作区导入请求
 */
export interface ImportWorkspaceRequest {
  /** 工作区路径 */
  workspacePath: string;
  /** 是否创建新会话 */
  createNewSession?: boolean;
  /** 新会话名称 */
  sessionName?: string;
}

/**
 * 文件操作响应
 */
export interface FileOperationResponse {
  /** 操作类型 */
  operation: FileOperationType;
  /** 文件路径 */
  path: string;
  /** 操作是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 操作时间 */
  timestamp: number;
}

// ============ Query DTOs ============

/**
 * 编辑器组查询参数
 */
export interface EditorGroupQuery {
  /** 所属账户UUID */
  accountUuid: string;
  /** 是否激活 */
  active?: boolean;
  /** 标题模糊搜索 */
  titleContains?: string;
  /** 排序字段 */
  sortBy?: 'order' | 'lastAccessed' | 'createdAt' | 'updatedAt';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  limit?: number;
}

/**
 * 编辑器标签页查询参数
 */
export interface EditorTabQuery {
  /** 所属编辑器组UUID */
  groupUuid?: string;
  /** 文件路径模糊搜索 */
  pathContains?: string;
  /** 文件类型 */
  fileType?: SupportedFileType;
  /** 是否为预览模式 */
  isPreview?: boolean;
  /** 是否已修改 */
  isDirty?: boolean;
  /** 排序字段 */
  sortBy?: 'title' | 'lastModified' | 'createdAt';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 编辑器布局查询参数
 */
export interface EditorLayoutQuery {
  /** 所属账户UUID */
  accountUuid: string;
  /** 布局名称模糊搜索 */
  nameContains?: string;
  /** 是否默认布局 */
  isDefault?: boolean;
  /** 排序字段 */
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 编辑器会话查询参数
 */
export interface EditorSessionQuery {
  /** 所属账户UUID */
  accountUuid: string;
  /** 会话名称模糊搜索 */
  nameContains?: string;
  /** 是否自动保存 */
  autoSave?: boolean;
  /** 排序字段 */
  sortBy?: 'name' | 'lastSavedAt' | 'createdAt' | 'updatedAt';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

// ============ Statistics DTOs ============

/**
 * 编辑器统计信息
 */
export interface EditorStatistics {
  /** 总编辑器组数 */
  totalGroups: number;
  /** 总标签页数 */
  totalTabs: number;
  /** 活动标签页数 */
  activeTabs: number;
  /** 预览标签页数 */
  previewTabs: number;
  /** 未保存的文件数 */
  unsavedFiles: number;
  /** 文件类型分布 */
  fileTypeDistribution: Record<SupportedFileType, number>;
  /** 最近访问的文件 */
  recentFiles: {
    path: string;
    title: string;
    lastAccessed: Date;
    fileType: SupportedFileType;
  }[];
  /** 最常用的文件 */
  frequentFiles: {
    path: string;
    title: string;
    accessCount: number;
    fileType: SupportedFileType;
  }[];
}
