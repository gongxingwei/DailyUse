import { Position, TextSelection } from '../value-objects/Position';

// 临时类型定义
interface EditorState {
  cursorPosition: Position;
  selection: TextSelection;
  viewport: Viewport;
  scrollPosition: number;
  foldedRanges: TextRange[];
  breakpoints: Position[];
  bookmarks: Position[];
  searchHighlights: TextRange[];
  undoStack: UndoRedoOperation[];
  redoStack: UndoRedoOperation[];
}

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scrollTop: number;
  scrollLeft: number;
}

interface TextRange {
  start: Position;
  end: Position;
}

interface UndoRedoOperation {
  type: 'insert' | 'delete' | 'replace';
  range: TextRange;
  text: string;
  timestamp: Date;
}

interface TabContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  separator?: boolean;
  submenu?: TabContextMenuItem[];
}

interface IEditorTab {
  uuid: string;
  documentUuid: string;
  title: string;
  subtitle?: string;
  isDirty: boolean;
  isPreview: boolean;
  isPinned: boolean;
  isActive: boolean;
  lastAccessedAt: Date;
  editorState: EditorState;
  customIcon?: string;
  contextMenuItems?: TabContextMenuItem[];
}

/**
 * 编辑器标签实体
 */
export class EditorTab implements IEditorTab {
  constructor(
    public readonly uuid: string,
    public readonly documentUuid: string,
    private _title: string,
    private _subtitle: string | undefined,
    private _isDirty: boolean,
    private _isPreview: boolean,
    private _isPinned: boolean,
    private _isActive: boolean,
    private _lastAccessedAt: Date,
    private _editorState: EditorState,
    private _customIcon?: string,
    private _contextMenuItems?: TabContextMenuItem[],
  ) {
    if (!uuid.trim()) {
      throw new Error('Tab UUID cannot be empty');
    }

    if (!documentUuid.trim()) {
      throw new Error('Document UUID cannot be empty');
    }

    if (!_title.trim()) {
      throw new Error('Tab title cannot be empty');
    }
  }

  // Getters
  get title(): string {
    return this._title;
  }
  get subtitle(): string | undefined {
    return this._subtitle;
  }
  get isDirty(): boolean {
    return this._isDirty;
  }
  get isPreview(): boolean {
    return this._isPreview;
  }
  get isPinned(): boolean {
    return this._isPinned;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get lastAccessedAt(): Date {
    return this._lastAccessedAt;
  }
  get editorState(): EditorState {
    return this._editorState;
  }
  get customIcon(): string | undefined {
    return this._customIcon;
  }
  get contextMenuItems(): TabContextMenuItem[] | undefined {
    return this._contextMenuItems;
  }

  /**
   * 设置标题
   */
  setTitle(title: string): EditorTab {
    if (!title.trim()) {
      throw new Error('Tab title cannot be empty');
    }

    return new EditorTab(
      this.uuid,
      this.documentUuid,
      title,
      this._subtitle,
      this._isDirty,
      this._isPreview,
      this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      this._editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 设置副标题
   */
  setSubtitle(subtitle: string | undefined): EditorTab {
    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      subtitle,
      this._isDirty,
      this._isPreview,
      this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      this._editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 标记为已修改
   */
  markDirty(): EditorTab {
    if (this._isDirty) {
      return this; // Already dirty
    }

    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      true,
      this._isPreview,
      this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      this._editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 标记为已保存
   */
  markClean(): EditorTab {
    if (!this._isDirty) {
      return this; // Already clean
    }

    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      false,
      this._isPreview,
      this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      this._editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 切换预览模式
   */
  togglePreview(): EditorTab {
    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      this._isDirty,
      !this._isPreview,
      this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      this._editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 切换固定状态
   */
  togglePin(): EditorTab {
    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      this._isDirty,
      this._isPreview,
      !this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      this._editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 激活标签
   */
  activate(): EditorTab {
    if (this._isActive) {
      return this; // Already active
    }

    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      this._isDirty,
      this._isPreview,
      this._isPinned,
      true,
      new Date(), // Update access time
      this._editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 停用标签
   */
  deactivate(): EditorTab {
    if (!this._isActive) {
      return this; // Already inactive
    }

    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      this._isDirty,
      this._isPreview,
      this._isPinned,
      false,
      this._lastAccessedAt,
      this._editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 更新编辑器状态
   */
  updateEditorState(editorState: EditorState): EditorTab {
    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      this._isDirty,
      this._isPreview,
      this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      editorState,
      this._customIcon,
      this._contextMenuItems,
    );
  }

  /**
   * 设置自定义图标
   */
  setCustomIcon(icon: string | undefined): EditorTab {
    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      this._isDirty,
      this._isPreview,
      this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      this._editorState,
      icon,
      this._contextMenuItems,
    );
  }

  /**
   * 设置上下文菜单项
   */
  setContextMenuItems(items: TabContextMenuItem[] | undefined): EditorTab {
    return new EditorTab(
      this.uuid,
      this.documentUuid,
      this._title,
      this._subtitle,
      this._isDirty,
      this._isPreview,
      this._isPinned,
      this._isActive,
      this._lastAccessedAt,
      this._editorState,
      this._customIcon,
      items,
    );
  }

  /**
   * 获取显示标题（包含修改标记）
   */
  getDisplayTitle(): string {
    let displayTitle = this._title;

    if (this._isDirty) {
      displayTitle = '● ' + displayTitle;
    }

    if (this._isPreview) {
      displayTitle = displayTitle + ' (Preview)';
    }

    return displayTitle;
  }

  /**
   * 检查标签是否可以关闭
   */
  canClose(): boolean {
    // 预览标签或未固定的标签都可以关闭
    // 但如果有未保存的修改，需要用户确认
    return this._isPreview || !this._isPinned;
  }

  /**
   * 检查是否需要保存提示
   */
  needsSavePrompt(): boolean {
    return this._isDirty && !this._isPreview;
  }

  equals(other: EditorTab): boolean {
    return this.uuid === other.uuid;
  }

  toString(): string {
    return `EditorTab(${this.uuid}, ${this._title}, dirty: ${this._isDirty}, active: ${this._isActive})`;
  }

  /**
   * 创建新标签
   */
  static create(
    uuid: string,
    documentUuid: string,
    title: string,
    isPreview: boolean = false,
  ): EditorTab {
    const defaultEditorState: EditorState = {
      cursorPosition: Position.zero(),
      selection: new TextSelection(Position.zero(), Position.zero(), 'forward' as any),
      viewport: { x: 0, y: 0, width: 800, height: 600, scrollTop: 0, scrollLeft: 0 },
      scrollPosition: 0,
      foldedRanges: [],
      breakpoints: [],
      bookmarks: [],
      searchHighlights: [],
      undoStack: [],
      redoStack: [],
    };

    return new EditorTab(
      uuid,
      documentUuid,
      title,
      undefined,
      false, // not dirty
      isPreview,
      false, // not pinned
      false, // not active
      new Date(),
      defaultEditorState,
    );
  }

  /**
   * 从接口创建
   */
  static from(tab: IEditorTab): EditorTab {
    return new EditorTab(
      tab.uuid,
      tab.documentUuid,
      tab.title,
      tab.subtitle,
      tab.isDirty,
      tab.isPreview,
      tab.isPinned,
      tab.isActive,
      tab.lastAccessedAt,
      tab.editorState,
      tab.customIcon,
      tab.contextMenuItems,
    );
  }
}
