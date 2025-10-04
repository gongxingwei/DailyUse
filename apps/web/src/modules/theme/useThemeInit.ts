/**
 * Theme Initialization Composable (Integrated with UserPreferences)
 * @description 主题初始化组合函数，整合新的主题系统、UserPreferences 和 Vuetify
 * @author DailyUse Team
 * @date 2025-01-04
 */

import { onMounted, provide, watch, onUnmounted } from 'vue';
import { useTheme } from 'vuetify';
import { useThemeStore } from './themeStore';
import { THEME_KEY } from 'vue-echarts';

export function useThemeInit() {
  const themeStore = useThemeStore();
  const vuetifyTheme = useTheme();

  // 初始化主题系统
  onMounted(async () => {
    try {
      // 1. 初始化主题Store（会自动加载 UserPreferences）
      await themeStore.initialize();

      // 2. 同步到Vuetify主题
      const effectiveTheme = themeStore.effectiveTheme;
      syncToVuetify(effectiveTheme);

      // 3. 提供ECharts主题
      provide(THEME_KEY, effectiveTheme);

      console.log('主题系统初始化完成, 当前主题:', effectiveTheme);
    } catch (error) {
      console.error('主题系统初始化失败:', error);

      // 使用默认主题作为fallback
      vuetifyTheme.change('light');
      provide(THEME_KEY, 'light');
    }
  });

  // 监听主题变化
  const stopWatching = watch(
    () => themeStore.effectiveTheme,
    (effectiveTheme) => {
      // 同步到Vuetify
      syncToVuetify(effectiveTheme);

      // 更新ECharts主题
      provide(THEME_KEY, effectiveTheme);

      console.log(`主题切换到: ${effectiveTheme}`);
    },
    { immediate: false },
  );

  // 清理监听器
  onUnmounted(() => {
    stopWatching();
  });

  /**
   * 同步主题到Vuetify
   */
  function syncToVuetify(themeName: string) {
    if (vuetifyTheme.global.name.value !== themeName) {
      vuetifyTheme.change(themeName);
    }
  }

  /**
   * 切换主题模式（通过 UserPreferences API）
   */
  async function setThemeMode(themeMode: 'light' | 'dark' | 'system') {
    try {
      await themeStore.setThemeMode(themeMode);
    } catch (error) {
      console.error('切换主题模式失败:', error);
      throw error;
    }
  }

  /**
   * 切换到系统主题
   */
  async function switchToSystemTheme() {
    try {
      await themeStore.setThemeMode('system');
    } catch (error) {
      console.error('切换到系统主题失败:', error);
      throw error;
    }
  }

  return {
    // Store状态
    themeStore,

    // 操作方法
    setThemeMode,
    switchToSystemTheme,

    // Vuetify主题实例（用于兼容现有代码）
    vuetifyTheme,

    // 当前有效主题（用于兼容现有代码）
    get currentTheme() {
      return themeStore.effectiveTheme;
    },

    get isDarkMode() {
      return themeStore.effectiveTheme === 'dark';
    },
  };
}
