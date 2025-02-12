import { defineStore } from "pinia";
import { Component, markRaw } from "vue";
import FileExplorer from "@/modules/Editor/components/Explorer.vue";
import Search from "@/modules/Editor/components/Search.vue";
import Git from "@/modules/Editor/components/Git.vue";

interface ActivityBarItem {
    id: string;
    label: string;
    title: string;
    icon: string;
    component: Component;
}

export const useActivityBarStore = defineStore("activityBar", {
    state: () => ({
        activityBarItems: [
            { id: 'explorer', label: 'Explorer', title: 'Folders', icon: 'mdi-file-multiple', component: markRaw(FileExplorer) },
            { id: 'search', label: 'Search', title: 'Search', icon: 'mdi-file-search', component: Search },
            { id: 'git', label: 'Git', title: 'Source Control', icon: 'mdi-git', component: Git },
        ] as ActivityBarItem[],
        activeActivityBarItemId: 'explorer',
    }),

    getters: {
        activeActivityBarItem: (state) => {
            const activeActivityBarItem = state.activityBarItems.find(item => item.id === state.activeActivityBarItemId);
            return activeActivityBarItem;
        },
        isSidebarVisible: (state) => !!state.activeActivityBarItemId
    },

    actions: {
        setActiveActivityBarItemId(id: string) {
            // Toggle if clicking the same item
            this.activeActivityBarItemId = 
                this.activeActivityBarItemId === id ? '' : id;
        },
    },
})