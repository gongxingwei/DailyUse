/**
 * Theme Store for Web Application (Integrated with UserPreferences)
 * @description 使用新的主题系统的Web端Store，与UserPreferences集成
 * @author DailyUse Team
 * @date 2025-01-04
 */

import { defineStore } from 'pinia';
import { watch } from 'vue';
import { useUserPreferencesStore } from '../setting/presentation/stores/userPreferencesStore';

interface ThemeStyle {
  // 基础色
  primary: string;
  secondary: string;
  background: string;
  surface: string;

  // 文本色
  textPrimary: string;
  textSecondary: string;

  // 边框和分割线
  border: string;
  divider: string;

  // 状态色
  error: string;
  warning: string;
  success: string;
  info: string;

  // 特殊组件色
  sidebarBackground: string;
  editorBackground: string;
  toolbarBackground: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    customThemes: {} as Record<string, ThemeStyle>,
    isInitialized: false,
  }),

  getters: {
    /**
     * 获取当前主题模式（来自 UserPreferences）
     */
    currentThemeMode(): 'light' | 'dark' | 'system' {
      const userPreferencesStore = useUserPreferencesStore();
      return userPreferencesStore.currentThemeMode;
    },

    /**
     * 获取实际应用的主题（解析 system 为 light 或 dark）
     */
    effectiveTheme(): 'light' | 'dark' {
      if (this.currentThemeMode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return this.currentThemeMode;
    },
  },

  actions: {
    /**
     * 添加自定义主题
     */
    addTheme(customThemes: Record<string, ThemeStyle>) {
      Object.assign(this.customThemes, customThemes);
    },

    /**
     * 切换主题模式（通过 UserPreferences API）
     */
    async setThemeMode(themeMode: 'light' | 'dark' | 'system') {
      const userPreferencesStore = useUserPreferencesStore();
      try {
        await userPreferencesStore.switchThemeMode(themeMode);
        this.applyTheme(this.effectiveTheme);
      } catch (error) {
        console.error('Failed to switch theme mode:', error);
        throw error;
      }
    },

    /**
     * 初始化主题系统
     */
    async initialize() {
      if (this.isInitialized) {
        return;
      }

      // 获取用户偏好
      const userPreferencesStore = useUserPreferencesStore();
      if (!userPreferencesStore.isLoaded) {
        await userPreferencesStore.initialize();
      }

      // 应用初始主题
      this.applyTheme(this.effectiveTheme);

      // 监听用户偏好变化
      watch(
        () => userPreferencesStore.currentThemeMode,
        (newThemeMode) => {
          console.log('Theme mode changed to:', newThemeMode);
          this.applyTheme(this.effectiveTheme);
        },
      );

      // 监听系统主题变化（仅在 system 模式下）
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.currentThemeMode === 'system') {
          this.applyTheme(this.effectiveTheme);
        }
      });

      this.isInitialized = true;
    },

    /**
     * 应用主题
     */
    applyTheme(themeName: string) {
      console.log('Applying theme:', themeName);

      if (['light', 'dark'].includes(themeName)) {
        // 应用内置主题
        document.documentElement.setAttribute('data-theme', themeName);
      } else if (this.customThemes[themeName]) {
        // 应用自定义主题
        Object.entries(this.customThemes[themeName]).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--${key}`, value);
        });
      }
    },

    /**
     * 应用系统主题（根据系统设置自动选择）
     */
    applyThemeSystem() {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = prefersDark ? 'dark' : 'light';
      this.applyTheme(theme);
    },
  },
});
