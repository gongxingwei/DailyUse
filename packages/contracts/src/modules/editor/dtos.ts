/**
 * Editor Module DTOs
 * 编辑器模块数据传输对象
 */

import type {
  IEditorTab,
  IEditorGroup,
  IEditorLayout,
  SupportedFileType,
  FileOperationType,
} from './types.js';

// ============ Core DTOs ============

/**
 * 编辑器标签页DTO
 */
export interface EditorTabDTO {
  /** 唯一标识符 */
  uuid: string;
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
  lastModified?: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 编辑器组DTO
 */
export interface EditorGroupDTO {
  /** 唯一标识符 */
  uuid: string;
  /** 所属账户UUID */
  accountUuid: string;
  /** 是否激活 */
  active: boolean;
  /** 宽度 */
  width: number;
  /** 高度 */
  height?: number;
  /** 标签页列表 */
  tabs: EditorTabDTO[];
  /** 当前激活的标签页ID */
  activeTabId: string | null;
  /** 组标题 */
  title?: string;
  /** 组排序 */
  order: number;
  /** 最后访问时间 */
  lastAccessed?: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 编辑器布局DTO
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
  /** 是否默认布局 */
  isDefault: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 编辑器会话DTO
 */
export interface EditorSessionDTO {
  /** 唯一标识符 */
  uuid: string;
  /** 所属账户UUID */
  accountUuid: string;
  /** 会话名称 */
  name: string;
  /** 编辑器组列表 */
  groups: EditorGroupDTO[];
  /** 活动编辑器组ID */
  activeGroupId: string | null;
  /** 布局配置 */
  layout: EditorLayoutDTO;
  /** 是否自动保存 */
  autoSave: boolean;
  /** 自动保存间隔（秒） */
  autoSaveInterval: number;
  /** 最后保存时间 */
  lastSavedAt?: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

// ============ Request DTOs ============

/**
 * 创建编辑器组请求
 */
export interface CreateEditorGroupRequest {
  /** 所属账户UUID */
  accountUuid: string;
  /** 组标题 */
  title?: string;
  /** 初始宽度 */
  width?: number;
  /** 初始高度 */
  height?: number;
  /** 排序 */
  order?: number;
}

/**
 * 更新编辑器组请求
 */
export interface UpdateEditorGroupRequest {
  /** 组标题 */
  title?: string;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 是否激活 */
  active?: boolean;
  /** 排序 */
  order?: number;
}

/**
 * 创建编辑器标签页请求
 */
export interface CreateEditorTabRequest {
  /** 所属编辑器组UUID */
  groupUuid: string;
  /** 标签页标题 */
  title: string;
  /** 文件路径 */
  path: string;
  /** 文件类型 */
  fileType?: SupportedFileType;
  /** 是否为预览模式 */
  isPreview?: boolean;
  /** 初始内容 */
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
 * 创建编辑器布局请求
 */
export interface CreateEditorLayoutRequest {
  /** 所属账户UUID */
  accountUuid: string;
  /** 布局名称 */
  name: string;
  /** 活动栏宽度 */
  activityBarWidth?: number;
  /** 侧边栏宽度 */
  sidebarWidth?: number;
  /** 窗口宽度 */
  windowWidth?: number;
  /** 窗口高度 */
  windowHeight?: number;
  /** 是否默认布局 */
  isDefault?: boolean;
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
  /** 是否默认布局 */
  isDefault?: boolean;
}

/**
 * 创建编辑器会话请求
 */
export interface CreateEditorSessionRequest {
  /** 所属账户UUID */
  accountUuid: string;
  /** 会话名称 */
  name: string;
  /** 布局UUID */
  layoutUuid?: string;
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
  activeGroupId?: string;
  /** 布局UUID */
  layoutUuid?: string;
  /** 是否自动保存 */
  autoSave?: boolean;
  /** 自动保存间隔（秒） */
  autoSaveInterval?: number;
}

// ============ Response DTOs ============

/**
 * 编辑器状态响应
 */
export interface EditorStateResponse {
  /** 编辑器组列表 */
  groups: EditorGroupDTO[];
  /** 活动编辑器组ID */
  activeGroupId: string | null;
  /** 布局配置 */
  layout: EditorLayoutDTO;
  /** 总标签页数 */
  totalTabs: number;
  /** 未保存的文件数 */
  unsavedFiles: number;
  /** 最后保存时间 */
  lastSavedAt?: Date;
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
  lastModified: Date;
  /** 是否只读 */
  readonly: boolean;
  /** 文件编码 */
  encoding?: string;
}

/**
 * 编辑器组列表响应
 */
export interface EditorGroupListResponse {
  /** 编辑器组列表 */
  groups: EditorGroupDTO[];
  /** 总数 */
  total: number;
  /** 页码 */
  page: number;
  /** 每页数量 */
  limit: number;
}

/**
 * 编辑器布局列表响应
 */
export interface EditorLayoutListResponse {
  /** 布局列表 */
  layouts: EditorLayoutDTO[];
  /** 总数 */
  total: number;
  /** 默认布局 */
  defaultLayout?: EditorLayoutDTO;
}

/**
 * 编辑器会话列表响应
 */
export interface EditorSessionListResponse {
  /** 会话列表 */
  sessions: EditorSessionDTO[];
  /** 总数 */
  total: number;
  /** 当前会话 */
  currentSession?: EditorSessionDTO;
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
  timestamp: Date;
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
