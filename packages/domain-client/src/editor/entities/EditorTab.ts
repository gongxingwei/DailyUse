import { EditorTabCore } from '@dailyuse/domain-core';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorTabDTO = EditorContracts.EditorTabDTO;
type SupportedFileType = EditorContracts.SupportedFileType;

/**
 * 客户端 EditorTab 实体
 * 继承核心 EditorTab 类，添加客户端特有功能
 */
export class EditorTab extends EditorTabCore {
  private _uiState: {
    isHighlighted: boolean;
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
    cursorPosition?: { line: number; column: number };
    scrollPosition?: { top: number; left: number };
    selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
    foldedRanges?: Array<{ start: number; end: number }>;
    bookmarks?: number[];
  };
  private _localHistory: Array<{
    timestamp: Date;
    action: string;
    data: any;
  }>;
  private _customTheme?: string;

  constructor(params: {
    uuid?: string;
    title: string;
    path: string;
    active?: boolean;
    isPreview?: boolean;
    fileType?: SupportedFileType;
    isDirty?: boolean;
    content?: string;
    lastModified?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    // 客户端特有字段
    uiState?: {
      isHighlighted?: boolean;
      isLoading?: boolean;
      hasError?: boolean;
      errorMessage?: string;
      cursorPosition?: { line: number; column: number };
      scrollPosition?: { top: number; left: number };
      selection?: {
        start: { line: number; column: number };
        end: { line: number; column: number };
      };
      foldedRanges?: Array<{ start: number; end: number }>;
      bookmarks?: number[];
    };
    localHistory?: Array<{
      timestamp: Date;
      action: string;
      data: any;
    }>;
    customTheme?: string;
  }) {
    super(params);

    this._uiState = {
      isHighlighted: params.uiState?.isHighlighted || false,
      isLoading: params.uiState?.isLoading || false,
      hasError: params.uiState?.hasError || false,
      errorMessage: params.uiState?.errorMessage,
      cursorPosition: params.uiState?.cursorPosition,
      scrollPosition: params.uiState?.scrollPosition,
      selection: params.uiState?.selection,
      foldedRanges: params.uiState?.foldedRanges || [],
      bookmarks: params.uiState?.bookmarks || [],
    };
    this._localHistory = params.localHistory || [];
    this._customTheme = params.customTheme;
  }

  // ===== 实现抽象方法 =====

  /**
   * 转换为DTO
   */
  toDTO(): EditorTabDTO {
    return {
      uuid: this.uuid,
      title: this.title,
      path: this.path,
      active: this.active,
      isPreview: this.isPreview,
      fileType: this.fileType,
      isDirty: this.isDirty,
      content: this.content,
      lastModified: this.lastModified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== Getter 方法 =====
  get uiState() {
    return { ...this._uiState };
  }
  get localHistory() {
    return [...this._localHistory];
  }
  get customTheme(): string | undefined {
    return this._customTheme;
  }
  get cursorPosition() {
    return this._uiState.cursorPosition;
  }
  get scrollPosition() {
    return this._uiState.scrollPosition;
  }
  get selection() {
    return this._uiState.selection;
  }
  get isHighlighted(): boolean {
    return this._uiState.isHighlighted;
  }
  get isLoading(): boolean {
    return this._uiState.isLoading;
  }
  get hasError(): boolean {
    return this._uiState.hasError;
  }
  get errorMessage(): string | undefined {
    return this._uiState.errorMessage;
  }

  // ===== 客户端特有方法 =====

  /**
   * 设置光标位置
   */
  setCursorPosition(line: number, column: number): void {
    this._uiState.cursorPosition = { line, column };
    this.addToLocalHistory('cursor_move', { line, column });
  }

  /**
   * 设置滚动位置
   */
  setScrollPosition(top: number, left: number): void {
    this._uiState.scrollPosition = { top, left };
  }

  /**
   * 设置选择区域
   */
  setSelection(
    start: { line: number; column: number },
    end: { line: number; column: number },
  ): void {
    this._uiState.selection = { start, end };
    this.addToLocalHistory('selection_change', { start, end });
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this._uiState.selection = undefined;
  }

  /**
   * 设置高亮状态
   */
  setHighlighted(highlighted: boolean): void {
    this._uiState.isHighlighted = highlighted;
  }

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean): void {
    this._uiState.isLoading = loading;
    if (loading) {
      this.clearError();
    }
  }

  /**
   * 设置错误状态
   */
  setError(errorMessage: string): void {
    this._uiState.hasError = true;
    this._uiState.errorMessage = errorMessage;
    this._uiState.isLoading = false;
    this.addToLocalHistory('error', { errorMessage });
  }

  /**
   * 清除错误状态
   */
  clearError(): void {
    this._uiState.hasError = false;
    this._uiState.errorMessage = undefined;
  }

  /**
   * 添加书签
   */
  addBookmark(line: number): void {
    if (!this._uiState.bookmarks) {
      this._uiState.bookmarks = [];
    }
    if (!this._uiState.bookmarks.includes(line)) {
      this._uiState.bookmarks.push(line);
      this._uiState.bookmarks.sort((a, b) => a - b);
      this.addToLocalHistory('bookmark_add', { line });
      this.updateTimestamp();
    }
  }

  /**
   * 移除书签
   */
  removeBookmark(line: number): void {
    if (this._uiState.bookmarks) {
      const index = this._uiState.bookmarks.indexOf(line);
      if (index !== -1) {
        this._uiState.bookmarks.splice(index, 1);
        this.addToLocalHistory('bookmark_remove', { line });
        this.updateTimestamp();
      }
    }
  }

  /**
   * 切换书签
   */
  toggleBookmark(line: number): void {
    if (this._uiState.bookmarks?.includes(line)) {
      this.removeBookmark(line);
    } else {
      this.addBookmark(line);
    }
  }

  /**
   * 折叠代码范围
   */
  foldRange(start: number, end: number): void {
    if (!this._uiState.foldedRanges) {
      this._uiState.foldedRanges = [];
    }

    const existingRange = this._uiState.foldedRanges.find(
      (range) => range.start === start && range.end === end,
    );

    if (!existingRange) {
      this._uiState.foldedRanges.push({ start, end });
      this.addToLocalHistory('fold_range', { start, end });
      this.updateTimestamp();
    }
  }

  /**
   * 展开代码范围
   */
  unfoldRange(start: number, end: number): void {
    if (this._uiState.foldedRanges) {
      const index = this._uiState.foldedRanges.findIndex(
        (range) => range.start === start && range.end === end,
      );

      if (index !== -1) {
        this._uiState.foldedRanges.splice(index, 1);
        this.addToLocalHistory('unfold_range', { start, end });
        this.updateTimestamp();
      }
    }
  }

  /**
   * 展开所有折叠
   */
  unfoldAll(): void {
    if (this._uiState.foldedRanges && this._uiState.foldedRanges.length > 0) {
      this._uiState.foldedRanges = [];
      this.addToLocalHistory('unfold_all', {});
      this.updateTimestamp();
    }
  }

  /**
   * 设置自定义主题
   */
  setCustomTheme(theme: string): void {
    this._customTheme = theme;
    this.addToLocalHistory('theme_change', { theme });
    this.updateTimestamp();
  }

  /**
   * 清除自定义主题
   */
  clearCustomTheme(): void {
    this._customTheme = undefined;
    this.addToLocalHistory('theme_clear', {});
    this.updateTimestamp();
  }

  /**
   * 添加到本地历史
   */
  private addToLocalHistory(action: string, data: any): void {
    this._localHistory.push({
      timestamp: new Date(),
      action,
      data,
    });

    // 限制历史记录数量
    if (this._localHistory.length > 100) {
      this._localHistory = this._localHistory.slice(-50);
    }
  }

  /**
   * 清除本地历史
   */
  clearLocalHistory(): void {
    this._localHistory = [];
  }

  /**
   * 获取指定行的内容
   */
  getLineContent(lineNumber: number): string {
    if (!this.content) return '';

    const lines = this.content.split('\n');
    return lines[lineNumber - 1] || '';
  }

  /**
   * 获取选中的文本
   */
  getSelectedText(): string {
    if (!this.content || !this._uiState.selection) return '';

    const lines = this.content.split('\n');
    const { start, end } = this._uiState.selection;

    if (start.line === end.line) {
      // 单行选择
      const line = lines[start.line - 1];
      return line?.substring(start.column, end.column) || '';
    } else {
      // 多行选择
      const selectedLines: string[] = [];

      for (let i = start.line - 1; i <= end.line - 1; i++) {
        if (i === start.line - 1) {
          // 第一行
          selectedLines.push(lines[i]?.substring(start.column) || '');
        } else if (i === end.line - 1) {
          // 最后一行
          selectedLines.push(lines[i]?.substring(0, end.column) || '');
        } else {
          // 中间行
          selectedLines.push(lines[i] || '');
        }
      }

      return selectedLines.join('\n');
    }
  }

  /**
   * 跳转到指定行
   */
  goToLine(lineNumber: number): void {
    this.setCursorPosition(lineNumber, 0);
    this.setScrollPosition(lineNumber * 20, 0); // 假设行高为20px
  }

  /**
   * 获取标签页状态摘要
   */
  getStateSummary(): {
    hasUnsavedChanges: boolean;
    hasBookmarks: boolean;
    hasFoldedRanges: boolean;
    hasSelection: boolean;
    isCurrentlyActive: boolean;
    fileSize: number;
    lineCount: number;
  } {
    const lines = this.content?.split('\n') || [];

    return {
      hasUnsavedChanges: this.isDirty || false,
      hasBookmarks: (this._uiState.bookmarks?.length || 0) > 0,
      hasFoldedRanges: (this._uiState.foldedRanges?.length || 0) > 0,
      hasSelection: !!this._uiState.selection,
      isCurrentlyActive: this.active,
      fileSize: this.content?.length || 0,
      lineCount: lines.length,
    };
  }

  /**
   * 重置UI状态
   */
  resetUiState(): void {
    this._uiState = {
      isHighlighted: false,
      isLoading: false,
      hasError: false,
      errorMessage: undefined,
      cursorPosition: undefined,
      scrollPosition: undefined,
      selection: undefined,
      foldedRanges: [],
      bookmarks: [],
    };
    this.addToLocalHistory('ui_reset', {});
    this.updateTimestamp();
  }
}
