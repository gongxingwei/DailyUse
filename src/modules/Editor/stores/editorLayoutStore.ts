import { defineStore } from 'pinia';
import { useActivityBarStore } from './activityBarStore';
import { useEditorGroupStore } from './editorGroupStore';


interface EditorLayoutState {
    activityBarWidth: number; //活动栏 固定
    sidebarWidth: number; //侧边栏 调整
    minSidebarWidth: number; //最小侧边栏 固定
    resizeHandleSiderbarWidth: number; // resize条 固定

    minEditorWidth: number; //最小编辑器 固定
    editorTabWidth: number; //编辑器标签宽度 固定
    windowWidth: number; //窗口宽度
    
}

export const useEditorLayoutStore = defineStore('editorLayout', {
    state: (): EditorLayoutState => ({
        activityBarWidth: 45,
        sidebarWidth: 160,
        minSidebarWidth: 0,
        resizeHandleSiderbarWidth: 5, 
        minEditorWidth: 300, 
        editorTabWidth: 150,
        windowWidth: window.innerWidth,
    }),

    getters: {
        effectiveSidebarWidth: (state) => {
            const activityBarStore = useActivityBarStore();
            return activityBarStore.isSidebarVisible ? state.sidebarWidth : 0;
        },
        //编辑器组宽度
        editorGroupsWidth: (state) => {
            const activityBarStore = useActivityBarStore();
            const availableWidth = state.windowWidth - state.activityBarWidth - state.resizeHandleSiderbarWidth;
            const sidebarWidth = activityBarStore.isSidebarVisible ? state.sidebarWidth : 0;
            const remainingWidth = availableWidth - sidebarWidth;
            return remainingWidth;
        },


        

    },

    actions: {
        updateWindowWidth(width: number) {
            this.windowWidth = width;
        },
        setSidebarWidth(width: number) {
            const activityBarStore = useActivityBarStore();
            if (activityBarStore.isSidebarVisible) {
                
                this.sidebarWidth = width;
            }
        },

        distributeEditorGroupWidths(newTotalWidth: number) {
            const editorGroupStore = useEditorGroupStore()
            const groups = editorGroupStore.editorGroups
            
            if (groups.length === 0) return

            // Calculate current total width and get proportions
            const currentTotal = groups.reduce((sum, group) => sum + group.width, 0)
            
            // Calculate new widths based on current proportions
            groups.forEach(group => {
                const proportion = group.width / currentTotal
                const newWidth = Math.floor(newTotalWidth * proportion)
                // Update group width while maintaining minimum width
                group.width = Math.max(newWidth, this.minEditorWidth)
            })

            // Adjust for rounding errors - give remainder to last group
            const actualTotal = groups.reduce((sum, group) => sum + group.width, 0)
            const remainder = newTotalWidth - actualTotal
            if (remainder !== 0 && groups.length > 0) {
                const lastGroup = groups[groups.length - 1]
                lastGroup.width += remainder
            }
        }

    },

    persist: true,
})