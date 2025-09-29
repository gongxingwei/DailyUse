/**
 * Theme Module - Web Frontend
 * @description 主题模块的Web端导出
 * @author DailyUse Team
 * @date 2025-09-29
 */

// 导出Store（新版本）
export { useThemeStore } from './themeStroe';

// 导出初始化函数
export { useThemeInit } from './useThemeInit';

// 导出组件
export { default as ThemeSwitcher } from './components/ThemeSwitcher.vue';
