import { useEditorStore } from '../stores/editorStore';
import { EditorWebApplicationService } from '../../application/services/EditorWebApplicationService';

/**
 * 编辑器组合函数
 * 提供组件级别的编辑器功能接口
 */
export function useEditor() {
  // 获取 store
  const editorStore = useEditorStore();

  // 懒加载应用服务
  let applicationService: EditorWebApplicationService | null = null;
  const getApplicationService = () => {
    if (!applicationService) {
      applicationService = new EditorWebApplicationService();
    }
    return applicationService;
  };

  // ===== Store 状态 =====

  const state = {
    // 文件相关
    get files() {
      return editorStore.getAllFiles;
    },
    get currentFile() {
      return editorStore.currentFile;
    },
    get openFiles() {
      return editorStore.openedFiles;
    },
    get recentFiles() {
      return editorStore.recentFiles;
    },

    // 编辑器组相关
    get editorGroups() {
      return editorStore.getAllEditorGroups;
    },
    get currentEditorGroup() {
      return editorStore.activeEditorGroup;
    },

    // 源码控制相关
    get sourceControlRepositories() {
      return editorStore.getSourceControlRepositories;
    },
    get fileChanges() {
      return editorStore.getFileChanges;
    },
    get stagedChanges() {
      return editorStore.getStagedChanges;
    },

    // 布局相关
    get layout() {
      return editorStore.layout;
    },
    get sidebarVisible() {
      return editorStore.ui.isSidebarVisible;
    },
    get panelVisible() {
      return editorStore.ui.activePanel !== null;
    },

    // 设置相关
    get editorSettings() {
      return editorStore.settings;
    },

    // 状态
    get isLoading() {
      return editorStore.isLoading;
    },
    get error() {
      return editorStore.error;
    },
    get isInitialized() {
      return editorStore.isInitialized;
    },
  };

  // ===== 文件操作 =====

  const files = {
    /**
     * 创建文件 (暂未实现)
     */
    async create(request: { path: string; content?: string; type?: string }) {
      console.warn('createFile not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },

    /**
     * 获取文件列表 (暂未实现)
     */
    async getAll(params?: { directory?: string; type?: string; limit?: number }) {
      console.warn('getFiles not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },

    /**
     * 获取文件内容 (暂未实现)
     */
    async getContent(path: string) {
      console.warn('getFileContent not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },

    /**
     * 保存文件内容 (暂未实现)
     */
    async saveContent(path: string, content: string) {
      console.warn('saveFileContent not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },

    /**
     * 删除文件 (暂未实现)
     */
    async delete(path: string) {
      console.warn('deleteFile not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },

    /**
     * 重命名文件 (暂未实现)
     */
    async rename(oldPath: string, newPath: string) {
      console.warn('renameFile not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },

    /**
     * 打开文件 (需要会话和组信息)
     */
    async open(path: string, sessionUuid?: string, groupUuid?: string) {
      if (!sessionUuid || !groupUuid) {
        console.warn('openFile requires sessionUuid and groupUuid in new architecture');
        throw new Error('sessionUuid and groupUuid are required');
      }
      return await getApplicationService().openFile(sessionUuid, groupUuid, path);
    },

    /**
     * 关闭文件 (需要会话和组信息)
     */
    async close(tabUuid: string, sessionUuid?: string, groupUuid?: string) {
      if (!sessionUuid || !groupUuid) {
        console.warn('closeFile requires sessionUuid and groupUuid in new architecture');
        throw new Error('sessionUuid and groupUuid are required');
      }
      return await getApplicationService().closeFile(sessionUuid, groupUuid, tabUuid);
    },

    /**
     * 切换到文件 (暂未实现)
     */
    switchTo(file: any) {
      editorStore.setCurrentFile(file);
    },

    /**
     * 从缓存获取文件
     */
    getByPath(path: string) {
      return editorStore.getFileByPath(path);
    },

    /**
     * 检查文件是否已打开
     */
    isOpen(path: string) {
      return editorStore.isFileOpened(path);
    },
  };

  // ===== 编辑器组操作 =====

  const editorGroups = {
    /**
     * 创建编辑器组 (需要会话信息)
     */
    async create(
      request: { name: string; position?: 'left' | 'right' | 'top' | 'bottom' },
      sessionUuid?: string,
    ) {
      if (!sessionUuid) {
        console.warn('createGroup requires sessionUuid in new architecture');
        throw new Error('sessionUuid is required');
      }
      return await getApplicationService().createGroup(sessionUuid, {
        width: 400,
        title: request.name,
        order: 0,
      });
    },

    /**
     * 获取所有编辑器组 (需要会话信息)
     */
    async getAll(sessionUuid?: string) {
      if (!sessionUuid) {
        console.warn('getGroups requires sessionUuid in new architecture');
        throw new Error('sessionUuid is required');
      }
      return await getApplicationService().getGroups(sessionUuid);
    },

    /**
     * 删除编辑器组 (需要会话信息)
     */
    async delete(uuid: string, sessionUuid?: string) {
      if (!sessionUuid) {
        console.warn('deleteGroup requires sessionUuid in new architecture');
        throw new Error('sessionUuid is required');
      }
      return await getApplicationService().deleteGroup(sessionUuid, uuid);
    },

    /**
     * 设置当前编辑器组
     */
    setCurrent(group: any) {
      editorStore.setActiveEditorGroup(group?.uuid || null);
    },

    /**
     * 从缓存获取编辑器组
     */
    getById(uuid: string) {
      return editorStore.getEditorGroupByUuid(uuid);
    },
  };

  // ===== 源码控制操作 (暂未实现) =====

  const sourceControl = {
    /**
     * 获取仓库列表 (暂未实现)
     */
    async getRepositories() {
      console.warn('Source control not implemented in new architecture');
      return [];
    },

    /**
     * 获取文件变更 (暂未实现)
     */
    async getFileChanges(repositoryPath?: string) {
      console.warn('Source control not implemented in new architecture');
      return [];
    },

    /**
     * 暂存文件 (暂未实现)
     */
    async stageFile(filePath: string) {
      console.warn('Source control not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },

    /**
     * 取消暂存文件 (暂未实现)
     */
    async unstageFile(filePath: string) {
      console.warn('Source control not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },

    /**
     * 提交变更 (暂未实现)
     */
    async commitChanges(message: string) {
      console.warn('Source control not implemented in new architecture');
      throw new Error('Method not implemented in new architecture');
    },
  };

  // ===== 布局操作 =====

  const layout = {
    /**
     * 设置布局配置
     */
    setLayout(layout: any) {
      Object.assign(editorStore.layout, layout);
    },

    /**
     * 切换侧边栏显示状态
     */
    toggleSidebar() {
      editorStore.toggleSidebarVisibility();
    },

    /**
     * 切换面板显示状态
     */
    togglePanel(panelType?: string) {
      if (panelType) {
        editorStore.setActivePanel(editorStore.ui.activePanel === panelType ? null : panelType);
      } else {
        editorStore.setActivePanel(editorStore.ui.activePanel ? null : 'terminal');
      }
    },

    /**
     * 设置编辑器区域布局
     */
    setEditorAreaLayout(layout: any) {
      Object.assign(editorStore.layout, layout);
    },
  };

  // ===== 设置操作 =====

  const settings = {
    /**
     * 更新编辑器设置
     */
    updateEditorSettings(settings: any) {
      editorStore.updateSettings(settings);
    },

    /**
     * 重置设置为默认值
     */
    resetToDefaults() {
      // 重置为默认设置
      editorStore.updateSettings({
        theme: 'light',
        fontSize: 14,
        wordWrap: true,
        autoSave: true,
        minimap: true,
      });
    },
  };

  // ===== 数据同步 =====

  const sync = {
    /**
     * 同步所有数据
     */
    async syncAll() {
      return await getApplicationService().syncAllEditorData();
    },

    /**
     * 检查是否需要同步
     */
    shouldSync() {
      return getApplicationService().shouldSyncData();
    },

    /**
     * 强制重新同步
     */
    async forceSync() {
      return await getApplicationService().forceSync();
    },

    /**
     * 初始化服务
     */
    async initialize() {
      return await getApplicationService().initialize();
    },
  };

  // ===== 工具方法 =====

  const utils = {
    /**
     * 清除错误状态
     */
    clearError() {
      editorStore.setError(null);
    },

    /**
     * 获取应用服务实例
     */
    getApplicationService() {
      return getApplicationService();
    },

    /**
     * 获取 Store 实例
     */
    getStore() {
      return editorStore;
    },

    /**
     * 刷新缓存
     */
    refreshCache() {
      // 通过重新同步来刷新缓存
      return getApplicationService().forceSync();
    },
  };

  return {
    // 状态
    state,

    // 功能模块
    files,
    editorGroups,
    sourceControl,
    layout,
    settings,
    sync,
    utils,
  };
}
