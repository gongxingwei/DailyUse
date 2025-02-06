import { defineStore } from 'pinia'

export interface EditorSettings {
  fontSize: number
  lineNumbers: boolean
  minimap: boolean
  wordWrap: 'on' | 'off'
  theme: string
}

export interface AppSettings {
  theme: 'light' | 'dark'
  language: string
  autoSave: boolean
  showHiddenFiles: boolean
  editor: EditorSettings
}

export const useSettingStore = defineStore('setting', {
  state: (): AppSettings => ({
    theme: 'dark',
    language: 'zh-CN',
    autoSave: true,
    showHiddenFiles: false,
    editor: {
      fontSize: 14,
      lineNumbers: true,
      minimap: true,
      wordWrap: 'on',
      theme: 'vs-dark'
    }
  }),

  actions: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },
    updateEditorSettings(settings: Partial<EditorSettings>) {
      this.editor = { ...this.editor, ...settings }
    }
  },

  persist: true
}) 