import { EditorLayoutCore } from '@dailyuse/domain-core';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorLayoutDTO = EditorContracts.EditorLayoutDTO;

/**
 * 客户端 EditorLayout 实体
 * 继承核心 EditorLayout 类，添加客户端特有功能
 */
export class EditorLayout extends EditorLayoutCore {
  private _uiState: {
    isDragging: boolean;
    isResizing: boolean;
    hasNotification: boolean;
    draggedElement?: string;
    highlightedElement?: string;
    isDropTarget: boolean;
    customCss?: string;
  };

  private _localSettings: {
    enableAnimations?: boolean;
    enableAutoSave?: boolean;
    autoSaveInterval?: number;
    enableKeyboardShortcuts?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  };

  private _history: Array<{
    timestamp: Date;
    action: string;
    previousValues: any;
    newValues: any;
  }> = [];

  constructor(params: {
    uuid?: string;
    name: string;
    activityBarWidth?: number;
    sidebarWidth?: number;
    minSidebarWidth?: number;
    resizeHandleWidth?: number;
    minEditorWidth?: number;
    editorTabWidth?: number;
    windowWidth?: number;
    windowHeight?: number;
    isDefault?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    // 客户端特有字段
    uiState?: {
      isDragging?: boolean;
      isResizing?: boolean;
      hasNotification?: boolean;
      draggedElement?: string;
      highlightedElement?: string;
      isDropTarget?: boolean;
      customCss?: string;
    };
    localSettings?: {
      enableAnimations?: boolean;
      enableAutoSave?: boolean;
      autoSaveInterval?: number;
      enableKeyboardShortcuts?: boolean;
      theme?: 'light' | 'dark' | 'auto';
    };
    history?: Array<{
      timestamp: Date;
      action: string;
      previousValues: any;
      newValues: any;
    }>;
  }) {
    super({
      ...params,
      accountUuid: 'temp-account',
    });

    this._uiState = {
      isDragging: params.uiState?.isDragging || false,
      isResizing: params.uiState?.isResizing || false,
      hasNotification: params.uiState?.hasNotification || false,
      draggedElement: params.uiState?.draggedElement,
      highlightedElement: params.uiState?.highlightedElement,
      isDropTarget: params.uiState?.isDropTarget || false,
      customCss: params.uiState?.customCss,
    };

    this._localSettings = {
      enableAnimations: params.localSettings?.enableAnimations ?? true,
      enableAutoSave: params.localSettings?.enableAutoSave ?? true,
      autoSaveInterval: params.localSettings?.autoSaveInterval || 30,
      enableKeyboardShortcuts: params.localSettings?.enableKeyboardShortcuts ?? true,
      theme: params.localSettings?.theme || 'auto',
    };

    this._history = params.history || [];
  }

  // ===== 实现抽象方法（修复日期类型转换问题） =====
  toDTO(): EditorLayoutDTO {
    return {
      uuid: this.uuid,
      name: this.name,
      activityBarWidth: this.activityBarWidth,
      sidebarWidth: this.sidebarWidth,
      minSidebarWidth: this.minSidebarWidth,
      resizeHandleWidth: this.resizeHandleWidth,
      minEditorWidth: this.minEditorWidth,
      editorTabWidth: this.editorTabWidth,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      isDefault: this.isDefault,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }

  // ===== Getter 方法 =====
  get uiState() {
    return { ...this._uiState };
  }

  get localSettings() {
    return { ...this._localSettings };
  }

  get history() {
    return [...this._history];
  }

  get isDragging(): boolean {
    return this._uiState.isDragging;
  }

  get isResizing(): boolean {
    return this._uiState.isResizing;
  }

  get hasNotification(): boolean {
    return this._uiState.hasNotification;
  }

  // ===== 客户端特有方法 =====

  /**
   * 设置拖拽状态
   */
  setDragging(isDragging: boolean, element?: string): void {
    this._uiState.isDragging = isDragging;
    this._uiState.draggedElement = element;
    this.updateTimestamp();
  }

  /**
   * 更新本地设置
   */
  updateLocalSettings(
    settings: Partial<{
      enableAnimations?: boolean;
      enableAutoSave?: boolean;
      autoSaveInterval?: number;
      enableKeyboardShortcuts?: boolean;
      theme?: 'light' | 'dark' | 'auto';
    }>,
  ): void {
    this._localSettings = { ...this._localSettings, ...settings };
    this.updateTimestamp();
  }

  // ===== 时间戳更新辅助方法 =====
  protected updateTimestamp(): void {
    (this as any)._updatedAt = new Date();
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  clone(): EditorLayout {
    const dto = this.toDTO();
    return new EditorLayout({
      uuid: dto.uuid,
      name: dto.name,
      activityBarWidth: dto.activityBarWidth,
      sidebarWidth: dto.sidebarWidth,
      minSidebarWidth: dto.minSidebarWidth,
      resizeHandleWidth: dto.resizeHandleWidth,
      minEditorWidth: dto.minEditorWidth,
      editorTabWidth: dto.editorTabWidth,
      windowWidth: dto.windowWidth,
      windowHeight: dto.windowHeight,
      isDefault: dto.isDefault,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      // 深拷贝UI状态
      uiState: {
        isDragging: this._uiState.isDragging,
        isResizing: this._uiState.isResizing,
        hasNotification: this._uiState.hasNotification,
        draggedElement: this._uiState.draggedElement,
        highlightedElement: this._uiState.highlightedElement,
        isDropTarget: this._uiState.isDropTarget,
        customCss: this._uiState.customCss,
      },
      // 深拷贝本地设置
      localSettings: {
        enableAnimations: this._localSettings.enableAnimations,
        enableAutoSave: this._localSettings.enableAutoSave,
        autoSaveInterval: this._localSettings.autoSaveInterval,
        enableKeyboardShortcuts: this._localSettings.enableKeyboardShortcuts,
        theme: this._localSettings.theme,
      },
    });
  }
}

export default EditorLayout;
