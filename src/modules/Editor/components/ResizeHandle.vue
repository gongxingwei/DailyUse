<template>
    <div 
        class="resize-handle" 
        :class="{ 'resizing': isResizing }" 
        @mousedown="startResize" 
    />
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useEditorGroupStore } from '../stores/editorGroupStore'

const props = defineProps<{
    groupId: string  // 当前组的ID
}>()

const editorGroupStore = useEditorGroupStore()
const isResizing = ref(false)
const startX = ref(0)
const initialLeftWidth = ref(0)
const initialRightWidth = ref(0)

const startResize = (e: MouseEvent) => {
    e.preventDefault()
    
    // 获取当前组和下一个组
    const currentIndex = editorGroupStore.editorGroups.findIndex(g => g.id === props.groupId)
    const nextGroup = editorGroupStore.editorGroups[currentIndex + 1]
    if (!nextGroup) return

    isResizing.value = true
    startX.value = e.clientX
    initialLeftWidth.value = editorGroupStore.getGroupWidth(props.groupId)
    initialRightWidth.value = editorGroupStore.getGroupWidth(nextGroup.id)
    console.log('startResize', initialLeftWidth.value, initialRightWidth.value)
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    
    const deltaX = e.clientX - startX.value
    const currentIndex = editorGroupStore.editorGroups.findIndex(g => g.id === props.groupId)
    const nextGroup = editorGroupStore.editorGroups[currentIndex + 1]
    if (!nextGroup) return

    // 计算新的宽度，确保不小于最小宽度
    const minWidth = 200
    const newLeftWidth = Math.max(minWidth, initialLeftWidth.value + deltaX)
    const newRightWidth = Math.max(minWidth, initialRightWidth.value - deltaX)
    
    // 检查总宽度约束
    if (newLeftWidth + newRightWidth === initialLeftWidth.value + initialRightWidth.value) {
        editorGroupStore.setGroupWidth(props.groupId, newLeftWidth)
        editorGroupStore.setGroupWidth(nextGroup.id, newRightWidth)
    }
}

const stopResize = () => {
    isResizing.value = false
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
    if (isResizing.value) {
        stopResize()
    }
})
</script>

<style scoped>
.resize-handle {
    width: 5px;
    height: 100%;
    cursor: col-resize;
    background-color: transparent;
    transition: background-color 0.1s;
}

.resize-handle:hover,
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