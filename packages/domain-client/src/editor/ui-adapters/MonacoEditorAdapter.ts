/**
 * Monaco Editor Adapter
 * Monaco 编辑器适配器 - 将领域模型适配到 Monaco Editor
 */

// 导入 Monaco Editor 类型（在实际使用中会从 monaco-editor 包导入）
interface ITextModel {
  getValue(): string;
  setValue(value: string): void;
  onDidChangeContent(listener: (e: any) => void): any;
  getLineCount(): number;
  getLineContent(lineNumber: number): string;
}

interface IStandaloneCodeEditor {
  getModel(): ITextModel | null;
  setModel(model: ITextModel | null): void;
  getPosition(): { lineNumber: number; column: number } | null;
  setPosition(position: { lineNumber: number; column: number }): void;
  getSelection(): any;
  setSelection(selection: any): void;
  focus(): void;
  layout(): void;
}

// 从 domain-core 导入的类型（临时定义）
interface Position {
  line: number;
  column: number;
  offset: number;
}

interface TextSelection {
  start: Position;
  end: Position;
  direction: 'forward' | 'backward';
}

interface IContentChange {
  uuid: string;
  type: string;
  position: Position;
  length: number;
  oldText: string;
  newText: string;
  timestamp: number;
}

interface DocumentFormat {
  MARKDOWN: 'markdown';
  JAVASCRIPT: 'javascript';
  TYPESCRIPT: 'typescript';
  HTML: 'html';
  JSON: 'json';
  PLAINTEXT: 'plaintext';
}

interface RenderingMode {
  SOURCE_ONLY: 'source';
  PREVIEW_ONLY: 'preview';
  SPLIT_VIEW: 'split';
  WYSIWYG: 'wysiwyg';
}

interface EditorTheme {
  name: string;
  isDark: boolean;
  colors: Record<string, string>;
}

/**
 * Monaco Editor 配置适配器
 */
export class MonacoConfigurationAdapter {
  /**
   * 将文档格式转换为 Monaco 语言标识符
   */
  static formatToLanguage(format: keyof DocumentFormat): string {
    const formatMap: Record<keyof DocumentFormat, string> = {
      MARKDOWN: 'markdown',
      JAVASCRIPT: 'javascript',
      TYPESCRIPT: 'typescript',
      HTML: 'html',
      JSON: 'json',
      PLAINTEXT: 'plaintext',
    };

    return formatMap[format] || 'plaintext';
  }

  /**
   * 将编辑器主题转换为 Monaco 主题
   */
  static themeToMonacoTheme(theme: EditorTheme): string {
    if (theme.name.toLowerCase().includes('dark')) {
      return 'vs-dark';
    } else if (theme.name.toLowerCase().includes('light')) {
      return 'vs-light';
    } else {
      return theme.isDark ? 'vs-dark' : 'vs-light';
    }
  }

  /**
   * 创建 Monaco 编辑器选项
   */
  static createEditorOptions(settings: any): any {
    return {
      theme: this.themeToMonacoTheme(settings.theme),
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      lineHeight: settings.lineHeight,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      lineNumbers: settings.lineNumbers ? 'on' : 'off',
      minimap: {
        enabled: settings.minimap,
      },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'boundary',
      bracketMatching: 'always',
      autoClosingBrackets: 'always',
      autoIndent: 'advanced',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      snippetSuggestions: 'top',
    };
  }
}

/**
 * Monaco Editor 位置适配器
 */
export class MonacoPositionAdapter {
  /**
   * 将领域位置转换为 Monaco 位置
   */
  static domainToMonaco(position: Position): { lineNumber: number; column: number } {
    return {
      lineNumber: position.line + 1, // Monaco 行号从 1 开始
      column: position.column + 1, // Monaco 列号从 1 开始
    };
  }

  /**
   * 将 Monaco 位置转换为领域位置
   */
  static monacoToDomain(
    position: { lineNumber: number; column: number },
    textModel: ITextModel,
  ): Position {
    // 计算偏移量
    let offset = 0;
    for (let i = 1; i < position.lineNumber; i++) {
      offset += textModel.getLineContent(i).length + 1; // +1 for newline
    }
    offset += position.column - 1;

    return {
      line: position.lineNumber - 1,
      column: position.column - 1,
      offset,
    };
  }

  /**
   * 将领域选择转换为 Monaco 选择
   */
  static domainSelectionToMonaco(selection: TextSelection): any {
    const startPos = this.domainToMonaco(selection.start);
    const endPos = this.domainToMonaco(selection.end);

    return {
      startLineNumber: startPos.lineNumber,
      startColumn: startPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: endPos.column,
      selectionStartLineNumber:
        selection.direction === 'forward' ? startPos.lineNumber : endPos.lineNumber,
      selectionStartColumn: selection.direction === 'forward' ? startPos.column : endPos.column,
      positionLineNumber: endPos.lineNumber,
      positionColumn: endPos.column,
    };
  }

  /**
   * 将 Monaco 选择转换为领域选择
   */
  static monacoSelectionToDomain(selection: any, textModel: ITextModel): TextSelection {
    const start = this.monacoToDomain(
      {
        lineNumber: selection.startLineNumber,
        column: selection.startColumn,
      },
      textModel,
    );

    const end = this.monacoToDomain(
      {
        lineNumber: selection.endLineNumber,
        column: selection.endColumn,
      },
      textModel,
    );

    const direction =
      selection.selectionStartLineNumber === selection.startLineNumber &&
      selection.selectionStartColumn === selection.startColumn
        ? 'forward'
        : 'backward';

    return {
      start,
      end,
      direction: direction as 'forward' | 'backward',
    };
  }
}

/**
 * Monaco Editor 事件适配器
 */
export class MonacoEventAdapter {
  /**
   * 将 Monaco 内容变更事件转换为领域内容变更
   */
  static contentChangeEventToDomain(event: any, textModel: ITextModel): IContentChange[] {
    const changes: IContentChange[] = [];

    for (const change of event.changes) {
      const startPos = MonacoPositionAdapter.monacoToDomain(
        {
          lineNumber: change.range.startLineNumber,
          column: change.range.startColumn,
        },
        textModel,
      );

      let changeType: string;
      if (change.rangeLength === 0) {
        changeType = 'INSERT';
      } else if (change.text === '') {
        changeType = 'DELETE';
      } else {
        changeType = 'REPLACE';
      }

      changes.push({
        uuid: this.generateChangeId(),
        type: changeType,
        position: startPos,
        length: change.rangeLength,
        oldText: change.rangeLength > 0 ? '...' : '', // Monaco 不提供原始文本
        newText: change.text,
        timestamp: Date.now(),
      });
    }

    return changes;
  }

  private static generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Monaco Editor 主要适配器类
 */
export class MonacoEditorAdapter {
  private editor: IStandaloneCodeEditor;
  private textModel: ITextModel;
  private contentChangeListeners: ((changes: IContentChange[]) => void)[] = [];
  private selectionChangeListeners: ((selection: TextSelection) => void)[] = [];
  private positionChangeListeners: ((position: Position) => void)[] = [];

  constructor(editor: IStandaloneCodeEditor) {
    this.editor = editor;
    this.textModel = editor.getModel()!;
    this.setupEventListeners();
  }

  /**
   * 设置文档内容
   */
  setContent(content: string): void {
    this.textModel.setValue(content);
  }

  /**
   * 获取文档内容
   */
  getContent(): string {
    return this.textModel.getValue();
  }

  /**
   * 设置光标位置
   */
  setCursorPosition(position: Position): void {
    const monacoPos = MonacoPositionAdapter.domainToMonaco(position);
    this.editor.setPosition(monacoPos);
  }

  /**
   * 获取光标位置
   */
  getCursorPosition(): Position | null {
    const monacoPos = this.editor.getPosition();
    if (!monacoPos) return null;

    return MonacoPositionAdapter.monacoToDomain(monacoPos, this.textModel);
  }

  /**
   * 设置选择区域
   */
  setSelection(selection: TextSelection): void {
    const monacoSelection = MonacoPositionAdapter.domainSelectionToMonaco(selection);
    this.editor.setSelection(monacoSelection);
  }

  /**
   * 获取选择区域
   */
  getSelection(): TextSelection | null {
    const monacoSelection = this.editor.getSelection();
    if (!monacoSelection) return null;

    return MonacoPositionAdapter.monacoSelectionToDomain(monacoSelection, this.textModel);
  }

  /**
   * 应用编辑器设置
   */
  applySettings(settings: any): void {
    const options = MonacoConfigurationAdapter.createEditorOptions(settings);
    (this.editor as any).updateOptions(options);
  }

  /**
   * 设置语言模式
   */
  setLanguage(format: keyof DocumentFormat): void {
    const language = MonacoConfigurationAdapter.formatToLanguage(format);
    (this.textModel as any).setLanguage?.(language);
  }

  /**
   * 聚焦编辑器
   */
  focus(): void {
    this.editor.focus();
  }

  /**
   * 重新布局编辑器
   */
  layout(): void {
    this.editor.layout();
  }

  /**
   * 订阅内容变更事件
   */
  onContentChange(listener: (changes: IContentChange[]) => void): () => void {
    this.contentChangeListeners.push(listener);

    // 返回取消订阅函数
    return () => {
      const index = this.contentChangeListeners.indexOf(listener);
      if (index !== -1) {
        this.contentChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * 订阅选择变更事件
   */
  onSelectionChange(listener: (selection: TextSelection) => void): () => void {
    this.selectionChangeListeners.push(listener);

    return () => {
      const index = this.selectionChangeListeners.indexOf(listener);
      if (index !== -1) {
        this.selectionChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * 订阅位置变更事件
   */
  onPositionChange(listener: (position: Position) => void): () => void {
    this.positionChangeListeners.push(listener);

    return () => {
      const index = this.positionChangeListeners.indexOf(listener);
      if (index !== -1) {
        this.positionChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * 销毁适配器
   */
  dispose(): void {
    this.contentChangeListeners = [];
    this.selectionChangeListeners = [];
    this.positionChangeListeners = [];
  }

  private setupEventListeners(): void {
    // 监听内容变更
    this.textModel.onDidChangeContent((event) => {
      const changes = MonacoEventAdapter.contentChangeEventToDomain(event, this.textModel);
      this.contentChangeListeners.forEach((listener) => listener(changes));
    });

    // 监听选择变更
    (this.editor as any).onDidChangeCursorSelection?.((event: any) => {
      const selection = MonacoPositionAdapter.monacoSelectionToDomain(
        event.selection,
        this.textModel,
      );
      this.selectionChangeListeners.forEach((listener) => listener(selection));
    });

    // 监听位置变更
    (this.editor as any).onDidChangeCursorPosition?.((event: any) => {
      const position = MonacoPositionAdapter.monacoToDomain(event.position, this.textModel);
      this.positionChangeListeners.forEach((listener) => listener(position));
    });
  }
}
