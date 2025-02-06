// 文件系统操作的封装
export const fileSystem = {
  /**
   * 打开文件资源管理器
   */
  openFileExplorer() {
    return window.electron.ipcRenderer.invoke('open-file-explorer');
  },

  /**
   * 选择文件夹
   */
  selectFolder() {
    return window.ipcRenderer.invoke('select-folder');
  },

  /**
   * 创建文件夹
   */
  createFolder(path: string) {
    return window.electron.ipcRenderer.invoke('create-folder', path);
  },

  /**
   * 创建文件
   */
  createFile(path: string, content: string = '') {
    return window.electron.ipcRenderer.invoke('create-file', path, content);
  },

  /**
   * 重命名文件或文件夹
   */
  rename(oldPath: string, newPath: string) {
    return window.electron.ipcRenderer.invoke('rename-file-or-folder', oldPath, newPath)
  },

  /**
   * 删除文件或文件夹
   */
  delete(path: string, isDirectory: boolean) {
    return window.electron.ipcRenderer.invoke('delete-file-or-folder', path, isDirectory);
  },

  /**
   * 读取文件
   */
  readFile(path: string) {
    return window.electron.ipcRenderer.invoke('read-file', path);
  },

  /**
   * 写入文件
   */
  writeFile(path: string, content: string) {
    return window.electron.ipcRenderer.invoke('write-file', path, content);
  },

  /**
   * 获取文件夹树
   */
  getFolderTree(path: string) {
    return window.electron.ipcRenderer.invoke('get-folder-tree', path);
  },

  /**
   * 刷新文件夹
   */
  refreshFolder(path: string) {
    return window.electron.ipcRenderer.invoke('refresh-folder', path);
  }
}; 