import { defineStore } from "pinia";
import { useEditorGroupStore } from "./editorGroupStore";

interface EditorFunctionIcon {
    id: string;
    title: string;
    icon: string;
    action: () => void;
}

export const useEditorFunctionIconStore = defineStore("editorFunctionIcon", {
    // state
    state: () => ({
        editorFunctionIcons: [
            {
                id: 'editView',
                title: 'Edit View',
                icon: 'mdi-pencil',
                action: function () { useEditorFunctionIconStore().handleEditView(); }
            },
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
            {
                id: 'more',
                title: 'More Function',
                icon: 'mdi-dots-horizontal',
                action: function () { useEditorFunctionIconStore().handleMore(); }
            }
        ] as EditorFunctionIcon[]
    }),

    // actions
    actions: {
        handleEditView() {
            console.log('handleEditView');
        },

        handlePreview() {
            const editorGroupStore = useEditorGroupStore();
            const currentGroup = editorGroupStore.editorGroups.find(g => g.id === editorGroupStore.activeGroupId);
            const activeTab = currentGroup?.tabs.find(t => t.id === currentGroup.activeTabId);

            if (!activeTab) return;

            // 只处理 markdown 文件
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

        handleMore() {
            console.log('handleMore');
        }
    }
});