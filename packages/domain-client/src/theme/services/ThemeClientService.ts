/**
 * Theme Client Service
 * @description 主题模块的客户端服务层，负责与服务端通信
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { type IThemeDefinition, type IThemeConfig, ThemeType } from '@dailyuse/contracts';

/**
 * 客户端请求类型
 */
export interface CreateThemeRequest {
  name: string;
  description?: string;
  type: ThemeType;
  author?: string;
}

export interface ApplyThemeRequest {
  themeId: string;
  configId?: string;
}

export interface ThemeResponse {
  success: boolean;
  theme: IThemeDefinition;
  message?: string;
  error?: string;
}

export interface ThemeConfigResponse {
  success: boolean;
  config: IThemeConfig;
  message?: string;
  error?: string;
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

/**
 * 主题客户端服务
 */
export class ThemeClientService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/theme') {
    this.baseUrl = baseUrl;
  }

  /**
   * 获取所有主题
   */
  async getAllThemes(): Promise<{ themes: IThemeDefinition[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/themes`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取主题列表失败:', error);

      // 返回默认主题作为fallback
      return {
        themes: this.getDefaultThemes(),
      };
    }
  }

  /**
   * 获取单个主题
   */
  async getTheme(themeId: string): Promise<ThemeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/themes/${themeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`获取主题失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建主题
   */
  async createTheme(request: CreateThemeRequest): Promise<ThemeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/themes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`创建主题失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 应用主题
   */
  async applyTheme(request: ApplyThemeRequest): Promise<ThemeApplicationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`应用主题失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除主题
   */
  async deleteTheme(themeId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/themes/${themeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`删除主题失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取主题配置
   */
  async getThemeConfig(configId?: string): Promise<ThemeConfigResponse> {
    try {
      const url = configId ? `${this.baseUrl}/config/${configId}` : `${this.baseUrl}/config`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取主题配置失败:', error);

      // 返回默认配置作为fallback
      return {
        success: true,
        config: this.getDefaultConfig(),
      };
    }
  }

  /**
   * 更新主题配置
   */
  async updateThemeConfig(configData: Partial<IThemeConfig>): Promise<ThemeConfigResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`更新配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 切换到系统主题
   */
  async switchToSystemTheme(configId?: string): Promise<ThemeApplicationResult> {
    try {
      const url = configId
        ? `${this.baseUrl}/system-theme/${configId}`
        : `${this.baseUrl}/system-theme`;

      const response = await fetch(url, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`切换到系统主题失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取默认主题列表（离线fallback）
   */
  private getDefaultThemes(): IThemeDefinition[] {
    const now = new Date();

    return [
      {
        id: 'light',
        name: '浅色主题',
        description: '系统默认浅色主题',
        type: ThemeType.LIGHT,
        version: '1.0.0',
        isBuiltIn: true,
        colors: {
          name: '浅色配色',
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
      },
      {
        id: 'dark',
        name: '深色主题',
        description: '系统默认深色主题',
        type: ThemeType.DARK,
        version: '1.0.0',
        isBuiltIn: true,
        colors: {
          name: '深色配色',
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
      },
    ];
  }

  /**
   * 获取默认配置（离线fallback）
   */
  private getDefaultConfig(): IThemeConfig {
    return {
      activeThemeId: 'light',
      followSystemTheme: false,
      autoSwitchTheme: false,
      enableTransitions: true,
      transitionDuration: 300,
    };
  }
}
