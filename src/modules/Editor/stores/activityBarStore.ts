import { defineStore } from "pinia";
import { Component, markRaw } from "vue";
import FileExplorer from "@/modules/Editor/components/Explorer.vue";
import Search from "@/modules/Editor/components/Search.vue";

import SourceControl from "../components/SourceControl.vue";

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
            { id: 'search', label: 'Search', title: 'Search', icon: 'mdi-file-search', component: markRaw(Search) },
            { id: 'git', label: 'Git', title: 'Source Control', icon: 'mdi-git', component: markRaw(SourceControl) },
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