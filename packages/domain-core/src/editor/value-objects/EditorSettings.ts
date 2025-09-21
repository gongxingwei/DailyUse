// 临时类型定义
interface IEditorTheme {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

interface ThemeColors {
  background: string;
  foreground: string;
  accent: string;
  border: string;
  selection: string;
  lineNumber: string;
  [key: string]: string;
}

interface IAutoSaveSettings {
  enabled: boolean;
  interval: number;
  onFocusLoss: boolean;
}

interface ISyntaxSettings {
  highlightEnabled: boolean;
  language: string;
  markdownPreview: boolean;
  livePreview: boolean;
}

interface IEditorSettings {
  theme: IEditorTheme;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: IAutoSaveSettings;
  syntax: ISyntaxSettings;
}

/**
 * 编辑器主题值对象
 */
export class EditorTheme implements IEditorTheme {
  constructor(
    public readonly name: string,
    public readonly isDark: boolean,
    public readonly colors: ThemeColors,
  ) {
    if (!name.trim()) {
      throw new Error('Theme name cannot be empty');
    }

    this.validateColors(colors);
  }

  private validateColors(colors: ThemeColors): void {
    const requiredColors = [
      'background',
      'foreground',
      'accent',
      'border',
      'selection',
      'lineNumber',
    ];

    for (const colorKey of requiredColors) {
      if (!colors[colorKey] || !this.isValidColor(colors[colorKey])) {
        throw new Error(`Invalid or missing color: ${colorKey}`);
      }
    }
  }

  private isValidColor(color: string): boolean {
    // Basic color validation (hex, rgb, hsl, named colors)
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
    const hslPattern = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;

    return (
      hexPattern.test(color) ||
      rgbPattern.test(color) ||
      rgbaPattern.test(color) ||
      hslPattern.test(color) ||
      CSS.supports('color', color)
    ); // For named colors
  }

  updateColor(colorKey: string, colorValue: string): EditorTheme {
    if (!this.isValidColor(colorValue)) {
      throw new Error(`Invalid color value: ${colorValue}`);
    }

    return new EditorTheme(this.name, this.isDark, { ...this.colors, [colorKey]: colorValue });
  }

  static light(): EditorTheme {
    return new EditorTheme('Light', false, {
      background: '#ffffff',
      foreground: '#000000',
      accent: '#007acc',
      border: '#e1e4e8',
      selection: '#add6ff',
      lineNumber: '#6e7681',
    });
  }

  static dark(): EditorTheme {
    return new EditorTheme('Dark', true, {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      accent: '#007acc',
      border: '#3c3c3c',
      selection: '#264f78',
      lineNumber: '#858585',
    });
  }
}

/**
 * 自动保存设置值对象
 */
export class AutoSaveSettings implements IAutoSaveSettings {
  constructor(
    public readonly enabled: boolean,
    public readonly interval: number,
    public readonly onFocusLoss: boolean,
  ) {
    if (interval <= 0) {
      throw new Error('Auto save interval must be positive');
    }
  }

  enable(): AutoSaveSettings {
    return new AutoSaveSettings(true, this.interval, this.onFocusLoss);
  }

  disable(): AutoSaveSettings {
    return new AutoSaveSettings(false, this.interval, this.onFocusLoss);
  }

  setInterval(interval: number): AutoSaveSettings {
    if (interval <= 0) {
      throw new Error('Auto save interval must be positive');
    }
    return new AutoSaveSettings(this.enabled, interval, this.onFocusLoss);
  }

  setOnFocusLoss(onFocusLoss: boolean): AutoSaveSettings {
    return new AutoSaveSettings(this.enabled, this.interval, onFocusLoss);
  }

  static createDefault(): AutoSaveSettings {
    return new AutoSaveSettings(true, 5000, true); // Auto save every 5 seconds and on focus loss
  }
}

/**
 * 语法设置值对象
 */
export class SyntaxSettings implements ISyntaxSettings {
  constructor(
    public readonly highlightEnabled: boolean,
    public readonly language: string,
    public readonly markdownPreview: boolean,
    public readonly livePreview: boolean,
  ) {
    if (!language.trim()) {
      throw new Error('Language cannot be empty');
    }
  }

  setLanguage(language: string): SyntaxSettings {
    if (!language.trim()) {
      throw new Error('Language cannot be empty');
    }
    return new SyntaxSettings(
      this.highlightEnabled,
      language,
      this.markdownPreview,
      this.livePreview,
    );
  }

  enableHighlight(): SyntaxSettings {
    return new SyntaxSettings(true, this.language, this.markdownPreview, this.livePreview);
  }

  disableHighlight(): SyntaxSettings {
    return new SyntaxSettings(false, this.language, this.markdownPreview, this.livePreview);
  }

  enableMarkdownPreview(): SyntaxSettings {
    return new SyntaxSettings(this.highlightEnabled, this.language, true, this.livePreview);
  }

  disableMarkdownPreview(): SyntaxSettings {
    return new SyntaxSettings(this.highlightEnabled, this.language, false, this.livePreview);
  }

  enableLivePreview(): SyntaxSettings {
    return new SyntaxSettings(this.highlightEnabled, this.language, this.markdownPreview, true);
  }

  disableLivePreview(): SyntaxSettings {
    return new SyntaxSettings(this.highlightEnabled, this.language, this.markdownPreview, false);
  }

  static createDefault(): SyntaxSettings {
    return new SyntaxSettings(true, 'markdown', true, true);
  }
}

/**
 * 编辑器设置值对象
 */
export class EditorSettings implements IEditorSettings {
  constructor(
    public readonly theme: EditorTheme,
    public readonly fontSize: number,
    public readonly fontFamily: string,
    public readonly lineHeight: number,
    public readonly tabSize: number,
    public readonly wordWrap: boolean,
    public readonly lineNumbers: boolean,
    public readonly minimap: boolean,
    public readonly autoSave: AutoSaveSettings,
    public readonly syntax: SyntaxSettings,
  ) {
    if (fontSize <= 0) {
      throw new Error('Font size must be positive');
    }

    if (lineHeight <= 0) {
      throw new Error('Line height must be positive');
    }

    if (tabSize <= 0) {
      throw new Error('Tab size must be positive');
    }

    if (!fontFamily.trim()) {
      throw new Error('Font family cannot be empty');
    }
  }

  setTheme(theme: EditorTheme): EditorSettings {
    return new EditorSettings(
      theme,
      this.fontSize,
      this.fontFamily,
      this.lineHeight,
      this.tabSize,
      this.wordWrap,
      this.lineNumbers,
      this.minimap,
      this.autoSave,
      this.syntax,
    );
  }

  setFontSize(fontSize: number): EditorSettings {
    if (fontSize <= 0) {
      throw new Error('Font size must be positive');
    }
    return new EditorSettings(
      this.theme,
      fontSize,
      this.fontFamily,
      this.lineHeight,
      this.tabSize,
      this.wordWrap,
      this.lineNumbers,
      this.minimap,
      this.autoSave,
      this.syntax,
    );
  }

  setFontFamily(fontFamily: string): EditorSettings {
    if (!fontFamily.trim()) {
      throw new Error('Font family cannot be empty');
    }
    return new EditorSettings(
      this.theme,
      this.fontSize,
      fontFamily,
      this.lineHeight,
      this.tabSize,
      this.wordWrap,
      this.lineNumbers,
      this.minimap,
      this.autoSave,
      this.syntax,
    );
  }

  setLineHeight(lineHeight: number): EditorSettings {
    if (lineHeight <= 0) {
      throw new Error('Line height must be positive');
    }
    return new EditorSettings(
      this.theme,
      this.fontSize,
      this.fontFamily,
      lineHeight,
      this.tabSize,
      this.wordWrap,
      this.lineNumbers,
      this.minimap,
      this.autoSave,
      this.syntax,
    );
  }

  setTabSize(tabSize: number): EditorSettings {
    if (tabSize <= 0) {
      throw new Error('Tab size must be positive');
    }
    return new EditorSettings(
      this.theme,
      this.fontSize,
      this.fontFamily,
      this.lineHeight,
      tabSize,
      this.wordWrap,
      this.lineNumbers,
      this.minimap,
      this.autoSave,
      this.syntax,
    );
  }

  toggleWordWrap(): EditorSettings {
    return new EditorSettings(
      this.theme,
      this.fontSize,
      this.fontFamily,
      this.lineHeight,
      this.tabSize,
      !this.wordWrap,
      this.lineNumbers,
      this.minimap,
      this.autoSave,
      this.syntax,
    );
  }

  toggleLineNumbers(): EditorSettings {
    return new EditorSettings(
      this.theme,
      this.fontSize,
      this.fontFamily,
      this.lineHeight,
      this.tabSize,
      this.wordWrap,
      !this.lineNumbers,
      this.minimap,
      this.autoSave,
      this.syntax,
    );
  }

  toggleMinimap(): EditorSettings {
    return new EditorSettings(
      this.theme,
      this.fontSize,
      this.fontFamily,
      this.lineHeight,
      this.tabSize,
      this.wordWrap,
      this.lineNumbers,
      !this.minimap,
      this.autoSave,
      this.syntax,
    );
  }

  updateAutoSave(autoSave: AutoSaveSettings): EditorSettings {
    return new EditorSettings(
      this.theme,
      this.fontSize,
      this.fontFamily,
      this.lineHeight,
      this.tabSize,
      this.wordWrap,
      this.lineNumbers,
      this.minimap,
      autoSave,
      this.syntax,
    );
  }

  updateSyntax(syntax: SyntaxSettings): EditorSettings {
    return new EditorSettings(
      this.theme,
      this.fontSize,
      this.fontFamily,
      this.lineHeight,
      this.tabSize,
      this.wordWrap,
      this.lineNumbers,
      this.minimap,
      this.autoSave,
      syntax,
    );
  }

  static createDefault(): EditorSettings {
    return new EditorSettings(
      EditorTheme.light(),
      14,
      'Monaco, "Courier New", monospace',
      1.5,
      4,
      true,
      true,
      true,
      AutoSaveSettings.createDefault(),
      SyntaxSettings.createDefault(),
    );
  }

  static from(settings: IEditorSettings): EditorSettings {
    return new EditorSettings(
      new EditorTheme(settings.theme.name, settings.theme.isDark, settings.theme.colors),
      settings.fontSize,
      settings.fontFamily,
      settings.lineHeight,
      settings.tabSize,
      settings.wordWrap,
      settings.lineNumbers,
      settings.minimap,
      new AutoSaveSettings(
        settings.autoSave.enabled,
        settings.autoSave.interval,
        settings.autoSave.onFocusLoss,
      ),
      new SyntaxSettings(
        settings.syntax.highlightEnabled,
        settings.syntax.language,
        settings.syntax.markdownPreview,
        settings.syntax.livePreview,
      ),
    );
  }
}
