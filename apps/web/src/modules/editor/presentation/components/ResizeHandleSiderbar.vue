<template>
  <div class="resize-handle-siderbar" @mousedown="startResize" />
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useEditorLayoutStore } from '../stores/editorLayoutStore';

const store = useEditorLayoutStore();

const isResizing = ref(false)

const startResize = (_e: MouseEvent) => {
    isResizing.value = true
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    const minWidth = store.minSidebarWidth;
    const newWidth = Math.max(minWidth, e.clientX - 45) 
    
    store.setSidebarWidth(newWidth);
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
}

const stopResize = () => {
    isResizing.value = false
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResize)
}



onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResize)
})


</script>

<style scoped>

.resize-handle-siderbar {
    grid-column: 3;
    grid-row: 1;
    width: 5px;
    cursor: col-resize;
}

.resize-handle-siderbar:hover,
.resize-handle-siderbar:active,
.resize-handle-siderbar.resizing {
    background-color: var(--vscode-scrollbarSlider-hoverBackground, rgba(100, 100, 100, 0.7));
}
</style>
