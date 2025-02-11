import { defineStore } from "pinia";

interface EditorTab {
    id: string;
    title: string;
    content: string;
    path?: string;
}

export const useEditorTabStore = defineStore("editorTab", {
    state: () => ({
        tabs: [ { id: 'welcome', title: 'Welcome', content: 'welcome'} ] as EditorTab[],
        activeTabId: 'welcome',
    }),

    getters: {
    },

    actions: {
        addTab(tab: EditorTab) {
            this.tabs.push(tab);
            this.activeTabId = tab.id;
        },

        closeTab(id: string) {
            const tabIndex = this.tabs.findIndex(tab => tab.id === id);
            this.tabs.splice(tabIndex, 1);
            this.activeTabId = this.tabs[tabIndex - 1]?.id || 'welcome';
        }


    },
})