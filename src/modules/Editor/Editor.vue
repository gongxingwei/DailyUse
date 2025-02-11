<template>
    <div class="vs-code-layout">
        <ActivityBar />
        <Sidebar :current-repository="currentRepository?.path" />
        <ResizeHandle />
        <div class="main-area" :class="{ 'sidebar-hidden': !activityBarStore.isSidebarVisible }">
            <EditorTabs />
            <EditorArea />
        </div>
        <StatusBar />
    </div>
</template>

<script setup lang="ts">

import ActivityBar from '@/modules/Editor/components/ActivityBar.vue'
import Sidebar from '@/modules/Editor/components/Sidebar.vue'
import EditorTabs from '@/modules/Editor/components/EditorTabs.vue'
import EditorArea from '@/modules/Editor/components/EditorArea.vue'
// import PanelTabs from '@/modules/Editor/components/PanelTabs.vue'
import StatusBar from '@/modules/Editor/components/StatusBar.vue'
import ResizeHandle from './components/ResizeHandle.vue'
import { useRepositoryStore } from '@/modules/Repository/repository'
import { useEditorLayoutStore } from './stores/editorLayoutStore'
import { useActivityBarStore } from './stores/activityBarStore'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'


const route = useRoute()
const router = useRouter()
const repositoryStore = useRepositoryStore()
const editorLayoutStore = useEditorLayoutStore()
const activityBarStore = useActivityBarStore()

const currentRepository = computed(() => {
    const title = decodeURIComponent(route.params.title as string)
    return repositoryStore.getRepositoryByTitle(title) || null
})
</script>

<style>
:root {
    --sidebar-width: 200px;
}

.vs-code-layout {
    display: grid;
    grid-template-columns: 45px var(--sidebar-width) 5px 1fr;
    grid-template-rows: 1fr 30px;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.activity-bar {
    grid-column: 1;
    /* 总是占据第一列 */
    grid-row: 1;
    /* 占据第一行 */
    overflow: hidden;
}

.sidebar {
    grid-column: 2;
    /* 默认占据第二列 */
    grid-row: 1;
    /* 占据第一行 */
    min-width: 0;
    min-height: 0;
    overflow: auto;
    border: 1px solid #f0ecec;
}

.main-area {
    grid-column: 4;
    grid-row: 1;
    min-width: min(var(--min-editor-width, 300px), 100%);
    overflow: auto;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 30px 1fr 50px;

}





.main-area.sidebar-hidden {
    grid-column: 2 / -1;
    /* 当侧边栏隐藏时扩展到第二列 */
}

.status-bar {
    grid-column: 1 / -1;
    grid-row: 2;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.vs-code-layout.resizing {
    user-select: none;
}

</style>