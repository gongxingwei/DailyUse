import { defineStore } from 'pinia'
import { useThemeStore } from '@/modules/Theme/themeStroe'
import { setLanguage } from '@/i18n'
import { useUserStore } from '@/modules/Account/composables/useUserStore'

export interface EditorSettings {
  fontSize: number
  lineNumbers: boolean
  minimap: boolean
  wordWrap: 'on' | 'off'
  autoSave: boolean
  // themeMode: string
  // Monaco specific settings
  fontFamily: string
  tabSize: number
  insertSpaces: boolean
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced'
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never'
  autoClosingQuotes: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never'
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all'
  renderIndentGuides: boolean
  scrollBeyondLastLine: boolean
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin'
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
  smoothScrolling: boolean
  mouseWheelZoom: boolean
  lineHeight: number
  insertImage: 'embed' | 'link'
  padding: {
    top: number
    bottom: number
  }
}

export interface AppSetting {
  themeMode: string
  language: 'en-US' | 'zh-CN'
  
  autoLaunch: boolean
  showHiddenFiles: boolean
  editor: EditorSettings
}

export const useSettingStore = defineStore('setting', {
  state: (): AppSetting => ({
    themeMode: 'system',
    language: 'zh-CN',
    autoLaunch: false,
    
    showHiddenFiles: false,
    editor: {
      // Basic settings
      fontSize: 14,
      lineNumbers: true,
      minimap: true,
      wordWrap: 'on',
      autoSave: true,
      // themeMode: 'vs-dark',
      // Monaco specific settings
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
        bottom: 4
      }
    }
  }),

  actions: {
    // 初始化设置数据
    async initialize() {
      const { loadUserData } = useUserStore<AppSetting>('settings');
      const data = await loadUserData();
      if (data) {
        this.$patch(data);
        // 应用初始化的设置
        this.setTheme(this.themeMode);
        this.setLanguage(this.language);
        await this.setAutoLaunch(this.autoLaunch);
      }
    },

    // 保存设置状态
    async saveState() {
      const { saveUserData } = useUserStore<AppSetting>('settings');
      try {
        await saveUserData(this.$state);
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },
    setTheme(themeMode: string) {
      this.themeMode = themeMode
      const themeStore = useThemeStore()
      themeStore.setCurrentTheme(themeMode)
      
    },

    async setAutoLaunch(autoLaunch: boolean) {
      try {
        const result = await window.shared?.ipcRenderer.invoke('set-auto-launch', autoLaunch)
        this.autoLaunch = result
      } catch (error) {
        console.error('设置开机自启动失败:', error)
      }
    },

    updateEditorSettings(settings: Partial<EditorSettings>) {
      this.editor = { ...this.editor, ...settings }
    },

    getMonacoOptions() {
      return {
        ...this.editor,
        minimap: { enabled: this.editor.minimap },
        // theme: this.editor.themeMode
      }
    },

    setLanguage(locale: 'en-US' | 'zh-CN') {
      this.language = locale
      setLanguage(locale)
    },
  },

  persist: true
}) 