import { EditorSessionCore } from '@dailyuse/domain-core';
import { EditorGroup } from '../entities/EditorGroup';
import { EditorTab } from '../entities/EditorTab';
import { EditorLayout } from '../entities/EditorLayout';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorSessionDTO = EditorContracts.EditorSessionDTO;
type CreateEditorGroupRequest = EditorContracts.CreateEditorGroupRequest;
type CreateEditorTabRequest = EditorContracts.CreateEditorTabRequest;
type SupportedFileType = EditorContracts.SupportedFileType;
type BatchCreateTabsRequest = EditorContracts.BatchCreateTabsRequest;

/**
 * 客户端 EditorSession 聚合根
 * 使用组合模式包装核心 EditorSession，添加客户端特有功能和变更跟踪
 */
export class EditorSession {
  private _core: EditorSessionCore;
  private _groups: EditorGroup[] = [];
  private _layout: EditorLayout | null = null;

  // 客户端特有状态
  private _changeTracker: {
    isEditing: boolean;
    editStartTime?: Date;
    changedFields: Set<string>;
    originalValues: Record<string, any>;
  };

  private _uiState: {
    isMinimized: boolean;
    isMaximized: boolean;
    isFullscreen: boolean;
    isVisible: boolean;
    zIndex: number;
    position?: { x: number; y: number };
    lastFocusedAt?: Date;
    notifications: Array<{
      id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      message: string;
      timestamp: Date;
      dismissed?: boolean;
    }>;
  };

  private _localSettings: {
    enableAutoSave: boolean;
    autoSaveInterval: number;
    enableNotifications: boolean;
    enableKeyboardShortcuts: boolean;
    defaultFileEncoding: string;
    maxRecentFiles: number;
    enableFileWatcher: boolean;
  };

  constructor(data: EditorSessionDTO | EditorSessionCore) {
    if (data instanceof EditorSessionCore) {
      this._core = data;
    } else {
      // 从DTO创建核心实例
      this._core = new (EditorSessionCore as any)({
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        name: data.name,
        groups: [],
        activeGroupId: data.activeGroupId,
        layout: this.createDefaultLayoutCore(data.accountUuid),
        autoSave: data.autoSave,
        autoSaveInterval: data.autoSaveInterval,
        lastSavedAt: data.lastSavedAt ? new Date(data.lastSavedAt) : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      });
    }

    this._changeTracker = {
      isEditing: false,
      changedFields: new Set(),
      originalValues: {},
    };

    this._uiState = {
      isMinimized: false,
      isMaximized: false,
      isFullscreen: false,
      isVisible: true,
      zIndex: 1,
      notifications: [],
    };

    this._localSettings = {
      enableAutoSave: true,
      autoSaveInterval: 30,
      enableNotifications: true,
      enableKeyboardShortcuts: true,
      defaultFileEncoding: 'utf-8',
      maxRecentFiles: 10,
      enableFileWatcher: true,
    };
  }

  // ===== 委托核心属性 =====
  get uuid(): string {
    return this._core.uuid;
  }
  get accountUuid(): string {
    return this._core.accountUuid;
  }
  get name(): string {
    return this._core.name;
  }
  get activeGroupId(): string | null {
    return this._core.activeGroupId;
  }
  get autoSave(): boolean {
    return this._core.autoSave;
  }
  get autoSaveInterval(): number {
    return this._core.autoSaveInterval;
  }
  get lastSavedAt(): Date | undefined {
    return this._core.lastSavedAt;
  }
  get createdAt(): Date {
    return this._core.createdAt;
  }
  get updatedAt(): Date {
    return this._core.updatedAt;
  }

  // ===== 客户端特有属性 =====
  get groups(): EditorGroup[] {
    return [...this._groups];
  }
  get layout(): EditorLayout | null {
    return this._layout;
  }
  get layoutUuid(): string | null {
    return this._layout?.uuid || null;
  }

  get changeTracker() {
    return { ...this._changeTracker };
  }
  get uiState() {
    return { ...this._uiState };
  }
  get localSettings() {
    return { ...this._localSettings };
  }

  get isEditing(): boolean {
    return this._changeTracker.isEditing;
  }
  get hasChanges(): boolean {
    return this._changeTracker.changedFields.size > 0;
  }
  get isMinimized(): boolean {
    return this._uiState.isMinimized;
  }
  get isMaximized(): boolean {
    return this._uiState.isMaximized;
  }
  get isFullscreen(): boolean {
    return this._uiState.isFullscreen;
  }
  get isVisible(): boolean {
    return this._uiState.isVisible;
  }

  // ===== 变更跟踪方法 =====

  /**
   * 开始编辑模式
   */
  startEditing(): void {
    if (this._changeTracker.isEditing) return;

    this._changeTracker.isEditing = true;
    this._changeTracker.editStartTime = new Date();
    this._changeTracker.changedFields.clear();
    this._changeTracker.originalValues = this.captureCurrentState();
  }

  /**
   * 完成编辑模式
   */
  finishEditing(): void {
    this._changeTracker.isEditing = false;
    this._changeTracker.editStartTime = undefined;
    this._changeTracker.changedFields.clear();
    this._changeTracker.originalValues = {};
  }

  /**
   * 取消编辑并恢复原始值
   */
  cancelEditing(): void {
    if (!this._changeTracker.isEditing) return;

    // 恢复原始值
    const original = this._changeTracker.originalValues;
    if (original.name) this.updateName(original.name);
    if (original.autoSave !== undefined)
      this.setAutoSave(original.autoSave, original.autoSaveInterval);

    this.finishEditing();
  }

  /**
   * 记录字段变更
   */
  private trackChange(fieldName: string, newValue: any): void {
    if (!this._changeTracker.isEditing) return;

    this._changeTracker.changedFields.add(fieldName);
  }

  /**
   * 捕获当前状态
   */
  private captureCurrentState(): Record<string, any> {
    return {
      name: this.name,
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
      activeGroupId: this.activeGroupId,
    };
  }

  // ===== 委托核心方法并添加变更跟踪 =====

  /**
   * 更新会话名称
   */
  updateName(name: string): void {
    const oldValue = this.name;
    this._core.updateName(name);
    this.trackChange('name', name);
    this.addNotification('success', `会话名称已更新为: ${name}`);
  }

  /**
   * 设置自动保存
   */
  setAutoSave(enabled: boolean, interval?: number): void {
    const oldEnabled = this.autoSave;
    const oldInterval = this.autoSaveInterval;

    this._core.setAutoSave(enabled, interval);
    this.trackChange('autoSave', enabled);
    if (interval !== undefined) {
      this.trackChange('autoSaveInterval', interval);
    }

    this.addNotification(
      'info',
      enabled ? `自动保存已启用 (${interval || this.autoSaveInterval}秒)` : '自动保存已禁用',
    );
  }

  /**
   * 更新布局
   */
  updateLayout(layout: EditorLayout): void {
    this._layout = layout;
    this.trackChange('layout', layout);
    this.addNotification('success', '布局已更新');
  }

  // ===== 编辑器组管理 =====

  /**
   * 创建编辑器组
   */
  createGroup(request: CreateEditorGroupRequest): EditorGroup {
    const groupData = {
      uuid: this.generateUuid(),
      accountUuid: this.accountUuid,
      active: this._groups.length === 0,
      width: request.width,
      height: request.height || 600,
      activeTabId: null,
      title: request.title || `Group ${this._groups.length + 1}`,
      order: request.order ?? this._groups.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const group = new EditorGroup(groupData);
    this._groups.push(group);

    // 如果是第一个组，自动设为活动组
    if (this._groups.length === 1) {
      this.setActiveGroup(group.uuid);
    }

    this.trackChange('groups', this._groups);
    this.addNotification('success', `编辑器组 "${group.title}" 已创建`);
    return group;
  }

  /**
   * 删除编辑器组
   */
  removeGroup(groupId: string): void {
    const index = this._groups.findIndex((g) => g.uuid === groupId);
    if (index === -1) {
      throw new Error(`编辑器组不存在: ${groupId}`);
    }

    const group = this._groups[index];

    // 检查是否有未保存的标签页
    const unsavedTabs = group.tabs.filter((tab: any) => tab.isDirty);
    if (unsavedTabs.length > 0) {
      this.addNotification(
        'warning',
        `编辑器组 "${group.title}" 包含 ${unsavedTabs.length} 个未保存的文件`,
      );
    }

    // 如果删除的是活动组，需要重新设置活动组
    if (this.activeGroupId === groupId) {
      const remainingGroups = this._groups.filter((g) => g.uuid !== groupId);
      this.setActiveGroup(remainingGroups.length > 0 ? remainingGroups[0].uuid : null);
    }

    this._groups.splice(index, 1);
    this.trackChange('groups', this._groups);
    this.addNotification('info', `编辑器组 "${group.title}" 已删除`);
  }

  /**
   * 获取指定的编辑器组
   */
  getGroup(groupId: string): EditorGroup | undefined {
    return this._groups.find((g) => g.uuid === groupId);
  }

  /**
   * 获取活动编辑器组
   */
  getActiveGroup(): EditorGroup | undefined {
    return this.activeGroupId ? this.getGroup(this.activeGroupId) : undefined;
  }

  /**
   * 设置活动编辑器组
   */
  setActiveGroup(groupId: string | null): void {
    if (groupId && !this._groups.some((g) => g.uuid === groupId)) {
      throw new Error(`编辑器组不存在: ${groupId}`);
    }

    // 取消所有组的激活状态
    this._groups.forEach((g) => g.setActive(false));

    // 激活指定组
    if (groupId) {
      const group = this.getGroup(groupId);
      if (group) {
        group.setActive(true);
      }
    }

    this._core.setActiveGroup(groupId);
    this.trackChange('activeGroupId', groupId);
  }

  // ===== 标签页管理 =====

  /**
   * 创建编辑器标签页
   */
  createTab(groupUuid: string, request: CreateEditorTabRequest): EditorTab {
    const group = this.getGroup(groupUuid);
    if (!group) {
      throw new Error(`编辑器组不存在: ${groupUuid}`);
    }

    // 检查是否已存在相同路径的标签页
    const existingTab = this.findTabByPath(request.path);
    if (existingTab) {
      // 激活现有标签页
      const existingGroup = this.findGroupContainingTab(existingTab.uuid);
      if (existingGroup?.uuid === groupUuid) {
        group.setActiveTab(existingTab.uuid);
      }
      this.addNotification('info', `文件 "${request.path}" 已在编辑器中打开`);
      return existingTab;
    }

    const tabData = {
      uuid: this.generateUuid(),
      title: request.title || this.extractFileName(request.path),
      path: request.path,
      active: true,
      isPreview: request.isPreview || false,
      fileType: request.fileType || this.detectFileType(request.path),
      isDirty: false,
      content: request.content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tab = new EditorTab(tabData);
    group.addTab(tab);

    this.addNotification('success', `文件 "${tab.title}" 已打开`);
    return tab;
  }

  /**
   * 批量创建标签页
   */
  batchCreateTabs(groupUuid: string, request: BatchCreateTabsRequest): EditorTab[] {
    const group = this.getGroup(groupUuid);
    if (!group) {
      throw new Error(`编辑器组不存在: ${groupUuid}`);
    }

    const createdTabs: EditorTab[] = [];

    for (const tabRequest of request.tabs) {
      try {
        const tab = this.createTab(groupUuid, tabRequest);
        createdTabs.push(tab);
      } catch (error) {
        this.addNotification('error', `创建标签页失败: ${tabRequest.path}`);
      }
    }

    this.addNotification('success', `成功创建 ${createdTabs.length} 个标签页`);
    return createdTabs;
  }

  /**
   * 查找标签页（跨所有组）
   */
  findTab(tabUuid: string): EditorTab | null {
    for (const group of this._groups) {
      const tab = group.findTab(tabUuid);
      if (tab) return tab;
    }
    return null;
  }

  /**
   * 按路径查找标签页
   */
  findTabByPath(path: string): EditorTab | null {
    for (const group of this._groups) {
      const tab = group.findTabByPath(path);
      if (tab) return tab;
    }
    return null;
  }

  /**
   * 查找包含指定标签页的组
   */
  findGroupContainingTab(tabUuid: string): EditorGroup | null {
    return this._groups.find((group) => group.findTab(tabUuid) !== null) || null;
  }

  /**
   * 获取所有标签页
   */
  getAllTabs(): EditorTab[] {
    return this._groups.flatMap((g) => g.tabs);
  }

  /**
   * 设置活动标签页
   */
  setActiveTab(groupUuid: string, tabUuid: string): void {
    const group = this.getGroup(groupUuid);
    if (!group) {
      throw new Error(`编辑器组不存在: ${groupUuid}`);
    }

    const tab = group.findTab(tabUuid);
    if (!tab) {
      throw new Error(`标签页不存在: ${tabUuid}`);
    }

    // 取消其他组中标签页的激活状态
    this._groups.forEach((g) => {
      if (g.uuid !== groupUuid) {
        g.tabs.forEach((t: any) => t.setActive(false));
      }
    });

    // 激活指定标签页
    group.setActiveTab(tabUuid);

    // 确保所在组也是活动组
    if (this.activeGroupId !== groupUuid) {
      this.setActiveGroup(groupUuid);
    }

    this._uiState.lastFocusedAt = new Date();
  }

  // ===== 文件操作辅助方法 =====

  /**
   * 从路径提取文件名
   */
  private extractFileName(path: string): string {
    return path.split('/').pop() || path.split('\\').pop() || path;
  }

  /**
   * 检测文件类型
   */
  private detectFileType(path: string): SupportedFileType {
    const extension = path.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, SupportedFileType> = {
      ts: 'typescript' as SupportedFileType,
      js: 'javascript' as SupportedFileType,
      vue: 'javascript' as SupportedFileType, // VUE类型在枚举中不存在，使用javascript
      json: 'json' as SupportedFileType,
      md: 'markdown' as SupportedFileType,
      css: 'css' as SupportedFileType,
      html: 'html' as SupportedFileType,
      py: 'python' as SupportedFileType,
      java: 'text' as SupportedFileType, // JAVA类型在枚举中不存在，使用text
      go: 'text' as SupportedFileType, // GO类型在枚举中不存在，使用text
      rs: 'text' as SupportedFileType, // RUST类型在枚举中不存在，使用text
      c: 'text' as SupportedFileType, // C类型在枚举中不存在，使用text
      cpp: 'text' as SupportedFileType, // CPP类型在枚举中不存在，使用text
      h: 'text' as SupportedFileType, // C头文件，使用text
      hpp: 'text' as SupportedFileType, // CPP头文件，使用text
    };

    return typeMap[extension || ''] || ('text' as SupportedFileType);
  }

  // ===== UI状态管理 =====

  /**
   * 设置窗口状态
   */
  setWindowState(state: {
    isMinimized?: boolean;
    isMaximized?: boolean;
    isFullscreen?: boolean;
    isVisible?: boolean;
    position?: { x: number; y: number };
  }): void {
    if (state.isMinimized !== undefined) this._uiState.isMinimized = state.isMinimized;
    if (state.isMaximized !== undefined) this._uiState.isMaximized = state.isMaximized;
    if (state.isFullscreen !== undefined) this._uiState.isFullscreen = state.isFullscreen;
    if (state.isVisible !== undefined) this._uiState.isVisible = state.isVisible;
    if (state.position !== undefined) this._uiState.position = state.position;

    this.trackChange('uiState', this._uiState);
  }

  /**
   * 设置z-index
   */
  setZIndex(zIndex: number): void {
    this._uiState.zIndex = zIndex;
    this.trackChange('uiState', this._uiState);
  }

  /**
   * 记录最后聚焦时间
   */
  focus(): void {
    this._uiState.lastFocusedAt = new Date();
    this._uiState.isVisible = true;
  }

  // ===== 通知管理 =====

  /**
   * 添加通知
   */
  addNotification(type: 'info' | 'warning' | 'error' | 'success', message: string): void {
    if (!this._localSettings.enableNotifications) return;

    const notification = {
      id: this.generateUuid(),
      type,
      message,
      timestamp: new Date(),
      dismissed: false,
    };

    this._uiState.notifications.push(notification);

    // 限制通知数量
    if (this._uiState.notifications.length > 20) {
      this._uiState.notifications = this._uiState.notifications.slice(-10);
    }
  }

  /**
   * 标记通知为已读
   */
  dismissNotification(notificationId: string): void {
    const notification = this._uiState.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
    }
  }

  /**
   * 清除所有通知
   */
  clearNotifications(): void {
    this._uiState.notifications = [];
  }

  /**
   * 获取未读通知
   */
  getUnreadNotifications() {
    return this._uiState.notifications.filter((n) => !n.dismissed);
  }

  // ===== 本地设置管理 =====

  /**
   * 更新本地设置
   */
  updateLocalSettings(settings: Partial<typeof this._localSettings>): void {
    this._localSettings = { ...this._localSettings, ...settings };
    this.trackChange('localSettings', this._localSettings);
  }

  // ===== 统计信息 =====

  /**
   * 获取会话统计信息
   */
  getStatistics(): {
    totalGroups: number;
    totalTabs: number;
    activeTabs: number;
    unsavedFiles: number;
    totalNotifications: number;
    unreadNotifications: number;
    editingTime?: number;
    lastActivity?: Date;
  } {
    const editingTime = this._changeTracker.editStartTime
      ? Date.now() - this._changeTracker.editStartTime.getTime()
      : undefined;

    return {
      totalGroups: this._groups.length,
      totalTabs: this.getAllTabs().length,
      activeTabs: this.getAllTabs().filter((t) => t.active).length,
      unsavedFiles: this.getAllTabs().filter((t) => t.isDirty).length,
      totalNotifications: this._uiState.notifications.length,
      unreadNotifications: this.getUnreadNotifications().length,
      editingTime,
      lastActivity: this._uiState.lastFocusedAt || this.updatedAt,
    };
  }

  // ===== 辅助方法 =====

  /**
   * 生成UUID
   */
  private generateUuid(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 创建默认布局核心实例
   */
  private createDefaultLayoutCore(accountUuid: string) {
    // 这里需要根据实际的EditorLayoutCore构造器调整
    return null as any; // 临时返回null，需要实际实现
  }

  // ===== DTO转换 =====

  /**
   * 转换为DTO
   */
  toDTO(): EditorSessionDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      activeGroupId: this.activeGroupId,
      layoutUuid: this.layoutUuid,
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
      lastSavedAt: this.lastSavedAt?.getTime(),
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }

  /**
   * 转换为完整DTO（包含关联数据）
   */
  toFullDTO(): EditorSessionDTO & {
    groups: Array<ReturnType<EditorGroup['toDTO']>>;
    layout: ReturnType<EditorLayout['toDTO']> | null;
  } {
    return {
      ...this.toDTO(),
      groups: this._groups.map((g) => g.toDTO()),
      layout: this._layout?.toDTO() || null,
    };
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): EditorSession {
    const cloned = new EditorSession(this.toDTO());

    // 深拷贝组
    cloned._groups = this._groups.map((g) => g.clone());

    // 深拷贝布局
    cloned._layout = this._layout?.clone() || null;

    // 深拷贝客户端状态
    cloned._uiState = {
      ...this._uiState,
      notifications: this._uiState.notifications.map((n) => ({ ...n })),
      position: this._uiState.position ? { ...this._uiState.position } : undefined,
    };

    cloned._localSettings = { ...this._localSettings };

    return cloned;
  }
}
