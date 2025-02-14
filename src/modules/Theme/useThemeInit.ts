import { onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useThemeStore } from '@/modules/Theme/themeStroe'

export function useThemeInit() {
  const themeStore = useThemeStore()
  const theme = useTheme()

  onMounted(() => {
    // Set initial theme
    theme.global.name.value = themeStore.currentThemeStyle
  })

  // Watch for theme changes
  watch(
    () => themeStore.currentThemeStyle,
    (newTheme) => {
      theme.global.name.value = newTheme
    }
  )
}