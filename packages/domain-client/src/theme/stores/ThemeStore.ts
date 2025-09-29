/**
 * Theme Store
 * @description 主题模块的客户端状态管理
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { type IThemeDefinition, type IThemeConfig, ThemeType } from '@dailyuse/contracts';
import { ThemeClientService } from '../services/ThemeClientService';
import { ThemeApplier } from '../utils/ThemeApplier';

/**
 * 主题状态接口
 */
export interface ThemeState {
  // 主题列表
  themes: IThemeDefinition[];

  // 当前主题配置
  config: IThemeConfig | null;

  // 当前活跃主题
  activeTheme: IThemeDefinition | null;

  // 加载状态
  loading: {
    themes: boolean;
    applying: boolean;
    config: boolean;
  };

  // 错误状态
  error: string | null;

  // 系统主题检测
  systemTheme: ThemeType.LIGHT | ThemeType.DARK;

  // 预览模式
  previewMode: {
    enabled: boolean;
    previewTheme: IThemeDefinition | null;
  };
}

/**
 * 主题Store
 */
export const useThemeStore = defineStore('theme', () => {
  // ====== 状态 ======
  const themes = ref<IThemeDefinition[]>([]);
  const config = ref<IThemeConfig | null>(null);
  const activeTheme = ref<IThemeDefinition | null>(null);

  const loading = ref({
    themes: false,
    applying: false,
    config: false,
  });

  const error = ref<string | null>(null);
  const systemTheme = ref<ThemeType.LIGHT | ThemeType.DARK>(ThemeType.LIGHT);

  const previewMode = ref({
    enabled: false,
    previewTheme: null as IThemeDefinition | null,
  });

  // ====== 服务实例 ======
  const themeService = new ThemeClientService();
  const themeApplier = new ThemeApplier();

  // ====== 计算属性 ======
  const currentTheme = computed(() => {
    if (previewMode.value.enabled && previewMode.value.previewTheme) {
      return previewMode.value.previewTheme;
    }
    return activeTheme.value;
  });

  const isDarkMode = computed(() => {
    const theme = currentTheme.value;
    if (!theme) return systemTheme.value === ThemeType.DARK;

    if (theme.type === ThemeType.AUTO) {
      return systemTheme.value === ThemeType.DARK;
    }

    return theme.type === ThemeType.DARK;
  });

  const isLightMode = computed(() => !isDarkMode.value);

  const availableThemes = computed(() => {
    return themes.value.filter((theme) => !theme.isBuiltIn || theme.type !== ThemeType.AUTO);
  });

  const builtInThemes = computed(() => {
    return themes.value.filter((theme) => theme.isBuiltIn);
  });

  const customThemes = computed(() => {
    return themes.value.filter((theme) => !theme.isBuiltIn);
  });

  // ====== 监听系统主题变化 ======
  const mediaQuery =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  if (mediaQuery) {
    systemTheme.value = mediaQuery.matches ? ThemeType.DARK : ThemeType.LIGHT;

    mediaQuery.addEventListener('change', (e) => {
      systemTheme.value = e.matches ? ThemeType.DARK : ThemeType.LIGHT;

      // 如果配置为跟随系统主题，则自动切换
      if (config.value?.followSystemTheme) {
        handleSystemThemeChange();
      }
    });
  }

  // ====== 监听当前主题变化并应用 ======
  watch(
    currentTheme,
    (newTheme) => {
      if (newTheme) {
        themeApplier.applyTheme(newTheme);
      }
    },
    { immediate: true },
  );

  // ====== Actions ======

  /**
   * 初始化主题系统
   */
  async function initialize(): Promise<void> {
    try {
      await Promise.all([loadThemes(), loadConfig()]);

      // 应用当前主题
      if (config.value?.activeThemeId) {
        const theme = themes.value.find((t) => t.id === config.value!.activeThemeId);
        if (theme) {
          activeTheme.value = theme;
        }
      }

      // 如果没有主题，使用默认主题
      if (!activeTheme.value && themes.value.length > 0) {
        const defaultTheme = themes.value.find((t) => t.type === ThemeType.LIGHT && t.isBuiltIn);
        if (defaultTheme) {
          await applyTheme(defaultTheme.id);
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化主题系统失败';
      console.error('主题系统初始化失败:', err);
    }
  }

  /**
   * 加载所有主题
   */
  async function loadThemes(): Promise<void> {
    loading.value.themes = true;
    error.value = null;

    try {
      const result = await themeService.getAllThemes();
      themes.value = result.themes;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载主题失败';
      throw err;
    } finally {
      loading.value.themes = false;
    }
  }

  /**
   * 加载主题配置
   */
  async function loadConfig(): Promise<void> {
    loading.value.config = true;

    try {
      const result = await themeService.getThemeConfig();
      config.value = result.config;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载主题配置失败';
      throw err;
    } finally {
      loading.value.config = false;
    }
  }

  /**
   * 应用主题
   */
  async function applyTheme(themeId: string): Promise<void> {
    loading.value.applying = true;
    error.value = null;

    try {
      // 在主题列表中查找
      const theme = themes.value.find((t) => t.id === themeId);
      if (!theme) {
        throw new Error(`主题 ${themeId} 不存在`);
      }

      // 调用服务端应用主题
      await themeService.applyTheme({ themeId });

      // 更新本地状态
      activeTheme.value = theme;

      // 更新配置
      if (config.value) {
        config.value.activeThemeId = themeId;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '应用主题失败';
      throw err;
    } finally {
      loading.value.applying = false;
    }
  }

  /**
   * 切换到系统主题
   */
  async function switchToSystemTheme(): Promise<void> {
    try {
      await themeService.switchToSystemTheme();

      // 根据系统主题找到对应的主题
      const targetType = systemTheme.value;
      const systemThemeObj = themes.value.find((t) => t.isBuiltIn && t.type === targetType);

      if (systemThemeObj) {
        activeTheme.value = systemThemeObj;

        if (config.value) {
          config.value.activeThemeId = systemThemeObj.id;
          config.value.followSystemTheme = true;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '切换到系统主题失败';
      throw err;
    }
  }

  /**
   * 处理系统主题变化
   */
  async function handleSystemThemeChange(): Promise<void> {
    if (!config.value?.followSystemTheme) return;

    try {
      await switchToSystemTheme();
    } catch (err) {
      console.error('处理系统主题变化失败:', err);
    }
  }

  /**
   * 创建主题
   */
  async function createTheme(themeData: {
    name: string;
    description?: string;
    type: ThemeType;
    author?: string;
  }): Promise<IThemeDefinition> {
    error.value = null;

    try {
      const result = await themeService.createTheme(themeData);

      // 添加到本地列表
      themes.value.push(result.theme);

      return result.theme;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建主题失败';
      throw err;
    }
  }

  /**
   * 删除主题
   */
  async function deleteTheme(themeId: string): Promise<void> {
    error.value = null;

    try {
      await themeService.deleteTheme(themeId);

      // 从本地列表移除
      const index = themes.value.findIndex((t) => t.id === themeId);
      if (index > -1) {
        themes.value.splice(index, 1);
      }

      // 如果删除的是当前主题，切换到默认主题
      if (activeTheme.value?.id === themeId) {
        const defaultTheme = themes.value.find((t) => t.type === ThemeType.LIGHT && t.isBuiltIn);
        if (defaultTheme) {
          await applyTheme(defaultTheme.id);
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除主题失败';
      throw err;
    }
  }

  /**
   * 更新主题配置
   */
  async function updateConfig(configData: Partial<IThemeConfig>): Promise<void> {
    error.value = null;

    try {
      const result = await themeService.updateThemeConfig(configData);
      config.value = result.config;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新配置失败';
      throw err;
    }
  }

  /**
   * 启用主题预览
   */
  function enablePreview(theme: IThemeDefinition): void {
    previewMode.value = {
      enabled: true,
      previewTheme: theme,
    };
  }

  /**
   * 禁用主题预览
   */
  function disablePreview(): void {
    previewMode.value = {
      enabled: false,
      previewTheme: null,
    };
  }

  /**
   * 应用预览的主题
   */
  async function applyPreviewTheme(): Promise<void> {
    if (previewMode.value.previewTheme) {
      await applyTheme(previewMode.value.previewTheme.id);
      disablePreview();
    }
  }

  /**
   * 清除错误状态
   */
  function clearError(): void {
    error.value = null;
  }

  // ====== 返回 Store API ======
  return {
    // 状态
    themes,
    config,
    activeTheme,
    loading,
    error,
    systemTheme,
    previewMode,

    // 计算属性
    currentTheme,
    isDarkMode,
    isLightMode,
    availableThemes,
    builtInThemes,
    customThemes,

    // 方法
    initialize,
    loadThemes,
    loadConfig,
    applyTheme,
    switchToSystemTheme,
    createTheme,
    deleteTheme,
    updateConfig,
    enablePreview,
    disablePreview,
    applyPreviewTheme,
    clearError,
  };
});
