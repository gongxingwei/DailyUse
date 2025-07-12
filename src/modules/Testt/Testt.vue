<template>
    <div class="drop-zone" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
        <p>拖拽图标到这里添加应用</p>
    </div>
</template>

<script setup lang="ts">
const handleDragOver = (event: DragEvent) => {
    // 可视化反馈（如高亮边框）
    (event.currentTarget as HTMLElement).classList.add('dragover');
};

const handleDrop = async (event: DragEvent) => {
    (event.currentTarget as HTMLElement).classList.remove('dragover');

    // 获取拖拽的文件路径
    const files = event.dataTransfer?.files;
    const paths = Array.from(files || []).map(file => file.path);

    // 使用 window.electronAPI 代替直接的 ipcRenderer
    if (window.electronAPI) {
        try {
            // 发送路径到主进程解析 (需要确保此API在preload中定义)
            // const shortcuts = await window.electronAPI.parseShortcuts(paths);
            
            // 保存并渲染快捷方式
            // if (shortcuts.length > 0) {
            //     // 触发状态管理更新（如 Pinia）
            // }
        } catch (error) {
            console.error('解析快捷方式失败:', error);
        }
    }
};
</script>


<style scoped>
.drop-zone {
    border: 2px dashed #ccc;
    padding: 20px;
    text-align: center;
}

.dragover {
    border-color: #2196f3;
}
</style>