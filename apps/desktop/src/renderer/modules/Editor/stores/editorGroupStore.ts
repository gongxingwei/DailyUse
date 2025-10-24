import { defineStore } from 'pinia';
import { useEditorLayoutStore } from './editorLayoutStore';

export interface EditorTab {
  uuid: string;
  title: string;
  path: string;
  active: boolean;
  isPreview?: boolean;
}

export interface EditorGroup {
  uuid: string;
  active: boolean;
  width: number;
  tabs: EditorTab[];
  activeTabId: string | null;
}

export const useEditorGroupStore = defineStore('editorGroup', {
  state: () => {
    return {
      editorGroups: [] as EditorGroup[],
      activeGroupId: '' as string | null,
    };
  },

  getters: {
    totalWidth(): number {
      return this.editorGroups.reduce((sum, group) => sum + group.width, 0);
    },
  },

  actions: {
    openFile(path: string, groupId?: string) {
      const title = window.shared.path.basename(path);
      const targetGroupId = groupId || this.activeGroupId;
      if (!targetGroupId) {
        const newGroup = this.addEditorGroup();
        if (!newGroup) return;
        this.openFile(path, newGroup.uuid);
        return;
      }

      const group = this.editorGroups.find((g) => g.uuid === targetGroupId);
      if (!group) return;

      // 检查文件是否已在此组中打开
      const existingTab = group.tabs.find((t) => t.path === path);
      if (existingTab) {
        this.setActiveTab(targetGroupId, existingTab.uuid);
        return;
      }

      // 创建新标签页
      const newTab: EditorTab = {
        uuid: path, // 使用路径作为唯一标识
        title,
        path,
        active: true,
      };

      // 取消其他标签页的活动状态
      group.tabs.forEach((t) => (t.active = false));
      group.tabs.push(newTab);
      group.activeTabId = newTab.uuid;

      // 激活当前组
      this.setActiveGroup(targetGroupId);
    },

    openFilePreview(path: string, groupId: string) {
      const title = `Preview: ${window.shared.path.basename(path)}`;
      const group = this.editorGroups.find((g) => g.uuid === groupId);
      if (!group) return;

      // 检查是否已有预览标签页
      const existingPreview = group.tabs.find((t) => t.path === path && t.isPreview);
      if (existingPreview) {
        this.setActiveTab(groupId, existingPreview.uuid);
        return;
      }

      // 创建新的预览标签页
      const previewTab: EditorTab = {
        uuid: `preview-${path}`,
        title,
        path,
        active: true,
        isPreview: true,
      };

      group.tabs.forEach((t) => (t.active = false));
      group.tabs.push(previewTab);
      group.activeTabId = previewTab.uuid;
    },

    // 关闭标签页
    closeTab(groupId: string, tabId: string) {
      const group = this.editorGroups.find((g) => g.uuid === groupId);
      if (!group) return;

      const tabIndex = group.tabs.findIndex((t) => t.uuid === tabId);
      if (tabIndex === -1) return;

      group.tabs.splice(tabIndex, 1);

      // 如果关闭的是活动标签页，激活下一个标签页
      if (tabId === group.activeTabId) {
        const nextTab = group.tabs[tabIndex] || group.tabs[tabIndex - 1];
        group.activeTabId = nextTab?.uuid || null;
      }

      if (group.tabs.length === 0) {
        this.removeEditorGroup(groupId);
      }
    },

    // 添加用于查找标签页的 getter
    findTab(path: string) {
      for (const group of this.editorGroups) {
        const tab = group.tabs.find((t) => t.path === path);
        if (tab) {
          return { group, tab };
        }
      }
      return null;
    },

    // 设置活动标签页
    setActiveTab(groupId: string, tabId: string) {
      const group = this.editorGroups.find((g) => g.uuid === groupId);
      if (!group) return;

      group.tabs.forEach((t) => (t.active = t.uuid === tabId));
      group.activeTabId = tabId;
    },

    addEditorGroup() {
      // 没有编辑器组时创建初始组
      if (this.editorGroups.length === 0) {
        const layoutStore = useEditorLayoutStore();
        const initialGroup: EditorGroup = {
          uuid: `group-${Date.now()}`,
          active: true,
          width: layoutStore.editorGroupsWidth,
          tabs: [],
          activeTabId: null,
        };
        this.editorGroups.push(initialGroup);
        this.activeGroupId = initialGroup.uuid;
        return initialGroup;
      }

      const currentGroup = this.editorGroups.find((g) => g.uuid === this.activeGroupId);
      if (!currentGroup) return;

      const currentWidth = currentGroup.width;
      const halfWidth = Math.floor(currentWidth / 2);

      currentGroup.width = halfWidth;
      currentGroup.active = false;

      const newGroup: EditorGroup = {
        uuid: `group-${Date.now()}`,
        active: true,
        width: halfWidth,
        tabs: [],
        activeTabId: null,
      };

      const activeTab = currentGroup.tabs.find((t) => t.uuid === currentGroup.activeTabId);
      if (activeTab) {
        const newTab = { ...activeTab };
        newGroup.tabs = [newTab];
        newGroup.activeTabId = newTab.uuid;
      }

      const currentIndex = this.editorGroups.indexOf(currentGroup);
      this.editorGroups.splice(currentIndex + 1, 0, newGroup);
      this.activeGroupId = newGroup.uuid;

      return newGroup;
    },
    // 添加预览编辑器组
    addEditorGroupPreview() {
      const currentGroup = this.editorGroups.find((g) => g.uuid === this.activeGroupId);
      if (!currentGroup) return;

      const currentWidth = currentGroup.width;
      const halfWidth = Math.floor(currentWidth / 2);

      currentGroup.width = halfWidth;
      currentGroup.active = false;
      const newGroup: EditorGroup = {
        uuid: `group-${Date.now()}`,
        active: true,
        width: halfWidth,
        tabs: [],
        activeTabId: null,
      };
      const currentIndex = this.editorGroups.indexOf(currentGroup);
      this.editorGroups.splice(currentIndex + 1, 0, newGroup);
      this.activeGroupId = newGroup.uuid;

      return newGroup;
    },
    // 删除编辑器组
    removeEditorGroup(groupId: string) {
      const index = this.editorGroups.findIndex((g) => g.uuid === groupId);
      if (index === -1) return;

      const removedGroup = this.editorGroups[index];
      const removedGroupWidth = removedGroup.width;

      this.editorGroups.splice(index, 1);
      // 将删除的编辑器的空间分配给左侧的编辑器，左侧没有则分配给右侧
      if (this.editorGroups.length > 0) {
        const targetGroup = this.editorGroups[index - 1] || this.editorGroups[index];
        if (targetGroup) {
          targetGroup.width += removedGroupWidth;
        }
      }
      // 如果删除的编辑器是活动编辑器，则激活左侧的编辑器，左侧没有则激活右侧
      if (this.activeGroupId === groupId) {
        const previousGroup = this.editorGroups[index - 1] || this.editorGroups[0];
        if (previousGroup) {
          previousGroup.active = true;
          this.activeGroupId = previousGroup.uuid;
        } else {
          this.activeGroupId = null;
        }
      }
    },

    setActiveGroup(groupId: string) {
      if (this.activeGroupId !== groupId) {
        const currentActive = this.editorGroups.find((g) => g.uuid === this.activeGroupId);
        if (currentActive) {
          currentActive.active = false;
        }

        const newActive = this.editorGroups.find((g) => g.uuid === groupId);
        if (newActive) {
          newActive.active = true;
          this.activeGroupId = groupId;
        }
      }
    },

    getGroupWidth(groupId: string) {
      const group = this.editorGroups.find((g) => g.uuid === groupId);
      return group?.width || 300;
    },

    redistributeWidths(removedGroupWidth?: number) {
      const remainingGroups = this.editorGroups.length;
      if (remainingGroups === 0) return;

      if (removedGroupWidth && remainingGroups > 0) {
        // 将关闭窗口的宽度分配给前一个窗口
        const widthPerGroup = removedGroupWidth / remainingGroups;
        this.editorGroups.forEach((group) => {
          group.width += widthPerGroup;
        });
      } else {
        // 平均分配总宽度
        const layoutStore = useEditorLayoutStore();
        const totalWidth = layoutStore.editorGroupsWidth;
        const widthPerGroup = Math.max(layoutStore.minEditorWidth, totalWidth / remainingGroups);
        this.editorGroups.forEach((group) => {
          group.width = widthPerGroup;
        });
      }
    },

    setGroupWidth(groupId: string, width: number) {
      const group = this.editorGroups.find((g) => g.uuid === groupId);
      if (group) {
        group.width = Math.max(200, width); // 确保最小宽度
      }
    },
  },

  persist: true,
});
