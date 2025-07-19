import { defineStore } from 'pinia';
import { useThemeStore } from '@/modules/Theme/themeStroe';
import { setLanguage } from '@/i18n';

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

  actions: {
    async setTheme(themeMode: string) {
      this.themeMode = themeMode;
      const themeStore = useThemeStore();
      themeStore.setCurrentTheme(themeMode);
    },

    async setAutoLaunch(autoLaunch: boolean) {
      try {
        const result = await window.shared?.ipcRenderer.invoke('set-auto-launch', autoLaunch);
        this.autoLaunch = result;
      } catch (error) {
        console.error('设置开机自启动失败:', error);
      }
    },

    updateEditorSettings(settings: Partial<EditorSettings>) {
      this.editor = { ...this.editor, ...settings };
    },

    async setLanguage(locale: 'en-US' | 'zh-CN') {
      this.language = locale;
      setLanguage(locale);
    },

    getMonacoOptions() {
      return {
        ...this.editor,
        minimap: { enabled: this.editor.minimap },
      };
    },
  },

  persist: true,
});