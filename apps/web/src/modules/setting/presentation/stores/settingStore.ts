import { defineStore } from 'pinia';

export interface EditorSettings {
  fontSize: number;
  lineNumbers: boolean;
  minimap: boolean;
  wordWrap: 'on' | 'off';
  autoSave: boolean;
  fontFamily: string;
  tabSize: number;
  insertSpaces: boolean;
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced';
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoClosingQuotes: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  renderIndentGuides: boolean;
  scrollBeyondLastLine: boolean;
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  smoothScrolling: boolean;
  mouseWheelZoom: boolean;
  lineHeight: number;
  insertImage: 'embed' | 'link';
  padding: {
    top: number;
    bottom: number;
  };
}

export interface AppSetting {
  themeMode: string;
  language: 'en-US' | 'zh-CN';
  autoLaunch: boolean;
  showHiddenFiles: boolean;
  editor: EditorSettings;
}

export const useSettingStore = defineStore('setting', {
  state: (): AppSetting => ({
    themeMode: 'system',
    language: 'zh-CN',
    autoLaunch: false,
    showHiddenFiles: false,
    editor: {
      fontSize: 14,
      lineNumbers: true,
      minimap: true,
      wordWrap: 'on',
      autoSave: true,
      fontFamily: 'Consolas, "Courier New", monospace',
      tabSize: 2,
      insertSpaces: true,
      autoIndent: 'advanced',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      renderWhitespace: 'selection',
      renderIndentGuides: true,
      scrollBeyondLastLine: false,
      cursorStyle: 'line',
      cursorBlinking: 'blink',
      smoothScrolling: true,
      mouseWheelZoom: true,
      lineHeight: 20,
      insertImage: 'link',
      padding: {
        top: 4,
        bottom: 4,
      },
    },
  }),

  getters: {
    getThemeIcon: () => (theme: string) => {
      const icons: Record<string, string> = {
        system: 'mdi-monitor',
        dark: 'mdi-weather-night',
        light: 'mdi-weather-sunny',
        blueGreen: 'mdi-water',
      };
      return icons[theme] || 'mdi-monitor';
    },

    getMonacoOptions: (state) => () => {
      return {
        ...state.editor,
        minimap: { enabled: state.editor.minimap },
      };
    },
  },

  actions: {
    async setTheme(themeMode: string) {
      this.themeMode = themeMode;

      // 应用主题
      const htmlElement = document.documentElement;
      if (themeMode === 'dark') {
        htmlElement.classList.add('v-theme--dark');
        htmlElement.classList.remove('v-theme--light');
      } else if (themeMode === 'light') {
        htmlElement.classList.add('v-theme--light');
        htmlElement.classList.remove('v-theme--dark');
      } else {
        // system theme - detect based on user preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          htmlElement.classList.add('v-theme--dark');
          htmlElement.classList.remove('v-theme--light');
        } else {
          htmlElement.classList.add('v-theme--light');
          htmlElement.classList.remove('v-theme--dark');
        }
      }

      // 持久化设置
      this.saveSettings();
    },

    async setAutoLaunch(autoLaunch: boolean) {
      // 在web环境中，无法设置开机自启动，只是保存设置
      this.autoLaunch = autoLaunch;
      this.saveSettings();
      console.log('Web环境无法设置开机自启动，仅保存设置');
    },

    updateEditorSettings(settings: Partial<EditorSettings>) {
      this.editor = { ...this.editor, ...settings };
      this.saveSettings();
    },

    async setLanguage(locale: 'en-US' | 'zh-CN') {
      this.language = locale;
      // TODO: 集成i18n设置语言
      // setLanguage(locale);
      this.saveSettings();
    },

    // 保存设置到localStorage
    saveSettings() {
      try {
        localStorage.setItem('app-settings', JSON.stringify(this.$state));
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },

    // 从localStorage恢复设置
    restoreSettings() {
      try {
        const savedSettings = localStorage.getItem('app-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          this.$patch(parsed);
        }
      } catch (error) {
        console.error('恢复设置失败:', error);
      }
    },

    // 初始化设置
    async initializeSettings() {
      this.restoreSettings();

      // 应用主题
      await this.setTheme(this.themeMode);

      // 监听系统主题变化
      if (this.themeMode === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
          if (this.themeMode === 'system') {
            this.setTheme('system');
          }
        });
      }
    },
  },
});
