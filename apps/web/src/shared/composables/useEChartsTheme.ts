import { watch, type Ref } from 'vue';
import { useTheme } from './useTheme';
import type { EChartsOption } from 'echarts';

/**
 * Get ECharts theme colors based on current theme mode
 * @returns Theme-aware color configuration for ECharts
 */
export function getEChartsThemeColors() {
  const { isDark } = useTheme();

  return {
    // Background colors
    backgroundColor: isDark.value ? '#121212' : '#FFFFFF',
    
    // Text colors
    textColor: isDark.value ? '#E1E1E1' : '#333333',
    axisLineColor: isDark.value ? '#5C5C5C' : '#DDDDDD',
    splitLineColor: isDark.value ? '#2D2D2D' : '#F1F3F5',
    
    // Chart colors (consistent across themes but with adjusted brightness)
    colorPalette: isDark.value 
      ? [
          '#8AB4F8', // Blue
          '#A5D6A7', // Green
          '#FFB4A8', // Coral
          '#B5C9FF', // Light Blue
          '#FFE082', // Yellow
          '#81D4FA', // Cyan
          '#FFB4AB', // Pink
        ]
      : [
          '#4A6FA5', // Blue
          '#6D8B74', // Green
          '#A37A74', // Coral
          '#6B9AC4', // Light Blue
          '#D4A373', // Yellow
          '#5CBBF6', // Cyan
          '#C86B6B', // Pink
        ],
  };
}

/**
 * Composable for integrating ECharts with theme system
 * 
 * Automatically updates ECharts instance when theme changes
 * 
 * @param chartRef - Ref to VChart component instance
 * @param getOption - Function that returns ECharts option (receives theme colors)
 * 
 * @example
 * ```typescript
 * const chartRef = ref<InstanceType<typeof VChart>>();
 * 
 * useEChartsTheme(chartRef, (colors) => ({
 *   backgroundColor: colors.backgroundColor,
 *   textStyle: { color: colors.textColor },
 *   series: [{
 *     type: 'bar',
 *     data: [10, 20, 30],
 *     itemStyle: { color: colors.colorPalette[0] }
 *   }]
 * }));
 * ```
 */
export function useEChartsTheme(
  chartRef: Ref<any>,
  getOption: (colors: ReturnType<typeof getEChartsThemeColors>) => EChartsOption
) {
  const { isDark } = useTheme();

  // Update chart when theme changes
  watch(
    isDark,
    () => {
      if (!chartRef.value) return;

      const chart = chartRef.value;
      const colors = getEChartsThemeColors();
      const newOption = getOption(colors);

      // Clear and set new option with animation
      if (chart.setOption) {
        chart.setOption(newOption, { notMerge: true });
      }
    },
    { immediate: false } // Don't trigger on mount (initial option already set)
  );

  return {
    getEChartsThemeColors,
  };
}
