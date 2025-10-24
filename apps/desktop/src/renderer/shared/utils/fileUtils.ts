/**
 * 文件系统操作工具类
 */
export class FileUtils {
  /**
   * 打开文件资源管理器
   */
  static openFileExplorer(): Promise<void> {
    return window.shared.ipcRenderer.invoke('open-file-explorer');
  }

  /**
   * 在资源管理器中打开文件
   */
  static openFileInExplorer(filePath: string): Promise<void> {
    return window.shared.ipcRenderer.invoke('open-file-in-explorer', filePath);
  }

  /**
   * 读取文件夹内容
   */
  static readFolder(path: string): Promise<Array<string>> {
    return window.shared.ipcRenderer
      .invoke<Array<string>>('read-folder', path)
      .then((result: Array<string>) => {
        // Ensure the result is serializable
        return JSON.parse(JSON.stringify(result));
      });
  }

  /**
   * 选择文件夹
   */
  static selectFolder(): Promise<ApiResponse<{ folderPath: string; files: Array<string> }>> {
    return window.shared.ipcRenderer.invoke('select-folder');
  }

  /**
   * 检查文件或文件夹是否存在
   */
  static exists(path: string): Promise<boolean> {
    return window.shared.ipcRenderer.invoke('file-or-folder-exists', path);
  }

  /**
   * 创建文件夹
   */
  static createFolder(path: string): Promise<void> {
    return window.shared.ipcRenderer.invoke('create-folder', path);
  }

  /**
   * 创建文件
   */
  static createFile(path: string, content: string = ''): Promise<void> {
    return window.shared.ipcRenderer.invoke('create-file', path, content);
  }

  /**
   * 重命名文件或文件夹
   */
  static rename(oldPath: string, newPath: string): Promise<boolean> {
    return window.shared.ipcRenderer.invoke('rename-file-or-folder', oldPath, newPath);
  }

  /**
   * 删除文件或文件夹
   */
  static delete(path: string, isDirectory: boolean): Promise<void> {
    return window.shared.ipcRenderer.invoke('delete-file-or-folder', path, isDirectory);
  }

  /**
   * 读取文件
   */
  static readFile(path: string): Promise<string> {
    return window.shared.ipcRenderer.invoke('read-file', path);
  }

  /**
   * 写入文件
   */
  static writeFile(
    path: string,
    data: string | Buffer,
    encoding?: BufferEncoding | null,
  ): Promise<void> {
    return window.shared.ipcRenderer.invoke('write-file', path, data, encoding);
  }

  /**
   * 获取文件夹树
   */
  static getFolderTree(path: string): Promise<any> {
    return window.shared.ipcRenderer.invoke('get-folder-tree', path);
  }

  /**
   * 刷新文件夹
   */
  static refreshFolder(
    path: string,
  ): Promise<ApiResponse<{ folderTreeData: any[]; folderPath: string }>> {
    return window.shared.ipcRenderer.invoke('refresh-folder', path);
  }

  /**
   * 保存文件
   */
  static saveFile(file: File): Promise<void> {
    return window.shared.ipcRenderer.invoke('save-file', file);
  }

  /**
   * ArrayBuffer转Buffer
   */
  static arrayBufferToBuffer(data: ArrayBuffer): Promise<Buffer> {
    return window.shared.ipcRenderer.invoke('arrayBuffer-to-buffer', data);
  }
}

// 保持向后兼容性，导出原来的 fileSystem 对象
export const fileSystem = {
  openFileExplorer: FileUtils.openFileExplorer,
  openFileInExplorer: FileUtils.openFileInExplorer,
  readFolder: FileUtils.readFolder,
  selectFolder: FileUtils.selectFolder,
  exists: FileUtils.exists,
  createFolder: FileUtils.createFolder,
  createFile: FileUtils.createFile,
  rename: FileUtils.rename,
  delete: FileUtils.delete,
  readFile: FileUtils.readFile,
  writeFile: FileUtils.writeFile,
  getFolderTree: FileUtils.getFolderTree,
  refreshFolder: FileUtils.refreshFolder,
  saveFile: FileUtils.saveFile,
  arrayBufferToBuffer: FileUtils.arrayBufferToBuffer,
};
