import { EditorGroupCore } from '@dailyuse/domain-core';
import { EditorTab } from './EditorTab';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorGroupDTO = EditorContracts.EditorGroupDTO;

/**
 * 客户端 EditorGroup 实体
 * 使用组合模式包装核心 EditorGroup 类，添加客户端特有功能
 */
export class EditorGroup {
  private _core: EditorGroupCore;
  private _tabs: EditorTab[] = [];

  private _uiState: {
    isCollapsed: boolean;
    isResizing: boolean;
    hasNotification: boolean;
    highlightedTabId?: string;
    draggedTabId?: string;
    isDropTarget: boolean;
    customStyle?: string;
  };

  private _localSettings: {
    splitDirection?: 'horizontal' | 'vertical';
    autoScroll?: boolean;
    showTabPreview?: boolean;
    maxTabs?: number;
  };

  constructor(params: {
    uuid?: string;
    active?: boolean;
    width: number;
    height?: number;
    tabs?: EditorTab[];
    activeTabId?: string | null;
    title?: string;
    order?: number;
    lastAccessed?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    // 客户端特有字段
    uiState?: {
      isCollapsed?: boolean;
      isResizing?: boolean;
      hasNotification?: boolean;
      highlightedTabId?: string;
      draggedTabId?: string;
      isDropTarget?: boolean;
      customStyle?: string;
    };
    localSettings?: {
      splitDirection?: 'horizontal' | 'vertical';
      autoScroll?: boolean;
      showTabPreview?: boolean;
      maxTabs?: number;
    };
  }) {
    // 创建核心实例（临时提供默认 accountUuid）
    this._core = new (EditorGroupCore as any)({
      ...params,
      accountUuid: 'temp-account',
    });
    this._tabs = params.tabs || [];

    this._uiState = {
      isCollapsed: params.uiState?.isCollapsed || false,
      isResizing: params.uiState?.isResizing || false,
      hasNotification: params.uiState?.hasNotification || false,
      highlightedTabId: params.uiState?.highlightedTabId,
      draggedTabId: params.uiState?.draggedTabId,
      isDropTarget: params.uiState?.isDropTarget || false,
      customStyle: params.uiState?.customStyle,
    };

    this._localSettings = {
      splitDirection: params.localSettings?.splitDirection || 'horizontal',
      autoScroll: params.localSettings?.autoScroll || true,
      showTabPreview: params.localSettings?.showTabPreview || true,
      maxTabs: params.localSettings?.maxTabs || 20,
    };
  }

  // ===== 委托核心属性 =====
  get uuid(): string {
    return this._core.uuid;
  }
  get accountUuid(): string {
    return this._core.accountUuid;
  }
  get active(): boolean {
    return this._core.active;
  }
  get width(): number {
    return this._core.width;
  }
  get height(): number | undefined {
    return this._core.height;
  }
  get activeTabId(): string | null {
    return this._core.activeTabId;
  }
  get title(): string | undefined {
    return this._core.title;
  }
  get order(): number {
    return this._core.order;
  }
  get lastAccessed(): Date | undefined {
    return this._core.lastAccessed;
  }
  get createdAt(): Date {
    return this._core.createdAt;
  }
  get updatedAt(): Date {
    return this._core.updatedAt;
  }

  // ===== 客户端特有属性 =====
  get tabs(): EditorTab[] {
    return [...this._tabs];
  }
  get uiState() {
    return { ...this._uiState };
  }
  get localSettings() {
    return { ...this._localSettings };
  }
  get isCollapsed(): boolean {
    return this._uiState.isCollapsed;
  }
  get isResizing(): boolean {
    return this._uiState.isResizing;
  }
  get hasNotification(): boolean {
    return this._uiState.hasNotification;
  }
  get highlightedTabId(): string | undefined {
    return this._uiState.highlightedTabId;
  }
  get draggedTabId(): string | undefined {
    return this._uiState.draggedTabId;
  }
  get isDropTarget(): boolean {
    return this._uiState.isDropTarget;
  }

  // ===== 委托核心方法 =====
  setActive(active: boolean): void {
    this._core.setActive(active);
  }

  updateSize(width: number, height?: number): void {
    this._core.updateSize(width, height);
  }

  updateTitle(title?: string): void {
    this._core.updateTitle(title);
  }

  updateOrder(order: number): void {
    this._core.updateOrder(order);
  }

  // ===== 标签页管理（重写以使用客户端 EditorTab） =====
  addTab(tab: EditorTab): void {
    if (this._tabs.some((t) => t.uuid === tab.uuid)) {
      throw new Error('标签页已存在');
    }

    // 取消其他标签页的激活状态
    this._tabs.forEach((t) => t.setActive(false));

    tab.setActive(true);
    this._tabs.push(tab);
    this._core.setActiveTab(tab.uuid);
  }

  removeTab(tabId: string): void {
    const index = this._tabs.findIndex((t) => t.uuid === tabId);
    if (index === -1) {
      throw new Error('标签页不存在');
    }

    this._tabs.splice(index, 1);

    if (this.activeTabId === tabId) {
      const nextTab = this._tabs[index] || this._tabs[index - 1];
      this._core.setActiveTab(nextTab?.uuid || null);
      if (nextTab) {
        nextTab.setActive(true);
      }
    }
  }

  setActiveTab(tabId: string | null): void {
    if (tabId && !this._tabs.some((t) => t.uuid === tabId)) {
      throw new Error('标签页不存在');
    }

    this._tabs.forEach((t) => t.setActive(t.uuid === tabId));
    this._core.setActiveTab(tabId);
  }

  findTab(tabId: string): EditorTab | null {
    return this._tabs.find((t) => t.uuid === tabId) || null;
  }

  findTabByPath(path: string): EditorTab | null {
    return this._tabs.find((t) => t.path === path) || null;
  }

  // ===== 计算属性 =====
  get activeTab(): EditorTab | null {
    return this._tabs.find((tab) => tab.uuid === this.activeTabId) || null;
  }

  get hasUnsavedTabs(): boolean {
    return this._tabs.some((tab) => tab.isDirty);
  }

  get unsavedTabCount(): number {
    return this._tabs.filter((tab) => tab.isDirty).length;
  }

  // ===== DTO转换（修复日期类型转换问题） =====
  toDTO(): EditorGroupDTO {
    return {
      uuid: this.uuid,
      sessionUuid: '', // 这里需要从会话中获取
      active: this.active,
      width: this.width,
      height: this.height,
      activeTabId: this.activeTabId,
      title: this.title,
      order: this.order,
      lastAccessed: this.lastAccessed?.getTime(),
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }

  // ===== 客户端特有方法 =====

  /**
   * 设置折叠状态
   */
  setCollapsed(collapsed: boolean): void {
    this._uiState.isCollapsed = collapsed;
  }

  /**
   * 切换折叠状态
   */
  toggleCollapsed(): void {
    this.setCollapsed(!this._uiState.isCollapsed);
  }

  /**
   * 设置调整大小状态
   */
  setResizing(resizing: boolean): void {
    this._uiState.isResizing = resizing;
  }

  /**
   * 设置通知状态
   */
  setNotification(hasNotification: boolean): void {
    this._uiState.hasNotification = hasNotification;
  }

  /**
   * 高亮指定标签页
   */
  highlightTab(tabId?: string): void {
    this._uiState.highlightedTabId = tabId;
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    this._uiState.highlightedTabId = undefined;
  }

  /**
   * 设置拖拽标签页
   */
  setDraggedTab(tabId?: string): void {
    this._uiState.draggedTabId = tabId;
  }

  /**
   * 设置为拖放目标
   */
  setDropTarget(isTarget: boolean): void {
    this._uiState.isDropTarget = isTarget;
  }

  /**
   * 设置自定义样式
   */
  setCustomStyle(style?: string): void {
    this._uiState.customStyle = style;
  }

  /**
   * 更新本地设置
   */
  updateLocalSettings(settings: Partial<typeof this._localSettings>): void {
    this._localSettings = { ...this._localSettings, ...settings };
  }

  /**
   * 设置分割方向
   */
  setSplitDirection(direction: 'horizontal' | 'vertical'): void {
    this._localSettings.splitDirection = direction;
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  clone(): EditorGroup {
    const dto = this.toDTO();
    return new EditorGroup({
      uuid: dto.uuid,
      active: dto.active,
      width: dto.width,
      height: dto.height,
      activeTabId: dto.activeTabId,
      title: dto.title,
      order: dto.order,
      lastAccessed: dto.lastAccessed ? new Date(dto.lastAccessed) : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      // 深拷贝标签页
      tabs: this._tabs.map((tab) => tab.clone()),
      // 深拷贝UI状态
      uiState: {
        isCollapsed: this._uiState.isCollapsed,
        isResizing: this._uiState.isResizing,
        hasNotification: this._uiState.hasNotification,
        highlightedTabId: this._uiState.highlightedTabId,
        draggedTabId: this._uiState.draggedTabId,
        isDropTarget: this._uiState.isDropTarget,
        customStyle: this._uiState.customStyle,
      },
      // 深拷贝本地设置
      localSettings: {
        splitDirection: this._localSettings.splitDirection,
        autoScroll: this._localSettings.autoScroll,
        showTabPreview: this._localSettings.showTabPreview,
        maxTabs: this._localSettings.maxTabs,
      },
    });
  }
}

export default EditorGroup;
