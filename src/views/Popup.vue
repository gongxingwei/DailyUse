<template>
  <div class="popup-container" v-if="hasMessages">
    <div v-for="msg in activeMessages" :key="msg.id" class="popup-item">
      <div class="popup-header">
        <h3>{{ msg.title }}</h3>
        <v-btn
          density="compact"
          icon="mdi-close"
          variant="text"
          size="small"
          @click="dismissMessage(msg.id)"
          class="close-btn"
        ></v-btn>
      </div>
      <p class="message-content">{{ msg.message }}</p>
      <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useReminderStore } from '../stores/reminder';

const store = useReminderStore();
const activeMessages = ref([]);
const hasMessages = computed(() => activeMessages.value.length > 0);

// 检查新消息
const checkNewMessages = () => {
  console.log('检查新消息...');
  const unreadMessages = store.messageQueue.filter(msg => !msg.read);
  console.log('获取到未读消息:', unreadMessages);
  
  if (unreadMessages.length > 0) {
    console.log('发现新消息，更新显示');
    // 将新消息添加到活动消息列表
    unreadMessages.forEach(msg => {
      if (!activeMessages.value.some(m => m.id === msg.id)) {
        activeMessages.value.push(msg);
      }
    });
    
    // 通知主进程显示弹窗
    console.log('通知主进程显示弹窗');
    window.electron.ipcRenderer.send('newPopup');
    
    // 标记消息为已读
    unreadMessages.forEach(msg => {
      store.markMessageAsRead(msg.id);
    });
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

// 关闭单条消息
const dismissMessage = (id) => {
  activeMessages.value = activeMessages.value.filter(msg => msg.id !== id);
  // 如果没有活动消息了，可以关闭弹窗
  if (activeMessages.value.length === 0) {
    store.setPopupCreated(false); // 更新弹窗状态
    window.electron.ipcRenderer.send('closePopup');
  }
};

// 监听 store 中的 messageQueue 变化
watch(
  () => store.messageQueue,
  () => {
    console.log('消息队列发生变化，检查新消息');
    checkNewMessages();
  },
  { deep: true }
);

onMounted(() => {
  console.log('Popup 组件加载完成');
  store.setPopupCreated(true); // 设置弹窗已创建
  // 立即检查一次
  checkNewMessages();
});

// 组件卸载时更新状态
onUnmounted(() => {
  store.setPopupCreated(false);
});
</script>

<style scoped>
.popup-container {
  position: fixed;
  right: 20px;
  top: 20px;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popup-item {
  background: rgba(19, 18, 18, 0.9);
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: #ccc;
  position: relative;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.popup-header h3 {
  margin: 0;
  font-size: 1.1em;
}

.message-content {
  margin: 8px 0;
  word-break: break-word;
}

.message-time {
  font-size: 0.8em;
  color: #888;
  text-align: right;
  margin-top: 8px;
}

.close-btn {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}
</style>