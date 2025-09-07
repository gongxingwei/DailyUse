/**
 * Editor Repository Interface
 * 编辑器仓储接口
 */

import { EditorContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type IEditorTab = EditorContracts.IEditorTab;
type IEditorGroup = EditorContracts.IEditorGroup;
type IEditorLayout = EditorContracts.IEditorLayout;

export interface IEditorRepository {
  // 编辑器组管理
  saveGroup(group: IEditorGroup): Promise<void>;
  getGroup(groupId: string): Promise<IEditorGroup | null>;
  getAllGroups(): Promise<IEditorGroup[]>;
  getActiveGroup(): Promise<IEditorGroup | null>;
  updateGroup(group: IEditorGroup): Promise<void>;
  removeGroup(groupId: string): Promise<void>;
  deactivateAllGroups(): Promise<void>;

  // 标签页管理
  saveTab(tab: IEditorTab, groupId: string): Promise<void>;
  getTab(groupId: string, tabId: string): Promise<IEditorTab | null>;
  getTabsByGroup(groupId: string): Promise<IEditorTab[]>;
  getAllTabs(): Promise<IEditorTab[]>;
  getDirtyTabsByGroup(groupId: string): Promise<IEditorTab[]>;
  getAllDirtyTabs(): Promise<IEditorTab[]>;
  updateTab(tab: IEditorTab): Promise<void>;
  removeTab(groupId: string, tabId: string): Promise<void>;

  // 布局管理
  saveLayout(layout: IEditorLayout): Promise<void>;
  getLayout(): Promise<IEditorLayout | null>;
  updateLayout(layout: IEditorLayout): Promise<void>;
}
