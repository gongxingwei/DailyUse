/**
 * Theme Core
 * @description 主题模块的核心聚合根抽象类
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { AggregateRoot } from '@dailyuse/utils';
import { type IThemeDefinition, type IThemeConfig, ThemeType } from '@dailyuse/contracts';

// 临时类型定义，直到合约层完全导出
type ColorPalette = any;
type FontConfig = any;
type SpacingConfig = any;
type BorderRadiusConfig = any;
type ShadowConfig = any;
type AnimationConfig = any;
type ThemeApplicationResult = any;

interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 主题定义核心抽象类
 */
export abstract class ThemeDefinitionCore extends AggregateRoot implements IThemeDefinition {
  // 基础属性
  protected _id: string;
  protected _name: string;
  protected _description?: string;
  protected _type: ThemeType;
  protected _author?: string;
  protected _version: string;
  protected _isBuiltIn: boolean;
  protected _preview?: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  // 主题配置属性
  protected _colors: ColorPalette;
  protected _fonts: {
    heading: FontConfig;
    body: FontConfig;
    mono: FontConfig;
  };
  protected _spacing: SpacingConfig;
  protected _borderRadius: BorderRadiusConfig;
  protected _shadows: ShadowConfig;
  protected _animations: AnimationConfig;
  protected _customVariables?: Record<string, string>;

  constructor(data: IThemeDefinition) {
    super(data.id);

    this._id = data.id;
    this._name = data.name;
    this._description = data.description;
    this._type = data.type;
    this._author = data.author;
    this._version = data.version;
    this._isBuiltIn = data.isBuiltIn;
    this._preview = data.preview;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;

    this._colors = data.colors;
    this._fonts = data.fonts;
    this._spacing = data.spacing;
    this._borderRadius = data.borderRadius;
    this._shadows = data.shadows;
    this._animations = data.animations;
    this._customVariables = data.customVariables;
  }

  // Getter 方法
  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }
  get type(): ThemeType {
    return this._type;
  }
  get author(): string | undefined {
    return this._author;
  }
  get version(): string {
    return this._version;
  }
  get isBuiltIn(): boolean {
    return this._isBuiltIn;
  }
  get preview(): string | undefined {
    return this._preview;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  get colors(): ColorPalette {
    return { ...this._colors };
  }
  get fonts(): { heading: FontConfig; body: FontConfig; mono: FontConfig } {
    return {
      heading: { ...this._fonts.heading },
      body: { ...this._fonts.body },
      mono: { ...this._fonts.mono },
    };
  }
  get spacing(): SpacingConfig {
    return { ...this._spacing };
  }
  get borderRadius(): BorderRadiusConfig {
    return { ...this._borderRadius };
  }
  get shadows(): ShadowConfig {
    return { ...this._shadows };
  }
  get animations(): AnimationConfig {
    return { ...this._animations };
  }
  get customVariables(): Record<string, string> | undefined {
    return this._customVariables ? { ...this._customVariables } : undefined;
  }

  // 抽象方法 - 子类必须实现
  abstract validate(): ThemeValidationResult;
  abstract generateCSS(): string;
  abstract generateCSSVariables(): Record<string, string>;

  // 公共业务方法
  public updateBasicInfo(params: { name?: string; description?: string; author?: string }): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改基本信息');
    }

    if (params.name) {
      this._name = params.name;
    }
    if (params.description !== undefined) {
      this._description = params.description;
    }
    if (params.author) {
      this._author = params.author;
    }

    this._updatedAt = new Date();
    this.incrementVersion();
  }

  public updateColors(colors: Partial<ColorPalette>): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改颜色配置');
    }

    this._colors = { ...this._colors, ...colors };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  public updateFonts(
    fonts: Partial<{
      heading: FontConfig;
      body: FontConfig;
      mono: FontConfig;
    }>,
  ): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改字体配置');
    }

    this._fonts = { ...this._fonts, ...fonts };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  public updateCustomVariables(variables: Record<string, string>): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改自定义变量');
    }

    this._customVariables = { ...this._customVariables, ...variables };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  public clone(newId: string, newName: string): IThemeDefinition {
    return {
      id: newId,
      name: newName,
      description: `${this._description} (复制)`,
      type: this._type,
      author: this._author,
      version: '1.0.0',
      isBuiltIn: false,
      colors: { ...this._colors },
      fonts: {
        heading: { ...this._fonts.heading },
        body: { ...this._fonts.body },
        mono: { ...this._fonts.mono },
      },
      spacing: { ...this._spacing },
      borderRadius: { ...this._borderRadius },
      shadows: { ...this._shadows },
      animations: { ...this._animations },
      customVariables: this._customVariables ? { ...this._customVariables } : undefined,
      preview: this._preview,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public isCompatibleWith(appVersion: string): boolean {
    // 简单的版本兼容性检查
    const [majorVersion] = this._version.split('.');
    const [appMajorVersion] = appVersion.split('.');

    return majorVersion === appMajorVersion;
  }

  protected incrementVersion(): void {
    const [major, minor, patch] = this._version.split('.').map(Number);
    this._version = `${major}.${minor}.${patch + 1}`;
  }

  // 导出方法
  public toJSON(): IThemeDefinition {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      type: this._type,
      author: this._author,
      version: this._version,
      isBuiltIn: this._isBuiltIn,
      colors: this._colors,
      fonts: this._fonts,
      spacing: this._spacing,
      borderRadius: this._borderRadius,
      shadows: this._shadows,
      animations: this._animations,
      customVariables: this._customVariables,
      preview: this._preview,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

/**
 * 主题配置核心抽象类
 */
export abstract class ThemeConfigCore extends AggregateRoot implements IThemeConfig {
  protected _activeThemeId: string;
  protected _followSystemTheme: boolean;
  protected _autoSwitchTheme: boolean;
  protected _lightThemeId?: string;
  protected _darkThemeId?: string;
  protected _switchTimes?: {
    dayStart: string;
    nightStart: string;
  };
  protected _customVariables?: Record<string, string>;
  protected _enableTransitions: boolean;
  protected _transitionDuration: number;

  constructor(data: IThemeConfig) {
    super(data.activeThemeId); // 使用当前主题ID作为聚合根ID

    this._activeThemeId = data.activeThemeId;
    this._followSystemTheme = data.followSystemTheme;
    this._autoSwitchTheme = data.autoSwitchTheme;
    this._lightThemeId = data.lightThemeId;
    this._darkThemeId = data.darkThemeId;
    this._switchTimes = data.switchTimes;
    this._customVariables = data.customVariables;
    this._enableTransitions = data.enableTransitions;
    this._transitionDuration = data.transitionDuration;
  }

  // Getter 方法
  get activeThemeId(): string {
    return this._activeThemeId;
  }
  get followSystemTheme(): boolean {
    return this._followSystemTheme;
  }
  get autoSwitchTheme(): boolean {
    return this._autoSwitchTheme;
  }
  get lightThemeId(): string | undefined {
    return this._lightThemeId;
  }
  get darkThemeId(): string | undefined {
    return this._darkThemeId;
  }
  get switchTimes(): { dayStart: string; nightStart: string } | undefined {
    return this._switchTimes ? { ...this._switchTimes } : undefined;
  }
  get customVariables(): Record<string, string> | undefined {
    return this._customVariables ? { ...this._customVariables } : undefined;
  }
  get enableTransitions(): boolean {
    return this._enableTransitions;
  }
  get transitionDuration(): number {
    return this._transitionDuration;
  }

  // 抽象方法
  abstract applyTheme(themeId: string): Promise<ThemeApplicationResult>;
  abstract switchToSystemTheme(): Promise<ThemeApplicationResult>;
  abstract autoSwitchBasedOnTime(): Promise<ThemeApplicationResult>;

  // 公共业务方法
  public updateActiveTheme(themeId: string): void {
    this._activeThemeId = themeId;
  }

  public enableSystemThemeFollow(): void {
    this._followSystemTheme = true;
  }

  public disableSystemThemeFollow(): void {
    this._followSystemTheme = false;
  }

  public enableAutoSwitch(lightThemeId: string, darkThemeId: string): void {
    this._autoSwitchTheme = true;
    this._lightThemeId = lightThemeId;
    this._darkThemeId = darkThemeId;
  }

  public disableAutoSwitch(): void {
    this._autoSwitchTheme = false;
  }

  public updateSwitchTimes(dayStart: string, nightStart: string): void {
    this._switchTimes = { dayStart, nightStart };
  }

  public updateCustomVariables(variables: Record<string, string>): void {
    this._customVariables = { ...this._customVariables, ...variables };
  }

  public setTransitions(enabled: boolean, duration: number = 300): void {
    this._enableTransitions = enabled;
    if (enabled) {
      this._transitionDuration = duration;
    }
  }

  public disableTransitions(): void {
    this._enableTransitions = false;
  }

  public shouldSwitchBasedOnTime(): { shouldSwitch: boolean; targetThemeId?: string } {
    if (!this._autoSwitchTheme || !this._switchTimes || !this._lightThemeId || !this._darkThemeId) {
      return { shouldSwitch: false };
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 判断是否应该切换到日间主题
    if (currentTime >= this._switchTimes.dayStart && currentTime < this._switchTimes.nightStart) {
      if (this._activeThemeId !== this._lightThemeId) {
        return { shouldSwitch: true, targetThemeId: this._lightThemeId };
      }
    }
    // 判断是否应该切换到夜间主题
    else {
      if (this._activeThemeId !== this._darkThemeId) {
        return { shouldSwitch: true, targetThemeId: this._darkThemeId };
      }
    }

    return { shouldSwitch: false };
  }

  // 导出方法
  public toJSON(): IThemeConfig {
    return {
      activeThemeId: this._activeThemeId,
      followSystemTheme: this._followSystemTheme,
      autoSwitchTheme: this._autoSwitchTheme,
      lightThemeId: this._lightThemeId,
      darkThemeId: this._darkThemeId,
      switchTimes: this._switchTimes,
      customVariables: this._customVariables,
      enableTransitions: this._enableTransitions,
      transitionDuration: this._transitionDuration,
    };
  }
}
