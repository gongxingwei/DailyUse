/**
 * Theme Definition Server Implementation
 * @description 主题定义服务端实现 - 继承自Core层
 * @author DailyUse Team
 * @date 2025-10-06
 */

import { ThemeDefinitionCore } from '@dailyuse/domain-core';
import { ThemeContracts } from '@dailyuse/contracts';

// 类型导入
type IThemeDefinition = ThemeContracts.IThemeDefinition;
type ThemeType = ThemeContracts.ThemeType;
type ThemeValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * 主题定义服务端实现
 *
 * 职责：
 * - 实现服务端特定的验证逻辑
 * - 实现服务端CSS生成逻辑
 * - 提供服务端的工厂方法
 */
export class ThemeDefinition extends ThemeDefinitionCore {
  /**
   * 实现服务端验证逻辑
   */
  public validate(): ThemeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ========== 基础验证 ==========
    if (!this._name || this._name.trim().length === 0) {
      errors.push('主题名称不能为空');
    }

    if (this._name && this._name.length > 50) {
      errors.push('主题名称长度不能超过50个字符');
    }

    // ========== 版本验证 ==========
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(this._version)) {
      errors.push('主题版本格式不正确，应为 x.y.z 格式');
    }

    // ========== 颜色验证 ==========
    if (!this._colors) {
      errors.push('主题颜色配置不能为空');
    } else {
      // 验证语义色
      if (!this._colors.semantic) {
        errors.push('语义色配置不能为空');
      } else {
        if (!this._colors.semantic.success) errors.push('缺少必需的语义色: success');
        if (!this._colors.semantic.warning) errors.push('缺少必需的语义色: warning');
        if (!this._colors.semantic.error) errors.push('缺少必需的语义色: error');
        if (!this._colors.semantic.info) errors.push('缺少必需的语义色: info');
      }

      // 验证颜色数组
      if (this._colors.primary && this._colors.primary.length === 0) {
        warnings.push('主色调数组为空');
      }
    }

    // ========== 字体验证 ==========
    if (!this._fonts) {
      errors.push('主题字体配置不能为空');
    } else {
      if (!this._fonts.heading || !this._fonts.body || !this._fonts.mono) {
        errors.push('字体配置必须包含 heading, body, mono');
      }

      // 验证字体大小
      if (this._fonts.heading && this._fonts.heading.size < 12) {
        warnings.push('标题字体大小可能过小');
      }
      if (this._fonts.body && this._fonts.body.size < 10) {
        warnings.push('正文字体大小可能过小');
      }
    }

    // ========== 间距验证 ==========
    if (!this._spacing) {
      errors.push('主题间距配置不能为空');
    } else {
      const requiredSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
      for (const size of requiredSizes) {
        if (!(size in this._spacing)) {
          warnings.push(`缺少推荐的间距配置: ${size}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 实现服务端CSS生成逻辑
   */
  public generateCSS(): string {
    const cssRules: string[] = [];

    // 生成CSS根变量
    cssRules.push(':root {');
    cssRules.push('  /* ========== 主题元信息 ========== */');
    cssRules.push(`  --theme-id: "${this._id}";`);
    cssRules.push(`  --theme-name: "${this._name}";`);
    cssRules.push(`  --theme-type: "${this._type}";`);

    // ========== 颜色变量 ==========
    if (this._colors) {
      cssRules.push('');
      cssRules.push('  /* ========== 颜色变量 ========== */');

      // 语义色
      if (this._colors.semantic) {
        cssRules.push('  /* 语义色 */');
        cssRules.push(`  --color-success: ${this._colors.semantic.success.value};`);
        cssRules.push(`  --color-warning: ${this._colors.semantic.warning.value};`);
        cssRules.push(`  --color-error: ${this._colors.semantic.error.value};`);
        cssRules.push(`  --color-info: ${this._colors.semantic.info.value};`);
      }

      // 主色调
      if (this._colors.primary && this._colors.primary.length > 0) {
        cssRules.push('  /* 主色调 */');
        this._colors.primary.forEach((color, index) => {
          cssRules.push(`  --color-primary-${index + 1}: ${color.value};`);
        });
      }

      // 次要色
      if (this._colors.secondary && this._colors.secondary.length > 0) {
        cssRules.push('  /* 次要色 */');
        this._colors.secondary.forEach((color, index) => {
          cssRules.push(`  --color-secondary-${index + 1}: ${color.value};`);
        });
      }

      // 中性色
      if (this._colors.neutral && this._colors.neutral.length > 0) {
        cssRules.push('  /* 中性色 */');
        this._colors.neutral.forEach((color, index) => {
          cssRules.push(`  --color-neutral-${index + 1}: ${color.value};`);
        });
      }
    }

    // ========== 字体变量 ==========
    if (this._fonts) {
      cssRules.push('');
      cssRules.push('  /* ========== 字体变量 ========== */');

      if (this._fonts.heading) {
        cssRules.push('  /* 标题字体 */');
        cssRules.push(`  --font-heading-family: ${this._fonts.heading.family};`);
        cssRules.push(`  --font-heading-size: ${this._fonts.heading.size}px;`);
        cssRules.push(`  --font-heading-weight: ${this._fonts.heading.weight};`);
        cssRules.push(`  --font-heading-line-height: ${this._fonts.heading.lineHeight};`);
        cssRules.push(`  --font-heading-letter-spacing: ${this._fonts.heading.letterSpacing}em;`);
      }

      if (this._fonts.body) {
        cssRules.push('  /* 正文字体 */');
        cssRules.push(`  --font-body-family: ${this._fonts.body.family};`);
        cssRules.push(`  --font-body-size: ${this._fonts.body.size}px;`);
        cssRules.push(`  --font-body-weight: ${this._fonts.body.weight};`);
        cssRules.push(`  --font-body-line-height: ${this._fonts.body.lineHeight};`);
        cssRules.push(`  --font-body-letter-spacing: ${this._fonts.body.letterSpacing}em;`);
      }

      if (this._fonts.mono) {
        cssRules.push('  /* 等宽字体 */');
        cssRules.push(`  --font-mono-family: ${this._fonts.mono.family};`);
        cssRules.push(`  --font-mono-size: ${this._fonts.mono.size}px;`);
        cssRules.push(`  --font-mono-weight: ${this._fonts.mono.weight};`);
        cssRules.push(`  --font-mono-line-height: ${this._fonts.mono.lineHeight};`);
        cssRules.push(`  --font-mono-letter-spacing: ${this._fonts.mono.letterSpacing}em;`);
      }
    }

    // ========== 间距变量 ==========
    if (this._spacing) {
      cssRules.push('');
      cssRules.push('  /* ========== 间距变量 ========== */');
      Object.entries(this._spacing).forEach(([key, value]) => {
        cssRules.push(`  --spacing-${key}: ${value}px;`);
      });
    }

    // ========== 圆角变量 ==========
    if (this._borderRadius) {
      cssRules.push('');
      cssRules.push('  /* ========== 圆角变量 ========== */');
      Object.entries(this._borderRadius).forEach(([key, value]) => {
        cssRules.push(`  --border-radius-${key}: ${value}px;`);
      });
    }

    // ========== 阴影变量 ==========
    if (this._shadows) {
      cssRules.push('');
      cssRules.push('  /* ========== 阴影变量 ========== */');
      Object.entries(this._shadows).forEach(([key, value]) => {
        cssRules.push(`  --shadow-${key}: ${value};`);
      });
    }

    // ========== 动画变量 ==========
    if (this._animations) {
      cssRules.push('');
      cssRules.push('  /* ========== 动画变量 ========== */');

      if (this._animations.duration) {
        cssRules.push('  /* 动画时长 */');
        Object.entries(this._animations.duration).forEach(([key, value]) => {
          cssRules.push(`  --animation-duration-${key}: ${value}ms;`);
        });
      }

      if (this._animations.easing) {
        cssRules.push('  /* 动画缓动 */');
        Object.entries(this._animations.easing).forEach(([key, value]) => {
          cssRules.push(`  --animation-easing-${key}: ${value};`);
        });
      }

      if (this._animations.transition) {
        cssRules.push(`  --animation-transition: ${this._animations.transition};`);
      }
    }

    // ========== 自定义变量 ==========
    if (this._customVariables && Object.keys(this._customVariables).length > 0) {
      cssRules.push('');
      cssRules.push('  /* ========== 自定义变量 ========== */');
      Object.entries(this._customVariables).forEach(([key, value]) => {
        cssRules.push(`  --custom-${key}: ${value};`);
      });
    }

    cssRules.push('}');
    return cssRules.join('\n');
  }

  /**
   * 实现CSS变量对象生成
   */
  public generateCSSVariables(): Record<string, string> {
    const variables: Record<string, string> = {};

    // 主题元信息
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
    if (this._fonts) {
      if (this._fonts.heading) {
        variables['--font-heading-size'] = `${this._fonts.heading.size}px`;
        variables['--font-heading-weight'] = String(this._fonts.heading.weight);
      }
      if (this._fonts.body) {
        variables['--font-body-size'] = `${this._fonts.body.size}px`;
        variables['--font-body-weight'] = String(this._fonts.body.weight);
      }
    }

    // 间距变量
    if (this._spacing) {
      Object.entries(this._spacing).forEach(([key, value]) => {
        variables[`--spacing-${key}`] = `${value}px`;
      });
    }

    // 自定义变量
    if (this._customVariables) {
      Object.entries(this._customVariables).forEach(([key, value]) => {
        variables[`--custom-${key}`] = value;
      });
    }

    return variables;
  }

  // ========== 工厂方法 ==========

  /**
   * 创建新主题（服务端）
   */
  public static create(params: {
    name: string;
    description?: string;
    type: ThemeType;
    author?: string;
  }): ThemeDefinition {
    const now = new Date();
    const themeId = `theme-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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
}
