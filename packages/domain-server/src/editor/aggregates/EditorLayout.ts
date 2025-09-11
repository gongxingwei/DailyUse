import { EditorLayoutCore } from '@dailyuse/domain-core';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorLayoutDTO = EditorContracts.EditorLayoutDTO;

/**
 * 服务端 EditorLayout 聚合根
 * 继承核心 EditorLayout 类，添加服务端特有功能
 */
export class EditorLayout extends EditorLayoutCore {
  private _shareSettings?: Record<string, any>;
  private _layoutPresets?: Record<string, any>[];

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
    // 服务端特有字段
    shareSettings?: Record<string, any>;
    layoutPresets?: Record<string, any>[];
  }) {
    super(params);

    this._shareSettings = params.shareSettings;
    this._layoutPresets = params.layoutPresets;
  }

  // ===== 实现抽象方法 =====

  /**
   * 转换为DTO
   */
  toDTO(): EditorLayoutDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      activityBarWidth: this.activityBarWidth,
      sidebarWidth: this.sidebarWidth,
      minSidebarWidth: this.minSidebarWidth,
      resizeHandleWidth: this.resizeHandleWidth,
      minEditorWidth: this.minEditorWidth,
      editorTabWidth: this.editorTabWidth,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== Getter 方法 =====
  get shareSettings(): Record<string, any> | undefined {
    return this._shareSettings;
  }
  get layoutPresets(): Record<string, any>[] | undefined {
    return this._layoutPresets;
  }

  // ===== 服务端特有方法 =====

  /**
   * 更新共享设置
   */
  updateShareSettings(settings: Record<string, any>): void {
    this._shareSettings = { ...this._shareSettings, ...settings };
    this.updateTimestamp();
  }

  /**
   * 清除共享设置
   */
  clearShareSettings(): void {
    this._shareSettings = undefined;
    this.updateTimestamp();
  }

  /**
   * 添加布局预设
   */
  addLayoutPreset(preset: Record<string, any>): void {
    if (!this._layoutPresets) {
      this._layoutPresets = [];
    }

    if (!preset.name) {
      throw new Error('布局预设必须有名称');
    }

    // 检查是否已存在同名预设
    const existingIndex = this._layoutPresets.findIndex((p) => p.name === preset.name);
    if (existingIndex !== -1) {
      // 更新现有预设
      this._layoutPresets[existingIndex] = preset;
    } else {
      // 添加新预设
      this._layoutPresets.push(preset);
    }

    this.updateTimestamp();
  }

  /**
   * 移除布局预设
   */
  removeLayoutPreset(presetName: string): void {
    if (this._layoutPresets) {
      const index = this._layoutPresets.findIndex((p) => p.name === presetName);
      if (index !== -1) {
        this._layoutPresets.splice(index, 1);
        this.updateTimestamp();
      }
    }
  }

  /**
   * 获取布局预设
   */
  getLayoutPreset(presetName: string): Record<string, any> | undefined {
    return this._layoutPresets?.find((p) => p.name === presetName);
  }

  /**
   * 应用布局预设
   */
  applyLayoutPreset(presetName: string): void {
    const preset = this.getLayoutPreset(presetName);
    if (!preset) {
      throw new Error(`布局预设 "${presetName}" 不存在`);
    }

    // 应用预设配置
    if (preset.sidebarWidth !== undefined) this.updateSidebarWidth(preset.sidebarWidth);
    if (preset.windowWidth !== undefined && preset.windowHeight !== undefined) {
      this.updateWindowSize(preset.windowWidth, preset.windowHeight);
    }

    this.updateTimestamp();
  }

  /**
   * 清除所有布局预设
   */
  clearLayoutPresets(): void {
    if (this._layoutPresets && this._layoutPresets.length > 0) {
      this._layoutPresets = [];
      this.updateTimestamp();
    }
  }

  /**
   * 获取持久化数据
   */
  toPersistenceData(): Record<string, any> {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      activityBarWidth: this.activityBarWidth,
      sidebarWidth: this.sidebarWidth,
      minSidebarWidth: this.minSidebarWidth,
      resizeHandleWidth: this.resizeHandleWidth,
      minEditorWidth: this.minEditorWidth,
      editorTabWidth: this.editorTabWidth,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      shareSettings: this._shareSettings,
      layoutPresets: this._layoutPresets,
    };
  }

  /**
   * 检查布局是否可以删除
   */
  canBeDeleted(): boolean {
    // 默认布局不能删除
    return !this.isDefault;
  }

  /**
   * 克隆布局
   */
  clone(newName?: string): EditorLayout {
    return new EditorLayout({
      accountUuid: this.accountUuid,
      name: newName || `${this.name} (副本)`,
      activityBarWidth: this.activityBarWidth,
      sidebarWidth: this.sidebarWidth,
      minSidebarWidth: this.minSidebarWidth,
      resizeHandleWidth: this.resizeHandleWidth,
      minEditorWidth: this.minEditorWidth,
      editorTabWidth: this.editorTabWidth,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      // 克隆不设为默认
      isDefault: false,
      shareSettings: this._shareSettings ? { ...this._shareSettings } : undefined,
      layoutPresets: this._layoutPresets ? [...this._layoutPresets] : undefined,
    });
  }

  /**
   * 重置为默认设置
   */
  resetToDefault(): void {
    this.updateWindowSize(1200, 800);
    this.updateSidebarWidth(300);
    this.clearShareSettings();
    this.clearLayoutPresets();
  }
}
