import { defineStore } from 'pinia';
import { type Component, markRaw } from 'vue';
// 暂时注释 Vue 组件导入，避免类型检查问题
// TODO: 实现web版本的文件浏览器和搜索组件
// import FileExplorer from '../components/Explorer.vue';
// import Search from "../components/Search.vue";
// import SourceControl from '../components/SourceControl.vue';
// import GoalPlugin from "../components/GoalPlugin.vue";

interface ActivityBarItem {
  uuid: string;
  label: string;
  title: string;
  icon: string;
  component: Component | null;
}

export const useActivityBarStore = defineStore('activityBar', {
  state: () => ({
    activityBarItems: [
      {
        uuid: 'explorer',
        label: 'Explorer',
        title: 'Folders',
        icon: 'mdi-file-multiple',
        component: null, // markRaw(FileExplorer),
      },
      // { uuid: 'search', label: 'Search', title: 'Search', icon: 'mdi-file-search', component: markRaw(Search) },
      {
        uuid: 'git',
        label: 'Git',
        title: 'Source Control',
        icon: 'mdi-source-branch',
        component: null, // markRaw(SourceControl),
      },
      // { uuid: 'goal', label: 'Goal', title: 'Goal', icon: 'mdi-flag', component: markRaw(GoalPlugin) },
    ] as ActivityBarItem[],
    activeActivityBarItemId: 'explorer',
  }),

  getters: {
    activeActivityBarItem: (state) => {
      const activeActivityBarItem = state.activityBarItems.find(
        (item) => item.uuid === state.activeActivityBarItemId,
      );
      return activeActivityBarItem;
    },
    isSidebarVisible: (state) => !!state.activeActivityBarItemId,
  },

  actions: {
    setActiveActivityBarItemId(uuid: string) {
      // Toggle if clicking the same item
      this.activeActivityBarItemId = this.activeActivityBarItemId === uuid ? '' : uuid;
    },
  },
});
