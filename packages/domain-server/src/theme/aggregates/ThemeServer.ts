/**
 * Theme Server Implementation (Legacy - ThemeConfig Stub)
 * @description ThemeConfig stub for backwards compatibility
 * @author DailyUse Team
 * @date 2025-09-29
 *
 * ⚠️ TECHNICAL DEBT ⚠️
 * @deprecated ThemeConfig should be refactored - this is a temporary stub
 *
 * Current Status:
 * - ThemeConfig class is used by ThemeService.ts (getThemeConfig, updateThemeConfig methods)
 * - ThemeDefinition class in this file is NOT USED (replaced by aggregates/ThemeDefinition.ts)
 *
 * TODO - Refactoring Plan:
 * 1. Decide ThemeConfig architecture:
 *    - Option A: Separate aggregate root (if it has its own business logic)
 *    - Option B: Value object within ThemeDefinition
 *    - Option C: Part of UserThemePreference entity
 *    - Option D: Application state (not domain)
 * 2. Migrate ThemeService.ts to use new structure
 * 3. Delete this entire file
 *
 * For now: Keeping ThemeConfig to avoid breaking ThemeService functionality
 */

import { ThemeContracts } from '@dailyuse/contracts';

type IThemeDefinition = ThemeContracts.IThemeDefinition;
type IThemeConfig = ThemeContracts.IThemeConfig;
type ThemeType = ThemeContracts.ThemeType;

/**
 * 主题定义服务端实现
 */
export class ThemeDefinition {
  private data: IThemeDefinition;

  constructor(themeData: IThemeDefinition) {
    this.data = themeData;
  }

  // Getter methods
  get id(): string {
    return this.data.id;
  }
  get name(): string {
    return this.data.name;
  }
  get description(): string | undefined {
    return this.data.description;
  }
  get type(): ThemeType {
    return this.data.type;
  }
  get author(): string | undefined {
    return this.data.author;
  }
  get version(): string {
    return this.data.version;
  }
  get isBuiltIn(): boolean {
    return this.data.isBuiltIn;
  }
  get preview(): string | undefined {
    return this.data.preview;
  }
  get createdAt(): Date {
    return this.data.createdAt;
  }
  get updatedAt(): Date {
    return this.data.updatedAt;
  }
  get colors(): any {
    return this.data.colors;
  }
  get fonts(): any {
    return this.data.fonts;
  }
  get spacing(): any {
    return this.data.spacing;
  }
  get borderRadius(): any {
    return this.data.borderRadius;
  }
  get shadows(): any {
    return this.data.shadows;
  }
  get animations(): any {
    return this.data.animations;
  }
  get customVariables(): Record<string, string> | undefined {
    return this.data.customVariables;
  }

  /**
   * 验证主题配置
   */
  public validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基础验证
    if (!this.name || this.name.trim().length === 0) {
      errors.push('主题名称不能为空');
    }

    if (this.name && this.name.length > 50) {
      errors.push('主题名称长度不能超过50个字符');
    }

    // 版本验证
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(this.version)) {
      errors.push('主题版本格式不正确，应为 x.y.z 格式');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 生成主题CSS
   */
  public generateCSS(): string {
    const cssRules: string[] = [];

    // 生成CSS根变量
    cssRules.push(':root {');
    cssRules.push('  /* 主题变量 */');
    cssRules.push(`  --theme-id: "${this.id}";`);
    cssRules.push(`  --theme-name: "${this.name}";`);
    cssRules.push(`  --theme-type: "${this.type}";`);

    // 颜色变量
    if (this.colors) {
      cssRules.push('  /* 颜色变量 */');
      if (this.colors.semantic) {
        cssRules.push(`  --color-success: ${this.colors.semantic.success.value};`);
        cssRules.push(`  --color-warning: ${this.colors.semantic.warning.value};`);
        cssRules.push(`  --color-error: ${this.colors.semantic.error.value};`);
        cssRules.push(`  --color-info: ${this.colors.semantic.info.value};`);
      }
    }

    // 字体变量
    if (this.fonts) {
      cssRules.push('  /* 字体变量 */');
      if (this.fonts.heading) {
        cssRules.push(`  --font-heading-size: ${this.fonts.heading.size}px;`);
        cssRules.push(`  --font-heading-weight: ${this.fonts.heading.weight};`);
      }
      if (this.fonts.body) {
        cssRules.push(`  --font-body-size: ${this.fonts.body.size}px;`);
        cssRules.push(`  --font-body-weight: ${this.fonts.body.weight};`);
      }
    }

    // 间距变量
    if (this.spacing) {
      cssRules.push('  /* 间距变量 */');
      Object.entries(this.spacing).forEach(([key, value]) => {
        cssRules.push(`  --spacing-${key}: ${value}px;`);
      });
    }

    cssRules.push('}');
    return cssRules.join('\n');
  }

  /**
   * 生成CSS变量对象
   */
  public generateCSSVariables(): Record<string, string> {
    const variables: Record<string, string> = {};

    variables['--theme-id'] = this.id;
    variables['--theme-name'] = this.name;
    variables['--theme-type'] = this.type;

    return variables;
  }

  /**
   * 创建主题
   */
  public static create(params: {
    name: string;
    description?: string;
    type: ThemeType;
    author?: string;
  }): ThemeDefinition {
    const now = new Date();
    const themeId = `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const themeData: IThemeDefinition = {
      id: themeId,
      name: params.name,
      description: params.description,
      type: params.type,
      author: params.author,
      version: '1.0.0',
      isBuiltIn: false,
      colors: {
        name: `${params.name} Colors`,
        primary: [],
        secondary: [],
        neutral: [],
        semantic: {
          success: { name: 'success', value: '#10B981', description: '成功色' },
          warning: { name: 'warning', value: '#F59E0B', description: '警告色' },
          error: { name: 'error', value: '#EF4444', description: '错误色' },
          info: { name: 'info', value: '#3B82F6', description: '信息色' },
        },
        background: [],
        text: [],
        border: [],
      },
      fonts: {
        heading: {
          family: 'system',
          size: 24,
          weight: 600,
          lineHeight: 1.2,
          letterSpacing: -0.025,
        },
        body: {
          family: 'system',
          size: 16,
          weight: 400,
          lineHeight: 1.5,
          letterSpacing: 0,
        },
        mono: {
          family: 'monospace',
          size: 14,
          weight: 400,
          lineHeight: 1.4,
          letterSpacing: 0,
        },
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        full: 9999,
      },
      shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animations: {
        duration: {
          fast: 150,
          normal: 300,
          slow: 500,
        },
        easing: {
          linear: 'linear',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      createdAt: now,
      updatedAt: now,
    };

    return new ThemeDefinition(themeData);
  }

  /**
   * 从DTO创建实例
   */
  public static fromDTO(dto: IThemeDefinition): ThemeDefinition {
    return new ThemeDefinition(dto);
  }

  /**
   * 转换为DTO
   */
  public toDTO(): IThemeDefinition {
    return { ...this.data };
  }
}

/**
 * 主题配置服务端实现
 */
export class ThemeConfig {
  private data: IThemeConfig;

  constructor(configData: IThemeConfig) {
    this.data = configData;
  }

  // Getter methods
  get activeThemeId(): string {
    return this.data.activeThemeId;
  }
  get followSystemTheme(): boolean {
    return this.data.followSystemTheme;
  }
  get autoSwitchTheme(): boolean {
    return this.data.autoSwitchTheme;
  }
  get lightThemeId(): string | undefined {
    return this.data.lightThemeId;
  }
  get darkThemeId(): string | undefined {
    return this.data.darkThemeId;
  }
  get switchTimes(): { dayStart: string; nightStart: string } | undefined {
    return this.data.switchTimes;
  }
  get customVariables(): Record<string, string> | undefined {
    return this.data.customVariables;
  }
  get enableTransitions(): boolean {
    return this.data.enableTransitions;
  }
  get transitionDuration(): number {
    return this.data.transitionDuration;
  }

  /**
   * 应用主题
   */
  public async applyTheme(themeId: string): Promise<any> {
    const startTime = new Date();

    try {
      console.log(`正在应用主题: ${themeId}`);

      // 更新当前主题ID
      this.updateActiveTheme(themeId);

      // 模拟应用过程
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        success: true,
        appliedThemeId: themeId,
        appliedAt: new Date(),
        appliedVariables: {},
        message: `主题 ${themeId} 应用成功`,
      };
    } catch (error) {
      return {
        success: false,
        appliedThemeId: themeId,
        appliedAt: startTime,
        error: error instanceof Error ? error.message : '主题应用失败',
      };
    }
  }

  /**
   * 切换到系统主题
   */
  public async switchToSystemTheme(): Promise<any> {
    const prefersDark =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;

    const systemThemeId = prefersDark ? 'dark' : 'light';
    return this.applyTheme(systemThemeId);
  }

  /**
   * 基于时间自动切换主题
   */
  public async autoSwitchBasedOnTime(): Promise<any> {
    const switchResult = this.shouldSwitchBasedOnTime();

    if (switchResult.shouldSwitch && switchResult.targetThemeId) {
      return this.applyTheme(switchResult.targetThemeId);
    }

    return {
      success: true,
      appliedThemeId: this.activeThemeId,
      appliedAt: new Date(),
      message: '无需切换主题',
    };
  }

  /**
   * 更新当前主题
   */
  public updateActiveTheme(themeId: string): void {
    this.data.activeThemeId = themeId;
  }

  /**
   * 判断是否需要基于时间切换主题
   */
  private shouldSwitchBasedOnTime(): { shouldSwitch: boolean; targetThemeId?: string } {
    if (!this.autoSwitchTheme || !this.switchTimes || !this.lightThemeId || !this.darkThemeId) {
      return { shouldSwitch: false };
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const dayStart = this.switchTimes.dayStart;
    const nightStart = this.switchTimes.nightStart;

    // 简单的时间比较逻辑
    const isDayTime = currentTime >= dayStart && currentTime < nightStart;
    const targetThemeId = isDayTime ? this.lightThemeId : this.darkThemeId;

    return {
      shouldSwitch: this.activeThemeId !== targetThemeId,
      targetThemeId,
    };
  }

  /**
   * 创建默认配置
   */
  public static createDefault(): ThemeConfig {
    const configData: IThemeConfig = {
      activeThemeId: 'light',
      followSystemTheme: false,
      autoSwitchTheme: false,
      enableTransitions: true,
      transitionDuration: 300,
    };

    return new ThemeConfig(configData);
  }

  /**
   * 从DTO创建实例
   */
  public static fromDTO(dto: IThemeConfig): ThemeConfig {
    return new ThemeConfig(dto);
  }

  /**
   * 转换为DTO
   */
  public toDTO(): IThemeConfig {
    return { ...this.data };
  }
}
