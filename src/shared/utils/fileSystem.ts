// 文件系统操作的封装
export const fileSystem = {
  /**
   * 打开文件资源管理器
   */
  openFileExplorer() {
    return window.shared.ipcRenderer.invoke('open-file-explorer');
  },

  /**
   * 读取文件夹内容
   */
  readFolder(path: string) {
    return window.shared.ipcRenderer.invoke<Array<string>>('read-folder', path).then((result: Array<string>) => {
      // Ensure the result is serializable
      return JSON.parse(JSON.stringify(result));
    });
  },

  /**
   * 选择文件夹
   */
  selectFolder() {
    return window.shared.ipcRenderer.invoke('select-folder');
  },

  /**
   * 检查文件或文件夹是否存在
   */
  exists(path: string) {
    return window.shared.ipcRenderer.invoke('file-or-folder-exists', path);
  },

  /**
   * 创建文件夹
   */
  createFolder(path: string) {
    return window.shared.ipcRenderer.invoke('create-folder', path);
  },

  /**
   * 创建文件
   */
  createFile(path: string, content: string = '') {
    return window.shared.ipcRenderer.invoke('create-file', path, content);
  },

  /**
   * 重命名文件或文件夹
   */
  rename(oldPath: string, newPath: string) {
    return window.shared.ipcRenderer.invoke('rename-file-or-folder', oldPath, newPath)
  },

  /**
   * 删除文件或文件夹
   */
  delete(path: string, isDirectory: boolean) {
    return window.shared.ipcRenderer.invoke('delete-file-or-folder', path, isDirectory);
  },

  /**
   * 读取文件
   */
  readFile(path: string) {
    return window.shared.ipcRenderer.invoke('read-file', path);
  },

  /**
   * 写入文件
   */
  writeFile(path: string, data: string | Buffer, encoding?: BufferEncoding | null) {
    return window.shared.ipcRenderer.invoke('write-file', path, data, encoding);
  },

  /**
   * 获取文件夹树
   */
  getFolderTree(path: string) {
    return window.shared.ipcRenderer.invoke('get-folder-tree', path);
  },

  /**
   * 刷新文件夹
   */
  refreshFolder(path: string) {
    return window.shared.ipcRenderer.invoke('refresh-folder', path);
  },

  /**
   * 保存文件
   */
  saveFile(file: File) {
    return window.shared.ipcRenderer.invoke('save-file', file);
  },

  /**
   * buffer转ArrayBuffer
   */
  arrayBufferToBuffer(data: ArrayBuffer): Promise<Buffer>{
    return window.shared.ipcRenderer.invoke('arrayBuffer-to-buffer', data);
  }
}; 