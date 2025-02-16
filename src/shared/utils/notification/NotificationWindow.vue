<template>
  <div class="notification-window" :class="urgency">
    <div class="notification-content">
      <div class="notification-header">
        <img v-if="icon" :src="icon" class="notification-icon" />
        <span class="notification-title">{{ title }}</span>
        <button class="close-btn" @click="close">×</button>
      </div>
      <div class="notification-body">{{ body }}</div>
      <div v-if="actions && actions.length" class="notification-actions">
        <button 
          v-for="action in actions" 
          :key="action.text"
          @click="handleAction({ text: action.text, type: action.type })"
          :class="action.type">
          {{ action.text }}
        </button>
      </div>
    </div>
    <div class="progress-bar" :style="{ width: `${progressWidth}%` }"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

// 从路由参数中获取数据
const route = useRoute();
const title = ref(route.query.title as string);
const body = ref(route.query.body as string);
const icon = ref(route.query.icon as string);
const urgency = ref(route.query.urgency as string);
const id = ref(route.query.id as string);

// 进度条宽度
const progressWidth = ref(100);
let progressInterval: NodeJS.Timeout | null = null;

// 解析 actions 参数
let actions = ref<Array<{ text: string, type: string }>>([]);
if (route.query.actions) {
  try {
    const actionsStr = route.query.actions as string;
    actions.value = JSON.parse(decodeURIComponent(actionsStr));
  } catch (e) {
    console.error('Failed to parse actions:', e);
  }
}

const close = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  if (window.shared?.ipcRenderer) {
    window.shared.ipcRenderer.send('close-notification', id.value);
  }
};

const handleAction = (action: { text: string; type: string }) => {
  const serializedAction = {
    text: action.text,
    type: action.type
  };
  if (window.shared?.ipcRenderer) {
    window.shared.ipcRenderer.send('notification-action', id.value, serializedAction);
  }
};

onMounted(() => {
  console.log('通知窗口已挂载，参数:', {
    title: title.value,
    body: body.value,
    urgency: urgency.value,
    actions: actions.value
  });

  // 如果不是 critical 级别，3秒后自动关闭
  if (urgency.value !== 'critical') {
    // 设置进度条动画
    const DURATION = 3000; // 3秒
    const INTERVAL = 50; // 50毫秒更新一次
    const STEP = (100 * INTERVAL) / DURATION;
    
    progressInterval = setInterval(() => {
      progressWidth.value -= STEP;
      if (progressWidth.value <= 0) {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        close();
      }
    }, INTERVAL);
  }
});

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
});
</script>

<style scoped>

.notification-window {
  width: 100vw;
  height: 100vh;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  animation: slide-in 0.3s ease-out;
}

.notification-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.notification-title {
  flex: 1;
  font-weight: 600;
  font-size: 16px;
}

.notification-body {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  opacity: 0.9;
}

.notification-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-bottom: 8px;
}

/* Update progress bar positioning */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: #1890ff;
  transition: width 0.05s linear;
}

/* Update border styles for different urgency levels */
.notification-window.critical {
  border-top: 4px solid #ff4d4f;
}

.notification-window.normal {
  border-top: 4px solid #1890ff;
}

.notification-window.low {
  border-top: 4px solid #52c41a;
}
.notification-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.notification-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.notification-title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.notification-body {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 8px;
  opacity: 0.9;
}

.notification-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.notification-actions button {
  padding: 4px 12px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.notification-actions button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.notification-actions button.confirm {
  background: #1890ff;
}

.notification-actions button.confirm:hover {
  background: #40a9ff;
}

.notification-actions button.cancel {
  background: rgba(255, 255, 255, 0.1);
}

.notification-actions button.cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

.notification-actions button.action {
  background: #52c41a;
}

.notification-actions button.action:hover {
  background: #73d13d;
}

@keyframes slide-in {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
