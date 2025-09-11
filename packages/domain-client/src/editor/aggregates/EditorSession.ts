import { EditorSessionCore, EditorGroupCore, EditorLayoutCore } from '@dailyuse/domain-core';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorSessionDTO = EditorContracts.EditorSessionDTO;

/**
 * 客户端 EditorSession 聚合根
 * 继承核心 EditorSession 类，添加客户端特有功能
 */
export class EditorSession extends EditorSessionCore {
  private _localSettings?: Record<string, any>;
  private _recentFiles: string[];
  private _searchHistory: string[];

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    groups?: EditorGroupCore[];
    activeGroupId?: string | null;
    layout: EditorLayoutCore;
    autoSave?: boolean;
    autoSaveInterval?: number;
    lastSavedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    // 客户端特有字段
    localSettings?: Record<string, any>;
    recentFiles?: string[];
    searchHistory?: string[];
  }) {
    super(params);

    this._localSettings = params.localSettings;
    this._recentFiles = params.recentFiles || [];
    this._searchHistory = params.searchHistory || [];
  }

  // ===== 实现抽象方法 =====

  /**
   * 转换为DTO
   */
  toDTO(): EditorSessionDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      groups: this.groups.map((group) => group.toDTO()),
      activeGroupId: this.activeGroupId,
      layout: this.layout.toDTO(),
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
      lastSavedAt: this.lastSavedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== Getter 方法 =====
  get localSettings(): Record<string, any> | undefined {
    return this._localSettings;
  }
  get recentFiles(): string[] {
    return [...this._recentFiles];
  }
  get searchHistory(): string[] {
    return [...this._searchHistory];
  }

  // ===== 客户端特有方法 =====

  /**
   * 更新本地设置
   */
  updateLocalSettings(settings: Record<string, any>): void {
    this._localSettings = { ...this._localSettings, ...settings };
    this.updateTimestamp();
  }

  /**
   * 清除本地设置
   */
  clearLocalSettings(): void {
    this._localSettings = undefined;
    this.updateTimestamp();
  }

  /**
   * 添加最近打开的文件
   */
  addRecentFile(filePath: string): void {
    // 移除已存在的路径
    this._recentFiles = this._recentFiles.filter((path) => path !== filePath);
    // 添加到开头
    this._recentFiles.unshift(filePath);
    // 限制数量
    if (this._recentFiles.length > 20) {
      this._recentFiles = this._recentFiles.slice(0, 20);
    }
    this.updateTimestamp();
  }

  /**
   * 移除最近文件
   */
  removeRecentFile(filePath: string): void {
    this._recentFiles = this._recentFiles.filter((path) => path !== filePath);
    this.updateTimestamp();
  }

  /**
   * 清除最近文件
   */
  clearRecentFiles(): void {
    this._recentFiles = [];
    this.updateTimestamp();
  }

  /**
   * 添加搜索历史
   */
  addSearchHistory(query: string): void {
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    // 移除已存在的查询
    this._searchHistory = this._searchHistory.filter((q) => q !== trimmedQuery);
    // 添加到开头
    this._searchHistory.unshift(trimmedQuery);
    // 限制数量
    if (this._searchHistory.length > 50) {
      this._searchHistory = this._searchHistory.slice(0, 50);
    }
    this.updateTimestamp();
  }

  /**
   * 移除搜索历史
   */
  removeSearchHistory(query: string): void {
    this._searchHistory = this._searchHistory.filter((q) => q !== query);
    this.updateTimestamp();
  }

  /**
   * 清除搜索历史
   */
  clearSearchHistory(): void {
    this._searchHistory = [];
    this.updateTimestamp();
  }

  /**
   * 快速访问文件
   */
  quickOpenFile(filePath: string): void {
    this.addRecentFile(filePath);

    // 如果当前没有活动组，创建一个
    if (!this.activeGroup) {
      const group = this.groups[0];
      if (group) {
        this.setActiveGroup(group.uuid);
      }
    }
  }

  /**
   * 搜索文件
   */
  searchFiles(query: string): string[] {
    this.addSearchHistory(query);

    // 在最近文件中搜索
    return this._recentFiles.filter((path) => path.toLowerCase().includes(query.toLowerCase()));
  }

  /**
   * 获取会话统计信息
   */
  getSessionStats(): {
    totalGroups: number;
    totalTabs: number;
    activeTabs: number;
    unsavedFiles: number;
    recentFilesCount: number;
    searchHistoryCount: number;
  } {
    return {
      totalGroups: this.groups.length,
      totalTabs: this.totalTabs,
      activeTabs: this.activeTabs,
      unsavedFiles: this.unsavedFiles,
      recentFilesCount: this._recentFiles.length,
      searchHistoryCount: this._searchHistory.length,
    };
  }

  /**
   * 导出会话配置
   */
  exportConfig(): Record<string, any> {
    return {
      uuid: this.uuid,
      name: this.name,
      layout: this.layout.toDTO(),
      groups: this.groups.map((group) => group.toDTO()),
      localSettings: this._localSettings,
      recentFiles: this._recentFiles,
      searchHistory: this._searchHistory,
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
    };
  }

  /**
   * 导入会话配置
   */
  importConfig(config: Record<string, any>): void {
    if (config.name) this.updateName(config.name);
    if (config.localSettings) this._localSettings = config.localSettings;
    if (config.recentFiles) this._recentFiles = config.recentFiles;
    if (config.searchHistory) this._searchHistory = config.searchHistory;
    if (config.autoSave !== undefined) {
      this.setAutoSave(config.autoSave, config.autoSaveInterval);
    }

    this.updateTimestamp();
  }

  /**
   * 重置会话状态
   */
  resetSession(): void {
    this.clearLocalSettings();
    this.clearRecentFiles();
    this.clearSearchHistory();
    this.updateTimestamp();
  }
}
