import { onMounted, provide, watch } from 'vue';
import { useTheme } from 'vuetify';
// import { useThemeStore } from '@renderer/modules/Theme/themeStroe' // TODO: 创建web版本的theme store
import { THEME_KEY } from 'vue-echarts';
export function useThemeInit() {
  // TODO: 重新实现themeStore
  // const themeStore = useThemeStore()
  const theme = useTheme();

  onMounted(() => {
    // Set initial theme to light for now
    theme.change('light');
    provide(THEME_KEY, theme.global.name.value);
  });

  // TODO: Watch for theme changes
  // watch(
  //   () => themeStore.currentThemeStyle,
  //   (newTheme) => {
  //     theme.change(newTheme);
  //     provide(THEME_KEY, theme.global.name.value)
  //   }
  // )
}
