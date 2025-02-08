<template>
    <div class="editor-tabs">
      <div 
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ 'active': tab.id === store.activeEditorTab }"
        @click="store.activeEditorTab = tab.id"
      >
        {{ tab.name }}
        <button @click.stop="closeTab(tab.id)">×</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useLayoutStore } from '@/stores/layoutStore';
  const store = useLayoutStore();
  
  const tabs = [
    { id: 'welcome.md', name: 'Welcome.md' },
    { id: 'app.vue', name: 'App.vue' },
  ];
  
  const closeTab = (tabId) => {
    // 关闭标签逻辑
  };
  </script>