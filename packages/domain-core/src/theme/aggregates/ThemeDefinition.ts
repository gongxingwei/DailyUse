/**
 * Theme Definition Core Aggregate Root
 * @description 主题定义核心聚合根抽象类
 * @author DailyUse Team
 * @date 2025-10-06
 */

import { AggregateRoot } from '@dailyuse/utils';
import { ThemeContracts } from '@dailyuse/contracts';

// 类型导入
type IThemeDefinition = ThemeContracts.IThemeDefinition;
type ThemeType = ThemeContracts.ThemeType;
type ColorPalette = ThemeContracts.ColorPalette;
type FontConfig = ThemeContracts.FontConfig;
type SpacingConfig = ThemeContracts.SpacingConfig;
type BorderRadiusConfig = ThemeContracts.BorderRadiusConfig;
type ShadowConfig = ThemeContracts.ShadowConfig;
type AnimationConfig = ThemeContracts.AnimationConfig;

interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 主题定义核心抽象类 - 唯一的聚合根
 *
 * 职责：
 * - 定义主题的核心属性和业务规则
 * - 提供主题验证、更新等基础业务方法
 * - 子类实现特定环境的方法（服务端/客户端）
 */
export abstract class ThemeDefinitionCore extends AggregateRoot implements IThemeDefinition {
  // ========== 基础属性 ==========
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

  // ========== 主题配置属性 ==========
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

  // ========== Getter 方法 ==========
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

  // ========== 抽象方法 - 由子类实现 ==========

  /**
   * 验证主题配置
   */
  abstract validate(): ThemeValidationResult;

  /**
   * 生成CSS样式字符串
   */
  abstract generateCSS(): string;

  /**
   * 生成CSS变量对象
   */
  abstract generateCSSVariables(): Record<string, string>;

  // ========== 公共业务方法 ==========

  /**
   * 更新基本信息
   */
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

  /**
   * 更新颜色配置
   */
  public updateColors(colors: Partial<ColorPalette>): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改颜色配置');
    }

    this._colors = { ...this._colors, ...colors };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  /**
   * 更新字体配置
   */
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

  /**
   * 更新间距配置
   */
  public updateSpacing(spacing: Partial<SpacingConfig>): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改间距配置');
    }

    this._spacing = { ...this._spacing, ...spacing };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  /**
   * 更新圆角配置
   */
  public updateBorderRadius(borderRadius: Partial<BorderRadiusConfig>): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改圆角配置');
    }

    this._borderRadius = { ...this._borderRadius, ...borderRadius };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  /**
   * 更新阴影配置
   */
  public updateShadows(shadows: Partial<ShadowConfig>): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改阴影配置');
    }

    this._shadows = { ...this._shadows, ...shadows };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  /**
   * 更新动画配置
   */
  public updateAnimations(animations: Partial<AnimationConfig>): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改动画配置');
    }

    this._animations = { ...this._animations, ...animations };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  /**
   * 更新自定义变量
   */
  public updateCustomVariables(variables: Record<string, string>): void {
    if (this._isBuiltIn) {
      throw new Error('内置主题不允许修改自定义变量');
    }

    this._customVariables = { ...this._customVariables, ...variables };
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  /**
   * 克隆主题
   */
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

  /**
   * 检查版本兼容性
   */
  public isCompatibleWith(appVersion: string): boolean {
    const [majorVersion] = this._version.split('.');
    const [appMajorVersion] = appVersion.split('.');

    return majorVersion === appMajorVersion;
  }

  /**
   * 递增版本号
   */
  protected incrementVersion(): void {
    const [major, minor, patch] = this._version.split('.').map(Number);
    this._version = `${major}.${minor}.${patch + 1}`;
  }

  /**
   * 转换为DTO（基础数据）
   */
  public toDTO(): IThemeDefinition {
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

  /**
   * 转换为JSON（用于序列化）
   */
  public toJSON(): IThemeDefinition {
    return this.toDTO();
  }
}
