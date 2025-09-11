import { EditorLayoutCore } from '@dailyuse/domain-core';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorLayoutDTO = EditorContracts.EditorLayoutDTO;

/**
 * 客户端 EditorLayout 聚合根
 * 继承核心 EditorLayout 类，添加客户端特有功能
 */
export class EditorLayout extends EditorLayoutCore {
  private _uiState: {
    isDragging: boolean;
    isResizing: boolean;
    draggedElement?: string;
    resizedElement?: string;
    mousePosition?: { x: number; y: number };
  };
  private _customCss?: string;
  private _layoutPresets: Array<{
    name: string;
    description?: string;
    config: Record<string, any>;
    createdAt: Date;
  }>;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
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
      draggedElement?: string;
      resizedElement?: string;
      mousePosition?: { x: number; y: number };
    };
    customCss?: string;
    layoutPresets?: Array<{
      name: string;
      description?: string;
      config: Record<string, any>;
      createdAt: Date;
    }>;
  }) {
    super(params);

    this._uiState = {
      isDragging: params.uiState?.isDragging || false,
      isResizing: params.uiState?.isResizing || false,
      draggedElement: params.uiState?.draggedElement,
      resizedElement: params.uiState?.resizedElement,
      mousePosition: params.uiState?.mousePosition,
    };
    this._customCss = params.customCss;
    this._layoutPresets = params.layoutPresets || [];
  }

  // ===== 实现抽象方法 =====

  /**
   * 转换为DTO
   */
  toDTO(): EditorLayoutDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
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
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== Getter 方法 =====
  get uiState() {
    return { ...this._uiState };
  }
  get customCss(): string | undefined {
    return this._customCss;
  }
  get layoutPresets() {
    return [...this._layoutPresets];
  }
  get isDragging(): boolean {
    return this._uiState.isDragging;
  }
  get isResizing(): boolean {
    return this._uiState.isResizing;
  }

  // ===== 客户端特有方法 =====

  /**
   * 开始拖拽元素
   */
  startDragging(elementId: string, mousePosition: { x: number; y: number }): void {
    this._uiState.isDragging = true;
    this._uiState.draggedElement = elementId;
    this._uiState.mousePosition = mousePosition;
  }

  /**
   * 更新拖拽位置
   */
  updateDragPosition(mousePosition: { x: number; y: number }): void {
    if (this._uiState.isDragging) {
      this._uiState.mousePosition = mousePosition;
    }
  }

  /**
   * 结束拖拽
   */
  endDragging(): void {
    this._uiState.isDragging = false;
    this._uiState.draggedElement = undefined;
    this._uiState.mousePosition = undefined;
    this.updateTimestamp();
  }

  /**
   * 开始调整大小
   */
  startResizing(elementId: string): void {
    this._uiState.isResizing = true;
    this._uiState.resizedElement = elementId;
  }

  /**
   * 结束调整大小
   */
  endResizing(): void {
    this._uiState.isResizing = false;
    this._uiState.resizedElement = undefined;
    this.updateTimestamp();
  }

  /**
   * 设置自定义CSS
   */
  setCustomCss(css: string): void {
    this._customCss = css;
    this.updateTimestamp();
  }

  /**
   * 清除自定义CSS
   */
  clearCustomCss(): void {
    this._customCss = undefined;
    this.updateTimestamp();
  }

  /**
   * 添加布局预设
   */
  addLayoutPreset(name: string, description?: string): void {
    if (this._layoutPresets.some((preset) => preset.name === name)) {
      throw new Error(`布局预设 "${name}" 已存在`);
    }

    const config = {
      activityBarWidth: this.activityBarWidth,
      sidebarWidth: this.sidebarWidth,
      minSidebarWidth: this.minSidebarWidth,
      resizeHandleWidth: this.resizeHandleWidth,
      minEditorWidth: this.minEditorWidth,
      editorTabWidth: this.editorTabWidth,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      customCss: this._customCss,
    };

    this._layoutPresets.push({
      name,
      description,
      config,
      createdAt: new Date(),
    });

    this.updateTimestamp();
  }

  /**
   * 移除布局预设
   */
  removeLayoutPreset(name: string): void {
    const index = this._layoutPresets.findIndex((preset) => preset.name === name);
    if (index !== -1) {
      this._layoutPresets.splice(index, 1);
      this.updateTimestamp();
    }
  }

  /**
   * 应用布局预设
   */
  applyLayoutPreset(name: string): void {
    const preset = this._layoutPresets.find((p) => p.name === name);
    if (!preset) {
      throw new Error(`布局预设 "${name}" 不存在`);
    }

    const { config } = preset;

    // 应用配置
    if (config.sidebarWidth) this.updateSidebarWidth(config.sidebarWidth);
    if (config.windowWidth && config.windowHeight) {
      this.updateWindowSize(config.windowWidth, config.windowHeight);
    }
    if (config.customCss) this.setCustomCss(config.customCss);

    this.updateTimestamp();
  }

  /**
   * 更新布局预设
   */
  updateLayoutPreset(name: string, description?: string): void {
    const preset = this._layoutPresets.find((p) => p.name === name);
    if (!preset) {
      throw new Error(`布局预设 "${name}" 不存在`);
    }

    // 更新配置
    preset.config = {
      activityBarWidth: this.activityBarWidth,
      sidebarWidth: this.sidebarWidth,
      minSidebarWidth: this.minSidebarWidth,
      resizeHandleWidth: this.resizeHandleWidth,
      minEditorWidth: this.minEditorWidth,
      editorTabWidth: this.editorTabWidth,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      customCss: this._customCss,
    };

    if (description !== undefined) {
      preset.description = description;
    }

    this.updateTimestamp();
  }

  /**
   * 快速调整侧边栏宽度
   */
  quickResizeSidebar(direction: 'increase' | 'decrease', step: number = 50): void {
    const currentWidth = this.sidebarWidth;
    const newWidth =
      direction === 'increase'
        ? currentWidth + step
        : Math.max(this.minSidebarWidth, currentWidth - step);

    this.updateSidebarWidth(newWidth);
  }

  /**
   * 自动调整布局以适应内容
   */
  autoFitLayout(): void {
    // 这里可以根据内容自动调整布局
    // 示例：根据编辑器区域宽度调整侧边栏
    const editorAreaWidth = this.editorAreaWidth;

    if (editorAreaWidth < 400) {
      // 编辑器区域太小，缩小侧边栏
      this.quickResizeSidebar('decrease', 50);
    } else if (editorAreaWidth > 800) {
      // 编辑器区域很大，可以适当增加侧边栏
      this.quickResizeSidebar('increase', 25);
    }
  }

  /**
   * 切换全屏模式
   */
  toggleFullscreen(): void {
    const isFullscreen = this.windowWidth >= screen.width && this.windowHeight >= screen.height;

    if (isFullscreen) {
      // 退出全屏
      this.updateWindowSize(1200, 800);
    } else {
      // 进入全屏
      this.updateWindowSize(screen.width, screen.height);
    }
  }

  /**
   * 重置为推荐设置
   */
  resetToRecommended(): void {
    this.updateWindowSize(1200, 800);
    this.updateSidebarWidth(300);
    this.clearCustomCss();
    this.updateTimestamp();
  }

  /**
   * 获取布局信息摘要
   */
  getLayoutSummary(): {
    totalWidth: number;
    totalHeight: number;
    editorAreaWidth: number;
    sidebarPercentage: number;
    hasCustomCss: boolean;
    presetCount: number;
    isFullscreen: boolean;
  } {
    return {
      totalWidth: this.windowWidth,
      totalHeight: this.windowHeight,
      editorAreaWidth: this.editorAreaWidth,
      sidebarPercentage: (this.sidebarWidth / this.windowWidth) * 100,
      hasCustomCss: !!this._customCss,
      presetCount: this._layoutPresets.length,
      isFullscreen: this.windowWidth >= screen.width && this.windowHeight >= screen.height,
    };
  }

  /**
   * 导出布局配置
   */
  exportConfig(): Record<string, any> {
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
      customCss: this._customCss,
      layoutPresets: this._layoutPresets,
    };
  }

  /**
   * 导入布局配置
   */
  importConfig(config: Record<string, any>): void {
    if (config.name) this.updateName(config.name);
    if (config.sidebarWidth) this.updateSidebarWidth(config.sidebarWidth);
    if (config.windowWidth && config.windowHeight) {
      this.updateWindowSize(config.windowWidth, config.windowHeight);
    }
    if (config.customCss) this.setCustomCss(config.customCss);
    if (config.layoutPresets) this._layoutPresets = config.layoutPresets;

    this.updateTimestamp();
  }

  /**
   * 重置UI状态
   */
  resetUiState(): void {
    this._uiState = {
      isDragging: false,
      isResizing: false,
      draggedElement: undefined,
      resizedElement: undefined,
      mousePosition: undefined,
    };
  }
}
