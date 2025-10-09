/**
 * 文件系统服务
 *
 * 职责：
 * - 封装文件系统操作
 * - 提供目录扫描
 * - 文件监听
 * - 文件统计信息
 *
 * 注意：
 * - 使用 Node.js fs/promises API
 * - 支持递归操作
 * - 错误转换为领域友好的错误消息
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * 文件统计信息
 */
export interface FileStats {
  totalFiles: number;
  totalSize: number; // bytes
  filesByType: Record<string, number>;
  lastModified: number; // timestamp
}

/**
 * 目录扫描选项
 */
export interface ScanOptions {
  recursive?: boolean;
  includeHidden?: boolean;
  fileExtensions?: string[]; // 例如: ['.md', '.txt']
  exclude?: string[]; // 排除的路径模式
  maxDepth?: number;
}

/**
 * FileSystemService
 */
export class FileSystemService {
  /**
   * 检查路径是否存在
   */
  public async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 创建目录（递归）
   */
  public async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 扫描目录
   */
  public async scanDirectory(dirPath: string, options: ScanOptions = {}): Promise<string[]> {
    const {
      recursive = true,
      includeHidden = false,
      fileExtensions = [],
      exclude = [],
      maxDepth = Infinity,
    } = options;

    const results: string[] = [];

    const scan = async (currentPath: string, depth: number): Promise<void> => {
      if (depth > maxDepth) return;

      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(dirPath, fullPath);

          // 跳过隐藏文件
          if (!includeHidden && entry.name.startsWith('.')) {
            continue;
          }

          // 跳过排除的路径
          if (exclude.some((pattern) => relativePath.includes(pattern))) {
            continue;
          }

          if (entry.isDirectory()) {
            if (recursive) {
              await scan(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            // 过滤文件扩展名
            if (
              fileExtensions.length === 0 ||
              fileExtensions.some((ext) => entry.name.endsWith(ext))
            ) {
              results.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`[FileSystemService] Failed to scan directory ${currentPath}:`, error);
      }
    };

    await scan(dirPath, 0);
    return results;
  }

  /**
   * 获取文件统计信息
   */
  public async getStats(dirPath: string, options: ScanOptions = {}): Promise<FileStats> {
    const files = await this.scanDirectory(dirPath, options);

    let totalSize = 0;
    let lastModified = 0;
    const filesByType: Record<string, number> = {};

    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        totalSize += stats.size;

        if (stats.mtimeMs > lastModified) {
          lastModified = stats.mtimeMs;
        }

        const ext = path.extname(file) || '.no-extension';
        filesByType[ext] = (filesByType[ext] || 0) + 1;
      } catch (error) {
        console.warn(`[FileSystemService] Failed to get stats for ${file}:`, error);
      }
    }

    return {
      totalFiles: files.length,
      totalSize,
      filesByType,
      lastModified,
    };
  }

  /**
   * 读取文件内容
   */
  public async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    try {
      return await fs.readFile(filePath, encoding);
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 写入文件
   */
  public async writeFile(
    filePath: string,
    content: string,
    encoding: BufferEncoding = 'utf-8',
  ): Promise<void> {
    try {
      // 确保目录存在
      const dirPath = path.dirname(filePath);
      await this.ensureDirectory(dirPath);

      await fs.writeFile(filePath, content, encoding);
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 删除文件
   */
  public async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 删除目录（递归）
   */
  public async deleteDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      throw new Error(
        `Failed to delete directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 复制文件
   */
  public async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      const destDir = path.dirname(destPath);
      await this.ensureDirectory(destDir);
      await fs.copyFile(sourcePath, destPath);
    } catch (error) {
      throw new Error(
        `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 移动/重命名文件
   */
  public async moveFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      const destDir = path.dirname(destPath);
      await this.ensureDirectory(destDir);
      await fs.rename(sourcePath, destPath);
    } catch (error) {
      throw new Error(
        `Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 获取文件大小（bytes）
   */
  public async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      throw new Error(
        `Failed to get file size: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 检查是否是目录
   */
  public async isDirectory(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 检查是否是文件
   */
  public async isFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }
}
