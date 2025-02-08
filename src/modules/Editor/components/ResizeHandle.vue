<template>
    <div 
      class="resize-handle"
      @mousedown="startDragging"
    />
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useLayoutStore } from '@/stores/layoutStore';
  
  const store = useLayoutStore();
  const isDragging = ref(false);
  
  const startDragging = (e) => {
    isDragging.value = true;
    const startY = e.clientY;
    
    const onMouseMove = (e) => {
      const delta = startY - e.clientY;
      store.setPanelHeight(store.panelHeight + delta);
      startY = e.clientY;
    };
  
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      isDragging.value = false;
    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  </script>