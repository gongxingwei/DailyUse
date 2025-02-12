import { defineStore } from 'pinia';

interface EditorLayoutState {
    activityBarWidth: number;
    sidebarWidth: number;
    minSidebarWidth: number;
    resizeHandleWidth: number;

    minEditorWidth: number;
    totalWidth: number;

    editorTabWidth: number;
    
}

export const useEditorLayoutStore = defineStore('editorLayout', {
    state: (): EditorLayoutState => ({
        activityBarWidth: 45,
        sidebarWidth: 200,
        minSidebarWidth: 200,
        resizeHandleWidth: 5, 
        minEditorWidth: 300, 
        totalWidth: window.innerWidth,

        editorTabWidth: 150,

    }),

    getters: {
        editorGroupsWidth: (state) => {
            const availableWidth = state.totalWidth - state.activityBarWidth - state.resizeHandleWidth;
            const remainingWidth = availableWidth - state.sidebarWidth;
            return Math.max(remainingWidth, state.minEditorWidth);
        },

        maxSidebarWidth: (state) => {
            const availableWidth = state.totalWidth - state.activityBarWidth - state.resizeHandleWidth;
            return availableWidth - state.minEditorWidth;
        }

    },

    actions: {
        setSidebarWidth(width: number) {
            // Ensure sidebar width doesn't make editor smaller than minimum
            const maxWidth = this.maxSidebarWidth;
            this.sidebarWidth = Math.min(width, maxWidth);
        },

        updateTotalWidth(width: number) {
            this.totalWidth = width;
            // Adjust sidebar width if necessary when window resizes
            if (this.sidebarWidth > this.maxSidebarWidth) {
                this.sidebarWidth = this.maxSidebarWidth;
            }
        }
    },

    persist: true,
})