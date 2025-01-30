<template>
  <div class="test-container">
    <h2>通知测试</h2>
    
    <div class="button-group">
      <button @click="showSimpleNotification">
        简单通知
      </button>
      
      <button @click="showWarningNotification">
        警告通知
      </button>
      
      <button @click="showCustomNotification">
        自定义通知（带按钮）
      </button>

      <button @click="showMultipleNotifications">
        多个通知
      </button>
    </div>

    <div class="status">
      <h3>通知历史</h3>
      <div v-for="(item, index) in notificationHistory" 
           :key="index" 
           class="history-item">
        <span class="time">{{ item.time }}</span>
        <span class="title">{{ item.title }}</span>
        <span class="type">{{ item.type }}</span>
      </div>
    </div>
  </div>
  <img src="data:image/png;base64,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" alt="test">
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { notification } from '@/utils/notification';

interface NotificationHistoryItem {
  time: string;
  title: string;
  type: string;
}

const notificationHistory = ref<NotificationHistoryItem[]>([]);

const addToHistory = (title: string, type: string) => {
  const time = new Date().toLocaleTimeString();
  notificationHistory.value.unshift({ time, title, type });
};

const showSimpleNotification = async () => {
  console.log('开始显示简单通知...');
  try {
    console.log('调用 notification.showSimple...');
    const id = await notification.showSimple(
      '简单通知', 
      '这是一条基本的通知消息'
    );
    console.log('notification.showSimple 返回的 ID:', id);
    addToHistory('简单通知', `ID: ${id}`);
    console.log('通知历史已更新');
  } catch (error) {
    console.error('显示通知时发生错误:', error);
  }
};

const showWarningNotification = async () => {
  const id = await notification.showWarning(
    '警告通知', 
    '这是一条警告消息，需要你的注意！'
  );
  addToHistory('警告通知', `ID: ${id}`);
};

const showCustomNotification = async () => {
  const id = await notification.show({
    title: '自定义通知',
    body: '这是一条带有自定义按钮的通知',
    urgency: 'normal',
    actions: [
      { text: '确认', type: 'confirm' },
      { text: '取消', type: 'cancel' },
      { text: '稍后提醒', type: 'action' }
    ]
  });
  addToHistory('自定义通知', `ID: ${id}`);
};

const showMultipleNotifications = async () => {
  // 连续发送3条不同的通知
  const id1 = await notification.showSimple('通知 1', '第一条通知消息');
  addToHistory('通知 1', `ID: ${id1}`);
  
  const id2 = await notification.show({
    title: '通知 2',
    body: '第二条通知消息',
    urgency: 'low',
  });
  addToHistory('通知 2', `ID: ${id2}`);
  
  const id3 = await notification.showWarning('通知 3', '第三条警告消息');
  addToHistory('通知 3', `ID: ${id3}`);
};
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #1890ff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #40a9ff;
}

.status {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
}

.history-item {
  display: flex;
  gap: 15px;
  padding: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.time {
  color: #888;
  min-width: 100px;
}

.title {
  font-weight: 500;
  flex: 1;
}

.type {
  color: #1890ff;
}
</style>
