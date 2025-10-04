/**
 * Theme Module - Web Frontend (Integrated with UserPreferences)
 * @description 主题模块的Web端导出
 * @author DailyUse Team
 * @date 2025-01-04
 */

// 导出Store（新版本，集成UserPreferences）
export { useThemeStore } from './themeStore';

// 导出初始化函数
export { useThemeInit } from './useThemeInit';

// 导出初始化任务
export { registerThemeInitializationTasks } from './initialization/themeInitialization';

// 导出组件
export { default as ThemeSwitcher } from './components/ThemeSwitcher.vue';
