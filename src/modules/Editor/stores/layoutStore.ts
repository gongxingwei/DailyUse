import { defineStore } from 'pinia';

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    isSidebarVisible: true,
    sidebarWidth: 250,
    panelHeight: 200,
    activeEditorTab: 'welcome.md',
    activePanelTab: 'terminal',
  }),
  actions: {
    toggleSidebar() {
      this.isSidebarVisible = !this.isSidebarVisible;
    },
    setPanelHeight(height: number) {
      this.panelHeight = Math.max(100, height);
    },
  },
});