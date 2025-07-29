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
    console.log('Dropped files:', files);

   if (files && files.length > 0) {
       const paths = Array.from(files).map(file => file.path);
       console.log('File paths:', paths);
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