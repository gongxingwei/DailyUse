<template>
  <div class="editor-header">
    <div class="editor-tabs">
      <div v-for="tab in props.tabs" :key="tab.id"
        :class="{ 'active': tab.id === props.activeTabId }" @click="handleTabClick(tab.id)"
        class="tab">
        <span class="tab-title">{{ tab.title }}</span>
        <button class="function-icon" @click.stop="handleTabClose(tab.id)">×</button>
      </div>
    </div>
    <div class="editor-actions function-group">
      <button 
        v-for="icon in editorFunctionIconStore.editorFunctionIcons" 
        :key="icon.id"
        class="function-icon"
        :title="icon.title"
        @click="icon.action"
      >
        <v-icon>{{ icon.icon }}</v-icon>
      </button>
  </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useEditorLayoutStore } from '../stores/editorLayoutStore';
import { useEditorFunctionIconStore } from '../stores/editorFunctionIconStore';
import type { EditorTab } from '../stores/editorGroupStore';

const props = defineProps<{
  tabs: EditorTab[];
  activeTabId: string | null;
}>()

const emit = defineEmits(['close-tab', 'select-tab'])

const editorLayoutStore = useEditorLayoutStore()
const editorFunctionIconStore = useEditorFunctionIconStore()

const handleTabClick = (tabId: string) => {
  emit('select-tab', tabId)
}

const handleTabClose = (tabId: string) => {
  emit('close-tab', tabId)
}

watch(() => editorLayoutStore.editorTabWidth, (newWidth) => {
  document.documentElement.style.setProperty('--editor-tab-width', `${newWidth}px`)
}, { immediate: true })

</script>

<style scoped>
.editor-header {
  grid-column: 1;
  grid-row: 1;

  display: grid;
  grid-template-rows: 30px;
  grid-template-columns: 1fr auto;
}

.editor-tabs {
  grid-row: 1;
  grid-column: 1;
  /* min-width: 200px; */
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 3px;
    /* Scrollbar thickness */
  }

  &::-webkit-scrollbar-track {
    background: #1e1e1e;
    /* Track color */
  }

  &::-webkit-scrollbar-thumb {
    background: #141414;
    /* Scrollbar handle color */
    border-radius: 3px;
    /* Rounded corners */
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #dd2c2c;
    /* Handle color on hover */
  }

  .button {
    width: 20px;
  }

}

.tab {
  padding: 0 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  width: var(--editor-tab-width);
  border-right: 1px solid var(--vscode-editorGroup-border);
  background-color: var(--vscode-editor-background);
}

.tab.active {
  background-color: var(--vscode-editor-background);
  border-top: 2px solid var(--vscode-activityBarBadge-background);
}

.tab:hover {
  background-color: var(--vscode-list-hoverBackground);
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 5px;
}

.editor-actions {
  grid-row: 1;
  grid-column: 2;
}

.active {
  border-top: 1px solid rgb(105, 105, 177);
}

</style>
