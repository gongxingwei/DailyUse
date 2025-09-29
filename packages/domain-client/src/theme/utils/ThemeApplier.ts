/**
 * Theme Applier
 * @description 主题应用器，负责将主题应用到DOM
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { type IThemeDefinition, ThemeType } from '@dailyuse/contracts';

/**
 * 主题应用器
 */
export class ThemeApplier {
  private readonly rootElement: HTMLElement;
  private readonly styleElement: HTMLStyleElement;
  private currentThemeId: string | null = null;

  constructor(rootElement?: HTMLElement) {
    // 默认使用document.documentElement作为根元素
    this.rootElement =
      rootElement ||
      (typeof document !== 'undefined' ? document.documentElement : ({} as HTMLElement));

    // 创建或获取样式元素
    this.styleElement = this.getOrCreateStyleElement();
  }

  /**
   * 应用主题
   */
  applyTheme(theme: IThemeDefinition): void {
    if (this.currentThemeId === theme.id) {
      return; // 避免重复应用相同主题
    }

    try {
      // 1. 应用CSS类名
      this.applyThemeClasses(theme);

      // 2. 应用CSS变量
      this.applyCSSVariables(theme);

      // 3. 应用生成的样式
      this.applyGeneratedStyles(theme);

      // 4. 触发主题变更事件
      this.dispatchThemeChangeEvent(theme);

      this.currentThemeId = theme.id;

      console.log(`主题 "${theme.name}" (${theme.id}) 应用成功`);
    } catch (error) {
      console.error('应用主题失败:', error);
      throw error;
    }
  }

  /**
   * 应用主题CSS类名
   */
  private applyThemeClasses(theme: IThemeDefinition): void {
    if (!this.rootElement.classList) return;

    // 移除旧的主题类名
    this.removeOldThemeClasses();

    // 添加新的主题类名
    this.rootElement.classList.add('theme-applied');
    this.rootElement.classList.add(`theme-${theme.type}`);
    this.rootElement.classList.add(`theme-id-${theme.id}`);

    // 添加深浅色模式类名
    if (theme.type === ThemeType.DARK) {
      this.rootElement.classList.add('dark-mode');
      this.rootElement.classList.remove('light-mode');
    } else if (theme.type === ThemeType.LIGHT) {
      this.rootElement.classList.add('light-mode');
      this.rootElement.classList.remove('dark-mode');
    } else if (theme.type === ThemeType.AUTO) {
      // 自动模式根据系统主题决定
      const prefersDark =
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (prefersDark) {
        this.rootElement.classList.add('dark-mode');
        this.rootElement.classList.remove('light-mode');
      } else {
        this.rootElement.classList.add('light-mode');
        this.rootElement.classList.remove('dark-mode');
      }
    }
  }

  /**
   * 移除旧的主题类名
   */
  private removeOldThemeClasses(): void {
    if (!this.rootElement.classList) return;

    const classesToRemove: string[] = [];

    // 遍历所有类名，找到主题相关的类名
    for (let i = 0; i < this.rootElement.classList.length; i++) {
      const className = this.rootElement.classList[i];

      if (
        className.startsWith('theme-') ||
        className === 'dark-mode' ||
        className === 'light-mode'
      ) {
        classesToRemove.push(className);
      }
    }

    // 移除找到的类名
    classesToRemove.forEach((className) => {
      this.rootElement.classList.remove(className);
    });
  }

  /**
   * 应用CSS变量
   */
  private applyCSSVariables(theme: IThemeDefinition): void {
    if (!this.rootElement.style) return;

    // 基础主题变量
    this.setCSSVariable('--theme-id', theme.id);
    this.setCSSVariable('--theme-name', theme.name);
    this.setCSSVariable('--theme-type', theme.type);

    // 颜色变量
    if (theme.colors?.semantic) {
      const semantic = theme.colors.semantic;
      this.setCSSVariable('--color-success', semantic.success?.value || '#10B981');
      this.setCSSVariable('--color-warning', semantic.warning?.value || '#F59E0B');
      this.setCSSVariable('--color-error', semantic.error?.value || '#EF4444');
      this.setCSSVariable('--color-info', semantic.info?.value || '#3B82F6');
    }

    // 字体变量
    if (theme.fonts) {
      if (theme.fonts.heading) {
        this.setCSSVariable('--font-heading-family', theme.fonts.heading.family);
        this.setCSSVariable('--font-heading-size', `${theme.fonts.heading.size}px`);
        this.setCSSVariable('--font-heading-weight', theme.fonts.heading.weight.toString());
        this.setCSSVariable(
          '--font-heading-line-height',
          theme.fonts.heading.lineHeight.toString(),
        );
      }

      if (theme.fonts.body) {
        this.setCSSVariable('--font-body-family', theme.fonts.body.family);
        this.setCSSVariable('--font-body-size', `${theme.fonts.body.size}px`);
        this.setCSSVariable('--font-body-weight', theme.fonts.body.weight.toString());
        this.setCSSVariable('--font-body-line-height', theme.fonts.body.lineHeight.toString());
      }

      if (theme.fonts.mono) {
        this.setCSSVariable('--font-mono-family', theme.fonts.mono.family);
        this.setCSSVariable('--font-mono-size', `${theme.fonts.mono.size}px`);
        this.setCSSVariable('--font-mono-weight', theme.fonts.mono.weight.toString());
      }
    }

    // 间距变量
    if (theme.spacing) {
      Object.entries(theme.spacing).forEach(([key, value]) => {
        this.setCSSVariable(`--spacing-${key}`, `${value}px`);
      });
    }

    // 圆角变量
    if (theme.borderRadius) {
      Object.entries(theme.borderRadius).forEach(([key, value]) => {
        this.setCSSVariable(`--border-radius-${key}`, `${value}px`);
      });
    }

    // 阴影变量
    if (theme.shadows) {
      Object.entries(theme.shadows).forEach(([key, value]) => {
        this.setCSSVariable(`--shadow-${key}`, value as string);
      });
    }

    // 动画变量
    if (theme.animations) {
      if (theme.animations.duration) {
        Object.entries(theme.animations.duration).forEach(([key, value]) => {
          this.setCSSVariable(`--animation-duration-${key}`, `${value}ms`);
        });
      }

      if (theme.animations.easing) {
        Object.entries(theme.animations.easing).forEach(([key, value]) => {
          this.setCSSVariable(`--animation-easing-${key}`, value as string);
        });
      }

      if (theme.animations.transition) {
        this.setCSSVariable('--animation-transition', theme.animations.transition);
      }
    }

    // 自定义变量
    if (theme.customVariables) {
      Object.entries(theme.customVariables).forEach(([key, value]) => {
        this.setCSSVariable(key, value);
      });
    }
  }

  /**
   * 设置CSS变量
   */
  private setCSSVariable(name: string, value: string): void {
    if (this.rootElement.style) {
      this.rootElement.style.setProperty(name, value);
    }
  }

  /**
   * 应用生成的样式
   */
  private applyGeneratedStyles(theme: IThemeDefinition): void {
    // 生成基础样式
    let styles = this.generateBaseStyles(theme);

    // 生成主题特定样式
    styles += this.generateThemeSpecificStyles(theme);

    // 应用到style元素
    this.styleElement.textContent = styles;
  }

  /**
   * 生成基础样式
   */
  private generateBaseStyles(theme: IThemeDefinition): string {
    const styles: string[] = [];

    // 基础重置样式
    styles.push(`
      /* 主题基础样式 - ${theme.name} */
      .theme-applied {
        color-scheme: ${theme.type === ThemeType.DARK ? 'dark' : 'light'};
      }
    `);

    // 过渡动画
    if (theme.animations?.transition) {
      styles.push(`
        .theme-applied * {
          transition: ${theme.animations.transition};
        }
      `);
    }

    return styles.join('\n');
  }

  /**
   * 生成主题特定样式
   */
  private generateThemeSpecificStyles(theme: IThemeDefinition): string {
    const styles: string[] = [];

    // 根据主题类型生成样式
    if (theme.type === ThemeType.DARK) {
      styles.push(`
        /* 深色主题样式 */
        .dark-mode {
          background-color: #1a1a1a;
          color: #ffffff;
        }
        
        .dark-mode .bg-primary {
          background-color: #2d2d2d;
        }
        
        .dark-mode .text-primary {
          color: #f5f5f5;
        }
        
        .dark-mode .border {
          border-color: #404040;
        }
      `);
    } else {
      styles.push(`
        /* 浅色主题样式 */
        .light-mode {
          background-color: #ffffff;
          color: #000000;
        }
        
        .light-mode .bg-primary {
          background-color: #f8f9fa;
        }
        
        .light-mode .text-primary {
          color: #212529;
        }
        
        .light-mode .border {
          border-color: #dee2e6;
        }
      `);
    }

    return styles.join('\n');
  }

  /**
   * 获取或创建样式元素
   */
  private getOrCreateStyleElement(): HTMLStyleElement {
    if (typeof document === 'undefined') {
      return {} as HTMLStyleElement;
    }

    const existingStyle = document.getElementById('theme-styles') as HTMLStyleElement;

    if (existingStyle) {
      return existingStyle;
    }

    const style = document.createElement('style');
    style.id = 'theme-styles';
    style.type = 'text/css';
    document.head.appendChild(style);

    return style;
  }

  /**
   * 触发主题变更事件
   */
  private dispatchThemeChangeEvent(theme: IThemeDefinition): void {
    if (typeof window === 'undefined' || !window.CustomEvent) return;

    const event = new CustomEvent('themeChange', {
      detail: {
        theme,
        themeId: theme.id,
        themeType: theme.type,
        timestamp: new Date(),
      },
    });

    window.dispatchEvent(event);
  }

  /**
   * 获取当前应用的主题ID
   */
  getCurrentThemeId(): string | null {
    return this.currentThemeId;
  }

  /**
   * 重置主题（移除所有主题相关样式和变量）
   */
  resetTheme(): void {
    // 移除CSS类名
    this.removeOldThemeClasses();

    // 清空样式
    this.styleElement.textContent = '';

    // 移除CSS变量（这里只移除已知的变量）
    const variablesToRemove = [
      '--theme-id',
      '--theme-name',
      '--theme-type',
      '--color-success',
      '--color-warning',
      '--color-error',
      '--color-info',
      '--font-heading-family',
      '--font-heading-size',
      '--font-heading-weight',
      '--font-body-family',
      '--font-body-size',
      '--font-body-weight',
      '--font-mono-family',
      '--font-mono-size',
      '--font-mono-weight',
    ];

    variablesToRemove.forEach((variable) => {
      if (this.rootElement.style) {
        this.rootElement.style.removeProperty(variable);
      }
    });

    this.currentThemeId = null;
  }
}
