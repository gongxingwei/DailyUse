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
}

.tab:hover {
  background-color: rgba(var(--v-theme-surface), 1);
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
  border-top: 1px solid rgb(33, 150, 242);
  background-color: rgb(var(--v-theme-surface));
}

</style>
