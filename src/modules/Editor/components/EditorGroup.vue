<template>
<div class="editor-group" :style="{ width: `${groupWidth}px` }" :class="{ 'active': isActive }" @mousedown="handleGroupClick">
        <EditorTabs :tabs="editorTabs" :active-tab-id="activeTabId || ''" @close-tab="closeTab"
            @select-tab="selectTab" />
        <EditorArea v-if="activeTab" :path="activeTab.path" :is-preview="isPreview"/>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorGroupStore } from '../stores/editorGroupStore'
import EditorTabs from './EditorTabs.vue'
import EditorArea from './EditorArea.vue'

const props = defineProps<{
    groupId: string
}>()

const editorGroupStore = useEditorGroupStore()


const group = computed(() =>
    editorGroupStore.editorGroups.find(g => g.uuid === props.groupId)
)
const groupWidth = computed(() => group.value?.width ?? 300)

const isActive = computed(() => editorGroupStore.activeGroupId === props.groupId)
const handleGroupClick = () => {
    editorGroupStore.setActiveGroup(props.groupId)
}

const editorTabs = computed(() => group.value?.tabs || [])
const activeTabId = computed(() => group.value?.activeTabId)
const isPreview = computed(() => activeTab.value?.isPreview || false)
const activeTab = computed(() =>
    editorTabs.value.find(t => t.uuid === activeTabId.value)
)

const closeTab = (tabId: string) => {
    editorGroupStore.closeTab(props.groupId, tabId)
}

const selectTab = (tabId: string) => {
    editorGroupStore.setActiveTab(props.groupId, tabId)
}
</script>

<style scoped>
.editor-group {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 30px 1fr;
    height: 100%;
}

.editor-group-tabs {
    grid-column: 1;
    /* 第二列 */
    grid-row: 1;
    /* 第一行 */
}

.editor-group-area {
    grid-column: 1;
    /* 第二列 */
    grid-row: 2;
    /* 第二行 */
}

.editor-group.active::after {
    background-color: var(--vscode-activityBarBadge-background);
}
</style>