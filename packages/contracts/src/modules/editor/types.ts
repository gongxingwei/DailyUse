/**
 * Editor Module Types
 * 编辑器模块类型定义
 */

// ============ Core Editor Types ============

/**
 * 编辑器标签页
 */
export interface IEditorTab {
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
  fileType?: string;
  /** 是否已修改 */
  isDirty?: boolean;
  /** 最后修改时间 */
  lastModified?: Date;
}

/**
 * 编辑器组
 */
export interface IEditorGroup {
  /** 唯一标识符 */
  uuid: string;
  /** 是否激活 */
  active: boolean;
  /** 宽度 */
  width: number;
  /** 标签页列表 */
  tabs: IEditorTab[];
  /** 当前激活的标签页ID */
  activeTabId: string | null;
  /** 组标题 */
  title?: string;
  /** 最后访问时间 */
  lastAccessed?: Date;
}

/**
 * 编辑器布局配置
 */
export interface IEditorLayout {
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
}

/**
 * 文件操作类型
 */
export enum FileOperationType {
  CREATE = 'create',
  OPEN = 'open',
  SAVE = 'save',
  DELETE = 'delete',
  RENAME = 'rename',
  COPY = 'copy',
  MOVE = 'move',
}

/**
 * 文件类型
 */
export enum SupportedFileType {
  MARKDOWN = 'markdown',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  JSON = 'json',
  HTML = 'html',
  CSS = 'css',
  PYTHON = 'python',
  TEXT = 'text',
  UNKNOWN = 'unknown',
}

// ============ Editor Commands ============

/**
 * 打开文件命令
 */
export interface IOpenFileCommand {
  /** 文件路径 */
  path: string;
  /** 目标编辑器组ID */
  groupId?: string;
  /** 是否为预览模式 */
  isPreview?: boolean;
  /** 是否强制重新打开 */
  forceReopen?: boolean;
}

/**
 * 关闭标签页命令
 */
export interface ICloseTabCommand {
  /** 编辑器组ID */
  groupId: string;
  /** 标签页ID */
  tabId: string;
  /** 是否保存修改 */
  saveChanges?: boolean;
}

/**
 * 分割编辑器命令
 */
export interface ISplitEditorCommand {
  /** 源编辑器组ID */
  sourceGroupId: string;
  /** 分割方向 */
  direction: 'horizontal' | 'vertical';
  /** 是否复制当前标签页 */
  copyCurrentTab?: boolean;
}

/**
 * 调整编辑器大小命令
 */
export interface IResizeEditorCommand {
  /** 编辑器组ID */
  groupId: string;
  /** 新宽度 */
  width: number;
  /** 新高度 */
  height?: number;
}

// ============ Editor Events ============

/**
 * 编辑器事件基类
 */
export interface IEditorEvent {
  /** 事件类型 */
  type: string;
  /** 事件时间戳 */
  timestamp: Date;
  /** 事件源 */
  source: string;
  /** 事件数据 */
  data?: any;
}

/**
 * 文件打开事件
 */
export interface IFileOpenedEvent extends IEditorEvent {
  type: 'file-opened';
  data: {
    tab: IEditorTab;
    groupId: string;
  };
}

/**
 * 文件关闭事件
 */
export interface IFileClosedEvent extends IEditorEvent {
  type: 'file-closed';
  data: {
    tabId: string;
    groupId: string;
    path: string;
  };
}

/**
 * 文件保存事件
 */
export interface IFileSavedEvent extends IEditorEvent {
  type: 'file-saved';
  data: {
    path: string;
    content: string;
    groupId: string;
    tabId: string;
  };
}

/**
 * 编辑器组创建事件
 */
export interface IEditorGroupCreatedEvent extends IEditorEvent {
  type: 'editor-group-created';
  data: {
    group: IEditorGroup;
  };
}

/**
 * 编辑器组删除事件
 */
export interface IEditorGroupRemovedEvent extends IEditorEvent {
  type: 'editor-group-removed';
  data: {
    groupId: string;
  };
}

/**
 * 编辑器布局变化事件
 */
export interface IEditorLayoutChangedEvent extends IEditorEvent {
  type: 'editor-layout-changed';
  data: {
    layout: IEditorLayout;
  };
}

// ============ Editor Service Interfaces ============

/**
 * 编辑器管理服务接口
 */
export interface IEditorService {
  /** 打开文件 */
  openFile(command: IOpenFileCommand): Promise<IEditorTab>;

  /** 关闭标签页 */
  closeTab(command: ICloseTabCommand): Promise<void>;

  /** 关闭所有标签页 */
  closeAllTabs(groupId?: string): Promise<void>;

  /** 保存文件 */
  saveFile(groupId: string, tabId: string): Promise<void>;

  /** 保存所有文件 */
  saveAllFiles(groupId?: string): Promise<void>;

  /** 分割编辑器 */
  splitEditor(command: ISplitEditorCommand): Promise<IEditorGroup>;

  /** 调整编辑器大小 */
  resizeEditor(command: IResizeEditorCommand): Promise<void>;

  /** 获取所有编辑器组 */
  getEditorGroups(): Promise<IEditorGroup[]>;

  /** 获取编辑器组 */
  getEditorGroup(groupId: string): Promise<IEditorGroup | null>;

  /** 获取活动编辑器组 */
  getActiveEditorGroup(): Promise<IEditorGroup | null>;

  /** 设置活动编辑器组 */
  setActiveEditorGroup(groupId: string): Promise<void>;
}

/**
 * 文件服务接口
 */
export interface IFileService {
  /** 读取文件内容 */
  readFile(path: string): Promise<string>;

  /** 写入文件内容 */
  writeFile(path: string, content: string): Promise<void>;

  /** 检查文件是否存在 */
  fileExists(path: string): Promise<boolean>;

  /** 获取文件信息 */
  getFileInfo(path: string): Promise<{
    size: number;
    lastModified: Date;
    type: SupportedFileType;
  } | null>;

  /** 监听文件变化 */
  watchFile(path: string, callback: (event: string) => void): Promise<void>;

  /** 停止监听文件变化 */
  unwatchFile(path: string): Promise<void>;
}

/**
 * 布局服务接口
 */
export interface ILayoutService {
  /** 获取当前布局 */
  getCurrentLayout(): Promise<IEditorLayout>;

  /** 更新布局 */
  updateLayout(layout: Partial<IEditorLayout>): Promise<void>;

  /** 重置布局 */
  resetLayout(): Promise<void>;

  /** 保存布局配置 */
  saveLayoutConfig(): Promise<void>;

  /** 加载布局配置 */
  loadLayoutConfig(): Promise<void>;
}

// ============ Query/Response DTOs ============

/**
 * 编辑器状态查询响应
 */
export interface IEditorStateResponse {
  /** 编辑器组列表 */
  groups: IEditorGroup[];
  /** 活动编辑器组ID */
  activeGroupId: string | null;
  /** 布局配置 */
  layout: IEditorLayout;
  /** 总标签页数 */
  totalTabs: number;
  /** 未保存的文件数 */
  unsavedFiles: number;
}

/**
 * 文件内容查询响应
 */
export interface IFileContentResponse {
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
}

/**
 * 编辑器功能图标
 */
export interface IEditorFunctionIcon {
  /** 唯一标识符 */
  uuid: string;
  /** 图标标题 */
  title: string;
  /** 图标类名 */
  icon: string;
  /** 点击动作 */
  action: () => void;
  /** 是否可见 */
  visible?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 更多功能选项
 */
export interface IMoreFunction {
  /** 唯一标识符 */
  uuid: string;
  /** 显示标签 */
  label: string;
  /** 功能标题 */
  title: string;
  /** 点击动作 */
  action: () => void;
  /** 图标 */
  icon?: string;
  /** 是否可见 */
  visible?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

// ============ Error Types ============

/**
 * 编辑器错误基类
 */
export class EditorError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'EditorError';
  }
}

/**
 * 文件操作错误
 */
export class FileOperationError extends EditorError {
  constructor(
    message: string,
    public operation: FileOperationType,
    public path: string,
  ) {
    super(message, 'FILE_OPERATION_ERROR', { operation, path });
    this.name = 'FileOperationError';
  }
}

/**
 * 编辑器组错误
 */
export class EditorGroupError extends EditorError {
  constructor(
    message: string,
    public groupId: string,
  ) {
    super(message, 'EDITOR_GROUP_ERROR', { groupId });
    this.name = 'EditorGroupError';
  }
}

/**
 * 布局错误
 */
export class LayoutError extends EditorError {
  constructor(
    message: string,
    public layoutConfig?: Partial<IEditorLayout>,
  ) {
    super(message, 'LAYOUT_ERROR', { layoutConfig });
    this.name = 'LayoutError';
  }
}
