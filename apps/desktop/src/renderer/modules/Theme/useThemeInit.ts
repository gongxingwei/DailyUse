import { onMounted, provide, watch } from 'vue';
import { useTheme } from 'vuetify';
import { useThemeStore } from '@renderer/modules/Theme/themeStroe';
import { THEME_KEY } from 'vue-echarts';
export function useThemeInit() {
  const themeStore = useThemeStore();
  const theme = useTheme();

  onMounted(() => {
    // Set initial theme
    // theme.global.name.value = themeStore.currentThemeStyle
    theme.change(themeStore.currentThemeStyle);
    provide(THEME_KEY, theme.global.name.value);
  });

  // Watch for theme changes
  watch(
    () => themeStore.currentThemeStyle,
    (newTheme) => {
      theme.change(newTheme);
      provide(THEME_KEY, theme.global.name.value);
    },
  );
}
