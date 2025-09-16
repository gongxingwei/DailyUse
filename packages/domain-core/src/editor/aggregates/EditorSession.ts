import { EditorSessionCore } from './EditorCore';
import { EditorGroup } from './EditorGroup';
import { EditorLayout } from './EditorLayout';
import { EditorContracts } from '@dailyuse/contracts';

type EditorSessionDTO = EditorContracts.EditorSessionDTO;
type EditorGroupDTO = EditorContracts.EditorGroupDTO;
type EditorLayoutDTO = EditorContracts.EditorLayoutDTO;
type CreateEditorGroupRequest = EditorContracts.CreateEditorGroupRequest;

/**
 * 编辑器会话聚合根
 * 管理编辑器组和布局的创建、更新、删除
 */
export class EditorSession extends EditorSessionCore {
  private _groups: EditorGroup[] = [];
  private _layout: EditorLayout | null = null;

  constructor(data: EditorSessionDTO | EditorSession) {
    if (data instanceof EditorSession) {
      // 从另一个实体复制
      super({
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        name: data.name,
        groups: [], // 稍后设置
        activeGroupId: data.activeGroupId,
        layout:
          data._layout ||
          new EditorLayout({
            uuid: 'temp',
            accountUuid: data.accountUuid,
            name: 'Temp Layout',
            activityBarWidth: 48,
            sidebarWidth: 300,
            minSidebarWidth: 200,
            resizeHandleWidth: 4,
            minEditorWidth: 300,
            editorTabWidth: 120,
            windowWidth: 1200,
            windowHeight: 800,
            isDefault: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
        autoSave: data.autoSave,
        autoSaveInterval: data.autoSaveInterval,
        lastSavedAt: data.lastSavedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
      this._groups = [...data._groups];
      this._layout = data._layout ? new EditorLayout(data._layout) : null;
    } else {
      // 从DTO创建
      super({
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        name: data.name,
        groups: [], // 稍后设置
        activeGroupId: data.activeGroupId,
        layout: new EditorLayout({
          uuid: 'temp',
          accountUuid: data.accountUuid,
          name: 'Temp Layout',
          activityBarWidth: 48,
          sidebarWidth: 300,
          minSidebarWidth: 200,
          resizeHandleWidth: 4,
          minEditorWidth: 300,
          editorTabWidth: 120,
          windowWidth: 1200,
          windowHeight: 800,
          isDefault: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
        autoSave: data.autoSave,
        autoSaveInterval: data.autoSaveInterval,
        lastSavedAt: data.lastSavedAt ? new Date(data.lastSavedAt) : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      });
    }
  }

  /**
   * 获取编辑器组列表（重写父类方法）
   */
  get groups(): EditorGroup[] {
    return [...this._groups];
  }

  /**
   * 获取编辑器布局
   */
  get layout(): EditorLayout | null {
    return this._layout;
  }

  /**
   * 获取 layoutUuid
   */
  get layoutUuid(): string | null {
    return this._layout?.uuid || null;
  }

  /**
   * 设置编辑器布局
   */
  setLayout(layout: EditorLayout | null): void {
    this._layout = layout;
    this.updateTimestamp();
  }

  /**
   * 创建编辑器组
   */
  createGroup(request: CreateEditorGroupRequest): EditorGroup {
    const groupData: EditorGroupDTO = {
      uuid: this.generateUuid(),
      accountUuid: this.accountUuid,
      sessionUuid: this.uuid,
      active: this._groups.length === 0, // 第一个组默认激活
      width: request.width,
      height: request.height || 600,
      activeTabId: null,
      title: request.title || `Group ${this._groups.length + 1}`,
      order: request.order ?? this._groups.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const group = new EditorGroup(groupData);
    this._groups.push(group);

    // 如果是第一个组，自动设为活动组
    if (this._groups.length === 1) {
      this.setActiveGroupId(group.uuid);
    }

    this.updateTimestamp();
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

    // 如果删除的是活动组，需要重新设置活动组
    if (this.activeGroupId === groupId) {
      const remainingGroups = this._groups.filter((g) => g.uuid !== groupId);
      this.setActiveGroupId(remainingGroups.length > 0 ? remainingGroups[0].uuid : null);
    }

    this._groups.splice(index, 1);
    this.updateTimestamp();
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
  setActiveGroup(groupId: string): void {
    const group = this.getGroup(groupId);
    if (!group) {
      throw new Error(`编辑器组不存在: ${groupId}`);
    }

    // 取消所有组的激活状态
    this._groups.forEach((g) => g.setActive(false));

    // 激活指定组
    group.setActive(true);
    this.setActiveGroupId(groupId);
  }

  /**
   * 更新编辑器组顺序
   */
  reorderGroups(groupOrders: { groupId: string; order: number }[]): void {
    groupOrders.forEach(({ groupId, order }) => {
      const group = this.getGroup(groupId);
      if (group) {
        group.updateOrder(order);
      }
    });

    // 按order排序
    this._groups.sort((a, b) => a.order - b.order);
    this.updateTimestamp();
  }

  /**
   * 获取所有标签页数量
   */
  getTotalTabsCount(): number {
    return this._groups.reduce((total, group) => total + group.tabs.length, 0);
  }

  /**
   * 获取活动标签页数量
   */
  getActiveTabsCount(): number {
    return this._groups.reduce((total, group) => {
      return total + group.tabs.filter((tab) => tab.active).length;
    }, 0);
  }

  /**
   * 获取未保存的文件数量
   */
  getUnsavedFilesCount(): number {
    return this._groups.reduce((total, group) => {
      return total + group.tabs.filter((tab) => tab.isDirty).length;
    }, 0);
  }

  /**
   * 检查是否有未保存的更改
   */
  hasUnsavedChanges(): boolean {
    return this.getUnsavedFilesCount() > 0;
  }

  /**
   * 创建默认布局
   */
  createDefaultLayout(): EditorLayout {
    const layoutData: EditorLayoutDTO = {
      uuid: this.generateUuid(),
      accountUuid: this.accountUuid,
      name: `${this.name} - 默认布局`,
      activityBarWidth: 48,
      sidebarWidth: 300,
      minSidebarWidth: 200,
      resizeHandleWidth: 4,
      minEditorWidth: 300,
      editorTabWidth: 120,
      windowWidth: 1200,
      windowHeight: 800,
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const layout = new EditorLayout(layoutData);
    this.setLayout(layout);
    return layout;
  }

  /**
   * 从另一个会话复制配置
   */
  copyConfigFrom(sourceSession: EditorSession): void {
    // 复制布局
    if (sourceSession.layout) {
      const layoutData: EditorLayoutDTO = {
        ...sourceSession.layout.toDTO(),
        uuid: this.generateUuid(),
        accountUuid: this.accountUuid,
        name: `${this.name} - 复制布局`,
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.setLayout(new EditorLayout(layoutData));
    }

    // 复制编辑器组结构（不复制具体标签页）
    sourceSession.groups.forEach((sourceGroup, index) => {
      this.createGroup({
        width: sourceGroup.width,
        height: sourceGroup.height,
        title: sourceGroup.title,
        order: index,
      });
    });

    this.updateTimestamp();
  }

  /**
   * 设置活动组ID（内部方法）
   */
  private setActiveGroupId(groupId: string | null): void {
    (this as any)._activeGroupId = groupId;
    this.updateTimestamp();
  }

  /**
   * 生成UUID（临时实现）
   */
  private generateUuid(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 更新时间戳（内部方法）
   */
  private updateTimestamp(): void {
    (this as any)._updatedAt = new Date();
  }

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
   * 转换为DTO（包含关联数据）
   */
  toFullDTO(): EditorSessionDTO & {
    groups: EditorGroupDTO[];
    layout: EditorLayoutDTO | null;
  } {
    return {
      ...this.toDTO(),
      groups: this._groups.map((g) => g.toDTO()),
      layout: this._layout?.toDTO() || null,
    };
  }
}
