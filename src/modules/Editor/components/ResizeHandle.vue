<template>
  <div class="resize-handle" @mousedown="startResize" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useEditorLayoutStore } from '../stores/editorLayoutStore';
import { s } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

const store = useEditorLayoutStore();

const isResizing = ref(false)

const startResize = (e: MouseEvent) => {
    isResizing.value = true
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    const minWidth = store.minSidebarWidth;
    const maxWidth = store.maxSidebarWidth;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - 45)) 
    
    store.setSidebarWidth(newWidth);
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
}

const stopResize = () => {
    isResizing.value = false
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResize)
}

const handleWindowResize = () => {
    store.updateTotalWidth(window.innerWidth)
}

onMounted(() => {
    window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResize)
    window.removeEventListener('resize', handleWindowResize)
})

</script>

<style scoped>

.resize-handle {
    grid-column: 3;
    grid-row: 1;
    cursor: col-resize;
    background-color: transparent;
    position: relative;
    width: 5px;
    z-index: 10;
}

.resize-handle:hover,
.resize-handle:active,
.resize-handle.resizing {
    background-color: var(--vscode-scrollbarSlider-hoverBackground, rgba(100, 100, 100, 0.7));
}

.resize-handle::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: var(--vscode-editorGroup-border, #444);
}

</style>