<template>
  <NotificationWindow
    v-if="notificationData"
    v-bind="notificationData"
    @action="handleAction"
    @close="handleClose"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import NotificationWindow from '../components/notification/NotificationWindow.vue';

const route = useRoute();
const notificationData = ref<any>(null);

onMounted(() => {
  // 从URL参数中获取通知数据
  const params = Object.fromEntries(new URLSearchParams(route.query as any));
  notificationData.value = params;
});

const handleAction = (action: any) => {
  window.electron.ipcRenderer.send('notification-action', notificationData.value?.id, action);
};

const handleClose = () => {
  window.electron.ipcRenderer.send('close-notification', notificationData.value?.id);
};
</script>
