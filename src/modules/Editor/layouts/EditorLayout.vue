<template>
    <div class="vs-code-layout">
        <ActivityBar />
        <Sidebar v-if="store.isSidebarVisible" />
        <div class="main-area">
            <EditorTabs />
            <EditorArea />
            <PanelTabs />
        </div>
        <StatusBar />
    </div>
</template>

<script setup>

</script>

<style>
.vs-code-layout {
    display: grid;
    grid-template-columns: auto 250px 1fr;
    /* 活动栏 + 侧边栏 + 主区域 */
    grid-template-rows: 1fr auto;
    /* 主区域 + 状态栏 */
    height: 100vh;
}

.activity-bar {
    grid-area: 1 / 1 / 2 / 2;
}

.sidebar {
    grid-area: 1 / 2 / 2 / 3;
}

.main-area {
    grid-area: 1 / 3 / 2 / 4;
}

.status-bar {
    grid-area: 2 / 1 / 3 / 4;
}
</style>