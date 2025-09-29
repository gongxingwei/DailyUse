/**
 * Theme Store for Web Application
 * @description 使用新的主题系统的Web端Store
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { useThemeStore as useNewThemeStore } from '@dailyuse/domain-client';

// 直接导出新的主题Store，保持向后兼容
export const useThemeStore = useNewThemeStore;
