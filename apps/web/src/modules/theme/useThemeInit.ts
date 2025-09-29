/**
 * Theme Initialization Composable
 * @description 主题初始化组合函数，整合新的主题系统和Vuetify
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { onMounted, provide, watch, onUnmounted } from 'vue';
import { useTheme } from 'vuetify';
import { useThemeStore } from './themeStroe';
import { THEME_KEY } from 'vue-echarts';

export function useThemeInit() {
  const themeStore = useThemeStore();
  const vuetifyTheme = useTheme();

  // 初始化主题系统
  onMounted(async () => {
    try {
      // 1. 初始化主题Store
      await themeStore.initialize();

      // 2. 同步到Vuetify主题
      syncToVuetify(themeStore.isDarkMode ? 'dark' : 'light');

      // 3. 提供ECharts主题
      provide(THEME_KEY, themeStore.isDarkMode ? 'dark' : 'light');

      console.log('主题系统初始化完成');
    } catch (error) {
      console.error('主题系统初始化失败:', error);

      // 使用默认主题作为fallback
      vuetifyTheme.change('light');
      provide(THEME_KEY, 'light');
    }
  });

  // 监听主题变化
  const stopWatching = watch(
    () => themeStore.isDarkMode,
    (isDark) => {
      const themeName = isDark ? 'dark' : 'light';

      // 同步到Vuetify
      syncToVuetify(themeName);

      // 更新ECharts主题
      provide(THEME_KEY, themeName);

      console.log(`主题切换到: ${themeName}`);
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
   * 手动应用主题
   */
  async function applyTheme(themeId: string) {
    try {
      await themeStore.applyTheme(themeId);
    } catch (error) {
      console.error('应用主题失败:', error);
    }
  }

  /**
   * 切换到系统主题
   */
  async function switchToSystemTheme() {
    try {
      await themeStore.switchToSystemTheme();
    } catch (error) {
      console.error('切换到系统主题失败:', error);
    }
  }

  return {
    // Store状态
    themeStore,

    // 操作方法
    applyTheme,
    switchToSystemTheme,

    // Vuetify主题实例（用于兼容现有代码）
    vuetifyTheme,
  };
}
