import { defineStore } from "pinia";

interface ThemeStyle {
    // 基础色
    primary: string
    secondary: string
    background: string
    surface: string

    // 文本色
    textPrimary: string
    textSecondary: string

    // 边框和分割线
    border: string
    divider: string

    // 状态色
    error: string
    warning: string
    success: string
    info: string

    // 特殊组件色
    sidebarBackground: string
    editorBackground: string
    toolbarBackground: string
    scrollbarThumb: string
    scrollbarTrack: string
}

export const useThemeStore = defineStore("theme", {
    state: () => ({
        currentTheme: 'system',
        customThemes: {} as Record<string, ThemeStyle>
    }),

    getters: {
        currentThemeStyle(state) {
            if (state.currentTheme === 'system') {
                let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                return theme
            } else {
                return state.currentTheme
            }
        }
    },

    actions: {
        addTheme(customThemes: Record<string, ThemeStyle>) {
            Object.assign(this.customThemes, customThemes);
        },

        setCurrentTheme(themeName: string) {
            this.currentTheme = themeName;
        },

        applyThemeSystem() {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            let theme = prefersDark ? 'dark' : 'light'
            this.applyTheme(theme)
        },

        applyTheme(themeName: string) {
            if (['light', 'dark'].includes(themeName)) {
                document.documentElement.setAttribute('data-theme', themeName);
            }
            else if (this.customThemes[themeName]) {
                Object.entries(this.customThemes[themeName]).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(`--${key}`, value);
                  });
            }
        }
    },

    persist: true
});
