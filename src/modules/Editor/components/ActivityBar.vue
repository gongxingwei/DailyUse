<template>
    <div class="activity-bar">
      <button 
        v-for="item in items" 
        :key="item.id"
        @click="store.setActiveSidebar(item.id)"
      >
        <i :class="item.icon" />
      </button>
    </div>
  </template>
  
  <script setup>
  import { useLayoutStore } from '@/stores/layoutStore';
  const store = useLayoutStore();
  
  const items = [
    { id: 'explorer', icon: 'mdi-folder' },
    { id: 'search', icon: 'mdi-magnify' },
    { id: 'git', icon: 'mdi-git' },
  ];
  </script>