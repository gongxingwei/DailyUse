import { defineStore } from 'pinia';
import { useThemeStore } from '@/modules/Theme/themeStroe';
import { useStoreSave } from '@/shared/composables/useStoreSave';
import { setLanguage } from '@/i18n';
let autoSaveInstance: ReturnType<typeof useStoreSave> | null = null;

function getAutoSave() {
  if (!autoSaveInstance) {
    autoSaveInstance = useStoreSave({
      onSuccess: (storeName) => console.log(`✓ ${storeName} 数据保存成功`),
      onError: (storeName, error) => console.error(`✗ ${storeName} 数据保存失败:`, error),
    });
  }
  return autoSaveInstance;
}

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
    async setTheme(themeMode: string) {
      this.themeMode = themeMode;
      const themeStore = useThemeStore();
      themeStore.setCurrentTheme(themeMode);
      
      // 自动保存
      const saveSuccess = await this.saveSettings();
      if (!saveSuccess) {
        console.error('主题设置保存失败');
      }
    },

    async setAutoLaunch(autoLaunch: boolean) {
      try {
        const result = await window.shared?.ipcRenderer.invoke('set-auto-launch', autoLaunch);
        this.autoLaunch = result;
        
        // 自动保存
        const saveSuccess = await this.saveSettings();
        if (!saveSuccess) {
          console.error('自启动设置保存失败');
        }
      } catch (error) {
        console.error('设置开机自启动失败:', error);
      }
    },

    async updateEditorSettings(settings: Partial<EditorSettings>) {
      this.editor = { ...this.editor, ...settings };
      
      // 自动保存
      const saveSuccess = await this.saveSettings();
      if (!saveSuccess) {
        console.error('编辑器设置保存失败');
      }
    },

    async setLanguage(locale: 'en-US' | 'zh-CN') {
      this.language = locale;
      setLanguage(locale);
      
      // 自动保存
      const saveSuccess = await this.saveSettings();
      if (!saveSuccess) {
        console.error('语言设置保存失败');
      }
    },

    getMonacoOptions() {
      return {
        ...this.editor,
        minimap: { enabled: this.editor.minimap },
        // theme: this.editor.themeMode
      }
    },

    // 自动保存方法
    async saveSettings(): Promise<boolean> {
      const autoSave = getAutoSave();
      return autoSave.debounceSave('settings', this.$state);
    },

    async saveSettingsImmediately(): Promise<boolean> {
      const autoSave = getAutoSave();
      return autoSave.saveImmediately('settings', this.$state);
    },

    // 检查保存状态
    isSavingSettings(): boolean {
      const autoSave = getAutoSave();
      return autoSave.isSaving('settings');
    },
  },

  persist: true
}) 