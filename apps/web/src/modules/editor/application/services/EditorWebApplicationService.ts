import { useEditorStore } from '../../presentation/stores/editorStore';

/**
 * Editor Web 应用服务 - 新架构
 * 负责协调编辑器数据同步和 Store 之间的数据流
 * 实现缓存优先的数据同步策略
 */
export class EditorWebApplicationService {
  private baseUrl = '/api/v1/editor';

  /**
   * 懒加载获取 Editor Store
   * 避免在 Pinia 初始化之前调用
   */
  private get editorStore() {
    return useEditorStore();
  }

  // ===== 文件操作 =====

  /**
   * 创建文件
   */
  async createFile(request: { path: string; content?: string; type?: string }): Promise<any> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create file: ${response.statusText}`);
      }

      const result = await response.json();
      const file = result.data;

      // 添加到缓存
      this.editorStore.addFile(file);

      return file;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取文件列表
   */
  async getFiles(params?: { directory?: string; type?: string; limit?: number }): Promise<any> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const url = new URL(`${this.baseUrl}/files`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to get files: ${response.statusText}`);
      }

      const result = await response.json();
      const files = result.data || [];

      // 批量同步到 store
      this.editorStore.setFiles(files);

      return files;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取文件列表失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取文件内容
   */
  async getFileContent(path: string): Promise<any> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/files/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get file content: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取文件内容失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 保存文件内容
   */
  async saveFileContent(path: string, content: string): Promise<any> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/files/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save file content: ${response.statusText}`);
      }

      const result = await response.json();
      const file = result.data;

      // 更新缓存
      this.editorStore.updateFile(path, file);

      return file;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(path: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      // 从缓存中移除
      this.editorStore.removeFile(path);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 重命名文件
   */
  async renameFile(oldPath: string, newPath: string): Promise<any> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/files/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPath, newPath }),
      });

      if (!response.ok) {
        throw new Error(`Failed to rename file: ${response.statusText}`);
      }

      const result = await response.json();
      const file = result.data;

      // 移除旧文件，添加新文件
      this.editorStore.removeFile(oldPath);
      this.editorStore.addFile(file);

      return file;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重命名文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  // ===== 编辑器组操作 =====

  /**
   * 创建编辑器组
   */
  async createEditorGroup(request: {
    name: string;
    position?: 'left' | 'right' | 'top' | 'bottom';
  }): Promise<any> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/editor-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create editor group: ${response.statusText}`);
      }

      const result = await response.json();
      const group = result.data;

      // 添加到缓存
      this.editorStore.addEditorGroup(group);

      return group;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建编辑器组失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取编辑器组列表
   */
  async getEditorGroups(): Promise<any[]> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/editor-groups`);

      if (!response.ok) {
        throw new Error(`Failed to get editor groups: ${response.statusText}`);
      }

      const result = await response.json();
      const groups = result.data || [];

      // 批量同步到 store
      this.editorStore.setEditorGroups(groups);

      return groups;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取编辑器组列表失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 删除编辑器组
   */
  async deleteEditorGroup(uuid: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/editor-groups/${uuid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete editor group: ${response.statusText}`);
      }

      // 从缓存中移除
      this.editorStore.removeEditorGroup(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除编辑器组失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  // ===== 源码控制操作 =====

  /**
   * 获取仓库列表
   */
  async getSourceControlRepositories(): Promise<any[]> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/source-control/repositories`);

      if (!response.ok) {
        throw new Error(`Failed to get repositories: ${response.statusText}`);
      }

      const result = await response.json();
      const repositories = result.data || [];

      // 同步到 store
      this.editorStore.setSourceControlRepositories(repositories);

      return repositories;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库列表失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取文件变更
   */
  async getFileChanges(repositoryPath?: string): Promise<any[]> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const url = new URL(`${this.baseUrl}/source-control/changes`, window.location.origin);
      if (repositoryPath) {
        url.searchParams.append('repository', repositoryPath);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to get file changes: ${response.statusText}`);
      }

      const result = await response.json();
      const changes = result.data || [];

      // 同步到 store
      this.editorStore.setFileChanges(changes);

      return changes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取文件变更失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 暂存文件
   */
  async stageFile(filePath: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/source-control/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        throw new Error(`Failed to stage file: ${response.statusText}`);
      }

      // 更新本地状态
      this.editorStore.stageFile(filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂存文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 取消暂存文件
   */
  async unstageFile(filePath: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/source-control/unstage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        throw new Error(`Failed to unstage file: ${response.statusText}`);
      }

      // 更新本地状态
      this.editorStore.unstageFile(filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消暂存文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 提交变更
   */
  async commitChanges(message: string): Promise<any> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await fetch(`${this.baseUrl}/source-control/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Failed to commit changes: ${response.statusText}`);
      }

      const result = await response.json();

      // 清除暂存的变更
      this.editorStore.setStagedChanges([]);

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交变更失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  // ===== 工作区操作 =====

  /**
   * 打开文件
   */
  async openFile(path: string): Promise<any> {
    try {
      // 先从缓存获取文件信息
      let file = this.editorStore.getFileByPath(path);

      if (!file) {
        // 如果缓存中没有，从服务器获取
        const content = await this.getFileContent(path);
        file = {
          path,
          content,
          name: path.split('/').pop() || '',
          type: path.split('.').pop() || 'text',
          uuid: path, // 使用路径作为唯一标识
        };
        this.editorStore.addFile(file);
      }

      // 打开文件
      this.editorStore.openFile(file);

      return file;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '打开文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    }
  }

  /**
   * 关闭文件
   */
  closeFile(path: string): void {
    this.editorStore.closeFile(path);
  }

  /**
   * 切换到文件
   */
  switchToFile(file: any): void {
    this.editorStore.setCurrentFile(file);
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有编辑器数据到 store
   */
  async syncAllEditorData(): Promise<{
    filesCount: number;
    editorGroupsCount: number;
    repositoriesCount: number;
  }> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      // 并行获取所有数据
      const [files, editorGroups, repositories, changes] = await Promise.all([
        this.getFiles({ limit: 1000 }),
        this.getEditorGroups(),
        this.getSourceControlRepositories(),
        this.getFileChanges(),
      ]);

      // 批量同步到 store
      this.editorStore.syncAllData({
        files,
        editorGroups,
        sourceControlRepositories: repositories,
        fileChanges: changes,
      });

      console.log(
        `成功同步数据: ${files.length} 个文件, ${editorGroups.length} 个编辑器组, ${repositories.length} 个仓库`,
      );

      return {
        filesCount: files.length,
        editorGroupsCount: editorGroups.length,
        repositoriesCount: repositories.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有编辑器数据失败';
      this.editorStore.setError(errorMessage);
      console.error('同步所有编辑器数据失败:', error);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    return (
      !this.editorStore.isInitialized ||
      (this.editorStore.getAllFiles.length === 0 &&
        this.editorStore.getAllEditorGroups.length === 0) ||
      this.editorStore.shouldRefreshCache
    );
  }

  // ===== 工具方法 =====

  /**
   * 获取 Editor Store 实例
   */
  getStore() {
    return this.editorStore;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      this.editorStore.initialize();

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('开始同步所有编辑器数据...');
        await this.syncAllEditorData();
      } else {
        console.log('使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('Editor 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      if (!this.editorStore.isInitialized) {
        this.editorStore.initialize();
      }
      throw error;
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('强制重新同步所有数据...');
    await this.syncAllEditorData();
  }
}
