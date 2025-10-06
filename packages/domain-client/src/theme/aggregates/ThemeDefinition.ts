/**
 * Theme Definition Client Implementation
 * @description 主题定义客户端实现 - 继承自Core层，提供UI相关功能
 * @author DailyUse Team
 * @date 2025-10-06
 */

import { ThemeDefinitionCore } from '@dailyuse/domain-core';
import { ThemeContracts } from '@dailyuse/contracts';

// 类型导入
type IThemeDefinition = ThemeContracts.IThemeDefinition;
type IThemeDefinitionClient = ThemeContracts.IThemeDefinitionClient;
type ThemeResponseDto = ThemeContracts.ThemeResponseDto;
type ThemeDetailResponseDto = ThemeContracts.ThemeDetailResponseDto;
type ThemeClientDTO = ThemeContracts.ThemeClientDTO;
type ThemeDetailClientDTO = ThemeContracts.ThemeDetailClientDTO;
type ThemeType = ThemeContracts.ThemeType;
type ThemeValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * 主题定义客户端实现
 *
 * 职责：
 * - 实现客户端特定的验证逻辑（简化版）
 * - 实现客户端CSS生成和应用逻辑
 * - 提供UI相关的计算属性（typeText, statusText等）
 * - 提供fromDTO/toClientDTO转换方法
 */
export class ThemeDefinition extends ThemeDefinitionCore implements IThemeDefinitionClient {
  // ========== 客户端特定属性 ==========
  private _isActive?: boolean;
  private _previewUrl?: string;

  constructor(data: IThemeDefinition) {
    super(data);
  }

  // ========== UI计算属性 ==========

  /**
   * 主题类型文本（中文）
   */
  get typeText(): string {
    const typeMap: Record<ThemeType, string> = {
      [ThemeContracts.ThemeType.SYSTEM]: '系统主题',
      [ThemeContracts.ThemeType.CUSTOM]: '自定义主题',
    };
    return typeMap[this._type] || '未知类型';
  }

  /**
   * 主题状态文本
   */
  get statusText(): string {
    if (this._isActive) return '已激活';
    if (this._isBuiltIn) return '内置主题';
    return '未激活';
  }

  /**
   * CSS变量数量
   */
  get cssVariablesCount(): number {
    const variables = this.generateCSSVariables();
    return Object.keys(variables).length;
  }

  /**
   * 是否为当前激活主题
   */
  get isActive(): boolean {
    return this._isActive ?? false;
  }

  /**
   * 主题预览URL
   */
  get previewUrl(): string | undefined {
    return this._previewUrl || this._preview;
  }

  // ========== 设置激活状态 ==========

  /**
   * 设置激活状态（由外部调用）
   */
  public setActive(isActive: boolean): void {
    this._isActive = isActive;
  }

  /**
   * 设置预览URL
   */
  public setPreviewUrl(url: string): void {
    this._previewUrl = url;
  }

  // ========== 实现抽象方法 ==========

  /**
   * 客户端验证逻辑（简化版）
   */
  public validate(): ThemeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基础验证
    if (!this._name || this._name.trim().length === 0) {
      errors.push('主题名称不能为空');
    }

    // 颜色基本验证
    if (!this._colors?.semantic) {
      errors.push('缺少语义色配置');
    }

    // 字体基本验证
    if (!this._fonts?.heading || !this._fonts?.body) {
      errors.push('缺少字体配置');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 生成CSS（客户端版本，可能包含浏览器特定优化）
   */
  public generateCSS(): string {
    const cssRules: string[] = [];

    // 使用CSS自定义属性
    cssRules.push(':root {');

    // 基本变量
    cssRules.push(`  --theme-id: "${this._id}";`);
    cssRules.push(`  --theme-name: "${this._name}";`);
    cssRules.push(`  --theme-type: "${this._type}";`);

    // 颜色变量
    if (this._colors?.semantic) {
      cssRules.push(`  --color-success: ${this._colors.semantic.success.value};`);
      cssRules.push(`  --color-warning: ${this._colors.semantic.warning.value};`);
      cssRules.push(`  --color-error: ${this._colors.semantic.error.value};`);
      cssRules.push(`  --color-info: ${this._colors.semantic.info.value};`);
    }

    // 字体变量
    if (this._fonts) {
      if (this._fonts.heading) {
        cssRules.push(`  --font-heading-size: ${this._fonts.heading.size}px;`);
        cssRules.push(`  --font-heading-weight: ${this._fonts.heading.weight};`);
      }
      if (this._fonts.body) {
        cssRules.push(`  --font-body-size: ${this._fonts.body.size}px;`);
        cssRules.push(`  --font-body-weight: ${this._fonts.body.weight};`);
      }
    }

    // 间距变量
    if (this._spacing) {
      Object.entries(this._spacing).forEach(([key, value]) => {
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

    // 基本变量
    variables['--theme-id'] = this._id;
    variables['--theme-name'] = this._name;
    variables['--theme-type'] = this._type;

    // 颜色变量
    if (this._colors?.semantic) {
      variables['--color-success'] = this._colors.semantic.success.value;
      variables['--color-warning'] = this._colors.semantic.warning.value;
      variables['--color-error'] = this._colors.semantic.error.value;
      variables['--color-info'] = this._colors.semantic.info.value;
    }

    // 字体变量
    if (this._fonts?.heading) {
      variables['--font-heading-size'] = `${this._fonts.heading.size}px`;
      variables['--font-heading-weight'] = String(this._fonts.heading.weight);
    }
    if (this._fonts?.body) {
      variables['--font-body-size'] = `${this._fonts.body.size}px`;
      variables['--font-body-weight'] = String(this._fonts.body.weight);
    }

    // 间距变量
    if (this._spacing) {
      Object.entries(this._spacing).forEach(([key, value]) => {
        variables[`--spacing-${key}`] = `${value}px`;
      });
    }

    return variables;
  }

  // ========== 客户端特定方法 ==========

  /**
   * 应用主题到文档
   */
  public applyToDocument(): void {
    const variables = this.generateCSSVariables();

    // 应用CSS变量到document.documentElement
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // 添加主题类名
    document.documentElement.setAttribute('data-theme-id', this._id);
    document.documentElement.setAttribute('data-theme-type', this._type);
  }

  /**
   * 从文档移除主题
   */
  public removeFromDocument(): void {
    const variables = this.generateCSSVariables();

    // 移除CSS变量
    Object.keys(variables).forEach((key) => {
      document.documentElement.style.removeProperty(key);
    });

    // 移除主题属性
    document.documentElement.removeAttribute('data-theme-id');
    document.documentElement.removeAttribute('data-theme-type');
  }

  /**
   * 预览主题（临时应用，不改变激活状态）
   */
  public previewTheme(): void {
    this.applyToDocument();
  }

  // ========== 工厂方法 ==========

  /**
   * 从服务端ResponseDTO创建实例（需要完整定义）
   */
  public static fromDTO(dto: ThemeDetailResponseDto): ThemeDefinition {
    const instance = new ThemeDefinition(dto.definition);

    // 设置激活状态
    instance.setActive(dto.isActive);

    // 设置预览URL
    if (dto.previewUrl) {
      instance.setPreviewUrl(dto.previewUrl);
    }

    return instance;
  }

  /**
   * 从客户端DTO创建实例（包含UI属性）
   */
  public static fromClientDTO(dto: ThemeDetailClientDTO): ThemeDefinition {
    const instance = new ThemeDefinition(dto.definition);

    // 设置激活状态
    instance.setActive(dto.isActive);

    // 设置预览URL
    if (dto.previewUrl) {
      instance.setPreviewUrl(dto.previewUrl);
    }

    return instance;
  }

  /**
   * 创建用于新建的空实例
   */
  public static forCreate(): ThemeDefinition {
    const now = new Date();

    const themeData: IThemeDefinition = {
      id: '',
      name: '新主题',
      description: '',
      type: ThemeContracts.ThemeType.CUSTOM,
      version: '1.0.0',
      isBuiltIn: false,
      colors: {
        name: '默认颜色',
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

  // ========== 转换方法 ==========

  /**
   * 转换为服务端ResponseDTO（仅基础信息）
   */
  public toResponseDTO(): ThemeResponseDto {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      type: this._type,
      author: this._author,
      version: this._version,
      isBuiltIn: this._isBuiltIn,
      isActive: this._isActive ?? false,
      previewUrl: this._previewUrl || this._preview,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为客户端DTO（包含UI计算属性）
   */
  public toClientDTO(): ThemeClientDTO {
    return {
      ...this.toResponseDTO(),
      typeText: this.typeText,
      statusText: this.statusText,
      usageStats: {
        lastUsed: this._updatedAt,
        usageCount: 0, // 需要从外部传入或计算
        totalDuration: 0,
      },
    };
  }

  /**
   * 转换为详细客户端DTO
   */
  public toDetailClientDTO(): ThemeDetailClientDTO {
    return {
      ...this.toClientDTO(),
      definition: this.toDTO(),
      cssVariablesCount: this.cssVariablesCount,
      generatedCSS: this.generateCSS(),
    };
  }
}
