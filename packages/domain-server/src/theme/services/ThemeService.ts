/**
 * Theme Service
 * @description 主题模块服务层
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { ThemeDefinition, ThemeConfig } from '../aggregates/ThemeServer';
import { ThemeType, type IThemeDefinition, type IThemeConfig } from '@dailyuse/contracts';

// 定义服务层的类型
export interface CreateThemeRequest {
  name: string;
  description?: string;
  type: ThemeType;
  author?: string;
}

export interface ThemeResponse {
  success: boolean;
  theme?: {
    id: string;
    name: string;
    description?: string;
    type: ThemeType;
    author?: string;
    version: string;
    isBuiltIn: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  message?: string;
  error?: string;
}

export interface ApplyThemeRequest {
  themeId: string;
  configId?: string;
}

export interface ThemeApplicationResult {
  success: boolean;
  appliedThemeId: string;
  appliedAt: Date;
  appliedVariables?: Record<string, string>;
  css?: string;
  message?: string;
  error?: string;
}

export interface ThemeConfigResponse {
  success: boolean;
  config?: {
    activeThemeId: string;
    followSystemTheme: boolean;
    autoSwitchTheme: boolean;
    lightThemeId?: string;
    darkThemeId?: string;
    switchTimes?: {
      dayStart: string;
      nightStart: string;
    };
    enableTransitions: boolean;
    transitionDuration: number;
  };
  message?: string;
  error?: string;
}

export interface UpdateThemeConfigRequest {
  configId?: string;
  activeThemeId?: string;
  followSystemTheme?: boolean;
  autoSwitchTheme?: boolean;
  lightThemeId?: string;
  darkThemeId?: string;
  switchTimes?: {
    dayStart: string;
    nightStart: string;
  };
  enableTransitions?: boolean;
  transitionDuration?: number;
}

/**
 * 主题服务类
 */
export class ThemeService {
  private themes: Map<string, ThemeDefinition> = new Map();
  private configs: Map<string, ThemeConfig> = new Map();

  constructor() {
    this.initializeDefaultThemes();
  }

  /**
   * 初始化默认主题
   */
  private initializeDefaultThemes(): void {
    // 创建浅色主题
    const lightTheme = ThemeDefinition.create({
      name: '浅色主题',
      description: '系统默认浅色主题',
      type: ThemeType.LIGHT,
      author: 'DailyUse Team',
    });

    // 创建深色主题
    const darkTheme = ThemeDefinition.create({
      name: '深色主题',
      description: '系统默认深色主题',
      type: ThemeType.DARK,
      author: 'DailyUse Team',
    });

    this.themes.set('light', lightTheme);
    this.themes.set('dark', darkTheme);

    // 创建默认配置
    const defaultConfig = ThemeConfig.createDefault();
    this.configs.set('default', defaultConfig);
  }

  /**
   * 创建主题
   */
  public async createTheme(request: CreateThemeRequest): Promise<ThemeResponse> {
    try {
      const theme = ThemeDefinition.create({
        name: request.name,
        description: request.description,
        type: request.type,
        author: request.author,
      });

      this.themes.set(theme.id, theme);

      return {
        success: true,
        theme: {
          id: theme.id,
          name: theme.name,
          description: theme.description,
          type: theme.type,
          author: theme.author,
          version: theme.version,
          isBuiltIn: theme.isBuiltIn,
          createdAt: theme.createdAt,
          updatedAt: theme.updatedAt,
        },
        message: '主题创建成功',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '主题创建失败',
      };
    }
  }

  /**
   * 获取主题
   */
  public async getTheme(themeId: string): Promise<ThemeResponse> {
    const theme = this.themes.get(themeId);

    if (!theme) {
      return {
        success: false,
        error: '主题不存在',
      };
    }

    return {
      success: true,
      theme: {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        type: theme.type,
        author: theme.author,
        version: theme.version,
        isBuiltIn: theme.isBuiltIn,
        createdAt: theme.createdAt,
        updatedAt: theme.updatedAt,
      },
    };
  }

  /**
   * 获取所有主题
   */
  public async getAllThemes(): Promise<{
    themes: Array<{ id: string; name: string; type: ThemeType }>;
  }> {
    const themes = Array.from(this.themes.values()).map((theme) => ({
      id: theme.id,
      name: theme.name,
      type: theme.type,
    }));

    return { themes };
  }

  /**
   * 应用主题
   */
  public async applyTheme(request: ApplyThemeRequest): Promise<ThemeApplicationResult> {
    const theme = this.themes.get(request.themeId);

    if (!theme) {
      return {
        success: false,
        appliedThemeId: request.themeId,
        appliedAt: new Date(),
        error: '主题不存在',
      };
    }

    const config = this.configs.get(request.configId || 'default');

    if (!config) {
      return {
        success: false,
        appliedThemeId: request.themeId,
        appliedAt: new Date(),
        error: '配置不存在',
      };
    }

    try {
      const result = await config.applyTheme(request.themeId);

      return {
        success: result.success,
        appliedThemeId: request.themeId,
        appliedAt: new Date(),
        appliedVariables: theme.generateCSSVariables(),
        css: theme.generateCSS(),
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        appliedThemeId: request.themeId,
        appliedAt: new Date(),
        error: error instanceof Error ? error.message : '主题应用失败',
      };
    }
  }

  /**
   * 获取主题配置
   */
  public async getThemeConfig(configId: string = 'default'): Promise<ThemeConfigResponse> {
    const config = this.configs.get(configId);

    if (!config) {
      return {
        success: false,
        error: '配置不存在',
      };
    }

    return {
      success: true,
      config: {
        activeThemeId: config.activeThemeId,
        followSystemTheme: config.followSystemTheme,
        autoSwitchTheme: config.autoSwitchTheme,
        lightThemeId: config.lightThemeId,
        darkThemeId: config.darkThemeId,
        switchTimes: config.switchTimes,
        enableTransitions: config.enableTransitions,
        transitionDuration: config.transitionDuration,
      },
    };
  }

  /**
   * 更新主题配置
   */
  public async updateThemeConfig(request: UpdateThemeConfigRequest): Promise<ThemeConfigResponse> {
    const configId = request.configId || 'default';
    let config = this.configs.get(configId);

    if (!config) {
      config = ThemeConfig.createDefault();
      this.configs.set(configId, config);
    }

    try {
      // 更新配置
      if (request.activeThemeId) {
        config.updateActiveTheme(request.activeThemeId);
      }

      // 这里应该有更多的更新逻辑，暂时简化

      return {
        success: true,
        config: {
          activeThemeId: config.activeThemeId,
          followSystemTheme: config.followSystemTheme,
          autoSwitchTheme: config.autoSwitchTheme,
          lightThemeId: config.lightThemeId,
          darkThemeId: config.darkThemeId,
          switchTimes: config.switchTimes,
          enableTransitions: config.enableTransitions,
          transitionDuration: config.transitionDuration,
        },
        message: '配置更新成功',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '配置更新失败',
      };
    }
  }

  /**
   * 切换到系统主题
   */
  public async switchToSystemTheme(configId: string = 'default'): Promise<ThemeApplicationResult> {
    const config = this.configs.get(configId);

    if (!config) {
      return {
        success: false,
        appliedThemeId: '',
        appliedAt: new Date(),
        error: '配置不存在',
      };
    }

    return config.switchToSystemTheme();
  }

  /**
   * 基于时间自动切换主题
   */
  public async autoSwitchBasedOnTime(
    configId: string = 'default',
  ): Promise<ThemeApplicationResult> {
    const config = this.configs.get(configId);

    if (!config) {
      return {
        success: false,
        appliedThemeId: '',
        appliedAt: new Date(),
        error: '配置不存在',
      };
    }

    return config.autoSwitchBasedOnTime();
  }

  /**
   * 删除主题
   */
  public async deleteTheme(
    themeId: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const theme = this.themes.get(themeId);

    if (!theme) {
      return {
        success: false,
        error: '主题不存在',
      };
    }

    if (theme.isBuiltIn) {
      return {
        success: false,
        error: '内置主题不能删除',
      };
    }

    this.themes.delete(themeId);

    return {
      success: true,
      message: '主题删除成功',
    };
  }
}
