import { defineStore } from 'pinia';

interface FileState {
  currentFilePath: string | null;
  openedFiles: Array<{
    uuid: string;
    path: string;
    title: string;
  }>;
}

export const useFileStore = defineStore('file', {
  state: (): FileState => ({
    currentFilePath: null,
    openedFiles: [],
  }),

  actions: {
    setCurrentFile(path: string | null) {
      this.currentFilePath = path;
    },

    openFile(path: string) {
      // 使用简单的路径解析代替 window.shared.path.basename
      const title = path.split('/').pop() || path.split('\\').pop() || path;
      const uuid = path; // 使用路径作为唯一标识

      if (!this.openedFiles.find((f) => f.uuid === uuid)) {
        this.openedFiles.push({ uuid, path, title });
      }
      this.setCurrentFile(path);
    },

    closeFile(uuid: string) {
      const index = this.openedFiles.findIndex((f) => f.uuid === uuid);
      if (index > -1) {
        this.openedFiles.splice(index, 1);

        // 如果关闭的是当前文件，切换到其他文件
        if (this.currentFilePath === uuid) {
          const nextFile = this.openedFiles[index] || this.openedFiles[index - 1];
          this.setCurrentFile(nextFile?.path || null);
        }
      }
    },
  },

  // 暂时注释持久化，避免类型错误
  // persist: true, // 持久化存储
});
