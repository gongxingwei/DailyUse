import { EditorGroupCore, EditorTabCore } from '@dailyuse/domain-core';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorGroupDTO = EditorContracts.EditorGroupDTO;

/**
 * 客户端 EditorGroup 聚合根
 * 继承核心 EditorGroup 类，添加客户端特有功能
 */
export class EditorGroup extends EditorGroupCore {
  private _uiState: {
    isCollapsed: boolean;
    isDragging: boolean;
    isResizing: boolean;
    lastInteractionAt?: Date;
  };
  private _keyboardShortcuts?: Record<string, string>;

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
    // 客户端特有字段
    uiState?: {
      isCollapsed?: boolean;
      isDragging?: boolean;
      isResizing?: boolean;
      lastInteractionAt?: Date;
    };
    keyboardShortcuts?: Record<string, string>;
  }) {
    super(params);

    this._uiState = {
      isCollapsed: params.uiState?.isCollapsed || false,
      isDragging: params.uiState?.isDragging || false,
      isResizing: params.uiState?.isResizing || false,
      lastInteractionAt: params.uiState?.lastInteractionAt,
    };
    this._keyboardShortcuts = params.keyboardShortcuts;
  }

  // ===== 实现抽象方法 =====

  /**
   * 转换为DTO
   */
  toDTO(): EditorGroupDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      active: this.active,
      width: this.width,
      height: this.height,
      tabs: this.tabs.map((tab) => tab.toDTO()),
      activeTabId: this.activeTabId,
      title: this.title,
      order: this.order,
      lastAccessed: this.lastAccessed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== Getter 方法 =====
  get uiState() {
    return { ...this._uiState };
  }
  get keyboardShortcuts(): Record<string, string> | undefined {
    return this._keyboardShortcuts;
  }
  get isCollapsed(): boolean {
    return this._uiState.isCollapsed;
  }
  get isDragging(): boolean {
    return this._uiState.isDragging;
  }
  get isResizing(): boolean {
    return this._uiState.isResizing;
  }

  // ===== 客户端特有方法 =====

  /**
   * 切换折叠状态
   */
  toggleCollapse(): void {
    this._uiState.isCollapsed = !this._uiState.isCollapsed;
    this._uiState.lastInteractionAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 设置折叠状态
   */
  setCollapsed(collapsed: boolean): void {
    if (this._uiState.isCollapsed !== collapsed) {
      this._uiState.isCollapsed = collapsed;
      this._uiState.lastInteractionAt = new Date();
      this.updateTimestamp();
    }
  }

  /**
   * 开始拖拽
   */
  startDragging(): void {
    this._uiState.isDragging = true;
    this._uiState.lastInteractionAt = new Date();
  }

  /**
   * 结束拖拽
   */
  endDragging(): void {
    this._uiState.isDragging = false;
    this._uiState.lastInteractionAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 开始调整大小
   */
  startResizing(): void {
    this._uiState.isResizing = true;
    this._uiState.lastInteractionAt = new Date();
  }

  /**
   * 结束调整大小
   */
  endResizing(): void {
    this._uiState.isResizing = false;
    this._uiState.lastInteractionAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 更新UI状态
   */
  updateUiState(
    state: Partial<{
      isCollapsed: boolean;
      isDragging: boolean;
      isResizing: boolean;
    }>,
  ): void {
    Object.assign(this._uiState, state);
    this._uiState.lastInteractionAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 设置快捷键
   */
  setKeyboardShortcut(action: string, shortcut: string): void {
    if (!this._keyboardShortcuts) {
      this._keyboardShortcuts = {};
    }
    this._keyboardShortcuts[action] = shortcut;
    this.updateTimestamp();
  }

  /**
   * 移除快捷键
   */
  removeKeyboardShortcut(action: string): void {
    if (this._keyboardShortcuts) {
      delete this._keyboardShortcuts[action];
      this.updateTimestamp();
    }
  }

  /**
   * 清除所有快捷键
   */
  clearKeyboardShortcuts(): void {
    this._keyboardShortcuts = undefined;
    this.updateTimestamp();
  }

  /**
   * 激活组（客户端特有行为）
   */
  activateWithFocus(): void {
    this.setActive(true);
    this._uiState.lastInteractionAt = new Date();

    // 如果组是折叠的，展开它
    if (this._uiState.isCollapsed) {
      this.setCollapsed(false);
    }
  }

  /**
   * 快速切换到指定标签页
   */
  quickSwitchToTab(tabIndex: number): void {
    const tab = this.tabs[tabIndex];
    if (tab) {
      this.setActiveTab(tab.uuid);
      this._uiState.lastInteractionAt = new Date();
    }
  }

  /**
   * 关闭除当前标签页外的所有标签页
   */
  closeOtherTabs(): void {
    const activeTab = this.activeTab;
    if (!activeTab) return;

    const tabsToClose = this.tabs.filter((tab) => tab.uuid !== activeTab.uuid);
    tabsToClose.forEach((tab) => {
      this.removeTab(tab.uuid);
    });

    this._uiState.lastInteractionAt = new Date();
  }

  /**
   * 关闭所有已保存的标签页
   */
  closeSavedTabs(): void {
    const tabsToClose = this.tabs.filter((tab) => !tab.isDirty);
    tabsToClose.forEach((tab) => {
      this.removeTab(tab.uuid);
    });

    this._uiState.lastInteractionAt = new Date();
  }

  /**
   * 按路径排序标签页
   */
  sortTabsByPath(): void {
    const sortedTabs = [...this.tabs].sort((a, b) => a.path.localeCompare(b.path));

    // 清除所有标签页然后按新顺序添加
    const currentTabs = [...this.tabs];
    currentTabs.forEach((tab) => this.removeTab(tab.uuid));
    sortedTabs.forEach((tab) => this.addTab(tab));

    this._uiState.lastInteractionAt = new Date();
  }

  /**
   * 获取组的使用统计
   */
  getUsageStats(): {
    totalTabs: number;
    unsavedTabs: number;
    lastInteractionAt?: Date;
    isCurrentlyActive: boolean;
    averageTabAge: number;
  } {
    const now = new Date();
    const tabAges = this.tabs.map((tab) => now.getTime() - tab.createdAt.getTime());

    return {
      totalTabs: this.tabs.length,
      unsavedTabs: this.unsavedTabCount,
      lastInteractionAt: this._uiState.lastInteractionAt,
      isCurrentlyActive: this.active,
      averageTabAge:
        tabAges.length > 0 ? tabAges.reduce((sum, age) => sum + age, 0) / tabAges.length : 0,
    };
  }

  /**
   * 重置UI状态
   */
  resetUiState(): void {
    this._uiState = {
      isCollapsed: false,
      isDragging: false,
      isResizing: false,
      lastInteractionAt: new Date(),
    };
    this.updateTimestamp();
  }
}
