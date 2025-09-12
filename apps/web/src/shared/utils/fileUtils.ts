/**
 * Web环境文件工具类
 * 适配浏览器环境的文件操作
 */

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
}

/**
 * Web环境文件操作工具
 */
export class FileUtils {
  /**
   * 选择文件 (Web API)
   */
  static async selectFile(options?: { accept?: string; multiple?: boolean }): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = options?.accept || '*/*';
      input.multiple = options?.multiple || false;

      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files) {
          resolve(Array.from(files));
        } else {
          resolve([]);
        }
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  /**
   * 选择文件夹 (Web API - 需要现代浏览器支持)
   */
  static async selectFolder(): Promise<FileSystemDirectoryHandle | null> {
    if ('showDirectoryPicker' in window) {
      try {
        return await (window as any).showDirectoryPicker();
      } catch (error) {
        console.warn('用户取消选择文件夹或浏览器不支持');
        return null;
      }
    }
    throw new Error('浏览器不支持文件夹选择API');
  }

  /**
   * 读取文件内容
   */
  static async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * 读取文件为ArrayBuffer
   */
  static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 下载文件
   */
  static downloadFile(content: string | Blob, filename: string, mimeType = 'text/plain'): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * 获取文件扩展名
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 验证文件类型
   */
  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * 验证文件类型
   */
  static isTextFile(file: File): boolean {
    return (
      file.type.startsWith('text/') || ['application/json', 'application/xml'].includes(file.type)
    );
  }

  /**
   * 将文件转换为Base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // 移除data:image/png;base64,前缀
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}

// 保持向后兼容性，提供简化的API
export const fileSystem = {
  selectFile: FileUtils.selectFile,
  selectFolder: FileUtils.selectFolder,
  readFile: FileUtils.readFile,
  downloadFile: FileUtils.downloadFile,
  getFileExtension: FileUtils.getFileExtension,
  formatFileSize: FileUtils.formatFileSize,
  isImageFile: FileUtils.isImageFile,
  isTextFile: FileUtils.isTextFile,
  fileToBase64: FileUtils.fileToBase64,
};
