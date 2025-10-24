<template>
  <div :class="isSidebarVisible ? 'editor-layout' : 'editor-layout-sidebar-hidden'">
    <ActivityBar />
    <Sidebar :current-repository="currentRepository?.path" />
    <ResizeHandleSiderbar :class="{ 'sidebar-hidden': !isSidebarVisible }" />
    <div class="editor-groups" :class="{ 'sidebar-hidden': !isSidebarVisible }">
      <template
        v-for="(group, index) in editorGroupStore.editorGroups"
        :key="`group-${group.uuid}`"
      >
        <EditorGroup
          :group-id="group.uuid"
          :class="{ active: group.uuid === editorGroupStore.activeGroupId }"
        />
        <!-- 在非最后一个编辑器组后添加 ResizeHandle -->
        <ResizeHandle
          v-if="index < editorGroupStore.editorGroups.length - 1"
          :key="`resize-${group.uuid}`"
          type="editor-editor"
          :group-id="group.uuid"
          class="editor-resize-handle"
        />
      </template>
    </div>
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import ActivityBar from '@renderer/modules/Editor/components/ActivityBar.vue';
import Sidebar from '@renderer/modules/Editor/components/Sidebar.vue';
// import PanelTabs from '@renderer/modules/Editor/components/PanelTabs.vue'
import StatusBar from '@renderer/modules/Editor/components/StatusBar.vue';
import ResizeHandle from './components/ResizeHandle.vue';
import { useRepositoryStore } from '@renderer/modules/Repository/presentation/stores/repositoryStore';
import { useActivityBarStore } from './stores/activityBarStore';
import { useEditorGroupStore } from './stores/editorGroupStore';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import EditorGroup from './components/EditorGroup.vue';
import ResizeHandleSiderbar from './components/ResizeHandleSiderbar.vue';
import { useEditorLayoutStore } from './stores/editorLayoutStore';
import { watch, onMounted, onUnmounted } from 'vue';

const route = useRoute();
const repositoryStore = useRepositoryStore();
const activityBarStore = useActivityBarStore();
const editorGroupStore = useEditorGroupStore();
const editorLayoutStore = useEditorLayoutStore();

const currentRepository = computed(() => {
  const name = decodeURIComponent(route.params.title as string);
  return repositoryStore.getRepositoryByName(name) || null;
});

const isSidebarVisible = computed(() => activityBarStore.isSidebarVisible);

const updateWindowWidth = () => {
  editorLayoutStore.updateWindowWidth(window.innerWidth);
};
watch(
  () => editorLayoutStore.sidebarWidth,
  (newWidth) => {
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
  },
);
// 监听 editorGroupStore 中计算出的 编辑器总区域的大小 变化，并更新 每一个编辑器 的宽度
watch(
  () => editorLayoutStore.editorGroupsWidth,
  (newWidth) => {
    editorLayoutStore.distributeEditorGroupWidths(newWidth);
  },
  { immediate: true },
);

onMounted(() => {
  // 立即设置初始宽度
  document.documentElement.style.setProperty(
    '--sidebar-width',
    `${editorLayoutStore.effectiveSidebarWidth}px`,
  );
  window.addEventListener('resize', updateWindowWidth);
  editorLayoutStore.distributeEditorGroupWidths(window.innerWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth);
});
</script>

<style>
.editor-layout {
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
}
.resize-handle-siderbar {
  grid-column: 3;
  grid-row: 1;
  transition: grid-column 0.2s;
}
.editor-groups {
  grid-column: 4;
  grid-row: 1;
  display: flex; /* 改用 flex 布局 */
  overflow: hidden;
  min-width: 0;
}
.status-bar {
  grid-column: 1 / -1;
  grid-row: 2;
  overflow: hidden;
}
.editor-layout.resizing {
  user-select: none;
}
/* sidebar 隐藏时的布局 */
.editor-layout-sidebar-hidden {
  display: grid;
  grid-template-columns: 45px 5px 1fr;
  grid-template-rows: 1fr 30px;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.resize-handle-siderbar.sidebar-hidden {
  grid-column: 2; /* Move to column 2 when sidebar is hidden */
}

.editor-groups.sidebar-hidden {
  grid-column: 3;
  /* 当侧边栏隐藏时扩展到第二列 */
}
</style>
