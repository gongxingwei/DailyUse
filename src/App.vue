<script setup lang="ts">

</script>

<template>
    <router-view></router-view>
</template>

<style scoped>
/* 隐藏默认滚动条 */
::-webkit-scrollbar {
  display: none;
}

/* 或者使用自定义滚动条样式 */
/*
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.3);
}
*/

/* 使用 CSS 隐藏滚动条但保持滚动功能 */
* {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;     /* Firefox */
}
</style>
