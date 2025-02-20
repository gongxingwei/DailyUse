import { defineStore } from "pinia";
import { useEditorGroupStore } from "./editorGroupStore";

interface EditorFunctionIconState {
    editorFunctionIcons: EditorFunctionIcon[];
    showMenu: boolean;
    menuX: number;
    menuY: number;
  }

interface EditorFunctionIcon {
    id: string;
    title: string;
    icon: string;
    action: () => void;
}

interface MoreFunction {
    id: string;
    label: string;
    title: string;
    action: () => void;
}

export const useEditorFunctionIconStore = defineStore("editorFunctionIcon", {
    state: () => ({
        editorFunctionIcons: [
            {
                id: 'preview',
                title: 'Open Preview to The Side',
                icon: 'mdi-eye',
                action: function () { useEditorFunctionIconStore().handlePreview(); }
            },
            {
                id: 'split-editor',
                title: 'Split Editor Right',
                icon: 'mdi-view-split-vertical',
                action: function () { useEditorFunctionIconStore().handleSplitEditor(); }
            },
        ] as EditorFunctionIcon[],
        moreFunctions: [
            {   id: 'close-all-tabs',
                label: 'Close All Tabs',
                title: 'Close All Tabs',
                action: function () { useEditorFunctionIconStore().closeAllEditors(); } 
            }
        ] as MoreFunction[],
        showMenu: false,
        menuX: 0,
        menuY: 0
    }),

    actions: {
        handlePreview() {
            const editorGroupStore = useEditorGroupStore();
            const currentGroup = editorGroupStore.editorGroups.find(g => g.id === editorGroupStore.activeGroupId);
            const activeTab = currentGroup?.tabs.find(t => t.id === currentGroup.activeTabId);

            if (!activeTab) return;

            if (!activeTab.path.toLowerCase().endsWith('.md')) {
                console.log('Only markdown files can be previewed');
                return;
            }

            // 创建新的预览组
            const previewGroup = editorGroupStore.addEditorGroupPreview();
            if (!previewGroup) return;

            // 创建预览标签页
            editorGroupStore.openFilePreview(activeTab.path, previewGroup.id);
        },

        handleSplitEditor() {
            const editorGroupStore = useEditorGroupStore();
            editorGroupStore.addEditorGroup();
        },


        closeAllEditors() {
            const editorGroupStore = useEditorGroupStore();
            const currentGroup = editorGroupStore.editorGroups.find(g => g.id === editorGroupStore.activeGroupId);
            if (currentGroup) {
                currentGroup.tabs = [];
                currentGroup.activeTabId = '';
                editorGroupStore.removeEditorGroup(currentGroup.id);
            }
            this.showMenu = false;
        },

    }
});