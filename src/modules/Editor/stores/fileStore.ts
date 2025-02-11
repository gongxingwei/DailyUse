import { defineStore } from 'pinia'

interface FileState {
  currentFilePath: string | null
  openedFiles: Array<{
    id: string
    path: string
    title: string
  }>
}

export const useFileStore = defineStore('file', {
  state: (): FileState => ({
    currentFilePath: null,
    openedFiles: []
  }),

  actions: {
    setCurrentFile(path: string | null) {
      this.currentFilePath = path
    },

    openFile(path: string) {
      const title = window.shared.path.basename(path)
      const id = path // 使用路径作为唯一标识

      if (!this.openedFiles.find(f => f.id === id)) {
        this.openedFiles.push({ id, path, title })
      }
      this.setCurrentFile(path)
    },

    closeFile(id: string) {
      const index = this.openedFiles.findIndex(f => f.id === id)
      if (index > -1) {
        this.openedFiles.splice(index, 1)
        
        // 如果关闭的是当前文件，切换到其他文件
        if (this.currentFilePath === id) {
          const nextFile = this.openedFiles[index] || this.openedFiles[index - 1]
          this.setCurrentFile(nextFile?.path || null)
        }
      }
    }
  },

  persist: true // 持久化存储
})