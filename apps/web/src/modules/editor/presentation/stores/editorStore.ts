import { defineStore } from 'pinia';

/**
 * Editor Store - 新架构
 * 负责编辑器相关数据的纯缓存存储
 * 采用缓存优先策略，与外部服务解耦
 */
export const useEditorStore = defineStore('editor', {
  state: () => ({
    // ===== 文件管理 =====
    files: [] as any[], // 所有文件对象
    openedFiles: [] as any[], // 已打开的文件
    currentFile: null as any,
    recentFiles: [] as any[], // 最近使用的文件

    // ===== 编辑器状态 =====
    editorGroups: [] as any[], // 编辑器组
    activeEditorGroup: null as string | null,

    // ===== 布局状态 =====
    layout: {
      activityBarWidth: 45,
      sidebarWidth: 160,
      minSidebarWidth: 0,
      resizeHandleSidebarWidth: 5,
      minEditorWidth: 300,
      editorTabWidth: 150,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    },

    // ===== UI 状态 =====
    ui: {
      isSidebarVisible: true,
      isActivityBarVisible: true,
      activePanel: null as string | null,
      sidebarActiveView: 'explorer',
    },

    // ===== 状态管理 =====
    isLoading: false,
    error: null as string | null,
    isInitialized: false,

    // ===== 源码控制 =====
    sourceControl: {
      repositories: [] as any[],
      changes: [] as any[],
      staged: [] as any[],
      activeRepository: null as string | null,
    },

    // ===== 缓存管理 =====
    lastSyncTime: null as Date | null,
    cacheExpiry: 30 * 60 * 1000, // 30分钟

    // ===== 编辑器设置 =====
    settings: {
      theme: 'dark',
      fontSize: 14,
      wordWrap: true,
      minimap: true,
      autoSave: true,
    },
  }),

  getters: {
    // ===== 文件相关 =====

    /**
     * 获取所有文件
     */
    getAllFiles(state): any[] {
      return state.files;
    },

    /**
     * 获取已打开的文件
     */
    getOpenedFiles(state): any[] {
      return state.openedFiles;
    },

    /**
     * 获取当前文件
     */
    getCurrentFile(state): any | null {
      return state.currentFile;
    },

    /**
     * 获取最近使用的文件
     */
    getRecentFiles(state): any[] {
      return state.recentFiles;
    },

    /**
     * 根据路径获取文件
     */
    getFileByPath:
      (state) =>
      (path: string): any | null => {
        return state.files.find((f) => f.path === path) || null;
      },

    /**
     * 根据UUID获取文件
     */
    getFileByUuid:
      (state) =>
      (uuid: string): any | null => {
        return state.files.find((f) => f.uuid === uuid) || null;
      },

    /**
     * 检查文件是否已打开
     */
    isFileOpened:
      (state) =>
      (path: string): boolean => {
        return state.openedFiles.some((f) => f.path === path);
      },

    // ===== 编辑器组相关 =====

    /**
     * 获取所有编辑器组
     */
    getAllEditorGroups(state): any[] {
      return state.editorGroups;
    },

    /**
     * 获取活跃编辑器组
     */
    getActiveEditorGroup(state): any | null {
      if (!state.activeEditorGroup) return null;
      return state.editorGroups.find((g) => g.uuid === state.activeEditorGroup) || null;
    },

    /**
     * 根据UUID获取编辑器组
     */
    getEditorGroupByUuid:
      (state) =>
      (uuid: string): any | null => {
        return state.editorGroups.find((g) => g.uuid === uuid) || null;
      },

    // ===== 布局相关 =====

    /**
     * 获取有效的侧边栏宽度
     */
    getEffectiveSidebarWidth(state): number {
      return state.ui.isSidebarVisible ? state.layout.sidebarWidth : 0;
    },

    /**
     * 获取编辑器组宽度
     */
    getEditorGroupsWidth(state): number {
      const availableWidth =
        state.layout.windowWidth -
        state.layout.activityBarWidth -
        state.layout.resizeHandleSidebarWidth;
      const sidebarWidth = state.ui.isSidebarVisible ? state.layout.sidebarWidth : 0;
      return availableWidth - sidebarWidth;
    },

    /**
     * 获取编辑器可用高度
     */
    getEditorHeight(state): number {
      return state.layout.windowHeight - 30; // 减去标题栏高度
    },

    // ===== 源码控制相关 =====

    /**
     * 获取源码控制仓库
     */
    getSourceControlRepositories(state): any[] {
      return state.sourceControl.repositories;
    },

    /**
     * 获取活跃仓库
     */
    getActiveRepository(state): any | null {
      if (!state.sourceControl.activeRepository) return null;
      return (
        state.sourceControl.repositories.find(
          (r) => r.uuid === state.sourceControl.activeRepository,
        ) || null
      );
    },

    /**
     * 获取文件变更
     */
    getFileChanges(state): any[] {
      return state.sourceControl.changes;
    },

    /**
     * 获取暂存的变更
     */
    getStagedChanges(state): any[] {
      return state.sourceControl.staged;
    },

    // ===== 统计信息 =====

    /**
     * 编辑器统计
     */
    getEditorStatistics(state): {
      totalFiles: number;
      openedFiles: number;
      recentFiles: number;
      editorGroups: number;
      changes: number;
      staged: number;
    } {
      return {
        totalFiles: state.files.length,
        openedFiles: state.openedFiles.length,
        recentFiles: state.recentFiles.length,
        editorGroups: state.editorGroups.length,
        changes: state.sourceControl.changes.length,
        staged: state.sourceControl.staged.length,
      };
    },

    // ===== 缓存管理 =====

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(state): boolean {
      if (!state.lastSyncTime) return true;
      const now = new Date();
      const timeDiff = now.getTime() - state.lastSyncTime.getTime();
      return timeDiff > state.cacheExpiry;
    },
  },

  actions: {
    // ===== 状态管理 =====

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * 标记为已初始化
     */
    setInitialized(initialized: boolean) {
      this.isInitialized = initialized;
    },

    /**
     * 更新最后同步时间
     */
    updateLastSyncTime() {
      this.lastSyncTime = new Date();
    },

    // ===== 文件操作 =====

    /**
     * 设置文件列表
     */
    setFiles(files: any[]) {
      this.files = files;
      this.updateLastSyncTime();
    },

    /**
     * 添加文件
     */
    addFile(file: any) {
      const existing = this.files.find((f) => f.path === file.path);
      if (existing) {
        const index = this.files.indexOf(existing);
        this.files[index] = file;
      } else {
        this.files.push(file);
      }
      this.updateLastSyncTime();
    },

    /**
     * 更新文件
     */
    updateFile(path: string, file: any) {
      const index = this.files.findIndex((f) => f.path === path);
      if (index !== -1) {
        this.files[index] = { ...this.files[index], ...file };
        this.updateLastSyncTime();
      }
    },

    /**
     * 删除文件
     */
    removeFile(path: string) {
      const index = this.files.findIndex((f) => f.path === path);
      if (index !== -1) {
        this.files.splice(index, 1);

        // 如果删除的是当前文件，清除当前文件状态
        if (this.currentFile?.path === path) {
          this.currentFile = null;
        }

        // 从已打开文件中移除
        this.closeFile(path);

        this.updateLastSyncTime();
      }
    },

    /**
     * 打开文件
     */
    openFile(file: any) {
      // 添加到已打开文件列表
      if (!this.openedFiles.find((f) => f.path === file.path)) {
        this.openedFiles.push(file);
      }

      // 设置为当前文件
      this.setCurrentFile(file);

      // 添加到最近使用文件
      this.addToRecentFiles(file);
    },

    /**
     * 关闭文件
     */
    closeFile(path: string) {
      const index = this.openedFiles.findIndex((f) => f.path === path);
      if (index !== -1) {
        this.openedFiles.splice(index, 1);

        // 如果关闭的是当前文件，切换到其他文件
        if (this.currentFile?.path === path) {
          const nextFile = this.openedFiles[index] || this.openedFiles[index - 1];
          this.currentFile = nextFile || null;
        }
      }
    },

    /**
     * 设置当前文件
     */
    setCurrentFile(file: any | null) {
      this.currentFile = file;
      if (file) {
        this.addToRecentFiles(file);
      }
    },

    /**
     * 添加到最近使用文件
     */
    addToRecentFiles(file: any) {
      // 移除已存在的
      const existing = this.recentFiles.findIndex((f) => f.path === file.path);
      if (existing !== -1) {
        this.recentFiles.splice(existing, 1);
      }

      // 添加到开头
      this.recentFiles.unshift(file);

      // 限制最近文件数量
      if (this.recentFiles.length > 20) {
        this.recentFiles = this.recentFiles.slice(0, 20);
      }
    },

    // ===== 编辑器组操作 =====

    /**
     * 设置编辑器组列表
     */
    setEditorGroups(groups: any[]) {
      this.editorGroups = groups;
      this.updateLastSyncTime();
    },

    /**
     * 添加编辑器组
     */
    addEditorGroup(group: any) {
      const existing = this.editorGroups.find((g) => g.uuid === group.uuid);
      if (existing) {
        const index = this.editorGroups.indexOf(existing);
        this.editorGroups[index] = group;
      } else {
        this.editorGroups.push(group);
      }
      this.updateLastSyncTime();
    },

    /**
     * 更新编辑器组
     */
    updateEditorGroup(uuid: string, group: any) {
      const index = this.editorGroups.findIndex((g) => g.uuid === uuid);
      if (index !== -1) {
        this.editorGroups[index] = { ...this.editorGroups[index], ...group };
        this.updateLastSyncTime();
      }
    },

    /**
     * 删除编辑器组
     */
    removeEditorGroup(uuid: string) {
      const index = this.editorGroups.findIndex((g) => g.uuid === uuid);
      if (index !== -1) {
        this.editorGroups.splice(index, 1);

        // 如果删除的是活跃编辑器组，清除活跃状态
        if (this.activeEditorGroup === uuid) {
          this.activeEditorGroup = null;
        }

        this.updateLastSyncTime();
      }
    },

    /**
     * 设置活跃编辑器组
     */
    setActiveEditorGroup(uuid: string | null) {
      this.activeEditorGroup = uuid;
    },

    // ===== 布局操作 =====

    /**
     * 更新窗口尺寸
     */
    updateWindowSize(width: number, height: number) {
      this.layout.windowWidth = width;
      this.layout.windowHeight = height;
    },

    /**
     * 设置侧边栏宽度
     */
    setSidebarWidth(width: number) {
      this.layout.sidebarWidth = Math.max(width, this.layout.minSidebarWidth);
    },

    /**
     * 切换侧边栏可见性
     */
    toggleSidebarVisibility() {
      this.ui.isSidebarVisible = !this.ui.isSidebarVisible;
    },

    /**
     * 设置侧边栏可见性
     */
    setSidebarVisibility(visible: boolean) {
      this.ui.isSidebarVisible = visible;
    },

    /**
     * 设置侧边栏活跃视图
     */
    setSidebarActiveView(view: string) {
      this.ui.sidebarActiveView = view;
    },

    /**
     * 设置活跃面板
     */
    setActivePanel(panel: string | null) {
      this.ui.activePanel = panel;
    },

    // ===== 源码控制操作 =====

    /**
     * 设置源码控制仓库
     */
    setSourceControlRepositories(repositories: any[]) {
      this.sourceControl.repositories = repositories;
      this.updateLastSyncTime();
    },

    /**
     * 设置活跃仓库
     */
    setActiveRepository(uuid: string | null) {
      this.sourceControl.activeRepository = uuid;
    },

    /**
     * 设置文件变更
     */
    setFileChanges(changes: any[]) {
      this.sourceControl.changes = changes;
      this.updateLastSyncTime();
    },

    /**
     * 设置暂存变更
     */
    setStagedChanges(staged: any[]) {
      this.sourceControl.staged = staged;
      this.updateLastSyncTime();
    },

    /**
     * 暂存文件
     */
    stageFile(filePath: string) {
      const changeIndex = this.sourceControl.changes.findIndex((c) => c.path === filePath);
      if (changeIndex !== -1) {
        const change = this.sourceControl.changes[changeIndex];
        this.sourceControl.changes.splice(changeIndex, 1);
        this.sourceControl.staged.push(change);
      }
    },

    /**
     * 取消暂存文件
     */
    unstageFile(filePath: string) {
      const stagedIndex = this.sourceControl.staged.findIndex((s) => s.path === filePath);
      if (stagedIndex !== -1) {
        const staged = this.sourceControl.staged[stagedIndex];
        this.sourceControl.staged.splice(stagedIndex, 1);
        this.sourceControl.changes.push(staged);
      }
    },

    // ===== 设置操作 =====

    /**
     * 更新设置
     */
    updateSettings(settings: Partial<typeof this.settings>) {
      this.settings = { ...this.settings, ...settings };
    },

    // ===== 批量操作 =====

    /**
     * 批量同步数据
     */
    syncAllData(data: {
      files?: any[];
      editorGroups?: any[];
      sourceControlRepositories?: any[];
      fileChanges?: any[];
      stagedChanges?: any[];
    }) {
      if (data.files) this.files = data.files;
      if (data.editorGroups) this.editorGroups = data.editorGroups;
      if (data.sourceControlRepositories)
        this.sourceControl.repositories = data.sourceControlRepositories;
      if (data.fileChanges) this.sourceControl.changes = data.fileChanges;
      if (data.stagedChanges) this.sourceControl.staged = data.stagedChanges;

      this.updateLastSyncTime();
      this.setInitialized(true);
    },

    /**
     * 清除所有数据
     */
    clearAllData() {
      this.files = [];
      this.openedFiles = [];
      this.currentFile = null;
      this.recentFiles = [];
      this.editorGroups = [];
      this.activeEditorGroup = null;
      this.sourceControl.repositories = [];
      this.sourceControl.changes = [];
      this.sourceControl.staged = [];
      this.sourceControl.activeRepository = null;
      this.error = null;
      this.lastSyncTime = null;
    },

    // ===== 缓存管理 =====

    /**
     * 从 localStorage 加载数据
     */
    loadFromCache() {
      try {
        const cached = localStorage.getItem('dailyuse_editor_cache');
        if (cached) {
          const data = JSON.parse(cached);

          if (data.files) this.files = data.files;
          if (data.openedFiles) this.openedFiles = data.openedFiles;
          if (data.currentFile) this.currentFile = data.currentFile;
          if (data.recentFiles) this.recentFiles = data.recentFiles;
          if (data.editorGroups) this.editorGroups = data.editorGroups;
          if (data.activeEditorGroup) this.activeEditorGroup = data.activeEditorGroup;
          if (data.layout) this.layout = { ...this.layout, ...data.layout };
          if (data.ui) this.ui = { ...this.ui, ...data.ui };
          if (data.settings) this.settings = { ...this.settings, ...data.settings };
          if (data.sourceControl)
            this.sourceControl = { ...this.sourceControl, ...data.sourceControl };
          if (data.lastSyncTime) this.lastSyncTime = new Date(data.lastSyncTime);

          this.setInitialized(true);
        }
      } catch (error) {
        console.error('加载编辑器缓存失败:', error);
      }
    },

    /**
     * 保存到 localStorage
     */
    saveToCache() {
      try {
        const data = {
          files: this.files,
          openedFiles: this.openedFiles,
          currentFile: this.currentFile,
          recentFiles: this.recentFiles,
          editorGroups: this.editorGroups,
          activeEditorGroup: this.activeEditorGroup,
          layout: this.layout,
          ui: this.ui,
          settings: this.settings,
          sourceControl: this.sourceControl,
          lastSyncTime: this.lastSyncTime?.toISOString(),
        };
        localStorage.setItem('dailyuse_editor_cache', JSON.stringify(data));
      } catch (error) {
        console.error('保存编辑器缓存失败:', error);
      }
    },

    /**
     * 清除缓存
     */
    clearCache() {
      try {
        localStorage.removeItem('dailyuse_editor_cache');
      } catch (error) {
        console.error('清除编辑器缓存失败:', error);
      }
    },

    /**
     * 初始化 Store
     */
    initialize() {
      if (!this.isInitialized) {
        this.loadFromCache();
      }
    },

    // ===== 监听数据变化，自动保存到缓存 =====

    /**
     * 监听数据变化并自动保存
     */
    $subscribe() {
      this.$subscribe((mutation, state) => {
        this.saveToCache();
      });
    },
  },
});
