/**
 * EditorCore - 编辑器核心聚合根
 * 包含编辑器组和标签页的核心业务逻辑
 */

import { Entity } from '@dailyuse/utils';
import { EditorContracts } from '@dailyuse/contracts';

// 使用 EditorContracts 的类型定义
type IEditorGroup = EditorContracts.IEditorGroup;
type IEditorTab = EditorContracts.IEditorTab;
type IEditorLayout = EditorContracts.IEditorLayout;
type IEditorSession = EditorContracts.EditorSessionDTO;
type SupportedFileType = EditorContracts.SupportedFileType;
type EditorGroupDTO = EditorContracts.EditorGroupDTO;
type EditorTabDTO = EditorContracts.EditorTabDTO;
type EditorLayoutDTO = EditorContracts.EditorLayoutDTO;
type EditorSessionDTO = EditorContracts.EditorSessionDTO;

/**
 * 编辑器会话核心聚合根
 */
export abstract class EditorSessionCore extends Entity {
  protected _accountUuid: string;
  protected _name: string;
  protected _groups: EditorGroupCore[];
  protected _activeGroupId: string | null;
  protected _layout: EditorLayoutCore;
  protected _autoSave: boolean;
  protected _autoSaveInterval: number;
  protected _lastSavedAt?: Date;
  protected _createdAt: Date;
  protected _updatedAt: Date;

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
  }) {
    super(params.uuid || Entity.generateUUID());

    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._groups = params.groups || [];
    this._activeGroupId = params.activeGroupId || null;
    this._layout = params.layout;
    this._autoSave = params.autoSave || true;
    this._autoSaveInterval = params.autoSaveInterval || 30; // 30秒
    this._lastSavedAt = params.lastSavedAt;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();

    this.validateSession();
  }

  // ============ Getter 方法 ============
  get accountUuid(): string {
    return this._accountUuid;
  }
  get name(): string {
    return this._name;
  }
  get groups(): EditorGroupCore[] {
    return [...this._groups];
  }
  get activeGroupId(): string | null {
    return this._activeGroupId;
  }
  get layout(): EditorLayoutCore {
    return this._layout;
  }
  get autoSave(): boolean {
    return this._autoSave;
  }
  get autoSaveInterval(): number {
    return this._autoSaveInterval;
  }
  get lastSavedAt(): Date | undefined {
    return this._lastSavedAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============ 计算属性 ============
  get totalTabs(): number {
    return this._groups.reduce((sum, group) => sum + group.tabs.length, 0);
  }

  get activeTabs(): number {
    return this._groups.reduce(
      (sum, group) => sum + group.tabs.filter((tab) => tab.active).length,
      0,
    );
  }

  get unsavedFiles(): number {
    return this._groups.reduce(
      (sum, group) => sum + group.tabs.filter((tab) => tab.isDirty).length,
      0,
    );
  }

  get hasUnsavedChanges(): boolean {
    return this.unsavedFiles > 0;
  }

  get activeGroup(): EditorGroupCore | null {
    return this._groups.find((group) => group.uuid === this._activeGroupId) || null;
  }

  // ============ 会话管理方法 ============

  /**
   * 更新会话名称
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('会话名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('会话名称不能超过100个字符');
    }
    this._name = name.trim();
    this.updateTimestamp();
  }

  /**
   * 设置自动保存
   */
  setAutoSave(enabled: boolean, interval?: number): void {
    this._autoSave = enabled;
    if (interval !== undefined && interval > 0) {
      this._autoSaveInterval = interval;
    }
    this.updateTimestamp();
  }

  /**
   * 更新布局
   */
  updateLayout(layout: EditorLayoutCore): void {
    this._layout = layout;
    this.updateTimestamp();
  }

  /**
   * 添加编辑器组
   */
  addGroup(group: EditorGroupCore): void {
    if (this._groups.some((g) => g.uuid === group.uuid)) {
      throw new Error('编辑器组已存在');
    }
    this._groups.push(group);
    if (!this._activeGroupId) {
      this._activeGroupId = group.uuid;
    }
    this.updateTimestamp();
  }

  /**
   * 移除编辑器组
   */
  removeGroup(groupId: string): void {
    const index = this._groups.findIndex((g) => g.uuid === groupId);
    if (index === -1) {
      throw new Error('编辑器组不存在');
    }

    this._groups.splice(index, 1);

    if (this._activeGroupId === groupId) {
      this._activeGroupId = this._groups.length > 0 ? this._groups[0].uuid : null;
    }
    this.updateTimestamp();
  }

  /**
   * 设置活动编辑器组
   */
  setActiveGroup(groupId: string | null): void {
    if (groupId && !this._groups.some((g) => g.uuid === groupId)) {
      throw new Error('编辑器组不存在');
    }
    this._activeGroupId = groupId;
    this.updateTimestamp();
  }

  /**
   * 记录保存时间
   */
  markAsSaved(): void {
    this._lastSavedAt = new Date();
    this.updateTimestamp();
  }

  // ============ 验证方法 ============
  private validateSession(): void {
    this.validateName(this._name);
    this.validateAccountUuid(this._accountUuid);
    this.validateAutoSaveInterval(this._autoSaveInterval);
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('会话名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('会话名称不能超过100个字符');
    }
  }

  private validateAccountUuid(accountUuid: string): void {
    if (!accountUuid || accountUuid.trim().length === 0) {
      throw new Error('账户UUID不能为空');
    }
  }

  private validateAutoSaveInterval(interval: number): void {
    if (interval <= 0) {
      throw new Error('自动保存间隔必须大于0');
    }
  }

  // ============ 辅助方法 ============
  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // ============ 抽象方法 ============
  abstract toDTO(): EditorSessionDTO;
}

/**
 * 编辑器组核心聚合根
 */
export abstract class EditorGroupCore extends Entity {
  protected _accountUuid: string;
  protected _active: boolean;
  protected _width: number;
  protected _height?: number;
  protected _tabs: EditorTabCore[];
  protected _activeTabId: string | null;
  protected _title?: string;
  protected _order: number;
  protected _lastAccessed?: Date;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    active?: boolean;
    width: number;
    height?: number;
    tabs?: EditorTabCore[];
    activeTabId?: string | null;
    title?: string;
    order?: number;
    lastAccessed?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || Entity.generateUUID());

    this._accountUuid = params.accountUuid;
    this._active = params.active || false;
    this._width = params.width;
    this._height = params.height;
    this._tabs = params.tabs || [];
    this._activeTabId = params.activeTabId || null;
    this._title = params.title;
    this._order = params.order || 0;
    this._lastAccessed = params.lastAccessed;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();

    this.validateGroup();
  }

  // ============ Getter 方法 ============
  get accountUuid(): string {
    return this._accountUuid;
  }
  get active(): boolean {
    return this._active;
  }
  get width(): number {
    return this._width;
  }
  get height(): number | undefined {
    return this._height;
  }
  get tabs(): EditorTabCore[] {
    return [...this._tabs];
  }
  get activeTabId(): string | null {
    return this._activeTabId;
  }
  get title(): string | undefined {
    return this._title;
  }
  get order(): number {
    return this._order;
  }
  get lastAccessed(): Date | undefined {
    return this._lastAccessed;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============ 计算属性 ============
  get activeTab(): EditorTabCore | null {
    return this._tabs.find((tab) => tab.uuid === this._activeTabId) || null;
  }

  get hasUnsavedTabs(): boolean {
    return this._tabs.some((tab) => tab.isDirty);
  }

  get unsavedTabCount(): number {
    return this._tabs.filter((tab) => tab.isDirty).length;
  }

  // ============ 编辑器组管理方法 ============

  /**
   * 设置活动状态
   */
  setActive(active: boolean): void {
    this._active = active;
    if (active) {
      this._lastAccessed = new Date();
    }
    this.updateTimestamp();
  }

  /**
   * 更新尺寸
   */
  updateSize(width: number, height?: number): void {
    if (width < 200) {
      throw new Error('编辑器组宽度不能小于200px');
    }
    this._width = width;
    if (height !== undefined) {
      this._height = height;
    }
    this.updateTimestamp();
  }

  /**
   * 更新标题
   */
  updateTitle(title?: string): void {
    this._title = title;
    this.updateTimestamp();
  }

  /**
   * 更新排序
   */
  updateOrder(order: number): void {
    this._order = order;
    this.updateTimestamp();
  }

  /**
   * 添加标签页
   */
  addTab(tab: EditorTabCore): void {
    if (this._tabs.some((t) => t.uuid === tab.uuid)) {
      throw new Error('标签页已存在');
    }

    // 取消其他标签页的激活状态
    this._tabs.forEach((t) => t.setActive(false));

    tab.setActive(true);
    this._tabs.push(tab);
    this._activeTabId = tab.uuid;
    this.updateTimestamp();
  }

  /**
   * 移除标签页
   */
  removeTab(tabId: string): void {
    const index = this._tabs.findIndex((t) => t.uuid === tabId);
    if (index === -1) {
      throw new Error('标签页不存在');
    }

    this._tabs.splice(index, 1);

    if (this._activeTabId === tabId) {
      const nextTab = this._tabs[index] || this._tabs[index - 1];
      this._activeTabId = nextTab?.uuid || null;
      if (nextTab) {
        nextTab.setActive(true);
      }
    }
    this.updateTimestamp();
  }

  /**
   * 设置活动标签页
   */
  setActiveTab(tabId: string | null): void {
    if (tabId && !this._tabs.some((t) => t.uuid === tabId)) {
      throw new Error('标签页不存在');
    }

    this._tabs.forEach((t) => t.setActive(t.uuid === tabId));
    this._activeTabId = tabId;
    this.updateTimestamp();
  }

  /**
   * 查找标签页
   */
  findTab(tabId: string): EditorTabCore | null {
    return this._tabs.find((t) => t.uuid === tabId) || null;
  }

  /**
   * 查找标签页（按路径）
   */
  findTabByPath(path: string): EditorTabCore | null {
    return this._tabs.find((t) => t.path === path) || null;
  }

  // ============ 验证方法 ============
  private validateGroup(): void {
    this.validateAccountUuid(this._accountUuid);
    this.validateWidth(this._width);
  }

  private validateAccountUuid(accountUuid: string): void {
    if (!accountUuid || accountUuid.trim().length === 0) {
      throw new Error('账户UUID不能为空');
    }
  }

  private validateWidth(width: number): void {
    if (width < 200) {
      throw new Error('编辑器组宽度不能小于200px');
    }
  }

  // ============ 辅助方法 ============
  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // ============ 抽象方法 ============
  abstract toDTO(): EditorGroupDTO;
}

/**
 * 编辑器标签页核心实体
 */
export abstract class EditorTabCore extends Entity {
  protected _title: string;
  protected _path: string;
  protected _active: boolean;
  protected _isPreview?: boolean;
  protected _fileType?: SupportedFileType;
  protected _isDirty?: boolean;
  protected _content?: string;
  protected _lastModified?: Date;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    title: string;
    path: string;
    active?: boolean;
    isPreview?: boolean;
    fileType?: SupportedFileType;
    isDirty?: boolean;
    content?: string;
    lastModified?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || Entity.generateUUID());

    this._title = params.title;
    this._path = params.path;
    this._active = params.active || false;
    this._isPreview = params.isPreview;
    this._fileType = params.fileType;
    this._isDirty = params.isDirty || false;
    this._content = params.content;
    this._lastModified = params.lastModified;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();

    this.validateTab();
  }

  // ============ Getter 方法 ============
  get title(): string {
    return this._title;
  }
  get path(): string {
    return this._path;
  }
  get active(): boolean {
    return this._active;
  }
  get isPreview(): boolean | undefined {
    return this._isPreview;
  }
  get fileType(): SupportedFileType | undefined {
    return this._fileType;
  }
  get isDirty(): boolean | undefined {
    return this._isDirty;
  }
  get content(): string | undefined {
    return this._content;
  }
  get lastModified(): Date | undefined {
    return this._lastModified;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============ 计算属性 ============
  get fileName(): string {
    return this._path.split('/').pop() || this._title;
  }

  get fileExtension(): string {
    const parts = this.fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  get isModified(): boolean {
    return this._isDirty || false;
  }

  // ============ 标签页管理方法 ============

  /**
   * 更新标题
   */
  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('标签页标题不能为空');
    }
    this._title = title.trim();
    this.updateTimestamp();
  }

  /**
   * 更新路径
   */
  updatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('文件路径不能为空');
    }
    this._path = path.trim();
    this.updateTimestamp();
  }

  /**
   * 设置活动状态
   */
  setActive(active: boolean): void {
    this._active = active;
    this.updateTimestamp();
  }

  /**
   * 设置预览模式
   */
  setPreview(isPreview: boolean): void {
    this._isPreview = isPreview;
    this.updateTimestamp();
  }

  /**
   * 设置文件类型
   */
  setFileType(fileType: SupportedFileType): void {
    this._fileType = fileType;
    this.updateTimestamp();
  }

  /**
   * 设置修改状态
   */
  setDirty(isDirty: boolean): void {
    this._isDirty = isDirty;
    this.updateTimestamp();
  }

  /**
   * 更新内容
   */
  updateContent(content: string): void {
    this._content = content;
    this._isDirty = true;
    this._lastModified = new Date();
    this.updateTimestamp();
  }

  /**
   * 保存内容
   */
  save(): void {
    this._isDirty = false;
    this._lastModified = new Date();
    this.updateTimestamp();
  }

  // ============ 验证方法 ============
  private validateTab(): void {
    this.validateTitle(this._title);
    this.validatePath(this._path);
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('标签页标题不能为空');
    }
  }

  private validatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('文件路径不能为空');
    }
  }

  // ============ 辅助方法 ============
  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // ============ 抽象方法 ============
  abstract toDTO(): EditorTabDTO;
}

/**
 * 编辑器布局核心实体
 */
export abstract class EditorLayoutCore extends Entity {
  protected _accountUuid: string;
  protected _name: string;
  protected _activityBarWidth: number;
  protected _sidebarWidth: number;
  protected _minSidebarWidth: number;
  protected _resizeHandleWidth: number;
  protected _minEditorWidth: number;
  protected _editorTabWidth: number;
  protected _windowWidth: number;
  protected _windowHeight: number;
  protected _isDefault: boolean;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    activityBarWidth?: number;
    sidebarWidth?: number;
    minSidebarWidth?: number;
    resizeHandleWidth?: number;
    minEditorWidth?: number;
    editorTabWidth?: number;
    windowWidth?: number;
    windowHeight?: number;
    isDefault?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || Entity.generateUUID());

    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._activityBarWidth = params.activityBarWidth || 45;
    this._sidebarWidth = params.sidebarWidth || 300;
    this._minSidebarWidth = params.minSidebarWidth || 200;
    this._resizeHandleWidth = params.resizeHandleWidth || 5;
    this._minEditorWidth = params.minEditorWidth || 200;
    this._editorTabWidth = params.editorTabWidth || 120;
    this._windowWidth = params.windowWidth || 1200;
    this._windowHeight = params.windowHeight || 800;
    this._isDefault = params.isDefault || false;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();

    this.validateLayout();
  }

  // ============ Getter 方法 ============
  get accountUuid(): string {
    return this._accountUuid;
  }
  get name(): string {
    return this._name;
  }
  get activityBarWidth(): number {
    return this._activityBarWidth;
  }
  get sidebarWidth(): number {
    return this._sidebarWidth;
  }
  get minSidebarWidth(): number {
    return this._minSidebarWidth;
  }
  get resizeHandleWidth(): number {
    return this._resizeHandleWidth;
  }
  get minEditorWidth(): number {
    return this._minEditorWidth;
  }
  get editorTabWidth(): number {
    return this._editorTabWidth;
  }
  get windowWidth(): number {
    return this._windowWidth;
  }
  get windowHeight(): number {
    return this._windowHeight;
  }
  get isDefault(): boolean {
    return this._isDefault;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============ 计算属性 ============
  get editorAreaWidth(): number {
    return (
      this._windowWidth - this._activityBarWidth - this._sidebarWidth - this._resizeHandleWidth
    );
  }

  // ============ 布局管理方法 ============

  /**
   * 更新布局名称
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('布局名称不能为空');
    }
    this._name = name.trim();
    this.updateTimestamp();
  }

  /**
   * 更新侧边栏宽度
   */
  updateSidebarWidth(width: number): void {
    if (width < this._minSidebarWidth) {
      throw new Error(`侧边栏宽度不能小于${this._minSidebarWidth}px`);
    }
    this._sidebarWidth = width;
    this.updateTimestamp();
  }

  /**
   * 更新窗口尺寸
   */
  updateWindowSize(width: number, height: number): void {
    if (width < 800 || height < 600) {
      throw new Error('窗口尺寸不能小于800x600');
    }
    this._windowWidth = width;
    this._windowHeight = height;
    this.updateTimestamp();
  }

  /**
   * 设置为默认布局
   */
  setAsDefault(isDefault: boolean): void {
    this._isDefault = isDefault;
    this.updateTimestamp();
  }

  /**
   * 重置为默认值
   */
  resetToDefaults(): void {
    this._activityBarWidth = 45;
    this._sidebarWidth = 300;
    this._minSidebarWidth = 200;
    this._resizeHandleWidth = 5;
    this._minEditorWidth = 200;
    this._editorTabWidth = 120;
    this._windowWidth = 1200;
    this._windowHeight = 800;
    this.updateTimestamp();
  }

  // ============ 验证方法 ============
  private validateLayout(): void {
    this.validateName(this._name);
    this.validateAccountUuid(this._accountUuid);
    this.validateDimensions();
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('布局名称不能为空');
    }
  }

  private validateAccountUuid(accountUuid: string): void {
    if (!accountUuid || accountUuid.trim().length === 0) {
      throw new Error('账户UUID不能为空');
    }
  }

  private validateDimensions(): void {
    if (this._sidebarWidth < this._minSidebarWidth) {
      throw new Error(`侧边栏宽度不能小于${this._minSidebarWidth}px`);
    }
    if (this._windowWidth < 800 || this._windowHeight < 600) {
      throw new Error('窗口尺寸不能小于800x600');
    }
  }

  // ============ 辅助方法 ============
  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // ============ 抽象方法 ============
  abstract toDTO(): EditorLayoutDTO;
}
